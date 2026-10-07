import { describe, expect, it } from 'vitest';
import { RunState, type RunNode } from './RunState';
import type { CardDefinition, EnemyDefinition } from './types';
import {
  PLAYER_MAX_HP,
  REST_HEAL_FRACTION,
  REWARD_CARD_CHOICES,
  REWARD_GOLD,
  SHOP_CARD_COUNT,
  SHOP_CARD_PRICE,
} from '../data/tunables';

function card(id: string): CardDefinition {
  return { id, name: id, type: 'skill', cost: 1, description: '' };
}

const FOE: EnemyDefinition = { id: 'foe', name: 'Foe', maxHp: 10, movePattern: [{ kind: 'attack', value: 1, name: 'A' }] };
const fight: RunNode = { kind: 'combat', enemy: FOE };
const rest: RunNode = { kind: 'rest' };

const STARTER = [card('s1'), card('s2')];
const POOL = [card('p1'), card('p2'), card('p3'), card('p4'), card('p5')];

function run(nodes: RunNode[], random?: () => number): RunState {
  return new RunState(nodes, STARTER, POOL, random);
}

describe('RunState', () => {
  it('starts at the first node with full HP, no gold, and a copy of the starter deck', () => {
    const r = run([fight, fight]);
    expect(r.phase).toBe('inNode');
    expect(r.currentNode).toBe(fight);
    expect(r.floor).toBe(1);
    expect(r.totalFloors).toBe(2);
    expect(r.hp).toBe(PLAYER_MAX_HP);
    expect(r.gold).toBe(0);
    expect(r.deck).toEqual(STARTER);
    expect(r.deck).not.toBe(STARTER);
  });

  it('rejects an empty path', () => {
    expect(() => run([])).toThrow();
  });

  it('carries HP out of a won fight and offers distinct reward cards or gold', () => {
    const r = run([fight, fight]);
    r.finishCombat('won', 41);
    expect(r.hp).toBe(41);
    expect(r.phase).toBe('reward');
    const offer = r.pendingReward!;
    expect(offer.gold).toBe(REWARD_GOLD);
    expect(offer.cards).toHaveLength(REWARD_CARD_CHOICES);
    expect(new Set(offer.cards).size).toBe(REWARD_CARD_CHOICES);
    offer.cards.forEach((c) => expect(POOL).toContain(c));
  });

  it('offers only as many cards as the pool has, without duplicates', () => {
    const r = new RunState([fight, fight], STARTER, [POOL[0], POOL[0], POOL[1]]);
    r.finishCombat('won', 50);
    expect(r.pendingReward!.cards).toHaveLength(2);
  });

  it('taking a reward card adds it to the deck and moves to the next node', () => {
    const r = run([fight, rest]);
    r.finishCombat('won', 50);
    const picked = r.pendingReward!.cards[1];
    r.takeRewardCard(1);
    expect(r.deck).toEqual([...STARTER, picked]);
    expect(r.gold).toBe(0);
    expect(r.phase).toBe('inNode');
    expect(r.currentNode).toBe(rest);
    expect(r.pendingReward).toBeNull();
  });

  it('taking gold banks it and leaves the deck alone', () => {
    const r = run([fight, fight]);
    r.finishCombat('won', 50);
    r.takeRewardGold();
    expect(r.gold).toBe(REWARD_GOLD);
    expect(r.deck).toEqual(STARTER);
    expect(r.floor).toBe(2);
  });

  it('rejects reward choices when no reward is pending, or a bad index', () => {
    const r = run([fight, fight]);
    expect(() => r.takeRewardGold()).toThrow();
    r.finishCombat('won', 50);
    expect(() => r.takeRewardCard(99)).toThrow();
  });

  it('losing a fight ends the run', () => {
    const r = run([fight, fight]);
    r.finishCombat('lost', 0);
    expect(r.phase).toBe('lost');
    expect(r.hp).toBe(0);
    expect(r.pendingReward).toBeNull();
  });

  it('winning the final fight wins the run with no reward', () => {
    const r = run([fight]);
    r.finishCombat('won', 12);
    expect(r.phase).toBe('won');
    expect(r.pendingReward).toBeNull();
    expect(r.hp).toBe(12);
  });

  it('resting heals a fraction of max HP, capped at max', () => {
    const r = run([fight, rest, fight]);
    r.finishCombat('won', 20);
    r.takeRewardGold();
    const expected = Math.round(PLAYER_MAX_HP * REST_HEAL_FRACTION);
    expect(r.restHealAmount).toBe(expected);
    expect(r.rest()).toBe(expected);
    expect(r.hp).toBe(20 + expected);
    expect(r.currentNode).toBe(fight);

    const nearlyFull = run([fight, rest, fight]);
    nearlyFull.finishCombat('won', PLAYER_MAX_HP - 2);
    nearlyFull.takeRewardGold();
    expect(nearlyFull.rest()).toBe(2);
    expect(nearlyFull.hp).toBe(PLAYER_MAX_HP);
  });

  it('only allows the action that matches the current node', () => {
    const r = run([fight, rest]);
    expect(() => r.rest()).toThrow();
    r.finishCombat('won', 50);
    r.takeRewardGold();
    expect(() => r.finishCombat('won', 50)).toThrow();
  });

  it('a whole run: fight, reward, rest, final fight', () => {
    const r = run([fight, rest, fight], () => 0);
    r.finishCombat('won', 30);
    r.takeRewardCard(0);
    r.rest();
    r.finishCombat('won', 10);
    expect(r.phase).toBe('won');
    expect(r.deck).toHaveLength(STARTER.length + 1);
  });
});

describe('RunState shop (draft)', () => {
  const shop: RunNode = { kind: 'shop' };

  it('stocks distinct cards at the flat price, and keeps the same stock until you leave', () => {
    const r = run([shop, fight]);
    const items = r.shopItems;
    expect(items).toHaveLength(SHOP_CARD_COUNT);
    expect(new Set(items.map((i) => i.card)).size).toBe(SHOP_CARD_COUNT);
    expect(items.every((i) => i.price === SHOP_CARD_PRICE && !i.sold)).toBe(true);
    expect(r.shopItems).toBe(items);
  });

  it('refuses a purchase you cannot afford', () => {
    const r = run([shop, fight]);
    expect(r.buyShopItem(0)).toBe(false);
    expect(r.deck).toEqual(STARTER);
  });

  it('spends gold, adds the card, and sells each item once', () => {
    const r = run([shop, fight]);
    r.gold = SHOP_CARD_PRICE * 2;
    const bought = r.shopItems[1].card;
    expect(r.buyShopItem(1)).toBe(true);
    expect(r.gold).toBe(SHOP_CARD_PRICE);
    expect(r.deck).toContain(bought);
    expect(r.buyShopItem(1)).toBe(false);
    expect(r.gold).toBe(SHOP_CARD_PRICE);
  });

  it('leaving moves on and the next shop restocks', () => {
    const r = run([shop, shop, fight]);
    const first = r.shopItems;
    r.leaveShop();
    expect(r.currentNode).toBe(shop);
    expect(r.shopItems).not.toBe(first);
  });

  it('is only usable while at a shop node', () => {
    const r = run([fight, shop]);
    expect(() => r.shopItems).toThrow();
    expect(() => r.leaveShop()).toThrow();
  });
});
