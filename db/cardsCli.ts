import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { baseCards, getCard } from '../src/data/cards';
import { findHero } from '../src/data/heroes';
import { COMPARED_COLUMNS, cardToRow, compareRows, isClean, parseCsv, patchNotesTable, toCsv } from './cardRow';

// Entry point for `npm run db:backfill` and `npm run db:compare` (built with Vite like the other CLIs; see package.json).
//
//   db:backfill [--replace]        Write db/seed/cards.csv from the cards the game has built (status "built").
//                                  Refuses to overwrite an existing seed file unless --replace. Then load it with `npm run db:seed`.
//   db:compare                     Compare the table with the built cards: structured columns must match for every row marked
//                                  "built"; lists rows still to build ("ready"), blocked ones, and cards missing either way.
//                                  Exit code 1 means a difference. Needs the database running.
//   db:compare --table <slug...>   Print the patch-notes card table (only what a player sees) for those cards, from the code.
//                                  No database needed.

const ROOT = process.cwd();
const SEED = path.join(ROOT, 'db', 'seed', 'cards.csv');
const [command, ...args] = process.argv.slice(2);

const fail = (message: string): never => {
  console.error(message);
  return process.exit(1);
};

const heroName = (owner: string): string => (owner === 'neutral' ? 'Any hero' : (findHero(owner)?.name ?? owner));

function backfill(): void {
  if (fs.existsSync(SEED) && !args.includes('--replace')) {
    fail('db/seed/cards.csv already exists. Overwrite it with the cards the game has built: npm run db:backfill -- --replace');
  }
  const rows = baseCards().map(cardToRow);
  fs.mkdirSync(path.dirname(SEED), { recursive: true });
  fs.writeFileSync(SEED, toCsv(rows));
  console.log(`Wrote ${rows.length} built cards to db/seed/cards.csv (status "built"). Load them with: npm run db:seed`);
}

function table(slugs: string[]): void {
  if (slugs.length === 0) fail('Give at least one slug: npm run db:compare -- --table tortoise-form druid-attack');
  const cards = slugs.map((slug) => {
    try {
      return getCard(slug);
    } catch {
      return fail(`No built card has the slug "${slug}".`);
    }
  });
  console.log(patchNotesTable(cards, heroName));
}

function compare(): void {
  const dump = spawnSync('node', ['db/db.mjs', 'dump'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (dump.status !== 0) fail((dump.stderr || dump.stdout || 'could not read the table').trim());
  const tableRows = parseCsv(dump.stdout);
  const result = compareRows(tableRows, baseCards().map(cardToRow));

  const byStatus: Record<string, number> = {};
  for (const r of tableRows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  console.log(`Table: ${tableRows.length} rows (${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ') || 'empty'}); code: ${baseCards().length} built cards.`);

  const waiting = (status: string): string[] => result.notBuilt.filter((r) => r.status === status).map((r) => r.slug);
  for (const [status, heading] of [['ready', 'Ready to build (card build mode)'], ['blocked', 'Blocked'], ['draft', 'Drafts (ignored)']] as const) {
    const slugs = waiting(status);
    if (slugs.length === 0) continue;
    console.log(`
${heading}: ${slugs.length}`);
    for (const slug of slugs) console.log(`  ${slug}`);
  }
  if (result.missingFromTable.length > 0) {
    console.log(`\nBuilt in the code but not in the table: ${result.missingFromTable.length}`);
    for (const slug of result.missingFromTable) console.log(`  ${slug}`);
  }
  if (result.builtButMissing.length > 0) {
    console.log(`\nMarked built in the table but no card has that slug: ${result.builtButMissing.length}`);
    for (const slug of result.builtButMissing) console.log(`  ${slug}`);
  }
  if (result.differences.length > 0) {
    console.log(`\nRows marked built that disagree with their card: ${result.differences.length}`);
    for (const d of result.differences) console.log(`  ${d.slug}.${d.column}: table ${JSON.stringify(d.table)}, code ${JSON.stringify(d.code)}`);
  }
  if (isClean(result)) console.log(`\n0 differences across the ${COMPARED_COLUMNS.length} compared columns.`);
  else process.exit(1);
}

if (command === 'backfill') backfill();
else if (command === 'compare') {
  const at = args.indexOf('--table');
  if (at >= 0) table(args.slice(at + 1));
  else compare();
} else fail('Usage: backfill [--replace] | compare [--table <slug...>]');
