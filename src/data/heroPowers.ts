import type { HeroPowerDefinition } from '../game/types';
import { MAGE } from './cards';
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
