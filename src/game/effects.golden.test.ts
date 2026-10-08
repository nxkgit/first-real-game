import { describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { CombatState } from './CombatState';
import type { CombatEventMap } from './CombatState';
import { cardText, describeEffect, relicText } from './describe';
import { intentIcons } from './intent';
import { Rng } from './rng';
import type { CardDefinition, Effect, EnemyDefinition, HeroPowerDefinition, RelicDefinition, Scaling, ScaleSource, StatusId, TriggerOn } from './types';
import golden from './fixtures/effectsGolden.json';

/**
 * Golden event-log test: a few hundred seeded fights over synthetic content that exercises every
 * effect kind, scaling source, trigger and enemy-move shape. Each fight's full event log (plus the
 * message log, final state and the intent/describe readouts) is hashed; the stored hashes were
 * generated BEFORE the effect-registry refactor, so a pass proves the refactor changed nothing.
 *
 * It stays as a regression guard for the rules afterwards. The content is self-contained (not the
 * live card registry) and the balance numbers the engine reads are pinned below, so editing real
 * content or tunables does not disturb it. Change it only when an engine rule changes ON PURPOSE:
 * run `UPDATE_GOLDEN=1 npx vitest run src/game/effects.golden.test.ts` and review the diff.
 */

// Pin every tunable the combat engine and status definitions read.
vi.mock('../data/tunables', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/tunables')>()),
  MAX_ENERGY: 4,
  HAND_SIZE: 5,
  MAX_HAND_SIZE: 10,
  MAX_TRIGGER_DEPTH: 3,
  EMPOWERED_DAMAGE_MULT: 2,
  WEAK_DAMAGE_MULT: 0.75,
  VULNERABLE_DAMAGE_MULT: 1.5,
  PLAYER_MAX_HP: 60,
}));

// ---- synthetic content ----

const mk = (id: string, extra: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id,
  type: 'skill',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  ...extra,
});
const atk = (id: string, effects: Effect[], extra: Partial<CardDefinition> = {}): CardDefinition =>
  mk(id, { type: 'attack', target: 'enemy', effects, ...extra });
const skill = (id: string, effects: Effect[], extra: Partial<CardDefinition> = {}): CardDefinition => mk(id, { effects, ...extra });
const dmg = (value: number, scaling?: Scaling): Effect => ({ kind: 'damage', value, scaling });
const blk = (value: number, scaling?: Scaling): Effect => ({ kind: 'block', value, scaling });
const draw = (value: number, scaling?: Scaling): Effect => ({ kind: 'draw', value, scaling });
const status = (s: StatusId, value: number, to: 'target' | 'self', scaling?: Scaling): Effect => ({ kind: 'applyStatus', status: s, value, to, scaling });
const energy = (value: number, scaling?: Scaling): Effect => ({ kind: 'gainEnergy', value, scaling });
const loseHp = (value: number, scaling?: Scaling): Effect => ({ kind: 'loseHp', value, scaling });
const mult = (s: StatusId, factor: number, to: 'target' | 'self'): Effect => ({ kind: 'multiplyStatus', status: s, factor, to });
const exhaustRandom = (value: number): Effect => ({ kind: 'exhaustRandom', value });
const discardRandom = (value: number): Effect => ({ kind: 'discardRandom', value });
const damageAll = (value: number, scaling?: Scaling): Effect => ({ kind: 'damageAll', value, scaling });
const adjustTemp = (value: number): Effect => ({ kind: 'adjustTemperature', value });
const addCardToHand = (cardId: string, value: number, scaling?: Scaling): Effect => ({ kind: 'addCardToHand', cardId, value, scaling });

const SOURCES: ScaleSource[] = [
  'cardsPlayedThisTurn',
  'attacksPlayedThisTurn',
  'taggedPlayedThisTurn',
  'block',
  'strength',
  'handSize',
  'exhaustedThisCombat',
  'targetVulnerable',
  'targetFreeze',
  'temperature',
];
const per = (p: ScaleSource, value = 2): Scaling => ({ per: p, value, tag: p === 'taggedPlayedThisTurn' ? 'x' : undefined });

const POOL: CardDefinition[] = [
  atk('hit', [dmg(6)], { cost: 1, tags: ['x'] }),
  atk('double', [dmg(3), dmg(3)], { cost: 1 }),
  atk('free-hit', [dmg(2)], { cost: 0, tags: ['x', 'y'] }),
  atk('heavy', [dmg(14)], { cost: 2 }),
  atk('hit-vuln', [dmg(4), status('vulnerable', 2, 'target')]),
  atk('hit-weak', [dmg(4), status('weak', 1, 'target')], { tags: ['y'] }),
  atk('hit-block', [dmg(5), blk(4)]),
  atk('exhaust-hit', [dmg(9)], { exhaust: true }),
  atk('drain', [dmg(7), loseHp(2)], { cost: 1 }),
  ...SOURCES.map((p) => atk(`atk-${p}`, [dmg(1, per(p))], { tags: p === 'taggedPlayedThisTurn' ? ['x'] : undefined })),
  atk('atk-base-scale', [dmg(4, per('cardsPlayedThisTurn', 3))], { cost: 0 }),
  skill('block', [blk(5)]),
  skill('big-block', [blk(9)], { cost: 2 }),
  ...SOURCES.map((p) => skill(`block-${p}`, [blk(0, per(p, 1))])),
  skill('draw2', [draw(2)]),
  skill('draw-hand', [draw(0, per('handSize', 1))], { cost: 0 }),
  skill('draw-exhausted', [draw(1, per('exhaustedThisCombat', 1))], { cost: 0 }),
  skill('energy', [energy(1)], { cost: 0, exhaust: true }),
  skill('energy-scaled', [energy(0, per('attacksPlayedThisTurn', 1))], { cost: 0 }),
  skill('blood-draw', [loseHp(3), draw(2)], { cost: 0 }),
  skill('blood-big', [loseHp(0, per('block', 1))], { cost: 0 }),
  skill('strength', [status('strength', 2, 'self')]),
  skill('strength-scaled', [status('strength', 1, 'self', per('cardsPlayedThisTurn', 1))]),
  skill('empower', [status('empowered', 1, 'self')]),
  skill('self-weak', [status('weak', 2, 'self')], { cost: 0 }),
  skill('self-vuln', [status('vulnerable', 1, 'self')], { cost: 0 }),
  skill('vuln-skill', [status('vulnerable', 2, 'target')], { target: 'enemy' }),
  skill('weak-skill', [status('weak', 2, 'target')], { target: 'enemy' }),
  skill('skill-damage', [dmg(5)], { target: 'enemy' }),
  skill('untargeted-damage', [dmg(5)]),
  skill('untargeted-debuff', [status('weak', 1, 'target')]),
  skill('double-strength', [mult('strength', 2, 'self')]),
  skill('triple-vuln', [mult('vulnerable', 3, 'target')], { target: 'enemy' }),
  skill('half-vuln', [mult('vulnerable', 0.5, 'target')], { target: 'enemy' }),
  skill('zero-weak', [mult('weak', 0, 'self')], { cost: 0 }),
  skill('double-weak-target', [mult('weak', 2, 'target')], { target: 'enemy', cost: 0 }),
  skill('exhaust1', [exhaustRandom(1)], { cost: 0 }),
  skill('exhaust2', [exhaustRandom(2), draw(1)], { cost: 0 }),
  skill('exhaust-self-blk', [blk(6), exhaustRandom(1)], { exhaust: true }),
  // Mage-only mechanics (implementationplan.md "Mage — Core Mechanics"): exercised generically
  // here so the golden log covers them, independent of the real mageCards.ts content.
  skill('toss', [discardRandom(1), blk(4)], { cost: 0 }),
  skill('toss2', [discardRandom(2)], { cost: 0 }),
  skill('heat-up', [adjustTemp(2)], { cost: 0 }),
  skill('cool-down', [adjustTemp(-2)], { cost: 0 }),
  atk('meteor', [damageAll(4)], { cost: 1 }),
  atk('meteor-vuln', [damageAll(2), status('vulnerable', 1, 'target')], { cost: 1 }),
  skill('conjure', [addCardToHand('strike', 1)], { cost: 1 }),
  skill('chill', [status('freeze', 1, 'target')], { target: 'enemy', cost: 0 }),
  skill('flash-freeze', [status('freeze', 5, 'target')], { target: 'enemy', cost: 1 }),
  atk('glaciate', [{ kind: 'damage', value: 4, vsFreezeMult: 3 }], { cost: 1 }),
  skill('energize', [{ kind: 'gainEnergizedTurns', value: 2 }], { cost: 1 }),
  mk('power-block', { type: 'power', onTurnStartEffect: blk(3) }),
  mk('power-draw', { type: 'power', cost: 2, onTurnStartEffect: draw(1) }),
  mk('power-energy', { type: 'power', cost: 2, onTurnStartEffect: energy(1) }),
  mk('power-bleed', { type: 'power', cost: 0, onTurnStartEffect: loseHp(1) }),
  mk('power-strength', { type: 'power', onTurnStartEffect: status('strength', 1, 'self') }),
  mk('power-scaled', { type: 'power', onTurnStartEffect: blk(0, per('handSize', 1)) }),
  mk('power-after-attack', { type: 'power', triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [blk(2)] }] }),
  mk('power-after-tag', { type: 'power', cost: 0, triggers: [{ on: 'cardPlayed', tag: 'x', effects: [dmg(2)], oncePerTurn: true }] }),
  mk('power-on-exhaust', { type: 'power', triggers: [{ on: 'cardExhausted', effects: [draw(1)] }] }),
  mk('power-on-block', { type: 'power', triggers: [{ on: 'blockGained', effects: [dmg(1)] }] }),
  mk('power-on-kill', { type: 'power', triggers: [{ on: 'enemyDied', effects: [energy(1), blk(3)] }] }),
  mk('power-on-hploss', { type: 'power', triggers: [{ on: 'hpLost', effects: [status('strength', 1, 'self')] }] }),
  mk('power-turn-end', { type: 'power', triggers: [{ on: 'turnEnd', effects: [blk(0, per('handSize', 1))] }] }),
  mk('power-turn-start', { type: 'power', triggers: [{ on: 'turnStart', effects: [draw(1), status('vulnerable', 1, 'target')] }] }),
  mk('power-chain', {
    type: 'power',
    cost: 0,
    triggers: [
      { on: 'blockGained', effects: [exhaustRandom(1)] },
      { on: 'cardExhausted', effects: [blk(1)] },
    ],
  }),
  mk('power-loop', { type: 'power', cost: 0, triggers: [{ on: 'hpLost', effects: [loseHp(1)] }] }),
];

// Synthetic hero power (not a card), so the golden log also covers useHeroPower/heroPowerUsed.
const GOLDEN_HERO_POWER: HeroPowerDefinition = { id: 'golden-power', name: 'Golden Power', owner: 'test', cost: 1, effects: [blk(2)] };

const ENEMIES: EnemyDefinition[] = [
  { id: 'e-attacker', name: 'Attacker', maxHp: 30, movePattern: [{ name: 'hit', effects: [dmg(5)] }] },
  {
    id: 'e-mixed',
    name: 'Mixed',
    maxHp: 45,
    movePattern: [
      { name: 'guard', effects: [blk(8)] },
      { name: 'hit', effects: [dmg(9)] },
      { name: 'curse', effects: [status('weak', 2, 'target'), status('vulnerable', 1, 'target')] },
      { name: 'rage', effects: [status('strength', 2, 'self')] },
      { name: 'combo', effects: [dmg(4), dmg(4), blk(3)] },
    ],
  },
  {
    id: 'e-odd',
    name: 'Odd',
    maxHp: 35,
    // Player-only effect kinds in an enemy move: they must do nothing for an enemy.
    movePattern: [
      { name: 'odd1', effects: [draw(2), energy(2), loseHp(5), dmg(3)] },
      { name: 'odd2', effects: [mult('strength', 2, 'self'), exhaustRandom(2), blk(4), status('empowered', 1, 'self')] },
      { name: 'odd3', effects: [mult('weak', 2, 'target'), status('weak', 1, 'self'), dmg(6, per('block'))] },
    ],
  },
  { id: 'e-brute', name: 'Brute', maxHp: 90, movePattern: [{ name: 'smash', effects: [dmg(18)] }, { name: 'rest', effects: [blk(10)] }] },
  { id: 'e-weakling', name: 'Weakling', maxHp: 8, movePattern: [{ name: 'poke', effects: [dmg(2)] }] },
  {
    id: 'e-debuffer',
    name: 'Debuffer',
    maxHp: 25,
    movePattern: [{ name: 'hex', effects: [status('vulnerable', 2, 'target'), dmg(3)] }, { name: 'shield', effects: [status('strength', 1, 'self'), blk(5)] }],
  },
];

const RELICS: RelicDefinition[] = [
  { id: 'r-start-block', name: 'r1', onCombatStart: [blk(6)] },
  { id: 'r-start-strength', name: 'r2', onCombatStart: [status('strength', 1, 'self'), status('vulnerable', 1, 'target')] },
  { id: 'r-turn-draw', name: 'r3', onTurnStart: [draw(1)] },
  { id: 'r-turn-energy', name: 'r4', onTurnStart: [energy(1), blk(2)] },
  { id: 'r-trigger-attack', name: 'r5', triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [blk(1)] }] },
  { id: 'r-trigger-exhaust', name: 'r6', triggers: [{ on: 'cardExhausted', effects: [dmg(3)], oncePerTurn: true }] },
  { id: 'r-trigger-kill', name: 'r7', triggers: [{ on: 'enemyDied', effects: [blk(5)] }, { on: 'hpLost', effects: [draw(1)] }] },
  { id: 'r-trigger-turnend', name: 'r8', triggers: [{ on: 'turnEnd', effects: [dmg(0, per('block', 1))] }] },
];

// ---- a deterministic driver and recorder ----

const EVENT_NAMES: Record<keyof CombatEventMap, true> = {
  turnStarted: true,
  cardPlayed: true,
  handChanged: true,
  cardExhausted: true,
  energyChanged: true,
  hpLost: true,
  damageDealt: true,
  blockGained: true,
  statusChanged: true,
  enemyTurnStarted: true,
  enemyMoveResolved: true,
  enemyDied: true,
  combatEnded: true,
  temperatureChanged: true,
  heroPowerUsed: true,
  enemyStunned: true,
  enemyTurnSkipped: true,
};

/** 53-bit string hash (cyrb53), good enough to catch any divergence. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const replacer = (_key: string, value: unknown): unknown => {
  if (value && typeof value === 'object' && 'instanceId' in value && 'definition' in value) {
    const card = value as { instanceId: string; definition: { id: string } };
    return `${card.instanceId}:${card.definition.id}`;
  }
  return value;
};

const FIGHTS = 320;
const MAX_TURNS = 30;
const MAX_PLAYS_PER_TURN = 25;

interface FightRecord {
  hash: string;
  events: number;
  result: string;
  seenEvents: string[];
}

function runGoldenFight(index: number): FightRecord {
  const seeds = new Rng(0x1000 + index);
  const pick = <T,>(list: T[]): T => list[Math.floor(seeds.next() * list.length)];
  const deck: CardDefinition[] = [];
  const deckSize = 8 + Math.floor(seeds.next() * 8);
  // some fights are built around one "feature" card so every card appears in several fights
  deck.push(POOL[index % POOL.length]);
  while (deck.length < deckSize) deck.push(pick(POOL));
  const enemyCount = 1 + Math.floor(seeds.next() * 3);
  const enemies: EnemyDefinition[] = [];
  for (let i = 0; i < enemyCount; i++) enemies.push(pick(ENEMIES));
  const relics: RelicDefinition[] = [];
  const relicCount = Math.floor(seeds.next() * 3);
  for (let i = 0; i < relicCount; i++) relics.push(pick(RELICS));
  const lowHp = seeds.next() < 0.3;
  const shuffles = new Rng(seeds.nextSeed());
  const bot = new Rng(seeds.nextSeed());

  const combat = new CombatState(deck, enemies, {
    random: () => shuffles.next(),
    relics,
    player: lowHp ? { hp: 14, maxHp: 30 } : undefined,
    heroPower: GOLDEN_HERO_POWER,
  });
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const name of Object.keys(EVENT_NAMES) as (keyof CombatEventMap)[]) {
    combat.on(name, (payload: unknown) => {
      seen.add(name);
      lines.push(`${name} ${JSON.stringify(payload, replacer)}`);
    });
  }
  const readouts = (): void => {
    for (const enemy of combat.livingEnemies) {
      lines.push(
        `intent ${enemy.id} ${combat.intentDamage(enemy)} ${combat.intentBlock(enemy)} ${intentIcons(combat.nextMove(enemy)).join(',')}`
      );
    }
  };
  combat.start();
  readouts();
  while (combat.phase === 'playerTurn' && combat.turnNumber <= MAX_TURNS) {
    if (combat.canUseHeroPower() && bot.next() < 0.3) combat.useHeroPower();
    for (let plays = 0; plays < MAX_PLAYS_PER_TURN && combat.phase === 'playerTurn'; plays++) {
      const playable = combat.deck.hand.filter((c) => combat.canPlay(c));
      if (playable.length === 0 || bot.next() < 0.08) break;
      const card = playable[Math.floor(bot.next() * playable.length)];
      const living = combat.livingEnemies;
      const target = card.definition.target === 'enemy' ? living[Math.floor(bot.next() * living.length)].id : undefined;
      combat.playCard(card.instanceId, target);
    }
    if (combat.phase === 'playerTurn') combat.endPlayerTurn();
    if (combat.phase === 'playerTurn') readouts();
  }
  lines.push(`log ${JSON.stringify(combat.log)}`);
  lines.push(
    `final ${JSON.stringify({
      phase: combat.phase,
      turn: combat.turnNumber,
      energy: combat.energy,
      player: combat.player,
      enemies: combat.enemies.map((e) => ({ id: e.id, hp: e.hp, block: e.block, statuses: e.statuses, moveIndex: e.moveIndex })),
      stats: combat.stats,
      piles: [combat.deck.hand.length, combat.deck.drawPile.length, combat.deck.discardPile.length, combat.deck.exhaustPile.length],
    })}`
  );
  return { hash: hash(lines.join('\n')), events: lines.length, result: combat.phase, seenEvents: [...seen] };
}

/** Every card and relic text, and every effect described bare, hashed together. */
function describeDigest(): string {
  const lines: string[] = [];
  for (const card of POOL) lines.push(`${card.id}: ${cardText(card)}`);
  for (const relic of RELICS) lines.push(`${relic.id}: ${relicText(relic)}`);
  for (const enemy of ENEMIES) {
    for (const move of enemy.movePattern) {
      lines.push(`${enemy.id}/${move.name}: ${move.effects.map((e) => describeEffect(e)).join(' ')} [${intentIcons(move).join(',')}]`);
    }
  }
  const triggerKinds: TriggerOn[] = ['cardPlayed', 'cardExhausted', 'blockGained', 'enemyDied', 'hpLost', 'turnStart', 'turnEnd'];
  lines.push(`triggerKinds ${triggerKinds.length}`);
  return hash(lines.join('\n'));
}

describe('effect golden event logs', () => {
  const records = Array.from({ length: FIGHTS }, (_, i) => runGoldenFight(i));
  const digest = describeDigest();

  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
  if (env?.UPDATE_GOLDEN === '1') {
    it('writes the golden fixture', () => {
      const body = { fights: FIGHTS, describeDigest: digest, hashes: records.map((r) => r.hash) };
      writeFileSync(decodeURIComponent(new URL('./fixtures/effectsGolden.json', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), JSON.stringify(body, null, 1) + '\n');
    });
    return;
  }

  it('the fixture covers the fights this test runs', () => {
    expect(golden.fights).toBe(FIGHTS);
    expect(golden.hashes).toHaveLength(FIGHTS);
  });

  it('is not vacuous: fights end every way and every event kind occurs', () => {
    const results = new Set(records.map((r) => r.result));
    expect(results).toContain('won');
    expect(results).toContain('lost');
    expect(results.size).toBeGreaterThanOrEqual(2);
    const seen = new Set(records.flatMap((r) => r.seenEvents));
    for (const name of Object.keys(EVENT_NAMES)) expect(seen, `event ${name} never fired`).toContain(name);
    expect(records.reduce((sum, r) => sum + r.events, 0)).toBeGreaterThan(20000);
  });

  it('every seeded fight reproduces its recorded event log exactly', () => {
    const mismatched = records.map((r, i) => (r.hash === golden.hashes[i] ? -1 : i)).filter((i) => i >= 0);
    expect(mismatched, `fights whose event log changed: ${mismatched.join(', ')}`).toEqual([]);
  });

  it('card, relic, enemy-move and intent text is unchanged', () => {
    expect(digest).toBe(golden.describeDigest);
  });
});
