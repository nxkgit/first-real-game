import { describe, expect, it } from 'vitest';
import { DEFAULT_MAP_PARAMS, encounterPoolFor, generateActMap } from './actMap';
import type { ActMap, MapContent, MapNode, MapParams } from './actMap';
import { Rng } from './rng';
import { ACT_CONTENT } from '../data/run';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { MAP_EARLY_FLOORS, MAP_FIRST_FLOOR, MAP_FLOORS, MAP_LANES } from '../data/tunables';

const SEEDS = 3000;
const REPEATED = ['elite', 'rest', 'shop'];

const key = (ids: string[] | undefined): string => (ids ?? []).join(',');

/** Checks every rule one map must satisfy. Returns the number of crossing edge pairs. */
function checkMap(map: ActMap, params: MapParams, content: MapContent, label: string): number {
  const fail = (msg: string): never => {
    throw new Error(`${label}: ${msg}`);
  };
  const byId = new Map<string, MapNode>();
  for (const n of map.nodes) {
    if (byId.has(n.id)) fail(`duplicate node id ${n.id}`);
    byId.set(n.id, n);
  }
  const top = params.floors; // the boss's floor index
  if (map.floors !== params.floors + 1) fail(`floors ${map.floors}`);
  if (map.lanes !== params.lanes) fail(`lanes ${map.lanes}`);

  const bosses = map.nodes.filter((n) => n.kind === 'boss');
  if (bosses.length !== 1 || bosses[0].floor !== top) fail('there must be exactly one boss, on the top floor');
  const boss = bosses[0];

  for (const n of map.nodes) {
    if (n.id !== `${n.floor}-${n.lane}`) fail(`id ${n.id} doesn't match its position`);
    if (n.floor < 0 || n.floor > top || n.lane < 0 || n.lane >= params.lanes) fail(`${n.id} out of bounds`);
    if (n.kind === 'boss' !== (n.floor === top)) fail(`${n.id}: boss only on the top floor`);
    // floor rules
    if (n.floor === 0 && n.kind !== 'combat') fail(`floor 0 stop ${n.id} is ${n.kind}`);
    if (n.floor === top - 1 && n.kind !== 'rest') fail(`the floor before the boss has a ${n.kind}`);
    if (n.floor < top - 1 && n.floor > 0 && n.kind === 'rest' && n.floor === top - 1) fail('unreachable');
    const first = (params.firstFloor as Record<string, number | undefined>)[n.kind];
    if (first !== undefined && n.floor < first && n.kind !== 'boss') fail(`${n.kind} at ${n.id} before its first floor ${first}`);
    // links
    if (n.kind === 'boss') {
      if (n.next.length !== 0) fail('the boss leads nowhere');
    } else {
      if (n.next.length === 0) fail(`${n.id} is a dead end`);
      if (new Set(n.next).size !== n.next.length) fail(`${n.id} has duplicate links`);
    }
    for (const id of n.next) {
      const m = byId.get(id);
      if (!m) return fail(`${n.id} links to missing ${id}`);
      if (m.floor !== n.floor + 1) fail(`${n.id} -> ${id} doesn't go up exactly one floor`);
      if (m.floor < top && Math.abs(m.lane - n.lane) > 1) fail(`${n.id} -> ${id} jumps more than one lane`);
      // no back-to-back elite/rest/shop on a path
      if (REPEATED.includes(n.kind) && n.kind === m.kind) fail(`back-to-back ${n.kind}: ${n.id} -> ${id}`);
    }
    // content
    if (n.kind === 'combat' || n.kind === 'elite' || n.kind === 'boss') {
      const pool = n.kind === 'boss' ? content.bosses : n.kind === 'elite' ? content.elites : encounterPoolFor(n.floor, content, params);
      if (!n.enemies || n.enemies.length === 0) fail(`${n.id} has no enemies`);
      if (!pool.some((p) => key(p) === key(n.enemies))) fail(`${n.id} enemies ${key(n.enemies)} aren't from the right list`);
      if (n.eventId !== undefined) fail(`${n.id} fight has an eventId`);
    } else if (n.kind === 'event') {
      if (!n.eventId || !content.events.includes(n.eventId)) fail(`${n.id} event ${n.eventId} not in the content`);
      if (n.enemies) fail(`${n.id} event has enemies`);
    } else if (n.enemies || n.eventId) fail(`${n.id} (${n.kind}) carries fight/event data`);
  }

  // the first real choice
  const starts = map.nodes.filter((n) => n.floor === 0);
  if (starts.length < 2 && params.paths > 1) fail('fewer than two starting stops');

  // reachability both ways
  const seen = new Set<string>(starts.map((n) => n.id));
  for (let f = 0; f < top; f++) {
    for (const n of map.nodes) if (n.floor === f && seen.has(n.id)) n.next.forEach((id) => seen.add(id));
  }
  for (const n of map.nodes) if (!seen.has(n.id)) fail(`${n.id} can't be reached from the start`);
  const reaches = new Set<string>([boss.id]);
  for (let f = top - 1; f >= 0; f--) {
    for (const n of map.nodes) if (n.floor === f && n.next.some((id) => reaches.has(id))) reaches.add(n.id);
  }
  for (const n of map.nodes) if (!reaches.has(n.id)) fail(`${n.id} can't reach the boss`);

  // nodes sorted by floor then lane, links sorted by lane (the saved shape relies on stable order)
  for (let i = 1; i < map.nodes.length; i++) {
    const a = map.nodes[i - 1];
    const b = map.nodes[i];
    if (a.floor > b.floor || (a.floor === b.floor && a.lane >= b.lane)) fail('nodes out of order');
  }
  for (const n of map.nodes) {
    const lanes = n.next.map((id) => byId.get(id)!.lane);
    if (lanes.some((l, i) => i > 0 && l < lanes[i - 1])) fail(`${n.id} links out of order`);
  }

  // crossings between regular floors (the step into the boss converges on one stop, so can't cross)
  let crossings = 0;
  for (let f = 0; f < top - 1; f++) {
    const edges = map.nodes.filter((n) => n.floor === f).flatMap((n) => n.next.map((id) => [n.lane, byId.get(id)!.lane] as const));
    for (let i = 0; i < edges.length; i++)
      for (let j = i + 1; j < edges.length; j++) if ((edges[i][0] - edges[j][0]) * (edges[i][1] - edges[j][1]) < 0) crossings++;
  }
  return crossings;
}

describe('map generator invariants', () => {
  it(`obeys every floor rule, link rule and content rule over ${SEEDS} seeds`, () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      checkMap(generateActMap(new Rng(seed), ACT_CONTENT), DEFAULT_MAP_PARAMS, ACT_CONTENT, `seed ${seed}`);
    }
  });

  it('matches the numbers in tunables (the documented rules), not just the generator\'s own params', () => {
    expect(DEFAULT_MAP_PARAMS.floors).toBe(MAP_FLOORS);
    expect(DEFAULT_MAP_PARAMS.lanes).toBe(MAP_LANES);
    for (let seed = 0; seed < 500; seed++) {
      const map = generateActMap(new Rng(seed), ACT_CONTENT);
      for (const n of map.nodes) {
        if (n.kind === 'event') expect(n.floor).toBeGreaterThanOrEqual(MAP_FIRST_FLOOR.event);
        if (n.kind === 'shop') expect(n.floor).toBeGreaterThanOrEqual(MAP_FIRST_FLOOR.shop);
        if (n.kind === 'elite') expect(n.floor).toBeGreaterThanOrEqual(MAP_FIRST_FLOOR.elite);
        if (n.kind === 'rest' && n.floor !== MAP_FLOORS - 1) expect(n.floor).toBeGreaterThanOrEqual(MAP_FIRST_FLOOR.rest);
        if (n.kind === 'combat' && n.floor <= MAP_EARLY_FLOORS) {
          expect(ACT_CONTENT.earlyEncounters.map(key)).toContain(key(n.enemies));
        }
      }
    }
  });

  it('every map has at least minElites elite stops, and fights on the upper floors come from the late list', () => {
    let elites = 0;
    for (let seed = 0; seed < SEEDS; seed++) {
      const map = generateActMap(new Rng(seed), ACT_CONTENT);
      const count = map.nodes.filter((n) => n.kind === 'elite').length;
      expect(count, `seed ${seed}`).toBeGreaterThanOrEqual(DEFAULT_MAP_PARAMS.minElites);
      elites += count;
      for (const n of map.nodes) {
        if (n.kind === 'combat' && n.floor >= DEFAULT_MAP_PARAMS.lateFloorsFrom) {
          expect(ACT_CONTENT.lateEncounters!.map(key)).toContain(key(n.enemies));
        }
      }
    }
    expect(elites / SEEDS, 'average elite stops per map').toBeGreaterThan(2.5);
  });

  it('routes differ: across seeds, maps have a spread of stop-kind mixes (not every map the same shape)', () => {
    const mixes = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const map = generateActMap(new Rng(seed), ACT_CONTENT);
      const count = (kind: string): number => map.nodes.filter((n) => n.kind === kind).length;
      mixes.add(`${count('event')}-${count('elite')}-${count('shop')}-${count('rest')}`);
    }
    expect(mixes.size).toBeGreaterThan(20);
  });

  it('holds on other map shapes too (lanes, floors and path counts around the defaults)', () => {
    const shapes: Partial<MapParams>[] = [
      { lanes: 3 },
      { lanes: 7 },
      { floors: 6 },
      { floors: 16 },
      { paths: 2 },
      { paths: 7 },
      { lanes: 2, paths: 2 },
      { lanes: 6, floors: 9, paths: 5 },
    ];
    for (const [i, shape] of shapes.entries()) {
      const params = { ...DEFAULT_MAP_PARAMS, ...shape };
      for (let seed = 0; seed < 150; seed++) {
        checkMap(generateActMap(new Rng(seed + i * 1000), ACT_CONTENT, params), params, ACT_CONTENT, `shape ${JSON.stringify(shape)} seed ${seed}`);
      }
    }
  });

  it('only uses enemies and events that exist, over many seeds', () => {
    for (let seed = 0; seed < 300; seed++) {
      for (const n of generateActMap(new Rng(seed), ACT_CONTENT).nodes) {
        for (const id of n.enemies ?? []) expect(ENEMIES[id], id).toBeDefined();
        if (n.eventId) expect(EVENTS[n.eventId], n.eventId).toBeDefined();
      }
    }
  });

  it('the same seed gives an identical map, a different seed (nearly always) a different one', () => {
    let different = 0;
    for (let seed = 0; seed < 300; seed++) {
      const a = generateActMap(new Rng(seed), ACT_CONTENT);
      const b = generateActMap(new Rng(seed), ACT_CONTENT);
      expect(b).toEqual(a);
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
      if (JSON.stringify(generateActMap(new Rng(seed + 1), ACT_CONTENT)) !== JSON.stringify(a)) different++;
    }
    expect(different).toBeGreaterThan(290);
  });

  it('generation never touches the content lists (they are shared, so mutating them would leak between runs)', () => {
    const before = JSON.stringify(ACT_CONTENT);
    for (let seed = 0; seed < 50; seed++) generateActMap(new Rng(seed), ACT_CONTENT);
    expect(JSON.stringify(ACT_CONTENT)).toBe(before);
  });

  it('no edges cross with the default map shape (measured: 0 in 3000 seeds)', () => {
    // The generator's comment promises "never cross if it can be avoided", not "never cross".
    // With the default shape (5 lanes, 4 paths) it has measured as never, so that is pinned; other shapes are not asserted.
    let maps = 0;
    let withCrossing = 0;
    for (let seed = 0; seed < SEEDS; seed++) {
      const map = generateActMap(new Rng(seed), ACT_CONTENT);
      const c = checkMap(map, DEFAULT_MAP_PARAMS, ACT_CONTENT, `seed ${seed}`);
      maps++;
      if (c > 0) withCrossing++;
    }
    expect(withCrossing, `${withCrossing} of ${maps} maps have crossing edges`).toBe(0);
  });
});
