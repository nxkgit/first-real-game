export type CardType = 'attack' | 'skill' | 'power';

/** 'player', or 'enemy-<n>' (the enemy's position in the fight). */
export type CombatantId = string;
export const PLAYER_ID: CombatantId = 'player';

/** 'freeze' is unique to the Mage: stacks never count down, and every FREEZE_STUN_THRESHOLD stacks
 *  stuns the holder for its next move (see CombatState). 'frail', 'intangible' and 'buffer' are
 *  generic StS-style keyword statuses (engine-only for now: no real card uses them yet, see
 *  src/data/keywordCards.ts and implementationplan.md). 'ignite' is Heating Up's real mechanic
 *  (Mage-only, placeholder name): each attack played this turn deals 2x the damage of the one
 *  before it; see StatusDefinition.clearAtTurnEnd and DESIGN_LOG.md. */
export type StatusId = 'weak' | 'vulnerable' | 'strength' | 'empowered' | 'freeze' | 'frail' | 'intangible' | 'buffer' | 'ignite';

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
/** Extra context `outgoingDamageMult` hooks may read, beyond their own stack count. Room to grow. */
export interface DamageMultContext {
  /** Attack cards played earlier this turn (not the one currently resolving) — see `ignite`. */
  attacksPlayedThisTurn: number;
}

export interface StatusDefinition {
  id: StatusId;
  name: string;
  kind: 'duration' | 'intensity';
  describe(stacks: number): string;
  outgoingDamageAdd?(stacks: number): number;
  outgoingDamageMult?(stacks: number, ctx: DamageMultContext): number;
  incomingDamageMult?(stacks: number): number;
  /** Multiplies block the holder gains (Frail). Applied the same way as the damage-mult stage,
   *  in CombatState.calcBlock. */
  blockMult?(stacks: number): number;
  /** Caps all damage the holder takes at this amount, applied last, after every other damage
   *  modifier (Intangible). The lowest active cap wins if more than one status has one. */
  incomingDamageCap?(stacks: number): number;
  consumedByAttack?: boolean;
  /** Removed entirely (not decremented) at the same end-of-round point `duration` stacks tick down,
   *  regardless of `kind` — "lasts only until the end of the turn it was granted" (ignite). Unlike
   *  `duration`, this never partially counts down: it's gone, all at once, one round after being applied. */
  clearAtTurnEnd?: boolean;
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
  | 'targetVulnerable'
  /** Freeze stacks on the effect's target (0 if there is no target). Mage-only mechanic. */
  | 'targetFreeze'
  /** The Mage's current Temperature (-5..5; see CombatState.temperature). Mage-only mechanic. */
  | 'temperature';

/** The effect's value becomes `value + scaling.value * count(scaling.per)`. */
export interface Scaling {
  per: ScaleSource;
  /** Required when `per` is 'taggedPlayedThisTurn'. */
  tag?: string;
  value: number;
}

/**
 * One thing that happens. Cards and enemy moves are both lists of these, so a new kind of effect
 * works for both (enemies only perform the kinds whose registry entry has `resolveEnemy`: damage,
 * block and applyStatus). Each kind's rules, text, intent and scaling live in one entry of the
 * effect registry (effects.ts). "target" is whoever the card
 * was aimed at (an enemy), or for an enemy move, the player; "self" is whoever is playing the card
 * or making the move. For effects fired by a trigger, "target" is the first living enemy.
 * Effects with a numeric `value` can also carry `scaling`.
 */
export type Effect =
  /** `vsFreezeMult`, if set, multiplies the damage when the target currently has any Freeze stacks
   *  (Mage-only; e.g. Glaciate). */
  | { kind: 'damage'; value: number; scaling?: Scaling; vsFreezeMult?: number }
  | { kind: 'block'; value: number; scaling?: Scaling }
  /** Player cards only. Hits every living enemy for `value` (each scaled against its own target, e.g. targetVulnerable). */
  | { kind: 'damageAll'; value: number; scaling?: Scaling }
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
  | { kind: 'exhaustRandom'; value: number }
  /** Player cards only. Discards `value` random cards from the hand (back to the discard pile, unlike exhaust). */
  | { kind: 'discardRandom'; value: number }
  /** Player cards only, Mage-only mechanic. Shifts Temperature by `value` (negative cools down), clamped. */
  | { kind: 'adjustTemperature'; value: number }
  /** Player cards only, Mage-only mechanic. Puts `value` more copies of `cardId` straight into the hand
   *  (overflow goes to the discard pile, as with a draw into a full hand). */
  | { kind: 'addCardToHand'; cardId: string; value: number; scaling?: Scaling }
  /** Player cards (and hero powers) only. For the next `value` of the player's turns (this one not
   *  counted), gain 1 extra energy at the start of the turn. Stacks additively with itself. */
  | { kind: 'gainEnergizedTurns'; value: number };

/** Every effect kind. Each one has exactly one entry in the effect registry (effects.ts). */
export type EffectKind = Effect['kind'];

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

/**
 * Placeholder rarity tiers (data-model scaffolding only, added 2026-10-08 — see DESIGN_LOG.md
 * "Starter deck draft"). No reward-pool weighting logic reads this yet; names are placeholders,
 * easy to rename once a real rarity pass happens.
 */
export type RarityTier = 'common' | 'uncommon' | 'rare';

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  /** Who owns the card: a hero's id, or 'neutral' for cards any hero can use. */
  owner: string;
  /** Whether it can show up as a reward / in a shop. Starter-only cards leave this false. */
  inRewardPool: boolean;
  /** Whether it can be offered during the pre-run starter-deck draft (see data/cards.ts's `starterPoolFor`). */
  inStarterPool?: boolean;
  /**
   * Hero-scoped sub-class label (e.g. the Mage's 'frost'/'fire'; see docs/classbrainstorming.md for
   * the full per-hero list). Scaffolding only, added 2026-10-08 (DESIGN_LOG.md "Starter deck draft"):
   * purely descriptive for now, a design convention for content authoring. Nothing in the engine
   * reads this yet.
   */
  archetype?: string;
  /**
   * Placeholder rarity tier (scaffolding only, added 2026-10-08 — see `RarityTier` below). Nothing
   * reads this yet; no reward-odds weighting is built. Still deferred, per implementationplan.md.
   */
  rarity?: RarityTier;
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
  /** StS-style keyword (engine-only for now, see src/data/keywordCards.ts): always starts in the
   *  opening hand of combat, never subject to the shuffle. Deck's constructor only; a mid-fight
   *  reshuffle of the discard pile does not re-apply this. */
  innate?: boolean;
  /** StS-style keyword: survives the end-of-turn discard, staying in hand into the next turn. */
  retain?: boolean;
  /** StS-style keyword: if still in hand at end of turn, exhausts instead of discarding (wins over `retain`). */
  ethereal?: boolean;
  /** StS-style keyword: can never be played (StS uses this for Status/Curse cards). */
  unplayable?: boolean;
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
    innate?: boolean;
    retain?: boolean;
    ethereal?: boolean;
    unplayable?: boolean;
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
  /** Turns of Freeze-stun still owed (see CombatState's freeze-stack-threshold check). Each one
   *  skips a whole move without advancing moveIndex, so the same intended move happens once it wears off. */
  stunnedTurns?: number;
}

/**
 * A hero's once-per-turn active ability: not a card (never drawn, discarded or exhausted), just a
 * fixed button the player can use once per their turn for its energy cost. See CombatState.useHeroPower.
 */
export interface HeroPowerDefinition {
  id: string;
  name: string;
  cost: number;
  owner: string;
  /** Text override; otherwise generated from `effects` like a card (see describe.ts). */
  description?: string;
  effects: Effect[];
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
