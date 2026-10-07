import Phaser from 'phaser';
import { CombatState } from '../game/CombatState';
import type { CombatEventMap } from '../game/CombatState';
import type { RunState } from '../game/RunState';
import type { CardInstance, EnemyDefinition, EnemyMove } from '../game/types';
import { STATUSES } from '../data/statuses';
import { STATUS_SLOT_WIDTH, StatusRow } from './StatusRow';
import { Sfx } from '../audio/Sfx';
import { useLayoutCamera } from '../display';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  addButton,
  addDeckButton,
  addRunHud,
  buildCardFace,
  closeDeckView,
  enterCurrentNode,
  isDeckViewOpen,
  onKeyPress,
  toggleDeckView,
} from './ui';

// Visuals here are built entirely from Phaser's drawing primitives (no art
// assets / image generation available) — simple vector/geometric character
// silhouettes in a rough fantasy style, meant to demonstrate what's possible
// and to make combat readable, not as finished art. Final character/art
// identity is the user's to design — see CLAUDE.md.

const HAND_Y = 515;
const DRAW_PILE_POS = { x: 40, y: 515 };
const DISCARD_PILE_POS = { x: 760, y: 515 };
const HP_BAR_WIDTH = 160;

const PLAYER_X = 170;
const PLAYER_Y = 250;
const ENEMY_X = 630;
const ENEMY_Y = 250;
/** Where a targeted card can be dropped/clicked onto the enemy (also where the reticle is drawn). */
const ENEMY_TARGET_AREA = new Phaser.Geom.Rectangle(ENEMY_X - 65, ENEMY_Y - 80, 130, 155);
/** Pointer travel (px) after picking up a targeted card that turns it into a drag rather than a click. */
const DRAG_THRESHOLD = 12;

interface TrackedCard {
  container: Phaser.GameObjects.Container;
}

type AnimStep = () => Promise<void>;

interface TargetingState {
  card: CardInstance;
  container: Phaser.GameObjects.Container;
  /** downTime of the press that picked the card up, so the scene-wide handler can ignore that same press. */
  downTime: number;
  startX: number;
  startY: number;
}

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
  private enemyBlockIcon!: Phaser.GameObjects.Graphics;
  private enemyBlockText!: Phaser.GameObjects.Text;
  private intentContainer!: Phaser.GameObjects.Container;
  private intentSword!: Phaser.GameObjects.Graphics;
  private intentShield!: Phaser.GameObjects.Graphics;
  private intentValueText!: Phaser.GameObjects.Text;
  private intentBadge!: Phaser.GameObjects.Container;
  private intentBadgeDisc!: Phaser.GameObjects.Arc;
  private intentBadgeLetter!: Phaser.GameObjects.Text;
  private enemyStatusRow!: StatusRow;
  private playerStatusRow!: StatusRow;

  /** True while an animation sequence is playing and the player can't act. */
  private inputLocked = false;

  /** Non-null while an enemy-targeted card is picked up and the targeting arrow is showing. */
  private targeting: TargetingState | null = null;
  private targetArrow!: Phaser.GameObjects.Graphics;
  private targetReticle!: Phaser.GameObjects.Graphics;

  private playerHpText!: Phaser.GameObjects.Text;
  private playerBlockIcon!: Phaser.GameObjects.Polygon;
  private playerBlockText!: Phaser.GameObjects.Text;
  /** Block currently shown, which can lag the live value while animations replay. */
  private shownPlayerBlock = 0;
  private energyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private drawCountText!: Phaser.GameObjects.Text;
  private discardCountText!: Phaser.GameObjects.Text;

  private endTurnButton!: Phaser.GameObjects.Rectangle;
  private endTurnText!: Phaser.GameObjects.Text;
  private turnBanner!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;

  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private blockParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  private run!: RunState;
  private enemy!: EnemyDefinition;

  constructor() {
    super('CombatScene');
  }

  /** Runs on every (re)start. Phaser reuses the scene instance, so per-fight state is reset here. */
  init(data: { run: RunState }): void {
    this.run = data.run;
    const node = this.run.currentNode;
    if (node.kind !== 'combat') throw new Error('CombatScene started on a non-combat node');
    this.enemy = node.enemy;
    this.handCards = new Map();
    this.sequencer = null;
    this.targeting = null;
    this.inputLocked = false;
    this.shownPlayerBlock = 0;
  }

  create(): void {
    useLayoutCamera(this);
    this.createParticleEmitters();
    this.buildBackground();
    const hud = addRunHud(this, this.run);
    addDeckButton(this, this.run, hud.x + hud.width + 70, () => this.cancelTargeting());
    this.playerContainer = this.buildMageCharacter();
    this.playerContainer.setPosition(PLAYER_X, PLAYER_Y);
    this.enemyContainer = this.buildGoblinCharacter(this.enemy.placeholderColor ?? 0x5c8143);
    this.enemyContainer.setPosition(ENEMY_X, ENEMY_Y);
    this.addIdleBob(this.playerContainer, PLAYER_Y);
    this.addIdleBob(this.enemyContainer, ENEMY_Y);
    this.buildEnemyStatusArea();
    this.buildPlayerStatusArea();
    this.buildHandArea();
    this.buildTargetingUi();
    this.buildTooltips();
    this.buildOverlays();

    this.combat = new CombatState(this.run.deck, this.enemy, { hp: this.run.hp, maxHp: this.run.maxHp });
    this.wireCombatEvents();
    this.bindKeys();
    this.combat.start();
  }

  update(): void {
    if (this.targeting) this.drawTargeting(this.input.activePointer);
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

    this.add.rectangle(DRAW_PILE_POS.x, DRAW_PILE_POS.y, 54, 76, 0x2a2a3a).setStrokeStyle(2, 0x45455a);
    this.add.text(DRAW_PILE_POS.x, DRAW_PILE_POS.y + 48, 'Draw', { fontSize: '11px', color: '#777788' }).setOrigin(0.5);
    this.drawCountText = this.add
      .text(DRAW_PILE_POS.x, DRAW_PILE_POS.y, '', { fontSize: '20px', color: '#c8c8d8', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add.rectangle(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, 54, 76, 0x2a2a3a).setStrokeStyle(2, 0x45455a);
    this.add
      .text(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y + 48, 'Discard', { fontSize: '11px', color: '#777788' })
      .setOrigin(0.5);
    this.discardCountText = this.add
      .text(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, '', { fontSize: '20px', color: '#c8c8d8', fontStyle: 'bold' })
      .setOrigin(0.5);
  }

  /** Hover explanations for icon-only readouts. Each text callback returns null to show nothing. */
  private buildTooltips(): void {
    const tipBg = this.add.rectangle(0, 0, 10, 10, 0x0c0c12, 0.94).setStrokeStyle(1, 0x5a5a72).setOrigin(0.5, 1);
    const tipText = this.add
      .text(0, 0, '', { fontSize: '13px', color: '#e8e8f0', wordWrap: { width: 220 }, align: 'center' })
      .setOrigin(0.5, 1);
    const tip = this.add.container(0, 0, [tipBg, tipText]).setDepth(40).setVisible(false);

    // Mouse: show while hovering. Touch has no hover — Phaser sends "over" when the finger lands
    // and "out" when it lifts — so a tapped tooltip stays up until the next tap somewhere else.
    let shownByTouchDown: number | null = null;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (shownByTouchDown !== null && pointer.downTime !== shownByTouchDown) {
        tip.setVisible(false);
        shownByTouchDown = null;
      }
    });

    const add = (x: number, y: number, w: number, h: number, getText: () => string | null): void => {
      // below the hand (depth -1) so a wide hand overlapping a pile still gets the click
      const zone = this.add.zone(x, y, w, h).setInteractive().setDepth(-1);
      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        const text = getText();
        if (!text) return;
        tipText.setText(text).setPosition(0, -6);
        tipBg.setSize(tipText.width + 16, tipText.height + 12);
        // keep the bubble on screen; it sits just above the hovered thing
        const halfWidth = tipBg.width / 2;
        tip.setPosition(Phaser.Math.Clamp(x, halfWidth + 4, 800 - halfWidth - 4), y - h / 2 - 4).setVisible(true);
        shownByTouchDown = pointer.wasTouch ? pointer.downTime : null;
      });
      zone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.wasTouch) tip.setVisible(false);
      });
    };

    const c = (): CombatState => this.combat;
    add(ENEMY_X, 92, 70, 34, () => {
      const move = c().currentEnemyMove;
      if (move.kind === 'attack') return `Intends to attack for ${c().currentEnemyAttackDamage} damage.`;
      if (move.kind === 'defend') return `Intends to gain ${move.value} block.`;
      const status = move.status && STATUSES[move.status.id];
      if (!status) return null;
      return move.status?.to === 'player'
        ? `Intends to inflict ${move.value} ${status.name} on you.`
        : `Intends to gain ${move.value} ${status.name}.`;
    });
    for (let i = 0; i < 3; i++) {
      add(this.enemyStatusRow.slotX(i), this.enemyStatusRow.y, STATUS_SLOT_WIDTH - 4, 28, () => this.enemyStatusRow.textAt(i));
      add(this.playerStatusRow.slotX(i), this.playerStatusRow.y, STATUS_SLOT_WIDTH - 4, 28, () => this.playerStatusRow.textAt(i));
    }
    add(ENEMY_X, 384, 50, 24, () =>
      c().enemyBlock > 0 ? `Block: absorbs the next ${c().enemyBlock} damage. Resets at the start of its turn.` : null
    );
    add(170, 360, 40, 28, () =>
      c().playerBlock > 0 ? `Block: absorbs the next ${c().playerBlock} damage. Resets at the start of your turn.` : null
    );
    add(235, 360, 44, 44, () => `Energy: spent to play cards. Refills to ${c().maxEnergy} each turn.`);
    add(DRAW_PILE_POS.x, DRAW_PILE_POS.y, 54, 76, () =>
      `Draw pile: ${this.drawCountText.text} cards. When it runs out, the discard pile is shuffled back in.`
    );
    add(DISCARD_PILE_POS.x, DISCARD_PILE_POS.y, 54, 76, () => `Discard pile: ${this.discardCountText.text} cards.`);
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

  /** A simple vector goblin: squat body, pointed ears, claws. Facing left. `skin` sets the body
   *  color (head a shade lighter, legs darker) so placeholder enemies can be told apart. */
  private buildGoblinCharacter(skin: number): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    const head = Phaser.Display.Color.IntegerToColor(skin).lighten(8).color;
    const legs = Phaser.Display.Color.IntegerToColor(skin).darken(12).color;

    // legs
    g.fillStyle(legs, 1);
    g.fillRect(-24, 38, 14, 16);
    g.fillRect(10, 38, 14, 16);

    // body
    g.fillStyle(skin, 1);
    g.fillEllipse(0, 10, 72, 56);

    // loincloth
    g.fillStyle(0x5a3f23, 1);
    g.fillRect(-20, 26, 40, 14);

    // arms
    g.fillStyle(skin, 1);
    g.fillRect(-44, -4, 16, 32);
    g.fillRect(28, -4, 16, 32);

    // claws
    g.fillStyle(0xe8e4d8, 1);
    g.fillTriangle(-44, 24, -28, 24, -36, 38);
    g.fillTriangle(28, 24, 44, 24, 36, 38);

    // head
    g.fillStyle(head, 1);
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
    // Intent readout: a sword (attack) or shield (defend) icon plus the move's number, no words.
    this.intentSword = this.add.graphics({ x: -12, y: 0 });
    this.drawSword(this.intentSword);
    this.intentSword.setRotation(Math.PI / 4);
    this.intentShield = this.add.graphics({ x: -12, y: 0 });
    this.drawShield(this.intentShield, 1.25);
    this.intentValueText = this.add
      .text(4, 1, '', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#14141c', strokeThickness: 4 })
      .setOrigin(0, 0.5);
    // Status moves (buff/debuff) show the status's own badge instead of a sword or shield.
    this.intentBadgeDisc = this.add.circle(0, 0, 11, 0xffffff).setStrokeStyle(2, 0xffffff, 0.55);
    this.intentBadgeLetter = this.add
      .text(0, 0, '', { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.intentBadge = this.add.container(-12, 0, [this.intentBadgeDisc, this.intentBadgeLetter]);
    this.intentContainer = this.add.container(ENEMY_X, 92, [
      this.intentSword,
      this.intentShield,
      this.intentBadge,
      this.intentValueText,
    ]);
    this.enemyStatusRow = new StatusRow(this, ENEMY_X - 40, 412);

    const barX = ENEMY_X - HP_BAR_WIDTH / 2;
    const barY = 345;
    this.add.rectangle(barX, barY, HP_BAR_WIDTH, 14, 0x2a2a3a).setOrigin(0, 0.5).setStrokeStyle(1, 0x45455a);
    this.enemyHpBarFill = this.add.rectangle(barX, barY, HP_BAR_WIDTH, 14, 0xc9544f).setOrigin(0, 0.5);
    this.enemyHpText = this.add.text(ENEMY_X, 363, '', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

    // Block readout matches the player's: shield icon + number, shown only when block > 0.
    this.enemyBlockIcon = this.add.graphics({ x: ENEMY_X - 12, y: 383 }).setVisible(false);
    this.drawShield(this.enemyBlockIcon);
    this.enemyBlockText = this.add
      .text(ENEMY_X + 3, 386, '', { fontSize: '14px', color: '#9fd3ff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);
  }

  /** Kite-shield icon centered on the graphic's origin. Same shape as the player's block icon. */
  private drawShield(g: Phaser.GameObjects.Graphics, scale = 1): void {
    const outline = [0, -10, 9, -6, 9, 4, 0, 11, -9, 4, -9, -6];
    const points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < outline.length; i += 2) {
      points.push(new Phaser.Math.Vector2(outline[i] * scale, outline[i + 1] * scale));
    }
    g.fillStyle(0x6fa8d9, 1);
    g.fillPoints(points, true);
    g.lineStyle(2, 0xbfe0ff, 1);
    g.strokePoints(points, true);
  }

  /** Upright sword icon centered on the graphic's origin (rotate the graphic to tilt it). */
  private drawSword(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xdfe6ee, 1);
    g.fillRect(-3, -14, 6, 18); // blade
    g.fillTriangle(-3, -14, 3, -14, 0, -21); // tip
    g.fillStyle(0xc9a23c, 1);
    g.fillRect(-9, 4, 18, 4); // crossguard
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(-2, 8, 4, 8); // grip
    g.fillStyle(0xc9a23c, 1);
    g.fillCircle(0, 18, 3); // pommel
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

    this.playerStatusRow = new StatusRow(this, PLAYER_X - 60, 412);

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

  private buildTargetingUi(): void {
    this.targetArrow = this.add.graphics().setDepth(30);

    // corner brackets around the enemy: faint while aiming, bright when the pointer is on it
    const { left, right, top, bottom } = ENEMY_TARGET_AREA;
    const len = 16;
    this.targetReticle = this.add.graphics().setDepth(5).setVisible(false);
    this.targetReticle.lineStyle(3, 0xff6b6b, 1);
    for (const [x, y, dx, dy] of [
      [left, top, 1, 1],
      [right, top, -1, 1],
      [left, bottom, 1, -1],
      [right, bottom, -1, -1],
    ]) {
      this.targetReticle.lineBetween(x, y, x + dx * len, y);
      this.targetReticle.lineBetween(x, y, x, y + dy * len);
    }

    // Scene-wide handlers run after the per-object ones (e.g. a card's own pointerdown).
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onScenePointerDown(pointer));
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.onScenePointerUp(pointer));
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

  /** Keyboard shortcuts: 1-9 play that card from the hand (attacks go straight at the enemy, as
   *  there's only one), E ends the turn, D toggles the deck view, Esc cancels aiming or closes it. */
  private bindKeys(): void {
    onKeyPress(this, (key) => {
      if (key === 'escape') {
        if (isDeckViewOpen(this)) closeDeckView(this);
        else this.cancelTargeting();
        return;
      }
      if (key === 'd') {
        this.cancelTargeting();
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
        this.cancelTargeting();
        this.combat.playCard(card.instanceId, card.definition.target);
      }
    });
  }

  private wireCombatEvents(): void {
    this.combat.on('cardPlayed', ({ card }) => this.handleCardPlayed(card));
    this.combat.on('handChanged', (snapshot) => this.queue(() => this.syncHand(snapshot)));
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
    if (locked) this.cancelTargeting();
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
    if (card.definition.target === 'enemy') {
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
      if (this.targeting?.container === container) return;
      this.handContainer.bringToTop(container);
      this.tweens.add({ targets: container, y: HAND_Y - 22, scale: 1.06, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      if (this.targeting?.container === container) return;
      this.tweens.add({ targets: container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.combat.phase !== 'playerTurn' || pointer.rightButtonDown()) return;
      if (card.definition.target === 'enemy') {
        // clicking the card that's already picked up puts it back
        if (this.targeting?.card === card) this.cancelTargeting();
        else this.beginTargeting(card, container, pointer);
      } else {
        this.cancelTargeting();
        this.combat.playCard(card.instanceId);
      }
    });

    this.setCardPlayable(container, canPlay);
    return container;
  }

  // ---------- targeting (enemy-targeted cards) ----------
  //
  // StS-style: pressing an attack card picks it up and shows an arrow to the pointer. Either drag
  // and release on the enemy, or click the card then click the enemy. Right-click, clicking
  // elsewhere, or releasing a drag off the enemy puts the card back.

  private beginTargeting(card: CardInstance, container: Phaser.GameObjects.Container, pointer: Phaser.Input.Pointer): void {
    this.cancelTargeting();
    this.targeting = { card, container, downTime: pointer.downTime, startX: pointer.worldX, startY: pointer.worldY };
    this.handContainer.bringToTop(container);
    this.tweens.add({ targets: container, y: HAND_Y - 40, scale: 1.1, duration: 120, ease: 'Sine.easeOut' });
    this.targetReticle.setVisible(true);
    this.drawTargeting(pointer);
  }

  private cancelTargeting(): void {
    const t = this.targeting;
    if (!t) return;
    this.clearTargetingUi();
    if (t.container.active) {
      this.tweens.add({ targets: t.container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  private playTargetedCard(): void {
    const t = this.targeting;
    if (!t) return;
    this.clearTargetingUi();
    if (!this.combat.playCard(t.card.instanceId, 'enemy')) {
      this.tweens.add({ targets: t.container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  private clearTargetingUi(): void {
    this.targeting = null;
    this.targetArrow.clear();
    this.targetReticle.setVisible(false);
  }

  private onScenePointerDown(pointer: Phaser.Input.Pointer): void {
    const t = this.targeting;
    if (!t || pointer.downTime === t.downTime) return; // ignore the press that picked the card up
    if (!pointer.rightButtonDown() && this.isOverEnemy(pointer)) this.playTargetedCard();
    else this.cancelTargeting();
  }

  private onScenePointerUp(pointer: Phaser.Input.Pointer): void {
    const t = this.targeting;
    if (!t) return;
    const dragged =
      Phaser.Math.Distance.Between(t.startX, t.startY, pointer.worldX, pointer.worldY) > DRAG_THRESHOLD;
    if (!dragged) return; // a plain click on the card: stay picked up, wait for a click on the enemy
    if (this.isOverEnemy(pointer)) this.playTargetedCard();
    else this.cancelTargeting();
  }

  private isOverEnemy(pointer: Phaser.Input.Pointer): boolean {
    return ENEMY_TARGET_AREA.contains(pointer.worldX, pointer.worldY);
  }

  /** Redraws the dotted arrow from the picked-up card to the pointer; it turns red over the enemy. */
  private drawTargeting(pointer: Phaser.Input.Pointer): void {
    const t = this.targeting;
    if (!t) return;
    const onTarget = this.isOverEnemy(pointer);
    this.targetReticle.setAlpha(onTarget ? 1 : 0.35);

    const sx = t.container.x;
    const sy = t.container.y - (CARD_HEIGHT / 2) * t.container.scaleY;
    const ex = pointer.worldX;
    const ey = pointer.worldY;
    // control point above both ends gives the arrow an arc
    const cx = sx + (ex - sx) * 0.15;
    const cy = Math.min(sy, ey) - 80;
    const color = onTarget ? 0xff6b6b : 0xe8e8f0;

    const g = this.targetArrow;
    g.clear();
    g.fillStyle(color, 1);
    const dots = 14;
    for (let i = 1; i < dots; i++) {
      const s = i / dots;
      const x = (1 - s) * (1 - s) * sx + 2 * (1 - s) * s * cx + s * s * ex;
      const y = (1 - s) * (1 - s) * sy + 2 * (1 - s) * s * cy + s * s * ey;
      g.fillCircle(x, y, 2 + 3 * s);
    }

    // arrowhead, pointing along the curve's direction at its end
    const angle = Math.atan2(ey - cy, ex - cx);
    const size = 16;
    g.fillTriangle(
      ex + Math.cos(angle) * size * 0.5,
      ey + Math.sin(angle) * size * 0.5,
      ex + Math.cos(angle + 2.5) * size,
      ey + Math.sin(angle + 2.5) * size,
      ex + Math.cos(angle - 2.5) * size,
      ey + Math.sin(angle - 2.5) * size
    );
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
      this.cameras.main.shake(180, Phaser.Math.Clamp((damage?.amount ?? move.value) / 900, 0.004, 0.012));
      this.flashCharacter(PLAYER_X, PLAYER_Y);
      this.punchCharacter(this.playerContainer);
      Sfx.hitPlayer();
      if (damage) {
        this.spawnFloatingText(PLAYER_X + 50, PLAYER_Y - 100, `-${damage.amount - damage.absorbed}`, '#ff6b6b');
      }
      await this.tweenPromise({ targets: this.enemyContainer, x: ENEMY_X, duration: 160, ease: 'Sine.easeOut' });
    } else if (move.kind === 'defend') {
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1.12, duration: 160, ease: 'Sine.easeOut' });
      this.flashCharacter(ENEMY_X, ENEMY_Y, 0x6fc3ff);
      this.blockParticles.explode(10, ENEMY_X, ENEMY_Y);
      Sfx.block();
      if (blockGained) this.spawnFloatingText(ENEMY_X, ENEMY_Y - 100, `+${blockGained}`, '#9fd3ff');
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1, duration: 160, ease: 'Sine.easeIn' });
    } else {
      // buff/debuff: the enemy gathers itself; the badge itself appears from the statusChanged event
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1.12, duration: 160, ease: 'Sine.easeOut' });
      this.flashCharacter(ENEMY_X, ENEMY_Y, 0xb07de0);
      Sfx.cast();
      await this.tweenPromise({ targets: this.enemyContainer, scale: 1, duration: 160, ease: 'Sine.easeIn' });
    }

    // Show only what this move changed. The rules have already started your next turn (energy
    // refilled, block reset, cards drawn); those appear when the turn-start events replay next.
    if (damage) {
      this.playerHpText.setText(`${damage.remainingHp}/${this.combat.playerMaxHp}`);
      this.setPlayerBlockDisplay(Math.max(0, this.shownPlayerBlock - damage.absorbed));
    }
    this.enemyBlockIcon.setVisible(this.combat.enemyBlock > 0);
    this.enemyBlockText.setText(this.combat.enemyBlock > 0 ? `${this.combat.enemyBlock}` : '');
    if (this.combat.phase === 'playerTurn') this.pulseIntent(this.combat.currentEnemyMove);
  }

  private setPlayerBlockDisplay(block: number): void {
    this.shownPlayerBlock = block;
    this.playerBlockIcon.setVisible(block > 0);
    this.playerBlockText.setText(block > 0 ? `${block}` : '');
  }

  /** Draws the intent icon and number for `move`. Attack damage includes Strength/Weak/Vulnerable. */
  private showIntent(move: EnemyMove): void {
    const isAttack = move.kind === 'attack';
    const isStatus = move.kind === 'applyStatus';
    this.intentSword.setVisible(isAttack);
    this.intentShield.setVisible(move.kind === 'defend');
    this.intentBadge.setVisible(isStatus);
    if (isStatus && move.status) {
      const { symbol, color } = STATUSES[move.status.id].badge;
      this.intentBadgeDisc.setFillStyle(color);
      this.intentBadgeLetter.setText(symbol);
    }
    const value = isAttack ? this.combat.calcDamage(move.value, 'enemy') : move.value;
    const color = isAttack ? '#ff8f6b' : isStatus ? '#d6b8f5' : '#9fd3ff';
    this.intentValueText.setText(`${value}`).setColor(color);
  }

  private pulseIntent(move: EnemyMove): void {
    this.showIntent(move);
    this.tweens.add({
      targets: this.intentContainer,
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

  private async animateStatusChange(payload: CombatEventMap['statusChanged']): Promise<void> {
    const { target, status, delta, statuses } = payload;
    const row = target === 'enemy' ? this.enemyStatusRow : this.playerStatusRow;
    row.set(statuses);
    if (delta <= 0) return; // a tick down just updates the badges
    const def = STATUSES[status];
    const x = target === 'enemy' ? ENEMY_X : PLAYER_X;
    const y = (target === 'enemy' ? ENEMY_Y : PLAYER_Y) - 125;
    this.spawnFloatingText(x, y, `+${delta} ${def.name}`, `#${def.badge.color.toString(16).padStart(6, '0')}`);
    await this.delay(160);
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
    this.intentContainer.setVisible(false); // no next move once the fight is over
    if (result === 'won') {
      this.resultText.setText('VICTORY').setColor('#ffe066').setScale(0.6).setAlpha(0);
      Sfx.victory();
      this.hitParticles.explode(30, ENEMY_X, ENEMY_Y);
      this.tweens.killTweensOf(this.enemyContainer); // stop the idle bob before fading out
      this.tweens.add({ targets: this.enemyContainer, alpha: 0, y: ENEMY_Y + 30, duration: 500, ease: 'Cubic.easeIn' });
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 400, ease: 'Back.Out' });
    } else {
      this.resultText.setText('DEFEAT').setColor('#ff6b6b').setScale(0.6).setAlpha(0);
      Sfx.defeat();
      this.cameras.main.shake(400, 0.01);
      await this.tweenPromise({ targets: this.resultText, alpha: 1, scale: 1, duration: 500, ease: 'Sine.easeOut' });
    }

    const button = addButton(this, 400, 300, 'Continue', () => {
      this.run.finishCombat(result, this.combat.playerHp);
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
    this.enemyBlockIcon.setVisible(c.enemyBlock > 0);
    this.enemyBlockText.setText(c.enemyBlock > 0 ? `${c.enemyBlock}` : '');

    this.playerHpText.setText(`${c.playerHp}/${c.playerMaxHp}`);
    this.setPlayerBlockDisplay(c.playerBlock);

    this.energyText.setText(`${c.energy}/${c.maxEnergy}`);

    this.enemyStatusRow.set(c.enemyStatuses);
    this.playerStatusRow.set(c.playerStatuses);
    // attack damage on the intent changes with statuses (e.g. after you Weaken the enemy)
    if (this.combat.phase === 'playerTurn') this.showIntent(c.currentEnemyMove);

    this.statusText.setText(c.log.slice(-2).map((e) => e.message).join('\n'));

    if (!this.intentValueText.text) {
      this.pulseIntent(c.currentEnemyMove);
    }
  }
}
