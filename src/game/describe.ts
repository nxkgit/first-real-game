import type { CardDefinition, Effect } from './types';
import { STATUSES } from '../data/statuses';

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * One effect as a short sentence, e.g. "Deal 6 damage." Card text is generated from the effects so
 * the numbers can never drift from what the card really does. `atTurnStart` is for powers, where
 * a draw is on top of the normal hand.
 */
export function describeEffect(effect: Effect, opts: { atTurnStart?: boolean } = {}): string {
  switch (effect.kind) {
    case 'damage':
      return `Deal ${effect.value} damage.`;
    case 'block':
      return `Gain ${effect.value} block.`;
    case 'draw':
      return opts.atTurnStart ? `Draw ${effect.value} additional ${effect.value === 1 ? 'card' : 'cards'}.` : `Draw ${plural(effect.value, 'card')}.`;
    case 'applyStatus': {
      const name = STATUSES[effect.status].name;
      return effect.to === 'self' ? `Gain ${effect.value} ${name}.` : `Apply ${effect.value} ${name}.`;
    }
  }
}

/** The text on a card's face: its `description` if it has one, otherwise generated from its effects. */
export function cardText(card: CardDefinition): string {
  if (card.description !== undefined) return card.description;
  const parts = (card.effects ?? []).map((effect) => describeEffect(effect));
  if (card.onTurnStartEffect) {
    const text = describeEffect(card.onTurnStartEffect, { atTurnStart: true });
    parts.push(`At the start of each turn, ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
  }
  return parts.join(' ');
}
