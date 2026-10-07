import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { ACT_CONTENT } from '../data/run';
import { RELIC_POOL } from '../data/relics';
import * as tunables from '../data/tunables';
import { Evaluator, METRIC_IDS, METRICS } from './engine';
import type { MetricId, Samples } from './engine';
import { cardCandidates } from './experiments';
import { heading, r6, table } from './report';
import type { SkillLevel } from './skills';
import { Z_MOVED, TOLERANCE } from './targets';
import { fix, pct, signed, summarize, welchDiff } from './stats';
import type { Summary } from './stats';
import { actFights, referenceDeckSets, withAdded } from './suites';
import type { DeckSet } from './suites';

/**
 * Baselines and the regression check. A snapshot is a flat map of metric key -> (mean, sd, n):
 *   ladder/<skill>/<deckset>/<fight>/<win|hpLost|turns>   per-fight outcomes for each reference deck set
 *   card-add/<skill>/<card>/<win|hpLost|turns>             PAIRED effect of adding the card to the starter deck
 * The check re-runs the same configuration on the current content and compares key by key.
 */

export interface SnapshotConfig {
  baseSeed: number;
  seeds: number;
  skills: SkillLevel[];
  pool: 'reward' | 'all';
  includeUpgrades: boolean;
}

export interface Snapshot {
  version: 1;
  generated: string;
  note: string;
  content: { hash: string; cards: string[]; enemies: string[]; fights: string[] };
  config: SnapshotConfig;
  metrics: Record<string, Summary>;
}

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = { baseSeed: 1, seeds: 100, skills: ['random', 'greedy', 'smart'], pool: 'reward', includeUpgrades: false };

/** A fingerprint of everything that determines fight outcomes: cards, enemies, relics, act lists, tunables. */
export function contentHash(): string {
  const text = JSON.stringify([CARDS, ENEMIES, RELIC_POOL, ACT_CONTENT, tunables]);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

const round = (s: Summary): Summary => ({ mean: r6(s.mean), sd: r6(s.sd), n: s.n });

const concat = (parts: Float64Array[]): Float64Array => {
  const out = new Float64Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

export function buildSnapshot(config: SnapshotConfig, generated: string, onProgress?: (msg: string) => void): Snapshot {
  const fights = actFights();
  const ev = new Evaluator({ fights, seeds: config.seeds, baseSeed: config.baseSeed });
  const sets: DeckSet[] = referenceDeckSets({ pool: config.pool });
  const metrics: Record<string, Summary> = {};

  for (const skill of config.skills) {
    onProgress?.(`ladder: ${skill}`);
    for (const set of sets) {
      fights.forEach((fight, fi) => {
        const pooled = set.decks.map((d) => ev.forFight(ev.evaluate(d, skill), fi));
        for (const m of METRIC_IDS) metrics[`ladder/${skill}/${set.name}/${fight.id}/${m}`] = round(summarize(concat(pooled.map((p) => p[m]))));
      });
    }
    onProgress?.(`cards: ${skill}`);
    const starter = sets[0].decks[0];
    const base = ev.evaluate(starter, skill);
    for (const card of cardCandidates(config.includeUpgrades)) {
      const variant: Samples = ev.evaluate(withAdded(starter, card), skill);
      for (const m of METRIC_IDS) {
        const d = new Float64Array(base[m].length);
        for (let u = 0; u < d.length; u++) d[u] = variant[m][u] - base[m][u];
        metrics[`card-add/${skill}/${card.id}/${m}`] = round(summarize(d));
      }
    }
  }

  return {
    version: 1,
    generated,
    note: 'Content at the time was placeholder. Regenerate with `npm run balance:baseline`. See docs/BALANCE.md.',
    content: { hash: contentHash(), cards: Object.keys(CARDS).sort(), enemies: Object.keys(ENEMIES).sort(), fights: fights.map((f) => f.id) },
    config,
    metrics,
  };
}

// ---------- comparison ----------

export type Change = 'moved' | 'possible';

export interface Delta {
  key: string;
  metric: MetricId;
  before: Summary;
  after: Summary;
  diff: number;
  lo: number;
  hi: number;
  z: number;
  /** |diff| divided by the metric's tolerance. */
  size: number;
  change: Change;
}

export interface Comparison {
  baselineGenerated: string;
  sameContent: boolean;
  deltas: Delta[];
  /** Keys whose change was statistically clear but smaller than the tolerance. */
  tiny: number;
  unchanged: number;
  added: string[];
  removed: string[];
}

const metricOf = (key: string): MetricId => key.slice(key.lastIndexOf('/') + 1) as MetricId;

/**
 * Tolerance rules (all in src/sim/targets.ts):
 *  - "moved": |z| >= Z_MOVED (3) AND |change| >= the metric's tolerance (win 3 pts, HP lost 1.5, turns 0.4).
 *  - "possible": the change is at least the tolerance but not statistically clear (1.96 <= |z| < 3, or
 *    |z| < 1.96 with a change of twice the tolerance): re-run with more seeds.
 *  - "tiny": clear but below tolerance: counted, not listed.  Everything else: unchanged.
 * The two sides are treated as independent samples (Welch), which is conservative: shared seeds make
 * the real noise smaller, and identical inputs give identical outputs (change exactly 0).
 */
export function compareSnapshots(before: Snapshot, after: Snapshot): Comparison {
  const deltas: Delta[] = [];
  let tiny = 0;
  let unchanged = 0;
  const added: string[] = [];
  const removed: string[] = [];
  for (const [key, b] of Object.entries(before.metrics)) {
    const a = after.metrics[key];
    if (!a) {
      removed.push(key);
      continue;
    }
    const metric = metricOf(key);
    const w = welchDiff(b, a);
    const tol = TOLERANCE[metric];
    const size = Math.abs(w.mean) / tol;
    const absZ = Math.abs(w.z);
    let change: Change | undefined;
    if (size >= 1 && absZ >= Z_MOVED) change = 'moved';
    else if (size >= 1 && absZ >= 1.96) change = 'possible';
    else if (size >= 2) change = 'possible';
    if (change) deltas.push({ key, metric, before: b, after: a, diff: w.mean, lo: w.lo, hi: w.hi, z: w.z, size, change });
    else if (absZ >= Z_MOVED) tiny++;
    else unchanged++;
  }
  for (const key of Object.keys(after.metrics)) if (!before.metrics[key]) added.push(key);
  deltas.sort((x, y) => (x.change === y.change ? y.size - x.size : x.change === 'moved' ? -1 : 1));
  return { baselineGenerated: before.generated, sameContent: before.content.hash === after.content.hash, deltas, tiny, unchanged, added, removed };
}

const show = (metric: MetricId, x: number): string => (metric === 'win' ? pct(x) : fix(x, METRICS[metric].digits));

const groupKeys = (keys: string[]): string[] => {
  // collapse "card-add/greedy/foo/win|hpLost|turns" and ladder keys into their entity
  const seen = new Set<string>();
  for (const k of keys) seen.add(k.slice(0, k.lastIndexOf('/')));
  return [...seen].sort();
};

export function renderComparison(c: Comparison, current: Snapshot): string {
  const lines: string[] = [
    heading(2, 'Balance check'),
    '',
    `Compared against the baseline generated ${c.baselineGenerated}. Content fingerprint ${c.sameContent ? 'is UNCHANGED (outputs should be identical)' : `changed (current ${current.content.hash})`}.`,
    `Config (from the baseline): ${current.config.seeds} seeds per fight, base seed ${current.config.baseSeed}, skills ${current.config.skills.join(', ')}.`,
    `Rules: a metric is "moved" when |z| >= ${Z_MOVED} and it changed by at least its tolerance (win ${TOLERANCE.win * 100} pts, HP lost ${TOLERANCE.hpLost}, turns ${TOLERANCE.turns}); "possible" when it changed that much but is not statistically clear (add seeds). Balance movement is information for a human, not a failure.`,
    '',
    `Summary: ${c.deltas.filter((d) => d.change === 'moved').length} moved, ${c.deltas.filter((d) => d.change === 'possible').length} possible, ${c.tiny} clear but below tolerance, ${c.unchanged} unchanged, ${c.added.length} new keys, ${c.removed.length} removed keys.`,
    '',
  ];
  for (const change of ['moved', 'possible'] as Change[]) {
    const ds = c.deltas.filter((d) => d.change === change);
    lines.push(heading(3, change === 'moved' ? 'Moved' : 'Possible (not statistically clear)'));
    lines.push(
      ds.length === 0
        ? '_None._'
        : table(
            ['metric key', 'before', 'after', 'change [95% CI]', 'z', 'size vs tolerance'],
            ds.map((d) => [
              d.key,
              show(d.metric, d.before.mean),
              show(d.metric, d.after.mean),
              d.metric === 'win'
                ? `${signed(d.diff * 100)} pts [${signed(d.lo * 100)}, ${signed(d.hi * 100)}]`
                : `${signed(d.diff, 2)} [${signed(d.lo, 2)}, ${signed(d.hi, 2)}]`,
              Number.isFinite(d.z) ? fix(d.z, 1) : 'inf',
              `${fix(d.size, 1)}x`,
            ])
          )
    );
    lines.push('');
  }
  const addedE = groupKeys(c.added);
  const removedE = groupKeys(c.removed);
  lines.push(heading(3, 'New and removed'), addedE.length ? `New (no baseline to compare; regenerate the baseline once you accept them): ${addedE.slice(0, 40).join(', ')}${addedE.length > 40 ? `, ... (${addedE.length} total)` : ''}` : 'New: none.', removedE.length ? `Removed: ${removedE.slice(0, 40).join(', ')}${removedE.length > 40 ? `, ... (${removedE.length} total)` : ''}` : 'Removed: none.', '');
  return lines.join('\n');
}
