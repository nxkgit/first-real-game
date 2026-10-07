import type { EnemyDefinition, EnemyMove } from '../game/types';

// PLACEHOLDER enemies. HP/damage numbers and move patterns are rough stand-ins
// to exercise the turn loop, intent telegraphing, and a short run with rising
// difficulty — final design, names, and visuals are the user's to author
// (see CLAUDE.md). Each repeats a fixed move pattern. All reuse the same
// placeholder goblin drawing, told apart only by `placeholderColor`.

const attack = (value: number, name = 'Attack'): EnemyMove => ({ name, effects: [{ kind: 'damage', value }] });
const defend = (value: number): EnemyMove => ({ name: 'Defend', effects: [{ kind: 'block', value }] });
const debuffPlayer = (status: 'weak' | 'vulnerable', value: number): EnemyMove => ({
  name: 'Debuff',
  effects: [{ kind: 'applyStatus', status, value, to: 'target' }],
});
const buffSelf = (status: 'strength', value: number): EnemyMove => ({
  name: 'Buff',
  effects: [{ kind: 'applyStatus', status, value, to: 'self' }],
});

export const ENEMY_A: EnemyDefinition = {
  id: 'enemy-a',
  name: 'Enemy A',
  maxHp: 40,
  movePattern: [attack(8), attack(8), defend(6), attack(14, 'Heavy Attack')],
};

export const ENEMY_B: EnemyDefinition = {
  id: 'enemy-b',
  name: 'Enemy B',
  maxHp: 48,
  placeholderColor: 0x8a6a3c,
  movePattern: [defend(8), attack(12), debuffPlayer('weak', 1), attack(6)],
};

/** Final fight of the run: tougher than the first two. */
export const ENEMY_C: EnemyDefinition = {
  id: 'enemy-c',
  name: 'Enemy C',
  maxHp: 70,
  placeholderColor: 0x7a3f6a,
  movePattern: [attack(10), buffSelf('strength', 2), attack(12, 'Heavy Attack'), defend(10), attack(10)],
};

/** A small enemy that fights alongside another, to exercise multi-enemy fights. */
export const ENEMY_D: EnemyDefinition = {
  id: 'enemy-d',
  name: 'Enemy D',
  maxHp: 20,
  placeholderColor: 0x4f7aa8,
  movePattern: [attack(5), attack(5), defend(5)],
};

// ---- registry ----

const ALL_ENEMIES: EnemyDefinition[] = [ENEMY_A, ENEMY_B, ENEMY_C, ENEMY_D];

export const ENEMIES: Readonly<Record<string, EnemyDefinition>> = Object.fromEntries(
  ALL_ENEMIES.map((enemy): [string, EnemyDefinition] => [enemy.id, enemy])
);

if (Object.keys(ENEMIES).length !== ALL_ENEMIES.length) throw new Error('duplicate enemy id in ALL_ENEMIES');

export function getEnemy(id: string): EnemyDefinition {
  const enemy = ENEMIES[id];
  if (!enemy) throw new Error(`unknown enemy id: ${id}`);
  return enemy;
}
