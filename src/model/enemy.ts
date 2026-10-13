import type { Effect } from './effect';

export interface EnemyMove {
  name: string;
  effects: Effect[];
}

export interface EnemyDefinition {
  id: string;
  name: string;
  maxHp: number;
  /** Body color for the shared placeholder enemy drawing, until enemies get real visuals. */
  placeholderColor?: number;
  /** Size of the shared placeholder drawing (1 = normal), so elites and bosses can stand out. */
  placeholderScale?: number;
  /** Fixed repeating sequence of moves. Index wraps around. */
  movePattern: EnemyMove[];
}
