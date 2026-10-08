import { RunState } from '../game/RunState';
import type { RunWorld } from '../game/RunState';
import { generateActMap } from '../game/actMap';
import type { MapContent } from '../game/actMap';
import { Rng, randomSeed } from '../game/rng';
import { restoreRun } from '../game/save';
import { MAGE, buildStarterDeck, getCard, rewardPoolFor, starterPoolFor } from './cards';
import { getEnemy } from './enemies';
import { EVENTS, getEvent } from './events';
import { RELIC_POOL, getRelic } from './relics';

// PLACEHOLDER act: which fights, elites, boss and events fill the map. The lists are rough
// stand-ins to build the shape of an act (a map of fights, elites, rests, shops and events leading
// to a boss); real encounter design is the user's. Each fight is a list of enemy ids.
export const ACT_CONTENT: MapContent = {
  earlyEncounters: [['enemy-a'], ['enemy-d', 'enemy-d'], ['enemy-b']],
  encounters: [['enemy-b', 'enemy-d'], ['enemy-c'], ['enemy-a', 'enemy-d'], ['enemy-d', 'enemy-d', 'enemy-d'], ['enemy-a', 'enemy-b']],
  // upper floors: PLACEHOLDER mixes for variety only (not tuned for difficulty)
  lateEncounters: [['enemy-c', 'enemy-d'], ['enemy-b', 'enemy-d', 'enemy-d'], ['enemy-a', 'enemy-b', 'enemy-d'], ['enemy-b', 'enemy-c']],
  elites: [['elite-a'], ['elite-b']],
  bosses: [['boss-a']],
  events: Object.keys(EVENTS),
};

/** Everything a run draws from and looks things up in. */
export const RUN_WORLD: RunWorld = {
  rewardPool: rewardPoolFor(MAGE),
  starterPool: starterPoolFor(MAGE),
  relicPool: RELIC_POOL,
  card: getCard,
  relic: getRelic,
  enemy: getEnemy,
  event: getEvent,
};

/**
 * A fresh run: a newly made map, and an empty deck to be filled by the starter-deck draft (see
 * DESIGN_LOG.md "Starter deck draft", 2026-10-08 — replaces the old fixed `buildStarterDeck()`,
 * which still exists for the simulator/balance tooling's reference decks). The same seed always
 * gives the same map; the draft itself is driven by player picks made afterward, each one consuming
 * the next step of the same seeded stream, same as reward rolls mid-run.
 */
export function newRun(seed: number = randomSeed()): RunState {
  const rng = new Rng(seed);
  const map = generateActMap(rng, ACT_CONTENT);
  const run = new RunState(map, [], RUN_WORLD, rng);
  run.phase = 'draft';
  return run;
}

/**
 * Convenience for the simulator and tests that don't care about the starter-deck draft itself:
 * a fresh run with the draft already completed using the simulator's reference starter deck
 * (`buildStarterDeck()`, unchanged — still the balance toolkit's baseline). Doesn't touch the rng
 * stream (see `RunState.skipDraftWith`), so every other random draw lines up exactly as it did
 * before the draft mechanic existed. The live game always uses `newRun` and the real draft UI.
 */
export function newPlayableRun(seed: number = randomSeed()): RunState {
  const run = newRun(seed);
  run.skipDraftWith(buildStarterDeck());
  return run;
}

/** Rebuilds a stored run, or null if the data is unusable (see game/save.ts). */
export function restoreSavedRun(raw: unknown): RunState | null {
  return restoreRun(raw, RUN_WORLD);
}
