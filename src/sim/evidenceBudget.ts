import { PLAYER_MAX_HP } from '../data/tunables';
import { compareRuns, runTable } from './evidenceRuns';
import type { RunExpOptions } from './evidenceRuns';
import { DEFAULT_RUN_POLICY, withPolicy } from './runsim';
import { heading, r6 } from './report';
import type { ExperimentResult } from './report';

/**
 * The HP-budget calibration: starting max HP changed in memory (the player's HP budget). It turns
 * every other effect into one unit: "an extra N HP of budget is worth this many win-rate points",
 * so a relic worth +30 win points is about as strong as the same number of starting HP.
 */
export function hpBudgetExperiment(o: RunExpOptions & { bonuses: number[] }): ExperimentResult {
  const base = withPolicy(o.base ?? DEFAULT_RUN_POLICY, { skill: o.skill, measureFinal: true });
  const entries = [{ name: `max HP ${PLAYER_MAX_HP} (current)`, policy: base }];
  for (const b of o.bonuses) entries.push({ name: `max HP ${PLAYER_MAX_HP + b} (${b > 0 ? '+' : ''}${b})`, policy: withPolicy(base, { bonusMaxHp: b }) });
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  const markdown = [
    heading(2, 'HP budget: win rate against starting max HP'),
    '',
    `${o.runs} paired runs per row on seeds ${o.baseSeed}..${o.baseSeed + o.runs - 1}, ${o.skill} bot. Starting max HP (and HP) changed in memory; the rest of the run is the same. Differences are paired by seed against the first row, 95% intervals.`,
    '',
    runTable(rows),
    '',
  ].join('\n');
  return {
    name: 'hpBudget',
    json: { options: { ...o }, rows: rows.map((r) => ({ name: r.name, win: r6(r.win.p), dWin: r.dWin ? r6(r.dWin.mean) : null, floor: r6(r.floor.mean) })) },
    markdown,
  };
}
