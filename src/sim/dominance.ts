import { baseCards } from '../data/cards';
import type { CardDefinition, Effect } from '../game/types';
import { heading, table } from './report';
import type { ExperimentResult } from './report';

/**
 * Static dominance check: card A is STRICTLY DOMINATED by card B when B costs no more, has the same
 * type and targeting, is at least as good in every component the card has (damage, block, draw,
 * energy, statuses put on the target or on self) and strictly better in at least one. Only cards
 * made of plain effects are compared: anything with scaling, triggers, exhaust, self-damage or a
 * multiplier is context-dependent and left out (the simulator's `cards` / `pairs` cover those).
 * This is arithmetic on the card data, not a measurement: a dominated card can still be an
 * interesting choice if it is meant to be a cheaper, earlier-in-the-run version, but it is never
 * a good pick next to its dominator.
 */

type Components = Map<string, number>;

/** null when the card is not plain enough to compare. */
function componentsOf(card: CardDefinition): Components | null {
  if (card.exhaust || card.triggers || (card.tags && card.tags.length > 0)) return null;
  const out: Components = new Map();
  const add = (key: string, v: number): void => void out.set(key, (out.get(key) ?? 0) + v);
  const read = (e: Effect, prefix: string): boolean => {
    if (e.kind === 'multiplyStatus' || e.kind === 'exhaustRandom' || e.kind === 'loseHp') return false;
    if ('scaling' in e && e.scaling) return false;
    if (e.kind === 'applyStatus') add(`${prefix}${e.to}:${e.status}`, e.value);
    else add(`${prefix}${e.kind}`, e.value);
    return true;
  };
  for (const e of card.effects ?? []) if (!read(e, '')) return null;
  if (card.onTurnStartEffect && !read(card.onTurnStartEffect, 'each-turn:')) return null;
  return out;
}

export interface DominancePair {
  dominated: string;
  by: string;
  note: string;
}

export function dominancePairs(cards: CardDefinition[] = baseCards()): DominancePair[] {
  const comps = new Map<string, Components | null>(cards.map((c) => [c.id, componentsOf(c)]));
  const out: DominancePair[] = [];
  for (const a of cards) {
    for (const b of cards) {
      if (a.id === b.id) continue;
      const ca = comps.get(a.id);
      const cb = comps.get(b.id);
      if (!ca || !cb || ca.size === 0 || cb.size === 0) continue;
      if (a.type !== b.type || a.target !== b.target) continue;
      if (b.cost > a.cost) continue;
      let betterSomewhere = b.cost < a.cost;
      let ok = true;
      for (const key of new Set([...ca.keys(), ...cb.keys()])) {
        const va = ca.get(key) ?? 0;
        const vb = cb.get(key) ?? 0;
        if (vb < va) {
          ok = false;
          break;
        }
        if (vb > va) betterSomewhere = true;
      }
      if (ok && betterSomewhere) out.push({ dominated: a.id, by: b.id, note: `${b.id} costs ${b.cost} vs ${a.cost}` });
    }
  }
  return out;
}

export function dominanceExperiment(): ExperimentResult & { pairs: DominancePair[] } {
  const pairs = dominancePairs();
  const markdown = [
    heading(2, 'Strict dominance (static)'),
    '',
    'Card A is strictly dominated by card B when B costs no more, has the same type and targeting, is at least as good in every component (damage, block, draw, energy, statuses) and strictly better in one. Only plain cards are compared (no scaling, triggers, tags, exhaust or self-damage). This is arithmetic on the card data, not a measurement.',
    '',
    pairs.length ? table(['dominated card', 'dominated by', 'note'], pairs.map((p) => [p.dominated, p.by, p.note])) : '_No plain card is strictly dominated by another._',
    '',
  ].join('\n');
  return { name: 'dominance', json: { pairs }, markdown, pairs };
}
