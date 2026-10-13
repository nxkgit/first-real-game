import type { FormId } from './form';
import type { StatusId } from './status';

/** Where a scaled value gets its count from. "Earlier" means not counting the card being played. */
export type ScaleSource =
  | 'cardsPlayedThisTurn'
  | 'attacksPlayedThisTurn'
  /** Cards played earlier this turn that carry `Scaling.tag`. */
  | 'taggedPlayedThisTurn'
  /** The player's current block. */
  | 'block'
  /** The player's current Strength. */
  | 'strength'
  /** Cards in the player's hand when the effect resolves (the card being played has already left it). */
  | 'handSize'
  | 'exhaustedThisCombat'
  /** Vulnerable stacks on the effect's target (0 if there is no target). */
  | 'targetVulnerable'
  /** Freeze stacks on the effect's target (0 if there is no target). Mage-only mechanic. */
  | 'targetFreeze'
  /** The Mage's current Temperature (-5..5; see CombatState.temperature). Mage-only mechanic. */
  | 'temperature';

/** The effect's value becomes `value + scaling.value * count(scaling.per)`. */
export interface Scaling {
  per: ScaleSource;
  /** Required when `per` is 'taggedPlayedThisTurn'. */
  tag?: string;
  value: number;
}

/**
 * One thing that happens. Cards and enemy moves are both lists of these, so a new kind of effect
 * works for both (enemies only perform the kinds whose registry entry has `resolveEnemy`: damage,
 * block and applyStatus). Each kind's rules, text, intent and scaling live in one entry of the
 * effect registry (effects.ts). "target" is whoever the card
 * was aimed at (an enemy), or for an enemy move, the player; "self" is whoever is playing the card
 * or making the move. For effects fired by a trigger, "target" is the first living enemy.
 * Effects with a numeric `value` can also carry `scaling`.
 */
export type Effect =
  /** `vsFreezeMult`, if set, multiplies the damage when the target currently has any Freeze stacks
   *  (Mage-only; e.g. Glaciate). `ignoresStatuses` lists attacker statuses whose damage multiplier does
   *  not apply to this damage (Scorching Wind ignores ignite); every other modifier still does. */
  | { kind: 'damage'; value: number; scaling?: Scaling; vsFreezeMult?: number; ignoresStatuses?: StatusId[] }
  | { kind: 'block'; value: number; scaling?: Scaling }
  /** Player cards only. Hits every living enemy for `value` (each scaled against its own target, e.g. targetVulnerable). */
  | { kind: 'damageAll'; value: number; scaling?: Scaling }
  /** Player cards only. */
  | { kind: 'draw'; value: number; scaling?: Scaling }
  | { kind: 'applyStatus'; status: StatusId; value: number; to: 'target' | 'self'; scaling?: Scaling }
  /** Player cards only. */
  | { kind: 'gainEnergy'; value: number; scaling?: Scaling }
  /** Player cards only. The player loses HP directly (block does not help). */
  | { kind: 'loseHp'; value: number; scaling?: Scaling }
  /** Multiplies the stacks of a status the holder already has (nothing happens at 0 stacks). */
  | { kind: 'multiplyStatus'; status: StatusId; factor: number; to: 'target' | 'self' }
  /** Player cards only. Exhausts `value` random cards from the hand (fewer if the hand is smaller). */
  | { kind: 'exhaustRandom'; value: number }
  /** Player cards only. Discards `value` random cards from the hand (back to the discard pile, unlike exhaust). */
  | { kind: 'discardRandom'; value: number }
  /** Player cards only, Mage-only mechanic. Shifts Temperature by `value` (negative cools down), clamped. */
  | { kind: 'adjustTemperature'; value: number }
  /** Player cards only, Mage-only mechanic. Puts `value` more copies of `cardId` straight into the hand
   *  (overflow goes to the discard pile, as with a draw into a full hand). */
  | { kind: 'addCardToHand'; cardId: string; value: number; scaling?: Scaling }
  /** Player cards (and hero powers) only. For the next `value` of the player's turns (this one not
   *  counted), gain 1 extra energy at the start of the turn. Stacks additively with itself. */
  | { kind: 'gainEnergizedTurns'; value: number }
  /** Player cards only, Paladin-only mechanic (placeholder, see implementationplan.md "Multiple heroes
   *  and hero selection"). Gains `value` Radiant Light, up to RADIANT_LIGHT_MAX. */
  | { kind: 'gainRadiantLight'; value: number }
  /** Player cards only, Druid-only mechanic. Enters `form` (replacing any other form; see FormDefinition) and
   *  then resolves `onEnter`. If the Druid is already in `form` nothing changes and `ifAlready` resolves instead. */
  | { kind: 'enterForm'; form: FormId; onEnter?: Effect[]; ifAlready?: Effect[] };

/** Every effect kind. Each one has exactly one entry in the effect registry (effects.ts). */
export type EffectKind = Effect['kind'];
