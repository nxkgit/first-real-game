import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { cardText, describeOutcome, relicText } from './describe';
import type { CardDefinition, EnemyDefinition } from './types';
import { CARDS, MAGE, baseCards, getCard, rewardPoolFor, upgradedVersion } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { RELICS, RELIC_POOL, getRelic } from '../data/relics';
import { ACT_CONTENT } from '../data/run';

const FOE: EnemyDefinition = {
  id: 'f',
  name: 'F',
  maxHp: 50,
  movePattern: [{ name: 'Hit', effects: [{ kind: 'damage', value: 5 }] }],
};
const FILLER: CardDefinition = {
  id: 'filler',
  name: 'Filler',
  type: 'skill',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'block', value: 1 }],
};
const deck = Array(10).fill(FILLER);

describe('relics in a fight', () => {
  it('a combat-start relic applies before the first hand, and only once', () => {
    const seen: string[] = [];
    const combat = new CombatState(deck, [FOE], { relics: [getRelic('strength-token'), getRelic('guard-token')] });
    combat.on('statusChanged', ({ status, delta }) => seen.push(`${status}${delta}`));
    combat.on('blockGained', ({ amount }) => seen.push(`block${amount}`));
    combat.on('handChanged', () => seen.push('hand'));
    combat.start();
    expect(seen.slice(0, 3)).toEqual(['strength1', 'block6', 'hand']);
    expect(combat.player.statuses.strength).toBe(1);
    combat.endPlayerTurn();
    expect(combat.player.statuses.strength).toBe(1); // not stacked again on turn two
  });

  it('a combat-start relic really changes the damage dealt', () => {
    const hit: CardDefinition = {
      ...FILLER,
      id: 'h',
      type: 'attack',
      target: 'enemy',
      cost: 0,
      effects: [{ kind: 'damage', value: 10 }],
    };
    const combat = new CombatState([hit, hit, hit, hit, hit], [FOE], { relics: [getRelic('strength-token')] });
    combat.start();
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0');
    expect(combat.enemies[0].hp).toBe(39);
  });

  it('a turn-start relic acts every turn, including the first', () => {
    const combat = new CombatState(deck, [FOE], { relics: [getRelic('draw-token')] });
    combat.start();
    expect(combat.deck.hand).toHaveLength(6);
    combat.endPlayerTurn();
    expect(combat.deck.hand).toHaveLength(6);
  });

  it('without relics nothing changes', () => {
    const combat = new CombatState(deck, [FOE]);
    combat.start();
    expect(combat.deck.hand).toHaveLength(5);
    expect(combat.player.statuses).toEqual({});
  });
});

describe('placeholder relic content', () => {
  it('has readable generated text for every relic', () => {
    expect(relicText(getRelic('strength-token'))).toBe('At the start of each fight, gain 1 Strength.');
    expect(relicText(getRelic('vitality-token'))).toBe('Gain 10 max HP.');
    expect(relicText(getRelic('guard-token'))).toBe('At the start of each fight, gain 6 block.');
    expect(relicText(getRelic('recovery-token'))).toBe('After each fight you win, heal 4 HP.');
    expect(relicText(getRelic('draw-token'))).toBe('At the start of each turn, draw 1 additional card.');
    for (const relic of RELIC_POOL) expect(relicText(relic).length).toBeGreaterThan(0);
  });

  it('keys relics by id', () => {
    for (const [id, relic] of Object.entries(RELICS)) expect(relic.id).toBe(id);
    expect(() => getRelic('nope')).toThrow();
  });
});

describe('card upgrades', () => {
  it('every upgraded card is registered as <id>+ and points back at its base', () => {
    for (const base of baseCards()) {
      const up = upgradedVersion(base);
      if (!base.upgrade) {
        expect(up).toBeUndefined();
        continue;
      }
      expect(up).toBeDefined();
      expect(up!.id).toBe(`${base.id}+`);
      expect(up!.name).toBe(`${base.name}+`);
      expect(up!.upgradeOf).toBe(base.id);
      expect(up!.upgrade).toBeUndefined(); // can't be upgraded twice
      expect(CARDS[up!.id]).toBe(up);
    }
  });

  it('an upgrade really changes the card, and its text follows', () => {
    const strike = getCard('strike');
    const up = upgradedVersion(strike)!;
    expect(cardText(strike)).toBe('Deal 6 damage.');
    expect(cardText(up)).toBe('Deal 9 damage.');
    expect(up.target).toBe('enemy');
    expect(upgradedVersion(getCard('focus'))!.cost).toBe(0);
  });

  it('every placeholder card has an upgrade, and upgraded cards never show up as rewards', () => {
    for (const base of baseCards()) expect(base.upgrade, base.id).toBeDefined();
    expect(rewardPoolFor(MAGE).some((c) => c.upgradeOf)).toBe(false);
  });

  it('a hand-written description must not be left stale on an upgrade', () => {
    for (const base of baseCards()) {
      if (base.description !== undefined) expect(base.upgrade?.description, base.id).toBeDefined();
    }
  });
});

describe('placeholder act content', () => {
  it('only names enemies and events that exist', () => {
    const ids = [
      ...ACT_CONTENT.earlyEncounters,
      ...ACT_CONTENT.encounters,
      ...ACT_CONTENT.elites,
      ...ACT_CONTENT.bosses,
    ].flat();
    for (const id of ids) expect(ENEMIES[id], id).toBeDefined();
    for (const id of ACT_CONTENT.events) expect(EVENTS[id], id).toBeDefined();
  });

  it('events only name cards and enemies that exist, and read well', () => {
    for (const event of Object.values(EVENTS)) {
      expect(event.choices.length).toBeGreaterThan(0);
      for (const choice of event.choices) {
        for (const outcome of choice.outcomes) {
          if (outcome.kind === 'card') expect(CARDS[outcome.cardId]).toBeDefined();
          if (outcome.kind === 'fight') outcome.enemies.forEach((id) => expect(ENEMIES[id]).toBeDefined());
          expect(describeOutcome(outcome).length).toBeGreaterThan(0);
        }
      }
    }
    expect(describeOutcome({ kind: 'gold', value: -50 })).toBe('Lose 50 gold.');
    expect(describeOutcome({ kind: 'hp', value: 15 })).toBe('Heal 15 HP.');
  });
});
