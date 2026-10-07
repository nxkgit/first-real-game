import type { CardDefinition } from '../game/types';
import { Evaluator, METRICS, METRIC_IDS } from './engine';
import type { MetricId } from './engine';
import { VERDICT_TEXT, heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import type { SkillLevel } from './skills';
import { fmtDiff, pairedDiff, verdict } from './stats';
import type { Interval } from './stats';
import type { DeckSet } from './suites';

/**
 * Ablation inside a built deck: for each distinct card, the deck minus ONE copy of it against the
 * full deck, paired on the same seeds. This is the "what does this card do for the deck it was
 * built for" measurement (`cards` measures a card added to a generic deck, where partners are missing).
 * The change is reported as the card's contribution: how much WORSE the deck gets without it
 * (positive HP lost / turns in the table means the card was helping).
 */

export interface AblateRow {
  set: string;
  skill: SkillLevel;
  card: string;
  copies: number;
  /** deck without the card minus deck with it, per metric. */
  withoutMinusWith: Record<MetricId, { mean: number; lo: number; hi: number }>;
  /** Verdict on the card: 'better' = the deck is measurably worse without it (the card helps). */
  verdict: 'better' | 'worse' | 'negligible' | 'inconclusive';
}

const ci = (i: Interval): { mean: number; lo: number; hi: number } => ({ mean: r6(i.mean), lo: r6(i.lo), hi: r6(i.hi) });

function without(deck: CardDefinition[], id: string): CardDefinition[] {
  const i = deck.findIndex((c) => c.id === id);
  return [...deck.slice(0, i), ...deck.slice(i + 1)];
}

const concat = (parts: Float64Array[]): Float64Array => {
  const out = new Float64Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

export function ablateExperiment(ev: Evaluator, opts: { sets: DeckSet[]; skills: SkillLevel[]; headline?: MetricId }): ExperimentResult & { rows: AblateRow[] } {
  const headline = opts.headline ?? 'hpLost';
  const rows: AblateRow[] = [];
  const sections: string[] = [
    heading(2, 'Ablation inside built decks'),
    '',
    `For each card of a deck: the deck minus one copy of the card, against the full deck, on identical seeds (paired). The table shows WITHOUT minus WITH: a positive HP lost / turns means the deck gets worse without the card, i.e. the card helps. Win rate is "without minus with" in points (negative = the deck wins less without it). Verdict is on ${METRICS[headline].label}: "helps" = measurably worse without it, "hurts" = measurably better without it (the card is below adding nothing in its own deck), negligible = within +-${METRICS[headline].margin}. Decks with several samples are pooled. Brackets are 95% CIs. ${ev.config.fights.length} fights x ${ev.config.seeds} seeds per deck.`,
    '',
  ];
  for (const set of opts.sets) {
    for (const skill of opts.skills) {
      const ids = [...new Set(set.decks[0].map((c) => c.id))];
      const mine: AblateRow[] = [];
      for (const id of ids) {
        const withParts = set.decks.map((d) => ev.evaluate(d, skill));
        const withoutParts = set.decks.map((d) => ev.evaluate(without(d, id), skill));
        const delta = {} as AblateRow['withoutMinusWith'];
        let h: Interval | undefined;
        for (const m of METRIC_IDS) {
          const d = pairedDiff(concat(withParts.map((p) => p[m])), concat(withoutParts.map((p) => p[m])));
          delta[m] = ci(d);
          if (m === headline) h = d;
        }
        const v = verdict(h as Interval, METRICS[headline].margin, !METRICS[headline].higherIsBetter);
        mine.push({ set: set.name, skill, card: id, copies: set.decks[0].filter((c) => c.id === id).length, withoutMinusWith: delta, verdict: v });
      }
      mine.sort((a, b) => b.withoutMinusWith[headline].mean - a.withoutMinusWith[headline].mean);
      rows.push(...mine);
      sections.push(
        heading(3, `${set.name}, ${skill} bot`),
        table(
          ['card', 'copies', 'HP lost (without - with)', 'turns (without - with)', 'win rate (without - with)', 'verdict'],
          mine.map((r) => [
            r.card,
            r.copies,
            fmtDiff(r.withoutMinusWith.hpLost),
            fmtDiff(r.withoutMinusWith.turns, 2),
            fmtDiff({ mean: r.withoutMinusWith.win.mean * 100, lo: r.withoutMinusWith.win.lo * 100, hi: r.withoutMinusWith.win.hi * 100 }) + ' pts',
            // verdict(...) with positiveIsGood=false reads "positive HP lost without the card" as the card being better
            r.verdict === 'better' ? 'helps' : r.verdict === 'worse' ? 'HURTS' : VERDICT_TEXT[r.verdict],
          ])
        ),
        ''
      );
    }
  }
  return { name: 'ablate', json: { headline, setup: { ...ev.config, fights: ev.config.fights.map((f) => f.id) }, rows }, markdown: sections.join('\n'), rows };
}
