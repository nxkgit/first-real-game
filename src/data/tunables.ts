// All balance numbers in one place (see CLAUDE.md, "Centralized tunables").
// Every value here is a PROVISIONAL placeholder, expected to change once playtesting
// starts. Card and enemy numbers live with their definitions in cards.ts / enemies.ts.

// ---- combat ----
export const MAX_ENERGY = 4;
export const HAND_SIZE = 5;

// ---- statuses ----
/** Weak: the holder's attacks deal this fraction of their damage. */
export const WEAK_DAMAGE_MULT = 0.75;
/** Vulnerable: the holder takes this multiple of attack damage. */
export const VULNERABLE_DAMAGE_MULT = 1.5;

// ---- run ----
export const PLAYER_MAX_HP = 60;
/** Fraction of max HP restored at a rest stop. */
export const REST_HEAL_FRACTION = 0.3;
/** How many cards the post-combat reward offers to pick from. */
export const REWARD_CARD_CHOICES = 3;
/**
 * Gold offered instead of a card after a win. Open question (implementationplan.md): gold
 * must end up a genuine toss-up against the card, which can't be tuned until a shop exists.
 */
export const REWARD_GOLD = 25;
/** Gold offered after winning against an elite (which also drops a relic). */
export const ELITE_REWARD_GOLD = 40;

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
