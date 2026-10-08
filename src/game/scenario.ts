import { CombatState } from './CombatState';
import type { CombatSnapshot, CombatStats } from './CombatState';
import type { CardDefinition, EnemyDefinition, HeroPowerDefinition, RelicDefinition, StatusId, Statuses } from './types';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { STATUSES, STATUS_ORDER } from '../data/statuses';
import { MAX_ENERGY, MAX_HAND_SIZE, PLAYER_MAX_HP, TEMPERATURE_MAX, TEMPERATURE_MIN } from '../data/tunables';

// A scenario is an exact fight state as plain JSON: capture one from a running fight, or write one
// by hand, and load it back to get the same situation every time. Everything refers to content by
// id, so a scenario is small, readable and survives changes to a card's numbers (it then plays out
// with the new numbers). Guide: docs/SCENARIOS.md. Plain TypeScript, no Phaser.

export const SCENARIO_VERSION = 1;

export interface Scenario {
  version: typeof SCENARIO_VERSION;
  /** Free text for people: what this situation is for. Not used by the game. */
  name?: string;
  note?: string;
  /** The fight's random stream (shuffles, "exhaust a random card"): its seed and where it is now. */
  rng: { seed: number; position: number };
  /** Turn number (1 on the first player turn). */
  turn: number;
  energy: number;
  maxEnergy: number;
  player: { hp: number; maxHp: number; block: number; statuses: Statuses };
  /** Relic ids, in order. Their combat-start effects are NOT run again; their reactive abilities are. */
  relics: string[];
  /** In fight order (they become enemy-0, enemy-1, ...). `stunnedTurns` is Mage-only (Freeze). */
  enemies: { id: string; hp: number; block: number; statuses: Statuses; moveIndex: number; stunnedTurns?: number }[];
  /** Card ids by pile. `draw` is in drawing order: the first entry is drawn next. */
  piles: { draw: string[]; hand: string[]; discard: string[]; exhaust: string[]; powers: string[] };
  /** Counters for "for each card played earlier this turn" style scaling. */
  stats: CombatStats;
  /** Whether each reactive ability already fired this turn, in firing order: relics' first, then
   *  powers' in the order played. Normally all false at the start of a turn. */
  triggersFired: boolean[];
  /** Mage-only mechanics. Left out (default 0/false) unless non-default. */
  temperature?: number;
  energizedTurnsRemaining?: number;
  heroPowerUsedThisTurn?: boolean;
}

/** What a scenario's ids are looked up in. The default is the game's real content. */
export interface ScenarioWorld {
  cards: Readonly<Record<string, CardDefinition>>;
  relics: Readonly<Record<string, RelicDefinition>>;
  enemies: Readonly<Record<string, EnemyDefinition>>;
}

export const GAME_WORLD: ScenarioWorld = { cards: CARDS, relics: RELICS, enemies: ENEMIES };

export type ScenarioResult = { ok: true; scenario: Scenario } | { ok: false; error: string };

// ---- reading (validation) ----

const TOP_KEYS = [
  'version',
  'name',
  'note',
  'rng',
  'turn',
  'energy',
  'maxEnergy',
  'player',
  'relics',
  'enemies',
  'piles',
  'stats',
  'triggersFired',
  'temperature',
  'energizedTurnsRemaining',
  'heroPowerUsedThisTurn',
];
const PILES = ['draw', 'hand', 'discard', 'exhaust', 'powers'] as const;
const MAX_PILE = 500;
const MAX_ENEMIES = 8;
const MAX_TEXT = 2000;

class Bad extends Error {}
const bad = (message: string): never => {
  throw new Bad(message);
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function int(v: unknown, where: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v)) return bad(`${where}: expected a whole number, got ${JSON.stringify(v)}`);
  if (v < min || v > max) return bad(`${where}: ${v} is out of range (${min} to ${max})`);
  return v;
}

function onlyKeys(obj: Record<string, unknown>, allowed: string[], where: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) bad(`${where}: unknown field "${key}" (allowed: ${allowed.join(', ')})`);
  }
}

/** The closest known id to a mistyped one, for the error message. */
function suggest(id: string, known: string[]): string {
  const dist = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = row[j];
        row[j] = next;
      }
    }
    return row[b.length];
  };
  let best = '';
  let bestDist = 3; // only suggest near misses
  for (const k of known) {
    const d = dist(id, k);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  return best ? ` (did you mean "${best}"?)` : '';
}

function statuses(v: unknown, where: string): Statuses {
  if (v === undefined) return {};
  if (!isRecord(v)) return bad(`${where}: expected an object like {"weak": 2}`);
  const out: Statuses = {};
  for (const id of STATUS_ORDER) {
    if (v[id] !== undefined) out[id] = int(v[id], `${where}.${id}`, 1, 999);
  }
  for (const key of Object.keys(v)) {
    if (!(key in STATUSES)) bad(`${where}: unknown status "${key}" (known: ${STATUS_ORDER.join(', ')})`);
  }
  return out;
}

function idList(v: unknown, where: string, known: Readonly<Record<string, unknown>>, what: string, max: number): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return bad(`${where}: expected a list of ${what} ids`);
  if (v.length > max) return bad(`${where}: too many entries (${v.length}, at most ${max})`);
  v.forEach((id, i) => {
    if (typeof id !== 'string') bad(`${where}[${i}]: expected a ${what} id (text), got ${JSON.stringify(id)}`);
    if (!(id in known)) bad(`${where}[${i}]: unknown ${what} "${id}"${suggest(id as string, Object.keys(known))}`);
  });
  return [...v] as string[];
}

/** How many reactive abilities a fight with these relics and powers has. */
function triggerCount(relics: RelicDefinition[], powers: CardDefinition[]): number {
  return relics.reduce((n, r) => n + (r.triggers?.length ?? 0), 0) + powers.reduce((n, p) => n + (p.triggers?.length ?? 0), 0);
}

function readScenario(raw: unknown, world: ScenarioWorld): Scenario {
  if (!isRecord(raw)) return bad('a scenario must be a JSON object');
  onlyKeys(raw, TOP_KEYS, 'scenario');
  if (raw.version !== undefined && raw.version !== SCENARIO_VERSION) {
    bad(`version: this build reads version ${SCENARIO_VERSION}, the scenario says ${JSON.stringify(raw.version)}`);
  }
  for (const key of ['name', 'note'] as const) {
    if (raw[key] !== undefined && (typeof raw[key] !== 'string' || (raw[key] as string).length > MAX_TEXT)) {
      bad(`${key}: expected text of at most ${MAX_TEXT} characters`);
    }
  }

  // random stream: defaults to a fresh stream from seed 1
  const rngRaw = raw.rng ?? { seed: 1 };
  if (!isRecord(rngRaw)) bad('rng: expected {"seed": 123, "position": 456}');
  const rngObj = rngRaw as Record<string, unknown>;
  onlyKeys(rngObj, ['seed', 'position'], 'rng');
  const seed = int(rngObj.seed ?? 1, 'rng.seed', 0, 4294967295);
  const position = int(rngObj.position ?? seed, 'rng.position', 0, 4294967295);

  const maxEnergy = int(raw.maxEnergy ?? MAX_ENERGY, 'maxEnergy', 0, 99);
  const energy = int(raw.energy ?? maxEnergy, 'energy', 0, 99);
  const turn = int(raw.turn ?? 1, 'turn', 1, 100000);

  // player
  const playerRaw = raw.player ?? {};
  if (!isRecord(playerRaw)) bad('player: expected an object');
  const p = playerRaw as Record<string, unknown>;
  onlyKeys(p, ['hp', 'maxHp', 'block', 'statuses'], 'player');
  const maxHp = int(p.maxHp ?? PLAYER_MAX_HP, 'player.maxHp', 1, 100000);
  const hp = int(p.hp ?? maxHp, 'player.hp', 1, maxHp);
  const player = { hp, maxHp, block: int(p.block ?? 0, 'player.block', 0, 100000), statuses: statuses(p.statuses, 'player.statuses') };

  const relics = idList(raw.relics, 'relics', world.relics, 'relic', 50);

  // enemies
  if (!Array.isArray(raw.enemies) || raw.enemies.length === 0) bad('enemies: a scenario needs a list with at least one enemy');
  const enemyList = raw.enemies as unknown[];
  if (enemyList.length > MAX_ENEMIES) bad(`enemies: too many (${enemyList.length}, at most ${MAX_ENEMIES})`);
  const enemies = enemyList.map((entry, i) => {
    const where = `enemies[${i}]`;
    if (!isRecord(entry)) return bad(`${where}: expected an object like {"id": "enemy-a"}`);
    onlyKeys(entry, ['id', 'hp', 'block', 'statuses', 'moveIndex', 'stunnedTurns'], where);
    const id = entry.id;
    if (typeof id !== 'string') return bad(`${where}.id: expected an enemy id (text)`);
    const definition = world.enemies[id];
    if (!definition) return bad(`${where}.id: unknown enemy "${id}"${suggest(id, Object.keys(world.enemies))}`);
    const stunnedTurns = int(entry.stunnedTurns ?? 0, `${where}.stunnedTurns`, 0, 1000);
    return {
      id,
      hp: int(entry.hp ?? definition.maxHp, `${where}.hp`, 0, definition.maxHp),
      block: int(entry.block ?? 0, `${where}.block`, 0, 100000),
      statuses: statuses(entry.statuses, `${where}.statuses`),
      moveIndex: int(entry.moveIndex ?? 0, `${where}.moveIndex`, 0, 1000000),
      ...(stunnedTurns ? { stunnedTurns } : {}),
    };
  });
  if (enemies.every((e) => e.hp === 0)) bad('enemies: every enemy is already at 0 HP, so there is no fight left to play');

  // piles
  const pilesRaw = raw.piles ?? {};
  if (!isRecord(pilesRaw)) bad('piles: expected an object like {"hand": ["strike"]}');
  const pr = pilesRaw as Record<string, unknown>;
  onlyKeys(pr, [...PILES], 'piles');
  const piles = {
    draw: idList(pr.draw, 'piles.draw', world.cards, 'card', MAX_PILE),
    hand: idList(pr.hand, 'piles.hand', world.cards, 'card', MAX_HAND_SIZE),
    discard: idList(pr.discard, 'piles.discard', world.cards, 'card', MAX_PILE),
    exhaust: idList(pr.exhaust, 'piles.exhaust', world.cards, 'card', MAX_PILE),
    powers: idList(pr.powers, 'piles.powers', world.cards, 'card', MAX_PILE),
  };
  piles.powers.forEach((id, i) => {
    if (world.cards[id].type !== 'power') bad(`piles.powers[${i}]: "${id}" is not a power card, so it cannot be in play`);
  });

  // counters
  const statsRaw = raw.stats ?? {};
  if (!isRecord(statsRaw)) bad('stats: expected an object');
  const sr = statsRaw as Record<string, unknown>;
  onlyKeys(sr, ['cardsPlayedThisTurn', 'attacksPlayedThisTurn', 'taggedPlayedThisTurn', 'exhaustedThisCombat', 'cardsAddedThisCombat'], 'stats');
  const tagged: Record<string, number> = {};
  if (sr.taggedPlayedThisTurn !== undefined) {
    if (!isRecord(sr.taggedPlayedThisTurn)) bad('stats.taggedPlayedThisTurn: expected an object like {"A": 2}');
    for (const [tag, n] of Object.entries(sr.taggedPlayedThisTurn as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) {
      tagged[tag] = int(n, `stats.taggedPlayedThisTurn.${tag}`, 0, 100000);
    }
  }
  const stats: CombatStats = {
    cardsPlayedThisTurn: int(sr.cardsPlayedThisTurn ?? 0, 'stats.cardsPlayedThisTurn', 0, 100000),
    attacksPlayedThisTurn: int(sr.attacksPlayedThisTurn ?? 0, 'stats.attacksPlayedThisTurn', 0, 100000),
    taggedPlayedThisTurn: tagged,
    exhaustedThisCombat: int(sr.exhaustedThisCombat ?? piles.exhaust.length, 'stats.exhaustedThisCombat', 0, 100000),
    cardsAddedThisCombat: int(sr.cardsAddedThisCombat ?? 0, 'stats.cardsAddedThisCombat', 0, 100000),
  };

  // reactive abilities: one flag per ability the relics and powers give
  const expected = triggerCount(
    relics.map((id) => world.relics[id]),
    piles.powers.map((id) => world.cards[id])
  );
  let triggersFired: boolean[];
  if (raw.triggersFired === undefined) triggersFired = Array.from({ length: expected }, () => false);
  else {
    const list = raw.triggersFired;
    if (!Array.isArray(list) || !list.every((b) => typeof b === 'boolean')) return bad('triggersFired: expected a list of true/false');
    if (list.length !== expected) {
      bad(`triggersFired: has ${list.length} entries but these relics and powers give ${expected} reactive abilities (leave the field out to use all false)`);
    }
    triggersFired = [...list];
  }

  const scenario: Scenario = { version: SCENARIO_VERSION, rng: { seed, position }, turn, energy, maxEnergy, player, relics, enemies, piles, stats, triggersFired };
  if (typeof raw.name === 'string') scenario.name = raw.name;
  if (typeof raw.note === 'string') scenario.note = raw.note;
  if (raw.temperature !== undefined) scenario.temperature = int(raw.temperature, 'temperature', TEMPERATURE_MIN, TEMPERATURE_MAX);
  if (raw.energizedTurnsRemaining !== undefined) {
    scenario.energizedTurnsRemaining = int(raw.energizedTurnsRemaining, 'energizedTurnsRemaining', 0, 1000);
  }
  if (raw.heroPowerUsedThisTurn !== undefined) {
    if (typeof raw.heroPowerUsedThisTurn !== 'boolean') bad('heroPowerUsedThisTurn: expected true or false');
    scenario.heroPowerUsedThisTurn = raw.heroPowerUsedThisTurn as boolean;
  }
  return scenario;
}

/** Checks parsed JSON and fills in defaults. Never throws: a bad scenario comes back as `{ ok: false, error }` with a plain message. */
export function parseScenario(raw: unknown, world: ScenarioWorld = GAME_WORLD): ScenarioResult {
  try {
    return { ok: true, scenario: readScenario(raw, world) };
  } catch (error) {
    if (error instanceof Bad) return { ok: false, error: error.message };
    return { ok: false, error: `could not read the scenario: ${String(error)}` };
  }
}

/** Same, from JSON text (what the dev panel's box holds). */
export function parseScenarioText(text: string, world: ScenarioWorld = GAME_WORLD): ScenarioResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  return parseScenario(raw, world);
}

// ---- converting to and from a fight ----

/** A validated scenario as the engine's snapshot (ids looked up). Throws only if the scenario was not validated against this world. */
export function scenarioToSnapshot(scenario: Scenario, world: ScenarioWorld = GAME_WORLD): CombatSnapshot {
  const card = (id: string): CardDefinition => world.cards[id] ?? bad(`unknown card "${id}"`);
  const list = (ids: string[]): CardDefinition[] => ids.map(card);
  return {
    rng: { ...scenario.rng },
    turn: scenario.turn,
    energy: scenario.energy,
    maxEnergy: scenario.maxEnergy,
    player: { ...scenario.player, statuses: { ...scenario.player.statuses } },
    enemies: scenario.enemies.map((e) => ({
      definition: world.enemies[e.id] ?? bad(`unknown enemy "${e.id}"`),
      hp: e.hp,
      block: e.block,
      statuses: { ...e.statuses },
      moveIndex: e.moveIndex,
      stunnedTurns: e.stunnedTurns ?? 0,
    })),
    relics: scenario.relics.map((id) => world.relics[id] ?? bad(`unknown relic "${id}"`)),
    piles: {
      draw: list(scenario.piles.draw),
      hand: list(scenario.piles.hand),
      discard: list(scenario.piles.discard),
      exhaust: list(scenario.piles.exhaust),
      powers: list(scenario.piles.powers),
    },
    stats: { ...scenario.stats, taggedPlayedThisTurn: { ...scenario.stats.taggedPlayedThisTurn } },
    triggersFired: [...scenario.triggersFired],
    temperature: scenario.temperature ?? 0,
    energizedTurnsRemaining: scenario.energizedTurnsRemaining ?? 0,
    heroPowerUsedThisTurn: scenario.heroPowerUsedThisTurn ?? false,
  };
}

const orderedStatuses = (s: Statuses): Statuses => {
  const out: Statuses = {};
  for (const id of STATUS_ORDER) if ((s[id as StatusId] ?? 0) > 0) out[id] = s[id];
  return out;
};

/** The engine's snapshot as a scenario (cards back to ids). */
export function snapshotToScenario(snapshot: CombatSnapshot, meta: { name?: string; note?: string } = {}): Scenario {
  const ids = (cards: CardDefinition[]): string[] => cards.map((c) => c.id);
  const tagged = Object.fromEntries(Object.entries(snapshot.stats.taggedPlayedThisTurn).sort(([a], [b]) => a.localeCompare(b)));
  const scenario: Scenario = {
    version: SCENARIO_VERSION,
    rng: { ...snapshot.rng },
    turn: snapshot.turn,
    energy: snapshot.energy,
    maxEnergy: snapshot.maxEnergy,
    player: { ...snapshot.player, statuses: orderedStatuses(snapshot.player.statuses) },
    relics: snapshot.relics.map((r) => r.id),
    enemies: snapshot.enemies.map((e) => ({
      id: e.definition.id,
      hp: e.hp,
      block: e.block,
      statuses: orderedStatuses(e.statuses),
      moveIndex: e.moveIndex,
      ...(e.stunnedTurns ? { stunnedTurns: e.stunnedTurns } : {}),
    })),
    piles: {
      draw: ids(snapshot.piles.draw),
      hand: ids(snapshot.piles.hand),
      discard: ids(snapshot.piles.discard),
      exhaust: ids(snapshot.piles.exhaust),
      powers: ids(snapshot.piles.powers),
    },
    stats: { ...snapshot.stats, taggedPlayedThisTurn: tagged },
    triggersFired: [...snapshot.triggersFired],
  };
  if (meta.name) scenario.name = meta.name;
  if (meta.note) scenario.note = meta.note;
  if (snapshot.temperature) scenario.temperature = snapshot.temperature;
  if (snapshot.energizedTurnsRemaining) scenario.energizedTurnsRemaining = snapshot.energizedTurnsRemaining;
  if (snapshot.heroPowerUsedThisTurn) scenario.heroPowerUsedThisTurn = snapshot.heroPowerUsedThisTurn;
  return scenario;
}

/** The running fight as a scenario. Throws if it can't be captured exactly (see `CombatState.exportState`). */
export function captureScenario(combat: CombatState, meta: { name?: string; note?: string } = {}): Scenario {
  return snapshotToScenario(combat.exportState(), meta);
}

/** A new fight, standing exactly where the scenario says. Call `start()` after attaching listeners, as for any fight. */
export function restoreScenario(scenario: Scenario, world: ScenarioWorld = GAME_WORLD, heroPower?: HeroPowerDefinition): CombatState {
  return new CombatState([], [], { restore: scenarioToSnapshot(scenario, world), heroPower });
}

/** The scenario as readable JSON text: indented, with each list of ids on one line. */
export function formatScenario(scenario: Scenario): string {
  return JSON.stringify(scenario, null, 2).replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_all, inner: string) => `[${inner.replace(/\s*\n\s*/g, ' ')}]`);
}

// ---- playing a scenario from code (tests, tools) ----

/** One thing a person does: play a card (by id; the first copy in hand) at an enemy (index, default the first living one), or end the turn. */
export type ScenarioPlay = { card: string; target?: number } | { endTurn: true };

export interface ScenarioRun {
  combat: CombatState;
  /** Every event the fight announced, with card instances reduced to their ids so two runs can be compared. */
  events: { type: string; payload: unknown }[];
  /** The fight's phase at the end ('playerTurn' unless it ended or an enemy turn was still going). */
  phase: CombatState['phase'];
  /** The state after the last play, as a scenario; null if it is no longer the player's turn (the fight ended). */
  final: Scenario | null;
}

const EVENT_TYPES = [
  'turnStarted',
  'cardPlayed',
  'handChanged',
  'cardExhausted',
  'energyChanged',
  'hpLost',
  'damageDealt',
  'blockGained',
  'statusChanged',
  'enemyTurnStarted',
  'enemyMoveResolved',
  'enemyDied',
  'combatEnded',
] as const;

/** Instances become their card ids so events from two separate fights are comparable. */
const plainPayload = (payload: unknown): unknown =>
  JSON.parse(JSON.stringify(payload, (_key, value: unknown) => (isRecord(value) && 'instanceId' in value && 'definition' in value ? (value.definition as CardDefinition).id : value)));

/** Starts listening to a fight: the returned list fills with every event from now on (card instances reduced to ids). */
export function recordEvents(combat: CombatState): ScenarioRun['events'] {
  const events: ScenarioRun['events'] = [];
  for (const type of EVENT_TYPES) combat.on(type, (payload: unknown) => events.push({ type, payload: plainPayload(payload) }));
  return events;
}

/** Performs the plays in order on a fight. Throws, naming the play, if one is impossible (card not in hand, too expensive, no such target). */
export function performPlays(combat: CombatState, plays: ScenarioPlay[]): void {
  plays.forEach((play, i) => {
    const label = `play #${i + 1} (${'endTurn' in play ? 'end turn' : play.card})`;
    if (combat.phase !== 'playerTurn') throw new Error(`${label}: the fight is no longer on the player's turn (${combat.phase})`);
    if ('endTurn' in play) return combat.endPlayerTurn();
    const instance = combat.deck.hand.find((c) => c.definition.id === play.card);
    if (!instance) throw new Error(`${label}: "${play.card}" is not in the hand (${combat.deck.hand.map((c) => c.definition.id).join(', ') || 'empty'})`);
    let targetId: string | undefined;
    if (instance.definition.target === 'enemy') {
      const enemy = play.target === undefined ? combat.livingEnemies[0] : combat.enemies[play.target];
      if (!enemy || enemy.hp <= 0) throw new Error(`${label}: there is no living enemy to aim at${play.target === undefined ? '' : ` at index ${play.target}`}`);
      targetId = enemy.id;
    }
    if (!combat.playCard(instance.instanceId, targetId)) throw new Error(`${label}: the game refused the play (not enough energy?)`);
  });
}

/** Starts the scenario, then performs the plays in order (see `performPlays` for when it throws). */
export function runScenario(scenario: Scenario, plays: ScenarioPlay[], world: ScenarioWorld = GAME_WORLD): ScenarioRun {
  const combat = restoreScenario(scenario, world);
  const events = recordEvents(combat);
  combat.start();
  performPlays(combat, plays);
  const final = combat.phase === 'playerTurn' ? captureScenario(combat) : null;
  return { combat, events, phase: combat.phase, final };
}
