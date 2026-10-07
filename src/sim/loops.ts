import type { CardDefinition } from '../game/types';
import { dummyRun, summarizeDeck } from './combos';
import { heading, table } from './report';
import type { ExperimentResult } from './report';
import type { SkillLevel } from './skills';
import { fix } from './stats';

/** Exhaustive search of tiny decks for free-play loops. */

export interface LoopsOptions {
  cards: CardDefinition[];
  /** Largest deck tried. Up to 5 cards the whole deck is the opening hand, so the result does not depend on the shuffle. */
  maxSize: number;
  maxCopies: number;
  /** A turn with at least this many plays counts as a loop (an honest turn tops out around 10). */
  threshold: number;
  skill: SkillLevel;
  seed: number;
  /** Turns played per deck. */
  turns: number;
}

export interface LoopHit {
  cards: string[];
  maxPlays: number;
  damageT1: number;
  damageTotal: number;
}

/** Every multiset of up to `maxSize` cards (at most `maxCopies` of each) that makes the bot play `threshold`+ cards in one turn; minimal ones only. */
export function loopsExperiment(opts: LoopsOptions): ExperimentResult & { hits: LoopHit[]; tried: number } {
  const n = opts.cards.length;
  const counts = new Array<number>(n).fill(0);
  const found: { counts: number[]; hit: LoopHit }[] = [];
  let tried = 0;
  const contains = (big: number[], small: number[]): boolean => small.every((c, i) => c <= big[i]);
  const visit = (size: number): void => {
    if (size < 2) return;
    // a deck that already contains a known loop is not minimal
    if (found.some((f) => contains(counts, f.counts))) return;
    tried++;
    const deck: CardDefinition[] = [];
    counts.forEach((c, i) => {
      for (let k = 0; k < c; k++) deck.push(opts.cards[i]);
    });
    const r = dummyRun(deck, opts.seed, opts.skill, opts.turns);
    const maxPlays = Math.max(...r.plays);
    if (maxPlays >= opts.threshold) {
      found.push({ counts: [...counts], hit: { cards: summarizeDeck(deck).split(', '), maxPlays, damageT1: r.damage[0], damageTotal: r.damage.reduce((a, b) => a + b, 0) } });
    }
  };
  const rec = (i: number, size: number): void => {
    if (i === n) {
      visit(size);
      return;
    }
    for (let c = 0; c <= opts.maxCopies && size + c <= opts.maxSize; c++) {
      counts[i] = c;
      rec(i + 1, size + c);
    }
    counts[i] = 0;
  };
  rec(0, 0);
  const hits = found.map((f) => f.hit).sort((a, b) => a.cards.length - b.cards.length || b.damageTotal - a.damageTotal);
  const markdown = [
    heading(2, 'Loop finder (exhaustive, small decks)'),
    '',
    `Every deck of 2-${opts.maxSize} cards (at most ${opts.maxCopies} copies of a card) from ${n} cards (${tried} decks tried: a deck that already contains a smaller loop is skipped, so the list below is the MINIMAL loops). Each deck plays ${opts.turns} turns against a Dummy with the ${opts.skill} bot; a deck is a loop if some turn has ${opts.threshold}+ plays (an honest turn tops out near 10; the bots stop at 50-60). For decks of up to 5 cards the whole deck is the opening hand, so the result does not depend on the shuffle. Deterministic (seed ${opts.seed}).`,
    '',
    hits.length ? table(['loop core', 'plays in a turn (max)', 'damage turn 1', `damage in ${opts.turns} turns`], hits.map((h) => [h.cards.join(', '), h.maxPlays, fix(h.damageT1, 0), fix(h.damageTotal, 0)])) : '_No loops found._',
    '',
  ].join('\n');
  return {
    name: 'loops',
    json: { options: { maxSize: opts.maxSize, maxCopies: opts.maxCopies, threshold: opts.threshold, skill: opts.skill, seed: opts.seed, turns: opts.turns, universe: opts.cards.map((c) => c.id) }, tried, hits },
    markdown,
    hits,
    tried,
  };
}
