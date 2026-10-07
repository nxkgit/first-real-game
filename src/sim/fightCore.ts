import { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import type { CardDefinition, EnemyDefinition, RelicDefinition } from '../game/types';
import { PLAYER_MAX_HP } from '../data/tunables';

/**
 * Everything needed to build a fight from nothing, so any state of it can be rebuilt by replaying
 * actions on a fresh CombatState (CombatState itself has no clone and shouldn't grow one).
 * Nothing here reaches into CombatState's internals: it goes through the public API only.
 */
export interface FightSpec {
  deck: CardDefinition[];
  enemies: EnemyDefinition[];
  /** Defaults to full HP. */
  player?: { hp: number; maxHp: number };
  relics?: RelicDefinition[];
}

/** Where the fight's shuffle stream starts: enough to restore it exactly (see Rng.restore). */
export interface RngStart {
  seed: number;
  position: number;
}

export const rngStartFromSeed = (seed: number): RngStart => ({ seed: seed >>> 0, position: seed >>> 0 });
export const rngStartOf = (rng: Rng): RngStart => ({ seed: rng.seed, position: rng.position });

/** One decision. Cards are named by their position in the hand, enemies by their position in the fight. */
export type Action = { kind: 'play'; hand: number; target?: number } | { kind: 'end' };

export const startingHp = (spec: FightSpec): number => (spec.player ?? { hp: PLAYER_MAX_HP }).hp;

/** Builds the fight and starts it, exactly as playFight always did: the shuffle stream feeds the deck. */
export function createFight(spec: FightSpec, start: RngStart): { combat: CombatState; setRandom: (f: () => number) => void } {
  const rng = Rng.restore(start.seed, start.position);
  let source: () => number = () => rng.next();
  const combat = new CombatState(spec.deck, spec.enemies, {
    player: spec.player,
    random: () => source(),
    relics: spec.relics,
  });
  combat.start();
  return { combat, setRandom: (f) => (source = f) };
}

/** Applies one recorded action. Returns false if the action is not legal in this state. */
export function applyAction(combat: CombatState, action: Action): boolean {
  if (action.kind === 'end') {
    if (combat.phase !== 'playerTurn') return false;
    combat.endPlayerTurn();
    return true;
  }
  const card = combat.deck.hand[action.hand];
  if (!card) return false;
  return combat.playCard(card.instanceId, action.target === undefined ? undefined : `enemy-${action.target}`);
}

/**
 * Rebuilds the fight as it really stands after `history`, on a throwaway CombatState.
 *
 * With `hypotheticalSeed`, the draw pile is then reshuffled from that seed and later shuffles use it
 * too. The history itself was replayed with the real stream (so the state is the true one), but
 * what is on top of the draw pile is hidden information a real player does not have; reshuffling
 * keeps lookahead from peeking at it. A player knows which cards are in the draw pile, not their order.
 */
export function reconstruct(spec: FightSpec, start: RngStart, history: readonly Action[], hypotheticalSeed?: number): CombatState {
  const { combat, setRandom } = createFight(spec, start);
  for (const action of history) {
    if (!applyAction(combat, action)) throw new Error('replay diverged: recorded action was not legal');
  }
  if (hypotheticalSeed !== undefined) {
    const hypo = new Rng(hypotheticalSeed);
    setRandom(() => hypo.next());
    combat.deck.shuffleDrawPile();
  }
  return combat;
}
