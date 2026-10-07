import { describe, expect, it } from 'vitest';
import { generateActMap, DEFAULT_MAP_PARAMS } from './actMap';
import type { ActMap, MapContent } from './actMap';
import { Rng } from './rng';

const CONTENT: MapContent = {
  earlyEncounters: [['e1'], ['e2']],
  encounters: [['n1'], ['n2', 'n3']],
  elites: [['el1']],
  bosses: [['b1']],
  events: ['ev1', 'ev2', 'ev3'],
};

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const make = (seed: number): ActMap => generateActMap(new Rng(seed), CONTENT);

describe('act map generation', () => {
  it('is the same for the same seed and different for another', () => {
    expect(make(5)).toEqual(make(5));
    expect(make(5)).not.toEqual(make(6));
  });

  it('has the requested number of floors, ending in a single boss', () => {
    for (const seed of SEEDS) {
      const map = make(seed);
      expect(map.floors).toBe(DEFAULT_MAP_PARAMS.floors + 1);
      const top = map.nodes.filter((n) => n.floor === map.floors - 1);
      expect(top).toHaveLength(1);
      expect(top[0].kind).toBe('boss');
      expect(top[0].enemies).toEqual(['b1']);
      expect(map.nodes.filter((n) => n.kind === 'boss')).toHaveLength(1);
    }
  });

  it('every stop can be reached from the bottom and leads on, and the first floor has a real choice', () => {
    for (const seed of SEEDS) {
      const map = make(seed);
      const byId = new Map(map.nodes.map((n) => [n.id, n]));
      const bottom = map.nodes.filter((n) => n.floor === 0);
      expect(bottom.length).toBeGreaterThanOrEqual(2);

      const reached = new Set<string>();
      const walk = (id: string): void => {
        if (reached.has(id)) return;
        reached.add(id);
        byId.get(id)!.next.forEach(walk);
      };
      bottom.forEach((n) => walk(n.id));
      expect(reached.size).toBe(map.nodes.length);

      for (const node of map.nodes) {
        if (node.kind !== 'boss') expect(node.next.length).toBeGreaterThan(0);
        for (const id of node.next) {
          const target = byId.get(id)!;
          expect(target.floor).toBe(node.floor + 1);
          expect(Math.abs(target.lane - node.lane)).toBeLessThanOrEqual(node.kind === 'boss' ? 99 : 2);
        }
      }
    }
  });

  it('follows the floor rules for what kind of stop goes where', () => {
    for (const seed of SEEDS) {
      const map = make(seed);
      const byId = new Map(map.nodes.map((n) => [n.id, n]));
      const lastBeforeBoss = map.floors - 2;
      for (const node of map.nodes) {
        if (node.floor === 0) expect(node.kind).toBe('combat');
        if (node.floor === lastBeforeBoss) expect(node.kind).toBe('rest');
        if (node.kind === 'elite') expect(node.floor).toBeGreaterThanOrEqual(DEFAULT_MAP_PARAMS.firstFloor.elite!);
        if (node.kind === 'shop') expect(node.floor).toBeGreaterThanOrEqual(DEFAULT_MAP_PARAMS.firstFloor.shop!);
        if (node.kind === 'rest' && node.floor !== lastBeforeBoss) {
          expect(node.floor).toBeGreaterThanOrEqual(DEFAULT_MAP_PARAMS.firstFloor.rest!);
        }
        // elites, rests and shops never come twice in a row along a path
        if (node.kind === 'elite' || node.kind === 'rest' || node.kind === 'shop') {
          for (const id of node.next) {
            const next = byId.get(id)!;
            if (next.kind !== 'boss') expect(next.kind).not.toBe(node.kind);
          }
        }
      }
    }
  });

  it('fills each stop with the right content', () => {
    for (const seed of SEEDS) {
      for (const node of make(seed).nodes) {
        if (node.kind === 'combat') {
          const pool = node.floor <= DEFAULT_MAP_PARAMS.earlyFloors ? CONTENT.earlyEncounters : CONTENT.encounters;
          expect(pool).toContainEqual(node.enemies);
        }
        if (node.kind === 'elite') expect(node.enemies).toEqual(['el1']);
        if (node.kind === 'event') expect(CONTENT.events).toContain(node.eventId);
        if (node.kind === 'rest' || node.kind === 'shop') {
          expect(node.enemies).toBeUndefined();
          expect(node.eventId).toBeUndefined();
        }
      }
    }
  });

  it('contains every kind of stop across seeds (so the rules are not all-combat)', () => {
    const kinds = new Set(SEEDS.flatMap((s) => make(s).nodes.map((n) => n.kind)));
    expect([...kinds].sort()).toEqual(['boss', 'combat', 'elite', 'event', 'rest', 'shop']);
  });

  it('can be saved as text and read back unchanged', () => {
    const map = make(9);
    expect(JSON.parse(JSON.stringify(map))).toEqual(map);
  });
});
