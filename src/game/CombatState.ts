import { Deck } from './Deck';
import { EventEmitter } from './EventEmitter';
import type {
  CardDefinition,
  CardEffect,
  CardInstance,
  EnemyDefinition,
  EnemyMove,
  Side,
  StatusId,
  Statuses,
} from './types';
import { STATUSES } from '../data/statuses';
import { HAND_SIZE, MAX_ENERGY, PLAYER_MAX_HP } from '../data/tunables';

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'won' | 'lost';

export interface CombatLogEntry {
  message: string;
}

export interface DamageResult {
  amount: number;
  absorbed: number;
  remainingHp: number;
}

export interface CombatEventMap {
  turnStarted: { isFirstTurn: boolean };
  cardPlayed: { card: CardInstance };
  /** Snapshot of the hand and pile sizes at the moment of the change. Listeners that animate
   *  later (the scene replays events in sequence) must use this, not the live deck, which may
   *  already have moved on — e.g. the next turn's draw happens before the discard is animated. */
  handChanged: { hand: CardInstance[]; drawPile: number; discardPile: number };
  damageDealt: { target: Side } & DamageResult;
  blockGained: { target: Side; amount: number };
  /** Fired whenever stacks are added or tick down. `statuses` is a snapshot of that side's full set
   *  at the moment of the change (same replay-later reasoning as handChanged); `delta` is the change
   *  to `status` (positive when applied, negative on a tick). */
  statusChanged: { target: Side; status: StatusId; delta: number; statuses: Statuses };
  enemyTurnStarted: Record<string, never>;
  enemyMoveResolved: { move: EnemyMove; damage?: DamageResult; blockGained?: number };
  combatEnded: { result: 'won' | 'lost' };
}

/**
 * Pure game-state/rules layer, independent of Phaser, per implementationplan.md's
 * architecture principles. The Phaser scene subscribes to its events and calls its
 * methods; it does not own any game state itself. Construct, attach listeners, then
 * call start() — this ordering guarantees the scene never misses the opening draw.
 */
export class CombatState extends EventEmitter<CombatEventMap> {
  deck: Deck;

  playerHp: number;
  playerMaxHp: number;
  playerBlock = 0;
  energy = 0;
  maxEnergy = MAX_ENERGY;

  enemy: EnemyDefinition;
  enemyHp: number;
  enemyBlock = 0;
  enemyMoveIndex = 0;

  playerStatuses: Statuses = {};
  enemyStatuses: Statuses = {};

  phase: CombatPhase = 'playerTurn';
  log: CombatLogEntry[] = [];

  /** Power cards played so far this combat; their onTurnStartEffect fires every subsequent turn. */
  private activePowers: CardDefinition[] = [];

  /** `player` carries HP between fights in a run; a standalone fight starts at full HP. */
  constructor(
    deckCards: CardDefinition[],
    enemy: EnemyDefinition,
    player: { hp: number; maxHp: number } = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }
  ) {
    super();
    this.deck = new Deck(deckCards);
    this.playerHp = player.hp;
    this.playerMaxHp = player.maxHp;
    this.enemy = enemy;
    this.enemyHp = enemy.maxHp;
  }

  start(): void {
    this.startPlayerTurn(true);
  }

  get currentEnemyMove(): EnemyMove {
    return this.enemy.movePattern[this.enemyMoveIndex % this.enemy.movePattern.length];
  }

  statusesOf(side: Side): Statuses {
    return side === 'player' ? this.playerStatuses : this.enemyStatuses;
  }

  /** Damage `attacker` would really deal for `base`, after Strength, Weak and the target's Vulnerable. */
  calcDamage(base: number, attacker: Side): number {
    const defender: Side = attacker === 'player' ? 'enemy' : 'player';
    let amount = base;
    for (const [id, stacks] of this.activeStatuses(attacker)) {
      amount += STATUSES[id].outgoingDamageAdd?.(stacks) ?? 0;
    }
    for (const [id, stacks] of this.activeStatuses(attacker)) {
      amount *= STATUSES[id].outgoingDamageMult?.(stacks) ?? 1;
    }
    for (const [id, stacks] of this.activeStatuses(defender)) {
      amount *= STATUSES[id].incomingDamageMult?.(stacks) ?? 1;
    }
    return Math.max(0, Math.floor(amount));
  }

  /** The damage the enemy's current intent will deal right now (statuses included), for the intent readout. */
  get currentEnemyAttackDamage(): number {
    return this.calcDamage(this.currentEnemyMove.value, 'enemy');
  }

  canPlay(card: CardInstance): boolean {
    return this.phase === 'playerTurn' && card.definition.cost <= this.energy;
  }

  /** Enemy-targeted cards (definition.target === 'enemy') are rejected unless a target is given. */
  playCard(instanceId: string, target?: 'enemy'): boolean {
    const handCard = this.deck.hand.find((c) => c.instanceId === instanceId);
    if (!handCard || !this.canPlay(handCard)) return false;
    if (handCard.definition.target === 'enemy' && target !== 'enemy') return false;

    this.energy -= handCard.definition.cost;
    this.deck.playCard(instanceId);
    this.emit('cardPlayed', { card: handCard });

    for (const effect of handCard.definition.effects ?? []) {
      this.applyEffect(effect);
    }

    if (handCard.definition.type === 'power') {
      this.activePowers.push(handCard.definition);
    }

    this.pushLog(`Played ${handCard.definition.name}.`);
    this.emitHandChanged();
    this.checkWinLoss();
    return true;
  }

  endPlayerTurn(): void {
    if (this.phase !== 'playerTurn') return;
    this.deck.discardHand();
    this.emitHandChanged();
    this.runEnemyTurn();
  }

  private startPlayerTurn(isFirstTurn = false): void {
    this.phase = 'playerTurn';
    this.playerBlock = 0;
    this.energy = this.maxEnergy;
    this.deck.draw(HAND_SIZE);
    for (const power of this.activePowers) {
      if (power.onTurnStartEffect) {
        this.applyEffect(power.onTurnStartEffect);
      }
    }
    this.pushLog(isFirstTurn ? 'Combat start.' : 'Your turn.');
    this.emitHandChanged();
    this.emit('turnStarted', { isFirstTurn });
  }

  private runEnemyTurn(): void {
    this.phase = 'enemyTurn';
    this.emit('enemyTurnStarted', {});
    this.enemyBlock = 0; // mirrors the player's own "block resets at start of your turn" rule
    const move = this.currentEnemyMove;

    // Anything the enemy puts on the player this turn skips the end-of-round tick below, so a
    // "Weak 1" really does last through the player's next turn (StS calls this "just applied").
    let skipPlayerTick: StatusId | undefined;

    if (move.kind === 'attack') {
      const amount = this.calcDamage(move.value, 'enemy');
      const { absorbed, remainingHp } = this.dealDamageToPlayer(amount, false);
      this.pushLog(`Enemy uses ${move.name} for ${amount} damage.`);
      this.emit('enemyMoveResolved', { move, damage: { amount, absorbed, remainingHp } });
    } else if (move.kind === 'defend') {
      this.gainEnemyBlock(move.value, false);
      this.pushLog(`Enemy uses ${move.name}, gaining ${move.value} block.`);
      this.emit('enemyMoveResolved', { move, blockGained: move.value });
    } else if (move.status) {
      const target: Side = move.status.to === 'player' ? 'player' : 'enemy';
      this.pushLog(`Enemy uses ${move.name}.`);
      this.emit('enemyMoveResolved', { move });
      this.addStatus(target, move.status.id, move.value);
      if (target === 'player') skipPlayerTick = move.status.id;
    }
    this.enemyMoveIndex += 1;

    // End of round: durations count down on both sides.
    if (this.phase === 'enemyTurn' && this.playerHp > 0 && this.enemyHp > 0) {
      this.tickStatuses('enemy');
      this.tickStatuses('player', skipPlayerTick);
    }

    this.checkWinLoss();
    if (this.phase === 'enemyTurn') {
      this.startPlayerTurn();
    }
  }

  private activeStatuses(side: Side): [StatusId, number][] {
    return (Object.entries(this.statusesOf(side)) as [StatusId, number][]).filter(([, stacks]) => stacks > 0);
  }

  private addStatus(side: Side, id: StatusId, stacks: number): void {
    const statuses = this.statusesOf(side);
    statuses[id] = (statuses[id] ?? 0) + stacks;
    this.emit('statusChanged', { target: side, status: id, delta: stacks, statuses: { ...statuses } });
  }

  private tickStatuses(side: Side, skip?: StatusId): void {
    const statuses = this.statusesOf(side);
    for (const [id, stacks] of this.activeStatuses(side)) {
      if (id === skip || STATUSES[id].kind !== 'duration') continue;
      if (stacks <= 1) delete statuses[id];
      else statuses[id] = stacks - 1;
      this.emit('statusChanged', { target: side, status: id, delta: -1, statuses: { ...statuses } });
    }
  }

  /** Resolves one effect of a card the player played (or of one of their powers). */
  private applyEffect(effect: CardEffect): void {
    switch (effect.kind) {
      case 'damage':
        this.dealDamageToEnemy(this.calcDamage(effect.value, 'player'));
        break;
      case 'block':
        this.gainPlayerBlock(effect.value);
        break;
      case 'draw':
        this.deck.draw(effect.value);
        this.emitHandChanged();
        break;
      case 'applyStatus':
        this.addStatus(effect.to === 'enemy' ? 'enemy' : 'player', effect.status, effect.value);
        break;
    }
  }

  private dealDamageToEnemy(amount: number, emitEvent = true): DamageResult {
    const absorbed = Math.min(this.enemyBlock, amount);
    this.enemyBlock -= absorbed;
    this.enemyHp = Math.max(0, this.enemyHp - (amount - absorbed));
    const result: DamageResult = { amount, absorbed, remainingHp: this.enemyHp };
    if (emitEvent) this.emit('damageDealt', { target: 'enemy', ...result });
    return result;
  }

  private dealDamageToPlayer(amount: number, emitEvent = true): DamageResult {
    const absorbed = Math.min(this.playerBlock, amount);
    this.playerBlock -= absorbed;
    this.playerHp = Math.max(0, this.playerHp - (amount - absorbed));
    const result: DamageResult = { amount, absorbed, remainingHp: this.playerHp };
    if (emitEvent) this.emit('damageDealt', { target: 'player', ...result });
    return result;
  }

  private gainEnemyBlock(amount: number, emitEvent = true): void {
    this.enemyBlock += amount;
    if (emitEvent) this.emit('blockGained', { target: 'enemy', amount });
  }

  private gainPlayerBlock(amount: number, emitEvent = true): void {
    this.playerBlock += amount;
    if (emitEvent) this.emit('blockGained', { target: 'player', amount });
  }

  private checkWinLoss(): void {
    if (this.enemyHp <= 0) {
      this.phase = 'won';
      this.pushLog('Victory.');
      this.emit('combatEnded', { result: 'won' });
    } else if (this.playerHp <= 0) {
      this.phase = 'lost';
      this.pushLog('Defeat.');
      this.emit('combatEnded', { result: 'lost' });
    }
  }

  private emitHandChanged(): void {
    this.emit('handChanged', {
      hand: [...this.deck.hand],
      drawPile: this.deck.drawPile.length,
      discardPile: this.deck.discardPile.length,
    });
  }

  private pushLog(message: string): void {
    this.log.push({ message });
  }
}
