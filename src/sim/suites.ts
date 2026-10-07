import type { CardDefinition } from '../game/types';
import { Rng } from '../game/rng';
import { MAGE, baseCards, buildStarterDeck, rewardPoolFor, upgradedVersion } from '../data/cards';
import { ACT_CONTENT } from '../data/run';

/**
 * Fight suites and reference decks, derived from the registries (CARDS via baseCards(), the act's
 * encounter lists) rather than hardcoded ids, so new content is picked up automatically.
 */

export type Tier = 'normal' | 'elite' | 'boss';
export const TIERS: readonly Tier[] = ['normal', 'elite', 'boss'];

export interface FightDef {
  /** Enemy ids joined with '+', e.g. "enemy-b+enemy-d". Also the key results are stored under. */
  id: string;
  tier: Tier;
  enemies: string[];
}

const fightOf = (enemies: string[], tier: Tier): FightDef => ({ id: enemies.join('+'), tier, enemies });

/** Every distinct encounter the act can place, with its tier. */
export function actFights(): FightDef[] {
  const out = new Map<string, FightDef>();
  const add = (list: string[][], tier: Tier): void => {
    for (const enemies of list) if (!out.has(enemies.join('+'))) out.set(enemies.join('+'), fightOf(enemies, tier));
  };
  add(ACT_CONTENT.earlyEncounters, 'normal');
  add(ACT_CONTENT.encounters, 'normal');
  add(ACT_CONTENT.elites, 'elite');
  add(ACT_CONTENT.bosses, 'boss');
  return [...out.values()];
}

/** "all" (default), a tier name, or a comma list of encounters ("enemy-a,enemy-b+enemy-d"). */
export function parseFights(text: string | undefined): FightDef[] {
  const all = actFights();
  if (text === undefined || text === 'all') return all;
  if ((TIERS as readonly string[]).includes(text)) return all.filter((f) => f.tier === text);
  return text.split(',').map((id) => all.find((f) => f.id === id) ?? fightOf(id.split('+'), 'normal'));
}

// ---------- decks ----------

export interface DeckSet {
  name: string;
  description: string;
  decks: CardDefinition[][];
}

const baseIdOf = (c: CardDefinition): string => c.upgradeOf ?? c.id;

/** Cards that make up the starter deck, by id. */
export const starterIds = (): Set<string> => new Set(buildStarterDeck().map(baseIdOf));

/** Cards a deck can be built from for sampling: the reward pool, or (pool = 'all') every non-starter card. */
export function samplingPool(pool: 'reward' | 'all'): CardDefinition[] {
  if (pool === 'reward') return rewardPoolFor(MAGE);
  const starter = starterIds();
  return baseCards().filter((c) => !starter.has(c.id));
}

/**
 * Reference decks for "what a typical deck looks like at this point of the act". Sampled
 * deterministically (fixed seed), several per stage so no single odd deck decides a result.
 *   starter: the starter deck.
 *   mid: starter + 5 sampled cards (about floor 5-6).
 *   late: starter + 10 sampled cards, 3 cards upgraded (about floor 10+).
 */
export function referenceDeckSets(opts: { pool?: 'reward' | 'all'; samples?: number } = {}): DeckSet[] {
  const pool = samplingPool(opts.pool ?? 'reward');
  const samples = opts.samples ?? 3;
  const make = (extra: number, upgrades: number, seed: number): CardDefinition[] => {
    const rng = new Rng(seed);
    const deck = buildStarterDeck();
    const bag = [...pool];
    for (let i = 0; i < extra && pool.length > 0; i++) {
      if (bag.length === 0) bag.push(...pool);
      deck.push(bag.splice(Math.floor(rng.next() * bag.length), 1)[0]);
    }
    for (let u = 0; u < upgrades; u++) {
      const idx = deck.map((c, i) => (upgradedVersion(c) ? i : -1)).filter((i) => i >= 0);
      if (idx.length === 0) break;
      const pick = idx[Math.floor(rng.next() * idx.length)];
      deck[pick] = upgradedVersion(deck[pick]) as CardDefinition;
    }
    return deck;
  };
  const many = (extra: number, upgrades: number, seed: number): CardDefinition[][] =>
    Array.from({ length: samples }, (_, i) => make(extra, upgrades, seed + i * 101));
  return [
    { name: 'starter', description: 'the starter deck', decks: [buildStarterDeck()] },
    { name: 'mid', description: 'starter + 5 sampled cards', decks: many(5, 0, 5000) },
    { name: 'late', description: 'starter + 10 sampled cards, 3 upgraded', decks: many(10, 3, 9000) },
  ];
}

/** `card` added to the end of `deck`. */
export const withAdded = (deck: CardDefinition[], card: CardDefinition): CardDefinition[] => [...deck, card];

/** `card` in place of the first Strike-like filler: the deck's most common card (ties: the first listed). */
export function withReplaced(deck: CardDefinition[], card: CardDefinition): CardDefinition[] {
  const counts = new Map<string, number>();
  for (const c of deck) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  let filler = deck[0].id;
  for (const [id, n] of counts) if (n > (counts.get(filler) ?? 0)) filler = id;
  const out = [...deck];
  out[out.findIndex((c) => c.id === filler)] = card;
  return out;
}

/** A short key for a deck (order matters: order feeds the shuffle). */
export const deckKey = (deck: CardDefinition[]): string => deck.map((c) => c.id).join(',');
