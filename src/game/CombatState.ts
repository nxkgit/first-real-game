import { Deck } from './Deck';
import { EventEmitter } from './EventEmitter';
import { PLAYER_ID } from './types';
import { intentBlockOf, intentDamageOf, resolveEnemyEffect, resolvePlayerEffect } from './effects';
import type { EffectHost, EnemyMoveOutcome } from './effects';
import type {
  CardDefinition,
  CardInstance,
  Combatant,
  CombatantId,
  Effect,
  EnemyDefinition,
  EnemyMove,
  EnemyState,
  RelicDefinition,
  Scaling,
  StatusId,
  Statuses,
  Trigger,
  TriggerOn,
} from './types';
import { STATUSES } from '../data/statuses';
import { HAND_SIZE, MAX_ENERGY, MAX_TRIGGER_DEPTH, PLAYER_MAX_HP } from '../data/tunables';

/** Counters that scaling and the dev tools read. Per-turn ones reset as each player turn starts. */
export interface CombatStats {
  /** Cards played this turn so far (triggered effects are not card plays). */
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  /** Per tag: cards carrying it played this turn. */
  taggedPlayedThisTurn: Record<string, number>;
  /** Cards exhausted so far this combat (by any means). */
  exhaustedThisCombat: number;
}

interface ActiveTrigger {
  trigger: Trigger;
  firedThisTurn: boolean;
}

export interface CombatOptions {
  /** HP the player brings in (a run carries it between fights); default is full HP. */
  player?: { hp: number; maxHp: number };
  /** Drives the shuffles; pass a seeded one to replay a fight. */
  random?: () => number;
  /** Relics the player has: their combat-start and turn-start effects apply. */
  relics?: RelicDefinition[];
}

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
   *  already have moved on â€” e.g. the next turn's draw happens before the discard is animated. */
  handChanged: { hand: CardInstance[]; drawPile: number; discardPile: number; exhaustPile: number };
  /** A card went to the exhaust pile. `exhaustPile` is the pile's size at that moment (snapshot). */
  cardExhausted: { card: CardInstance; exhaustPile: number };
  /** Energy changed because of an effect (not for paying a card's cost). `energy` is the new total. */
  energyChanged: { energy: number; delta: number };
  /** The player lost HP directly (a loseHp effect). Enemy hits report through enemyMoveResolved. */
  hpLost: { target: CombatantId; amount: number; remainingHp: number };
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
 * call start() â€” this ordering guarantees the scene never misses the opening draw.
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

  /** Synergy counters (see CombatStats). */
  readonly stats: CombatStats = { cardsPlayedThisTurn: 0, attacksPlayedThisTurn: 0, taggedPlayedThisTurn: {}, exhaustedThisCombat: 0 };

  private readonly relics: RelicDefinition[];
  /** Power cards played so far this combat; their onTurnStartEffect fires every subsequent turn. */
  private activePowers: CardDefinition[] = [];
  /** Reactive abilities in force, in firing order: relics (in relic order), then powers in the order played. */
  private triggers: ActiveTrigger[] = [];
  private triggerDepth = 0;
  /** "<combatant id>:<status id>" for statuses put on during the enemy phase of this round. They skip
   *  this round's end-of-round countdown, so "Weak 1" really lasts through the player's next turn
   *  (StS calls this "just applied"). */
  private freshStatuses = new Set<string>();
  /** The few things effects (see effects.ts) may do to this fight. */
  private readonly host: EffectHost;

  constructor(deckCards: CardDefinition[], enemies: EnemyDefinition[], options: CombatOptions = {}) {
    super();
    if (enemies.length === 0) throw new Error('a fight needs at least one enemy');
    const player = options.player ?? { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP };
    this.relics = options.relics ?? [];
    for (const relic of this.relics) this.addTriggers(relic.triggers);
    this.deck = new Deck(deckCards, options.random ?? Math.random);
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
    this.host = {
      player: this.player,
      deck: this.deck,
      emit: (event, payload) => this.emit(event, payload),
      calcDamage: (base, attacker, defender, fromAttackCard) => this.calcDamage(base, attacker, defender, fromAttackCard),
      dealDamage: (target, amount) => this.dealDamage(target, amount),
      addStatus: (target, id, stacks) => this.addStatus(target, id, stacks),
      scaledValue: (effect, target) => this.scaledValue(effect, target),
      gainEnergy: (amount) => (this.energy += amount),
      noteExhausted: (card) => this.noteExhausted(card),
      fireTriggers: (on) => this.fireTriggers(on),
      emitHandChanged: () => this.emitHandChanged(),
      markFresh: (target, id) => void this.freshStatuses.add(`${target.id}:${id}`),
    };
  }

  start(): void {
    // relics that act as a fight begins, before the first hand is drawn
    for (const relic of this.relics) {
      for (const effect of relic.onCombatStart ?? []) this.applyCardEffect(effect, undefined);
    }
    this.startPlayerTurn(true);
    this.checkWinLoss();
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

  /**
   * Damage `attacker` would really deal for `base` to `defender`. Order: add (Strength), then
   * multiply (Weak, Empowered), then the defender's multiplier (Vulnerable), rounded down once.
   * `fromAttackCard` is false for damage that does not come from playing an attack card (a trigger,
   * a skill's damage); statuses marked `consumedByAttack` (Empowered) then don't apply.
   */
  calcDamage(base: number, attacker: Combatant, defender: Combatant, fromAttackCard = true): number {
    let amount = base;
    for (const [id, stacks] of activeStatuses(attacker)) {
      amount += STATUSES[id].outgoingDamageAdd?.(stacks) ?? 0;
    }
    for (const [id, stacks] of activeStatuses(attacker)) {
      if (STATUSES[id].consumedByAttack && !fromAttackCard) continue;
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
    const hits = this.nextMove(enemy).effects.map(intentDamageOf).filter((base) => base !== undefined);
    if (hits.length === 0) return undefined;
    return hits.reduce((sum, base) => sum + this.calcDamage(base, enemy, this.player), 0);
  }

  /** Total block the enemy's next move will give it, or undefined if it gives none. */
  intentBlock(enemy: EnemyState): number | undefined {
    const gains = this.nextMove(enemy).effects.map(intentBlockOf).filter((amount) => amount !== undefined);
    return gains.length === 0 ? undefined : gains.reduce((sum, amount) => sum + amount, 0);
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

    const definition = handCard.definition;
    const isAttack = definition.type === 'attack';
    for (const effect of definition.effects ?? []) {
      this.applyCardEffect(effect, target, isAttack);
    }

    // After the effects, so "earlier this turn" counts never include the card itself.
    if (isAttack) this.consumeAttackStatuses();
    this.stats.cardsPlayedThisTurn += 1;
    if (isAttack) this.stats.attacksPlayedThisTurn += 1;
    for (const tag of new Set(definition.tags ?? [])) {
      this.stats.taggedPlayedThisTurn[tag] = (this.stats.taggedPlayedThisTurn[tag] ?? 0) + 1;
    }
    if (definition.exhaust) this.noteExhausted(this.deck.exhaustCard(handCard.instanceId));
    this.fireTriggers('cardPlayed', definition);

    // A power starts reacting after it is played, so it never triggers on its own play.
    if (definition.type === 'power') {
      this.activePowers.push(definition);
      this.addTriggers(definition.triggers);
    }

    this.pushLog(`Played ${handCard.definition.name}.`);
    this.emitHandChanged();
    this.checkWinLoss();
    return true;
  }

  /** Dev tool: defeats every living enemy at once, announced like a normal kill, so the fight ends as a win. */
  devKillAllEnemies(): void {
    if (this.phase !== 'playerTurn') return;
    for (const enemy of this.livingEnemies) {
      enemy.hp = 0;
      enemy.block = 0;
      this.emit('enemyDied', { enemyId: enemy.id });
    }
    this.checkWinLoss();
  }

  endPlayerTurn(): void {
    if (this.phase !== 'playerTurn') return;
    this.fireTriggers('turnEnd'); // before the hand is discarded, so hand-size scaling still sees it
    this.checkWinLoss();
    if (this.phase !== 'playerTurn') return;
    this.deck.discardHand();
    this.emitHandChanged();
    this.runEnemyTurn();
  }

  private startPlayerTurn(isFirstTurn = false): void {
    this.phase = 'playerTurn';
    this.turnNumber += 1;
    // the first turn keeps any block that combat-start effects (relics) just gave
    if (!isFirstTurn) this.player.block = 0;
    this.energy = this.maxEnergy;
    this.stats.cardsPlayedThisTurn = 0;
    this.stats.attacksPlayedThisTurn = 0;
    this.stats.taggedPlayedThisTurn = {};
    for (const t of this.triggers) t.firedThisTurn = false;
    this.deck.draw(HAND_SIZE);
    for (const power of this.activePowers) {
      if (power.onTurnStartEffect) {
        this.applyCardEffect(power.onTurnStartEffect, undefined);
      }
    }
    for (const relic of this.relics) {
      for (const effect of relic.onTurnStart ?? []) this.applyCardEffect(effect, undefined);
    }
    this.fireTriggers('turnStart');
    this.pushLog(isFirstTurn ? 'Combat start.' : 'Your turn.');
    this.emitHandChanged();
    this.emit('turnStarted', { isFirstTurn });
    this.checkWinLoss();
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
    // Effect kinds that are player-only (no `resolveEnemy` in the registry) do nothing here.
    const out: EnemyMoveOutcome = { statusEvents: [], hpLosses: [] };
    for (const effect of move.effects) resolveEnemyEffect(effect, this.host, enemy, out);
    const { damage, blockGained, statusEvents, hpLosses } = out;

    const parts = [`${enemy.name} uses ${move.name}`];
    if (damage) parts.push(` for ${damage.amount} damage`);
    if (blockGained) parts.push(`${damage ? ', ' : ' '}gaining ${blockGained} block`);
    this.pushLog(`${parts.join('')}.`);

    this.emit('enemyMoveResolved', { enemyId: enemy.id, move, damage, blockGained });
    for (const event of statusEvents) this.emit('statusChanged', event);
    // After the move is announced, so the scene replays the reaction after the hit that caused it.
    for (let i = 0; i < hpLosses.length && this.player.hp > 0; i++) this.fireTriggers('hpLost');
  }

  /** Resolves one effect of a card the player played (or of one of their powers). `target` is the
   *  enemy the card was aimed at, if it has one. */
  private applyCardEffect(effect: Effect, target: EnemyState | undefined, fromAttackCard = false): void {
    resolvePlayerEffect(effect, this.host, target, fromAttackCard);
  }

  /** `effect.value`, plus its scaling (if any) times the live count; never below 0. */
  private scaledValue(effect: { value: number; scaling?: Scaling }, target: EnemyState | undefined): number {
    const scaling = effect.scaling;
    if (!scaling) return effect.value;
    return Math.max(0, effect.value + scaling.value * this.scaleCount(scaling, target));
  }

  private scaleCount(scaling: Scaling, target: EnemyState | undefined): number {
    switch (scaling.per) {
      case 'cardsPlayedThisTurn':
        return this.stats.cardsPlayedThisTurn;
      case 'attacksPlayedThisTurn':
        return this.stats.attacksPlayedThisTurn;
      case 'taggedPlayedThisTurn':
        return this.stats.taggedPlayedThisTurn[scaling.tag ?? ''] ?? 0;
      case 'block':
        return this.player.block;
      case 'strength':
        return this.player.statuses.strength ?? 0;
      case 'handSize':
        return this.deck.hand.length;
      case 'exhaustedThisCombat':
        return this.stats.exhaustedThisCombat;
      case 'targetVulnerable':
        return target?.statuses.vulnerable ?? 0;
    }
  }

  /** Announces a card that has just moved to the exhaust pile, counts it, and lets triggers react. */
  private noteExhausted(card: CardInstance | undefined): void {
    if (!card) return;
    this.stats.exhaustedThisCombat += 1;
    this.emit('cardExhausted', { card, exhaustPile: this.deck.exhaustPile.length });
    this.fireTriggers('cardExhausted');
  }

  /** One stack of each "used up by playing an attack" status (Empowered) is spent. */
  private consumeAttackStatuses(): void {
    for (const [id, stacks] of activeStatuses(this.player)) {
      if (!STATUSES[id].consumedByAttack) continue;
      if (stacks <= 1) delete this.player.statuses[id];
      else this.player.statuses[id] = stacks - 1;
      this.emit('statusChanged', { target: this.player.id, status: id, delta: -1, statuses: { ...this.player.statuses } });
    }
  }

  private addTriggers(triggers: Trigger[] | undefined): void {
    for (const trigger of triggers ?? []) this.triggers.push({ trigger, firedThisTurn: false });
  }

  /**
   * Runs every active trigger that reacts to `on`, in order. Triggered effects are NOT card plays
   * (no counters, no 'cardPlayed'), and events they cause can fire further triggers only
   * MAX_TRIGGER_DEPTH levels deep (the recursion guard). "target" for them is the first living enemy.
   */
  private fireTriggers(on: TriggerOn, played?: CardDefinition): void {
    if (this.phase === 'won' || this.phase === 'lost') return;
    if (this.triggerDepth >= MAX_TRIGGER_DEPTH) return;
    this.triggerDepth += 1;
    try {
      for (const active of [...this.triggers]) {
        const { trigger } = active;
        if (trigger.on !== on) continue;
        if (on === 'cardPlayed') {
          if (trigger.cardType && played?.type !== trigger.cardType) continue;
          if (trigger.tag && !played?.tags?.includes(trigger.tag)) continue;
        }
        if (trigger.oncePerTurn && active.firedThisTurn) continue;
        active.firedThisTurn = true;
        for (const effect of trigger.effects) this.applyCardEffect(effect, this.livingEnemies[0]);
      }
    } finally {
      this.triggerDepth -= 1;
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
      exhaustPile: this.deck.exhaustPile.length,
    });
  }

  private pushLog(message: string): void {
    this.log.push({ message });
  }
}

function activeStatuses(who: Combatant): [StatusId, number][] {
  return (Object.entries(who.statuses) as [StatusId, number][]).filter(([, stacks]) => stacks > 0);
}
