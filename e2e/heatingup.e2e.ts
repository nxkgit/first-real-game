/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Issue #28 (Heating Up / Ignite rework, user 2026-10-09): Heating Up gives Fuming for the rest of the
// turn; each attack played while Fuming grants 1 Ignite after it resolves; Ignite multiplies attack
// damage by 2^stacks, except Scorching Wind's damage. Numbers by hand: Strike deals 6, Scorching Wind 2.
// Deck of 5 (the whole opening hand): Heating Up 1 energy, Scorching Wind 0, three Strikes 1 each = 4.

test('Heating Up: attacks deal 1x, 2x, 4x...; Scorching Wind ignores Ignite but grants it; the screen says so', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await game.page.evaluate(async () => {
    const { ENEMIES } = await (window as any).__imp('/src/data/enemies.ts');
    ENEMIES['enemy-a'].maxHp = 2000; // nothing dies mid-test
  });
  await game.startFightWith(['heating-up', 'scorching-wind', 'strike', 'strike', 'strike'], ['enemy-a']);

  const hp = () => game.page.evaluate(async () => (await (window as any).__imp('/src/session.ts')).getCurrentCombat().enemies[0].hp as number);
  const player = (id: string) =>
    game.page.evaluate(async (s) => ((await (window as any).__imp('/src/session.ts')).getCurrentCombat().player.statuses[s] as number | undefined) ?? 0, id);

  // the card says what it does (the user's wording)
  expect(await game.hasText(/For the rest of your turn, your attacks grant you 1 Ignite\./)).toBe(true);
  expect(await game.hasText(/\(This effect does not apply to Scorching Wind's damage\.\)/)).toBe(true);

  const start = await hp();
  await game.playCard('Heating Up', 0);
  expect(await player('fuming')).toBe(1);
  expect(await player('ignite')).toBe(0); // playing Heating Up gives no Ignite

  await game.playCard('Strike', 0); // Ignite 0 -> normal 6, then Ignite 1
  expect(start - (await hp())).toBe(6);
  expect(await player('ignite')).toBe(1);

  await game.playCard('Strike', 0); // Ignite 1 -> x2 = 12, then Ignite 2
  expect(start - (await hp())).toBe(6 + 12);
  expect(await player('ignite')).toBe(2);

  // the live number on the cards in hand: Strike x4 = 24, Scorching Wind is not multiplied (2)
  expect(await game.hasText('Deal 24 damage.')).toBe(true);
  expect(await game.hasText(/^Deal 2 damage./)).toBe(true);

  await game.playCard('Scorching Wind', 0); // ignores Ignite: its normal 2, still grants Ignite 3
  expect(start - (await hp())).toBe(6 + 12 + 2);
  expect(await player('ignite')).toBe(3);

  await game.playCard('Strike', 0); // Ignite 3 -> x8 = 48
  expect(start - (await hp())).toBe(6 + 12 + 2 + 48);

  // both badges are on screen with their counts, and end of turn clears them
  expect(await game.hasText('Fu')).toBe(true);
  expect(await game.hasText('Ig')).toBe(true);
  await game.endTurn();
  expect(await player('fuming')).toBe(0);
  expect(await player('ignite')).toBe(0);
  game.check();
});
