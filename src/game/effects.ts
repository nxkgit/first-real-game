import type { Deck } from './Deck';
import type { CombatEventMap, DamageResult } from './CombatState';
import type { IntentIcon } from './intent';
import type { CardDefinition, CardInstance, Combatant, Effect, EffectKind, EnemyState, Scaling, ScaleSource, StatusId, TriggerOn } from './types';
import { STATUSES } from '../data/statuses';
import { getCard } from '../data/cards';

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
 *  - `scales`: which scaling sources its `scaling` field accepts (empty: it can't scale);
 *  - `preview`: the number it would produce if played right now, for the live numbers on card faces
 *    (leave it out and the card face shows the printed text); `lowerIsBetter` marks numbers that hurt
 *    the player (self-damage), so the card face colours a bigger one red.
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
  /** Every enemy still standing. */
  livingEnemies(): EnemyState[];
  /** Mage-only: shifts Temperature by `delta` (clamped) and returns the new value. */
  adjustTemperature(delta: number): number;
  /** Extends the player's "+1 energy at turn start" counter by `turns` more turns. */
  gainEnergizedTurns(turns: number): void;
  /** Mage-only: puts up to `count` new copies of `definition` into the hand; returns how many landed
   *  there (the rest went to the discard pile, as with a draw into a full hand). Counted so the total
   *  card count is no longer assumed fixed (see invariantHarness.ts's `cardsAddedThisCombat` escape hatch). */
  addCardsToHand(definition: CardDefinition, count: number): number;
  /** `base` block for `who`, after Frail (a keyword status) multiplies it down. */
  calcBlock(base: number, who: Combatant): number;
  /** Buffer (a keyword status): if `target` has any stacks, consumes one and returns true, meaning
   *  the caller should skip reducing HP for this loss. Independent of block. */
  consumeBufferIfPresent(target: Combatant): boolean;
}

/** What an enemy move collects while its effects resolve; CombatState announces it afterwards. */
export interface EnemyMoveOutcome {
  damage?: DamageResult;
  blockGained?: number;
  statusEvents: CombatEventMap['statusChanged'][];
  /** HP the player lost to each hit that got past block (one entry per hit). */
  hpLosses: number[];
}

/** The slice of the fight a preview may read (a subset of EffectHost, so previews cannot change anything). */
export interface PreviewHost extends Pick<EffectHost, 'player' | 'calcDamage' | 'calcBlock' | 'scaledValue'> {
  /** How many of `count` cards a draw would really put into the hand right now (hand cap and pile sizes included). */
  previewDraw(count: number): number;
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
  /** What this effect would really produce for `target` if played now (scaling, statuses and all),
   *  or undefined if it has no single number to show. Must not change anything. */
  preview?(effect: E, host: PreviewHost, target: EnemyState | undefined, fromAttackCard: boolean): number | undefined;
  /** True if a bigger previewed number is worse for the player (e.g. losing HP). */
  lowerIsBetter?: boolean;
}

/** The previewed number of a plain scaled value (everything except damage, which also meets statuses). */
const scaledPreview = (effect: { value: number; scaling?: Scaling }, host: PreviewHost, target: EnemyState | undefined): number =>
  host.scaledValue(effect, target);

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
  targetFreeze: true,
  temperature: true,
};
export const ALL_SCALE_SOURCES = Object.keys(SCALE_SOURCE_SET) as ScaleSource[];

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** `base`, multiplied by `effect.vsFreezeMult` if the target currently has any Freeze stacks (Mage-only). */
const vsFreeze = (effect: { vsFreezeMult?: number }, base: number, target: EnemyState | undefined): number =>
  effect.vsFreezeMult && (target?.statuses.freeze ?? 0) > 0 ? base * effect.vsFreezeMult : base;

export const EFFECTS: { [K in EffectKind]: EffectDefinition<OfKind<K>> } = {
  damage: {
    resolvePlayer(effect, h, target, fromAttackCard) {
      if (!target || target.hp <= 0) return;
      const base = vsFreeze(effect, h.scaledValue(effect, target), target);
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
    describe: (e, n) => `Deal ${n} damage.${e.vsFreezeMult ? ` ${e.vsFreezeMult}x against a frozen target.` : ''}`,
    intent: { icon: () => 'attack', damage: (e) => e.value },
    scales: ALL_SCALE_SOURCES,
    preview: (e, h, target, fromAttackCard) =>
      target ? h.calcDamage(vsFreeze(e, h.scaledValue(e, target), target), h.player, target, fromAttackCard) : undefined,
  },

  damageAll: {
    resolvePlayer(effect, h, _target, fromAttackCard) {
      for (const enemy of h.livingEnemies()) {
        if (enemy.hp <= 0) continue;
        const base = h.scaledValue(effect, enemy);
        const result = h.dealDamage(enemy, h.calcDamage(base, h.player, enemy, fromAttackCard));
        h.emit('damageDealt', { target: enemy.id, ...result });
        if (enemy.hp <= 0) {
          h.emit('enemyDied', { enemyId: enemy.id });
          h.fireTriggers('enemyDied');
        }
      }
    },
    describe: (_e, n) => `Deal ${n} damage to all enemies.`,
    scales: ALL_SCALE_SOURCES,
    // Shown against the first living enemy, like the rest of the multi-enemy UI (see HANDOFF.md).
    preview: (e, h, target, fromAttackCard) =>
      target ? h.calcDamage(h.scaledValue(e, target), h.player, target, fromAttackCard) : undefined,
  },

  block: {
    resolvePlayer(effect, h, target) {
      const amount = h.calcBlock(h.scaledValue(effect, target), h.player);
      h.player.block += amount;
      h.emit('blockGained', { target: h.player.id, amount });
      if (amount > 0) h.fireTriggers('blockGained');
    },
    resolveEnemy(effect, _h, enemy, out) {
      // Frail is not applied to an enemy's own block here, to keep EnemyMoveOutcome simple (it
      // mirrors Vulnerable/Weak not being enemy-symmetric everywhere either); only the player side
      // goes through calcBlock. See implementationplan.md's keyword-mechanics section.
      enemy.block += effect.value;
      out.blockGained = (out.blockGained ?? 0) + effect.value;
    },
    describe: (_e, n) => `Gain ${n} block.`,
    intent: { icon: () => 'defend', block: (e) => e.value },
    scales: ALL_SCALE_SOURCES,
    preview: (e, h, target) => h.calcBlock(h.scaledValue(e, target), h.player),
  },

  draw: {
    resolvePlayer(effect, h, target) {
      h.deck.draw(h.scaledValue(effect, target));
      h.emitHandChanged();
    },
    describe: (_e, n, opts) => (opts.atTurnStart ? `Draw ${n} additional ${n === 1 ? 'card' : 'cards'}.` : `Draw ${plural(n, 'card')}.`),
    scales: ALL_SCALE_SOURCES,
    preview: (e, h, target) => h.previewDraw(h.scaledValue(e, target)),
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
    preview: scaledPreview,
  },

  gainEnergy: {
    resolvePlayer(effect, h, target) {
      const amount = h.scaledValue(effect, target);
      h.emit('energyChanged', { energy: h.gainEnergy(amount), delta: amount });
    },
    describe: (_e, n) => `Gain ${n} energy.`,
    scales: ALL_SCALE_SOURCES,
    preview: scaledPreview,
  },

  loseHp: {
    resolvePlayer(effect, h, target) {
      const lost = Math.min(h.player.hp, h.scaledValue(effect, target));
      if (lost <= 0) return;
      // Buffer (a keyword status) can cancel this entirely, independent of block (loseHp never
      // goes through block anyway). No HP was actually lost, so neither the hpLost event nor its
      // trigger fires — only the Buffer stack ticking down (a statusChanged event) is visible.
      if (h.consumeBufferIfPresent(h.player)) return;
      h.player.hp -= lost;
      h.emit('hpLost', { target: h.player.id, amount: lost, remainingHp: h.player.hp });
      if (h.player.hp > 0) h.fireTriggers('hpLost');
    },
    describe: (_e, n) => `Lose ${n} HP.`,
    scales: ALL_SCALE_SOURCES,
    preview: scaledPreview,
    lowerIsBetter: true,
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

  discardRandom: {
    resolvePlayer(effect, h) {
      for (let i = 0; i < effect.value; i++) {
        if (!h.deck.discardRandomFromHand()) break; // empty hand: nothing to discard
      }
      h.emitHandChanged();
    },
    describe: (e) => `Discard ${plural(e.value, 'random card')} from your hand.`,
    scales: [],
  },

  // Mage-only (see docs/implementationplan.md "Mage — Core Mechanics"). Never clamped to 0 by
  // scaledValue, since cooling down is a negative value: it carries no `scaling`.
  adjustTemperature: {
    resolvePlayer(effect, h) {
      const temperature = h.adjustTemperature(effect.value);
      h.emit('temperatureChanged', { temperature, delta: effect.value });
    },
    describe: (_e, n) => (n >= 0 ? `Heat up by ${n}.` : `Cool down by ${-n}.`),
    scales: [],
  },

  addCardToHand: {
    resolvePlayer(effect, h, target) {
      const count = h.scaledValue(effect, target);
      h.addCardsToHand(getCard(effect.cardId), count);
      h.emitHandChanged();
    },
    describe: (e, n) => `Add ${plural(n, getCard(e.cardId).name)} to your hand.`,
    scales: ALL_SCALE_SOURCES,
    preview: scaledPreview,
  },

  gainEnergizedTurns: {
    resolvePlayer(effect, h) {
      h.gainEnergizedTurns(effect.value);
    },
    describe: (_e, n) => `Gain 1 extra energy at the start of your turn for the next ${plural(n, 'turn')}.`,
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

/** The number `effect` would produce if played now, or undefined if the kind shows none (see `preview`). */
export function previewEffectValue(effect: Effect, host: PreviewHost, target: EnemyState | undefined, fromAttackCard: boolean): number | undefined {
  return entry(effect)?.preview?.(effect, host, target, fromAttackCard);
}

/** True if a bigger previewed number is worse for the player (see `lowerIsBetter`). */
export function lowerIsBetterFor(effect: Effect): boolean {
  return entry(effect)?.lowerIsBetter ?? false;
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
