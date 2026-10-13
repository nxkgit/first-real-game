import type { HeroPowerDefinition } from '../../../model';
import { PALADIN } from '../ids';

// PLACEHOLDER (user, 2026-10-09: "a marked placeholder that draws 1 card for 1 energy"). Not the
// Paladin's real power; the name and effect are the user's to author. Radiant Light is the Paladin's
// resource, a separate thing.
export const PALADIN_HERO_POWER: HeroPowerDefinition = {
  id: 'paladin-hero-power',
  name: 'Hero Power',
  owner: PALADIN,
  cost: 1,
  effects: [{ kind: 'draw', value: 1 }],
};
