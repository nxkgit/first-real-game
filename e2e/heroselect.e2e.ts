/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Multiple heroes (implementationplan.md "Multiple heroes and hero selection", 2026-10-09): hero
// select on a new run only; Continue goes straight back into the saved hero; each hero's own stats,
// resource readout and Radiant Light cards in a fight.

const readLabels = async (game: import('./harness').Harness): Promise<string[]> => (await game.labels()).map((l) => l.text);

test('a new run opens the hero select screen with the stats of each hero, then the draft as that hero', async ({ game }) => {
  await game.open('seed=5', { skipDraft: false, heroSelect: true });
  await game.waitForScene('HeroSelectScene');
  expect(await game.hasText('Choose your hero')).toBe(true);
  expect(await game.hasText('Mage')).toBe(true);
  expect(await game.hasText('Paladin')).toBe(true);
  expect(await game.hasText('Max HP 60    Energy 4')).toBe(true);
  expect(await game.hasText('Max HP 54    Energy 3')).toBe(true);
  expect(await game.hasText('Resource: Temperature')).toBe(true);
  expect(await game.hasText('Resource: Radiant Light')).toBe(true);
  // the blurb is the literal placeholder, once per hero
  expect((await readLabels(game)).filter((t) => t === 'placeholder blurb')).toHaveLength(2);
  expect((await readLabels(game)).some((t) => /Hero power \(1 energy\)/.test(t))).toBe(true);

  await game.clickText('Play Paladin');
  await game.waitForScene('DraftIntroScene');
  const run = await game.run();
  expect(run.heroId).toBe('paladin');
  expect(run.maxHp).toBe(54);
  expect(run.hp).toBe(54);
  expect(run.seed).toBe(5);
  game.check();
});

test('Continue goes straight back into the saved hero without offering the select screen; New Run does offer it', async ({ game }) => {
  await game.open('seed=8', { skipDraft: false, heroSelect: true });
  await game.waitForScene('HeroSelectScene');
  await game.clickText('Play Paladin');
  await game.waitForScene('DraftIntroScene');
  await game.completeDraftIfPending();
  await game.waitForScene('MapScene');

  await game.reload({ skipDraft: false });
  await game.waitForScene('BootScene');
  expect(await game.hasText('Continue')).toBe(true);
  expect(await game.hasText('Playing as the Paladin')).toBe(true);
  await game.clickText('Continue');
  await game.waitForScene('MapScene');
  expect((await game.run()).heroId).toBe('paladin');

  await game.reload({ skipDraft: false });
  await game.waitForScene('BootScene');
  await game.clickText('New Run');
  await game.waitForScene('HeroSelectScene');
  await game.clickText('Play Mage');
  await game.waitForScene('DraftIntroScene');
  const run = await game.run();
  expect(run.heroId).toBe('mage');
  expect(run.maxHp).toBe(60);
  game.check();
});

test('a Mage fight shows Temperature and not Radiant Light, with 4 energy', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('strike'), ['enemy-a']);
  const truth = await game.combatTruth();
  expect(truth.maxEnergy).toBe(4);
  expect(truth.maxHp).toBe(60);
  const text = await readLabels(game);
  expect(text.some((t) => /^Temp /.test(t))).toBe(true);
  expect(text.some((t) => /^Light /.test(t))).toBe(false);
  game.check();
});

test('a Paladin fight: 54 HP, 3 energy, its own hero power, a Radiant Light readout and no Temperature', async ({ game }) => {
  await game.open('seed=1&hero=paladin');
  await game.waitForScene('MapScene');
  await game.startFightWith(Array(10).fill('placeholder-block-light'), ['enemy-a']);
  await game.expectReadoutsMatchTruth();
  const truth = await game.combatTruth();
  expect(truth.maxEnergy).toBe(3);
  expect(truth.maxHp).toBe(54);
  const text = await readLabels(game);
  expect(text).toContain('PALADIN');
  expect(text).toContain('Light 0');
  expect(text.some((t) => /^Temp /.test(t))).toBe(false);
  expect(text).toContain('Hero Power (1)');

  // the Paladin's placeholder hero power draws a card for 1 energy
  const handBefore = (await game.combatTruth()).hand.length;
  await game.clickText('Hero Power (1)');
  await game.settle();
  const afterPower = await game.combatTruth();
  expect(afterPower.hand.length).toBe(handBefore + 1);
  expect(afterPower.energy).toBe(2);
  game.check();
});

test('Radiant Light is gained from a card, shown, then spent without touching energy, and carries to the next turn', async ({ game }) => {
  await game.open('seed=1&hero=paladin');
  await game.waitForScene('MapScene');
  await game.startFightWith([...Array(5).fill('placeholder-block-light'), ...Array(5).fill('placeholder-light-attack')], ['enemy-b']);
  // make sure both kinds are in the hand: put them there directly, then let the scene catch up
  await game.page.evaluate(async () => {
    const c = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
    const cards = await (window as any).__imp('/src/data/cards.ts');
    c.deck.addCopiesToHand(cards.getCard('placeholder-block-light'), 1);
    c.deck.addCopiesToHand(cards.getCard('placeholder-light-attack'), 1);
    c.emitHandChanged();
  });
  await game.settle();

  const hpBefore = (await game.combatTruth()).enemies[0].hp;
  // not enough Light yet: the Light card cannot be played
  const canPlayEarly = await game.page.evaluate(async () => {
    const c = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
    return c.canPlay(c.deck.hand.find((x: any) => x.definition.id === 'placeholder-light-attack'));
  });
  expect(canPlayEarly).toBe(false);

  await game.playCard('Block + Light');
  expect(await game.hasText('Light 2')).toBe(true);
  await game.playCard('Block + Light');
  expect(await game.hasText('Light 4')).toBe(true);

  const energyBefore = (await game.combatTruth()).energy;
  await game.playCard('Light Attack', 0);
  expect(await game.hasText('Light 2')).toBe(true); // 4 - 2
  const after = await game.combatTruth();
  expect(after.energy).toBe(energyBefore); // Radiant Light paid, not energy
  expect(after.enemies[0].hp).toBe(hpBefore - 14);

  // it carries into the next turn
  await game.endTurn();
  await game.settle();
  expect(await game.hasText('Light 2')).toBe(true);
  game.check();
});
