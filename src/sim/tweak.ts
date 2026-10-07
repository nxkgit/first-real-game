import { getCard } from '../data/cards';
import type { CardDefinition } from '../game/types';
import { Evaluator, METRICS, METRIC_IDS } from './engine';
import type { EvalConfig, MetricId } from './engine';
import { contextDeck } from './experiments';
import { VERDICT_TEXT, heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import type { SkillLevel } from './skills';
import { withAdded } from './suites';
import { fmtDiff, pairedDiff, verdict } from './stats';
import type { Interval } from './stats';

/**
 * What-if: change a card's numbers IN MEMORY (the registry objects are restored afterwards; nothing
 * on disk changes) and measure what the change does, paired on the same seeds. This is how a
 * proposed tweak gets its evidence before anyone edits src/data.
 *
 *   --card blood-strike --set effects.0.value=2        (the path walks the card definition)
 *
 * Reported per skill and metric: the card's effect (deck with it minus deck without) BEFORE the
 * tweak, AFTER it, and the change in that effect caused by the tweak (a paired difference of
 * differences), plus the direct change in the outcomes of the deck holding the card.
 */

export interface Assignment {
  path: string[];
  value: number | boolean | string | object;
  text: string;
}

/** Splits on commas that are not inside braces or brackets (values may be JSON). */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseAssignments(text: string): Assignment[] {
  return splitTopLevel(text).map((part) => {
    const eq = part.indexOf('=');
    if (eq < 1) throw new Error(`bad --set "${part}" (use path=value, e.g. effects.0.value=2)`);
    const raw = part.slice(eq + 1).trim();
    const json = raw.startsWith('{') || raw.startsWith('[');
    const value = json ? (JSON.parse(raw) as object) : raw === 'true' ? true : raw === 'false' ? false : raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
    return { path: part.slice(0, eq).trim().split('.'), value, text: part.trim() };
  });
}

type Json = { [key: string]: Json } | Json[] | number | boolean | string | undefined;

/** Sets each assignment on `card` and returns a function that puts every old value back. */
export function applyAssignments(card: CardDefinition, assignments: Assignment[]): () => void {
  const undo: (() => void)[] = [];
  try {
    for (const a of assignments) {
      let node = card as unknown as Json;
      for (const key of a.path.slice(0, -1)) {
        node = (node as { [key: string]: Json })[key];
        if (node === undefined || typeof node !== 'object') throw new Error(`"${a.text}": no "${key}" on ${card.id}`);
      }
      const last = a.path[a.path.length - 1];
      const holder = node as { [key: string]: Json };
      const appending = Array.isArray(holder) && Number(last) === holder.length;
      if (!(last in holder) && !appending && typeof a.value !== 'boolean') throw new Error(`"${a.text}": ${card.id} has no "${last}" to change (check the path)`);
      const had = last in holder;
      const old = holder[last];
      holder[last] = a.value as Json;
      undo.push(() => {
        if (had) holder[last] = old;
        else if (appending) (holder as unknown as Json[]).length = Number(last);
        else delete holder[last];
      });
    }
  } catch (err) {
    for (const u of undo.reverse()) u();
    throw err;
  }
  return () => {
    for (const u of undo.reverse()) u();
  };
}

export interface TweakOptions {
  card: string;
  sets: Assignment[];
  context: string;
  skills: SkillLevel[];
  config: EvalConfig;
  headline: MetricId;
  pool?: 'reward' | 'all';
}

const ci = (i: Interval): { mean: number; lo: number; hi: number } => ({ mean: r6(i.mean), lo: r6(i.lo), hi: r6(i.hi) });

export function tweakExperiment(opts: TweakOptions): ExperimentResult {
  const card = getCard(opts.card);
  const deck = contextDeck(opts.context, opts.pool ?? 'reward');
  const units = opts.config.fights.length * opts.config.seeds;
  const rows: (string | number)[][] = [];
  const json: object[] = [];

  for (const skill of opts.skills) {
    // BEFORE
    const evBefore = new Evaluator(opts.config);
    const base1 = evBefore.evaluate(deck, skill);
    const with1 = evBefore.evaluate(withAdded(deck, card), skill);
    // AFTER (card changed in memory, restored in `finally`)
    const restore = applyAssignments(card, opts.sets);
    let base2;
    let with2;
    try {
      const evAfter = new Evaluator(opts.config);
      base2 = evAfter.evaluate(deck, skill);
      with2 = evAfter.evaluate(withAdded(deck, card), skill);
    } finally {
      restore();
    }
    for (const m of METRIC_IDS) {
      const eff = (w: Float64Array, b: Float64Array): Float64Array => w.map((x, i) => x - b[i]);
      const before = eff(with1[m], base1[m]);
      const after = eff(with2[m], base2[m]);
      const change = pairedDiff(before, after);
      const scale = m === 'win' ? 100 : 1;
      const unit = m === 'win' ? ' pts' : '';
      const fmt = (i: Interval): string => fmtDiff({ mean: i.mean * scale, lo: i.lo * scale, hi: i.hi * scale }, m === 'turns' ? 2 : 1) + unit;
      const eb = pairedDiff(new Float64Array(before.length), before);
      const ea = pairedDiff(new Float64Array(after.length), after);
      const v = verdict(change, METRICS[m].margin, METRICS[m].higherIsBetter);
      rows.push([skill, METRICS[m].label, fmt(eb), fmt(ea), fmt(change), VERDICT_TEXT[v]]);
      json.push({ skill, metric: m, effectBefore: ci(eb), effectAfter: ci(ea), change: ci(change), verdict: v });
    }
  }
  const markdown = [
    heading(2, `What-if: ${opts.card} with ${opts.sets.map((s) => s.text).join(', ')}`),
    '',
    `In memory only (nothing in src/data changed). Context: the ${opts.context} deck; ${opts.config.fights.length} fights x ${opts.config.seeds} seeds = ${units} paired units (base seed ${opts.config.baseSeed}). "Effect" = deck WITH the card minus the same deck WITHOUT it, on identical seeds; "change" = effect after the tweak minus effect before (paired). Negative HP lost / turns is good for the player; the verdict is on the change, in the player's favour (better) or against it (worse). Brackets are 95% CIs.`,
    '',
    table(['skill', 'metric', 'effect before', 'effect after', 'change from the tweak', 'verdict'], rows),
    '',
  ].join('\n');
  return { name: 'tweak', json: { card: opts.card, set: opts.sets.map((s) => s.text), context: opts.context, setup: { ...opts.config, fights: opts.config.fights.map((f) => f.id), units }, rows: json }, markdown };
}
