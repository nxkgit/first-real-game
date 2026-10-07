export const HAND_Y = 515;
export const DRAW_PILE_POS = { x: 40, y: 515 };
export const DISCARD_PILE_POS = { x: 760, y: 515 };

export const PLAYER_X = 170;
export const PLAYER_Y = 250;
export const ENEMY_Y = 250;

/** Horizontal centers for `count` enemies standing side by side on the right half of the screen. */
export function enemySlots(count: number): number[] {
  if (count === 1) return [630];
  const spacing = count === 2 ? 150 : 130;
  const center = count === 2 ? 620 : 600;
  return Array.from({ length: count }, (_, i) => center + (i - (count - 1) / 2) * spacing);
}
