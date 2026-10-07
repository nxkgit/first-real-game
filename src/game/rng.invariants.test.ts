import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

// Gameplay and data source text, as raw strings (Vite feature; no filesystem access needed).
const SOURCES = import.meta.glob(['/src/game/**/*.ts', '/src/data/**/*.ts', '/src/sim/**/*.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Documented exceptions: places that mention Math.random on purpose, with how many times.
 * - CombatState / Deck: `?? Math.random` / `= Math.random` are the fallback when a caller passes no
 *   seeded `random` (tests, ad-hoc fights). Every run path passes the run's seeded stream.
 * - rng.ts: randomSeed() picks the seed of a brand-new run when none is given.
 * Adding a new use anywhere, or a second one in these files, fails this test on purpose.
 */
const ALLOWED: Record<string, number> = {
  '/src/game/CombatState.ts': 1,
  '/src/game/Deck.ts': 1,
  '/src/game/rng.ts': 1,
};

const stripComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('seeded RNG', () => {
  const seq = (r: Rng, n: number): number[] => Array.from({ length: n }, () => r.next());

  it('is reproducible, and seeds differ', () => {
    for (const seed of [0, 1, 2, 42, 123456789, 4294967295]) {
      expect(seq(new Rng(seed), 100)).toEqual(seq(new Rng(seed), 100));
    }
    expect(seq(new Rng(1), 20)).not.toEqual(seq(new Rng(2), 20));
  });

  it('stays in [0, 1) and never repeats itself in a short stream', () => {
    const r = new Rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 100000; i++) {
      const n = r.next();
      expect(n >= 0 && n < 1).toBe(true);
      seen.add(n);
    }
    expect(seen.size).toBeGreaterThan(99990);
  });

  it('restore(seed, position) continues the stream exactly, from any point', () => {
    const r = new Rng(99);
    for (let i = 0; i < 40; i++) {
      r.next();
      const twin = Rng.restore(r.seed, r.position);
      expect(seq(twin, 5)).toEqual(seq(Rng.restore(r.seed, r.position), 5));
    }
    const a = new Rng(5);
    a.next();
    const b = Rng.restore(a.seed, a.position);
    expect(seq(a, 10)).toEqual(seq(b, 10));
  });

  it('nextSeed is a deterministic 32-bit integer', () => {
    const a = new Rng(3);
    const b = new Rng(3);
    for (let i = 0; i < 1000; i++) {
      const s = a.nextSeed();
      expect(s).toBe(b.nextSeed());
      expect(Number.isInteger(s) && s >= 0 && s <= 4294967295).toBe(true);
    }
  });

  it('is evenly spread: chi-square over 20 buckets stays under the p=0.001 limit for several seeds', () => {
    const BUCKETS = 20;
    const N = 200000;
    for (const seed of [1, 2, 3, 1000, 77777]) {
      const r = new Rng(seed);
      const counts = new Array<number>(BUCKETS).fill(0);
      for (let i = 0; i < N; i++) counts[Math.floor(r.next() * BUCKETS)]++;
      const expected = N / BUCKETS;
      const chi = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
      expect(chi, `seed ${seed}`).toBeLessThan(43.8); // df = 19
    }
  });

  it('has the right mean, and bit-level fairness of the top bit and of consecutive pairs', () => {
    const r = new Rng(31337);
    const N = 100000;
    let sum = 0;
    let high = 0;
    let rising = 0;
    let prev = r.next();
    for (let i = 0; i < N; i++) {
      const n = r.next();
      sum += n;
      if (n >= 0.5) high++;
      if (n > prev) rising++;
      prev = n;
    }
    expect(Math.abs(sum / N - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(high / N - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(rising / N - 0.5)).toBeLessThan(0.01);
  });

  it('shuffles driven by it reach every permutation of 3 items, roughly evenly', () => {
    const r = new Rng(11);
    const counts = new Map<string, number>();
    for (let i = 0; i < 6000; i++) {
      const a = [1, 2, 3];
      for (let k = a.length - 1; k > 0; k--) {
        const j = Math.floor(r.next() * (k + 1));
        [a[k], a[j]] = [a[j], a[k]];
      }
      counts.set(a.join(''), (counts.get(a.join('')) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const c of counts.values()) expect(Math.abs(c - 1000)).toBeLessThan(150);
  });
});

describe('no unseeded randomness in game code', () => {
  it('finds the source files at all (guards the glob)', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(20);
    expect(Object.keys(SOURCES)).toContain('/src/game/rng.ts');
  });

  it('only the documented exceptions mention Math.random', () => {
    const found: Record<string, number> = {};
    for (const [path, text] of Object.entries(SOURCES)) {
      // balance CLI entry points: a report date and benchmark timers, nothing that touches gameplay
      if (/\.test\.ts$/.test(path) || /invariantHarness/.test(path) || /\/sim\/(balanceCli|commands)\.ts$/.test(path)) continue;
      const hits = stripComments(text).match(/Math\s*\.\s*random|crypto\s*\.\s*getRandomValues|\bperformance\s*\.\s*now|\bDate\s*\.\s*now|new\s+Date\s*\(/g);
      if (hits) found[path] = hits.length;
    }
    expect(found).toEqual(ALLOWED);
  });
});
