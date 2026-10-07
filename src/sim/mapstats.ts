import { DEFAULT_MAP_PARAMS, generateActMap } from '../game/actMap';
import type { ActMap, MapNodeKind, MapParams } from '../game/actMap';
import { Rng } from '../game/rng';
import { ACT_CONTENT } from '../data/run';
import { meanCI } from './stats';
import type { Interval } from './stats';

/**
 * Static analysis of generated maps: what a path through the act contains, and how much the paths
 * of one map differ from each other. Maps come from the real generator with parameters overridden
 * IN MEMORY (`over`), so a map-shape what-if never edits tunables.ts. Content-agnostic: it looks only at
 * stop kinds.
 */

export const KINDS: readonly MapNodeKind[] = ['combat', 'elite', 'rest', 'shop', 'event'];

export type KindCounts = Record<MapNodeKind, number>;
const zero = (): KindCounts => ({ combat: 0, elite: 0, rest: 0, shop: 0, event: 0, boss: 0 });

/** The default map parameters with  laid on top (weights and first-floor tables merge key by key; set a first floor beyond the map to switch a kind off). */
export function mergeMapParams(over: Partial<MapParams> = {}): MapParams {
  return {
    ...DEFAULT_MAP_PARAMS,
    ...over,
    weights: { ...DEFAULT_MAP_PARAMS.weights, ...(over.weights ?? {}) },
    firstFloor: { ...DEFAULT_MAP_PARAMS.firstFloor, ...(over.firstFloor ?? {}) },
  };
}

export function mapFor(seed: number, over: Partial<MapParams> = {}): ActMap {
  return generateActMap(new Rng(seed), ACT_CONTENT, mergeMapParams(over));
}

/** Every route from a bottom-floor stop to the boss, as stop ids (capped so a pathological shape cannot explode). */
export function enumeratePaths(map: ActMap, cap = 50000): string[][] {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const out: string[][] = [];
  const walk = (id: string, trail: string[]): void => {
    if (out.length >= cap) return;
    const node = byId.get(id)!;
    const here = [...trail, id];
    if (node.next.length === 0) out.push(here);
    else for (const n of node.next) walk(n, here);
  };
  for (const n of map.nodes.filter((x) => x.floor === 0)) walk(n.id, []);
  return out;
}

export function kindCounts(map: ActMap, path: string[]): KindCounts {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const c = zero();
  for (const id of path) c[byId.get(id)!.kind]++;
  return c;
}

export interface MapSummary {
  seed: number;
  nodes: KindCounts;
  paths: number;
  startChoices: number;
  /** Per kind: min / mean / max count over this map's paths. */
  perPath: Record<MapNodeKind, { min: number; mean: number; max: number }>;
  /** Stops on a path, boss excluded. */
  pathLength: number;
}

export function summarizeMap(seed: number, over: Partial<MapParams> = {}): MapSummary {
  const map = mapFor(seed, over);
  const paths = enumeratePaths(map);
  const counts = paths.map((p) => kindCounts(map, p));
  const nodes = zero();
  for (const n of map.nodes) nodes[n.kind]++;
  const perPath = {} as MapSummary['perPath'];
  for (const k of [...KINDS, 'boss'] as MapNodeKind[]) {
    const xs = counts.map((c) => c[k]);
    perPath[k] = { min: Math.min(...xs), mean: xs.reduce((a, b) => a + b, 0) / xs.length, max: Math.max(...xs) };
  }
  return { seed, nodes, paths: paths.length, startChoices: map.nodes.filter((n) => n.floor === 0).length, perPath, pathLength: map.floors - 1 };
}

export interface ShapeStats {
  maps: number;
  /** Per kind, over maps: the mean (over a map's paths) count of that kind on a path. */
  mean: Record<MapNodeKind, Interval>;
  /** The fewest and most of a kind the map's paths offer, averaged over maps ("best/worst path" counts). */
  min: Record<MapNodeKind, Interval>;
  max: Record<MapNodeKind, Interval>;
  paths: Interval;
  nodes: Interval;
  startChoices: Interval;
}

/** Aggregates `maps` seeds of one map shape. */
export function shapeStats(maps: number, baseSeed: number, over: Partial<MapParams> = {}): ShapeStats {
  const sums = Array.from({ length: maps }, (_, i) => summarizeMap(baseSeed + i, over));
  const field = (pick: (s: MapSummary, k: MapNodeKind) => number): Record<MapNodeKind, Interval> => {
    const out = {} as Record<MapNodeKind, Interval>;
    for (const k of [...KINDS, 'boss'] as MapNodeKind[]) out[k] = meanCI(sums.map((s) => pick(s, k)));
    return out;
  };
  return {
    maps,
    mean: field((s, k) => s.perPath[k].mean),
    min: field((s, k) => s.perPath[k].min),
    max: field((s, k) => s.perPath[k].max),
    paths: meanCI(sums.map((s) => s.paths)),
    nodes: meanCI(sums.map((s) => Object.values(s.nodes).reduce((a, b) => a + b, 0))),
    startChoices: meanCI(sums.map((s) => s.startChoices)),
  };
}

/**
 * Expected fights still to come after floor `f` (0-based floor of the stop just finished), over all
 * paths of the given maps, boss included: used to turn "value per fight" into "value for the rest of the act".
 */
export function fightsRemainingByFloor(maps: number, baseSeed: number, over: Partial<MapParams> = {}): number[] {
  const floors = (over.floors ?? DEFAULT_MAP_PARAMS.floors) + 1;
  const sums = new Array<number>(floors).fill(0);
  let count = 0;
  for (let i = 0; i < maps; i++) {
    const map = mapFor(baseSeed + i, over);
    const byId = new Map(map.nodes.map((n) => [n.id, n]));
    for (const path of enumeratePaths(map)) {
      count++;
      const isFight = path.map((id) => ['combat', 'elite', 'boss'].includes(byId.get(id)!.kind));
      let after = 0;
      for (let f = floors - 1; f >= 0; f--) {
        sums[f] += after;
        if (isFight[f]) after++;
      }
    }
  }
  return sums.map((s) => s / Math.max(1, count));
}
