import { describe, expect, it, vi } from 'vitest';
import { LIMITS } from './config.ts';
import { handleRequest } from './handler.ts';
import { buildIssue, fenceFor, inlineCode, parseReport } from './report.ts';
import type { Deps, Env } from './types.ts';

function makeKv() {
  const data = new Map<string, string>();
  return {
    data,
    async get(key: string) {
      return data.get(key) ?? null;
    },
    async put(key: string, value: string) {
      data.set(key, value);
    },
  };
}

function makeEnv(): Env & { STORE: ReturnType<typeof makeKv> } {
  return {
    STORE: makeKv(),
    GITHUB_TOKEN: 'gh-token',
    REPORT_SECRET: 'report-secret',
    MAINTAINER_KEY: 'maintainer-key',
    GITHUB_REPO: 'owner/repo',
    ALLOWED_ORIGINS: 'https://game.example,http://localhost:5173',
  };
}

type FetchCall = { url: string; init: RequestInit };

function makeDeps(githubStatus = 201) {
  const calls: FetchCall[] = [];
  let n = 0;
  const deps: Deps = {
    fetch: vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ number: 42 }), { status: githubStatus });
    }) as unknown as typeof fetch,
    now: () => 1_700_000_000_000,
    newId: () => `00000000-0000-0000-0000-${String(++n).padStart(12, '0')}`,
  };
  return { deps, calls };
}

const GOOD = {
  text: 'The shop froze after I bought a card',
  name: 'Sam',
  testerId: 'tester-abcdef12',
  build: 'abc1234',
  snapshot: { run: { hp: 30 }, log: ['a', 'b'] },
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://worker.test/report', {
    method: 'POST',
    headers: { 'X-Report-Secret': 'report-secret', 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('parseReport', () => {
  it('accepts a good report and trims text and name', () => {
    const r = parseReport({ ...GOOD, text: '  hi  ', name: ' Sam ' });
    expect(r.ok && r.report.text).toBe('hi');
    expect(r.ok && r.report.name).toBe('Sam');
  });

  it('allows a missing name', () => {
    const { name: _name, ...rest } = GOOD;
    const r = parseReport(rest);
    expect(r.ok && r.report.name).toBe('');
  });

  it.each([
    ['non-object', 'text'],
    ['array', []],
    ['empty text', { ...GOOD, text: '   ' }],
    ['text too long', { ...GOOD, text: 'x'.repeat(LIMITS.maxTextChars + 1) }],
    ['name too long', { ...GOOD, name: 'x'.repeat(LIMITS.maxNameChars + 1) }],
    ['name not a string', { ...GOOD, name: 5 }],
    ['bad tester id', { ...GOOD, testerId: 'Bad ID!' }],
    ['short tester id', { ...GOOD, testerId: 'abc' }],
    ['empty build', { ...GOOD, build: '' }],
    ['snapshot missing', { ...GOOD, snapshot: undefined }],
    ['snapshot an array', { ...GOOD, snapshot: [] }],
  ])('rejects %s', (_label, input) => {
    expect(parseReport(input).ok).toBe(false);
  });
});

describe('issue text', () => {
  it('uses a fence longer than any backtick run in the text', () => {
    expect(fenceFor('plain')).toBe('```');
    expect(fenceFor('has ``` inside')).toBe('````');
    expect(fenceFor('has ````` inside')).toBe('``````');
  });

  it('keeps tester text inside a fence even if it tries to close one', () => {
    const text = 'oops\n```\n@everyone [click](http://evil.example)';
    const { body } = buildIssue({ ...GOOD, text }, 'snap-1');
    const fence = fenceFor(text);
    expect(fence.length).toBeGreaterThan(3);
    const lines = body.split('\n');
    const open = lines.indexOf(fence);
    const close = lines.lastIndexOf(fence);
    expect(close).toBeGreaterThan(open);
    expect(lines.slice(open + 1, close).join('\n')).toBe(text);
  });

  it('makes a one-line, clipped title', () => {
    const { title } = buildIssue({ ...GOOD, text: 'line one\nline two ' + 'y'.repeat(200) }, 's');
    expect(title.includes('\n')).toBe(false);
    expect(title.startsWith('Report: line one line two')).toBe(true);
    expect(title.length).toBeLessThanOrEqual('Report: '.length + LIMITS.titleChars);
  });

  it('neutralises backticks and line breaks in inline fields', () => {
    expect(inlineCode('a`b\nc')).toBe("`a'b c`");
    const { body } = buildIssue({ ...GOOD, name: 'evil`\n# heading' }, 's');
    expect(body).toContain("- Name: `evil' # heading`");
  });

  it('omits the name line when there is no name', () => {
    expect(buildIssue({ ...GOOD, name: '' }, 's').body).not.toContain('Name:');
  });
});

describe('POST /report', () => {
  it('stores the snapshot, files a labelled issue and returns both ids', async () => {
    const env = makeEnv();
    const { deps, calls } = makeDeps();
    const res = await handleRequest(post(GOOD), env, deps);
    expect(res.status).toBe(201);
    const out = (await res.json()) as { ok: boolean; issue: number; snapshotId: string };
    expect(out).toEqual({ ok: true, issue: 42, snapshotId: '00000000-0000-0000-0000-000000000001' });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.github.com/repos/owner/repo/issues');
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer gh-token');
    expect(headers['User-Agent']).toBeTruthy();
    const sent = JSON.parse(calls[0]!.init.body as string) as { title: string; body: string; labels: string[] };
    expect(sent.labels).toEqual(['needs-triage']);
    expect(sent.body).toContain(out.snapshotId);
    expect(sent.body).toContain(GOOD.text);

    const stored = JSON.parse(env.STORE.data.get(`snap:${out.snapshotId}`)!) as { snapshot: unknown; testerId: string };
    expect(stored.snapshot).toEqual(GOOD.snapshot);
    expect(stored.testerId).toBe(GOOD.testerId);
  });

  it('refuses a missing or wrong secret and does nothing', async () => {
    const env = makeEnv();
    const { deps, calls } = makeDeps();
    const wrong = await handleRequest(post(GOOD, { 'X-Report-Secret': 'nope' }), env, deps);
    expect(wrong.status).toBe(401);
    const none = new Request('https://worker.test/report', { method: 'POST', body: JSON.stringify(GOOD) });
    expect((await handleRequest(none, env, deps)).status).toBe(401);
    expect(calls).toHaveLength(0);
    expect(env.STORE.data.size).toBe(0);
  });

  it('rejects invalid JSON and invalid reports with 400', async () => {
    const env = makeEnv();
    const { deps, calls } = makeDeps();
    expect((await handleRequest(post('{not json'), env, deps)).status).toBe(400);
    expect((await handleRequest(post({ ...GOOD, text: '' }), env, deps)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('rejects an oversize body with 413', async () => {
    const env = makeEnv();
    const { deps, calls } = makeDeps();
    const big = { ...GOOD, snapshot: { blob: 'x'.repeat(LIMITS.maxBodyBytes) } };
    expect((await handleRequest(post(big), env, deps)).status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it('allows 20 reports an hour per tester id, then 429', async () => {
    const env = makeEnv();
    const { deps } = makeDeps();
    for (let i = 0; i < LIMITS.reportsPerHourPerId; i++) {
      // vary the IP so only the per-id limit can trip
      const res = await handleRequest(post(GOOD, { 'CF-Connecting-IP': `10.0.0.${i}` }), env, deps);
      expect(res.status).toBe(201);
    }
    const over = await handleRequest(post(GOOD, { 'CF-Connecting-IP': '10.9.9.9' }), env, deps);
    expect(over.status).toBe(429);
  });

  it('caps one address even when the tester id changes', async () => {
    const env = makeEnv();
    const { deps } = makeDeps();
    for (let i = 0; i < LIMITS.reportsPerHourPerIp; i++) {
      const id = `tester-${String(i).padStart(8, '0')}`;
      const res = await handleRequest(post({ ...GOOD, testerId: id }, { 'CF-Connecting-IP': '1.2.3.4' }), env, deps);
      expect(res.status).toBe(201);
    }
    const over = await handleRequest(post({ ...GOOD, testerId: 'tester-zzzzzzzz' }, { 'CF-Connecting-IP': '1.2.3.4' }), env, deps);
    expect(over.status).toBe(429);
  });

  it('starts a fresh count in the next hour', async () => {
    const env = makeEnv();
    const { deps } = makeDeps();
    for (let i = 0; i < LIMITS.reportsPerHourPerId; i++) {
      await handleRequest(post(GOOD, { 'CF-Connecting-IP': `10.0.0.${i}` }), env, deps);
    }
    const later: Deps = { ...deps, now: () => 1_700_000_000_000 + 61 * 60 * 1000 };
    expect((await handleRequest(post(GOOD), env, later)).status).toBe(201);
  });

  it('answers 502 when GitHub refuses, without echoing anything from GitHub', async () => {
    const env = makeEnv();
    const { deps } = makeDeps(403);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await handleRequest(post(GOOD), env, deps);
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('gh-token');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('403'));
    spy.mockRestore();
  });

  it('answers 502 when GitHub cannot be reached', async () => {
    const env = makeEnv();
    const { deps } = makeDeps();
    deps.fetch = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect((await handleRequest(post(GOOD), env, deps)).status).toBe(502);
  });

  it('rejects other methods on /report', async () => {
    const env = makeEnv();
    const { deps } = makeDeps();
    const res = await handleRequest(new Request('https://worker.test/report'), env, deps);
    expect(res.status).toBe(405);
  });
});

describe('GET /snapshot/<id>', () => {
  async function filed() {
    const env = makeEnv();
    const { deps } = makeDeps();
    const res = await handleRequest(post(GOOD), env, deps);
    const { snapshotId } = (await res.json()) as { snapshotId: string };
    return { env, deps, snapshotId };
  }

  it('returns the stored snapshot with the maintainer key', async () => {
    const { env, deps, snapshotId } = await filed();
    const res = await handleRequest(
      new Request(`https://worker.test/snapshot/${snapshotId}`, { headers: { 'X-Maintainer-Key': 'maintainer-key' } }),
      env,
      deps,
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { snapshot: unknown }).snapshot).toEqual(GOOD.snapshot);
  });

  it('refuses a missing key, a wrong key, and the report secret', async () => {
    const { env, deps, snapshotId } = await filed();
    const attempts: Record<string, string>[] = [{}, { 'X-Maintainer-Key': 'bad' }, { 'X-Maintainer-Key': 'report-secret' }];
    for (const headers of attempts) {
      const res = await handleRequest(new Request(`https://worker.test/snapshot/${snapshotId}`, { headers }), env, deps);
      expect(res.status).toBe(401);
    }
  });

  it('404s for an unknown id', async () => {
    const { env, deps } = await filed();
    const res = await handleRequest(
      new Request('https://worker.test/snapshot/ffffffff-ffff', { headers: { 'X-Maintainer-Key': 'maintainer-key' } }),
      env,
      deps,
    );
    expect(res.status).toBe(404);
  });

  it('does not reach the rate-limit counters through the snapshot route', async () => {
    const { env, deps } = await filed();
    const res = await handleRequest(
      new Request('https://worker.test/snapshot/rl:id:x', { headers: { 'X-Maintainer-Key': 'maintainer-key' } }),
      env,
      deps,
    );
    expect(res.status).toBe(404);
  });
});

describe('browser access (CORS)', () => {
  it('answers a preflight from an allowed origin', async () => {
    const env = makeEnv();
    const res = await handleRequest(
      new Request('https://worker.test/report', { method: 'OPTIONS', headers: { Origin: 'https://game.example' } }),
      env,
      makeDeps().deps,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://game.example');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('X-Report-Secret');
  });

  it('refuses a browser origin that is not on the list, even with the right secret', async () => {
    const env = makeEnv();
    const { deps, calls } = makeDeps();
    const res = await handleRequest(post(GOOD, { Origin: 'https://evil.example' }), env, deps);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it('adds CORS headers to a successful report from an allowed origin', async () => {
    const env = makeEnv();
    const res = await handleRequest(post(GOOD, { Origin: 'http://localhost:5173' }), env, makeDeps().deps);
    expect(res.status).toBe(201);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });
});

describe('routing', () => {
  it('404s for unknown paths', async () => {
    const res = await handleRequest(new Request('https://worker.test/'), makeEnv(), makeDeps().deps);
    expect(res.status).toBe(404);
  });
});
