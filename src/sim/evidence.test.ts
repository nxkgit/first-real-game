import { describe, expect, it } from 'vitest';
import { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import { DEFAULT_MAP_PARAMS } from '../game/actMap';
import { buildStarterDeck, getCard } from '../data/cards';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { getEnemy } from '../data/enemies';
import { ACT_CONTENT, newRun } from '../data/run';
import * as tunables from '../data/tunables';
import { runEvidenceCommand } from './evidenceCommands';
import { compareRuns } from './evidenceRuns';
import { enumeratePaths, fightsRemainingByFloor, kindCounts, mapFor, mergeMapParams, shapeStats, summarizeMap } from './mapstats';
import { DEFAULT_RUN_POLICY, affinity, mechanismsOf, newSimRun, playRunEx, playRuns, shopAhead, withPolicy } from './runsim';
import { STORED_VALUE_WEIGHT, storedValue } from './skills';

// small run counts and fast bots: these tests check the machinery (determinism, that parameters bite,
// that nothing leaks into the game's own data), not the balance numbers.
const FAST = withPolicy(DEFAULT_RUN_POLICY, { skill: 'greedy', pick: 'random', valueSeeds: 1 });
const SEEDS = Array.from({ length: 24 }, (_, i) => 100 + i);

describe('the run simulator', () => {
  it('is deterministic in (seed, policy)', () => {
    const a = playRunEx(5, FAST);
    const b = playRunEx(5, FAST);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.fights.length).toBeGreaterThan(0);
  });

  it('with default map parameters builds exactly the map the game builds', () => {
    for (const seed of [1, 2, 3]) {
      expect(JSON.stringify(newSimRun(seed, FAST).map)).toBe(JSON.stringify(newRun(seed).map));
    }
  });

  it('overrides the map shape in memory and leaves the game data alone', () => {
    const before = JSON.stringify([DEFAULT_MAP_PARAMS, tunables, ACT_CONTENT]);
    const run = newSimRun(3, withPolicy(FAST, { map: { floors: 8, lanes: 3, firstFloor: { elite: 2 } } }));
    expect(run.map.floors).toBe(9);
    expect(run.map.lanes).toBe(3);
    playRunEx(3, withPolicy(FAST, { map: { floors: 8 }, shopPrice: 1, rewardGold: 99, healFraction: 1, startRelics: ['vitality-token'] }));
    expect(JSON.stringify([DEFAULT_MAP_PARAMS, tunables, ACT_CONTENT])).toBe(before);
    expect(tunables.SHOP_CARD_PRICE).toBe(40);
  });

  it('shop price is a parameter: free cards get bought, unaffordable ones do not', () => {
    const base = withPolicy(FAST, { gold: 'always', path: 'shop', shopBuy: 'random', shopSlots: 4 });
    const cheap = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { shopPrice: 1 }));
    const dear = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { shopPrice: 100000 }));
    expect(cheap.flatMap((r) => r.bought).length).toBeGreaterThan(0);
    expect(dear.flatMap((r) => r.bought).length).toBe(0);
    for (const r of cheap) expect(r.goldSpent).toBeGreaterThanOrEqual(0);
    // the price per cost point raises what a cost-2 card costs
    const costly = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { shopPrice: 0, shopPricePerCost: 1000 }));
    for (const r of costly) for (const id of r.bought) expect(getCard(id).cost).toBe(0);
  });

  it('reward gold is a parameter', () => {
    const base = withPolicy(FAST, { gold: 'always', shopBuy: 'none' });
    const small = playRuns(8, 7, withPolicy(base, { rewardGold: 5, eliteGold: 5 }));
    const big = playRuns(8, 7, withPolicy(base, { rewardGold: 500, eliteGold: 500 }));
    const gained = (rs: typeof small): number => rs.reduce((a, r) => a + r.goldGained, 0);
    expect(gained(big)).toBeGreaterThan(gained(small));
  });

  it('a removal service shrinks the deck, and only when it can be paid for', () => {
    const base = withPolicy(FAST, { gold: 'always', path: 'shop', shopBuy: 'none', removalPick: 'basic', startGold: 500 });
    const on = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { removalPrice: 10 }));
    const off = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { removalPrice: 0 }));
    const poor = playRuns(SEEDS.length, SEEDS[0], withPolicy(base, { removalPrice: 100000 }));
    expect(on.flatMap((r) => r.removed).length).toBeGreaterThan(0);
    expect(off.flatMap((r) => r.removed).length).toBe(0);
    expect(poor.flatMap((r) => r.removed).length).toBe(0);
    const size = (rs: typeof on): number => rs.reduce((a, r) => a + r.finalDeck.length, 0);
    expect(size(on)).toBeLessThan(size(off));
  });

  it('the rest heal fraction and starting relics apply', () => {
    const rests = (fraction: number | undefined): number => {
      const rs = playRuns(SEEDS.length, SEEDS[0], withPolicy(FAST, { rest: 'heal', healFraction: fraction }));
      return rs.reduce((a, r) => a + r.healed, 0);
    };
    expect(rests(1)).toBeGreaterThan(rests(0.05));
    expect(playRunEx(9, withPolicy(FAST, { startRelics: ['vitality-token'] })).finalMaxHp).toBeGreaterThanOrEqual(tunables.PLAYER_MAX_HP + 10);
  });

  it('an event rule forces the named choice', () => {
    // event-b choice 1 is "Study here" (a random card); forcing it adds a card at every event-b stop
    const withStudy = playRuns(SEEDS.length, SEEDS[0], withPolicy(FAST, { event: { 'event-b': 1 }, gold: 'always' }));
    const leaving = playRuns(SEEDS.length, SEEDS[0], withPolicy(FAST, { event: 'leave', gold: 'always' }));
    const met = withStudy.filter((r) => r.events.includes('event-b'));
    expect(met.length).toBeGreaterThan(0);
    const sum = (rs: typeof withStudy): number => rs.reduce((a, r) => a + r.finalDeck.length, 0);
    expect(sum(withStudy)).toBeGreaterThan(sum(leaving) - 1);
  });

  it('shopAhead sees shops on the map', () => {
    const run = newSimRun(11, FAST);
    const anyShop = run.map.nodes.some((n) => n.kind === 'shop');
    expect(shopAhead(run)).toBe(anyShop);
  });

  it('a draft from every draftable card can take synergy cards, and the synergy policy finishes', () => {
    const rs = playRuns(10, 40, withPolicy(FAST, { draftPool: 'all', pick: 'synergy', skill: 'smart' }));
    const ids = new Set(rs.flatMap((r) => r.finalDeck));
    expect([...ids].some((id) => SYNERGY_CARDS.some((c) => c.id === id))).toBe(true);
  }, 30000);

  it('paired comparison of a policy with itself is exactly zero', () => {
    const rows = compareRuns(6, 3, [
      { name: 'a', policy: FAST },
      { name: 'b', policy: FAST },
    ]);
    expect(rows[1].dWin?.mean).toBe(0);
    expect(rows[1].dFloor?.mean).toBe(0);
  });
});

describe('affinity and stored value', () => {
  it('shares mechanisms between cards that key on the same tag', () => {
    const a = getCard('prime-a');
    const b = getCard('tag-a-payoff');
    expect(mechanismsOf(a).size).toBeGreaterThan(0);
    expect(affinity(b, [a])).toBeGreaterThan(affinity(b, [getCard('strike')]));
  });

  it('gives expert a positive value for Strength and Empowered it holds, and none otherwise', () => {
    const combat = new CombatState(buildStarterDeck(), [getEnemy('enemy-a')], { random: new Rng(1).next.bind(new Rng(1)) });
    combat.start();
    expect(storedValue(combat, 1)).toBe(0);
    combat.player.statuses.strength = 3;
    expect(storedValue(combat, 1)).toBeGreaterThan(0);
    expect(storedValue(combat, 0)).toBe(0);
    expect(STORED_VALUE_WEIGHT).toBeGreaterThan(0);
  });
});

describe('map statistics', () => {
  it('enumerates every route from the bottom to the boss', () => {
    const map = mapFor(4);
    const paths = enumeratePaths(map);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(p.length).toBe(map.floors);
      expect(map.nodes.find((n) => n.id === p[p.length - 1])!.kind).toBe('boss');
      expect(kindCounts(map, p).boss).toBe(1);
      expect(kindCounts(map, p).rest).toBeGreaterThanOrEqual(1); // the forced rest before the boss
    }
  });

  it('merges overrides without touching the defaults and honours them', () => {
    const merged = mergeMapParams({ weights: { elite: 0 } });
    expect(merged.weights.elite).toBe(0);
    expect(merged.weights.combat).toBe(DEFAULT_MAP_PARAMS.weights.combat);
    expect(DEFAULT_MAP_PARAMS.weights.elite).toBe(tunables.MAP_KIND_WEIGHTS.elite);
    expect(summarizeMap(5, { weights: { elite: 0 } }).perPath.elite.max).toBe(0);
    expect(summarizeMap(5, { firstFloor: { elite: 99 } }).nodes.elite).toBe(0);
  });

  it('shape statistics are deterministic and floors change the path length', () => {
    const a = shapeStats(6, 1, { floors: 8 });
    const b = shapeStats(6, 1, { floors: 8 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const long = shapeStats(6, 1, { floors: 14 });
    expect(long.mean.combat.mean).toBeGreaterThan(a.mean.combat.mean);
  });

  it('counts fights remaining, falling to zero at the boss', () => {
    const left = fightsRemainingByFloor(8, 1);
    expect(left[left.length - 1]).toBe(0);
    expect(left[0]).toBeGreaterThan(left[left.length - 2]);
  });
});

describe('evidence commands', () => {
  const tiny = { runs: '4', seeds: '1', samples: '1', maps: '4', quick: 'true' };
  it.each([
    ['gold', { ...tiny, prices: '40', golds: '25', 'grid-prices': '40' }],
    ['removal', { ...tiny, 'removal-prices': '50' }],
    ['rests', { ...tiny, heals: '0.3' }],
    ['events', tiny],
    ['maps', { ...tiny, 'no-runs': 'true' }],
    ['paths', tiny],
    ['pressure', tiny],
    ['picks', tiny],
    ['decksize', tiny],
    ['upgrades', tiny],
    ['relics', tiny],
  ])('%s produces a table', (cmd, flags) => {
    const out = runEvidenceCommand(cmd, flags as Record<string, string>);
    expect(out.markdown).toContain('|');
    expect(JSON.stringify(out.json).length).toBeGreaterThan(10);
  }, 120000);

  it('runs compares a flagged policy with the defaults', () => {
    const out = runEvidenceCommand('runs', { ...tiny, gold: 'always', 'shop-price': '30' });
    expect(out.markdown).toContain('with your flags');
  }, 60000);
});
