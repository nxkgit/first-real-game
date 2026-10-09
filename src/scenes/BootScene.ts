import Phaser from 'phaser';
import { useLayoutCamera } from '../display';
import { loadSavedRun } from '../storage';
import { addScreenBackdrop, preloadArt } from './art';
import { preloadMusic, startMusic } from '../audio/Music';
import { toggleCredits } from './credits';
import { addButton, addReportButton, addSettingsButton, enterCurrentNode, startNewRun } from './ui';

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
      startNewRun(this, true);
      return;
    }

    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'start');
    addReportButton(this);
    addSettingsButton(this);
    this.add.text(400, 150, 'Run in progress', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(400, 180, `Playing as the ${saved.hero.name}`, { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0.5);
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
        // the old save is replaced once a hero is picked (every stop of the new run saves over it)
        startNewRun(this, true);
      },
      { fill: 0x2a2a3a, stroke: 0x5a5a72 }
    );
    addButton(this, 400, 450, 'Credits', () => toggleCredits(this), { width: 140, height: 34, fontSize: 14, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false });
  }
}
