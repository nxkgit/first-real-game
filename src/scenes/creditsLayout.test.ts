import { describe, expect, it } from 'vitest';
import { packCredits } from './creditsLayout';

describe('packCredits', () => {
  it('stacks rows in one column with the gap between them when they fit', () => {
    expect(packCredits([30, 40, 50], 480, 8, 1)).toEqual([
      { column: 0, y: 0 },
      { column: 0, y: 38 },
      { column: 0, y: 86 },
    ]);
  });

  it('never lets two rows in a column overlap, whatever their heights (issue #32)', () => {
    const heights = [55, 70, 48, 62, 55, 41, 70, 55, 48, 62, 55, 41];
    const placed = packCredits(heights, 480, 8, 3)!;
    for (let i = 0; i < placed.length; i++) {
      expect(placed[i].y + heights[i]).toBeLessThanOrEqual(480);
      for (let j = i + 1; j < placed.length; j++) {
        if (placed[i].column !== placed[j].column) continue;
        expect(placed[j].y).toBeGreaterThanOrEqual(placed[i].y + heights[i]);
      }
    }
  });

  it('starts a new column when the next row would not fit', () => {
    expect(packCredits([200, 200, 200], 480, 8, 2)!.map((p) => p.column)).toEqual([0, 0, 1]);
  });

  it('returns null when the rows need more columns than allowed', () => {
    expect(packCredits([200, 200, 200], 480, 8, 1)).toBeNull();
  });

  it('keeps the order of the rows', () => {
    const cols = packCredits([300, 300, 300, 300], 480, 8, 4)!.map((p) => p.column);
    expect(cols).toEqual([...cols].sort());
  });
});
