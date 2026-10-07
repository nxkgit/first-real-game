import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { useLayoutCamera } from '../display';
import { newRun } from '../data/run';
import { addButton, enterCurrentNode } from './ui';

/** End of a run, won or lost: a short summary and a way to start over. */
export class RunEndScene extends Phaser.Scene {
  private run!: RunState;

  constructor() {
    super('RunEndScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);

    const won = this.run.phase === 'won';
    this.add
      .text(400, 190, won ? 'RUN COMPLETE' : 'DEFEATED', {
        fontSize: '40px',
        color: won ? '#ffe066' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const where = won
      ? `Cleared all ${this.run.totalFloors} floors.`
      : `Fell on floor ${this.run.floor} of ${this.run.totalFloors}.`;
    this.add.text(400, 245, where, { fontSize: '16px', color: '#c8c8d8' }).setOrigin(0.5);
    this.add
      .text(
        400,
        280,
        `HP ${this.run.hp}/${this.run.maxHp}    Deck ${this.run.deck.length} cards    Gold ${this.run.gold}`,
        { fontSize: '14px', color: '#9a9aae' }
      )
      .setOrigin(0.5);

    addButton(this, 400, 360, 'New Run', () => enterCurrentNode(this, newRun()));
  }
}
