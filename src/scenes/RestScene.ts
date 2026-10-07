import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { Sfx } from '../audio/Sfx';
import { addScreenBackdrop } from './art';
import { useLayoutCamera } from '../display';
import { REST_HEAL_FRACTION } from '../data/tunables';
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
  onKeyPress,
  toggleDeckView,
} from './ui';

/** A rest stop: heal a fraction of max HP, or upgrade one card, then move on. */
export class RestScene extends Phaser.Scene {
  private run!: RunState;
  private done = false;
  private picker: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('RestScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.done = false;
    this.picker = null;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'rest');
    const hud = addRunHud(this, this.run, { showHp: true });
    addDeckButton(this, this.run, hud.x + hud.width + 70);
    addSettingsButton(this);
    onKeyPress(this, (key) => {
      if (key === 'd') toggleDeckView(this, this.run);
      else if (key === 'escape') {
        if (this.picker) this.closePicker();
        else closeDeckView(this);
      }
    });

    this.add.text(400, 100, 'Rest stop', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.buildPlaceholderFire(400, 220);

    const heal = this.run.restHealAmount;
    const fullHeal = Math.round(this.run.maxHp * REST_HEAL_FRACTION);
    const pct = Math.round(REST_HEAL_FRACTION * 100);
    let message = `Rest to recover ${heal} HP (${pct}% of max HP), or upgrade a card instead.`;
    if (heal === 0) message = "You're at full HP. You can still upgrade a card.";
    else if (heal < fullHeal) message = `Rest to recover ${heal} HP (back to full), or upgrade a card instead.`;
    this.add.text(400, 320, message, { fontSize: '15px', color: '#c8c8d8' }).setOrigin(0.5);

    addButton(
      this,
      290,
      400,
      heal > 0 ? `Rest (+${heal} HP)` : 'Rest',
      () => {
        if (this.done) return;
        this.done = true;
        this.run.rest();
        if (heal > 0) Sfx.heal();
        enterCurrentNode(this, this.run);
      },
      { width: 200, once: false }
    );

    const canUpgrade = this.run.upgradableCards.length > 0;
    const upgrade = addButton(this, 510, 400, 'Upgrade a card', () => this.openPicker(), {
      width: 200,
      fill: canUpgrade ? 0x6b5a1f : 0x2a2a3a,
      stroke: canUpgrade ? 0xd8b23c : 0x45455a,
      once: false,
    });
    if (!canUpgrade) upgrade.setAlpha(0.45);
  }

  // ---------- choosing a card to upgrade ----------

  private openPicker(): void {
    if (this.done || this.picker || this.run.upgradableCards.length === 0) return;
    const backdrop = this.add.rectangle(400, 300, 800, 600, 0x08080c, 0.94).setInteractive();
    const title = this.add.text(400, 36, 'Choose a card to upgrade', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const back = addButton(this, 70, 36, 'Back', () => this.closePicker(), { width: 90, height: 30, fontSize: 14, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false });
    const view = this.add.container(0, 0, [backdrop, title, back]).setDepth(100);
    this.picker = view;

    const options = this.run.upgradableCards;
    const cols = options.length > 24 ? 8 : 6;
    const rows = Math.max(1, Math.ceil(options.length / cols));
    const scale = Math.min(0.9, (600 - 110) / (rows * (CARD_HEIGHT + 16)), 740 / (cols * (CARD_WIDTH + 14)));
    const stepX = (CARD_WIDTH + 14) * scale;
    const stepY = (CARD_HEIGHT + 16) * scale;
    options.forEach(({ index, card }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, options.length - row * cols);
      const x = 400 + (col - (inRow - 1) / 2) * stepX;
      const y = 100 + stepY / 2 + row * stepY;
      const face = buildCardFace(this, card).setPosition(x, y).setScale(scale);
      const zone = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0).setInteractive({ useHandCursor: true });
      face.add(zone);
      zone.on('pointerover', () => this.tweens.add({ targets: face, scale: scale * 1.08, duration: 100 }));
      zone.on('pointerout', () => this.tweens.add({ targets: face, scale, duration: 100 }));
      zone.on('pointerdown', () => this.showPreview(index));
      view.add(face);
    });
  }

  private closePicker(): void {
    this.picker?.destroy();
    this.picker = null;
  }

  /** Shows the card next to its upgraded version, with a button to confirm. */
  private showPreview(index: number): void {
    const before = this.run.deck[index];
    const after = this.run.upgradePreview(index);
    if (!after) return;
    this.closePicker();

    const backdrop = this.add.rectangle(400, 300, 800, 600, 0x08080c, 0.94).setInteractive();
    const title = this.add.text(400, 70, 'Upgrade this card?', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const left = buildCardFace(this, before).setPosition(280, 260).setScale(1.3);
    const arrow = this.add.text(400, 260, '->', { fontSize: '28px', color: '#d8b23c', fontStyle: 'bold' }).setOrigin(0.5);
    const right = buildCardFace(this, after).setPosition(520, 260).setScale(1.3);
    const confirm = addButton(
      this,
      500,
      450,
      'Upgrade',
      () => {
        if (this.done) return;
        this.done = true;
        this.run.upgradeCard(index);
        Sfx.choose();
        enterCurrentNode(this, this.run);
      },
      { width: 160, fill: 0x6b5a1f, stroke: 0xd8b23c }
    );
    const back = addButton(
      this,
      310,
      450,
      'Back',
      () => {
        this.picker?.destroy();
        this.picker = null;
        this.openPicker();
      },
      { width: 120, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false }
    );
    this.picker = this.add.container(0, 0, [backdrop, title, left, arrow, right, confirm, back]).setDepth(100);
  }

  /** Placeholder campfire from primitives: logs plus a flickering flame. */
  private buildPlaceholderFire(x: number, y: number): void {
    const logs = this.add.graphics();
    logs.fillStyle(0x6b4a2a, 1);
    logs.fillRect(x - 40, y + 20, 80, 10);
    logs.fillRect(x - 30, y + 12, 60, 10);

    // triangle points are relative to the shape's own top-left; bottom-center origin stands both
    // flames on the logs, and makes the flicker stretch upward
    const outer = this.add.triangle(x, y + 22, 0, 62, 52, 62, 26, 0, 0xe8803c).setOrigin(0.5, 1);
    const inner = this.add.triangle(x, y + 22, 0, 38, 28, 38, 14, 0, 0xffd25a).setOrigin(0.5, 1);
    this.tweens.add({
      targets: [outer, inner],
      scaleY: { from: 0.9, to: 1.12 },
      scaleX: { from: 1.04, to: 0.94 },
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
