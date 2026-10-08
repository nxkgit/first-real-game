import type { CardType, Effect, EventOutcome, RunEffect, ScaleSource, StatusId, TriggerOn } from '../game/types';

// The vocabulary a content author can use, as data. Each table is a Record keyed by the union from
// game/types.ts, so adding a member to a union without adding it here is a COMPILE error. The
// content check (validate.ts) reads these tables, and a test (guide.test.ts) fails if
// docs/CONTENT_GUIDE.md stops listing exactly these names.

export interface EffectKindInfo {
  /** Can carry a `scaling` block. */
  scales: boolean;
  /** Does anything when an enemy move uses it (enemies only perform these). */
  enemyMove: boolean;
  /** Shows an icon in the enemy's intent. */
  intentIcon: boolean;
  /** Takes a numeric `value` (multiplyStatus uses `factor`). */
  hasValue: boolean;
  summary: string;
}

export const EFFECT_KINDS: Record<Effect['kind'], EffectKindInfo> = {
  damage: { scales: true, enemyMove: true, intentIcon: true, hasValue: true, summary: 'Deal damage to the target (needs target: "enemy" on a card).' },
  block: { scales: true, enemyMove: true, intentIcon: true, hasValue: true, summary: 'Gain block.' },
  draw: { scales: true, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Draw cards. Player only.' },
  applyStatus: { scales: true, enemyMove: true, intentIcon: true, hasValue: true, summary: 'Add stacks of a status to the target or to self.' },
  gainEnergy: { scales: true, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Gain energy this turn. Player only.' },
  loseHp: { scales: true, enemyMove: false, intentIcon: false, hasValue: true, summary: 'The player loses HP directly; block does not help. Player only.' },
  multiplyStatus: { scales: false, enemyMove: false, intentIcon: false, hasValue: false, summary: 'Multiply the stacks of a status already present (nothing at 0 stacks).' },
  exhaustRandom: { scales: false, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Exhaust random cards from the hand. Player only.' },
  discardRandom: { scales: false, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Discard random cards from the hand (they can be reshuffled, unlike exhaust). Player only.' },
  damageAll: { scales: true, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Deal damage to every living enemy. Player only; no `target: "enemy"` needed.' },
  adjustTemperature: { scales: false, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Mage only: shift Temperature (negative cools down), clamped to its range. Player only.' },
  addCardToHand: { scales: true, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Put copies of a specific card (`cardId`) straight into the hand. Player only.' },
  gainEnergizedTurns: { scales: false, enemyMove: false, intentIcon: false, hasValue: true, summary: 'Gain 1 extra energy at the start of your turn for that many turns (not counting this one). Player only.' },
};

export const SCALE_SOURCES: Record<ScaleSource, string> = {
  cardsPlayedThisTurn: 'Cards played earlier this turn.',
  attacksPlayedThisTurn: 'Attack cards played earlier this turn.',
  taggedPlayedThisTurn: 'Cards with the given `tag` played earlier this turn (`tag` is required).',
  block: 'Your current block.',
  strength: 'Your current Strength.',
  handSize: 'Cards in your hand when the effect resolves.',
  exhaustedThisCombat: 'Cards exhausted so far this fight.',
  targetVulnerable: 'Vulnerable stacks on the target.',
  targetFreeze: 'Mage only: Freeze stacks on the target.',
  temperature: 'Mage only: the current Temperature.',
};

export const TRIGGER_EVENTS: Record<TriggerOn, string> = {
  cardPlayed: 'A card was played (filter with `cardType` and/or `tag`).',
  cardExhausted: 'A card was exhausted.',
  blockGained: 'You gained block from an effect.',
  enemyDied: 'An enemy died.',
  hpLost: 'You lost HP (an enemy hit past your block, or a loseHp effect).',
  turnStart: 'Your turn started (after the draw).',
  turnEnd: 'Your turn is ending (before the hand is discarded).',
};

export const STATUS_IDS: Record<StatusId, string> = {
  weak: 'Duration. The holder deals less attack damage.',
  vulnerable: 'Duration. The holder takes more attack damage.',
  strength: "Intensity. The holder's attacks deal N more damage for the whole fight.",
  empowered: 'Intensity. The next attack card(s) deal a damage multiple; one stack used per attack card.',
  freeze: 'Intensity, Mage only. Never counts down on its own; every FREEZE_STUN_THRESHOLD stacks stuns the holder for one move and removes those stacks.',
};

export const CARD_TYPES: Record<CardType, string> = {
  attack: 'Usually aimed at an enemy.',
  skill: 'Plays on click.',
  power: 'Stays in play for the fight; may have triggers or a turn-start effect.',
};

export const RUN_EFFECT_KINDS: Record<RunEffect['kind'], string> = {
  maxHp: 'Raise (or lower) max HP; raising also heals that much.',
  heal: 'Heal HP.',
  gold: 'Gain gold.',
};

export const EVENT_OUTCOME_KINDS: Record<EventOutcome['kind'], string> = {
  gold: 'Gain gold; negative loses gold (never below 0).',
  hp: 'Heal; negative loses HP (never below 1).',
  maxHp: 'Change max HP.',
  card: 'Add a specific card (`cardId`) to the deck.',
  randomCard: 'Add a random card from the reward pool.',
  relic: 'Gain a random relic you do not have yet.',
  fight: 'Fight the listed enemy ids; the usual reward follows a win.',
};
