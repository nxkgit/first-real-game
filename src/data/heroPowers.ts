import type { HeroPowerDefinition } from '../game/types';
import { MAGE } from './cards';
import { DRUID } from './druidCards';
import { PALADIN } from './paladinCards';
import { HERO_POWER_ENERGIZED_TURNS } from './tunables';

// PLACEHOLDER content, per CLAUDE.md: a hero power is a once-per-turn active ability, not a card
// (see HeroPowerDefinition). The user's design (2026-10-07): "for the next 2 turns gain 1 extra
// energy at the start of your turn", 1 cost. The name is a placeholder — hero identity/naming is
// the user's to author. All numbers are open to change.
export const MAGE_HERO_POWER: HeroPowerDefinition = {
  id: 'mage-hero-power',
  name: 'Hero Power',
  owner: MAGE,
  cost: 1,
  effects: [{ kind: 'gainEnergizedTurns', value: HERO_POWER_ENERGIZED_TURNS }],
};

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

// PLACEHOLDER (user, 2026-10-13: "a placeholder hero power that just gives 3 block for 1 cost"). Not the Druid's
// real power; the name and effect are the user's to author.
export const DRUID_HERO_POWER: HeroPowerDefinition = {
  id: 'druid-hero-power',
  name: 'Hero Power',
  owner: DRUID,
  cost: 1,
  effects: [{ kind: 'block', value: 3 }],
};
