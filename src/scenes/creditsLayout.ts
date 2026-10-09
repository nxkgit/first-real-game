// Where the credits rows go (pure, so it is unit-tested). The rows differ in height because their
// author and licence lines wrap, so they are flowed down a column and into the next one when full.

/** Where the rows may be drawn on the 800x600 screen, under the title and hint. */
export const CREDITS_AREA = { x: 40, y: 100, width: 720, height: 480 };
export const CREDITS_COLUMN_GAP = 24;
export const CREDITS_ROW_GAP = 8;
export const CREDITS_MAX_COLUMNS = 3;

export interface CreditPlacement {
  column: number;
  /** Top of the row, measured from the top of the area. */
  y: number;
}

/**
 * Flows rows of the given heights down columns, in order, starting a new column when the next row
 * would pass `areaHeight`. Returns null when that takes more than `columns` columns.
 */
export function packCredits(heights: number[], areaHeight: number, gap: number, columns: number): CreditPlacement[] | null {
  const out: CreditPlacement[] = [];
  let column = 0;
  let y = 0;
  for (const h of heights) {
    if (y > 0 && y + h > areaHeight) {
      column++;
      y = 0;
    }
    if (column >= columns) return null;
    out.push({ column, y });
    y += h + gap;
  }
  return out;
}
