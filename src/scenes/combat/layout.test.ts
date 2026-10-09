import { describe, expect, it } from 'vitest';
import { END_TURN_BUTTON, HERO_POWER_BUTTON, boxesOverlap, enemySlots, intentBox } from './layout';

// Issue #7: the hero power button used to sit under End Turn, on top of the rightmost enemy's
// intent readout. No enemy's intent may be covered by a top-right button, however many enemies
// there are.
describe('top-right buttons', () => {
  for (const count of [1, 2, 3]) {
    it(`do not cover any intent readout with ${count} enemy(ies)`, () => {
      for (const x of enemySlots(count)) {
        expect(boxesOverlap(HERO_POWER_BUTTON, intentBox(x)), `hero power button over the intent at x=${x}`).toBe(false);
        expect(boxesOverlap(END_TURN_BUTTON, intentBox(x)), `End Turn over the intent at x=${x}`).toBe(false);
      }
    });
  }

  it('keep the hero power button beside End Turn, not on top of it', () => {
    expect(boxesOverlap(HERO_POWER_BUTTON, END_TURN_BUTTON)).toBe(false);
    expect(HERO_POWER_BUTTON.x).toBeLessThan(END_TURN_BUTTON.x); // to its left
    expect(HERO_POWER_BUTTON.y).toBe(END_TURN_BUTTON.y); // on the same row
  });
});

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
