import Phaser from 'phaser';
import { CombatState } from '../game/CombatState';
import type { CombatEventMap } from '../game/CombatState';
import type { FightTier, RunState } from '../game/RunState';
import type { CardInstance, EnemyDefinition } from '../game/types';
import { PLAYER_ID } from '../game/types';
import { Sfx } from '../audio/Sfx';
import { useLayoutCamera } from '../display';
import { setCurrentCombat } from '../session';
import { STATUSES } from '../data/statuses';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  addButton,
  addDeckButton,
  addRunHud,
  addSettingsButton,
  buildCardFace,
  closeDeckView,
  enterCurrentNode,
  isDeckViewOpen,
  onKeyPress,
  shakeCamera,
  toggleCardView,
  toggleDeckView,
} from './ui';
import { EnemyView } from './combat/EnemyView';
import { PlayerView } from './combat/PlayerView';
import { Targeting } from './combat/Targeting';
import { Tooltips } from './combat/Tooltips';
import { DISCARD_PILE_POS, DRAW_PILE_POS, HAND_Y, PLAYER_X, PLAYER_Y, enemySlots } from './combat/layout';

interface TrackedCard {
  container: Phaser.GameObjects.Container;
}

type AnimStep = () => Promise<void>;

/**
 * The fight screen. It shows a CombatState and sends the player's actions into it; it owns no game
 * rules. The pieces it is built from live in ./combat: the two kinds of character readout
 * (PlayerView, EnemyView), card aiming (Targeting), and hover tips (Tooltips).
 */
export class CombatScene extends Phaser.Scene {
  private combat!: CombatState;
  private run!: RunState;
  private enemyDefinitions!: EnemyDefinition[];
  private tier: FightTier = 'normal';

  private playerView!: PlayerView;
  private enemyViews: EnemyView[] = [];
  private targeting!: Targeting;
  private tooltips!: Tooltips;

  private handCards = new Map<string, TrackedCard>();
  private handContainer!: Phaser.GameObjects.Container;

  /** Non-null while buffering events from a single synchronous combat action so their
   *  animations can be replayed in order instead of firing all at once. */
  private sequencer: AnimStep[] | null = null;
  /** True while an animation sequence is playing and the player can't act. */
  private inputLocked = false;

  private statusText!: Phaser.GameObjects.Text;
  private drawCountText!: Phaser.GameObjects.Text;
  private discardCountText!: Phaser.GameObjects.Text;

  private endTurnButton!: Phaser.GameObjects.Rectangle;
  private endTurnText!: Phaser.GameObjects.Text;
  private turnBanner!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;

  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private blockParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('CombatScene');
  }

  /** Runs on every (re)start. Phaser reuses the scene instance, so per-fight state is reset here. */
  init(data: { run: RunState }): void {
    this.run = data.run;
    const node = this.run.currentNode;
    if (node.kind !== 'combat') throw new Error('CombatScene started on a non-combat node');
    this.enemyDefinitions = node.enemies;
    this.tier = node.tier;
    this.handCards = new Map();
    this.enemyViews = [];
    this.sequencer = null;
    this.inputLocked = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.createParticleEmitters();
    this.buildBackground();
    const hud = addRunHud(this, this.run);
    addDeckButton(this, this.run, hud.x + hud.width + 70, () => this.targeting?.cancel());
    addSettingsButton(this);

    // the fight's shuffles come from the run's seeded stream, so a replayed or resumed run is identical
    const fightRng = this.run.newCombatRng();
    this.combat = new CombatState(this.run.deck, this.enemyDefinitions, {
      player: { hp: this.run.hp, maxHp: this.run.maxHp },
      random: () => fightRng.next(),
      relics: this.run.relics,
    });
    setCurrentCombat(this.combat);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => setCurrentCombat(null));
    this.tooltips = new Tooltips(this);
    this.playerView = new PlayerView(this, this.combat, this.tooltips);
    const slots = enemySlots(this.combat.enemies.length);
    const crowded = this.combat.enemies.length > 1;
    this.enemyViews = this.combat.enemies.map(
      (enemy, i) => new EnemyView(this, enemy, slots[i], crowded, this.combat, this.tooltips)
    );
    this.buildPileTooltips();
    this.buildHandArea();
    this.targeting = new Targeting(this, this.enemyViews, this.handContainer, (card, enemyId) =>
      this.combat.playCard(card.instanceId, enemyId)
    );
    this.buildOverlays();

    this.wireCombatEvents();
    this.bindKeys();
    this.combat.start();
  }

  update(): void {
    this.targeting?.update(this.input.activePointer);
  }

  private viewFor(enemyId: string): EnemyView {
    const view = this.enemyViews.find((v) => v.id === enemyId);
    if (!view) throw new Error(`no view for ${enemyId}`);
    return view;
  }

  // ---------- static scene construction ----------

  private createParticleEmitters(): void {
    if (!this.textures.exists('particle')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture('particle', 8, 8);
      g.destroy();
    }

    this.hitParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 220 },
      lifespan: 400,
      scale: { start: 1, end: 0 },
      tint: [0xff8a5c, 0xffcf4a],
      quantity: 14,
      emitting: false,
    });
    this.blockParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 160 },
      lifespan: 450,
      scale: { start: 0.9, end: 0 },
      tint: [0x6fc3ff, 0xaee4ff],
      quantity: 12,
      emitting: false,
    });
  }

  private buildBackground(): void {
    this.add.rectangle(400, 300, 800, 600, 0x14141c).setOrigin(0.5);
    this.add.rectangle(400, 220, 680, 300, 0x201a28, 0.6).setOrigin(0.5);
    // ground line to give the characters something to stand on
    this.add.rectangle(400, 340, 680, 2, 0x35304a).setOrigin(0.5);

    this.add
      .rectangle(DRAW_PILE_POS.x, DRAW_PILE_POS.y, 54, 76, 0x2a2a3a)
      .setStrokeStyle(2, 0x45455a)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openPile('draw'));
    this.add.text(DRAW_PILE_POS.x, DRAW_PILE_POS.y + 48, 'Draw', { fontSize: '11px', color: '#777788' }).setOrigin(0.5);
    this.drawCountText = this.add
      .text(DRAW_PILE_POS.x, DRAW_PILE_POS.y, '', { fontSize: '20px', color: '#c8c8d8', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .rectangle(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, 54, 76, 0x2a2a3a)
      .setStrokeStyle(2, 0x45455a)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openPile('discard'));
    this.add
      .text(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y + 48, 'Discard', { fontSize: '11px', color: '#777788' })
      .setOrigin(0.5);
    this.discardCountText = this.add
      .text(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, '', { fontSize: '20px', color: '#c8c8d8', fontStyle: 'bold' })
      .setOrigin(0.5);

    // the last couple of log lines, in the gap between the run readout and the End Turn button
    this.statusText = this.add
      .text(495, 28, '', { fontSize: '12px', color: '#9a9aae', align: 'center', wordWrap: { width: 300 } })
      .setOrigin(0.5);
  }

  /** Shows what is in a pile, in name order (not draw order). Only between animations, so it matches the counts. */
  private openPile(which: 'draw' | 'discard'): void {
    if (this.inputLocked && !isDeckViewOpen(this)) return;
    this.targeting?.cancel();
    const pile = which === 'draw' ? this.combat.deck.drawPile : this.combat.deck.discardPile;
    const cards = pile.map((c) => c.definition).sort((a, b) => a.name.localeCompare(b.name));
    const name = which === 'draw' ? 'Draw pile' : 'Discard pile';
    toggleCardView(this, `${name} (${cards.length} cards${which === 'draw' ? ', not in draw order' : ''})`, cards);
  }

  private buildPileTooltips(): void {
    this.tooltips.add(DRAW_PILE_POS.x, DRAW_PILE_POS.y, 54, 76, () =>
      `Draw pile: ${this.drawCountText.text} cards. When it runs out, the discard pile is shuffled back in.`
    );
    this.tooltips.add(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, 54, 76, () => `Discard pile: ${this.discardCountText.text} cards.`);
  }

  private buildHandArea(): void {
    this.handContainer = this.add.container(0, 0);

    this.endTurnButton = this.add
      .rectangle(720, 30, 130, 50, 0x2b6b3d)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x4fae6f)
      .setInteractive({ useHandCursor: true });
    this.endTurnText = this.add.text(720, 30, 'End Turn', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.endTurnButton.on('pointerdown', () => this.onEndTurn());
    this.endTurnButton.on('pointerover', () => {
      this.tweens.add({ targets: [this.endTurnButton, this.endTurnText], scale: 1.05, duration: 100 });
    });
    this.endTurnButton.on('pointerout', () => {
      this.tweens.add({ targets: [this.endTurnButton, this.endTurnText], scale: 1, duration: 100 });
    });
  }

  private buildOverlays(): void {
    this.turnBanner = this.add
      .text(400, 240, '', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.resultText = this.add
      .text(400, 240, '', { fontSize: '40px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(21);
  }

  // ---------- event wiring ----------

  /** Keyboard shortcuts: 1-9 play that card from the hand (aimed cards go to the first living
   *  enemy), E ends the turn, D toggles the deck view, Esc cancels aiming or closes it. */
  private bindKeys(): void {
    onKeyPress(this, (key) => {
      if (key === 'escape') {
        if (isDeckViewOpen(this)) closeDeckView(this);
        else this.targeting.cancel();
        return;
      }
      if (key === 'd') {
        this.targeting.cancel();
        toggleDeckView(this, this.run);
        return;
      }
      if (isDeckViewOpen(this) || this.inputLocked || this.combat.phase !== 'playerTurn') return;
      if (key === 'e') {
        this.onEndTurn();
        return;
      }
      const slot = Number(key);
      if (Number.isInteger(slot) && slot >= 1 && slot <= 9) {
        const card = this.combat.deck.hand[slot - 1];
        if (!card || !this.combat.canPlay(card)) return;
        this.targeting.cancel();
        const targetId = card.definition.target ? this.combat.livingEnemies[0]?.id : undefined;
        this.combat.playCard(card.instanceId, targetId);
      }
    });
  }

  private wireCombatEvents(): void {
    this.combat.on('cardPlayed', ({ card, targetId }) => this.handleCardPlayed(card, targetId));
    this.combat.on('handChanged', (snapshot) => this.queue(() => this.syncHand(snapshot)));
    this.combat.on('turnStarted', ({ isFirstTurn }) =>
      this.queue(async () => {
        this.refreshStatusBars();
        if (isFirstTurn && this.tier !== 'normal') await this.showTurnBanner(this.tier === 'boss' ? 'BOSS FIGHT' : 'ELITE FIGHT');
        if (!isFirstTurn) await this.showTurnBanner('YOUR TURN');
      })
    );
    this.combat.on('enemyTurnStarted', () => this.queue(() => this.showTurnBanner('ENEMY TURN')));
    this.combat.on('enemyMoveResolved', (payload) => this.queue(() => this.animateEnemyMove(payload)));
    this.combat.on('damageDealt', (payload) => {
      if (payload.target !== PLAYER_ID) this.queue(() => this.animateEnemyImpact(payload));
    });
    this.combat.on('enemyDied', ({ enemyId }) => this.queue(() => this.animateEnemyDeath(enemyId)));
    this.combat.on('blockGained', (payload) => {
      if (payload.target === PLAYER_ID) this.queue(() => this.animatePlayerBlockGain(payload.amount));
    });
    this.combat.on('statusChanged', (payload) => this.queue(() => this.animateStatusChange(payload)));
    this.combat.on('combatEnded', ({ result }) => this.queue(() => this.animateCombatEnd(result)));
  }

  /** Buffers an animation step while a sequencing scope is active; runs immediately otherwise. */
  private queue(step: AnimStep): void {
    if (this.sequencer) {
      this.sequencer.push(step);
    } else {
      void step();
    }
  }

  private onEndTurn(): void {
    if (this.combat.phase !== 'playerTurn' || this.sequencer) return;
    this.lockInput(true);

    this.sequencer = [];
    this.combat.endPlayerTurn();
    const steps = this.sequencer;
    this.sequencer = null;

    void this.runSteps(steps);
  }

  private async runSteps(steps: AnimStep[]): Promise<void> {
    for (const step of steps) {
      await step();
    }
    this.lockInput(false);
    this.refreshStatusBars();
  }

  private lockInput(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) this.targeting.cancel();
    this.setHandInteractive(!locked);
    if (locked) {
      this.endTurnButton.disableInteractive().setAlpha(0.4);
    } else if (this.combat.phase === 'playerTurn') {
      this.endTurnButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    }
  }

  // ---------- small async animation primitives ----------

  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve() });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // ---------- card play ----------

  private handleCardPlayed(card: CardInstance, targetId?: string): void {
    const tracked = this.handCards.get(card.instanceId);
    if (!tracked) return;
    this.handCards.delete(card.instanceId);

    this.lockInput(true);
    const impactSteps: AnimStep[] = [];
    this.sequencer = impactSteps;
    void this.resolveCardPlay(tracked.container, targetId, impactSteps);
  }

  private async resolveCardPlay(
    container: Phaser.GameObjects.Container,
    targetId: string | undefined,
    impactSteps: AnimStep[]
  ): Promise<void> {
    if (targetId) {
      // an aimed card flies at the enemy it was played on
      const view = this.viewFor(targetId);
      Sfx.cardPlay();
      await this.tweenPromise({
        targets: container,
        x: view.x,
        y: view.y,
        scale: 0.3,
        alpha: 0,
        duration: 260,
        ease: 'Cubic.easeIn',
      });
    } else {
      Sfx.cast();
      await this.tweenPromise({ targets: container, scale: 1.25, duration: 120, ease: 'Sine.easeOut' });
      await this.tweenPromise({ targets: container, scale: 0.3, alpha: 0, duration: 180, ease: 'Cubic.easeIn' });
    }
    container.destroy();

    this.sequencer = null; // buffered events for this play are now replayed directly, in order
    for (const step of impactSteps) {
      await step();
    }
    this.refreshStatusBars();

    if (this.combat.phase === 'playerTurn') this.lockInput(false);
  }

  /** Lays the hand out to match `snapshot` — the hand as it was when that change happened, not
   *  the live deck, which by now may be further along (see CombatEventMap['handChanged']). */
  private syncHand(snapshot: CombatEventMap['handChanged']): Promise<void> {
    this.drawCountText.setText(`${snapshot.drawPile}`);
    this.discardCountText.setText(`${snapshot.discardPile}`);
    const hand = snapshot.hand;
    const totalWidth = hand.length * (CARD_WIDTH + 10);
    const startX = 400 - totalWidth / 2 + CARD_WIDTH / 2;

    const seenIds = new Set<string>();
    const animations: Promise<void>[] = [];

    hand.forEach((card, i) => {
      seenIds.add(card.instanceId);
      const slotX = startX + i * (CARD_WIDTH + 10);
      const existing = this.handCards.get(card.instanceId);
      const canPlay = this.combat.canPlay(card);

      if (existing) {
        this.tweens.add({ targets: existing.container, x: slotX, y: HAND_Y, duration: 220, ease: 'Cubic.easeOut' });
        this.setCardPlayable(existing.container, canPlay);
      } else {
        const container = this.buildCardVisual(card, canPlay);
        container.setPosition(DRAW_PILE_POS.x, DRAW_PILE_POS.y);
        container.setScale(0.6);
        container.setAlpha(0);
        this.handContainer.add(container);
        this.handCards.set(card.instanceId, { container });

        const targetAlpha = canPlay ? 1 : 0.55;
        animations.push(
          this.tweenPromise({
            targets: container,
            x: slotX,
            y: HAND_Y,
            scale: 1,
            alpha: targetAlpha,
            duration: 280,
            ease: 'Back.Out',
          })
        );
        Sfx.draw();
      }
    });

    // Anything tracked but no longer in hand (end-of-turn discard) exits toward the discard pile.
    for (const [id, tracked] of [...this.handCards.entries()]) {
      if (seenIds.has(id)) continue;
      this.handCards.delete(id);
      animations.push(
        this.tweenPromise({
          targets: tracked.container,
          x: DISCARD_PILE_POS.x,
          y: DISCARD_PILE_POS.y,
          scale: 0.5,
          alpha: 0,
          duration: 240,
          ease: 'Cubic.easeIn',
        }).then(() => tracked.container.destroy())
      );
    }

    return Promise.all(animations).then(() => undefined);
  }

  private buildCardVisual(card: CardInstance, canPlay: boolean): Phaser.GameObjects.Container {
    const container = buildCardFace(this, card.definition);
    const hitZone = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0);

    container.add(hitZone);
    container.setData('hitZone', hitZone);

    hitZone.on('pointerover', () => {
      if (this.targeting.isHolding(container)) return;
      this.handContainer.bringToTop(container);
      this.tweens.add({ targets: container, y: HAND_Y - 22, scale: 1.06, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      if (this.targeting.isHolding(container)) return;
      this.tweens.add({ targets: container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.combat.phase !== 'playerTurn' || pointer.rightButtonDown()) return;
      if (card.definition.target === 'enemy') {
        // clicking the card that's already picked up puts it back
        if (this.targeting.heldCard === card) this.targeting.cancel();
        else this.targeting.begin(card, container, pointer);
      } else {
        this.targeting.cancel();
        this.combat.playCard(card.instanceId);
      }
    });

    this.setCardPlayable(container, canPlay);
    return container;
  }

  private setCardPlayable(container: Phaser.GameObjects.Container, canPlay: boolean): void {
    container.setAlpha(canPlay ? 1 : 0.55);
    const hitZone = container.getData('hitZone') as Phaser.GameObjects.Rectangle | undefined;
    if (!hitZone) return;
    if (canPlay) hitZone.setInteractive({ useHandCursor: true });
    else hitZone.disableInteractive();
  }

  private setHandInteractive(enabled: boolean): void {
    for (const { container } of this.handCards.values()) {
      const hitZone = container.getData('hitZone') as Phaser.GameObjects.Rectangle | undefined;
      if (!hitZone) continue;
      if (enabled) hitZone.setInteractive({ useHandCursor: true });
      else hitZone.disableInteractive();
    }
  }

  // ---------- combat feedback animations ----------

  private async showTurnBanner(label: string): Promise<void> {
    this.turnBanner.setText(label).setScale(0.7).setAlpha(0);
    await this.tweenPromise({ targets: this.turnBanner, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    await this.delay(450);
    await this.tweenPromise({ targets: this.turnBanner, alpha: 0, duration: 220 });
  }

  /** One enemy's move. Everything shown comes from the event (what this move did), not live state:
   *  the rules have already run on to your next turn, which appears when its own events replay. */
  private async animateEnemyMove(payload: CombatEventMap['enemyMoveResolved']): Promise<void> {
    const view = this.viewFor(payload.enemyId);
    const { damage, blockGained } = payload;

    if (damage) {
      // enemy lunges toward the player as the windup/attack motion
      const lungeX = view.x - (view.x - PLAYER_X) * 0.22;
      await this.tweenPromise({ targets: view.container, x: lungeX, duration: 140, ease: 'Sine.easeIn' });
      shakeCamera(this, 180, Phaser.Math.Clamp(damage.amount / 900, 0.004, 0.012));
      this.flashCharacter(PLAYER_X, PLAYER_Y);
      this.punchCharacter(this.playerView.container);
      Sfx.hitPlayer();
      this.spawnFloatingText(PLAYER_X + 50, PLAYER_Y - 100, `-${damage.amount - damage.absorbed}`, '#ff6b6b');
      await this.tweenPromise({ targets: view.container, x: view.x, duration: 160, ease: 'Sine.easeOut' });
    }
    if (blockGained) {
      await this.tweenPromise({ targets: view.container, scale: view.baseScale * 1.12, duration: 160, ease: 'Sine.easeOut' });
      this.flashCharacter(view.x, view.y, 0x6fc3ff);
      this.blockParticles.explode(10, view.x, view.y);
      Sfx.block();
      this.spawnFloatingText(view.x, view.y - 100, `+${blockGained}`, '#9fd3ff');
      await this.tweenPromise({ targets: view.container, scale: view.baseScale, duration: 160, ease: 'Sine.easeIn' });
    }
    if (!damage && !blockGained) {
      // buff/debuff: the enemy gathers itself; the badges themselves appear from statusChanged events
      await this.tweenPromise({ targets: view.container, scale: view.baseScale * 1.12, duration: 160, ease: 'Sine.easeOut' });
      this.flashCharacter(view.x, view.y, 0xb07de0);
      Sfx.cast();
      await this.tweenPromise({ targets: view.container, scale: view.baseScale, duration: 160, ease: 'Sine.easeIn' });
    }

    if (damage) {
      this.playerView.setHp(damage.remainingHp, this.combat.player.maxHp);
      this.playerView.setBlock(Math.max(0, this.playerView.displayedBlock - damage.absorbed));
    }
    view.setBlock(blockGained ?? 0); // an enemy's block resets as it starts its move
    if (this.combat.phase === 'playerTurn' && view.alive) view.pulseIntent();
  }

  private async animateEnemyImpact(payload: CombatEventMap['damageDealt']): Promise<void> {
    const view = this.viewFor(payload.target);
    this.flashCharacter(view.x, view.y);
    this.hitParticles.explode(14, view.x, view.y);
    shakeCamera(this, 120, Phaser.Math.Clamp(payload.amount / 1100, 0.003, 0.009));
    Sfx.hitEnemy();
    this.spawnFloatingText(view.x, view.y - 90, `-${payload.amount - payload.absorbed}`, '#ffffff');
    view.setHp(payload.remainingHp);
    view.setBlock(this.combat.combatant(payload.target).block);
    this.punchCharacter(view.container);
    await this.delay(230);
  }

  private async animateEnemyDeath(enemyId: string): Promise<void> {
    const view = this.viewFor(enemyId);
    this.hitParticles.explode(30, view.x, view.y);
    await view.die();
  }

  private async animatePlayerBlockGain(amount: number): Promise<void> {
    const spot = this.playerView.blockSpot;
    this.blockParticles.explode(8, spot.x, spot.y);
    Sfx.block();
    this.spawnFloatingText(spot.x, spot.y - 22, `+${amount}`, '#9fd3ff');
    this.playerView.pulseBlock();
    await this.delay(80);
  }

  private async animateStatusChange(payload: CombatEventMap['statusChanged']): Promise<void> {
    const { target, status, delta, statuses } = payload;
    const view = target === PLAYER_ID ? undefined : this.viewFor(target);
    (view ?? this.playerView).statusRow.set(statuses);
    if (delta <= 0) return; // a tick down just updates the badges
    const def = STATUSES[status];
    const x = view ? view.x : PLAYER_X;
    const y = (view ? view.y : PLAYER_Y) - 40;
    this.spawnFloatingText(x, y, `+${delta} ${def.name}`, `#${def.badge.color.toString(16).padStart(6, '0')}`);
    await this.delay(160);
  }

  private async animateCombatEnd(result: 'won' | 'lost'): Promise<void> {
    this.setHandInteractive(false);
    this.endTurnButton.disableInteractive().setAlpha(0.3);
    for (const view of this.enemyViews) view.hideIntent(); // no next move once the fight is over
    if (result === 'won') {
      this.resultText.setText('VICTORY').setColor('#ffe066').setScale(0.6).setAlpha(0);
      Sfx.victory();
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 400, ease: 'Back.Out' });
    } else {
      this.resultText.setText('DEFEAT').setColor('#ff6b6b').setScale(0.6).setAlpha(0);
      Sfx.defeat();
      shakeCamera(this, 400, 0.01);
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 500, ease: 'Sine.easeOut' });
    }

    const button = addButton(this, 400, 300, 'Continue', () => {
      this.run.finishCombat(result, this.combat.player.hp, this.combat.turnNumber);
      enterCurrentNode(this, this.run);
    });
    button.setDepth(22).setAlpha(0);
    this.tweens.add({ targets: button, alpha: 1, duration: 250 });
  }

  // ---------- shared small helpers ----------

  /** A brief white (or tinted) flash overlay over a character's silhouette — works regardless of
   *  how many shapes compose it, unlike setFillStyle on a single GameObject. */
  private flashCharacter(x: number, y: number, color = 0xffffff): void {
    const overlay = this.add.rectangle(x, y - 10, 110, 190, color, 0.65);
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 160,
      onComplete: () => overlay.destroy(),
    });
  }

  private punchCharacter(target: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: target,
      scaleX: target.scaleX * 0.9,
      scaleY: target.scaleY * 1.08,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, { fontSize: '18px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /** Brings every readout in line with the live state. Called once a batch of animations has played. */
  private refreshStatusBars(): void {
    const c = this.combat;
    this.playerView.setHp(c.player.hp, c.player.maxHp);
    this.playerView.setBlock(c.player.block);
    this.playerView.setEnergy(c.energy, c.maxEnergy);
    this.playerView.statusRow.set(c.player.statuses);
    for (const view of this.enemyViews) view.syncFrom();

    this.statusText.setText(c.log.slice(-2).map((e) => e.message).join('\n'));
  }
}
