import type { CardDefinition, EnemyDefinition } from './types';
import { PLAYER_MAX_HP, REST_HEAL_FRACTION, REWARD_CARD_CHOICES, REWARD_GOLD } from '../data/tunables';

/** One stop on the run's linear path. */
export type RunNode = { kind: 'combat'; enemy: EnemyDefinition } | { kind: 'rest' };

/** Offered after winning a fight: take one of `cards` into the deck, or take `gold` instead. */
export interface RewardOffer {
  cards: CardDefinition[];
  gold: number;
}

/**
 * - inNode: playing the current node (a fight or a rest stop)
 * - reward: just won a fight, choosing card vs gold
 * - won / lost: run over
 */
export type RunPhase = 'inNode' | 'reward' | 'won' | 'lost';

/**
 * Pure run-level state for MVP 2's short linear run: what carries between fights (HP, deck,
 * gold) and where the player is on the path. Independent of Phaser, like CombatState —
 * scenes read it and call its methods.
 */
export class RunState {
  deck: CardDefinition[];
  hp: number;
  maxHp = PLAYER_MAX_HP;
  gold = 0;
  nodeIndex = 0;
  phase: RunPhase = 'inNode';
  pendingReward: RewardOffer | null = null;

  readonly nodes: RunNode[];
  private readonly rewardPool: CardDefinition[];
  private readonly random: () => number;

  constructor(
    nodes: RunNode[],
    starterDeck: CardDefinition[],
    rewardPool: CardDefinition[],
    random: () => number = Math.random
  ) {
    if (nodes.length === 0) throw new Error('a run needs at least one node');
    this.nodes = nodes;
    this.rewardPool = rewardPool;
    this.random = random;
    this.deck = [...starterDeck];
    this.hp = this.maxHp;
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

  /** Called when the current fight ends, with the player's HP at that point. */
  finishCombat(result: 'won' | 'lost', hpAfter: number): void {
    this.requireNode('combat');
    this.hp = Math.max(0, Math.min(this.maxHp, hpAfter));
    if (result === 'lost') {
      this.phase = 'lost';
    } else if (this.nodeIndex === this.nodes.length - 1) {
      this.advance(); // won the final fight: the run is won, no reward to pick
    } else {
      this.pendingReward = { cards: this.rollRewardCards(), gold: REWARD_GOLD };
      this.phase = 'reward';
    }
  }

  takeRewardCard(index: number): void {
    const card = this.requireReward().cards[index];
    if (!card) throw new Error(`no reward card at index ${index}`);
    this.deck.push(card);
    this.advance();
  }

  takeRewardGold(): void {
    this.gold += this.requireReward().gold;
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
    this.advance();
    return healed;
  }

  private advance(): void {
    this.pendingReward = null;
    this.nodeIndex += 1;
    this.phase = this.nodeIndex >= this.nodes.length ? 'won' : 'inNode';
  }

  /** Up to REWARD_CARD_CHOICES distinct cards from the reward pool, in random order. */
  private rollRewardCards(): CardDefinition[] {
    const pool = [...new Set(this.rewardPool)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, REWARD_CARD_CHOICES);
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
