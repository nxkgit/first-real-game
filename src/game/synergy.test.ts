import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { CombatEventMap } from './CombatState';
import { cardText, describeEffect, describeTrigger, relicText } from './describe';
import { Rng } from './rng';
import type { CardDefinition, EnemyDefinition, Effect, RelicDefinition, Trigger } from './types';
import { CARDS, allDraftableCards, baseCards, getCard, rewardPoolFor, upgradedVersion } from '../data/cards';
import { RELICS, RELIC_POOL, getRelic } from '../data/relics';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { newRun, restoreSavedRun } from '../data/run';
import { MAX_TRIGGER_DEPTH } from '../data/tunables';

const mk = (id: string, extra: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id,
  type: 'skill',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  ...extra,
});
const atk = (id: string, effects: Effect[], extra: Partial<CardDefinition> = {}): CardDefinition =>
  mk(id, { type: 'attack', target: 'enemy', effects, ...extra });
const dmg = (value: number): Effect => ({ kind: 'damage', value });
const block = (value: number): Effect => ({ kind: 'block', value });

function foe(maxHp = 500, damage = 0): EnemyDefinition {
  return { id: 'foe', name: 'Foe', maxHp, movePattern: [{ name: 'hit', effects: damage ? [dmg(damage)] : [block(0)] }] };
}

function fight(deck: CardDefinition[], opts: { enemies?: EnemyDefinition[]; relics?: RelicDefinition[]; seed?: number; drawAll?: boolean } = {}): CombatState {
  const rng = new Rng(opts.seed ?? 1);
  const c = new CombatState(deck, opts.enemies ?? [foe()], { random: () => rng.next(), relics: opts.relics });
  c.start();
  if (opts.drawAll ?? true) c.deck.draw(99); // everything in hand, so tests can play any card
  return c;
}
/** Moves the first card with this id from the draw pile into the hand. */
function pull(c: CombatState, ...ids: string[]): void {
  for (const id of ids) {
    const i = c.deck.drawPile.findIndex((x) => x.definition.id === id);
    if (i >= 0) c.deck.hand.push(...c.deck.drawPile.splice(i, 1));
  }
}
/** Plays the first card in hand with this definition id. */
function play(c: CombatState, id: string, targetId: string | undefined = 'enemy-0'): boolean {
  const inst = c.deck.hand.find((x) => x.definition.id === id);
  if (!inst) throw new Error(`no ${id} in hand`);
  return c.playCard(inst.instanceId, inst.definition.target ? targetId : undefined);
}
const lostHp = (c: CombatState, i = 0): number => c.enemies[i].maxHp - c.enemies[i].hp;

describe('scaling values', () => {
  const combo = atk('combo', [{ kind: 'damage', value: 4, scaling: { per: 'cardsPlayedThisTurn', value: 3 } }]);
  const filler = mk('filler');

  it('adds nothing when the count is 0, and counts only earlier cards', () => {
    const c = fight([combo, filler, filler]);
    play(c, 'combo');
    expect(lostHp(c)).toBe(4);
  });

  it('scales with each card played earlier this turn, and resets next turn', () => {
    const c = fight([combo, filler, filler]);
    play(c, 'filler');
    play(c, 'filler');
    play(c, 'combo');
    expect(lostHp(c)).toBe(4 + 3 * 2);
    expect(c.stats.cardsPlayedThisTurn).toBe(3);
    c.endPlayerTurn();
    expect(c.stats.cardsPlayedThisTurn).toBe(0);
  });

  it('counts attacks only, and tagged cards only', () => {
    const attacks = atk('a', [{ kind: 'damage', value: 0, scaling: { per: 'attacksPlayedThisTurn', value: 5 } }]);
    const tagged = atk('t', [{ kind: 'damage', value: 1, scaling: { per: 'taggedPlayedThisTurn', tag: 'tag-a', value: 10 } }]);
    const a1 = atk('a1', [dmg(1)]);
    const enabler = mk('en', { tags: ['tag-a'] });
    const other = mk('ot', { tags: ['tag-b'] });
    const c = fight([attacks, tagged, a1, enabler, other, filler]);
    play(c, 'filler');
    play(c, 'ot');
    play(c, 'en');
    play(c, 'a1');
    expect(lostHp(c)).toBe(1);
    play(c, 'a'); // 1 earlier attack
    expect(lostHp(c)).toBe(1 + 5);
    play(c, 't'); // 1 tag-a card
    expect(lostHp(c)).toBe(1 + 5 + 11);
    expect(c.stats.taggedPlayedThisTurn).toEqual({ 'tag-a': 1, 'tag-b': 1 });
  });

  it('scales with block, strength, hand size, exhausted count and target Vulnerable', () => {
    const blockHit = atk('bh', [{ kind: 'damage', value: 0, scaling: { per: 'block', value: 1 } }]);
    const strHit = atk('sh', [{ kind: 'damage', value: 0, scaling: { per: 'strength', value: 2 } }]);
    const handHit = atk('hh', [{ kind: 'damage', value: 0, scaling: { per: 'handSize', value: 1 } }]);
    const exhHit = atk('eh', [{ kind: 'damage', value: 0, scaling: { per: 'exhaustedThisCombat', value: 4 } }]);
    const vulnHit = atk('vh', [{ kind: 'damage', value: 0, scaling: { per: 'targetVulnerable', value: 3 } }]);
    const g = mk('g', { effects: [block(7)] });
    const s = mk('s', { effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] });
    const v = atk('v', [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }]);
    const x = mk('x', { exhaust: true });

    let c = fight([blockHit, g]);
    play(c, 'g');
    play(c, 'bh');
    expect(lostHp(c)).toBe(7);

    c = fight([strHit, s]);
    play(c, 's');
    play(c, 'sh'); // 2 strength: 0 + 2*2, plus the +2 from Strength itself
    expect(lostHp(c)).toBe(6);

    c = fight([handHit, filler, filler, filler]); // 3 left in hand once it is played
    play(c, 'hh');
    expect(lostHp(c)).toBe(3);

    c = fight([exhHit, x, x]);
    play(c, 'x');
    play(c, 'x');
    play(c, 'eh');
    expect(lostHp(c)).toBe(8);

    c = fight([vulnHit, v]);
    play(c, 'v');
    play(c, 'vh'); // 6 base, x1.5 vulnerable
    expect(lostHp(c)).toBe(9);
  });

  it('scales other effect kinds too (draw)', () => {
    const drawer = mk('dr', { effects: [{ kind: 'draw', value: 0, scaling: { per: 'cardsPlayedThisTurn', value: 1 } }] });
    const cards = Array.from({ length: 8 }, (_, i) => mk(`f${i}`));
    const c = fight([drawer, ...cards], { drawAll: false });
    pull(c, 'dr', 'f0', 'f1');
    play(c, 'f0');
    play(c, 'f1');
    const before = c.deck.hand.length;
    play(c, 'dr');
    expect(c.deck.hand.length).toBe(before - 1 + 2);
  });

  it('describes scaling readably', () => {
    expect(describeEffect({ kind: 'damage', value: 4, scaling: { per: 'cardsPlayedThisTurn', value: 3 } })).toBe(
      'Deal 4 damage. +3 for each card played earlier this turn.'
    );
    expect(describeEffect({ kind: 'damage', value: 0, scaling: { per: 'block', value: 1 } })).toBe(
      'Deal 1 damage for each point of your block.'
    );
    expect(describeEffect({ kind: 'damage', value: 3, scaling: { per: 'taggedPlayedThisTurn', tag: 'tag-a', value: 5 } })).toBe(
      'Deal 3 damage. +5 for each tag-a card played earlier this turn.'
    );
  });
});

describe('multipliers', () => {
  const empower = mk('emp', { effects: [{ kind: 'applyStatus', status: 'empowered', value: 1, to: 'self' }] });
  const hit = atk('hit', [dmg(10)]);

  it('empowered doubles exactly one attack, then is consumed', () => {
    const c = fight([empower, hit, hit]);
    play(c, 'emp');
    expect(c.player.statuses.empowered).toBe(1);
    play(c, 'hit');
    expect(lostHp(c)).toBe(20);
    expect(c.player.statuses.empowered).toBeUndefined();
    play(c, 'hit');
    expect(lostHp(c)).toBe(30);
  });

  it('is not consumed by a skill, and two stacks cover two attacks', () => {
    const c = fight([empower, empower, mk('sk'), hit, hit, hit]);
    play(c, 'emp');
    play(c, 'emp');
    play(c, 'sk');
    expect(c.player.statuses.empowered).toBe(2);
    play(c, 'hit');
    play(c, 'hit');
    play(c, 'hit');
    expect(lostHp(c)).toBe(20 + 20 + 10);
  });

  it('applies in order: add (Strength), then multiply (Empowered, Weak), then Vulnerable', () => {
    const c = fight([hit]);
    c.player.statuses = { strength: 2, empowered: 1, weak: 1 };
    c.enemies[0].statuses = { vulnerable: 1 };
    // (10 + 2) * 2 * 0.75 * 1.5 = 27
    expect(c.calcDamage(10, c.player, c.enemies[0])).toBe(27);
    // not from an attack card: Empowered ignored: (10+2) * 0.75 * 1.5 = 13.5 -> 13
    expect(c.calcDamage(10, c.player, c.enemies[0], false)).toBe(13);
  });

  it('multiplyStatus doubles Strength, and does nothing at 0 stacks', () => {
    const dbl = mk('dbl', { effects: [{ kind: 'multiplyStatus', status: 'strength', factor: 2, to: 'self' }] });
    const str = mk('str', { effects: [{ kind: 'applyStatus', status: 'strength', value: 3, to: 'self' }] });
    const c = fight([dbl, dbl, str]);
    const events: CombatEventMap['statusChanged'][] = [];
    c.on('statusChanged', (e) => events.push(e));
    play(c, 'dbl');
    expect(events).toHaveLength(0);
    expect(c.player.statuses.strength).toBeUndefined();
    play(c, 'str');
    play(c, 'dbl');
    expect(c.player.statuses.strength).toBe(6);
    expect(events[events.length - 1]).toMatchObject({ status: 'strength', delta: 3, statuses: { strength: 6 } });
  });

  it('describes them', () => {
    expect(describeEffect({ kind: 'multiplyStatus', status: 'strength', factor: 2, to: 'self' })).toBe('Double your Strength.');
    expect(describeEffect({ kind: 'multiplyStatus', status: 'weak', factor: 3, to: 'target' })).toBe("Multiply the target's Weak by 3.");
  });
});

describe('exhaust', () => {
  it('a card with exhaust leaves the deck for the rest of the combat', () => {
    const once = atk('once', [dmg(5)], { exhaust: true });
    const c = fight([once, mk('f')]);
    const events: CombatEventMap['cardExhausted'][] = [];
    c.on('cardExhausted', (e) => events.push(e));
    play(c, 'once');
    expect(c.deck.exhaustPile.map((x) => x.definition.id)).toEqual(['once']);
    expect(c.deck.discardPile.map((x) => x.definition.id)).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0].exhaustPile).toBe(1);
    expect(c.stats.exhaustedThisCombat).toBe(1);
    // many turns later it never comes back
    for (let i = 0; i < 4; i++) c.endPlayerTurn();
    expect([...c.deck.hand, ...c.deck.drawPile, ...c.deck.discardPile].some((x) => x.definition.id === 'once')).toBe(false);
  });

  it('handChanged snapshots carry the exhaust pile size', () => {
    const c = fight([mk('x', { exhaust: true })]);
    const snaps: number[] = [];
    c.on('handChanged', (s) => snaps.push(s.exhaustPile));
    play(c, 'x');
    expect(snaps[snaps.length - 1]).toBe(1);
  });

  it('exhaustRandom removes random cards from the hand, deterministically per seed', () => {
    const cull = mk('cull', { effects: [{ kind: 'exhaustRandom', value: 2 }] });
    const others = ['a', 'b', 'c', 'd'].map((i) => mk(i));
    const run = (): string[] => {
      const c = fight([cull, ...others], { seed: 7 });
      play(c, 'cull');
      return c.deck.exhaustPile.map((x) => x.definition.id);
    };
    const first = run();
    expect(first).toHaveLength(2);
    expect(run()).toEqual(first);
  });

  it('exhausting from an empty hand does nothing', () => {
    const cull = mk('cull', { effects: [{ kind: 'exhaustRandom', value: 3 }] });
    const c = fight([cull]);
    expect(() => play(c, 'cull')).not.toThrow();
    expect(c.deck.exhaustPile).toHaveLength(0);
    expect(c.stats.exhaustedThisCombat).toBe(0);
  });

  it('a fresh combat has an empty exhaust pile and zeroed counters', () => {
    const c = fight([mk('x', { exhaust: true })]);
    play(c, 'x');
    const d = fight([mk('x', { exhaust: true })]);
    expect(d.deck.exhaustPile).toHaveLength(0);
    expect(d.stats.exhaustedThisCombat).toBe(0);
  });
});

describe('energy and self-damage', () => {
  it('gainEnergy adds energy and announces it', () => {
    const c = fight([mk('e', { effects: [{ kind: 'gainEnergy', value: 2 }] })]);
    const events: CombatEventMap['energyChanged'][] = [];
    c.on('energyChanged', (e) => events.push(e));
    play(c, 'e');
    expect(c.energy).toBe(c.maxEnergy + 2);
    expect(events).toEqual([{ energy: c.maxEnergy + 2, delta: 2 }]);
  });

  it('loseHp ignores block, can kill, and announces itself', () => {
    const c = fight([mk('g', { effects: [block(20)] }), mk('p', { effects: [{ kind: 'loseHp', value: 5 }] })]);
    const events: CombatEventMap['hpLost'][] = [];
    c.on('hpLost', (e) => events.push(e));
    play(c, 'g');
    play(c, 'p');
    expect(c.player.hp).toBe(c.player.maxHp - 5);
    expect(c.player.block).toBe(20);
    expect(events[0]).toMatchObject({ amount: 5, remainingHp: c.player.maxHp - 5 });

    const dying = new CombatState([mk('p', { effects: [{ kind: 'loseHp', value: 5 }] })], [foe()], { player: { hp: 3, maxHp: 10 } });
    dying.start();
    play(dying, 'p');
    expect(dying.player.hp).toBe(0);
    expect(dying.phase).toBe('lost');
  });
});

describe('triggers', () => {
  const power = (id: string, triggers: Trigger[]): CardDefinition => mk(id, { type: 'power', triggers });
  const gainBlock = (n: number): Effect[] => [block(n)];

  it('fires on a card played, filtered by type and by tag', () => {
    const p = power('p', [
      { on: 'cardPlayed', cardType: 'attack', effects: gainBlock(2) },
      { on: 'cardPlayed', tag: 'tag-a', effects: gainBlock(10) },
    ]);
    const c = fight([p, atk('a', [dmg(1)]), mk('s'), mk('t', { tags: ['tag-a'] })]);
    play(c, 'p');
    expect(c.player.block).toBe(0); // the power does not trigger on itself
    play(c, 's');
    expect(c.player.block).toBe(0);
    play(c, 'a');
    expect(c.player.block).toBe(2);
    play(c, 't');
    expect(c.player.block).toBe(12);
  });

  it('triggered effects are not card plays', () => {
    const p = power('p', [{ on: 'cardPlayed', effects: [{ kind: 'damage', value: 1 }] }]);
    const c = fight([p, mk('s'), mk('s2')]);
    const plays: string[] = [];
    c.on('cardPlayed', (e) => plays.push(e.card.definition.id));
    play(c, 'p');
    play(c, 's');
    expect(plays).toEqual(['p', 's']);
    expect(c.stats.cardsPlayedThisTurn).toBe(2);
    expect(lostHp(c)).toBe(1);
  });

  it('fires on exhaust, block gained, enemy death, HP loss', () => {
    const p = power('p', [
      { on: 'cardExhausted', effects: [{ kind: 'draw', value: 1 }] },
      { on: 'enemyDied', effects: [{ kind: 'gainEnergy', value: 1 }] },
      { on: 'hpLost', effects: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }] },
    ]);
    const extra = Array.from({ length: 6 }, (_, i) => mk(`x${i}`));
    const c = fight([p, mk('ex', { exhaust: true }), atk('kill', [dmg(999)]), mk('pain', { effects: [{ kind: 'loseHp', value: 2 }] }), ...extra], {
      enemies: [foe(20, 3), foe(5)],
      drawAll: false,
    });
    pull(c, 'p', 'ex', 'kill', 'pain');
    play(c, 'p');
    const handBefore = c.deck.hand.length;
    play(c, 'ex'); // exhaust: -1 for the play, +1 for the draw
    expect(c.deck.hand.length).toBe(handBefore);
    play(c, 'pain');
    expect(c.player.statuses.strength).toBe(1);
    const energyBefore = c.energy;
    play(c, 'kill', 'enemy-1');
    expect(c.energy).toBe(energyBefore + 1);

    // an enemy hit that gets through block also counts as losing HP
    c.endPlayerTurn();
    expect(c.player.statuses.strength).toBe(2);

    const b = power('b', [{ on: 'blockGained', effects: [dmg(4)] }]);
    const d = fight([b, mk('g', { effects: [block(3)] })]);
    play(d, 'b');
    play(d, 'g');
    expect(lostHp(d)).toBe(4);
  });

  it('an enemy hit absorbed fully by block is not HP loss', () => {
    const p = power('p', [{ on: 'hpLost', effects: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }] }]);
    const c = fight([p, mk('g', { effects: [block(10)] })], { enemies: [foe(50, 4)] });
    play(c, 'p');
    play(c, 'g');
    c.endPlayerTurn();
    expect(c.player.statuses.strength).toBeUndefined();
  });

  it('end-of-turn triggers fire before the hand is discarded; start-of-turn ones after the draw', () => {
    const order: string[] = [];
    const p = power('p', [
      { on: 'turnEnd', effects: [{ kind: 'block', value: 0, scaling: { per: 'handSize', value: 1 } }] },
      { on: 'turnStart', effects: [{ kind: 'block', value: 0, scaling: { per: 'handSize', value: 1 } }] },
    ]);
    const c = fight([p, mk('f1'), mk('f2')]);
    play(c, 'p');
    c.on('blockGained', (e) => order.push(`block${e.amount}`));
    c.endPlayerTurn();
    // end of turn saw the 2 cards still in hand (block 2); the new turn's block reset the player to 0 first
    expect(order[0]).toBe('block2');
    expect(order[1]).toBe('block2'); // turn start: the 2 other cards drawn back (the power stays in play)
    expect(c.player.block).toBe(2);
  });

  it('an end-of-turn trigger that wins the fight ends it', () => {
    const p = power('p', [{ on: 'turnEnd', effects: [dmg(999)] }]);
    const c = fight([p]);
    play(c, 'p');
    c.endPlayerTurn();
    expect(c.phase).toBe('won');
  });

  it('fires in order: relics first, then powers in the order played', () => {
    const relic: RelicDefinition = { id: 'r', name: 'r', triggers: [{ on: 'cardPlayed', effects: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }] }] };
    const log: string[] = [];
    const p1 = power('p1', [{ on: 'cardPlayed', effects: [block(1)] }]);
    const p2 = power('p2', [{ on: 'cardPlayed', effects: [block(2)] }]);
    const c = fight([p1, p2, mk('s')], { relics: [relic] });
    c.on('statusChanged', () => log.push('relic'));
    c.on('blockGained', (e) => log.push(`b${e.amount}`));
    play(c, 'p2');
    play(c, 'p1');
    log.length = 0;
    play(c, 's');
    expect(log).toEqual(['relic', 'b2', 'b1']); // p2 was played first
  });

  it('once-per-turn fires once, then again after the next turn starts', () => {
    const p = power('p', [{ on: 'blockGained', oncePerTurn: true, effects: [dmg(5)] }]);
    const g = mk('g', { effects: [block(1)] });
    const c = fight([p, g, g, g, g, g, g], { enemies: [foe(500, 1)] });
    play(c, 'p');
    play(c, 'g');
    play(c, 'g');
    expect(lostHp(c)).toBe(5);
    c.endPlayerTurn();
    play(c, 'g');
    expect(lostHp(c)).toBe(10);
  });

  it('the recursion guard stops a trigger that feeds itself', () => {
    const p = power('p', [{ on: 'blockGained', effects: [block(1)] }]);
    const c = fight([p, mk('g', { effects: [block(1)] })]);
    play(c, 'p');
    play(c, 'g');
    // the played card's block (depth 0) plus one block per allowed nested level
    expect(c.player.block).toBe(1 + MAX_TRIGGER_DEPTH);
  });

  it('exhaust-on-exhaust cannot loop forever either', () => {
    const p = power('p', [{ on: 'cardExhausted', effects: [{ kind: 'exhaustRandom', value: 1 }] }]);
    const many = Array.from({ length: 3 }, (_, i) => mk(`m${i}`));
    const c = fight([p, mk('x', { exhaust: true }), ...many]);
    play(c, 'p');
    expect(() => play(c, 'x')).not.toThrow();
  });

  it('relic triggers work from the start of the fight; onTurnStartEffect still works', () => {
    const relic: RelicDefinition = { id: 'r', name: 'r', triggers: [{ on: 'cardExhausted', effects: [block(3)] }] };
    const focus = mk('focus', { type: 'power', onTurnStartEffect: { kind: 'draw', value: 1 } });
    const c = fight([focus, mk('x', { exhaust: true }), ...Array.from({ length: 8 }, (_, i) => mk(`f${i}`))], { relics: [relic], drawAll: false });
    pull(c, 'x', 'focus');
    play(c, 'x');
    expect(c.player.block).toBe(3);
    play(c, 'focus');
    c.endPlayerTurn();
    expect(c.deck.hand).toHaveLength(6);
  });

  it('describes triggers', () => {
    expect(describeTrigger({ on: 'cardPlayed', cardType: 'attack', effects: [block(2)] })).toBe('Whenever you play an attack, gain 2 block.');
    expect(describeTrigger({ on: 'cardPlayed', tag: 'tag-a', effects: [{ kind: 'draw', value: 1 }] })).toBe('Whenever you play a tag-a card, draw 1 card.');
    expect(describeTrigger({ on: 'blockGained', oncePerTurn: true, effects: [dmg(3)] })).toBe('Whenever you gain block, deal 3 damage. Once per turn.');
    expect(describeTrigger({ on: 'turnEnd', effects: [block(4)] })).toBe('At the end of your turn, before you discard, gain 4 block.');
  });

  it('relic text includes triggers', () => {
    expect(relicText(getRelic('exhaust-token'))).toBe('Whenever a card is exhausted, gain 3 block.');
  });
});

describe('determinism and upgraded cards', () => {
  it('the same seed replays an identical synergy fight', () => {
    const play1 = (): string => {
      const c = fight(['combo-strike', 'cull', 'prime-a', 'tag-a-payoff', 'exhaust-payoff', 'attack-echo', 'block-spark', 'power-up', 'blood-strike', 'single-use-strike'].map(getCard), {
        seed: 42,
        relics: [getRelic('exhaust-token')],
      });
      for (let turn = 0; turn < 3; turn++) {
        for (const inst of [...c.deck.hand]) {
          if (c.phase === 'playerTurn' && c.canPlay(inst)) c.playCard(inst.instanceId, inst.definition.target ? c.livingEnemies[0]?.id : undefined);
        }
        if (c.phase === 'playerTurn') c.endPlayerTurn();
      }
      return JSON.stringify([c.log, c.player, c.enemies.map((e) => e.hp), c.stats]);
    };
    expect(play1()).toBe(play1());
  });

  it('an upgraded card scales with its upgraded numbers', () => {
    const c = fight([getCard('combo-strike+'), mk('f')]);
    play(c, 'f');
    play(c, 'combo-strike+');
    expect(lostHp(c)).toBe(5 + 4);
  });

  it('exhaust can be upgraded away and triggers upgraded', () => {
    expect(getCard('attack-echo+').triggers?.[0].effects[0]).toEqual(block(3));
    expect(getCard('double-strength+').cost).toBe(0);
  });
});

describe('placeholder synergy content', () => {
  it('is registered and offered by the live game (user, 2026-10-07: every placeholder is in the pool for testing)', () => {
    for (const card of SYNERGY_CARDS) {
      expect(CARDS[card.id]).toBe(card);
      expect(card.inRewardPool).toBe(true);
    }
    for (const card of SYNERGY_CARDS) expect(rewardPoolFor('mage')).toContain(card);
    expect(RELIC_POOL.map((r) => r.id)).not.toContain('exhaust-token');
    expect(RELICS['kill-token']).toBeDefined();
  });

  it('allDraftableCards covers the pool plus the synergy cards, no starters or upgrades', () => {
    const all = allDraftableCards('mage');
    for (const c of SYNERGY_CARDS) expect(all).toContain(c);
    for (const c of rewardPoolFor('mage')) expect(all).toContain(c);
    expect(all.some((c) => c.id === 'strike' || c.upgradeOf)).toBe(false);
  });

  it('every registered card has generated text and a valid upgrade; aimed exactly when needed', () => {
    for (const base of baseCards()) {
      expect(cardText(base).length, base.id).toBeGreaterThan(0);
      const up = upgradedVersion(base);
      expect(up, base.id).toBeDefined();
      expect(cardText(up!).length, up!.id).toBeGreaterThan(0);
      expect(JSON.stringify(up!.effects) + String(up!.cost) + String(up!.exhaust) + JSON.stringify(up!.triggers) + JSON.stringify(up!.onTurnStartEffect), base.id).not.toBe(
        JSON.stringify(base.effects) + String(base.cost) + String(base.exhaust) + JSON.stringify(base.triggers) + JSON.stringify(base.onTurnStartEffect)
      );
    }
    for (const c of Object.values(CARDS)) {
      const aimed = (e: Effect): boolean => e.kind === 'damage' || ('to' in e && e.to === 'target');
      expect(Boolean(c.target), `${c.id}: target`).toBe((c.effects ?? []).some(aimed));
      if (c.triggers) expect(c.type, `${c.id}: triggers need a power`).toBe('power');
    }
  });

  it('text for the new cards reads as intended', () => {
    expect(cardText(getCard('combo-strike'))).toBe('Deal 4 damage. +3 for each card played earlier this turn.');
    expect(cardText(getCard('block-slam'))).toBe('Deal 1 damage for each point of your block.');
    expect(cardText(getCard('power-up'))).toBe('Gain 1 Empowered.');
    expect(cardText(getCard('double-strength'))).toBe('Double your Strength. Exhaust.');
    expect(cardText(getCard('cull'))).toBe('Exhaust 1 random card from your hand. Gain 1 energy. Exhaust.');
    expect(cardText(getCard('blood-strike'))).toBe('Lose 3 HP. Deal 14 damage.');
    expect(cardText(getCard('kill-reward'))).toBe('Whenever an enemy dies, gain 1 energy.');
    expect(cardText(getCard('end-guard'))).toBe('At the end of your turn, before you discard, gain 4 block.');
  });
});

describe('runs with synergy content', () => {
  it('a saved run holding synergy cards and relics restores by id', () => {
    const run = newRun(5);
    run.deck.push(getCard('combo-strike'), getCard('attack-echo+'));
    run.relics.push(getRelic('exhaust-token'));
    const restored = restoreSavedRun(JSON.parse(JSON.stringify(run.toSaved())));
    expect(restored).not.toBeNull();
    expect(restored!.deck.map((c) => c.id)).toEqual(run.deck.map((c) => c.id));
    expect(restored!.relics.map((r) => r.id)).toContain('exhaust-token');
  });

  it('the starter deck has no synergy cards; the reward pool is the 11 original cards plus all of them', () => {
    const run = newRun(5);
    expect(run.deck.some((c) => SYNERGY_CARDS.includes(c))).toBe(false);
    expect(rewardPoolFor('mage').length).toBe(11 + SYNERGY_CARDS.length);
  });
});
