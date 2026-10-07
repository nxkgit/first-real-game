import type { EnemyDefinition } from '../game/types';

// PLACEHOLDER enemies. HP/damage numbers and move patterns are rough stand-ins
// to exercise the turn loop, intent telegraphing, and (MVP 2) a short run with
// rising difficulty — final design, names, and visuals are the user's to author
// (see CLAUDE.md). Each repeats a fixed move pattern. All three currently reuse
// the same placeholder goblin drawing, told apart only by `placeholderColor`.

export const ENEMY_A: EnemyDefinition = {
  id: 'enemy-a',
  name: 'Enemy A',
  maxHp: 40,
  movePattern: [
    { kind: 'attack', value: 8, name: 'Attack' },
    { kind: 'attack', value: 8, name: 'Attack' },
    { kind: 'defend', value: 6, name: 'Defend' },
    { kind: 'attack', value: 14, name: 'Heavy Attack' },
  ],
};

export const ENEMY_B: EnemyDefinition = {
  id: 'enemy-b',
  name: 'Enemy B',
  maxHp: 48,
  placeholderColor: 0x8a6a3c,
  movePattern: [
    { kind: 'defend', value: 8, name: 'Defend' },
    { kind: 'attack', value: 12, name: 'Attack' },
    { kind: 'attack', value: 6, name: 'Attack' },
  ],
};

/** Final fight of the MVP 2 run: tougher than the first two. */
export const ENEMY_C: EnemyDefinition = {
  id: 'enemy-c',
  name: 'Enemy C',
  maxHp: 70,
  placeholderColor: 0x7a3f6a,
  movePattern: [
    { kind: 'attack', value: 10, name: 'Attack' },
    { kind: 'defend', value: 10, name: 'Defend' },
    { kind: 'attack', value: 16, name: 'Heavy Attack' },
    { kind: 'attack', value: 10, name: 'Attack' },
  ],
};
