import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { captureScenario, restoreScenario } from './scenario';
import { Rng } from './rng';
import { cardText } from './describe';
import type { CardDefinition, EnemyDefinition } from './types';
import { RADIANT_LIGHT_MAX } from '../data/tunables';

// Radiant Light: the Paladin's placeholder resource (implementationplan.md "Multiple heroes and hero
// selection"). Starts at 0, carries between turns, is gained from cards, and pays for cards that
// declare `costResource: 'radiantLight'`.

const def = (id: string, extra: Partial<CardDefinition>): CardDefinition => ({ id, name: id, type: 'skill', cost: 1, owner: 'test', inRewardPool: false, ...extra });
const DUMMY: EnemyDefinition = { id: 'dummy', name: 'Dummy', maxHp: 1000, movePattern: [{ name: 'Poke', effects: [{ kind: 'damage', value: 1 }] }] };

const GAIN = def('gain', { effects: [{ kind: 'gainRadiantLight', value: 3 }] });
const BLOCK_AND_GAIN = def('block-gain', { effects: [{ kind: 'block', value: 5 }, { kind: 'gainRadiantLight', value: 2 }] });
const LIGHT_HIT = def('light-hit', { type: 'attack', target: 'enemy', cost: 2, costResource: 'radiantLight', effects: [{ kind: 'damage', value: 10 }] });
const ENGINE = def('engine', { type: 'power', onTurnStartEffect: { kind: 'gainRadiantLight', value: 1 } });

function fight(deck: CardDefinition[], options: { maxEnergy?: number } = {}): CombatState {
  const c = new CombatState(deck, [DUMMY], { random: () => 0.5, ...options });
  c.start();
  return c;
}
const inHand = (c: CombatState, d: CardDefinition) => c.deck.hand.find((x) => x.definition === d)!;

describe('Radiant Light', () => {
  it('starts at 0 and is gained from cards without touching energy', () => {
    const c = fight([GAIN, GAIN, GAIN, GAIN, GAIN]);
    expect(c.radiantLight).toBe(0);
    const events: number[] = [];
    c.on('radiantLightChanged', (e) => events.push(e.radiantLight));
    expect(c.playCard(inHand(c, GAIN).instanceId)).toBe(true);
    expect(c.radiantLight).toBe(3);
    expect(c.energy).toBe(c.maxEnergy - 1); // the card itself costs energy; the gain is separate
    expect(events).toEqual([3]);
  });

  it('a card paid in Radiant Light cannot be played without enough, and does not spend energy', () => {
    const c = fight([LIGHT_HIT, LIGHT_HIT, GAIN, GAIN, GAIN]);
    const hit = inHand(c, LIGHT_HIT);
    expect(c.canPlay(hit)).toBe(false);
    expect(c.playCard(hit.instanceId, 'enemy-0')).toBe(false);
    c.playCard(inHand(c, GAIN).instanceId); // 3 light
    const energyBefore = c.energy;
    expect(c.canPlay(hit)).toBe(true);
    expect(c.playCard(hit.instanceId, 'enemy-0')).toBe(true);
    expect(c.radiantLight).toBe(1);
    expect(c.energy).toBe(energyBefore);
    expect(c.enemies[0].hp).toBe(990);
  });

  it('having energy does not let a Radiant Light card be played, and having Light does not pay an energy cost', () => {
    const c = fight([LIGHT_HIT, GAIN, GAIN, GAIN, GAIN], { maxEnergy: 9 });
    expect(c.canPlay(inHand(c, LIGHT_HIT))).toBe(false);
    c.radiantLight = 5;
    c.energy = 0;
    expect(c.canPlay(inHand(c, GAIN))).toBe(false); // costs 1 energy
    expect(c.canPlay(inHand(c, LIGHT_HIT))).toBe(true);
  });

  it('carries between turns, is capped, and a power can generate it each turn', () => {
    const c = fight([BLOCK_AND_GAIN, ENGINE, BLOCK_AND_GAIN, BLOCK_AND_GAIN, BLOCK_AND_GAIN]);
    c.playCard(inHand(c, BLOCK_AND_GAIN).instanceId);
    expect(c.radiantLight).toBe(2);
    c.playCard(inHand(c, ENGINE).instanceId);
    c.endPlayerTurn();
    expect(c.turnNumber).toBe(2);
    expect(c.radiantLight).toBe(3); // kept the 2, the power added 1
    c.radiantLight = RADIANT_LIGHT_MAX - 1;
    const events: { radiantLight: number; delta: number }[] = [];
    c.on('radiantLightChanged', (e) => events.push(e));
    c.playCard(c.deck.hand.find((x) => x.definition === BLOCK_AND_GAIN)!.instanceId);
    expect(c.radiantLight).toBe(RADIANT_LIGHT_MAX);
    expect(events[0].delta).toBe(1); // reports the real change after the cap
  });

  it('has readable card text', () => {
    expect(cardText(BLOCK_AND_GAIN)).toContain('Gain 2 Radiant Light.');
  });
});

describe('Radiant Light in a scenario', () => {
  it('round-trips through capture and restore', () => {
    const c = new CombatState([GAIN, LIGHT_HIT, GAIN, GAIN, GAIN], [DUMMY], { rng: new Rng(7), maxEnergy: 3 });
    c.start();
    c.playCard(c.deck.hand.find((x) => x.definition === GAIN)!.instanceId);
    const scenario = captureScenario(c);
    expect(scenario.radiantLight).toBe(3);
    expect(scenario.maxEnergy).toBe(3);
    const world = { cards: { gain: GAIN, 'light-hit': LIGHT_HIT }, relics: {}, enemies: { dummy: DUMMY } };
    const back = restoreScenario(scenario, world);
    expect(back.radiantLight).toBe(3);
    expect(back.maxEnergy).toBe(3);
  });
});
