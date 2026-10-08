// Shared machinery for the *.invariants.test.ts files: seeded fuzz drivers and invariant checks.
// Everything here is generic over the registries (CARDS, RELICS, ENEMIES, EVENTS) and over every
// array-valued pile on the Deck, so content and piles added later are covered without edits.
// Test support only: nothing in the game imports this file.

import { CombatState } from './CombatState';
import type { CombatPhase } from './CombatState';
import { RunState } from './RunState';
import { Rng } from './rng';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { STATUSES } from '../data/statuses';
import type { CardDefinition, CardInstance, EnemyDefinition, RelicDefinition } from './types';

// ---------- small utilities ----------

export const pickOne = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng.next() * items.length)];

/** Every own array-valued property of the deck: draw pile, hand, discard, and any pile added later. */
export function deckPiles(combat: CombatState): [string, CardInstance[]][] {
  return Object.entries(combat.deck).filter((e): e is [string, CardInstance[]] => Array.isArray(e[1]));
}

export function totalCards(combat: CombatState): number {
  return deckPiles(combat).reduce((sum, [, pile]) => sum + pile.length, 0);
}

/** Throws if any number reachable from `value` (skipping `definition` keys) is NaN or infinite. */
export function assertFiniteDeep(value: unknown, path: string, depth = 0): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} is ${value}`);
  } else if (depth < 6 && value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'definition') continue;
      assertFiniteDeep(v, `${path}.${k}`, depth + 1);
    }
  }
}

/** Everything about a fight that a rejected action must leave untouched. */
export function snapshotCombat(c: CombatState): string {
  return JSON.stringify({
    player: c.player,
    enemies: c.enemies.map(({ definition: _definition, ...rest }) => rest),
    energy: c.energy,
    maxEnergy: c.maxEnergy,
    phase: c.phase,
    turn: c.turnNumber,
    piles: deckPiles(c).map(([name, pile]) => [name, pile.map((card) => card.instanceId)]),
    log: c.log.length,
  });
}

const registryMentionsEnergy = (): boolean =>
  /energy/i.test(
    JSON.stringify([Object.values(CARDS), Object.values(RELICS), Object.values(ENEMIES)], (k, v) => (k === 'name' ? undefined : v))
  );

/** Documented cap: maxEnergy (MAX_ENERGY) is the per-turn refill, so energy can't exceed it unless some content gains energy. */
const ENERGY_CAP = (): number => (registryMentionsEnergy() ? 999 : 0);
let energyCap: number | undefined;

// ---------- the invariants ----------

/** Throws (with a message naming what broke) if the fight is in an impossible state. */
export function checkCombatInvariants(c: CombatState, expectedCards: number): void {
  energyCap ??= ENERGY_CAP();
  const fail = (msg: string): never => {
    throw new Error(`${msg} (turn ${c.turnNumber}, phase ${c.phase})`);
  };
  const who = [c.player, ...c.enemies];
  for (const m of who) {
    if (!Number.isFinite(m.hp) || !Number.isFinite(m.maxHp) || !Number.isFinite(m.block)) fail(`${m.id} has non-finite hp/maxHp/block`);
    if (m.maxHp < 1) fail(`${m.id} maxHp ${m.maxHp} < 1`);
    if (m.hp < 0 || m.hp > m.maxHp) fail(`${m.id} hp ${m.hp} outside [0, ${m.maxHp}]`);
    if (m.block < 0) fail(`${m.id} block ${m.block} < 0`);
    for (const [id, stacks] of Object.entries(m.statuses)) {
      if (!(id in STATUSES)) fail(`${m.id} has unknown status ${id}`);
      if (!Number.isInteger(stacks) || (stacks as number) <= 0) fail(`${m.id} status ${id} has stacks ${stacks}`);
    }
  }
  for (const e of c.enemies) if (!Number.isInteger(e.moveIndex) || e.moveIndex < 0) fail(`${e.id} moveIndex ${e.moveIndex}`);
  if (!Number.isInteger(c.energy) || c.energy < 0) fail(`energy ${c.energy}`);
  const cap = energyCap! > 0 ? energyCap! : c.maxEnergy;
  if (c.energy > cap) fail(`energy ${c.energy} above cap ${cap}`);
  assertFiniteDeep(c.player, 'player');
  assertFiniteDeep(c.enemies, 'enemies');
  for (const [k, v] of Object.entries(c)) if (typeof v === 'number' && !Number.isFinite(v)) fail(`combat.${k} is ${v}`);

  const ids = new Set<string>();
  let total = 0;
  for (const [name, pile] of deckPiles(c)) {
    for (const card of pile) {
      total++;
      if (!card.definition || typeof card.instanceId !== 'string') fail(`bad card instance in ${name}`);
      if (ids.has(card.instanceId)) fail(`duplicate instanceId ${card.instanceId} (in ${name})`);
      ids.add(card.instanceId);
    }
  }
  if (total !== expectedCards) fail(`card count ${total}, expected ${expectedCards}`);

  const phases: CombatPhase[] = ['playerTurn', 'enemyTurn', 'won', 'lost'];
  if (!phases.includes(c.phase)) fail(`unknown phase ${c.phase}`);
  const allDead = c.enemies.every((e) => e.hp <= 0);
  if (c.phase === 'won' && !allDead) fail('won with an enemy alive');
  if (c.phase === 'lost' && c.player.hp > 0) fail('lost with the player alive');
  if (c.phase === 'playerTurn' && (allDead || c.player.hp <= 0)) fail('still in playerTurn after the fight was decided');
}

// ---------- fight fuzzing ----------

export interface FightFuzzOptions {
  deck: CardDefinition[];
  enemies: EnemyDefinition[];
  relics?: RelicDefinition[];
  player?: { hp: number; maxHp: number };
  /** Drives both the shuffles and the player's choices (separate streams, both from this seed). */
  seed: number;
  turnCap?: number;
}

export interface FightFuzzResult {
  phase: CombatPhase;
  turns: number;
  actions: number;
  cardsPlayed: number;
  hp: number;
}

/**
 * Plays one seeded fight with random legal play, checking invariants after every action and on
 * every event. Throws on the first violation. Returns what happened.
 */
export function fuzzFight(o: FightFuzzOptions): FightFuzzResult {
  const turnCap = o.turnCap ?? 300;
  const shuffleRng = new Rng(o.seed);
  const choiceRng = new Rng(o.seed ^ 0x5bd1e995);
  const combat = new CombatState(o.deck, o.enemies, { player: o.player, random: () => shuffleRng.next(), relics: o.relics });
  const expected = o.deck.length;
  let cardsPlayed = 0;
  let actions = 0;
  let ended = 0;
  const died = new Set<string>();
  let turnsStarted = 0;
  let sawTerminal: CombatPhase | null = null;

  // ---- event consistency, checked at the moment each event is emitted (emission is synchronous) ----
  combat.on('damageDealt', (e) => {
    const target = combat.combatant(e.target);
    if (e.remainingHp !== target.hp) throw new Error(`damageDealt remainingHp ${e.remainingHp} != ${e.target} hp ${target.hp}`);
    if (!(e.absorbed >= 0) || !(e.amount >= e.absorbed)) throw new Error(`damageDealt amount/absorbed odd: ${JSON.stringify(e)}`);
  });
  combat.on('blockGained', (e) => {
    if (!(e.amount >= 0)) throw new Error(`blockGained ${e.amount}`);
  });
  combat.on('enemyMoveResolved', (e) => {
    if (e.damage) {
      if (e.damage.remainingHp !== combat.player.hp) throw new Error(`enemyMoveResolved remainingHp ${e.damage.remainingHp} != player hp ${combat.player.hp}`);
      if (!(e.damage.amount >= e.damage.absorbed) || e.damage.absorbed < 0) throw new Error('enemyMoveResolved damage odd');
    }
  });
  combat.on('handChanged', (e) => {
    if (e.hand.length !== combat.deck.hand.length) throw new Error('handChanged hand size differs from the live hand');
    if (e.drawPile !== combat.deck.drawPile.length) throw new Error('handChanged drawPile differs from the live pile');
    if (e.discardPile !== combat.deck.discardPile.length) throw new Error('handChanged discardPile differs from the live pile');
  });
  combat.on('statusChanged', (e) => {
    for (const [id, stacks] of Object.entries(e.statuses)) {
      if (!Number.isInteger(stacks) || (stacks as number) <= 0) throw new Error(`statusChanged snapshot has ${id}=${stacks}`);
    }
    if (!Number.isFinite(e.delta) || e.delta === 0) throw new Error(`statusChanged delta ${e.delta}`);
  });
  combat.on('enemyDied', (e) => {
    if (died.has(e.enemyId)) throw new Error(`${e.enemyId} died twice`);
    died.add(e.enemyId);
    if (combat.combatant(e.enemyId).hp > 0) throw new Error(`${e.enemyId} announced dead with hp > 0`);
  });
  combat.on('turnStarted', () => {
    turnsStarted++;
  });
  combat.on('combatEnded', (e) => {
    ended++;
    if (e.result !== combat.phase) throw new Error(`combatEnded ${e.result} but phase is ${combat.phase}`);
  });

  const check = (): void => {
    checkCombatInvariants(combat, expected + combat.stats.cardsAddedThisCombat);
    if (sawTerminal && combat.phase !== sawTerminal) throw new Error(`terminal phase ${sawTerminal} changed to ${combat.phase}`);
    if (combat.phase === 'won' || combat.phase === 'lost') sawTerminal = combat.phase;
    if (combat.phase === 'enemyTurn') throw new Error('enemyTurn is visible between actions');
  };

  combat.start();
  check();

  /** Attempts that must be refused and change nothing. */
  const probeIllegal = (): void => {
    const before = snapshotCombat(combat);
    const attempts: [string, string | undefined][] = [['no-such-card', undefined], ['', 'enemy-0']];
    for (const card of combat.deck.hand) {
      if (!combat.canPlay(card)) attempts.push([card.instanceId, card.definition.target ? combat.livingEnemies[0]?.id : undefined]);
      if (card.definition.target) {
        attempts.push([card.instanceId, undefined]);
        attempts.push([card.instanceId, 'enemy-99']);
        attempts.push([card.instanceId, 'player']);
        for (const e of combat.enemies) if (e.hp <= 0) attempts.push([card.instanceId, e.id]);
      }
    }
    for (const [id, target] of attempts) {
      const hand = combat.deck.hand.find((c) => c.instanceId === id);
      const legal = !!hand && combat.canPlay(hand) && (!hand.definition.target || combat.livingEnemies.some((e) => e.id === target));
      if (legal) continue;
      if (combat.playCard(id, target)) throw new Error(`playCard(${id}, ${target}) succeeded but should be refused`);
    }
    if (snapshotCombat(combat) !== before) throw new Error('a refused playCard changed the state');
  };

  while (combat.phase === 'playerTurn') {
    if (combat.turnNumber > turnCap) throw new Error(`fight did not end within ${turnCap} turns`);
    if (choiceRng.next() < 0.3) probeIllegal();
    const playable = combat.deck.hand.filter((c) => combat.canPlay(c));
    if (playable.length === 0 || choiceRng.next() < 0.12) {
      combat.endPlayerTurn();
      actions++;
      check();
      continue;
    }
    const card = pickOne(choiceRng, playable);
    const living = combat.livingEnemies;
    const target = card.definition.target ? pickOne(choiceRng, living).id : choiceRng.next() < 0.2 ? living[0].id : undefined;
    if (!combat.playCard(card.instanceId, target)) throw new Error(`a playable card (${card.definition.id}) was refused`);
    cardsPlayed++;
    actions++;
    check();
  }

  // ---- after the end: everything is refused and nothing moves ----
  const frozen = snapshotCombat(combat);
  const eventsBefore = ended;
  for (const card of combat.deck.hand) {
    if (combat.playCard(card.instanceId, 'enemy-0')) throw new Error('playCard worked after the fight ended');
  }
  combat.endPlayerTurn();
  combat.devKillAllEnemies();
  if (snapshotCombat(combat) !== frozen) throw new Error('state changed after the fight ended');
  if (ended !== eventsBefore || ended !== 1) throw new Error(`combatEnded fired ${ended} times`);
  if (turnsStarted !== combat.turnNumber) throw new Error(`turnStarted fired ${turnsStarted} times for ${combat.turnNumber} turns`);
  for (const e of combat.enemies) if (e.hp <= 0 && !died.has(e.id)) throw new Error(`${e.id} died without an enemyDied event`);

  return { phase: combat.phase, turns: combat.turnNumber, actions, cardsPlayed, hp: combat.player.hp };
}

// ---------- run driving ----------

export interface StepResult {
  kind: string;
}

/**
 * Makes one decision-and-consequence for a run, as a pure function of (run state, `stepSeed`):
 * the policy's choices come from a stream seeded by the step, so a run restored from a save at
 * any stop behaves exactly like the original. A whole fight counts as one step.
 */
export function stepRun(run: RunState, stepSeed: number, opts: { turnCap?: number } = {}): StepResult {
  const rng = new Rng(stepSeed);
  if (run.phase === 'map') {
    run.chooseNode(pickOne(rng, run.mapChoices).id);
    return { kind: 'map' };
  }
  if (run.phase === 'reward') {
    const offer = run.pendingReward!;
    if (rng.next() < 0.5 && offer.cards.length > 0) run.takeRewardCard(Math.floor(rng.next() * offer.cards.length));
    else run.takeRewardGold();
    return { kind: 'reward' };
  }
  const node = run.currentNode;
  if (node.kind === 'combat') {
    const combat = new CombatState(run.deck, node.enemies, {
      player: { hp: run.hp, maxHp: run.maxHp },
      random: runStream(run.newCombatRng()),
      relics: run.relics,
    });
    const result = autoPlay(combat, rng, opts.turnCap ?? 200);
    run.finishCombat(result === 'won' ? 'won' : 'lost', combat.player.hp, combat.turnNumber);
    return { kind: `combat:${result}` };
  }
  if (node.kind === 'rest') {
    const upgradable = run.upgradableCards;
    if (upgradable.length > 0 && rng.next() < 0.5) run.upgradeCard(pickOne(rng, upgradable).index);
    else run.rest();
    return { kind: 'rest' };
  }
  if (node.kind === 'event') {
    run.chooseEventOption(Math.floor(rng.next() * node.event.choices.length));
    return { kind: 'event' };
  }
  for (let i = 0; i < run.shopItems.length; i++) if (rng.next() < 0.6) run.buyShopItem(i);
  run.leaveShop();
  return { kind: 'shop' };
}

const runStream = (rng: Rng) => () => rng.next();

/** Plays a fight to its end with random legal play. Returns 'stalled' at the turn cap. */
export function autoPlay(combat: CombatState, rng: Rng, turnCap: number): 'won' | 'lost' | 'stalled' {
  combat.start();
  while (combat.phase === 'playerTurn') {
    if (combat.turnNumber > turnCap) return 'stalled';
    const playable = combat.deck.hand.filter((c) => combat.canPlay(c));
    if (playable.length === 0 || rng.next() < 0.1) {
      combat.endPlayerTurn();
      continue;
    }
    const card = pickOne(rng, playable);
    combat.playCard(card.instanceId, card.definition.target ? pickOne(rng, combat.livingEnemies).id : undefined);
  }
  return combat.phase === 'won' ? 'won' : 'lost';
}

export function isRunOver(run: RunState): boolean {
  return run.phase === 'won' || run.phase === 'lost';
}

/** Steps a run to its end (or the step cap), returning the step results. */
export function playWholeRun(run: RunState, seed: number, maxSteps = 400): string[] {
  const kinds: string[] = [];
  for (let i = 0; i < maxSteps && !isRunOver(run); i++) kinds.push(stepRun(run, (seed * 7919 + i * 104729) >>> 0).kind);
  return kinds;
}
