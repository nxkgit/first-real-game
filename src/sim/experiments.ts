import { baseCards, upgradedVersion } from '../data/cards';
import { Rng } from '../game/rng';
import type { CardDefinition } from '../game/types';
import { Evaluator, METRICS, METRIC_IDS } from './engine';
import type { MetricId, Samples } from './engine';
import { VERDICT_TEXT, bar, heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import type { SkillLevel } from './skills';
import { TIERS, referenceDeckSets, starterIds, withAdded, withReplaced } from './suites';
import type { DeckSet, Tier } from './suites';
import { TARGET_DECK_SET, bandMark, bandStatus, hpLostBand, turnsBand, winBand } from './targets';
import type { BandStatus } from './targets';
import { fix, fmtCI, fmtDiff, flagOutliers, histogram, mean, meanCI, median, pairedDiff, pct, quantile, verdict, wilson } from './stats';
import type { Interval, Proportion, Verdict } from './stats';

/**
 * The experiments. Each takes a shared Evaluator (so identical decks are simulated once and every
 * comparison is paired on the same seeds) and returns Markdown plus JSON.
 */

export const OUTLIER_METHOD =
  'Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score ' +
  '(0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences ' +
  '(Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. ' +
  'A flag means "look at this", not "this is wrong".';

const ciRow = (ci: Interval): { mean: number; lo: number; hi: number } => ({ mean: r6(ci.mean), lo: r6(ci.lo), hi: r6(ci.hi) });
const concat = (parts: Float64Array[]): Float64Array => {
  const out = new Float64Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const benefitSign = (m: MetricId): number => (METRICS[m].higherIsBetter ? 1 : -1);

function contextDeck(name: string, pool: 'reward' | 'all'): CardDefinition[] {
  const set = referenceDeckSets({ pool }).find((s) => s.name === name);
  if (!set) throw new Error(`unknown deck context "${name}" (starter, mid, late)`);
  return set.decks[0];
}

function describeSetup(ev: Evaluator): string {
  const c = ev.config;
  return `${c.fights.length} fights x ${c.seeds} seeds = ${ev.units} paired units per deck (base seed ${c.baseSeed}). Fights: ${c.fights.map((f) => f.id).join(', ')}.`;
}

// =====================================================================================
// (i) card ablation / addition
// =====================================================================================

export interface CardsOptions {
  skills: SkillLevel[];
  /** Deck the card is added to / swapped into: starter, mid or late (first sampled deck). */
  context?: string;
  modes?: ('add' | 'replace')[];
  includeUpgrades?: boolean;
  headline?: MetricId;
  pool?: 'reward' | 'all';
}

export interface CardRow {
  skill: SkillLevel;
  mode: 'add' | 'replace';
  card: string;
  type: string;
  cost: number;
  owner: string;
  inRewardPool: boolean;
  /** Deck-with-card minus deck-without, paired, per metric. */
  delta: Record<MetricId, { mean: number; lo: number; hi: number }>;
  verdict: Verdict;
}

export function cardCandidates(includeUpgrades: boolean): CardDefinition[] {
  const base = baseCards();
  return includeUpgrades ? [...base, ...base.flatMap((c) => upgradedVersion(c) ?? [])] : [...base];
}

export function cardsExperiment(ev: Evaluator, opts: CardsOptions): ExperimentResult & { rows: CardRow[] } {
  const context = opts.context ?? 'starter';
  const modes = opts.modes ?? ['add', 'replace'];
  const headline = opts.headline ?? 'hpLost';
  const deck = contextDeck(context, opts.pool ?? 'reward');
  const cards = cardCandidates(opts.includeUpgrades ?? false);
  const rows: CardRow[] = [];
  const sections: string[] = [];

  for (const skill of opts.skills) {
    const base = ev.evaluate(deck, skill);
    for (const mode of modes) {
      const mine: CardRow[] = [];
      for (const card of cards) {
        const variant = ev.evaluate(mode === 'add' ? withAdded(deck, card) : withReplaced(deck, card), skill);
        const delta = {} as CardRow['delta'];
        for (const m of METRIC_IDS) delta[m] = ciRow(pairedDiff(base[m], variant[m]));
        const h = pairedDiff(base[headline], variant[headline]);
        mine.push({
          skill,
          mode,
          card: card.id,
          type: card.type,
          cost: card.cost,
          owner: card.owner,
          inRewardPool: card.inRewardPool,
          delta,
          verdict: verdict(h, METRICS[headline].margin, METRICS[headline].higherIsBetter),
        });
      }
      rows.push(...mine);
      const sorted = [...mine].sort((a, b) => benefitSign(headline) * (b.delta[headline].mean - a.delta[headline].mean));
      sections.push(
        heading(3, `${skill} bot, card ${mode === 'add' ? 'added to' : 'replacing the most common card of'} the ${context} deck`),
        table(
          ['card', 'type', 'cost', 'pool', 'win rate change', 'HP lost change', 'turns change', `verdict (${METRICS[headline].label})`],
          sorted.map((r) => [
            r.card,
            r.type,
            r.cost,
            r.inRewardPool ? 'yes' : 'no',
            fmtDiff({ mean: r.delta.win.mean * 100, lo: r.delta.win.lo * 100, hi: r.delta.win.hi * 100 }) + ' pts',
            fmtDiff(r.delta.hpLost),
            fmtDiff(r.delta.turns, 2),
            VERDICT_TEXT[r.verdict],
          ])
        ),
        ''
      );
    }
  }

  const markdown = [
    heading(2, 'Card effect: ablation and addition'),
    '',
    `Each row compares the ${context} deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. ${describeSetup(ev)}`,
    `Verdict reads the headline metric (${METRICS[headline].label}, negligible if within +-${METRICS[headline].margin}): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.`,
    'A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.',
    '',
    ...sections,
  ].join('\n');
  return { name: 'cards', json: { context, headline, setup: setupJson(ev), rows }, markdown, rows };
}

const setupJson = (ev: Evaluator): object => ({ ...ev.config, fights: ev.config.fights.map((f) => f.id), units: ev.units });

// =====================================================================================
// (ii) pair synergy
// =====================================================================================

export interface PairsOptions {
  skill: SkillLevel;
  context?: string;
  headline?: MetricId;
  /** Evaluate at most this many pairs (a deterministic sample when the registry is larger). */
  maxPairs?: number;
  includeStarter?: boolean;
  pool?: 'reward' | 'all';
  top?: number;
  /** Evaluate only these pairs, written "a+b" (to confirm a lead with more seeds). */
  only?: string[];
}

export interface PairRow {
  a: string;
  b: string;
  /** Benefit of the pair together minus the sum of each alone (positive = they help each other), per metric. */
  synergy: Record<MetricId, { mean: number; lo: number; hi: number }>;
  verdict: Verdict;
}

export function pairsExperiment(ev: Evaluator, opts: PairsOptions): ExperimentResult & { rows: PairRow[]; totalPairs: number } {
  const context = opts.context ?? 'starter';
  const headline = opts.headline ?? 'hpLost';
  const deck = contextDeck(context, opts.pool ?? 'reward');
  const starter = starterIds();
  const cards = baseCards().filter((c) => opts.includeStarter || !starter.has(c.id));
  const all: [CardDefinition, CardDefinition][] = [];
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) all.push([cards[i], cards[j]]);
  let chosen = all;
  if (opts.only) {
    const wanted = new Set(opts.only.map((p) => p.split('+').sort().join('+')));
    const everything = baseCards();
    chosen = [...wanted].map((p) => {
      const [a, b] = p.split('+').map((id) => everything.find((c) => c.id === id));
      if (!a || !b) throw new Error(`unknown card in pair "${p}"`);
      return [a, b] as [CardDefinition, CardDefinition];
    });
  }
  const maxPairs = opts.maxPairs ?? 150;
  const sampled = !opts.only && all.length > maxPairs;
  if (sampled) {
    const rng = new Rng(ev.config.baseSeed + 77);
    const copy = [...all];
    for (let i = 0; i < maxPairs; i++) {
      const j = i + Math.floor(rng.next() * (copy.length - i));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    chosen = copy.slice(0, maxPairs);
  }

  const base = ev.evaluate(deck, opts.skill);
  const benefit = (s: Samples, m: MetricId): Float64Array => {
    const out = new Float64Array(s[m].length);
    for (let u = 0; u < out.length; u++) out[u] = benefitSign(m) * (s[m][u] - base[m][u]);
    return out;
  };
  const single = new Map<string, Samples>();
  const singleOf = (c: CardDefinition): Samples => {
    let s = single.get(c.id);
    if (!s) single.set(c.id, (s = ev.evaluate(withAdded(deck, c), opts.skill)));
    return s;
  };

  const rows: PairRow[] = chosen.map(([a, b]) => {
    const both = ev.evaluate(withAdded(withAdded(deck, a), b), opts.skill);
    const synergy = {} as PairRow['synergy'];
    let headCI: Interval | undefined;
    for (const m of METRIC_IDS) {
      const ab = benefit(both, m);
      const sa = benefit(singleOf(a), m);
      const sb = benefit(singleOf(b), m);
      const d = new Float64Array(ab.length);
      for (let u = 0; u < d.length; u++) d[u] = ab[u] - sa[u] - sb[u];
      const ci = meanCI(d);
      synergy[m] = ciRow(ci);
      if (m === headline) headCI = ci;
    }
    return { a: a.id, b: b.id, synergy, verdict: verdict(headCI as Interval, METRICS[headline].margin, true) };
  });

  const byScore = [...rows].sort((x, y) => y.synergy[headline].mean - x.synergy[headline].mean);
  const top = opts.top ?? 10;
  const strong = byScore.filter((r) => r.synergy[headline].lo > 0).slice(0, top);
  const negative = byScore.filter((r) => r.synergy[headline].hi < 0).slice(-top).reverse();
  const unit = METRICS[headline].id === 'win' ? 'win-rate points' : METRICS[headline].label;
  const scale = METRICS[headline].id === 'win' ? 100 : 1;
  const fmtRow = (r: PairRow): (string | number)[] => [
    `${r.a} + ${r.b}`,
    fmtDiff({ mean: r.synergy[headline].mean * scale, lo: r.synergy[headline].lo * scale, hi: r.synergy[headline].hi * scale }, METRICS[headline].id === 'win' ? 1 : 2),
    VERDICT_TEXT[r.verdict],
  ];
  const counts = { better: 0, worse: 0, negligible: 0, inconclusive: 0 };
  for (const r of rows) counts[r.verdict]++;
  const markdown = [
    heading(2, 'Pair synergy'),
    '',
    `Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the ${context} deck on identical seeds, in ${unit}${METRICS[headline].higherIsBetter ? '' : ' (benefit = HP/turns saved, so positive is good)'}. Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: ${opts.skill}. ${describeSetup(ev)}`,
    `${rows.length} of ${all.length} possible pairs evaluated${sampled ? ` (a deterministic random sample, --max-pairs ${maxPairs}); a strong pair outside the sample is not seen` : ''}. Candidate cards: ${cards.map((c) => c.id).join(', ')}.`,
    `Of ${rows.length} pairs: ${counts.better} clearly synergistic, ${counts.worse} clearly anti-synergistic, ${counts.negligible} negligible, ${counts.inconclusive} inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).`,
    '',
    heading(3, 'Strongest synergies'),
    strong.length ? table(['pair', 'synergy score', 'verdict'], strong.map(fmtRow)) : '_None clearly above zero._',
    '',
    heading(3, 'Negative (anti-synergistic) pairs'),
    negative.length ? table(['pair', 'synergy score', 'verdict'], negative.map(fmtRow)) : '_None clearly below zero._',
    '',
  ].join('\n');
  return {
    name: 'pairs',
    json: { skill: opts.skill, context, headline, setup: setupJson(ev), totalPairs: all.length, evaluated: rows.length, sampled, rows: byScore },
    markdown,
    rows: byScore,
    totalPairs: all.length,
  };
}

// =====================================================================================
// (iii) difficulty ladder and (iv) fight length
// =====================================================================================

export interface LadderRow {
  skill: SkillLevel;
  set: string;
  fight: string;
  tier: Tier;
  /** Units behind each number (decks in the set x seeds). */
  n: number;
  win: Proportion;
  hpLost: Interval;
  hpLostWhenWon: Interval | undefined;
  turns: Interval;
  turnsMedian: number;
  turnsP10: number;
  turnsP90: number;
  turnHistogram: number[];
  flags: { win: BandStatus; hp: BandStatus | undefined; turns: BandStatus };
}

export const MAX_HISTOGRAM_TURN = 15;

function pooled(ev: Evaluator, set: DeckSet, skill: SkillLevel, fi: number): Samples {
  const parts = set.decks.map((d) => ev.forFight(ev.evaluate(d, skill), fi));
  return { win: concat(parts.map((p) => p.win)), hpLost: concat(parts.map((p) => p.hpLost)), turns: concat(parts.map((p) => p.turns)) };
}

export function ladderRows(ev: Evaluator, skills: SkillLevel[], sets: DeckSet[]): LadderRow[] {
  const rows: LadderRow[] = [];
  for (const skill of skills) {
    for (const set of sets) {
      ev.config.fights.forEach((fight, fi) => {
        const s = pooled(ev, set, skill, fi);
        const wins = s.win.reduce((a, b) => a + b, 0);
        const wonHp = Array.from(s.hpLost).filter((_, i) => s.win[i] === 1);
        const hpWon = wonHp.length >= 2 ? meanCI(wonHp) : undefined;
        const turns = meanCI(s.turns);
        rows.push({
          skill,
          set: set.name,
          fight: fight.id,
          tier: fight.tier,
          n: s.win.length,
          win: wilson(wins, s.win.length),
          hpLost: meanCI(s.hpLost),
          hpLostWhenWon: hpWon,
          turns,
          turnsMedian: median(s.turns),
          turnsP10: quantile(s.turns, 0.1),
          turnsP90: quantile(s.turns, 0.9),
          turnHistogram: histogram(s.turns, 1, MAX_HISTOGRAM_TURN),
          flags: {
            win: bandStatus(wins / s.win.length, winBand(skill, fight.tier)),
            hp: wonHp.length > 0 ? bandStatus(mean(wonHp), hpLostBand(fight.tier)) : undefined,
            turns: bandStatus(turns.mean, turnsBand(fight.tier)),
          },
        });
      });
    }
  }
  return rows;
}

export function ladderExperiment(ev: Evaluator, opts: { skills: SkillLevel[]; sets?: DeckSet[]; pool?: 'reward' | 'all' }): ExperimentResult & { rows: LadderRow[] } {
  const sets = opts.sets ?? referenceDeckSets({ pool: opts.pool });
  const rows = ladderRows(ev, opts.skills, sets);
  const out: string[] = [
    heading(2, 'Fight difficulty ladder'),
    '',
    `Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: ${sets.map((s) => `${s.name} (${s.description}, ${s.decks.length} deck${s.decks.length > 1 ? 's' : ''})`).join('; ')}. ${describeSetup(ev)}`,
    `Flags compare the ${TARGET_DECK_SET} deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.`,
    '',
  ];
  for (const skill of opts.skills) {
    out.push(heading(3, `${skill} bot`));
    const tierRows: (string | number)[][] = [];
    for (const set of sets) {
      for (const tier of TIERS) {
        const rs = rows.filter((r) => r.skill === skill && r.set === set.name && r.tier === tier);
        if (rs.length === 0) continue;
        const w = rs.reduce((n, r) => n + r.win.p * r.n, 0) / rs.reduce((n, r) => n + r.n, 0);
        const hp = rs.filter((r) => r.hpLostWhenWon).map((r) => r.hpLostWhenWon!.mean);
        tierRows.push([set.name, tier, rs.length, pct(w), hp.length ? fix(mean(hp)) : 'n/a', fix(mean(rs.map((r) => r.turns.mean)))]);
      }
    }
    out.push('Tier rollup (unweighted mean of the fights in the tier)', '', table(['deck set', 'tier', 'fights', 'win rate', 'HP lost (won)', 'turns'], tierRows), '');
    out.push(
      table(
        ['fight', 'tier', 'deck set', 'n', 'win rate [95% CI]', 'HP lost when won [95% CI]', 'turns [95% CI]', `vs bands (${TARGET_DECK_SET})`],
        rows
          .filter((r) => r.skill === skill)
          .map((r) => [
            r.fight,
            r.tier,
            r.set,
            r.n,
            `${pct(r.win.p)} [${pct(r.win.lo)}, ${pct(r.win.hi)}]`,
            r.hpLostWhenWon ? fmtCI(r.hpLostWhenWon) : 'n/a',
            fmtCI(r.turns),
            r.set === TARGET_DECK_SET ? `win ${bandMark(r.flags.win)}, HP ${r.flags.hp ? bandMark(r.flags.hp) : 'n/a'}, turns ${bandMark(r.flags.turns)}` : '',
          ])
      ),
      ''
    );
  }
  return { name: 'ladder', json: { setup: setupJson(ev), sets: sets.map((s) => ({ name: s.name, decks: s.decks.map((d) => d.map((c) => c.id)) })), rows: rows.map(rowJson) }, markdown: out.join('\n'), rows };
}

const rowJson = (r: LadderRow): object => ({
  skill: r.skill,
  set: r.set,
  fight: r.fight,
  tier: r.tier,
  n: r.n,
  win: { p: r6(r.win.p), lo: r6(r.win.lo), hi: r6(r.win.hi) },
  hpLost: ciRow(r.hpLost),
  hpLostWhenWon: r.hpLostWhenWon ? ciRow(r.hpLostWhenWon) : null,
  turns: ciRow(r.turns),
  turnsMedian: r.turnsMedian,
  turnsP10: r.turnsP10,
  turnsP90: r.turnsP90,
  turnHistogram: r.turnHistogram,
  flags: r.flags,
});

export function lengthsExperiment(ev: Evaluator, opts: { skills: SkillLevel[]; set?: string; pool?: 'reward' | 'all' }): ExperimentResult & { rows: LadderRow[] } {
  const setName = opts.set ?? TARGET_DECK_SET;
  const sets = referenceDeckSets({ pool: opts.pool }).filter((s) => s.name === setName);
  if (sets.length === 0) throw new Error(`unknown deck set "${setName}"`);
  const rows = ladderRows(ev, opts.skills, sets);
  const out: string[] = [
    heading(2, 'Fight length distribution'),
    '',
    `Turns per fight with the ${setName} deck set (${sets[0].description}). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = ${MAX_HISTOGRAM_TURN}+). ${describeSetup(ev)}`,
    '',
  ];
  for (const skill of opts.skills) {
    out.push(heading(3, `${skill} bot`));
    const rs = rows.filter((r) => r.skill === skill);
    out.push(
      table(
        ['fight', 'tier', 'mean [95% CI]', 'p10', 'median', 'p90', 'target band', 'status'],
        rs.map((r) => [r.fight, r.tier, fmtCI(r.turns, 2), r.turnsP10, r.turnsMedian, r.turnsP90, turnsBand(r.tier).join('-'), bandMark(r.flags.turns)])
      ),
      ''
    );
    for (const r of rs) {
      const max = Math.max(...r.turnHistogram);
      out.push('```', `${r.fight} (${r.tier})`, ...r.turnHistogram.map((c, i) => (c === 0 ? '' : `${String(i + 1).padStart(2)}${i + 1 === MAX_HISTOGRAM_TURN ? '+' : ' '} ${String(c).padStart(4)} ${bar(c, max)}`)).filter(Boolean), '```', '');
    }
  }
  return { name: 'lengths', json: { setup: setupJson(ev), set: setName, rows: rows.map(rowJson) }, markdown: out.join('\n'), rows };
}

// =====================================================================================
// (vi) outliers
// =====================================================================================

export interface OutlierEntry {
  kind: 'card' | 'enemy-fight';
  skill: SkillLevel;
  cohort: string;
  id: string;
  metric: string;
  value: number;
  modifiedZ: number;
  z: number;
  outsideIqr: boolean;
}

export function outlierExperiment(
  opts: { skills: SkillLevel[]; headline?: MetricId; cardRows: CardRow[]; ladder: LadderRow[] }
): ExperimentResult & { entries: OutlierEntry[]; worseThanNothing: CardRow[] } {
  const headline = opts.headline ?? 'hpLost';
  const entries: OutlierEntry[] = [];
  const add = (kind: OutlierEntry['kind'], skill: SkillLevel, cohort: string, metric: string, items: { id: string; value: number }[]): void => {
    if (items.length < 4) return;
    for (const f of flagOutliers(items.map((i) => i.value))) {
      if (f.outlier) entries.push({ kind, skill, cohort, id: items[f.index].id, metric, value: r6(f.value), modifiedZ: r6(f.modifiedZ), z: r6(f.z), outsideIqr: f.outsideIqr });
    }
  };

  const adds = opts.cardRows.filter((r) => r.mode === 'add');
  for (const skill of opts.skills) {
    const mine = adds.filter((r) => r.skill === skill);
    const metricName = `${METRICS[headline].label} change when added`;
    const value = (r: CardRow): number => benefitSign(headline) * r.delta[headline].mean; // positive = helps
    add('card', skill, 'all cards', metricName, mine.map((r) => ({ id: r.card, value: value(r) })));
    for (const cost of [...new Set(mine.map((r) => r.cost))].sort()) {
      add('card', skill, `cost ${cost}`, metricName, mine.filter((r) => r.cost === cost).map((r) => ({ id: r.card, value: value(r) })));
    }
    const fights = opts.ladder.filter((r) => r.skill === skill && r.set === TARGET_DECK_SET);
    for (const tier of TIERS) {
      const inTier = fights.filter((r) => r.tier === tier);
      add('enemy-fight', skill, `${tier} fights`, 'HP lost when won', inTier.filter((r) => r.hpLostWhenWon).map((r) => ({ id: r.fight, value: r.hpLostWhenWon!.mean })));
      add('enemy-fight', skill, `${tier} fights`, 'turns', inTier.map((r) => ({ id: r.fight, value: r.turns.mean })));
    }
  }
  const worseThanNothing = adds.filter((r) => r.verdict === 'worse');

  const markdown = [
    heading(2, 'Outlier report'),
    '',
    OUTLIER_METHOD,
    '',
    `Cards: value = how much adding the card helps on ${METRICS[headline].label} (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the ${TARGET_DECK_SET} deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.`,
    '',
    entries.length
      ? table(
          ['kind', 'skill', 'cohort', 'id', 'metric', 'value', 'modified z', 'z', 'IQR rule'],
          entries.map((e) => [e.kind, e.skill, e.cohort, e.id, e.metric, fix(e.value, 2), fix(e.modifiedZ, 2), fix(e.z, 2), e.outsideIqr ? 'outside' : 'inside'])
        )
      : '_No outliers flagged._',
    '',
    heading(3, 'Cards worse than adding nothing'),
    'Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.',
    '',
    worseThanNothing.length
      ? table(['skill', 'card', 'cost', 'change [95% CI]'], worseThanNothing.map((r) => [r.skill, r.card, r.cost, fmtDiff(r.delta[headline])]))
      : '_None._',
    '',
  ].join('\n');
  return { name: 'outliers', json: { method: OUTLIER_METHOD, headline, entries, worseThanNothing: worseThanNothing.map((r) => ({ skill: r.skill, card: r.card, delta: r.delta[headline] })) }, markdown, entries, worseThanNothing };
}
