import { describe, expect, it } from 'vitest';
import { enemySlots } from './layout';

// The fight panel spans x = 60..740; a crowded enemy's HP bar is 110 wide (EnemyView).
describe('enemySlots', () => {
  for (const count of [1, 2, 3]) {
    it(`keeps ${count} enemy bar(s) inside the fight panel`, () => {
      const slots = enemySlots(count);
      expect(slots).toHaveLength(count);
      const half = count === 1 ? 80 : 55;
      for (const x of slots) {
        expect(x + half).toBeLessThanOrEqual(740);
        expect(x - half).toBeGreaterThan(250); // clear of the hero
      }
    });
  }
});
