import type { CombatState } from '../game/CombatState';
import type { CardDefinition, CardInstance, Effect, EnemyState, Scaling } from '../game/types';
import { MAX_HAND_SIZE } from '../data/tunables';

/**
 * The `smart` bot's brain: a per-step ranking of every playable card (`smartChoices`), played
 * best-first until nothing is left. Pure heuristics over CombatState's PUBLIC API (hand, piles,
 * stats, statuses, calcDamage, intentDamage), so it keeps working when effect handling is refactored.
 *
 * Ideas it implements (see docs/BALANCE.md, "smart"):
 *  - lethal first (scaling and Empowered included in the damage preview);
 *  - energy gain before spending (Cull-style cards are gated on actually needing the energy, since
 *    they exhaust a random card);
 *  - setup before payoffs: powers, draw, Empowered grants, strength doublers (only once there is
 *    something to double), enablers (tagged cards, exhausters, Vulnerable appliers, block givers);
 *  - payoffs whose damage grows with something the turn can still add are DEFERRED behind the cards
 *    that grow it, while energy is reserved for them;
 *  - while Empowered is active the biggest hit takes it; weaker hits wait;
 *  - one-shot (exhaust) attacks are not wasted on overkill; self-damage is never taken into lethal.
 * Anything it has no rule for is "setup", as before.
 */

const KNOWN_KINDS = new Set(['damage', 'block', 'draw', 'applyStatus', 'gainEnergy', 'loseHp', 'multiplyStatus', 'exhaustRandom']);

/** Scaling sources a payoff can grow by playing other cards this turn. */
const GROWING: ReadonlySet<string> = new Set(['cardsPlayedThisTurn', 'attacksPlayedThisTurn', 'taggedPlayedThisTurn', 'block', 'strength', 'exhaustedThisCombat', 'targetVulnerable']);

interface Profile {
  /** Sum of the static damage values (what the original profile counted). */
  damage: number;
  hasDamage: boolean;
  block: number;
  draws: boolean;
  drawValue: number;
  debuff: boolean;
  selfBuff: boolean;
  /** Any effect kind this bot has no heuristic for: treated as setup. */
  other: boolean;
  power: boolean;
  energyGain: number;
  loseHp: number;
  exhaustRandom: number;
  exhaustsSelf: boolean;
  grantsEmpowered: boolean;
  multipliesStrength: boolean;
  appliesVulnerable: boolean;
  givesStrength: boolean;
  scalings: Scaling[];
}

function profileOf(card: CardInstance): Profile {
  const def = card.definition;
  const effects = def.effects ?? [];
  const p: Profile = {
    damage: 0,
    hasDamage: false,
    block: 0,
    draws: false,
    drawValue: 0,
    debuff: false,
    selfBuff: false,
    other: false,
    power: def.type === 'power' || def.onTurnStartEffect !== undefined,
    energyGain: 0,
    loseHp: 0,
    exhaustRandom: 0,
    exhaustsSelf: def.exhaust === true,
    grantsEmpowered: false,
    multipliesStrength: false,
    appliesVulnerable: false,
    givesStrength: false,
    scalings: [],
  };
  for (const e of effects) {
    if ('scaling' in e && e.scaling) p.scalings.push(e.scaling);
    if (e.kind === 'damage') {
      p.damage += e.value;
      p.hasDamage = true;
    } else if (e.kind === 'block') p.block += e.value;
    else if (e.kind === 'draw') {
      p.draws = true;
      p.drawValue += e.value;
    } else if (e.kind === 'applyStatus') {
      if (e.to === 'self') {
        p.selfBuff = true;
        if (e.status === 'empowered') p.grantsEmpowered = true;
        if (e.status === 'strength') p.givesStrength = true;
      } else {
        p.debuff = true;
        if (e.status === 'vulnerable') p.appliesVulnerable = true;
      }
    } else if (e.kind === 'gainEnergy') p.energyGain += e.value;
    else if (e.kind === 'loseHp') p.loseHp += e.value;
    else if (e.kind === 'exhaustRandom') p.exhaustRandom += e.value;
    else if (e.kind === 'multiplyStatus' && e.status === 'strength') {
      p.multipliesStrength = true;
      p.selfBuff = true;
    }
    if (!KNOWN_KINDS.has(e.kind)) p.other = true;
  }
  return p;
}

/** Damage per hit the enemy's pattern deals on average per turn, with its current statuses. */
export function threat(combat: CombatState, enemy: EnemyState): number {
  const pattern = enemy.definition.movePattern;
  let total = 0;
  for (const move of pattern) {
    for (const e of move.effects) if (e.kind === 'damage') total += combat.calcDamage(e.value, enemy, combat.player);
  }
  return total / Math.max(1, pattern.length);
}

export function incomingNow(combat: CombatState): number {
  return combat.livingEnemies.reduce((sum, e) => sum + (combat.intentDamage(e) ?? 0), 0);
}

/** Every card the hand can play right now, each with its best target and a priority (higher first). */
export interface Choice {
  card: CardInstance;
  targetId?: string;
  score: number;
}

/** What a scaling source reads right now, for an effect resolving as `leaving` leaves the hand. */
function countFor(combat: CombatState, s: Scaling, target: EnemyState | undefined): number {
  const st = combat.stats;
  switch (s.per) {
    case 'cardsPlayedThisTurn':
      return st.cardsPlayedThisTurn;
    case 'attacksPlayedThisTurn':
      return st.attacksPlayedThisTurn;
    case 'taggedPlayedThisTurn':
      return st.taggedPlayedThisTurn[s.tag ?? ''] ?? 0;
    case 'block':
      return combat.player.block;
    case 'strength':
      return combat.player.statuses.strength ?? 0;
    case 'handSize':
      return Math.max(0, combat.deck.hand.length - 1); // the card being played has left the hand
    case 'exhaustedThisCombat':
      return st.exhaustedThisCombat;
    case 'targetVulnerable':
      return target?.statuses.vulnerable ?? 0;
    default:
      return 0;
  }
}

function previewValue(combat: CombatState, e: { value: number; scaling?: Scaling }, target: EnemyState | undefined): number {
  if (!e.scaling) return e.value;
  return Math.max(0, e.value + e.scaling.value * countFor(combat, e.scaling, target));
}

/** Does playing `x` raise the count that `s` reads? */
function enables(x: CardDefinition, s: Scaling): boolean {
  switch (s.per) {
    case 'cardsPlayedThisTurn':
      return true;
    case 'attacksPlayedThisTurn':
      return x.type === 'attack';
    case 'taggedPlayedThisTurn':
      return (x.tags ?? []).includes(s.tag ?? '');
    case 'block':
      return (x.effects ?? []).some((e) => e.kind === 'block' && e.value > 0);
    case 'strength':
      return (x.effects ?? []).some((e) => (e.kind === 'applyStatus' && e.to === 'self' && e.status === 'strength') || (e.kind === 'multiplyStatus' && e.status === 'strength'));
    case 'exhaustedThisCombat':
      return x.exhaust === true || (x.effects ?? []).some((e) => e.kind === 'exhaustRandom');
    case 'targetVulnerable':
      return (x.effects ?? []).some((e) => e.kind === 'applyStatus' && e.to === 'target' && e.status === 'vulnerable');
    default:
      return false;
  }
}

/**
 * Once this many cards have been played in a turn, payoffs stop waiting for more enablers: a loop of
 * free plays (0-cost cards that redraw themselves) would otherwise keep the bot enabling forever and
 * hit its own 60-play safety cap without ever cashing in.
 */
export const DEFER_PLAY_LIMIT = 30;

const isEffectKind = (e: Effect, kind: Effect['kind']): boolean => e.kind === kind;

export function smartChoices(combat: CombatState): Choice[] {
  const living = combat.livingEnemies;
  if (living.length === 0) return [];
  const player = combat.player;
  const incoming = incomingNow(combat);
  const needBlock = Math.max(0, incoming - player.block);
  const facingLethal = needBlock >= player.hp;
  const totalEnemyHp = living.reduce((n, e) => n + e.hp, 0);
  const threats = new Map(living.map((e) => [e.id, threat(combat, e)]));
  const hand = combat.deck.hand;
  const playable = hand.filter((c) => combat.canPlay(c));
  const profiles = new Map(playable.map((c) => [c.instanceId, profileOf(c)]));
  const empowered = player.statuses.empowered ?? 0;
  const strength = player.statuses.strength ?? 0;
  const inPlay = combat.deck.powerPile.map((c) => c.definition);
  const triggersInPlay = inPlay.flatMap((d) => d.triggers ?? []);
  const allCards = [...hand, ...combat.deck.drawPile, ...combat.deck.discardPile];
  const deckHasTag = (tag: string): boolean => allCards.some((c) => (c.definition.tags ?? []).includes(tag));
  const deckExhausts = allCards.some((c) => c.definition.exhaust === true || (c.definition.effects ?? []).some((e) => e.kind === 'exhaustRandom'));
  const attacksInHand = playable.filter((c) => c.definition.type === 'attack');
  const blockSlams = playable.filter((c) => (c.definition.effects ?? []).some((e) => e.kind === 'damage' && e.scaling?.per === 'block'));
  const slamPerBlock = blockSlams.reduce((n, c) => n + (c.definition.effects ?? []).reduce((m, e) => m + (e.kind === 'damage' && e.scaling?.per === 'block' ? e.scaling.value : 0), 0), 0);
  const exhaustReactive =
    triggersInPlay.some((t) => t.on === 'cardExhausted') ||
    playable.some((c) => (c.definition.effects ?? []).some((e) => 'scaling' in e && e.scaling?.per === 'exhaustedThisCombat'));

  interface Row {
    choice: Choice;
    profile: Profile;
    /** Score before payoff deferral. */
    normal: number;
    /** Scalings of this card's own effects that other plays can grow (a "payoff"). */
    growers: Scaling[];
    isPayoff: boolean;
  }
  const rows: Row[] = [];

  for (const card of playable) {
    const def = card.definition;
    const p = profiles.get(card.instanceId) as Profile;
    const aimed = def.target === 'enemy';
    const hits = (def.effects ?? []).filter((e): e is Extract<Effect, { kind: 'damage' }> => e.kind === 'damage');
    const isAttackCard = def.type === 'attack';
    const dealt = (e: EnemyState): number => hits.reduce((n, h) => n + combat.calcDamage(previewValue(combat, h, e), combat.player, e, isAttackCard), 0);
    const effective = (e: EnemyState): number => Math.min(dealt(e), e.hp + e.block);
    const growers = p.scalings.filter((s) => GROWING.has(s.per));

    // ---- self-damage safety: never take loseHp into lethal ----
    if (p.loseHp > 0) {
      const after = player.hp - p.loseHp;
      if (after <= 0) continue;
    }

    let target: EnemyState | undefined;
    if (aimed) {
      if (p.hasDamage) {
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
    const othersInHand = hand.length - 1;
    // block that the Block-Slam style cards in hand would turn into damage is worth something even when no hit is coming
    const slamBonus = p.block > 0 && blockSlams.length > 0 && !blockSlams.includes(card) ? p.block * slamPerBlock : 0;
    const blockUseful = Math.min(p.block, needBlock) * (facingLethal ? 6 : 1.2) + slamBonus * 0.9;
    const latePhase = totalEnemyHp <= 12;
    const lethal = aimed && target && p.hasDamage && dealt(target) >= target.hp + target.block;
    let score: number;

    // ---- self damage that would leave us dead to what is coming ----
    const afterSelfHp = player.hp - p.loseHp;
    const selfRisky = p.loseHp > 0 && afterSelfHp - needBlock <= 0;
    if (selfRisky && !(lethal && living.length === 1)) {
      if (!playable.some((c) => (profiles.get(c.instanceId) as Profile).block > 0)) continue;
      rows.push({ choice: { card, targetId: target?.id, score: 0.5 }, profile: p, normal: 0.5, growers, isPayoff: false });
      continue;
    }

    const reserveOthers = playable.filter((c) => c !== card);
    if (lethal && target) {
      score = 1000 + (threats.get(target.id) ?? 0) * 3 + effective(target) - def.cost;
    } else if (p.energyGain > 0 && !p.hasDamage) {
      // gain energy BEFORE spending it; cards that exhaust a random card only when the energy is needed
      const costsOthers = reserveOthers.reduce((n, c) => n + c.definition.cost, 0);
      const needsEnergy = costsOthers > combat.energy - def.cost + p.energyGain; // others would not all fit
      const net = p.energyGain - def.cost;
      if (p.exhaustRandom > 0) {
        if (othersInHand <= 0) {
          score = exhaustReactive ? 40 : 0;
          if (score === 0) continue;
        } else if (needsEnergy || exhaustReactive) score = 500;
        else continue;
      } else if (net > 0 && needsEnergy) score = 500;
      else if (net > 0) score = 20;
      else score = 100;
    } else if (p.grantsEmpowered) {
      // only with a hit to put it on, and not more stacks than hits
      const hitsAfter = attacksInHand.filter((c) => c.definition.cost <= combat.energy - def.cost).length;
      score = hitsAfter > empowered ? 285 : 4;
    } else if (p.multipliesStrength) {
      score = strength >= 3 || (strength >= 2 && attacksInHand.length >= 2) ? 275 : 3;
    } else if (p.power) {
      score = latePhase ? 90 : 300;
      const trig = def.triggers ?? [];
      if (trig.length > 0) {
        // a trigger power with nothing to trigger on is dead weight this fight
        const live = trig.some((t) => {
          if (t.on === 'cardPlayed' && t.tag) return deckHasTag(t.tag);
          if (t.on === 'cardExhausted') return deckExhausts;
          if (t.on === 'enemyDied') return living.length > 1;
          return true;
        });
        if (!live) score = 20;
        else if (trig.some((t) => t.effects.some((e) => isEffectKind(e, 'draw')))) score += 5; // draw engines before what they react to
      }
    } else if (p.damage === 0 && !p.hasDamage && p.block === 0 && (p.draws || p.selfBuff || p.other)) {
      score = latePhase ? 90 : p.selfBuff ? 280 : p.draws ? 260 : 250;
      if (p.draws && !p.selfBuff) {
        if (hand.length - 1 + p.drawValue > MAX_HAND_SIZE + 2) score = 5; // the hand is full: drawn cards would be discarded
        else {
          // draw first only when there is energy to spare for the new cards; otherwise it
          // competes with plays that are already in hand (a deck full of draw must not spin forever)
          const othersCost = reserveOthers.reduce((n, c) => n + ((profiles.get(c.instanceId) as Profile).draws && !(profiles.get(c.instanceId) as Profile).hasDamage ? 0 : c.definition.cost), 0);
          if (othersCost >= combat.energy - def.cost) score = 35;
        }
      }
    } else if (p.damage === 0 && !p.hasDamage && p.block === 0 && p.debuff) {
      score = target && target.hp + target.block > 14 ? 200 : 60;
    } else if (aimed && target && p.hasDamage) {
      let denom = cost;
      // the biggest hit takes Empowered: don't let a cheap card cheapen the multiplier
      if (empowered > 0) denom = 1;
      score = 100 + (effective(target) + blockUseful) / denom + (p.debuff && target.hp > 14 ? 30 : 0) + (p.draws || p.selfBuff ? 20 : 0);
      if (p.exhaustsSelf && !exhaustReactive) {
        // a one-shot attack is not wasted on overkill
        if (effective(target) < dealt(target) * 0.75) score = 3;
      }
      if (p.loseHp > 0) {
        score -= (p.loseHp * 0.7) / cost;
        if (triggersInPlay.some((t) => t.on === 'hpLost')) score += 15;
      }
    } else if (p.block > 0) {
      score = needBlock > 0 || slamBonus > 0 ? 100 + blockUseful / cost : 5;
    } else {
      score = 1;
    }

    // extra plays for enablers of exhaust / tags that powers in play react to
    if (!lethal) {
      for (const t of triggersInPlay) {
        if (t.on === 'cardPlayed' && t.tag && (def.tags ?? []).includes(t.tag) && score < 100) score = 100 + 1;
      }
    }

    const isPayoff = growers.length > 0 && !lethal && !p.power && score < 1000;
    rows.push({ choice: { card, targetId: target?.id, score: score - def.cost * 0.01 }, profile: p, normal: score - def.cost * 0.01, growers, isPayoff });
  }

  // ---- while Empowered is up, only the biggest hit (with growth potential) goes next ----
  if (empowered > 0) {
    const hitRows = rows.filter((r) => r.choice.card.definition.type === 'attack' && r.choice.targetId !== undefined && r.choice.score < 1000);
    if (hitRows.length > 1) {
      const potential = (r: Row): number => {
        const t = living.find((e) => e.id === r.choice.targetId);
        if (!t) return 0;
        const hitsOf = (r.choice.card.definition.effects ?? []).filter((e): e is Extract<Effect, { kind: 'damage' }> => e.kind === 'damage');
        const now = hitsOf.reduce((n, h) => n + combat.calcDamage(previewValue(combat, h, t), player, t, true), 0);
        let growth = 0;
        for (const s of r.growers) {
          const n = rows.filter((o) => o !== r && enables(o.choice.card.definition, s) && o.normal >= 4.5).length;
          growth += s.value * Math.min(n, Math.max(0, combat.energy - r.choice.card.definition.cost));
        }
        return now + growth * 2;
      };
      const best = hitRows.reduce((b, r) => (potential(r) > potential(b) ? r : b), hitRows[0]);
      for (const r of hitRows) {
        if (r !== best) {
          r.choice.score = Math.min(r.choice.score, 3);
          r.normal = r.choice.score;
          r.isPayoff = false;
        }
      }
    }
  }

  // ---- payoff deferral: payoffs go after the playable cards that grow them, with energy kept back ----
  const nonPayoff = rows.filter((r) => !r.isPayoff);
  for (const r of rows) {
    if (!r.isPayoff || combat.stats.cardsPlayedThisTurn >= DEFER_PLAY_LIMIT) continue;
    const def = r.choice.card.definition;
    const budget = combat.energy - def.cost;
    const enablers = nonPayoff.filter((o) => o !== r && o.choice.card.definition.cost <= budget && o.normal >= 4.5 && r.growers.some((s) => enables(o.choice.card.definition, s)));
    if (enablers.length === 0) continue;
    const floor = Math.min(...enablers.map((o) => o.choice.score));
    const deferred = Math.min(r.choice.score, floor - 0.5);
    // cards that cannot share the turn with this payoff compete with it at its normal rank
    for (const o of nonPayoff) {
      if (o === r || enablers.includes(o) || o.choice.card.definition.cost === 0) continue;
      if (o.choice.card.definition.cost > budget && r.normal >= o.choice.score) o.choice.score = Math.min(o.choice.score, deferred - 0.01);
    }
    r.choice.score = deferred;
  }

  return rows.map((r) => r.choice).sort((a, b) => b.score - a.score);
}
