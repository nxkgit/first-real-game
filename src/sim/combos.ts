import { baseCards } from '../data/cards';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { getEnemy } from '../data/enemies';
import { PLAYER_MAX_HP } from '../data/tunables';
import { Rng } from '../game/rng';
import type { CardDefinition, EnemyDefinition } from '../game/types';
import { unitSeed } from './engine';
import { runFight } from './fight';
import { createFight, rngStartFromSeed } from './fightCore';
import { heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import { BOTS, endTurn } from './skills';
import type { FightContext, SkillLevel } from './skills';
import { deckKey } from './suites';
import type { FightDef } from './suites';
import { fix, fmtCI, mean, meanCI, median, pct, quantile, wilson } from './stats';

/**
 * Tools for decks that are not "starter + a few cards": a fixed-deck runner (`deck`) and an
 * adversarial random search for decks that kill absurdly fast or loop (`combos`).
 */

/** An enemy that never hurts and never dies: lets a deck's raw damage output be read off per turn. */
export const DUMMY: EnemyDefinition = {
  id: 'dummy',
  name: 'Dummy',
  maxHp: 1_000_000,
  movePattern: [{ name: 'Idle', effects: [{ kind: 'block', value: 0 }] }],
};

/** Plays a turn can hold before the bots' own safety cap (60 plays) stops them: reaching it means "a loop, as far as the bot can tell". */
export const PLAY_CAP = 60;

export interface DummyRun {
  /** Damage dealt in each turn. */
  damage: number[];
  /** Cards played in each turn. */
  plays: number[];
}

/** Plays `turns` turns against the Dummy with the given bot. Deterministic in (deck, seed, skill). */
export function dummyRun(deck: CardDefinition[], seed: number, skill: SkillLevel, turns: number): DummyRun {
  const spec = { deck, enemies: [DUMMY] };
  const start = rngStartFromSeed(seed);
  const { combat } = createFight(spec, start);
  let played = 0;
  combat.on('cardPlayed', () => played++);
  const ctx: FightContext = { combat, spec, start, history: [], rng: new Rng((seed ^ 0x5bd1e995) >>> 0) };
  const out: DummyRun = { damage: [], plays: [] };
  for (let t = 0; t < turns && combat.phase === 'playerTurn'; t++) {
    const hp0 = combat.enemies[0].hp;
    played = 0;
    BOTS[skill].playTurn(ctx);
    out.damage.push(hp0 - combat.enemies[0].hp);
    out.plays.push(played);
    if (combat.phase === 'playerTurn') endTurn(ctx);
  }
  return out;
}

// =====================================================================================
// fixed-deck runner
// =====================================================================================

export interface DeckOptions {
  deck: CardDefinition[];
  label: string;
  fights: FightDef[];
  seeds: number;
  baseSeed: number;
  skills: SkillLevel[];
  /** Turns of Dummy output to measure (0 = skip). */
  dummyTurns?: number;
}

export function deckExperiment(opts: DeckOptions): ExperimentResult {
  const dummyTurns = opts.dummyTurns ?? 6;
  const rowsOut: object[] = [];
  const sections: string[] = [
    heading(2, `Fixed deck: ${opts.label}`),
    '',
    `Exactly these ${opts.deck.length} cards (no starter deck added): ${summarizeDeck(opts.deck)}. ${opts.fights.length} fights x ${opts.seeds} seeds, base seed ${opts.baseSeed}, full HP (${PLAYER_MAX_HP}). A stalled fight (60-turn cap) counts as a loss.`,
    '',
  ];
  for (const skill of opts.skills) {
    const rows: (string | number)[][] = [];
    for (const f of opts.fights) {
      const enemies = f.enemies.map(getEnemy);
      const turns: number[] = [];
      const hpWon: number[] = [];
      let wins = 0;
      let stalls = 0;
      let plays = 0;
      for (let i = 0; i < opts.seeds; i++) {
        const r = runFight({ deck: opts.deck, enemies, player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP } }, rngStartFromSeed(unitSeed(opts.baseSeed, f.id, i)), skill);
        turns.push(r.turns);
        if (r.result === 'won') {
          wins++;
          hpWon.push(r.hpLost);
        }
        if (r.result === 'stalled') stalls++;
        plays += Object.values(r.plays).reduce((a, b) => a + b, 0);
      }
      const w = wilson(wins, opts.seeds);
      const t = meanCI(turns);
      rows.push([f.id, f.tier, `${pct(w.p)} [${pct(w.lo)}, ${pct(w.hi)}]`, hpWon.length >= 2 ? fmtCI(meanCI(hpWon)) : 'n/a', fmtCI(t, 2), `${Math.round(quantile(turns, 0.1))}/${Math.round(median(turns))}/${Math.round(quantile(turns, 0.9))}`, Math.min(...turns), stalls, fix(plays / Math.max(1, turns.reduce((a, b) => a + b, 0)), 1)]);
      rowsOut.push({ skill, fight: f.id, win: { p: r6(w.p), lo: r6(w.lo), hi: r6(w.hi) }, turns: { mean: r6(t.mean), lo: r6(t.lo), hi: r6(t.hi) }, minTurns: Math.min(...turns), stalls });
    }
    sections.push(heading(3, `${skill} bot`), table(['fight', 'tier', 'win rate [95% CI]', 'HP lost when won', 'turns [95% CI]', 'turns p10/med/p90', 'fastest', 'stalled', 'plays/turn'], rows), '');
  }
  let dummyJson: object | undefined;
  if (dummyTurns > 0) {
    sections.push(heading(3, `Raw output against a Dummy (never dies, never attacks), first ${dummyTurns} turns (expert skipped: its lookahead judges positions by enemy HP)`), '');
    const rows: (string | number)[][] = [];
    const dj: Record<string, unknown> = {};
    // expert judges positions by enemy HP, which a Dummy that never dies makes meaningless: skip it here
    for (const skill of opts.skills.filter((k) => k !== 'expert')) {
      const per: number[][] = Array.from({ length: dummyTurns }, () => []);
      const capped: number[] = [];
      const playsPerTurn: number[] = [];
      for (let i = 0; i < opts.seeds; i++) {
        const r = dummyRun(opts.deck, unitSeed(opts.baseSeed, 'dummy', i), skill, dummyTurns);
        r.damage.forEach((d, t) => per[t].push(d));
        capped.push(Math.max(...r.plays) >= PLAY_CAP ? 1 : 0);
        playsPerTurn.push(...r.plays);
      }
      const total = Array.from({ length: opts.seeds }, (_, i) => per.reduce((n, p) => n + (p[i] ?? 0), 0));
      rows.push([skill, ...per.map((p) => fix(mean(p), 1)), fmtCI(meanCI(total), 0), fix(mean(playsPerTurn), 1), `${capped.reduce((a, b) => a + b, 0)}/${opts.seeds}`]);
      dj[skill] = { perTurn: per.map((p) => r6(mean(p))), total: r6(mean(total)), cappedRuns: capped.reduce((a, b) => a + b, 0) };
    }
    sections.push(table(['skill', ...Array.from({ length: dummyTurns }, (_, i) => `T${i + 1}`), `total [95% CI]`, 'plays/turn', `loop-capped runs (>= ${PLAY_CAP} plays in a turn)`], rows), '');
    dummyJson = dj;
  }
  return { name: 'deck', json: { label: opts.label, cards: opts.deck.map((c) => c.id), rows: rowsOut, dummy: dummyJson }, markdown: sections.join('\n') };
}

/** "strike*4, defend*4, bolt" */
export function summarizeDeck(deck: CardDefinition[]): string {
  const counts = new Map<string, number>();
  for (const c of deck) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  return [...counts].map(([id, n]) => (n > 1 ? `${id}*${n}` : id)).join(', ');
}

// =====================================================================================
// adversarial search
// =====================================================================================

export type ComboGoal = 'damage' | 'speed';

export interface CombosOptions {
  goal: ComboGoal;
  skill: SkillLevel;
  minSize: number;
  maxSize: number;
  /** Random decks tried before the climb. */
  trials: number;
  /** Hill-climbing steps per surviving deck. */
  climb: number;
  /** Seeds per candidate during the search (small, shared by every candidate). */
  searchSeeds: number;
  /** Fresh seeds for the final confirmation (never seen during the search: avoids the winner's curse). */
  confirmSeeds: number;
  baseSeed: number;
  /** Cards decks may contain. */
  cards: CardDefinition[];
  /** goal=speed: fights to kill. goal=damage: ignored. */
  fights: FightDef[];
  /** goal=damage: turns of Dummy output summed. */
  dummyTurns: number;
  top: number;
  maxCopies: number;
}

export function comboUniverse(name: string | undefined): CardDefinition[] {
  const synergy = new Set(SYNERGY_CARDS.map((c) => c.id));
  const all = baseCards();
  if (name === undefined || name === 'all') return all;
  if (name === 'synergy') return all.filter((c) => synergy.has(c.id) || ['strike', 'defend'].includes(c.id));
  throw new Error(`--cardset must be all or synergy (got "${name}")`);
}

interface Scored {
  deck: CardDefinition[];
  /** The number being maximised. */
  score: number;
}

/** What one deck scores on one seed (higher is better). */
function scoreSeed(opts: CombosOptions, deck: CardDefinition[], seed: number): { score: number; capped: boolean; turns: number; won: boolean } {
  if (opts.goal === 'damage') {
    const r = dummyRun(deck, seed, opts.skill, opts.dummyTurns);
    return { score: r.damage.reduce((a, b) => a + b, 0), capped: Math.max(...r.plays) >= PLAY_CAP, turns: 0, won: false };
  }
  let turns = 0;
  let won = 0;
  for (const f of opts.fights) {
    const r = runFight({ deck, enemies: f.enemies.map(getEnemy), player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP } }, rngStartFromSeed(unitSeed(seed, f.id, 0)), opts.skill);
    turns += r.result === 'won' ? r.turns : 60;
    if (r.result === 'won') won++;
  }
  // speed: fewer turns is better, so score = minus the mean turns
  return { score: -turns / opts.fights.length, capped: false, turns: turns / opts.fights.length, won: won === opts.fights.length };
}

function searchScore(opts: CombosOptions, deck: CardDefinition[], cache: Map<string, number>): number {
  const key = deckKey([...deck].sort((a, b) => a.id.localeCompare(b.id)));
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let total = 0;
  for (let i = 0; i < opts.searchSeeds; i++) total += scoreSeed(opts, deck, unitSeed(opts.baseSeed, 'search', i)).score;
  const s = total / opts.searchSeeds;
  cache.set(key, s);
  return s;
}

function randomDeck(opts: CombosOptions, rng: Rng): CardDefinition[] {
  const size = opts.minSize + Math.floor(rng.next() * (opts.maxSize - opts.minSize + 1));
  const deck: CardDefinition[] = [];
  let guard = 0;
  while (deck.length < size && guard++ < 1000) {
    const c = opts.cards[Math.floor(rng.next() * opts.cards.length)];
    if (deck.filter((d) => d.id === c.id).length < opts.maxCopies) deck.push(c);
  }
  return deck;
}

function mutate(opts: CombosOptions, deck: CardDefinition[], rng: Rng): CardDefinition[] {
  const out = [...deck];
  const r = rng.next();
  const pick = (): CardDefinition => opts.cards[Math.floor(rng.next() * opts.cards.length)];
  const ok = (c: CardDefinition): boolean => out.filter((d) => d.id === c.id).length < opts.maxCopies;
  if (r < 0.6 || out.length >= opts.maxSize) {
    // swap one card (or, at max size, never grow)
    const i = Math.floor(rng.next() * out.length);
    const c = pick();
    if (ok(c)) out[i] = c;
  } else if (r < 0.85 && out.length < opts.maxSize) {
    const c = pick();
    if (ok(c)) out.push(c);
  } else if (out.length > opts.minSize) {
    out.splice(Math.floor(rng.next() * out.length), 1);
  }
  return out;
}

export interface ComboResult {
  deck: CardDefinition[];
  searchScore: number;
  /** Fresh-seed score per seed (mean has a CI). */
  confirm: { mean: number; lo: number; hi: number; min: number; max: number };
  cappedRuns: number;
  /** goal=speed: how often every fight was won. */
  winRate?: { p: number; lo: number; hi: number };
}

export function combosExperiment(opts: CombosOptions): ExperimentResult & { results: ComboResult[]; typical: { mean: number; lo: number; hi: number } } {
  const rng = new Rng(opts.baseSeed * 7919 + 13);
  const cache = new Map<string, number>();
  const scored: Scored[] = [];
  for (let t = 0; t < opts.trials; t++) {
    const deck = randomDeck(opts, rng);
    scored.push({ deck, score: searchScore(opts, deck, cache) });
  }
  scored.sort((a, b) => b.score - a.score);
  // hill-climb from the best few random decks
  const starts = scored.slice(0, Math.max(1, opts.top));
  const finalists: Scored[] = [];
  for (const start of starts) {
    let best = start;
    for (let step = 0; step < opts.climb; step++) {
      const cand = mutate(opts, best.deck, rng);
      const s = searchScore(opts, cand, cache);
      if (s > best.score) best = { deck: cand, score: s };
    }
    finalists.push(best);
  }
  finalists.sort((a, b) => b.score - a.score);

  const confirm = (deck: CardDefinition[]): ComboResult => {
    const scores: number[] = [];
    let capped = 0;
    let wonAll = 0;
    for (let i = 0; i < opts.confirmSeeds; i++) {
      const r = scoreSeed(opts, deck, unitSeed(opts.baseSeed + 1000003, 'confirm', i));
      scores.push(r.score);
      if (r.capped) capped++;
      if (r.won) wonAll++;
    }
    const ci = meanCI(scores);
    const w = wilson(wonAll, opts.confirmSeeds);
    return {
      deck,
      searchScore: searchScoreFor(deck),
      confirm: { mean: r6(ci.mean), lo: r6(ci.lo), hi: r6(ci.hi), min: Math.min(...scores), max: Math.max(...scores) },
      cappedRuns: capped,
      winRate: opts.goal === 'speed' ? { p: r6(w.p), lo: r6(w.lo), hi: r6(w.hi) } : undefined,
    };
  };
  const searchScoreFor = (deck: CardDefinition[]): number => searchScore(opts, deck, cache);
  const results = finalists.map((f) => confirm(f.deck));
  // what a typical random deck of this universe does, on the same fresh seeds, for scale
  const typicalDecks = scored.slice(Math.floor(scored.length / 2), Math.floor(scored.length / 2) + 10).map((s) => confirm(s.deck));
  const typicalMeans = typicalDecks.map((r) => r.confirm.mean);
  const typical = { mean: r6(mean(typicalMeans)), lo: r6(Math.min(...typicalMeans)), hi: r6(Math.max(...typicalMeans)) };

  const unit = opts.goal === 'damage' ? `damage dealt to a Dummy in ${opts.dummyTurns} turns (higher = more broken)` : `mean turns to kill ${opts.fights.map((f) => f.id).join(' + ')} (lower = more broken; a loss counts 60)`;
  const shown = (x: number): string => (opts.goal === 'damage' ? fix(x, 0) : fix(-x, 2));
  const markdown = [
    heading(2, `Adversarial search (${opts.goal})`),
    '',
    `Random search for decks of ${opts.minSize}-${opts.maxSize} cards (at most ${opts.maxCopies} copies of a card) from ${opts.cards.length} cards, ${opts.skill} bot. ${opts.trials} random decks scored on ${opts.searchSeeds} seeds each; the best ${starts.length} were hill-climbed for ${opts.climb} steps (swap / add / remove a card). Goal: ${unit}. The finalists are then RE-SCORED on ${opts.confirmSeeds} fresh seeds the search never saw (the search picks its own favourites, so its own scores are optimistic: the confirmed column is the honest one, with a 95% CI). Search base seed ${opts.baseSeed}.`,
    `For scale: ten mid-ranked random decks scored (on the same fresh seeds) ${shown(typical.mean)} on average.`,
    '',
    table(
      ['rank', 'cards', 'size', opts.goal === 'damage' ? 'damage [95% CI]' : 'turns [95% CI]', 'best / worst seed', opts.goal === 'speed' ? 'wins all fights [95% CI]' : 'loop-capped runs'],
      results.map((r, i) => [
        i + 1,
        summarizeDeck(r.deck),
        r.deck.length,
        opts.goal === 'damage' ? fmtCI({ mean: r.confirm.mean, lo: r.confirm.lo, hi: r.confirm.hi }, 0) : fmtCI({ mean: -r.confirm.mean, lo: -r.confirm.hi, hi: -r.confirm.lo }, 2),
        opts.goal === 'damage' ? `${fix(r.confirm.max, 0)} / ${fix(r.confirm.min, 0)}` : `${fix(-r.confirm.max, 1)} / ${fix(-r.confirm.min, 1)}`,
        opts.goal === 'speed' && r.winRate ? `${pct(r.winRate.p)} [${pct(r.winRate.lo)}, ${pct(r.winRate.hi)}]` : `${r.cappedRuns}/${opts.confirmSeeds}`,
      ])
    ),
    '',
  ].join('\n');
  return {
    name: 'combos',
    json: { goal: opts.goal, skill: opts.skill, size: [opts.minSize, opts.maxSize], trials: opts.trials, climb: opts.climb, searchSeeds: opts.searchSeeds, confirmSeeds: opts.confirmSeeds, baseSeed: opts.baseSeed, typical, results: results.map((r) => ({ cards: r.deck.map((c) => c.id), searchScore: r6(r.searchScore), confirm: r.confirm, cappedRuns: r.cappedRuns, winRate: r.winRate })) },
    markdown,
    results,
    typical,
  };
}

