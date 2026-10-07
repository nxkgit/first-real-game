import type { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import type { CardInstance } from '../game/types';
import { EMPOWERED_DAMAGE_MULT, HAND_SIZE } from '../data/tunables';
import { playBotTurn } from './bot';
import { reconstruct } from './fightCore';
import { smartChoices, threat } from './smart';
import type { Choice } from './smart';
import type { Action, FightSpec, RngStart } from './fightCore';

/**
 * Bot skill levels. Balance must be judged against the range, because a real player sits between
 * them: better than `random` and `greedy`, probably not as consistent as `expert`.
 *
 *  - random: plays uniformly random legal cards until nothing is playable. The floor.
 *  - greedy: the original bot (bot.ts): scores each card in isolation.
 *  - smart: sequences a turn deliberately. Takes lethal, sets up (powers, draw, self-buffs, any
 *    effect kind it does not recognise) before payoffs, debuffs before hits, blocks when the
 *    incoming damage matters (hard when it is lethal) and not otherwise, and aims at the enemy it
 *    can kill, else the most dangerous one. Pure heuristics: fast.
 *  - expert: smart's ideas plus lookahead. For each candidate play it rebuilds the fight by
 *    replaying history, finishes the turn and plays the next one with `smart`, and keeps the play
 *    that leaves the best position. It judges plays by what actually happens, so it handles new
 *    effect kinds and card interactions that smart's heuristics know nothing about. Slower.
 *
 * Every bot is deterministic given the fight's seed. None peeks at hidden information: lookahead
 * reshuffles the draw pile (see reconstruct()).
 */
export type SkillLevel = 'random' | 'greedy' | 'smart' | 'expert';
export const SKILL_LEVELS: readonly SkillLevel[] = ['random', 'greedy', 'smart', 'expert'];
/** What experiments use unless told otherwise (expert is opt-in: it is several times slower). */
export const DEFAULT_SKILLS: readonly SkillLevel[] = ['random', 'greedy', 'smart'];

export function parseSkills(text: string | undefined): SkillLevel[] {
  if (text === undefined || text === 'default') return [...DEFAULT_SKILLS];
  if (text === 'all') return [...SKILL_LEVELS];
  const out = text.split(',').map((s) => s.trim());
  for (const s of out) if (!SKILL_LEVELS.includes(s as SkillLevel)) throw new Error(`unknown skill "${s}" (use ${SKILL_LEVELS.join(', ')}, all)`);
  return out as SkillLevel[];
}

/** What a bot sees and does: the live fight, plus what it needs to rebuild it. */
export interface FightContext {
  combat: CombatState;
  spec: FightSpec;
  start: RngStart;
  /** Every action taken so far, in order (kept by `play` and `endTurn` below). */
  history: Action[];
  /** The bot's own random stream: separate from the fight's, so a bot's choices never change the shuffles. */
  rng: Rng;
}

export interface Bot {
  /** Plays one player turn, not including ending it. */
  playTurn(ctx: FightContext): void;
}

/** Plays a card in the live fight and records it. */
export function play(ctx: FightContext, card: CardInstance, targetId?: string): boolean {
  const hand = ctx.combat.deck.hand.indexOf(card);
  if (hand < 0 || !ctx.combat.playCard(card.instanceId, targetId)) return false;
  ctx.history.push({ kind: 'play', hand, target: targetId === undefined ? undefined : Number(targetId.slice('enemy-'.length)) });
  return true;
}

export function endTurn(ctx: FightContext): void {
  ctx.history.push({ kind: 'end' });
  ctx.combat.endPlayerTurn();
}

// ---------- random ----------

const randomBot: Bot = {
  playTurn(ctx) {
    const { combat, rng } = ctx;
    for (let guard = 0; guard < 60 && combat.phase === 'playerTurn'; guard++) {
      const options = combat.deck.hand.filter((c) => combat.canPlay(c));
      if (options.length === 0) return;
      const card = options[Math.floor(rng.next() * options.length)];
      let targetId: string | undefined;
      if (card.definition.target) {
        const living = combat.livingEnemies;
        targetId = living[Math.floor(rng.next() * living.length)].id;
      }
      if (!play(ctx, card, targetId)) return;
    }
  },
};

// ---------- greedy (the original bot) ----------

const greedyBot: Bot = {
  playTurn(ctx) {
    playBotTurn(ctx.combat, (card, targetId) => play(ctx, card, targetId));
  },
};

// ---------- smart: heuristic sequencing ----------

export { smartChoices } from './smart';
export type { Choice } from './smart';

/** One smart turn, played straight onto `combat` (no recording): used by the bot and by rollouts. */
function playSmartTurn(combat: CombatState, playCardFn: (card: CardInstance, targetId?: string) => boolean): void {
  for (let guard = 0; guard < 60 && combat.phase === 'playerTurn'; guard++) {
    const best = smartChoices(combat)[0];
    if (!best || !playCardFn(best.card, best.targetId)) return;
  }
}

const smartBot: Bot = {
  playTurn(ctx) {
    playSmartTurn(ctx.combat, (card, targetId) => play(ctx, card, targetId));
  },
};

// ---------- expert: lookahead by replay ----------

/** How many candidate plays get a rollout per decision (the best-scored by smart's ordering). */
export const EXPERT_CANDIDATES = 6;
/** Turns each rollout covers: the rest of this turn, then this many minus one further turns. */
export const EXPERT_HORIZON = 2;
/** How much better (HP-equivalents) a play must look than smart's pick to replace it. */
export const EXPERT_MARGIN = 0.75;

/** Average damage per turn the deck can output, from the cards it holds (all piles are public information). */
function outputGuess(combat: CombatState): number {
  const cards = [...combat.deck.hand, ...combat.deck.drawPile, ...combat.deck.discardPile];
  if (cards.length === 0) return 10;
  let damage = 0;
  for (const c of cards) damage += (c.definition.effects ?? []).filter((e) => e.kind === 'damage').reduce((n, e) => n + e.value, 0);
  const perCard = damage / cards.length;
  return Math.max(6, perCard * Math.min(HAND_SIZE, cards.length) * 0.7);
}

/** Scales the stored-value term of evaluate() (0 switches it off). PROVISIONAL: a bot-tuning knob, not a game number. */
export const STORED_VALUE_WEIGHT = 1;
/** How many further turns the player's Strength is assumed to keep paying out. */
export const STORED_HORIZON = 3;

/**
 * What the player is HOLDING that HP and enemy HP do not show: Strength (extra damage on every hit
 * for the rest of the fight) and Empowered (the next attacks do more). Converted to HP-equivalents
 * through what one point of enemy HP is worth right now (`costPerHp`), so a Strength engine is
 * worth more against a big, dangerous enemy than a small one. Public state only.
 */
export function storedValue(combat: CombatState, costPerHp: number): number {
  const cards = [...combat.deck.hand, ...combat.deck.drawPile, ...combat.deck.discardPile];
  if (cards.length === 0 || costPerHp <= 0) return 0;
  let hits = 0;
  let damage = 0;
  for (const c of cards) {
    for (const e of c.definition.effects ?? []) {
      if (e.kind === 'damage') {
        hits++;
        damage += e.value;
      }
    }
  }
  if (hits === 0) return 0;
  const hitsPerTurn = (hits / cards.length) * Math.min(HAND_SIZE, cards.length) * 0.7;
  const avgHit = damage / hits;
  const strength = Math.max(0, combat.player.statuses.strength ?? 0);
  const empowered = Math.max(0, combat.player.statuses.empowered ?? 0);
  const extra = strength * hitsPerTurn * STORED_HORIZON + empowered * avgHit * (EMPOWERED_DAMAGE_MULT - 1);
  return STORED_VALUE_WEIGHT * extra * costPerHp;
}

/**
 * How good a position is, in HP-equivalents: the player's HP, minus what the living enemies are
 * still going to cost (their HP, converted to turns of fighting at our damage rate, times the
 * damage they deal per turn). Wins and losses dominate everything.
 */
export function evaluate(combat: CombatState): number {
  const living = combat.livingEnemies;
  const out = outputGuess(combat);
  let cost = 0;
  for (const e of living) {
    const mult = combat.calcDamage(10, combat.player, e) / 10;
    cost += (e.hp * (threat(combat, e) + 2)) / Math.max(1, out * Math.max(0.3, mult));
  }
  if (combat.phase === 'won') return 1000 + combat.player.hp - combat.turnNumber * 0.1;
  if (combat.phase === 'lost') return -1000 - cost;
  const totalHp = living.reduce((n, e) => n + e.hp, 0);
  return combat.player.hp - cost + storedValue(combat, totalHp > 0 ? cost / totalHp : 0);
}

function rollout(combat: CombatState, turns: number): number {
  for (let t = 0; t < turns && combat.phase === 'playerTurn'; t++) {
    playSmartTurn(combat, (card, targetId) => combat.playCard(card.instanceId, targetId));
    if (combat.phase === 'playerTurn') combat.endPlayerTurn();
  }
  return evaluate(combat);
}

const expertBot: Bot = {
  playTurn(ctx) {
    for (let guard = 0; guard < 60 && ctx.combat.phase === 'playerTurn'; guard++) {
      const seen = new Set<string>();
      const candidates: Choice[] = [];
      for (const choice of smartChoices(ctx.combat)) {
        const key = `${choice.card.definition.id}@${choice.targetId ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(choice);
        if (candidates.length >= EXPERT_CANDIDATES) break;
      }
      // the same hypothetical shuffles for every candidate at this decision: a fair comparison
      const hypo = (ctx.start.seed ^ Math.imul(ctx.history.length + 1, 0x9e3779b1)) >>> 0;

      // smart's own first pick is the default: another play, or ending the turn, must beat it by a margin
      // (the rollouts are noisy; without a margin the lookahead talks itself out of good plays)
      let bestValue = -Infinity;
      let bestChoice: Choice | undefined;
      for (const choice of candidates) {
        const state = reconstruct(ctx.spec, ctx.start, ctx.history, hypo);
        const card = state.deck.hand[ctx.combat.deck.hand.indexOf(choice.card)];
        if (!card || !state.playCard(card.instanceId, choice.targetId)) continue;
        const value = rollout(state, EXPERT_HORIZON);
        if (bestChoice === undefined || value > bestValue + EXPERT_MARGIN) {
          bestValue = value;
          bestChoice = choice;
        }
      }
      const endState = reconstruct(ctx.spec, ctx.start, ctx.history, hypo);
      endState.endPlayerTurn();
      if (bestChoice !== undefined && rollout(endState, EXPERT_HORIZON - 1) > bestValue + EXPERT_MARGIN) bestChoice = undefined;
      if (!bestChoice) return;
      if (!play(ctx, bestChoice.card, bestChoice.targetId)) return;
    }
  },
};

export const BOTS: Readonly<Record<SkillLevel, Bot>> = {
  random: randomBot,
  greedy: greedyBot,
  smart: smartBot,
  expert: expertBot,
};
