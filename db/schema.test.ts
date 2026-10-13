import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCard } from '../src/data/cards';

// The cards table mirrors CardDefinition (docs/DB.md). This keeps the two honest without needing a running database:
// a new simple field on CardDefinition must either get a column or be listed below with the reason it has none.

const text = (path: string): string => readFileSync(path, 'utf8').split('\r\n').join('\n');
const model = text('src/model/card.ts');
const sql = text('db/init/01-cards.sql');
const script = text('db/db.mjs');

const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Top-level field names of `export interface CardDefinition { ... }`. */
function cardFields(): string[] {
  const body = model.match(/export interface CardDefinition \{\n([\s\S]*?)\n\}/);
  if (!body) throw new Error('CardDefinition not found in src/model/card.ts');
  return [...body[1].matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Column names declared in the CREATE TABLE cards (...) statement. */
function tableColumns(): string[] {
  const body = sql.match(/CREATE TABLE cards \(\n([\s\S]*?)\n\);/);
  if (!body) throw new Error('CREATE TABLE cards not found in db/init/01-cards.sql');
  return [...body[1].matchAll(/^ {2}([a-z_]+)\s+(?:text|integer|boolean|timestamptz)/gm)].map((m) => m[1]);
}

/** The card fields that deliberately have no column of the same name, with where the information goes instead. */
const NO_COLUMN: Record<string, string> = {
  id: 'is the `slug` column (the table has its own database-only `id`)',
  effects: 'written in plain words in `effects_words`; built into TypeScript from them',
  onTurnStartEffect: 'part of `effects_words`',
  triggers: 'part of `effects_words`',
  upgrade: 'written in plain words in `upgrade_words`',
  description: 'never written by hand: card text is generated from the effects',
  upgradeOf: 'set on the generated upgraded card, never authored',
};

describe('the cards table mirrors CardDefinition', () => {
  it('has a column for every CardDefinition field, or a stated reason it has none', () => {
    const columns = new Set(tableColumns());
    for (const field of cardFields()) {
      if (field in NO_COLUMN) continue;
      expect(columns.has(snake(field)), `CardDefinition.${field} needs a column "${snake(field)}" in db/init/01-cards.sql (or an entry in NO_COLUMN with the reason)`).toBe(true);
    }
  });

  it('lists no exclusion for a field that no longer exists', () => {
    const fields = new Set(cardFields());
    for (const field of Object.keys(NO_COLUMN)) expect(fields.has(field), `NO_COLUMN names ${field}, which CardDefinition no longer has`).toBe(true);
  });

  it('exports and reloads exactly the table columns, except the database-only id and created_at', () => {
    const list = script.match(/const COLUMNS = \[([\s\S]*?)\];/);
    if (!list) throw new Error('COLUMNS not found in db/db.mjs');
    const exported = [...list[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    const expected = tableColumns().filter((c) => c !== 'id' && c !== 'created_at');
    expect(exported).toEqual(expected);
  });

  it('uses the same slug pattern as the game ids it will be turned into (lowercase words joined by hyphens)', () => {
    // every existing card id that was a slug of its name keeps working as one
    expect(getCard('strike').id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(sql).toContain("^[a-z0-9]+(-[a-z0-9]+)*$");
  });
});
