import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { useLayoutCamera } from '../display';
import { newRun } from '../data/run';
import { buildRunReport, formatRunReport } from '../game/runReport';
import { copyToClipboard } from '../storage';
import { addButton, addSettingsButton, enterCurrentNode } from './ui';

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
    addSettingsButton(this);

    const won = this.run.phase === 'won';
    this.add
      .text(400, 190, won ? 'ACT COMPLETE' : 'DEFEATED', {
        fontSize: '40px',
        color: won ? '#ffe066' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const where = won
      ? `Beat the boss on floor ${this.run.totalFloors}.`
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

    this.add.text(400, 312, `Seed ${this.run.seed}`, { fontSize: '12px', color: '#777788' }).setOrigin(0.5);

    addButton(this, 400, 370, 'New Run', () => enterCurrentNode(this, newRun()));

    // the report is what a playtester sends back: where the run went, stop by stop
    const note = this.add.text(400, 505, '', { fontSize: '12px', color: '#9a9aae' }).setOrigin(0.5);
    addButton(
      this,
      400,
      445,
      'Copy run report',
      () => {
        void copyToClipboard(formatRunReport(buildRunReport(this.run))).then((ok) => {
          note.setText(ok ? 'Copied. Paste it into a message to send it.' : "Couldn't copy on this device.");
        });
      },
      { width: 200, height: 38, fontSize: 14, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false }
    );
  }
}
