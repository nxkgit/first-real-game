import type { CardDefinition } from './types';
import { RunState } from './RunState';
import type { RunNode, RunPhase, SavedRun } from './RunState';

const PHASES: RunPhase[] = ['inNode', 'reward', 'won', 'lost'];

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

/** Checks that stored data really has the shape of a SavedRun. Returns null if not (never throws). */
export function parseSavedRun(raw: unknown): SavedRun | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return null;
  if (!isInt(r.seed, 0, 4294967295) || !isInt(r.rngPosition, 0, 4294967295)) return null;
  if (!isInt(r.nodeCount, 1, 1000) || !isInt(r.nodeIndex, 0, 1000)) return null;
  if (!PHASES.includes(r.phase as RunPhase)) return null;
  if (!isInt(r.hp, 0, 100000) || !isInt(r.maxHp, 1, 100000) || !isInt(r.gold, 0, 1000000)) return null;
  if (!isStringArray(r.deck)) return null;
  const reward = r.pendingReward;
  if (reward !== null) {
    if (typeof reward !== 'object' || reward === undefined) return null;
    const o = reward as Record<string, unknown>;
    if (!isStringArray(o.cards) || !isInt(o.gold, 0, 1000000)) return null;
  }
  const shop = r.shop;
  if (shop !== null) {
    if (!Array.isArray(shop)) return null;
    for (const item of shop) {
      if (typeof item !== 'object' || item === null) return null;
      const i = item as Record<string, unknown>;
      if (typeof i.card !== 'string' || !isInt(i.price, 0, 1000000) || typeof i.sold !== 'boolean') return null;
    }
  }
  if (!Array.isArray(r.history)) return null;
  return raw as SavedRun;
}

/**
 * Rebuilds a run from stored data, or returns null if the data is unusable: wrong shape, from a
 * different version of the path, or naming a card that no longer exists. A bad save never crashes
 * the game; the caller just starts a fresh run.
 */
export function restoreRun(
  raw: unknown,
  nodes: RunNode[],
  rewardPool: CardDefinition[],
  lookup: (id: string) => CardDefinition
): RunState | null {
  const saved = parseSavedRun(raw);
  if (!saved || saved.nodeCount !== nodes.length || saved.nodeIndex > nodes.length) return null;
  if (saved.phase === 'inNode' && saved.nodeIndex >= nodes.length) return null;
  try {
    return RunState.fromSaved(saved, nodes, rewardPool, lookup);
  } catch {
    return null;
  }
}
