import { describe, expect, it } from 'vitest';
import { parseSavedRun, restoreRun } from './save';
import { RUN_WORLD, newRun } from '../data/run';

const saved = (setup: (s: Record<string, any>) => void): unknown => {
  const s = JSON.parse(JSON.stringify(newRun(11).toSaved()));
  setup(s);
  return s;
};
const refused = (setup: (s: Record<string, any>) => void): void => {
  expect(parseSavedRun(saved(setup))).toBeNull();
  expect(restoreRun(saved(setup), RUN_WORLD)).toBeNull();
};
const inNode = (s: Record<string, any>): void => {
  s.position = s.map.nodes[0].id;
  s.visited = [s.position];
  s.phase = 'inNode';
};

describe('parseSavedRun: cross-field rules', () => {
  it('refuses a fight stop with no enemies and an event stop with no event id', () => {
    refused((s) => (s.map.nodes.find((n: any) => n.kind === 'combat').enemies = []));
    refused((s) => delete s.map.nodes.find((n: any) => n.kind === 'combat').enemies);
    refused((s) => delete s.map.nodes.find((n: any) => n.kind === 'event').eventId);
  });

  it('refuses nodes outside the map, duplicate ids, links that do not go up, and an unvisited position', () => {
    refused((s) => (s.map.nodes[0].lane = s.map.lanes));
    refused((s) => (s.map.nodes[0].floor = s.map.floors));
    refused((s) => s.map.nodes.push({ ...s.map.nodes[0] }));
    refused((s) => (s.map.nodes[0].next = [s.map.nodes[0].id]));
    refused((s) => (inNode(s), (s.visited = [])));
  });

  it('refuses a pending reward outside the reward phase, a reward phase without one, and a negative hp', () => {
    refused((s) => (s.pendingReward = { cards: [], gold: 1, relic: null }));
    refused((s) => (inNode(s), (s.phase = 'reward')));
    refused((s) => (s.hp = -1));
    refused((s) => (s.hp = s.maxHp + 1));
  });

  it('refuses event-fight outcomes that are not real outcomes', () => {
    const at = (s: Record<string, any>, after: unknown[]): void => {
      inNode(s);
      s.eventFight = { enemies: ['enemy-a'], after };
    };
    const bads = [null, 5, {}, { kind: 'nope' }, { kind: 'gold' }, { kind: 'gold', value: 'x' }, { kind: 'hp', value: 1.5 }, { kind: 'card' }, { kind: 'fight', enemies: [] }];
    for (const bad of bads) refused((s) => at(s, [bad]));
    refused((s) => (at(s, []), (s.eventFight.enemies = [])));
    refused((s) => (at(s, []), (s.phase = 'map')));
    expect(restoreRun(saved((s) => at(s, [{ kind: 'card', cardId: 'no-such-card' }])), RUN_WORLD)).toBeNull(); // shape is fine, content is not
  });

  it('accepts every real outcome kind in an event fight', () => {
    const raw = saved((s) => {
      inNode(s);
      s.eventFight = {
        enemies: ['enemy-a'],
        after: [{ kind: 'gold', value: -5 }, { kind: 'hp', value: 3 }, { kind: 'maxHp', value: 2 }, { kind: 'randomCard' }, { kind: 'relic' }],
      };
    });
    expect(restoreRun(raw, RUN_WORLD)).not.toBeNull();
  });

  it('refuses malformed history entries and accepts a well-formed one', () => {
    refused((s) => (s.history = [null]));
    refused((s) => (s.history = [{ kind: 'nope', floor: 1 }]));
    refused((s) => (s.history = [{ kind: 'event', floor: 1, eventId: 3, choice: 'x' }]));
    expect(parseSavedRun(saved((s) => (s.history = [{ kind: 'shop', floor: 2, bought: ['a'], goldSpent: 5 }])))).not.toBeNull();
  });
});
