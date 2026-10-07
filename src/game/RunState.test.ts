import { describe, expect, it } from 'vitest';
import { RunState } from './RunState';
import type { MapNodeKind } from './actMap';
import { Rng } from './rng';
import type { RelicDefinition } from './types';
import { POOL, STARTER, card, chainMap, world } from './testHelpers';
import {
  ELITE_REWARD_GOLD,
  PLAYER_MAX_HP,
  REST_HEAL_FRACTION,
  REWARD_CARD_CHOICES,
  REWARD_GOLD,
  SHOP_CARD_COUNT,
  SHOP_CARD_PRICE,
} from '../data/tunables';

/** A run along a straight line of stops. It starts at the map, so go() steps onto the first stop. */
function run(kinds: MapNodeKind[], seed = 1, extra: Parameters<typeof world>[0] = {}): RunState {
  return new RunState(chainMap(kinds), STARTER, world(extra), new Rng(seed));
}

/** Steps onto the next stop (there is only ever one choice on a straight line). */
function go(r: RunState): void {
  expect(r.phase).toBe('map');
  r.chooseNode(r.mapChoices[0].id);
}

const STR_RELIC: RelicDefinition = {
  id: 'str',
  name: 'Str',
  onCombatStart: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }],
};
const HP_RELIC: RelicDefinition = { id: 'hp', name: 'Hp', onPickup: [{ kind: 'maxHp', value: 10 }] };
const HEAL_RELIC: RelicDefinition = { id: 'heal', name: 'Heal', onVictory: [{ kind: 'heal', value: 4 }] };

describe('RunState: moving along the map', () => {
  it('starts on the map with full HP, no gold, and a copy of the starter deck', () => {
    const r = run(['combat', 'combat']);
    expect(r.phase).toBe('map');
    expect(r.position).toBeNull();
    expect(r.floor).toBe(0);
    expect(r.totalFloors).toBe(2);
    expect(r.hp).toBe(PLAYER_MAX_HP);
    expect(r.gold).toBe(0);
    expect(r.deck).toEqual(STARTER);
    expect(r.deck).not.toBe(STARTER);
  });

  it('offers the bottom floor first, then only the stops the current one leads to', () => {
    const r = run(['combat', 'rest', 'combat']);
    expect(r.mapChoices.map((n) => n.id)).toEqual(['0-0']);
    go(r);
    expect(r.phase).toBe('inNode');
    expect(r.floor).toBe(1);
    expect(r.mapChoices).toEqual([]); // nothing to pick while at a stop
    r.finishCombat('won', 50);
    r.takeRewardGold();
    expect(r.mapChoices.map((n) => n.id)).toEqual(['1-0']);
  });

  it('refuses a stop that is not reachable, or choosing while not on the map', () => {
    const r = run(['combat', 'rest', 'combat']);
    expect(() => r.chooseNode('2-0')).toThrow();
    go(r);
    expect(() => r.chooseNode('1-0')).toThrow();
  });

  it('rejects an empty map', () => {
    expect(() => new RunState({ lanes: 1, floors: 1, nodes: [] }, STARTER, world())).toThrow();
  });
});

describe('RunState: fights and rewards', () => {
  it('carries HP out of a won fight and offers distinct reward cards or gold', () => {
    const r = run(['combat', 'combat']);
    go(r);
    r.finishCombat('won', 41, 5);
    expect(r.hp).toBe(41);
    expect(r.phase).toBe('reward');
    const offer = r.pendingReward!;
    expect(offer.cards).toHaveLength(REWARD_CARD_CHOICES);
    expect(new Set(offer.cards).size).toBe(REWARD_CARD_CHOICES);
    expect(offer.gold).toBe(REWARD_GOLD);
    expect(offer.relic).toBeUndefined();
  });

  it('taking a card adds it to the deck and returns to the map', () => {
    const r = run(['combat', 'combat']);
    go(r);
    r.finishCombat('won', 50);
    const chosen = r.pendingReward!.cards[1];
    r.takeRewardCard(1);
    expect(r.deck).toHaveLength(STARTER.length + 1);
    expect(r.deck).toContain(chosen);
    expect(r.gold).toBe(0);
    expect(r.phase).toBe('map');
  });

  it('taking gold banks it and adds no card', () => {
    const r = run(['combat', 'combat']);
    go(r);
    r.finishCombat('won', 50);
    r.takeRewardGold();
    expect(r.gold).toBe(REWARD_GOLD);
    expect(r.deck).toHaveLength(STARTER.length);
  });

  it('losing a fight ends the run', () => {
    const r = run(['combat', 'combat']);
    go(r);
    r.finishCombat('lost', 0);
    expect(r.phase).toBe('lost');
  });

  it('winning the boss fight wins the run, with no reward to pick', () => {
    const r = run(['combat', 'boss']);
    go(r);
    r.finishCombat('won', 30);
    r.takeRewardGold();
    go(r);
    r.finishCombat('won', 10);
    expect(r.phase).toBe('won');
    expect(r.pendingReward).toBeNull();
  });

  it('clamps HP into range', () => {
    const r = run(['combat', 'combat']);
    go(r);
    r.finishCombat('won', 9999);
    expect(r.hp).toBe(r.maxHp);
  });

  it('only allows the action that matches the current stop', () => {
    const r = run(['combat', 'rest']);
    go(r);
    expect(() => r.rest()).toThrow();
    r.finishCombat('won', 50);
    expect(() => r.finishCombat('won', 50)).toThrow(); // reward pending, not in a fight
  });
});

describe('RunState: elites and relics', () => {
  it('an elite offers more gold and a relic, which comes with either choice', () => {
    for (const take of ['card', 'gold'] as const) {
      const r = run(['elite', 'combat'], 1, { relics: [STR_RELIC] });
      go(r);
      r.finishCombat('won', 50);
      expect(r.pendingReward!.gold).toBe(ELITE_REWARD_GOLD);
      expect(r.pendingReward!.relic).toBe(STR_RELIC);
      if (take === 'card') r.takeRewardCard(0);
      else r.takeRewardGold();
      expect(r.relics).toEqual([STR_RELIC]);
      expect(r.takeNotice()).toEqual(['Gained Str.']);
      expect(r.takeNotice()).toEqual([]);
    }
  });

  it('never offers a relic you already have', () => {
    const r = run(['elite', 'combat'], 1, { relics: [STR_RELIC] });
    r.grantRelic(STR_RELIC);
    go(r);
    r.finishCombat('won', 50);
    expect(r.pendingReward!.relic).toBeUndefined();
    expect(r.rollRelic()).toBeNull();
  });

  it('a max HP relic raises max HP and heals the same amount when picked up', () => {
    const r = run(['combat', 'combat'], 1, { relics: [HP_RELIC] });
    go(r);
    r.finishCombat('won', 30);
    r.takeRewardGold();
    r.grantRelic(HP_RELIC);
    expect(r.maxHp).toBe(PLAYER_MAX_HP + 10);
    expect(r.hp).toBe(40);
  });

  it('a victory relic heals after every fight you win', () => {
    const r = run(['combat', 'combat'], 1, { relics: [HEAL_RELIC] });
    r.grantRelic(HEAL_RELIC);
    go(r);
    r.finishCombat('won', 30);
    expect(r.hp).toBe(34);
  });
});

describe('RunState: rest stops', () => {
  it('heals a fraction of max HP, capped, and moves on', () => {
    const r = run(['combat', 'rest', 'combat']);
    go(r);
    r.finishCombat('won', 20);
    r.takeRewardGold();
    go(r);
    const heal = Math.round(PLAYER_MAX_HP * REST_HEAL_FRACTION);
    expect(r.restHealAmount).toBe(heal);
    expect(r.rest()).toBe(heal);
    expect(r.hp).toBe(20 + heal);
    expect(r.phase).toBe('map');

    const nearlyFull = run(['combat', 'rest', 'combat']);
    go(nearlyFull);
    nearlyFull.finishCombat('won', PLAYER_MAX_HP - 2);
    nearlyFull.takeRewardGold();
    go(nearlyFull);
    expect(nearlyFull.rest()).toBe(2);
    expect(nearlyFull.hp).toBe(PLAYER_MAX_HP);
  });

  it('can upgrade a card instead of healing', () => {
    const strike = card('strike', { upgrade: { cost: 0 } });
    const up = card('strike+', { cost: 0, upgradeOf: 'strike' });
    const r = new RunState(chainMap(['rest', 'combat']), [strike, card('other')], world({ cards: [strike, up] }), new Rng(1));
    go(r);
    expect(r.upgradableCards).toEqual([{ index: 0, card: strike }]);
    expect(r.upgradePreview(0)).toBe(up);
    expect(r.upgradePreview(1)).toBeUndefined();
    r.upgradeCard(0);
    expect(r.deck[0]).toBe(up);
    expect(r.hp).toBe(PLAYER_MAX_HP); // upgrading is instead of healing
    expect(r.phase).toBe('map');
    expect(r.history[0]).toMatchObject({ kind: 'rest', choice: 'upgrade', cardId: 'strike' });
  });

  it('refuses to upgrade a card that cannot be, or outside a rest stop', () => {
    const r = run(['rest', 'combat']);
    go(r);
    expect(() => r.upgradeCard(0)).toThrow();
    const c = run(['combat', 'combat']);
    go(c);
    expect(() => c.upgradeCard(0)).toThrow();
  });
});

describe('RunState: events', () => {
  function atEvent(): RunState {
    const r = run(['event', 'combat']);
    go(r);
    return r;
  }

  it('exposes the event at the stop', () => {
    expect(atEvent().event.id).toBe('ev');
  });

  it("applies a choice's outcomes in order and reports each; HP never drops below 1", () => {
    const r = atEvent();
    const result = r.chooseEventOption(0);
    expect(result).toEqual({ lines: ['Gained 30 gold.', 'Lost 5 HP.'], fighting: false });
    expect(r.gold).toBe(30);
    expect(r.hp).toBe(PLAYER_MAX_HP - 5);
    expect(r.phase).toBe('map');

    const frail = atEvent();
    frail.hp = 3;
    frail.chooseEventOption(0);
    expect(frail.hp).toBe(1);
  });

  it('a choice with no outcomes just moves on', () => {
    const r = atEvent();
    expect(r.chooseEventOption(1)).toEqual({ lines: [], fighting: false });
    expect(r.phase).toBe('map');
  });

  it('a fight outcome starts the fight; the outcomes after it wait for a win', () => {
    const r = atEvent();
    const result = r.chooseEventOption(2);
    expect(result.fighting).toBe(true);
    expect(r.gold).toBe(0);
    expect(r.phase).toBe('inNode');
    expect(r.currentNode).toMatchObject({ kind: 'combat', tier: 'normal' });
    r.finishCombat('won', 40);
    expect(r.gold).toBe(99);
    expect(r.phase).toBe('map');
    expect(r.takeNotice()).toEqual(['Gained 99 gold.']);
  });

  it('losing an event fight ends the run without the outcomes', () => {
    const r = atEvent();
    r.chooseEventOption(2);
    r.finishCombat('lost', 0);
    expect(r.phase).toBe('lost');
    expect(r.gold).toBe(0);
  });

  it('is only usable at an event stop', () => {
    const r = run(['combat', 'event']);
    go(r);
    expect(() => r.event).toThrow();
    expect(() => r.chooseEventOption(0)).toThrow();
  });
});

describe('RunState: shop (draft)', () => {
  function atShop(): RunState {
    const r = run(['shop', 'combat']);
    go(r);
    return r;
  }

  it('stocks distinct cards at the flat price, and keeps the same stock until you leave', () => {
    const r = atShop();
    const items = r.shopItems;
    expect(items).toHaveLength(SHOP_CARD_COUNT);
    expect(new Set(items.map((i) => i.card)).size).toBe(SHOP_CARD_COUNT);
    expect(items.every((i) => i.price === SHOP_CARD_PRICE && !i.sold)).toBe(true);
    expect(r.shopItems).toBe(items);
    expect(POOL.length).toBeGreaterThanOrEqual(SHOP_CARD_COUNT);
  });

  it('refuses a purchase you cannot afford', () => {
    const r = atShop();
    expect(r.buyShopItem(0)).toBe(false);
    expect(r.deck).toEqual(STARTER);
  });

  it('spends gold, adds the card, and sells each item once', () => {
    const r = atShop();
    r.gold = SHOP_CARD_PRICE * 2;
    const bought = r.shopItems[1].card;
    expect(r.buyShopItem(1)).toBe(true);
    expect(r.gold).toBe(SHOP_CARD_PRICE);
    expect(r.deck).toContain(bought);
    expect(r.buyShopItem(1)).toBe(false);
  });

  it('leaving returns to the map', () => {
    const r = atShop();
    r.leaveShop();
    expect(r.phase).toBe('map');
  });

  it('is only usable at a shop stop', () => {
    const r = run(['combat', 'shop']);
    go(r);
    expect(() => r.shopItems).toThrow();
    expect(() => r.leaveShop()).toThrow();
  });
});

describe('RunState: a whole act', () => {
  it('fight, reward, rest, event, shop, elite, boss', () => {
    const r = run(['combat', 'rest', 'event', 'shop', 'elite', 'boss'], 3, { relics: [STR_RELIC] });
    go(r);
    r.finishCombat('won', 40);
    r.takeRewardCard(0);
    go(r);
    r.rest();
    go(r);
    r.chooseEventOption(1);
    go(r);
    r.leaveShop();
    go(r);
    r.finishCombat('won', 35);
    r.takeRewardGold();
    go(r);
    r.finishCombat('won', 20);
    expect(r.phase).toBe('won');
    expect(r.deck).toHaveLength(STARTER.length + 1);
    expect(r.relics).toHaveLength(1);
    expect(r.history.map((e) => e.kind)).toEqual(['combat', 'reward', 'rest', 'event', 'shop', 'combat', 'reward', 'combat']);
  });

  it('dev tools: jump to any stop, or start a fight there', () => {
    const r = run(['combat', 'rest', 'combat']);
    r.jumpTo('1-0');
    expect(r.phase).toBe('inNode');
    expect(r.currentNode.kind).toBe('rest');
    r.startFight(['foe']);
    expect(r.currentNode).toMatchObject({ kind: 'combat' });
    r.finishCombat('won', 50);
    expect(r.phase).toBe('map');
    expect(() => r.jumpTo('9-9')).toThrow();
  });
});
