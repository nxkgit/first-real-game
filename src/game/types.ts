export type CardType = 'attack' | 'skill' | 'power';

/** 'player', or 'enemy-<n>' (the enemy's position in the fight). */
export type CombatantId = string;
export const PLAYER_ID: CombatantId = 'player';

export type StatusId = 'weak' | 'vulnerable' | 'strength' | 'empowered';

/** Stacks per status currently on one combatant. Absent (or 0) means not affected. */
export type Statuses = Partial<Record<StatusId, number>>;

/**
 * - duration: stacks count down by 1 at the end of each round and expire at 0.
 * - intensity: stacks never count down; they add up for the rest of the fight.
 * The three modifier hooks are applied in this order when damage is dealt: the attacker's
 * `outgoingDamageAdd` (all statuses summed), then its `outgoingDamageMult` (all statuses
 * multiplied together), then the target's `incomingDamageMult`; the result is rounded down once at
 * the end. A scaled card value (see `Scaling`) is part of the base, i.e. it comes before all three.
 * `consumedByAttack` marks a status whose multiplier only applies to damage from an attack card, and
 * which loses one stack after each attack card the holder plays (see 'empowered').
 */
export interface StatusDefinition {
  id: StatusId;
  name: string;
  kind: 'duration' | 'intensity';
  describe(stacks: number): string;
  outgoingDamageAdd?(stacks: number): number;
  outgoingDamageMult?(stacks: number): number;
  incomingDamageMult?(stacks: number): number;
  consumedByAttack?: boolean;
  /** Placeholder badge look until statuses get real icons. */
  badge: { symbol: string; color: number };
}

/** Where a scaled value gets its count from. "Earlier" means not counting the card being played. */
export type ScaleSource =
  | 'cardsPlayedThisTurn'
  | 'attacksPlayedThisTurn'
  /** Cards played earlier this turn that carry `Scaling.tag`. */
  | 'taggedPlayedThisTurn'
  /** The player's current block. */
  | 'block'
  /** The player's current Strength. */
  | 'strength'
  /** Cards in the player's hand when the effect resolves (the card being played has already left it). */
  | 'handSize'
  | 'exhaustedThisCombat'
  /** Vulnerable stacks on the effect's target (0 if there is no target). */
  | 'targetVulnerable';

/** The effect's value becomes `value + scaling.value * count(scaling.per)`. */
export interface Scaling {
  per: ScaleSource;
  /** Required when `per` is 'taggedPlayedThisTurn'. */
  tag?: string;
  value: number;
}

/**
 * One thing that happens. Cards and enemy moves are both lists of these, so a new kind of effect
 * works for both (enemies only perform damage, block and applyStatus). "target" is whoever the card
 * was aimed at (an enemy), or for an enemy move, the player; "self" is whoever is playing the card
 * or making the move. For effects fired by a trigger, "target" is the first living enemy.
 * Effects with a numeric `value` can also carry `scaling`.
 */
export type Effect =
  | { kind: 'damage'; value: number; scaling?: Scaling }
  | { kind: 'block'; value: number; scaling?: Scaling }
  /** Player cards only. */
  | { kind: 'draw'; value: number; scaling?: Scaling }
  | { kind: 'applyStatus'; status: StatusId; value: number; to: 'target' | 'self'; scaling?: Scaling }
  /** Player cards only. */
  | { kind: 'gainEnergy'; value: number; scaling?: Scaling }
  /** Player cards only. The player loses HP directly (block does not help). */
  | { kind: 'loseHp'; value: number; scaling?: Scaling }
  /** Multiplies the stacks of a status the holder already has (nothing happens at 0 stacks). */
  | { kind: 'multiplyStatus'; status: StatusId; factor: number; to: 'target' | 'self' }
  /** Player cards only. Exhausts `value` random cards from the hand (fewer if the hand is smaller). */
  | { kind: 'exhaustRandom'; value: number };

/** Things a trigger can react to. */
export type TriggerOn =
  /** A card was played (filter with `cardType` / `tag`). Triggered effects are not card plays. */
  | 'cardPlayed'
  | 'cardExhausted'
  /** The player gained block from an effect. */
  | 'blockGained'
  | 'enemyDied'
  /** The player lost HP, from an enemy hit that got past block or from a loseHp effect. */
  | 'hpLost'
  | 'turnStart'
  /** End of the player's turn, before the hand is discarded. */
  | 'turnEnd';

/** A reactive ability, declared on a power card (active from when it is played) or a relic. */
export interface Trigger {
  on: TriggerOn;
  /** Only for 'cardPlayed': the played card must be of this type. */
  cardType?: CardType;
  /** Only for 'cardPlayed': the played card must carry this tag. */
  tag?: string;
  effects: Effect[];
  /** Fires at most once per player turn (the count resets as your next turn starts). */
  oncePerTurn?: boolean;
}

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
  /** Power cards only: reactive abilities, active from when the card is played to the end of combat. */
  triggers?: Trigger[];
  /** Neutral labels that filters and scaling can look at (e.g. 'tag-a'). Only a mechanism. */
  tags?: string[];
  /** The card leaves the deck for the rest of this combat after it is played. */
  exhaust?: boolean;
  /**
   * What changes when the card is upgraded (at a rest stop). Leave it out and the card can't be
   * upgraded. The upgraded card is generated from this and registered as `<id>+` (see data/cards.ts).
   */
  upgrade?: {
    cost?: number;
    effects?: Effect[];
    onTurnStartEffect?: Effect;
    triggers?: Trigger[];
    tags?: string[];
    exhaust?: boolean;
    description?: string;
  };
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
  /** Reactive abilities, active for the whole fight (same type as on power cards). */
  triggers?: Trigger[];
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
