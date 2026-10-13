import type { EnemyDefinition } from './enemy';
import type { Statuses } from './status';

/** 'player', or 'enemy-<n>' (the enemy's position in the fight). */
export type CombatantId = string;

export const PLAYER_ID: CombatantId = 'player';

/** What the player or an enemy has in a fight. */
export interface Combatant {
  id: CombatantId;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Statuses;
}

export interface EnemyState extends Combatant {
  definition: EnemyDefinition;
  /** Which move of the pattern is next. */
  moveIndex: number;
  /** Turns of Freeze-stun still owed (see CombatState's freeze-stack-threshold check). Each one
   *  skips a whole move without advancing moveIndex, so the same intended move happens once it wears off. */
  stunnedTurns?: number;
}
