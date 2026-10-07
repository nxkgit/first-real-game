export type CardType = 'attack' | 'skill' | 'power';

export type EffectKind = 'damage' | 'block' | 'draw';

export interface CardEffect {
  kind: EffectKind;
  value: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  /** Applied immediately when the card is played. */
  effects?: CardEffect[];
  /** Power cards only: applied at the start of every subsequent player turn for the rest of combat. */
  onTurnStartEffect?: CardEffect;
}

export interface CardInstance {
  instanceId: string;
  definition: CardDefinition;
}

export type EnemyMoveKind = 'attack' | 'defend';

export interface EnemyMove {
  kind: EnemyMoveKind;
  value: number;
  name: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  maxHp: number;
  /** Fixed repeating sequence of moves. Index wraps around. */
  movePattern: EnemyMove[];
}
