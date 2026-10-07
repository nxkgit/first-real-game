import { expect, test } from './harness';
import { SCENE_FOR_KIND, devJump, leaveStop } from './flows';

test('(c) dev panel: jump to every kind of stop and leave it', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  await game.page.getByRole('button', { name: 'Go to stop' }).waitFor();

  const kinds = ['combat', 'elite', 'rest', 'shop', 'event', 'boss'];
  const present = new Set((await game.run()).nodes.map((n) => n.kind));
  for (const kind of kinds) expect(present.has(kind), `seed 1 map has a ${kind} stop`).toBe(true);

  for (const kind of kinds) {
    const node = await devJump(game, kind);
    await game.waitForScene(SCENE_FOR_KIND[kind]);
    const run = await game.run();
    expect(run.position, `${kind}: jumped to the chosen stop`).toBe(node.id);
    expect(run.phase).toBe('inNode');
    if (SCENE_FOR_KIND[kind] === 'CombatScene') await game.settle();
    await leaveStop(game, kind);
    if (kind !== 'boss') expect((await game.run()).phase).toBe('map');
  }

  // the act is won: the run-end screen
  expect(await game.hasText('ACT COMPLETE')).toBe(true);
  expect((await game.run()).phase).toBe('won');
});
