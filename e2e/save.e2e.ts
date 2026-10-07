import { expect, test } from './harness';
import { enterFirstFight } from './flows';

test('(f) reload mid-fight, then Continue restarts that fight on the same run', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  const before = await game.run();
  const fight = await game.combatTruth();

  await game.reload();
  await game.waitForScene('BootScene');
  expect(await game.hasText('Run in progress')).toBe(true);
  expect(await game.hasText(new RegExp(`^Floor 1 of \\d+ {4}HP ${before.hp}/${before.maxHp} {4}Gold ${before.gold} {4}Deck ${before.deck.length}$`))).toBe(true);
  expect(await game.hasText('New Run')).toBe(true);

  await game.clickText('Continue');
  await game.waitForScene('CombatScene');
  await game.settle();
  const after = await game.run();
  expect(after.seed).toBe(123);
  expect(after.position).toBe(before.position);
  expect(after.deck).toEqual(before.deck);
  const restarted = await game.expectReadoutsMatchTruth();
  expect(restarted.turn).toBe(1);
  expect(restarted.enemies.map((e) => `${e.name}:${e.hp}`)).toEqual(fight.enemies.map((e) => `${e.name}:${e.hp}`));
  // same seeded run, same fight shuffle: the opening hand is the same
  expect(restarted.hand).toEqual(fight.hand);
});

test('(f) reload on the reward screen offers the same cards; reload on the map keeps the choice made', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  await game.winFightQuickly();
  await game.waitForScene('RewardScene');
  const offered = await game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
    return run.pendingReward.cards.map((c: any) => c.id as string);
  });

  await game.reload();
  await game.waitForScene('BootScene');
  await game.clickText('Continue');
  await game.waitForScene('RewardScene');
  const again = await game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
    return run.pendingReward.cards.map((c: any) => c.id as string);
  });
  expect(again).toEqual(offered);

  await game.clickText(/^Take \d+ gold$/);
  await game.waitForScene('MapScene');
  const onMap = await game.run();
  await game.reload();
  await game.waitForScene('BootScene');
  await game.clickText('Continue');
  await game.waitForScene('MapScene');
  const resumed = await game.run();
  expect(resumed.gold).toBe(onMap.gold);
  expect(resumed.position).toBe(onMap.position);
  expect(resumed.choices.map((c) => c.id)).toEqual(onMap.choices.map((c) => c.id));
});

test('(f) New Run on the continue screen discards the save', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);
  await game.reload();
  await game.waitForScene('BootScene');
  await game.clickText('New Run');
  await game.waitForScene('MapScene');
  const run = await game.run();
  expect(run.phase).toBe('map');
  expect(run.position).toBeNull();
  expect(run.seed).toBe(123);
});
