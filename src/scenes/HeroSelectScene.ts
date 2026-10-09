import Phaser from 'phaser';
import { HEROES } from '../data/heroes';
import { newRun } from '../data/run';
import { useLayoutCamera } from '../display';
import { heroPowerText } from '../game/describe';
import type { HeroDefinition } from '../game/types';
import { seedFromUrl } from '../session';
import { addHeroPortrait, addScreenBackdrop } from './art';
import { addButton, addReportButton, addSettingsButton, enterCurrentNode } from './ui';

const RESOURCE_NAME: Record<NonNullable<HeroDefinition['resource']>, string> = {
  temperature: 'Temperature',
  radiantLight: 'Radiant Light',
};

const PANEL_WIDTH = 250;
const PANEL_GAP = 24;

/**
 * Shown on a new run only (never when continuing a saved run, which already has its hero).
 * Lists every hero with the stats a player needs to choose: portrait, max HP, energy, hero power.
 * The blurb is the literal placeholder text until the user writes the real one.
 */
export class HeroSelectScene extends Phaser.Scene {
  private useUrlSeed = false;

  constructor() {
    super('HeroSelectScene');
  }

  init(data: { useUrlSeed?: boolean } = {}): void {
    this.useUrlSeed = data.useUrlSeed ?? false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'start');
    addReportButton(this);
    addSettingsButton(this);

    this.add.text(400, 60, 'Choose your hero', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const totalWidth = HEROES.length * PANEL_WIDTH + (HEROES.length - 1) * PANEL_GAP;
    const left = 400 - totalWidth / 2 + PANEL_WIDTH / 2;
    HEROES.forEach((hero, i) => this.buildPanel(hero, left + i * (PANEL_WIDTH + PANEL_GAP)));
  }

  private buildPanel(hero: HeroDefinition, x: number): void {
    this.add.rectangle(x, 320, PANEL_WIDTH, 440, 0x1f1f2c, 0.92).setStrokeStyle(2, 0x45455a);
    this.add.text(x, 120, hero.name, { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    addHeroPortrait(this, hero, x, 215, 120);
    this.add
      .text(x, 300, `Max HP ${hero.maxHp}    Energy ${hero.energy}`, { fontSize: '15px', color: '#e8e8f4', fontStyle: 'bold' })
      .setOrigin(0.5);
    if (hero.resource) {
      this.add.text(x, 326, `Resource: ${RESOURCE_NAME[hero.resource]}`, { fontSize: '13px', color: '#c8c8d8' }).setOrigin(0.5);
    }
    const power = hero.heroPower;
    this.add
      .text(x, 380, `Hero power (${power.cost} energy):\n${heroPowerText(power)}`, {
        fontSize: '13px',
        color: '#c8c8d8',
        align: 'center',
        wordWrap: { width: PANEL_WIDTH - 30 },
        lineSpacing: 4,
      })
      .setOrigin(0.5);
    this.add
      .text(x, 440, hero.blurb, { fontSize: '13px', color: '#8a8a9e', align: 'center', fontStyle: 'italic', wordWrap: { width: PANEL_WIDTH - 30 } })
      .setOrigin(0.5);
    addButton(this, x, 500, `Play ${hero.name}`, () => {
      enterCurrentNode(this, newRun(this.useUrlSeed ? seedFromUrl() : undefined, hero.id));
    }, { width: 190, height: 40 });
  }
}
