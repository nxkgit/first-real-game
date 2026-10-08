import { expect, test } from './harness';

// The starter-deck draft (DESIGN_LOG.md "Starter deck draft", 2026-10-08): a New Run now opens an
// intro screen, then 10 forced 1-of-3 picks (the reward screen, reused), before the map appears.
// Every other e2e test skips this via `game.open()`'s default `completeDraftIfPending()`; this file
// is the one that actually plays it with real clicks.

const pickFirstOffered = async (game: import('./harness').Harness): Promise<string> => {
  const offered = await game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun(); // eslint-disable-line @typescript-eslint/no-explicit-any
    return run.pendingDraftOffer.map((c: any) => c.id as string); // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  await game.click(400 - ((offered.length - 1) * 150) / 2, 275); // the first offered card
  return offered[0];
};

test('(h) the starter-deck draft: intro, 10 forced picks, no gold or skip, lands on the map with the drafted deck', async ({ game }) => {
  await game.open('seed=7', { skipDraft: false });
  await game.waitForScene('DraftIntroScene');
  expect(await game.hasText('Build your deck')).toBe(true);

  const run = await game.run();
  expect(run.phase).toBe('draft');
  expect(run.deck).toHaveLength(0);

  await game.clickText('Proceed');
  await game.waitForScene('RewardScene');

  const picked: string[] = [];
  for (let i = 0; i < 10; i++) {
    expect(await game.hasText('Choose a starting card')).toBe(true);
    expect(await game.hasText(`Pick one card for your starting deck (${i + 1} of 10).`)).toBe(true);
    expect(await game.hasText(/gold/i)).toBe(false); // no gold option during the draft
    const offer = await game.page.evaluate(
      async () => (await (window as any).__imp('/src/session.ts')).getCurrentRun().pendingDraftOffer.map((c: any) => c.id as string) // eslint-disable-line @typescript-eslint/no-explicit-any
    );
    expect(offer, `round ${i + 1} offers 3 distinct cards`).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    picked.push(await pickFirstOffered(game));
    if (i < 9) await game.waitForScene('RewardScene');
  }

  await game.waitForScene('MapScene');
  const after = await game.run();
  expect(after.phase).toBe('map');
  expect(after.deck).toHaveLength(10);
  const deckIds = await game.page.evaluate(
    async () => (await (window as any).__imp('/src/session.ts')).getCurrentRun().deck.map((c: any) => c.id as string) // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  expect(deckIds).toEqual(picked);
});
