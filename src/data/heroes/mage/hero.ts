import type { HeroDefinition } from '../../../model';
import { MAX_ENERGY, PLAYER_MAX_HP } from '../../tunables';
import { MAGE } from '../ids';
import { MAGE_HERO_POWER } from './power';

// The blurb is the literal placeholder text until the user writes the real one (hero identity is the user's to author).
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
