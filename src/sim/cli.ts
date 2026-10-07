import { simulateFight, simulateRuns } from './simulate';
import type { RewardPolicy } from './simulate';

// Command-line front end for the simulator. Run it with:
//   npm run sim -- --runs 500 --reward card
//   npm run sim -- --fight enemy-b,enemy-d --runs 500
// Options: --runs N (default 200), --seed S (default 1), --reward card|gold (default card),
// --fight id[,id...] (the starter deck against those enemies instead of whole runs), --json.

// this file only runs under Node, where `process` exists; the game's tsconfig doesn't include Node's types
declare const process: { argv: string[] };

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[arg.slice(2)] = 'true';
    else {
      args[arg.slice(2)] = next;
      i++;
    }
  }
  return args;
}

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const num = (x: number): string => x.toFixed(1);

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runs = Math.max(1, Number(args.runs ?? 200));
  const seed = Number(args.seed ?? 1);
  const json = args.json === 'true';
  const reward = (args.reward ?? 'card') as RewardPolicy;
  if (reward !== 'card' && reward !== 'gold') throw new Error('--reward must be card or gold');

  if (args.fight) {
    const summary = simulateFight(args.fight.split(','), runs, seed);
    if (json) return console.log(JSON.stringify(summary, null, 2));
    console.log(`Starter deck vs ${summary.enemies.join(' + ')}, ${runs} fights (seed ${seed}+)`);
    console.log(`  win rate            ${pct(summary.winRate)}`);
    console.log(`  average turns       ${num(summary.avgTurns)}`);
    console.log(`  HP lost when won    ${num(summary.avgHpLostWhenWon)}`);
    return;
  }

  const summary = simulateRuns({ runs, seed, reward });
  if (json) return console.log(JSON.stringify(summary, null, 2));

  console.log(`${runs} runs, reward policy "${reward}", seeds ${seed}..${seed + runs - 1}`);
  console.log('(simple bot: compare versions against each other, not against real players)\n');
  console.log(`Run win rate        ${pct(summary.winRate)}`);
  console.log(`Average floor       ${num(summary.avgFloorReached)}`);
  console.log(`Final deck size     ${num(summary.avgFinalDeckSize)}    final gold ${num(summary.avgFinalGold)}\n`);

  console.log('Fights by floor');
  console.log('  floor  enemies                 reached  win rate  avg turns  avg HP lost (wins)');
  for (const f of summary.fights) {
    console.log(
      `  ${String(f.floor).padEnd(5)}  ${f.enemies.join('+').padEnd(22)} ${String(f.attempts).padStart(7)}  ${pct(f.winRate).padStart(8)}  ${num(f.avgTurns).padStart(9)}  ${num(f.avgHpLostWhenWon).padStart(18)}`
    );
  }

  const deaths = Object.entries(summary.deathsByFloor);
  if (deaths.length > 0) {
    console.log('\nRuns lost, by floor');
    for (const [floor, n] of deaths) console.log(`  floor ${floor}: ${n}`);
  }

  const picks = Object.entries(summary.cardPicks).sort(([, a], [, b]) => b - a);
  if (picks.length > 0) {
    console.log('\nCards added to decks');
    for (const [id, n] of picks) console.log(`  ${id.padEnd(16)} ${n}`);
  }
}

main();
