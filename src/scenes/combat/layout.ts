export const HAND_Y = 515;
/** Width the hand may spread across before the cards start to overlap. */
export const HAND_AREA_WIDTH = 640;
/** Space between neighbouring cards in the hand. */
export const HAND_GAP = 10;

/**
 * How the hand sits in `HAND_AREA_WIDTH`: cards keep full size and a gap while they fit; a bigger
 * hand shrinks every card so none overlaps another (issue #44). `step` is the distance between
 * card centres. The hovered card is drawn larger, so a small card can still be read.
 */
export function handLayout(count: number, cardWidth: number): { scale: number; step: number } {
  const scale = Math.min(1, (HAND_AREA_WIDTH - Math.max(0, count - 1) * HAND_GAP) / (Math.max(1, count) * cardWidth));
  return { scale, step: cardWidth * scale + HAND_GAP };
}

export const DRAW_PILE_POS = { x: 40, y: 515 };
export const DISCARD_PILE_POS = { x: 760, y: 515 };

/** A rectangle by its centre and size, in screen pixels. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

/**
 * The two buttons in the top-right corner (CombatScene.buildHandArea). The hero power button sits
 * to the left of End Turn on the same row, 8 px apart: below it (as it first was) it covered the
 * rightmost enemy's intent readout (issue #7).
 */
export const END_TURN_BUTTON: Box = { x: 720, y: 30, width: 130, height: 50 };
export const HERO_POWER_BUTTON: Box = {
  x: END_TURN_BUTTON.x - END_TURN_BUTTON.width / 2 - 8 - 60,
  y: END_TURN_BUTTON.y,
  width: 120,
  height: END_TURN_BUTTON.height,
};

/**
 * The last couple of log lines, in the gap between the run readout (Deck and Report buttons end
 * near x = 410) and the hero power button. Wrapped narrowly, so it must stay a few short lines.
 */
export const LOG_TEXT = { x: 465, y: 28, wrapWidth: 110 };

/** Where an enemy's intent readout sits (EnemyView): centred on the enemy, at this height. */
export const INTENT_Y = 92;
export const INTENT_SIZE = { width: 110, height: 34 };
export const intentBox = (enemyX: number): Box => ({ x: enemyX, y: INTENT_Y, ...INTENT_SIZE });

export const PLAYER_X = 170;
export const PLAYER_Y = 250;
export const ENEMY_Y = 250;

/** Horizontal centers for `count` enemies standing side by side on the right half of the screen. */
export function enemySlots(count: number): number[] {
  if (count === 1) return [630];
  // The fight panel ends at x = 740 and a crowded enemy's bar is 110 wide, so the last slot must sit at 685 or less.
  const spacing = count === 2 ? 140 : 118;
  const center = count === 2 ? 600 : 562;
  return Array.from({ length: count }, (_, i) => center + (i - (count - 1) / 2) * spacing);
}
