import type { CombatState } from '../game/CombatState';
import type { RunState, SavedRun } from '../game/RunState';
import { parseSavedRun } from '../game/save';
import { captureScenario, parseScenario } from '../game/scenario';
import type { Scenario } from '../game/scenario';

// What a bug report carries so the maintainer can see what the tester saw (QA_PLAN.md). Plain
// TypeScript, no Phaser: the scene hands in the live run and fight, and this turns them into data.
// To look at one, the dev panel's "Load report snapshot" reads it back through `readSnapshot`.

export const SNAPSHOT_VERSION = 1;
/** How many of the fight's most recent log messages are kept. */
export const SNAPSHOT_LOG_LINES = 40;

export interface SnapshotEnvironment {
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  /** Path and query of the page address (e.g. `?seed=5`), never the host. */
  url: string;
}

export interface ReportSnapshot {
  version: typeof SNAPSHOT_VERSION;
  capturedAt: string;
  build: string;
  /** The scene the tester was on (e.g. `CombatScene`). */
  screen: string;
  environment: SnapshotEnvironment;
  /** The run exactly as a Continue would resume it; null before a run exists. */
  run: SavedRun | null;
  /** The fight on screen as an exact scenario, when one is on screen and could be captured. */
  fight: Scenario | null;
  /** The fight's most recent log messages (non-fight screens have no log). */
  log: string[];
  /** Why a part could not be captured (e.g. a fight can only be captured on the player's turn). */
  errors?: string[];
}

export interface SnapshotInput {
  run: RunState | null;
  combat: CombatState | null;
  screen: string;
  build: string;
  environment: SnapshotEnvironment;
  now: Date;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Bundles the live game into a snapshot. Never throws: a part that cannot be captured is left out and explained in `errors`. */
export function buildSnapshot(input: SnapshotInput): ReportSnapshot {
  const errors: string[] = [];

  let run: SavedRun | null = null;
  if (input.run) {
    try {
      run = input.run.toSaved();
    } catch (error) {
      errors.push(`run: ${messageOf(error)}`);
    }
  }

  let fight: Scenario | null = null;
  let log: string[] = [];
  if (input.combat) {
    log = input.combat.log.slice(-SNAPSHOT_LOG_LINES).map((entry) => entry.message);
    try {
      fight = captureScenario(input.combat);
    } catch (error) {
      errors.push(`fight: ${messageOf(error)}`);
    }
  }

  const snapshot: ReportSnapshot = {
    version: SNAPSHOT_VERSION,
    capturedAt: input.now.toISOString(),
    build: input.build,
    screen: input.screen,
    environment: input.environment,
    run,
    fight,
    log,
  };
  if (errors.length > 0) snapshot.errors = errors;
  return snapshot;
}

/** What `readSnapshot` hands the dev panel: a run ready to enter and, if the report had one, the fight to start from. */
export interface LoadedSnapshot {
  build: string;
  screen: string;
  capturedAt: string;
  run: SavedRun | null;
  fight: Scenario | null;
  log: string[];
  errors: string[];
}

export type SnapshotReadResult = { ok: true; snapshot: LoadedSnapshot } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Checks a snapshot fetched from the proxy (which wraps it as `{ snapshot, ... }`) or pasted bare,
 * and validates its run and fight with the same checks the game uses for saves and scenarios.
 * Never throws.
 */
export function readSnapshot(raw: unknown): SnapshotReadResult {
  const body = isRecord(raw) && isRecord(raw.snapshot) ? raw.snapshot : raw;
  if (!isRecord(body)) return { ok: false, error: 'not a snapshot object' };
  if (body.version !== SNAPSHOT_VERSION) return { ok: false, error: `unknown snapshot version ${String(body.version)}` };

  let run: SavedRun | null = null;
  if (body.run !== null && body.run !== undefined) {
    run = parseSavedRun(body.run);
    if (!run) return { ok: false, error: 'the saved run in this snapshot is not valid (an older or newer build?)' };
  }

  let fight: Scenario | null = null;
  if (body.fight !== null && body.fight !== undefined) {
    const parsed = parseScenario(body.fight);
    if (!parsed.ok) return { ok: false, error: `the fight in this snapshot is not valid: ${parsed.error}` };
    fight = parsed.scenario;
  }

  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
  return {
    ok: true,
    snapshot: {
      build: typeof body.build === 'string' ? body.build : 'unknown',
      screen: typeof body.screen === 'string' ? body.screen : 'unknown',
      capturedAt: typeof body.capturedAt === 'string' ? body.capturedAt : 'unknown',
      run,
      fight,
      log: strings(body.log),
      errors: strings(body.errors),
    },
  };
}
