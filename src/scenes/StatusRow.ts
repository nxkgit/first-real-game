import Phaser from 'phaser';
import type { StatusId, Statuses } from '../game/types';
import { STATUSES, STATUS_ORDER } from '../data/statuses';

/** Horizontal distance between badge centers. Tooltip zones are laid out from this too. */
export const STATUS_SLOT_WIDTH = 38;

/**
 * A left-aligned row of status badges (placeholder look: a colored disc with a letter, plus the
 * stack count). Redrawn from a Statuses snapshot, in STATUS_ORDER, so it never reads live combat state.
 */
export class StatusRow {
  readonly x: number;
  readonly y: number;
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private shown: [StatusId, number][] = [];

  /** `x` is the center of the first slot. */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.container = scene.add.container(x, y);
  }

  slotX(index: number): number {
    return this.x + index * STATUS_SLOT_WIDTH;
  }

  set(statuses: Statuses): void {
    this.container.removeAll(true);
    this.shown = STATUS_ORDER.flatMap((id): [StatusId, number][] => {
      const stacks = statuses[id] ?? 0;
      return stacks > 0 ? [[id, stacks]] : [];
    });
    this.shown.forEach(([id, stacks], i) => {
      const { symbol, color } = STATUSES[id].badge;
      const cx = i * STATUS_SLOT_WIDTH;
      const disc = this.scene.add.circle(cx, 0, 12, color).setStrokeStyle(2, 0xffffff, 0.55);
      const letter = this.scene.add
        .text(cx, 0, symbol, { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      const count = this.scene.add
        .text(cx + 11, 9, `${stacks}`, {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#14141c',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      this.container.add([disc, letter, count]);
    });
  }

  /** Tooltip text for the badge in slot `index`, or null if that slot is empty. */
  textAt(index: number): string | null {
    const entry = this.shown[index];
    return entry ? STATUSES[entry[0]].describe(entry[1]) : null;
  }
}
