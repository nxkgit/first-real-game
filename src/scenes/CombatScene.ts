import Phaser from 'phaser';
import { CombatState } from '../game/CombatState';
import type { CombatEventMap } from '../game/CombatState';
import { buildStarterDeck } from '../data/cards';
import { MVP1_ENEMY } from '../data/enemies';
import type { CardInstance, EnemyMove } from '../game/types';
import { Sfx } from '../audio/Sfx';

// Visuals here are built entirely from Phaser's drawing primitives (no art
// assets / image generation available) — simple vector/geometric character
// silhouettes in a rough fantasy style, meant to demonstrate what's possible
// and to make combat readable, not as finished art. Final character/art
// identity is the user's to design — see CLAUDE.md.

const CARD_WIDTH = 110;
const CARD_HEIGHT = 150;
const HAND_Y = 515;
const DRAW_PILE_POS = { x: 40, y: 515 };
const DISCARD_PILE_POS = { x: 760, y: 515 };
const HP_BAR_WIDTH = 160;

const PLAYER_X = 170;
const PLAYER_Y = 250;
const ENEMY_X = 630;
const ENEMY_Y = 250;

const TYPE_COLOR: Record<string, number> = {
  attack: 0xd9534f,
  skill: 0x4f8fd9,
  power: 0xb07de0,
};

interface TrackedCard {
  container: Phaser.GameObjects.Container;
}

type AnimStep = () => Promise<void>;

export class CombatScene extends Phaser.Scene {
  private combat!: CombatState;

  private handCards = new Map<string, TrackedCard>();
  private handContainer!: Phaser.GameObjects.Container;

  /** Non-null while buffering events from a single synchronous combat action so their
   *  animations can be replayed in order instead of firing all at once. */
  private sequencer: AnimStep[] | null = null;

  private playerContainer!: Phaser.GameObjects.Container;
  private enemyContainer!: Phaser.GameObjects.Container;

  private enemyNameText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private enemyHpBarFill!: Phaser.GameObjects.Rectangle;
  private enemyBlockText!: Phaser.GameObjects.Text;
  private enemyIntentText!: Phaser.GameObjects.Text;
  private attackIntentIcon!: Phaser.GameObjects.Triangle;
  private defendIntentIcon!: Phaser.GameObjects.Rectangle;

  private playerHpText!: Phaser.GameObjects.Text;
  private playerBlockIcon!: Phaser.GameObjects.Polygon;
  private playerBlockText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private endTurnButton!: Phaser.GameObjects.Rectangle;
  private endTurnText!: Phaser.GameObjects.Text;
  private turnBanner!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;

  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private blockParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('CombatScene');
  }

  create(): void {
    this.createParticleEmitters();
    this.buildBackground();
    this.playerContainer = this.buildMageCharacter();
    this.playerContainer.setPosition(PLAYER_X, PLAYER_Y);
    this.enemyContainer = this.buildGoblinCharacter();
    this.enemyContainer.setPosition(ENEMY_X, ENEMY_Y);
    this.addIdleBob(this.playerContainer, PLAYER_Y);
    this.addIdleBob(this.enemyContainer, ENEMY_Y);
    this.buildEnemyStatusArea();
    this.buildPlayerStatusArea();
    this.buildHandArea();
    this.buildOverlays();

    this.combat = new CombatState(buildStarterDeck(), MVP1_ENEMY);
    this.wireCombatEvents();
    this.combat.start();
  }

  // ---------- static scene construction ----------

  private createParticleEmitters(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

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

    this.add.rectangle(DRAW_PILE_POS.x, DRAW_PILE_POS.y, 54, 76, 0x2a2a3a).setStrokeStyle(2, 0x45455a);
    this.add.text(DRAW_PILE_POS.x, DRAW_PILE_POS.y + 48, 'Draw', { fontSize: '11px', color: '#777788' }).setOrigin(0.5);
    this.add.rectangle(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, 54, 76, 0x2a2a3a).setStrokeStyle(2, 0x45455a);
    this.add
      .text(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y + 48, 'Discard', { fontSize: '11px', color: '#777788' })
      .setOrigin(0.5);
  }

  /** A simple vector wizard: robe, pointed hood, and a glowing staff. Facing right. */
  private buildMageCharacter(): Phaser.GameObjects.Container {
    const g = this.add.graphics();

    // cape, behind everything else
    g.fillStyle(0x2e2550, 1);
    g.fillTriangle(-10, -25, -34, 72, 2, 60);
    g.fillTriangle(8, -25, 32, 72, -4, 60);

    // robe (tapered torso, as two triangles forming a trapezoid)
    g.fillStyle(0x473a82, 1);
    g.fillTriangle(-16, -28, 16, -28, 30, 62);
    g.fillTriangle(-16, -28, 30, 62, -30, 62);

    // belt
    g.fillStyle(0xd8b23c, 1);
    g.fillRect(-20, 18, 40, 6);

    // off-arm
    g.fillStyle(0x473a82, 1);
    g.fillRect(-30, -10, 10, 30);

    // staff arm
    g.fillRect(16, -10, 10, 34);

    // hood
    g.fillStyle(0x362b5e, 1);
    g.fillTriangle(-18, -30, 18, -30, 0, -74);

    // face
    g.fillStyle(0xe3b183, 1);
    g.fillCircle(0, -46, 12);

    // staff shaft
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(27, -98, 6, 112);

    // feet
    g.fillStyle(0x241c40, 1);
    g.fillRect(-18, 60, 14, 10);
    g.fillRect(6, 60, 14, 10);

    const staffOrb = this.add.circle(30, -101, 8, 0x6fe0ff).setStrokeStyle(2, 0xd6f7ff);
    this.tweens.add({
      targets: staffOrb,
      alpha: { from: 0.65, to: 1 },
      scale: { from: 0.85, to: 1.2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this.add.container(0, 0, [g, staffOrb]);
  }

  /** A simple vector goblin: squat body, pointed ears, claws. Facing left. */
  private buildGoblinCharacter(): Phaser.GameObjects.Container {
    const g = this.add.graphics();

    // legs
    g.fillStyle(0x47632e, 1);
    g.fillRect(-24, 38, 14, 16);
    g.fillRect(10, 38, 14, 16);

    // body
    g.fillStyle(0x5c8143, 1);
    g.fillEllipse(0, 10, 72, 56);

    // loincloth
    g.fillStyle(0x5a3f23, 1);
    g.fillRect(-20, 26, 40, 14);

    // arms
    g.fillStyle(0x5c8143, 1);
    g.fillRect(-44, -4, 16, 32);
    g.fillRect(28, -4, 16, 32);

    // claws
    g.fillStyle(0xe8e4d8, 1);
    g.fillTriangle(-44, 24, -28, 24, -36, 38);
    g.fillTriangle(28, 24, 44, 24, 36, 38);

    // head
    g.fillStyle(0x6a9150, 1);
    g.fillCircle(0, -32, 24);

    // ears
    g.fillTriangle(-23, -40, -38, -58, -12, -46);
    g.fillTriangle(23, -40, 38, -58, 12, -46);

    // teeth
    g.fillStyle(0xf2efe0, 1);
    g.fillTriangle(-8, -14, -2, -14, -5, -7);
    g.fillTriangle(2, -14, 8, -14, 5, -7);

    const leftEye = this.add.circle(-9, -34, 4, 0xffcc33);
    const rightEye = this.add.circle(9, -34, 4, 0xffcc33);
    this.tweens.add({
      targets: [leftEye, rightEye],
      alpha: { from: 1, to: 0.45 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this.add.container(0, 0, [g, leftEye, rightEye]);
  }

  private addIdleBob(target: Phaser.GameObjects.Container, baseY: number): void {
    this.tweens.add({
      targets: target,
      y: baseY - 6,
      duration: 1300 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private buildEnemyStatusArea(): void {
    this.enemyNameText = this.add
      .text(ENEMY_X, 130, '', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.attackIntentIcon = this.add
      .triangle(ENEMY_X - 55, 95, 0, 12, 12, -12, -12, -12, 0xff8f6b)
      .setVisible(false);
    this.defendIntentIcon = this.add.rectangle(ENEMY_X - 55, 95, 18, 18, 0x9fd3ff).setVisible(false);
    this.enemyIntentText = this.add.text(ENEMY_X + 5, 95, '', { fontSize: '16px', color: '#ffcc66' }).setOrigin(0, 0.5);

    const barX = ENEMY_X - HP_BAR_WIDTH / 2;
    const barY = 345;
    this.add.rectangle(barX, barY, HP_BAR_WIDTH, 14, 0x2a2a3a).setOrigin(0, 0.5).setStrokeStyle(1, 0x45455a);
    this.enemyHpBarFill = this.add.rectangle(barX, barY, HP_BAR_WIDTH, 14, 0xc9544f).setOrigin(0, 0.5);
    this.enemyHpText = this.add.text(ENEMY_X, 363, '', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.enemyBlockText = this.add.text(ENEMY_X, 380, '', { fontSize: '13px', color: '#9fd3ff' }).setOrigin(0.5);
  }

  /** StS-style player readout: a heart (HP number, no bar), a shield (block, shown only when > 0), and an energy orb. */
  private buildPlayerStatusArea(): void {
    this.add.text(PLAYER_X, 130, 'HERO', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const statY = 360;

    const heart = this.add.graphics();
    heart.fillStyle(0xd94f4f, 1);
    heart.fillCircle(55, statY - 4, 7);
    heart.fillCircle(69, statY - 4, 7);
    heart.fillTriangle(47, statY - 1, 77, statY - 1, 62, statY + 13);
    this.playerHpText = this.add
      .text(90, statY + 3, '', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    this.playerBlockIcon = this.add
      .polygon(
        165,
        statY,
        [0, -10, 9, -6, 9, 4, 0, 11, -9, 4, -9, -6],
        0x6fa8d9
      )
      .setStrokeStyle(2, 0xbfe0ff)
      .setVisible(false);
    this.playerBlockText = this.add
      .text(180, statY + 3, '', { fontSize: '14px', color: '#9fd3ff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    this.add.circle(235, statY, 22, 0xe8a63c).setStrokeStyle(2, 0xfff0c4);
    this.energyText = this.add
      .text(235, statY, '', { fontSize: '16px', color: '#3a2a0a', fontStyle: 'bold' })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(400, 405, '', { fontSize: '13px', color: '#9a9aae', align: 'center' })
      .setOrigin(0.5);
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

  private wireCombatEvents(): void {
    this.combat.on('cardPlayed', ({ card }) => this.handleCardPlayed(card));
    this.combat.on('handChanged', () => this.queue(() => this.syncHand()));
    this.combat.on('turnStarted', ({ isFirstTurn }) =>
      this.queue(async () => {
        this.refreshStatusBars();
        if (!isFirstTurn) await this.showTurnBanner('YOUR TURN');
      })
    );
    this.combat.on('enemyTurnStarted', () => this.queue(() => this.showTurnBanner('ENEMY TURN')));
    this.combat.on('enemyMoveResolved', (payload) => this.queue(() => this.animateEnemyMove(payload)));
    this.combat.on('damageDealt', (payload) => {
      if (payload.target === 'enemy') this.queue(() => this.animateEnemyImpact(payload));
    });
    this.combat.on('blockGained', (payload) => {
      if (payload.target === 'player') this.queue(() => this.animatePlayerBlockGain(payload.amount));
    });
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

  private handleCardPlayed(card: CardInstance): void {
    const tracked = this.handCards.get(card.instanceId);
    if (!tracked) return;
    this.handCards.delete(card.instanceId);

    this.lockInput(true);
    const impactSteps: AnimStep[] = [];
    this.sequencer = impactSteps;
    void this.resolveCardPlay(tracked.container, card, impactSteps);
  }

  private async resolveCardPlay(
    container: Phaser.GameObjects.Container,
    card: CardInstance,
    impactSteps: AnimStep[]
  ): Promise<void> {
    if (card.definition.type === 'attack') {
      Sfx.cardPlay();
      await this.tweenPromise({
        targets: container,
        x: ENEMY_X,
        y: ENEMY_Y,
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

  private syncHand(): Promise<void> {
    const hand = this.combat.deck.hand;
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
    const accent = TYPE_COLOR[card.definition.type] ?? 0x888888;

    const g = this.add.graphics();
    g.fillStyle(0x2c2c3c, 1);
    g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
    g.lineStyle(2, accent, 1);
    g.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);

    const costBadge = this.add.circle(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, 13, accent);
    const costText = this.add
      .text(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, `${card.definition.cost}`, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const nameText = this.add
      .text(0, -52, card.definition.name, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    const typeText = this.add
      .text(0, -30, card.definition.type.toUpperCase(), { fontSize: '10px', color: '#9a9aae' })
      .setOrigin(0.5);
    const descText = this.add
      .text(0, 22, card.definition.description, {
        fontSize: '11px',
        color: '#d8d8e4',
        wordWrap: { width: CARD_WIDTH - 16 },
        align: 'center',
      })
      .setOrigin(0.5);

    const hitZone = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0);

    const container = this.add.container(0, 0, [g, costBadge, costText, nameText, typeText, descText, hitZone]);
    container.setData('hitZone', hitZone);

    hitZone.on('pointerover', () => {
      this.handContainer.bringToTop(container);
      this.tweens.add({ targets: container, y: HAND_Y - 22, scale: 1.06, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerdown', () => {
      if (this.combat.phase !== 'playerTurn') return;
      this.combat.playCard(card.instanceId);
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

  private async animateEnemyMove(payload: CombatEventMap['enemyMoveResolved']): Promise<void> {
    const { move, damage, blockGained } = payload;

    if (move.kind === 'attack') {
      // enemy lunges toward the player as the windup/attack motion
      const lungeX = ENEMY_X - (ENEMY_X - PLAYER_X) * 0.22;
      await this.tweenPromise({ targets: this.enemyContainer, x: lungeX, duration: 140, ease: 'Sine.easeIn' });
      this.cameras.main.shake(180, Phaser.Math.Clamp(move.value / 900, 0.004, 0.012));
      this.flashCharacter(PLAYER_X, PLAYER_Y);
      this.punchCharacter(this.playerContainer);
      Sfx.hitPlayer();
      if (damage) {
        this.spawnFloatingText(PLAYER_X + 50, PLAYER_Y - 100, `-${damage.amount - damage.absorbed}`, '#ff6b6b');
      }
      await this.tweenPromise({ targets: this.enemyContainer, x: ENEMY_X, duration: 160, ease: 'Sine.easeOut' });
    } else {
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1.12, duration: 160, ease: 'Sine.easeOut' });
      this.flashCharacter(ENEMY_X, ENEMY_Y, 0x6fc3ff);
      this.blockParticles.explode(10, ENEMY_X, ENEMY_Y);
      Sfx.block();
      if (blockGained) this.spawnFloatingText(ENEMY_X, ENEMY_Y - 100, `+${blockGained} Block`, '#9fd3ff');
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1, duration: 160, ease: 'Sine.easeIn' });
    }

    this.refreshStatusBars();
    this.pulseIntent(this.combat.currentEnemyMove);
  }

  private pulseIntent(move: EnemyMove): void {
    this.attackIntentIcon.setVisible(move.kind === 'attack');
    this.defendIntentIcon.setVisible(move.kind === 'defend');
    this.enemyIntentText.setText(move.kind === 'attack' ? `Attack ${move.value}` : `Defend ${move.value}`);
    this.enemyIntentText.setColor(move.kind === 'attack' ? '#ff8f6b' : '#9fd3ff');
    const icon = move.kind === 'attack' ? this.attackIntentIcon : this.defendIntentIcon;
    this.tweens.add({
      targets: [this.enemyIntentText, icon],
      scale: { from: 1.4, to: 1 },
      duration: 220,
      ease: 'Back.Out',
    });
  }

  private async animateEnemyImpact(payload: { amount: number; absorbed: number; remainingHp: number }): Promise<void> {
    this.flashCharacter(ENEMY_X, ENEMY_Y);
    this.hitParticles.explode(14, ENEMY_X, ENEMY_Y);
    this.cameras.main.shake(120, Phaser.Math.Clamp(payload.amount / 1100, 0.003, 0.009));
    Sfx.hitEnemy();
    this.spawnFloatingText(ENEMY_X, ENEMY_Y - 90, `-${payload.amount - payload.absorbed}`, '#ffffff');
    this.tweenHpBar(this.enemyHpBarFill, payload.remainingHp, this.combat.enemy.maxHp);
    this.punchCharacter(this.enemyContainer);
    await this.delay(230);
  }

  private async animatePlayerBlockGain(amount: number): Promise<void> {
    this.blockParticles.explode(8, 165, 352);
    Sfx.block();
    this.spawnFloatingText(165, 330, `+${amount}`, '#9fd3ff');
    this.tweens.add({ targets: this.playerBlockIcon, scale: { from: 1.4, to: 1 }, duration: 220, ease: 'Back.Out' });
    await this.delay(80);
  }

  private async animateCombatEnd(result: 'won' | 'lost'): Promise<void> {
    this.setHandInteractive(false);
    this.endTurnButton.disableInteractive().setAlpha(0.3);
    if (result === 'won') {
      this.resultText.setText('VICTORY').setColor('#ffe066').setScale(0.6).setAlpha(0);
      Sfx.victory();
      this.hitParticles.explode(30, ENEMY_X, ENEMY_Y);
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 400, ease: 'Back.Out' });
    } else {
      this.resultText.setText('DEFEAT').setColor('#ff6b6b').setScale(0.6).setAlpha(0);
      Sfx.defeat();
      this.cameras.main.shake(400, 0.01);
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 500, ease: 'Sine.easeOut' });
    }
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
      scaleX: 0.9,
      scaleY: 1.08,
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

  private tweenHpBar(bar: Phaser.GameObjects.Rectangle, current: number, max: number): void {
    const targetWidth = Math.max(0, (current / max) * HP_BAR_WIDTH);
    this.tweens.add({ targets: bar, width: targetWidth, duration: 300, ease: 'Cubic.easeOut' });
  }

  private refreshStatusBars(): void {
    const c = this.combat;
    this.enemyNameText.setText(c.enemy.name);
    this.enemyHpText.setText(`HP ${c.enemyHp}/${c.enemy.maxHp}`);
    this.enemyBlockText.setText(c.enemyBlock > 0 ? `Block ${c.enemyBlock}` : '');

    this.playerHpText.setText(`${c.playerHp}/${c.playerMaxHp}`);
    this.playerBlockIcon.setVisible(c.playerBlock > 0);
    this.playerBlockText.setText(c.playerBlock > 0 ? `${c.playerBlock}` : '');

    this.energyText.setText(`${c.energy}/${c.maxEnergy}`);

    this.statusText.setText(c.log.slice(-2).map((e) => e.message).join('\n'));

    if (!this.enemyIntentText.text) {
      this.pulseIntent(c.currentEnemyMove);
    }
  }
}
