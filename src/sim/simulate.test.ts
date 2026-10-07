import { describe, expect, it } from 'vitest';
import { Rng } from '../game/rng';
import { buildStarterDeck } from '../data/cards';
import { ENEMY_A } from '../data/enemies';
import { PLAYER_MAX_HP } from '../data/tunables';
import { compareSummaries, playFight, playRun, simulateFight, simulateRuns } from './simulate';
import type { SimOptions } from './simulate';

const OPTIONS: SimOptions[] = [
  { reward: 'card', rest: 'smart', path: 'smart' },
  { reward: 'gold', rest: 'heal', path: 'random' },
];

describe('simulator', () => {
  it('plays a whole act to the end without errors, for many seeds and several bot settings', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const options of OPTIONS) {
        const outcome = playRun(seed, options);
        expect(outcome.fights.length).toBeGreaterThan(0);
        expect(outcome.floorReached).toBeGreaterThanOrEqual(1);
        if (outcome.won) expect(outcome.lostTo).toBeUndefined();
      }
    }
  });

  it('can use the trial-fight reward policy too', () => {
    const outcome = playRun(3, { reward: 'best', rest: 'smart', path: 'smart' });
    expect(outcome.fights.length).toBeGreaterThan(0);
  });

  it('gives identical results for identical seeds', () => {
    expect(playRun(5, OPTIONS[0])).toEqual(playRun(5, OPTIONS[0]));
    expect(simulateRuns({ runs: 20, seed: 1 })).toEqual(simulateRuns({ runs: 20, seed: 1 }));
  });

  it('a fight ends with a result, counts card plays, and never leaves the player above max HP', () => {
    const result = playFight(buildStarterDeck(), [ENEMY_A], { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }, new Rng(3));
    expect(['won', 'lost', 'stalled']).toContain(result.result);
    expect(result.hpAfter).toBeLessThanOrEqual(PLAYER_MAX_HP);
    expect(Object.values(result.plays).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('a hopeless fight is a loss, not an endless loop', () => {
    const wall = { ...ENEMY_A, maxHp: 1000000, movePattern: [{ name: 'Wait', effects: [{ kind: 'block' as const, value: 1 }] }] };
    const result = playFight(buildStarterDeck(), [wall], { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }, new Rng(1), 20);
    expect(result.result).toBe('stalled');
  });

  it('summarises whole runs with sensible numbers', () => {
    const summary = simulateRuns({ runs: 40, seed: 1 });
    expect(summary.runs).toBe(40);
    expect(summary.winRate).toBeGreaterThanOrEqual(0);
    expect(summary.winRate).toBeLessThanOrEqual(1);
    expect(summary.byTier.normal.fights).toBeGreaterThan(0);
    expect(summary.encounters.length).toBeGreaterThan(0);
    expect(summary.cards.length).toBeGreaterThan(0);
    for (const c of summary.cards) {
      expect(c.winRateWith).toBeGreaterThanOrEqual(0);
      expect(c.winRateWith).toBeLessThanOrEqual(1);
    }
    expect(summary.restChoices.heal + summary.restChoices.upgrade).toBeGreaterThan(0);
  });

  it('taking gold instead of cards never adds reward cards', () => {
    const outcome = playRun(2, { reward: 'gold', rest: 'heal', path: 'smart' });
    expect(outcome.picks.length).toBeLessThanOrEqual(10); // only shop purchases
  });

  it('single-fight summary is sane', () => {
    const fight = simulateFight(['enemy-a'], 20, 1);
    expect(fight.winRate).toBeGreaterThanOrEqual(0);
    expect(fight.winRate).toBeLessThanOrEqual(1);
    expect(fight.avgTurns).toBeGreaterThan(0);
  });

  it('compares two results and reports only what changed', () => {
    const a = simulateRuns({ runs: 30, seed: 1 });
    expect(compareSummaries(a, a)).toEqual([]);
    const b = { ...a, winRate: a.winRate + 0.1 };
    const diffs = compareSummaries(a, b);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ what: 'run win rate', before: a.winRate, after: a.winRate + 0.1 });
  });
});
