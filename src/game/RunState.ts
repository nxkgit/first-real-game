import type { CardDefinition, EnemyDefinition } from './types';
import { Rng, randomSeed } from './rng';
import {
  PLAYER_MAX_HP,
  REST_HEAL_FRACTION,
  REWARD_CARD_CHOICES,
  REWARD_GOLD,
  SHOP_CARD_COUNT,
  SHOP_CARD_PRICE,
} from '../data/tunables';

/** One stop on the run's linear path. */
export type RunNode = { kind: 'combat'; enemies: EnemyDefinition[] } | { kind: 'rest' } | { kind: 'shop' };

/** One card on a shop shelf. */
export interface ShopItem {
  card: CardDefinition;
  price: number;
  sold: boolean;
}

/** Offered after winning a fight: take one of `cards` into the deck, or take `gold` instead. */
export interface RewardOffer {
  cards: CardDefinition[];
  gold: number;
}

/**
 * - inNode: playing the current node (a fight, a rest stop, or a shop)
 * - reward: just won a fight, choosing card vs gold
 * - won / lost: run over
 */
export type RunPhase = 'inNode' | 'reward' | 'won' | 'lost';

/** What happened at each stop, kept for playtest reports. Plain data; card and enemy names are ids. */
export type RunLogEntry =
  | { kind: 'combat'; floor: number; enemies: string[]; result: 'won' | 'lost'; turns: number; hpAfter: number }
  | { kind: 'reward'; floor: number; offered: string[]; choice: 'card' | 'gold'; cardId?: string }
  | { kind: 'rest'; floor: number; healed: number }
  | { kind: 'shop'; floor: number; bought: string[]; goldSpent: number };

/** A run in a form that can be stored and restored (cards by id). Bump `version` if this changes. */
export interface SavedRun {
  version: 1;
  seed: number;
  rngPosition: number;
  nodeCount: number;
  nodeIndex: number;
  phase: RunPhase;
  hp: number;
  maxHp: number;
  gold: number;
  deck: string[];
  pendingReward: { cards: string[]; gold: number } | null;
  shop: { card: string; price: number; sold: boolean }[] | null;
  history: RunLogEntry[];
}

/**
 * Pure run-level state for MVP 2's short linear run: what carries between fights (HP, deck,
 * gold) and where the player is on the path. Independent of Phaser, like CombatState —
 * scenes read it and call its methods. All randomness (rewards, shop stock, and the seed of
 * each fight's shuffles) comes from one seeded stream, so a run replays exactly and can be saved.
 */
export class RunState {
  deck: CardDefinition[];
  hp: number;
  maxHp = PLAYER_MAX_HP;
  gold = 0;
  nodeIndex = 0;
  phase: RunPhase = 'inNode';
  pendingReward: RewardOffer | null = null;
  /** What has happened so far, for the playtest report. */
  history: RunLogEntry[] = [];
  /** Stock of the shop at the current node; rolled the first time it is looked at. */
  private shopStock: ShopItem[] | null = null;

  readonly nodes: RunNode[];
  readonly rng: Rng;
  private readonly rewardPool: CardDefinition[];

  constructor(nodes: RunNode[], starterDeck: CardDefinition[], rewardPool: CardDefinition[], rng: Rng = new Rng(randomSeed())) {
    if (nodes.length === 0) throw new Error('a run needs at least one node');
    this.nodes = nodes;
    this.rewardPool = rewardPool;
    this.rng = rng;
    this.deck = [...starterDeck];
    this.hp = this.maxHp;
  }

  get seed(): number {
    return this.rng.seed;
  }

  get currentNode(): RunNode {
    return this.nodes[Math.min(this.nodeIndex, this.nodes.length - 1)];
  }

  /** 1-based position on the path, for display. */
  get floor(): number {
    return Math.min(this.nodeIndex + 1, this.nodes.length);
  }

  get totalFloors(): number {
    return this.nodes.length;
  }

  /** The random stream for the fight about to start. Draws from the run's stream, so a saved run
   *  that is resumed gets the very same shuffles. */
  newCombatRng(): Rng {
    return new Rng(this.rng.nextSeed());
  }

  /** Called when the current fight ends, with the player's HP at that point and how many turns it took. */
  finishCombat(result: 'won' | 'lost', hpAfter: number, turns = 0): void {
    this.requireNode('combat');
    const node = this.currentNode;
    this.hp = Math.max(0, Math.min(this.maxHp, hpAfter));
    this.history.push({
      kind: 'combat',
      floor: this.floor,
      enemies: node.kind === 'combat' ? node.enemies.map((e) => e.id) : [],
      result,
      turns,
      hpAfter: this.hp,
    });
    if (result === 'lost') {
      this.phase = 'lost';
    } else if (this.nodeIndex === this.nodes.length - 1) {
      this.advance(); // won the final fight: the run is won, no reward to pick
    } else {
      this.pendingReward = { cards: this.rollCards(REWARD_CARD_CHOICES), gold: REWARD_GOLD };
      this.phase = 'reward';
    }
  }

  takeRewardCard(index: number): void {
    const offer = this.requireReward();
    const card = offer.cards[index];
    if (!card) throw new Error(`no reward card at index ${index}`);
    this.deck.push(card);
    this.history.push({
      kind: 'reward',
      floor: this.floor,
      offered: offer.cards.map((c) => c.id),
      choice: 'card',
      cardId: card.id,
    });
    this.advance();
  }

  takeRewardGold(): void {
    const offer = this.requireReward();
    this.gold += offer.gold;
    this.history.push({ kind: 'reward', floor: this.floor, offered: offer.cards.map((c) => c.id), choice: 'gold' });
    this.advance();
  }

  /** HP a rest would restore right now (capped at max HP). */
  get restHealAmount(): number {
    return Math.min(this.maxHp - this.hp, Math.round(this.maxHp * REST_HEAL_FRACTION));
  }

  /** Rest at the current rest stop: heal, then move on. Returns the HP actually restored. */
  rest(): number {
    this.requireNode('rest');
    const healed = this.restHealAmount;
    this.hp += healed;
    this.history.push({ kind: 'rest', floor: this.floor, healed });
    this.advance();
    return healed;
  }

  /** What the current shop node has for sale (DRAFT). */
  get shopItems(): ShopItem[] {
    this.requireNode('shop');
    if (!this.shopStock) {
      this.shopStock = this.rollCards(SHOP_CARD_COUNT).map((card) => ({ card, price: SHOP_CARD_PRICE, sold: false }));
    }
    return this.shopStock;
  }

  /** Buys the shelf item if it is unsold and affordable. Returns whether the purchase happened. */
  buyShopItem(index: number): boolean {
    const item = this.shopItems[index];
    if (!item || item.sold || item.price > this.gold) return false;
    this.gold -= item.price;
    item.sold = true;
    this.deck.push(item.card);
    return true;
  }

  leaveShop(): void {
    const bought = this.shopItems.filter((i) => i.sold);
    this.history.push({
      kind: 'shop',
      floor: this.floor,
      bought: bought.map((i) => i.card.id),
      goldSpent: bought.reduce((sum, i) => sum + i.price, 0),
    });
    this.advance();
  }

  /** Dev tool: move to another stop, dropping whatever was pending. */
  jumpTo(index: number): void {
    if (index < 0 || index >= this.nodes.length) throw new Error(`no node ${index}`);
    this.pendingReward = null;
    this.shopStock = null;
    this.nodeIndex = index;
    this.phase = 'inNode';
  }

  /** The run as plain data, for saving. */
  toSaved(): SavedRun {
    return {
      version: 1,
      seed: this.rng.seed,
      rngPosition: this.rng.position,
      nodeCount: this.nodes.length,
      nodeIndex: this.nodeIndex,
      phase: this.phase,
      hp: this.hp,
      maxHp: this.maxHp,
      gold: this.gold,
      deck: this.deck.map((c) => c.id),
      pendingReward: this.pendingReward
        ? { cards: this.pendingReward.cards.map((c) => c.id), gold: this.pendingReward.gold }
        : null,
      shop: this.shopStock ? this.shopStock.map((i) => ({ card: i.card.id, price: i.price, sold: i.sold })) : null,
      history: this.history.map((e) => ({ ...e })),
    };
  }

  /** Rebuilds a run from a save. `lookup` turns a card id back into its definition (and throws if unknown). */
  static fromSaved(
    saved: SavedRun,
    nodes: RunNode[],
    rewardPool: CardDefinition[],
    lookup: (id: string) => CardDefinition
  ): RunState {
    const run = new RunState(nodes, [], rewardPool, Rng.restore(saved.seed, saved.rngPosition));
    run.deck = saved.deck.map(lookup);
    run.hp = saved.hp;
    run.maxHp = saved.maxHp;
    run.gold = saved.gold;
    run.nodeIndex = saved.nodeIndex;
    run.phase = saved.phase;
    run.pendingReward = saved.pendingReward
      ? { cards: saved.pendingReward.cards.map(lookup), gold: saved.pendingReward.gold }
      : null;
    run.shopStock = saved.shop ? saved.shop.map((i) => ({ card: lookup(i.card), price: i.price, sold: i.sold })) : null;
    run.history = saved.history.map((e) => ({ ...e }));
    return run;
  }

  private advance(): void {
    this.pendingReward = null;
    this.shopStock = null;
    this.nodeIndex += 1;
    this.phase = this.nodeIndex >= this.nodes.length ? 'won' : 'inNode';
  }

  /** Up to `count` distinct cards from the reward pool, in random order. */
  private rollCards(count: number): CardDefinition[] {
    const pool = [...new Set(this.rewardPool)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  private requireNode(kind: RunNode['kind']): void {
    if (this.phase !== 'inNode' || this.currentNode.kind !== kind) {
      throw new Error(`expected to be in a ${kind} node, but phase is ${this.phase} at ${this.currentNode.kind}`);
    }
  }

  private requireReward(): RewardOffer {
    if (this.phase !== 'reward' || !this.pendingReward) throw new Error('no reward is pending');
    return this.pendingReward;
  }
}
