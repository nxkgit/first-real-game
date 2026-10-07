import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunState } from './RunState';
import { Rng } from './rng';
import { parseSavedRun, restoreRun } from './save';
import { buildRunReport } from './runReport';
import { isRunOver, pickOne, stepRun } from './invariantHarness';

// the mutation fuzz runs tens of thousands of restores; with many test files running in parallel it
// can pass the 5 s default, so this file gets a generous limit (the fuzz itself is deterministic)
vi.setConfig({ testTimeout: 60_000 });
import { RUN_WORLD, newRun, restoreSavedRun } from '../data/run';
import { clearSavedRun, loadReportHistory, loadSavedRun, recordFinishedRun, saveRun } from '../storage';

// Garbage in, graceful discard out. Nothing here may throw; a bad save is dropped, never a crash.

type Json = unknown;
const GARBAGE_STRINGS = ['', 'null', 'undefined', '{', '[', '{"version":2', '"a"', '0', '-1', 'NaN', '[[[[[[[[', '{"a":{"a":{"a":', 'true', '\u0000', '{"version":2,"seed":'];

function randomJson(rng: Rng, depth = 0): Json {
  const roll = rng.next();
  if (depth > 3 || roll < 0.35) {
    switch (Math.floor(rng.next() * 9)) {
      case 0: return null;
      case 1: return Math.floor(rng.next() * 200 - 100);
      case 2: return rng.next() * 1e12 - 5e11;
      case 3: return 'x'.repeat(Math.floor(rng.next() * 20));
      case 4: return rng.next() < 0.5;
      case 5: return -0;
      case 6: return Number.MAX_SAFE_INTEGER;
      case 7: return 1e308;
      default: return '';
    }
  }
  if (roll < 0.65) return Array.from({ length: Math.floor(rng.next() * 5) }, () => randomJson(rng, depth + 1));
  const o: Record<string, Json> = {};
  const keys = ['version', 'seed', 'map', 'nodes', 'deck', 'hp', 'phase', 'position', 'next', 'kind', 'enemies', '__proto__', 'constructor'];
  for (let i = 0, n = Math.floor(rng.next() * 6); i < n; i++) o[pickOne(rng, keys)] = randomJson(rng, depth + 1);
  return o;
}

/** A valid save, at some stop of a played run, as a plain JSON tree. */
function validSaves(count: number): Json[] {
  const saves: Json[] = [];
  for (let seed = 1; saves.length < count; seed++) {
    const run = newRun(seed);
    for (let i = 0; i < 400 && !isRunOver(run) && saves.length < count; i++) {
      if (i % 4 === 0) saves.push(JSON.parse(JSON.stringify(run.toSaved())));
      stepRun(run, (seed * 31 + i) >>> 0);
    }
  }
  return saves;
}

/** Walks to a random spot in the tree and damages it in a random way. */
function mutate(rng: Rng, root: Json): Json {
  const tree = structuredClone(root) as Json;
  let node: unknown = tree;
  let parent: Record<string, unknown> | unknown[] | null = null;
  let key: string | number = '';
  for (let hops = Math.floor(rng.next() * 6); hops > 0; hops--) {
    if (node === null || typeof node !== 'object') break;
    const entries = Object.keys(node);
    if (entries.length === 0) break;
    const k = pickOne(rng, entries);
    parent = node as Record<string, unknown>;
    key = k;
    node = (node as Record<string, unknown>)[k];
  }
  const damaged = ((): unknown => {
    switch (Math.floor(rng.next() * 12)) {
      case 0: return undefined; // deleted
      case 1: return null;
      case 2: return -1 - Math.floor(rng.next() * 1000);
      case 3: return NaN;
      case 4: return Infinity;
      case 5: return 'no-such-thing';
      case 6: return typeof node === 'string' ? `${node}-gone` : 'unknown-id';
      case 7: return Array.isArray(node) ? Array.from({ length: 50000 }, () => node[0] ?? 'strike') : { a: [] };
      case 8: return typeof node === 'number' ? node + 1e9 : [];
      case 9: return typeof node === 'number' ? 0.5 : '0';
      case 10: return Array.isArray(node) ? node.slice(0, Math.floor(rng.next() * node.length)) : {};
      default: return typeof node === 'object' && node ? Object.fromEntries(Object.entries(node).slice(1)) : true;
    }
  })();
  if (!parent) return damaged === undefined ? null : JSON.parse(JSON.stringify(damaged) ?? "null");
  if (damaged === undefined) delete (parent as Record<string, unknown>)[key];
  else (parent as Record<string, unknown>)[key] = damaged;
  return JSON.parse(JSON.stringify(tree)); // saves reach the game as JSON text: no holes, no NaN
}

/** Whatever restore returned, using it must not blow up either: that's what "discard rather than crash" has to mean. */
function useRun(run: RunState): void {
  void run.mapChoices;
  void run.floor;
  void run.restHealAmount;
  void run.upgradableCards;
  run.toSaved();
  buildRunReport(run);
}

describe('parseSavedRun / restoreRun never throw', () => {
  it('on random JSON of every shape', () => {
    const rng = new Rng(1);
    for (let i = 0; i < 20000; i++) {
      const v = randomJson(rng);
      expect(() => parseSavedRun(v)).not.toThrow();
      expect(parseSavedRun(v)).toBeNull();
      expect(restoreSavedRun(v)).toBeNull();
    }
  });

  it('on primitives, nulls and odd objects', () => {
    const weird: unknown[] = [undefined, null, 0, 1, -1, NaN, Infinity, '', 'x', [], {}, [[]], true, () => 1, Symbol('s'), 10n, new Date(0), new Map(), Object.create(null)];
    for (const v of weird) {
      expect(() => parseSavedRun(v)).not.toThrow();
      expect(restoreRun(v, RUN_WORLD)).toBeNull();
    }
  });

  it('accepts every genuine save and brings back an equal run', () => {
    for (const save of validSaves(300)) {
      expect(parseSavedRun(save)).not.toBeNull();
      const run = restoreSavedRun(save);
      expect(run).not.toBeNull();
      expect(JSON.parse(JSON.stringify(run!.toSaved()))).toEqual(save);
    }
  });

  it('discards the wrong version, and any change of the version field', () => {
    for (const save of validSaves(40) as Record<string, unknown>[]) {
      for (const version of [0, 1, 3, -2, '2', null, 2.5, NaN, undefined, [2]]) {
        expect(restoreSavedRun({ ...save, version })).toBeNull();
      }
    }
  });

  it('never throws on mutated genuine saves, and anything it accepts is usable', () => {
    const saves = validSaves(60);
    const rng = new Rng(77);
    let accepted = 0;
    const crashes = new Map<string, string>();
    for (let i = 0; i < 12000; i++) {
      const bad = mutate(rng, pickOne(rng, saves));
      let run: RunState | null = null;
      expect(() => (run = restoreSavedRun(bad))).not.toThrow();
      if (!run) continue;
      accepted++;
      try {
        useRun(run);
      } catch (e) {
        crashes.set(((e as Error).stack ?? '').split('\n').slice(0, 3).join(' | '), JSON.stringify(bad).slice(0, 200));
      }
    }
    // mutations that happen to be harmless (changing a notice string, say) are accepted; most are not
    expect(accepted).toBeLessThan(6000);
    expect([...crashes]).toEqual([]);
  });

  it('refuses unknown card, relic, enemy and event ids', () => {
    const save = validSaves(1)[0] as Record<string, any>;
    const bad = (patch: (s: Record<string, any>) => void): Json => {
      const s = structuredClone(save);
      patch(s);
      return s;
    };
    expect(restoreSavedRun(bad((s) => s.deck.push('no-such-card')))).toBeNull();
    expect(restoreSavedRun(bad((s) => s.relics.push('no-such-relic')))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.map.nodes[0].enemies = ['no-such-enemy'])))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.map.nodes[0].eventId = 'no-such-event')))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.eventFight = { enemies: ['no-such-enemy'], after: [] })))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.pendingReward = { cards: ['no-such-card'], gold: 1, relic: null })))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.pendingReward = { cards: [], gold: 1, relic: 'no-such-relic' })))).toBeNull();
    expect(restoreSavedRun(bad((s) => (s.shop = [{ card: 'no-such-card', price: 1, sold: false }])))).toBeNull();
  });

  it('refuses negative, fractional, NaN-turned-null and absurd numbers', () => {
    const save = validSaves(1)[0] as Record<string, any>;
    for (const field of ['hp', 'maxHp', 'gold', 'seed', 'rngPosition']) {
      for (const value of [-1, 0.5, null, 1e15, 'NaN']) {
        const s = { ...save, [field]: value };
        const ok = field === 'gold' || field === 'hp' || field === 'seed' || field === 'rngPosition' ? value === 0 : false;
        if (!ok) expect(restoreSavedRun(s), `${field}=${value}`).toBeNull();
      }
    }
  });

  it('copes with a huge deck, a huge map and a huge history without throwing', () => {
    const save = validSaves(1)[0] as Record<string, any>;
    const big = { ...save, deck: Array.from({ length: 1_000_000 }, () => 'strike') };
    expect(() => restoreSavedRun(big)).not.toThrow();
    const manyNodes = { ...save, map: { ...save.map, nodes: Array.from({ length: 100_000 }, () => save.map.nodes[0]) } };
    expect(restoreSavedRun(manyNodes)).toBeNull();
    const hist = { ...save, history: Array.from({ length: 200_000 }, () => 1) };
    expect(() => restoreSavedRun(hist)).not.toThrow();
  });
});

// Saves that used to pass parseSavedRun but crash once played (fixed: the validator now refuses them).
describe('FINDINGS: saves that validate but cannot be played', () => {
  const base = (): Record<string, any> => validSaves(1)[0] as Record<string, any>;

  it('phase "reward" with no pendingReward should be refused (taking the reward throws "no reward is pending")', () => {
    const run = restoreSavedRun({ ...base(), phase: 'reward', pendingReward: null, position: base().map.nodes[0].id });
    expect(run).toBeNull();
  });

  it('eventFight.after entries are not validated (a null outcome crashes finishCombat in applyOutcome)', () => {
    const s = { ...base(), eventFight: { enemies: ['enemy-a'], after: [null] }, position: base().map.nodes[0].id, phase: 'inNode' };
    const run = restoreSavedRun(s);
    expect(run).toBeNull();
  });

  // Catch-all fuzz: anything the validator accepts must be playable.
  it('every mutated save that is accepted can be played a few steps without throwing', { timeout: 120000 }, () => {
    const saves = validSaves(60);
    const rng = new Rng(77);
    for (let i = 0; i < 30000; i++) {
      const run = restoreSavedRun(mutate(rng, pickOne(rng, saves)));
      if (!run) continue;
      for (let k = 0; k < 6 && !isRunOver(run); k++) stepRun(run, k + 1);
    }
  });
});

// ---------- the storage layer, against a fake localStorage ----------

class FakeStorage {
  data = new Map<string, string>();
  failReads = false;
  failWrites = false;
  getItem(k: string): string | null {
    if (this.failReads) throw new Error('blocked');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new Error('quota');
    this.data.set(k, String(v));
  }
  removeItem(k: string): void {
    if (this.failWrites) throw new Error('blocked');
    this.data.delete(k);
  }
}

describe('storage layer', () => {
  let store: FakeStorage;
  const g = globalThis as unknown as { window?: unknown };
  const had = 'window' in g;
  const original = g.window;
  beforeEach(() => {
    store = new FakeStorage();
    g.window = { localStorage: store };
  });
  afterEach(() => {
    if (had) g.window = original;
    else delete g.window;
  });

  const RUN_KEY = 'deckbuilder.run.v1';
  const HISTORY_KEY = 'deckbuilder.history.v1';

  it('saves and loads a run, and clears it on request', () => {
    const run = newRun(5);
    saveRun(run);
    expect(loadSavedRun()!.toSaved()).toEqual(run.toSaved());
    clearSavedRun();
    expect(loadSavedRun()).toBeNull();
  });

  it('loadSavedRun discards garbage text (and removes it) instead of throwing', () => {
    const rng = new Rng(9);
    const texts = [...GARBAGE_STRINGS];
    for (let i = 0; i < 2000; i++) texts.push(JSON.stringify(randomJson(rng)));
    const saves = validSaves(30);
    for (let i = 0; i < 1500; i++) {
      const text = JSON.stringify(mutate(rng, pickOne(rng, saves))) ?? "null";
      texts.push(rng.next() < 0.5 ? text : text.slice(0, Math.floor(rng.next() * text.length))); // some truncated
    }
    for (const text of texts) {
      store.data.set(RUN_KEY, text);
      let loaded: RunState | null | undefined;
      expect(() => (loaded = loadSavedRun()), text.slice(0, 60)).not.toThrow();
      if (loaded === null) expect(store.data.has(RUN_KEY), 'a refused save is discarded').toBe(false);
    }
  });

  it('never keeps a finished run as the save to continue', () => {
    const run = newRun(8);
    for (let i = 0; i < 400 && !isRunOver(run); i++) stepRun(run, i + 1);
    saveRun(run);
    expect(loadSavedRun()).toBeNull();
    expect(store.data.has(RUN_KEY)).toBe(false);
  });

  it('survives storage that throws on every read or write, and a missing window', () => {
    store.failReads = true;
    expect(loadSavedRun()).toBeNull();
    expect(loadReportHistory()).toEqual([]);
    store.failReads = false;
    store.failWrites = true;
    const run = newRun(2);
    expect(() => saveRun(run)).not.toThrow();
    expect(() => clearSavedRun()).not.toThrow();
    expect(() => recordFinishedRun(run)).not.toThrow();
    delete g.window;
    expect(() => saveRun(run)).not.toThrow();
    expect(loadSavedRun()).toBeNull();
    expect(loadReportHistory()).toEqual([]);
  });

  it('keeps at most 20 reports, newest last, and tolerates a damaged history', () => {
    const run = newRun(4);
    for (let i = 0; i < 25; i++) recordFinishedRun(run);
    expect(loadReportHistory()).toHaveLength(20);
    for (const text of GARBAGE_STRINGS) {
      store.data.set(HISTORY_KEY, text);
      expect(() => loadReportHistory()).not.toThrow();
      expect(Array.isArray(loadReportHistory())).toBe(true);
      expect(() => recordFinishedRun(run)).not.toThrow();
    }
    store.data.set(HISTORY_KEY, '{"not":"an array"}');
    expect(loadReportHistory()).toEqual([]);
  });
});
