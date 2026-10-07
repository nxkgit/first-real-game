import { readFileSync } from 'node:fs';
import { expect, test } from './harness';
import type { Harness } from './harness';
import { enterFirstFight } from './flows';

// The dev panel's scenario tools in a real browser: capture a fight, load it back, load a
// hand-written scenario and win it with the mouse, and refuse a bad one. See docs/SCENARIOS.md.

const fixture = (name: string): string => readFileSync(new URL(`../scenarios/${name}.json`, import.meta.url), 'utf8');

const box = (game: Harness) => game.page.locator('textarea[data-dev="scenario"]');
const press = (game: Harness, name: string) => game.page.getByRole('button', { name }).click();

/** Loads whatever is in the box and waits for the fight screen to be up and calm again. */
async function loadAndSettle(game: Harness): Promise<void> {
  await press(game, 'Load scenario');
  await game.step(10);
  await game.waitForScene('CombatScene');
  await game.settle();
}

test('(j) dev panel scenarios: capture a fight, restore it exactly, load a hand-written one and win it', async ({ game }) => {
  await game.open('seed=123&dev');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  await game.settle();

  // play a card with the real mouse, then capture what is on screen
  await game.playCard('Strike', 0);
  await game.settle();
  const before = await game.combatTruth();
  await press(game, 'Capture this fight');
  await expect(box(game)).not.toHaveValue('');
  const captured = JSON.parse(await box(game).inputValue());
  expect(captured.version).toBe(1);
  expect(captured.enemies).toHaveLength(1);
  expect(captured.enemies[0].hp).toBe(before.enemies[0].hp);
  expect(captured.energy).toBe(before.energy);
  expect(captured.piles.hand).toHaveLength(before.hand.length);
  expect(captured.piles.discard).toContain('strike'); // the card just played

  // load the capture back: the fight screen restarts from exactly that state
  await loadAndSettle(game);
  const after = await game.expectReadoutsMatchTruth();
  expect(after.hand).toEqual(before.hand);
  expect(after.energy).toBe(before.energy);
  expect(after.enemies[0].hp).toBe(before.enemies[0].hp);
  expect(after.turn).toBe(before.turn);

  // a hand-written scenario: exactly lethal when played in the right order, with real clicks
  await box(game).fill(fixture('exact-lethal'));
  await loadAndSettle(game);
  const lethal = await game.expectReadoutsMatchTruth();
  expect(lethal.hand).toEqual(['Bolt', 'Expose', 'Opportunist', 'Strike', 'Defend']);
  expect(lethal.enemies[0].hp).toBe(36);
  for (const name of ['Expose', 'Opportunist', 'Bolt']) {
    await game.playCard(name, 0);
    await game.settle();
  }
  expect((await game.combatTruth()).phase).toBe('won');
  expect(await game.hasText('VICTORY')).toBe(true);
  game.check();
});

test('(j) dev panel scenarios: powers already in play show up, still react, and a combo does what its note says', async ({ game }) => {
  await game.open('seed=123&dev');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  await game.settle();

  await box(game).fill(fixture('tag-a-combo'));
  await loadAndSettle(game);
  expect(await game.hasText('Powers: 1')).toBe(true); // Tag A Echo, played "before" the scenario starts
  const start = await game.expectReadoutsMatchTruth();
  expect(start.enemies[0].hp).toBe(85);

  // Prime A (tag-a) x2, Power Up (Empowered), then Tag A Payoff: (3 + 5 x 2 tagged plays) = 13, doubled by Empowered = 26
  for (const name of ['Prime A', 'Prime A', 'Power Up', 'Tag A Payoff']) {
    await game.playCard(name, 0);
    await game.settle();
  }
  const end = await game.expectReadoutsMatchTruth();
  expect(end.enemies[0].hp).toBe(85 - 26);
  expect(end.hand).toContain('Defend'); // Echo (restored, not yet fired this turn) drew a card on the first tagged play
  game.check();
});

test('(j) dev panel scenarios: a bad scenario is refused with a clear message and the fight is left alone', async ({ game }) => {
  await game.open('seed=123&dev');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  await game.settle();
  const before = await game.combatTruth();

  await box(game).fill('{ "enemies": [], "piles": { "hand": ["strike"] } }');
  await press(game, 'Load scenario');
  await expect(game.page.locator('body')).toContainText('Scenario not loaded');
  await expect(game.page.locator('body')).toContainText('at least one enemy');

  await box(game).fill('{ "enemies": [{ "id": "enemy-a" }], "piles": { "hand": ["strkie"] } }');
  await press(game, 'Load scenario');
  await expect(game.page.locator('body')).toContainText('did you mean "strike"');

  await box(game).fill('not json at all');
  await press(game, 'Load scenario');
  await expect(game.page.locator('body')).toContainText('not valid JSON');

  // nothing changed: same fight, same hand
  await game.step(10);
  expect((await game.combatTruth()).hand).toEqual(before.hand);
  await press(game, 'Capture this fight'); // capturing still works afterwards
  expect(JSON.parse(await box(game).inputValue()).piles.hand).toHaveLength(before.hand.length);
  game.check();
});
