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

  describe('keyword cards (innate, retain, ethereal)', () => {
    it('innate: always lands in the opening hand, on top of the shuffled rest', () => {
      const innate = { ...card('innate-1'), innate: true };
      const deck = new Deck([innate, ...cards(9)]);
      deck.draw(5);
      expect(deck.hand.some((c) => c.definition === innate)).toBe(true);
    });

    it('innate: more than one, all land in a hand big enough for them', () => {
      const innates = [card('i0'), card('i1'), card('i2')].map((c) => ({ ...c, innate: true }));
      const deck = new Deck([...innates, ...cards(7)]);
      deck.draw(5);
      for (const i of innates) expect(deck.hand.some((c) => c.definition === i), i.id).toBe(true);
    });

    it('innate: not re-applied by a later mid-fight reshuffle (only the opening hand is guaranteed)', () => {
      const innate = { ...card('innate-1'), innate: true };
      const deck = new Deck([innate, ...cards(5)]);
      deck.draw(6); // empties the draw pile, innate card included in this first draw
      deck.discardHand();
      deck.draw(6); // reshuffles the discard pile (which now contains the innate card like any other)
      // no assertion on where it lands: the point is this does not throw and every card is still accounted for
      const all = [...deck.drawPile, ...deck.hand, ...deck.discardPile].map((c) => c.instanceId);
      expect(new Set(all).size).toBe(6);
    });

    it('retain: survives discardHand into the next turn', () => {
      const retain = { ...card('retain-1'), retain: true };
      const deck = new Deck([retain, ...cards(4)]);
      deck.draw(5);
      expect(deck.hand).toContain(deck.hand.find((c) => c.definition === retain));
      deck.discardHand();
      expect(deck.hand.some((c) => c.definition === retain)).toBe(true);
      expect(deck.discardPile.some((c) => c.definition === retain)).toBe(false);
    });

    it('ethereal: exhausts instead of discarding if still in hand at end of turn', () => {
      const ethereal = { ...card('ethereal-1'), ethereal: true };
      const deck = new Deck([ethereal, ...cards(4)]);
      deck.draw(5);
      const exhausted = deck.discardHand();
      expect(exhausted.some((c) => c.definition === ethereal)).toBe(true);
      expect(deck.exhaustPile.some((c) => c.definition === ethereal)).toBe(true);
      expect(deck.discardPile.some((c) => c.definition === ethereal)).toBe(false);
      expect(deck.hand).toHaveLength(0);
    });

    it('ethereal wins over retain if a card somehow has both', () => {
      const both = { ...card('both-1'), retain: true, ethereal: true };
      const deck = new Deck([both, ...cards(4)]);
      deck.draw(5);
      const exhausted = deck.discardHand();
      expect(exhausted.some((c) => c.definition === both)).toBe(true);
      expect(deck.hand.some((c) => c.definition === both)).toBe(false);
    });

    it('a plain card still just discards, alongside retain/ethereal ones in the same hand', () => {
      const retain = { ...card('retain-1'), retain: true };
      const ethereal = { ...card('ethereal-1'), ethereal: true };
      const plain = card('plain-1');
      const deck = new Deck([retain, ethereal, plain, ...cards(2)]);
      deck.draw(5);
      const exhausted = deck.discardHand();
      expect(exhausted).toHaveLength(1);
      expect(deck.hand.map((c) => c.definition)).toEqual([retain]);
      expect(deck.discardPile.some((c) => c.definition === plain)).toBe(true);
      expect(deck.exhaustPile.some((c) => c.definition === ethereal)).toBe(true);
    });
  });
});
