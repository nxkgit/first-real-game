// All balance numbers in one place (see CLAUDE.md, "Centralized tunables").
// Every value here is a PROVISIONAL placeholder, expected to change once playtesting
// starts. Card and enemy numbers live with their definitions in cards.ts / enemies.ts.

// ---- combat ----
export const MAX_ENERGY = 4;
export const HAND_SIZE = 5;
/** Most cards the hand can hold. A card drawn into a full hand goes straight to the discard pile (as in StS). PROVISIONAL. */
export const MAX_HAND_SIZE = 10;

/**
 * How many levels deep triggered effects may set off further triggers (a trigger's effect gaining
 * block that fires a block trigger, and so on). Beyond this depth the event is simply ignored, so a
 * badly written pair of triggers can't loop forever. PROVISIONAL.
 */
export const MAX_TRIGGER_DEPTH = 3;

// ---- statuses ----
/** Empowered: the holder's next attack card deals this multiple of its damage (one stack per attack). */
export const EMPOWERED_DAMAGE_MULT = 2;
/** Weak: the holder's attacks deal this fraction of their damage. */
export const WEAK_DAMAGE_MULT = 0.75;
/** Vulnerable: the holder takes this multiple of attack damage. */
export const VULNERABLE_DAMAGE_MULT = 1.5;
/** Freeze (Mage-only): every this many stacks, the holder is stunned for one move and loses the stacks. PROVISIONAL. */
export const FREEZE_STUN_THRESHOLD = 5;
/** Frail (generic keyword status, engine-only for now): the holder gains this fraction of the block it would. Mirrors WEAK_DAMAGE_MULT's value. */
export const FRAIL_BLOCK_MULT = 0.75;
/** Intangible (generic keyword status, engine-only for now): all damage the holder takes is capped at this amount. */
export const INTANGIBLE_DAMAGE_CAP = 1;

// ---- Mage: Temperature (name, range and thresholds are all PROVISIONAL placeholders) ----
export const TEMPERATURE_MIN = -5;
export const TEMPERATURE_MAX = 5;
/** How many turns the Mage's hero power's extra energy lasts. PROVISIONAL. */
export const HERO_POWER_ENERGIZED_TURNS = 2;

// ---- starter deck draft (see DESIGN_LOG.md "Starter deck draft", 2026-10-08) ----
/** How many cards the pre-run draft produces; matches the prior fixed starter deck's size. */
export const STARTER_DECK_SIZE = 10;
/** Cards offered per draft round (reuses the reward screen's 1-of-3 pattern). */
export const STARTER_DRAFT_OFFER_SIZE = 3;

// ---- run ----
export const PLAYER_MAX_HP = 60;
/** Fraction of max HP restored at a rest stop. */
export const REST_HEAL_FRACTION = 0.3;
/** How many cards the post-combat reward offers to pick from. */
export const REWARD_CARD_CHOICES = 3;
/**
 * How much more likely a hero's own card is to be offered than a neutral one when rolling card
 * rewards and shop stock (user, 2026-10-08: 1.5:1 in favour of Mage cards). 1 = no preference.
 */
export const HERO_CARD_WEIGHT = 1.5;
/**
 * Gold offered instead of a card after a win. Open question (implementationplan.md): gold
 * must end up a genuine toss-up against the card, which can't be tuned until a shop exists.
 */
export const REWARD_GOLD = 25;
/** Gold offered after winning against an elite (which also drops a relic). */
export const ELITE_REWARD_GOLD = 40;

// ---- music ----
/** How long the background music takes to fade in when it first starts, in milliseconds. PROVISIONAL (about 2 s asked for). */
export const MUSIC_FADE_IN_MS = 2000;

// ---- shop (DRAFT: visual placeholder, nothing here is a decision) ----
/** Cards for sale at a shop stop. */
export const SHOP_CARD_COUNT = 4;
/** Flat placeholder price per card. Real pricing (by cost? by rarity?) is the user's call. */
export const SHOP_CARD_PRICE = 40;

// ---- the act's map (all PROVISIONAL) ----
/** Columns the map is drawn across. */
export const MAP_LANES = 5;
/** Floors before the boss. The boss is one more floor on top. */
export const MAP_FLOORS = 12;
/** How many separate climbs are drawn from the bottom to the boss; where they overlap, stops are shared. */
export const MAP_PATHS = 4;
/** Relative chance of each kind of stop (elites, rests and shops are further limited by the floor rules below). */
export const MAP_KIND_WEIGHTS = { combat: 55, event: 22, elite: 8, rest: 10, shop: 5 } as const;
/** First floor (0 = the bottom one) where each kind of stop may appear. The top floor before the boss is always a rest. */
export const MAP_FIRST_FLOOR = { event: 1, shop: 3, elite: 4, rest: 4 } as const;
/** Floors up to and including this one use the easier list of fights. */
export const MAP_EARLY_FLOORS = 2;
/** First floor that uses the late list of fights (a harder mix than the middle floors). PROVISIONAL. */
export const MAP_LATE_FLOORS_FROM = 8;
/**
 * Route themes: each climb on the map gets one theme, which multiplies the chance of each kind of
 * stop on that climb, so choosing a path is choosing an experience. A stop shared by several climbs
 * takes the theme of one of them at random. The multipliers are PROVISIONAL map-feel dials, not balance.
 */
export const MAP_ROUTE_THEMES = {
  risky: { elite: 8, event: 1, rest: 0.6, shop: 0.5, combat: 1 },
  events: { event: 3, combat: 0.6, elite: 0.5 },
  safe: { rest: 3, shop: 3, combat: 0.7, elite: 0.1 },
  fights: { combat: 1.5, event: 0.5, rest: 0.7, shop: 0.5, elite: 1 },
} as const;
/** The map always has at least this many elite stops (the generator turns fights into elites if it rolled fewer). */
export const MAP_MIN_ELITES = 3;
