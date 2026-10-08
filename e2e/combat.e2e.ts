import { expect, test } from './harness';
import { enterFirstFight } from './flows';

test('(b) plays a whole fight with the real mouse; readouts match CombatState after every action', async ({ game }) => {
  test.setTimeout(300_000); // enemy HP is high, so this fight runs many turns
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);

  let truth = await game.expectReadoutsMatchTruth();
  const startHp = truth.hp;
  let firstStrikeChecked = false;
  let sawEnemyAct = false;

  for (let turn = 1; turn <= 40 && truth.phase === 'playerTurn'; turn++) {
    expect(truth.turn).toBe(turn);
    expect(truth.energy).toBe(truth.maxEnergy);
    expect(truth.hand.length).toBeGreaterThanOrEqual(5);

    // play every card we can afford, left to right, re-reading the hand after each play
    for (let plays = 0; plays < 12; plays++) {
      truth = await game.combatTruth();
      if (truth.phase !== 'playerTurn') break;
      const costs: Record<string, number> = await game.page.evaluate(async () => {
        const combat = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
        return Object.fromEntries(combat.deck.hand.map((c: any) => [c.definition.name, c.definition.cost]));
      });
      const playable = truth.hand.find((name) => costs[name] <= truth.energy);
      if (!playable) break;

      const target = truth.enemies.findIndex((e) => e.alive);
      const before = truth.enemies[target];
      await game.playCard(playable, target);
      const after = await game.expectReadoutsMatchTruth();

      expect(after.energy, `energy after ${playable}`).toBe(truth.energy - costs[playable]);
      if (playable === 'Strike' && !firstStrikeChecked && before.block === 0) {
        firstStrikeChecked = true;
        expect(after.enemies[target].hp, 'a Strike on an unblocked enemy deals 6').toBe(before.hp - 6);
      }
      if (playable === 'Defend') expect(after.block).toBe(truth.block + 5);
      if (after.phase !== 'playerTurn') break; // that was the killing blow
    }

    truth = await game.combatTruth();
    if (truth.phase !== 'playerTurn') break;

    // the enemy's announced attack is what lands (less block); then it is our turn again
    const incoming: number = await game.page.evaluate(async () => {
      const combat = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
      return combat.livingEnemies.reduce((sum: number, e: any) => sum + (combat.intentDamage(e) ?? 0), 0);
    });
    await game.endTurn();
    const next = await game.expectReadoutsMatchTruth();
    if (next.phase === 'playerTurn') {
      expect(next.turn).toBe(turn + 1);
      expect(next.hp).toBe(Math.max(0, truth.hp - Math.max(0, incoming - truth.block)));
      sawEnemyAct = true;
    }
    truth = next;
  }

  expect(sawEnemyAct, 'at least one enemy turn was played').toBe(true);
  expect(truth.phase).toBe('won');
  expect(truth.hp).toBeLessThanOrEqual(startHp);
  expect(await game.hasText('VICTORY')).toBe(true);

  // Continue -> reward screen -> take the gold -> back on the map
  const run = await game.run();
  await game.clickText('Continue');
  await game.waitForScene('RewardScene');
  expect(await game.hasText('Choose a reward')).toBe(true);
  await game.clickText(/^Take \d+ gold$/);
  await game.waitForScene('MapScene');
  const after = await game.run();
  expect(after.gold).toBeGreaterThan(run.gold);
  expect(after.hp).toBe(truth.hp);
  expect(after.phase).toBe('map');
});
