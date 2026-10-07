import Phaser from 'phaser';
import type { CombatState } from '../../game/CombatState';
import { STATUS_ORDER } from '../../data/statuses';
import { STATUS_SLOT_WIDTH, StatusRow } from './StatusRow';
import { Tooltips } from './Tooltips';
import { PLAYER_X, PLAYER_Y } from './layout';
import { addIdleBob, buildMageCharacter } from './drawings';

const STAT_Y = 360;
const BLOCK_X = 165;
const STATUS_Y = 412;

/** Everything the player shows on screen: the hero, and a StS-style readout of HP (heart and
 *  number, no bar), block (shield, shown only when above 0), energy (orb), and statuses. */
export class PlayerView {
  readonly container: Phaser.GameObjects.Container;
  readonly statusRow: StatusRow;

  private readonly scene: Phaser.Scene;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly blockIcon: Phaser.GameObjects.Polygon;
  private readonly blockText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  /** Block currently shown, which can lag the live value while animations replay. */
  private shownBlock = 0;

  constructor(scene: Phaser.Scene, combat: CombatState, tooltips: Tooltips) {
    this.scene = scene;
    this.container = buildMageCharacter(scene);
    this.container.setPosition(PLAYER_X, PLAYER_Y);
    addIdleBob(scene, this.container, PLAYER_Y);

    scene.add.text(PLAYER_X, 130, 'HERO', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const heart = scene.add.graphics();
    heart.fillStyle(0xd94f4f, 1);
    heart.fillCircle(55, STAT_Y - 4, 7);
    heart.fillCircle(69, STAT_Y - 4, 7);
    heart.fillTriangle(47, STAT_Y - 1, 77, STAT_Y - 1, 62, STAT_Y + 13);
    this.hpText = scene.add
      .text(90, STAT_Y + 3, '', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    this.blockIcon = scene.add
      .polygon(BLOCK_X, STAT_Y, [0, -10, 9, -6, 9, 4, 0, 11, -9, 4, -9, -6], 0x6fa8d9)
      .setStrokeStyle(2, 0xbfe0ff)
      .setVisible(false);
    this.blockText = scene.add
      .text(180, STAT_Y + 3, '', { fontSize: '14px', color: '#9fd3ff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    scene.add.circle(235, STAT_Y, 22, 0xe8a63c).setStrokeStyle(2, 0xfff0c4);
    this.energyText = scene.add
      .text(235, STAT_Y, '', { fontSize: '16px', color: '#3a2a0a', fontStyle: 'bold' })
      .setOrigin(0.5);

    this.statusRow = new StatusRow(scene, PLAYER_X - STATUS_SLOT_WIDTH, STATUS_Y);

    tooltips.add(170, STAT_Y, 40, 28, () =>
      combat.player.block > 0
        ? `Block: absorbs the next ${combat.player.block} damage. Resets at the start of your turn.`
        : null
    );
    tooltips.add(235, STAT_Y, 44, 44, () => `Energy: spent to play cards. Refills to ${combat.maxEnergy} each turn.`);
    for (let i = 0; i < STATUS_ORDER.length; i++) {
      tooltips.add(this.statusRow.slotX(i), STATUS_Y, STATUS_SLOT_WIDTH - 4, 28, () => this.statusRow.textAt(i));
    }
  }

  get displayedBlock(): number {
    return this.shownBlock;
  }

  setHp(hp: number, maxHp: number): void {
    this.hpText.setText(`${hp}/${maxHp}`);
  }

  setBlock(block: number): void {
    this.shownBlock = block;
    this.blockIcon.setVisible(block > 0);
    this.blockText.setText(block > 0 ? `${block}` : '');
  }

  pulseBlock(): void {
    this.scene.tweens.add({ targets: this.blockIcon, scale: { from: 1.4, to: 1 }, duration: 220, ease: 'Back.Out' });
  }

  setEnergy(energy: number, maxEnergy: number): void {
    this.energyText.setText(`${energy}/${maxEnergy}`);
  }

  /** Where block particles and "+N" text appear. */
  readonly blockSpot = { x: BLOCK_X, y: STAT_Y - 8 };
}
