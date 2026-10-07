import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { card, FOE } from './testHelpers';
import { MAX_HAND_SIZE } from '../data/tunables';
import type { EnemyDefinition } from './types';

const IDLE: EnemyDefinition = { ...FOE, maxHp: 999, movePattern: [{ name: 'Idle', effects: [] }] };

describe('powers stay in play for the rest of the fight', () => {
  const power = card('pow', { type: 'power', onTurnStartEffect: { kind: 'applyStatus', status: 'strength', value: 1, to: 'self' } });

  it('a played power never returns to the hand over many turns, and fires once per turn', () => {
    const combat = new CombatState([power, ...Array.from({ length: 12 }, (_, i) => card(`f${i}`))], [IDLE]);
    combat.start();
    // find and play the power (it may not be in the first hand: cycle turns until it is)
    for (let i = 0; i < 6 && !combat.deck.hand.some((c) => c.definition.id === 'pow'); i++) combat.endPlayerTurn();
    const inHand = combat.deck.hand.find((c) => c.definition.id === 'pow');
    expect(inHand).toBeDefined();
    combat.playCard(inHand!.instanceId);
    expect(combat.deck.powerPile).toHaveLength(1);
    const strengthAfterPlay = combat.player.statuses.strength ?? 0;
    for (let turn = 1; turn <= 8; turn++) {
      combat.endPlayerTurn();
      expect(combat.deck.hand.some((c) => c.definition.id === 'pow')).toBe(false);
      expect(combat.deck.discardPile.some((c) => c.definition.id === 'pow')).toBe(false);
      expect(combat.player.statuses.strength).toBe(strengthAfterPlay + turn);
    }
  });

  it('a new fight starts with the power back in the deck', () => {
    const deck = [power, card('a'), card('b')];
    const first = new CombatState(deck, [IDLE]);
    first.start();
    for (const c of [...first.deck.hand]) first.playCard(c.instanceId);
    const second = new CombatState(deck, [IDLE]);
    second.start();
    expect(second.deck.hand.map((c) => c.definition.id).sort()).toEqual(['a', 'b', 'pow']);
  });
});

describe('hand size cap', () => {
  it('extra draws into a full hand go to the discard pile, not lost', () => {
    const draw = card('d', { effects: [{ kind: 'draw', value: 20 }] });
    const combat = new CombatState([draw, ...Array.from({ length: 29 }, (_, i) => card(`f${i}`))], [IDLE]);
    combat.start();
    while (!combat.deck.hand.some((c) => c.definition.id === 'd')) combat.endPlayerTurn();
    const total = () => combat.deck.drawPile.length + combat.deck.hand.length + combat.deck.discardPile.length;
    const before = total();
    combat.playCard(combat.deck.hand.find((c) => c.definition.id === 'd')!.instanceId);
    expect(combat.deck.hand.length).toBeLessThanOrEqual(MAX_HAND_SIZE);
    expect(total()).toBe(before);
  });
});

describe('combat-start block', () => {
  it('survives into the first turn, then resets as usual on the next', () => {
    const combat = new CombatState([card('a')], [IDLE], {
      relics: [{ id: 'r', name: 'r', onCombatStart: [{ kind: 'block', value: 6 }] }],
    });
    combat.start();
    expect(combat.player.block).toBe(6);
    combat.endPlayerTurn();
    expect(combat.player.block).toBe(0);
  });
});
