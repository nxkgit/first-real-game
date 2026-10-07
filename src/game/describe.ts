import type { CardDefinition, Effect, EventOutcome, RelicDefinition, RunEffect } from './types';
import { STATUSES } from '../data/statuses';
import { getCard } from '../data/cards';
import { getEnemy } from '../data/enemies';

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

// ---- relics and events ----

export function describeRunEffect(effect: RunEffect): string {
  switch (effect.kind) {
    case 'maxHp':
      return `Gain ${effect.value} max HP.`;
    case 'heal':
      return `Heal ${effect.value} HP.`;
    case 'gold':
      return `Gain ${effect.value} gold.`;
  }
}

const lowerFirst = (text: string): string => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

/** A relic's text: its `description` if it has one, otherwise generated from its effects. */
export function relicText(relic: RelicDefinition): string {
  if (relic.description !== undefined) return relic.description;
  const parts: string[] = [];
  for (const effect of relic.onPickup ?? []) parts.push(describeRunEffect(effect));
  if (relic.onVictory?.length) {
    parts.push(`After each fight you win, ${relic.onVictory.map((e) => lowerFirst(describeRunEffect(e))).join(' ')}`);
  }
  if (relic.onCombatStart?.length) {
    parts.push(`At the start of each fight, ${relic.onCombatStart.map((e) => lowerFirst(describeEffect(e))).join(' ')}`);
  }
  if (relic.onTurnStart?.length) {
    parts.push(
      `At the start of each turn, ${relic.onTurnStart.map((e) => lowerFirst(describeEffect(e, { atTurnStart: true }))).join(' ')}`
    );
  }
  return parts.join(' ');
}

/** One event outcome as a short phrase, e.g. "Lose 8 HP." */
export function describeOutcome(outcome: EventOutcome): string {
  switch (outcome.kind) {
    case 'gold':
      return outcome.value >= 0 ? `Gain ${outcome.value} gold.` : `Lose ${-outcome.value} gold.`;
    case 'hp':
      return outcome.value >= 0 ? `Heal ${outcome.value} HP.` : `Lose ${-outcome.value} HP.`;
    case 'maxHp':
      return outcome.value >= 0 ? `Gain ${outcome.value} max HP.` : `Lose ${-outcome.value} max HP.`;
    case 'card':
      return `Add ${getCard(outcome.cardId).name} to your deck.`;
    case 'randomCard':
      return 'Add a random card to your deck.';
    case 'relic':
      return 'Gain a random relic.';
    case 'fight':
      return `Fight ${outcome.enemies.map((id) => getEnemy(id).name).join(' and ')}.`;
  }
}
