import { PLAYER_MAX_HP } from '../data/tunables';
import type { SkillLevel } from './skills';
import type { Tier } from './suites';

/**
 * PROVISIONAL TARGET BANDS. These are placeholders chosen by the tooling session from Slay the
 * Spire conventions (normal fights are short and cheap, elites are a real risk, the boss is the
 * exam) and the plan's "avoid dominant or dominated choices" principle. The designer sets the
 * real ones; change them here and nothing else needs to move. See docs/BALANCE.md.
 *
 * Bands apply to the REFERENCE deck set ("mid": the starter deck plus 5 cards), at full HP.
 */
export type Band = readonly [low: number, high: number];

export const TARGET_DECK_SET = 'mid';

export const TIER_TARGETS: Readonly<Record<Tier, { turns: Band; hpLostWhenWonFraction: Band }>> = {
  // fraction of max HP lost in a fight the player wins
  normal: { turns: [3, 6], hpLostWhenWonFraction: [0.08, 0.25] },
  elite: { turns: [5, 9], hpLostWhenWonFraction: [0.2, 0.45] },
  boss: { turns: [8, 14], hpLostWhenWonFraction: [0.35, 0.7] },
};

/**
 * Win-rate bands per bot skill. A real player sits between `greedy` and `expert`; the content is
 * healthy when the player-like bots land in the band and `random` is clearly worse (a random bot
 * winning everything means the fight tests nothing; a strong bot losing means it is unfair).
 */
const WIN_BANDS: Readonly<Record<SkillLevel, Readonly<Record<Tier, Band>>>> = {
  random: { normal: [0.3, 0.95], elite: [0.05, 0.6], boss: [0, 0.3] },
  greedy: { normal: [0.9, 1], elite: [0.6, 0.9], boss: [0.35, 0.8] },
  smart: { normal: [0.95, 1], elite: [0.75, 0.97], boss: [0.55, 0.9] },
  expert: { normal: [0.95, 1], elite: [0.8, 0.98], boss: [0.6, 0.92] },
};

export const winBand = (skill: SkillLevel, tier: Tier): Band => WIN_BANDS[skill][tier];
export const hpLostBand = (tier: Tier): Band => [TIER_TARGETS[tier].hpLostWhenWonFraction[0] * PLAYER_MAX_HP, TIER_TARGETS[tier].hpLostWhenWonFraction[1] * PLAYER_MAX_HP];
export const turnsBand = (tier: Tier): Band => TIER_TARGETS[tier].turns;

export type BandStatus = 'below' | 'in' | 'above';

export function bandStatus(value: number, band: Band): BandStatus {
  return value < band[0] ? 'below' : value > band[1] ? 'above' : 'in';
}

/** A short marker for tables: nothing when inside the band. */
export const bandMark = (status: BandStatus): string => (status === 'in' ? 'ok' : status === 'below' ? 'LOW' : 'HIGH');

/**
 * Per-metric tolerance rules for balance:check (see snapshot.ts). A change is only reported as
 * "moved" when it is BOTH statistically clear (|z| >= Z_MOVED) AND at least this large.
 */
export const TOLERANCE = { win: 0.03, hpLost: 1.5, turns: 0.4 } as const;
export const Z_MOVED = 3;
