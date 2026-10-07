import { Deck } from './Deck';
import { EventEmitter } from './EventEmitter';
import { PLAYER_ID } from './types';
import type {
  CardDefinition,
  CardInstance,
  Combatant,
  CombatantId,
  Effect,
  EnemyDefinition,
  EnemyMove,
  EnemyState,
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
  cardPlayed: { card: CardInstance; targetId?: CombatantId };
  /** Snapshot of the hand and pile sizes at the moment of the change. Listeners that animate
   *  later (the scene replays events in sequence) must use this, not the live deck, which may
   *  already have moved on — e.g. the next turn's draw happens before the discard is animated. */
  handChanged: { hand: CardInstance[]; drawPile: number; discardPile: number };
  damageDealt: { target: CombatantId } & DamageResult;
  blockGained: { target: CombatantId; amount: number };
  /** Fired whenever stacks are added or tick down. `statuses` is a snapshot of that combatant's
   *  full set at the moment of the change (same replay-later reasoning as handChanged); `delta` is
   *  the change to `status` (positive when applied, negative on a tick). */
  statusChanged: { target: CombatantId; status: StatusId; delta: number; statuses: Statuses };
  enemyTurnStarted: Record<string, never>;
  /** One enemy finished its move. `damage` is the total it dealt to the player, `blockGained` the
   *  total block it gave itself. Statuses it applied follow as statusChanged events. */
  enemyMoveResolved: { enemyId: CombatantId; move: EnemyMove; damage?: DamageResult; blockGained?: number };
  enemyDied: { enemyId: CombatantId };
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

  readonly player: Combatant;
  readonly enemies: EnemyState[];
  energy = 0;
  maxEnergy = MAX_ENERGY;

  phase: CombatPhase = 'playerTurn';
  log: CombatLogEntry[] = [];
  /** 1 on the first player turn, then counts up. */
  turnNumber = 0;

  /** Power cards played so far this combat; their onTurnStartEffect fires every subsequent turn. */
  private activePowers: CardDefinition[] = [];
  /** "<combatant id>:<status id>" for statuses put on during the enemy phase of this round. They skip
   *  this round's end-of-round countdown, so "Weak 1" really lasts through the player's next turn
   *  (StS calls this "just applied"). */
  private freshStatuses = new Set<string>();

  /** `player` carries HP between fights in a run; a standalone fight starts at full HP. `random`
   *  drives the shuffles (pass a seeded one to replay a fight). */
  constructor(
    deckCards: CardDefinition[],
    enemies: EnemyDefinition[],
    player: { hp: number; maxHp: number } = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP },
    random: () => number = Math.random
  ) {
    super();
    if (enemies.length === 0) throw new Error('a fight needs at least one enemy');
    this.deck = new Deck(deckCards, random);
    this.player = { id: PLAYER_ID, name: 'Hero', hp: player.hp, maxHp: player.maxHp, block: 0, statuses: {} };
    this.enemies = enemies.map((definition, i) => ({
      id: `enemy-${i}`,
      name: definition.name,
      hp: definition.maxHp,
      maxHp: definition.maxHp,
      block: 0,
      statuses: {},
      definition,
      moveIndex: 0,
    }));
  }

  start(): void {
    this.startPlayerTurn(true);
  }

  get livingEnemies(): EnemyState[] {
    return this.enemies.filter((e) => e.hp > 0);
  }

  combatant(id: CombatantId): Combatant {
    const found = id === PLAYER_ID ? this.player : this.enemies.find((e) => e.id === id);
    if (!found) throw new Error(`no combatant ${id}`);
    return found;
  }

  nextMove(enemy: EnemyState): EnemyMove {
    const pattern = enemy.definition.movePattern;
    return pattern[enemy.moveIndex % pattern.length];
  }

  /** Damage `attacker` would really deal for `base` to `defender`, after Strength, Weak and Vulnerable. */
  calcDamage(base: number, attacker: Combatant, defender: Combatant): number {
    let amount = base;
    for (const [id, stacks] of activeStatuses(attacker)) {
      amount += STATUSES[id].outgoingDamageAdd?.(stacks) ?? 0;
    }
    for (const [id, stacks] of activeStatuses(attacker)) {
      amount *= STATUSES[id].outgoingDamageMult?.(stacks) ?? 1;
    }
    for (const [id, stacks] of activeStatuses(defender)) {
      amount *= STATUSES[id].incomingDamageMult?.(stacks) ?? 1;
    }
    return Math.max(0, Math.floor(amount));
  }

  /** Total damage the enemy's next move will deal the player right now (statuses included), or
   *  undefined if that move doesn't attack. For the intent readout. */
  intentDamage(enemy: EnemyState): number | undefined {
    const hits = this.nextMove(enemy).effects.filter((e) => e.kind === 'damage');
    if (hits.length === 0) return undefined;
    return hits.reduce((sum, e) => sum + this.calcDamage(e.value, enemy, this.player), 0);
  }

  /** Total block the enemy's next move will give it, or undefined if it gives none. */
  intentBlock(enemy: EnemyState): number | undefined {
    const gains = this.nextMove(enemy).effects.filter((e) => e.kind === 'block');
    return gains.length === 0 ? undefined : gains.reduce((sum, e) => sum + e.value, 0);
  }

  canPlay(card: CardInstance): boolean {
    return this.phase === 'playerTurn' && card.definition.cost <= this.energy;
  }

  /** Cards with definition.target === 'enemy' are rejected unless `targetId` is a living enemy. */
  playCard(instanceId: string, targetId?: CombatantId): boolean {
    const handCard = this.deck.hand.find((c) => c.instanceId === instanceId);
    if (!handCard || !this.canPlay(handCard)) return false;

    let target: EnemyState | undefined;
    if (handCard.definition.target === 'enemy') {
      target = this.livingEnemies.find((e) => e.id === targetId);
      if (!target) return false;
    }

    this.energy -= handCard.definition.cost;
    this.deck.playCard(instanceId);
    this.emit('cardPlayed', { card: handCard, targetId: target?.id });

    for (const effect of handCard.definition.effects ?? []) {
      this.applyCardEffect(effect, target);
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
    this.turnNumber += 1;
    this.player.block = 0;
    this.energy = this.maxEnergy;
    this.deck.draw(HAND_SIZE);
    for (const power of this.activePowers) {
      if (power.onTurnStartEffect) {
        this.applyCardEffect(power.onTurnStartEffect, undefined);
      }
    }
    this.pushLog(isFirstTurn ? 'Combat start.' : 'Your turn.');
    this.emitHandChanged();
    this.emit('turnStarted', { isFirstTurn });
  }

  private runEnemyTurn(): void {
    this.phase = 'enemyTurn';
    this.emit('enemyTurnStarted', {});
    this.freshStatuses.clear();

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (this.player.hp <= 0) break;
      enemy.block = 0; // mirrors the player's own "block resets at start of your turn" rule
      this.runEnemyMove(enemy, this.nextMove(enemy));
      enemy.moveIndex += 1;
    }

    // End of round: durations count down on everyone still standing.
    if (this.player.hp > 0) {
      for (const enemy of this.livingEnemies) this.tickStatuses(enemy);
      this.tickStatuses(this.player);
    }

    this.checkWinLoss();
    if (this.phase === 'enemyTurn') {
      this.startPlayerTurn();
    }
  }

  private runEnemyMove(enemy: EnemyState, move: EnemyMove): void {
    let damage: DamageResult | undefined;
    let blockGained: number | undefined;
    const statusEvents: CombatEventMap['statusChanged'][] = [];

    for (const effect of move.effects) {
      if (effect.kind === 'damage') {
        const hit = this.dealDamage(this.player, this.calcDamage(effect.value, enemy, this.player));
        damage = damage
          ? { amount: damage.amount + hit.amount, absorbed: damage.absorbed + hit.absorbed, remainingHp: hit.remainingHp }
          : hit;
      } else if (effect.kind === 'block') {
        enemy.block += effect.value;
        blockGained = (blockGained ?? 0) + effect.value;
      } else if (effect.kind === 'applyStatus') {
        const recipient = effect.to === 'self' ? enemy : this.player;
        statusEvents.push(this.addStatus(recipient, effect.status, effect.value));
        this.freshStatuses.add(`${recipient.id}:${effect.status}`);
      }
      // 'draw' means nothing to an enemy
    }

    const parts = [`${enemy.name} uses ${move.name}`];
    if (damage) parts.push(` for ${damage.amount} damage`);
    if (blockGained) parts.push(`${damage ? ', ' : ' '}gaining ${blockGained} block`);
    this.pushLog(`${parts.join('')}.`);

    this.emit('enemyMoveResolved', { enemyId: enemy.id, move, damage, blockGained });
    for (const event of statusEvents) this.emit('statusChanged', event);
  }

  /** Resolves one effect of a card the player played (or of one of their powers). `target` is the
   *  enemy the card was aimed at, if it has one. */
  private applyCardEffect(effect: Effect, target: EnemyState | undefined): void {
    switch (effect.kind) {
      case 'damage':
        if (target && target.hp > 0) {
          const result = this.dealDamage(target, this.calcDamage(effect.value, this.player, target));
          this.emit('damageDealt', { target: target.id, ...result });
          if (target.hp <= 0) this.emit('enemyDied', { enemyId: target.id });
        }
        break;
      case 'block':
        this.player.block += effect.value;
        this.emit('blockGained', { target: this.player.id, amount: effect.value });
        break;
      case 'draw':
        this.deck.draw(effect.value);
        this.emitHandChanged();
        break;
      case 'applyStatus': {
        const recipient = effect.to === 'self' ? this.player : target;
        if (recipient && recipient.hp > 0) {
          this.emit('statusChanged', this.addStatus(recipient, effect.status, effect.value));
        }
        break;
      }
    }
  }

  /** Applies damage through block and returns what happened. The caller announces it. */
  private dealDamage(target: Combatant, amount: number): DamageResult {
    const absorbed = Math.min(target.block, amount);
    target.block -= absorbed;
    target.hp = Math.max(0, target.hp - (amount - absorbed));
    return { amount, absorbed, remainingHp: target.hp };
  }

  /** Adds stacks and returns the matching event for the caller to emit. */
  private addStatus(target: Combatant, id: StatusId, stacks: number): CombatEventMap['statusChanged'] {
    target.statuses[id] = (target.statuses[id] ?? 0) + stacks;
    return { target: target.id, status: id, delta: stacks, statuses: { ...target.statuses } };
  }

  private tickStatuses(target: Combatant): void {
    for (const [id, stacks] of activeStatuses(target)) {
      if (STATUSES[id].kind !== 'duration' || this.freshStatuses.has(`${target.id}:${id}`)) continue;
      if (stacks <= 1) delete target.statuses[id];
      else target.statuses[id] = stacks - 1;
      this.emit('statusChanged', {
        target: target.id,
        status: id,
        delta: -1,
        statuses: { ...target.statuses },
      });
    }
  }

  private checkWinLoss(): void {
    if (this.phase === 'won' || this.phase === 'lost') return;
    if (this.enemies.every((e) => e.hp <= 0)) {
      this.phase = 'won';
      this.pushLog('Victory.');
      this.emit('combatEnded', { result: 'won' });
    } else if (this.player.hp <= 0) {
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

function activeStatuses(who: Combatant): [StatusId, number][] {
  return (Object.entries(who.statuses) as [StatusId, number][]).filter(([, stacks]) => stacks > 0);
}
