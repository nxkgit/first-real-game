import type { Effect } from './effect';
import type { Trigger } from './trigger';

export type CardType = 'attack' | 'skill' | 'power';

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
  /**
   * What `cost` is paid in. Leave it out for energy. 'radiantLight' (the Paladin's placeholder
   * resource) is spent from the hero's Radiant Light instead of energy. A card costs exactly one resource.
   */
  costResource?: 'radiantLight';
  /** Who owns the card: a hero's id, or 'neutral' for cards ("colorless") any hero can use. */
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
  /** StS-style keyword (engine-only for now, see src/data/neutral/keyword.ts): always starts in the
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
