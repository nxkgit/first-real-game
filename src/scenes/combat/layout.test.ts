import { describe, expect, it } from 'vitest';
import { END_TURN_BUTTON, HAND_AREA_WIDTH, HERO_POWER_BUTTON, boxesOverlap, enemySlots, handLayout, intentBox } from './layout';

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

// Issue #44: with 9 or 10 cards the hand overlapped and the cards' text could not be read.
describe('handLayout', () => {
  const CARD_WIDTH = 110;
  const MAX_HAND_SIZE = 10;

  it('keeps full-size cards while the hand is small (as before)', () => {
    for (const count of [1, 2, 3, 4, 5]) expect(handLayout(count, CARD_WIDTH).scale, `${count} cards`).toBe(1);
    expect(handLayout(5, CARD_WIDTH).step).toBe(CARD_WIDTH + 10);
  });

  it('never lets neighbouring cards overlap, and fits the hand area, up to the largest hand', () => {
    for (let count = 1; count <= MAX_HAND_SIZE; count++) {
      const { scale, step } = handLayout(count, CARD_WIDTH);
      expect(step, `${count} cards: gap between neighbours`).toBeGreaterThanOrEqual(CARD_WIDTH * scale);
      const span = step * (count - 1) + CARD_WIDTH * scale;
      expect(span, `${count} cards: total width`).toBeLessThanOrEqual(HAND_AREA_WIDTH + 1e-9);
    }
  });

  it('shrinks cards as the hand grows', () => {
    expect(handLayout(10, CARD_WIDTH).scale).toBeLessThan(handLayout(7, CARD_WIDTH).scale);
  });
});
