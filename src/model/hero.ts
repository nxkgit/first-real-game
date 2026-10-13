import type { Effect } from './effect';

/**
 * A hero's once-per-turn active ability: not a card (never drawn, discarded or exhausted), just a
 * fixed button the player can use once per their turn for its energy cost. See CombatState.useHeroPower.
 */
export interface HeroPowerDefinition {
  id: string;
  name: string;
  cost: number;
  owner: string;
  /** Text override; otherwise generated from `effects` like a card (see describe.ts). */
  description?: string;
  effects: Effect[];
}

/**
 * A playable hero (data, see src/data/heroes.ts). Cards point at their hero through `owner`; this
 * record holds what is about the hero itself. Every hero has a hero power. `resource` names the
 * hero's own extra mechanic, which decides what the fight screen shows (a hero's resource is
 * declared here, never inferred from having a hero power).
 */
export interface HeroDefinition {
  id: string;
  name: string;
  maxHp: number;
  /** Energy per turn. */
  energy: number;
  heroPower: HeroPowerDefinition;
  /** The hero's own extra resource, if any: the Mage's Temperature or the Paladin's Radiant Light. */
  resource?: 'temperature' | 'radiantLight';
  /** Select-screen text. Placeholder until the user writes the real one (creative content). */
  blurb: string;
  /** Flat colour of the drawn stand-in when the hero has no picture (art always falls back). */
  placeholderColor: number;
}
