import { describe, expect, it } from 'vitest';
import { BOLT, STRIKE, buildStarterDeck, getCard } from '../data/cards';
import { ENEMIES, getEnemy } from '../data/enemies';
import { Evaluator } from './engine';
import { runCommand } from './commands';
import { runFight } from './fight';
import { applyAction, createFight, reconstruct, rngStartFromSeed } from './fightCore';
import { cardsExperiment } from './experiments';
import { compareSnapshots } from './snapshot';
import type { Snapshot } from './snapshot';
import { SKILL_LEVELS, BOTS, endTurn } from './skills';
import type { FightContext } from './skills';
import { Rng } from '../game/rng';
import { flagOutliers, intervalOf, meanCI, pairedDiff, quantile, tCrit95, unitsNeeded, verdict, welchDiff, wilson } from './stats';
import { actFights, withAdded, withReplaced } from './suites';
import type { CardDefinition } from '../game/types';

describe('statistics helpers', () => {
  it('mean CI uses the t distribution', () => {
    const ci = meanCI([1, 2, 3, 4, 5]);
    expect(ci.mean).toBe(3);
    expect(ci.sd).toBeCloseTo(Math.sqrt(2.5), 9);
    expect(ci.hi - ci.mean).toBeCloseTo(tCrit95(4) * Math.sqrt(2.5 / 5), 9);
    expect(ci.lo).toBeCloseTo(2 * ci.mean - ci.hi, 9);
  });

  it('Wilson interval is sane at the extremes and in the middle', () => {
    const none = wilson(0, 10);
    expect(none.p).toBe(0);
    expect(none.lo).toBe(0);
    expect(none.hi).toBeCloseTo(0.2775, 3);
    const all = wilson(100, 100);
    expect(all.hi).toBe(1);
    expect(all.lo).toBeGreaterThan(0.95);
    const half = wilson(50, 100);
    expect(half.lo).toBeCloseTo(0.4038, 3);
    expect(half.hi).toBeCloseTo(0.5962, 3);
    expect(wilson(0, 0).n).toBe(0);
  });

  it('paired difference cancels shared noise that an unpaired comparison cannot', () => {
    const rng = new Rng(1);
    const before = Array.from({ length: 200 }, () => rng.next() * 100);
    const after = before.map((x) => x + 2); // a real +2 effect hidden under huge shared noise
    const paired = pairedDiff(before, after);
    expect(paired.mean).toBeCloseTo(2, 9);
    expect(paired.hi - paired.lo).toBeLessThan(1e-6);
    const unpaired = welchDiff({ mean: meanCI(before).mean, sd: meanCI(before).sd, n: 200 }, { mean: meanCI(after).mean, sd: meanCI(after).sd, n: 200 });
    expect(unpaired.lo).toBeLessThan(0); // the unpaired interval cannot see the effect
    expect(() => pairedDiff([1], [1, 2])).toThrow();
  });

  it('verdicts: better/worse when the interval excludes zero, inconclusive when it spans it, negligible when tiny', () => {
    expect(verdict({ lo: 1, hi: 3 }, 0.5, true)).toBe('better');
    expect(verdict({ lo: 1, hi: 3 }, 0.5, false)).toBe('worse');
    expect(verdict({ lo: -3, hi: -1 }, 0.5, true)).toBe('worse');
    expect(verdict({ lo: -2, hi: 2 }, 0.5, true)).toBe('inconclusive');
    expect(verdict({ lo: -0.2, hi: 0.3 }, 0.5, true)).toBe('negligible');
  });

  it('flags outliers by modified z and IQR, and never in cohorts under 4', () => {
    const flags = flagOutliers([1, 2, 3, 2, 1, 2, 100]);
    expect(flags.filter((f) => f.outlier).map((f) => f.index)).toEqual([6]);
    expect(flagOutliers([1, 2, 100]).some((f) => f.outlier)).toBe(false);
    expect(flagOutliers([5, 5, 5, 5, 5]).some((f) => f.outlier)).toBe(false);
  });

  it('quantiles, intervals and sample-size guidance', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(intervalOf({ mean: 1, sd: 0, n: 1 }).lo).toBe(1);
    // 95% half-width of 1 with sd 5 needs about 96 units
    expect(unitsNeeded(5, 1)).toBe(97);
  });
});

describe('replay reconstruction', () => {
  it('rebuilds exactly the state a live fight reached', () => {
    const spec = { deck: buildStarterDeck(), enemies: [getEnemy('enemy-b'), getEnemy('enemy-d')] };
    const start = rngStartFromSeed(11);
    const { combat } = createFight(spec, start);
    const ctx: FightContext = { combat, spec, start, history: [], rng: new Rng(1) };
    for (let t = 0; t < 3 && combat.phase === 'playerTurn'; t++) {
      BOTS.smart.playTurn(ctx);
      if (combat.phase === 'playerTurn') endTurn(ctx);
    }
    const copy = reconstruct(spec, start, ctx.history);
    expect(copy.player.hp).toBe(combat.player.hp);
    expect(copy.player.block).toBe(combat.player.block);
    expect(copy.turnNumber).toBe(combat.turnNumber);
    expect(copy.deck.hand.map((c) => c.definition.id)).toEqual(combat.deck.hand.map((c) => c.definition.id));
    expect(copy.deck.drawPile.map((c) => c.definition.id)).toEqual(combat.deck.drawPile.map((c) => c.definition.id));
    expect(copy.enemies.map((e) => e.hp)).toEqual(combat.enemies.map((e) => e.hp));
  });

  it('hypothetical reshuffling hides draw order but keeps the real hand and pile contents', () => {
    const spec = { deck: buildStarterDeck(), enemies: [getEnemy('enemy-a')] };
    const start = rngStartFromSeed(4);
    const real = reconstruct(spec, start, []);
    const hypo = reconstruct(spec, start, [], 99);
    expect(hypo.deck.hand.map((c) => c.definition.id)).toEqual(real.deck.hand.map((c) => c.definition.id));
    const ids = (c: typeof real): string[] => c.deck.drawPile.map((x) => x.definition.id).sort();
    expect(ids(hypo)).toEqual(ids(real));
    expect(reconstruct(spec, start, [], 99).deck.drawPile.map((c) => c.definition.id)).toEqual(hypo.deck.drawPile.map((c) => c.definition.id));
  });

  it('refuses a recorded action that is no longer legal', () => {
    const { combat } = createFight({ deck: buildStarterDeck(), enemies: [getEnemy('enemy-a')] }, rngStartFromSeed(1));
    expect(applyAction(combat, { kind: 'play', hand: 99 })).toBe(false);
  });
});

describe('bots', () => {
  const fights = actFights();

  it('every skill finishes every act fight, deterministically', () => {
    for (const skill of SKILL_LEVELS) {
      for (const f of fights) {
        const spec = { deck: buildStarterDeck(), enemies: f.enemies.map(getEnemy) };
        const a = runFight(spec, rngStartFromSeed(7), skill);
        const b = runFight(spec, rngStartFromSeed(7), skill);
        expect(a).toEqual(b);
        expect(['won', 'lost', 'stalled']).toContain(a.result);
      }
    }
  });

  it('does not break on an effect kind it has never heard of', () => {
    const mystery = { id: 'mystery', name: 'Mystery', type: 'skill', cost: 1, owner: 'test', inRewardPool: false, effects: [{ kind: 'conjure', value: 3 } as unknown as never] } as CardDefinition;
    const spec = { deck: [...buildStarterDeck(), mystery, mystery], enemies: [getEnemy('enemy-a')] };
    for (const skill of SKILL_LEVELS) expect(() => runFight(spec, rngStartFromSeed(2), skill)).not.toThrow();
  });

  it('smart plays clearly better than random over a few fights', () => {
    const total = (skill: 'random' | 'smart'): number => {
      let lost = 0;
      for (const id of ['enemy-b+enemy-d', 'elite-a', 'enemy-c']) {
        const spec = { deck: buildStarterDeck(), enemies: id.split('+').map(getEnemy) };
        for (let s = 1; s <= 25; s++) lost += runFight(spec, rngStartFromSeed(s), skill).hpLost;
      }
      return lost;
    };
    expect(total('smart')).toBeLessThan(total('random'));
  });
});

describe('evaluator and pairing', () => {
  const config = { fights: actFights().slice(0, 2), seeds: 6, baseSeed: 3 };

  it('same deck, same seeds: identical outcomes, and a paired diff of exactly zero', () => {
    const ev = new Evaluator(config);
    const a = ev.evaluate(buildStarterDeck(), 'greedy');
    const b = new Evaluator(config).evaluate(buildStarterDeck(), 'greedy');
    expect(Array.from(a.hpLost)).toEqual(Array.from(b.hpLost));
    const d = pairedDiff(a.hpLost, b.hpLost);
    expect(d.mean).toBe(0);
    expect(d.lo).toBe(0);
    expect(d.hi).toBe(0);
  });

  it('evaluations are memoised', () => {
    const ev = new Evaluator(config);
    ev.evaluate(buildStarterDeck(), 'random');
    const n = ev.fightsRun;
    ev.evaluate(buildStarterDeck(), 'random');
    expect(ev.fightsRun).toBe(n);
  });

  it("a fight's seeds do not depend on which other fights are in the suite", () => {
    const all = actFights();
    const alone = new Evaluator({ fights: [all[1]], seeds: 5, baseSeed: 9 }).evaluate(buildStarterDeck(), 'greedy');
    const together = new Evaluator({ fights: all.slice(0, 3), seeds: 5, baseSeed: 9 });
    const slice = together.forFight(together.evaluate(buildStarterDeck(), 'greedy'), 1);
    expect(Array.from(slice.hpLost)).toEqual(Array.from(alone.hpLost));
  });

  it('swapping a card for itself changes nothing (a control that must be exactly zero)', () => {
    const ev = new Evaluator(config);
    const deck = buildStarterDeck();
    const swapped = withReplaced(deck, STRIKE);
    expect(swapped.map((c) => c.id)).toEqual(deck.map((c) => c.id));
    const row = cardsExperiment(ev, { skills: ['greedy'], modes: ['replace'] }).rows.find((r) => r.card === 'strike');
    expect(row?.delta.hpLost).toEqual({ mean: 0, lo: 0, hi: 0 });
  });

  it('adding a card leaves the base deck intact', () => {
    const deck = buildStarterDeck();
    expect(withAdded(deck, BOLT)).toHaveLength(deck.length + 1);
    expect(deck).toHaveLength(10);
  });
});

describe('experiments through the command line (tiny runs)', () => {
  const io = { readText: (): string => '' };
  const run = (cmd: string, flags: Record<string, string>) => runCommand(cmd, flags, io, '2026-01-01');
  const tiny = { seeds: '2', fights: 'enemy-a,enemy-d+enemy-d', skills: 'greedy' };

  it('cards', () => {
    const r = run('cards', { ...tiny, modes: 'add' });
    expect(r.markdown).toContain('Card effect');
    expect(JSON.stringify(r.json)).toContain('"rows"');
  });
  it('pairs (sampled)', () => {
    const r = run('pairs', { ...tiny, 'max-pairs': '3', skill: 'greedy' });
    expect(r.markdown).toContain('3 of');
    expect(run('pairs', { ...tiny, pairs: 'jab+bolt' }).markdown).toContain('1 of');
  });
  it('ladder, lengths', () => {
    expect(run('ladder', tiny).markdown).toContain('Fight difficulty ladder');
    expect(run('lengths', tiny).markdown).toContain('Fight length distribution');
  });
  it('drafts', () => {
    const r = run('drafts', { runs: '2', skill: 'greedy' });
    expect(r.markdown).toContain('Draft policy comparison');
    expect(run('drafts', { runs: '2', reward: 'gold' }).markdown).toContain('custom');
  });
  it('outliers', () => {
    expect(run('outliers', tiny).markdown).toContain('Outlier method');
  });
  it('bench', () => {
    expect(run('bench', { seeds: '1', skills: 'random' }).markdown).toContain('fights/sec');
  });
  it('report ties everything together and is deterministic', () => {
    const flags = { ...tiny, seeds: '2', 'pair-seeds': '2', 'max-pairs': '2', runs: '2' };
    const a = run('report', flags);
    expect(a.markdown).toContain('placeholder');
    expect(a.markdown).toBe(run('report', flags).markdown);
    expect(JSON.stringify(a.json)).toBe(JSON.stringify(run('report', flags).json));
  });
  it('rejects bad input as a tool error', () => {
    expect(() => run('nope', {})).toThrow();
    expect(() => run('cards', { skills: 'wizard' })).toThrow();
    expect(() => run('ladder', { seeds: '0' })).toThrow();
  });
});

describe('baseline and check', () => {
  const baseFlags = { seeds: '12', skills: 'greedy' };
  const make = (): { base: Snapshot; text: string } => {
    const r = runCommand('baseline', baseFlags, { readText: () => '' }, '2026-01-01');
    return { base: r.json as Snapshot, text: JSON.stringify(r.json) };
  };

  it('same content gives no changes at all', () => {
    const { text, base } = make();
    expect(base.version).toBe(1);
    const r = runCommand('check', {}, { readText: () => text }, '2026-01-02');
    expect(r.markdown).toContain('UNCHANGED');
    expect(r.markdown).toContain('0 moved, 0 possible');
  });

  it('a real content change is reported as moved, with the right direction', () => {
    const { text } = make();
    const enemy = ENEMIES['enemy-a'];
    const original = enemy.maxHp;
    try {
      enemy.maxHp = 400;
      const r = runCommand('check', {}, { readText: () => text }, '2026-01-02');
      expect(r.markdown).toContain('changed (current');
      expect(r.markdown).toMatch(/ladder\/greedy\/starter\/enemy-a\/turns/);
      const cmp = r.json as { deltas: { key: string; change: string; diff: number }[] };
      const turns = cmp.deltas.find((d) => d.key === 'ladder/greedy/starter/enemy-a/turns');
      expect(turns?.change).toBe('moved');
      expect(turns?.diff).toBeGreaterThan(0);
      // other fights did not change, so they stay out of the list
      expect(cmp.deltas.some((d) => d.key.includes('/enemy-d+enemy-d/'))).toBe(false);
    } finally {
      enemy.maxHp = original;
    }
  });

  it('applies the tolerance and significance rules', () => {
    const { base } = make();
    const clone = (): Snapshot => JSON.parse(JSON.stringify(base)) as Snapshot;
    const key = 'ladder/greedy/mid/enemy-a/hpLost';
    const b = clone();
    b.metrics[key] = { mean: 10, sd: 2, n: 100 };
    const nudge = (mean: number, n = 100, sd = 2): Snapshot => {
      const a = clone();
      a.metrics[key] = { mean, sd, n };
      return a;
    };
    const find = (a: Snapshot) => compareSnapshots(b, a).deltas.find((d) => d.key === key);
    expect(find(nudge(10.5))).toBeUndefined(); // below the 1.5 HP tolerance
    expect(find(nudge(14))?.change).toBe('moved'); // large and clear
    expect(find(nudge(13.5, 4, 6))?.change).toBe('possible'); // large-ish but noisy
    const gone = clone();
    delete gone.metrics[key];
    expect(compareSnapshots(b, gone).removed).toContain(key);
    expect(compareSnapshots(gone, b).added).toContain(key);
  });
});

describe('registry-driven', () => {
  it('card candidates come from the registry, so new cards appear without code changes', () => {
    const ev = new Evaluator({ fights: actFights().slice(0, 1), seeds: 2, baseSeed: 1 });
    const rows = cardsExperiment(ev, { skills: ['random'], modes: ['add'] }).rows;
    expect(rows.map((r) => r.card)).toContain(getCard('bolt').id);
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });
});
