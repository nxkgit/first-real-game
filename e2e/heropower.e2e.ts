/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #7: the hero power button used to sit under End Turn and cover the rightmost enemy's
// intent readout. It now sits to the left of End Turn. These check the real drawn objects.

const FOES: Record<number, string[]> = {
  1: ['enemy-a'],
  2: ['enemy-a', 'enemy-b'],
  3: ['enemy-a', 'enemy-b', 'enemy-c'],
};

for (const count of [1, 2, 3]) {
  test(`hero power button does not cover any intent with ${count} enemy(ies), and sits left of End Turn`, async ({ game }) => {
    await game.open('seed=1');
    await game.waitForScene('MapScene');
    await game.startFightWith(Array(10).fill('strike'), FOES[count]!);

    const boxes = await game.page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('CombatScene');
      const rect = (o: any) => {
        const b = o.getBounds();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      return {
        hero: rect(scene.heroPowerButton),
        endTurn: rect(scene.endTurnButton),
        intents: scene.enemyViews.map((v: any) => rect(v.intent)),
      };
    });
    const overlaps = (a: any, b: any) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

    expect(boxes.intents).toHaveLength(count);
    for (const [i, intent] of boxes.intents.entries()) {
      expect(overlaps(boxes.hero, intent), `hero power button over enemy ${i}'s intent`).toBe(false);
      expect(overlaps(boxes.endTurn, intent), `End Turn over enemy ${i}'s intent`).toBe(false);
    }
    expect(overlaps(boxes.hero, boxes.endTurn)).toBe(false);
    expect(boxes.hero.right).toBeLessThanOrEqual(boxes.endTurn.left); // to its left
    expect(Math.abs((boxes.hero.top + boxes.hero.bottom) / 2 - (boxes.endTurn.top + boxes.endTurn.bottom) / 2)).toBeLessThan(2); // same row
  });
}

test('the hero power button works from its new place', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('strike'), FOES[3]!);

  const before = await game.combatTruth();
  expect(await game.hasText('Hero Power (1)')).toBe(true);
  await game.clickText('Hero Power (1)'); // a real mouse click on the button's label
  await game.settle();
  const after = await game.combatTruth();
  expect(after.energy).toBe(before.energy - 1); // it costs 1
  expect(await game.hasText('Hero Power (used)')).toBe(true);
  game.check();
});
