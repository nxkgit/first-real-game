import { Evaluator } from './engine';
import type { EvalConfig, MetricId } from './engine';
import { DEFAULT_POLICIES, draftExperiment } from './drafts';
import type { DraftPolicy } from './drafts';
import { comboUniverse, combosExperiment, deckExperiment } from './combos';
import { loopsExperiment } from './loops';
import { dominanceExperiment } from './dominance';
import type { ComboGoal } from './combos';
import { cardsExperiment, ladderExperiment, lengthsExperiment, outlierExperiment, pairsExperiment } from './experiments';
import { DEFAULT_OPTIONS } from './simulate';
import type { PathPolicy, RestPolicy, RewardPolicy } from './simulate';
import { runFight } from './fight';
import { rngStartFromSeed } from './fightCore';
import { getEnemy } from '../data/enemies';
import { PLAYER_MAX_HP } from '../data/tunables';
import { DEFAULT_SKILLS, SKILL_LEVELS, parseSkills } from './skills';
import type { SkillLevel } from './skills';
import { DEFAULT_SNAPSHOT_CONFIG, buildSnapshot, compareSnapshots, renderComparison } from './snapshot';
import type { Snapshot } from './snapshot';
import { heading, table } from './report';
import { actFights, deckFromSpec, parseFights, referenceDeckSets } from './suites';
import type { DeckSet } from './suites';
import { buildStarterDeck } from '../data/cards';
import type { CardDefinition } from '../game/types';
import type { CardSet } from './experiments';

/**
 * The balance command line, minus the file system: `runCommand` turns a subcommand and its flags
 * into Markdown and JSON, so tests can drive every experiment in-process on tiny run counts.
 */

export interface CommandIO {
  readText(path: string): string;
}

export interface CommandResult {
  /** Markdown to print / write. */
  markdown: string;
  /** Machine-readable twin of the Markdown (a Snapshot for `baseline`). */
  json: unknown;
  /** Suggested default output path for `baseline` (the CLI writes it). */
  defaultOut?: string;
}

export const COMMANDS = ['cards', 'pairs', 'ladder', 'deck', 'combos', 'loops', 'dominance', 'lengths', 'drafts', 'outliers', 'report', 'baseline', 'check', 'bench'] as const;
export type Command = (typeof COMMANDS)[number];

export const BASELINE_PATH = 'balance/baselines/baseline.json';

export const USAGE = `Balance experiments. Usage: npm run balance -- <command> [flags]

Commands
  cards      effect of each card added to / swapped into a deck (paired, with CIs)
  pairs      synergy score for card pairs (sampled when there are many)
  ladder     win rate / HP lost / turns for every fight, by deck set and bot skill
  lengths    fight-length distribution per fight
  drafts     whole-run comparison of draft / rest / path policies
  outliers   cards and fights far outside their cohort
  deck       run one exact deck (--cards a,b*2 | --set name) against the fights, plus raw output vs a Dummy
  dominance  strictly dominated cards (static arithmetic on the card data)
  loops      exhaustive search of tiny decks for free-play loops (minimal loop cores)
  combos     adversarial random search for decks that kill fastest / deal most damage (--goal damage|speed|stall)
  report     all of the above in one document
  baseline   write the committed baseline (${BASELINE_PATH})
  check      compare current content against the baseline (never fails on balance movement)
  bench      simulation throughput per bot skill

Common flags
  --seeds N        seeds (paired units) per fight (defaults differ per command; more = tighter intervals)
  --seed S         base seed (default 1)
  --skills a,b     random,greedy,smart,expert | all   (default random,greedy,smart)
  --skill s        single skill for pairs / drafts
  --fights x       all | normal | elite | boss | enemy-a,enemy-b+enemy-d
  --context name   deck the card is added to: starter | mid | late (default starter)
  --headline m     win | hpLost | turns  (default hpLost): the metric verdicts read
  --pool p         reward | all  (cards that reference decks are sampled from; default reward)
  --cardset s      all | synergy | reward  (which cards cards / pairs / combos test; default all)
  --sets s         ladder deck sets: core (default) | synergy | all | name,name
  --modes m        add | replace | add,replace   (cards)
  --upgrades       also test upgraded cards (cards)
  --max-pairs N    most pairs to evaluate (pairs; default 150)
  --pairs a+b,c+d  evaluate only these pairs (pairs; to confirm a lead with more seeds)
  --runs N         whole runs per policy (drafts; default 100)
  --reward card|gold|best --rest heal|smart --path random|smart   custom draft policy vs the default
  --note text      baseline: replace the note stored in the baseline (state date, commit and what the content is)
  --out base       write base.md and base.json   (baseline: the JSON path; check: the Markdown path)
  --json           print JSON instead of Markdown`;

const num = (flags: Record<string, string>, name: string, fallback: number): number => {
  const v = flags[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) throw new Error(`--${name} must be a positive number`);
  return Math.floor(n);
};

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (!allowed.includes(value as T)) throw new Error(`--${name} must be one of ${allowed.join(', ')}`);
  return value as T;
}

function evaluatorFor(flags: Record<string, string>, defaultSeeds: number): Evaluator {
  const cfg: EvalConfig = { fights: parseFights(flags.fights), seeds: num(flags, 'seeds', defaultSeeds), baseSeed: num(flags, 'seed', 1) };
  return new Evaluator(cfg);
}

const headlineOf = (flags: Record<string, string>): MetricId => oneOf<MetricId>(flags.headline, ['win', 'hpLost', 'turns'], 'hpLost', 'headline');
const poolOf = (flags: Record<string, string>): 'reward' | 'all' => oneOf(flags.pool, ['reward', 'all'] as const, 'reward', 'pool');
const cardsetOf = (flags: Record<string, string>): CardSet => oneOf<CardSet>(flags.cardset, ['all', 'synergy', 'reward'], 'all', 'cardset');

/** --sets core (default) | synergy | all | name,name  (deck sets the ladder measures). */
function setsOf(flags: Record<string, string>): DeckSet[] {
  const all = referenceDeckSets({ pool: poolOf(flags), synergy: true });
  const spec = flags.sets ?? 'core';
  if (spec === 'all') return all;
  if (spec === 'core') return all.filter((s) => ['starter', 'mid', 'late'].includes(s.name));
  if (spec === 'synergy') return all.filter((s) => s.name.startsWith('syn-'));
  return spec.split(',').map((name) => {
    const found = all.find((s) => s.name === name.trim());
    if (!found) throw new Error(`unknown deck set "${name}" (${all.map((s) => s.name).join(', ')}, or core | synergy | all)`);
    return found;
  });
}

/** --cards strike*4,defend*4,bolt   or   --set syn-tag   or   --context mid (the first deck of that set). */
function deckFromFlags(flags: Record<string, string>): { deck: CardDefinition[]; label: string } {
  const withStarter = flags.with === 'starter';
  if (flags.cards) {
    const deck = [...(withStarter ? buildStarterDeck() : []), ...deckFromSpec(flags.cards.split(','))];
    return { deck, label: `${withStarter ? 'starter + ' : ''}${flags.cards}` };
  }
  const name = flags.set ?? flags.context;
  if (!name) throw new Error('deck needs --cards a,b*2,c  or  --set <deck set name>');
  const found = referenceDeckSets({ pool: poolOf(flags), synergy: true }).find((s) => s.name === name);
  if (!found) throw new Error(`unknown deck set "${name}"`);
  return { deck: found.decks[0], label: `${name} (first deck)` };
}

function policiesFrom(flags: Record<string, string>): DraftPolicy[] {
  if (flags.reward === undefined && flags.rest === undefined && flags.path === undefined) return DEFAULT_POLICIES;
  const options = {
    ...DEFAULT_OPTIONS,
    reward: oneOf<RewardPolicy>(flags.reward, ['card', 'gold', 'best'], DEFAULT_OPTIONS.reward, 'reward'),
    rest: oneOf<RestPolicy>(flags.rest, ['heal', 'smart'], DEFAULT_OPTIONS.rest, 'rest'),
    path: oneOf<PathPolicy>(flags.path, ['random', 'smart'], DEFAULT_OPTIONS.path, 'path'),
  };
  return [DEFAULT_POLICIES[0], { name: `custom (reward=${options.reward}, rest=${options.rest}, path=${options.path})`, options }];
}

function bench(flags: Record<string, string>): CommandResult {
  const skills = parseSkills(flags.skills ?? 'all');
  const fights = actFights();
  const deck = referenceDeckSets()[1].decks[0];
  const n = num(flags, 'seeds', 20);
  const rows: (string | number)[][] = [];
  const json: Record<string, unknown> = {};
  for (const skill of skills) {
    const t0 = performance.now();
    let count = 0;
    for (const f of fights) {
      const enemies = f.enemies.map(getEnemy);
      for (let i = 0; i < n; i++) {
        runFight({ deck, enemies, player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP } }, rngStartFromSeed(1000 + i), skill);
        count++;
      }
    }
    const secs = (performance.now() - t0) / 1000;
    rows.push([skill, count, secs.toFixed(2), Math.round(count / secs)]);
    json[skill] = { fights: count, seconds: secs, fightsPerSecond: count / secs };
  }
  return {
    markdown: [heading(2, 'Throughput'), '', `Mid-sized deck against every act encounter, ${n} seeds each, on this machine (machine-dependent; for orientation only).`, '', table(['skill', 'fights', 'seconds', 'fights/sec'], rows)].join('\n'),
    json,
  };
}

/** Runs one subcommand. `today` is the date stamped into reports (yyyy-mm-dd). */
export function runCommand(command: string, flags: Record<string, string>, io: CommandIO, today: string): CommandResult {
  const skills = parseSkills(flags.skills);
  switch (command) {
    case 'cards': {
      const ev = evaluatorFor(flags, 40);
      const modes = (flags.modes ?? 'add,replace').split(',') as ('add' | 'replace')[];
      const r = cardsExperiment(ev, { skills, context: flags.context, modes, includeUpgrades: flags.upgrades === 'true', headline: headlineOf(flags), pool: poolOf(flags), cardset: cardsetOf(flags) });
      return { markdown: r.markdown, json: r.json };
    }
    case 'pairs': {
      const ev = evaluatorFor(flags, 40);
      const r = pairsExperiment(ev, {
        skill: oneOf<SkillLevel>(flags.skill, SKILL_LEVELS, 'smart', 'skill'),
        context: flags.context,
        headline: headlineOf(flags),
        maxPairs: num(flags, 'max-pairs', 150),
        only: flags.pairs ? flags.pairs.split(',') : undefined,
        pool: poolOf(flags),
        cardset: cardsetOf(flags),
      });
      return { markdown: r.markdown, json: r.json };
    }
    case 'deck': {
      const { deck, label } = deckFromFlags(flags);
      const r = deckExperiment({ deck, label, fights: parseFights(flags.fights), seeds: num(flags, 'seeds', 60), baseSeed: num(flags, 'seed', 1), skills, dummyTurns: flags.turns ? num(flags, 'turns', 6) : 6 });
      return { markdown: r.markdown, json: r.json };
    }
    case 'combos': {
      const goal = oneOf<ComboGoal>(flags.goal, ['damage', 'speed', 'stall'], 'damage', 'goal');
      const [lo, hi] = (flags.size ?? '8-20').split('-').map(Number);
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || hi < lo) throw new Error('--size must look like 8-20');
      const r = combosExperiment({
        goal,
        skill: oneOf<SkillLevel>(flags.skill, SKILL_LEVELS, 'smart', 'skill'),
        minSize: lo,
        maxSize: hi,
        trials: num(flags, 'trials', 300),
        climb: num(flags, 'climb', 150),
        searchSeeds: num(flags, 'search-seeds', 6),
        confirmSeeds: num(flags, 'confirm-seeds', 40),
        baseSeed: num(flags, 'seed', 1),
        cards: comboUniverse(flags.cardset),
        fights: parseFights(flags.fights ?? 'boss-a'),
        dummyTurns: num(flags, 'turns', 5),
        top: num(flags, 'top', 5),
        maxCopies: num(flags, 'max-copies', 3),
        minAttackers: num(flags, 'min-attackers', 4),
      });
      return { markdown: r.markdown, json: r.json };
    }
    case 'dominance': {
      const r = dominanceExperiment();
      return { markdown: r.markdown, json: r.json };
    }
    case 'loops': {
      const r = loopsExperiment({
        cards: comboUniverse(flags.cardset),
        maxSize: num(flags, 'max-size', 4),
        maxCopies: num(flags, 'max-copies', 2),
        threshold: num(flags, 'threshold', 20),
        skill: oneOf<SkillLevel>(flags.skill, SKILL_LEVELS, 'smart', 'skill'),
        seed: num(flags, 'seed', 1),
        turns: num(flags, 'turns', 2),
      });
      return { markdown: r.markdown, json: r.json };
    }
    case 'ladder': {
      const r = ladderExperiment(evaluatorFor(flags, 60), { skills, pool: poolOf(flags), sets: setsOf(flags) });
      return { markdown: r.markdown, json: r.json };
    }
    case 'lengths': {
      const r = lengthsExperiment(evaluatorFor(flags, 100), { skills, set: flags.set, pool: poolOf(flags) });
      return { markdown: r.markdown, json: r.json };
    }
    case 'drafts': {
      const r = draftExperiment({ runs: num(flags, 'runs', 100), baseSeed: num(flags, 'seed', 1), skill: oneOf<SkillLevel>(flags.skill, SKILL_LEVELS, 'greedy', 'skill'), policies: policiesFrom(flags) });
      return { markdown: r.markdown, json: r.json };
    }
    case 'outliers': {
      const headline = headlineOf(flags);
      const cardsEv = evaluatorFor(flags, 40);
      const cards = cardsExperiment(cardsEv, { skills, modes: ['add'], context: flags.context, headline, pool: poolOf(flags), cardset: cardsetOf(flags) });
      const ladder = ladderExperiment(evaluatorFor(flags, 60), { skills, pool: poolOf(flags) });
      const r = outlierExperiment({ skills, headline, cardRows: cards.rows, ladder: ladder.rows });
      return { markdown: r.markdown, json: r.json };
    }
    case 'report': {
      const headline = headlineOf(flags);
      const pool = poolOf(flags);
      const ladderEv = evaluatorFor(flags, 100);
      const cardsEv = evaluatorFor(flags, 60);
      const pairsEv = evaluatorFor({ ...flags, seeds: flags['pair-seeds'] ?? '40' }, 40);
      const ladder = ladderExperiment(ladderEv, { skills, pool, sets: referenceDeckSets({ pool, synergy: true }) });
      const lengths = lengthsExperiment(ladderEv, { skills, pool });
      const cards = cardsExperiment(cardsEv, { skills, modes: ['add', 'replace'], headline, pool, cardset: cardsetOf(flags) });
      const pairs = pairsExperiment(pairsEv, { skill: oneOf<SkillLevel>(flags.skill, SKILL_LEVELS, 'smart', 'skill'), headline, maxPairs: num(flags, 'max-pairs', 120), pool, cardset: cardsetOf(flags) });
      const outliers = outlierExperiment({ skills, headline, cardRows: cards.rows, ladder: ladder.rows });
      const drafts = draftExperiment({ runs: num(flags, 'runs', 100), baseSeed: num(flags, 'seed', 1), skill: 'greedy' });
      const parts = [ladder, lengths, cards, pairs, outliers, drafts];
      const header = [
        heading(1, 'Balance report'),
        '',
        `Generated ${today} by \`npm run balance -- report\` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: ${skills.join(', ')}. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md.`,
        '',
      ].join('\n');
      return { markdown: [header, ...parts.map((p) => p.markdown)].join('\n\n'), json: { generated: today, skills, ...Object.fromEntries(parts.map((p) => [p.name, p.json])) } };
    }
    case 'baseline': {
      const config = {
        ...DEFAULT_SNAPSHOT_CONFIG,
        seeds: num(flags, 'seeds', DEFAULT_SNAPSHOT_CONFIG.seeds),
        baseSeed: num(flags, 'seed', DEFAULT_SNAPSHOT_CONFIG.baseSeed),
        skills: flags.skills ? skills : [...DEFAULT_SNAPSHOT_CONFIG.skills],
        pool: poolOf(flags),
      };
      const snap = buildSnapshot(config, today);
      if (flags.note && flags.note !== 'true') snap.note = flags.note;
      return { markdown: `Baseline built: ${Object.keys(snap.metrics).length} metrics, content fingerprint ${snap.content.hash}.`, json: snap, defaultOut: BASELINE_PATH };
    }
    case 'check': {
      const path = flags.baseline ?? BASELINE_PATH;
      const base = JSON.parse(io.readText(path)) as Snapshot;
      if (base.version !== 1) throw new Error(`unsupported baseline version in ${path}`);
      const current = buildSnapshot(base.config, today);
      const cmp = compareSnapshots(base, current);
      return { markdown: renderComparison(cmp, current), json: cmp };
    }
    case 'bench':
      return bench(flags);
    default:
      throw new Error(`unknown command "${command}"\n\n${USAGE}`);
  }
}

export { DEFAULT_SKILLS };
