/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #26: an enemy's status badges (the Freeze icon, ...) are meant to sit under that enemy. The row
// was positioned as if all nine badge slots were drawn, but only the badges that exist are drawn, packed
// from the left, so a lone badge landed about 150 px to the left of its enemy (under its neighbour).

test('status badges sit centred under their own enemy, and a hover on one explains it', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('strike'), ['enemy-a', 'enemy-a', 'enemy-a']);

  await game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    for (const e of scene.combat.enemies) scene.combat.addStatus(e, 'freeze', 2);
    scene.combat.addStatus(scene.combat.enemies[1], 'vulnerable', 1); // a second badge on the middle enemy
    scene.refreshStatusBars();
  });
  await game.step(2);

  const rows: { enemyX: number; badgeXs: number[] }[] = await game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    return scene.enemyViews.map((v: any) => ({
      enemyX: v.container.x,
      // the disc of each badge is the first object of its three (disc, letter, count)
      badgeXs: v.statusRow.container.list.filter((_: any, i: number) => i % 3 === 0).map((o: any) => o.getWorldTransformMatrix().tx),
    }));
  });

  expect(rows).toHaveLength(3);
  rows.forEach((row, i) => {
    expect(row.badgeXs.length, `enemy ${i} badges`).toBe(i === 1 ? 2 : 1);
    const mid = (Math.min(...row.badgeXs) + Math.max(...row.badgeXs)) / 2;
    expect(Math.abs(mid - row.enemyX), `enemy ${i}: badges centred under it`).toBeLessThanOrEqual(2);
  });

  // the hover zones moved with the badges: the middle enemy has Vulnerable then Freeze (badge order)
  const first = rows[1].badgeXs[0];
  await game.hover(first, 412);
  expect(await game.hasText(/Vulnerable 1:/)).toBe(true);
  await game.hover(rows[1].badgeXs[1], 412);
  expect(await game.hasText(/Freeze 2:/)).toBe(true);
  await game.hover(rows[0].badgeXs[0], 412);
  expect(await game.hasText(/Freeze 2:/)).toBe(true);
  game.check();
});
