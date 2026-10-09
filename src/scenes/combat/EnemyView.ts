import Phaser from 'phaser';
import type { CombatState } from '../../game/CombatState';
import { intentIcons } from '../../game/intent';
import type { IntentIcon } from '../../game/intent';
import type { EnemyState } from '../../game/types';
import { STATUS_ORDER } from '../../data/statuses';
import { STATUS_SLOT_WIDTH, StatusRow } from './StatusRow';
import { Tooltips } from './Tooltips';
import { ENEMY_Y, INTENT_SIZE, INTENT_Y } from './layout';
import { buildEnemySprite, isPixelEnemy, playEnemyAttack, playEnemyDeath } from '../art';
import { addIdleBob, drawArrow, drawShield, drawSword } from './drawings';

const NAME_Y = 130;
const HP_BAR_Y = 345;
const BLOCK_Y = 383;
const STATUS_Y = 412;
const ICON_SPACING = 30;

/** Everything one enemy shows on screen: its drawing, name, HP, block, intent, and statuses. */
export class EnemyView {
  readonly id: string;
  readonly x: number;
  readonly y = ENEMY_Y;
  /** The drawing's normal size (1 unless the enemy is drawn larger, like an elite or boss). */
  readonly baseScale: number;
  readonly container: Phaser.GameObjects.Container;
  readonly statusRow: StatusRow;
  /** Where a targeted card can be dropped/clicked onto this enemy (also where the reticle is drawn). */
  readonly targetArea: Phaser.Geom.Rectangle;

  private readonly scene: Phaser.Scene;
  private readonly state: EnemyState;
  private readonly combat: CombatState;
  private readonly barWidth: number;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly blockIcon: Phaser.GameObjects.Graphics;
  private readonly blockText: Phaser.GameObjects.Text;
  private readonly intent: Phaser.GameObjects.Container;
  private readonly intentGraphics: Record<IntentIcon, Phaser.GameObjects.Graphics>;
  private readonly intentValue: Phaser.GameObjects.Text;
  private dead = false;

  constructor(scene: Phaser.Scene, state: EnemyState, x: number, crowded: boolean, combat: CombatState, tooltips: Tooltips) {
    this.scene = scene;
    this.state = state;
    this.combat = combat;
    this.id = state.id;
    this.x = x;
    this.barWidth = crowded ? 110 : 160;
    const half = crowded ? 58 : 65;
    this.targetArea = new Phaser.Geom.Rectangle(x - half, ENEMY_Y - 80, half * 2, 155);

    this.container = buildEnemySprite(scene, state.definition);
    this.baseScale = state.definition.placeholderScale ?? 1;
    this.container.setPosition(x, ENEMY_Y).setScale(this.baseScale);
    if (!isPixelEnemy(this.container)) addIdleBob(scene, this.container, ENEMY_Y); // animated sheets idle on their own

    this.nameText = scene.add
      .text(x, NAME_Y, state.name, { fontSize: crowded ? '16px' : '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);

    // Intent readout: icons for the kind of move (and the number for attacks/blocks), no words.
    const sword = scene.add.graphics();
    drawSword(sword);
    sword.setRotation(Math.PI / 4);
    const shield = scene.add.graphics();
    drawShield(shield, 1.25);
    const buff = scene.add.graphics();
    drawArrow(buff, 'up', 0x6fc37a);
    const debuff = scene.add.graphics();
    drawArrow(debuff, 'down', 0xb07de0);
    this.intentGraphics = { attack: sword, defend: shield, buff, debuff };
    this.intentValue = scene.add
      .text(0, 1, '', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#14141c', strokeThickness: 4 })
      .setOrigin(0, 0.5);
    this.intent = scene.add.container(x, INTENT_Y, [sword, shield, buff, debuff, this.intentValue]);
    for (const g of Object.values(this.intentGraphics)) g.setVisible(false);

    const barX = x - this.barWidth / 2;
    this.hpBack = scene.add.rectangle(barX, HP_BAR_Y, this.barWidth, 14, 0x2a2a3a).setOrigin(0, 0.5).setStrokeStyle(1, 0x45455a);
    this.hpFill = scene.add.rectangle(barX, HP_BAR_Y, this.barWidth, 14, 0xc9544f).setOrigin(0, 0.5);
    this.hpText = scene.add.text(x, HP_BAR_Y + 18, '', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

    // Block readout matches the player's: shield icon + number, shown only when block > 0.
    this.blockIcon = scene.add.graphics({ x: x - 12, y: BLOCK_Y }).setVisible(false);
    drawShield(this.blockIcon);
    this.blockText = scene.add.text(x + 3, BLOCK_Y + 3, '', { fontSize: '14px', color: '#9fd3ff', fontStyle: 'bold' }).setOrigin(0, 0.5);

    // one slot per status kind, centered under the enemy
    this.statusRow = new StatusRow(scene, x - ((STATUS_ORDER.length - 1) * STATUS_SLOT_WIDTH) / 2, STATUS_Y);

    tooltips.add(x, INTENT_Y, INTENT_SIZE.width, INTENT_SIZE.height, () => this.intentTooltip());
    tooltips.add(x, BLOCK_Y + 1, 50, 24, () =>
      this.state.block > 0 ? `Block: absorbs the next ${this.state.block} damage. Resets at the start of its turn.` : null
    );
    for (let i = 0; i < STATUS_ORDER.length; i++) {
      tooltips.add(this.statusRow.slotX(i), STATUS_Y, STATUS_SLOT_WIDTH - 4, 28, () => this.statusRow.textAt(i));
    }

    this.syncFrom();
  }

  /** Plays the enemy's own attack animation, if its art has one. */
  playAttack(): void {
    playEnemyAttack(this.container);
  }

  get alive(): boolean {
    return !this.dead;
  }

  /** Redraws everything from the enemy's live state. */
  syncFrom(): void {
    if (this.dead) return;
    const e = this.state;
    this.nameText.setText(e.name);
    this.hpText.setText(`HP ${e.hp}/${e.maxHp}`);
    this.hpFill.width = Math.max(0, (e.hp / e.maxHp) * this.barWidth);
    this.setBlock(e.block);
    this.statusRow.set(e.statuses);
    this.showIntent();
  }

  setBlock(block: number): void {
    this.blockIcon.setVisible(block > 0);
    this.blockText.setText(block > 0 ? `${block}` : '');
  }

  /** Animates the bar and updates the number to `hp` (the value at the moment of the hit). */
  setHp(hp: number): void {
    this.hpText.setText(`HP ${hp}/${this.state.maxHp}`);
    this.scene.tweens.add({
      targets: this.hpFill,
      width: Math.max(0, (hp / this.state.maxHp) * this.barWidth),
      duration: 300,
      ease: 'Cubic.easeOut',
    });
  }

  /** Draws the icons and number for the enemy's next move. Attack damage includes statuses. */
  showIntent(): void {
    const move = this.combat.nextMove(this.state);
    const icons = intentIcons(move);
    const damage = this.combat.intentDamage(this.state);
    const block = this.combat.intentBlock(this.state);
    const number = damage ?? block;

    for (const [icon, g] of Object.entries(this.intentGraphics)) g.setVisible(icons.includes(icon as IntentIcon));
    // lay out left to right; the number goes right after the attack (or, failing that, defend) icon
    const numberAfter: IntentIcon | undefined = damage !== undefined ? 'attack' : block !== undefined ? 'defend' : undefined;
    const slots = icons.length + (number !== undefined ? 0.8 : 0);
    let cursor = (-slots * ICON_SPACING) / 2 + ICON_SPACING / 2;
    for (const icon of icons) {
      this.intentGraphics[icon].setPosition(cursor, 0);
      cursor += ICON_SPACING;
      if (icon === numberAfter) {
        this.intentValue.setPosition(cursor - ICON_SPACING / 2 + 2, 1);
        cursor += ICON_SPACING * 0.8;
      }
    }
    this.intentValue
      .setText(number !== undefined ? `${number}` : '')
      .setColor(damage !== undefined ? '#ff8f6b' : '#9fd3ff');
    this.intent.setVisible(true);
  }

  pulseIntent(): void {
    this.showIntent();
    this.scene.tweens.add({ targets: this.intent, scale: { from: 1.4, to: 1 }, duration: 220, ease: 'Back.Out' });
  }

  hideIntent(): void {
    this.intent.setVisible(false);
  }

  /** The enemy falls: stops bobbing, sinks and fades, and its readouts go away. */
  die(): Promise<void> {
    this.dead = true;
    this.hideIntent();
    this.scene.tweens.killTweensOf(this.container);
    // the name, HP and statuses go with it
    this.scene.tweens.add({
      targets: [this.nameText, this.hpText, this.hpBack, this.hpFill, this.blockIcon, this.blockText],
      alpha: 0,
      duration: 400,
    });
    this.statusRow.set({});
    const deathMs = playEnemyDeath(this.container); // an animated enemy plays its fall before fading
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        y: ENEMY_Y + 30,
        delay: deathMs,
        duration: 500,
        ease: 'Cubic.easeIn',
        onComplete: () => resolve(),
      });
    });
  }

  private intentTooltip(): string | null {
    if (this.dead) return null;
    const parts: string[] = [];
    const damage = this.combat.intentDamage(this.state);
    const block = this.combat.intentBlock(this.state);
    const icons = intentIcons(this.combat.nextMove(this.state));
    if (damage !== undefined) parts.push(`attack for ${damage} damage`);
    if (block !== undefined) parts.push(`gain ${block} block`);
    if (icons.includes('buff')) parts.push('buff itself');
    if (icons.includes('debuff')) parts.push('debuff you');
    const text = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
    return `Intends to ${text}.`;
  }
}
