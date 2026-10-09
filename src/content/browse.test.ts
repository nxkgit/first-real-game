import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { baseCards, upgradedVersion } from '../data/cards';
import {
  CARD_HEADERS,
  NO_FILTERS,
  cardRecord,
  cardRow,
  distinct,
  excludesZero,
  filterCards,
  formatInterval,
  matchesQuery,
  parseSimStats,
  sortRows,
  topPartners,
  upgradeComparison,
} from './browse';

const records = baseCards().map((c) => cardRecord(c, upgradedVersion(c)));

describe('search and sort', () => {
  it('matches every term anywhere in the row, ignoring case', () => {
    expect(matchesQuery(['Strike', 'Deal 6 damage.'], 'strike DAMAGE')).toBe(true);
    expect(matchesQuery(['Strike', 'Deal 6 damage.'], 'strike block')).toBe(false);
    expect(matchesQuery(['x'], '   ')).toBe(true);
  });

  it('sorts numeric columns by value, text columns alphabetically, empties last, both directions, without mutating', () => {
    const rows = [['b', '10'], ['a', '2'], ['c', ''], ['d', '-1']];
    expect(sortRows(rows, 1).map((r) => r[0])).toEqual(['d', 'a', 'b', 'c']);
    expect(sortRows(rows, 1, 'desc').map((r) => r[0])).toEqual(['b', 'a', 'd', 'c']);
    expect(sortRows(rows, 0, 'desc').map((r) => r[0])).toEqual(['d', 'c', 'b', 'a']);
    expect(rows[0][0]).toBe('b');
  });

  it('is stable for equal keys', () => {
    const rows = [['x', '1'], ['y', '1'], ['z', '1']];
    expect(sortRows(rows, 1).map((r) => r[0])).toEqual(['x', 'y', 'z']);
  });
});

describe('card records and filters', () => {
  it('has one row per card with a cell for every header', () => {
    expect(records.length).toBe(baseCards().length);
    for (const r of records) expect(cardRow(r)).toHaveLength(CARD_HEADERS.length);
  });

  it('filters by type, cost, owner, tag and reward pool, and they combine', () => {
    const attacks = filterCards(records, { ...NO_FILTERS, type: 'attack' });
    expect(attacks.length).toBeGreaterThan(0);
    expect(attacks.every((c) => c.type === 'attack')).toBe(true);
    const zero = filterCards(records, { ...NO_FILTERS, cost: '0' });
    expect(zero.every((c) => c.cost === 0)).toBe(true);
    const pool = filterCards(records, { ...NO_FILTERS, pool: 'yes' });
    expect(pool.every((c) => c.inRewardPool)).toBe(true);
    const notPool = filterCards(records, { ...NO_FILTERS, pool: 'no' });
    expect(pool.length + notPool.length).toBe(records.length);
    const tagged = filterCards(records, { ...NO_FILTERS, tag: 'tag-a' });
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.every((c) => c.tags.includes('tag-a'))).toBe(true);
    const both = filterCards(records, { ...NO_FILTERS, type: 'attack', pool: 'yes', cost: '1' });
    expect(both.every((c) => c.type === 'attack' && c.inRewardPool && c.cost === 1)).toBe(true);
  });

  it('says what each card is paid in: energy unless the card costs Radiant Light', () => {
    expect(records.every((r) => r.resource === 'energy' || r.resource === 'radiantLight')).toBe(true);
    for (const c of baseCards()) {
      expect(records.find((r) => r.id === c.id)?.resource).toBe(c.costResource ?? 'energy');
    }
    const light = records.filter((r) => r.resource === 'radiantLight');
    expect(light.length).toBeGreaterThan(0);
    expect(light.every((r) => r.owner === 'paladin')).toBe(true);
    expect(records.some((r) => r.id === 'strike' && r.resource === 'energy')).toBe(true);
    // the table shows the label, and the Resource filter uses the stable id
    const col = CARD_HEADERS.indexOf('Resource');
    expect(col).toBe(CARD_HEADERS.indexOf('Cost') + 1);
    expect(cardRow(light[0])[col]).toBe('Radiant Light');
    expect(cardRow(records.find((r) => r.resource === 'energy') as (typeof records)[number])[col]).toBe('Energy');
    const filtered = filterCards(records, { ...NO_FILTERS, resource: 'radiantLight' });
    expect(filtered.map((c) => c.id).sort()).toEqual(light.map((c) => c.id).sort());
    expect(filterCards(records, { ...NO_FILTERS, resource: 'energy' }).length + filtered.length).toBe(records.length);
  });

  it('searches names, text and the upgraded text', () => {
    expect(filterCards(records, { ...NO_FILTERS, query: 'jab' }).map((c) => c.id)).toContain('jab');
    expect(filterCards(records, { ...NO_FILTERS, query: 'exhaust' }).length).toBeGreaterThan(0);
    expect(filterCards(records, { ...NO_FILTERS, query: 'zzzz-nothing' })).toEqual([]);
  });

  it('shows scaling and trigger text for the cards that have them', () => {
    const combo = records.find((r) => r.id === 'combo-strike');
    expect(combo?.scaling[0]).toContain('cardsPlayedThisTurn');
    expect(combo?.text).toContain('for each');
    const power = records.find((r) => r.triggers.length > 0);
    expect(power?.text).toContain(power?.triggers[0]);
  });

  it('builds a before/after comparison, flagging what changed', () => {
    const jab = records.find((r) => r.id === 'jab');
    expect(jab).toBeDefined();
    const [cost, text] = upgradeComparison(jab as (typeof records)[number]);
    expect(cost.changed).toBe(false);
    expect(text.changed).toBe(true);
    expect(text.before).not.toBe(text.after);
    const focus = upgradeComparison(records.find((r) => r.id === 'focus') as (typeof records)[number]);
    expect(focus[0].changed).toBe(true);
  });

  it('lists distinct filter values sorted', () => {
    expect(distinct(['b', 'a', 'b', ''])).toEqual(['a', 'b']);
    expect(distinct(['10', '2', '1'])).toEqual(['1', '2', '10']);
  });
});

describe('simulation stats', () => {
  const report = {
    generated: '2026-01-01',
    cards: {
      context: 'starter',
      setup: { seeds: 60 },
      rows: [
        { skill: 'smart', mode: 'add', card: 'jab', delta: { win: { mean: 0.02, lo: 0.01, hi: 0.03 }, hpLost: { mean: -3, lo: -4, hi: -2 }, turns: { mean: -1, lo: -1.2, hi: -0.8 } }, verdict: 'better' },
      ],
    },
    pairs: {
      skill: 'smart',
      evaluated: 2,
      totalPairs: 2,
      sampled: false,
      rows: [
        { a: 'jab', b: 'bolt', synergy: { hpLost: { mean: 2, lo: 1, hi: 3 } }, verdict: 'better' },
        { a: 'jab', b: 'focus', synergy: { hpLost: { mean: -2, lo: -3, hi: -1 } }, verdict: 'worse' },
      ],
    },
  };
  const baseline = {
    generated: '2026-01-01',
    metrics: {
      'card-add/smart/bolt/hpLost': { mean: -1, sd: 4, n: 100 },
      'card-add/smart/jab/hpLost': { mean: -9, sd: 1, n: 100 },
      'ladder/smart/starter/enemy-a/win': { mean: 1, sd: 0, n: 100 },
    },
  };

  it('reads a report: effects with intervals and verdicts, and partners from both sides of a pair', () => {
    const sim = parseSimStats(report, undefined);
    const jab = sim.byCard.get('jab');
    expect(jab?.source).toBe('report');
    expect(jab?.entries[0].verdict).toBe('better');
    expect(topPartners(jab, 3).map((p) => p.partner)).toEqual(['bolt']);
    expect(topPartners(jab, 3, 'worse').map((p) => p.partner)).toEqual(['focus']);
    expect(sim.byCard.get('bolt')?.partners[0].partner).toBe('jab');
    expect(sim.notes.length).toBe(2);
  });

  it('falls back to the baseline for cards the report lacks, rebuilding an interval, and never overrides the report', () => {
    const sim = parseSimStats(report, baseline);
    expect(sim.byCard.get('jab')?.source).toBe('report');
    const bolt = sim.byCard.get('bolt');
    expect(bolt?.entries[0].hpLost?.lo).toBeCloseTo(-1 - (1.959964 * 4) / 10, 6);
    expect(bolt?.entries[0].verdict).toBeUndefined();
  });

  it('degrades gracefully when nothing, or garbage, is available', () => {
    for (const input of [undefined, null, 5, 'x', [], {}, { cards: 3, pairs: { rows: 'no' } }, { metrics: { 'card-add/a/b/c': 7 } }]) {
      const sim = parseSimStats(input, input);
      expect(sim.byCard.size).toBe(0);
    }
    expect(parseSimStats({ cards: { rows: [null, { card: 4 }, { card: 'x', skill: 'smart', delta: 5 }] } }, null).byCard.get('x')?.entries[0].win).toBeUndefined();
  });

  it('formats intervals and checks whether they exclude zero', () => {
    expect(formatInterval({ mean: 0.025, lo: 0.005, hi: 0.045 }, 'win')).toBe('+2.5 pts [+0.5, +4.5]');
    expect(formatInterval({ mean: -1.24, lo: -1.9, hi: -0.5 }, 'hpLost')).toBe('-1.2 [-1.9, -0.5]');
    expect(formatInterval(undefined, 'turns')).toBe('');
    expect(excludesZero({ mean: 1, lo: 0.1, hi: 2 })).toBe(true);
    expect(excludesZero({ mean: 0, lo: -1, hi: 1 })).toBe(false);
  });

  it('reads the committed sample report and baseline', () => {
    const rep = JSON.parse(readFileSync('balance/reports/sample.json', 'utf8')) as unknown;
    const base = JSON.parse(readFileSync('balance/baselines/baseline.json', 'utf8')) as unknown;
    const sim = parseSimStats(rep, base);
    // content-independent: real content will replace the placeholder card ids
    expect(sim.byCard.size).toBeGreaterThan(0);
    const [first] = [...sim.byCard.values()];
    expect(first.entries.length).toBeGreaterThan(0);
    expect(parseSimStats(undefined, base).byCard.size).toBeGreaterThan(0);
  });
});
