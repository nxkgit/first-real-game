import type { HeroDefinition } from '../../../model';
import { PALADIN_ENERGY, PALADIN_MAX_HP_FACTOR, PLAYER_MAX_HP } from '../../tunables';
import { PALADIN } from '../ids';
import { PALADIN_HERO_POWER } from './power';

// Stats are PROVISIONAL and deliberately different from the Mage's (user, 2026-10-09) so heroes can be tested against each other.
// The blurb is the literal placeholder text until the user writes the real one (hero identity is the user's to author).
const PLACEHOLDER_BLURB = 'placeholder blurb';

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
