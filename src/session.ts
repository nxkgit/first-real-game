import type { CombatState } from './game/CombatState';
import type { RunState } from './game/RunState';
import type { Scenario } from './game/scenario';

/** The run being played right now, so tools outside the scenes (the dev panel) can find it. */
let current: RunState | null = null;

export function getCurrentRun(): RunState | null {
  return current;
}

export function setCurrentRun(run: RunState): void {
  current = run;
}

/** The fight on screen right now, if any, so the dev panel can act on it. */
let currentCombat: CombatState | null = null;

export function getCurrentCombat(): CombatState | null {
  return currentCombat;
}

export function setCurrentCombat(combat: CombatState | null): void {
  currentCombat = combat;
}

/** A scenario the dev panel wants the next fight to start from; the fight scene takes it once. */
let pendingScenario: Scenario | null = null;

export function setPendingScenario(scenario: Scenario | null): void {
  pendingScenario = scenario;
}

/** Hands over the waiting scenario (and clears it, so only one fight uses it). */
export function takePendingScenario(): Scenario | null {
  const scenario = pendingScenario;
  pendingScenario = null;
  return scenario;
}

/** A seed given in the page address (`?seed=123`), for replaying a particular run. */
export function seedFromUrl(): number | undefined {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (raw === null || !/^\d+$/.test(raw)) return undefined;
  const value = Number(raw);
  return value <= 4294967295 ? value : undefined;
}
