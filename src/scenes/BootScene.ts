import Phaser from 'phaser';
import { newRun } from '../data/run';
import { useLayoutCamera } from '../display';
import { seedFromUrl } from '../session';
import { clearSavedRun, loadSavedRun } from '../storage';
import { addScreenBackdrop, preloadArt } from './art';
import { preloadMusic, startMusic } from '../audio/Music';
import { toggleCredits } from './credits';
import { addButton, addReportButton, addSettingsButton, enterCurrentNode } from './ui';

/** First scene: starts a fresh run, or offers to continue the one saved in this browser. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    preloadArt(this);
    preloadMusic(this);
  }

  create(): void {
    startMusic(this);
    const saved = loadSavedRun();
    if (!saved) {
      enterCurrentNode(this, newRun(seedFromUrl()));
      return;
    }

    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'start');
    addReportButton(this);
    addSettingsButton(this);
    this.add.text(400, 150, 'Run in progress', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(
        400,
        205,
        `Floor ${Math.max(1, saved.floor)} of ${saved.totalFloors}    HP ${saved.hp}/${saved.maxHp}    Gold ${saved.gold}    Deck ${saved.deck.length}`,
        { fontSize: '14px', color: '#c8c8d8' }
      )
      .setOrigin(0.5);
    this.add
      .text(400, 235, 'A fight in progress restarts from its beginning.', { fontSize: '12px', color: '#b4b4c4' })
      .setOrigin(0.5);

    addButton(this, 400, 320, 'Continue', () => enterCurrentNode(this, saved));
    addButton(
      this,
      400,
      385,
      'New Run',
      () => {
        clearSavedRun();
        enterCurrentNode(this, newRun(seedFromUrl()));
      },
      { fill: 0x2a2a3a, stroke: 0x5a5a72 }
    );
    addButton(this, 400, 450, 'Credits', () => toggleCredits(this), { width: 140, height: 34, fontSize: 14, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false });
  }
}
