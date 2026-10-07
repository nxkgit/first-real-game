import type { CardDefinition, Effect, EventOutcome, RelicDefinition, RunEffect, ScaleSource, Trigger } from './types';
import { acceptsScaling, describeEffectWith } from './effects';
import type { DescribeOpts } from './effects';
import { getCard } from '../data/cards';
import { getEnemy } from '../data/enemies';

/**
 * One effect as a short sentence, e.g. "Deal 6 damage." Card text is generated from the effects so
 * the numbers can never drift from what the card really does. `atTurnStart` is for powers, where
 * a draw is on top of the normal hand.
 */
export function describeEffect(effect: Effect, opts: DescribeOpts = {}): string {
  const scaling = acceptsScaling(effect) && 'scaling' in effect ? effect.scaling : undefined;
  if (!scaling || !('value' in effect)) return plainEffect(effect, 'value' in effect ? effect.value : 0, opts);
  const unit = SCALE_UNIT[scaling.per](scaling.tag);
  // "Deal 4 damage. +3 for each card played earlier this turn." / "Deal 1 damage for each point of your block."
  if (effect.value > 0) return `${plainEffect(effect, effect.value, opts)} +${scaling.value} for each ${unit}.`;
  return `${plainEffect(effect, scaling.value, opts).replace(/\.$/, '')} for each ${unit}.`;
}

/** What one unit of each scaling source is called, for "for each ...". */
const SCALE_UNIT: Record<ScaleSource, (tag?: string) => string> = {
  cardsPlayedThisTurn: () => 'card played earlier this turn',
  attacksPlayedThisTurn: () => 'attack played earlier this turn',
  taggedPlayedThisTurn: (tag) => `${tag ?? '?'} card played earlier this turn`,
  block: () => 'point of your block',
  strength: () => 'point of your Strength',
  handSize: () => 'card in your hand',
  exhaustedThisCombat: () => 'card exhausted this combat',
  targetVulnerable: () => 'stack of Vulnerable on the target',
};

/** One effect with its number filled in as `n` (the scaling is described separately). The wording
 *  of each kind lives in its registry entry (effects.ts). */
const plainEffect = describeEffectWith;

const lowerFirst = (text: string): string => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

/** One trigger as a sentence, e.g. "Whenever you play an attack, gain 2 block. Once per turn." */
export function describeTrigger(trigger: Trigger): string {
  let when: string;
  switch (trigger.on) {
    case 'cardPlayed': {
      const kind = trigger.cardType ? `${trigger.tag ? `${trigger.tag} ` : ''}${trigger.cardType}` : trigger.tag ? `${trigger.tag} card` : 'card';
      when = `Whenever you play ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind}`;
      break;
    }
    case 'cardExhausted':
      when = 'Whenever a card is exhausted';
      break;
    case 'blockGained':
      when = 'Whenever you gain block';
      break;
    case 'enemyDied':
      when = 'Whenever an enemy dies';
      break;
    case 'hpLost':
      when = 'Whenever you lose HP';
      break;
    case 'turnStart':
      when = 'At the start of your turn';
      break;
    case 'turnEnd':
      when = 'At the end of your turn, before you discard';
      break;
  }
  const effects = trigger.effects.map((e) => lowerFirst(describeEffect(e, { atTurnStart: trigger.on === 'turnStart' }))).join(' ');
  return `${when}, ${effects}${trigger.oncePerTurn ? ' Once per turn.' : ''}`;
}

/** The text on a card's face: its `description` if it has one, otherwise generated from its effects. */
export function cardText(card: CardDefinition, liveValue?: (effect: Effect) => number | undefined): string {
  if (card.description !== undefined) return card.description;
  // With `liveValue`, an effect shows what it would really do right now ("Deal 9 damage.", "Gain 7
  // block.") instead of the printed number and its scaling note.
  const parts = (card.effects ?? []).map((effect) => {
    const live = liveValue?.(effect);
    return live === undefined ? describeEffect(effect) : plainEffect(effect, live, {});
  });
  if (card.onTurnStartEffect) {
    const text = describeEffect(card.onTurnStartEffect, { atTurnStart: true });
    parts.push(`At the start of each turn, ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
  }
  for (const trigger of card.triggers ?? []) parts.push(describeTrigger(trigger));
  if (card.exhaust) parts.push('Exhaust.');
  return parts.join(' ');
}

/** A card's tags as the small line on its face, e.g. "#tag-a #tag-b"; empty if it has none. */
export function cardTagsText(card: CardDefinition): string {
  return (card.tags ?? []).map((tag) => `#${tag}`).join(' ');
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
  for (const trigger of relic.triggers ?? []) parts.push(describeTrigger(trigger));
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
