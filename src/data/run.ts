import { RunState } from '../game/RunState';
import type { RunWorld } from '../game/RunState';
import { generateActMap } from '../game/actMap';
import type { MapContent } from '../game/actMap';
import { Rng, randomSeed } from '../game/rng';
import { restoreRun } from '../game/save';
import { MAGE, buildStarterDeck, getCard, rewardPoolFor } from './cards';
import { getEnemy } from './enemies';
import { EVENTS, getEvent } from './events';
import { RELIC_POOL, getRelic } from './relics';

// PLACEHOLDER act: which fights, elites, boss and events fill the map. The lists are rough
// stand-ins to build the shape of an act (a map of fights, elites, rests, shops and events leading
// to a boss); real encounter design is the user's. Each fight is a list of enemy ids.
export const ACT_CONTENT: MapContent = {
  earlyEncounters: [['enemy-a'], ['enemy-d', 'enemy-d']],
  encounters: [['enemy-b', 'enemy-d'], ['enemy-c'], ['enemy-a', 'enemy-d'], ['enemy-d', 'enemy-d', 'enemy-d']],
  elites: [['elite-a'], ['elite-b']],
  bosses: [['boss-a']],
  events: Object.keys(EVENTS),
};

/** Everything a run draws from and looks things up in. */
export const RUN_WORLD: RunWorld = {
  rewardPool: rewardPoolFor(MAGE),
  relicPool: RELIC_POOL,
  card: getCard,
  relic: getRelic,
  enemy: getEnemy,
  event: getEvent,
};

/** A fresh run: a newly made map and the starter deck. The same seed always gives the same everything. */
export function newRun(seed: number = randomSeed()): RunState {
  const rng = new Rng(seed);
  const map = generateActMap(rng, ACT_CONTENT);
  return new RunState(map, buildStarterDeck(), RUN_WORLD, rng);
}

/** Rebuilds a stored run, or null if the data is unusable (see game/save.ts). */
export function restoreSavedRun(raw: unknown): RunState | null {
  return restoreRun(raw, RUN_WORLD);
}
