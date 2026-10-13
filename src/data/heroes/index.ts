import type { HeroDefinition } from '../../model';
import { createRegistry } from '../registry';
import { DRUID_HERO } from './druid/hero';
import { MAGE } from './ids';
import { MAGE_HERO } from './mage/hero';
import { PALADIN_HERO } from './paladin/hero';

// The playable heroes: the registry. A hero is a folder (hero.ts, power.ts, cards.ts, art.ts, and anything of its own such as
// the Druid's forms.ts); adding one means a new folder plus one line here. Hero identity (names, blurbs, art) is the user's to author.
// Hand size is the same for every hero (HAND_SIZE in tunables.ts).

export { DRUID_HERO, MAGE_HERO, PALADIN_HERO };

/** Every playable hero, in the order the select screen shows them. */
export const HEROES: readonly HeroDefinition[] = [MAGE_HERO, PALADIN_HERO, DRUID_HERO];

/** The hero used when none is chosen (tests and tools). */
export const DEFAULT_HERO_ID = MAGE;

const heroTable = createRegistry('hero', HEROES);
export const getHero = heroTable.get;
export const findHero = heroTable.find;
