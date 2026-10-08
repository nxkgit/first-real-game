import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { Rng } from './rng';
import {
  captureScenario,
  formatScenario,
  parseScenario,
  parseScenarioText,
  performPlays,
  recordEvents,
  restoreScenario,
  runScenario,
  SCENARIO_VERSION,
} from './scenario';
import type { Scenario, ScenarioPlay, ScenarioWorld } from './scenario';
import { buildStarterDeck, CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { MAX_ENERGY, MAX_HAND_SIZE, PLAYER_MAX_HP } from '../data/tunables';

// ---- helpers ----

const FILES = ['boss-opening', 'tag-a-combo', 'random-exhaust', 'exact-lethal'];
const fixtureText = (name: string): string => readFileSync(decodeURIComponent(new URL(`../../scenarios/${name}.json`, import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), 'utf8');
function load(name: string): Scenario {
  const parsed = parseScenarioText(fixtureText(name));
  if (!parsed.ok) throw new Error(`${name}: ${parsed.error}`);
  return parsed.scenario;
}
const minimal = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ enemies: [{ id: 'enemy-a' }], ...extra });
function mustParse(raw: unknown): Scenario {
  const parsed = parseScenario(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.scenario;
}

/** Plays the first affordable card, again and again, then ends the turn; a fixed rule, so two fights in the same state make the same choices. */
function autoplay(combat: CombatState, turns: number): void {
  for (let t = 0; t < turns && combat.phase === 'playerTurn'; t++) {
    for (let guard = 0; guard < 60; guard++) {
      const card = combat.deck.hand.find((c) => combat.canPlay(c));
      if (!card) break;
      const target = card.definition.target === 'enemy' ? combat.livingEnemies[0]?.id : undefined;
      if (!combat.playCard(card.instanceId, target)) break;
      if (combat.phase !== 'playerTurn') return;
    }
    if (combat.phase === 'playerTurn') combat.endPlayerTurn();
  }
}

const liveFight = (seed: number): CombatState =>
  new CombatState(buildStarterDeck(), [ENEMIES['enemy-a'], ENEMIES['enemy-b']], { rng: new Rng(seed), relics: [RELICS['strength-token']] });

const handIds = (c: CombatState): string[] => c.deck.hand.map((x) => x.definition.id);
const exhaustIds = (c: CombatState): string[] => c.deck.exhaustPile.map((x) => x.definition.id);

// ---- reading ----

describe('parsing', () => {
  it('reads the hand-written example scenarios, and writing one back out and reading it again changes nothing', () => {
    for (const name of FILES) {
      const scenario = load(name);
      expect(scenario.version).toBe(SCENARIO_VERSION);
      expect(mustParse(JSON.parse(formatScenario(scenario)))).toEqual(scenario);
    }
  });

  it('fills in everything that is left out', () => {
    const s = mustParse(minimal());
    expect(s).toEqual({
      version: 1,
      rng: { seed: 1, position: 1 },
      turn: 1,
      energy: MAX_ENERGY,
      maxEnergy: MAX_ENERGY,
      player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, block: 0, statuses: {} },
      relics: [],
      enemies: [{ id: 'enemy-a', hp: ENEMIES['enemy-a'].maxHp, block: 0, statuses: {}, moveIndex: 0 }],
      piles: { draw: [], hand: [], discard: [], exhaust: [], powers: [] },
      stats: { cardsPlayedThisTurn: 0, attacksPlayedThisTurn: 0, taggedPlayedThisTurn: {}, exhaustedThisCombat: 0, cardsAddedThisCombat: 0 },
      triggersFired: [],
    });
  });

  it('defaults the random position to the seed (a fresh stream) and counts the exhaust pile as exhausted this combat', () => {
    const s = mustParse(minimal({ rng: { seed: 55 }, piles: { exhaust: ['strike', 'strike'] } }));
    expect(s.rng).toEqual({ seed: 55, position: 55 });
    expect(s.stats.exhaustedThisCombat).toBe(2);
  });

  const rejected: [string, unknown, string][] = [
    ['a list instead of an object', [], 'must be a JSON object'],
    ['a typo in a top-level field', minimal({ discrad: [] }), 'unknown field "discrad"'],
    ['a typo in a pile name', minimal({ piles: { discrad: [] } }), 'piles: unknown field "discrad"'],
    ['a wrong version', minimal({ version: 2 }), 'version'],
    ['no enemies', { enemies: [] }, 'at least one enemy'],
    ['a missing enemies list', {}, 'at least one enemy'],
    ['an unknown enemy', minimal({ enemies: [{ id: 'enemy-zz' }] }), 'unknown enemy "enemy-zz"'],
    ['an enemy above its maximum HP', minimal({ enemies: [{ id: 'enemy-a', hp: 41 }] }), 'out of range'],
    ['only dead enemies', minimal({ enemies: [{ id: 'enemy-a', hp: 0 }] }), '0 HP'],
    ['a fractional number', minimal({ turn: 1.5 }), 'whole number'],
    ['a negative number', minimal({ energy: -1 }), 'out of range'],
    ['player HP above max', minimal({ player: { hp: 70, maxHp: 60 } }), 'player.hp'],
    ['player at 0 HP', minimal({ player: { hp: 0 } }), 'player.hp'],
    ['an unknown status', minimal({ player: { statuses: { burning: 2 } } }), 'unknown status "burning"'],
    ['a status with no stacks', minimal({ player: { statuses: { weak: 0 } } }), 'out of range'],
    ['an unknown card', minimal({ piles: { hand: ['strike', 'nope'] } }), 'piles.hand[1]: unknown card "nope"'],
    ['a card id that is not text', minimal({ piles: { draw: [3] } }), 'piles.draw[0]'],
    ['an unknown relic', minimal({ relics: ['crown'] }), 'unknown relic "crown"'],
    ['more cards in hand than fit', minimal({ piles: { hand: Array.from({ length: MAX_HAND_SIZE + 1 }, () => 'strike') } }), 'too many'],
    ['a non-power in play', minimal({ piles: { powers: ['strike'] } }), 'not a power card'],
    ['the wrong number of trigger flags', minimal({ triggersFired: [true] }), 'triggersFired'],
    ['trigger flags that are not true/false', minimal({ relics: ['exhaust-token'], triggersFired: ['yes'] }), 'true/false'],
    ['an unknown random field', minimal({ rng: { seed: 1, state: 2 } }), 'rng: unknown field'],
    ['a seed that is too big', minimal({ rng: { seed: 2 ** 32 } }), 'rng.seed'],
    ['a pile that is not a list', minimal({ piles: { hand: 'strike' } }), 'expected a list'],
    ['too many enemies', { enemies: Array.from({ length: 9 }, () => ({ id: 'enemy-a' })) }, 'too many'],
  ];
  it.each(rejected)('rejects %s with a clear message', (_what, raw, fragment) => {
    const parsed = parseScenario(raw);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain(fragment);
  });

  it('suggests the near miss for a mistyped id', () => {
    const parsed = parseScenario(minimal({ piles: { hand: ['strkie'] } }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain('did you mean "strike"?');
  });

  it('never throws, whatever it is handed', () => {
    const junk: unknown[] = [null, undefined, 5, 'x', true, [], [1, 2], { enemies: 5 }, { enemies: [null] }, { enemies: [{ id: 5 }] }, minimal({ piles: 'x' }), minimal({ player: { hp: 'x' } }), minimal({ rng: 'x' }), minimal({ stats: [] }), minimal({ relics: 7 }), { enemies: [{ id: 'enemy-a', statuses: 3 }] }];
    for (const raw of junk) {
      const parsed = parseScenario(raw);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(typeof parsed.error).toBe('string');
    }
  });

  it('says plainly when the text is not JSON', () => {
    const parsed = parseScenarioText('{ "enemies": [');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain('not valid JSON');
  });

  it('reads ids from another content set when given one', () => {
    const world: ScenarioWorld = {
      cards: { zap: { id: 'zap', name: 'Zap', type: 'skill', cost: 0, owner: 'test', inRewardPool: false } },
      relics: {},
      enemies: { foe: { id: 'foe', name: 'Foe', maxHp: 9, movePattern: [{ name: 'A', effects: [{ kind: 'damage', value: 1 }] }] } },
    };
    const parsed = parseScenario({ enemies: [{ id: 'foe' }], piles: { hand: ['zap'] } }, world);
    expect(parsed.ok).toBe(true);
    expect(parseScenario(minimal(), world).ok).toBe(false); // enemy-a is not in that world
  });
});

// ---- restoring ----

describe('restoring a scenario', () => {
  it('puts every pile in place, in order, and the next draw is the first entry of the draw list', () => {
    const s = mustParse(
      minimal({
        piles: { draw: ['bolt', 'jab', 'defend'], hand: ['strike', 'defend'], discard: ['expose', 'strike'], exhaust: ['sunder'], powers: ['attack-echo'] },
      })
    );
    const combat = restoreScenario(s);
    expect(handIds(combat)).toEqual(['strike', 'defend']);
    expect(combat.deck.drawPile.map((c) => c.definition.id)).toEqual(['defend', 'jab', 'bolt']); // the end of the array is the top
    expect(combat.deck.discardPile.map((c) => c.definition.id)).toEqual(['expose', 'strike']);
    expect(exhaustIds(combat)).toEqual(['sunder']);
    expect(combat.deck.powerPile.map((c) => c.definition.id)).toEqual(['attack-echo']);
    combat.deck.draw(1);
    expect(handIds(combat)).toEqual(['strike', 'defend', 'bolt']);
  });

  it('starting it draws nothing and runs no combat-start effect, but announces the hand and the turn', () => {
    const s = load('boss-opening');
    const combat = restoreScenario(s);
    const events = recordEvents(combat);
    combat.start();
    expect(handIds(combat)).toEqual(s.piles.hand);
    expect(combat.player.statuses).toEqual({ strength: 1 }); // Strength Token's +1 was not applied a second time
    expect(combat.player.block).toBe(0);
    expect(events.map((e) => e.type)).toEqual(['handChanged', 'turnStarted']);
    expect(combat.turnNumber).toBe(1);
    expect(combat.energy).toBe(MAX_ENERGY);
  });

  it('restores HP, block, energy, turn, statuses and where each enemy is in its pattern', () => {
    const s = mustParse({
      turn: 4,
      energy: 2,
      maxEnergy: 5,
      player: { hp: 17, maxHp: 80, block: 6, statuses: { weak: 2, strength: 3 } },
      enemies: [
        { id: 'enemy-a', hp: 11, block: 4, statuses: { vulnerable: 2 }, moveIndex: 2 },
        { id: 'elite-b', moveIndex: 1 },
      ],
    });
    const combat = restoreScenario(s);
    expect(combat.turnNumber).toBe(4);
    expect(combat.energy).toBe(2);
    expect(combat.maxEnergy).toBe(5);
    expect(combat.player).toMatchObject({ hp: 17, maxHp: 80, block: 6, statuses: { weak: 2, strength: 3 } });
    expect(combat.enemies[0]).toMatchObject({ id: 'enemy-0', hp: 11, block: 4, statuses: { vulnerable: 2 }, moveIndex: 2 });
    expect(combat.nextMove(combat.enemies[0])).toBe(ENEMIES['enemy-a'].movePattern[2]);
    expect(combat.nextMove(combat.enemies[1])).toBe(ENEMIES['elite-b'].movePattern[1]);
  });

  it('restores powers in play with their reactive abilities, and which ones already fired this turn', () => {
    const fresh = restoreScenario(load('tag-a-combo'));
    fresh.start();
    const before = fresh.deck.drawPile.length;
    performPlays(fresh, [{ card: 'prime-a' }]);
    expect(fresh.deck.drawPile.length).toBe(before - 1); // Tag A Echo drew a card

    const spent = restoreScenario(mustParse({ ...JSON.parse(fixtureText('tag-a-combo')), triggersFired: [true] }));
    spent.start();
    const beforeSpent = spent.deck.drawPile.length;
    performPlays(spent, [{ card: 'prime-a' }]);
    expect(spent.deck.drawPile.length).toBe(beforeSpent); // already used this turn: no draw
  });

  it('a power already in play keeps its "at the start of each turn" effect', () => {
    const s = mustParse(minimal({ piles: { hand: ['defend'], draw: ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'], powers: ['fortify'] } }));
    const run = runScenario(s, [{ endTurn: true }]);
    expect(run.combat.turnNumber).toBe(2);
    expect(run.combat.player.block).toBe(4); // Fortify: 4 block at the start of each turn
  });

  it('restores relics, including their reactive abilities, but not their combat-start effects', () => {
    const s = mustParse(minimal({ relics: ['exhaust-token', 'guard-token'], piles: { hand: ['single-use-strike'] } }));
    const combat = restoreScenario(s);
    combat.start();
    expect(combat.player.block).toBe(0); // Guard Token's combat-start block is not given again
    performPlays(combat, [{ card: 'single-use-strike' }]);
    expect(combat.player.block).toBe(3); // Exhaust Token: 3 block whenever a card is exhausted
  });

  it('restores the "earlier this turn" counters and the exhaust count', () => {
    const s = mustParse(minimal({ piles: { hand: ['exhaust-payoff', 'combo-strike'], exhaust: ['strike', 'strike'] }, stats: { cardsPlayedThisTurn: 2 } }));
    const run = runScenario(s, [{ card: 'exhaust-payoff' }, { card: 'combo-strike' }]);
    const hits = run.events.filter((e) => e.type === 'damageDealt').map((e) => (e.payload as { amount: number }).amount);
    expect(hits).toEqual([2 + 3 * 2, 4 + 3 * 3]); // Exhaust Payoff: 2 exhausted so far; Combo Strike: 2 earlier plays + Exhaust Payoff
  });
});

// ---- capturing ----

describe('capturing a fight', () => {
  it('needs a seeded stream and the player\'s turn', () => {
    const noStream = new CombatState(buildStarterDeck(), [ENEMIES['enemy-a']], { random: () => 0.5 });
    noStream.start();
    expect(() => captureScenario(noStream)).toThrow('seeded Rng');

    const ended = liveFight(3);
    ended.start();
    ended.devKillAllEnemies();
    expect(() => captureScenario(ended)).toThrow("player's turn");
  });

  it('writes a scenario that the reader accepts unchanged', () => {
    const combat = liveFight(11);
    combat.start();
    autoplay(combat, 2);
    const s = captureScenario(combat, { name: 'two turns in' });
    expect(s.name).toBe('two turns in');
    expect(mustParse(JSON.parse(formatScenario(s)))).toEqual(s);
  });

  it('a fight picked up from a capture carries on exactly like the original: same events, same stream, same final state', () => {
    for (const seed of [1, 2, 3, 7, 99, 4242]) {
      const original = liveFight(seed);
      original.start();
      autoplay(original, 1); // a full turn, the enemies' answer, and the next hand
      const s = captureScenario(original);

      const restored = restoreScenario(s);
      restored.start();
      const originalEvents = recordEvents(original);
      const restoredEvents = recordEvents(restored);
      autoplay(original, 6);
      autoplay(restored, 6);

      expect(restoredEvents, `seed ${seed}`).toEqual(originalEvents);
      expect(restored.phase).toBe(original.phase);
      expect(restored.rng?.position).toBe(original.rng?.position);
      if (original.phase === 'playerTurn') expect(captureScenario(restored)).toEqual(captureScenario(original));
    }
  });

  it('a capture taken in the middle of a turn (cards played, powers out, counters up) also carries on identically', () => {
    const original = restoreScenario(load('tag-a-combo'));
    original.start();
    performPlays(original, [{ card: 'prime-a' }, { card: 'power-up' }]);
    const s = captureScenario(original);
    expect(s.stats.cardsPlayedThisTurn).toBe(2);
    expect(s.stats.taggedPlayedThisTurn).toEqual({ 'tag-a': 1 });
    expect(s.triggersFired).toEqual([true]); // Echo already fired this turn
    expect(s.piles.powers).toEqual(['tag-a-echo']);
    expect(s.player.statuses).toEqual({ empowered: 1 });

    const restored = restoreScenario(s);
    restored.start();
    const a = recordEvents(original);
    const b = recordEvents(restored);
    const rest: ScenarioPlay[] = [{ card: 'prime-a' }, { card: 'tag-a-payoff' }, { endTurn: true }];
    performPlays(original, rest);
    performPlays(restored, rest);
    expect(b).toEqual(a);
  });
});

// ---- order, and the random stream ----

describe('play order and randomness', () => {
  it('plays out the same way every time from the same scenario', () => {
    const plays: ScenarioPlay[] = [{ card: 'expose' }, { card: 'opportunist' }, { card: 'bolt' }];
    const a = runScenario(load('exact-lethal'), plays);
    const b = runScenario(load('exact-lethal'), plays);
    expect(b.events).toEqual(a.events);
    expect(b.phase).toBe(a.phase);
  });

  it('a different play order can give a different result (the exact-lethal example)', () => {
    const scenario = load('exact-lethal');
    const right = runScenario(scenario, [{ card: 'expose' }, { card: 'opportunist' }, { card: 'bolt' }]);
    expect(right.phase).toBe('won');
    const wrong = runScenario(scenario, [{ card: 'bolt' }, { card: 'expose' }, { card: 'opportunist' }]);
    expect(wrong.phase).toBe('playerTurn');
    expect(wrong.combat.enemies[0].hp).toBe(6);
  });

  it('a random exhaust picks the same card every time from the same scenario, and a different one for a different stream position', () => {
    const scenario = load('random-exhaust');
    const pick = (s: Scenario): string => {
      const run = runScenario(s, [{ card: 'cull' }]);
      // Cull exhausts itself last; the random pick is the exhaust entry before it
      return run.combat.deck.exhaustPile.map((c) => c.definition.id).join(',');
    };
    const first = pick(scenario);
    for (let i = 0; i < 5; i++) expect(pick(scenario)).toBe(first);

    const picks = new Set<string>();
    for (let position = 100; position < 160; position++) picks.add(pick({ ...scenario, rng: { seed: scenario.rng.seed, position } }));
    expect(picks.size).toBeGreaterThan(1); // the choice really comes from the stream
  });

  it('a random exhaust after a capture and restore picks exactly what the original would have', () => {
    for (const position of [5, 99999, 123456789, 7, 31, 8888, 65535, 1000, 424242, 3, 77, 2024]) {
      const start = { ...load('random-exhaust'), rng: { seed: 4242, position } };
      const original = restoreScenario(start);
      original.start();
      performPlays(original, [{ card: 'defend' }]);
      const s = captureScenario(original);
      const restored = restoreScenario(s);
      restored.start();
      const a = recordEvents(original);
      const b = recordEvents(restored);
      performPlays(original, [{ card: 'cull' }]);
      performPlays(restored, [{ card: 'cull' }]);
      expect(exhaustIds(restored), `position ${position}`).toEqual(exhaustIds(original));
      expect(handIds(restored)).toEqual(handIds(original));
      expect(b).toEqual(a);
      expect(restored.rng?.position).toBe(original.rng?.position);
    }
  });

  it('a random exhaust in a fight that started normally (a real shuffle) is the same after capture and restore', () => {
    const deck = [...Array.from({ length: 3 }, () => CARDS.cull), ...Array.from({ length: 4 }, () => CARDS.strike), ...Array.from({ length: 4 }, () => CARDS.defend), CARDS['exhaust-engine']];
    let tested = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const original = new CombatState(deck, [ENEMIES['enemy-a']], { rng: new Rng(seed) });
      original.start();
      if (!handIds(original).includes('cull')) continue;
      const restored = restoreScenario(captureScenario(original));
      restored.start();
      expect(restored.rng?.position, `seed ${seed}: stream position after the shuffle`).toBe(original.rng?.position);
      performPlays(original, [{ card: 'cull' }]);
      performPlays(restored, [{ card: 'cull' }]);
      expect(exhaustIds(restored), `seed ${seed}`).toEqual(exhaustIds(original));
      expect(handIds(restored)).toEqual(handIds(original));
      tested++;
    }
    expect(tested, 'seeds whose first hand had a Cull').toBeGreaterThanOrEqual(15);
  });

  it('a reshuffle in a restored fight is the same as in the original (the discard order and stream position are what decide it)', () => {
    const s = mustParse(minimal({ rng: { seed: 9, position: 31337 }, piles: { hand: ['quick-draw'], draw: ['strike'], discard: ['defend', 'bolt', 'jab', 'strike', 'expose'] } }));
    const x = runScenario(s, [{ card: 'quick-draw' }]);
    const y = runScenario(s, [{ card: 'quick-draw' }]);
    expect(handIds(x.combat)).toEqual(handIds(y.combat));
    expect(x.combat.deck.drawPile.map((c) => c.definition.id)).toEqual(y.combat.deck.drawPile.map((c) => c.definition.id));
    expect(x.combat.rng?.position).toBe(y.combat.rng?.position);
  });
});

// ---- the normal game is unchanged ----

describe('the normal way of starting a fight', () => {
  it('behaves the same whether the stream is passed as a function or as an Rng', () => {
    for (const seed of [1, 2, 3]) {
      const viaFunction = new CombatState(buildStarterDeck(), [ENEMIES['enemy-a']], { random: ((r) => () => r.next())(new Rng(seed)) });
      const viaRng = new CombatState(buildStarterDeck(), [ENEMIES['enemy-a']], { rng: new Rng(seed) });
      const a = recordEvents(viaFunction);
      const b = recordEvents(viaRng);
      viaFunction.start();
      viaRng.start();
      autoplay(viaFunction, 8);
      autoplay(viaRng, 8);
      expect(b).toEqual(a);
      expect(viaRng.log).toEqual(viaFunction.log);
    }
  });
});

describe('runScenario', () => {
  it('says which play was impossible', () => {
    const s = load('exact-lethal');
    expect(() => runScenario(s, [{ card: 'heavy-hit' }])).toThrow('play #1 (heavy-hit): "heavy-hit" is not in the hand');
    expect(() => runScenario(s, [{ card: 'bolt' }, { card: 'bolt' }])).toThrow('play #2');
    expect(() => runScenario(s, [{ card: 'strike', target: 3 }])).toThrow('no living enemy');
  });

  it('can end the turn and carry on into the next one', () => {
    const run = runScenario(load('boss-opening'), [{ card: 'defend' }, { endTurn: true }, { card: 'defend' }]);
    expect(run.combat.turnNumber).toBe(2);
    expect(run.events.some((e) => e.type === 'enemyMoveResolved')).toBe(true);
    expect(run.final?.turn).toBe(2);
  });

  it('has no final state when the fight is over', () => {
    const run = runScenario(load('exact-lethal'), [{ card: 'expose' }, { card: 'opportunist' }, { card: 'bolt' }]);
    expect(run.phase).toBe('won');
    expect(run.final).toBeNull();
  });
});

describe('the content ids the example files use', () => {
  it('exist in the game (a renamed card shows up here, not just in a dev-panel error)', () => {
    for (const name of FILES) {
      const s = load(name);
      for (const pile of Object.values(s.piles)) for (const id of pile) expect(CARDS[id], `${name}: ${id}`).toBeDefined();
    }
  });
});
