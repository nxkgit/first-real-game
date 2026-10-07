import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { Deck } from './Deck';
import { Rng } from './rng';
import type { CardDefinition, CardInstance, EnemyDefinition, EnemyMove, RelicDefinition } from './types';
import { ENEMIES } from '../data/enemies';
import { HAND_SIZE, MAX_ENERGY, MAX_HAND_SIZE, VULNERABLE_DAMAGE_MULT, WEAK_DAMAGE_MULT } from '../data/tunables';

// Coverage tests for the combat rules, written against the documented behaviour (HANDOFF.md:
// Weak/Vulnerable/Strength, "one an enemy puts on you skips that round's countdown", turn order).
// Test-only content so balance edits in src/data don't break rule checks.

const def = (id: string, extra: Partial<CardDefinition>): CardDefinition => ({
  id,
  name: id,
  type: 'skill',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  ...extra,
});
const HIT = def('hit', { type: 'attack', target: 'enemy', effects: [{ kind: 'damage', value: 10 }] });
const GUARD = def('guard', { effects: [{ kind: 'block', value: 5 }] });
const WEAKEN = def('weaken', { target: 'enemy', effects: [{ kind: 'applyStatus', status: 'weak', value: 1, to: 'target' }] });
const EXPOSE2 = def('expose2', { target: 'enemy', effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }] });
const EXPOSE1 = def('expose1', { target: 'enemy', effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 1, to: 'target' }] });
const FLEX = def('flex', { type: 'power', effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] });
const FORT = def('fort', { type: 'power', onTurnStartEffect: { kind: 'block', value: 4 } });
const INSIGHT = def('insight', { type: 'power', onTurnStartEffect: { kind: 'draw', value: 1 } });
const FILLER = def('filler', { cost: 9 });

const attack = (value: number): EnemyMove => ({ name: 'Attack', effects: [{ kind: 'damage', value }] });
const foe = (extra: Partial<EnemyDefinition> = {}): EnemyDefinition => ({
  id: 'foe',
  name: 'Foe',
  maxHp: 100,
  movePattern: [attack(10)],
  ...extra,
});

const rng = (seed = 3) => {
  const r = new Rng(seed);
  return () => r.next();
};

/** A fight whose whole deck is dealt in the first hand (deck <= HAND_SIZE) so tests control the hand. */
function fight(deck: CardDefinition[], enemies: EnemyDefinition[] = [foe()], options: ConstructorParameters<typeof CombatState>[2] = {}) {
  const c = new CombatState(deck, enemies, { random: rng(), ...options });
  c.start();
  return c;
}
const inHand = (c: CombatState, id: string): CardInstance => {
  const found = c.deck.hand.find((h) => h.definition.id === id);
  if (!found) throw new Error(`no ${id} in hand`);
  return found;
};
const play = (c: CombatState, id: string, target?: string) => c.playCard(inHand(c, id).instanceId, target);

describe('Deck edge cases', () => {
  const cards = (n: number) => Array.from({ length: n }, (_, i) => def(`c${i}`, {}));
  const all = (d: Deck) => [...d.drawPile, ...d.hand, ...d.discardPile].map((c) => c.instanceId).sort();

  it('drawing from a completely empty deck does nothing and does not throw', () => {
    const d = new Deck([], rng());
    d.draw(5);
    expect(d.hand).toEqual([]);
  });

  it('drawing 0 or negative cards draws nothing', () => {
    const d = new Deck(cards(3), rng());
    d.draw(0);
    d.draw(-2);
    expect(d.hand).toHaveLength(0);
  });

  it('reshuffles the discard pile into the draw pile in the middle of a draw, losing no card', () => {
    const d = new Deck(cards(5), rng());
    d.draw(5);
    d.discardHand(); // 0 draw, 5 discard
    // put 2 back in the draw pile so the draw has to cross the reshuffle boundary
    d.drawPile = d.discardPile.splice(0, 2);
    const before = all(d);
    d.draw(4);
    expect(d.hand).toHaveLength(4);
    expect(d.drawPile.length + d.discardPile.length).toBe(1);
    expect(all(d)).toEqual(before);
    expect(new Set(d.hand.map((c) => c.instanceId)).size).toBe(4);
  });

  it('drawing more than exist draws everything once and stops (no duplicates); a full hand sends extra draws to the discard', () => {
    const d = new Deck(cards(12), rng());
    d.draw(50);
    expect(d.hand).toHaveLength(MAX_HAND_SIZE);
    expect(d.discardPile).toHaveLength(12 - MAX_HAND_SIZE);
    expect(new Set([...d.hand, ...d.discardPile].map((c) => c.instanceId)).size).toBe(12);
    expect(d.drawPile).toHaveLength(0);
  });

  it('cards in hand are not reshuffled back in', () => {
    const d = new Deck(cards(4), rng());
    d.draw(2);
    d.draw(10);
    expect(d.hand).toHaveLength(4);
  });

  it('playCard moves a card from hand to discard; an unknown id is a no-op returning undefined', () => {
    const d = new Deck(cards(3), rng());
    d.draw(3);
    const target = d.hand[1];
    expect(d.playCard(target.instanceId)).toBe(target);
    expect(d.discardPile).toEqual([target]);
    expect(d.hand).toHaveLength(2);
    expect(d.playCard('nope')).toBeUndefined();
    expect(d.playCard(target.instanceId)).toBeUndefined(); // already played
  });

  it('discardHand on an empty hand changes nothing', () => {
    const d = new Deck(cards(2), rng());
    d.discardHand();
    expect(d.discardPile).toEqual([]);
    expect(d.drawPile).toHaveLength(2);
  });

  it('every card instance gets a unique id, even for copies of the same definition', () => {
    const c = def('same', {});
    const d = new Deck([c, c, c], rng());
    expect(new Set(d.drawPile.map((x) => x.instanceId)).size).toBe(3);
  });

  it('the same random stream gives the same shuffle', () => {
    const a = new Deck(cards(10), rng(9));
    const b = new Deck(cards(10), rng(9));
    expect(a.drawPile.map((c) => c.definition.id)).toEqual(b.drawPile.map((c) => c.definition.id));
  });

  it('does not mutate the card list it was given', () => {
    const list = cards(6);
    const copy = [...list];
    new Deck(list, rng());
    expect(list).toEqual(copy);
  });
});

describe('CombatState setup and turn structure', () => {
  it('refuses a fight with no enemies', () => {
    expect(() => new CombatState([HIT], [])).toThrow();
  });

  it('first turn: HAND_SIZE cards, full energy, turn 1; enemies at full HP with ids enemy-0..', () => {
    const c = fight(Array(10).fill(HIT), [foe(), foe()]);
    expect(c.deck.hand).toHaveLength(HAND_SIZE);
    expect(c.energy).toBe(MAX_ENERGY);
    expect(c.turnNumber).toBe(1);
    expect(c.enemies.map((e) => e.id)).toEqual(['enemy-0', 'enemy-1']);
    expect(c.combatant('enemy-1')).toBe(c.enemies[1]);
    expect(c.combatant('player')).toBe(c.player);
    expect(() => c.combatant('enemy-9')).toThrow();
  });

  it('carries the HP the run gives it', () => {
    const c = fight([HIT], [foe()], { player: { hp: 17, maxHp: 40 } });
    expect(c.player.hp).toBe(17);
    expect(c.player.maxHp).toBe(40);
  });

  it('ending the turn discards the hand, runs the enemy, then draws a new hand with refreshed energy and cleared block', () => {
    const c = fight([GUARD, GUARD, HIT, HIT, HIT, HIT, HIT, HIT]);
    play(c, 'guard');
    expect(c.player.block).toBe(5);
    c.endPlayerTurn();
    expect(c.player.block).toBe(0); // the enemy's hit 10 was soaked 5 before the reset
    expect(c.player.hp).toBe(60 - 5);
    expect(c.turnNumber).toBe(2);
    expect(c.energy).toBe(MAX_ENERGY);
    expect(c.deck.hand).toHaveLength(HAND_SIZE);
    expect(c.phase).toBe('playerTurn');
  });

  it('block that the enemy did not use is wiped at the start of the next player turn', () => {
    const c = fight([GUARD, GUARD, GUARD, GUARD, GUARD, GUARD], [foe({ movePattern: [{ name: 'Idle', effects: [] }] })]);
    play(c, 'guard');
    play(c, 'guard');
    expect(c.player.block).toBe(10);
    c.endPlayerTurn();
    expect(c.player.block).toBe(0);
  });

  it('endPlayerTurn is ignored outside the player turn, and after the fight is over', () => {
    const c = fight([HIT], [foe({ maxHp: 5 })]);
    play(c, 'hit', 'enemy-0');
    expect(c.phase).toBe('won');
    const turn = c.turnNumber;
    c.endPlayerTurn();
    expect(c.phase).toBe('won');
    expect(c.turnNumber).toBe(turn);
    expect(c.player.hp).toBe(60);
  });

  it('enemy move index advances once per enemy turn and wraps', () => {
    const e = foe({ movePattern: [attack(1), attack(2), attack(3)] });
    const c = fight([FILLER], [e]);
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(c.intentDamage(c.enemies[0])!);
      c.endPlayerTurn();
    }
    expect(seen).toEqual([1, 2, 3, 1]);
  });
});

describe('playCard rules', () => {
  it('rejects unknown cards, cards that cost too much, and aimed cards without a living target', () => {
    const c = fight([HIT, FILLER]);
    expect(c.playCard('nope')).toBe(false);
    expect(play(c, 'filler')).toBe(false); // cost 9 > 4 energy
    expect(play(c, 'hit')).toBe(false); // no target
    expect(play(c, 'hit', 'player')).toBe(false);
    expect(play(c, 'hit', 'enemy-7')).toBe(false);
    expect(c.energy).toBe(MAX_ENERGY); // nothing was spent by the refusals
    expect(c.deck.hand).toHaveLength(2);
  });

  it('cannot target a dead enemy', () => {
    const c = fight([HIT, HIT, HIT], [foe({ maxHp: 5 }), foe()]);
    play(c, 'hit', 'enemy-0');
    expect(c.enemies[0].hp).toBe(0);
    const energy = c.energy;
    expect(play(c, 'hit', 'enemy-0')).toBe(false);
    expect(c.energy).toBe(energy);
  });

  it('spends exactly the card cost, and a card playable with exactly enough energy', () => {
    const big = def('big', { cost: MAX_ENERGY, effects: [{ kind: 'block', value: 1 }] });
    const c = fight([big, GUARD]);
    expect(play(c, 'big')).toBe(true);
    expect(c.energy).toBe(0);
    expect(play(c, 'guard')).toBe(false);
  });

  it('a zero-cost card is always playable', () => {
    const free = def('free', { cost: 0, effects: [{ kind: 'block', value: 1 }] });
    const c = fight([free, free, free]);
    for (let i = 0; i < 3; i++) expect(play(c, 'free')).toBe(true);
    expect(c.energy).toBe(MAX_ENERGY);
    expect(c.player.block).toBe(3);
  });

  it('nothing can be played during the enemy turn or after the fight ends', () => {
    const c = fight([HIT], [foe({ maxHp: 5 })]);
    const card = inHand(c, 'hit');
    play(c, 'hit', 'enemy-0');
    expect(c.canPlay(card)).toBe(false);
  });

  it('overkill leaves HP at exactly 0, never negative', () => {
    const c = fight([HIT], [foe({ maxHp: 3 })]);
    play(c, 'hit', 'enemy-0');
    expect(c.enemies[0].hp).toBe(0);
  });

  it('an unaimed card that applies a status to its "target" does nothing, but the card is still spent', () => {
    const odd = def('odd', { effects: [{ kind: 'applyStatus', status: 'weak', value: 2, to: 'target' }] });
    const c = fight([odd]);
    expect(play(c, 'odd')).toBe(true);
    expect(c.enemies[0].statuses).toEqual({});
    expect(c.player.statuses).toEqual({});
    expect(c.deck.discardPile).toHaveLength(1);
  });

  it('a draw effect pulls from the pile (reshuffling if needed) and emits the new hand', () => {
    const drawer = def('drawer', { cost: 0, effects: [{ kind: 'draw', value: 2 }] });
    const c = fight([drawer, ...Array(8).fill(GUARD)]);
    const sizes: number[] = [];
    c.on('handChanged', ({ hand }) => sizes.push(hand.length));
    const before = c.deck.hand.length;
    play(c, 'drawer');
    expect(c.deck.hand.length).toBe(before - 1 + 2);
    expect(sizes.at(-1)).toBe(c.deck.hand.length);
  });

  it('events fire in order: cardPlayed then effect events, then handChanged', () => {
    const c = fight([HIT]);
    const seen: string[] = [];
    c.on('cardPlayed', () => seen.push('played'));
    c.on('damageDealt', () => seen.push('damage'));
    c.on('handChanged', () => seen.push('hand'));
    play(c, 'hit', 'enemy-0');
    expect(seen).toEqual(['played', 'damage', 'hand']);
  });
});

describe('damage maths: Strength, Weak, Vulnerable', () => {
  const c = () => fight([FILLER]);

  it('Strength adds flat damage per hit; zero stacks adds nothing', () => {
    const s = c();
    s.player.statuses.strength = 3;
    expect(s.calcDamage(6, s.player, s.enemies[0])).toBe(9);
    s.player.statuses.strength = 0;
    expect(s.calcDamage(6, s.player, s.enemies[0])).toBe(6);
  });

  it('previewCardEffect matches what playing the card deals (Weak hero vs Vulnerable enemy)', () => {
    const s = c();
    s.player.statuses.weak = 1;
    s.enemies[0].statuses.vulnerable = 1;
    const strike = { type: 'attack' } as CardDefinition;
    expect(s.previewCardEffect(strike, { kind: 'damage', value: 6 }, s.enemies[0])).toBe(s.calcDamage(6, s.player, s.enemies[0], true));
    expect(s.previewCardEffect(strike, { kind: 'damage', value: 6 }, s.enemies[0])).toBe(Math.floor(6 * WEAK_DAMAGE_MULT * VULNERABLE_DAMAGE_MULT));
  });

  it('Weak multiplies by WEAK_DAMAGE_MULT and rounds down; stack count does not deepen it', () => {
    const s = c();
    s.player.statuses.weak = 1;
    expect(s.calcDamage(10, s.player, s.enemies[0])).toBe(Math.floor(10 * WEAK_DAMAGE_MULT));
    s.player.statuses.weak = 5;
    expect(s.calcDamage(10, s.player, s.enemies[0])).toBe(Math.floor(10 * WEAK_DAMAGE_MULT));
  });

  it('Vulnerable multiplies damage taken by VULNERABLE_DAMAGE_MULT and rounds down; stack count does not deepen it', () => {
    const s = c();
    s.enemies[0].statuses.vulnerable = 1;
    expect(s.calcDamage(5, s.player, s.enemies[0])).toBe(Math.floor(5 * VULNERABLE_DAMAGE_MULT));
    s.enemies[0].statuses.vulnerable = 9;
    expect(s.calcDamage(5, s.player, s.enemies[0])).toBe(Math.floor(5 * VULNERABLE_DAMAGE_MULT));
  });

  it('Strength is added before Weak multiplies (documented order), then Vulnerable on the defender', () => {
    const s = c();
    s.player.statuses.strength = 2;
    s.player.statuses.weak = 1;
    s.enemies[0].statuses.vulnerable = 1;
    expect(s.calcDamage(10, s.player, s.enemies[0])).toBe(Math.floor((10 + 2) * WEAK_DAMAGE_MULT * VULNERABLE_DAMAGE_MULT));
  });

  it("a defender's Weak and an attacker's Vulnerable do not affect the damage", () => {
    const s = c();
    s.enemies[0].statuses.weak = 3;
    s.player.statuses.vulnerable = 3;
    expect(s.calcDamage(10, s.player, s.enemies[0])).toBe(10);
  });

  it('0 base damage stays 0', () => {
    const s = c();
    expect(s.calcDamage(0, s.enemies[0], s.player)).toBe(0);
  });

  it('Vulnerable on the enemy makes a real card hit harder; Weak on the enemy makes its attack weaker', () => {
    const k = fight([HIT, EXPOSE2, WEAKEN]);
    play(k, 'expose2', 'enemy-0');
    play(k, 'hit', 'enemy-0');
    expect(k.enemies[0].hp).toBe(100 - Math.floor(10 * VULNERABLE_DAMAGE_MULT));
    play(k, 'weaken', 'enemy-0');
    k.endPlayerTurn();
    expect(k.player.hp).toBe(60 - Math.floor(10 * WEAK_DAMAGE_MULT));
  });

  it('a Strength power raises every later hit this fight', () => {
    const k = fight([FLEX, HIT, HIT]);
    play(k, 'flex');
    play(k, 'hit', 'enemy-0');
    play(k, 'hit', 'enemy-0');
    expect(k.enemies[0].hp).toBe(100 - 24);
  });

  it('Strength on an enemy raises its attack and its intent', () => {
    const k = fight([FILLER]);
    k.enemies[0].statuses.strength = 4;
    expect(k.intentDamage(k.enemies[0])).toBe(14);
  });
});

describe('status countdown: durations tick each round, fresh enemy-applied ones skip once', () => {
  const buff = (status: 'weak' | 'vulnerable', value: number): EnemyMove => ({
    name: 'Debuff',
    effects: [{ kind: 'applyStatus', status, value, to: 'target' }],
  });
  const idle: EnemyMove = { name: 'Idle', effects: [] };

  it('an enemy-applied Weak 1 survives that round and the player is weak for the whole next turn, then it is gone', () => {
    const e = foe({ movePattern: [buff('weak', 1), idle, idle] });
    const c = fight([FILLER], [e]);
    c.endPlayerTurn(); // round 1: Weak 1 applied, fresh -> not ticked
    expect(c.player.statuses.weak).toBe(1);
    // the player's attack during turn 2 is weakened
    expect(c.calcDamage(10, c.player, c.enemies[0])).toBe(Math.floor(10 * WEAK_DAMAGE_MULT));
    c.endPlayerTurn(); // round 2: not fresh any more, ticks off
    expect(c.player.statuses.weak).toBeUndefined();
    expect(c.calcDamage(10, c.player, c.enemies[0])).toBe(10);
  });

  it('an enemy-applied Weak 3 lasts through three of the player turns that follow', () => {
    const e = foe({ movePattern: [buff('weak', 3), idle, idle, idle, idle] });
    const c = fight([FILLER], [e]);
    const weakAtTurnStart: (number | undefined)[] = [];
    for (let i = 0; i < 5; i++) {
      c.endPlayerTurn();
      weakAtTurnStart.push(c.player.statuses.weak);
    }
    expect(weakAtTurnStart).toEqual([3, 2, 1, undefined, undefined]);
  });

  it('a player-applied Vulnerable 2 is ticked at the end of the same round (it is not fresh)', () => {
    const c = fight([EXPOSE2, FILLER], [foe({ movePattern: [idle] })]);
    play(c, 'expose2', 'enemy-0');
    c.endPlayerTurn();
    expect(c.enemies[0].statuses.vulnerable).toBe(1);
    c.endPlayerTurn();
    expect(c.enemies[0].statuses.vulnerable).toBeUndefined();
  });

  it('a player-applied Vulnerable 1 is gone before the next player turn (no free ride)', () => {
    const c = fight([EXPOSE1, FILLER], [foe({ movePattern: [idle] })]);
    play(c, 'expose1', 'enemy-0');
    c.endPlayerTurn();
    expect(c.enemies[0].statuses.vulnerable).toBeUndefined();
  });

  it('stacking enemy-applied Weak across rounds adds up and each application is fresh for its own round', () => {
    const e = foe({ movePattern: [buff('weak', 1), buff('weak', 1), idle, idle] });
    const c = fight([FILLER], [e]);
    c.endPlayerTurn();
    expect(c.player.statuses.weak).toBe(1);
    c.endPlayerTurn(); // second application: 2 stacks, fresh again so no tick
    expect(c.player.statuses.weak).toBe(2);
    c.endPlayerTurn();
    expect(c.player.statuses.weak).toBe(1);
    c.endPlayerTurn();
    expect(c.player.statuses.weak).toBeUndefined();
  });

  it('Strength never counts down, on either side', () => {
    const buffSelf: EnemyMove = { name: 'Buff', effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] };
    const c = fight([FLEX, FILLER], [foe({ movePattern: [buffSelf] })]);
    play(c, 'flex');
    for (let i = 0; i < 4; i++) c.endPlayerTurn();
    expect(c.player.statuses.strength).toBe(2);
    expect(c.enemies[0].statuses.strength).toBe(8);
  });

  it('countdown also happens to players with status from a relic-less fight start: nothing to tick, no events', () => {
    const c = fight([FILLER], [foe({ movePattern: [idle] })]);
    let ticks = 0;
    c.on('statusChanged', () => ticks++);
    c.endPlayerTurn();
    expect(ticks).toBe(0);
  });

  it('tick events carry delta -1 and a snapshot of the remaining statuses', () => {
    const c = fight([EXPOSE2, FILLER], [foe({ movePattern: [idle] })]);
    play(c, 'expose2', 'enemy-0');
    const events: { delta: number; statuses: Record<string, number | undefined> }[] = [];
    c.on('statusChanged', (e) => events.push({ delta: e.delta, statuses: e.statuses }));
    c.endPlayerTurn();
    expect(events).toEqual([{ delta: -1, statuses: { vulnerable: 1 } }]);
  });

  it('dead enemies are not ticked (and a dead player is not either)', () => {
    const idleFoe = foe({ movePattern: [idle] });
    const c = fight([EXPOSE2, HIT], [foe({ maxHp: 40, movePattern: [idle] }), idleFoe]);
    play(c, 'expose2', 'enemy-1');
    c.enemies[0].hp = 0;
    c.endPlayerTurn();
    expect(c.enemies[1].statuses.vulnerable).toBe(1);
  });
});

describe('intents versus real damage (data enemies, with statuses)', () => {
  /** Runs one enemy turn of `enemyId`'s move #moveIndex with a given set of statuses, and returns [shown, actual]. */
  function shownAndActual(enemyId: string, moveIndex: number, setup: (c: CombatState) => void): [number | undefined, number] {
    const c = fight([FILLER], [ENEMIES[enemyId]], { player: { hp: 1000, maxHp: 1000 } });
    c.enemies[0].moveIndex = moveIndex;
    setup(c);
    const shown = c.intentDamage(c.enemies[0]);
    const before = c.player.hp;
    c.endPlayerTurn();
    return [shown, before - c.player.hp];
  }

  const setups: [string, (c: CombatState) => void][] = [
    ['no statuses', () => {}],
    ['enemy strength', (c) => (c.enemies[0].statuses.strength = 3)],
    ['enemy weak', (c) => (c.enemies[0].statuses.weak = 2)],
    ['player vulnerable', (c) => (c.player.statuses.vulnerable = 2)],
    ['all of them', (c) => {
      c.enemies[0].statuses.strength = 3;
      c.enemies[0].statuses.weak = 2;
      c.player.statuses.vulnerable = 2;
    }],
  ];

  for (const id of Object.keys(ENEMIES)) {
    for (const [label, setup] of setups) {
      it(`${id}: every attacking move's intent equals the damage dealt (${label})`, () => {
        const moves = ENEMIES[id].movePattern;
        for (let i = 0; i < moves.length; i++) {
          const hasDamage = moves[i].effects.some((e) => e.kind === 'damage');
          const [shown, actual] = shownAndActual(id, i, setup);
          if (hasDamage) expect(shown, `${id} move ${i}`).toBe(actual);
          else {
            expect(shown).toBeUndefined();
            expect(actual).toBe(0);
          }
        }
      });
    }
  }

  it('a multi-hit move shows the total of its hits, each hit rounded separately', () => {
    const multi = foe({ movePattern: [{ name: 'Flurry', effects: [{ kind: 'damage', value: 3 }, { kind: 'damage', value: 3 }, { kind: 'damage', value: 3 }] }] });
    const c = fight([FILLER], [multi]);
    c.enemies[0].statuses.weak = 1; // 3 * 0.75 = 2.25 -> 2 per hit
    expect(c.intentDamage(c.enemies[0])).toBe(6);
    const before = c.player.hp;
    c.endPlayerTurn();
    expect(before - c.player.hp).toBe(6);
  });

  it('intentBlock sums block; undefined when the move gives none', () => {
    const e = foe({ movePattern: [{ name: 'D', effects: [{ kind: 'block', value: 4 }, { kind: 'block', value: 3 }] }, attack(1)] });
    const c = fight([FILLER], [e]);
    expect(c.intentBlock(c.enemies[0])).toBe(7);
    expect(c.intentDamage(c.enemies[0])).toBeUndefined();
    c.enemies[0].moveIndex = 1;
    expect(c.intentBlock(c.enemies[0])).toBeUndefined();
  });

  it('player block soaks part of an enemy hit and the enemyMoveResolved event reports both parts', () => {
    const c = fight([GUARD, FILLER], [foe({ movePattern: [attack(8)] })]);
    play(c, 'guard');
    let resolved: { amount: number; absorbed: number } | undefined;
    c.on('enemyMoveResolved', (e) => (resolved = e.damage));
    c.endPlayerTurn();
    expect(resolved).toMatchObject({ amount: 8, absorbed: 5 });
    expect(c.player.hp).toBe(60 - 3);
  });

  it('enemy block lasts through the player turn and soaks a card hit, then resets when the enemy acts again', () => {
    const e = foe({ movePattern: [{ name: 'D', effects: [{ kind: 'block', value: 6 }] }, attack(1)] });
    const c = fight([HIT, HIT], [e]);
    c.endPlayerTurn(); // enemy gains 6 block
    expect(c.enemies[0].block).toBe(6);
    play(c, 'hit', 'enemy-0');
    expect(c.enemies[0].hp).toBe(100 - 4);
    expect(c.enemies[0].block).toBe(0);
    c.endPlayerTurn(); // second move: attack
    expect(c.enemies[0].block).toBe(0);
  });

  it('a draw effect in an enemy move is ignored', () => {
    const e = foe({ movePattern: [{ name: 'Odd', effects: [{ kind: 'draw', value: 5 }] }] });
    const c = fight([FILLER], [e]);
    c.endPlayerTurn();
    expect(c.player.hp).toBe(60);
  });
});

describe('multi-enemy ordering and the end of a fight', () => {
  const E = (name: string, maxHp: number, dmg: number) => foe({ id: name, name, maxHp, movePattern: [attack(dmg)] });

  it('enemies act in order, each hit landing on the player; dead enemies skip their turn and keep their move index', () => {
    const c = fight([HIT, HIT, FILLER], [E('a', 5, 1), E('b', 50, 2), E('c', 50, 4)]);
    play(c, 'hit', 'enemy-0');
    expect(c.livingEnemies.map((e) => e.id)).toEqual(['enemy-1', 'enemy-2']);
    const order: string[] = [];
    c.on('enemyMoveResolved', (e) => order.push(e.enemyId));
    c.endPlayerTurn();
    expect(order).toEqual(['enemy-1', 'enemy-2']);
    expect(c.player.hp).toBe(60 - 2 - 4);
    expect(c.enemies[0].moveIndex).toBe(0);
    expect(c.enemies[1].moveIndex).toBe(1);
  });

  it('killing enemies announces each death once, in the order they died; the win comes after the last', () => {
    const c = fight([HIT, HIT, HIT], [E('a', 5, 1), E('b', 5, 1)]);
    const seen: string[] = [];
    c.on('enemyDied', (e) => seen.push(`died:${e.enemyId}`));
    c.on('combatEnded', (e) => seen.push(`end:${e.result}`));
    play(c, 'hit', 'enemy-1');
    expect(c.phase).toBe('playerTurn');
    play(c, 'hit', 'enemy-0');
    expect(seen).toEqual(['died:enemy-1', 'died:enemy-0', 'end:won']);
    expect(c.phase).toBe('won');
  });

  it('when the player dies mid-round, later enemies do not act, nothing ticks, and the result is lost exactly once', () => {
    const c = fight([FILLER], [E('a', 50, 100), E('b', 50, 5)], { player: { hp: 10, maxHp: 60 } });
    c.player.statuses.weak = 2;
    const acted: string[] = [];
    let ended = 0;
    c.on('enemyMoveResolved', (e) => acted.push(e.enemyId));
    c.on('combatEnded', () => ended++);
    c.endPlayerTurn();
    expect(acted).toEqual(['enemy-0']);
    expect(c.player.hp).toBe(0);
    expect(c.phase).toBe('lost');
    expect(ended).toBe(1);
    expect(c.player.statuses.weak).toBe(2); // countdown skipped once the player is dead
    expect(c.turnNumber).toBe(1); // no new player turn started
  });

  it('player HP never goes below 0 on overkill', () => {
    const c = fight([FILLER], [E('a', 50, 999)], { player: { hp: 3, maxHp: 60 } });
    c.endPlayerTurn();
    expect(c.player.hp).toBe(0);
  });

  it('killing the last enemy during the player turn wins before any enemy acts', () => {
    const c = fight([HIT], [E('a', 5, 999)], { player: { hp: 1, maxHp: 60 } });
    let acted = false;
    c.on('enemyMoveResolved', () => (acted = true));
    play(c, 'hit', 'enemy-0');
    expect(c.phase).toBe('won');
    c.endPlayerTurn();
    expect(acted).toBe(false);
    expect(c.player.hp).toBe(1);
  });

  it('a won/lost fight emits combatEnded exactly once even if more is attempted', () => {
    const c = fight([HIT, HIT], [E('a', 5, 1)]);
    let ended = 0;
    c.on('combatEnded', () => ended++);
    play(c, 'hit', 'enemy-0');
    play(c, 'hit', 'enemy-0');
    c.endPlayerTurn();
    c.devKillAllEnemies();
    expect(ended).toBe(1);
  });

  it('devKillAllEnemies kills everyone, announces each, and wins; it is ignored when not the player turn', () => {
    const c = fight([FILLER], [E('a', 30, 1), E('b', 30, 1)]);
    const died: string[] = [];
    c.on('enemyDied', (e) => died.push(e.enemyId));
    c.devKillAllEnemies();
    expect(died).toEqual(['enemy-0', 'enemy-1']);
    expect(c.phase).toBe('won');
    expect(c.livingEnemies).toEqual([]);
    c.devKillAllEnemies();
    expect(died).toHaveLength(2);
  });

  it('a status card cannot be applied to a dead enemy', () => {
    const c = fight([HIT, WEAKEN], [E('a', 5, 1), E('b', 50, 1)]);
    play(c, 'hit', 'enemy-0');
    expect(play(c, 'weaken', 'enemy-0')).toBe(false);
    expect(c.enemies[0].statuses).toEqual({});
  });
});

describe('powers and relic hooks in combat', () => {
  const RELIC = (extra: Partial<RelicDefinition>): RelicDefinition => ({ id: 'r', name: 'R', ...extra });

  it('a power does nothing on the turn it is played, then fires at the start of each later turn', () => {
    const c = fight([FORT, FILLER], [foe({ movePattern: [{ name: 'Idle', effects: [] }] })]);
    play(c, 'fort');
    expect(c.player.block).toBe(0);
    c.endPlayerTurn();
    expect(c.player.block).toBe(4);
    c.endPlayerTurn();
    expect(c.player.block).toBe(4); // reset then re-applied, not accumulated
  });

  it('two copies of a block power stack their effect each turn; two draw powers draw two extra', () => {
    const idle = foe({ movePattern: [{ name: 'Idle', effects: [] }] });
    const c = fight([FORT, FORT], [idle]);
    play(c, 'fort');
    play(c, 'fort');
    c.endPlayerTurn();
    expect(c.player.block).toBe(8);

    const d = fight([INSIGHT, INSIGHT, ...Array(20).fill(FILLER)], [idle]);
    play(d, 'insight');
    play(d, 'insight');
    d.endPlayerTurn();
    expect(d.deck.hand).toHaveLength(HAND_SIZE + 2);
  });

  it('a played power stays in play for the rest of the fight: it never goes to the discard pile or comes back', () => {
    const c = fight([FORT]);
    play(c, 'fort');
    expect(c.deck.discardPile).toEqual([]);
    expect(c.deck.powerPile.map((x) => x.definition.id)).toEqual(['fort']);
  });

  it('a power is active for the rest of the fight even if its card is reshuffled and drawn again (fires per copy played, not per draw)', () => {
    const idle = foe({ movePattern: [{ name: 'Idle', effects: [] }] });
    const c = fight([FORT], [idle]);
    play(c, 'fort');
    for (let i = 0; i < 4; i++) {
      c.endPlayerTurn();
      expect(c.player.block).toBe(4);
    }
  });

  it('onCombatStart effects run once, before the first hand is drawn', () => {
    const order: string[] = [];
    const relic = RELIC({ onCombatStart: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] });
    const c = new CombatState([HIT, HIT, HIT], [foe()], { random: rng(), relics: [relic] });
    c.on('statusChanged', () => order.push('status'));
    c.on('handChanged', () => order.push('hand'));
    c.start();
    expect(order[0]).toBe('status');
    expect(c.player.statuses.strength).toBe(2);
    c.endPlayerTurn();
    c.endPlayerTurn();
    expect(c.player.statuses.strength).toBe(2); // not re-applied on later turns
  });

  // (Was an audit finding: startPlayerTurn(true) used to wipe the block a combat-start relic gave. Fixed.)
  it('block from an onCombatStart relic is still there on the first player turn', () => {
    const relic = RELIC({ onCombatStart: [{ kind: 'block', value: 6 }] });
    const c = new CombatState([HIT], [foe()], { random: rng(), relics: [relic] });
    c.start();
    expect(c.player.block).toBe(6);
  });

  it('onTurnStart effects fire on the first turn and every later one, after the draw', () => {
    const relic = RELIC({ onTurnStart: [{ kind: 'draw', value: 1 }] });
    const c = fight(Array(20).fill(FILLER), [foe({ movePattern: [{ name: 'Idle', effects: [] }] })], { relics: [relic] });
    expect(c.deck.hand).toHaveLength(HAND_SIZE + 1);
    c.endPlayerTurn();
    expect(c.deck.hand).toHaveLength(HAND_SIZE + 1);
  });

  it('several relics all apply, in the order given', () => {
    const a = RELIC({ id: 'a', onTurnStart: [{ kind: 'block', value: 1 }] });
    const b = RELIC({ id: 'b', onTurnStart: [{ kind: 'block', value: 2 }] });
    const c = fight([FILLER], [foe()], { relics: [a, b] });
    expect(c.player.block).toBe(3);
  });

  it('the first turn draws first, so a draw power cannot starve on an empty pile at turn start', () => {
    const c = fight([INSIGHT], [foe({ movePattern: [{ name: 'Idle', effects: [] }] })]);
    play(c, 'insight');
    c.endPlayerTurn(); // the power stays in play and there is nothing to draw: nothing breaks
    expect(c.deck.hand).toHaveLength(0);
    expect(c.phase).toBe('playerTurn');
  });
});
