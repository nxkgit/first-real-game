import { Rng } from '../game/rng';
import { createFight, rngStartFromSeed, startingHp } from './fightCore';
import type { FightSpec, RngStart } from './fightCore';
import { BOTS, endTurn } from './skills';
import type { FightContext, SkillLevel } from './skills';

export interface FightOutcome {
  /** 'stalled' hit the turn limit; counts as a loss. */
  result: 'won' | 'lost' | 'stalled';
  turns: number;
  startHp: number;
  hpAfter: number;
  /** HP lost during the fight. A loss costs everything the player brought in. */
  hpLost: number;
  /** Times each card (by id) was played. */
  plays: Record<string, number>;
}

/** Plays one fight to the end with a bot of the given skill. Fully determined by (spec, start, skill). */
export function runFight(spec: FightSpec, start: RngStart, skill: SkillLevel, maxTurns = 60): FightOutcome {
  const { combat } = createFight(spec, start);
  const plays: Record<string, number> = {};
  combat.on('cardPlayed', ({ card }) => {
    plays[card.definition.id] = (plays[card.definition.id] ?? 0) + 1;
  });
  const ctx: FightContext = {
    combat,
    spec,
    start,
    history: [],
    rng: new Rng((start.seed ^ 0x5bd1e995) >>> 0),
  };
  const bot = BOTS[skill];
  const hp0 = startingHp(spec);
  let stalled = false;
  while (combat.phase === 'playerTurn') {
    if (combat.turnNumber > maxTurns) {
      stalled = true;
      break;
    }
    bot.playTurn(ctx);
    if (combat.phase === 'playerTurn') endTurn(ctx);
  }
  const won = combat.phase === 'won';
  const hpAfter = won ? combat.player.hp : stalled ? combat.player.hp : 0;
  return {
    result: won ? 'won' : stalled ? 'stalled' : 'lost',
    turns: combat.turnNumber,
    startHp: hp0,
    hpAfter,
    hpLost: won ? hp0 - hpAfter : hp0,
    plays,
  };
}

export const fightSeed = (seed: number): RngStart => rngStartFromSeed(seed);
