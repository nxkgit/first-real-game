import type { Rng } from './rng';
import {
  MAP_EARLY_FLOORS,
  MAP_FIRST_FLOOR,
  MAP_FLOORS,
  MAP_KIND_WEIGHTS,
  MAP_LANES,
  MAP_LATE_FLOORS_FROM,
  MAP_MIN_ELITES,
  MAP_PATHS,
  MAP_ROUTE_THEMES,
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
  /** Fights for the upper floors (from `lateFloorsFrom`); the ordinary list is used if this is left out. */
  lateEncounters?: string[][];
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
  lateFloorsFrom: number;
  /** Per-route multipliers on `weights` (see MAP_ROUTE_THEMES). Each climb gets one theme. */
  routeThemes: Record<string, Partial<Record<MapNodeKind, number>>>;
  /** Fewest elite stops the map may have. */
  minElites: number;
}

export const DEFAULT_MAP_PARAMS: MapParams = {
  lanes: MAP_LANES,
  floors: MAP_FLOORS,
  paths: MAP_PATHS,
  weights: MAP_KIND_WEIGHTS,
  firstFloor: MAP_FIRST_FLOOR,
  earlyFloors: MAP_EARLY_FLOORS,
  lateFloorsFrom: MAP_LATE_FLOORS_FROM,
  routeThemes: MAP_ROUTE_THEMES,
  minElites: MAP_MIN_ELITES,
};

/** The list an ordinary fight on `floor` is drawn from. */
export function encounterPoolFor(floor: number, content: MapContent, params: Pick<MapParams, 'earlyFloors' | 'lateFloorsFrom'>): string[][] {
  if (floor <= params.earlyFloors) return content.earlyEncounters;
  if (floor >= params.lateFloorsFrom && content.lateEncounters && content.lateEncounters.length > 0) return content.lateEncounters;
  return content.encounters;
}

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

  // each climb gets a route theme (shuffled, so which climb is which varies by seed)
  const themeNames = Object.keys(params.routeThemes);
  for (let i = themeNames.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [themeNames[i], themeNames[j]] = [themeNames[j], themeNames[i]];
  }
  const themesAt = new Map<string, Set<string>>(); // stop id -> themes of the climbs that pass through it
  const touch = (stop: string, theme: string | undefined): void => {
    if (theme === undefined) return;
    if (!themesAt.has(stop)) themesAt.set(stop, new Set());
    themesAt.get(stop)!.add(theme);
  };

  for (const [climb, start] of starts.entries()) {
    const theme = themeNames.length > 0 ? themeNames[climb % themeNames.length] : undefined;
    let lane = start;
    present.add(id(0, lane));
    touch(id(0, lane), theme);
    for (let floor = 0; floor < floors - 1; floor++) {
      const options = [lane - 1, lane, lane + 1].filter((l) => l >= 0 && l < lanes);
      const crossCount = (b: number): number => edges[floor].filter(([c, d]) => crosses(lane, b, c, d)).length;
      const best = Math.min(...options.map(crossCount));
      const next = pick(rng, options.filter((b) => crossCount(b) === best));
      if (!edges[floor].some(([c, d]) => c === lane && d === next)) edges[floor].push([lane, next]);
      lane = next;
      present.add(id(floor + 1, lane));
      touch(id(floor + 1, lane), theme);
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
        // a stop on several climbs takes one of their themes at random
        const themes = [...(themesAt.get(id(floor, lane)) ?? [])].sort();
        const theme = themes.length > 0 ? themes[Math.floor(rng.next() * themes.length)] : undefined;
        const mult = (k: MapNodeKind): number => (theme !== undefined ? (params.routeThemes[theme]?.[k] ?? 1) : 1);
        const allowed = (Object.entries(params.weights) as [MapNodeKind, number][])
          .filter(([k]) => {
            if (floor < (params.firstFloor[k] ?? 0)) return false;
            if ((k === 'elite' || k === 'rest' || k === 'shop') && parentKinds.includes(k)) return false;
            if (k === 'rest' && floor === floors - 2) return false; // the floor above is the guaranteed rest
            return true;
          })
          .map(([k, w]): [MapNodeKind, number] => [k, w * mult(k)]);
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
      if (kind === 'combat') node.enemies = pick(rng, encounterPoolFor(floor, content, params));
      if (kind === 'elite') node.enemies = pick(rng, content.elites);
      if (kind === 'event') node.eventId = nextEvent();
      nodes.set(node.id, node);
    }
  }

  // make sure enough elites made it onto the map: turn fights into elites where the floor rules allow
  // (no elite right next to another on a path), preferring stops on the risky route
  const eliteFloor = params.firstFloor.elite ?? 0;
  const neighbours = (n: MapNode): MapNode[] => {
    const out: MapNode[] = [];
    for (const [a, b] of edges[n.floor] ?? []) if (a === n.lane) out.push(nodes.get(id(n.floor + 1, b))!);
    for (const [a, b] of edges[n.floor - 1] ?? []) if (b === n.lane) out.push(nodes.get(id(n.floor - 1, a))!);
    return out.filter(Boolean);
  };
  const eliteCount = (): number => [...nodes.values()].filter((n) => n.kind === 'elite').length;
  const elitesEnabled = (params.weights.elite ?? 0) > 0 && eliteFloor < floors - 1; // an experiment that turns elites off stays off
  const topUpElites = (): void => {
    while (elitesEnabled && eliteCount() < params.minElites && content.elites.length > 0) {
      const candidates = [...nodes.values()].filter(
        (n) => n.kind === 'combat' && n.floor >= eliteFloor && n.floor < floors - 1 && !neighbours(n).some((m) => m.kind === 'elite')
      );
      if (candidates.length === 0) break;
      const risky = candidates.filter((n) => themesAt.get(n.id)?.has('risky'));
      const chosen = pick(rng, risky.length > 0 ? risky : candidates);
      chosen.kind = 'elite';
      chosen.enemies = pick(rng, content.elites);
    }
  };
  topUpElites();

  // every route from a first-floor stop up to the boss must cross at least one elite: while some
  // route avoids them all, turn a stop on it into an elite (a fight first, else a shop or event),
  // prefering the risky route; floor rules still hold (no elite next to another on a path)
  const stopsOf = (floor: number): MapNode[] => [...nodes.values()].filter((n) => n.floor === floor);
  const avoidingRoute = (): MapNode[] | null => {
    const memo = new Map<string, MapNode[] | null>();
    const climb = (n: MapNode): MapNode[] | null => {
      if (n.kind === 'elite') return null;
      if (n.floor === floors - 1) return [n];
      if (memo.has(n.id)) return memo.get(n.id)!;
      let found: MapNode[] | null = null;
      for (const [a, b] of edges[n.floor]) {
        if (a !== n.lane) continue;
        const rest = climb(nodes.get(id(n.floor + 1, b))!);
        if (rest) {
          found = [n, ...rest];
          break;
        }
      }
      memo.set(n.id, found);
      return found;
    };
    for (const first of stopsOf(0)) {
      const route = climb(first);
      if (route) return route;
    }
    return null;
  };
  const eliteNeighbours = (n: MapNode): MapNode[] => neighbours(n).filter((m) => m.kind === 'elite');
  for (let guard = 0; elitesEnabled && content.elites.length > 0 && guard < 200; guard++) {
    const route = avoidingRoute();
    if (!route) break;
    const eligible = route.filter((n) => n.floor >= eliteFloor && n.floor < floors - 1 && n.kind !== 'rest');
    if (eligible.length === 0) break; // nothing on this route may become an elite
    // a stop with no elite beside it is best (a fight before a shop or event); only if every stop on
    // the route has an elite beside it, take the one with fewest, accepting two elites in a row
    // (moving the other elite aside just opens a different elite-free route)
    const clear = eligible.filter((n) => eliteNeighbours(n).length === 0);
    const fewest = Math.min(...eligible.map((m) => eliteNeighbours(m).length));
    const pickFrom = clear.length > 0 ? clear : eligible.filter((n) => eliteNeighbours(n).length === fewest);
    const fights = pickFrom.filter((n) => n.kind === 'combat');
    const pool = fights.length > 0 ? fights : pickFrom;
    const risky = pool.filter((n) => themesAt.get(n.id)?.has('risky'));
    const chosen = pick(rng, risky.length > 0 ? risky : pool);
    chosen.kind = 'elite';
    chosen.enemies = pick(rng, content.elites);
    delete chosen.eventId;
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
