import type { CardType } from './card';
import type { Effect } from './effect';

/** Things a trigger can react to. */
export type TriggerOn =
  /** A card was played (filter with `cardType` / `tag`). Triggered effects are not card plays. */
  | 'cardPlayed'
  | 'cardExhausted'
  /** The player gained block from an effect. */
  | 'blockGained'
  | 'enemyDied'
  /** The player lost HP, from an enemy hit that got past block or from a loseHp effect. */
  | 'hpLost'
  | 'turnStart'
  /** End of the player's turn, before the hand is discarded. */
  | 'turnEnd';

/** A reactive ability, declared on a power card (active from when it is played) or a relic. */
export interface Trigger {
  on: TriggerOn;
  /** Only for 'cardPlayed': the played card must be of this type. */
  cardType?: CardType;
  /** Only for 'cardPlayed': the played card must carry this tag. */
  tag?: string;
  effects: Effect[];
  /** Fires at most once per player turn (the count resets as your next turn starts). */
  oncePerTurn?: boolean;
}
