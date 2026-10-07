import type { RelicDefinition } from '../game/types';

// PLACEHOLDER relics: simple, functional effects with plain descriptive names, to exercise the relic
// system. Real relic design and names are the user's to author (see CLAUDE.md). Text is generated
// from the effects (game/describe.ts).

export const STRENGTH_TOKEN: RelicDefinition = {
  id: 'strength-token',
  name: 'Strength Token',
  onCombatStart: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }],
};

export const VITALITY_TOKEN: RelicDefinition = {
  id: 'vitality-token',
  name: 'Vitality Token',
  // raising max HP also heals by the same amount, as in StS
  onPickup: [{ kind: 'maxHp', value: 10 }],
};

export const GUARD_TOKEN: RelicDefinition = {
  id: 'guard-token',
  name: 'Guard Token',
  onCombatStart: [{ kind: 'block', value: 6 }],
};

export const RECOVERY_TOKEN: RelicDefinition = {
  id: 'recovery-token',
  name: 'Recovery Token',
  onVictory: [{ kind: 'heal', value: 4 }],
};

export const DRAW_TOKEN: RelicDefinition = {
  id: 'draw-token',
  name: 'Draw Token',
  onTurnStart: [{ kind: 'draw', value: 1 }],
};

const ALL_RELICS: RelicDefinition[] = [STRENGTH_TOKEN, VITALITY_TOKEN, GUARD_TOKEN, RECOVERY_TOKEN, DRAW_TOKEN];

// Placeholder synergy-test relics (use triggers). Registered so saves, the dev panel and the
// content browser know them, but NOT in RELIC_POOL, so the live game never hands them out.
export const EXHAUST_TOKEN: RelicDefinition = {
  id: 'exhaust-token',
  name: 'Exhaust Token',
  triggers: [{ on: 'cardExhausted', effects: [{ kind: 'block', value: 3 }] }],
};

export const KILL_TOKEN: RelicDefinition = {
  id: 'kill-token',
  name: 'Kill Token',
  triggers: [{ on: 'enemyDied', oncePerTurn: true, effects: [{ kind: 'draw', value: 1 }] }],
};

export const SYNERGY_RELICS: RelicDefinition[] = [EXHAUST_TOKEN, KILL_TOKEN];

export const RELICS: Readonly<Record<string, RelicDefinition>> = Object.fromEntries(
  [...ALL_RELICS, ...SYNERGY_RELICS].map((relic): [string, RelicDefinition] => [relic.id, relic])
);

if (Object.keys(RELICS).length !== ALL_RELICS.length + SYNERGY_RELICS.length) throw new Error('duplicate relic id');

export function getRelic(id: string): RelicDefinition {
  const relic = RELICS[id];
  if (!relic) throw new Error(`unknown relic id: ${id}`);
  return relic;
}

/** Relics that can be found during a run. */
export const RELIC_POOL: RelicDefinition[] = ALL_RELICS;
