import { describe, expect, it } from 'vitest';
import { DECK_PRESETS } from './deckPresets';
import { CARDS, MAGE } from '../data/cards';
import { MAGE_CARDS } from '../data/mageCards';

describe('dev deck presets', () => {
  it('every card id is real and owned by the Mage (or neutral)', () => {
    for (const [key, preset] of Object.entries(DECK_PRESETS)) {
      expect(preset.cardIds.length, key).toBeGreaterThan(0);
      for (const id of preset.cardIds) {
        const card = CARDS[id];
        expect(card, `${key}: ${id}`).toBeDefined();
        expect([MAGE, 'neutral'], `${key}: ${id} owner`).toContain(card.owner);
      }
    }
  });

  it('"everything" preset has every one of the 20 fire/frost/Freeze cards exactly once', () => {
    const everything = DECK_PRESETS['mage-everything'].cardIds;
    expect(new Set(everything).size).toBe(everything.length);
    expect(everything.length).toBe(MAGE_CARDS.length);
    for (const card of MAGE_CARDS) expect(everything, card.id).toContain(card.id);
  });
});
