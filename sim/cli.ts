import { readFileSync, writeFileSync } from 'node:fs';
import { compareSummaries, simulateFight, simulateRuns } from './simulate';
import type { PathPolicy, RestPolicy, RewardPolicy, SimSummary } from './simulate';

// Command-line front end for the simulator. Examples:
//   npm run sim -- --runs 500
//   npm run sim -- --runs 500 --reward best --out before.json
//   npm run sim -- --compare before.json after.json
//   npm run sim -- --fight enemy-b,enemy-d --runs 500
// Options: --runs N (default 200), --seed S (default 1),
//   --reward card|gold|best (how the bot takes rewards; default card),
//   --rest heal|smart (default smart), --path random|smart (default smart),
//   --fight id[,id...] (the starter deck against those enemies instead of whole runs),
//   --out file.json (save the result), --compare a.json b.json (show what changed), --json.

// this file only runs under Node, where `process` exists; the game's tsconfig doesn't include Node's types
declare const process: { argv: string[] };

function parseArgs(argv: string[]): { flags: Record<string, string>; rest: string[] } {
  const flags: Record<string, string> = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      rest.push(arg);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[arg.slice(2)] = 'true';
    else {
      flags[arg.slice(2)] = next;
      i++;
    }
  }
  return { flags, rest };
}

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const num = (x: number): string => x.toFixed(1);

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (!allowed.includes(value as T)) throw new Error(`--${name} must be one of ${allowed.join(', ')}`);
  return value as T;
}

function printSummary(summary: SimSummary, seed: number): void {
  const { options } = summary;
  console.log(
    `${summary.runs} runs, seeds ${seed}..${seed + summary.runs - 1}  (rewards: ${options.reward}, rests: ${options.rest}, path: ${options.path})`
  );
  console.log('(simple bot: compare versions against each other, not against real players)\n');
  console.log(`Run win rate        ${pct(summary.winRate)}`);
  console.log(`Average floor       ${num(summary.avgFloorReached)}`);
  console.log(`Final deck size     ${num(summary.avgFinalDeckSize)}    final gold ${num(summary.avgFinalGold)}`);
  console.log(`Rest stops          healed ${summary.restChoices.heal}, upgraded ${summary.restChoices.upgrade}\n`);

  console.log('Fights by kind');
  console.log('  kind     fights  win rate  avg turns  avg HP lost (wins)');
  for (const tier of ['normal', 'elite', 'boss'] as const) {
    const t = summary.byTier[tier];
    console.log(`  ${tier.padEnd(7)} ${String(t.fights).padStart(7)}  ${pct(t.winRate).padStart(8)}  ${num(t.avgTurns).padStart(9)}  ${num(t.avgHpLostWhenWon).padStart(18)}`);
  }

  console.log('\nFights by encounter');
  console.log('  kind     enemies                 times  win rate  avg turns  avg HP lost (wins)');
  for (const e of summary.encounters) {
    console.log(
      `  ${e.tier.padEnd(7)}  ${e.enemies.padEnd(22)} ${String(e.attempts).padStart(6)}  ${pct(e.winRate).padStart(8)}  ${num(e.avgTurns).padStart(9)}  ${num(e.avgHpLostWhenWon).padStart(18)}`
    );
  }

  const lost = Object.entries(summary.lostTo);
  if (lost.length > 0) {
    console.log('\nRuns lost to');
    for (const [what, n] of lost) console.log(`  ${what.padEnd(8)} ${n}`);
  }

  console.log('\nCards (win rates here are biased: a run that survives longer collects more cards)');
  console.log('  card             picks  runs with  win rate with  without  plays/fight');
  for (const c of summary.cards) {
    console.log(
      `  ${c.id.padEnd(16)} ${String(c.picks).padStart(5)}  ${String(c.runsWith).padStart(9)}  ${pct(c.winRateWith).padStart(13)}  ${pct(c.winRateWithout).padStart(7)}  ${num(c.playsPerFight).padStart(11)}`
    );
  }

  const relics = Object.entries(summary.relics).sort(([, a], [, b]) => b - a);
  if (relics.length > 0) {
    console.log('\nRelics held at the end (runs)');
    for (const [id, n] of relics) console.log(`  ${id.padEnd(16)} ${n}`);
  }
}

function main(): void {
  const { flags, rest } = parseArgs(process.argv.slice(2));

  if (flags.compare !== undefined) {
    const [aPath, bPath] = [flags.compare === 'true' ? rest[0] : flags.compare, flags.compare === 'true' ? rest[1] : rest[0]];
    if (!aPath || !bPath) throw new Error('--compare needs two files: --compare before.json after.json');
    const diffs = compareSummaries(JSON.parse(readFileSync(aPath, 'utf8')), JSON.parse(readFileSync(bPath, 'utf8')));
    if (diffs.length === 0) return console.log('No differences.');
    console.log('What changed (before -> after)');
    for (const d of diffs) {
      const isRate = /win rate/.test(d.what);
      const show = (x: number): string => (isRate ? pct(x) : num(x));
      console.log(`  ${d.what.padEnd(40)} ${show(d.before).padStart(8)} -> ${show(d.after).padStart(8)}`);
    }
    return;
  }

  const runs = Math.max(1, Number(flags.runs ?? 200));
  const seed = Number(flags.seed ?? 1);
  const json = flags.json === 'true';

  if (flags.fight) {
    const summary = simulateFight(flags.fight.split(','), runs, seed);
    if (json) return console.log(JSON.stringify(summary, null, 2));
    console.log(`Starter deck vs ${summary.enemies.join(' + ')}, ${runs} fights (seed ${seed}+)`);
    console.log(`  win rate            ${pct(summary.winRate)}`);
    console.log(`  average turns       ${num(summary.avgTurns)}`);
    console.log(`  HP lost when won    ${num(summary.avgHpLostWhenWon)}`);
    return;
  }

  const summary = simulateRuns({
    runs,
    seed,
    reward: oneOf<RewardPolicy>(flags.reward, ['card', 'gold', 'best'], 'card', 'reward'),
    rest: oneOf<RestPolicy>(flags.rest, ['heal', 'smart'], 'smart', 'rest'),
    path: oneOf<PathPolicy>(flags.path, ['random', 'smart'], 'smart', 'path'),
  });
  if (flags.out) writeFileSync(flags.out, JSON.stringify(summary, null, 2));
  if (json) return console.log(JSON.stringify(summary, null, 2));
  printSummary(summary, seed);
  if (flags.out) console.log(`\nSaved to ${flags.out}`);
}

main();
