import { heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import { DEFAULT_OPTIONS, playRun } from './simulate';
import type { RunOutcome, SimOptions } from './simulate';
import type { SkillLevel } from './skills';
import { fix, fmtDiff, meanCI, pairedDiff, pct, verdict, wilson } from './stats';
import { VERDICT_TEXT } from './report';

/**
 * (v) Draft-policy comparison on full runs. Every policy plays the SAME seeds (so the same maps,
 * reward offers and shuffles up to the point policies diverge), and each policy is compared with
 * the first one run by run. Run-level results are noisy and policy-sensitive: read them as
 * "does this policy do clearly better or worse", never as a win rate a player would see.
 */

export interface DraftPolicy {
  name: string;
  options: SimOptions;
}

export const DEFAULT_POLICIES: DraftPolicy[] = [
  { name: 'reward=card (random pick)', options: { ...DEFAULT_OPTIONS, reward: 'card' } },
  { name: 'reward=gold (always gold)', options: { ...DEFAULT_OPTIONS, reward: 'gold' } },
  { name: 'reward=best (trial-fight pick)', options: { ...DEFAULT_OPTIONS, reward: 'best' } },
  { name: 'rest=heal (never upgrade)', options: { ...DEFAULT_OPTIONS, rest: 'heal' } },
  { name: 'path=random', options: { ...DEFAULT_OPTIONS, path: 'random' } },
];

/** Run-level win rate difference below which we call it negligible (provisional). */
export const DRAFT_MARGIN = 0.05;

export function draftExperiment(opts: { runs: number; baseSeed: number; skill: SkillLevel; policies?: DraftPolicy[] }): ExperimentResult {
  const policies = opts.policies ?? DEFAULT_POLICIES;
  const outcomes = policies.map((p) =>
    Array.from({ length: opts.runs }, (_, i): RunOutcome => playRun(opts.baseSeed + i, { ...p.options, skill: opts.skill }))
  );
  const base = outcomes[0];
  const winArr = (os: RunOutcome[]): number[] => os.map((o) => (o.won ? 1 : 0));
  const floorArr = (os: RunOutcome[]): number[] => os.map((o) => o.floorReached);

  const rows = policies.map((p, k) => {
    const os = outcomes[k];
    const wins = winArr(os).reduce((a, b) => a + b, 0);
    const w = wilson(wins, os.length);
    const floor = meanCI(floorArr(os));
    const dWin = k === 0 ? undefined : pairedDiff(winArr(base), winArr(os));
    const dFloor = k === 0 ? undefined : pairedDiff(floorArr(base), floorArr(os));
    return {
      policy: p.name,
      win: w,
      floor,
      dWin,
      dFloor,
      verdict: dWin ? verdict(dWin, DRAFT_MARGIN, true) : undefined,
    };
  });

  // pick rates: of the cards offered at fight rewards, how often each was taken (only policies that take cards)
  const pickTables: string[] = [];
  const pickJson: Record<string, { card: string; offered: number; picked: number; rate: number }[]> = {};
  const shown = new Set<string>();
  policies.forEach((p, k) => {
    // one table per way of picking cards: policies that differ only in rests or paths pick alike
    if (p.options.reward === 'gold' || shown.has(p.options.reward)) return;
    shown.add(p.options.reward);
    const offered = new Map<string, number>();
    const picked = new Map<string, number>();
    for (const o of outcomes[k]) {
      for (const c of o.offered) offered.set(c, (offered.get(c) ?? 0) + 1);
      for (const c of o.rewardPicks) picked.set(c, (picked.get(c) ?? 0) + 1);
    }
    const list = [...offered.entries()]
      .map(([card, n]) => ({ card, offered: n, picked: picked.get(card) ?? 0, rate: (picked.get(card) ?? 0) / n }))
      .sort((a, b) => b.rate - a.rate || a.card.localeCompare(b.card));
    pickJson[p.name] = list.map((x) => ({ ...x, rate: r6(x.rate) }));
    pickTables.push(
      heading(3, `Pick rates under ${p.name}`),
      'Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.',
      '',
      table(['card', 'offered', 'picked', 'pick rate [95% CI]'], list.map((x) => {
        const w = wilson(x.picked, x.offered);
        return [x.card, x.offered, x.picked, `${pct(w.p)} [${pct(w.lo)}, ${pct(w.hi)}]`];
      })),
      ''
    );
  });

  const markdown = [
    heading(2, 'Draft policy comparison (whole runs)'),
    '',
    `${opts.runs} runs per policy on seeds ${opts.baseSeed}..${opts.baseSeed + opts.runs - 1}, fights played by the ${opts.skill} bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-${DRAFT_MARGIN * 100} points.`,
    'Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.',
    '',
    table(
      ['policy', 'run win rate [95% CI]', 'avg floor [95% CI]', 'win change vs first', 'floor change vs first', 'verdict'],
      rows.map((r) => [
        r.policy,
        `${pct(r.win.p)} [${pct(r.win.lo)}, ${pct(r.win.hi)}]`,
        `${fix(r.floor.mean)} [${fix(r.floor.lo)}, ${fix(r.floor.hi)}]`,
        r.dWin ? `${fmtDiff({ mean: r.dWin.mean * 100, lo: r.dWin.lo * 100, hi: r.dWin.hi * 100 })} pts` : '-',
        r.dFloor ? fmtDiff(r.dFloor) : '-',
        r.verdict ? VERDICT_TEXT[r.verdict] : 'baseline',
      ])
    ),
    '',
    ...pickTables,
  ].join('\n');

  return {
    name: 'drafts',
    json: {
      runs: opts.runs,
      baseSeed: opts.baseSeed,
      skill: opts.skill,
      policies: rows.map((r) => ({
        policy: r.policy,
        win: { p: r6(r.win.p), lo: r6(r.win.lo), hi: r6(r.win.hi) },
        floor: { mean: r6(r.floor.mean), lo: r6(r.floor.lo), hi: r6(r.floor.hi) },
        winChange: r.dWin ? { mean: r6(r.dWin.mean), lo: r6(r.dWin.lo), hi: r6(r.dWin.hi) } : null,
        floorChange: r.dFloor ? { mean: r6(r.dFloor.mean), lo: r6(r.dFloor.lo), hi: r6(r.dFloor.hi) } : null,
        verdict: r.verdict ?? null,
      })),
      pickRates: pickJson,
    },
    markdown,
  };
}
