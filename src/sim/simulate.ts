import { CombatState } from '../game/CombatState';
import { Rng } from '../game/rng';
import type { CardDefinition, EnemyDefinition } from '../game/types';
import { PLAYER_MAX_HP } from '../data/tunables';
import { buildStarterDeck } from '../data/cards';
import { getEnemy } from '../data/enemies';
import { newRun } from '../data/run';
import { playBotTurn } from './bot';

/**
 * Headless play: runs the real game rules with the simple bot (bot.ts) and measures what happens.
 * Everything is seeded, so the same options always give the same numbers. Read results as
 * comparisons between versions of the content or tunables, not as how real players would fare.
 */

export type RewardPolicy = 'card' | 'gold';

export interface FightResult {
  /** 'stalled' means it hit the turn limit; it counts as a loss. */
  result: 'won' | 'lost' | 'stalled';
  turns: number;
  hpAfter: number;
}

export function playFight(
  deck: CardDefinition[],
  enemies: EnemyDefinition[],
  player: { hp: number; maxHp: number },
  rng: Rng,
  maxTurns = 60
): FightResult {
  const combat = new CombatState(deck, enemies, player, () => rng.next());
  combat.start();
  while (combat.phase === 'playerTurn') {
    if (combat.turnNumber > maxTurns) return { result: 'stalled', turns: combat.turnNumber, hpAfter: combat.player.hp };
    playBotTurn(combat);
    if (combat.phase === 'playerTurn') combat.endPlayerTurn();
  }
  return { result: combat.phase === 'won' ? 'won' : 'lost', turns: combat.turnNumber, hpAfter: combat.player.hp };
}

export interface FightRecord {
  floor: number;
  enemies: string[];
  won: boolean;
  turns: number;
  hpLost: number;
}

export interface RunOutcome {
  seed: number;
  won: boolean;
  floorReached: number;
  fights: FightRecord[];
  /** Ids of the cards the bot added to its deck. */
  picks: string[];
  finalDeckSize: number;
  finalGold: number;
}

export function playRun(seed: number, reward: RewardPolicy): RunOutcome {
  const run = newRun(seed);
  // the bot's own choices use a separate stream so they never disturb the run's randomness
  const botRng = new Rng(seed ^ 0x9e3779b9);
  const fights: FightRecord[] = [];
  const picks: string[] = [];

  for (let guard = 0; guard < 200 && run.phase !== 'won' && run.phase !== 'lost'; guard++) {
    if (run.phase === 'reward') {
      const offer = run.pendingReward;
      if (!offer) throw new Error('reward phase without an offer');
      if (reward === 'card') {
        const index = Math.floor(botRng.next() * offer.cards.length);
        picks.push(offer.cards[index].id);
        run.takeRewardCard(index);
      } else {
        run.takeRewardGold();
      }
      continue;
    }

    const node = run.currentNode;
    if (node.kind === 'combat') {
      const hpBefore = run.hp;
      const fight = playFight(run.deck, node.enemies, { hp: run.hp, maxHp: run.maxHp }, run.newCombatRng());
      fights.push({
        floor: run.floor,
        enemies: node.enemies.map((e) => e.id),
        won: fight.result === 'won',
        turns: fight.turns,
        hpLost: hpBefore - fight.hpAfter,
      });
      run.finishCombat(fight.result === 'won' ? 'won' : 'lost', fight.hpAfter, fight.turns);
    } else if (node.kind === 'rest') {
      run.rest();
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
    fights,
    picks,
    finalDeckSize: run.deck.length,
    finalGold: run.gold,
  };
}

export interface FightSummary {
  floor: number;
  enemies: string[];
  attempts: number;
  winRate: number;
  avgTurns: number;
  /** Average HP lost in fights that were won. */
  avgHpLostWhenWon: number;
}

export interface SimSummary {
  runs: number;
  winRate: number;
  avgFloorReached: number;
  /** Floor number -> how many runs ended there in a loss. */
  deathsByFloor: Record<number, number>;
  fights: FightSummary[];
  /** Card id -> how many times it was picked across all runs. */
  cardPicks: Record<string, number>;
  avgFinalDeckSize: number;
  avgFinalGold: number;
}

const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

export function simulateRuns(opts: { runs: number; seed: number; reward: RewardPolicy }): SimSummary {
  const outcomes = Array.from({ length: opts.runs }, (_, i) => playRun(opts.seed + i, opts.reward));

  const deathsByFloor: Record<number, number> = {};
  for (const o of outcomes) if (!o.won) deathsByFloor[o.floorReached] = (deathsByFloor[o.floorReached] ?? 0) + 1;

  const byFloor = new Map<number, FightRecord[]>();
  for (const o of outcomes) {
    for (const f of o.fights) byFloor.set(f.floor, [...(byFloor.get(f.floor) ?? []), f]);
  }
  const fights = [...byFloor.entries()]
    .sort(([a], [b]) => a - b)
    .map(([floor, records]): FightSummary => {
      const won = records.filter((r) => r.won);
      return {
        floor,
        enemies: records[0].enemies,
        attempts: records.length,
        winRate: won.length / records.length,
        avgTurns: mean(records.map((r) => r.turns)),
        avgHpLostWhenWon: mean(won.map((r) => r.hpLost)),
      };
    });

  const cardPicks: Record<string, number> = {};
  for (const o of outcomes) for (const id of o.picks) cardPicks[id] = (cardPicks[id] ?? 0) + 1;

  return {
    runs: opts.runs,
    winRate: outcomes.filter((o) => o.won).length / opts.runs,
    avgFloorReached: mean(outcomes.map((o) => o.floorReached)),
    deathsByFloor,
    fights,
    cardPicks,
    avgFinalDeckSize: mean(outcomes.map((o) => o.finalDeckSize)),
    avgFinalGold: mean(outcomes.map((o) => o.finalGold)),
  };
}

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
    winRate: won.length / runs,
    avgTurns: mean(results.map((r) => r.turns)),
    avgHpLostWhenWon: mean(won.map((r) => PLAYER_MAX_HP - r.hpAfter)),
  };
}
