import { expect, test } from './harness';
import { devJump, devWinFight, firstPeacefulEventChoice } from './flows';

// Non-fight stops, driven with real clicks. The dev panel is only used to get to the stop.

test('(d) rest stop: upgrading a card with the picker and preview', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  const before = await game.run();

  await devJump(game, 'rest');
  await game.waitForScene('RestScene');
  expect(await game.hasText(/^Rest \(\+\d+ HP\)$|^Rest$/)).toBe(true);

  await game.clickText('Upgrade a card');
  expect(await game.hasText('Choose a card to upgrade')).toBe(true);
  await game.clickText('Strike'); // first card in the picker
  expect(await game.hasText('Upgrade this card?')).toBe(true);
  await game.clickText('Upgrade');
  await game.waitForScene('MapScene');

  const after = await game.run();
  expect(after.deck).toHaveLength(before.deck.length);
  expect(after.hp).toBe(before.hp); // upgrading is instead of resting
  const upgraded = await game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
    return run.deck.filter((c: any) => c.upgradeOf).map((c: any) => c.upgradeOf as string);
  });
  expect(upgraded, 'exactly one card is now an upgraded version').toEqual(['strike']);
});

test('(d) rest stop: resting heals', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  await game.page.getByRole('button', { name: 'HP 1' }).click();
  await devJump(game, 'rest');
  await game.waitForScene('RestScene');
  const hurt = await game.run();
  expect(hurt.hp).toBe(1);
  await game.clickText(/^Rest \(\+\d+ HP\)$/);
  await game.waitForScene('MapScene');
  const healed = await game.run();
  expect(healed.hp).toBeGreaterThan(1);
  expect(healed.hp).toBeLessThanOrEqual(healed.maxHp);
});

test('(d) reward screen: picking a card adds it to the deck', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  const before = await game.run();

  await devJump(game, 'combat');
  await game.waitForScene('CombatScene');
  await game.settle();
  await devWinFight(game);
  await game.waitForScene('RewardScene');

  const offered: string[] = await game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
    return run.pendingReward.cards.map((c: any) => c.name);
  });
  expect(offered.length).toBe(3);
  for (const name of offered) expect(await game.hasText(name), `${name} is drawn`).toBe(true);

  await game.click(400 - ((offered.length - 1) * 150) / 2, 275); // the first offered card
  await game.waitForScene('MapScene');
  const after = await game.run();
  expect(after.deck).toHaveLength(before.deck.length + 1);
  expect(after.deck).toContain(offered[0]);
  expect(after.gold).toBe(before.gold); // a card instead of the gold
});

test('(d) event: a choice applies its outcomes and shows the result', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');

  let verified = 0;
  const events = (await game.run()).nodes.filter((n) => n.kind === 'event');
  for (let i = 0; i < events.length; i++) {
    await devJump(game, 'event', i);
    await game.waitForScene('EventScene');
    const choice = await firstPeacefulEventChoice(game);
    const before = await game.run();
    await game.clickText(choice.label);
    expect(await game.hasText('Continue')).toBe(true);

    const after = await game.run();
    for (const outcome of choice.outcomes) {
      if (outcome.kind === 'gold') expect(after.gold).toBe(Math.max(0, before.gold + outcome.value));
      if (outcome.kind === 'maxHp') expect(after.maxHp).toBe(before.maxHp + outcome.value);
      if (outcome.kind === 'hp') {
        const expected = outcome.value < 0 ? Math.max(1, before.hp + outcome.value) : Math.min(before.maxHp, before.hp + outcome.value);
        expect(after.hp).toBe(expected);
      }
      if (outcome.kind === 'randomCard') expect(after.deck).toHaveLength(before.deck.length + 1);
      verified++;
    }
    await game.clickText('Continue');
    await game.waitForScene('MapScene');
  }
  expect(verified, 'at least one event outcome was checked').toBeGreaterThan(0);
});
