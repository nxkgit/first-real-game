import { describe, expect, it } from 'vitest';
import type { CardDefinition, EnemyDefinition, EventDefinition, RelicDefinition } from '../game/types';
import { countBySeverity, formatIssues, median, validateContent } from './validate';
import type { ContentWorld, Issue } from './validate';
import { realWorld } from './world';

// A tiny clean world to break one thing at a time. Cards are built so that nothing but the thing
// under test is wrong.

const card = (id: string, extra: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id.toUpperCase(),
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: 'hero',
  inRewardPool: true,
  effects: [{ kind: 'damage', value: 6 }],
  upgrade: { effects: [{ kind: 'damage', value: 9 }] },
  ...extra,
});

const upgraded = (c: CardDefinition): CardDefinition => {
  const { upgrade, ...rest } = c;
  return { ...rest, ...upgrade, id: `${c.id}+`, name: `${c.name}+`, upgradeOf: c.id, inRewardPool: false };
};

const enemy = (id: string, extra: Partial<EnemyDefinition> = {}): EnemyDefinition => ({
  id,
  name: id.toUpperCase(),
  maxHp: 40,
  movePattern: [{ name: 'Hit', effects: [{ kind: 'damage', value: 8 }] }],
  ...extra,
});

const relic = (id: string, extra: Partial<RelicDefinition> = {}): RelicDefinition => ({
  id,
  name: id.toUpperCase(),
  onCombatStart: [{ kind: 'block', value: 4 }],
  ...extra,
});

const event = (id: string, extra: Partial<EventDefinition> = {}): EventDefinition => ({
  id,
  title: id.toUpperCase(),
  text: 'Some text.',
  choices: [
    { label: 'Pay', outcomes: [{ kind: 'gold', value: -10 }] },
    { label: 'Leave', outcomes: [] },
  ],
  ...extra,
});

function world(overrides: { cards?: CardDefinition[]; enemies?: EnemyDefinition[]; relics?: RelicDefinition[]; events?: EventDefinition[]; pool?: boolean } = {}): ContentWorld {
  const cards = overrides.cards ?? ['a', 'b', 'c', 'd'].map((id) => card(id, { cost: 1 }));
  const registry: Record<string, CardDefinition> = {};
  for (const c of cards) {
    registry[c.id] = c;
    if (c.upgrade) registry[`${c.id}+`] = upgraded(c);
  }
  const enemies = overrides.enemies ?? [enemy('e1'), enemy('e2'), enemy('e3'), enemy('e4')];
  const relics = overrides.relics ?? [relic('r1')];
  const events = overrides.events ?? [event('ev1')];
  const real = realWorld();
  return {
    cards,
    registry,
    starterDeck: cards.slice(0, 1),
    rewardPool: cards.filter((c) => c.inRewardPool),
    testCardIds: new Set(),
    testRelicIds: new Set(),
    relics,
    relicPool: overrides.pool === false ? [] : relics,
    enemies: Object.fromEntries(enemies.map((e) => [e.id, e])),
    events: Object.fromEntries(events.map((e) => [e.id, e])),
    statuses: real.statuses,
    act: { earlyEncounters: [['e1']], encounters: [['e2'], ['e3', 'e4']], elites: [['e2']], bosses: [['e3']], events: events.map((e) => e.id) },
    playerMaxHp: 60,
    maxEnergy: 4,
  };
}

const codes = (issues: Issue[], severity?: string): string[] => issues.filter((i) => !severity || i.severity === severity).map((i) => i.code);
const find = (issues: Issue[], code: string): Issue | undefined => issues.find((i) => i.code === code);

describe('content validation: the real content', () => {
  it('has no errors and no warnings (notes are allowed)', () => {
    const issues = validateContent(realWorld());
    expect(issues.filter((i) => i.severity !== 'info').map((i) => `${i.kind} ${i.id}: ${i.message}`)).toEqual([]);
  });

  it('every issue has a message and a fix', () => {
    for (const i of validateContent(realWorld())) {
      expect(i.message.length).toBeGreaterThan(5);
      expect(i.fix.length).toBeGreaterThan(5);
    }
  });
});

describe('content validation: the fixture world is clean', () => {
  it('reports nothing above a note', () => {
    expect(validateContent(world()).filter((i) => i.severity !== 'info')).toEqual([]);
  });
});

describe('content validation: cards', () => {
  it('flags an unknown status id', () => {
    const bad = card('bad', { effects: [{ kind: 'applyStatus', status: 'nope' as never, value: 1, to: 'target' }], upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, bad] }));
    expect(find(issues, 'unknown-status')?.fix).toContain('weak');
    expect(codes(issues, 'error')).toContain('text-throws');
  });

  it('flags scaling on an effect that cannot scale', () => {
    const bad = card('bad', {
      effects: [{ kind: 'exhaustRandom', value: 1, scaling: { per: 'block', value: 1 } } as never],
      type: 'skill',
      target: undefined,
      upgrade: undefined,
    });
    expect(codes(validateContent(world({ cards: [...world().cards, bad] })), 'error')).toContain('scaling-unsupported');
  });

  it('flags scaling per tag with no tag, a bad source, and a stray tag', () => {
    const missing = card('m', { effects: [{ kind: 'damage', value: 1, scaling: { per: 'taggedPlayedThisTurn', value: 2 } }], upgrade: undefined });
    const badSource = card('s', { effects: [{ kind: 'damage', value: 1, scaling: { per: 'nope' as never, value: 2 } }], upgrade: undefined });
    const stray = card('t', { effects: [{ kind: 'damage', value: 1, scaling: { per: 'block', tag: 'x', value: 2 } }], upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, missing, badSource, stray] }));
    expect(codes(issues)).toEqual(expect.arrayContaining(['scaling-missing-tag', 'unknown-scale-source', 'scaling-stray-tag']));
  });

  it('flags a trigger with no effects, on a non-power card, with an unknown event and filter mistakes', () => {
    const noEffects = card('p', { type: 'power', target: undefined, effects: undefined, triggers: [{ on: 'turnStart', effects: [] }], upgrade: undefined });
    const notPower = card('q', { triggers: [{ on: 'hpLost', tag: 'zzz', effects: [{ kind: 'block', value: 2 }] }], upgrade: undefined });
    const unknown = card('u', { type: 'power', target: undefined, effects: undefined, triggers: [{ on: 'nope' as never, effects: [{ kind: 'block', value: 2 }] }], upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, noEffects, notPower, unknown] }));
    expect(codes(issues)).toEqual(expect.arrayContaining(['trigger-no-effect', 'trigger-not-power', 'trigger-stray-filter', 'trigger-unknown-tag', 'unknown-trigger']));
  });

  it('flags missing upgrades, upgrades that change nothing, and empty text', () => {
    const none = card('n', { upgrade: undefined });
    const same = card('same', { upgrade: { effects: [{ kind: 'damage', value: 6 }] } });
    const empty = card('empty', { effects: [], upgrade: undefined, type: 'skill', target: undefined });
    const issues = validateContent(world({ cards: [...world().cards, none, same, empty] }));
    expect(codes(issues, 'warning')).toContain('no-upgrade');
    expect(codes(issues, 'error')).toEqual(expect.arrayContaining(['upgrade-no-change', 'empty-text']));
    expect(find(issues, 'no-upgrade')?.fix).toContain('upgrade');
  });

  it('flags an aimed effect on a card that is not target enemy, and a cost the player can never pay', () => {
    const unaimed = card('un', { target: undefined, upgrade: undefined });
    const pricey = card('pricey', { cost: 9, upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, unaimed, pricey] }));
    expect(codes(issues, 'error')).toEqual(expect.arrayContaining(['missing-target', 'unplayable-cost']));
  });

  it('flags a card nobody can get, but not one in the starter deck, a pool, an event, or an engine test card', () => {
    const lonely = card('lonely', { inRewardPool: false });
    const test = card('testy', { inRewardPool: false });
    const given = card('given', { inRewardPool: false });
    const w = world({ cards: [...world().cards, lonely, test, given], events: [event('ev1', { choices: [{ label: 'Take', outcomes: [{ kind: 'card', cardId: 'given' }] }, { label: 'Leave', outcomes: [] }] })] });
    (w.testCardIds as Set<string>).add('testy');
    const issues = validateContent(w);
    const unreachable = issues.filter((i) => i.code === 'unreachable').map((i) => i.id);
    expect(unreachable).toEqual(['lonely']);
    expect(issues.some((i) => i.code === 'test-card' && i.id === 'testy')).toBe(true);
  });

  it('flags duplicate names and hand-written text', () => {
    const dup = card('dup', { name: 'A', upgrade: undefined, description: 'Hand written.' });
    const issues = validateContent(world({ cards: [...world().cards, dup] }));
    expect(codes(issues, 'warning')).toEqual(expect.arrayContaining(['duplicate-name', 'hand-written-text']));
  });

  it('flags a power with nothing to do and a number far above the rest of the cohort', () => {
    const idle = card('idle', { type: 'power', target: undefined, effects: undefined, upgrade: undefined });
    const huge = card('huge', { effects: [{ kind: 'damage', value: 999 }], upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, idle, huge] }));
    expect(codes(issues, 'error')).toContain('empty-power');
    expect(issues.find((i) => i.code === 'extreme-high')?.id).toBe('huge');
  });

  it('notes a tag that nothing reads', () => {
    const tagged = card('tagged', { tags: ['lonely-tag'], upgrade: undefined });
    expect(codes(validateContent(world({ cards: [...world().cards, tagged] })), 'info')).toContain('tag-unused');
  });
});

describe('content validation: relics', () => {
  it('flags a relic that does nothing, one outside the pool, and an empty pool', () => {
    const idle: RelicDefinition = { id: 'idle', name: 'Idle' };
    const w = world({ relics: [relic('r1'), idle] });
    const issues = validateContent({ ...w, relicPool: [w.relics[0]] });
    expect(codes(issues, 'error')).toContain('empty-text');
    expect(codes(issues, 'warning')).toContain('outside-pool');
    expect(codes(validateContent(world({ pool: false })), 'error')).toContain('empty-relic-pool');
  });

  it('flags a status that does not exist inside a relic trigger', () => {
    const bad = relic('bad', { onCombatStart: undefined, triggers: [{ on: 'turnStart', effects: [{ kind: 'applyStatus', status: 'nope' as never, value: 1, to: 'self' }] }] });
    expect(codes(validateContent(world({ relics: [relic('r1'), bad] })), 'error')).toContain('unknown-status');
  });
});

describe('content validation: enemies', () => {
  it('flags enemies that cannot act or show nothing', () => {
    const none = enemy('none', { movePattern: [] });
    const emptyMove = enemy('emptymove', { movePattern: [{ name: 'Nothing', effects: [] }] });
    const invisible = enemy('invisible', { movePattern: [{ name: 'Hidden', effects: [{ kind: 'draw', value: 1 }] }] });
    const issues = validateContent(world({ enemies: [enemy('e1'), enemy('e2'), enemy('e3'), enemy('e4'), none, emptyMove, invisible] }));
    expect(codes(issues, 'error')).toEqual(expect.arrayContaining(['no-moves', 'empty-move', 'invisible-intent', 'enemy-effect-ignored']));
    expect(find(issues, 'invisible-intent')?.message).toContain('intent');
  });

  it('flags scaling on an enemy move, a one-shot, bad hp and an enemy outside the act', () => {
    const odd = enemy('odd', { maxHp: 0, movePattern: [{ name: 'Big', effects: [{ kind: 'damage', value: 80, scaling: { per: 'block', value: 1 } }] }] });
    const issues = validateContent(world({ enemies: [enemy('e1'), enemy('e2'), enemy('e3'), enemy('e4'), odd] }));
    expect(codes(issues)).toEqual(expect.arrayContaining(['enemy-scaling-ignored', 'one-shot', 'bad-hp', 'not-in-act']));
  });

  it('flags act lists that name an unknown enemy', () => {
    const w = world();
    w.act.encounters.push(['ghost']);
    expect(find(validateContent(w), 'unknown-enemy')?.message).toContain('ghost');
  });
});

describe('content validation: events', () => {
  it('flags unknown ids, a trapped player and an event outside the act', () => {
    const trap = event('trap', { choices: [{ label: 'Pay', outcomes: [{ kind: 'hp', value: -5 }] }, { label: 'Fight', outcomes: [{ kind: 'fight', enemies: ['ghost'] }] }, { label: 'Gift', outcomes: [{ kind: 'card', cardId: 'ghost' }, { kind: 'gold', value: -1 }] }] });
    const w = world({ events: [event('ev1'), trap] });
    w.act.events.length = 0;
    w.act.events.push('ev1');
    const issues = validateContent(w);
    expect(codes(issues)).toEqual(expect.arrayContaining(['unknown-enemy', 'unknown-card', 'no-free-choice', 'not-in-act']));
  });

  it('flags an event with no choices and empty text', () => {
    const issues = validateContent(world({ events: [event('ev1', { choices: [], text: ' ' })] }));
    expect(codes(issues, 'error')).toEqual(expect.arrayContaining(['no-choices', 'empty-text']));
  });
});

describe('content validation: output', () => {
  it('sorts errors first and prints a fix under each issue', () => {
    const bad = card('bad', { effects: [], type: 'skill', target: undefined, upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, bad] }));
    expect(issues[0].severity).toBe('error');
    const text = formatIssues(issues);
    expect(text).toContain('Fix:');
    expect(text).toMatch(/\d+ error\(s\), \d+ warning\(s\), \d+ note\(s\)/);
    expect(countBySeverity(issues).error).toBeGreaterThan(0);
  });

  it('hides notes unless asked', () => {
    const tagged = card('tagged', { tags: ['lonely-tag'], upgrade: undefined });
    const issues = validateContent(world({ cards: [...world().cards, tagged] }));
    expect(formatIssues(issues)).not.toContain('INFO');
    expect(formatIssues(issues, { showInfo: true })).toContain('INFO');
  });

  it('median works', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});
