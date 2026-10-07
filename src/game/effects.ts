import type { Deck } from './Deck';
import type { CombatEventMap, DamageResult } from './CombatState';
import type { IntentIcon } from './intent';
import type { CardInstance, Combatant, Effect, EffectKind, EnemyState, Scaling, ScaleSource, StatusId, TriggerOn } from './types';
import { STATUSES } from '../data/statuses';

/**
 * The effect registry: ONE entry per effect kind, bundling everything the game knows about it.
 * Adding a kind = add its member to the `Effect` union in types.ts, then add its entry to `EFFECTS`
 * below (the compiler refuses to build until you do), plus tests. See docs/EFFECTS.md.
 *
 * An entry says:
 *  - `resolvePlayer`: what it does when a card, power, relic or trigger of the player's fires it;
 *  - `resolveEnemy`: what it does in an enemy's move; leave it out and the kind is player-only
 *    (an enemy move containing it does nothing for that effect, and shows no intent icon);
 *  - `describe`: its card text;
 *  - `intent`: how the enemy-intent readout treats it (icon, and the numbers the preview sums);
 *  - `scales`: which scaling sources its `scaling` field accepts (empty: it can't scale).
 *
 * CombatState supplies the `EffectHost` (the few things an effect may do to the fight) and does the
 * dispatch; the entries here own the rules.
 */

/** What an effect may do to the fight. Implemented by CombatState; effects touch nothing else. */
export interface EffectHost {
  readonly player: Combatant;
  readonly deck: Deck;
  emit<K extends keyof CombatEventMap>(event: K, payload: CombatEventMap[K]): void;
  /** Damage `attacker` would really deal for `base` to `defender` (statuses included). */
  calcDamage(base: number, attacker: Combatant, defender: Combatant, fromAttackCard?: boolean): number;
  /** Applies damage through block. The caller announces it. */
  dealDamage(target: Combatant, amount: number): DamageResult;
  /** Adds stacks and returns the matching event for the caller to emit. */
  addStatus(target: Combatant, id: StatusId, stacks: number): CombatEventMap['statusChanged'];
  /** `effect.value` plus its scaling times the live count; never below 0. */
  scaledValue(effect: { value: number; scaling?: Scaling }, target: EnemyState | undefined): number;
  /** Adds energy and returns the new total. */
  gainEnergy(amount: number): number;
  /** Announces a card that just moved to the exhaust pile, counts it, lets triggers react. */
  noteExhausted(card: CardInstance | undefined): void;
  fireTriggers(on: TriggerOn): void;
  emitHandChanged(): void;
  /** Marks a status put on during the enemy phase so it skips this round's countdown. */
  markFresh(target: Combatant, id: StatusId): void;
}

/** What an enemy move collects while its effects resolve; CombatState announces it afterwards. */
export interface EnemyMoveOutcome {
  damage?: DamageResult;
  blockGained?: number;
  statusEvents: CombatEventMap['statusChanged'][];
  /** HP the player lost to each hit that got past block (one entry per hit). */
  hpLosses: number[];
}

export interface DescribeOpts {
  /** For powers and relics that act at turn start, where a draw is on top of the normal hand. */
  atTurnStart?: boolean;
}

type OfKind<K extends EffectKind> = Extract<Effect, { kind: K }>;

export interface EffectDefinition<E extends Effect> {
  /** `target` is the enemy the card was aimed at (or, for triggers, the first living enemy), if any. */
  resolvePlayer(effect: E, host: EffectHost, target: EnemyState | undefined, fromAttackCard: boolean): void;
  resolveEnemy?(effect: E, host: EffectHost, enemy: EnemyState, out: EnemyMoveOutcome): void;
  /** One sentence with `n` as its number (the effect's value, or its scaling step; scaling is described separately). */
  describe(effect: E, n: number, opts: DescribeOpts): string;
  intent?: {
    icon?(effect: E): IntentIcon;
    /** Base damage this effect adds to the move's attack readout. */
    damage?(effect: E): number;
    /** Block this effect adds to the move's defend readout. */
    block?(effect: E): number;
  };
  scales: readonly ScaleSource[];
}

/** Every scaling source (the Record keeps this list in step with the ScaleSource union). */
const SCALE_SOURCE_SET: Record<ScaleSource, true> = {
  cardsPlayedThisTurn: true,
  attacksPlayedThisTurn: true,
  taggedPlayedThisTurn: true,
  block: true,
  strength: true,
  handSize: true,
  exhaustedThisCombat: true,
  targetVulnerable: true,
};
export const ALL_SCALE_SOURCES = Object.keys(SCALE_SOURCE_SET) as ScaleSource[];

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

export const EFFECTS: { [K in EffectKind]: EffectDefinition<OfKind<K>> } = {
  damage: {
    resolvePlayer(effect, h, target, fromAttackCard) {
      if (!target || target.hp <= 0) return;
      const base = h.scaledValue(effect, target);
      const result = h.dealDamage(target, h.calcDamage(base, h.player, target, fromAttackCard));
      h.emit('damageDealt', { target: target.id, ...result });
      if (target.hp <= 0) {
        h.emit('enemyDied', { enemyId: target.id });
        h.fireTriggers('enemyDied');
      }
    },
    resolveEnemy(effect, h, enemy, out) {
      const hpBefore = h.player.hp;
      const hit = h.dealDamage(h.player, h.calcDamage(effect.value, enemy, h.player));
      if (h.player.hp < hpBefore) out.hpLosses.push(hpBefore - h.player.hp);
      out.damage = out.damage
        ? { amount: out.damage.amount + hit.amount, absorbed: out.damage.absorbed + hit.absorbed, remainingHp: hit.remainingHp }
        : hit;
    },
    describe: (_e, n) => `Deal ${n} damage.`,
    intent: { icon: () => 'attack', damage: (e) => e.value },
    scales: ALL_SCALE_SOURCES,
  },

  block: {
    resolvePlayer(effect, h, target) {
      const amount = h.scaledValue(effect, target);
      h.player.block += amount;
      h.emit('blockGained', { target: h.player.id, amount });
      if (amount > 0) h.fireTriggers('blockGained');
    },
    resolveEnemy(effect, _h, enemy, out) {
      enemy.block += effect.value;
      out.blockGained = (out.blockGained ?? 0) + effect.value;
    },
    describe: (_e, n) => `Gain ${n} block.`,
    intent: { icon: () => 'defend', block: (e) => e.value },
    scales: ALL_SCALE_SOURCES,
  },

  draw: {
    resolvePlayer(effect, h, target) {
      h.deck.draw(h.scaledValue(effect, target));
      h.emitHandChanged();
    },
    describe: (_e, n, opts) => (opts.atTurnStart ? `Draw ${n} additional ${n === 1 ? 'card' : 'cards'}.` : `Draw ${plural(n, 'card')}.`),
    scales: ALL_SCALE_SOURCES,
  },

  applyStatus: {
    resolvePlayer(effect, h, target) {
      const recipient = effect.to === 'self' ? h.player : target;
      if (recipient && recipient.hp > 0) {
        h.emit('statusChanged', h.addStatus(recipient, effect.status, h.scaledValue(effect, target)));
      }
    },
    resolveEnemy(effect, h, enemy, out) {
      const recipient = effect.to === 'self' ? enemy : h.player;
      out.statusEvents.push(h.addStatus(recipient, effect.status, effect.value));
      h.markFresh(recipient, effect.status);
    },
    describe: (e, n) => {
      const name = STATUSES[e.status].name;
      return e.to === 'self' ? `Gain ${n} ${name}.` : `Apply ${n} ${name}.`;
    },
    intent: { icon: (e) => (e.to === 'self' ? 'buff' : 'debuff') },
    scales: ALL_SCALE_SOURCES,
  },

  gainEnergy: {
    resolvePlayer(effect, h, target) {
      const amount = h.scaledValue(effect, target);
      h.emit('energyChanged', { energy: h.gainEnergy(amount), delta: amount });
    },
    describe: (_e, n) => `Gain ${n} energy.`,
    scales: ALL_SCALE_SOURCES,
  },

  loseHp: {
    resolvePlayer(effect, h, target) {
      const lost = Math.min(h.player.hp, h.scaledValue(effect, target));
      if (lost <= 0) return;
      h.player.hp -= lost;
      h.emit('hpLost', { target: h.player.id, amount: lost, remainingHp: h.player.hp });
      if (h.player.hp > 0) h.fireTriggers('hpLost');
    },
    describe: (_e, n) => `Lose ${n} HP.`,
    scales: ALL_SCALE_SOURCES,
  },

  multiplyStatus: {
    resolvePlayer(effect, h, target) {
      const recipient = effect.to === 'self' ? h.player : target;
      const stacks = recipient?.statuses[effect.status] ?? 0;
      if (!recipient || recipient.hp <= 0 || stacks <= 0) return;
      const next = Math.floor(stacks * effect.factor);
      if (next === stacks) return;
      const event = h.addStatus(recipient, effect.status, next - stacks);
      if (next <= 0) {
        delete recipient.statuses[effect.status];
        event.statuses = { ...recipient.statuses };
      }
      h.emit('statusChanged', event);
    },
    describe: (e) => {
      const name = STATUSES[e.status].name;
      const whose = e.to === 'self' ? 'your' : "the target's";
      return e.factor === 2 ? `Double ${whose} ${name}.` : `Multiply ${whose} ${name} by ${e.factor}.`;
    },
    scales: [],
  },

  exhaustRandom: {
    resolvePlayer(effect, h) {
      for (let i = 0; i < effect.value; i++) {
        const card = h.deck.exhaustRandomFromHand();
        if (!card) break; // empty hand: nothing to exhaust
        h.noteExhausted(card);
      }
      h.emitHandChanged();
    },
    describe: (e) => `Exhaust ${plural(e.value, 'random card')} from your hand.`,
    scales: [],
  },
};

// The registry is keyed by kind, so TypeScript cannot tie `EFFECTS[effect.kind]` to `effect`'s own
// member; these three helpers are the only places that cast, so callers stay type-safe.
// An unknown kind (stale data, a test's made-up kind) has no entry and is ignored everywhere, as the old switches did.
const entry = (effect: Effect): EffectDefinition<Effect> | undefined => (EFFECTS as Record<string, unknown>)[effect.kind] as EffectDefinition<Effect> | undefined;

/** Resolves one effect for the player's side (cards, powers, relics, triggers). */
export function resolvePlayerEffect(effect: Effect, host: EffectHost, target: EnemyState | undefined, fromAttackCard: boolean): void {
  entry(effect)?.resolvePlayer(effect, host, target, fromAttackCard);
}

/** Resolves one effect of an enemy's move; player-only kinds do nothing. */
export function resolveEnemyEffect(effect: Effect, host: EffectHost, enemy: EnemyState, out: EnemyMoveOutcome): void {
  entry(effect)?.resolveEnemy?.(effect, host, enemy, out);
}

/** The effect's text with `n` as its number. */
export function describeEffectWith(effect: Effect, n: number, opts: DescribeOpts): string {
  return entry(effect)?.describe(effect, n, opts) ?? '';
}

/** True if the effect can carry `scaling` (its kind accepts at least one source). */
export function acceptsScaling(effect: Effect): boolean {
  return (entry(effect)?.scales.length ?? 0) > 0;
}

export function intentIconOf(effect: Effect): IntentIcon | undefined {
  return entry(effect)?.intent?.icon?.(effect);
}

export function intentDamageOf(effect: Effect): number | undefined {
  return entry(effect)?.intent?.damage?.(effect);
}

export function intentBlockOf(effect: Effect): number | undefined {
  return entry(effect)?.intent?.block?.(effect);
}
