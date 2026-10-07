import { goldExperiment, goldGridExperiment, eventExperiment, mapExperiment, pathExperiment, pressureExperiment, relicRunExperiment, removalExperiment, restExperiment } from './evidenceRuns';
import { deckSizeExperiment, pickExperiment, relicFightExperiment, upgradeExperiment } from './evidenceFights';
import { SKILL_LEVELS } from './skills';
import type { SkillLevel } from './skills';
import { heading } from './report';
import type { ExperimentResult } from './report';
import { DEFAULT_RUN_POLICY, withPolicy } from './runsim';
import type { GoldRule, PathStyle, PickRule, RestRule, RunPolicy } from './runsim';
import { compareRuns, runTable } from './evidenceRuns';

/**
 * The design-evidence commands (docs/design/EVIDENCE.md): whole-act and fight-level measurements
 * for the decisions the owner has not made yet. Parameters are in-memory what-ifs; no tunable or
 * data file changes. `runEvidenceCommand` is the file-system-free entry the tests use.
 */

export const EVIDENCE_COMMANDS = ['runs', 'gold', 'removal', 'rests', 'events', 'relics', 'maps', 'paths', 'pressure', 'picks', 'decksize', 'upgrades', 'evidence'] as const;

export const EVIDENCE_USAGE = `Design evidence (docs/design/EVIDENCE.md)
  runs       compare whole-act policies / parameters (--vary name=a|b|c ...; see flags below)
  gold       card versus gold at several shop prices (--prices 20,40,60)
  removal    card removal as a shop service (--removal-prices 25,50)
  rests      heal versus upgrade by floor, rest policies, heal fraction
  events     value of each placeholder event choice (--rich: gold is spent at shops)
  relics     value of each relic: fight level and whole run
  maps       static path statistics and shape sweeps (floors, lanes, climbs, thresholds, weights); --no-runs skips the whole-run columns
  paths      does path choice matter? (policies, and random runs grouped by what the path held)
  pressure   HP lost per fight by floor for the decks real policies build, against the bands
  picks      what a card pick / shop buy / removal is worth (HP per fight), by deck stage
  decksize   thin versus fat decks, and add-plus-remove
  upgrades   what one upgrade is worth, per card
  evidence   all of the above into one document (--quick for a small run)

Evidence flags
  --runs N          whole runs per row (default 200)      --seed S   base seed
  --skill s         bot that plays fights in run experiments (default smart)
  --seeds N         paired seeds per fight in fight-level experiments (default 20)
  --samples N       sampled decks per size (decksize; default 6)       --maps N   maps per row (maps; default 200)
  --prices a,b,c    shop prices (gold)      --golds a,b   reward gold amounts (gold grid)
  --pick random|best|synergy   --gold never|always|shop-ahead|<gainBelow number>   --rest heal|smart|upgrade|<healBelow fraction>
  --path random|smart|safe|elite|shop|fight   --shop-price N   --removal-price N   --heal-fraction F   --draft-pool reward|all
  --map-floors N --map-lanes N --map-paths N --map-first-elite N --map-first-rest N --map-first-shop N   map-shape overrides (runs)`;

const num = (flags: Record<string, string>, name: string, fallback: number): number => {
  const v = flags[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`--${name} must be a non-negative number`);
  return n;
};
const list = (flags: Record<string, string>, name: string, fallback: number[]): number[] => (flags[name] ? flags[name].split(',').map(Number) : fallback);

/** Builds a policy from the flags (the same flags `runs` takes). */
export function policyFromFlags(flags: Record<string, string>): RunPolicy {
  const skill = (flags.skill ?? 'smart') as SkillLevel;
  if (!SKILL_LEVELS.includes(skill)) throw new Error(`--skill must be one of ${SKILL_LEVELS.join(', ')}`);
  const goldRaw = flags.gold;
  const gold: GoldRule = goldRaw === undefined ? 'never' : goldRaw === 'never' || goldRaw === 'always' || goldRaw === 'shop-ahead' ? goldRaw : { gainBelow: Number(goldRaw) };
  const restRaw = flags.rest;
  const rest: RestRule = restRaw === undefined ? 'smart' : restRaw === 'heal' || restRaw === 'smart' || restRaw === 'upgrade' ? restRaw : { healBelow: Number(restRaw) };
  const map: RunPolicy['map'] = {};
  if (flags['map-floors']) map.floors = num(flags, 'map-floors', 12);
  if (flags['map-lanes']) map.lanes = num(flags, 'map-lanes', 5);
  if (flags['map-paths']) map.paths = num(flags, 'map-paths', 4);
  const firstFloor: Record<string, number> = {};
  if (flags['map-first-elite']) firstFloor.elite = num(flags, 'map-first-elite', 4);
  if (flags['map-first-rest']) firstFloor.rest = num(flags, 'map-first-rest', 4);
  if (flags['map-first-shop']) firstFloor.shop = num(flags, 'map-first-shop', 3);
  if (Object.keys(firstFloor).length > 0) map.firstFloor = firstFloor;
  return withPolicy(DEFAULT_RUN_POLICY, {
    skill,
    pick: (flags.pick ?? 'best') as PickRule,
    gold,
    rest,
    path: (flags.path ?? 'smart') as PathStyle,
    shopPrice: num(flags, 'shop-price', DEFAULT_RUN_POLICY.shopPrice),
    removalPrice: num(flags, 'removal-price', 0),
    removalPick: flags['removal-price'] ? 'best' : 'none',
    healFraction: flags['heal-fraction'] ? num(flags, 'heal-fraction', 0.3) : undefined,
    draftPool: flags['draft-pool'] === 'all' ? 'all' : 'reward',
    measureFinal: true,
    map,
  });
}

interface Sizes {
  runs: number;
  seeds: number;
  samples: number;
  maps: number;
}

export function runEvidenceCommand(command: string, flags: Record<string, string>): { markdown: string; json: unknown } {
  const quick = flags.quick === 'true';
  const sizes: Sizes = {
    runs: num(flags, 'runs', quick ? 12 : 200),
    seeds: num(flags, 'seeds', quick ? 2 : 20),
    samples: num(flags, 'samples', quick ? 2 : 6),
    maps: num(flags, 'maps', quick ? 10 : 200),
  };
  const baseSeed = num(flags, 'seed', 1);
  const skill = (flags.skill ?? 'smart') as SkillLevel;
  const run = { runs: sizes.runs, baseSeed, skill };
  const fight = { seeds: sizes.seeds, baseSeed, skill };
  const one = (r: ExperimentResult): { markdown: string; json: unknown } => ({ markdown: r.markdown, json: r.json });

  switch (command) {
    case 'runs': {
      const base = policyFromFlags({ skill });
      const variant = policyFromFlags(flags);
      const rows = compareRuns(sizes.runs, baseSeed, [
        { name: 'defaults (best-card draft, rest smart, path smart, gold never)', policy: base },
        { name: 'with your flags', policy: variant },
      ]);
      return { markdown: [heading(2, 'Policy comparison'), '', runTable(rows)].join('\n'), json: rows.map((r) => ({ name: r.name, win: r.win.p, floor: r.floor.mean, cost: r.cost?.mean })) };
    }
    case 'gold': {
      const prices = list(flags, 'prices', quick ? [40] : [20, 30, 40, 50, 60, 80]);
      const a = goldExperiment({ ...run, prices });
      const b = goldGridExperiment({ ...run, golds: list(flags, 'golds', quick ? [25] : [15, 25, 40, 60]), prices: list(flags, 'grid-prices', quick ? [40] : [20, 30, 40, 60]) });
      return { markdown: `${a.markdown}\n${b.markdown}`, json: { gold: a.json, grid: b.json } };
    }
    case 'removal':
      return one(removalExperiment({ ...run, removalPrices: list(flags, 'removal-prices', quick ? [50] : [25, 50, 75]) }));
    case 'rests':
      return one(restExperiment({ ...run, heals: list(flags, 'heals', quick ? [0.3] : [0.2, 0.3, 0.4, 0.5]) }));
    case 'events': {
      const a = eventExperiment({ ...run, rich: false });
      const b = eventExperiment({ ...run, rich: true });
      return { markdown: `${a.markdown}\n${b.markdown}`, json: { plain: a.json, rich: b.json } };
    }
    case 'relics': {
      const a = relicFightExperiment({ ...fight });
      const b = relicRunExperiment({ ...run });
      return { markdown: `${a.markdown}\n${b.markdown}`, json: { fights: a.json, runs: b.json } };
    }
    case 'maps':
      return one(mapExperiment({ ...run, maps: sizes.maps, runLevel: flags['no-runs'] !== 'true' }));
    case 'paths':
      return one(pathExperiment({ ...run }));
    case 'pressure':
      return one(pressureExperiment({ ...run }));
    case 'picks':
      return one(pickExperiment({ ...fight, offers: quick ? 100 : 3000 }));
    case 'decksize':
      return one(deckSizeExperiment({ ...fight, samples: sizes.samples, sizes: quick ? [8, 10, 14] : undefined }));
    case 'upgrades':
      return one(upgradeExperiment({ ...fight }));
    case 'evidence': {
      const parts = EVIDENCE_COMMANDS.filter((c) => c !== 'evidence' && c !== 'runs').map((c) => ({ c, r: runEvidenceCommand(c, flags) }));
      return { markdown: parts.map((p) => p.r.markdown).join('\n\n'), json: Object.fromEntries(parts.map((p) => [p.c, p.r.json])) };
    }
    default:
      throw new Error(`unknown evidence command "${command}"`);
  }
}
