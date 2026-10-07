import type { Rng } from './rng';
import {
  MAP_EARLY_FLOORS,
  MAP_FIRST_FLOOR,
  MAP_FLOORS,
  MAP_KIND_WEIGHTS,
  MAP_LANES,
  MAP_PATHS,
} from '../data/tunables';

export type MapNodeKind = 'combat' | 'elite' | 'rest' | 'shop' | 'event' | 'boss';

/** One stop on the map. Plain data, so a whole map can be saved as it is. */
export interface MapNode {
  /** `<floor>-<lane>`, floors counted from 0 at the bottom. */
  id: string;
  floor: number;
  lane: number;
  kind: MapNodeKind;
  /** Ids of the stops you can go to next. */
  next: string[];
  /** Enemy ids, for combat, elite and boss stops (fixed when the map is made). */
  enemies?: string[];
  /** For event stops. */
  eventId?: string;
}

export interface ActMap {
  lanes: number;
  /** Number of floors including the boss's. */
  floors: number;
  nodes: MapNode[];
}

/** What the map is filled with: lists of fights (each a list of enemy ids) and event ids. */
export interface MapContent {
  earlyEncounters: string[][];
  encounters: string[][];
  elites: string[][];
  bosses: string[][];
  events: string[];
}

export interface MapParams {
  lanes: number;
  /** Floors before the boss. */
  floors: number;
  paths: number;
  weights: Partial<Record<MapNodeKind, number>>;
  firstFloor: Partial<Record<MapNodeKind, number>>;
  earlyFloors: number;
}

export const DEFAULT_MAP_PARAMS: MapParams = {
  lanes: MAP_LANES,
  floors: MAP_FLOORS,
  paths: MAP_PATHS,
  weights: MAP_KIND_WEIGHTS,
  firstFloor: MAP_FIRST_FLOOR,
  earlyFloors: MAP_EARLY_FLOORS,
};

const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng.next() * items.length)];

/** Whether the step a->b crosses the step c->d drawn between the same two floors. */
const crosses = (a: number, b: number, c: number, d: number): boolean => (a - c) * (b - d) < 0;

/**
 * Makes a branching map, StS style: several climbs from the bottom floor to the boss that share
 * stops where they overlap and never cross if it can be avoided. Which kind of stop each is
 * follows simple floor rules (the bottom floor is always a fight, the top floor before the boss is
 * always a rest, elites and rests only appear higher up, and elites/rests/shops never come twice in
 * a row on one path). The same Rng always gives the same map.
 */
export function generateActMap(rng: Rng, content: MapContent, params: MapParams = DEFAULT_MAP_PARAMS): ActMap {
  const { lanes, floors, paths } = params;
  const edges: [number, number][][] = Array.from({ length: floors - 1 }, () => []);
  const present = new Set<string>();
  const id = (floor: number, lane: number): string => `${floor}-${lane}`;

  // where the climbs begin: at least two different columns, so the first choice is a real one
  const starts: number[] = [];
  for (let i = 0; i < paths; i++) starts.push(Math.floor(rng.next() * lanes));
  if (new Set(starts).size < 2 && starts.length > 1) starts[1] = (starts[0] + 1 + Math.floor(rng.next() * (lanes - 1))) % lanes;

  for (const start of starts) {
    let lane = start;
    present.add(id(0, lane));
    for (let floor = 0; floor < floors - 1; floor++) {
      const options = [lane - 1, lane, lane + 1].filter((l) => l >= 0 && l < lanes);
      const crossCount = (b: number): number => edges[floor].filter(([c, d]) => crosses(lane, b, c, d)).length;
      const best = Math.min(...options.map(crossCount));
      const next = pick(rng, options.filter((b) => crossCount(b) === best));
      if (!edges[floor].some(([c, d]) => c === lane && d === next)) edges[floor].push([lane, next]);
      lane = next;
      present.add(id(floor + 1, lane));
    }
  }

  // build nodes bottom to top, deciding each one's kind from its parents' kinds
  const nodes = new Map<string, MapNode>();
  const bagOfEvents: string[] = [];
  const nextEvent = (): string | undefined => {
    if (content.events.length === 0) return undefined;
    if (bagOfEvents.length === 0) {
      const shuffled = [...content.events];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      bagOfEvents.push(...shuffled);
    }
    return bagOfEvents.pop();
  };

  for (let floor = 0; floor < floors; floor++) {
    for (let lane = 0; lane < lanes; lane++) {
      if (!present.has(id(floor, lane))) continue;
      const parentKinds =
        floor === 0
          ? []
          : edges[floor - 1].filter(([, d]) => d === lane).map(([c]) => nodes.get(id(floor - 1, c))!.kind);

      let kind: MapNodeKind;
      if (floor === 0) kind = 'combat';
      else if (floor === floors - 1) kind = 'rest';
      else {
        const allowed = (Object.entries(params.weights) as [MapNodeKind, number][]).filter(([k]) => {
          if (floor < (params.firstFloor[k] ?? 0)) return false;
          if ((k === 'elite' || k === 'rest' || k === 'shop') && parentKinds.includes(k)) return false;
          if (k === 'rest' && floor === floors - 2) return false; // the floor above is the guaranteed rest
          return true;
        });
        const total = allowed.reduce((sum, [, w]) => sum + w, 0);
        let roll = rng.next() * total;
        kind = allowed[allowed.length - 1][0];
        for (const [k, w] of allowed) {
          roll -= w;
          if (roll < 0) {
            kind = k;
            break;
          }
        }
      }

      const node: MapNode = { id: id(floor, lane), floor, lane, kind, next: [] };
      if (kind === 'combat') node.enemies = pick(rng, floor <= params.earlyFloors ? content.earlyEncounters : content.encounters);
      if (kind === 'elite') node.enemies = pick(rng, content.elites);
      if (kind === 'event') node.eventId = nextEvent();
      nodes.set(node.id, node);
    }
  }

  // wire the steps up, then the boss on top
  edges.forEach((floorEdges, floor) => {
    for (const [a, b] of floorEdges) nodes.get(id(floor, a))!.next.push(id(floor + 1, b));
  });
  const bossLane = Math.floor(lanes / 2);
  const boss: MapNode = {
    id: id(floors, bossLane),
    floor: floors,
    lane: bossLane,
    kind: 'boss',
    next: [],
    enemies: pick(rng, content.bosses),
  };
  nodes.set(boss.id, boss);
  for (const node of nodes.values()) if (node.floor === floors - 1) node.next.push(boss.id);

  const ordered = [...nodes.values()].sort((a, b) => a.floor - b.floor || a.lane - b.lane);
  for (const node of ordered) node.next.sort((x, y) => nodes.get(x)!.lane - nodes.get(y)!.lane);
  return { lanes, floors: floors + 1, nodes: ordered };
}
