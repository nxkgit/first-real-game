import { describe, expect, it } from 'vitest';
import * as T from './tunables';
import { CARDS, MAGE, baseCards, buildStarterDeck, getCard, rewardPoolFor, upgradedVersion } from './cards';
import { ENEMIES, getEnemy } from './enemies';
import { EVENTS, getEvent } from './events';
import { RELICS, RELIC_POOL, getRelic } from './relics';
import { STATUSES, STATUS_ORDER } from './statuses';
import { ACT_CONTENT, RUN_WORLD, newRun } from './run';
import { generateActMap } from '../game/actMap';
import { Rng } from '../game/rng';
import type { Effect } from '../game/types';

const effectsOf = (c: { effects?: Effect[]; onTurnStartEffect?: Effect }): Effect[] => [
  ...(c.effects ?? []),
  ...(c.onTurnStartEffect ? [c.onTurnStartEffect] : []),
];

describe('tunables sanity', () => {
  // TEMPERATURE_MIN is the lower bound of a signed range (Mage's Temperature mechanic); it is
  // meant to be negative.
  const SIGNED_TUNABLES = ['TEMPERATURE_MIN'];

  it('every numeric tunable is a finite number, non-negative unless signed on purpose', () => {
    for (const [name, value] of Object.entries(T)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value), name).toBe(true);
        if (!SIGNED_TUNABLES.includes(name)) expect(value, name).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('counts that must be at least one are positive integers', () => {
    for (const [name, v] of Object.entries({
      MAX_ENERGY: T.MAX_ENERGY,
      HAND_SIZE: T.HAND_SIZE,
      PLAYER_MAX_HP: T.PLAYER_MAX_HP,
      REWARD_CARD_CHOICES: T.REWARD_CARD_CHOICES,
      SHOP_CARD_COUNT: T.SHOP_CARD_COUNT,
      MAP_LANES: T.MAP_LANES,
      MAP_FLOORS: T.MAP_FLOORS,
      MAP_PATHS: T.MAP_PATHS,
    })) {
      expect(Number.isInteger(v), name).toBe(true);
      expect(v, name).toBeGreaterThanOrEqual(1);
    }
  });

  it('fractions and multipliers make sense', () => {
    expect(T.REST_HEAL_FRACTION).toBeGreaterThan(0);
    expect(T.REST_HEAL_FRACTION).toBeLessThanOrEqual(1);
    expect(T.WEAK_DAMAGE_MULT).toBeGreaterThan(0);
    expect(T.WEAK_DAMAGE_MULT).toBeLessThan(1);
    expect(T.VULNERABLE_DAMAGE_MULT).toBeGreaterThan(1);
  });

  it('a rest heals at least 1 HP, and elite gold is at least the normal gold (elites are the riskier fight)', () => {
    expect(Math.round(T.PLAYER_MAX_HP * T.REST_HEAL_FRACTION)).toBeGreaterThanOrEqual(1);
    expect(T.ELITE_REWARD_GOLD).toBeGreaterThanOrEqual(T.REWARD_GOLD);
  });

  it('map rules are consistent with the map size', () => {
    expect(T.MAP_EARLY_FLOORS).toBeLessThan(T.MAP_FLOORS);
    for (const [kind, floor] of Object.entries(T.MAP_FIRST_FLOOR)) {
      expect(floor, kind).toBeGreaterThanOrEqual(0);
      expect(floor, `${kind} must be able to appear before the boss floor`).toBeLessThan(T.MAP_FLOORS - 1);
    }
    const weights = Object.values(T.MAP_KIND_WEIGHTS);
    expect(weights.every((w) => w >= 0)).toBe(true);
    expect(weights.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(T.MAP_KIND_WEIGHTS.combat).toBeGreaterThan(0); // the first floor is all fights
  });

  it('the starting hand fits the economy: the starter deck is at least a hand big, and the player can afford a card cost', () => {
    expect(buildStarterDeck().length).toBeGreaterThanOrEqual(T.HAND_SIZE);
    expect(Math.min(...buildStarterDeck().map((c) => c.cost))).toBeLessThanOrEqual(T.MAX_ENERGY);
  });

  it('the shop price is reachable: a few normal rewards of gold buy a card', () => {
    expect(T.SHOP_CARD_PRICE).toBeGreaterThan(0);
    expect(T.SHOP_CARD_PRICE).toBeLessThanOrEqual(T.REWARD_GOLD * T.MAP_FLOORS);
  });
});

describe('cards registry and upgrades', () => {
  it('registry ids match their keys, and getCard finds every one', () => {
    for (const [id, card] of Object.entries(CARDS)) {
      expect(card.id).toBe(id);
      expect(getCard(id)).toBe(card);
    }
  });

  it('getCard throws on an unknown id', () => {
    expect(() => getCard('definitely-not-a-card')).toThrow();
  });

  it('every card with an upgrade block has a registered "+" version that really differs and upgrades nothing further', () => {
    for (const base of baseCards()) {
      const up = upgradedVersion(base);
      if (!base.upgrade) {
        expect(up, base.id).toBeUndefined();
        continue;
      }
      expect(up, base.id).toBeDefined();
      expect(up!.id).toBe(`${base.id}+`);
      expect(up!.name).toBe(`${base.name}+`);
      expect(up!.upgradeOf).toBe(base.id);
      expect(up!.upgrade).toBeUndefined(); // can't be upgraded twice
      expect(upgradedVersion(up!)).toBeUndefined();
      expect(up!.inRewardPool).toBe(false);
      // identity that must not change by upgrading
      expect(up!.type).toBe(base.type);
      expect(up!.owner).toBe(base.owner);
      expect(up!.target).toBe(base.target);
      // and something must actually be better
      const changed =
        up!.cost !== base.cost ||
        JSON.stringify(up!.effects) !== JSON.stringify(base.effects) ||
        JSON.stringify(up!.onTurnStartEffect) !== JSON.stringify(base.onTurnStartEffect) ||
        JSON.stringify(up!.triggers) !== JSON.stringify(base.triggers) ||
        up!.exhaust !== base.exhaust;
      expect(changed, `${base.id}+ is identical to ${base.id}`).toBe(true);
    }
  });

  it('upgrades are never worse: cost not higher, and each effect value not lower, same shape', () => {
    for (const base of baseCards()) {
      const up = upgradedVersion(base);
      if (!up) continue;
      expect(up.cost, base.id).toBeLessThanOrEqual(base.cost);
      const a = effectsOf(base);
      const b = effectsOf(up);
      expect(b.map((e) => e.kind), base.id).toEqual(a.map((e) => e.kind));
      b.forEach((e, i) => { if ('value' in e && 'value' in a[i]) expect(e.value, base.id).toBeGreaterThanOrEqual(a[i].value); });
    }
  });


  it('upgraded cards keep their effects declared consistently: aimed cards stay target "enemy" if any effect needs a target', () => {
    for (const card of Object.values(CARDS)) {
      const needsTarget = effectsOf(card).some((e) => e.kind === 'damage' || (e.kind === 'applyStatus' && e.to === 'target'));
      if (needsTarget && card.type !== 'power') expect(card.target, card.id).toBe('enemy');
    }
  });

  it('reward pool: only base, hero-or-neutral, inRewardPool cards; never an upgraded card; starter-only cards excluded', () => {
    const pool = rewardPoolFor(MAGE);
    expect(pool.length).toBeGreaterThanOrEqual(T.REWARD_CARD_CHOICES);
    for (const c of pool) {
      expect(c.inRewardPool).toBe(true);
      expect(c.upgradeOf).toBeUndefined();
      expect([MAGE, 'neutral']).toContain(c.owner);
    }
    expect(new Set(pool).size).toBe(pool.length);
    expect(pool.map((c) => c.id)).not.toContain('strike');
  });

  it('another hero gets none of the mage cards, only neutral ones', () => {
    for (const c of rewardPoolFor('someone-else')) expect(c.owner).toBe('neutral');
  });

  it('the starter deck is a fresh array each call of registered cards, and has every card type', () => {
    const a = buildStarterDeck();
    const b = buildStarterDeck();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
    for (const c of a) expect(CARDS[c.id]).toBe(c);
    expect(new Set(a.map((c) => c.type))).toEqual(new Set(['attack', 'skill', 'power']));
  });

  it('every card has a non-negative integer cost and positive effect values', () => {
    for (const c of Object.values(CARDS)) {
      expect(Number.isInteger(c.cost), c.id).toBe(true);
      expect(c.cost, c.id).toBeGreaterThanOrEqual(0);
      // a scaled effect may have a base of 0; adjustTemperature (Mage-only) is signed on purpose
      for (const e of effectsOf(c)) {
        if (e.kind !== 'adjustTemperature' && 'value' in e && !('scaling' in e && e.scaling)) expect(e.value, c.id).toBeGreaterThan(0);
      }
    }
  });

  it('power cards have something to do (an immediate effect or a turn-start effect)', () => {
    for (const c of Object.values(CARDS)) {
      if (c.type === 'power') expect(effectsOf(c).length + (c.triggers?.length ?? 0), c.id).toBeGreaterThan(0);
    }
  });
});

describe('enemies, relics, events, statuses', () => {
  it('enemy ids match keys; every enemy has HP and at least one move; getEnemy throws on unknown ids', () => {
    for (const [id, e] of Object.entries(ENEMIES)) {
      expect(e.id).toBe(id);
      expect(getEnemy(id)).toBe(e);
      expect(e.maxHp).toBeGreaterThan(0);
      expect(e.movePattern.length).toBeGreaterThan(0);
      for (const m of e.movePattern) {
        expect(m.effects.length, `${id}/${m.name}`).toBeGreaterThan(0);
      }
    }
    expect(() => getEnemy('nope')).toThrow();
  });

  it('enemy statuses that are applied to the player are debuffs (not strength)', () => {
    for (const e of Object.values(ENEMIES)) {
      for (const m of e.movePattern) {
        for (const eff of m.effects) {
          if (eff.kind === 'applyStatus' && eff.to === 'target') expect(eff.status, e.id).not.toBe('strength');
        }
      }
    }
  });

  it('relic ids match keys, the pool is the registry, and getRelic throws on unknown ids', () => {
    for (const [id, r] of Object.entries(RELICS)) {
      expect(r.id).toBe(id);
      expect(getRelic(id)).toBe(r);
      const hooks = [r.onPickup, r.onVictory, r.onCombatStart, r.onTurnStart, r.triggers].filter((h) => h && h.length);
      expect(hooks.length, id).toBeGreaterThan(0);
    }
    // the random-relic pool is a subset of the registry (some relics are kept out of it on purpose)
    for (const r of RELIC_POOL) expect(RELICS[r.id]).toBe(r);
    expect(() => getRelic('nope')).toThrow();
  });

  it('events: ids match keys, each has choices, and every outcome refers to real content', () => {
    for (const [id, ev] of Object.entries(EVENTS)) {
      expect(ev.id).toBe(id);
      expect(getEvent(id)).toBe(ev);
      expect(ev.choices.length).toBeGreaterThan(0);
      for (const choice of ev.choices) {
        expect(choice.label).not.toBe('');
        const fights = choice.outcomes.filter((o) => o.kind === 'fight');
        for (const o of choice.outcomes) {
          if (o.kind === 'card') expect(() => getCard(o.cardId)).not.toThrow();
          if (o.kind === 'fight') o.enemies.forEach((eid) => expect(() => getEnemy(eid)).not.toThrow());
        }
        expect(fights.length).toBeLessThanOrEqual(1);
      }
    }
    expect(() => getEvent('nope')).toThrow();
  });

  it('every event offers a way out that costs nothing, so the player is never forced to pay', () => {
    for (const ev of Object.values(EVENTS)) {
      expect(ev.choices.some((c) => c.outcomes.length === 0 || c.outcomes.every((o) => ('value' in o ? o.value >= 0 : true) && o.kind !== 'fight')), ev.id).toBe(true);
    }
  });

  it('statuses: ids match keys, ordering lists each exactly once, and hooks have the expected shapes', () => {
    for (const [id, s] of Object.entries(STATUSES)) {
      expect(s.id).toBe(id);
      expect(STATUS_ORDER).toContain(s.id);
      expect(s.describe(3)).toContain('3');
      expect(s.badge.symbol.length).toBeGreaterThan(0);
    }
    expect([...STATUS_ORDER].sort()).toEqual(Object.keys(STATUSES).sort());
    expect(STATUSES.weak.outgoingDamageMult!(1, { attacksPlayedThisTurn: 0 })).toBe(T.WEAK_DAMAGE_MULT);
    expect(STATUSES.vulnerable.incomingDamageMult!(1)).toBe(T.VULNERABLE_DAMAGE_MULT);
    expect(STATUSES.strength.outgoingDamageAdd!(4)).toBe(4);
    expect(STATUSES.weak.kind).toBe('duration');
    expect(STATUSES.vulnerable.kind).toBe('duration');
    expect(STATUSES.strength.kind).toBe('intensity');
  });

  it('status text states the percentage derived from the tunable', () => {
    expect(STATUSES.weak.describe(2)).toContain(`${Math.round((1 - T.WEAK_DAMAGE_MULT) * 100)}%`);
    expect(STATUSES.vulnerable.describe(2)).toContain(`${Math.round((T.VULNERABLE_DAMAGE_MULT - 1) * 100)}%`);
  });
});

describe('the act (data/run.ts)', () => {
  it('every enemy id and event id the act uses exists', () => {
    const lists = [ACT_CONTENT.earlyEncounters, ACT_CONTENT.encounters, ACT_CONTENT.lateEncounters ?? [], ACT_CONTENT.elites, ACT_CONTENT.bosses];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      for (const fight of list) {
        expect(fight.length).toBeGreaterThan(0);
        expect(fight.length).toBeLessThanOrEqual(3); // the screen lays out up to 3 enemies
        fight.forEach((id) => expect(() => getEnemy(id)).not.toThrow());
      }
    }
    for (const id of ACT_CONTENT.events) expect(() => getEvent(id)).not.toThrow();
  });

  it('RUN_WORLD looks content up consistently', () => {
    expect(RUN_WORLD.card('strike')).toBe(getCard('strike'));
    expect(RUN_WORLD.enemy('enemy-a')).toBe(getEnemy('enemy-a'));
    expect(RUN_WORLD.relicPool.length).toBeGreaterThan(0);
    expect(RUN_WORLD.rewardPool).toEqual(rewardPoolFor(MAGE));
  });

  it('the same seed gives the same run; different seeds give different maps', () => {
    expect(newRun(77).toSaved()).toEqual(newRun(77).toSaved());
    expect(JSON.stringify(newRun(1).map)).not.toBe(JSON.stringify(newRun(2).map));
  });

  it('a new run starts at full HP, no gold, no relics, on the map with floor-0 choices', () => {
    const r = newRun(3);
    expect(r.hp).toBe(T.PLAYER_MAX_HP);
    expect(r.gold).toBe(0);
    expect(r.relics).toEqual([]);
    expect(r.phase).toBe('map');
    expect(r.mapChoices.length).toBeGreaterThan(0);
    expect(r.mapChoices.every((n) => n.floor === 0 && n.kind === 'combat')).toBe(true);
    expect(r.totalFloors).toBe(T.MAP_FLOORS + 1);
  });

  it('across many seeds: the map ends in exactly one boss, every stop is reachable and leads on, and the rules about floors hold', () => {
    for (let seed = 0; seed < 60; seed++) {
      const map = generateActMap(new Rng(seed), ACT_CONTENT);
      const top = map.floors - 1;
      const byId = new Map(map.nodes.map((n) => [n.id, n]));
      const bosses = map.nodes.filter((n) => n.kind === 'boss');
      expect(bosses, `seed ${seed}`).toHaveLength(1);
      expect(bosses[0].floor).toBe(top);
      for (const n of map.nodes) {
        if (n.floor < top) expect(n.next.length, `${seed}:${n.id}`).toBeGreaterThan(0);
        for (const id of n.next) expect(byId.get(id)!.floor).toBe(n.floor + 1);
        if (n.kind === 'shop') expect(n.floor).toBeGreaterThanOrEqual(T.MAP_FIRST_FLOOR.shop);
        if (n.kind === 'elite') expect(n.floor).toBeGreaterThanOrEqual(T.MAP_FIRST_FLOOR.elite);
        if (n.floor === 0) expect(n.kind).toBe('combat');
        if (n.floor === top - 1) expect(n.kind).toBe('rest');
      }
      // every non-bottom node is reachable from some node below
      const reachable = new Set(map.nodes.filter((n) => n.floor === 0).map((n) => n.id));
      for (const n of map.nodes) for (const id of n.next) reachable.add(id);
      for (const n of map.nodes) expect(reachable.has(n.id), `${seed}:${n.id}`).toBe(true);
    }
  });
});
