import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { STARTER_DECK_SIZE } from '../data/tunables';
import { addScreenBackdrop } from './art';
import { useLayoutCamera } from '../display';
import { addButton, addSettingsButton, enterCurrentNode } from './ui';

/**
 * Before the map even starts: explains the starter-deck draft, then a single "Proceed" button
 * rolls the first offer (DESIGN_LOG.md "Starter deck draft", 2026-10-08). No skip is offered —
 * this is the only way forward out of this screen.
 */
export class DraftIntroScene extends Phaser.Scene {
  private run!: RunState;

  constructor() {
    super('DraftIntroScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'reward');
    addSettingsButton(this);

    this.add.text(400, 220, 'Build your deck', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(
        400,
        270,
        `Before the run begins, you'll choose your starting deck.\nYou'll be offered a card 1 of 3 at a time, ${STARTER_DECK_SIZE} times in a row —\nevery pick is yours to make.`,
        { fontSize: '15px', color: '#b4b4c4', align: 'center', lineSpacing: 6 }
      )
      .setOrigin(0.5);

    addButton(this, 400, 400, 'Proceed', () => {
      this.run.rollDraftOffer();
      enterCurrentNode(this, this.run);
    });
  }
}
