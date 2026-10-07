import { expect, test } from './harness';
import type { Harness } from './harness';

// (e) One small fight per synergy mechanic (cards from src/data/synergyCards.ts). Each deck has at
// most five cards, so the whole deck is the opening hand and nothing depends on shuffling. Expected
// numbers are worked out by hand from the card data (noted per test) and are provisional like the
// cards themselves; the readouts are also compared with CombatState after every play.

async function fight(game: Harness, deck: string[], enemies = ['enemy-a']): Promise<void> {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await game.startFightWith(deck, enemies);
  const truth = await game.expectReadoutsMatchTruth();
  expect(truth.hand.slice().sort()).toEqual(
    (await game.page.evaluate(async (ids) => {
      const cards = await (window as any).__imp('/src/data/cards.ts');
      return ids.map((id) => cards.getCard(id).name);
    }, deck)).sort()
  );
}

/** Plays a card with the real mouse and checks every readout against CombatState. */
async function play(game: Harness, name: string) {
  await game.playCard(name, 0);
  return game.expectReadoutsMatchTruth();
}

async function playerStatus(game: Harness, status: string): Promise<number> {
  return game.page.evaluate(async (id) => {
    const combat = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
    return (combat.player.statuses[id] as number | undefined) ?? 0;
  }, status);
}

test('(e) scaling attacks: Combo Strike counts cards played, Block Slam counts block', async ({ game }) => {
  await fight(game, ['prime-a', 'prime-a', 'combo-strike', 'block-slam']);
  let t = await play(game, 'Prime A');
  t = await play(game, 'Prime A');
  expect(t.block, 'two Prime A give 3 block each').toBe(6);
  expect(t.energy, 'Prime A costs 0').toBe(4);
  t = await play(game, 'Combo Strike'); // 4 + 3 per card already played this turn (2) = 10
  expect(t.enemies[0].hp).toBe(40 - 10);
  t = await play(game, 'Block Slam'); // damage = current block = 6
  expect(t.enemies[0].hp).toBe(40 - 10 - 6);
  expect(t.energy).toBe(2);
});

test('(e) empowered doubles the next attack, and an exhaust card leaves the deck', async ({ game }) => {
  await fight(game, ['power-up', 'single-use-strike']);
  let t = await play(game, 'Power Up');
  expect(await playerStatus(game, 'empowered')).toBe(1);
  t = await play(game, 'Single Use Strike'); // 10 doubled
  expect(t.enemies[0].hp).toBe(40 - 20);
  expect(t.exhaust, 'the played Exhaust card is in the exhaust pile').toBe(1);
  expect(await playerStatus(game, 'empowered'), 'empowered is used up').toBe(0);
  expect(t.energy).toBe(2);
});

test('(e) exhaust payoff scales with cards exhausted', async ({ game }) => {
  await fight(game, ['single-use-strike', 'exhaust-payoff']);
  await play(game, 'Single Use Strike');
  const t = await play(game, 'Exhaust Payoff'); // 2 + 3 per card exhausted (1) = 5
  expect(t.enemies[0].hp).toBe(40 - 10 - 5);
});

test('(e) energy gain and exhausting from the hand: Cull', async ({ game }) => {
  await fight(game, ['cull', 'prime-a']);
  const t = await play(game, 'Cull'); // exhausts itself and (the only other card) Prime A, gains 1 energy
  expect(t.exhaust).toBe(2);
  expect(t.energy, 'Cull costs 0 and gives 1 energy').toBe(5);
  expect(t.hand).toEqual([]);
  expect(await game.hasText('5/4')).toBe(true);
});

test('(e) trigger powers: on card played, and at end of turn through the enemy turn', async ({ game }) => {
  await fight(game, ['attack-echo', 'end-guard', 'single-use-strike']);
  await play(game, 'Attack Echo');
  await play(game, 'End Guard');
  let t = await play(game, 'Single Use Strike');
  expect(t.enemies[0].hp).toBe(40 - 10);
  expect(t.block, 'Attack Echo gives 2 block when an attack is played').toBe(2);

  // End of turn: End Guard adds 4 block (total 6) before the enemy's 8-damage attack lands: 2 HP is lost.
  await game.endTurn();
  t = await game.expectReadoutsMatchTruth();
  expect(t.turn).toBe(2);
  expect(t.hp).toBe(60 - 2);
});

test('(e) trigger on kill gives energy; empowered kill', async ({ game }) => {
  await fight(game, ['kill-reward', 'power-up', 'single-use-strike'], ['enemy-d']); // enemy D has 20 HP
  await play(game, 'Kill Reward');
  await play(game, 'Power Up');
  const t = await play(game, 'Single Use Strike'); // 20 damage kills it
  expect(t.phase).toBe('won');
  expect(t.energy, '4 - 3 spent + 1 from Kill Reward').toBe(2);
  expect(await game.hasText('VICTORY')).toBe(true);
});

test('(e) self-damage: Blood Strike costs HP, and Pain Engine reacts to it', async ({ game }) => {
  await fight(game, ['pain-engine', 'blood-strike']);
  await play(game, 'Pain Engine');
  const t = await play(game, 'Blood Strike');
  expect(t.hp, 'Blood Strike loses 3 HP').toBe(57);
  expect(await playerStatus(game, 'strength'), 'Pain Engine: +1 strength for HP lost').toBe(1);
  // the loss comes first, so the strength is already there for the 14 damage
  expect(t.enemies[0].hp).toBe(40 - 15);
});
