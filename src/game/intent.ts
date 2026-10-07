import { intentIconOf } from './effects';
import type { EnemyMove } from './types';

/**
 * What the player is told about an enemy's next move, StS style: the kind of thing it will do,
 * not the details. Attacks also show their damage; buffs and debuffs don't say which status.
 */
export type IntentIcon = 'attack' | 'defend' | 'buff' | 'debuff';

const ORDER: IntentIcon[] = ['attack', 'defend', 'buff', 'debuff'];

/** The icons for a move, derived from its effects (each kind says what it shows, in the effect
 *  registry), in a fixed display order. */
export function intentIcons(move: EnemyMove): IntentIcon[] {
  const found = new Set<IntentIcon>();
  for (const effect of move.effects) {
    const icon = intentIconOf(effect);
    if (icon) found.add(icon);
  }
  return ORDER.filter((icon) => found.has(icon));
}
