import { cardTagsText, cardText } from '../src/game/describe';
import { upgradedVersion } from '../src/data/cards';
import type { CardDefinition } from '../src/model';

// The mapping between a built card (TypeScript) and a row of the `cards` table (docs/DB.md), plus the CSV the seed
// file uses and the comparison of the table with the code. Pure functions, no database and no files, so they are
// unit-tested (`cardRow.test.ts`); the commands that touch Docker and files are in `cardsCli.ts`.

/** The columns that travel in the seed file, in table order (everything except the database-only `id` and `created_at`). */
export const CARD_COLUMNS = [
  'slug', 'name', 'type', 'cost', 'cost_resource', 'owner', 'target',
  'in_reward_pool', 'in_starter_pool', 'exhaust', 'innate', 'retain', 'ethereal', 'unplayable',
  'tags', 'archetype', 'rarity', 'effects_words', 'upgrade_words', 'notes', 'status',
] as const;
export type CardColumn = (typeof CARD_COLUMNS)[number];

export const STATUSES = ['draft', 'ready', 'built', 'blocked'] as const;
export type CardStatus = (typeof STATUSES)[number];

/** One row of the table, as the seed file and the comparison see it. Empty optional columns are `null`. */
export interface CardRow {
  slug: string;
  name: string;
  type: string;
  cost: number;
  cost_resource: string | null;
  owner: string;
  target: string | null;
  in_reward_pool: boolean;
  in_starter_pool: boolean;
  exhaust: boolean;
  innate: boolean;
  retain: boolean;
  ethereal: boolean;
  unplayable: boolean;
  tags: string[];
  archetype: string | null;
  rarity: string | null;
  effects_words: string;
  upgrade_words: string;
  notes: string | null;
  status: string;
}

/** What each paid-in resource is called in words (an empty `cost_resource` means energy). */
const RESOURCE_WORDS: Record<string, string> = { radiantLight: 'Radiant Light' };

/** "Costs 0 instead of 1" (with the resource named when it is not energy). */
function costPhrase(from: number, to: number, resource: string | undefined): string {
  const unit = resource ? ` ${RESOURCE_WORDS[resource] ?? resource}` : '';
  return `Costs ${to}${unit} instead of ${from}${unit}`;
}

/** The upgrade in words: the upgraded card's generated text, plus the cost change when the cost differs. */
export function upgradeWords(card: CardDefinition): string {
  const up = upgradedVersion(card);
  if (!up) return 'none';
  const before = cardText(card);
  const after = cardText(up);
  const costChanged = up.cost !== card.cost;
  if (after === before) return costChanged ? `${costPhrase(card.cost, up.cost, card.costResource)}; effect unchanged.` : 'No visible change.';
  return costChanged ? `${after} ${costPhrase(card.cost, up.cost, card.costResource)}.` : after;
}

/** A built card as a table row. The words are the game's own generated text; the status is `built`. */
export function cardToRow(card: CardDefinition): CardRow {
  return {
    slug: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    cost_resource: card.costResource ?? null,
    owner: card.owner,
    target: card.target ?? null,
    in_reward_pool: card.inRewardPool,
    in_starter_pool: card.inStarterPool ?? false,
    exhaust: card.exhaust ?? false,
    innate: card.innate ?? false,
    retain: card.retain ?? false,
    ethereal: card.ethereal ?? false,
    unplayable: card.unplayable ?? false,
    tags: [...(card.tags ?? [])],
    archetype: card.archetype ?? null,
    rarity: card.rarity ?? null,
    effects_words: cardText(card),
    upgrade_words: upgradeWords(card),
    notes: null,
    status: 'built',
  };
}

// ---- CSV, written exactly the way Postgres' COPY writes it, so an export after a seed gives back the same file ----

/** A Postgres array literal: `{}` or `{fire,"x y"}`. */
export function arrayLiteral(items: readonly string[]): string {
  const quote = (s: string): string => (s === '' || /^null$/i.test(s) || /[{},"\\\s]/.test(s) ? `"${s.replace(/["\\]/g, '\\$&')}"` : s);
  return `{${items.map(quote).join(',')}}`;
}

function cell(value: string | number | boolean | string[] | null): string {
  if (value === null) return '';
  const text = Array.isArray(value) ? arrayLiteral(value) : typeof value === 'boolean' ? (value ? 't' : 'f') : String(value);
  // COPY quotes a field that is empty (it would read back as NULL), or contains a comma, a quote or a line break
  return text === '' || /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The seed file's text: a header, then one line per row, sorted by slug, ending with a newline. */
export function toCsv(rows: readonly CardRow[]): string {
  const sorted = [...rows].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const lines = sorted.map((row) => CARD_COLUMNS.map((c) => cell(row[c])).join(','));
  return `${[CARD_COLUMNS.join(','), ...lines].join('\n')}\n`;
}

/** Splits CSV text into records of fields. `null` marks an unquoted empty field (a NULL); a quoted empty one is ''. */
export function parseCsvFields(text: string): (string | null)[][] {
  const records: (string | null)[][] = [];
  let record: (string | null)[] = [];
  let field = '';
  let quoted = false;
  let inQuotes = false;
  const endField = (): void => {
    record.push(field === '' && !quoted ? null : field);
    field = '';
    quoted = false;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
      quoted = true;
    } else if (ch === ',') endField();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endField();
      records.push(record);
      record = [];
    } else field += ch;
  }
  if (field !== '' || quoted || record.length > 0) {
    endField();
    records.push(record);
  }
  return records;
}

/** The items of a Postgres array literal such as `{fire,"x y"}`. */
export function parseArrayLiteral(text: string): string[] {
  const body = text.trim().replace(/^\{/, '').replace(/\}$/, '');
  const items: string[] = [];
  let item = '';
  let inQuotes = false;
  let any = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuotes) {
      if (ch === '\\') item += body[++i];
      else if (ch === '"') inQuotes = false;
      else item += ch;
    } else if (ch === '"') {
      inQuotes = true;
      any = true;
    } else if (ch === ',') {
      items.push(item);
      item = '';
      any = false;
    } else {
      item += ch;
      any = true;
    }
  }
  if (any || item !== '') items.push(item);
  return items;
}

/** Rows from CSV text with a header line (the seed file, or the table dumped by `db:compare`). */
export function parseCsv(text: string): CardRow[] {
  const [header, ...records] = parseCsvFields(text);
  if (!header) return [];
  const names = header as string[];
  const missing = CARD_COLUMNS.filter((c) => !names.includes(c));
  if (missing.length > 0) throw new Error(`the CSV has no column ${missing.join(', ')}`);
  return records
    .filter((r) => r.length > 1 || r[0] !== null)
    .map((r) => {
      const get = (c: CardColumn): string | null => r[names.indexOf(c)] ?? null;
      const str = (c: CardColumn): string => get(c) ?? '';
      return {
        slug: str('slug'),
        name: str('name'),
        type: str('type'),
        cost: Number(str('cost')),
        cost_resource: get('cost_resource'),
        owner: str('owner'),
        target: get('target'),
        in_reward_pool: str('in_reward_pool') === 't',
        in_starter_pool: str('in_starter_pool') === 't',
        exhaust: str('exhaust') === 't',
        innate: str('innate') === 't',
        retain: str('retain') === 't',
        ethereal: str('ethereal') === 't',
        unplayable: str('unplayable') === 't',
        tags: parseArrayLiteral(str('tags')),
        archetype: get('archetype'),
        rarity: get('rarity'),
        effects_words: str('effects_words'),
        upgrade_words: str('upgrade_words'),
        notes: get('notes'),
        status: str('status'),
      };
    });
}

// ---- the comparison of the table with the built cards ----

/** The columns checked exactly. The words, the notes and the status are the table's own and are not compared. */
export const COMPARED_COLUMNS: readonly CardColumn[] = [
  'name', 'type', 'cost', 'cost_resource', 'owner', 'target',
  'in_reward_pool', 'in_starter_pool', 'exhaust', 'innate', 'retain', 'ethereal', 'unplayable',
  'tags', 'archetype', 'rarity',
];

export interface ColumnDiff {
  slug: string;
  column: CardColumn;
  table: unknown;
  code: unknown;
}

export interface Comparison {
  /** Slugs in the table that are not built yet, with the status each has (the cards still to build or already blocked). */
  notBuilt: { slug: string; status: string }[];
  /** Slugs the table says are `built` but that no code has. */
  builtButMissing: string[];
  /** Cards in the code with no row in the table. */
  missingFromTable: string[];
  /** Columns where a row and its built card disagree. */
  differences: ColumnDiff[];
  /** How many rows of the table were looked at. */
  rows: number;
}

/** Compares the table (`tableRows`) with the built cards (`codeRows`, from `cardToRow`) by slug. */
export function compareRows(tableRows: readonly CardRow[], codeRows: readonly CardRow[]): Comparison {
  const code = new Map(codeRows.map((r) => [r.slug, r]));
  const table = new Map(tableRows.map((r) => [r.slug, r]));
  const out: Comparison = { notBuilt: [], builtButMissing: [], missingFromTable: [], differences: [], rows: tableRows.length };
  for (const row of tableRows) {
    const built = code.get(row.slug);
    if (!built) {
      if (row.status === 'built') out.builtButMissing.push(row.slug);
      else out.notBuilt.push({ slug: row.slug, status: row.status });
      continue;
    }
    // a row waiting to be (re)built is expected to differ from the code: list it, do not call it a difference;
    // a draft is still being designed and is ignored; only a row marked built must match its card
    if (row.status === 'ready' || row.status === 'blocked') out.notBuilt.push({ slug: row.slug, status: row.status });
    if (row.status !== 'built') continue;
    for (const column of COMPARED_COLUMNS) {
      if (JSON.stringify(row[column]) !== JSON.stringify(built[column])) out.differences.push({ slug: row.slug, column, table: row[column], code: built[column] });
    }
  }
  for (const row of codeRows) if (!table.has(row.slug)) out.missingFromTable.push(row.slug);
  return out;
}

/** True when the table and the code agree (nothing built-but-missing, nothing missing from the table, no differences). */
export const isClean = (c: Comparison): boolean => c.builtButMissing.length === 0 && c.missingFromTable.length === 0 && c.differences.length === 0;

// ---- the card table for a PR description: only what a player sees ----

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** A Markdown table of the given cards for the patch-notes section of a PR. `heroName` turns an owner id into its display name. */
export function patchNotesTable(cards: readonly CardDefinition[], heroName: (owner: string) => string): string {
  const flags = (c: CardDefinition): string =>
    [c.exhaust ? 'Exhaust' : '', c.innate ? 'Innate' : '', c.retain ? 'Retain' : '', c.ethereal ? 'Ethereal' : '', c.unplayable ? 'Unplayable' : '', cardTagsText(c)].filter(Boolean).join(', ');
  const esc = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const cost = (c: CardDefinition): string => `${c.cost}${c.costResource ? ` ${RESOURCE_WORDS[c.costResource] ?? c.costResource}` : ''}`;
  const lines = ['| Card | Hero | Type | Cost | Effect | Upgraded | Keywords |', '|---|---|---|---|---|---|---|'];
  for (const c of cards) {
    lines.push(`| ${esc(c.name)} | ${esc(heroName(c.owner))} | ${cap(c.type)} | ${cost(c)} | ${esc(cardText(c))} | ${esc(upgradeWords(c))} | ${esc(flags(c))} |`);
  }
  return lines.join('\n');
}
