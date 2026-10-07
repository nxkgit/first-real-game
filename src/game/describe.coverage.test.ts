import { describe, expect, it } from 'vitest';
import { cardText, describeEffect, describeOutcome, describeRunEffect, relicText } from './describe';
import { intentIcons } from './intent';
import type { IntentIcon } from './intent';
import { buildRunReport, formatRunReport } from './runReport';
import type { CardDefinition, Effect, EnemyMove, EventOutcome, RelicDefinition, RunEffect } from './types';
import { CARDS } from '../data/cards';
import { RELICS } from '../data/relics';
import { EVENTS } from '../data/events';
import { ENEMIES } from '../data/enemies';
import { newRun } from '../data/run';

const card = (extra: Partial<CardDefinition>): CardDefinition => ({
  id: 'x',
  name: 'X',
  type: 'skill',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  ...extra,
});

describe('describeEffect', () => {
  it('damage and block', () => {
    expect(describeEffect({ kind: 'damage', value: 6 })).toBe('Deal 6 damage.');
    expect(describeEffect({ kind: 'block', value: 5 })).toBe('Gain 5 block.');
  });

  it('keeps the number even at zero or one (damage 1 is still "damage")', () => {
    expect(describeEffect({ kind: 'damage', value: 0 })).toBe('Deal 0 damage.');
    expect(describeEffect({ kind: 'damage', value: 1 })).toBe('Deal 1 damage.');
    expect(describeEffect({ kind: 'block', value: 0 })).toBe('Gain 0 block.');
  });

  it('draw: singular for 1, plural otherwise (including 0)', () => {
    expect(describeEffect({ kind: 'draw', value: 1 })).toBe('Draw 1 card.');
    expect(describeEffect({ kind: 'draw', value: 2 })).toBe('Draw 2 cards.');
    expect(describeEffect({ kind: 'draw', value: 0 })).toBe('Draw 0 cards.');
  });

  it('draw at turn start says "additional", singular and plural', () => {
    expect(describeEffect({ kind: 'draw', value: 1 }, { atTurnStart: true })).toBe('Draw 1 additional card.');
    expect(describeEffect({ kind: 'draw', value: 3 }, { atTurnStart: true })).toBe('Draw 3 additional cards.');
  });

  it('atTurnStart changes nothing for other kinds', () => {
    const e: Effect = { kind: 'block', value: 4 };
    expect(describeEffect(e, { atTurnStart: true })).toBe(describeEffect(e));
  });

  it('statuses: "Apply" to a target, "Gain" for yourself, with the status name', () => {
    expect(describeEffect({ kind: 'applyStatus', status: 'weak', value: 2, to: 'target' })).toBe('Apply 2 Weak.');
    expect(describeEffect({ kind: 'applyStatus', status: 'vulnerable', value: 1, to: 'target' })).toBe('Apply 1 Vulnerable.');
    expect(describeEffect({ kind: 'applyStatus', status: 'strength', value: 3, to: 'self' })).toBe('Gain 3 Strength.');
  });
});

describe('cardText', () => {
  it('joins the effects in order, one sentence each', () => {
    expect(
      cardText(card({ effects: [{ kind: 'damage', value: 5 }, { kind: 'block', value: 5 }, { kind: 'draw', value: 1 }] }))
    ).toBe('Deal 5 damage. Gain 5 block. Draw 1 card.');
  });

  it('a power with a turn-start effect reads "At the start of each turn, ..." in lower case', () => {
    expect(cardText(card({ type: 'power', onTurnStartEffect: { kind: 'block', value: 4 } }))).toBe(
      'At the start of each turn, gain 4 block.'
    );
    expect(cardText(card({ type: 'power', onTurnStartEffect: { kind: 'draw', value: 1 } }))).toBe(
      'At the start of each turn, draw 1 additional card.'
    );
  });

  it('immediate effects come before the turn-start effect', () => {
    const t = cardText(
      card({ effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }], onTurnStartEffect: { kind: 'block', value: 1 } })
    );
    expect(t).toBe('Gain 2 Strength. At the start of each turn, gain 1 block.');
  });

  it('a card with no effects at all has empty text', () => {
    expect(cardText(card({}))).toBe('');
  });

  it('a description override wins, even when empty', () => {
    expect(cardText(card({ description: 'Custom.', effects: [{ kind: 'damage', value: 1 }] }))).toBe('Custom.');
    expect(cardText(card({ description: '', effects: [{ kind: 'damage', value: 1 }] }))).toBe('');
  });

  it('every registered card has non-empty text, and its text names every number it uses', () => {
    for (const c of Object.values(CARDS)) {
      const text = cardText(c);
      expect(text, c.id).not.toBe('');
      const effects = [...(c.effects ?? []), ...(c.onTurnStartEffect ? [c.onTurnStartEffect] : [])];
      for (const e of effects) expect(text, c.id).toContain(String(e.value));
    }
  });

  it('an upgraded card shows its own (upgraded) numbers, not the base ones', () => {
    for (const c of Object.values(CARDS)) {
      if (!c.upgradeOf) continue;
      const base = CARDS[c.upgradeOf];
      if (JSON.stringify(base.effects) === JSON.stringify(c.effects) && JSON.stringify(base.onTurnStartEffect) === JSON.stringify(c.onTurnStartEffect)) continue;
      expect(cardText(c), c.id).not.toBe(cardText(base));
    }
  });
});

describe('run-effect, relic and outcome text', () => {
  it('describeRunEffect covers every kind', () => {
    const cases: [RunEffect, string][] = [
      [{ kind: 'maxHp', value: 10 }, 'Gain 10 max HP.'],
      [{ kind: 'heal', value: 4 }, 'Heal 4 HP.'],
      [{ kind: 'gold', value: 25 }, 'Gain 25 gold.'],
    ];
    for (const [e, text] of cases) expect(describeRunEffect(e)).toBe(text);
  });

  const relic = (extra: Partial<RelicDefinition>): RelicDefinition => ({ id: 'r', name: 'R', ...extra });

  it('each relic hook has its own lead-in', () => {
    expect(relicText(relic({ onPickup: [{ kind: 'maxHp', value: 10 }] }))).toBe('Gain 10 max HP.');
    expect(relicText(relic({ onVictory: [{ kind: 'heal', value: 4 }] }))).toBe('After each fight you win, heal 4 HP.');
    expect(relicText(relic({ onCombatStart: [{ kind: 'block', value: 6 }] }))).toBe('At the start of each fight, gain 6 block.');
    expect(relicText(relic({ onTurnStart: [{ kind: 'draw', value: 1 }] }))).toBe('At the start of each turn, draw 1 additional card.');
  });

  it('several effects in one hook are joined, and several hooks are joined in a fixed order', () => {
    const text = relicText(
      relic({
        onTurnStart: [{ kind: 'block', value: 1 }],
        onPickup: [{ kind: 'gold', value: 5 }],
        onCombatStart: [{ kind: 'block', value: 2 }, { kind: 'draw', value: 2 }],
      })
    );
    expect(text).toBe(
      'Gain 5 gold. At the start of each fight, gain 2 block. draw 2 cards. At the start of each turn, gain 1 block.'
    );
  });

  it('a relic with nothing to do has empty text; a description override wins', () => {
    expect(relicText(relic({}))).toBe('');
    expect(relicText(relic({ description: 'Hand-written.', onPickup: [{ kind: 'gold', value: 1 }] }))).toBe('Hand-written.');
  });

  it('every registered relic and event outcome has non-empty text', () => {
    for (const r of Object.values(RELICS)) expect(relicText(r), r.id).not.toBe('');
    for (const ev of Object.values(EVENTS)) {
      for (const choice of ev.choices) for (const o of choice.outcomes) expect(describeOutcome(o), ev.id).not.toBe('');
    }
  });

  it('describeOutcome: signs, zero, and each kind', () => {
    const cases: [EventOutcome, string][] = [
      [{ kind: 'gold', value: 60 }, 'Gain 60 gold.'],
      [{ kind: 'gold', value: -50 }, 'Lose 50 gold.'],
      [{ kind: 'gold', value: 0 }, 'Gain 0 gold.'],
      [{ kind: 'hp', value: 15 }, 'Heal 15 HP.'],
      [{ kind: 'hp', value: -8 }, 'Lose 8 HP.'],
      [{ kind: 'maxHp', value: 8 }, 'Gain 8 max HP.'],
      [{ kind: 'maxHp', value: -3 }, 'Lose 3 max HP.'],
      [{ kind: 'card', cardId: 'strike' }, 'Add Strike to your deck.'],
      [{ kind: 'randomCard' }, 'Add a random card to your deck.'],
      [{ kind: 'relic' }, 'Gain a random relic.'],
      [{ kind: 'fight', enemies: ['enemy-a'] }, 'Fight Enemy A.'],
      [{ kind: 'fight', enemies: ['enemy-a', 'enemy-d'] }, 'Fight Enemy A and Enemy D.'],
    ];
    for (const [o, text] of cases) expect(describeOutcome(o)).toBe(text);
  });

  it('describeOutcome on an unknown card or enemy throws rather than printing nonsense', () => {
    expect(() => describeOutcome({ kind: 'card', cardId: 'nope' })).toThrow();
    expect(() => describeOutcome({ kind: 'fight', enemies: ['nope'] })).toThrow();
  });
});

describe('intentIcons', () => {
  const move = (...effects: Effect[]): EnemyMove => ({ name: 'm', effects });
  const icons = (...effects: Effect[]): IntentIcon[] => intentIcons(move(...effects));

  it('maps each effect kind to its icon', () => {
    expect(icons({ kind: 'damage', value: 1 })).toEqual(['attack']);
    expect(icons({ kind: 'block', value: 1 })).toEqual(['defend']);
    expect(icons({ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' })).toEqual(['buff']);
    expect(icons({ kind: 'applyStatus', status: 'weak', value: 1, to: 'target' })).toEqual(['debuff']);
  });

  it('weak on yourself is still a buff icon, strength on the player a debuff: the icon follows who receives it', () => {
    expect(icons({ kind: 'applyStatus', status: 'weak', value: 1, to: 'self' })).toEqual(['buff']);
    expect(icons({ kind: 'applyStatus', status: 'strength', value: 1, to: 'target' })).toEqual(['debuff']);
  });

  it('a move with no effects, or only a draw, shows no icon', () => {
    expect(icons()).toEqual([]);
    expect(icons({ kind: 'draw', value: 2 })).toEqual([]);
  });

  it('repeated effects show their icon once (a multi-hit is one attack icon)', () => {
    expect(icons({ kind: 'damage', value: 2 }, { kind: 'damage', value: 2 }, { kind: 'damage', value: 2 })).toEqual(['attack']);
  });

  it('combined moves come out in a fixed order regardless of effect order', () => {
    const all = icons(
      { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
      { kind: 'applyStatus', status: 'strength', value: 1, to: 'self' },
      { kind: 'block', value: 1 },
      { kind: 'damage', value: 1 }
    );
    expect(all).toEqual(['attack', 'defend', 'buff', 'debuff']);
  });

  it('every enemy move in the data gets at least one icon (nothing the player cannot see coming)', () => {
    for (const e of Object.values(ENEMIES)) for (const m of e.movePattern) expect(intentIcons(m), `${e.id}/${m.name}`).not.toEqual([]);
  });
});

describe('runReport', () => {
  it('reports a fresh run as in progress with the starter deck counted by id', () => {
    const run = newRun(5);
    const r = buildRunReport(run);
    expect(r.version).toBe(2);
    expect(r.seed).toBe(5);
    expect(r.result).toBe('in progress');
    expect(r.floorReached).toBe(0);
    expect(r.totalFloors).toBe(run.totalFloors);
    expect(r.gold).toBe(0);
    expect(r.deckSize).toBe(run.deck.length);
    expect(Object.values(r.deck).reduce((a, b) => a + b, 0)).toBe(run.deck.length);
    expect(r.deck['strike']).toBe(run.deck.filter((c) => c.id === 'strike').length);
    expect(r.relics).toEqual([]);
    expect(r.history).toEqual([]);
  });

  it('maps phase won/lost to the result, and anything else to in progress', () => {
    const run = newRun(5);
    for (const [phase, result] of [['won', 'won'], ['lost', 'lost'], ['map', 'in progress'], ['inNode', 'in progress'], ['reward', 'in progress']] as const) {
      run.phase = phase;
      expect(buildRunReport(run).result).toBe(result);
    }
  });

  it('counts duplicates and lists relic ids', () => {
    const run = newRun(5);
    run.deck.push(run.deck[0]);
    run.relics.push(RELICS['guard-token'], RELICS['draw-token']);
    const r = buildRunReport(run);
    expect(r.deck[run.deck[0].id]).toBe(run.deck.filter((c) => c.id === run.deck[0].id).length);
    expect(r.relics).toEqual(['guard-token', 'draw-token']);
  });

  it('is a snapshot: later changes to the run do not alter an earlier report', () => {
    const run = newRun(5);
    run.chooseNode(run.mapChoices[0].id);
    run.finishCombat('won', 40, 4);
    const r = buildRunReport(run);
    const before = JSON.stringify(r);
    run.history[0].kind === 'combat' && ((run.history[0] as { turns: number }).turns = 99);
    run.gold = 999;
    expect(JSON.stringify(r)).toBe(before);
    expect(r.history[0]).toMatchObject({ kind: 'combat', turns: 4, result: 'won' });
  });

  it('formatRunReport is JSON that round-trips', () => {
    const run = newRun(5);
    const report = buildRunReport(run);
    const text = formatRunReport(report);
    expect(JSON.parse(text)).toEqual(report);
    expect(text).toContain('\n'); // pretty-printed for pasting
  });
});
