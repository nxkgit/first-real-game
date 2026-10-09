import { describe, expect, it } from 'vitest';
import { newRun } from '../data/run';
import { HERO_CARD_WEIGHT } from '../data/tunables';
import { rewardPoolFor, MAGE } from '../data/cards';

// User, 2026-10-08: Mage cards should be offered about 1.5x as often as neutral ones.
describe('reward weighting', () => {
  it('offers each hero card about HERO_CARD_WEIGHT times as often as each neutral card, and never repeats within one offer', () => {
    const pool = rewardPoolFor(MAGE);
    const heroCount = pool.filter((c) => c.owner !== 'neutral').length;
    const neutralCount = pool.length - heroCount;
    expect(heroCount).toBeGreaterThan(0);
    expect(neutralCount).toBeGreaterThan(0);

    let hero = 0;
    let neutral = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      const run = newRun(seed);
      const offer = (run as unknown as { rollCards(n: number): { id: string; owner: string }[] }).rollCards(3);
      expect(new Set(offer.map((c) => c.id)).size).toBe(offer.length);
      for (const c of offer) (c.owner === 'neutral' ? neutral++ : hero++);
    }
    const perHeroCard = hero / heroCount;
    const perNeutralCard = neutral / neutralCount;
    expect(perHeroCard / perNeutralCard).toBeGreaterThan(HERO_CARD_WEIGHT * 0.85);
    expect(perHeroCard / perNeutralCard).toBeLessThan(HERO_CARD_WEIGHT * 1.15);
  });
});
