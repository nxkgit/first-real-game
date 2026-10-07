import type { EnemyDefinition } from '../game/types';

// PLACEHOLDER enemy for MVP 1. HP/damage numbers and the move pattern are
// rough stand-ins to exercise the turn loop and intent telegraphing — final
// design and visuals are the user's to author (see CLAUDE.md). Repeats a
// fixed 4-move pattern so the player sees varied, telegraphed intents.
export const MVP1_ENEMY: EnemyDefinition = {
  id: 'mvp1-enemy',
  name: 'Enemy',
  maxHp: 40,
  movePattern: [
    { kind: 'attack', value: 8, name: 'Attack' },
    { kind: 'attack', value: 8, name: 'Attack' },
    { kind: 'defend', value: 6, name: 'Defend' },
    { kind: 'attack', value: 14, name: 'Heavy Attack' },
  ],
};
