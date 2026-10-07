// All balance numbers in one place (see CLAUDE.md, "Centralized tunables").
// Every value here is a PROVISIONAL placeholder, expected to change once playtesting
// starts. Card and enemy numbers live with their definitions in cards.ts / enemies.ts.

// ---- combat ----
export const MAX_ENERGY = 4;
export const HAND_SIZE = 5;

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
