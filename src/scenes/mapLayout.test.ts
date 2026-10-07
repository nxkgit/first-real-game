import { describe, expect, it } from 'vitest';
import { MAP_FLOORS, MAP_LANES } from '../data/tunables';
import { MAP_BOTTOM_Y, MAP_TOP_Y, mapLayout } from './mapLayout';

describe('mapLayout', () => {
  it('matches the original hand-tuned layout at the current tunables', () => {
    const floors = MAP_FLOORS + 1; // plus the boss's floor
    const l = mapLayout(floors, MAP_LANES);
    for (let floor = 0; floor < floors; floor++) expect(l.y(floor)).toBe(548 - floor * 35);
    for (let lane = 0; lane < MAP_LANES; lane++) expect(l.x(lane)).toBe(200 + lane * 100);
  });

  it('keeps every stop on the same screen area for any floor and lane count', () => {
    for (const floors of [2, 5, 13, 20, 40]) {
      const l = mapLayout(floors, 5);
      expect(l.y(0)).toBe(MAP_BOTTOM_Y);
      expect(l.y(floors - 1)).toBeCloseTo(MAP_TOP_Y, 9);
    }
    for (const lanes of [1, 2, 5, 9]) {
      const l = mapLayout(13, lanes);
      for (let lane = 0; lane < lanes; lane++) {
        expect(l.x(lane)).toBeGreaterThanOrEqual(200);
        expect(l.x(lane)).toBeLessThanOrEqual(600);
      }
    }
  });
});
