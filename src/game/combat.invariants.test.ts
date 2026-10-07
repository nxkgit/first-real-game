import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { Rng } from './rng';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { fuzzFight, pickOne, checkCombatInvariants, totalCards } from './invariantHarness';
import type { CardDefinition, EnemyDefinition, RelicDefinition } from './types';

// Seeded fuzzing of whole fights. Decks, enemies and relics are drawn from the registries, so
// content added later is covered with no edits here.

const ALL_CARDS = Object.values(CARDS);
const ALL_ENEMIES = Object.values(ENEMIES);
const ALL_RELICS = Object.values(RELICS);
const FIGHTS = 2500;

function scenario(seed: number): { deck: CardDefinition[]; enemies: EnemyDefinition[]; relics: RelicDefinition[]; player: { hp: number; maxHp: number } } {
  const rng = new Rng(seed * 2654435761);
  const deck: CardDefinition[] = [];
  // a guaranteed way to deal damage keeps the fight winnable in principle (so "always terminates" is a fair demand)
  const strike = CARDS['strike'];
  if (strike) deck.push(strike, strike);
  const size = 1 + Math.floor(rng.next() * 22);
  for (let i = 0; i < size; i++) deck.push(pickOne(rng, ALL_CARDS));
  const enemies = Array.from({ length: 1 + Math.floor(rng.next() * 3) }, () => pickOne(rng, ALL_ENEMIES));
  const relics = ALL_RELICS.filter(() => rng.next() < 0.25);
  const maxHp = 1 + Math.floor(rng.next() * 120);
  const hp = rng.next() < 0.3 ? maxHp : 1 + Math.floor(rng.next() * maxHp);
  return { deck, enemies, relics, player: { hp, maxHp } };
}

describe('combat fuzz', () => {
  it(`holds every invariant across ${FIGHTS} seeded random fights`, () => {
    let wins = 0;
    let losses = 0;
    let plays = 0;
    for (let seed = 1; seed <= FIGHTS; seed++) {
      const s = scenario(seed);
      try {
        const r = fuzzFight({ ...s, seed });
        if (r.phase === 'won') wins++;
        else losses++;
        plays += r.cardsPlayed;
      } catch (e) {
        throw new Error(`fight seed ${seed} (deck ${s.deck.map((c) => c.id).join(',')} vs ${s.enemies.map((x) => x.id).join(',')}): ${(e as Error).message}`);
      }
    }
    // the fuzz must actually exercise both outcomes and plenty of card plays, or it proves nothing
    expect(wins).toBeGreaterThan(FIGHTS * 0.05);
    expect(losses).toBeGreaterThan(FIGHTS * 0.05);
    expect(plays).toBeGreaterThan(FIGHTS * 3);
  });

  it('is deterministic: the same seed gives the same fight', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = scenario(seed);
      expect(fuzzFight({ ...s, seed })).toEqual(fuzzFight({ ...s, seed }));
    }
  });

  it('plays every card of the registry, upgraded or not, in a fight of its own', () => {
    for (const def of ALL_CARDS) {
      for (let seed = 1; seed <= 5; seed++) {
        try {
          fuzzFight({ deck: [def, def, def, def, def, def, ...(CARDS['strike'] ? [CARDS['strike'], CARDS['strike']] : [])], enemies: [ENEMIES['enemy-a'] ?? ALL_ENEMIES[0]], seed });
        } catch (e) {
          throw new Error(`card ${def.id}, seed ${seed}: ${(e as Error).message}`);
        }
      }
    }
  });

  it('survives every single enemy and every enemy group against a mixed deck', () => {
    for (const enemy of ALL_ENEMIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = scenario(seed);
        fuzzFight({ ...s, enemies: [enemy], seed });
        fuzzFight({ ...s, enemies: [enemy, enemy, enemy], seed });
      }
    }
  });

  it('keeps invariants when the player starts at 1 HP or the deck is tiny', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = scenario(seed);
      fuzzFight({ ...s, deck: s.deck.slice(0, 1), player: { hp: 1, maxHp: 1 }, seed });
      fuzzFight({ ...s, deck: [s.deck[0]], seed });
    }
  });

  it('refuses to start a fight with no enemies', () => {
    expect(() => new CombatState([CARDS['strike'] ?? ALL_CARDS[0]], [])).toThrow();
  });

  it('card counts stay constant through the first turn of a big deck (conservation sanity)', () => {
    const rng = new Rng(5);
    const c = new CombatState(ALL_CARDS, [ALL_ENEMIES[0]], { random: () => rng.next() });
    c.start();
    expect(totalCards(c)).toBe(ALL_CARDS.length);
    checkCombatInvariants(c, ALL_CARDS.length);
  });
});
