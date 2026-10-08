import { RunState } from './RunState';
import type { RunPhase, RunWorld, SavedRun } from './RunState';

const PHASES: RunPhase[] = ['draft', 'map', 'inNode', 'reward', 'won', 'lost'];
const KINDS = ['combat', 'elite', 'rest', 'shop', 'event', 'boss'];
const FIGHT_KINDS = ['combat', 'elite', 'boss'];
const TIERS = ['normal', 'elite', 'boss'];

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const isOptString = (v: unknown): boolean => v === undefined || typeof v === 'string';

/** One event outcome, checked by kind and by its fields. `fight` is not allowed in an eventFight's `after` list. */
function validOutcome(o: unknown): boolean {
  if (!isRecord(o)) return false;
  switch (o.kind) {
    case 'gold':
    case 'hp':
    case 'maxHp':
      return isInt(o.value, -1000000, 1000000);
    case 'card':
      return typeof o.cardId === 'string';
    case 'randomCard':
    case 'relic':
      return true;
    default:
      return false; // includes 'fight' (started by chooseEventOption, never stored as pending) and unknown kinds
  }
}

/** One playtest-report log entry, checked by kind and by its fields. */
function validLogEntry(e: unknown): boolean {
  if (!isRecord(e) || !isInt(e.floor, 0, 1000)) return false;
  switch (e.kind) {
    case 'combat':
      return (
        TIERS.includes(e.tier as string) &&
        isStringArray(e.enemies) &&
        (e.result === 'won' || e.result === 'lost') &&
        isInt(e.turns, 0, 1000000) &&
        isInt(e.hpAfter, 0, 100000)
      );
    case 'reward':
      return (
        isStringArray(e.offered) &&
        (e.choice === 'card' || e.choice === 'gold') &&
        isOptString(e.cardId) &&
        isOptString(e.relicId)
      );
    case 'rest':
      return (
        (e.choice === 'heal' || e.choice === 'upgrade') &&
        (e.healed === undefined || isInt(e.healed, 0, 100000)) &&
        isOptString(e.cardId)
      );
    case 'shop':
      return isStringArray(e.bought) && isInt(e.goldSpent, 0, 1000000);
    case 'event':
      return typeof e.eventId === 'string' && typeof e.choice === 'string';
    default:
      return false;
  }
}

function validMap(raw: unknown): boolean {
  if (!isRecord(raw) || !isInt(raw.lanes, 1, 50) || !isInt(raw.floors, 1, 100) || !Array.isArray(raw.nodes)) return false;
  if (raw.nodes.length === 0 || raw.nodes.length > 2000) return false;
  const ids = new Set<string>();
  for (const n of raw.nodes) {
    if (!isRecord(n) || typeof n.id !== 'string') return false;
    if (!isInt(n.floor, 0, raw.floors - 1) || !isInt(n.lane, 0, raw.lanes - 1)) return false;
    if (!KINDS.includes(n.kind as string) || !isStringArray(n.next)) return false;
    if (n.enemies !== undefined && !isStringArray(n.enemies)) return false;
    if (n.eventId !== undefined && typeof n.eventId !== 'string') return false;
    // a stop must carry what entering it needs
    if (FIGHT_KINDS.includes(n.kind as string) && (!n.enemies || n.enemies.length === 0)) return false;
    if (n.kind === 'event' && (typeof n.eventId !== 'string' || n.eventId === '')) return false;
    if (ids.has(n.id)) return false; // ids must be unique
    ids.add(n.id);
  }
  const nodes = raw.nodes as { id: string; floor: number; kind: string; next: string[] }[];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (!nodes.some((n) => n.floor === 0)) return false; // somewhere to start
  // a stop below the top floor must lead somewhere, or the run is stuck on the map
  if (nodes.some((n) => n.floor < (raw.floors as number) - 1 && n.next.length === 0)) return false;
  // every link must lead somewhere that exists and goes up
  return nodes.every((n) => n.next.every((id) => (byId.get(id)?.floor ?? -1) > n.floor));
}

/** Checks that stored data really has the shape of a SavedRun. Returns null if not (never throws). */
export function parseSavedRun(raw: unknown): SavedRun | null {
  if (!isRecord(raw) || raw.version !== 3) return null;
  if (!isInt(raw.seed, 0, 4294967295) || !isInt(raw.rngPosition, 0, 4294967295)) return null;
  if (!validMap(raw.map)) return null;
  const mapNodes = (raw.map as { nodes: { id: string; kind: string }[] }).nodes;
  const ids = new Set(mapNodes.map((n) => n.id));
  if (raw.position !== null && (typeof raw.position !== 'string' || !ids.has(raw.position))) return null;
  if (!isStringArray(raw.visited) || !raw.visited.every((id) => ids.has(id))) return null;
  if (!PHASES.includes(raw.phase as RunPhase)) return null;
  if (raw.position === null && raw.phase !== 'map' && raw.phase !== 'draft') return null;
  if (!isInt(raw.hp, 0, 100000) || !isInt(raw.maxHp, 1, 100000) || !isInt(raw.gold, 0, 1000000)) return null;
  if (raw.hp > raw.maxHp) return null;
  if (typeof raw.position === 'string' && !raw.visited.includes(raw.position)) return null;
  if (!isStringArray(raw.deck) || !isStringArray(raw.relics) || !isStringArray(raw.notice)) return null;

  const reward = raw.pendingReward;
  if ((reward !== null) !== (raw.phase === 'reward')) return null; // a reward screen needs a reward, and only it has one
  if (reward !== null) {
    if (!isRecord(reward) || !isStringArray(reward.cards) || !isInt(reward.gold, 0, 1000000)) return null;
    if (reward.relic !== null && typeof reward.relic !== 'string') return null;
  }
  const draftOffer = raw.pendingDraftOffer;
  if (draftOffer !== null && (!isStringArray(draftOffer) || draftOffer.length === 0)) return null;
  if (draftOffer !== null && raw.phase !== 'draft') return null; // only the draft phase ever has one pending
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
    if (!isRecord(fight) || !isStringArray(fight.enemies) || fight.enemies.length === 0 || !Array.isArray(fight.after)) {
      return null;
    }
    if (!fight.after.every(validOutcome)) return null;
    if (raw.phase !== 'inNode') return null; // an event fight is a stop being played
  }
  if (!Array.isArray(raw.history) || !raw.history.every(validLogEntry)) return null;
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
