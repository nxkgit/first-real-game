import { describe, expect, it } from 'vitest';
import { cardText, describeEffect } from './describe';
import { intentIcons } from './intent';
import type { CardDefinition } from './types';
import { CARDS, MAGE, getCard, rewardPoolFor } from '../data/cards';
import { ENEMY_A, ENEMY_B, ENEMY_C, ENEMY_D } from '../data/enemies';

function card(partial: Partial<CardDefinition>): CardDefinition {
  return { id: 'x', name: 'X', type: 'skill', cost: 1, owner: 'test', inRewardPool: false, ...partial };
}

describe('card text', () => {
  it('generates one sentence per effect', () => {
    const text = cardText(
      card({
        effects: [
          { kind: 'damage', value: 5 },
          { kind: 'block', value: 5 },
        ],
      })
    );
    expect(text).toBe('Deal 5 damage. Gain 5 block.');
  });

  it('words draws and statuses naturally', () => {
    expect(describeEffect({ kind: 'draw', value: 1 })).toBe('Draw 1 card.');
    expect(describeEffect({ kind: 'draw', value: 2 })).toBe('Draw 2 cards.');
    expect(describeEffect({ kind: 'applyStatus', status: 'weak', value: 2, to: 'target' })).toBe('Apply 2 Weak.');
    expect(describeEffect({ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' })).toBe('Gain 2 Strength.');
  });

  it('describes a power by what it does each turn', () => {
    expect(cardText(card({ type: 'power', onTurnStartEffect: { kind: 'block', value: 4 } }))).toBe(
      'At the start of each turn, gain 4 block.'
    );
    expect(cardText(card({ type: 'power', onTurnStartEffect: { kind: 'draw', value: 1 } }))).toBe(
      'At the start of each turn, draw 1 additional card.'
    );
  });

  it('prefers a hand-written description when a card has one', () => {
    expect(cardText(card({ description: 'Custom.', effects: [{ kind: 'damage', value: 5 }] }))).toBe('Custom.');
  });
});

describe('enemy intent icons', () => {
  it('derives the icons from what the move does, in a fixed order', () => {
    expect(intentIcons({ name: 'm', effects: [{ kind: 'damage', value: 5 }] })).toEqual(['attack']);
    expect(intentIcons({ name: 'm', effects: [{ kind: 'block', value: 5 }] })).toEqual(['defend']);
    expect(
      intentIcons({ name: 'm', effects: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }] })
    ).toEqual(['buff']);
    expect(
      intentIcons({ name: 'm', effects: [{ kind: 'applyStatus', status: 'weak', value: 1, to: 'target' }] })
    ).toEqual(['debuff']);
    expect(
      intentIcons({
        name: 'm',
        effects: [
          { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
          { kind: 'damage', value: 5 },
        ],
      })
    ).toEqual(['attack', 'debuff']);
  });
});

describe('card registry', () => {
  it('looks cards up by id, and rejects an unknown id', () => {
    expect(getCard('strike')).toBe(CARDS['strike']);
    expect(() => getCard('nope')).toThrow();
  });

  it('keys every card by its own id', () => {
    for (const [id, c] of Object.entries(CARDS)) expect(c.id).toBe(id);
  });

  it('offers a hero only its own reward cards (and never starter-only ones)', () => {
    const pool = rewardPoolFor(MAGE);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((c) => c.inRewardPool && c.owner === MAGE)).toBe(true);
    expect(pool).not.toContain(getCard('strike'));
    expect(rewardPoolFor('someone-else')).toEqual([]);
  });

  it('every card is declared consistently: aimed exactly when an effect needs a target', () => {
    for (const c of Object.values(CARDS)) {
      const needsTarget = (c.effects ?? []).some(
        (e) => e.kind === 'damage' || (e.kind === 'applyStatus' && e.to === 'target')
      );
      expect(Boolean(c.target), `${c.id}: target`).toBe(needsTarget);
      expect(cardText(c).length, `${c.id}: text`).toBeGreaterThan(0);
    }
  });

  it('reads the way the old hand-written text did', () => {
    expect(cardText(getCard('strike'))).toBe('Deal 6 damage.');
    expect(cardText(getCard('guarded-strike'))).toBe('Deal 5 damage. Gain 5 block.');
    expect(cardText(getCard('sunder'))).toBe('Deal 8 damage. Apply 2 Vulnerable.');
    expect(cardText(getCard('focus'))).toBe('At the start of each turn, draw 1 additional card.');
  });
});

describe('enemy data', () => {
  it('never uses effects an enemy cannot perform', () => {
    for (const enemy of [ENEMY_A, ENEMY_B, ENEMY_C, ENEMY_D]) {
      for (const move of enemy.movePattern) {
        expect(
          move.effects.some((e) => e.kind === 'draw'),
          `${enemy.id}/${move.name}`
        ).toBe(false);
        expect(intentIcons(move).length, `${enemy.id}/${move.name}`).toBeGreaterThan(0);
      }
    }
  });
});
