import type { EnemyMove } from './types';

/**
 * What the player is told about an enemy's next move, StS style: the kind of thing it will do,
 * not the details. Attacks also show their damage; buffs and debuffs don't say which status.
 */
export type IntentIcon = 'attack' | 'defend' | 'buff' | 'debuff';

const ORDER: IntentIcon[] = ['attack', 'defend', 'buff', 'debuff'];

/** The icons for a move, derived from its effects, in a fixed display order. */
export function intentIcons(move: EnemyMove): IntentIcon[] {
  const found = new Set<IntentIcon>();
  for (const effect of move.effects) {
    if (effect.kind === 'damage') found.add('attack');
    else if (effect.kind === 'block') found.add('defend');
    else if (effect.kind === 'applyStatus') found.add(effect.to === 'self' ? 'buff' : 'debuff');
  }
  return ORDER.filter((icon) => found.has(icon));
}
