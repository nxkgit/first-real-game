import Phaser from 'phaser';
import type { CardInstance } from '../../game/types';
import { CARD_HEIGHT } from '../ui';
import type { EnemyView } from './EnemyView';
import { HAND_Y } from './layout';

/** Pointer travel (px) after picking up a targeted card that turns it into a drag rather than a click. */
const DRAG_THRESHOLD = 12;

interface Held {
  card: CardInstance;
  container: Phaser.GameObjects.Container;
  /** downTime of the press that picked the card up, so the scene-wide handler can ignore that same press. */
  downTime: number;
  startX: number;
  startY: number;
}

/**
 * StS-style aiming for enemy-targeted cards: pressing a card picks it up and shows an arrow to the
 * pointer. Either drag and release on an enemy, or click the card then click an enemy. Right-click,
 * clicking elsewhere, or releasing a drag off the enemies puts the card back.
 */
export class Targeting {
  private readonly scene: Phaser.Scene;
  private readonly enemies: EnemyView[];
  private readonly handContainer: Phaser.GameObjects.Container;
  private readonly playCard: (card: CardInstance, enemyId: string) => boolean;
  private readonly arrow: Phaser.GameObjects.Graphics;
  private readonly reticles = new Map<string, Phaser.GameObjects.Graphics>();
  private held: Held | null = null;
  private over: EnemyView | undefined;

  constructor(
    scene: Phaser.Scene,
    enemies: EnemyView[],
    handContainer: Phaser.GameObjects.Container,
    playCard: (card: CardInstance, enemyId: string) => boolean
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.handContainer = handContainer;
    this.playCard = playCard;
    this.arrow = scene.add.graphics().setDepth(30);

    // corner brackets around each enemy: faint while aiming, bright when the pointer is on it
    for (const view of enemies) {
      const { left, right, top, bottom } = view.targetArea;
      const len = 16;
      const reticle = scene.add.graphics().setDepth(5).setVisible(false);
      reticle.lineStyle(3, 0xff6b6b, 1);
      for (const [x, y, dx, dy] of [
        [left, top, 1, 1],
        [right, top, -1, 1],
        [left, bottom, 1, -1],
        [right, bottom, -1, -1],
      ]) {
        reticle.lineBetween(x, y, x + dx * len, y);
        reticle.lineBetween(x, y, x, y + dy * len);
      }
      this.reticles.set(view.id, reticle);
    }

    // Scene-wide handlers run after the per-object ones (e.g. a card's own pointerdown).
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPointerDown(pointer));
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));
  }

  get active(): boolean {
    return this.held !== null;
  }

  /** The card currently picked up, if any. */
  get heldCard(): CardInstance | null {
    return this.held?.card ?? null;
  }

  /** The living enemy the pointer is over while a card is picked up (what the arrow is aimed at), if any. */
  get hoveredEnemyId(): string | undefined {
    return this.held ? this.over?.id : undefined;
  }

  isHolding(container: Phaser.GameObjects.Container): boolean {
    return this.held?.container === container;
  }

  begin(card: CardInstance, container: Phaser.GameObjects.Container, pointer: Phaser.Input.Pointer): void {
    this.cancel();
    this.held = { card, container, downTime: pointer.downTime, startX: pointer.worldX, startY: pointer.worldY };
    this.handContainer.bringToTop(container);
    this.scene.tweens.add({ targets: container, y: HAND_Y - 40, scale: 1.1, duration: 120, ease: 'Sine.easeOut' });
    for (const view of this.enemies) this.reticles.get(view.id)?.setVisible(view.alive);
    this.draw(pointer);
  }

  cancel(): void {
    const held = this.held;
    if (!held) return;
    this.clear();
    if (held.container.active) {
      this.scene.tweens.add({ targets: held.container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  /** Call every frame: keeps the arrow following the pointer. */
  update(pointer: Phaser.Input.Pointer): void {
    if (this.held) this.draw(pointer);
  }

  private playOn(view: EnemyView): void {
    const held = this.held;
    if (!held) return;
    this.clear();
    if (!this.playCard(held.card, view.id)) {
      this.scene.tweens.add({ targets: held.container, y: HAND_Y, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  private clear(): void {
    this.held = null;
    this.over = undefined;
    this.arrow.clear();
    for (const reticle of this.reticles.values()) reticle.setVisible(false);
  }

  private enemyAt(pointer: Phaser.Input.Pointer): EnemyView | undefined {
    return this.enemies.find((view) => view.alive && view.targetArea.contains(pointer.worldX, pointer.worldY));
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const held = this.held;
    if (!held || pointer.downTime === held.downTime) return; // ignore the press that picked the card up
    const view = pointer.rightButtonDown() ? undefined : this.enemyAt(pointer);
    if (view) this.playOn(view);
    else this.cancel();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const held = this.held;
    if (!held) return;
    const dragged = Phaser.Math.Distance.Between(held.startX, held.startY, pointer.worldX, pointer.worldY) > DRAG_THRESHOLD;
    if (!dragged) return; // a plain click on the card: stay picked up, wait for a click on an enemy
    const view = this.enemyAt(pointer);
    if (view) this.playOn(view);
    else this.cancel();
  }

  /** Redraws the dotted arrow from the picked-up card to the pointer; it turns red over an enemy. */
  private draw(pointer: Phaser.Input.Pointer): void {
    const held = this.held;
    if (!held) return;
    const over = this.enemyAt(pointer);
    this.over = over;
    for (const view of this.enemies) this.reticles.get(view.id)?.setAlpha(view === over ? 1 : 0.35);

    const sx = held.container.x;
    const sy = held.container.y - (CARD_HEIGHT / 2) * held.container.scaleY;
    const ex = pointer.worldX;
    const ey = pointer.worldY;
    // control point above both ends gives the arrow an arc
    const cx = sx + (ex - sx) * 0.15;
    const cy = Math.min(sy, ey) - 80;
    const color = over ? 0xff6b6b : 0xe8e8f0;

    const g = this.arrow;
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
}
