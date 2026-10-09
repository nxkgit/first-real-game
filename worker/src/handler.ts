import { HOUR_MS, LIMITS } from './config.ts';
import { buildIssue, parseReport } from './report.ts';
import type { Deps, Env, KV } from './types.ts';

const defaultDeps: Deps = {
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  newId: () => crypto.randomUUID(),
};

const encoder = new TextEncoder();

function allowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}

/** CORS headers for a browser caller. A request with no Origin (curl, tests) gets none and is still
 *  protected by the secrets. */
function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Report-Secret, X-Maintainer-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

/** Compares two secrets without leaking where they differ: both are hashed to equal length first. */
async function secretsMatch(given: string | null, expected: string): Promise<boolean> {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(given)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

/**
 * Counts one hit against `key` for the current hour and says whether it is under `limit`.
 * KV reads and writes are not atomic, so two simultaneous requests can both slip under the cap;
 * that is acceptable for a friends-only playtest and not worth a Durable Object.
 */
async function underLimit(store: KV, key: string, limit: number, now: number): Promise<boolean> {
  const k = `rl:${key}:${Math.floor(now / HOUR_MS)}`;
  const used = Number.parseInt((await store.get(k)) ?? '0', 10) || 0;
  if (used >= limit) return false;
  await store.put(k, String(used + 1), { expirationTtl: 2 * 60 * 60 });
  return true;
}

async function handleReport(request: Request, env: Env, deps: Deps, cors: Record<string, string>): Promise<Response> {
  if (!(await secretsMatch(request.headers.get('X-Report-Secret'), env.REPORT_SECRET))) {
    return json({ error: 'unauthorized' }, 401, cors);
  }

  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > LIMITS.maxBodyBytes) return json({ error: 'report too large' }, 413, cors);
  const raw = await request.text();
  if (encoder.encode(raw).length > LIMITS.maxBodyBytes) return json({ error: 'report too large' }, 413, cors);

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(raw);
  } catch {
    return json({ error: 'body is not valid JSON' }, 400, cors);
  }
  const parsed = parseReport(parsedBody);
  if (!parsed.ok) return json({ error: parsed.error }, 400, cors);
  const { report } = parsed;

  const now = deps.now();
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (
    !(await underLimit(env.STORE, `id:${report.testerId}`, LIMITS.reportsPerHourPerId, now)) ||
    !(await underLimit(env.STORE, `ip:${ip}`, LIMITS.reportsPerHourPerIp, now))
  ) {
    return json({ error: 'too many reports; try again later' }, 429, cors);
  }

  // Store the snapshot first: the issue links to it. If filing the issue then fails, the snapshot is
  // an orphan that KV expires on its own.
  const snapshotId = deps.newId();
  await env.STORE.put(
    `snap:${snapshotId}`,
    JSON.stringify({ receivedAt: new Date(now).toISOString(), testerId: report.testerId, build: report.build, snapshot: report.snapshot }),
    { expirationTtl: LIMITS.snapshotTtlSeconds },
  );

  const { title, body } = buildIssue(report, snapshotId);
  let res: Response;
  try {
    res = await deps.fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'first-real-game-report-proxy',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body, labels: ['needs-triage'] }),
    });
  } catch {
    return json({ error: 'could not reach GitHub' }, 502, cors);
  }
  if (!res.ok) {
    // Status only: the response body and token are never logged.
    console.error(`GitHub issue creation failed with status ${res.status}`);
    return json({ error: 'could not file the report' }, 502, cors);
  }
  const issue = (await res.json()) as { number?: number };
  return json({ ok: true, issue: issue.number ?? null, snapshotId }, 201, cors);
}

async function handleSnapshot(request: Request, env: Env, id: string, cors: Record<string, string>): Promise<Response> {
  if (!(await secretsMatch(request.headers.get('X-Maintainer-Key'), env.MAINTAINER_KEY))) {
    return json({ error: 'unauthorized' }, 401, cors);
  }
  const stored = await env.STORE.get(`snap:${id}`);
  if (stored === null) return json({ error: 'not found' }, 404, cors);
  return new Response(stored, { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
}

export async function handleRequest(request: Request, env: Env, deps: Deps = defaultDeps): Promise<Response> {
  const cors = corsHeaders(request, env);
  const { pathname } = new URL(request.url);

  // A browser origin that is not on the list is refused outright, before any secret is checked.
  const origin = request.headers.get('Origin');
  if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'origin not allowed' }, 403);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  if (pathname === '/report') {
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);
    return handleReport(request, env, deps, cors);
  }

  const snap = /^\/snapshot\/([0-9a-fA-F-]{8,64})$/.exec(pathname);
  if (snap) {
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, cors);
    return handleSnapshot(request, env, snap[1]!, cors);
  }

  return json({ error: 'not found' }, 404, cors);
}
