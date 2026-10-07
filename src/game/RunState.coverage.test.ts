import { describe, expect, it } from 'vitest';
import { RunState } from './RunState';
import type { MapNodeKind } from './actMap';
import { Rng } from './rng';
import type { EventDefinition, RelicDefinition } from './types';
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

// Coverage-focused tests for RunState: shop, rest, events, relic hooks, rewards, run end.

const UPGRADABLE = card('up', { upgrade: { effects: [{ kind: 'damage', value: 9 }] }, inRewardPool: false });
const UPGRADED = card('up+', { upgradeOf: 'up', effects: [{ kind: 'damage', value: 9 }], inRewardPool: false });

function run(kinds: MapNodeKind[], opts: Parameters<typeof world>[0] = {}, deck = STARTER, seed = 7): RunState {
  return new RunState(chainMap(kinds), deck, world({ ...opts, cards: [UPGRADABLE, UPGRADED, ...(opts.cards ?? [])] }), new Rng(seed));
}
function go(r: RunState): void {
  r.chooseNode(r.mapChoices[0].id);
}
function winFight(r: RunState, hp = r.hp): void {
  r.finishCombat('won', hp, 3);
}

const relic = (id: string, extra: Partial<RelicDefinition> = {}): RelicDefinition => ({ id, name: id, ...extra });
const eventWith = (choices: EventDefinition['choices']): EventDefinition => ({ id: 'ev2', title: 'T', text: 't', choices });
/** A run standing at an event stop with the given choices. */
function atEvent(choices: EventDefinition['choices'], opts: Parameters<typeof world>[0] = {}): RunState {
  const ev = eventWith(choices);
  const r = run(['event', 'combat'], { ...opts, events: [ev] });
  r.map.nodes[0].eventId = 'ev2'; // point the event stop at our event
  go(r);
  return r;
}

describe('RunState shop', () => {
  it('stocks SHOP_CARD_COUNT distinct reward-pool cards at the flat price, unsold', () => {
    const r = run(['shop', 'combat']);
    go(r);
    const items = r.shopItems;
    expect(items).toHaveLength(Math.min(SHOP_CARD_COUNT, POOL.length));
    expect(new Set(items.map((i) => i.card.id)).size).toBe(items.length);
    for (const i of items) {
      expect(POOL).toContain(i.card);
      expect(i.price).toBe(SHOP_CARD_PRICE);
      expect(i.sold).toBe(false);
    }
  });

  it('keeps the same stock when looked at twice', () => {
    const r = run(['shop', 'combat']);
    go(r);
    expect(r.shopItems).toBe(r.shopItems);
  });

  it('refuses a purchase you cannot afford and changes nothing', () => {
    const r = run(['shop', 'combat']);
    go(r);
    r.gold = SHOP_CARD_PRICE - 1;
    const before = r.deck.length;
    expect(r.buyShopItem(0)).toBe(false);
    expect(r.gold).toBe(SHOP_CARD_PRICE - 1);
    expect(r.deck).toHaveLength(before);
    expect(r.shopItems[0].sold).toBe(false);
  });

  it('buys with exactly enough gold, takes the gold, adds the card, and marks it sold', () => {
    const r = run(['shop', 'combat']);
    go(r);
    r.gold = SHOP_CARD_PRICE;
    const item = r.shopItems[1];
    expect(r.buyShopItem(1)).toBe(true);
    expect(r.gold).toBe(0);
    expect(r.deck[r.deck.length - 1]).toBe(item.card);
    expect(item.sold).toBe(true);
  });

  it('cannot buy the same item twice, nor a missing slot', () => {
    const r = run(['shop', 'combat']);
    go(r);
    r.gold = SHOP_CARD_PRICE * 5;
    expect(r.buyShopItem(0)).toBe(true);
    expect(r.buyShopItem(0)).toBe(false);
    expect(r.gold).toBe(SHOP_CARD_PRICE * 4);
    expect(r.buyShopItem(99)).toBe(false);
    expect(r.buyShopItem(-1)).toBe(false);
  });

  it('records purchases and gold spent on leaving, and moves on', () => {
    const r = run(['shop', 'combat']);
    go(r);
    r.gold = SHOP_CARD_PRICE * 2;
    r.buyShopItem(0);
    r.buyShopItem(2);
    const ids = [r.shopItems[0].card.id, r.shopItems[2].card.id];
    r.leaveShop();
    expect(r.history.at(-1)).toEqual({ kind: 'shop', floor: 1, bought: ids, goldSpent: SHOP_CARD_PRICE * 2 });
    expect(r.phase).toBe('map');
  });

  it('leaving without buying logs an empty purchase', () => {
    const r = run(['shop', 'combat']);
    go(r);
    r.leaveShop();
    expect(r.history.at(-1)).toMatchObject({ kind: 'shop', bought: [], goldSpent: 0 });
  });

  it('throws when asked about the shop anywhere else', () => {
    const r = run(['combat', 'shop']);
    go(r);
    expect(() => r.shopItems).toThrow();
    const m = run(['shop']);
    expect(() => m.shopItems).toThrow(); // still on the map
  });

  it('a later shop is a fresh roll (stock does not carry over)', () => {
    const r = run(['shop', 'shop', 'combat']);
    go(r);
    r.gold = 1000;
    r.buyShopItem(0);
    r.leaveShop();
    go(r);
    expect(r.shopItems.every((i) => !i.sold)).toBe(true);
  });
});

describe('RunState rest stops', () => {
  it('heals REST_HEAL_FRACTION of max HP, as rounded', () => {
    const r = run(['rest', 'combat']);
    go(r);
    r.hp = 10;
    const expected = Math.round(PLAYER_MAX_HP * REST_HEAL_FRACTION);
    expect(r.restHealAmount).toBe(expected);
    expect(r.rest()).toBe(expected);
    expect(r.hp).toBe(10 + expected);
    expect(r.history.at(-1)).toEqual({ kind: 'rest', floor: 1, choice: 'heal', healed: expected });
    expect(r.phase).toBe('map');
  });

  it('never heals past max HP and reports the HP actually restored', () => {
    const r = run(['rest', 'combat']);
    go(r);
    r.hp = r.maxHp - 2;
    expect(r.rest()).toBe(2);
    expect(r.hp).toBe(r.maxHp);
  });

  it('heals 0 at full HP', () => {
    const r = run(['rest', 'combat']);
    go(r);
    expect(r.rest()).toBe(0);
    expect(r.hp).toBe(PLAYER_MAX_HP);
  });

  it('heal amount follows a raised max HP', () => {
    const r = run(['rest', 'combat']);
    go(r);
    r.maxHp = 100;
    r.hp = 1;
    expect(r.restHealAmount).toBe(Math.round(100 * REST_HEAL_FRACTION));
  });

  it('upgradableCards lists only cards with an upgrade, with deck positions', () => {
    const r = run(['rest', 'combat'], {}, [STARTER[0], UPGRADABLE, STARTER[1], UPGRADABLE]);
    go(r);
    expect(r.upgradableCards.map((u) => u.index)).toEqual([1, 3]);
  });

  it('upgrading swaps exactly that card for its + version, logs it, and moves on without healing', () => {
    const r = run(['rest', 'combat'], {}, [STARTER[0], UPGRADABLE, UPGRADABLE]);
    go(r);
    r.hp = 5;
    expect(r.upgradePreview(2)).toBe(UPGRADED);
    r.upgradeCard(2);
    expect(r.deck.map((c) => c.id)).toEqual(['s1', 'up', 'up+']);
    expect(r.hp).toBe(5);
    expect(r.history.at(-1)).toEqual({ kind: 'rest', floor: 1, choice: 'upgrade', cardId: 'up' });
    expect(r.phase).toBe('map');
  });

  it('cannot upgrade a card that has no upgrade, or an already-upgraded one (no double upgrade)', () => {
    const r = run(['rest', 'combat'], {}, [STARTER[0], UPGRADED]);
    go(r);
    expect(r.upgradePreview(0)).toBeUndefined();
    expect(r.upgradePreview(1)).toBeUndefined();
    expect(r.upgradePreview(5)).toBeUndefined();
    expect(() => r.upgradeCard(0)).toThrow();
    expect(() => r.upgradeCard(1)).toThrow();
    expect(r.phase).toBe('inNode'); // a failed upgrade leaves the rest stop open
    expect(r.upgradableCards).toEqual([]);
  });

  it('rest and upgrade are only allowed at a rest stop', () => {
    const r = run(['combat', 'rest']);
    go(r);
    expect(() => r.rest()).toThrow();
    expect(() => r.upgradeCard(0)).toThrow();
  });

  it('a second rest/upgrade at the same stop is refused (the stop is spent)', () => {
    const r = run(['rest', 'combat'], {}, [UPGRADABLE]);
    go(r);
    r.upgradeCard(0);
    expect(() => r.upgradeCard(0)).toThrow();
    expect(() => r.rest()).toThrow();
  });
});

describe('RunState event outcomes', () => {
  it('gold outcome: gain is exact, loss is floored at 0 and the line reports what really changed', () => {
    const r = atEvent([{ label: 'a', outcomes: [{ kind: 'gold', value: 30 }, { kind: 'gold', value: -50 }] }]);
    r.gold = 10;
    const { lines, fighting } = r.chooseEventOption(0);
    expect(fighting).toBe(false);
    expect(r.gold).toBe(0);
    expect(lines).toEqual(['Gained 30 gold.', 'Lost 40 gold.']);
  });

  it('hp outcome never drops below 1', () => {
    const r = atEvent([{ label: 'hurt', outcomes: [{ kind: 'hp', value: -9999 }] }]);
    r.chooseEventOption(0);
    expect(r.hp).toBe(1);
  });

  it('hp outcome never exceeds max HP', () => {
    const r = atEvent([{ label: 'heal', outcomes: [{ kind: 'hp', value: 9999 }] }]);
    r.hp = 5;
    r.chooseEventOption(0);
    expect(r.hp).toBe(r.maxHp);
  });

  it('hp outcome line reports the HP really lost', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'hp', value: -8 }] }]);
    expect(r.chooseEventOption(0).lines).toEqual(['Lost 8 HP.']);
    expect(r.hp).toBe(PLAYER_MAX_HP - 8);
  });

  // FINDING: when a loss is fully absorbed by the floor (already at 1 HP, or 0 gold) the line says
  // "Healed 0 HP." / "Gained 0 gold." because the sign test is on the actual change (0), not on the
  // outcome's value. It is misleading text for a loss.
  it('a loss absorbed by the HP floor is not described as healing', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'hp', value: -5 }] }]);
    r.hp = 1;
    const [line] = r.chooseEventOption(0).lines;
    expect(line).not.toMatch(/^Healed/);
  });

  it('a gold loss with 0 gold is not described as a gain', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'gold', value: -50 }] }]);
    r.gold = 0;
    const [line] = r.chooseEventOption(0).lines;
    expect(line).not.toMatch(/^Gained/);
  });

  it('max HP gain also heals by that amount (capped at the new max)', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'maxHp', value: 8 }] }]);
    r.hp = 20;
    const { lines } = r.chooseEventOption(0);
    expect(r.maxHp).toBe(PLAYER_MAX_HP + 8);
    expect(r.hp).toBe(28);
    expect(lines).toEqual(['Gained 8 max HP.']);
  });

  it('max HP loss lowers the cap, trims current HP to it, and keeps HP and max at 1 or more', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'maxHp', value: -10 }] }]);
    const { lines } = r.chooseEventOption(0);
    expect(r.maxHp).toBe(PLAYER_MAX_HP - 10);
    expect(r.hp).toBe(PLAYER_MAX_HP - 10);
    expect(lines).toEqual(['Lost 10 max HP.']);

    const r2 = atEvent([{ label: 'x', outcomes: [{ kind: 'maxHp', value: -100000 }] }]);
    r2.chooseEventOption(0);
    expect(r2.maxHp).toBe(1);
    expect(r2.hp).toBe(1);
  });

  it('max HP loss does not heal when HP is below the new cap', () => {
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'maxHp', value: -10 }] }]);
    r.hp = 12;
    r.chooseEventOption(0);
    expect(r.hp).toBe(12);
  });

  it('card outcome adds that exact card; randomCard adds one from the reward pool', () => {
    const r = atEvent([{ label: 'c', outcomes: [{ kind: 'card', cardId: 'up' }, { kind: 'randomCard' }] }]);
    const { lines } = r.chooseEventOption(0);
    expect(r.deck).toHaveLength(STARTER.length + 2);
    expect(r.deck[STARTER.length].id).toBe('up');
    expect(POOL).toContain(r.deck[STARTER.length + 1]);
    expect(lines[0]).toBe('Added up to your deck.');
    expect(lines).toHaveLength(2);
  });

  it('randomCard says so when the reward pool is empty', () => {
    const w = world({ events: [eventWith([{ label: 'c', outcomes: [{ kind: 'randomCard' }] }])] });
    w.rewardPool = [];
    const map = chainMap(['event', 'combat']);
    map.nodes[0].eventId = 'ev2';
    const r = new RunState(map, STARTER, w, new Rng(1));
    go(r);
    expect(r.chooseEventOption(0).lines).toEqual(['Nothing to take.']);
    expect(r.deck).toHaveLength(STARTER.length);
  });

  it('relic outcome grants a relic not already owned, once, without a duplicate notice line', () => {
    const a = relic('a', { onPickup: [{ kind: 'maxHp', value: 5 }] });
    const b = relic('b');
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'relic' }] }], { relics: [a, b] });
    r.relics = [a];
    const { lines } = r.chooseEventOption(0);
    expect(r.relics.map((x) => x.id)).toEqual(['a', 'b']);
    expect(lines).toEqual(['Gained b.']);
    expect(r.takeNotice()).toEqual([]);
  });

  it('relic outcome with every relic owned gives nothing', () => {
    const a = relic('a');
    const r = atEvent([{ label: 'x', outcomes: [{ kind: 'relic' }] }], { relics: [a] });
    r.relics = [a];
    expect(r.chooseEventOption(0).lines).toEqual(['No relic left to find.']);
    expect(r.relics).toHaveLength(1);
  });

  it('choosing finishes the event: back on the map, and the choice is logged', () => {
    const r = atEvent([{ label: 'Nothing', outcomes: [] }]);
    r.chooseEventOption(0);
    expect(r.phase).toBe('map');
    expect(r.history.at(-1)).toEqual({ kind: 'event', floor: 1, eventId: 'ev2', choice: 'Nothing' });
  });

  it('rejects a choice that does not exist, without logging', () => {
    const r = atEvent([{ label: 'x', outcomes: [] }]);
    expect(() => r.chooseEventOption(3)).toThrow();
    expect(() => r.chooseEventOption(-1)).toThrow();
    expect(r.history).toHaveLength(0);
    expect(r.phase).toBe('inNode');
  });

  it('event accessor is only valid at an event', () => {
    const r = run(['combat', 'event']);
    go(r);
    expect(() => r.event).toThrow();
  });
});

describe('RunState event fights', () => {
  const fightChoice: EventDefinition['choices'] = [
    {
      label: 'f',
      outcomes: [
        { kind: 'gold', value: 5 },
        { kind: 'fight', enemies: ['foe', 'foe'] },
        { kind: 'gold', value: 20 },
        { kind: 'hp', value: -3 },
      ],
    },
  ];

  it('applies outcomes before the fight now, and holds the ones after it', () => {
    const r = atEvent(fightChoice);
    const { lines, fighting } = r.chooseEventOption(0);
    expect(fighting).toBe(true);
    expect(lines).toEqual(['Gained 5 gold.']);
    expect(r.gold).toBe(5);
    expect(r.phase).toBe('inNode');
    expect(r.eventFight?.after).toHaveLength(2);
  });

  it('while fighting, the stop is a normal-tier combat vs the listed enemies', () => {
    const r = atEvent(fightChoice);
    r.chooseEventOption(0);
    const node = r.currentNode;
    expect(node.kind).toBe('combat');
    if (node.kind === 'combat') {
      expect(node.tier).toBe('normal');
      expect(node.enemies.map((e) => e.id)).toEqual(['foe', 'foe']);
    }
  });

  it('winning applies the remaining outcomes, queues their lines as a notice, and gives NO card reward', () => {
    const r = atEvent(fightChoice);
    r.chooseEventOption(0);
    winFight(r, 30);
    expect(r.phase).toBe('map');
    expect(r.pendingReward).toBeNull();
    expect(r.gold).toBe(25);
    expect(r.hp).toBe(27);
    expect(r.eventFight).toBeNull();
    expect(r.takeNotice()).toEqual(['Gained 20 gold.', 'Lost 3 HP.']);
    expect(r.takeNotice()).toEqual([]); // read once
  });

  it('losing ends the run and skips the after-outcomes', () => {
    const r = atEvent(fightChoice);
    r.chooseEventOption(0);
    r.finishCombat('lost', 0, 2);
    expect(r.phase).toBe('lost');
    expect(r.gold).toBe(5);
    expect(r.history.at(-1)).toMatchObject({ kind: 'combat', result: 'lost', hpAfter: 0, tier: 'normal' });
  });

  it('a relic won after an event fight is granted once', () => {
    const a = relic('a');
    const r = atEvent([{ label: 'f', outcomes: [{ kind: 'fight', enemies: ['foe'] }, { kind: 'relic' }] }], { relics: [a] });
    r.chooseEventOption(0);
    winFight(r);
    expect(r.relics.map((x) => x.id)).toEqual(['a']);
    expect(r.takeNotice()).toEqual(['Gained a.']); // exactly one line, not two
  });

  it('is logged as the event choice, then the combat', () => {
    const r = atEvent(fightChoice);
    r.chooseEventOption(0);
    winFight(r);
    expect(r.history.map((h) => h.kind)).toEqual(['event', 'combat']);
  });
});

describe('RunState fight rewards', () => {
  it('normal win: REWARD_CARD_CHOICES distinct pool cards, REWARD_GOLD, no relic', () => {
    const r = run(['combat', 'combat'], { relics: [relic('a')] });
    go(r);
    winFight(r);
    expect(r.phase).toBe('reward');
    const offer = r.pendingReward!;
    expect(offer.cards).toHaveLength(Math.min(REWARD_CARD_CHOICES, POOL.length));
    expect(new Set(offer.cards).size).toBe(offer.cards.length);
    expect(offer.gold).toBe(REWARD_GOLD);
    expect(offer.relic).toBeUndefined();
  });

  it('elite win: elite gold plus a relic the player does not own', () => {
    const a = relic('a');
    const b = relic('b');
    const r = run(['elite', 'combat'], { relics: [a, b] });
    r.relics = [a];
    go(r);
    winFight(r);
    expect(r.pendingReward!.gold).toBe(ELITE_REWARD_GOLD);
    expect(r.pendingReward!.relic).toBe(b);
  });

  it('elite win with no relic left still offers cards and gold', () => {
    const r = run(['elite', 'combat']);
    go(r);
    winFight(r);
    expect(r.pendingReward!.relic).toBeUndefined();
    expect(r.pendingReward!.gold).toBe(ELITE_REWARD_GOLD);
  });

  it('the elite relic comes with the card choice AND with the gold choice', () => {
    for (const choice of ['card', 'gold'] as const) {
      const a = relic('a', { onPickup: [{ kind: 'gold', value: 1 }] });
      const r = run(['elite', 'combat'], { relics: [a] });
      go(r);
      winFight(r);
      if (choice === 'card') r.takeRewardCard(0);
      else r.takeRewardGold();
      expect(r.relics.map((x) => x.id)).toEqual(['a']);
      expect(r.takeNotice()).toEqual(['Gained a.']);
      expect(r.history.at(-1)).toMatchObject({ kind: 'reward', choice, relicId: 'a' });
    }
  });

  it('taking a card adds only that card and no gold; taking gold adds gold and no card', () => {
    const r = run(['combat', 'combat', 'combat']);
    go(r);
    winFight(r);
    const pick = r.pendingReward!.cards[1];
    r.takeRewardCard(1);
    expect(r.deck.at(-1)).toBe(pick);
    expect(r.gold).toBe(0);
    expect(r.phase).toBe('map');
    go(r);
    winFight(r);
    r.takeRewardGold();
    expect(r.deck).toHaveLength(STARTER.length + 1);
    expect(r.gold).toBe(REWARD_GOLD);
  });

  it('a reward can only be taken once and only while pending; bad indexes throw', () => {
    const r = run(['combat', 'combat']);
    go(r);
    expect(() => r.takeRewardGold()).toThrow();
    winFight(r);
    expect(() => r.takeRewardCard(99)).toThrow();
    expect(() => r.takeRewardCard(-1)).toThrow();
    r.takeRewardGold();
    expect(() => r.takeRewardGold()).toThrow();
    expect(() => r.takeRewardCard(0)).toThrow();
  });

  it('a reward screen blocks picking the next stop until resolved', () => {
    const r = run(['combat', 'combat']);
    go(r);
    winFight(r);
    expect(r.mapChoices).toEqual([]);
    expect(() => r.chooseNode('1-0')).toThrow();
  });

  it('reward cards always come from the reward pool', () => {
    const r = run(['combat', 'combat', 'combat', 'combat', 'combat']);
    for (let i = 0; i < 4; i++) {
      go(r);
      winFight(r);
      for (const c of r.pendingReward!.cards) expect(POOL).toContain(c);
      r.takeRewardGold();
    }
  });
});

describe('RunState finishing fights', () => {
  it('clamps reported HP into [0, maxHp] and logs tier, enemies, turns', () => {
    const r = run(['elite', 'combat']);
    go(r);
    r.finishCombat('won', 9999, 8);
    expect(r.hp).toBe(r.maxHp);
    expect(r.history[0]).toEqual({ kind: 'combat', floor: 1, tier: 'elite', enemies: ['foe'], result: 'won', turns: 8, hpAfter: r.maxHp });
    const r2 = run(['combat']);
    go(r2);
    r2.finishCombat('lost', -5);
    expect(r2.hp).toBe(0);
  });

  it('finishCombat is refused away from a fight', () => {
    const r = run(['rest', 'combat']);
    go(r);
    expect(() => r.finishCombat('won', 10)).toThrow();
    const m = run(['combat']);
    expect(() => m.finishCombat('won', 10)).toThrow();
  });

  it('a lost fight ends the run: no victory relics, no reward, no map choices', () => {
    const heal = relic('heal', { onVictory: [{ kind: 'heal', value: 10 }] });
    const r = run(['combat', 'combat'], { relics: [heal] });
    r.relics = [heal];
    go(r);
    r.finishCombat('lost', 3);
    expect(r.phase).toBe('lost');
    expect(r.hp).toBe(3);
    expect(r.pendingReward).toBeNull();
    expect(r.mapChoices).toEqual([]);
    expect(() => r.chooseNode('1-0')).toThrow();
  });

  it('beating the boss wins the act with no reward', () => {
    const r = run(['combat', 'boss']);
    go(r);
    winFight(r);
    r.takeRewardGold();
    go(r);
    winFight(r);
    expect(r.phase).toBe('won');
    expect(r.pendingReward).toBeNull();
    expect(r.mapChoices).toEqual([]);
    expect(() => r.chooseNode('1-0')).toThrow();
    expect(r.history.at(-1)).toMatchObject({ tier: 'boss', result: 'won' });
  });

  it('chooseNode refuses unreachable ids and double moves', () => {
    const r = run(['combat', 'combat', 'combat']);
    expect(() => r.chooseNode('2-0')).toThrow();
    expect(() => r.chooseNode('nope')).toThrow();
    go(r);
    expect(() => r.chooseNode('1-0')).toThrow(); // still inside a stop
  });

  it('mapNode and currentNode throw before the first stop', () => {
    const r = run(['combat']);
    expect(() => r.mapNode).toThrow();
    expect(() => r.currentNode).toThrow();
  });

  it('rejects an empty map', () => {
    expect(() => new RunState({ lanes: 1, floors: 0, nodes: [] }, STARTER, world())).toThrow();
  });
});

describe('relic hooks in the run', () => {
  it('onPickup: max HP raises both max and current by the amount', () => {
    const r = run(['combat']);
    r.hp = 30;
    r.grantRelic(relic('a', { onPickup: [{ kind: 'maxHp', value: 10 }] }));
    expect(r.maxHp).toBe(PLAYER_MAX_HP + 10);
    expect(r.hp).toBe(40);
  });

  it('onPickup: heal is capped at max; gold is added', () => {
    const r = run(['combat']);
    r.hp = PLAYER_MAX_HP - 1;
    r.grantRelic(relic('a', { onPickup: [{ kind: 'heal', value: 50 }, { kind: 'gold', value: 12 }] }));
    expect(r.hp).toBe(PLAYER_MAX_HP);
    expect(r.gold).toBe(12);
  });

  it('onPickup: a negative gold effect cannot push gold below 0', () => {
    const r = run(['combat']);
    r.gold = 5;
    r.grantRelic(relic('a', { onPickup: [{ kind: 'gold', value: -20 }] }));
    expect(r.gold).toBe(0);
  });

  it('onPickup: a negative max HP effect lowers max and trims HP, never below 1', () => {
    const r = run(['combat']);
    r.grantRelic(relic('a', { onPickup: [{ kind: 'maxHp', value: -20 }] }));
    expect(r.maxHp).toBe(PLAYER_MAX_HP - 20);
    expect(r.hp).toBe(PLAYER_MAX_HP - 20);
    r.grantRelic(relic('b', { onPickup: [{ kind: 'maxHp', value: -1000 }] }));
    expect(r.maxHp).toBe(1);
    expect(r.hp).toBe(1);
  });

  it('grantRelic records the relic and a notice line, in order', () => {
    const r = run(['combat']);
    r.grantRelic(relic('a'));
    r.grantRelic(relic('b'));
    expect(r.relics.map((x) => x.id)).toEqual(['a', 'b']);
    expect(r.takeNotice()).toEqual(['Gained a.', 'Gained b.']);
  });

  it('onVictory fires for every relic after each normal, elite, and boss win, and heals only up to max', () => {
    const heal = relic('heal', { onVictory: [{ kind: 'heal', value: 4 }] });
    const gold = relic('gold', { onVictory: [{ kind: 'gold', value: 3 }] });
    const r = run(['combat', 'elite', 'boss'], { relics: [heal, gold] });
    r.relics = [heal, gold];
    go(r);
    r.finishCombat('won', 10);
    expect(r.hp).toBe(14);
    expect(r.gold).toBe(3);
    r.takeRewardGold();
    expect(r.gold).toBe(3 + REWARD_GOLD);
    go(r);
    r.finishCombat('won', r.maxHp - 1);
    expect(r.hp).toBe(r.maxHp);
    expect(r.gold).toBe(3 + REWARD_GOLD + 3); // fired on the elite win too
    r.takeRewardGold();
    go(r);
    const goldBefore = r.gold;
    r.finishCombat('won', 20);
    expect(r.phase).toBe('won');
    expect(r.gold).toBe(goldBefore + 3); // and on the boss win
  });

  it('a relic gained from this very fight does not fire its onVictory for it', () => {
    // the elite relic is only granted when the reward is taken, after victory effects ran
    const gold = relic('gold', { onVictory: [{ kind: 'gold', value: 100 }] });
    const r = run(['elite', 'combat'], { relics: [gold] });
    go(r);
    winFight(r);
    expect(r.gold).toBe(0);
    r.takeRewardCard(0);
    expect(r.gold).toBe(0);
  });

  it('rollRelic never offers an owned relic, and is null when the pool is spent', () => {
    const a = relic('a');
    const b = relic('b');
    const r = run(['combat'], { relics: [a, b] });
    for (let i = 0; i < 20; i++) expect(r.rollRelic()).not.toBeNull();
    r.relics = [a];
    for (let i = 0; i < 20; i++) expect(r.rollRelic()).toBe(b);
    r.relics = [a, b];
    expect(r.rollRelic()).toBeNull();
  });
});

describe('dev tools on RunState', () => {
  it('jumpTo drops pending state; unknown stop throws', () => {
    const r = run(['combat', 'shop', 'combat']);
    go(r);
    winFight(r);
    r.jumpTo('1-0');
    expect(r.phase).toBe('inNode');
    expect(r.pendingReward).toBeNull();
    expect(r.visited).toContain('1-0');
    expect(() => r.jumpTo('nope')).toThrow();
  });

  it('startFight swaps the current stop for a rewardless fight', () => {
    const r = run(['rest', 'combat']);
    r.startFight(['foe']);
    expect(r.position).toBe('0-0');
    expect(r.currentNode.kind).toBe('combat');
    r.finishCombat('won', 40);
    expect(r.pendingReward).toBeNull();
    expect(r.phase).toBe('map');
  });
});
