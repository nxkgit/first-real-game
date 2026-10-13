/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #44: with 9 or 10 cards in hand the cards overlapped and their text could not be read.

test('a full hand of 10 cards: no card overlaps its neighbour, and playing one still works', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(['strike', 'defend', 'heating-up', 'scorching-wind', 'glaciate', 'strike', 'defend', 'strike', 'defend', 'strike', 'defend', 'strike'], ['enemy-a']);
  await game.page.evaluate(async () => {
    const c = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
    const cards = await (window as any).__imp('/src/data/cards.ts');
    for (const id of ['heating-up', 'glaciate', 'scorching-wind', 'strike', 'defend']) c.deck.addCopiesToHand(cards.getCard(id), 1);
    c.emitHandChanged();
  });
  await game.settle();

  const boxes: { left: number; right: number }[] = await game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    return [...scene.handCards.values()]
      .map((t: any) => ({ left: t.container.x - 55 * t.container.scaleX, right: t.container.x + 55 * t.container.scaleX }))
      .sort((a: any, b: any) => a.left - b.left);
  });
  expect(boxes).toHaveLength(10);
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].left, `card ${i + 1} starts after card ${i} ends`).toBeGreaterThanOrEqual(boxes[i - 1].right);
  expect(boxes[0].left).toBeGreaterThanOrEqual(0);
  expect(boxes[9].right).toBeLessThanOrEqual(800);

  // a card in a crowded hand still plays with the real mouse
  const energyBefore = (await game.combatTruth()).energy;
  await game.playCard('Defend');
  expect((await game.combatTruth()).energy).toBe(energyBefore - 1);
  game.check();
});
