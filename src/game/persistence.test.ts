import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { RunState } from './RunState';
import { Rng } from './rng';
import { buildRunReport, formatRunReport } from './runReport';
import { parseSavedRun, restoreRun } from './save';
import { STARTER, TEST_EVENT, FOE, card, chainMap, world } from './testHelpers';
import type { MapNodeKind } from './actMap';
import type { RelicDefinition } from './types';

const RELIC: RelicDefinition = { id: 'r1', name: 'R1', onPickup: [{ kind: 'maxHp', value: 10 }] };
const KINDS: MapNodeKind[] = ['combat', 'shop', 'rest', 'event', 'elite', 'boss'];
const W = world({ relics: [RELIC] });

function fresh(seed = 7, kinds: MapNodeKind[] = KINDS): RunState {
  return new RunState(chainMap(kinds), STARTER, W, new Rng(seed));
}
const roundTrip = (run: RunState): unknown => JSON.parse(JSON.stringify(run.toSaved()));

describe('Rng', () => {
  it('gives the same numbers for the same seed, and different ones for a different seed', () => {
    const seq = (r: Rng): number[] => Array.from({ length: 5 }, () => r.next());
    expect(seq(new Rng(42))).toEqual(seq(new Rng(42)));
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
      const combat = new CombatState(deck, [FOE], { random: () => rng.next() });
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
  it('restores everything: place on the map, hp, gold, deck, relics, rewards, shop and history', () => {
    const run = fresh();
    run.chooseNode('0-0');
    run.finishCombat('won', 40, 3);
    run.takeRewardGold();
    run.chooseNode('1-0'); // the shop
    run.gold = 100;
    const shopCard = run.shopItems[0].card;
    run.buyShopItem(0);
    run.grantRelic(RELIC);
    const back = restoreRun(roundTrip(run), W);
    expect(back).not.toBeNull();
    expect(back!.position).toBe('1-0');
    expect(back!.visited).toEqual(['0-0', '1-0']);
    expect(back!.phase).toBe('inNode');
    expect(back!.hp).toBe(run.hp);
    expect(back!.maxHp).toBe(70);
    expect(back!.gold).toBe(run.gold);
    expect(back!.deck.map((c) => c.id)).toEqual(run.deck.map((c) => c.id));
    expect(back!.deck).toContain(shopCard);
    expect(back!.relics.map((r) => r.id)).toEqual(['r1']);
    expect(back!.shopItems.map((i) => [i.card.id, i.sold])).toEqual(run.shopItems.map((i) => [i.card.id, i.sold]));
    expect(back!.history).toEqual(run.history);
    expect(back!.takeNotice()).toEqual(['Gained R1.']);
  });

  it('restores a pending reward as it was offered, and a relic on it', () => {
    const run = fresh(7, ['elite', 'rest']);
    run.chooseNode('0-0');
    run.finishCombat('won', 50, 2);
    const back = restoreRun(roundTrip(run), W)!;
    expect(back.phase).toBe('reward');
    expect(back.pendingReward!.cards.map((c) => c.id)).toEqual(run.pendingReward!.cards.map((c) => c.id));
    expect(back.pendingReward!.relic?.id).toBe('r1');
  });

  it('restores a fight an event started, with what waits for a win', () => {
    const run = fresh(7, ['event', 'rest']);
    run.chooseNode('0-0');
    run.chooseEventOption(2); // fight, then +99 gold
    const back = restoreRun(roundTrip(run), W)!;
    expect(back.currentNode).toMatchObject({ kind: 'combat' });
    back.finishCombat('won', 40);
    expect(back.gold).toBe(99);
    expect(back.phase).toBe('map');
  });

  it('restores the map position between stops', () => {
    const run = fresh(7, ['combat', 'rest']);
    expect(restoreRun(roundTrip(run), W)!.phase).toBe('map');
    run.chooseNode('0-0');
    run.finishCombat('won', 50);
    run.takeRewardGold();
    const back = restoreRun(roundTrip(run), W)!;
    expect(back.phase).toBe('map');
    expect(back.mapChoices.map((n) => n.id)).toEqual(['1-0']);
  });

  it('a resumed run continues with exactly the same randomness as one that was never interrupted', () => {
    const play = (interrupt: boolean): string[] => {
      let run = fresh(11, ['combat', 'combat', 'rest']);
      run.chooseNode('0-0');
      run.newCombatRng(); // the first fight draws its seed
      run.finishCombat('won', 50, 2);
      if (interrupt) run = restoreRun(roundTrip(run), W)!;
      const offered = run.pendingReward!.cards.map((c) => c.id);
      run.takeRewardGold();
      run.chooseNode('1-0');
      return [...offered, String(run.newCombatRng().seed)];
    };
    expect(play(true)).toEqual(play(false));
  });

  it('refuses data that is damaged, from another version, or about content that is gone', () => {
    const good = roundTrip(fresh()) as Record<string, unknown>;
    expect(restoreRun(good, W)).not.toBeNull();
    expect(restoreRun(null, W)).toBeNull();
    expect(restoreRun('nonsense', W)).toBeNull();
    expect(restoreRun({ ...good, version: 1 }, W)).toBeNull();
    expect(restoreRun({ ...good, hp: 'lots' }, W)).toBeNull();
    expect(restoreRun({ ...good, deck: ['no-such-card'] }, W)).toBeNull();
    expect(restoreRun({ ...good, relics: ['no-such-relic'] }, W)).toBeNull();
    expect(restoreRun({ ...good, phase: 'dancing' }, W)).toBeNull();
    expect(restoreRun({ ...good, position: 'nowhere' }, W)).toBeNull();
    expect(restoreRun({ ...good, position: null, phase: 'inNode' }, W)).toBeNull();
    const dangling = { lanes: 1, floors: 1, nodes: [{ id: 'x', floor: 0, lane: 0, kind: 'combat', next: ['missing'] }] };
    expect(restoreRun({ ...good, map: dangling }, W)).toBeNull();
    expect(parseSavedRun({})).toBeNull();
  });

  it('refuses a save whose map names an enemy or event that no longer exists', () => {
    const run = fresh(7, ['combat', 'event']);
    const saved = JSON.parse(JSON.stringify(run.toSaved()));
    saved.map.nodes[0].enemies = ['ghost'];
    expect(restoreRun(saved, W)).toBeNull();
    const second = JSON.parse(JSON.stringify(run.toSaved()));
    second.map.nodes[1].eventId = 'ghost';
    expect(restoreRun(second, W)).toBeNull();
    expect(TEST_EVENT.id).toBe('ev');
  });
});

describe('run report', () => {
  it('records each stop as it happens', () => {
    const run = fresh(7, ['combat', 'shop', 'rest', 'event']);
    run.chooseNode('0-0');
    run.finishCombat('won', 44, 4);
    const offered = run.pendingReward!.cards.map((c) => c.id);
    run.takeRewardCard(1);
    run.chooseNode('1-0');
    run.leaveShop();
    run.chooseNode('2-0');
    run.rest();
    run.chooseNode('3-0');
    run.chooseEventOption(1);
    expect(run.history).toEqual([
      { kind: 'combat', floor: 1, tier: 'normal', enemies: ['foe'], result: 'won', turns: 4, hpAfter: 44 },
      { kind: 'reward', floor: 1, offered, choice: 'card', cardId: offered[1], relicId: undefined },
      { kind: 'shop', floor: 2, bought: [], goldSpent: 0 },
      { kind: 'rest', floor: 3, choice: 'heal', healed: 16 },
      { kind: 'event', floor: 4, eventId: 'ev', choice: 'Nothing' },
    ]);
  });

  it('summarises the run, with the deck as counts, and prints as JSON', () => {
    const run = fresh(3, ['combat', 'rest']);
    run.chooseNode('0-0');
    run.finishCombat('lost', 0, 5);
    const report = buildRunReport(run);
    expect(report).toMatchObject({ version: 2, seed: 3, result: 'lost', floorReached: 1, totalFloors: 2, deckSize: 2, relics: [] });
    expect(report.deck).toEqual({ s1: 1, s2: 1 });
    expect(JSON.parse(formatRunReport(report))).toEqual(report);
  });

  it('says a run in progress is in progress', () => {
    expect(buildRunReport(fresh()).result).toBe('in progress');
  });
});
