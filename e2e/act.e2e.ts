import { expect, test } from './harness';
import type { Harness } from './harness';
import { chooseMapStop, firstPeacefulEventChoice } from './flows';

// (g) A whole seeded act, played by a simple policy through the real UI (mouse on the map and
// menus, number keys and E in the fight), until the run-end screen. The policy is not clever: it
// only has to keep the game moving. Whether it wins or dies is reported, not asserted.

let healed = 0;

interface Snapshot {
  scene: string;
  hp: number;
  gold: number;
  deck: number;
  position: string | null;
  phase: string;
}

async function snapshot(game: Harness): Promise<Snapshot> {
  const run = await game.run();
  return { scene: await game.scene(), hp: run.hp, gold: run.gold, deck: run.deck.length, position: run.position, phase: run.phase };
}

async function playFightTurns(game: Harness): Promise<void> {
  for (let turn = 0; turn < 40; turn++) {
    let truth = await game.combatTruth();
    if (truth.phase !== 'playerTurn') return;
    for (let plays = 0; plays < 15; plays++) {
      truth = await game.combatTruth();
      if (truth.phase !== 'playerTurn') return;
      // choose a card: defend first while the announced attacks would get through, else attack, else anything
      const slot: number = await game.page.evaluate(async () => {
        const combat = (await (window as any).__imp('/src/session.ts')).getCurrentCombat();
        const incoming = combat.livingEnemies.reduce((sum: number, e: any) => sum + (combat.intentDamage(e) ?? 0), 0);
        const exposed = incoming > combat.player.block;
        const options = combat.deck.hand
          .map((c: any, i: number) => ({ i, def: c.definition }))
          .filter((o: any) => o.def.cost <= combat.energy && o.i < 9);
        const rank = (def: any): number => {
          const blocks = (def.effects ?? []).some((e: any) => e.kind === 'block');
          if (def.type === 'power') return 0;
          if (exposed) return blocks ? 1 : def.type === 'attack' ? 2 : 3;
          return def.type === 'attack' ? 1 : 2;
        };
        options.sort((a: any, b: any) => rank(a.def) - rank(b.def) || a.i - b.i);
        return options.length === 0 ? -1 : options[0].i;
      });
      if (slot < 0) break;
      await game.key(String(slot + 1));
      await game.settle();
      await game.expectReadoutsMatchTruth();
    }
    truth = await game.combatTruth();
    if (truth.phase !== 'playerTurn') return;
    await game.key('e');
    await game.settle();
    await game.expectReadoutsMatchTruth();
  }
  throw new Error('a fight went on for 40 turns');
}

async function playStop(game: Harness): Promise<void> {
  const scene = await game.scene();
  const run = await game.run();
  switch (scene) {
    case 'MapScene': {
      // keep HP up: rest when hurt, else take shops and events, fight when there is no choice; elites last
      const order = run.hp < run.maxHp * 0.7 ? ['rest', 'shop', 'event', 'combat', 'elite', 'boss'] : ['shop', 'event', 'combat', 'rest', 'elite', 'boss'];
      const kind = order.find((k) => run.choices.some((c) => c.kind === k));
      if (run.hp < run.maxHp * 0.5) {
        // a stand-in for the dev panel's "Heal full": the map offers few rests, and this test is
        // about the screens working all the way to the end, not about the policy surviving
        await game.page.evaluate(async () => {
          const r = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
          r.hp = r.maxHp;
        });
        healed++;
      }
      await chooseMapStop(game, kind);
      break;
    }
    case 'CombatScene':
      if (await game.hasText('VICTORY')) await game.clickText('Continue');
      else if (await game.hasText('DEFEAT')) await game.clickText('Continue');
      else await playFightTurns(game);
      break;
    case 'RewardScene':
      await game.key('1'); // the first offered card
      break;
    case 'RestScene':
      if (run.hp < run.maxHp * 0.8) await game.clickText(/^Rest( \(\+\d+ HP\))?$/);
      else {
        await game.clickText('Upgrade a card');
        await game.clickText('Strike');
        await game.clickText('Upgrade');
      }
      break;
    case 'ShopScene':
      for (const slot of ['1', '2', '3', '4']) await game.key(slot); // buys what it can afford
      await game.key('l');
      break;
    case 'EventScene': {
      if (await game.hasText('Continue')) await game.clickText('Continue');
      else await game.clickText((await firstPeacefulEventChoice(game)).label);
      break;
    }
    default:
      await game.step(5, 33);
  }
}

test('(g) a whole seeded act, played through the real UI to the run-end screen', async ({ game }) => {
  test.setTimeout(900_000);
  game.settleDt = 100;
  await game.open('seed=1');
  await game.waitForScene('MapScene');

  const visited: string[] = [];
  let stuck = 0;
  let last = '';
  let finished = false;
  for (let i = 0; i < 400 && !finished; i++) {
    const before = await snapshot(game);
    if (before.scene === 'RunEndScene') {
      finished = true;
      break;
    }
    if (visited[visited.length - 1] !== before.scene) visited.push(before.scene);
    await playStop(game);
    await game.step(10, 33);

    const after = await snapshot(game);
    const run = await game.run();
    expect(run.hp, 'HP never exceeds max').toBeLessThanOrEqual(run.maxHp);
    expect(run.gold).toBeGreaterThanOrEqual(0);
    const fingerprint = JSON.stringify(after);
    stuck = fingerprint === last ? stuck + 1 : 0;
    last = fingerprint;
    expect(stuck, `the run stopped advancing in ${after.scene}`).toBeLessThan(6);
    if ((await game.scene()) === 'RunEndScene') finished = true;
  }

  expect(finished, 'the run reached the run-end screen').toBe(true);
  await game.waitForScene('RunEndScene');
  const run = await game.run();
  const won = run.phase === 'won';
  expect(['won', 'lost']).toContain(run.phase);
  expect(await game.hasText(won ? 'ACT COMPLETE' : 'DEFEATED')).toBe(true);
  expect(await game.hasText(`Seed ${run.seed}`)).toBe(true);
  console.log(`ACT RESULT: ${run.phase}; floor ${run.floor}; hp ${run.hp}/${run.maxHp}; deck ${run.deck.length}; heals ${healed}; scenes seen: ${[...new Set(visited)].join(', ')}`);

  // a finished run leaves no save to continue
  await game.reload();
  await game.waitForScene('MapScene'); // BootScene starts a fresh run at once: nothing to continue
});
