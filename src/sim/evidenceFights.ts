import type { CardDefinition, RelicDefinition } from '../game/types';
import { Rng } from '../game/rng';
import { MAGE, baseCards, buildStarterDeck, getCard, rewardPoolFor, upgradedVersion } from '../data/cards';
import { getEnemy } from '../data/enemies';
import { RELIC_POOL, SYNERGY_RELICS, getRelic } from '../data/relics';
import { PLAYER_MAX_HP } from '../data/tunables';
import { unitSeed } from './engine';
import { runFight } from './fight';
import { rngStartFromSeed } from './fightCore';
import { heading, r6, table } from './report';
import type { ExperimentResult } from './report';
import type { SkillLevel } from './skills';
import { fix, fmtCI, fmtDiff, meanCI, pairedDiff, pct, wilson } from './stats';
import type { Interval } from './stats';
import { actFights, referenceDeckSets, starterIds } from './suites';
import type { DeckSet, FightDef } from './suites';

/**
 * Fight-level evidence: what a card pick, a shop buy, a removal, a relic, a deck size or an upgrade
 * is worth, in HP per fight and win rate, from paired fights at full HP over the act's encounters.
 * Same pairing rule as the rest of the toolkit: unit i of every deck uses the same seed
 * (`unitSeed`), so differences cancel shuffle luck.
 */

export interface UnitSamples {
  win: Float64Array;
  hpLost: Float64Array;
  turns: Float64Array;
}

export interface UnitConfig {
  fights: FightDef[];
  seeds: number;
  baseSeed: number;
  skill: SkillLevel;
}

/** Outcomes of one deck (with optional relics and max HP) over every (fight, seed) unit. */
export function unitsOf(deck: CardDefinition[], cfg: UnitConfig, relics: RelicDefinition[] = [], maxHp: number = PLAYER_MAX_HP): UnitSamples {
  const n = cfg.fights.length * cfg.seeds;
  const out: UnitSamples = { win: new Float64Array(n), hpLost: new Float64Array(n), turns: new Float64Array(n) };
  cfg.fights.forEach((fight, fi) => {
    const enemies = fight.enemies.map(getEnemy);
    for (let i = 0; i < cfg.seeds; i++) {
      const r = runFight({ deck, enemies, player: { hp: maxHp, maxHp }, relics }, rngStartFromSeed(unitSeed(cfg.baseSeed, fight.id, i)), cfg.skill);
      const u = fi * cfg.seeds + i;
      out.win[u] = r.result === 'won' ? 1 : 0;
      out.hpLost[u] = r.hpLost;
      out.turns[u] = r.turns;
    }
  });
  return out;
}

const concat = (parts: Float64Array[]): Float64Array => {
  const out = new Float64Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

/** Paired effect `b - a` for each metric. */
const effect = (a: UnitSamples, b: UnitSamples): Record<'win' | 'hpLost' | 'turns', Interval> => ({
  win: pairedDiff(a.win, b.win),
  hpLost: pairedDiff(a.hpLost, b.hpLost),
  turns: pairedDiff(a.turns, b.turns),
});

const hp = (d: Interval): string => fmtDiff(d, 2);
const pts = (d: Interval): string => `${fmtDiff({ mean: d.mean * 100, lo: d.lo * 100, hi: d.hi * 100 })} pts`;

export interface FightEvidenceOptions {
  seeds: number;
  baseSeed: number;
  skill: SkillLevel;
}

const cfgOf = (o: FightEvidenceOptions, fights?: FightDef[]): UnitConfig => ({ fights: fights ?? actFights(), seeds: o.seeds, baseSeed: o.baseSeed, skill: o.skill });

/** The core reference decks, flattened with their stage names. */
function stageDecks(): { stage: string; deck: CardDefinition[] }[] {
  const sets: DeckSet[] = referenceDeckSets();
  return sets.flatMap((s) => s.decks.map((d, i) => ({ stage: s.decks.length > 1 ? `${s.name}#${i + 1}` : s.name, deck: d })));
}

// =====================================================================================
// what is a card pick worth? (and a shop buy, a removal)
// =====================================================================================

export interface PickRow {
  stage: string;
  /** Mean HP per fight saved by adding one random reward card. */
  random: number;
  best3: number;
  best4: number;
  /** Share of 3-card offers whose best card adds no more than 0.5 HP per fight. */
  weakOffer3: number;
  /** Best single removal (HP per fight saved; the deck loses a card). */
  bestRemoval: number;
  basicRemoval: number;
  /** Win-rate points added by the best single card (any of the pool). */
  bestWin: number;
}

/**
 * The currency table. For each deck stage, every reward-pool card is added (paired) and the HP per
 * fight it saves recorded; best-of-3 and best-of-4 are then the expected maximum over random offers
 * of that many distinct cards (a card's value is taken as its measured mean, i.e. a player who
 * judges cards perfectly, which flatters picking). A removal is the same measurement for taking a
 * card OUT.
 */
export function pickExperiment(o: FightEvidenceOptions & { offers?: number }): ExperimentResult {
  const cfg = cfgOf(o);
  const pool = rewardPoolFor(MAGE);
  const starter = starterIds();
  const rows: PickRow[] = [];
  const cardRows: Map<string, number[]> = new Map();
  const bestWins: number[] = [];
  const offers = o.offers ?? 3000;
  for (const { stage, deck } of stageDecks()) {
    const base = unitsOf(deck, cfg);
    const gain = new Map<string, number>();
    const winGain = new Map<string, number>();
    for (const c of pool) {
      const e = effect(base, unitsOf([...deck, c], cfg));
      gain.set(c.id, -e.hpLost.mean);
      winGain.set(c.id, e.win.mean);
      cardRows.set(c.id, [...(cardRows.get(c.id) ?? []), -e.hpLost.mean]);
    }
    const rng = new Rng(7000 + stage.length * 13);
    const draw = (k: number): number[] => {
      const bag = [...pool];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      return bag.slice(0, k).map((c) => gain.get(c.id)!);
    };
    let b3 = 0;
    let b4 = 0;
    let weak = 0;
    for (let i = 0; i < offers; i++) {
      const g3 = draw(3);
      const m3 = Math.max(...g3);
      b3 += m3;
      if (m3 <= 0.5) weak++;
      b4 += Math.max(...draw(4));
    }
    // removals: take one copy of each distinct card out
    const seen = new Set<string>();
    let bestRemoval = -Infinity;
    let basicRemoval = -Infinity;
    deck.forEach((c, i) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      const without = deck.filter((_, j) => j !== i);
      const g = -effect(base, unitsOf(without, cfg)).hpLost.mean;
      bestRemoval = Math.max(bestRemoval, g);
      if (starter.has(c.id) && c.type !== 'power' && c.cost > 0 && c.id !== 'bolt') basicRemoval = Math.max(basicRemoval, g);
    });
    const bw = Math.max(...winGain.values());
    bestWins.push(bw);
    rows.push({
      stage,
      random: [...gain.values()].reduce((a, b) => a + b, 0) / gain.size,
      best3: b3 / offers,
      best4: b4 / offers,
      weakOffer3: weak / offers,
      bestRemoval,
      basicRemoval: Number.isFinite(basicRemoval) ? basicRemoval : NaN,
      bestWin: bw,
    });
  }
  const cardTable = [...cardRows.entries()]
    .map(([id, xs]) => [id, getCard(id).cost, fix(xs.reduce((a, b) => a + b, 0) / xs.length, 2), fix(Math.min(...xs), 2), fix(Math.max(...xs), 2)] as (string | number)[])
    .sort((a, b) => Number(b[2]) - Number(a[2]));
  const markdown = [
    heading(2, 'What one card is worth (HP per fight saved)'),
    '',
    `${cfg.fights.length} act fights x ${cfg.seeds} seeds per deck, ${o.skill} bot, full HP each fight. Positive = fewer HP lost per fight than the deck without the card. Best-of-k = expected maximum over ${offers} random offers of k distinct reward-pool cards, taking each card's measured value (a perfect judge). Removal = HP per fight saved by taking the single best card out (and the best Strike/Defend-type starter card out).`,
    '',
    table(
      ['deck stage', 'one random card', 'best of 3 (reward)', 'best of 4 (shop)', 'offers whose best card adds <= 0.5', 'best single removal', 'best basic-card removal', 'win-rate points of the best card'],
      rows.map((r) => [r.stage, fix(r.random, 2), fix(r.best3, 2), fix(r.best4, 2), pct(r.weakOffer3, 0), fix(r.bestRemoval, 2), Number.isFinite(r.basicRemoval) ? fix(r.basicRemoval, 2) : '-', fix(r.bestWin * 100, 1)])
    ),
    '',
    heading(3, 'Each reward card, averaged over the stages'),
    '',
    table(['card', 'cost', 'mean HP/fight saved', 'worst stage', 'best stage'], cardTable),
    '',
  ].join('\n');
  return { name: 'picks', json: { options: { ...o }, stages: rows.map((r) => ({ ...r, random: r6(r.random), best3: r6(r.best3), best4: r6(r.best4), weakOffer3: r6(r.weakOffer3), bestRemoval: r6(r.bestRemoval), basicRemoval: Number.isFinite(r.basicRemoval) ? r6(r.basicRemoval) : null, bestWin: r6(r.bestWin) })), cards: cardTable }, markdown };
}

// =====================================================================================
// relics at fight level
// =====================================================================================

export function relicFightExperiment(o: FightEvidenceOptions & { ids?: string[] }): ExperimentResult {
  const cfg = cfgOf(o);
  const relics = (o.ids ?? [...RELIC_POOL, ...SYNERGY_RELICS].map((r) => r.id)).map(getRelic);
  const sets = referenceDeckSets({ synergy: true });
  const groups: { name: string; decks: CardDefinition[][] }[] = [
    { name: 'starter', decks: sets.find((s) => s.name === 'starter')!.decks },
    { name: 'mid', decks: sets.find((s) => s.name === 'mid')!.decks },
    { name: 'late', decks: sets.find((s) => s.name === 'late')!.decks },
    { name: 'synergy decks', decks: sets.filter((s) => s.name.startsWith('syn-')).flatMap((s) => s.decks) },
  ];
  const baseByGroup = groups.map((g) => g.decks.map((d) => unitsOf(d, cfg)));
  const rows: (string | number)[][] = [];
  const json: object[] = [];
  for (const relic of relics) {
    const maxHp = PLAYER_MAX_HP + (relic.onPickup ?? []).reduce((a, e) => a + (e.kind === 'maxHp' ? e.value : 0), 0);
    const healPerWin = (relic.onVictory ?? []).reduce((a, e) => a + (e.kind === 'heal' ? e.value : 0), 0);
    const cells: string[] = [];
    const per: Record<string, object> = {};
    groups.forEach((g, gi) => {
      const withR = g.decks.map((d) => unitsOf(d, cfg, [relic], maxHp));
      const a = { win: concat(baseByGroup[gi].map((x) => x.win)), hpLost: concat(baseByGroup[gi].map((x) => x.hpLost)), turns: concat(baseByGroup[gi].map((x) => x.turns)) };
      const b = { win: concat(withR.map((x) => x.win)), hpLost: concat(withR.map((x) => x.hpLost)), turns: concat(withR.map((x) => x.turns)) };
      const e = effect(a, b);
      cells.push(`${hp(e.hpLost)} HP; ${pts(e.win)}`);
      per[g.name] = { hpLost: r6(e.hpLost.mean), win: r6(e.win.mean) };
    });
    rows.push([relic.id, ...cells, healPerWin > 0 ? `+${healPerWin} HP per fight won` : '-', maxHp !== PLAYER_MAX_HP ? `+${maxHp - PLAYER_MAX_HP} max HP once` : '-']);
    json.push({ relic: relic.id, ...per, healPerWin, maxHpGain: maxHp - PLAYER_MAX_HP });
  }
  const markdown = [
    heading(2, 'Relics at fight level'),
    '',
    `${cfg.fights.length} act fights x ${cfg.seeds} seeds, ${o.skill} bot, every deck of the group with and without the relic (paired). Cell = change in HP lost per fight [95% CI] (negative = the relic saves HP); win-rate change in points. Fights start at full HP (a +max-HP relic starts at its higher max, and a lost fight then counts that many HP, so read its win-rate cell, not its HP cell). Relics that act between fights (heal after a win, max HP once) are shown in the last two columns instead of in the fight.`,
    '',
    table(['relic', ...groups.map((g) => g.name), 'between fights', 'on pickup'], rows),
    '',
  ].join('\n');
  return { name: 'relicFights', json: { options: { ...o }, rows: json }, markdown };
}

// =====================================================================================
// deck size
// =====================================================================================

export function deckSizeExperiment(o: FightEvidenceOptions & { samples: number; sizes?: number[] }): ExperimentResult {
  const cfg = cfgOf(o);
  const pool = rewardPoolFor(MAGE);
  const starter = buildStarterDeck();
  const baseUnits = unitsOf(starter, cfg);
  const sizes = o.sizes ?? [6, 8, 10, 12, 14, 16, 20, 25, 30];
  const build = (size: number, j: number): CardDefinition[] => {
    const rng = new Rng(11000 + j * 37 + size);
    const deck = [...starter];
    if (size < deck.length) {
      // thin: remove Strikes then Defends, as a removal service would, leaving Bolt and Focus
      const order = [...deck.keys()].filter((i) => deck[i].id === 'strike' || deck[i].id === 'defend').sort((a, b) => (deck[a].id === deck[b].id ? 0 : deck[a].id === 'strike' ? -1 : 1));
      const drop = new Set(order.slice(0, deck.length - size));
      return deck.filter((_, i) => !drop.has(i));
    }
    const bag: CardDefinition[] = [];
    while (deck.length < size) {
      if (bag.length === 0) bag.push(...pool);
      deck.push(bag.splice(Math.floor(rng.next() * bag.length), 1)[0]);
    }
    return deck;
  };
  const rows: (string | number)[][] = [];
  const json: object[] = [];
  for (const size of sizes) {
    const js = size === starter.length ? [0] : Array.from({ length: o.samples }, (_, j) => j);
    const withDecks = js.map((j) => unitsOf(build(size, j), cfg));
    const e = effect({ win: concat(js.map(() => baseUnits.win)), hpLost: concat(js.map(() => baseUnits.hpLost)), turns: concat(js.map(() => baseUnits.turns)) }, { win: concat(withDecks.map((x) => x.win)), hpLost: concat(withDecks.map((x) => x.hpLost)), turns: concat(withDecks.map((x) => x.turns)) });
    const abs = meanCI(concat(withDecks.map((x) => x.hpLost)));
    rows.push([size, size < starter.length ? 'thinned (Strikes, then Defends, removed)' : size === starter.length ? 'the starter deck' : 'plus random reward cards', fmtCI(abs), hp(e.hpLost), pts(e.win), fmtDiff(e.turns, 2)]);
    json.push({ size, hpLost: r6(abs.mean), dHpLost: r6(e.hpLost.mean), dWin: r6(e.win.mean), dTurns: r6(e.turns.mean) });
  }
  // thin-and-add grid
  const grid: (string | number)[][] = [];
  const adds = [0, 3, 6, 10];
  const removes = [0, 2, 4];
  const cell = (m: number, r: number): string => {
    const js = Array.from({ length: o.samples }, (_, j) => j);
    const decks = js.map((j) => {
      const rng = new Rng(15000 + j * 41 + m);
      const bag: CardDefinition[] = [];
      const added: CardDefinition[] = [];
      for (let i = 0; i < m; i++) {
        if (bag.length === 0) bag.push(...pool);
        added.push(bag.splice(Math.floor(rng.next() * bag.length), 1)[0]);
      }
      const kept = [...starter];
      let rem = r;
      for (const id of ['strike', 'defend', 'strike', 'defend']) {
        const at = kept.findIndex((c) => c.id === id);
        if (rem > 0 && at >= 0) {
          kept.splice(at, 1);
          rem--;
        }
      }
      return [...kept, ...added];
    });
    const units = decks.map((d) => unitsOf(d, cfg));
    const e = effect({ win: concat(js.map(() => baseUnits.win)), hpLost: concat(js.map(() => baseUnits.hpLost)), turns: concat(js.map(() => baseUnits.turns)) }, { win: concat(units.map((x) => x.win)), hpLost: concat(units.map((x) => x.hpLost)), turns: concat(units.map((x) => x.turns)) });
    return hp(e.hpLost);
  };
  for (const m of adds) grid.push([`+${m} random cards`, ...removes.map((r) => cell(m, r))]);
  const markdown = [
    heading(2, 'Deck size: thin versus fat'),
    '',
    `${o.samples} sampled decks per size x ${cfg.fights.length} act fights x ${cfg.seeds} seeds, ${o.skill} bot, full HP. Effect = change in HP lost per fight against the starter deck, paired (negative = better). Sampled additions are random reward cards, not a drafted deck, so a drafted deck of the same size does better than these.`,
    '',
    table(['deck size', 'built as', 'HP lost per fight [CI]', 'change vs starter (HP/fight)', 'win-rate change', 'turns change'], rows),
    '',
    heading(3, 'Add and remove together: change in HP lost per fight vs the starter deck'),
    '',
    table(['cards added \\ basic cards removed', ...removes.map((r) => String(r))], grid),
    '',
  ].join('\n');
  return { name: 'decksize', json: { options: { ...o }, rows: json }, markdown };
}

// =====================================================================================
// upgrade value per card
// =====================================================================================

export function upgradeExperiment(o: FightEvidenceOptions): ExperimentResult {
  const cfg = cfgOf(o);
  const mids = referenceDeckSets().find((s) => s.name === 'mid')!.decks;
  const ids = baseCards().filter((c) => c.upgrade && (c.inRewardPool || ['strike', 'defend', 'bolt', 'focus'].includes(c.id))).map((c) => c.id);
  const rows: (string | number)[][] = [];
  const json: object[] = [];
  const baseUnits = mids.map((d) => unitsOf(d, cfg));
  for (const id of ids) {
    const card = getCard(id);
    const up = upgradedVersion(card)!;
    const inDeck = (d: CardDefinition[]): boolean => d.some((c) => c.id === id);
    // context: the mid decks, with one copy of the card added if they do not already hold it
    const plain = mids.map((d) => (inDeck(d) ? d : [...d, card]));
    const upgraded = plain.map((d) => {
      const at = d.findIndex((c) => c.id === id);
      return d.map((c, i) => (i === at ? up : c));
    });
    const p = plain.map((d) => unitsOf(d, cfg));
    const u = upgraded.map((d) => unitsOf(d, cfg));
    const cat = (xs: UnitSamples[]): UnitSamples => ({ win: concat(xs.map((x) => x.win)), hpLost: concat(xs.map((x) => x.hpLost)), turns: concat(xs.map((x) => x.turns)) });
    const eUp = effect(cat(p), cat(u));
    const wasIn = mids.map(inDeck);
    // the card's own worth: only for decks that did not already hold it
    const addIdx = wasIn.map((w, i) => (w ? -1 : i)).filter((i) => i >= 0);
    const eAdd = addIdx.length > 0 ? effect(cat(addIdx.map((i) => baseUnits[i])), cat(addIdx.map((i) => p[i]))) : undefined;
    rows.push([id, card.cost, up.cost !== card.cost ? `${card.cost} -> ${up.cost}` : '-', hp(eUp.hpLost), pts(eUp.win), eAdd ? hp(eAdd.hpLost) : 'in the deck already']);
    json.push({ card: id, dHpLost: r6(eUp.hpLost.mean), lo: r6(eUp.hpLost.lo), hi: r6(eUp.hpLost.hi), dWin: r6(eUp.win.mean), addHpLost: eAdd ? r6(eAdd.hpLost.mean) : null });
  }
  rows.sort((a, b) => parseFloat(String(a[3])) - parseFloat(String(b[3])));
  const markdown = [
    heading(2, 'What one upgrade is worth, per card'),
    '',
    `The three sampled mid decks (starter + 5 cards), with one copy of the card added when the deck lacks it; the upgraded version replaces it (paired, ${cfg.fights.length} act fights x ${cfg.seeds} seeds, ${o.skill} bot). Negative = fewer HP lost per fight. For comparison the last column is what ADDING the plain card is worth in the same decks.`,
    '',
    table(['card', 'cost', 'cost change', 'upgrade: change in HP lost per fight [CI]', 'upgrade: win rate', 'adding the plain card (HP/fight)'], rows),
    '',
  ].join('\n');
  return { name: 'upgrades', json: { options: { ...o }, rows: json }, markdown };
}


