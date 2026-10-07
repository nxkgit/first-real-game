import type { RunNode } from '../game/RunState';
import { RunState } from '../game/RunState';
import { MAGE, buildStarterDeck, rewardPoolFor } from './cards';
import { ENEMY_A, ENEMY_B, ENEMY_C, ENEMY_D } from './enemies';

// PLACEHOLDER MVP 2 path: a short fixed line of fights with one rest stop before
// the final, tougher fight. Map structure, elites, and bosses are still deferred
// (implementationplan.md) — this is just enough sequence to test fights chaining
// with HP/deck carrying over and the card-vs-gold reward.
export function buildRunPath(): RunNode[] {
  return [
    { kind: 'combat', enemies: [ENEMY_A] },
    { kind: 'combat', enemies: [ENEMY_B, ENEMY_D] }, // two enemies, to exercise multi-enemy fights
    { kind: 'shop' }, // DRAFT stop, added for a visual
    { kind: 'rest' },
    { kind: 'combat', enemies: [ENEMY_C] },
  ];
}

export function newRun(): RunState {
  return new RunState(buildRunPath(), buildStarterDeck(), rewardPoolFor(MAGE));
}
