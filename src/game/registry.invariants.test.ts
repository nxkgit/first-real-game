import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { RunState } from './RunState';
import { Rng } from './rng';
import { cardText, describeEffect, describeOutcome, relicText } from './describe';
import { chainMap } from './testHelpers';
import { checkCombatInvariants } from './invariantHarness';
import { CARDS, MAGE, buildStarterDeck, getCard, rewardPoolFor, upgradedVersion } from '../data/cards';
import { ENEMIES, getEnemy } from '../data/enemies';
import { EVENTS, getEvent } from '../data/events';
import { RELICS, RELIC_POOL, getRelic } from '../data/relics';
import { STATUSES } from '../data/statuses';
import { ACT_CONTENT, RUN_WORLD } from '../data/run';
import { REWARD_CARD_CHOICES } from '../data/tunables';
import type { CardDefinition, Effect, EnemyDefinition } from './types';

// Registry-wide property tests. Everything iterates the registries, so new content is covered
// the moment it is registered.

const cards = Object.values(CARDS);
const baseCards = cards.filter((c) => !c.upgradeOf);
const upgradedCards = cards.filter((c) => c.upgradeOf);
const enemies = Object.values(ENEMIES);
const relics = Object.values(RELICS);
const events = Object.values(EVENTS);

const nonEmpty = (s: unknown): boolean => typeof s === 'string' && s.trim().length > 0;
const CARD_TYPES = ['attack', 'skill', 'power'];

/** Every number anywhere inside a value (effects may grow nested/scaling shapes later). */
function numbersIn(value: unknown, path = ''): [string, number][] {
  if (typeof value === 'number') return [[path, value]];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => numbersIn(v, `${path}.${k}`));
  return [];
}

function effectProblems(effect: Effect): string[] {
  const problems: string[] = [];
  const e = effect as unknown as Record<string, unknown>;
  if (!e || typeof e !== 'object' || typeof e.kind !== 'string') return ['effect has no kind'];
  for (const [p, n] of numbersIn(effect)) if (!Number.isFinite(n)) problems.push(`${p} is not finite`);
  // a scaled effect may have a base of 0 (its whole value comes from the scaling); adjustTemperature
  // (Mage-only) is signed on purpose (frost cards cool down with a negative value).
  if (
    typeof e.value === 'number' &&
    e.kind !== 'adjustTemperature' &&
    (!Number.isInteger(e.value) || (e.value < 1 && !(e.value === 0 && e.scaling)))
  ) {
    problems.push(`value ${e.value} is not a positive integer`);
  }
  if (e.kind === 'adjustTemperature' && (!Number.isInteger(e.value) || e.value === 0)) problems.push(`value ${e.value} is not a nonzero integer`);
  if (e.kind === 'applyStatus') {
    if (!(e.status as string in STATUSES)) problems.push(`unknown status ${String(e.status)}`);
    if (e.to !== 'target' && e.to !== 'self') problems.push(`bad "to": ${String(e.to)}`);
  }
  let text: unknown;
  try {
    text = describeEffect(effect);
  } catch (err) {
    problems.push(`describeEffect throws: ${(err as Error).message}`);
  }
  if (!nonEmpty(text)) problems.push('describeEffect gives no text');
  return problems;
}

function cardProblems(card: CardDefinition): string[] {
  const p: string[] = [];
  if (!nonEmpty(card.id) || !nonEmpty(card.name) || !nonEmpty(card.owner)) p.push('id, name and owner must be non-empty');
  if (!CARD_TYPES.includes(card.type)) p.push(`type ${card.type}`);
  if (!Number.isInteger(card.cost) || card.cost < 0) p.push(`cost ${card.cost}`);
  if (typeof card.inRewardPool !== 'boolean') p.push('inRewardPool missing');
  if (card.target !== undefined && card.target !== 'enemy') p.push(`target ${String(card.target)}`);
  for (const e of card.effects ?? []) p.push(...effectProblems(e));
  if (card.onTurnStartEffect) p.push(...effectProblems(card.onTurnStartEffect));
  for (const t of card.triggers ?? []) for (const e of t.effects) p.push(...effectProblems(e));
  if (card.type === 'power' && !card.effects?.length && !card.onTurnStartEffect && !card.triggers?.length) p.push('a power that does nothing');
  if (card.type !== 'power' && card.onTurnStartEffect) p.push('only powers have onTurnStartEffect');
  if (!(card.effects?.length || card.onTurnStartEffect || card.triggers?.length || card.description)) p.push('does nothing');
  for (const [path, n] of numbersIn(card)) if (!Number.isFinite(n)) p.push(`${path} not finite`);
  return p;
}

const needsTarget = (e: Effect): boolean => e.kind === 'damage' || (e.kind === 'applyStatus' && e.to === 'target');

describe('ids and registries', () => {
  it('keys equal ids in every registry, and the content lists are not empty', () => {
    for (const [reg, name] of [[CARDS, 'cards'], [ENEMIES, 'enemies'], [RELICS, 'relics'], [EVENTS, 'events']] as const) {
      const entries = Object.entries(reg as Record<string, { id: string }>);
      expect(entries.length, name).toBeGreaterThan(0);
      for (const [key, def] of entries) expect(def.id, `${name} key ${key}`).toBe(key);
    }
  });

  it('card names are unique and the lookups round-trip', () => {
    const names = cards.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of cards) expect(getCard(c.id)).toBe(c);
    for (const e of enemies) expect(getEnemy(e.id)).toBe(e);
    for (const r of relics) expect(getRelic(r.id)).toBe(r);
    for (const e of events) expect(getEvent(e.id)).toBe(e);
    expect(() => getCard('no-such')).toThrow();
    expect(() => getEnemy('no-such')).toThrow();
    expect(() => getRelic('no-such')).toThrow();
    expect(() => getEvent('no-such')).toThrow();
  });
});

describe('cards', () => {
  it('are well formed', () => {
    for (const c of cards) expect(cardProblems(c), c.id).toEqual([]);
  });

  it('have generated, non-empty text', () => {
    for (const c of cards) {
      expect(nonEmpty(cardText(c)), `${c.id} text`).toBe(true);
      expect(cardText(c)).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('upgrades: upgradeOf points at a real base, the base has an upgrade block, and the pairs match up', () => {
    for (const up of upgradedCards) {
      const base = CARDS[up.upgradeOf!];
      expect(base, `${up.id}.upgradeOf`).toBeDefined();
      expect(up.id).toBe(`${base.id}+`);
      expect(base.upgrade, `${base.id} has an upgrade block`).toBeDefined();
      expect(upgradedVersion(base)).toBe(up);
      expect(up.upgrade, 'an upgraded card cannot be upgraded again').toBeUndefined();
      expect(up.inRewardPool).toBe(false);
      expect(up.type).toBe(base.type);
      expect(up.owner).toBe(base.owner);
      expect(up.target).toBe(base.target);
      expect(up.name).toBe(`${base.name}+`);
    }
    for (const base of baseCards) {
      if (base.upgrade) expect(CARDS[`${base.id}+`], `${base.id}+ is registered`).toBeDefined();
      else expect(CARDS[`${base.id}+`]).toBeUndefined();
      expect(base.upgradeOf).toBeUndefined();
    }
  });

  it('upgrade blocks change something', () => {
    for (const base of baseCards.filter((c) => c.upgrade)) {
      const up = CARDS[`${base.id}+`];
      const strip = (c: CardDefinition): string => JSON.stringify({ cost: c.cost, effects: c.effects, t: c.onTurnStartEffect, d: c.description, tr: c.triggers, ex: c.exhaust, tg: c.tags });
      expect(strip(up), `${base.id}: upgrade is identical to the base`).not.toBe(strip(base));
    }
  });

  it('aimed cards declare target "enemy" exactly when an effect needs a target', () => {
    for (const c of cards) {
      const uses = (c.effects ?? []).some(needsTarget);
      if (uses) expect(c.target, `${c.id} hits a target but is not aimed`).toBe('enemy');
      else expect(c.target, `${c.id} is aimed but nothing uses the target`).toBeUndefined();
      // A power's onTurnStartEffect, unlike a relic's, is allowed to need a target: CombatState
      // auto-targets the first living enemy for it (see startPlayerTurn), e.g. Endless Winter.
    }
  });

  it('upgrades are never strictly worse than their base (where the effects line up to compare)', () => {
    const skipped: string[] = [];
    const DEBUFFS = ['weak', 'vulnerable'];
    for (const base of baseCards.filter((c) => c.upgrade)) {
      const up = CARDS[`${base.id}+`];
      expect(up.cost, `${base.id}: upgrade costs more`).toBeLessThanOrEqual(base.cost);
      const pairs: [Effect, Effect][] = [];
      const be = base.effects ?? [];
      const ue = up.effects ?? [];
      let comparable = ue.length >= be.length && be.every((e, i) => e.kind === ue[i].kind);
      if (comparable) be.forEach((e, i) => pairs.push([e, ue[i]]));
      if (base.onTurnStartEffect || up.onTurnStartEffect) {
        if (base.onTurnStartEffect && up.onTurnStartEffect && base.onTurnStartEffect.kind === up.onTurnStartEffect.kind) pairs.push([base.onTurnStartEffect, up.onTurnStartEffect]);
        else comparable = false;
      }
      if (!comparable) {
        skipped.push(`${base.id}: effect lists differ in shape`);
        continue;
      }
      for (const [b, u] of pairs) {
        const bn = numbersIn(b);
        const un = numbersIn(u);
        if (bn.length !== un.length || bn.some(([p], i) => p !== un[i][0])) {
          skipped.push(`${base.id}: effect shape differs`);
          continue;
        }
        const lowerIsBetter = b.kind === 'applyStatus' && b.to === 'self' && DEBUFFS.includes(b.status);
        bn.forEach(([path, v], i) => {
          const w = un[i][1];
          if (lowerIsBetter) expect(w, `${base.id}${path}`).toBeLessThanOrEqual(v);
          else expect(w, `${base.id}${path}`).toBeGreaterThanOrEqual(v);
        });
      }
    }
    // not asserted, but visible if a card ever stops being comparable
    expect(skipped.length).toBeLessThan(baseCards.length);
  });

  it('the starter deck and the reward pool only hold registered, sensible cards', () => {
    for (const c of buildStarterDeck()) expect(CARDS[c.id]).toBe(c);
    const pool = rewardPoolFor(MAGE);
    expect(pool.length).toBeGreaterThanOrEqual(REWARD_CARD_CHOICES);
    for (const c of pool) {
      expect(CARDS[c.id]).toBe(c);
      expect(c.inRewardPool).toBe(true);
      expect(c.upgradeOf).toBeUndefined();
    }
    expect(RUN_WORLD.rewardPool.length).toBe(pool.length);
    // every card flagged for the reward pool and owned by the hero or neutral is in it
    for (const c of baseCards) if (c.inRewardPool && (c.owner === MAGE || c.owner === 'neutral')) expect(pool).toContain(c);
  });

  it('every card is playable in a smoke fight, aimed at an enemy when it needs one', () => {
    const dummy: EnemyDefinition = { id: 'dummy', name: 'Dummy', maxHp: 100000, movePattern: [{ name: 'Poke', effects: [{ kind: 'damage', value: 1 }] }] };
    for (const def of cards) {
      const rng = new Rng(3);
      const combat = new CombatState([def, def, def, def, def, def], [dummy], { random: () => rng.next() });
      combat.maxEnergy = 50; // some cards cost more than a turn's energy: the smoke test is about effects, not affordability
      combat.start();
      const target = def.target ? 'enemy-0' : undefined;
      const inHand = combat.deck.hand.find((c) => c.definition === def);
      expect(inHand, `${def.id} drawn`).toBeDefined();
      expect(combat.playCard(inHand!.instanceId, target), `${def.id} playCard`).toBe(true);
      checkCombatInvariants(combat, 6 + combat.stats.cardsAddedThisCombat);
      for (let t = 0; t < 4 && combat.phase === 'playerTurn'; t++) {
        combat.endPlayerTurn();
        checkCombatInvariants(combat, 6 + combat.stats.cardsAddedThisCombat);
      }
      if (def.target) {
        // and an aimed card without a target is refused
        const again = combat.deck.hand.find((c) => c.definition === def);
        if (again) expect(combat.playCard(again.instanceId, undefined)).toBe(false);
      }
    }
  });
});

describe('enemies', () => {
  it('are well formed with a non-empty, valid move pattern', () => {
    for (const e of enemies) {
      expect(nonEmpty(e.name), `${e.id} name`).toBe(true);
      expect(Number.isInteger(e.maxHp) && e.maxHp > 0, `${e.id} maxHp`).toBe(true);
      expect(e.movePattern.length, `${e.id} pattern`).toBeGreaterThan(0);
      for (const move of e.movePattern) {
        expect(nonEmpty(move.name), `${e.id} move name`).toBe(true);
        expect(move.effects.length, `${e.id}/${move.name} effects`).toBeGreaterThan(0);
        for (const eff of move.effects) expect(effectProblems(eff), `${e.id}/${move.name}`).toEqual([]);
      }
      if (e.placeholderScale !== undefined) expect(e.placeholderScale).toBeGreaterThan(0);
    }
  });

  it('every move of every enemy actually does something observable when it is made', () => {
    const idle: CardDefinition = { id: 'idle', name: 'Idle', type: 'skill', cost: 1, owner: 't', inRewardPool: false, effects: [{ kind: 'block', value: 1 }] };
    for (const enemy of enemies) {
      const rng = new Rng(1);
      const combat = new CombatState([idle], [enemy], { player: { hp: 100000, maxHp: 100000 }, random: () => rng.next() });
      let observed = false;
      combat.on('enemyMoveResolved', (e) => {
        if ((e.damage?.amount ?? 0) > 0 || (e.blockGained ?? 0) > 0) observed = true;
      });
      combat.on('statusChanged', (e) => {
        if (e.delta > 0) observed = true;
      });
      combat.start();
      for (let i = 0; i < enemy.movePattern.length * 2; i++) {
        observed = false;
        const move = combat.nextMove(combat.enemies[0]);
        expect(combat.intentDamage(combat.enemies[0]) !== undefined, `${enemy.id}/${move.name} intent`).toBe(move.effects.some((e) => e.kind === 'damage'));
        combat.endPlayerTurn();
        expect(observed, `${enemy.id}/${move.name} did nothing`).toBe(true);
      }
    }
  });
});

describe('relics', () => {
  it('are well formed, have text, and do something', () => {
    for (const r of relics) {
      expect(nonEmpty(r.name), r.id).toBe(true);
      expect(nonEmpty(relicText(r)), `${r.id} text`).toBe(true);
      const hooks = [r.onPickup, r.onVictory, r.onCombatStart, r.onTurnStart, r.triggers].filter((h) => h && h.length > 0);
      expect(hooks.length, `${r.id} does nothing`).toBeGreaterThan(0);
      for (const eff of [...(r.onPickup ?? []), ...(r.onVictory ?? [])]) {
        expect(['maxHp', 'heal', 'gold']).toContain(eff.kind);
        expect(Number.isInteger(eff.value), `${r.id} run effect`).toBe(true);
      }
      for (const eff of [...(r.onCombatStart ?? []), ...(r.onTurnStart ?? [])]) {
        expect(effectProblems(eff), r.id).toEqual([]);
        expect(needsTarget(eff), `${r.id}: a relic has no target to aim at`).toBe(false);
      }
    }
  });

  it('the relic pool only holds registered relics, with no duplicates', () => {
    expect(RELIC_POOL.length).toBeGreaterThan(0);
    expect(new Set(RELIC_POOL).size).toBe(RELIC_POOL.length);
    for (const r of RELIC_POOL) expect(RELICS[r.id]).toBe(r);
  });
});

describe('events', () => {
  it('are well formed and every outcome refers to things that exist', () => {
    for (const ev of events) {
      expect(nonEmpty(ev.title) && nonEmpty(ev.text), ev.id).toBe(true);
      expect(ev.choices.length, `${ev.id} choices`).toBeGreaterThan(0);
      const labels = ev.choices.map((c) => c.label);
      expect(new Set(labels).size, `${ev.id} labels unique`).toBe(labels.length);
      for (const choice of ev.choices) {
        expect(nonEmpty(choice.label), ev.id).toBe(true);
        expect(choice.outcomes.filter((o) => o.kind === 'fight').length, `${ev.id}/${choice.label}: at most one fight`).toBeLessThanOrEqual(1);
        for (const o of choice.outcomes) {
          expect(nonEmpty(describeOutcome(o)), `${ev.id} outcome text`).toBe(true);
          for (const [p, n] of numbersIn(o)) expect(Number.isFinite(n), `${ev.id}${p}`).toBe(true);
          if (o.kind === 'card') expect(CARDS[o.cardId], `${ev.id} card ${o.cardId}`).toBeDefined();
          if (o.kind === 'fight') {
            expect(o.enemies.length).toBeGreaterThan(0);
            for (const id of o.enemies) expect(ENEMIES[id], `${ev.id} enemy ${id}`).toBeDefined();
          }
        }
      }
    }
  });

  it('every choice of every event can be taken from a bad state (0 gold, 1 HP) and leaves the run sane', () => {
    for (const ev of events) {
      ev.choices.forEach((choice, index) => {
        for (const [gold, hp] of [[0, 1], [500, 60]]) {
          const map = chainMap(['event', 'boss']);
          map.nodes[0].eventId = ev.id;
          map.nodes[1].enemies = ['enemy-a'];
          const run = new RunState(map, buildStarterDeck(), RUN_WORLD, new Rng(5));
          run.gold = gold;
          run.hp = hp;
          run.chooseNode('0-0');
          const res = run.chooseEventOption(index);
          if (res.fighting) {
            expect(run.currentNode.kind).toBe('combat');
            run.finishCombat('won', 1, 3);
          }
          const where = `${ev.id}/${choice.label} (gold ${gold}, hp ${hp})`;
          expect(run.gold, where).toBeGreaterThanOrEqual(0);
          expect(run.hp, where).toBeGreaterThanOrEqual(1);
          expect(run.hp, where).toBeLessThanOrEqual(run.maxHp);
          expect(run.maxHp, where).toBeGreaterThanOrEqual(1);
          expect(run.phase, where).toBe('map');
          run.relics.forEach((r) => expect(RELICS[r.id]).toBe(r));
        }
      });
    }
  });
});

describe('the act content', () => {
  it('only names enemies and events that exist', () => {
    const lists = [ACT_CONTENT.earlyEncounters, ACT_CONTENT.encounters, ACT_CONTENT.lateEncounters ?? [], ACT_CONTENT.elites, ACT_CONTENT.bosses];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      for (const group of list) {
        expect(group.length).toBeGreaterThan(0);
        expect(group.length, 'the screen lays out up to 3 enemies').toBeLessThanOrEqual(3);
        for (const id of group) expect(ENEMIES[id], id).toBeDefined();
      }
    }
    expect(ACT_CONTENT.events.length).toBeGreaterThan(0);
    for (const id of ACT_CONTENT.events) expect(EVENTS[id], id).toBeDefined();
  });
});
