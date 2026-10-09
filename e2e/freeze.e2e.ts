/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #14: when Freeze reaches its threshold and stuns an enemy, the enemy's intent slot (normally the
// sword and damage number) shows a frozen icon instead, and goes back to the real intent once the stun is spent.

test('a stunned enemy shows a frozen icon instead of its attack intent, until the stun is spent', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('strike'), ['enemy-a']);

  const read = () =>
    game.page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('CombatScene');
      const view = scene.enemyViews[0];
      const swords = Object.values(view.intentGraphics).filter((g: any) => g.visible).length;
      return {
        stunned: scene.combat.enemies[0].stunnedTurns ?? 0,
        frozenIconShown: !!view.stunMark?.visible,
        otherIntentShown: swords > 0 || view.intentValue.text !== '',
        tooltip: view.intentTooltip() as string | null,
      };
    });

  const before = await read();
  expect(before.stunned).toBe(0);
  expect(before.frozenIconShown).toBe(false);
  expect(before.otherIntentShown).toBe(true);

  // the real path: five stacks of Freeze put on the enemy (the stun threshold) stun it
  await game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    const combat = scene.combat;
    combat.addStatus(combat.enemies[0], 'freeze', 5);
    scene.refreshStatusBars();
  });
  const frozen = await read();
  expect(frozen.stunned).toBe(1);
  expect(frozen.frozenIconShown).toBe(true);
  expect(frozen.otherIntentShown).toBe(false);
  expect(frozen.tooltip).toMatch(/frozen/i);

  await game.endTurn(); // the stunned enemy skips its move; the stun is spent
  const after = await read();
  expect(after.stunned).toBe(0);
  expect(after.frozenIconShown).toBe(false);
  expect(after.otherIntentShown).toBe(true);
});
