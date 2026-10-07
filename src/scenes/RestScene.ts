import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { Sfx } from '../audio/Sfx';
import { useLayoutCamera } from '../display';
import { REST_HEAL_FRACTION } from '../data/tunables';
import { addButton, addDeckButton, addRunHud, closeDeckView, enterCurrentNode, onKeyPress, toggleDeckView } from './ui';

/** A rest stop between fights: heal a fraction of max HP, then move on. */
export class RestScene extends Phaser.Scene {
  private run!: RunState;

  constructor() {
    super('RestScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    const hud = addRunHud(this, this.run, { showHp: true });
    addDeckButton(this, this.run, hud.x + hud.width + 70);
    onKeyPress(this, (key) => {
      if (key === 'd') toggleDeckView(this, this.run);
      else if (key === 'escape') closeDeckView(this);
    });

    this.add.text(400, 110, 'Rest stop', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.buildPlaceholderFire(400, 250);

    const heal = this.run.restHealAmount;
    const fullHeal = Math.round(this.run.maxHp * REST_HEAL_FRACTION);
    const pct = Math.round(REST_HEAL_FRACTION * 100);
    let message = `Recover ${heal} HP (${pct}% of max HP).`;
    if (heal === 0) message = "You're already at full HP.";
    else if (heal < fullHeal) message = `Recover ${heal} HP, back to full.`;
    this.add.text(400, 350, message, { fontSize: '16px', color: '#c8c8d8' }).setOrigin(0.5);

    addButton(this, 400, 420, heal > 0 ? `Rest (+${heal} HP)` : 'Continue', () => {
      this.run.rest();
      if (heal > 0) Sfx.block();
      enterCurrentNode(this, this.run);
    });
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
