export type CardType = 'attack' | 'skill' | 'power';

export type Side = 'player' | 'enemy';

export type StatusId = 'weak' | 'vulnerable' | 'strength';

/** Stacks per status currently on one combatant. Absent (or 0) means not affected. */
export type Statuses = Partial<Record<StatusId, number>>;

/**
 * - duration: stacks count down by 1 at the end of the holder's own turn and expire at 0.
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

export type CardEffect =
  | { kind: 'damage'; value: number }
  | { kind: 'block'; value: number }
  | { kind: 'draw'; value: number }
  /** Adds `value` stacks of `status` to the enemy or to yourself. */
  | { kind: 'applyStatus'; status: StatusId; value: number; to: 'enemy' | 'self' };

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  /** 'enemy' cards must be played onto an enemy (drag/click to target); others play on click. */
  target?: 'enemy';
  /** Applied immediately when the card is played. */
  effects?: CardEffect[];
  /** Power cards only: applied at the start of every subsequent player turn for the rest of combat. */
  onTurnStartEffect?: CardEffect;
}

export interface CardInstance {
  instanceId: string;
  definition: CardDefinition;
}

export type EnemyMoveKind = 'attack' | 'defend' | 'applyStatus';

export interface EnemyMove {
  kind: EnemyMoveKind;
  /** Damage for 'attack', block for 'defend', stacks for 'applyStatus'. */
  value: number;
  name: string;
  /** 'applyStatus' only: which status, and whether it lands on the player or on the enemy itself. */
  status?: { id: StatusId; to: 'player' | 'self' };
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
