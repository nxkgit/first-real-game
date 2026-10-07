import { Deck } from './Deck';
import { EventEmitter } from './EventEmitter';
import type { CardDefinition, CardEffect, CardInstance, EnemyDefinition, EnemyMove } from './types';

// MVP 1 tunables. Placeholder values, expected to change once playtesting starts.
const MAX_ENERGY = 4;
const HAND_SIZE = 5;
const PLAYER_MAX_HP = 60;

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
  handChanged: Record<string, never>;
  damageDealt: { target: 'enemy' | 'player' } & DamageResult;
  blockGained: { target: 'enemy' | 'player'; amount: number };
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
  playerMaxHp = PLAYER_MAX_HP;
  playerBlock = 0;
  energy = 0;
  maxEnergy = MAX_ENERGY;

  enemy: EnemyDefinition;
  enemyHp: number;
  enemyBlock = 0;
  enemyMoveIndex = 0;

  phase: CombatPhase = 'playerTurn';
  log: CombatLogEntry[] = [];

  /** Power cards played so far this combat; their onTurnStartEffect fires every subsequent turn. */
  private activePowers: CardDefinition[] = [];

  constructor(starterDeck: CardDefinition[], enemy: EnemyDefinition) {
    super();
    this.deck = new Deck(starterDeck);
    this.playerHp = PLAYER_MAX_HP;
    this.enemy = enemy;
    this.enemyHp = enemy.maxHp;
  }

  start(): void {
    this.startPlayerTurn(true);
  }

  get currentEnemyMove(): EnemyMove {
    return this.enemy.movePattern[this.enemyMoveIndex % this.enemy.movePattern.length];
  }

  canPlay(card: CardInstance): boolean {
    return this.phase === 'playerTurn' && card.definition.cost <= this.energy;
  }

  playCard(instanceId: string): boolean {
    const handCard = this.deck.hand.find((c) => c.instanceId === instanceId);
    if (!handCard || !this.canPlay(handCard)) return false;

    this.energy -= handCard.definition.cost;
    this.deck.playCard(instanceId);
    this.emit('cardPlayed', { card: handCard });

    for (const effect of handCard.definition.effects ?? []) {
      this.applyEffect(effect, effect.kind === 'damage' ? 'enemy' : 'self');
    }

    if (handCard.definition.type === 'power') {
      this.activePowers.push(handCard.definition);
    }

    this.pushLog(`Played ${handCard.definition.name}.`);
    this.emit('handChanged', {});
    this.checkWinLoss();
    return true;
  }

  endPlayerTurn(): void {
    if (this.phase !== 'playerTurn') return;
    this.deck.discardHand();
    this.emit('handChanged', {});
    this.runEnemyTurn();
  }

  private startPlayerTurn(isFirstTurn = false): void {
    this.phase = 'playerTurn';
    this.playerBlock = 0;
    this.energy = this.maxEnergy;
    this.deck.draw(HAND_SIZE);
    for (const power of this.activePowers) {
      if (power.onTurnStartEffect) {
        this.applyEffect(power.onTurnStartEffect, 'self');
      }
    }
    this.pushLog(isFirstTurn ? 'Combat start.' : 'Your turn.');
    this.emit('handChanged', {});
    this.emit('turnStarted', { isFirstTurn });
  }

  private runEnemyTurn(): void {
    this.phase = 'enemyTurn';
    this.emit('enemyTurnStarted', {});
    this.enemyBlock = 0; // mirrors the player's own "block resets at start of your turn" rule
    const move = this.currentEnemyMove;

    if (move.kind === 'attack') {
      const { absorbed, remainingHp } = this.dealDamageToPlayer(move.value, false);
      this.pushLog(`Enemy uses ${move.name} for ${move.value} damage.`);
      this.emit('enemyMoveResolved', { move, damage: { amount: move.value, absorbed, remainingHp } });
    } else {
      this.gainEnemyBlock(move.value, false);
      this.pushLog(`Enemy uses ${move.name}, gaining ${move.value} block.`);
      this.emit('enemyMoveResolved', { move, blockGained: move.value });
    }
    this.enemyMoveIndex += 1;

    this.checkWinLoss();
    if (this.phase === 'enemyTurn') {
      this.startPlayerTurn();
    }
  }

  private applyEffect(effect: CardEffect, target: 'enemy' | 'self'): void {
    if (effect.kind === 'damage' && target === 'enemy') {
      this.dealDamageToEnemy(effect.value);
    } else if (effect.kind === 'block' && target === 'self') {
      this.gainPlayerBlock(effect.value);
    } else if (effect.kind === 'draw' && target === 'self') {
      this.deck.draw(effect.value);
      this.emit('handChanged', {});
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

  private pushLog(message: string): void {
    this.log.push({ message });
  }
}
