export type CardType = 'attack' | 'skill' | 'power';

/** 'player', or 'enemy-<n>' (the enemy's position in the fight). */
export type CombatantId = string;
export const PLAYER_ID: CombatantId = 'player';

export type StatusId = 'weak' | 'vulnerable' | 'strength';

/** Stacks per status currently on one combatant. Absent (or 0) means not affected. */
export type Statuses = Partial<Record<StatusId, number>>;

/**
 * - duration: stacks count down by 1 at the end of each round and expire at 0.
 * - intensity: stacks never count down; they add up for the rest of the fight.
 * The three modifier hooks are applied in this order when damage is dealt: the attacker's
 * `outgoingDamageAdd`, then its `outgoingDamageMult`, then the target's `incomingDamageMult`.
 */
export interface StatusDefinition {
  id: StatusId;
  name: string;
  kind: 'duration' | 'intensity';
  describe(stacks: number): string;
  outgoingDamageAdd?(stacks: number): number;
  outgoingDamageMult?(stacks: number): number;
  incomingDamageMult?(stacks: number): number;
  /** Placeholder badge look until statuses get real icons. */
  badge: { symbol: string; color: number };
}

/**
 * One thing that happens. Cards and enemy moves are both lists of these, so a new kind of effect
 * works for both. "target" is whoever the card was aimed at (an enemy), or for an enemy move,
 * the player; "self" is whoever is playing the card or making the move.
 */
export type Effect =
  | { kind: 'damage'; value: number }
  | { kind: 'block'; value: number }
  /** Player cards only. */
  | { kind: 'draw'; value: number }
  | { kind: 'applyStatus'; status: StatusId; value: number; to: 'target' | 'self' };

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  /** Who owns the card: a hero's id, or 'neutral' for cards any hero can use. */
  owner: string;
  /** Whether it can show up as a reward / in a shop. Starter-only cards leave this false. */
  inRewardPool: boolean;
  /** Text override. Leave it out: the text is generated from `effects` (see describe.ts). */
  description?: string;
  /** 'enemy' cards must be played onto an enemy (drag/click to target); others play on click. */
  target?: 'enemy';
  /** Applied immediately when the card is played. */
  effects?: Effect[];
  /** Power cards only: applied at the start of every subsequent player turn for the rest of combat. */
  onTurnStartEffect?: Effect;
}

export interface CardInstance {
  instanceId: string;
  definition: CardDefinition;
}

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
  /** Fixed repeating sequence of moves. Index wraps around. */
  movePattern: EnemyMove[];
}

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
}
