import type {
  CardDefinition,
  EnemyDefinition,
  EventDefinition,
  EventOutcome,
  RelicDefinition,
  RunEffect,
} from './types';
import type { ActMap, MapNode } from './actMap';
import { Rng, randomSeed } from './rng';
import {
  ELITE_REWARD_GOLD,
  PLAYER_MAX_HP,
  REST_HEAL_FRACTION,
  REWARD_CARD_CHOICES,
  REWARD_GOLD,
  SHOP_CARD_COUNT,
  SHOP_CARD_PRICE,
} from '../data/tunables';

export type FightTier = 'normal' | 'elite' | 'boss';

/** What the current stop is, with its content looked up. */
export type RunNode =
  | { kind: 'combat'; tier: FightTier; enemies: EnemyDefinition[] }
  | { kind: 'rest' }
  | { kind: 'shop' }
  | { kind: 'event'; event: EventDefinition };

/** Everything the run needs to look up or draw from: the content of the game. */
export interface RunWorld {
  rewardPool: CardDefinition[];
  relicPool: RelicDefinition[];
  card(id: string): CardDefinition;
  relic(id: string): RelicDefinition;
  enemy(id: string): EnemyDefinition;
  event(id: string): EventDefinition;
}

/** One card on a shop shelf. */
export interface ShopItem {
  card: CardDefinition;
  price: number;
  sold: boolean;
}

/** Offered after winning a fight: take one of `cards` into the deck, or take `gold` instead. An elite also drops a `relic`, which comes either way. */
export interface RewardOffer {
  cards: CardDefinition[];
  gold: number;
  relic?: RelicDefinition;
}

/**
 * - map: between stops, choosing where to go next
 * - inNode: at a stop (a fight, a rest stop, a shop, or an event)
 * - reward: just won a fight, choosing card vs gold
 * - won / lost: run over (winning means beating the boss)
 */
export type RunPhase = 'map' | 'inNode' | 'reward' | 'won' | 'lost';

/** What happened at each stop, kept for playtest reports. Plain data; cards, enemies and relics are ids. */
export type RunLogEntry =
  | { kind: 'combat'; floor: number; tier: FightTier; enemies: string[]; result: 'won' | 'lost'; turns: number; hpAfter: number }
  | { kind: 'reward'; floor: number; offered: string[]; choice: 'card' | 'gold'; cardId?: string; relicId?: string }
  | { kind: 'rest'; floor: number; choice: 'heal' | 'upgrade'; healed?: number; cardId?: string }
  | { kind: 'shop'; floor: number; bought: string[]; goldSpent: number }
  | { kind: 'event'; floor: number; eventId: string; choice: string };

/** A fight started by an event: who to fight, and the event outcomes still to apply if you win. */
export interface EventFight {
  enemies: string[];
  after: EventOutcome[];
}

/** A run in a form that can be stored and restored (content by id). Bump `version` if this changes. */
export interface SavedRun {
  version: 2;
  seed: number;
  rngPosition: number;
  map: ActMap;
  position: string | null;
  visited: string[];
  phase: RunPhase;
  hp: number;
  maxHp: number;
  gold: number;
  deck: string[];
  relics: string[];
  pendingReward: { cards: string[]; gold: number; relic: string | null } | null;
  shop: { card: string; price: number; sold: boolean }[] | null;
  eventFight: EventFight | null;
  notice: string[];
  history: RunLogEntry[];
}

/**
 * Pure run-level state for one act: where you are on the map, and what you carry between stops
 * (HP, deck, relics, gold). Independent of Phaser, like CombatState: scenes read it and call its
 * methods. All randomness (rewards, shop stock, events, and the seed of each fight's shuffles)
 * comes from one seeded stream, so a run replays exactly and can be saved.
 */
export class RunState {
  deck: CardDefinition[];
  relics: RelicDefinition[] = [];
  hp: number;
  maxHp = PLAYER_MAX_HP;
  gold = 0;
  phase: RunPhase = 'map';
  pendingReward: RewardOffer | null = null;
  /** Where you are: a map stop's id, or null before the first stop. */
  position: string | null = null;
  visited: string[] = [];
  /** A fight an event started, standing in for the stop's own contents until it is over. */
  eventFight: EventFight | null = null;
  /** Lines to show the player once (what an event fight or elite gave them). See takeNotice. */
  private notice: string[] = [];
  /** What has happened so far, for the playtest report. */
  history: RunLogEntry[] = [];
  /** Stock of the shop at the current stop; rolled the first time it is looked at. */
  private shopStock: ShopItem[] | null = null;

  readonly map: ActMap;
  readonly rng: Rng;
  private readonly world: RunWorld;

  constructor(map: ActMap, starterDeck: CardDefinition[], world: RunWorld, rng: Rng = new Rng(randomSeed())) {
    if (map.nodes.length === 0) throw new Error('a run needs a map');
    this.map = map;
    this.world = world;
    this.rng = rng;
    this.deck = [...starterDeck];
    this.hp = this.maxHp;
  }

  get seed(): number {
    return this.rng.seed;
  }

  // ---------- where you are ----------

  /** The map stop you are at. Throws if you haven't picked the first one yet. */
  get mapNode(): MapNode {
    const node = this.position === null ? undefined : this.map.nodes.find((n) => n.id === this.position);
    if (!node) throw new Error('not at a stop yet');
    return node;
  }

  /** The current stop with its content looked up. An event's fight stands in for the event until it ends. */
  get currentNode(): RunNode {
    if (this.eventFight) {
      return { kind: 'combat', tier: 'normal', enemies: this.eventFight.enemies.map((id) => this.world.enemy(id)) };
    }
    const node = this.mapNode;
    switch (node.kind) {
      case 'combat':
      case 'elite':
      case 'boss':
        return {
          kind: 'combat',
          tier: node.kind === 'combat' ? 'normal' : node.kind,
          enemies: (node.enemies ?? []).map((id) => this.world.enemy(id)),
        };
      case 'event':
        return { kind: 'event', event: this.world.event(node.eventId ?? '') };
      default:
        return { kind: node.kind };
    }
  }

  /** The stops you can pick from right now (only while choosing where to go). */
  get mapChoices(): MapNode[] {
    if (this.phase !== 'map') return [];
    if (this.position === null) return this.map.nodes.filter((n) => n.floor === 0);
    return this.mapNode.next.map((id) => this.node(id));
  }

  chooseNode(id: string): void {
    if (this.phase !== 'map') throw new Error(`can't pick a stop while ${this.phase}`);
    if (!this.mapChoices.some((n) => n.id === id)) throw new Error(`can't go to ${id} from here`);
    this.position = id;
    this.visited.push(id);
    this.phase = 'inNode';
  }

  /** 1-based floor you are on (0 before the first stop), for display. */
  get floor(): number {
    return this.position === null ? 0 : this.mapNode.floor + 1;
  }

  get totalFloors(): number {
    return this.map.floors;
  }

  // ---------- fights ----------

  /** The random stream for the fight about to start. Draws from the run's stream, so a saved run
   *  that is resumed gets the very same shuffles. */
  newCombatRng(): Rng {
    return new Rng(this.rng.nextSeed());
  }

  /** Called when the current fight ends, with the player's HP at that point and how many turns it took. */
  finishCombat(result: 'won' | 'lost', hpAfter: number, turns = 0): void {
    this.requireNode('combat');
    const node = this.currentNode;
    if (node.kind !== 'combat') throw new Error('unreachable');
    this.hp = Math.max(0, Math.min(this.maxHp, hpAfter));
    this.history.push({
      kind: 'combat',
      floor: this.floor,
      tier: node.tier,
      enemies: node.enemies.map((e) => e.id),
      result,
      turns,
      hpAfter: this.hp,
    });
    if (result === 'lost') {
      this.phase = 'lost';
      return;
    }
    for (const relic of this.relics) this.applyRunEffects(relic.onVictory ?? []);

    if (this.eventFight) {
      const after = this.eventFight.after;
      this.eventFight = null;
      for (const outcome of after) this.notice.push(this.applyOutcome(outcome));
      this.advance();
    } else if (node.tier === 'boss') {
      this.advance(); // the act is won; there is nothing left to pick
    } else {
      this.pendingReward = {
        cards: this.rollCards(REWARD_CARD_CHOICES),
        gold: node.tier === 'elite' ? ELITE_REWARD_GOLD : REWARD_GOLD,
        relic: node.tier === 'elite' ? (this.rollRelic() ?? undefined) : undefined,
      };
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
      relicId: offer.relic?.id,
    });
    if (offer.relic) this.grantRelic(offer.relic);
    this.advance();
  }

  takeRewardGold(): void {
    const offer = this.requireReward();
    this.gold += offer.gold;
    this.history.push({
      kind: 'reward',
      floor: this.floor,
      offered: offer.cards.map((c) => c.id),
      choice: 'gold',
      relicId: offer.relic?.id,
    });
    if (offer.relic) this.grantRelic(offer.relic);
    this.advance();
  }

  // ---------- rest stops ----------

  /** HP a rest would restore right now (capped at max HP). */
  get restHealAmount(): number {
    return Math.min(this.maxHp - this.hp, Math.round(this.maxHp * REST_HEAL_FRACTION));
  }

  /** Rest at the current rest stop: heal, then move on. Returns the HP actually restored. */
  rest(): number {
    this.requireNode('rest');
    const healed = this.restHealAmount;
    this.hp += healed;
    this.history.push({ kind: 'rest', floor: this.floor, choice: 'heal', healed });
    this.advance();
    return healed;
  }

  /** The cards in the deck that could be upgraded, with their position in the deck. */
  get upgradableCards(): { index: number; card: CardDefinition }[] {
    return this.deck.flatMap((card, index) => (card.upgrade ? [{ index, card }] : []));
  }

  /** The upgraded version of the deck's card at `index`, or undefined if it can't be upgraded. */
  upgradePreview(index: number): CardDefinition | undefined {
    const card = this.deck[index];
    return card?.upgrade ? this.world.card(`${card.id}+`) : undefined;
  }

  /** At a rest stop, choose upgrading the card at deck position `index` instead of resting. */
  upgradeCard(index: number): void {
    this.requireNode('rest');
    const upgraded = this.upgradePreview(index);
    if (!upgraded) throw new Error(`the card at ${index} can't be upgraded`);
    const old = this.deck[index];
    this.deck[index] = upgraded;
    this.history.push({ kind: 'rest', floor: this.floor, choice: 'upgrade', cardId: old.id });
    this.advance();
  }

  // ---------- shop (DRAFT) ----------

  /** What the current shop stop has for sale. */
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

  // ---------- events ----------

  /** The event at the current stop. */
  get event(): EventDefinition {
    this.requireNode('event');
    const node = this.currentNode;
    if (node.kind !== 'event') throw new Error('unreachable');
    return node.event;
  }

  /**
   * Picks a choice at the current event and applies its outcomes in order. Returns a line for each
   * thing that happened, and whether a fight began (the rest of the outcomes then wait for a win).
   */
  chooseEventOption(index: number): { lines: string[]; fighting: boolean } {
    const event = this.event;
    const choice = event.choices[index];
    if (!choice) throw new Error(`no choice ${index}`);
    this.history.push({ kind: 'event', floor: this.floor, eventId: event.id, choice: choice.label });

    const lines: string[] = [];
    for (let i = 0; i < choice.outcomes.length; i++) {
      const outcome = choice.outcomes[i];
      if (outcome.kind === 'fight') {
        this.eventFight = { enemies: outcome.enemies, after: choice.outcomes.slice(i + 1) };
        return { lines, fighting: true };
      }
      lines.push(this.applyOutcome(outcome));
    }
    this.advance();
    return { lines, fighting: false };
  }

  // ---------- relics ----------

  /** A random relic you don't already have, or null if there are none left. */
  rollRelic(): RelicDefinition | null {
    const owned = new Set(this.relics.map((r) => r.id));
    const available = this.world.relicPool.filter((r) => !owned.has(r.id));
    if (available.length === 0) return null;
    return available[Math.floor(this.rng.next() * available.length)];
  }

  grantRelic(relic: RelicDefinition): void {
    this.relics.push(relic);
    this.applyRunEffects(relic.onPickup ?? []);
    this.notice.push(`Gained ${relic.name}.`);
  }

  /** Lines the player should be told about once (they are cleared by reading them). */
  takeNotice(): string[] {
    const lines = this.notice;
    this.notice = [];
    return lines;
  }

  // ---------- dev tools ----------

  /** Dev tool: go straight to a stop, dropping whatever was pending. */
  jumpTo(id: string): void {
    this.node(id);
    this.pendingReward = null;
    this.shopStock = null;
    this.eventFight = null;
    this.position = id;
    if (!this.visited.includes(id)) this.visited.push(id);
    this.phase = 'inNode';
  }

  /** Dev tool: swap the current stop for a fight against these enemies (ids). It ends without a reward. */
  startFight(enemies: string[]): void {
    if (this.position === null) this.jumpTo(this.map.nodes.find((n) => n.floor === 0)!.id);
    this.pendingReward = null;
    this.shopStock = null;
    this.eventFight = { enemies, after: [] };
    this.phase = 'inNode';
  }

  // ---------- saving ----------

  /** The run as plain data, for saving. */
  toSaved(): SavedRun {
    return {
      version: 2,
      seed: this.rng.seed,
      rngPosition: this.rng.position,
      map: this.map,
      position: this.position,
      visited: [...this.visited],
      phase: this.phase,
      hp: this.hp,
      maxHp: this.maxHp,
      gold: this.gold,
      deck: this.deck.map((c) => c.id),
      relics: this.relics.map((r) => r.id),
      pendingReward: this.pendingReward
        ? {
            cards: this.pendingReward.cards.map((c) => c.id),
            gold: this.pendingReward.gold,
            relic: this.pendingReward.relic?.id ?? null,
          }
        : null,
      shop: this.shopStock ? this.shopStock.map((i) => ({ card: i.card.id, price: i.price, sold: i.sold })) : null,
      eventFight: this.eventFight ? { enemies: [...this.eventFight.enemies], after: [...this.eventFight.after] } : null,
      notice: [...this.notice],
      history: this.history.map((e) => ({ ...e })),
    };
  }

  /** Rebuilds a run from a save. Throws if the save names content that no longer exists. */
  static fromSaved(saved: SavedRun, world: RunWorld): RunState {
    const run = new RunState(saved.map, [], world, Rng.restore(saved.seed, saved.rngPosition));
    run.deck = saved.deck.map((id) => world.card(id));
    run.relics = saved.relics.map((id) => world.relic(id));
    run.hp = saved.hp;
    run.maxHp = saved.maxHp;
    run.gold = saved.gold;
    run.position = saved.position;
    run.visited = [...saved.visited];
    run.phase = saved.phase;
    run.pendingReward = saved.pendingReward
      ? {
          cards: saved.pendingReward.cards.map((id) => world.card(id)),
          gold: saved.pendingReward.gold,
          relic: saved.pendingReward.relic ? world.relic(saved.pendingReward.relic) : undefined,
        }
      : null;
    run.shopStock = saved.shop
      ? saved.shop.map((i) => ({ card: world.card(i.card), price: i.price, sold: i.sold }))
      : null;
    run.eventFight = saved.eventFight ? { enemies: [...saved.eventFight.enemies], after: [...saved.eventFight.after] } : null;
    run.notice = [...saved.notice];
    run.history = saved.history.map((e) => ({ ...e }));
    // check the saved content really exists, so a bad save fails here and not mid-game
    for (const n of saved.map.nodes) {
      n.enemies?.forEach((id) => world.enemy(id));
      if (n.eventId) world.event(n.eventId);
    }
    run.eventFight?.enemies.forEach((id) => world.enemy(id));
    run.eventFight?.after.forEach((o) => o.kind === 'card' && world.card(o.cardId));
    return run;
  }

  // ---------- internals ----------

  private node(id: string): MapNode {
    const node = this.map.nodes.find((n) => n.id === id);
    if (!node) throw new Error(`no stop ${id}`);
    return node;
  }

  /** The stop is done: back to the map, or the act is won if it was the boss. */
  private advance(): void {
    const wasBoss = this.mapNode.kind === 'boss';
    this.pendingReward = null;
    this.shopStock = null;
    this.eventFight = null;
    this.phase = wasBoss ? 'won' : 'map';
  }

  private applyRunEffects(effects: RunEffect[]): void {
    for (const effect of effects) {
      if (effect.kind === 'maxHp') {
        this.maxHp = Math.max(1, this.maxHp + effect.value);
        this.hp = Math.min(this.maxHp, Math.max(1, this.hp + Math.max(0, effect.value)));
      } else if (effect.kind === 'heal') {
        this.hp = Math.min(this.maxHp, this.hp + effect.value);
      } else {
        this.gold = Math.max(0, this.gold + effect.value);
      }
    }
  }

  /** Applies one event outcome and returns a line saying what actually happened. */
  private applyOutcome(outcome: EventOutcome): string {
    switch (outcome.kind) {
      case 'gold': {
        const before = this.gold;
        this.gold = Math.max(0, this.gold + outcome.value);
        const change = this.gold - before;
        if (change === 0) return outcome.value < 0 ? 'Lost no gold (you had none).' : 'Gained no gold.';
        return change > 0 ? `Gained ${change} gold.` : `Lost ${-change} gold.`;
      }
      case 'hp': {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, Math.max(1, this.hp + outcome.value));
        const change = this.hp - before;
        if (change === 0) return outcome.value < 0 ? 'Lost no HP (already at the minimum).' : 'Healed no HP.';
        return change > 0 ? `Healed ${change} HP.` : `Lost ${-change} HP.`;
      }
      case 'maxHp':
        this.applyRunEffects([{ kind: 'maxHp', value: outcome.value }]);
        return outcome.value >= 0 ? `Gained ${outcome.value} max HP.` : `Lost ${-outcome.value} max HP.`;
      case 'card': {
        const card = this.world.card(outcome.cardId);
        this.deck.push(card);
        return `Added ${card.name} to your deck.`;
      }
      case 'randomCard': {
        const [card] = this.rollCards(1);
        if (!card) return 'Nothing to take.';
        this.deck.push(card);
        return `Added ${card.name} to your deck.`;
      }
      case 'relic': {
        const relic = this.rollRelic();
        if (!relic) return 'No relic left to find.';
        this.grantRelic(relic);
        this.notice.pop(); // the line below says it already
        return `Gained ${relic.name}.`;
      }
      case 'fight':
        throw new Error('a fight outcome is started by chooseEventOption, not applied');
    }
  }

  /** Up to `count` distinct cards from the reward pool, in random order. */
  private rollCards(count: number): CardDefinition[] {
    const pool = [...new Set(this.world.rewardPool)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  private requireNode(kind: RunNode['kind']): void {
    if (this.phase !== 'inNode' || this.currentNode.kind !== kind) {
      throw new Error(`expected to be at a ${kind} stop, but phase is ${this.phase}`);
    }
  }

  private requireReward(): RewardOffer {
    if (this.phase !== 'reward' || !this.pendingReward) throw new Error('no reward is pending');
    return this.pendingReward;
  }
}
