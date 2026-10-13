import type { Effect } from './effect';
import type { Trigger } from './trigger';

// ---- relics ----

/** Something a relic (or an event) does to the run itself, outside a fight. */
export type RunEffect =
  | { kind: 'maxHp'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'gold'; value: number };

/** A permanent item for the rest of the run. */
export interface RelicDefinition {
  id: string;
  name: string;
  /** Text override. Leave it out: the text is generated from the effects (see describe.ts). */
  description?: string;
  /** When picked up. */
  onPickup?: RunEffect[];
  /** After every fight you win. */
  onVictory?: RunEffect[];
  /** On you, as each fight starts. Same effects as cards (a status, block, a draw). */
  onCombatStart?: Effect[];
  /** On you, at the start of every one of your turns. */
  onTurnStart?: Effect[];
  /** Reactive abilities, active for the whole fight (same type as on power cards). */
  triggers?: Trigger[];
}
