import { describe, expect, it } from 'vitest';
import { Deck } from './Deck';
import type { CardDefinition } from './types';

function card(id: string): CardDefinition {
  return { id, name: id, type: 'skill', cost: 1, owner: 'test', inRewardPool: false };
}

function cards(count: number): CardDefinition[] {
  return Array.from({ length: count }, (_, i) => card(`c${i}`));
}

describe('Deck', () => {
  it('starts with every card in the draw pile', () => {
    const deck = new Deck(cards(10));
    expect(deck.drawPile).toHaveLength(10);
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPile).toHaveLength(0);
  });

  it('gives every card a unique instance id, even duplicates of one definition', () => {
    const strike = card('strike');
    const deck = new Deck([strike, strike, strike]);
    const ids = new Set(deck.drawPile.map((c) => c.instanceId));
    expect(ids.size).toBe(3);
  });

  it('draws from the draw pile into the hand', () => {
    const deck = new Deck(cards(10));
    deck.draw(5);
    expect(deck.hand).toHaveLength(5);
    expect(deck.drawPile).toHaveLength(5);
  });

  it('shuffles the discard pile back in when the draw pile runs out mid-draw', () => {
    const deck = new Deck(cards(6));
    deck.draw(4);
    deck.discardHand();
    // 2 left in draw pile, 4 in discard: drawing 5 takes the 2, reshuffles, then takes 3 more
    deck.draw(5);
    expect(deck.hand).toHaveLength(5);
    expect(deck.drawPile).toHaveLength(1);
    expect(deck.discardPile).toHaveLength(0);
  });

  it('stops drawing when there are no cards left anywhere', () => {
    const deck = new Deck(cards(3));
    deck.draw(5);
    expect(deck.hand).toHaveLength(3);
    expect(deck.drawPile).toHaveLength(0);
  });

  it('moves a played card from hand to discard', () => {
    const deck = new Deck(cards(5));
    deck.draw(5);
    const played = deck.hand[2];
    expect(deck.playCard(played.instanceId)).toBe(played);
    expect(deck.hand).not.toContain(played);
    expect(deck.discardPile).toEqual([played]);
  });

  it('returns undefined when playing a card that is not in hand', () => {
    const deck = new Deck(cards(5));
    expect(deck.playCard('nope')).toBeUndefined();
  });

  it('discards the whole hand at end of turn', () => {
    const deck = new Deck(cards(5));
    deck.draw(5);
    deck.discardHand();
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPile).toHaveLength(5);
  });

  it('never loses or duplicates cards across many draw/discard cycles', () => {
    const deck = new Deck(cards(10));
    for (let turn = 0; turn < 20; turn++) {
      deck.draw(5);
      deck.playCard(deck.hand[0].instanceId);
      deck.discardHand();
      const all = [...deck.drawPile, ...deck.hand, ...deck.discardPile].map((c) => c.instanceId);
      expect(new Set(all).size).toBe(10);
      expect(all).toHaveLength(10);
    }
  });
});
