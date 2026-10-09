import type { HeroDefinition } from '../game/types';
import { MAGE } from './cards';
import { MAGE_HERO_POWER, PALADIN_HERO_POWER } from './heroPowers';
import { PALADIN } from './paladinCards';
import { MAX_ENERGY, PALADIN_ENERGY, PALADIN_MAX_HP_FACTOR, PLAYER_MAX_HP } from './tunables';

// The playable heroes. Hero identity (names, blurbs, art) is the user's to author; the blurbs are
// the literal placeholder text until they write them. Stats are PROVISIONAL and deliberately
// different (user, 2026-10-09) so heroes can be tested against each other. Hand size is the same for
// every hero (HAND_SIZE in tunables.ts).

const PLACEHOLDER_BLURB = 'placeholder blurb';

export const MAGE_HERO: HeroDefinition = {
  id: MAGE,
  name: 'Mage',
  maxHp: PLAYER_MAX_HP,
  energy: MAX_ENERGY,
  heroPower: MAGE_HERO_POWER,
  resource: 'temperature',
  blurb: PLACEHOLDER_BLURB,
  placeholderColor: 0x6a5acd,
};

export const PALADIN_HERO: HeroDefinition = {
  id: PALADIN,
  name: 'Paladin',
  maxHp: Math.round(PLAYER_MAX_HP * PALADIN_MAX_HP_FACTOR),
  energy: PALADIN_ENERGY,
  heroPower: PALADIN_HERO_POWER,
  resource: 'radiantLight',
  blurb: PLACEHOLDER_BLURB,
  placeholderColor: 0xe0b84a,
};

/** Every playable hero, in the order the select screen shows them. */
export const HEROES: readonly HeroDefinition[] = [MAGE_HERO, PALADIN_HERO];

/** The hero used when none is chosen (tests and tools). */
export const DEFAULT_HERO_ID = MAGE;

export function getHero(id: string): HeroDefinition {
  const hero = HEROES.find((h) => h.id === id);
  if (!hero) throw new Error(`unknown hero id: ${id}`);
  return hero;
}

export function findHero(id: unknown): HeroDefinition | undefined {
  return HEROES.find((h) => h.id === id);
}
