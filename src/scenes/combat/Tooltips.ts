import Phaser from 'phaser';

/**
 * Hover explanations for icon-only readouts. `add` registers a rectangle of the screen; its text
 * callback returns null to show nothing.
 *
 * Mouse: shown while hovering. Touch has no hover — Phaser sends "over" when the finger lands and
 * "out" when it lifts — so a tapped tooltip stays up until the next tap somewhere else.
 */
export class Tooltips {
  private readonly scene: Phaser.Scene;
  private readonly bubble: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private shownByTouchDown: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bg = scene.add.rectangle(0, 0, 10, 10, 0x0c0c12, 0.94).setStrokeStyle(1, 0x5a5a72).setOrigin(0.5, 1);
    this.text = scene.add
      .text(0, 0, '', { fontSize: '13px', color: '#e8e8f0', wordWrap: { width: 220 }, align: 'center' })
      .setOrigin(0.5, 1);
    this.bubble = scene.add.container(0, 0, [this.bg, this.text]).setDepth(40).setVisible(false);

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.shownByTouchDown !== null && pointer.downTime !== this.shownByTouchDown) {
        this.bubble.setVisible(false);
        this.shownByTouchDown = null;
      }
    });
  }

  /** Returns the hover zone, so a caller whose readout moves (a centered status row) can move it too. */
  add(x: number, y: number, w: number, h: number, getText: () => string | null): Phaser.GameObjects.Zone {
    // below the hand (depth -1) so a wide hand overlapping a pile still gets the click
    const zone = this.scene.add.zone(x, y, w, h).setInteractive().setDepth(-1);
    zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      const text = getText();
      if (!text) return;
      this.text.setText(text).setPosition(0, -6);
      this.bg.setSize(this.text.width + 16, this.text.height + 12);
      // keep the bubble on screen; it sits just above the hovered thing
      const halfWidth = this.bg.width / 2;
      this.bubble
        .setPosition(Phaser.Math.Clamp(zone.x, halfWidth + 4, 800 - halfWidth - 4), y - h / 2 - 4)
        .setVisible(true);
      this.shownByTouchDown = pointer.wasTouch ? pointer.downTime : null;
    });
    zone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch) this.bubble.setVisible(false);
    });
    return zone;
  }
}
