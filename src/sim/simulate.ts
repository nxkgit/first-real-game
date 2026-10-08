import type { FightTier, RunState } from '../game/RunState';
import type { MapNode } from '../game/actMap';
import { Rng } from '../game/rng';
import type { CardDefinition, EnemyDefinition, RelicDefinition } from '../game/types';
import { PLAYER_MAX_HP, SHOP_CARD_PRICE } from '../data/tunables';
import { buildStarterDeck } from '../data/cards';
import { getEnemy } from '../data/enemies';
import { ACT_CONTENT, newPlayableRun } from '../data/run';
import { runFight } from './fight';
import { rngStartOf } from './fightCore';
import type { SkillLevel } from './skills';

/**
 * Headless play: runs the real game rules with the simple bot (bot.ts) and measures what happens.
 * Everything is seeded, so the same options always give the same numbers. Read results as
 * comparisons between versions of the content or tunables, not as how real players would fare.
 */

/** How the bot takes fight rewards: random card, always gold, or the card that does best in trial fights. */
export type RewardPolicy = 'card' | 'gold' | 'best';
/** At a rest stop: always heal, or heal when hurt and otherwise upgrade a card. */
export type RestPolicy = 'heal' | 'smart';
/** Which way to go on the map: choose at random, or prefer rests when hurt, shops with gold, and avoid elites when weak. */
export type PathPolicy = 'random' | 'smart';

export interface SimOptions {
  reward: RewardPolicy;
  rest: RestPolicy;
  path: PathPolicy;
  /** Which bot plays the fights (default greedy). */
  skill?: SkillLevel;
}

export const DEFAULT_OPTIONS: SimOptions = { reward: 'card', rest: 'smart', path: 'smart' };

// ---------- one fight ----------

export interface FightResult {
  /** 'stalled' means it hit the turn limit; it counts as a loss. */
  result: 'won' | 'lost' | 'stalled';
  turns: number;
  hpAfter: number;
  /** How many times each card (by id) was played. */
  plays: Record<string, number>;
}

export function playFight(
  deck: CardDefinition[],
  enemies: EnemyDefinition[],
  player: { hp: number; maxHp: number },
  rng: Rng,
  maxTurns = 60,
  relics: RelicDefinition[] = [],
  skill: SkillLevel = 'greedy'
): FightResult {
  const r = runFight({ deck, enemies, player, relics }, rngStartOf(rng), skill, maxTurns);
  return { result: r.result, turns: r.turns, hpAfter: r.hpAfter, plays: r.plays };
}

// ---------- one run ----------

export interface FightRecord {
  floor: number;
  tier: FightTier;
  enemies: string[];
  won: boolean;
  turns: number;
  hpLost: number;
  /** Base ids (upgrades counted as their card) of the deck the fight was played with. */
  deck: string[];
  plays: Record<string, number>;
}

export interface RunOutcome {
  seed: number;
  won: boolean;
  floorReached: number;
  /** What the run ended on when lost: a fight tier, or 'event' (an event's fight). */
  lostTo?: string;
  fights: FightRecord[];
  /** Ids of the cards the bot added to its deck (rewards, shop, events). */
  picks: string[];
  /** Ids of every card offered as a fight reward (3 per reward), whether taken or not. */
  offered: string[];
  /** The subset of `picks` that were chosen from a fight reward (so offered/rewardPicks give pick rates). */
  rewardPicks: string[];
  restChoices: { heal: number; upgrade: number };
  relics: string[];
  finalDeck: string[];
  finalGold: number;
}

const baseId = (card: CardDefinition): string => card.upgradeOf ?? card.id;

/** A score for how well a deck does in a few benchmark fights: win rate and HP left. Higher is better. */
function trialScore(run: RunState, deck: CardDefinition[], rng: Rng, trialsEach: number): number {
  let total = 0;
  let n = 0;
  for (const ids of ACT_CONTENT.encounters.slice(0, 2)) {
    const enemies = ids.map(getEnemy);
    for (let i = 0; i < trialsEach; i++) {
      const r = playFight(deck, enemies, { hp: run.maxHp, maxHp: run.maxHp }, new Rng(rng.nextSeed()), 60, run.relics);
      total += (r.result === 'won' ? 100 : 0) + r.hpAfter;
      n++;
    }
  }
  return total / n;
}

function chooseNode(run: RunState, policy: PathPolicy, rng: Rng): MapNode {
  const choices = run.mapChoices;
  if (policy === 'random') return choices[Math.floor(rng.next() * choices.length)];
  const hurt = run.hp < run.maxHp * 0.6;
  const strong = run.hp >= run.maxHp * 0.75;
  const score = (n: MapNode): number => {
    const base = { combat: 3, event: 2, shop: run.gold >= SHOP_CARD_PRICE ? 4 : 1, rest: hurt ? 6 : 1, elite: strong ? 3.5 : -1, boss: 10 }[n.kind];
    return base + rng.next() * 0.5; // random tie-break
  };
  return choices.reduce((best, n) => (score(n) > score(best) ? n : best), choices[0]);
}

export function playRun(seed: number, options: SimOptions = DEFAULT_OPTIONS): RunOutcome {
  const run = newPlayableRun(seed);
  // the bot's own choices use a separate stream so they never disturb the run's randomness
  const botRng = new Rng(seed ^ 0x9e3779b9);
  const fights: FightRecord[] = [];
  const picks: string[] = [];
  const offered: string[] = [];
  const rewardPicks: string[] = [];
  const restChoices = { heal: 0, upgrade: 0 };
  let lostTo: string | undefined;

  for (let guard = 0; guard < 600 && run.phase !== 'won' && run.phase !== 'lost'; guard++) {
    if (run.phase === 'map') {
      run.chooseNode(chooseNode(run, options.path, botRng).id);
      continue;
    }
    if (run.phase === 'reward') {
      const offer = run.pendingReward;
      if (!offer) throw new Error('reward phase without an offer');
      for (const c of offer.cards) offered.push(c.id);
      if (options.reward === 'gold') {
        run.takeRewardGold();
      } else {
        let index = Math.floor(botRng.next() * offer.cards.length);
        if (options.reward === 'best') {
          const scores = offer.cards.map((c) => trialScore(run, [...run.deck, c], new Rng(botRng.nextSeed()), 4));
          index = scores.indexOf(Math.max(...scores));
        }
        picks.push(offer.cards[index].id);
        rewardPicks.push(offer.cards[index].id);
        run.takeRewardCard(index);
      }
      continue;
    }

    const node = run.currentNode;
    if (node.kind === 'combat') {
      const hpBefore = run.hp;
      const fight = playFight(run.deck, node.enemies, { hp: run.hp, maxHp: run.maxHp }, run.newCombatRng(), 60, run.relics, options.skill ?? 'greedy');
      fights.push({
        floor: run.floor,
        tier: node.tier,
        enemies: node.enemies.map((e) => e.id),
        won: fight.result === 'won',
        turns: fight.turns,
        hpLost: hpBefore - fight.hpAfter,
        deck: run.deck.map(baseId),
        plays: fight.plays,
      });
      if (fight.result !== 'won') lostTo = run.eventFight ? 'event' : node.tier;
      run.finishCombat(fight.result === 'won' ? 'won' : 'lost', fight.hpAfter, fight.turns);
    } else if (node.kind === 'rest') {
      const upgradable = run.upgradableCards;
      const hurt = run.hp < run.maxHp * 0.7;
      if (options.rest === 'smart' && !hurt && upgradable.length > 0) {
        run.upgradeCard(upgradable[Math.floor(botRng.next() * upgradable.length)].index);
        restChoices.upgrade++;
      } else {
        run.rest();
        restChoices.heal++;
      }
    } else if (node.kind === 'event') {
      const choice = Math.floor(botRng.next() * node.event.choices.length);
      run.chooseEventOption(choice);
    } else {
      // shop: buy whatever is affordable, in a random order, then leave
      const order = run.shopItems.map((_, i) => i).sort(() => botRng.next() - 0.5);
      for (const i of order) {
        const bought = run.shopItems[i];
        if (run.buyShopItem(i)) picks.push(bought.card.id);
      }
      run.leaveShop();
    }
  }

  return {
    seed,
    won: run.phase === 'won',
    floorReached: run.floor,
    lostTo: run.phase === 'lost' ? lostTo : undefined,
    fights,
    picks,
    offered,
    rewardPicks,
    restChoices,
    relics: run.relics.map((r) => r.id),
    finalDeck: run.deck.map(baseId),
    finalGold: run.gold,
  };
}

// ---------- summaries ----------

export interface EncounterSummary {
  enemies: string;
  tier: FightTier;
  attempts: number;
  winRate: number;
  avgTurns: number;
  /** Average HP lost in fights that were won. */
  avgHpLostWhenWon: number;
}

export interface CardSummary {
  id: string;
  /** Times it was added to a deck. */
  picks: number;
  /** Runs whose final deck had it. */
  runsWith: number;
  winRateWith: number;
  winRateWithout: number;
  /** Average plays per fight, over fights where it was in the deck. */
  playsPerFight: number;
}

export interface SimSummary {
  options: SimOptions;
  runs: number;
  winRate: number;
  avgFloorReached: number;
  /** What runs were lost to: normal, elite, boss or event fights. */
  lostTo: Record<string, number>;
  byTier: Record<FightTier, { fights: number; winRate: number; avgTurns: number; avgHpLostWhenWon: number }>;
  encounters: EncounterSummary[];
  cards: CardSummary[];
  /** Relic id -> number of runs that ended holding it. */
  relics: Record<string, number>;
  restChoices: { heal: number; upgrade: number };
  avgFinalDeckSize: number;
  avgFinalGold: number;
}

const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const rate = (wins: number, total: number): number => (total === 0 ? 0 : wins / total);

function fightStats(records: FightRecord[]): { fights: number; winRate: number; avgTurns: number; avgHpLostWhenWon: number } {
  const won = records.filter((r) => r.won);
  return {
    fights: records.length,
    winRate: rate(won.length, records.length),
    avgTurns: mean(records.map((r) => r.turns)),
    avgHpLostWhenWon: mean(won.map((r) => r.hpLost)),
  };
}

export function summarize(outcomes: RunOutcome[], options: SimOptions): SimSummary {
  const lostTo: Record<string, number> = {};
  for (const o of outcomes) if (o.lostTo) lostTo[o.lostTo] = (lostTo[o.lostTo] ?? 0) + 1;

  const allFights = outcomes.flatMap((o) => o.fights);
  const byTier = {
    normal: fightStats(allFights.filter((f) => f.tier === 'normal')),
    elite: fightStats(allFights.filter((f) => f.tier === 'elite')),
    boss: fightStats(allFights.filter((f) => f.tier === 'boss')),
  };

  const groups = new Map<string, FightRecord[]>();
  for (const f of allFights) {
    const key = `${f.tier}|${f.enemies.join('+')}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const encounters = [...groups.entries()]
    .map(([key, records]): EncounterSummary => {
      const [tier, enemies] = key.split('|');
      return { enemies, tier: tier as FightTier, attempts: records.length, ...pickStats(fightStats(records)) };
    })
    .sort((a, b) => a.tier.localeCompare(b.tier) || a.enemies.localeCompare(b.enemies));

  const cardIds = new Set<string>();
  for (const o of outcomes) {
    o.finalDeck.forEach((id) => cardIds.add(id));
    o.picks.forEach((id) => cardIds.add(id.replace(/\+$/, '')));
  }
  const cards = [...cardIds]
    .map((id): CardSummary => {
      const withCard = outcomes.filter((o) => o.finalDeck.includes(id));
      const without = outcomes.filter((o) => !o.finalDeck.includes(id));
      const fightsWith = allFights.filter((f) => f.deck.includes(id));
      return {
        id,
        picks: outcomes.reduce((n, o) => n + o.picks.filter((p) => p.replace(/\+$/, '') === id).length, 0),
        runsWith: withCard.length,
        winRateWith: rate(withCard.filter((o) => o.won).length, withCard.length),
        winRateWithout: rate(without.filter((o) => o.won).length, without.length),
        playsPerFight: mean(fightsWithPlays(fightsWith, id)),
      };
    })
    .sort((a, b) => b.picks - a.picks || a.id.localeCompare(b.id));

  const relics: Record<string, number> = {};
  for (const o of outcomes) for (const id of o.relics) relics[id] = (relics[id] ?? 0) + 1;

  return {
    options,
    runs: outcomes.length,
    winRate: rate(outcomes.filter((o) => o.won).length, outcomes.length),
    avgFloorReached: mean(outcomes.map((o) => o.floorReached)),
    lostTo,
    byTier,
    encounters,
    cards,
    relics,
    restChoices: {
      heal: outcomes.reduce((n, o) => n + o.restChoices.heal, 0),
      upgrade: outcomes.reduce((n, o) => n + o.restChoices.upgrade, 0),
    },
    avgFinalDeckSize: mean(outcomes.map((o) => o.finalDeck.length)),
    avgFinalGold: mean(outcomes.map((o) => o.finalGold)),
  };
}

const pickStats = (s: { winRate: number; avgTurns: number; avgHpLostWhenWon: number }) => ({
  winRate: s.winRate,
  avgTurns: s.avgTurns,
  avgHpLostWhenWon: s.avgHpLostWhenWon,
});

/** Plays of one card (by base id, counting its upgraded form too) in each of the given fights. */
function fightsWithPlays(fights: FightRecord[], id: string): number[] {
  return fights.map((f) => (f.plays[id] ?? 0) + (f.plays[`${id}+`] ?? 0));
}

export function simulateRuns(opts: { runs: number; seed: number } & Partial<SimOptions>): SimSummary {
  const options: SimOptions = { ...DEFAULT_OPTIONS, reward: opts.reward ?? DEFAULT_OPTIONS.reward, rest: opts.rest ?? DEFAULT_OPTIONS.rest, path: opts.path ?? DEFAULT_OPTIONS.path, ...(opts.skill ? { skill: opts.skill } : {}) };
  const outcomes = Array.from({ length: opts.runs }, (_, i) => playRun(opts.seed + i, options));
  return summarize(outcomes, options);
}

// ---------- one fight, over and over ----------

export interface SingleFightSummary {
  enemies: string[];
  runs: number;
  winRate: number;
  avgTurns: number;
  avgHpLostWhenWon: number;
}

/** The starter deck at full HP against the given enemies, over and over. */
export function simulateFight(enemyIds: string[], runs: number, seed: number): SingleFightSummary {
  const enemies = enemyIds.map(getEnemy);
  const results = Array.from({ length: runs }, (_, i) =>
    playFight(buildStarterDeck(), enemies, { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }, new Rng(seed + i))
  );
  const won = results.filter((r) => r.result === 'won');
  return {
    enemies: enemyIds,
    runs,
    winRate: rate(won.length, runs),
    avgTurns: mean(results.map((r) => r.turns)),
    avgHpLostWhenWon: mean(won.map((r) => PLAYER_MAX_HP - r.hpAfter)),
  };
}

// ---------- comparing two results ----------

export interface Difference {
  what: string;
  before: number;
  after: number;
}

/** The headline numbers and per-fight and per-card win rates that differ between two simulation results. */
export function compareSummaries(before: SimSummary, after: SimSummary): Difference[] {
  const diffs: Difference[] = [
    { what: 'run win rate', before: before.winRate, after: after.winRate },
    { what: 'average floor reached', before: before.avgFloorReached, after: after.avgFloorReached },
    { what: 'normal fights: win rate', before: before.byTier.normal.winRate, after: after.byTier.normal.winRate },
    { what: 'normal fights: HP lost when won', before: before.byTier.normal.avgHpLostWhenWon, after: after.byTier.normal.avgHpLostWhenWon },
    { what: 'elite fights: win rate', before: before.byTier.elite.winRate, after: after.byTier.elite.winRate },
    { what: 'elite fights: HP lost when won', before: before.byTier.elite.avgHpLostWhenWon, after: after.byTier.elite.avgHpLostWhenWon },
    { what: 'boss fights: win rate', before: before.byTier.boss.winRate, after: after.byTier.boss.winRate },
    { what: 'boss fights: average turns', before: before.byTier.boss.avgTurns, after: after.byTier.boss.avgTurns },
  ];
  for (const a of after.encounters) {
    const b = before.encounters.find((e) => e.enemies === a.enemies && e.tier === a.tier);
    if (b) diffs.push({ what: `${a.tier} ${a.enemies}: win rate`, before: b.winRate, after: a.winRate });
  }
  for (const a of after.cards) {
    const b = before.cards.find((c) => c.id === a.id);
    if (b) diffs.push({ what: `card ${a.id}: win rate with it`, before: b.winRateWith, after: a.winRateWith });
  }
  return diffs.filter((d) => Math.abs(d.after - d.before) > 1e-9);
}
