import { RunState } from '../game/RunState';
import type { FightTier, RunWorld } from '../game/RunState';
import { generateActMap } from '../game/actMap';
import type { MapNode, MapNodeKind, MapParams } from '../game/actMap';
import { Rng } from '../game/rng';
import type { CardDefinition, EnemyDefinition, RelicDefinition } from '../game/types';
import { MAGE, allDraftableCards, buildStarterDeck, getCard } from '../data/cards';
import { getEnemy } from '../data/enemies';
import { ACT_CONTENT, RUN_WORLD } from '../data/run';
import { getRelic } from '../data/relics';
import { unitSeed } from './engine';
import { runFight } from './fight';
import { rngStartFromSeed, rngStartOf } from './fightCore';
import { mergeMapParams } from './mapstats';
import type { SkillLevel } from './skills';

/**
 * The configurable whole-act simulator (the evidence toolkit's run model).
 *
 * It plays the real RunState through its PUBLIC API only. Everything the owner has not decided yet
 * is a PARAMETER here, applied in memory, so no tunable or data file is edited:
 *   - shop price (and price per energy cost), stock size, a buy policy, a card-removal service;
 *   - gold per reward, rest heal fraction;
 *   - map shape (any MapParams field, e.g. floors, lanes, paths, weights, first floors);
 *   - starting relics / gold;
 *   - the draft pool (reward pool only, or every draftable card including the synergy cards).
 * Mutation notes: ShopItem.price and RewardOffer.gold are plain fields of objects RunState hands
 * out, and gold, hp and deck are public fields; the simulator sets them instead of the tunables.
 * Nothing here changes how RunState works, and `playRunEx` with default parameters does not touch
 * the existing `playRun` (simulate.ts), which the committed baseline's drafts rely on.
 *
 * Everything is seeded: the same (seed, policy) always gives the same run. The bot's own choices use
 * a separate stream, so policies that differ only in a later decision share the run's randomness up
 * to the point where they diverge (that is what makes paired comparisons tight).
 */

// ---------- policy ----------

/** Card or gold at a fight reward. `gainBelow`: take gold when the best card adds less than this many HP per fight (trial-fight estimate). */
export type GoldRule = 'never' | 'always' | 'shop-ahead' | { gainBelow: number };
export type PickRule = 'random' | 'best' | 'synergy';
export type ShopBuyRule = 'none' | 'random' | 'best';
export type RemovalPick = 'none' | 'basic' | 'best';
export type RestRule = 'heal' | 'upgrade' | 'smart' | { healBelow: number };
export type PathStyle = 'random' | 'smart' | 'safe' | 'elite' | 'shop' | 'fight';
/** 'random' picks any choice; 'leave' the choice with the fewest outcomes; a map forces a choice per event id (others leave). */
export type EventRule = 'random' | 'leave' | Record<string, number>;

export interface RunPolicy {
  /** Bot that plays the fights. */
  skill: SkillLevel;
  /** Which cards fight rewards and shops draw from. */
  draftPool: 'reward' | 'all';
  pick: PickRule;
  gold: GoldRule;
  shopBuy: ShopBuyRule;
  /** A shop buy must add at least this many HP per fight (trial estimate) per purchase. */
  buyMinGain: number;
  /** Gold per shop card (and per energy of its cost). Real shops are undecided: this is the lever. */
  shopPrice: number;
  shopPricePerCost: number;
  /** How many of the shop's shelf items count as for sale (the engine rolls 4). */
  shopSlots: number;
  /** A shop service: pay `removalPrice` gold to remove one card (0 = no such service). */
  removalPrice: number;
  removalPick: RemovalPick;
  rest: RestRule;
  upgradePick: 'random' | 'best';
  /** Overrides REST_HEAL_FRACTION when set. */
  healFraction?: number;
  path: PathStyle;
  event: EventRule;
  /** Override the gold a normal / elite reward offers. */
  rewardGold?: number;
  eliteGold?: number;
  startRelics: string[];
  startGold: number;
  /** Added to max HP (and current HP) at the start: the calibration knob that turns any effect into "HP of budget". */
  bonusMaxHp: number;
  /** Map-shape overrides on top of the tunables' defaults (in memory). */
  map: Partial<MapParams>;
  /** Fights per valuation (card gain estimates), per candidate. */
  valueSeeds: number;
  /** Which bot values candidate cards (a cheaper bot is faster; `smart` understands synergy cards). */
  valueSkill: SkillLevel;
  /** Also score the final deck against the trial fights (paired by run seed). */
  measureFinal: boolean;
  /** At every rest stop, also measure what a heal and the possible upgrades are worth (costs extra fights; does not change play). */
  observeRest: boolean;
}

export const DEFAULT_RUN_POLICY: RunPolicy = {
  skill: 'smart',
  draftPool: 'reward',
  pick: 'best',
  gold: 'never',
  shopBuy: 'best',
  buyMinGain: 0,
  shopPrice: 40, // mirrors SHOP_CARD_PRICE today; a parameter, not a decision
  shopPricePerCost: 0,
  shopSlots: 4,
  removalPrice: 0,
  removalPick: 'none',
  rest: 'smart',
  upgradePick: 'random',
  path: 'smart',
  event: 'random',
  startRelics: [],
  startGold: 0,
  bonusMaxHp: 0,
  map: {},
  valueSeeds: 4,
  valueSkill: 'greedy',
  measureFinal: false,
  observeRest: false,
};

export const withPolicy = (base: RunPolicy, over: Partial<RunPolicy>): RunPolicy => ({ ...base, ...over, map: { ...base.map, ...(over.map ?? {}) } });

// ---------- valuation: how good is a deck? ----------

/** The fights a deck is judged on: two ordinary encounters, the first elite and the boss (from the act's lists). */
export function trialFights(): { id: string; enemies: EnemyDefinition[] }[] {
  const lists = [...ACT_CONTENT.encounters.slice(0, 2), ...ACT_CONTENT.elites.slice(0, 1), ...ACT_CONTENT.bosses.slice(0, 1)];
  return lists.map((ids) => ({ id: ids.join('+'), enemies: ids.map(getEnemy) }));
}

/**
 * Expected HP lost per fight, over the trial fights, for a deck at full HP (a lost fight counts as
 * all the HP brought). Lower is better. Fights use `seedBase` so two decks valued with the same
 * seedBase are PAIRED: the difference between their costs is a card's value in HP per fight.
 */
export function deckCost(deck: CardDefinition[], relics: RelicDefinition[], maxHp: number, seedBase: number, seeds: number, skill: SkillLevel): number {
  let total = 0;
  let n = 0;
  for (const fight of trialFights()) {
    for (let i = 0; i < seeds; i++) {
      const r = runFight({ deck, enemies: fight.enemies, player: { hp: maxHp, maxHp }, relics }, rngStartFromSeed(unitSeed(seedBase, fight.id, i)), skill);
      total += r.hpLost;
      n++;
    }
  }
  return total / n;
}

// ---------- tags / affinity for the synergy-seeking draft ----------

/** The labels a card carries that other cards can key on: tags, and the mechanisms it feeds or pays off on. */
export function mechanismsOf(card: CardDefinition): Set<string> {
  const out = new Set<string>(card.tags ?? []);
  const scan = (effects: { kind: string; status?: string; scaling?: { per: string; tag?: string } }[] | undefined): void => {
    for (const e of effects ?? []) {
      if (e.scaling) out.add(e.scaling.tag ? `tag:${e.scaling.tag}` : `scale:${e.scaling.per}`);
      if (e.kind === 'applyStatus' && e.status) out.add(`status:${e.status}`);
      if (e.kind === 'exhaustRandom') out.add('exhaust');
    }
  };
  scan(card.effects);
  if (card.onTurnStartEffect) scan([card.onTurnStartEffect]);
  for (const t of card.triggers ?? []) {
    out.add(`on:${t.on}`);
    if (t.tag) out.add(`tag:${t.tag}`);
    scan(t.effects);
  }
  if (card.exhaust) out.add('exhaust');
  for (const t of card.tags ?? []) out.add(`tag:${t}`);
  return out;
}

/** How many mechanism labels `card` shares with the deck's cards (each deck card counted once per shared label). */
export function affinity(card: CardDefinition, deck: CardDefinition[]): number {
  const mine = mechanismsOf(card);
  let score = 0;
  for (const d of deck) for (const m of mechanismsOf(d)) if (mine.has(m)) score++;
  return score;
}

// ---------- map helpers ----------

const nodeOf = (run: RunState, id: string): MapNode => run.map.nodes.find((n) => n.id === id)!;

/** Whether a shop is reachable from where the run stands (a stop's `next` chain, or the whole bottom floor). */
export function shopAhead(run: RunState): boolean {
  const seen = new Set<string>();
  const stack = run.position === null ? run.map.nodes.filter((n) => n.floor === 0).map((n) => n.id) : [...nodeOf(run, run.position).next];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = nodeOf(run, id);
    if (node.kind === 'shop') return true;
    stack.push(...node.next);
  }
  return false;
}

function pathScore(style: PathStyle, run: RunState, node: MapNode, policy: RunPolicy, jitter: number): number {
  const hurt = run.hp < run.maxHp * 0.6;
  const strong = run.hp >= run.maxHp * 0.75;
  const afford = run.gold >= policy.shopPrice;
  const table: Record<PathStyle, Record<MapNodeKind, number>> = {
    random: { combat: 0, event: 0, shop: 0, rest: 0, elite: 0, boss: 0 },
    // the same rule simulate.ts's chooseNode uses, with the shop price a parameter
    smart: { combat: 3, event: 2, shop: afford ? 4 : 1, rest: hurt ? 6 : 1, elite: strong ? 3.5 : -1, boss: 10 },
    safe: { combat: 3, event: 2.5, shop: afford ? 4 : 1, rest: hurt ? 6 : 2.5, elite: -5, boss: 10 },
    elite: { combat: 2, event: 2, shop: afford ? 3 : 1, rest: hurt ? 6 : 1, elite: hurt ? -1 : 6, boss: 10 },
    shop: { combat: 2, event: 2, shop: 6, rest: hurt ? 6 : 1.5, elite: strong ? 2 : -1, boss: 10 },
    fight: { combat: 5, event: 1, shop: 1, rest: hurt ? 6 : 0.5, elite: strong ? 3 : -1, boss: 10 },
  };
  return table[style][node.kind] + jitter * 0.5;
}

export function choosePathNode(run: RunState, policy: RunPolicy, rng: Rng): MapNode {
  const choices = run.mapChoices;
  if (policy.path === 'random') return choices[Math.floor(rng.next() * choices.length)];
  let best = choices[0];
  let bestScore = -Infinity;
  for (const n of choices) {
    const s = pathScore(policy.path, run, n, policy, rng.next());
    if (s > bestScore) {
      best = n;
      bestScore = s;
    }
  }
  return best;
}

// ---------- one run ----------

export interface FightLog {
  floor: number;
  tier: FightTier;
  enemies: string[];
  hpBefore: number;
  hpLost: number;
  won: boolean;
  turns: number;
  deckSize: number;
}

export interface RunRecord {
  seed: number;
  won: boolean;
  floorReached: number;
  lostTo?: string;
  fights: FightLog[];
  /** Stops visited, by kind (the boss excluded). */
  kinds: Record<string, number>;
  /** The kind of stop visited on each floor in order (index 0 = floor 1; the boss excluded). */
  trail: string[];
  rewardsCard: number;
  rewardsGold: number;
  goldGained: number;
  goldSpent: number;
  bought: string[];
  removed: string[];
  upgraded: string[];
  healed: number;
  restsHeal: number;
  restsUpgrade: number;
  /** One entry per rest stop (only with observeRest has the gain fields). */
  rests: { floor: number; hpBefore: number; maxHp: number; heal: number; bestUpgradeGain?: number; meanUpgradeGain?: number }[];
  relics: string[];
  finalDeck: string[];
  finalGold: number;
  finalMaxHp: number;
  /** HP the player carried into the boss fight (undefined if the run never got there). */
  hpAtBoss?: number;
  /** Deck cost (HP lost per trial fight) of the final deck; set when `measureFinal`. */
  finalCost?: number;
  /** Event ids met. */
  events: string[];
}

const baseId = (card: CardDefinition): string => card.upgradeOf ?? card.id;

/** The world a run draws from: the live pool, or every draftable card. */
export function worldFor(pool: 'reward' | 'all'): RunWorld {
  return pool === 'all' ? { ...RUN_WORLD, rewardPool: allDraftableCards(MAGE) } : RUN_WORLD;
}

/** A fresh run exactly as `newRun(seed)` makes it, but with the map parameters overridden in memory. */
export function newSimRun(seed: number, policy: RunPolicy): RunState {
  const rng = new Rng(seed);
  const map = generateActMap(rng, ACT_CONTENT, mergeMapParams(policy.map));
  const run = new RunState(map, buildStarterDeck(), worldFor(policy.draftPool), rng);
  for (const id of policy.startRelics) run.grantRelic(getRelic(id));
  run.takeNotice();
  run.gold = policy.startGold;
  run.maxHp += policy.bonusMaxHp;
  run.hp += policy.bonusMaxHp;
  return run;
}

const priceOf = (card: CardDefinition, policy: RunPolicy): number => Math.max(0, Math.round(policy.shopPrice + policy.shopPricePerCost * card.cost));

function leaveChoice(choices: { outcomes: unknown[] }[]): number {
  let best = 0;
  choices.forEach((c, i) => {
    if (c.outcomes.length < choices[best].outcomes.length) best = i;
  });
  return best;
}

/** Plays one act with the given policy. Deterministic in (seed, policy). */
export function playRunEx(seed: number, policy: RunPolicy = DEFAULT_RUN_POLICY): RunRecord {
  const run = newSimRun(seed, policy);
  const botRng = new Rng(seed ^ 0x9e3779b9);
  const rec: RunRecord = {
    seed,
    won: false,
    floorReached: 0,
    fights: [],
    kinds: {},
    trail: [],
    rewardsCard: 0,
    rewardsGold: 0,
    goldGained: 0,
    goldSpent: 0,
    bought: [],
    removed: [],
    upgraded: [],
    healed: 0,
    restsHeal: 0,
    restsUpgrade: 0,
    rests: [],
    relics: [],
    finalDeck: [],
    finalGold: 0,
    finalMaxHp: 0,
    events: [],
  };
  let lostTo: string | undefined;

  /** HP-per-fight value of the deck, valued on seeds shared by everything compared at this decision. */
  const valueSeed = (): number => botRng.nextSeed();
  const costOf = (deck: CardDefinition[], seedBase: number): number => deckCost(deck, run.relics, run.maxHp, seedBase, policy.valueSeeds, policy.valueSkill);
  const gains = (candidates: CardDefinition[]): number[] => {
    const sb = valueSeed();
    const base = costOf(run.deck, sb);
    return candidates.map((c) => base - costOf([...run.deck, c], sb));
  };

  for (let guard = 0; guard < 800 && run.phase !== 'won' && run.phase !== 'lost'; guard++) {
    if (run.phase === 'map') {
      const node = choosePathNode(run, policy, botRng);
      if (node.kind !== 'boss') {
        rec.kinds[node.kind] = (rec.kinds[node.kind] ?? 0) + 1;
        rec.trail.push(node.kind);
      }
      run.chooseNode(node.id);
      continue;
    }

    if (run.phase === 'reward') {
      const offer = run.pendingReward;
      if (!offer) throw new Error('reward phase without an offer');
      const elite = offer.relic !== undefined;
      if (elite && policy.eliteGold !== undefined) offer.gold = policy.eliteGold;
      if (!elite && policy.rewardGold !== undefined) offer.gold = policy.rewardGold;

      // which card would a card pick take? (trial-fight gains are only computed when a rule needs them)
      let index = 0;
      let bestGain = 0;
      if (policy.pick === 'random' && typeof policy.gold !== 'object') index = Math.floor(botRng.next() * offer.cards.length);
      else {
        const g = gains(offer.cards);
        // 'synergy': trial gain plus a small bonus for cards that share mechanisms with the deck
        const scores = policy.pick === 'synergy' ? g.map((x, i) => x + 0.25 * Math.min(8, affinity(offer.cards[i], run.deck))) : g;
        index = policy.pick === 'random' ? Math.floor(botRng.next() * offer.cards.length) : scores.indexOf(Math.max(...scores));
        bestGain = Math.max(...g);
      }
      const takeGold =
        policy.gold === 'always' ? true : policy.gold === 'never' ? false : policy.gold === 'shop-ahead' ? shopAhead(run) : bestGain < policy.gold.gainBelow;
      if (takeGold) {
        rec.rewardsGold++;
        rec.goldGained += offer.gold;
        run.takeRewardGold();
      } else {
        rec.rewardsCard++;
        run.takeRewardCard(index);
      }
      continue;
    }

    const node = run.currentNode;
    if (node.kind === 'combat') {
      const hpBefore = run.hp;
      const eventFight = run.eventFight !== null;
      const r = runFight({ deck: run.deck, enemies: node.enemies, player: { hp: run.hp, maxHp: run.maxHp }, relics: run.relics }, rngStartOf(run.newCombatRng()), policy.skill);
      rec.fights.push({
        floor: run.floor,
        tier: node.tier,
        enemies: node.enemies.map((e) => e.id),
        hpBefore,
        hpLost: hpBefore - r.hpAfter,
        won: r.result === 'won',
        turns: r.turns,
        deckSize: run.deck.length,
      });
      if (node.tier === 'boss') rec.hpAtBoss = hpBefore;
      if (r.result !== 'won') lostTo = eventFight ? 'event' : node.tier;
      run.finishCombat(r.result === 'won' ? 'won' : 'lost', r.hpAfter, r.turns);
    } else if (node.kind === 'rest') {
      const upgradable = run.upgradableCards;
      const restLog: RunRecord['rests'][number] = { floor: run.floor, hpBefore: run.hp, maxHp: run.maxHp, heal: run.restHealAmount };
      if (policy.observeRest && upgradable.length > 0) {
        const sb = (0x0b5e ^ seed ^ Math.imul(run.floor, 7919)) >>> 0; // its own seeds: observing never changes how the run is played
        const base = costOf(run.deck, sb);
        const seen = new Map<string, number>();
        for (const u of upgradable) if (!seen.has(u.card.id)) seen.set(u.card.id, base - costOf(run.deck.map((c, i) => (i === u.index ? run.upgradePreview(u.index)! : c)), sb));
        const g = [...seen.values()];
        restLog.bestUpgradeGain = Math.max(...g);
        restLog.meanUpgradeGain = upgradable.reduce((a, u) => a + seen.get(u.card.id)!, 0) / upgradable.length;
      }
      rec.rests.push(restLog);
      const hurt = typeof policy.rest === 'object' ? run.hp < run.maxHp * policy.rest.healBelow : run.hp < run.maxHp * 0.7;
      const wantUpgrade = policy.rest === 'upgrade' ? upgradable.length > 0 : policy.rest === 'heal' ? false : !hurt && upgradable.length > 0;
      if (wantUpgrade) {
        let pick = upgradable[Math.floor(botRng.next() * upgradable.length)];
        if (policy.upgradePick === 'best') {
          const sb = valueSeed();
          // one trial per distinct card, so a deck of four Strikes costs one valuation, not four
          const seen = new Set<string>();
          let bestCost = Infinity;
          for (const u of upgradable) {
            if (seen.has(u.card.id)) continue;
            seen.add(u.card.id);
            const up = run.upgradePreview(u.index)!;
            const deck = run.deck.map((c, i) => (i === u.index ? up : c));
            const c = costOf(deck, sb);
            if (c < bestCost) {
              bestCost = c;
              pick = u;
            }
          }
        }
        rec.upgraded.push(pick.card.id);
        run.upgradeCard(pick.index);
        rec.restsUpgrade++;
      } else {
        const before = run.hp;
        run.rest();
        if (policy.healFraction !== undefined) run.hp = Math.min(run.maxHp, before + Math.round(run.maxHp * policy.healFraction));
        rec.healed += run.hp - before;
        rec.restsHeal++;
      }
    } else if (node.kind === 'event') {
      const event = node.event;
      rec.events.push(event.id);
      let choice: number;
      if (policy.event === 'random') choice = Math.floor(botRng.next() * event.choices.length);
      else if (policy.event === 'leave') choice = leaveChoice(event.choices);
      else choice = policy.event[event.id] ?? leaveChoice(event.choices);
      const goldBefore = run.gold;
      run.chooseEventOption(choice);
      rec.goldGained += Math.max(0, run.gold - goldBefore);
    } else {
      shopVisit(run, policy, rec, botRng, gains, costOf, valueSeed);
    }
  }

  rec.won = run.phase === 'won';
  rec.floorReached = run.floor;
  rec.lostTo = run.phase === 'lost' ? lostTo : undefined;
  rec.relics = run.relics.map((r) => r.id);
  rec.finalDeck = run.deck.map(baseId);
  rec.finalGold = run.gold;
  rec.finalMaxHp = run.maxHp;
  if (policy.measureFinal) rec.finalCost = deckCost(run.deck, run.relics, run.maxHp, 0x5eed ^ seed, 6, policy.valueSkill);
  return rec;
}

/** One shop stop: price the shelf, buy by the policy, maybe remove a card, leave. */
function shopVisit(
  run: RunState,
  policy: RunPolicy,
  rec: RunRecord,
  botRng: Rng,
  gains: (c: CardDefinition[]) => number[],
  costOf: (deck: CardDefinition[], seedBase: number) => number,
  valueSeed: () => number
): void {
  const items = run.shopItems;
  for (const item of items) item.price = priceOf(item.card, policy);
  const forSale = (): number[] => items.map((it, i) => (it.sold || i >= policy.shopSlots || it.price > run.gold ? -1 : i)).filter((i) => i >= 0);
  const spendBefore = run.gold;

  if (policy.shopBuy === 'random') {
    const order = items.map((_, i) => i).sort(() => botRng.next() - 0.5);
    for (const i of order) {
      const card = items[i].card;
      if (i < policy.shopSlots && run.buyShopItem(i)) rec.bought.push(card.id);
    }
  } else if (policy.shopBuy === 'best') {
    for (let guard = 0; guard < items.length; guard++) {
      const open = forSale();
      if (open.length === 0) break;
      const g = gains(open.map((i) => items[i].card));
      const top = g.indexOf(Math.max(...g));
      if (g[top] < policy.buyMinGain) break;
      const card = items[open[top]].card;
      if (!run.buyShopItem(open[top])) break;
      rec.bought.push(card.id);
    }
  }

  if (policy.removalPrice > 0 && policy.removalPick !== 'none' && run.gold >= policy.removalPrice && run.deck.length > 5) {
    const idx = removalIndex(run, policy.removalPick, costOf, valueSeed);
    if (idx >= 0) {
      rec.removed.push(baseId(run.deck[idx]));
      run.deck.splice(idx, 1);
      run.gold -= policy.removalPrice;
    }
  }
  rec.goldSpent += spendBefore - run.gold;
  run.leaveShop();
}

/** Which card a removal service takes out: the most common starter card ('basic'), or the one whose removal helps most ('best'). */
function removalIndex(run: RunState, pick: RemovalPick, costOf: (deck: CardDefinition[], seedBase: number) => number, valueSeed: () => number): number {
  const starter = new Set(buildStarterDeck().map(baseId));
  if (pick === 'basic') {
    const counts = new Map<string, number>();
    for (const c of run.deck) if (starter.has(baseId(c)) && c.cost > 0 && (c.type !== 'power')) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    let best = '';
    for (const [id, n] of counts) if (best === '' || n > (counts.get(best) ?? 0)) best = id;
    return best === '' ? -1 : run.deck.findIndex((c) => c.id === best);
  }
  const sb = valueSeed();
  let bestCost = costOf(run.deck, sb);
  let bestIdx = -1;
  const seen = new Set<string>();
  run.deck.forEach((c, i) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    const cost = costOf(run.deck.filter((_, j) => j !== i), sb);
    if (cost < bestCost) {
      bestCost = cost;
      bestIdx = i;
    }
  });
  return bestIdx; // -1 when no removal helps
}

/** Plays `runs` consecutive seeds with one policy. */
export const playRuns = (runs: number, baseSeed: number, policy: RunPolicy): RunRecord[] => Array.from({ length: runs }, (_, i) => playRunEx(baseSeed + i, policy));

export { getCard };
