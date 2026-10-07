import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STATUSES } from '../data/statuses';
import { CARD_TYPES, EFFECT_KINDS, EVENT_OUTCOME_KINDS, RUN_EFFECT_KINDS, SCALE_SOURCES, STATUS_IDS, TRIGGER_EVENTS } from './vocabulary';

// docs/CONTENT_GUIDE.md lists everything a content author can use. This test keeps that list honest:
// the names in the guide's marked lists must be EXACTLY the names in src/game/types.ts (read as
// text), and the vocabulary tables the content check uses must match too. If you add an effect
// kind, status, trigger event, scaling source or field and this test fails, update the marked list
// in the guide (and src/content/vocabulary.ts, which also fails to compile until you do).

// (checkouts on Windows may have CRLF line endings)
const readText = (path: string): string => readFileSync(path, 'utf8').split('\r\n').join('\n');
const guide = readText('docs/CONTENT_GUIDE.md');
const types = readText('src/game/types.ts');

/** The text between `<!-- names:KEY -->` and `<!-- /names -->`, as the first `backticked` name of each table row or bullet. */
function guideNames(key: string): string[] {
  const m = guide.match(new RegExp(`<!-- names:${key} -->([\\s\\S]*?)<!-- /names -->`));
  if (!m) throw new Error(`docs/CONTENT_GUIDE.md has no <!-- names:${key} --> block`);
  const names: string[] = [];
  for (const line of m[1].split('\n')) {
    if (!/^\s*(\||-|\*)/.test(line)) continue;
    const t = line.match(/`([^`]+)`/);
    if (t) names.push(t[1]);
  }
  return names;
}

/** The body of `export interface NAME {` ... `}` / `export type NAME =` ... blank line. */
function block(name: string): string {
  const iface = types.match(new RegExp(`export interface ${name} \\{\\n([\\s\\S]*?)\\n\\}`));
  if (iface) return iface[1];
  const alias = types.match(new RegExp(`export type ${name} =([\\s\\S]*?)\\n\\n`));
  if (alias) return alias[1];
  throw new Error(`types.ts has no ${name}`);
}

/** Property names declared at the top level (two-space indent) of an interface. */
function fieldsOf(name: string): string[] {
  return [...block(name).matchAll(/^ {2}(\w+)\??[:(]/gm)].map((m) => m[1]);
}

const unionStrings = (name: string): string[] => {
  const body = block(name);
  const lines = [...body.matchAll(/^\s*\| '(\w+)'/gm)].map((m) => m[1]);
  return lines.length > 0 ? lines : [...body.matchAll(/'(\w+)'/g)].map((m) => m[1]); // single-line union
};
const unionKinds = (name: string): string[] => [...block(name).matchAll(/\{ kind: '(\w+)'/g)].map((m) => m[1]);

/** Fields of the `upgrade?: { ... }` block inside CardDefinition (four-space indent). */
function upgradeFields(): string[] {
  const m = block('CardDefinition').match(/upgrade\?: \{\n([\s\S]*?)\n {2}\};/);
  if (!m) throw new Error('CardDefinition has no upgrade block');
  return [...m[1].matchAll(/^ {4}(\w+)\??:/gm)].map((x) => x[1]);
}

const sorted = (xs: string[]): string[] => [...xs].sort();

describe('the content guide matches the code', () => {
  const lists: [string, () => string[]][] = [
    ['effectKinds', () => unionKinds('Effect')],
    ['scaleSources', () => unionStrings('ScaleSource')],
    ['triggerEvents', () => unionStrings('TriggerOn')],
    ['statusIds', () => unionStrings('StatusId')],
    ['cardTypes', () => unionStrings('CardType')],
    ['runEffects', () => unionKinds('RunEffect')],
    ['eventOutcomes', () => unionKinds('EventOutcome')],
    ['card', () => fieldsOf('CardDefinition')],
    ['cardUpgrade', upgradeFields],
    ['scaling', () => fieldsOf('Scaling')],
    ['trigger', () => fieldsOf('Trigger')],
    ['enemy', () => fieldsOf('EnemyDefinition')],
    ['enemyMove', () => fieldsOf('EnemyMove')],
    ['relic', () => fieldsOf('RelicDefinition')],
    ['event', () => fieldsOf('EventDefinition')],
    ['eventChoice', () => fieldsOf('EventChoice')],
    ['status', () => fieldsOf('StatusDefinition')],
  ];

  it.each(lists)('lists exactly the real %s names', (key, fromCode) => {
    const inCode = fromCode();
    expect(inCode.length, `could not read ${key} from types.ts`).toBeGreaterThan(0);
    const inGuide = guideNames(key);
    expect(sorted(inGuide), `names:${key} in docs/CONTENT_GUIDE.md`).toEqual(sorted(inCode));
  });

  it('has no duplicate names within a list', () => {
    for (const [key] of lists) {
      const names = guideNames(key);
      expect(new Set(names).size, key).toBe(names.length);
    }
  });
});

describe('the vocabulary tables match the code', () => {
  it('cover exactly the union members in types.ts', () => {
    expect(sorted(Object.keys(EFFECT_KINDS))).toEqual(sorted(unionKinds('Effect')));
    expect(sorted(Object.keys(SCALE_SOURCES))).toEqual(sorted(unionStrings('ScaleSource')));
    expect(sorted(Object.keys(TRIGGER_EVENTS))).toEqual(sorted(unionStrings('TriggerOn')));
    expect(sorted(Object.keys(STATUS_IDS))).toEqual(sorted(unionStrings('StatusId')));
    expect(sorted(Object.keys(CARD_TYPES))).toEqual(sorted(unionStrings('CardType')));
    expect(sorted(Object.keys(RUN_EFFECT_KINDS))).toEqual(sorted(unionKinds('RunEffect')));
    expect(sorted(Object.keys(EVENT_OUTCOME_KINDS))).toEqual(sorted(unionKinds('EventOutcome')));
  });

  it('say that exactly the effects with a scaling field can scale', () => {
    const scalable = [...block('Effect').matchAll(/\{ kind: '(\w+)'[^}]*scaling\?: Scaling/g)].map((m) => m[1]);
    expect(sorted(Object.entries(EFFECT_KINDS).filter(([, v]) => v.scales).map(([k]) => k))).toEqual(sorted(scalable));
  });

  it('every status in the registry is a real StatusId and vice versa', () => {
    expect(sorted(Object.keys(STATUSES))).toEqual(sorted(unionStrings('StatusId')));
  });
});

describe('the guide itself', () => {
  it('names the commands and files an author needs', () => {
    for (const needle of ['npm run content:check', 'content.html', 'npm run balance', 'docs/BALANCE.md', 'src/data/tunables.ts', 'src/data/cards.ts']) {
      expect(guide, needle).toContain(needle);
    }
  });
});
