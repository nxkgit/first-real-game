import type { HeroDefinition } from '../../../model';
import { MAX_ENERGY, PLAYER_MAX_HP } from '../../tunables';
import { DRUID } from '../ids';
import { DRUID_HERO_POWER } from './power';

// The blurb is the literal placeholder text until the user writes the real one (hero identity is the user's to author).
const PLACEHOLDER_BLURB = 'placeholder blurb';

// Name given by the user (2026-10-13); the blurb is still placeholder text. Mage numbers (user: "default to mage numbers").
export const DRUID_HERO: HeroDefinition = {
  id: DRUID,
  name: 'Keeper of the Wild',
  maxHp: PLAYER_MAX_HP,
  energy: MAX_ENERGY,
  heroPower: DRUID_HERO_POWER,
  blurb: PLACEHOLDER_BLURB,
  placeholderColor: 0x4f9a4f,
};
