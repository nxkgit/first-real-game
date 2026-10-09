import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { describeOutcome } from '../game/describe';
import { Sfx } from '../audio/Sfx';
import { addScreenBackdrop } from './art';
import { useLayoutCamera } from '../display';
import { saveRun } from '../storage';
import {
  addButton,
  addDeckButton,
  addReportButton,
  addRunHud,
  addSettingsButton,
  closeDeckView,
  enterCurrentNode,
  onKeyPress,
  runHudText,
  toggleDeckView,
} from './ui';

/** A non-combat stop: some text and a few choices. Each choice shows what it will do. */
export class EventScene extends Phaser.Scene {
  private run!: RunState;
  private chosen = false;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super('EventScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.chosen = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'event');
    this.hud = addRunHud(this, this.run, { showHp: true });
    addDeckButton(this, this.run, this.hud.x + this.hud.width + 70);
    addReportButton(this, this.hud.x + this.hud.width + 70);
    addSettingsButton(this);
    onKeyPress(this, (key) => {
      if (key === 'd') toggleDeckView(this, this.run);
      else if (key === 'escape') closeDeckView(this);
    });

    const event = this.run.event;
    this.add.text(400, 100, event.title, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 160, event.text, { fontSize: '15px', color: '#c8c8d8', align: 'center', wordWrap: { width: 560 } })
      .setOrigin(0.5, 0);

    const choiceObjects: Phaser.GameObjects.GameObject[] = [];
    event.choices.forEach((choice, i) => {
      const y = 260 + i * 78;
      const summary = choice.outcomes.length === 0 ? 'Nothing happens.' : choice.outcomes.map(describeOutcome).join(' ');
      const bg = this.add.rectangle(400, y, 540, 64, 0x24243a).setStrokeStyle(2, 0x5a5a72).setInteractive({ useHandCursor: true });
      const label = this.add.text(400, y - 12, choice.label, { fontSize: '17px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      const detail = this.add
        .text(400, y + 12, summary, { fontSize: '12px', color: '#9a9aae', align: 'center', wordWrap: { width: 500 } })
        .setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x30304c));
      bg.on('pointerout', () => bg.setFillStyle(0x24243a));
      bg.on('pointerdown', () => this.choose(i, choiceObjects));
      choiceObjects.push(bg, label, detail);
    });
  }

  private choose(index: number, choiceObjects: Phaser.GameObjects.GameObject[]): void {
    if (this.chosen) return;
    this.chosen = true;
    Sfx.choose();
    const result = this.run.chooseEventOption(index);
    this.hud.setText(runHudText(this.run, true)); // HP and gold may just have changed
    saveRun(this.run); // the outcome is decided: a refresh must not offer the choice again

    if (result.fighting) {
      enterCurrentNode(this, this.run); // the fight stands in for this stop until it is over
      return;
    }

    for (const obj of choiceObjects) obj.destroy();
    const text = result.lines.length > 0 ? result.lines.join('\n') : 'You move on.';
    this.add
      .text(400, 300, text, { fontSize: '18px', color: '#ffe066', align: 'center', lineSpacing: 6 })
      .setOrigin(0.5);
    addButton(this, 400, 440, 'Continue', () => enterCurrentNode(this, this.run));
  }
}
