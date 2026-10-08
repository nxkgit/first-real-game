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
  maxHp: 96,
  movePattern: [attack(11), attack(11), defend(6), attack(20, 'Heavy Attack')],
};

export const ENEMY_B: EnemyDefinition = {
  id: 'enemy-b',
  name: 'Enemy B',
  maxHp: 115,
  placeholderColor: 0x8a6a3c,
  movePattern: [defend(8), attack(17), debuffPlayer('weak', 1), attack(8)],
};

/** Final fight of the run: tougher than the first two. */
export const ENEMY_C: EnemyDefinition = {
  id: 'enemy-c',
  name: 'Enemy C',
  maxHp: 168,
  placeholderColor: 0x7a3f6a,
  movePattern: [attack(14), buffSelf('strength', 2), attack(17, 'Heavy Attack'), defend(10), attack(14)],
};

/** A small enemy that fights alongside another, to exercise multi-enemy fights. */
export const ENEMY_D: EnemyDefinition = {
  id: 'enemy-d',
  name: 'Enemy D',
  maxHp: 48,
  placeholderColor: 0x4f7aa8,
  movePattern: [attack(7), attack(7), defend(5)],
};

// ---- elites and the boss (PLACEHOLDER, larger drawings of the same goblin) ----

/** An enemy move that does two things at once: hits, and puts a status on the player. */
const attackAndDebuff = (value: number, status: 'weak' | 'vulnerable', stacks: number, name: string): EnemyMove => ({
  name,
  effects: [
    { kind: 'damage', value },
    { kind: 'applyStatus', status, value: stacks, to: 'target' },
  ],
});

export const ELITE_A: EnemyDefinition = {
  id: 'elite-a',
  name: 'Elite A',
  maxHp: 204,
  placeholderColor: 0x9a3c3c,
  placeholderScale: 1.25,
  movePattern: [attack(17), buffSelf('strength', 2), attack(22, 'Heavy Attack'), debuffPlayer('vulnerable', 2)],
};

export const ELITE_B: EnemyDefinition = {
  id: 'elite-b',
  name: 'Elite B',
  maxHp: 168,
  placeholderColor: 0x3c6a9a,
  placeholderScale: 1.2,
  movePattern: [attackAndDebuff(11, 'weak', 1, 'Sap'), defend(12), attack(25, 'Heavy Attack')],
};

export const BOSS_A: EnemyDefinition = {
  id: 'boss-a',
  name: 'Boss A',
  maxHp: 360,
  placeholderColor: 0x4a3a5a,
  placeholderScale: 1.5,
  movePattern: [
    attack(20),
    debuffPlayer('weak', 2),
    attack(28, 'Heavy Attack'),
    buffSelf('strength', 2),
    defend(15),
    attackAndDebuff(14, 'vulnerable', 1, 'Crush'),
  ],
};

// ---- registry ----

const ALL_ENEMIES: EnemyDefinition[] = [ENEMY_A, ENEMY_B, ENEMY_C, ENEMY_D, ELITE_A, ELITE_B, BOSS_A];

export const ENEMIES: Readonly<Record<string, EnemyDefinition>> = Object.fromEntries(
  ALL_ENEMIES.map((enemy): [string, EnemyDefinition] => [enemy.id, enemy])
);

if (Object.keys(ENEMIES).length !== ALL_ENEMIES.length) throw new Error('duplicate enemy id in ALL_ENEMIES');

export function getEnemy(id: string): EnemyDefinition {
  const enemy = ENEMIES[id];
  if (!enemy) throw new Error(`unknown enemy id: ${id}`);
  return enemy;
}
