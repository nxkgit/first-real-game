import type { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import type { CardInstance, EnemyState } from '../game/types';
import { HAND_SIZE } from '../data/tunables';
import { playBotTurn } from './bot';
import { reconstruct } from './fightCore';
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

const KNOWN_KINDS = new Set(['damage', 'block', 'draw', 'applyStatus']);

interface Profile {
  damage: number;
  block: number;
  draws: boolean;
  debuff: boolean;
  selfBuff: boolean;
  /** Any effect kind this bot has no heuristic for (energy gain, scaling, ...): treated as setup. */
  other: boolean;
  power: boolean;
}

function profileOf(card: CardInstance): Profile {
  const def = card.definition;
  const effects = def.effects ?? [];
  const p: Profile = { damage: 0, block: 0, draws: false, debuff: false, selfBuff: false, other: false, power: def.type === 'power' || def.onTurnStartEffect !== undefined };
  for (const e of effects) {
    if (e.kind === 'damage') p.damage += e.value;
    else if (e.kind === 'block') p.block += e.value;
    else if (e.kind === 'draw') p.draws = true;
    else if (e.kind === 'applyStatus') {
      if (e.to === 'self') p.selfBuff = true;
      else p.debuff = true;
    }
    if (!KNOWN_KINDS.has(e.kind)) p.other = true;
  }
  return p;
}

/** Damage per hit the enemy's pattern deals on average per turn, with its current statuses. */
function threat(combat: CombatState, enemy: EnemyState): number {
  const pattern = enemy.definition.movePattern;
  let total = 0;
  for (const move of pattern) {
    for (const e of move.effects) if (e.kind === 'damage') total += combat.calcDamage(e.value, enemy, combat.player);
  }
  return total / Math.max(1, pattern.length);
}

function incomingNow(combat: CombatState): number {
  return combat.livingEnemies.reduce((sum, e) => sum + (combat.intentDamage(e) ?? 0), 0);
}

/** Every card the hand can play right now, each with its best target and a priority (higher first). */
export interface Choice {
  card: CardInstance;
  targetId?: string;
  score: number;
}

export function smartChoices(combat: CombatState): Choice[] {
  const living = combat.livingEnemies;
  if (living.length === 0) return [];
  const player = combat.player;
  const incoming = incomingNow(combat);
  const needBlock = Math.max(0, incoming - player.block);
  const facingLethal = needBlock >= player.hp;
  const totalEnemyHp = living.reduce((n, e) => n + e.hp, 0);
  const threats = new Map(living.map((e) => [e.id, threat(combat, e)]));
  const choices: Choice[] = [];

  for (const card of combat.deck.hand) {
    if (!combat.canPlay(card)) continue;
    const def = card.definition;
    const p = profileOf(card);
    const aimed = def.target === 'enemy';
    const hits = (def.effects ?? []).filter((e) => e.kind === 'damage');
    const dealt = (e: EnemyState): number => hits.reduce((n, h) => n + combat.calcDamage(h.value, combat.player, e), 0);
    const effective = (e: EnemyState): number => Math.min(dealt(e), e.hp + e.block);

    let target: EnemyState | undefined;
    if (aimed) {
      if (p.damage > 0) {
        const killable = living.filter((e) => dealt(e) >= e.hp + e.block);
        const pool = killable.length > 0 ? killable : living;
        const rank = (e: EnemyState): number => (killable.length > 0 ? (threats.get(e.id) ?? 0) : (threats.get(e.id) ?? 0) / (e.hp + e.block + 1));
        target = pool.reduce((best, e) => (rank(e) > rank(best) || (rank(e) === rank(best) && e.hp < best.hp) ? e : best), pool[0]);
      } else {
        const rank = (e: EnemyState): number => (threats.get(e.id) ?? 0) + (e.hp + e.block) / 10;
        target = living.reduce((best, e) => (rank(e) > rank(best) ? e : best), living[0]);
      }
    }

    const cost = def.cost + 0.5;
    const blockUseful = Math.min(p.block, needBlock) * (facingLethal ? 6 : 1.2);
    const latePhase = totalEnemyHp <= 12;
    let score: number;
    if (aimed && target && p.damage > 0 && dealt(target) >= target.hp + target.block) {
      score = 1000 + (threats.get(target.id) ?? 0) * 3 + effective(target) - def.cost;
    } else if (p.power) {
      score = latePhase ? 90 : 300;
    } else if (p.damage === 0 && p.block === 0 && (p.draws || p.selfBuff || p.other)) {
      score = latePhase ? 90 : p.selfBuff ? 280 : p.draws ? 260 : 250;
    } else if (p.damage === 0 && p.block === 0 && p.debuff) {
      score = target && target.hp + target.block > 14 ? 200 : 60;
    } else if (p.damage > 0 && target) {
      score = 100 + (effective(target) + blockUseful) / cost + (p.debuff && target.hp > 14 ? 30 : 0) + (p.draws || p.selfBuff ? 20 : 0);
    } else if (p.block > 0) {
      score = needBlock > 0 ? 100 + blockUseful / cost : 5;
    } else {
      score = 1;
    }
    choices.push({ card, targetId: target?.id, score: score - def.cost * 0.01 });
  }
  return choices.sort((a, b) => b.score - a.score);
}

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

/** Average damage per turn the deck can output, from the cards it holds (all piles are public information). */
function outputGuess(combat: CombatState): number {
  const cards = [...combat.deck.hand, ...combat.deck.drawPile, ...combat.deck.discardPile];
  if (cards.length === 0) return 10;
  let damage = 0;
  for (const c of cards) damage += (c.definition.effects ?? []).filter((e) => e.kind === 'damage').reduce((n, e) => n + e.value, 0);
  const perCard = damage / cards.length;
  return Math.max(6, perCard * Math.min(HAND_SIZE, cards.length) * 0.7);
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
  return combat.player.hp - cost;
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

      let bestValue = -Infinity;
      let bestChoice: Choice | undefined; // undefined = end the turn
      const endState = reconstruct(ctx.spec, ctx.start, ctx.history, hypo);
      endState.endPlayerTurn();
      const endValue = rollout(endState, EXPERT_HORIZON - 1);
      bestValue = endValue;
      for (const choice of candidates) {
        const state = reconstruct(ctx.spec, ctx.start, ctx.history, hypo);
        const card = state.deck.hand[ctx.combat.deck.hand.indexOf(choice.card)];
        if (!card || !state.playCard(card.instanceId, choice.targetId)) continue;
        const value = rollout(state, EXPERT_HORIZON);
        // ties go to the earlier (smart-preferred) play; ending the turn must be strictly better to win
        if (value > bestValue + 1e-9) {
          bestValue = value;
          bestChoice = choice;
        }
      }
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
