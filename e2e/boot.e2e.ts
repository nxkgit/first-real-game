import { expect, test } from './harness';
import { enterFirstFight } from './flows';

test('(a) boots into a seeded run, draws the map and enters a fight', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');

  expect(await game.hasText('Choose your path')).toBe(true);
  const run = await game.run();
  expect(run.seed).toBe(123);
  expect(run.phase).toBe('map');
  expect(run.deck).toHaveLength(10);
  expect(run.choices.length).toBeGreaterThan(0);
  // the legend and the run readout are drawn
  expect(await game.hasText('Boss')).toBe(true);
  expect(await game.hasText(/^HP \d+\/\d+ {4}Floor 1\/\d+ {4}Gold \d+$/)).toBe(true);

  await enterFirstFight(game);
  const truth = await game.expectReadoutsMatchTruth();
  expect(truth.hand).toHaveLength(5);
  expect(truth.turn).toBe(1);
  expect(truth.energy).toBe(truth.maxEnergy);
  expect((await game.run()).phase).toBe('inNode');
});

test('the test hook is inert without ?e2e, and the game runs on its own loop', async ({ game }) => {
  await game.page.goto('/?seed=123');
  await game.page.waitForTimeout(1500); // real time: nothing steps this game but its own loop
  const exposed = await game.page.evaluate(() => ({
    game: typeof (window as unknown as Record<string, unknown>).__game,
    step: typeof (window as unknown as Record<string, unknown>).__step,
    canvas: document.querySelectorAll('canvas').length,
  }));
  expect(exposed).toEqual({ game: 'undefined', step: 'undefined', canvas: 1 });
  game.check();
});

test('the same seed gives the same map', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  const first = (await game.run()).nodes.map((n) => `${n.id}:${n.kind}`).join();
  await game.page.evaluate(() => localStorage.clear());
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  expect((await game.run()).nodes.map((n) => `${n.id}:${n.kind}`).join()).toBe(first);
});
