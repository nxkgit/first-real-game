import { getEnemy } from '../data/enemies';
import { PLAYER_MAX_HP } from '../data/tunables';
import type { CardDefinition } from '../game/types';
import { runFight } from './fight';
import { rngStartFromSeed } from './fightCore';
import type { SkillLevel } from './skills';
import { deckKey } from './suites';
import type { FightDef } from './suites';

/**
 * The measurement engine. A "unit" is one (fight, seed) pair. Outcomes for a deck are stored per
 * unit, in a fixed order, so two decks evaluated here are PAIRED: unit i of deck A and unit i of
 * deck B used the same seed (common random numbers). Experiments difference those arrays unit by
 * unit, which cancels most of the shuffle luck.
 */

export interface EvalConfig {
  fights: FightDef[];
  /** Seeds per fight. Units = fights x seeds. */
  seeds: number;
  baseSeed: number;
}

export type MetricId = 'win' | 'hpLost' | 'turns';

export interface MetricInfo {
  id: MetricId;
  label: string;
  /** True when a bigger number is better for the player. (Turns is a pacing metric: shorter is "better" only for tempo.) */
  higherIsBetter: boolean;
  /** Smallest change worth caring about; a CI inside +-margin reads as 'negligible'. PROVISIONAL. */
  margin: number;
  digits: number;
}

export const METRICS: Readonly<Record<MetricId, MetricInfo>> = {
  win: { id: 'win', label: 'win rate', higherIsBetter: true, margin: 0.02, digits: 3 },
  hpLost: { id: 'hpLost', label: 'HP lost', higherIsBetter: false, margin: 1, digits: 1 },
  turns: { id: 'turns', label: 'turns', higherIsBetter: false, margin: 0.25, digits: 2 },
};
export const METRIC_IDS: readonly MetricId[] = ['win', 'hpLost', 'turns'];

export interface Samples {
  win: Float64Array;
  hpLost: Float64Array;
  turns: Float64Array;
}

/** A well-mixed 32-bit seed for (base, fight, index). Stable when other fights are added or removed. */
export function unitSeed(baseSeed: number, fightId: string, i: number): number {
  let h = 2166136261 ^ baseSeed;
  for (let k = 0; k < fightId.length; k++) h = Math.imul(h ^ fightId.charCodeAt(k), 16777619);
  h = Math.imul(h ^ (i + 1), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export class Evaluator {
  private cache = new Map<string, Samples>();
  fightsRun = 0;

  readonly config: EvalConfig;

  constructor(config: EvalConfig) {
    this.config = config;
  }

  get units(): number {
    return this.config.fights.length * this.config.seeds;
  }

  /** Outcomes of `deck` at full HP over every unit. Memoised, so shared baselines cost once. */
  evaluate(deck: CardDefinition[], skill: SkillLevel): Samples {
    const key = `${skill}|${deckKey(deck)}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const { fights, seeds, baseSeed } = this.config;
    const n = fights.length * seeds;
    const out: Samples = { win: new Float64Array(n), hpLost: new Float64Array(n), turns: new Float64Array(n) };
    fights.forEach((fight, fi) => {
      const enemies = fight.enemies.map(getEnemy);
      for (let i = 0; i < seeds; i++) {
        const r = runFight(
          { deck, enemies, player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP } },
          rngStartFromSeed(unitSeed(baseSeed, fight.id, i)),
          skill
        );
        const u = fi * seeds + i;
        out.win[u] = r.result === 'won' ? 1 : 0;
        out.hpLost[u] = r.hpLost;
        out.turns[u] = r.turns;
        this.fightsRun++;
      }
    });
    this.cache.set(key, out);
    return out;
  }

  /** The slice of `s` belonging to fight index `fi`. */
  forFight(s: Samples, fi: number): Samples {
    const { seeds } = this.config;
    return { win: s.win.subarray(fi * seeds, (fi + 1) * seeds), hpLost: s.hpLost.subarray(fi * seeds, (fi + 1) * seeds), turns: s.turns.subarray(fi * seeds, (fi + 1) * seeds) };
  }

  /** Units belonging to fights of one tier, concatenated. */
  forTier(s: Samples, tier: string): Samples {
    const parts = this.config.fights.map((f, fi) => (f.tier === tier ? this.forFight(s, fi) : undefined)).filter((x): x is Samples => x !== undefined);
    const cat = (pick: (x: Samples) => Float64Array): Float64Array => {
      const out = new Float64Array(parts.reduce((n, p) => n + pick(p).length, 0));
      let o = 0;
      for (const p of parts) {
        out.set(pick(p), o);
        o += pick(p).length;
      }
      return out;
    };
    return { win: cat((x) => x.win), hpLost: cat((x) => x.hpLost), turns: cat((x) => x.turns) };
  }
}
