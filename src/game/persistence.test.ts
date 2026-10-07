import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { RunState } from './RunState';
import type { RunNode } from './RunState';
import { Rng } from './rng';
import { buildRunReport, formatRunReport } from './runReport';
import { parseSavedRun, restoreRun } from './save';
import type { CardDefinition, EnemyDefinition } from './types';

function card(id: string): CardDefinition {
  return { id, name: id, type: 'skill', cost: 1, owner: 'test', inRewardPool: true };
}

const FOE: EnemyDefinition = {
  id: 'foe',
  name: 'Foe',
  maxHp: 10,
  movePattern: [{ name: 'A', effects: [{ kind: 'damage', value: 1 }] }],
};
const NODES: RunNode[] = [{ kind: 'combat', enemies: [FOE] }, { kind: 'shop' }, { kind: 'rest' }, { kind: 'combat', enemies: [FOE] }];
const CARDS = ['s1', 's2', 'p1', 'p2', 'p3', 'p4', 'p5'].map(card);
const lookup = (id: string): CardDefinition => {
  const found = CARDS.find((c) => c.id === id);
  if (!found) throw new Error(`unknown ${id}`);
  return found;
};
const STARTER = [CARDS[0], CARDS[1]];
const POOL = CARDS.slice(2);

function fresh(seed = 7): RunState {
  return new RunState(NODES, STARTER, POOL, new Rng(seed));
}

describe('Rng', () => {
  it('gives the same numbers for the same seed, and different ones for a different seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seq = (r: Rng): number[] => Array.from({ length: 5 }, () => r.next());
    expect(seq(a)).toEqual(seq(b));
    expect(seq(new Rng(43))).not.toEqual(seq(new Rng(42)));
  });

  it('stays in [0, 1)', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const n = r.next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('can be restored from its seed and position and carries on identically', () => {
    const r = new Rng(9);
    r.next();
    r.next();
    const twin = Rng.restore(r.seed, r.position);
    expect([r.next(), r.next()]).toEqual([twin.next(), twin.next()]);
  });
});

describe('seeded fights', () => {
  it('the same seed deals the same opening hand and the same later hands', () => {
    const deck = Array.from({ length: 12 }, (_, i) => card(`c${i}`));
    const play = (seed: number): string[] => {
      const rng = new Rng(seed);
      const combat = new CombatState(deck, [FOE], undefined, () => rng.next());
      combat.start();
      const hands = [combat.deck.hand.map((c) => c.definition.id).join(',')];
      combat.endPlayerTurn();
      hands.push(combat.deck.hand.map((c) => c.definition.id).join(','));
      return hands;
    };
    expect(play(5)).toEqual(play(5));
    expect(play(5)).not.toEqual(play(6));
  });
});

describe('saving and restoring a run', () => {
  it('restores everything: position, hp, gold, deck, rewards, shop and history', () => {
    const run = fresh();
    run.finishCombat('won', 40, 3);
    run.takeRewardGold();
    run.gold = 100;
    const shopCard = run.shopItems[0].card;
    run.buyShopItem(0);
    const saved = JSON.parse(JSON.stringify(run.toSaved())); // through text, as storage would
    const back = restoreRun(saved, NODES, POOL, lookup);
    expect(back).not.toBeNull();
    expect(back!.nodeIndex).toBe(1);
    expect(back!.hp).toBe(40);
    expect(back!.gold).toBe(60);
    expect(back!.deck.map((c) => c.id)).toEqual(run.deck.map((c) => c.id));
    expect(back!.deck).toContain(shopCard);
    expect(back!.shopItems.map((i) => [i.card.id, i.sold])).toEqual(run.shopItems.map((i) => [i.card.id, i.sold]));
    expect(back!.history).toEqual(run.history);
  });

  it('restores a pending reward as it was offered', () => {
    const run = fresh();
    run.finishCombat('won', 50, 2);
    const back = restoreRun(JSON.parse(JSON.stringify(run.toSaved())), NODES, POOL, lookup)!;
    expect(back.phase).toBe('reward');
    expect(back.pendingReward!.cards.map((c) => c.id)).toEqual(run.pendingReward!.cards.map((c) => c.id));
  });

  it('a resumed run continues with exactly the same randomness as one that was never interrupted', () => {
    const play = (interrupt: boolean): string[] => {
      let run = fresh(11);
      run.newCombatRng(); // the first fight draws its seed
      run.finishCombat('won', 50, 2);
      if (interrupt) run = restoreRun(JSON.parse(JSON.stringify(run.toSaved())), NODES, POOL, lookup)!;
      const offered = run.pendingReward!.cards.map((c) => c.id);
      run.takeRewardGold();
      const fightSeed = run.newCombatRng().seed;
      return [...offered, String(fightSeed)];
    };
    expect(play(true)).toEqual(play(false));
  });

  it('refuses data that is damaged, from another version, or about a different path', () => {
    const good = JSON.parse(JSON.stringify(fresh().toSaved()));
    expect(restoreRun(good, NODES, POOL, lookup)).not.toBeNull();
    expect(restoreRun(null, NODES, POOL, lookup)).toBeNull();
    expect(restoreRun('nonsense', NODES, POOL, lookup)).toBeNull();
    expect(restoreRun({ ...good, version: 2 }, NODES, POOL, lookup)).toBeNull();
    expect(restoreRun({ ...good, hp: 'lots' }, NODES, POOL, lookup)).toBeNull();
    expect(restoreRun({ ...good, nodeCount: 99 }, NODES, POOL, lookup)).toBeNull();
    expect(restoreRun({ ...good, deck: ['no-such-card'] }, NODES, POOL, lookup)).toBeNull();
    expect(restoreRun({ ...good, phase: 'dancing' }, NODES, POOL, lookup)).toBeNull();
    expect(parseSavedRun({})).toBeNull();
  });
});

describe('run report', () => {
  it('records each stop as it happens', () => {
    const run = fresh();
    run.finishCombat('won', 44, 4);
    const offered = run.pendingReward!.cards.map((c) => c.id);
    run.takeRewardCard(1);
    run.leaveShop();
    run.rest();
    run.finishCombat('won', 30, 6);
    expect(run.history).toEqual([
      { kind: 'combat', floor: 1, enemies: ['foe'], result: 'won', turns: 4, hpAfter: 44 },
      { kind: 'reward', floor: 1, offered, choice: 'card', cardId: offered[1] },
      { kind: 'shop', floor: 2, bought: [], goldSpent: 0 },
      { kind: 'rest', floor: 3, healed: 16 },
      { kind: 'combat', floor: 4, enemies: ['foe'], result: 'won', turns: 6, hpAfter: 30 },
    ]);
  });

  it('summarises the run, with the deck as counts, and prints as JSON', () => {
    const run = fresh(3);
    run.finishCombat('lost', 0, 5);
    const report = buildRunReport(run);
    expect(report).toMatchObject({ version: 1, seed: 3, result: 'lost', floorReached: 1, totalFloors: 4, deckSize: 2 });
    expect(report.deck).toEqual({ s1: 1, s2: 1 });
    expect(JSON.parse(formatRunReport(report))).toEqual(report);
  });

  it('says a run in progress is in progress', () => {
    expect(buildRunReport(fresh()).result).toBe('in progress');
  });
});
