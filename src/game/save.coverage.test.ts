import { describe, expect, it } from 'vitest';
import { parseSavedRun, restoreRun } from './save';
import { RUN_WORLD, newRun, restoreSavedRun } from '../data/run';
import type { RunState } from './RunState';

// A real saved run, round-tripped through JSON like localStorage would.
function savedAt(setup: (r: RunState) => void = () => {}): Record<string, unknown> {
  const r = newRun(11);
  setup(r);
  return JSON.parse(JSON.stringify(r.toSaved()));
}
const mutate = (setup: (s: Record<string, any>) => void): unknown => {
  const s = savedAt();
  setup(s);
  return s;
};

describe('parseSavedRun / restoreRun', () => {
  it('accepts a fresh run, a run mid-stop, mid-reward, and mid-shop, and restores them identically', () => {
    const states: ((r: RunState) => void)[] = [
      () => {},
      (r) => r.chooseNode(r.mapChoices[0].id),
      (r) => {
        r.chooseNode(r.mapChoices[0].id);
        r.finishCombat('won', 30, 2);
      },
      (r) => {
        r.jumpTo(r.map.nodes.find((n) => n.kind === 'shop')?.id ?? r.map.nodes[0].id);
      },
    ];
    for (const setup of states) {
      const raw = savedAt(setup);
      expect(parseSavedRun(raw)).not.toBeNull();
      const restored = restoreRun(raw, RUN_WORLD)!;
      expect(restored).not.toBeNull();
      expect(JSON.parse(JSON.stringify(restored.toSaved()))).toEqual(raw);
    }
  });

  it('rejects things that are not objects at all, without throwing', () => {
    for (const bad of [null, undefined, 0, 'x', [], true, () => 1]) {
      expect(parseSavedRun(bad)).toBeNull();
      expect(restoreRun(bad, RUN_WORLD)).toBeNull();
    }
  });

  it('rejects an old or unknown version', () => {
    for (const v of [1, 3, '2', undefined, null]) expect(parseSavedRun(mutate((s) => (s.version = v)))).toBeNull();
  });

  it('rejects bad seed / rng position', () => {
    for (const v of [-1, 1.5, 4294967296, '5', NaN, null]) {
      expect(parseSavedRun(mutate((s) => (s.seed = v)))).toBeNull();
      expect(parseSavedRun(mutate((s) => (s.rngPosition = v)))).toBeNull();
    }
  });

  it('rejects numbers out of range: hp, maxHp, gold', () => {
    expect(parseSavedRun(mutate((s) => (s.hp = -1)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.hp = 1.5)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.maxHp = 0)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.gold = -5)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.gold = '5')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.hp = null)))).toBeNull();
  });

  it('accepts 0 HP (a lost run) and 0 gold', () => {
    expect(parseSavedRun(mutate((s) => ((s.hp = 0), (s.gold = 0))))).not.toBeNull();
  });

  it('rejects wrong types for lists', () => {
    for (const key of ['deck', 'relics', 'notice', 'visited']) {
      expect(parseSavedRun(mutate((s) => (s[key] = [1, 2])))).toBeNull();
      expect(parseSavedRun(mutate((s) => (s[key] = 'a')))).toBeNull();
      expect(parseSavedRun(mutate((s) => delete s[key]))).toBeNull();
    }
    expect(parseSavedRun(mutate((s) => (s.history = {})))).toBeNull();
    expect(parseSavedRun(mutate((s) => delete s.history))).toBeNull();
  });

  it('rejects an unknown phase, and phases that need a position when there is none', () => {
    expect(parseSavedRun(mutate((s) => (s.phase = 'dancing')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.phase = 'inNode')))).toBeNull(); // fresh run has position null
  });

  it('rejects a position or visited id that is not on the map', () => {
    expect(parseSavedRun(mutate((s) => ((s.position = 'nope'), (s.phase = 'inNode'))))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.visited = ['nope'])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.position = 5)))).toBeNull();
    expect(parseSavedRun(mutate((s) => delete s.position))).toBeNull();
  });

  it('rejects malformed maps', () => {
    expect(parseSavedRun(mutate((s) => (s.map = null)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes = [])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.lanes = 0)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.floors = 1000)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].kind = 'treasure')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].next = ['ghost'])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].next = 'x')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].floor = -1)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].enemies = [3])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0].eventId = 3)))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes[0] = 'x')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.map.nodes = 'x')))).toBeNull();
  });

  it('rejects malformed reward, shop, and event-fight blocks', () => {
    expect(parseSavedRun(mutate((s) => (s.pendingReward = 'x')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.pendingReward = { cards: [1], gold: 5, relic: null })))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.pendingReward = { cards: [], gold: -5, relic: null })))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.pendingReward = { cards: [], gold: 5, relic: 7 })))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.shop = 'x')))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.shop = [{ card: 'strike', price: 1 }])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.shop = [{ card: 'strike', price: -1, sold: false }])))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.eventFight = { enemies: 'x', after: [] })))).toBeNull();
    expect(parseSavedRun(mutate((s) => (s.eventFight = { enemies: [], after: 'x' })))).toBeNull();
    expect(parseSavedRun(mutate((s) => delete s.pendingReward))).toBeNull();
  });

  it('a structurally valid save that names content which does not exist restores to null, never throws', () => {
    expect(restoreRun(mutate((s) => (s.deck = ['no-such-card'])), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.relics = ['no-such-relic'])), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.map.nodes.find((n: any) => n.enemies).enemies = ['no-such-enemy'])), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.map.nodes.find((n: any) => n.kind === 'event').eventId = 'no-such-event')), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.eventFight = { enemies: ['no-such-enemy'], after: [] })), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.pendingReward = { cards: ['no-such-card'], gold: 1, relic: null })), RUN_WORLD)).toBeNull();
    expect(restoreRun(mutate((s) => (s.shop = [{ card: 'no-such-card', price: 1, sold: false }])), RUN_WORLD)).toBeNull();
  });

  it('restoreSavedRun (data layer) behaves the same as restoreRun with the real world', () => {
    expect(restoreSavedRun(savedAt())).not.toBeNull();
    expect(restoreSavedRun({})).toBeNull();
  });

  it('a restored run carries on with the same random stream as the original', () => {
    const original = newRun(21);
    const raw = JSON.parse(JSON.stringify(original.toSaved()));
    const copy = restoreRun(raw, RUN_WORLD)!;
    expect(copy.newCombatRng().next()).toBe(original.newCombatRng().next());
  });

  // FINDING (low severity, only reachable with a hand-edited or corrupt save): "a bad save is
  // discarded, never a crash" (HANDOFF.md), but a save in the reward phase with no pending reward,
  // or with hp above maxHp, is accepted. The first leaves the player on a reward screen with
  // nothing to take (takeReward* throw 'no reward is pending').
  it.fails('rejects a reward phase with no pending reward', () => {
    const raw = mutate((s) => {
      s.position = s.map.nodes[0].id;
      s.visited = [s.position];
      s.phase = 'reward';
      s.pendingReward = null;
    });
    expect(restoreRun(raw, RUN_WORLD)).toBeNull();
  });

  it.fails('rejects hp greater than maxHp', () => {
    expect(restoreRun(mutate((s) => (s.hp = s.maxHp + 50)), RUN_WORLD)).toBeNull();
  });
});
