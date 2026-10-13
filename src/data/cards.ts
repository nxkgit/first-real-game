import type { CardDefinition } from '../model';
import { SYNERGY_CARDS } from './neutral/synergy';
import { MAGE_CARDS } from './heroes/mage/cards';
import { KEYWORD_CARDS } from './neutral/keyword';
import { PALADIN_CARDS } from './heroes/paladin/cards';
import { DRUID_CARDS } from './heroes/druid/cards';
import { MAGE } from './heroes/ids';
import { createRegistry } from './registry';
import { BASIC_CARDS, BOLT, DEFEND, FOCUS, STRIKE } from './neutral/basics';

// PLACEHOLDER content. Names/numbers here are functional stand-ins to exercise the game's
// systems — final card design, naming, and flavor are the user's to author (see CLAUDE.md).
// Card text is generated from `effects` (game/describe.ts), so numbers live in one place.

// ---- registry ----
// Every card is listed here once. Anything that needs to refer to a card by name (a saved run, a
// reward pool, a test) goes through its id, so the id is the card's identity.

const ALL_CARDS: CardDefinition[] = [
  ...BASIC_CARDS,
  // placeholder synergy-test cards: registered, but never offered as rewards (see synergyCards.ts)
  ...SYNERGY_CARDS,
  // the Mage's fire/frost/Freeze cards (user's design, see mageCards.ts): in the reward pool
  ...MAGE_CARDS,
  // the Paladin's PLACEHOLDER cards, including the Radiant Light ones (see paladinCards.ts)
  ...PALADIN_CARDS,
  // the Druid's PLACEHOLDER cards, including the form cards (see druidCards.ts)
  ...DRUID_CARDS,
  // StS-style keyword demo cards (innate/retain/ethereal/unplayable/frail/intangible/buffer):
  // engine-only, never offered as rewards (see keywordCards.ts)
  ...KEYWORD_CARDS,
];

/**
 * The upgraded version of a card, generated from its `upgrade` block and registered as `<id>+`.
 * An upgraded card can't be upgraded again, and is never offered as a reward by itself.
 */
function buildUpgraded(card: CardDefinition): CardDefinition | undefined {
  if (!card.upgrade) return undefined;
  const { upgrade, ...rest } = card;
  return {
    ...rest,
    ...upgrade,
    id: `${card.id}+`,
    name: `${card.name}+`,
    upgradeOf: card.id,
    inRewardPool: false,
    inStarterPool: false,
  };
}

const UPGRADED_CARDS: CardDefinition[] = ALL_CARDS.flatMap((card) => buildUpgraded(card) ?? []);

const cardTable = createRegistry('card', [...ALL_CARDS, ...UPGRADED_CARDS]);
export const CARDS: Readonly<Record<string, CardDefinition>> = cardTable.byId;

/** The upgraded version of `card`, or undefined if it can't be upgraded (already upgraded, or no upgrade defined). */
export function upgradedVersion(card: CardDefinition): CardDefinition | undefined {
  return card.upgrade ? CARDS[`${card.id}+`] : undefined;
}

/** Every base (not upgraded) card, in the order they are listed above. */
export function baseCards(): CardDefinition[] {
  return ALL_CARDS;
}

export const getCard = cardTable.get;

/** Cards a hero can be offered as rewards or in a shop: their own plus the neutral ones. */
export function rewardPoolFor(heroId: string): CardDefinition[] {
  return ALL_CARDS.filter((card) => card.inRewardPool && (card.owner === heroId || card.owner === 'neutral'));
}

/**
 * Cards a hero can be offered during the pre-run starter-deck draft: their own plus the neutral
 * ones. Added 2026-10-08 for the starter-deck draft (DESIGN_LOG.md "Starter deck draft"); mirrors
 * `rewardPoolFor` exactly, filtered on `inStarterPool` instead of `inRewardPool`.
 */
export function starterPoolFor(heroId: string): CardDefinition[] {
  return ALL_CARDS.filter((card) => card.inStarterPool && (card.owner === heroId || card.owner === 'neutral'));
}

/**
 * Every base card a deck for `heroId` could plausibly contain, for tools that build decks from the
 * whole registry (the simulator, tests): the reward-pool cards (which, since 2026-10-08, includes
 * the basics Strike/Defend/Bolt/Focus — see DESIGN_LOG.md "Starter deck draft") plus the placeholder
 * synergy cards, regardless of `inRewardPool`. Excludes upgraded versions (use `upgradedVersion`).
 * The live game never calls this; it uses `rewardPoolFor` (and, for the starter draft, `starterPoolFor`).
 */
export function allDraftableCards(heroId: string = MAGE): CardDefinition[] {
  const synergyIds = new Set(SYNERGY_CARDS.map((c) => c.id));
  return ALL_CARDS.filter(
    (card) => (card.inRewardPool || synergyIds.has(card.id)) && (card.owner === heroId || card.owner === 'neutral')
  );
}

/**
 * Placeholder reference starter deck (mirrors StS's starter-deck shape): every card type, and the
 * cost/energy system. Used by the simulator/balance toolkit as its baseline deck, and by tests that
 * want an ordinary ready-to-play deck (see `newPlayableRun` in data/run.ts). The live game no longer
 * uses this directly — since 2026-10-08 the player builds their own starting deck via the starter
 * draft (DESIGN_LOG.md "Starter deck draft"); this function is kept as the simulator's stand-in.
 */
export function buildStarterDeck(): CardDefinition[] {
  return [STRIKE, STRIKE, STRIKE, STRIKE, DEFEND, DEFEND, DEFEND, DEFEND, BOLT, FOCUS];
}
