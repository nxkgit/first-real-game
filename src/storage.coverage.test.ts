import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// storage.ts, settings.ts and session.ts talk to `window`; vitest runs in node here, so give them
// a fake one. Every behaviour below must degrade gracefully, never throw.

class FakeStorage {
  data = new Map<string, string>();
  failReads = false;
  failWrites = false;
  getItem(k: string): string | null {
    if (this.failReads) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    if (this.failWrites) throw new Error('blocked');
    this.data.delete(k);
  }
}

let store: FakeStorage;
function install(search = ''): void {
  store = new FakeStorage();
  vi.stubGlobal('window', { localStorage: store, location: { search } });
}
/** Fresh copies of the modules so import-time reads (settings) see the current fake. */
async function load() {
  vi.resetModules();
  return {
    storage: await import('./storage'),
    run: await import('./data/run'),
    settings: await import('./settings'),
    session: await import('./session'),
  };
}

beforeEach(() => install());
afterEach(() => vi.unstubAllGlobals());

describe('storage: current run', () => {
  it('saves and loads a run, and the loaded run matches', async () => {
    const { storage, run } = await load();
    const r = run.newPlayableRun(31);
    r.chooseNode(r.mapChoices[0].id);
    storage.saveRun(r);
    const back = storage.loadSavedRun()!;
    expect(back.seed).toBe(31);
    expect(back.position).toBe(r.position);
    expect(back.toSaved()).toEqual(JSON.parse(JSON.stringify(r.toSaved())));
  });

  it('returns null when nothing is saved', async () => {
    const { storage } = await load();
    expect(storage.loadSavedRun()).toBeNull();
  });

  it('clearSavedRun removes it', async () => {
    const { storage, run } = await load();
    storage.saveRun(run.newRun(1));
    storage.clearSavedRun();
    expect(storage.loadSavedRun()).toBeNull();
    expect(store.data.size).toBe(0);
  });

  it('a corrupt entry (not JSON, wrong shape, old version) loads as null and is discarded', async () => {
    const { storage } = await load();
    for (const text of ['{{{', 'null', '[]', '{"version":1}', '"hello"', '']) {
      store.data.set('deckbuilder.run.v1', text);
      expect(storage.loadSavedRun(), text).toBeNull();
      expect(store.data.has('deckbuilder.run.v1'), text).toBe(false);
    }
  });

  it('a finished run (won or lost) is not offered for continuing, and is cleared', async () => {
    const { storage, run } = await load();
    for (const phase of ['won', 'lost'] as const) {
      const r = run.newRun(2);
      r.phase = phase;
      storage.saveRun(r);
      expect(storage.loadSavedRun()).toBeNull();
      expect(store.data.has('deckbuilder.run.v1')).toBe(false);
    }
  });

  it('survives disabled storage: reads give null, writes are silent no-ops', async () => {
    const { storage, run } = await load();
    store.failReads = true;
    store.failWrites = true;
    expect(() => storage.saveRun(run.newRun(1))).not.toThrow();
    expect(() => storage.clearSavedRun()).not.toThrow();
    expect(storage.loadSavedRun()).toBeNull();
    expect(storage.loadReportHistory()).toEqual([]);
    expect(() => storage.recordFinishedRun(run.newRun(1))).not.toThrow();
  });

  it('survives a missing window.localStorage entirely (accessor throws)', async () => {
    vi.stubGlobal('window', {
      get localStorage(): never {
        throw new Error('denied');
      },
    });
    const { storage, run } = await load();
    expect(() => storage.saveRun(run.newRun(1))).not.toThrow();
    expect(storage.loadSavedRun()).toBeNull();
  });

  it('a quota error while saving leaves the previous save in place', async () => {
    const { storage, run } = await load();
    storage.saveRun(run.newRun(5));
    store.failWrites = true;
    storage.saveRun(run.newRun(6));
    store.failWrites = false;
    expect(storage.loadSavedRun()!.seed).toBe(5);
  });
});

describe('storage: finished-run history', () => {
  it('records reports newest last', async () => {
    const { storage, run } = await load();
    storage.recordFinishedRun(run.newRun(1));
    storage.recordFinishedRun(run.newRun(2));
    expect(storage.loadReportHistory().map((r) => r.seed)).toEqual([1, 2]);
  });

  it('keeps only the most recent 20', async () => {
    const { storage, run } = await load();
    for (let i = 0; i < 25; i++) storage.recordFinishedRun(run.newRun(i));
    const seeds = storage.loadReportHistory().map((r) => r.seed);
    expect(seeds).toHaveLength(20);
    expect(seeds[0]).toBe(5);
    expect(seeds[19]).toBe(24);
  });

  it('a corrupt or non-array history reads as empty, and recording still works after it', async () => {
    const { storage, run } = await load();
    for (const text of ['{{{', '{"a":1}', '3', 'null']) {
      store.data.set('deckbuilder.history.v1', text);
      expect(storage.loadReportHistory(), text).toEqual([]);
    }
    storage.recordFinishedRun(run.newRun(9));
    expect(storage.loadReportHistory().map((r) => r.seed)).toEqual([9]);
  });
});

describe('storage: copyToClipboard', () => {
  it('uses the async clipboard when present', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { storage } = await load();
    expect(await storage.copyToClipboard('hi')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });

  it('falls back to a hidden text box when the clipboard API refuses, and reports its result', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } });
    const box = { value: '', style: {} as Record<string, string>, select: vi.fn(), remove: vi.fn() };
    const doc = {
      createElement: vi.fn(() => box),
      body: { appendChild: vi.fn() },
      execCommand: vi.fn(() => true),
    };
    vi.stubGlobal('document', doc);
    const { storage } = await load();
    expect(await storage.copyToClipboard('abc')).toBe(true);
    expect(box.value).toBe('abc');
    expect(box.remove).toHaveBeenCalled();
    doc.execCommand.mockReturnValue(false);
    expect(await storage.copyToClipboard('abc')).toBe(false);
  });

  it('returns false (does not throw) when there is no clipboard and no document', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', undefined);
    const { storage } = await load();
    expect(await storage.copyToClipboard('x')).toBe(false);
  });
});

describe('settings', () => {
  const KEY = 'deckbuilder.settings.v1';

  it('defaults when nothing is stored', async () => {
    const { settings } = await load();
    expect(settings.getSettings()).toEqual({ volume: 1, muted: false, animationSpeed: 1, reducedMotion: false });
  });

  it('loads valid stored values', async () => {
    store.data.set(KEY, JSON.stringify({ volume: 0.4, muted: true, animationSpeed: 2, reducedMotion: true }));
    const { settings } = await load();
    expect(settings.getSettings()).toEqual({ volume: 0.4, muted: true, animationSpeed: 2, reducedMotion: true });
  });

  it('bad entries fall back to defaults per field: out-of-range volume, unlisted speed, wrong types', async () => {
    store.data.set(KEY, JSON.stringify({ volume: 7, muted: 'yes', animationSpeed: 3, reducedMotion: 1 }));
    const { settings } = await load();
    expect(settings.getSettings()).toEqual({ volume: 1, muted: false, animationSpeed: 1, reducedMotion: false });
    store.data.set(KEY, JSON.stringify({ volume: -0.1 }));
    expect((await load()).settings.getSettings().volume).toBe(1);
    store.data.set(KEY, JSON.stringify({ volume: '0.5' }));
    expect((await load()).settings.getSettings().volume).toBe(1);
  });

  it('corrupt JSON, or non-object JSON, gives defaults', async () => {
    for (const text of ['{{{', 'null', '5', '[]', '"x"']) {
      store.data.set(KEY, text);
      expect((await load()).settings.getSettings(), text).toEqual({ volume: 1, muted: false, animationSpeed: 1, reducedMotion: false });
    }
  });

  it('volume 0 and 1 are both valid boundaries', async () => {
    const { settings } = await load();
    settings.updateSettings({ volume: 0 });
    expect(settings.getSettings().volume).toBe(0);
    settings.updateSettings({ volume: 1 });
    expect(settings.getSettings().volume).toBe(1);
  });

  it('update merges, persists, and notifies listeners until they unsubscribe', async () => {
    const { settings } = await load();
    const seen: number[] = [];
    const off = settings.onSettingsChange((s) => seen.push(s.volume));
    settings.updateSettings({ volume: 0.5 });
    expect(JSON.parse(store.data.get(KEY)!)).toMatchObject({ volume: 0.5, muted: false });
    settings.updateSettings({ muted: true });
    expect(settings.getSettings()).toMatchObject({ volume: 0.5, muted: true });
    off();
    settings.updateSettings({ volume: 0.9 });
    expect(seen).toEqual([0.5, 0.5]);
  });

  it('update with an invalid value is cleaned, not stored raw', async () => {
    const { settings } = await load();
    settings.updateSettings({ volume: 5, animationSpeed: 9 });
    expect(settings.getSettings()).toMatchObject({ volume: 1, animationSpeed: 1 });
  });

  it('every listed animation speed is accepted', async () => {
    const { settings } = await load();
    for (const s of settings.ANIMATION_SPEEDS) {
      settings.updateSettings({ animationSpeed: s });
      expect(settings.getSettings().animationSpeed).toBe(s);
    }
  });

  it('effectiveVolume is 0 when muted and the volume otherwise', async () => {
    const { settings } = await load();
    settings.updateSettings({ volume: 0.3, muted: false });
    expect(settings.effectiveVolume()).toBe(0.3);
    settings.updateSettings({ muted: true });
    expect(settings.effectiveVolume()).toBe(0);
  });

  it('still applies a change for this visit when storage is full or blocked', async () => {
    const { settings } = await load();
    store.failWrites = true;
    const seen: number[] = [];
    settings.onSettingsChange((s) => seen.push(s.volume));
    expect(() => settings.updateSettings({ volume: 0.2 })).not.toThrow();
    expect(settings.getSettings().volume).toBe(0.2);
    expect(seen).toEqual([0.2]);
  });

  it('blocked reads at start-up give defaults', async () => {
    store.failReads = true;
    const { settings } = await load();
    expect(settings.getSettings().volume).toBe(1);
  });
});

describe('session', () => {
  it('holds the current run and combat, and clears the combat', async () => {
    const { session, run } = await load();
    expect(session.getCurrentRun()).toBeNull();
    expect(session.getCurrentCombat()).toBeNull();
    const r = run.newRun(1);
    session.setCurrentRun(r);
    expect(session.getCurrentRun()).toBe(r);
    const fake = {} as never;
    session.setCurrentCombat(fake);
    expect(session.getCurrentCombat()).toBe(fake);
    session.setCurrentCombat(null);
    expect(session.getCurrentCombat()).toBeNull();
  });

  it('seedFromUrl reads ?seed= as a number, and ignores anything that is not a plain non-negative integer in range', async () => {
    const cases: [string, number | undefined][] = [
      ['?seed=123', 123],
      ['?seed=0', 0],
      ['?dev&seed=42', 42],
      ['?seed=4294967295', 4294967295],
      ['?seed=4294967296', undefined],
      ['?seed=-5', undefined],
      ['?seed=1.5', undefined],
      ['?seed=abc', undefined],
      ['?seed=', undefined],
      ['?seed=12abc', undefined],
      ['', undefined],
      ['?dev', undefined],
    ];
    for (const [search, expected] of cases) {
      install(search);
      const { session } = await load();
      expect(session.seedFromUrl(), search).toBe(expected);
    }
  });
});
