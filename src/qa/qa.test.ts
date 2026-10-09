import { describe, expect, it, vi } from 'vitest';
import { buildStarterDeck } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { newPlayableRun, restoreSavedRun } from '../data/run';
import { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import { BUILD_ID } from './buildInfo';
import { buildSnapshot, readSnapshot, SNAPSHOT_LOG_LINES, SNAPSHOT_VERSION } from './snapshot';
import type { SnapshotInput } from './snapshot';
import { checkDraft, reportAsText, submitReport } from './submit';
import { loadTester, newTesterId, rememberName } from './tester';
import type { KeyValueStore } from './tester';

const ENV = { userAgent: 'test-agent', viewport: { width: 800, height: 600 }, devicePixelRatio: 1, url: '/?seed=5' };

function fight(): CombatState {
  const combat = new CombatState(buildStarterDeck(), [ENEMIES['enemy-a']!], { rng: new Rng(7) });
  combat.start();
  return combat;
}

function input(over: Partial<SnapshotInput> = {}): SnapshotInput {
  return { run: newPlayableRun(5), combat: null, screen: 'MapScene', build: 'abc1234', environment: ENV, now: new Date('2026-10-09T12:00:00Z'), ...over };
}

describe('buildSnapshot', () => {
  it('captures the run alone on a non-fight screen', () => {
    const s = buildSnapshot(input());
    expect(s.version).toBe(SNAPSHOT_VERSION);
    expect(s.build).toBe('abc1234');
    expect(s.screen).toBe('MapScene');
    expect(s.capturedAt).toBe('2026-10-09T12:00:00.000Z');
    expect(s.run?.seed).toBe(5);
    expect(s.fight).toBeNull();
    expect(s.log).toEqual([]);
    expect(s.errors).toBeUndefined();
  });

  it('captures the fight exactly, plus its log, on the player\'s turn', () => {
    const combat = fight();
    const s = buildSnapshot(input({ combat, screen: 'CombatScene' }));
    expect(s.fight).not.toBeNull();
    expect(s.fight?.enemies[0]?.id).toBe('enemy-a');
    expect(s.log).toContain('Combat start.');
    expect(s.errors).toBeUndefined();
  });

  it('keeps only the most recent log lines', () => {
    const combat = fight();
    for (let i = 0; i < 100; i++) combat.log.push({ message: `line ${i}` });
    const s = buildSnapshot(input({ combat }));
    expect(s.log).toHaveLength(SNAPSHOT_LOG_LINES);
    expect(s.log.at(-1)).toBe('line 99');
  });

  it('explains instead of throwing when the fight cannot be captured (no seeded stream)', () => {
    const noStream = new CombatState(buildStarterDeck(), [ENEMIES['enemy-a']!]);
    noStream.start();
    const s = buildSnapshot(input({ combat: noStream }));
    expect(s.fight).toBeNull();
    expect(s.errors?.[0]).toContain('fight:');
    expect(s.run).not.toBeNull();
  });

  it('works with no run at all (the start screen)', () => {
    const s = buildSnapshot(input({ run: null, screen: 'BootScene' }));
    expect(s.run).toBeNull();
    expect(s.fight).toBeNull();
  });

  it('survives a JSON round trip unchanged', () => {
    const s = buildSnapshot(input({ combat: fight(), screen: 'CombatScene' }));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('readSnapshot', () => {
  it('reads back what buildSnapshot made, bare or as the proxy wraps it, and the run still resumes', () => {
    const s = buildSnapshot(input({ combat: fight(), screen: 'CombatScene' }));
    const bare = readSnapshot(JSON.parse(JSON.stringify(s)));
    const wrapped = readSnapshot({ receivedAt: 'x', testerId: 't', build: 'b', snapshot: JSON.parse(JSON.stringify(s)) });
    for (const result of [bare, wrapped]) {
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.snapshot.screen).toBe('CombatScene');
      expect(result.snapshot.fight?.enemies[0]?.id).toBe('enemy-a');
      expect(restoreSavedRun(result.snapshot.run)?.seed).toBe(5);
    }
  });

  it.each([
    ['a non-object', 'text'],
    ['a wrong version', { version: 99 }],
    ['a run that is not a valid save', { version: SNAPSHOT_VERSION, run: { version: 1 } }],
    ['a fight that is not a valid scenario', { version: SNAPSHOT_VERSION, fight: { nonsense: true } }],
  ])('rejects %s without throwing', (_label, raw) => {
    expect(readSnapshot(raw).ok).toBe(false);
  });

  it('accepts a snapshot with no run or fight', () => {
    const r = readSnapshot({ version: SNAPSHOT_VERSION, run: null, fight: null });
    expect(r.ok && r.snapshot.run).toBeNull();
  });
});

describe('tester id', () => {
  function memoryStore(): KeyValueStore & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
  }

  it('makes ids the proxy accepts', () => {
    for (let i = 0; i < 20; i++) expect(newTesterId()).toMatch(/^tester-[0-9a-f]{12}$/);
  });

  it('creates an id once and keeps it', () => {
    const store = memoryStore();
    const first = loadTester(store);
    expect(loadTester(store).id).toBe(first.id);
  });

  it('remembers the name and keeps the id', () => {
    const store = memoryStore();
    const t = loadTester(store);
    rememberName(store, t, 'Sam');
    expect(loadTester(store)).toEqual({ id: t.id, name: 'Sam' });
  });

  it('replaces a corrupted stored id and survives a missing or throwing store', () => {
    const store = memoryStore();
    store.data.set('deckbuilder.tester.v1', '{"id":"BAD ID"}');
    expect(loadTester(store).id).toMatch(/^tester-/);
    expect(loadTester(null).id).toMatch(/^tester-/);
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadTester(broken).id).toMatch(/^tester-/);
    expect(() => rememberName(broken, { id: 'tester-aaaaaaaa', name: '' }, 'x')).not.toThrow();
  });
});

describe('submitReport', () => {
  const tester = { id: 'tester-0123456789ab', name: '' };
  const snapshot = buildSnapshot(input());
  const draft = { text: '  The shop froze  ', name: ' Sam ' };

  function deps(status: number, body: unknown = { ok: true, issue: 7, snapshotId: 'snap-1' }) {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify(body), { status });
    }) as unknown as typeof fetch;
    return { calls, deps: { fetch: fakeFetch, url: 'https://proxy.test', secret: 'sekret' } };
  }

  it('posts the trimmed report with the secret, tester id, build and snapshot', async () => {
    const { calls, deps: d } = deps(201);
    const result = await submitReport(draft, tester, snapshot, d);
    expect(result).toEqual({ ok: true, issue: 7, snapshotId: 'snap-1' });
    expect(calls[0]!.url).toBe('https://proxy.test/report');
    expect((calls[0]!.init.headers as Record<string, string>)['X-Report-Secret']).toBe('sekret');
    const sent = JSON.parse(calls[0]!.init.body as string) as Record<string, unknown>;
    expect(sent).toMatchObject({ text: 'The shop froze', name: 'Sam', testerId: tester.id, build: 'abc1234' });
    expect(sent.snapshot).toEqual(JSON.parse(JSON.stringify(snapshot)));
  });

  it.each([
    [401, 'right key'],
    [413, 'too large'],
    [429, 'Too many'],
    [400, 'not accepted'],
    [502, 'right now'],
  ])('turns status %i into a friendly message', async (status, fragment) => {
    const { deps: d } = deps(status, { error: 'x' });
    const result = await submitReport(draft, tester, snapshot, d);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(fragment);
    expect(!result.ok && result.status).toBe(status);
  });

  it('reports a network failure', async () => {
    const d = { fetch: (async () => { throw new Error('offline'); }) as unknown as typeof fetch, url: 'https://proxy.test', secret: 's' };
    const result = await submitReport(draft, tester, snapshot, d);
    expect(!result.ok && result.error).toContain('connection');
  });

  it('refuses to send when the build has no secret, or the text is empty or too long, without calling the network', async () => {
    const { calls, deps: d } = deps(201);
    expect((await submitReport(draft, tester, snapshot, { ...d, secret: '' })).ok).toBe(false);
    expect((await submitReport({ text: '   ', name: '' }, tester, snapshot, d)).ok).toBe(false);
    expect((await submitReport({ text: 'x'.repeat(2001), name: '' }, tester, snapshot, d)).ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('checks drafts', () => {
    expect(checkDraft({ text: 'ok', name: '' })).toBeNull();
    expect(checkDraft({ text: 'ok', name: 'x'.repeat(61) })).not.toBeNull();
  });

  it('builds a paste-able fallback holding the text, name and snapshot', () => {
    const text = reportAsText(draft, tester, snapshot);
    expect(text).toContain('The shop froze');
    expect(text).toContain('(Sam)');
    expect(text).toContain(tester.id);
    expect(text).toContain(JSON.stringify(snapshot));
  });
});

describe('build id', () => {
  it('is a non-empty string (the commit in a build, "dev" otherwise)', () => {
    expect(typeof BUILD_ID).toBe('string');
    expect(BUILD_ID.length).toBeGreaterThan(0);
  });
});
