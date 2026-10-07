import { describe, expect, it } from 'vitest';
import { Rng } from '../game/rng';
import { buildStarterDeck } from '../data/cards';
import { ENEMY_A } from '../data/enemies';
import { PLAYER_MAX_HP } from '../data/tunables';
import { playFight, playRun, simulateFight, simulateRuns } from './simulate';

describe('simulator', () => {
  it('plays a whole run to the end without errors, for many seeds and both reward policies', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const reward of ['card', 'gold'] as const) {
        const outcome = playRun(seed, reward);
        expect(outcome.fights.length).toBeGreaterThan(0);
        expect(outcome.floorReached).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('gives identical results for identical seeds', () => {
    expect(playRun(5, 'card')).toEqual(playRun(5, 'card'));
    expect(simulateRuns({ runs: 20, seed: 1, reward: 'card' })).toEqual(simulateRuns({ runs: 20, seed: 1, reward: 'card' }));
  });

  it('a fight ends with a result, and never leaves the player above max HP', () => {
    const result = playFight(buildStarterDeck(), [ENEMY_A], { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }, new Rng(3));
    expect(['won', 'lost', 'stalled']).toContain(result.result);
    expect(result.hpAfter).toBeLessThanOrEqual(PLAYER_MAX_HP);
  });

  it('a hopeless fight is a loss, not an endless loop', () => {
    const wall = { ...ENEMY_A, maxHp: 1000000, movePattern: [{ name: 'Wait', effects: [{ kind: 'block' as const, value: 1 }] }] };
    const result = playFight(buildStarterDeck(), [wall], { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }, new Rng(1), 20);
    expect(result.result).toBe('stalled');
  });

  it('summarises a single fight and whole runs with sensible numbers', () => {
    const fight = simulateFight(['enemy-a'], 20, 1);
    expect(fight.winRate).toBeGreaterThanOrEqual(0);
    expect(fight.winRate).toBeLessThanOrEqual(1);
    expect(fight.avgTurns).toBeGreaterThan(0);

    const runs = simulateRuns({ runs: 20, seed: 1, reward: 'card' });
    expect(runs.runs).toBe(20);
    expect(runs.fights[0].attempts).toBe(20);
    expect(Object.values(runs.cardPicks).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('taking gold instead of cards leaves the deck at starter size or buys at the shop', () => {
    const outcome = playRun(2, 'gold');
    expect(outcome.picks.length).toBeLessThanOrEqual(4); // only shop purchases, never reward cards
  });
});
