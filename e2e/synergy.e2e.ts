import { expect, test } from './harness';
import type { Harness } from './harness';
import { ENEMIES } from '../src/data/enemies';

const ENEMY_A_HP = ENEMIES['enemy-a'].maxHp;

// (e) One small fight per synergy mechanic (cards from src/data/synergyCards.ts). Each deck has at
// most five cards, so the whole deck is the opening hand and nothing depends on shuffling. Expected
// numbers are worked out by hand from the card data (noted per test) and are provisional like the
// cards themselves; the readouts are also compared with CombatState after every play.

/** `maxHp` overrides enemy max HP for this fresh page only (a test that needs an exact kill). */
async function fight(game: Harness, deck: string[], enemies = ['enemy-a'], maxHp: Record<string, number> = {}): Promise<void> {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await game.page.evaluate(async (hp) => {
    const { ENEMIES } = await (window as any).__imp('/src/data/enemies.ts');
    for (const [id, v] of Object.entries(hp)) ENEMIES[id].maxHp = v;
  }, maxHp);
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
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 10);
  t = await play(game, 'Block Slam'); // damage = current block = 6
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 10 - 6);
  expect(t.energy).toBe(2);
});

test('(e) empowered doubles the next attack, and an exhaust card leaves the deck', async ({ game }) => {
  await fight(game, ['power-up', 'single-use-strike']);
  let t = await play(game, 'Power Up');
  expect(await playerStatus(game, 'empowered')).toBe(1);
  t = await play(game, 'Single Use Strike'); // 10 doubled
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 20);
  expect(t.exhaust, 'the played Exhaust card is in the exhaust pile').toBe(1);
  expect(await playerStatus(game, 'empowered'), 'empowered is used up').toBe(0);
  expect(t.energy).toBe(2);
});

test('(e) exhaust payoff scales with cards exhausted', async ({ game }) => {
  await fight(game, ['single-use-strike', 'exhaust-payoff']);
  await play(game, 'Single Use Strike');
  const t = await play(game, 'Exhaust Payoff'); // 2 + 3 per card exhausted (1) = 5
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 10 - 5);
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
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 10);
  expect(t.block, 'Attack Echo gives 2 block when an attack is played').toBe(2);

  // End of turn: End Guard adds 4 block (total 6) before the enemy's attack lands (11 damage since
  // the 2026-10-08 enemy-damage pass, DESIGN_LOG.md "Enemy HP cut 40%..."; was 8): 5 HP is lost.
  await game.endTurn();
  t = await game.expectReadoutsMatchTruth();
  expect(t.turn).toBe(2);
  expect(t.hp).toBe(60 - 5);
});

test('(e) trigger on kill gives energy; empowered kill', async ({ game }) => {
  // Single Use Strike deals 20, so give enemy D exactly 20 HP
  await fight(game, ['kill-reward', 'power-up', 'single-use-strike'], ['enemy-d'], { 'enemy-d': 20 });
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
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 15);
});

// ---- the cards the first batch of tests left out (2026-10-07 follow-up) ----

test('(e) Opportunist scales with the target\'s Vulnerable; Hand Strike with the cards still in hand', async ({ game }) => {
  await fight(game, ['expose', 'opportunist', 'hand-strike', 'defend']);
  let t = await play(game, 'Expose'); // Vulnerable 2 on the enemy
  t = await play(game, 'Opportunist'); // (4 + 4 x 2) = 12, x1.5 Vulnerable = 18
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 18);
  // Hand Strike: 2 + 2 per card left in hand once it has left it (Defend only = 1) = 4, x1.5 = 6
  t = await play(game, 'Hand Strike');
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 18 - 6);
});

test('(e) Double Strength doubles Strength and exhausts', async ({ game }) => {
  await fight(game, ['pain-engine', 'blood-strike', 'double-strength']);
  await play(game, 'Pain Engine');
  await play(game, 'Blood Strike'); // loses 3 HP: Strength 1
  const t = await play(game, 'Double Strength');
  expect(await playerStatus(game, 'strength')).toBe(2);
  expect(t.exhaust).toBe(1);
});

test('(e) Block Spark hits once per turn when block is gained; Opening Spark hits at each turn start', async ({ game }) => {
  await fight(game, ['block-spark', 'opening-spark', 'defend', 'defend']);
  await play(game, 'Block Spark');
  await play(game, 'Opening Spark');
  let t = await play(game, 'Defend'); // block gained: 3 damage
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 3);
  t = await play(game, 'Defend'); // once per turn: no second hit
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 3);
  expect(t.energy).toBe(0);
  await game.endTurn(); // enemy turn, then turn 2 starts: Opening Spark hits for 3
  t = await game.expectReadoutsMatchTruth();
  expect(t.turn).toBe(2);
  expect(t.enemies[0].hp).toBe(ENEMY_A_HP - 3 - 3);
  game.check();
});

test('(e) Exhaust Engine draws a card whenever one is exhausted', async ({ game }) => {
  // seven cards, so there is a draw pile (the helper above wants the whole deck in hand)
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await game.startFightWith(['exhaust-engine', 'single-use-strike', 'defend', 'defend', 'defend', 'strike', 'strike'], ['enemy-a']);
  const before = await game.combatTruth();
  await play(game, 'Exhaust Engine');
  const t = await play(game, 'Single Use Strike'); // exhausts, so draws 1
  expect(t.exhaust).toBe(1);
  expect(t.hand.length, 'started with 5, played 2, drew 1').toBe(before.hand.length - 2 + 1);
});

test('(e) self-inflicted HP loss shows a floating number (audit R1)', async ({ game }) => {
  await fight(game, ['pain-engine', 'blood-strike']);
  await game.page.evaluate(() => {
    const w = window as any;
    const scene = w.__game.scene.getScenes(true)[0];
    w.__floating = [];
    const original = scene.spawnFloatingText.bind(scene);
    scene.spawnFloatingText = (...args: unknown[]) => {
      w.__floating.push(String(args[2]));
      return original(...args);
    };
  });
  await play(game, 'Pain Engine');
  await play(game, 'Blood Strike');
  const floating: string[] = await game.page.evaluate(() => (window as any).__floating);
  expect(floating).toContain('-3'); // the 3 HP Blood Strike costs the player
  game.check();
});
