import type { RunLogEntry, RunState } from './RunState';

/**
 * What a playtester can send back after a run: how it went, stop by stop, and what the deck ended
 * as. Plain data with no personal information. Bump `version` if the shape changes.
 */
export interface RunReport {
  version: 2;
  seed: number;
  result: 'won' | 'lost' | 'in progress';
  floorReached: number;
  totalFloors: number;
  hp: number;
  maxHp: number;
  gold: number;
  deckSize: number;
  /** Card id -> how many copies are in the deck. */
  deck: Record<string, number>;
  relics: string[];
  history: RunLogEntry[];
}

export function buildRunReport(run: RunState): RunReport {
  const deck: Record<string, number> = {};
  for (const card of run.deck) deck[card.id] = (deck[card.id] ?? 0) + 1;
  return {
    version: 2,
    seed: run.seed,
    result: run.phase === 'won' ? 'won' : run.phase === 'lost' ? 'lost' : 'in progress',
    floorReached: run.floor,
    totalFloors: run.totalFloors,
    hp: run.hp,
    maxHp: run.maxHp,
    gold: run.gold,
    deckSize: run.deck.length,
    deck,
    relics: run.relics.map((r) => r.id),
    history: run.history.map((e) => ({ ...e })),
  };
}

export function formatRunReport(report: RunReport): string {
  return JSON.stringify(report, null, 2);
}
