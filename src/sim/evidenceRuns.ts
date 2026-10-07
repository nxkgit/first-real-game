import { RELIC_POOL, SYNERGY_RELICS } from '../data/relics';
import { EVENTS } from '../data/events';
import { DEFAULT_MAP_PARAMS } from '../game/actMap';
import type { MapParams } from '../game/actMap';
import { PLAYER_MAX_HP } from '../data/tunables';
import { heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import { getCard } from '../data/cards';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { DEFAULT_RUN_POLICY, mechanismsOf, playRuns, withPolicy } from './runsim';
import type { RunPolicy, RunRecord } from './runsim';
import { KINDS, fightsRemainingByFloor, shapeStats } from './mapstats';
import { fix, fmtCI, fmtDiff, meanCI, pairedDiff, pct, verdict, wilson } from './stats';
import type { Interval } from './stats';
import { hpLostBand, turnsBand, bandMark, bandStatus } from './targets';

/**
 * Whole-run evidence experiments: shop and gold, rests, events, relics (run level), pressure curve,
 * map shape. Each compares POLICIES or PARAMETERS on the same seeds (paired) with 95% intervals.
 * They measure; they do not decide. Every number is for the placeholder content and the bots.
 */

export interface RunEntry {
  name: string;
  policy: RunPolicy;
}

export interface RunRow {
  name: string;
  records: RunRecord[];
  win: ReturnType<typeof wilson>;
  floor: Interval;
  dWin?: Interval;
  dFloor?: Interval;
  dCost?: Interval;
  cost?: Interval;
  dBoss?: Interval;
  deck: number;
  goldLeft: number;
  verdict?: string;
}

const winArr = (rs: RunRecord[]): number[] => rs.map((r) => (r.won ? 1 : 0));
const WIN_MARGIN = 0.03;

/** Plays every entry on the same seeds and compares each with the first (paired by seed). */
export function compareRuns(runs: number, baseSeed: number, entries: RunEntry[]): RunRow[] {
  const all = entries.map((e) => playRuns(runs, baseSeed, e.policy));
  const base = all[0];
  return entries.map((e, k) => {
    const rs = all[k];
    const hasCost = rs.every((r) => r.finalCost !== undefined);
    const costs = (xs: RunRecord[]): number[] => xs.map((r) => r.finalCost ?? 0);
    const row: RunRow = {
      name: e.name,
      records: rs,
      win: wilson(rs.filter((r) => r.won).length, rs.length),
      floor: meanCI(rs.map((r) => r.floorReached)),
      cost: hasCost ? meanCI(costs(rs)) : undefined,
      deck: rs.reduce((a, r) => a + r.finalDeck.length, 0) / rs.length,
      goldLeft: rs.reduce((a, r) => a + r.finalGold, 0) / rs.length,
    };
    if (k > 0) {
      row.dWin = pairedDiff(winArr(base), winArr(rs));
      row.dFloor = pairedDiff(base.map((r) => r.floorReached), rs.map((r) => r.floorReached));
      if (hasCost && base.every((r) => r.finalCost !== undefined)) row.dCost = pairedDiff(costs(base), costs(rs));
      row.verdict = verdict(row.dWin, WIN_MARGIN, true);
    }
    return row;
  });
}

const winCell = (w: { p: number; lo: number; hi: number }): string => `${pct(w.p)} [${pct(w.lo)}, ${pct(w.hi)}]`;
const ptsCell = (d: Interval | undefined): string => (d ? `${fmtDiff({ mean: d.mean * 100, lo: d.lo * 100, hi: d.hi * 100 })} pts` : 'base');
const VERDICT: Record<string, string> = { better: 'better', worse: 'worse', negligible: 'negligible', inconclusive: 'INCONCLUSIVE' };

/** The standard run-comparison table. */
export function runTable(rows: RunRow[], withCost = true): string {
  const heads = ['variant', 'win rate [95% CI]', 'win vs first (paired)', 'floor reached', ...(withCost ? ['final deck cost, HP/fight [CI]', 'cost vs first'] : []), 'deck size', 'gold left', 'verdict'];
  return table(
    heads,
    rows.map((r) => [
      r.name,
      winCell(r.win),
      ptsCell(r.dWin),
      fmtCI(r.floor),
      ...(withCost ? [r.cost ? fmtCI(r.cost) : '-', r.dCost ? fmtDiff(r.dCost) : r.cost ? 'base' : '-'] : []),
      fix(r.deck),
      fix(r.goldLeft, 0),
      r.verdict ? VERDICT[r.verdict] : 'base',
    ])
  );
}

const rowJson = (r: RunRow): object => ({
  name: r.name,
  win: { p: r6(r.win.p), lo: r6(r.win.lo), hi: r6(r.win.hi) },
  dWin: r.dWin ? { mean: r6(r.dWin.mean), lo: r6(r.dWin.lo), hi: r6(r.dWin.hi) } : null,
  floor: r6(r.floor.mean),
  cost: r.cost ? { mean: r6(r.cost.mean), lo: r6(r.cost.lo), hi: r6(r.cost.hi) } : null,
  dCost: r.dCost ? { mean: r6(r.dCost.mean), lo: r6(r.dCost.lo), hi: r6(r.dCost.hi) } : null,
  deck: r6(r.deck),
  goldLeft: r6(r.goldLeft),
  verdict: r.verdict ?? null,
});

export interface RunExpOptions {
  runs: number;
  baseSeed: number;
  skill: RunPolicy['skill'];
  /** Starting policy (default: DEFAULT_RUN_POLICY with `skill`). */
  base?: RunPolicy;
}
const baseOf = (o: RunExpOptions): RunPolicy => withPolicy(o.base ?? DEFAULT_RUN_POLICY, { skill: o.skill, measureFinal: true });

const intro = (o: RunExpOptions, what: string): string =>
  `${o.runs} paired runs per row on seeds ${o.baseSeed}..${o.baseSeed + o.runs - 1}, fights played by the ${o.skill} bot. ${what} "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.`;

// =====================================================================================
// gold, shop price and card removal
// =====================================================================================

export interface GoldOptions extends RunExpOptions {
  prices: number[];
}

/**
 * Card versus gold, at several shop prices. The "always take card" policy never spends gold except
 * what events give; "gold" policies take the 25 gold and route to shops. Read the first column
 * against the first row: where a gold policy beats the card policy gold is the better pick, where it
 * loses the card dominates.
 */
export function goldExperiment(o: GoldOptions): ExperimentResult {
  const base = baseOf(o);
  const shopper = { path: 'shop' as const, shopBuy: 'best' as const };
  const entries: RunEntry[] = [{ name: 'always take the card (gold never taken)', policy: withPolicy(base, { gold: 'never' }) }];
  for (const price of o.prices) {
    entries.push({ name: `price ${price}: always gold, route to shops`, policy: withPolicy(base, { gold: 'always', shopPrice: price, ...shopper }) });
    entries.push({ name: `price ${price}: gold only if a shop is ahead`, policy: withPolicy(base, { gold: 'shop-ahead', shopPrice: price, ...shopper }) });
    entries.push({ name: `price ${price}: gold when no card adds 1+ HP/fight`, policy: withPolicy(base, { gold: { gainBelow: 1 }, shopPrice: price, ...shopper }) });
  }
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  const markdown = [heading(2, 'Card versus gold, by shop price'), '', intro(o, 'Gold reward 25 (as in the game), shop of 4 cards, the shop is the only place gold is spent.'), '', runTable(rows), ''].join('\n');
  return { name: 'gold', json: { options: { ...o }, rows: rows.map(rowJson) }, markdown };
}

/** The reward-gold amount and shop price on a grid, for the "gold in card terms" table. */
export function goldGridExperiment(o: RunExpOptions & { golds: number[]; prices: number[] }): ExperimentResult {
  const base = baseOf(o);
  const shopper = { path: 'shop' as const, shopBuy: 'best' as const, gold: 'always' as const };
  const entries: RunEntry[] = [{ name: 'always take the card', policy: withPolicy(base, { gold: 'never' }) }];
  for (const gold of o.golds) for (const price of o.prices) entries.push({ name: `gold ${gold}, price ${price}`, policy: withPolicy(base, { ...shopper, rewardGold: gold, shopPrice: price }) });
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  const cell = (g: number, p: number): string => {
    const r = rows.find((x) => x.name === `gold ${g}, price ${p}`)!;
    const d = r.dCost!;
    const mark = d.lo > 0 ? ' (card wins)' : d.hi < 0 ? ' (gold wins)' : ' (~equal)';
    return `${fmtDiff(d)}${mark}`;
  };
  const markdown = [
    heading(2, 'Gold amount x shop price: change in final deck cost when always taking gold'),
    '',
    intro(o, 'Cell = final deck cost with the "always gold, route to shops" policy minus the "always card" policy (HP lost per fight; POSITIVE = the gold policy ends with a WORSE deck, so the card was the better pick).'),
    '',
    table(['reward gold \\ shop price', ...o.prices.map(String)], o.golds.map((g) => [String(g), ...o.prices.map((p) => cell(g, p))])),
    '',
  ].join('\n');
  return { name: 'goldGrid', json: { options: { ...o }, rows: rows.map(rowJson) }, markdown };
}

/**
 * Card versus gold depends on how often shops come up: price x shop frequency. For each shop weight
 * the card policy is run on the SAME map shape as the gold policies, so each cell compares like with like.
 */
export function goldShopsExperiment(o: RunExpOptions & { shopWeights: number[]; prices: number[] }): ExperimentResult {
  const base = baseOf(o);
  const rows: (string | number)[][] = [];
  const json: object[] = [];
  for (const w of o.shopWeights) {
    const map = { weights: { shop: w } };
    const perPath = shapeStats(100, o.baseSeed, map).mean.shop.mean;
    const entries: RunEntry[] = [{ name: 'card', policy: withPolicy(base, { gold: 'never', map }) }];
    for (const price of o.prices) entries.push({ name: `price ${price}`, policy: withPolicy(base, { gold: 'always', path: 'shop', shopBuy: 'best', shopPrice: price, map }) });
    const res = compareRuns(o.runs, o.baseSeed, entries);
    const cells = res.slice(1).map((r) => {
      const d = r.dCost!;
      const tag = d.lo > 0 ? 'card wins' : d.hi < 0 ? 'gold wins' : '~equal';
      return `${fmtDiff(d)}; ${ptsCell(r.dWin)} (${tag})`;
    });
    rows.push([`${w} (${fix(perPath, 2)} shops per path)`, ...cells]);
    json.push({ shopWeight: w, shopsPerPath: r6(perPath), cells: res.slice(1).map((r, i) => ({ price: o.prices[i], dCost: r6(r.dCost!.mean), lo: r6(r.dCost!.lo), hi: r6(r.dCost!.hi), dWin: r6(r.dWin!.mean) })) });
  }
  const markdown = [
    heading(2, 'Card versus gold: shop price x how often shops appear'),
    '',
    intro(o, 'Cell = [final deck cost with "always gold, route to shops" minus "always card", on the same map shape (HP/fight; POSITIVE = the card was better)]; [win-rate change, same comparison].'),
    '',
    table(['shop weight (stops per path)', ...o.prices.map((p) => `price ${p}`)], rows),
    '',
  ].join('\n');
  return { name: 'goldShops', json: { options: { ...o }, rows: json }, markdown };
}

export interface RemovalOptions extends RunExpOptions {
  removalPrices: number[];
}

/** Card removal at a shop: price versus buying a card, with gold from taking gold at rewards. */
export function removalExperiment(o: RemovalOptions): ExperimentResult {
  const base = withPolicy(baseOf(o), { gold: 'always', path: 'shop', shopBuy: 'best', shopPrice: 40 });
  const entries: RunEntry[] = [{ name: 'gold + shops, no removal service', policy: base }];
  for (const price of o.removalPrices) {
    entries.push({ name: `removal at ${price} gold, removes the best card`, policy: withPolicy(base, { removalPrice: price, removalPick: 'best' }) });
    entries.push({ name: `removal at ${price} gold, removes a Strike-like starter card`, policy: withPolicy(base, { removalPrice: price, removalPick: 'basic' }) });
  }
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  const markdown = [heading(2, 'Card removal as a shop service'), '', intro(o, 'The removal is bought after the shop\'s cards, so it competes for the same gold.'), '', runTable(rows), ''].join('\n');
  return { name: 'removal', json: { options: { ...o }, rows: rows.map(rowJson) }, markdown };
}

// =====================================================================================
// rest stops
// =====================================================================================

export function restExperiment(o: RunExpOptions & { heals: number[] }): ExperimentResult {
  const base = baseOf(o);
  // observation: what a heal and an upgrade are worth at each floor, in the runs the smart rest policy plays
  const obs = playRuns(o.runs, o.baseSeed, withPolicy(base, { rest: 'smart', observeRest: true, valueSeeds: 6, measureFinal: false }));
  const floors = new Map<number, { missing: number[]; heal: number[]; best: number[]; mean: number[] }>();
  for (const r of obs)
    for (const rs of r.rests) {
      const f = floors.get(rs.floor) ?? { missing: [], heal: [], best: [], mean: [] };
      f.missing.push(rs.maxHp - rs.hpBefore);
      f.heal.push(Math.min(rs.heal, rs.maxHp - rs.hpBefore));
      if (rs.bestUpgradeGain !== undefined) {
        f.best.push(rs.bestUpgradeGain);
        f.mean.push(rs.meanUpgradeGain!);
      }
      floors.set(rs.floor, f);
    }
  const remain = fightsRemainingByFloor(300, o.baseSeed);
  const byFloor = [...floors.entries()].sort((a, b) => a[0] - b[0]);
  const floorRows = byFloor.map(([floor, f]) => {
    const left = remain[floor - 1] ?? 0; // fights after this floor's stop (floor is 1-based)
    const best = meanCI(f.best);
    const avg = meanCI(f.mean);
    const heal = meanCI(f.heal);
    return {
      floor,
      n: f.missing.length,
      missing: meanCI(f.missing),
      heal,
      best,
      avg,
      left,
      bestTotal: best.mean * left,
      avgTotal: avg.mean * left,
    };
  });
  const policies: RunEntry[] = [
    { name: 'smart (heal under 70% HP, else upgrade a random card)', policy: withPolicy(base, { rest: 'smart' }) },
    { name: 'always heal', policy: withPolicy(base, { rest: 'heal' }) },
    { name: 'always upgrade a random card', policy: withPolicy(base, { rest: 'upgrade' }) },
    { name: 'always upgrade the best card', policy: withPolicy(base, { rest: 'upgrade', upgradePick: 'best' }) },
    { name: 'heal under 50% HP, else upgrade the best card', policy: withPolicy(base, { rest: { healBelow: 0.5 }, upgradePick: 'best' }) },
    { name: 'heal under 80% HP, else upgrade the best card', policy: withPolicy(base, { rest: { healBelow: 0.8 }, upgradePick: 'best' }) },
  ];
  for (const h of o.heals) policies.push({ name: `smart rest with heal fraction ${h}`, policy: withPolicy(base, { rest: 'smart', healFraction: h }) });
  const rows = compareRuns(o.runs, o.baseSeed, policies);
  const markdown = [
    heading(2, 'Rest stops: heal or upgrade'),
    '',
    heading(3, 'What each option is worth, by floor'),
    '',
    `Observed at the rest stops of ${o.runs} smart-policy runs. Heal = HP the rest restores (30% of max HP, capped at the HP missing). Upgrade = HP per fight the BEST single upgrade saves for the deck held at that moment (paired fights), and the mean over upgradable cards; times the fights still to come (from the map) gives its worth for the rest of the act. HP healed and HP saved are both in HP, so compare them directly; but HP only matters if it would run out, so the heal is worth less when HP is high.`,
    '',
    table(
      ['floor', 'rest stops', 'HP missing [CI]', 'HP a heal restores', 'best upgrade, HP/fight [CI]', 'avg upgrade, HP/fight', 'fights left', 'best upgrade over the rest of the act (HP)', 'avg upgrade over the rest of the act'],
      floorRows.map((r) => [r.floor, r.n, fmtCI(r.missing), fix(r.heal.mean), fmtCI(r.best, 2), fix(r.avg.mean, 2), fix(r.left), fix(r.bestTotal), fix(r.avgTotal)])
    ),
    '',
    heading(3, 'Rest policies compared (whole runs)'),
    '',
    intro(o, 'Heal fraction rows change the 30% heal in memory.'),
    '',
    runTable(rows),
    '',
  ].join('\n');
  return {
    name: 'rests',
    json: {
      options: { ...o },
      byFloor: floorRows.map((r) => ({ floor: r.floor, n: r.n, missing: r6(r.missing.mean), heal: r6(r.heal.mean), bestUpgrade: r6(r.best.mean), avgUpgrade: r6(r.avg.mean), fightsLeft: r6(r.left) })),
      rows: rows.map(rowJson),
    },
    markdown,
  };
}

// =====================================================================================
// events
// =====================================================================================

/**
 * For every event choice: force it at every stop of that event, leave all other events, and compare
 * with leaving every event. Reported over the runs that actually met the event.
 */
export function eventExperiment(o: RunExpOptions & { rich: boolean }): ExperimentResult {
  const base = withPolicy(baseOf(o), o.rich ? { gold: 'shop-ahead', path: 'shop', shopBuy: 'best' } : {});
  const leave = withPolicy(base, { event: 'leave' });
  const baseRecs = playRuns(o.runs, o.baseSeed, leave);
  const rows: (string | number)[][] = [];
  const json: object[] = [];
  for (const [id, ev] of Object.entries(EVENTS)) {
    ev.choices.forEach((choice, ci) => {
      const recs = playRuns(o.runs, o.baseSeed, withPolicy(base, { event: { [id]: ci } }));
      const idx = baseRecs.map((_, i) => i).filter((i) => baseRecs[i].events.includes(id));
      if (idx.length < 3) return;
      const pick = (rs: RunRecord[], f: (r: RunRecord) => number): number[] => idx.map((i) => f(rs[i]));
      const dWin = pairedDiff(pick(baseRecs, (r) => (r.won ? 1 : 0)), pick(recs, (r) => (r.won ? 1 : 0)));
      const dFloor = pairedDiff(pick(baseRecs, (r) => r.floorReached), pick(recs, (r) => r.floorReached));
      const dCost = pairedDiff(pick(baseRecs, (r) => r.finalCost ?? 0), pick(recs, (r) => r.finalCost ?? 0));
      const dBoss = pairedDiff(pick(baseRecs, (r) => r.hpAtBoss ?? 0), pick(recs, (r) => r.hpAtBoss ?? 0));
      const what = choice.outcomes.map((x) => (x.kind === 'gold' ? `${x.value > 0 ? '+' : ''}${x.value} gold` : x.kind === 'hp' ? `${x.value > 0 ? '+' : ''}${x.value} HP` : x.kind === 'maxHp' ? `${x.value > 0 ? '+' : ''}${x.value} max HP` : x.kind === 'fight' ? `fight ${x.enemies.join('+')}` : x.kind)).join(', ') || 'nothing';
      rows.push([`${id}: ${choice.label} (${what})`, idx.length, ptsCell(dWin), fmtDiff(dFloor, 2), fmtDiff(dCost), fmtDiff(dBoss)]);
      json.push({ event: id, choice: choice.label, runsMet: idx.length, dWin: r6(dWin.mean), dFloor: r6(dFloor.mean), dCost: r6(dCost.mean), dHpAtBoss: r6(dBoss.mean) });
    });
  }
  const markdown = [
    heading(2, `Event choices (${o.rich ? 'gold is spent at shops' : 'default policy: gold never taken'})`),
    '',
    intro(o, 'Each row forces one choice at every stop of that event and leaves every other event, compared with leaving every event, over the runs that met the event (the choice that does nothing reads as zero by construction). "HP at the boss" is the HP carried into the boss fight, over runs that reached it.'),
    '',
    table(['event choice', 'runs that met it', 'win vs leaving', 'floor reached', 'final deck cost (HP/fight)', 'HP at the boss'], rows),
    '',
  ].join('\n');
  return { name: o.rich ? 'eventsRich' : 'events', json: { options: { ...o }, rows: json }, markdown };
}

// =====================================================================================
// relics at run level
// =====================================================================================

export function relicRunExperiment(o: RunExpOptions & { ids?: string[] }): ExperimentResult {
  const ids = o.ids ?? [...RELIC_POOL, ...SYNERGY_RELICS].map((r) => r.id);
  const base = baseOf(o);
  const entries: RunEntry[] = [{ name: 'no relic', policy: base }];
  for (const id of ids) entries.push({ name: `starts with ${id}`, policy: withPolicy(base, { startRelics: [id] }) });
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  // boss-fight view: HP carried into the boss and the boss's own result
  const bossRows = rows.map((r) => {
    const reached = r.records.filter((x) => x.hpAtBoss !== undefined);
    return [r.name, reached.length, reached.length ? fix(reached.reduce((a, x) => a + x.hpAtBoss!, 0) / reached.length) : '-', reached.length ? pct(reached.filter((x) => x.won).length / reached.length) : '-'];
  });
  const markdown = [
    heading(2, 'Relics: whole-run effect of starting the act with one'),
    '',
    intro(o, 'Starting with a relic is the upper bound on its value (a relic found at an elite is held for fewer fights). The two synergy relics need decks that exhaust cards / kill enemies to do anything.'),
    '',
    runTable(rows),
    '',
    heading(3, 'Into the boss fight'),
    '',
    table(['variant', 'runs that reached the boss', 'mean HP carried in', 'boss win rate (of those)'], bossRows),
    '',
  ].join('\n');
  return { name: 'relicRuns', json: { options: { ...o }, rows: rows.map(rowJson) }, markdown };
}

// =====================================================================================
// pressure curve
// =====================================================================================

export interface PressureOptions extends RunExpOptions {
  entries?: RunEntry[];
}

/** HP lost per fight by floor, for the decks real policies build, against the provisional bands. */
export function pressureExperiment(o: PressureOptions): ExperimentResult {
  const base = baseOf(o);
  const entries = o.entries ?? [
    { name: `${o.skill} bot, best-card drafting`, policy: withPolicy(base, { measureFinal: false }) },
    { name: `${o.skill} bot, random-card drafting`, policy: withPolicy(base, { pick: 'random', measureFinal: false }) },
    { name: 'greedy bot, best-card drafting', policy: withPolicy(base, { skill: 'greedy', measureFinal: false }) },
  ];
  const sections: string[] = [];
  const json: object[] = [];
  const totalFloors = DEFAULT_MAP_PARAMS.floors + 1;
  for (const e of entries) {
    const recs = playRuns(o.runs, o.baseSeed, e.policy);
    const fights = recs.flatMap((r) => r.fights);
    const rows: (string | number)[][] = [];
    for (let f = 1; f <= totalFloors; f++) {
      for (const tier of ['normal', 'elite', 'boss'] as const) {
        const at = fights.filter((x) => x.floor === f && x.tier === tier);
        if (at.length === 0) continue;
        const won = at.filter((x) => x.won);
        const lost = meanCI(won.map((x) => x.hpLost));
        const met = recs.filter((r) => r.fights.some((x) => x.floor === f && x.tier === tier)).length;
        const band = hpLostBand(tier);
        rows.push([f, tier, at.length, pct(met / recs.length), fix(at.reduce((a, x) => a + x.hpBefore, 0) / at.length), `${fix(lost.mean)} [${fix(lost.lo)}, ${fix(lost.hi)}]`, pct(1 - won.length / at.length), `${fix(band[0], 0)}-${fix(band[1], 0)}`, bandMark(bandStatus(lost.mean, band))]);
      }
    }
    const byTier = (['normal', 'elite', 'boss'] as const).map((t) => {
      const at = fights.filter((x) => x.tier === t);
      const won = at.filter((x) => x.won);
      const turns = meanCI(won.map((x) => x.turns));
      const lost = meanCI(won.map((x) => x.hpLost));
      return [t, at.length, pct(won.length / Math.max(1, at.length)), `${fix(lost.mean)} [${fix(lost.lo)}, ${fix(lost.hi)}]`, `${fix(hpLostBand(t)[0], 0)}-${fix(hpLostBand(t)[1], 0)}`, bandMark(bandStatus(lost.mean, hpLostBand(t))), `${fix(turns.mean)} (${turnsBand(t)[0]}-${turnsBand(t)[1]}) ${bandMark(bandStatus(turns.mean, turnsBand(t)))}`];
    });
    const win = wilson(recs.filter((r) => r.won).length, recs.length);
    sections.push(
      heading(3, e.name),
      '',
      `Run win rate ${winCell(win)}. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.`,
      '',
      table(['floor', 'tier', 'fights', 'reached', 'HP on entering', 'HP lost when won [CI]', 'lost', 'band (HP)', 'vs band'], rows),
      '',
      table(['tier', 'fights', 'won', 'HP lost when won [CI]', 'band (HP)', 'vs band', 'turns (band)'], byTier),
      ''
    );
    json.push({ policy: e.name, win: r6(win.p), floors: rows.map((r) => ({ floor: r[0], tier: r[1], fights: r[2], hpLost: r[5] })) });
  }
  const markdown = [heading(2, 'Pressure curve: HP lost per fight by floor'), '', `${o.runs} runs per policy on seeds ${o.baseSeed}..${o.baseSeed + o.runs - 1}. Bands are the provisional ones in src/sim/targets.ts (HP bands assume 60 max HP and the mid reference deck at full HP; here HP on entering varies, so a floor can read LOW simply because the player was healthy).`, '', ...sections].join('\n');
  return { name: 'pressure', json: { options: { runs: o.runs, baseSeed: o.baseSeed, maxHp: PLAYER_MAX_HP }, policies: json }, markdown };
}

// =====================================================================================
// map shape
// =====================================================================================

interface Variant {
  label: string;
  over: Partial<MapParams>;
}

const kindCell = (s: ReturnType<typeof shapeStats>, k: (typeof KINDS)[number]): string => `${fix(s.mean[k].mean)} (${fix(s.min[k].mean)}-${fix(s.max[k].mean)})`;

export function mapExperiment(o: RunExpOptions & { maps: number; runLevel: boolean }): ExperimentResult {
  const d = DEFAULT_MAP_PARAMS;
  const variants: { group: string; list: Variant[] }[] = [
    { group: 'floors before the boss', list: [8, 10, 12, 14, 16].map((n) => ({ label: String(n), over: { floors: n } })) },
    { group: 'lanes (map width)', list: [3, 4, 5, 6, 7].map((n) => ({ label: String(n), over: { lanes: n } })) },
    { group: 'climbs (separate paths drawn)', list: [2, 3, 4, 5, 6, 7].map((n) => ({ label: String(n), over: { paths: n } })) },
    { group: 'first floor for elites', list: [2, 4, 6, 8].map((n) => ({ label: String(n), over: { firstFloor: { elite: n } } })) },
    { group: 'first floor for rests', list: [2, 4, 6, 8].map((n) => ({ label: String(n), over: { firstFloor: { rest: n } } })) },
    { group: 'first floor for shops', list: [1, 3, 5, 7].map((n) => ({ label: String(n), over: { firstFloor: { shop: n } } })) },
    { group: 'elite weight (of 100 total)', list: [0, 4, 8, 14, 20].map((n) => ({ label: String(n), over: { weights: { elite: n } } })) },
    { group: 'rest weight', list: [0, 5, 10, 18, 26].map((n) => ({ label: String(n), over: { weights: { rest: n } } })) },
    { group: 'shop weight', list: [0, 3, 5, 10, 16].map((n) => ({ label: String(n), over: { weights: { shop: n } } })) },
    { group: 'event weight', list: [0, 10, 22, 35].map((n) => ({ label: String(n), over: { weights: { event: n } } })) },
  ];
  const defaultLabel = (group: string, label: string): boolean =>
    (group.startsWith('floors') && label === String(d.floors)) ||
    (group.startsWith('lanes') && label === String(d.lanes)) ||
    (group.startsWith('climbs') && label === String(d.paths)) ||
    (group.startsWith('first floor for elites') && label === String(d.firstFloor.elite)) ||
    (group.startsWith('first floor for rests') && label === String(d.firstFloor.rest)) ||
    (group.startsWith('first floor for shops') && label === String(d.firstFloor.shop)) ||
    (group.startsWith('elite weight') && label === String(d.weights.elite)) ||
    (group.startsWith('rest weight') && label === String(d.weights.rest)) ||
    (group.startsWith('shop weight') && label === String(d.weights.shop)) ||
    (group.startsWith('event weight') && label === String(d.weights.event));

  const base = baseOf(o);
  const baseline = playRuns(o.runLevel ? o.runs : 0, o.baseSeed, base);
  const baseWin = baseline.map((r) => (r.won ? 1 : 0));
  const sections: string[] = [];
  const json: object[] = [];
  const fightsPerPath = (s: ReturnType<typeof shapeStats>): number => s.mean.combat.mean + s.mean.elite.mean + 1;

  for (const g of variants) {
    const rows: (string | number)[][] = [];
    for (const v of g.list) {
      const s = shapeStats(o.maps, o.baseSeed, v.over);
      let runCells: (string | number)[] = [];
      let runJson: object = {};
      if (o.runLevel) {
        const recs = playRuns(o.runs, o.baseSeed, withPolicy(base, { map: v.over }));
        const win = wilson(recs.filter((r) => r.won).length, recs.length);
        const dWin = pairedDiff(baseWin, recs.map((r) => (r.won ? 1 : 0)));
        const fights = recs.flatMap((r) => r.fights);
        const won = fights.filter((x) => x.won);
        const lostPer = meanCI(fights.map((x) => x.hpLost));
        runCells = [winCell(win), ptsCell(dWin), fix(won.reduce((a, x) => a + x.hpLost, 0) / Math.max(1, won.length)), fix(lostPer.mean)];
        runJson = { win: r6(win.p), dWin: r6(dWin.mean), hpLostPerFight: r6(lostPer.mean) };
      }
      rows.push([`${v.label}${defaultLabel(g.group, v.label) ? ' (current)' : ''}`, fix(s.paths.mean, 0), fix(s.nodes.mean, 0), fix(s.startChoices.mean), fix(fightsPerPath(s)), kindCell(s, 'elite'), kindCell(s, 'rest'), kindCell(s, 'shop'), kindCell(s, 'event'), ...runCells]);
      json.push({ group: g.group, value: v.label, paths: r6(s.paths.mean), fightsPerPath: r6(fightsPerPath(s)), elites: r6(s.mean.elite.mean), rests: r6(s.mean.rest.mean), shops: r6(s.mean.shop.mean), events: r6(s.mean.event.mean), ...runJson });
    }
    sections.push(
      heading(3, g.group),
      '',
      table(['value', 'distinct paths', 'stops', 'first choices', 'fights per path (boss incl.)', 'elites per path (min-max)', 'rests per path', 'shops per path', 'events per path', ...(o.runLevel ? ['win rate [CI]', 'win vs current', 'HP lost per won fight', 'HP lost per fight'] : [])], rows),
      ''
    );
  }
  const markdown = [
    heading(2, 'Map shape sensitivity'),
    '',
    `Static columns: ${o.maps} generated maps per row (seeds ${o.baseSeed}..${o.baseSeed + o.maps - 1}); "per path" is the mean over a map's paths of how many stops of that kind a path passes through, and the bracket is the range between the fewest and the most that map's paths offer (averaged over maps), i.e. what the best and worst path see. Boss and the forced final rest are counted.${o.runLevel ? ` Run columns: ${o.runs} runs per row with the ${o.skill} bot, smart pathing and best-card drafting, paired by seed against the current shape (the map differs per row, so pairing is loose).` : ''} Map shape overrides are applied in memory; nothing in tunables.ts changed. The placeholder fights do not get harder with the floor, so a longer map is simply more of the same difficulty.`,
    '',
    ...sections,
  ].join('\n');
  return { name: 'maps', json: { options: { ...o }, rows: json }, markdown };
}

/** Path choice: how much does the way through the map matter? */
/** Floors counted when grouping runs by what their path held. */
const EARLY_FLOORS = 7;

export function pathExperiment(o: RunExpOptions): ExperimentResult {
  const base = baseOf(o);
  const entries: RunEntry[] = [
    { name: 'random path (the baseline)', policy: withPolicy(base, { path: 'random' }) },
    { name: 'smart (rest when hurt, shop with gold, elites when strong)', policy: withPolicy(base, { path: 'smart' }) },
    { name: 'safe (never elites, rest more)', policy: withPolicy(base, { path: 'safe' }) },
    { name: 'elite-seeking', policy: withPolicy(base, { path: 'elite' }) },
    { name: 'fight-seeking', policy: withPolicy(base, { path: 'fight' }) },
    { name: 'shop-seeking (with gold taken)', policy: withPolicy(base, { path: 'shop', gold: 'shop-ahead' }) },
  ];
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  // random-path runs grouped by how many elites / rests / shops their path held in its first floors (counting only floors almost every run reaches, so dying early does not decide the group)
  const rand = rows[0].records;
  const groups = (kind: string, cap: number): (string | number)[][] => {
    const out: (string | number)[][] = [];
    for (let k = 0; k <= cap; k++) {
      const at = rand.filter((r) => Math.min(cap, r.trail.slice(0, EARLY_FLOORS).filter((x) => x === kind).length) === k);
      if (at.length < 5) continue;
      const w = wilson(at.filter((r) => r.won).length, at.length);
      out.push([`${k}${k === cap ? '+' : ''} ${kind}`, at.length, winCell(w), fmtCI(meanCI(at.map((r) => r.floorReached)))]);
    }
    return out;
  };
  const markdown = [
    heading(2, 'Path choice'),
    '',
    intro(o, 'Path styles differ only in how the bot scores the next stop (the same map and the same fights offered).'),
    '',
    runTable(rows),
    '',
    heading(3, 'Random-path runs grouped by what their path held'),
    '',
    `Observational: the path was random, so groups differ by luck of the map as well as by the stops, but no policy selected into them. Only the first ${EARLY_FLOORS} floors are counted (nearly every run gets that far); counting the whole path would credit rests to runs that simply lived long enough to meet them.`,
    '',
    table(['group', 'runs', 'win rate [CI]', 'floor reached'], [...groups('elite', 3), ...groups('rest', 4), ...groups('shop', 2)]),
    '',
  ].join('\n');
  return { name: 'paths', json: { options: { ...o }, rows: rows.map(rowJson) }, markdown };
}



// =====================================================================================
// does a synergy-seeking draft reach an engine?
// =====================================================================================

/**
 * How many of the deck's non-starter cards share the most common mechanism label (a tag, a trigger
 * kind, a scaling source, a status they apply). 1 = nothing in common; higher = the deck leans on
 * one family. A crude "did the draft assemble an engine" signal; it does not say the engine works.
 */
export function concentration(deckIds: string[]): number {
  const counts = new Map<string, number>();
  for (const id of deckIds) {
    const card = getCard(id);
    if (['strike', 'defend', 'bolt', 'focus'].includes(id)) continue;
    for (const m of mechanismsOf(card)) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return Math.max(1, ...counts.values());
}

export function synergyDraftExperiment(o: RunExpOptions): ExperimentResult {
  const base = withPolicy(baseOf(o), { draftPool: 'all', valueSkill: 'smart', valueSeeds: 4 });
  const entries: RunEntry[] = [
    { name: 'every draftable card offered, random pick', policy: withPolicy(base, { pick: 'random' }) },
    { name: 'every draftable card offered, best by trial fights', policy: withPolicy(base, { pick: 'best' }) },
    { name: 'every draftable card offered, synergy-seeking (trial + mechanism overlap)', policy: withPolicy(base, { pick: 'synergy' }) },
    { name: 'reward pool only, best by trial fights (the live game\'s cards)', policy: withPolicy(base, { draftPool: 'reward', pick: 'best' }) },
  ];
  const rows = compareRuns(o.runs, o.baseSeed, entries);
  const conc = rows.map((r) => meanCI(r.records.map((x) => concentration(x.finalDeck))));
  const syn = rows.map((r) => pct(r.records.filter((x) => x.finalDeck.some((id) => SYNERGY_CARDS.some((c) => c.id === id))).length / r.records.length, 0));
  const markdown = [
    heading(2, 'Does a synergy-seeking draft assemble an engine?'),
    '',
    intro(o, 'The first row is the comparison base. "Engine concentration" = how many non-starter cards of the final deck share the most common mechanism label (1 = none do). "Runs holding a synergy card" counts final decks with at least one card from outside the live reward pool.'),
    '',
    runTable(rows),
    '',
    table(['variant', 'engine concentration [CI]', 'runs holding a synergy card'], rows.map((r, i) => [r.name, fmtCI(conc[i], 2), syn[i]])),
    '',
  ].join('\n');
  return { name: 'synergyDraft', json: { options: { ...o }, rows: rows.map(rowJson), concentration: conc.map((c) => r6(c.mean)) }, markdown };
}
