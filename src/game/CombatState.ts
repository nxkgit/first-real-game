import { Deck } from './Deck';
import { EventEmitter } from './EventEmitter';
import { Rng } from './rng';
import { PLAYER_ID } from './types';
import { intentBlockOf, intentDamageOf, previewEffectValue, resolveEnemyEffect, resolvePlayerEffect } from './effects';
import type { EffectHost, EnemyMoveOutcome } from './effects';
import type {
  CardDefinition,
  CardInstance,
  Combatant,
  CombatantId,
  DamageMultContext,
  Effect,
  EnemyDefinition,
  EnemyMove,
  EnemyState,
  HeroPowerDefinition,
  RelicDefinition,
  Scaling,
  StatusId,
  Statuses,
  Trigger,
  TriggerOn,
} from './types';
import { STATUSES } from '../data/statuses';
import {
  FREEZE_STUN_THRESHOLD,
  HAND_SIZE,
  MAX_ENERGY,
  MAX_HAND_SIZE,
  MAX_TRIGGER_DEPTH,
  PLAYER_MAX_HP,
  RADIANT_LIGHT_MAX,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
} from '../data/tunables';

/** Counters that scaling and the dev tools read. Per-turn ones reset as each player turn starts. */
export interface CombatStats {
  /** Cards played this turn so far (triggered effects are not card plays). */
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  /** Per tag: cards carrying it played this turn. */
  taggedPlayedThisTurn: Record<string, number>;
  /** Cards exhausted so far this combat (by any means). */
  exhaustedThisCombat: number;
  /** Cards materialized straight into the hand so far this combat (addCardToHand; Mage-only). The
   *  deck's total card count is not fixed once this is above 0 (see invariantHarness.ts). */
  cardsAddedThisCombat: number;
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
  /** The hero's once-per-turn active ability, if they have one (see CombatState.useHeroPower). */
  heroPower?: HeroPowerDefinition;
  /** Energy per turn (a hero's own number; default MAX_ENERGY). Ignored when restoring a snapshot, which carries its own. */
  maxEnergy?: number;
  /** A seeded stream to draw the fight's randomness from (instead of `random`). Needed to capture
   *  the fight exactly (see `exportState`). */
  rng?: Rng;
  /** Start from this exact state instead of a fresh shuffle (see `exportState`; scenario.ts turns
   *  JSON into one). `deckCards` is ignored and `start()` does not draw or run combat-start effects. */
  restore?: CombatSnapshot;
}

/**
 * Everything about a fight, between two of the player's plays, that can change what happens next,
 * as plain data. Built by `CombatState.exportState`, applied through `CombatOptions.restore`.
 * (Not captured, on purpose: the message log, the instance ids of cards, and the "just applied"
 * markers for statuses, which only matter during an enemy turn.)
 */
export interface CombatSnapshot {
  /** The fight's random stream: its seed and where it is now. */
  rng: { seed: number; position: number };
  turn: number;
  energy: number;
  maxEnergy: number;
  player: { hp: number; maxHp: number; block: number; statuses: Statuses };
  enemies: { definition: EnemyDefinition; hp: number; block: number; statuses: Statuses; moveIndex: number; stunnedTurns?: number }[];
  relics: RelicDefinition[];
  /** Cards by pile. `draw` is in drawing order (index 0 is drawn next). */
  piles: { draw: CardDefinition[]; hand: CardDefinition[]; discard: CardDefinition[]; exhaust: CardDefinition[]; powers: CardDefinition[] };
  stats: CombatStats;
  /** Whether each reactive ability has already fired this turn, in firing order (relics, then powers in the order played). */
  triggersFired: boolean[];
  /** Mage-only mechanics (optional so older snapshots/scenarios without them still load as 0/false). */
  temperature?: number;
  energizedTurnsRemaining?: number;
  heroPowerUsedThisTurn?: boolean;
  /** Paladin-only mechanic (optional so older snapshots/scenarios still load as 0). */
  radiantLight?: number;
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
  /** Mage-only: Temperature shifted (adjustTemperature). */
  temperatureChanged: { temperature: number; delta: number };
  /** Paladin-only: Radiant Light changed (a card gained it, or paid for a card). `radiantLight` is the new total. */
  radiantLightChanged: { radiantLight: number; delta: number };
  /** The hero power was used. */
  heroPowerUsed: Record<string, never>;
  /** Mage-only: an enemy's Freeze stacks crossed FREEZE_STUN_THRESHOLD and it owes a stunned move. */
  enemyStunned: { enemyId: CombatantId };
  /** Mage-only: an enemy skipped its move because it was stunned. */
  enemyTurnSkipped: { enemyId: CombatantId };
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

  /** Mage-only "Temperature" mechanic (implementationplan.md "Mage — Core Mechanics"): clamped to
   *  [TEMPERATURE_MIN, TEMPERATURE_MAX], starts at 0. Fire cards push it up, frost cards pull it down. */
  temperature = 0;
  /** Paladin-only placeholder resource: starts at 0, carries between turns, gained from cards, spent to play
   *  cards with `costResource: 'radiantLight'`. Clamped to [0, RADIANT_LIGHT_MAX]. */
  radiantLight = 0;
  /** The hero's once-per-turn active ability, if they have one. */
  readonly heroPower?: HeroPowerDefinition;
  heroPowerUsedThisTurn = false;
  /** Turns left (including this one, once startPlayerTurn grants it) of the hero power's +1 energy. */
  private energizedTurnsRemaining = 0;

  /** Synergy counters (see CombatStats). */
  readonly stats: CombatStats = { cardsPlayedThisTurn: 0, attacksPlayedThisTurn: 0, taggedPlayedThisTurn: {}, exhaustedThisCombat: 0, cardsAddedThisCombat: 0 };

  /** The stream the fight's randomness comes from, if it was given one (see CombatOptions.rng). */
  readonly rng: Rng | null;
  /** True when this fight began from a snapshot rather than a fresh shuffle. */
  private readonly restored: boolean;

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
  /** 1 while previewing a card that is still in the hand (see previewCardEffect), else 0. */
  private previewHandOffset = 0;

  constructor(deckCards: CardDefinition[], enemies: EnemyDefinition[], options: CombatOptions = {}) {
    super();
    const snapshot = options.restore;
    if (snapshot) enemies = snapshot.enemies.map((e) => e.definition);
    if (enemies.length === 0) throw new Error('a fight needs at least one enemy');
    const player = snapshot ? snapshot.player : (options.player ?? { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP });
    this.relics = snapshot ? snapshot.relics : (options.relics ?? []);
    this.rng = snapshot ? Rng.restore(snapshot.rng.seed, snapshot.rng.position) : (options.rng ?? null);
    const stream = this.rng;
    const random = stream ? () => stream.next() : (options.random ?? Math.random);
    for (const relic of this.relics) this.addTriggers(relic.triggers);
    this.deck = new Deck(snapshot ? [] : deckCards, random);
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
    this.heroPower = options.heroPower;
    this.maxEnergy = options.maxEnergy ?? MAX_ENERGY;
    this.restored = snapshot !== undefined;
    if (snapshot) this.applySnapshot(snapshot);
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
      livingEnemies: () => this.livingEnemies,
      adjustTemperature: (delta) => this.adjustTemperature(delta),
      gainEnergizedTurns: (turns) => (this.energizedTurnsRemaining += turns),
      gainRadiantLight: (amount) => this.gainRadiantLight(amount),
      addCardsToHand: (definition, count) => this.addCardsToHand(definition, count),
      calcBlock: (base, who) => this.calcBlock(base, who),
      consumeBufferIfPresent: (target) => this.consumeBufferIfPresent(target),
    };
  }

  /** Puts a snapshot's state in place. The constructor has already built the relic triggers, in order. */
  private applySnapshot(s: CombatSnapshot): void {
    this.deck.loadPiles(s.piles);
    this.turnNumber = s.turn;
    this.energy = s.energy;
    this.maxEnergy = s.maxEnergy;
    this.player.block = s.player.block;
    this.player.statuses = { ...s.player.statuses };
    this.enemies.forEach((enemy, i) => {
      const from = s.enemies[i];
      enemy.hp = from.hp;
      enemy.block = from.block;
      enemy.statuses = { ...from.statuses };
      enemy.moveIndex = from.moveIndex;
      enemy.stunnedTurns = from.stunnedTurns ?? 0;
    });
    this.temperature = s.temperature ?? 0;
    this.radiantLight = s.radiantLight ?? 0;
    this.energizedTurnsRemaining = s.energizedTurnsRemaining ?? 0;
    this.heroPowerUsedThisTurn = s.heroPowerUsedThisTurn ?? false;
    this.stats.cardsPlayedThisTurn = s.stats.cardsPlayedThisTurn;
    this.stats.attacksPlayedThisTurn = s.stats.attacksPlayedThisTurn;
    this.stats.taggedPlayedThisTurn = { ...s.stats.taggedPlayedThisTurn };
    this.stats.exhaustedThisCombat = s.stats.exhaustedThisCombat;
    this.stats.cardsAddedThisCombat = s.stats.cardsAddedThisCombat;
    // powers already in play: their reactive abilities follow the relics', in the order they were played
    for (const power of s.piles.powers) {
      this.activePowers.push(power);
      this.addTriggers(power.triggers);
    }
    this.triggers.forEach((t, i) => (t.firedThisTurn = s.triggersFired[i] ?? false));
  }

  /**
   * The fight as plain data, to be restored later with `CombatOptions.restore`. Only possible on the
   * player's turn (between plays) and only for a fight built with a seeded `rng`; otherwise the
   * random stream could not be put back and a replay would differ.
   */
  exportState(): CombatSnapshot {
    if (!this.rng) throw new Error('this fight was not given a seeded Rng, so it cannot be captured exactly');
    if (this.phase !== 'playerTurn') throw new Error(`a fight can only be captured on the player's turn (it is "${this.phase}")`);
    const definitions = (pile: CardInstance[]): CardDefinition[] => pile.map((c) => c.definition);
    return {
      rng: { seed: this.rng.seed, position: this.rng.position },
      turn: this.turnNumber,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      player: { hp: this.player.hp, maxHp: this.player.maxHp, block: this.player.block, statuses: { ...this.player.statuses } },
      enemies: this.enemies.map((e) => ({
        definition: e.definition,
        hp: e.hp,
        block: e.block,
        statuses: { ...e.statuses },
        moveIndex: e.moveIndex,
        stunnedTurns: e.stunnedTurns ?? 0,
      })),
      relics: [...this.relics],
      temperature: this.temperature,
      radiantLight: this.radiantLight,
      energizedTurnsRemaining: this.energizedTurnsRemaining,
      heroPowerUsedThisTurn: this.heroPowerUsedThisTurn,
      piles: {
        draw: definitions(this.deck.drawPile).reverse(),
        hand: definitions(this.deck.hand),
        discard: definitions(this.deck.discardPile),
        exhaust: definitions(this.deck.exhaustPile),
        powers: definitions(this.deck.powerPile),
      },
      stats: { ...this.stats, taggedPlayedThisTurn: { ...this.stats.taggedPlayedThisTurn } },
      triggersFired: this.triggers.map((t) => t.firedThisTurn),
    };
  }

  start(): void {
    if (this.restored) {
      // a fight picked up mid-way: nothing is drawn and no combat-start effect runs, but the scene
      // still needs the hand and the turn announced so it can lay itself out
      this.pushLog('Scenario loaded.');
      this.emitHandChanged();
      this.emit('turnStarted', { isFirstTurn: false });
      this.checkWinLoss();
      return;
    }
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
    const ctx: DamageMultContext = { attacksPlayedThisTurn: this.stats.attacksPlayedThisTurn };
    for (const [id, stacks] of activeStatuses(attacker)) {
      amount += STATUSES[id].outgoingDamageAdd?.(stacks) ?? 0;
    }
    for (const [id, stacks] of activeStatuses(attacker)) {
      if (STATUSES[id].consumedByAttack && !fromAttackCard) continue;
      amount *= STATUSES[id].outgoingDamageMult?.(stacks, ctx) ?? 1;
    }
    for (const [id, stacks] of activeStatuses(defender)) {
      amount *= STATUSES[id].incomingDamageMult?.(stacks) ?? 1;
    }
    amount = Math.max(0, Math.floor(amount));
    // Intangible-style caps apply last, after every other modifier, and only ever lower the amount.
    let cap = Infinity;
    for (const [id, stacks] of activeStatuses(defender)) {
      const c = STATUSES[id].incomingDamageCap?.(stacks);
      if (c !== undefined) cap = Math.min(cap, c);
    }
    return Math.min(amount, cap);
  }

  /** The number one effect of `card` would really produce right now if the card were played on
   *  `target` (Strength, Weak, Vulnerable, Empowered, scaling), or undefined if the effect shows no
   *  number. Goes through the effect registry, so it uses the same rules as playing the card; it
   *  changes nothing. For the live numbers on card faces. */
  previewCardEffect(card: CardDefinition, effect: Effect, target: EnemyState | undefined): number | undefined {
    // a played card has already left the hand when its effects resolve, so don't count it in "hand size"
    this.previewHandOffset = this.deck.hand.some((c) => c.definition === card) ? 1 : 0;
    try {
      const host = { ...this.host, previewDraw: (count: number) => this.previewDraw(count, card) };
      return previewEffectValue(effect, host, target, card.type === 'attack');
    } finally {
      this.previewHandOffset = 0;
    }
  }

  /** How many of `count` drawn cards would land in the hand: replays `Deck.draw` on pile sizes only
   *  (a full hand sends the card to the discard pile; an empty draw pile reshuffles the discard pile). */
  private previewDraw(count: number, playing: CardDefinition): number {
    let hand = this.deck.hand.length - this.previewHandOffset;
    let pile = this.deck.drawPile.length;
    // the played card is in the discard pile by the time its effects resolve (a power is kept in play instead)
    let discard = this.deck.discardPile.length + (this.previewHandOffset === 1 && playing.type !== 'power' ? 1 : 0);
    let drawn = 0;
    for (let i = 0; i < Math.min(count, 200); i++) {
      if (pile === 0) {
        if (discard === 0) break;
        pile = discard;
        discard = 0;
      }
      pile -= 1;
      if (hand >= MAX_HAND_SIZE) discard += 1;
      else {
        hand += 1;
        drawn += 1;
      }
    }
    return drawn;
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
    return this.phase === 'playerTurn' && !card.definition.unplayable && card.definition.cost <= this.resourceFor(card.definition);
  }

  /** How much of the resource that pays for `card` the player has right now (energy, or Radiant Light). */
  private resourceFor(card: CardDefinition): number {
    return card.costResource === 'radiantLight' ? this.radiantLight : this.energy;
  }

  canUseHeroPower(): boolean {
    return (
      this.phase === 'playerTurn' && !!this.heroPower && !this.heroPowerUsedThisTurn && this.heroPower.cost <= this.energy
    );
  }

  /** Uses the hero's once-per-turn ability (not a card: no hand/discard/exhaust involvement). */
  useHeroPower(): boolean {
    if (!this.heroPower || !this.canUseHeroPower()) return false;
    const power = this.heroPower;
    this.energy -= power.cost;
    this.heroPowerUsedThisTurn = true;
    for (const effect of power.effects) this.applyCardEffect(effect, this.livingEnemies[0]);
    this.pushLog(`Used ${power.name}.`);
    this.emit('energyChanged', { energy: this.energy, delta: -power.cost });
    this.emit('heroPowerUsed', {});
    this.checkWinLoss();
    return true;
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

    if (handCard.definition.costResource === 'radiantLight') {
      this.radiantLight -= handCard.definition.cost;
      this.emit('radiantLightChanged', { radiantLight: this.radiantLight, delta: -handCard.definition.cost });
    } else {
      this.energy -= handCard.definition.cost;
    }
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
    // Ethereal cards (a keyword, see types.ts) exhaust here instead of discarding; Retain cards stay.
    for (const card of this.deck.discardHand()) this.noteExhausted(card);
    this.emitHandChanged();
    this.runEnemyTurn();
  }

  private startPlayerTurn(isFirstTurn = false): void {
    this.phase = 'playerTurn';
    this.turnNumber += 1;
    // the first turn keeps any block that combat-start effects (relics) just gave
    if (!isFirstTurn) this.player.block = 0;
    this.energy = this.maxEnergy;
    this.heroPowerUsedThisTurn = false;
    if (this.energizedTurnsRemaining > 0) {
      this.energizedTurnsRemaining -= 1;
      this.energy += 1;
      this.emit('energyChanged', { energy: this.energy, delta: 1 });
    }
    this.stats.cardsPlayedThisTurn = 0;
    this.stats.attacksPlayedThisTurn = 0;
    this.stats.taggedPlayedThisTurn = {};
    for (const t of this.triggers) t.firedThisTurn = false;
    this.deck.draw(HAND_SIZE);
    for (const power of this.activePowers) {
      if (power.onTurnStartEffect) {
        // first living enemy, like a trigger's effects (undefined targets are self-only anyway)
        this.applyCardEffect(power.onTurnStartEffect, this.livingEnemies[0]);
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
      // Mage-only Freeze: a stunned enemy skips this move entirely (moveIndex does not advance,
      // so it still intends the same move once the stun wears off).
      if (enemy.stunnedTurns && enemy.stunnedTurns > 0) {
        enemy.stunnedTurns -= 1;
        this.pushLog(`${enemy.name} is frozen solid and skips its turn.`);
        this.emit('enemyTurnSkipped', { enemyId: enemy.id });
        continue;
      }
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
        return this.deck.hand.length - this.previewHandOffset;
      case 'exhaustedThisCombat':
        return this.stats.exhaustedThisCombat;
      case 'targetVulnerable':
        return target?.statuses.vulnerable ?? 0;
      case 'targetFreeze':
        return target?.statuses.freeze ?? 0;
      case 'temperature':
        return this.temperature;
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

  /** Applies damage through block and returns what happened. The caller announces it. Buffer (a
   *  keyword status, see types.ts) can cancel the HP loss that would follow block, consuming one
   *  stack; `amount`/`absorbed` still reflect the real hit and block absorption. */
  private dealDamage(target: Combatant, amount: number): DamageResult {
    const absorbed = Math.min(target.block, amount);
    target.block -= absorbed;
    const remainder = amount - absorbed;
    if (remainder <= 0 || !this.consumeBufferIfPresent(target)) {
      target.hp = Math.max(0, target.hp - remainder);
    }
    return { amount, absorbed, remainingHp: target.hp };
  }

  /** Buffer (a keyword status, see types.ts): if `target` has any stacks, consumes one and returns
   *  true (the caller then skips reducing HP for this hit/loss). Independent of block. */
  private consumeBufferIfPresent(target: Combatant): boolean {
    const stacks = target.statuses.buffer ?? 0;
    if (stacks <= 0) return false;
    if (stacks <= 1) delete target.statuses.buffer;
    else target.statuses.buffer = stacks - 1;
    this.emit('statusChanged', { target: target.id, status: 'buffer', delta: -1, statuses: { ...target.statuses } });
    return true;
  }

  /** `base` block, after Frail (a keyword status, see types.ts) multiplies it down; same shape as
   *  calcDamage's multiply stage, floored once. */
  private calcBlock(base: number, who: Combatant): number {
    let amount = base;
    for (const [id, stacks] of activeStatuses(who)) {
      amount *= STATUSES[id].blockMult?.(stacks) ?? 1;
    }
    return Math.max(0, Math.floor(amount));
  }

  /** Adds stacks and returns the matching event for the caller to emit. */
  private addStatus(target: Combatant, id: StatusId, stacks: number): CombatEventMap['statusChanged'] {
    target.statuses[id] = (target.statuses[id] ?? 0) + stacks;
    if (id === 'freeze' && stacks > 0) this.checkFreezeStun(target);
    return { target: target.id, status: id, delta: stacks, statuses: { ...target.statuses } };
  }

  /** Mage-only Freeze: every FREEZE_STUN_THRESHOLD stacks on an enemy stuns it for one move and
   *  removes those stacks (a big single application can cross the threshold more than once). */
  private checkFreezeStun(target: Combatant): void {
    const enemy = this.enemies.find((e) => e.id === target.id);
    if (!enemy) return; // only enemies can be stunned; freeze cards are all aimed at enemies
    while ((enemy.statuses.freeze ?? 0) >= FREEZE_STUN_THRESHOLD) {
      const next = (enemy.statuses.freeze ?? 0) - FREEZE_STUN_THRESHOLD;
      if (next <= 0) delete enemy.statuses.freeze; // never leave a 0-stack status key behind
      else enemy.statuses.freeze = next;
      enemy.stunnedTurns = (enemy.stunnedTurns ?? 0) + 1;
      this.pushLog(`${enemy.name} is frozen solid!`);
      this.emit('enemyStunned', { enemyId: enemy.id });
    }
  }

  /** Shifts Temperature by `delta`, clamped to [TEMPERATURE_MIN, TEMPERATURE_MAX], and returns the new value. */
  private adjustTemperature(delta: number): number {
    this.temperature = Math.min(TEMPERATURE_MAX, Math.max(TEMPERATURE_MIN, this.temperature + delta));
    return this.temperature;
  }

  /** Gains Radiant Light (clamped to RADIANT_LIGHT_MAX) and returns the new total and the real change. */
  private gainRadiantLight(amount: number): { radiantLight: number; delta: number } {
    const before = this.radiantLight;
    this.radiantLight = Math.min(RADIANT_LIGHT_MAX, Math.max(0, before + amount));
    return { radiantLight: this.radiantLight, delta: this.radiantLight - before };
  }

  /** Mage-only: materializes new cards straight into the hand (Molten Core). Counted in
   *  `stats.cardsAddedThisCombat` since it breaks the usual "the deck's total card count is fixed"
   *  assumption (see invariantHarness.ts). */
  private addCardsToHand(definition: CardDefinition, count: number): number {
    const added = this.deck.addCopiesToHand(definition, count);
    this.stats.cardsAddedThisCombat += count;
    return added;
  }

  private tickStatuses(target: Combatant): void {
    for (const [id, stacks] of activeStatuses(target)) {
      // clearAtTurnEnd (ignite): gone entirely at the next tick, regardless of kind or freshness —
      // "lasts only until the end of the turn it was granted", not a 1-per-round countdown.
      if (STATUSES[id].clearAtTurnEnd) {
        delete target.statuses[id];
        this.emit('statusChanged', { target: target.id, status: id, delta: -stacks, statuses: { ...target.statuses } });
        continue;
      }
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
