import type { HeroPowerDefinition } from '../../../model';
import { DRUID } from '../ids';

// PLACEHOLDER (user, 2026-10-13: "a placeholder hero power that just gives 3 block for 1 cost"). Not the Druid's
// real power; the name and effect are the user's to author.
export const DRUID_HERO_POWER: HeroPowerDefinition = {
  id: 'druid-hero-power',
  name: 'Hero Power',
  owner: DRUID,
  cost: 1,
  effects: [{ kind: 'block', value: 3 }],
};
