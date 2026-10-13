/** 'freeze' is unique to the Mage: stacks never count down, and every FREEZE_STUN_THRESHOLD stacks
 *  stuns the holder for its next move (see CombatState). 'frail', 'intangible' and 'buffer' are
 *  generic StS-style keyword statuses (engine-only for now: no real card uses them yet, see
 *  src/data/keywordCards.ts and implementationplan.md). 'fuming' and 'ignite' are Heating Up's real
 *  mechanic (Mage-only): Heating Up gives Fuming for the rest of the turn, each attack card played
 *  while Fuming grants 1 Ignite, and Ignite multiplies outgoing damage by 2^stacks (so 1x, 2x, 4x...);
 *  see StatusDefinition.clearAtTurnEnd / grantsOnAttack and DESIGN_LOG.md. */
export type StatusId = 'weak' | 'vulnerable' | 'strength' | 'empowered' | 'freeze' | 'frail' | 'intangible' | 'buffer' | 'ignite' | 'fuming' | 'dexterity';

/** Stacks per status currently on one combatant. Absent (or 0) means not affected. */
export type Statuses = Partial<Record<StatusId, number>>;

/**
 * - duration: stacks count down by 1 at the end of each round and expire at 0.
 * - intensity: stacks never count down; they add up for the rest of the fight.
 * The three modifier hooks are applied in this order when damage is dealt: the attacker's
 * `outgoingDamageAdd` (all statuses summed), then its `outgoingDamageMult` (all statuses
 * multiplied together), then the target's `incomingDamageMult`; the result is rounded down once at
 * the end. A scaled card value (see `Scaling`) is part of the base, i.e. it comes before all three.
 * `consumedByAttack` marks a status whose multiplier only applies to damage from an attack card, and
 * which loses one stack after each attack card the holder plays (see 'empowered').
 */
/** Extra context `outgoingDamageMult` hooks may read, beyond their own stack count. Room to grow. */
export interface DamageMultContext {
  /** Attack cards played earlier this turn (not the one currently resolving). */
  attacksPlayedThisTurn: number;
}

export interface StatusDefinition {
  id: StatusId;
  name: string;
  kind: 'duration' | 'intensity';
  describe(stacks: number): string;
  outgoingDamageAdd?(stacks: number): number;
  outgoingDamageMult?(stacks: number, ctx: DamageMultContext): number;
  incomingDamageMult?(stacks: number): number;
  /** Flat block added to every block the holder gains, before Frail multiplies (Dexterity); can be negative. */
  blockAdd?(stacks: number): number;
  /** Stacks may go below 0 (Strength and Dexterity, which Druid forms can lower); a status that returns
   *  to exactly 0 is removed. Every other status ignores 0 or fewer stacks. */
  allowNegative?: boolean;
  /** Multiplies block the holder gains (Frail). Applied the same way as the damage-mult stage,
   *  in CombatState.calcBlock. */
  blockMult?(stacks: number): number;
  /** Caps all damage the holder takes at this amount, applied last, after every other damage
   *  modifier (Intangible). The lowest active cap wins if more than one status has one. */
  incomingDamageCap?(stacks: number): number;
  consumedByAttack?: boolean;
  /** The damage multiplier only applies to damage from an attack card (not a skill's damage or a trigger's),
   *  without being used up (ignite). `consumedByAttack` statuses are already attack-card-only. */
  attackCardsOnly?: boolean;
  /** After each attack card the holder plays, the holder gains this status (fuming grants 1 ignite). */
  grantsOnAttack?: { status: StatusId; stacks: number };
  /** The most stacks the holder can have; more stacks added are lost (fuming is 1). */
  maxStacks?: number;
  /** What a card that applies this status to its own player says, instead of "Gain N <name>." */
  gainText?: (stacks: number) => string;
  /** Removed entirely (not decremented) at the same end-of-round point `duration` stacks tick down,
   *  regardless of `kind` — "lasts only until the end of the turn it was granted" (ignite). Unlike
   *  `duration`, this never partially counts down: it's gone, all at once, one round after being applied. */
  clearAtTurnEnd?: boolean;
  /** Placeholder badge look until statuses get real icons. */
  badge: { symbol: string; color: number };
}
