import { RunState } from './RunState';
import type { RunPhase, RunWorld, SavedRun } from './RunState';

const PHASES: RunPhase[] = ['map', 'inNode', 'reward', 'won', 'lost'];
const KINDS = ['combat', 'elite', 'rest', 'shop', 'event', 'boss'];

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function validMap(raw: unknown): boolean {
  if (!isRecord(raw) || !isInt(raw.lanes, 1, 50) || !isInt(raw.floors, 1, 100) || !Array.isArray(raw.nodes)) return false;
  if (raw.nodes.length === 0 || raw.nodes.length > 2000) return false;
  const ids = new Set<string>();
  for (const n of raw.nodes) {
    if (!isRecord(n) || typeof n.id !== 'string') return false;
    if (!isInt(n.floor, 0, 100) || !isInt(n.lane, 0, 50)) return false;
    if (!KINDS.includes(n.kind as string) || !isStringArray(n.next)) return false;
    if (n.enemies !== undefined && !isStringArray(n.enemies)) return false;
    if (n.eventId !== undefined && typeof n.eventId !== 'string') return false;
    ids.add(n.id);
  }
  // every link must lead somewhere that exists
  return (raw.nodes as { next: string[] }[]).every((n) => n.next.every((id) => ids.has(id)));
}

/** Checks that stored data really has the shape of a SavedRun. Returns null if not (never throws). */
export function parseSavedRun(raw: unknown): SavedRun | null {
  if (!isRecord(raw) || raw.version !== 2) return null;
  if (!isInt(raw.seed, 0, 4294967295) || !isInt(raw.rngPosition, 0, 4294967295)) return null;
  if (!validMap(raw.map)) return null;
  const ids = new Set((raw.map as { nodes: { id: string }[] }).nodes.map((n) => n.id));
  if (raw.position !== null && (typeof raw.position !== 'string' || !ids.has(raw.position))) return null;
  if (!isStringArray(raw.visited) || !raw.visited.every((id) => ids.has(id))) return null;
  if (!PHASES.includes(raw.phase as RunPhase)) return null;
  if (raw.position === null && raw.phase !== 'map') return null;
  if (!isInt(raw.hp, 0, 100000) || !isInt(raw.maxHp, 1, 100000) || !isInt(raw.gold, 0, 1000000)) return null;
  if (!isStringArray(raw.deck) || !isStringArray(raw.relics) || !isStringArray(raw.notice)) return null;

  const reward = raw.pendingReward;
  if (reward !== null) {
    if (!isRecord(reward) || !isStringArray(reward.cards) || !isInt(reward.gold, 0, 1000000)) return null;
    if (reward.relic !== null && typeof reward.relic !== 'string') return null;
  }
  const shop = raw.shop;
  if (shop !== null) {
    if (!Array.isArray(shop)) return null;
    for (const item of shop) {
      if (!isRecord(item) || typeof item.card !== 'string' || !isInt(item.price, 0, 1000000) || typeof item.sold !== 'boolean') {
        return null;
      }
    }
  }
  const fight = raw.eventFight;
  if (fight !== null) {
    if (!isRecord(fight) || !isStringArray(fight.enemies) || !Array.isArray(fight.after)) return null;
  }
  if (!Array.isArray(raw.history)) return null;
  return raw as unknown as SavedRun;
}

/**
 * Rebuilds a run from stored data, or returns null if the data is unusable: wrong shape, from an
 * older version of the game, or naming content that no longer exists. A bad save never crashes the
 * game; the caller just starts a fresh run.
 */
export function restoreRun(raw: unknown, world: RunWorld): RunState | null {
  const saved = parseSavedRun(raw);
  if (!saved) return null;
  try {
    return RunState.fromSaved(saved, world);
  } catch {
    return null;
  }
}
