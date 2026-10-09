/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #12: a scaling card in hand (Opportunist) showed only its live damage ("Deal 12 damage.") and dropped the
// sentence that explains why the number moves. The face now keeps both.

test('a scaling card in hand shows its live number and still explains the scaling', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('opportunist'), ['enemy-a']);

  const faceText = () =>
    game.page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('CombatScene');
      const tracked = [...scene.handCards.values()][0];
      return tracked.container.getData('descText').text as string;
    });

  expect(await faceText()).toBe('Deal 4 damage. +4 for each stack of Vulnerable on the target.');

  await game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    scene.combat.addStatus(scene.combat.enemies[0], 'vulnerable', 2);
    scene.refreshCardNumbers();
  });
  // 2 Vulnerable: 4 + 2x4 = 12, then +50% for Vulnerable itself = 18; the number comes from the engine, the note stays
  const after = await faceText();
  expect(after).toMatch(/^Deal \d+ damage\. \+4 for each stack of Vulnerable on the target\.$/);
  expect(after).not.toBe('Deal 4 damage. +4 for each stack of Vulnerable on the target.');
});
