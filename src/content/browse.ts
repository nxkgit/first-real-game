import { cardText, describeEffect, describeTrigger } from '../game/describe';
import type { CardDefinition, Effect } from '../game/types';
import { SCALE_SOURCES } from './vocabulary';

// Pure logic behind the content browser (no DOM): turning content into rows, searching, filtering,
// sorting, and reading the balance tool's output. contentPage.ts only draws what this returns.

// ---------- generic tables: search and sort ----------

/** Every whitespace-separated term must appear (case-insensitive) in some cell of the row. */
export function matchesQuery(row: readonly string[], query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = row.join('\n').toLowerCase();
  return terms.every((t) => haystack.includes(t));
}

const toNumber = (cell: string): number | undefined => {
  const t = cell.trim();
  if (t === '' || !/^[+-]?\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
};

/**
 * Sorts rows by one column. A column is numeric when every non-empty cell is a number; otherwise
 * it sorts as text (case-insensitive). Empty cells always go last. Stable; does not change `rows`.
 */
export function sortRows(rows: readonly string[][], column: number, direction: 'asc' | 'desc' = 'asc'): string[][] {
  const cells = rows.map((r) => r[column] ?? '');
  const numeric = cells.every((c) => c.trim() === '' || toNumber(c) !== undefined);
  const sign = direction === 'asc' ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      const ca = a.row[column] ?? '';
      const cb = b.row[column] ?? '';
      const ea = ca.trim() === '';
      const eb = cb.trim() === '';
      if (ea || eb) return ea === eb ? a.i - b.i : ea ? 1 : -1;
      const cmp = numeric ? (toNumber(ca) as number) - (toNumber(cb) as number) : ca.toLowerCase().localeCompare(cb.toLowerCase());
      return cmp !== 0 ? sign * cmp : a.i - b.i;
    })
    .map((x) => x.row);
}

// ---------- cards ----------

/** One card as the browser shows it. Built from the registry; nothing here is stored. */
export interface CardRecord {
  id: string;
  name: string;
  type: string;
  cost: number;
  owner: string;
  inRewardPool: boolean;
  tags: string[];
  exhaust: boolean;
  text: string;
  /** Text of the upgraded card, or undefined if it cannot be upgraded. */
  upText?: string;
  upCost?: number;
  /** One short phrase per scaling effect, e.g. "damage +3 per card played earlier this turn". */
  scaling: string[];
  triggers: string[];
}

const effectsOfCard = (card: CardDefinition): Effect[] => [
  ...(card.effects ?? []),
  ...(card.onTurnStartEffect ? [card.onTurnStartEffect] : []),
  ...(card.triggers ?? []).flatMap((t) => t.effects),
];

/** Short scaling phrases for a card. */
export function scalingPhrases(card: CardDefinition): string[] {
  const out: string[] = [];
  for (const e of effectsOfCard(card)) {
    if ('scaling' in e && e.scaling) {
      const src = SCALE_SOURCES[e.scaling.per] ?? e.scaling.per;
      out.push(`${e.kind} +${e.scaling.value} per ${e.scaling.per}${e.scaling.tag ? ` "${e.scaling.tag}"` : ''} (${src.replace(/\.$/, '').toLowerCase()})`);
    }
  }
  return out;
}

export function cardRecord(card: CardDefinition, upgraded: CardDefinition | undefined): CardRecord {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    owner: card.owner,
    inRewardPool: card.inRewardPool,
    tags: card.tags ?? [],
    exhaust: card.exhaust === true,
    text: cardText(card),
    upText: upgraded ? cardText(upgraded) : undefined,
    upCost: upgraded?.cost,
    scaling: scalingPhrases(card),
    triggers: (card.triggers ?? []).map(describeTrigger),
  };
}

export interface CardFilters {
  query: string;
  type: string;
  /** A cost as text ("0", "1", ...), or '' for any. */
  cost: string;
  owner: string;
  tag: string;
  pool: 'any' | 'yes' | 'no';
}

export const NO_FILTERS: CardFilters = { query: '', type: '', cost: '', owner: '', tag: '', pool: 'any' };

export function filterCards(records: readonly CardRecord[], f: CardFilters): CardRecord[] {
  return records.filter(
    (c) =>
      (f.type === '' || c.type === f.type) &&
      (f.cost === '' || String(c.cost) === f.cost) &&
      (f.owner === '' || c.owner === f.owner) &&
      (f.tag === '' || c.tags.includes(f.tag)) &&
      (f.pool === 'any' || (f.pool === 'yes') === c.inRewardPool) &&
      matchesQuery([c.name, c.id, c.text, c.upText ?? '', c.type, c.tags.join(' '), c.triggers.join(' '), c.scaling.join(' ')], f.query)
  );
}

/** The distinct values of a field, for the filter dropdowns. */
export function distinct(values: readonly string[]): string[] {
  return [...new Set(values.filter((v) => v !== ''))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export const CARD_HEADERS = ['Name', 'Type', 'Cost', 'Text', 'Upgraded text', 'Upgraded cost', 'Owner', 'Reward pool', 'Tags', 'Exhaust', 'Scaling', 'Triggers'];

export function cardRow(c: CardRecord): string[] {
  return [
    c.name,
    c.type,
    String(c.cost),
    c.text,
    c.upText ?? '(none)',
    c.upCost === undefined ? '' : String(c.upCost),
    c.owner,
    c.inRewardPool ? 'yes' : 'no',
    c.tags.join(', '),
    c.exhaust ? 'yes' : '',
    c.scaling.join(' | '),
    c.triggers.join(' | '),
  ];
}

/** Before/after lines for the side-by-side view: one entry per line that differs or is shared. */
export function upgradeComparison(c: CardRecord): { label: string; before: string; after: string; changed: boolean }[] {
  const after = c.upText;
  return [
    { label: 'Cost', before: String(c.cost), after: c.upCost === undefined ? '(cannot upgrade)' : String(c.upCost), changed: c.upCost !== undefined && c.upCost !== c.cost },
    { label: 'Text', before: c.text, after: after ?? '(cannot upgrade)', changed: after !== undefined && after !== c.text },
  ];
}

/** A one-effect summary, for tooltips and the enemy tables. */
export const effectsText = (effects: readonly Effect[]): string => effects.map((e) => describeEffect(e)).join(' ');

// ---------- simulation stats (balance/reports and balance/baselines) ----------

export interface Interval {
  mean: number;
  lo: number;
  hi: number;
}

export interface CardSimEntry {
  skill: string;
  mode: 'add' | 'replace';
  win?: Interval;
  hpLost?: Interval;
  turns?: Interval;
  /** The tool's own verdict word (better, worse, negligible, inconclusive), when the source has one. */
  verdict?: string;
}

export interface PairSimEntry {
  partner: string;
  skill: string;
  win?: Interval;
  hpLost?: Interval;
  turns?: Interval;
  verdict: string;
}

export interface CardSim {
  source: 'report' | 'baseline';
  entries: CardSimEntry[];
  partners: PairSimEntry[];
}

export interface SimStats {
  /** Where each source came from, for the footnote. */
  notes: string[];
  byCard: Map<string, CardSim>;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const interval = (v: unknown): Interval | undefined => (isObj(v) && isNum(v.mean) && isNum(v.lo) && isNum(v.hi) ? { mean: v.mean, lo: v.lo, hi: v.hi } : undefined);

const Z95 = 1.959964;

/**
 * Reads whatever it can from a balance report (`npm run balance:report`) and a baseline
 * (`npm run balance:baseline`), both parsed JSON (or anything: unknown shapes are skipped). The
 * report is preferred; a card missing from it falls back to the baseline's `card-add` metrics, for
 * which a 95% interval is rebuilt from mean, sd and n (the baseline has no verdicts).
 */
export function parseSimStats(report: unknown, baseline: unknown): SimStats {
  const byCard = new Map<string, CardSim>();
  const notes: string[] = [];
  const get = (id: string, source: CardSim['source']): CardSim => {
    let c = byCard.get(id);
    if (!c) byCard.set(id, (c = { source, entries: [], partners: [] }));
    return c;
  };

  if (isObj(report)) {
    const cards = report.cards;
    if (isObj(cards) && Array.isArray(cards.rows)) {
      for (const row of cards.rows) {
        if (!isObj(row) || typeof row.card !== 'string' || typeof row.skill !== 'string') continue;
        const delta = isObj(row.delta) ? row.delta : {};
        get(row.card, 'report').entries.push({
          skill: row.skill,
          mode: row.mode === 'replace' ? 'replace' : 'add',
          win: interval(delta.win),
          hpLost: interval(delta.hpLost),
          turns: interval(delta.turns),
          verdict: typeof row.verdict === 'string' ? row.verdict : undefined,
        });
      }
      const setup = isObj(cards.setup) ? cards.setup : {};
      notes.push(`balance report${typeof report.generated === 'string' ? ` of ${report.generated}` : ''}: card effect added to the ${String(cards.context ?? 'starter')} deck, ${String(setup.seeds ?? '?')} seeds per fight`);
    }
    const pairs = report.pairs;
    if (isObj(pairs) && Array.isArray(pairs.rows)) {
      const skill = typeof pairs.skill === 'string' ? pairs.skill : '?';
      for (const row of pairs.rows) {
        if (!isObj(row) || typeof row.a !== 'string' || typeof row.b !== 'string') continue;
        const syn = isObj(row.synergy) ? row.synergy : {};
        const verdict = typeof row.verdict === 'string' ? row.verdict : 'inconclusive';
        for (const [id, partner] of [
          [row.a, row.b],
          [row.b, row.a],
        ] as [string, string][]) {
          get(id, 'report').partners.push({ partner, skill, win: interval(syn.win), hpLost: interval(syn.hpLost), turns: interval(syn.turns), verdict });
        }
      }
      notes.push(`pair synergy: ${skill} bot, ${String(pairs.evaluated ?? '?')} of ${String(pairs.totalPairs ?? '?')} pairs${pairs.sampled === true ? ' (a sample)' : ''}`);
    }
  }

  if (isObj(baseline) && isObj(baseline.metrics)) {
    const grouped = new Map<string, Map<string, Interval>>(); // "skill/card" -> metric -> interval
    for (const [key, value] of Object.entries(baseline.metrics)) {
      const parts = key.split('/');
      if (parts.length !== 4 || parts[0] !== 'card-add' || !isObj(value) || !isNum(value.mean) || !isNum(value.sd) || !isNum(value.n) || value.n < 2) continue;
      const half = (Z95 * value.sd) / Math.sqrt(value.n);
      const m = grouped.get(`${parts[1]}/${parts[2]}`) ?? new Map<string, Interval>();
      m.set(parts[3], { mean: value.mean, lo: value.mean - half, hi: value.mean + half });
      grouped.set(`${parts[1]}/${parts[2]}`, m);
    }
    let used = 0;
    for (const [k, m] of grouped) {
      const [skill, card] = k.split('/');
      if (byCard.get(card)?.entries.length) continue; // the report wins
      get(card, 'baseline').entries.push({ skill, mode: 'add', win: m.get('win'), hpLost: m.get('hpLost'), turns: m.get('turns') });
      used++;
    }
    if (used > 0) notes.push(`baseline (${String(baseline.generated ?? '')}): normal-approximation intervals, no verdicts`);
  }
  return { notes, byCard };
}

const sign = (n: number): string => (n > 0 ? '+' : n < 0 ? '-' : '');
const fmt = (n: number, digits: number): string => `${sign(n)}${Math.abs(n).toFixed(digits)}`;

/** "+2.5 pts [+0.5, +4.5]" for a win rate (a fraction), or "-1.2 [-1.9, -0.5]" for HP / turns. */
export function formatInterval(i: Interval | undefined, metric: 'win' | 'hpLost' | 'turns'): string {
  if (!i) return '';
  if (metric === 'win') return `${fmt(i.mean * 100, 1)} pts [${fmt(i.lo * 100, 1)}, ${fmt(i.hi * 100, 1)}]`;
  const d = metric === 'hpLost' ? 1 : 2;
  return `${fmt(i.mean, d)} [${fmt(i.lo, d)}, ${fmt(i.hi, d)}]`;
}

/** Whether a 95% interval excludes zero (the quickest "is this real?" check for a baseline row). */
export const excludesZero = (i: Interval | undefined): boolean => i !== undefined && (i.lo > 0 || i.hi < 0);

/** The strongest partners first (by headline benefit, only those the tool called better/worse), at most `n`. */
export function topPartners(sim: CardSim | undefined, n: number, kind: 'better' | 'worse' = 'better'): PairSimEntry[] {
  if (!sim) return [];
  const score = (p: PairSimEntry): number => p.hpLost?.mean ?? 0;
  return sim.partners
    .filter((p) => p.verdict === kind)
    .sort((a, b) => (kind === 'better' ? score(b) - score(a) : score(a) - score(b)))
    .slice(0, n);
}
