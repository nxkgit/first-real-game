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
  /**
   * What changes when the card is upgraded (at a rest stop). Leave it out and the card can't be
   * upgraded. The upgraded card is generated from this and registered as `<id>+` (see data/cards.ts).
   */
  upgrade?: { cost?: number; effects?: Effect[]; onTurnStartEffect?: Effect; description?: string };
  /** Set on a generated upgraded card: the id of the card it was upgraded from. */
  upgradeOf?: string;
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
  /** Size of the shared placeholder drawing (1 = normal), so elites and bosses can stand out. */
  placeholderScale?: number;
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

// ---- relics ----

/** Something a relic (or an event) does to the run itself, outside a fight. */
export type RunEffect =
  | { kind: 'maxHp'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'gold'; value: number };

/** A permanent item for the rest of the run. */
export interface RelicDefinition {
  id: string;
  name: string;
  /** Text override. Leave it out: the text is generated from the effects (see describe.ts). */
  description?: string;
  /** When picked up. */
  onPickup?: RunEffect[];
  /** After every fight you win. */
  onVictory?: RunEffect[];
  /** On you, as each fight starts. Same effects as cards (a status, block, a draw). */
  onCombatStart?: Effect[];
  /** On you, at the start of every one of your turns. */
  onTurnStart?: Effect[];
}

// ---- events ----

export type EventOutcome =
  /** Negative loses gold (never below 0). */
  | { kind: 'gold'; value: number }
  /** Negative loses HP (never below 1). */
  | { kind: 'hp'; value: number }
  | { kind: 'maxHp'; value: number }
  | { kind: 'card'; cardId: string }
  /** A random card from the reward pool. */
  | { kind: 'randomCard' }
  /** A random relic you don't have yet. */
  | { kind: 'relic' }
  /** Fight these enemies (by id) now; the usual reward follows a win. */
  | { kind: 'fight'; enemies: string[] };

export interface EventChoice {
  label: string;
  outcomes: EventOutcome[];
}

/** A non-combat stop: some text and a few choices. */
export interface EventDefinition {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}
