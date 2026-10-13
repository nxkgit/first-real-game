import { describe, expect, it } from 'vitest';
import { baseCards, getCard } from '../src/data/cards';
import type { CardDefinition } from '../src/model';
import {
  CARD_COLUMNS, arrayLiteral, cardToRow, compareRows, isClean, parseArrayLiteral, parseCsv, parseCsvFields, patchNotesTable, toCsv, upgradeWords,
} from './cardRow';
import type { CardRow } from './cardRow';

const rows = baseCards().map(cardToRow);
const row = (slug: string): CardRow => rows.find((r) => r.slug === slug)!;

describe('card to table row', () => {
  it('maps every built card to a row the table would accept', () => {
    expect(rows).toHaveLength(baseCards().length);
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const r of rows) {
      expect(r.slug, r.slug).toMatch(slugPattern);
      expect(r.owner, r.slug).toMatch(slugPattern);
      expect(['attack', 'skill', 'power']).toContain(r.type);
      expect(r.cost, r.slug).toBeGreaterThanOrEqual(0);
      expect(r.cost_resource === null || r.cost_resource === 'radiantLight', r.slug).toBe(true);
      expect(r.target === null || r.target === 'enemy', r.slug).toBe(true);
      expect(r.effects_words.trim(), r.slug).not.toBe('');
      expect(r.upgrade_words.trim(), r.slug).not.toBe('');
      expect(r.status).toBe('built');
    }
    expect(new Set(rows.map((r) => r.slug)).size).toBe(rows.length);
    expect(new Set(rows.map((r) => r.name)).size).toBe(rows.length);
  });

  it("keeps each card's existing id as the slug, even where it is not the slug of the name", () => {
    expect(row('strike').name).toBe('Strike');
    expect(row('placeholder-druid-attack').name).toBe('Druid Attack');
    expect(row('placeholder-block-light').name).toBe('Block + Light');
  });

  it('copies the plain fields across', () => {
    const light = row('placeholder-light-attack');
    expect(light.cost_resource).toBe('radiantLight');
    expect(light.target).toBe('enemy');
    expect(row('cull').exhaust).toBe(true);
    expect(row('heating-up').tags).toEqual(['fire']);
    expect(row('strike').tags).toEqual([]);
    expect(row('strike').in_reward_pool).toBe(true);
  });

  it("writes the effect as the game's own generated text", () => {
    expect(row('strike').effects_words).toBe('Deal 6 damage.');
    expect(row('strike').upgrade_words).toBe('Deal 9 damage.');
  });

  it('says what a cost-only upgrade changes, since the text is identical', () => {
    expect(row('focus').upgrade_words).toBe('Costs 0 instead of 1; effect unchanged.');
    expect(row('double-strength').upgrade_words).toBe('Costs 0 instead of 1; effect unchanged.');
  });

  it('mentions the new cost whenever an upgrade changes it', () => {
    for (const c of baseCards()) {
      const up = getCard(`${c.id}+`);
      if (up.cost !== c.cost) expect(upgradeWords(c), c.id).toContain(`Costs ${up.cost}`);
    }
  });

  it('writes "none" for a card with no upgrade', () => {
    const noUpgrade: CardDefinition = { id: 'x', name: 'X', type: 'skill', cost: 1, owner: 'neutral', inRewardPool: false, effects: [{ kind: 'block', value: 3 }] };
    expect(upgradeWords(noUpgrade)).toBe('none');
  });
});

describe('the seed CSV', () => {
  it('has the header, one line per card sorted by slug, and a final newline', () => {
    const csv = toCsv(rows);
    expect(csv.startsWith(`${CARD_COLUMNS.join(',')}\n`)).toBe(true);
    expect(csv.endsWith('\n')).toBe(true);
    const slugs = parseCsv(csv).map((r) => r.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  it('reads back exactly what was written, for every card', () => {
    expect(parseCsv(toCsv(rows))).toEqual([...rows].sort((a, b) => (a.slug < b.slug ? -1 : 1)));
  });

  it('survives commas, quotes, line breaks, empty strings and nulls', () => {
    const odd: CardRow = { ...row('strike'), slug: 'odd', name: 'Comma, "Quote"', effects_words: 'a, "b"\nsecond line', upgrade_words: 'x', notes: '', archetype: null, tags: ['fire', 'x y', 'NULL'] };
    const back = parseCsv(toCsv([odd]))[0];
    expect(back).toEqual(odd);
    expect(back.notes).toBe('');
    expect(back.archetype).toBeNull();
  });

  it('quotes fields the way Postgres COPY does (so an export after a seed gives back the same file)', () => {
    expect(arrayLiteral([])).toBe('{}');
    expect(arrayLiteral(['fire'])).toBe('{fire}');
    expect(arrayLiteral(['fire', 'x y'])).toBe('{fire,"x y"}');
    expect(parseArrayLiteral('{fire,"x y"}')).toEqual(['fire', 'x y']);
    expect(parseCsvFields('a,"",,"b ""c"""\n')).toEqual([['a', '', null, 'b "c"']]);
  });
});

describe('the comparison of the table with the built cards', () => {
  const code = rows;

  it('is clean when the table is the built cards', () => {
    const result = compareRows(rows, code);
    expect(isClean(result)).toBe(true);
    expect(result.notBuilt).toEqual([]);
  });

  it('reports a column where a built row disagrees with its card', () => {
    const changed = rows.map((r) => (r.slug === 'strike' ? { ...r, cost: 2 } : r));
    const result = compareRows(changed, code);
    expect(isClean(result)).toBe(false);
    expect(result.differences).toEqual([{ slug: 'strike', column: 'cost', table: 2, code: 1 }]);
  });

  it('does not call a ready row a difference, lists it as waiting, and ignores a draft', () => {
    const changed = rows.map((r) => (r.slug === 'strike' ? { ...r, cost: 2, status: 'ready' } : r.slug === 'defend' ? { ...r, cost: 3, status: 'draft' } : r));
    const result = compareRows(changed, code);
    expect(result.differences).toEqual([]);
    expect(result.notBuilt).toEqual([{ slug: 'strike', status: 'ready' }]);
  });

  it('lists a new ready row, a row built but missing in code, and a card missing from the table', () => {
    const table = [...rows.filter((r) => r.slug !== 'defend'), { ...row('strike'), slug: 'new-card', name: 'New Card', status: 'ready' }, { ...row('strike'), slug: 'ghost', name: 'Ghost', status: 'built' }];
    const result = compareRows(table, code);
    expect(result.notBuilt).toEqual([{ slug: 'new-card', status: 'ready' }]);
    expect(result.builtButMissing).toEqual(['ghost']);
    expect(result.missingFromTable).toEqual(['defend']);
  });
});

describe('the patch-notes card table', () => {
  const heroName = (owner: string): string => (owner === 'neutral' ? 'Any hero' : owner.toUpperCase());

  it('shows only what a player sees: name, hero, type, cost, text, upgraded text and keywords', () => {
    const md = patchNotesTable([getCard('cull'), getCard('heating-up')], heroName).split('\n');
    expect(md[0]).toBe('| Card | Hero | Type | Cost | Effect | Upgraded | Keywords |');
    expect(md[2]).toContain('| Cull | Any hero | Skill | 0 |');
    expect(md[2]).toContain('Exhaust');
    expect(md[3]).toContain('| Heating Up | MAGE | Skill | 1 |');
    expect(md[3]).toContain('#fire');
  });

  it('puts the resource in the cost of a card paid in Radiant Light, and escapes pipes', () => {
    const md = patchNotesTable([getCard('placeholder-light-attack')], heroName);
    expect(md).toContain('| 2 Radiant Light |');
    expect(patchNotesTable([{ ...getCard('strike'), name: 'A | B' }], heroName)).toContain('A \\| B');
  });
});
