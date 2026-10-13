// Commands for the local cards database (docs/DB.md). Run through npm: `npm run db:up`, `db:psql`, `db:export`, `db:seed`, ...
// Plain Node (no dependencies): it only drives `docker compose` and the psql inside the db container, so it works the same
// on every machine that has Docker running.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED = path.join(ROOT, 'db', 'seed', 'cards.csv');
const MIGRATIONS = path.join(ROOT, 'db', 'migrations');

// The columns that travel in the seed file: everything except `id` (database-only, handed out again on reload) and `created_at`.
const COLUMNS = [
  'slug', 'name', 'type', 'cost', 'cost_resource', 'owner', 'target',
  'in_reward_pool', 'in_starter_pool', 'exhaust', 'innate', 'retain', 'ethereal', 'unplayable',
  'tags', 'archetype', 'rarity', 'effects_words', 'upgrade_words', 'notes', 'status',
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

/** Runs `docker compose <args>` in the repo root. */
function compose(args, options = {}) {
  const result = spawnSync('docker', ['compose', ...args], { cwd: ROOT, encoding: 'utf8', ...options });
  if (result.error) fail(`Could not run docker (${result.error.message}). Is Docker installed and Docker Desktop running?`);
  return result;
}

/** Runs psql inside the db container with the container's own user and database. `extra` are psql arguments. */
function psql(extra, input) {
  const result = compose(['exec', '-T', 'db', 'sh', '-c', 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"', 'sh', ...extra], {
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const why = (result.stderr || '').trim();
    if (/no such service|is not running|not running/i.test(why)) fail('The database is not running. Start it with: npm run db:up');
    if (/daemon|pipe|connect/i.test(why) && !/psql:/.test(why)) fail(`Docker is not reachable: ${why}\nStart Docker Desktop, then try again.`);
    fail(why || `psql exited with ${result.status}`);
  }
  return result.stdout;
}

/** The value of KEY from the environment, else from the untracked .env, else ''. */
function envValue(key) {
  if (process.env[key]) return process.env[key];
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return '';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] === key) return m[2];
  }
  return '';
}

/** Applies every db/migrations/*.sql, in name order. They are idempotent, so this is safe on a fresh or an old database. */
function migrate() {
  if (!fs.existsSync(MIGRATIONS)) return;
  for (const file of fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    psql([], fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  }
}

const rowCount = () => Number(psql(['-At', '-c', 'SELECT count(*) FROM cards']).trim());

const commands = {
  up() {
    if (!envValue('POSTGRES_PASSWORD')) {
      fail('No password set. Copy .env.example to .env and put a password after POSTGRES_PASSWORD= (the file stays on this machine; git ignores it).');
    }
    const r = compose(['up', '-d', '--wait', 'db'], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
    migrate();
    const port = envValue('POSTGRES_PORT') || '5433';
    console.log(`\nThe cards database is up: host 127.0.0.1, port ${port}, user ${envValue('POSTGRES_USER') || 'deckbuilder'}, database ${envValue('POSTGRES_DB') || 'deckbuilder'}.`);
    console.log('Open a SQL prompt with: npm run db:psql   (rows: npm run db:status)');
  },

  down() {
    const r = compose(['stop', 'db'], { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  },

  psql(args) {
    // an interactive prompt (or `-- -c "SELECT ..."`), connected the same way the other commands are
    const r = compose(['exec', 'db', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"', 'sh', ...args], { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  },

  status() {
    const ps = compose(['ps', '--format', '{{.Service}}: {{.State}} ({{.Status}})', 'db']);
    console.log((ps.stdout || '').trim() || 'db: not created yet (npm run db:up)');
    if (/running/i.test(ps.stdout || '')) {
      const byStatus = psql(['-At', '-F', ' ', '-c', 'SELECT status, count(*) FROM cards GROUP BY status ORDER BY status']).trim().split('\n').filter(Boolean).map((l) => l.split(' ').reverse().join(' '));
      console.log(`cards: ${rowCount()} rows${byStatus.length ? ` (${byStatus.join(', ')})` : ''}; seed file: ${fs.existsSync(SEED) ? SEED.replace(ROOT + path.sep, '') : 'none yet'}`);
    }
  },

  /** Applies the idempotent changes in db/migrations/ to the database (`db:up` does this too). */
  migrate() {
    migrate();
    console.log('Migrations applied.');
  },

  /** Prints every row as CSV (the same text export writes to the seed file). Used by `db:compare`. */
  dump() {
    process.stdout.write(psql(['-c', `COPY (SELECT ${COLUMNS.join(', ')} FROM cards ORDER BY slug) TO STDOUT WITH (FORMAT csv, HEADER true)`]).replace(/\r\n/g, '\n'));
  },

  /** Writes every row to db/seed/cards.csv (sorted by slug, so the file diffs cleanly in git). */
  export() {
    const csv = psql(['-c', `COPY (SELECT ${COLUMNS.join(', ')} FROM cards ORDER BY slug) TO STDOUT WITH (FORMAT csv, HEADER true)`]);
    fs.mkdirSync(path.dirname(SEED), { recursive: true });
    fs.writeFileSync(SEED, csv.replace(/\r\n/g, '\n'));
    console.log(`Wrote ${rowCount()} cards to db/seed/cards.csv. Commit it so your other machine can load it.`);
  },

  /** Replaces the table's rows with db/seed/cards.csv. Refuses to overwrite a non-empty table unless `--replace` is given. */
  seed(args) {
    if (!fs.existsSync(SEED)) fail('There is no db/seed/cards.csv yet. Export it first (npm run db:export) or pull it from git.');
    const before = rowCount();
    if (before > 0 && !args.includes('--replace')) {
      fail(`The table already has ${before} rows, and loading the seed file replaces them (anything not exported is lost).\nExport first (npm run db:export) if they matter, then run: npm run db:seed -- --replace`);
    }
    let csv = fs.readFileSync(SEED, 'utf8').replace(/\r\n/g, '\n');
    if (!csv.endsWith('\n')) csv += '\n';
    const script = ['BEGIN;', 'TRUNCATE cards RESTART IDENTITY;', `COPY cards (${COLUMNS.join(', ')}) FROM STDIN WITH (FORMAT csv, HEADER true);`, csv + '\\.', 'COMMIT;', ''].join('\n');
    psql([], script);
    console.log(`Loaded ${rowCount()} cards from db/seed/cards.csv.`);
  },
};

const [command, ...args] = process.argv.slice(2);
if (!command || !(command in commands)) {
  console.log(`Usage: node db/db.mjs <${Object.keys(commands).join('|')}>\nSee docs/DB.md.`);
  process.exit(command ? 1 : 0);
}
commands[command](args);
