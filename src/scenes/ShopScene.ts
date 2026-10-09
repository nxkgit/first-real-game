import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { Sfx } from '../audio/Sfx';
import { addScreenBackdrop } from './art';
import { useLayoutCamera } from '../display';
import { saveRun } from '../storage';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  addButton,
  addDeckButton,
  addReportButton,
  addRunHud,
  addSettingsButton,
  buildCardFace,
  closeDeckView,
  enterCurrentNode,
  isDeckViewOpen,
  onKeyPress,
  toggleDeckView,
} from './ui';

/**
 * DRAFT shop: a shelf of cards with prices and a Leave button. Exists to give a visual idea of the
 * layout; contents, prices and even which things are sold are open design decisions.
 */
export class ShopScene extends Phaser.Scene {
  private run!: RunState;
  private leaving = false;

  constructor() {
    super('ShopScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.leaving = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'shop');
    // a counter for the wares to sit on
    this.add.rectangle(400, 345, 640, 10, 0x4a3a2a);
    this.add.rectangle(400, 362, 640, 24, 0x2e2418);

    const hud = addRunHud(this, this.run, { showHp: true });
    addDeckButton(this, this.run, hud.x + hud.width + 70);
    addReportButton(this, hud.x + hud.width + 70);
    addSettingsButton(this);

    this.add.text(400, 80, 'Shop', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 112, 'DRAFT layout: stock and prices are placeholders', { fontSize: '12px', color: '#c89a3c' })
      .setOrigin(0.5);

    const items = this.run.shopItems;
    const spacing = 150;
    const startX = 400 - ((items.length - 1) * spacing) / 2;
    const cardY = 235;
    items.forEach((item, i) => {
      const x = startX + i * spacing;
      const face = buildCardFace(this, item.card).setPosition(x, cardY);
      const affordable = !item.sold && item.price <= this.run.gold;

      if (item.sold) {
        face.setAlpha(0.3);
        this.add.text(x, cardY, 'SOLD', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      } else {
        if (!affordable) face.setAlpha(0.6);
        const zone = this.add
          .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0)
          .setInteractive({ useHandCursor: affordable });
        face.add(zone);
        if (affordable) {
          zone.on('pointerover', () => this.tweens.add({ targets: face, scale: 1.08, y: cardY - 8, duration: 120 }));
          zone.on('pointerout', () => this.tweens.add({ targets: face, scale: 1, y: cardY, duration: 120 }));
        }
        zone.on('pointerdown', () => this.buy(i));
      }

      // price tag under the counter: a coin and the price, red when you can't afford it
      const tagY = 395;
      this.add.text(x, tagY - 18, `[${i + 1}]`, { fontSize: '11px', color: '#777788' }).setOrigin(0.5);
      if (!item.sold) {
        this.add.circle(x - 22, tagY + 4, 8, 0xd8b23c).setStrokeStyle(2, 0xfff0c4);
        this.add
          .text(x - 8, tagY + 4, `${item.price}`, {
            fontSize: '18px',
            color: affordable ? '#ffe066' : '#d9534f',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);
      }
    });

    addButton(this, 400, 480, 'Leave', () => this.leave(), { width: 180, fill: 0x2a2a3a, stroke: 0x5a5a72 });
    this.add
      .text(400, 530, `Deck: ${this.run.deck.length} cards`, { fontSize: '12px', color: '#777788' })
      .setOrigin(0.5);

    onKeyPress(this, (key) => {
      if (key === 'd') return toggleDeckView(this, this.run);
      if (key === 'escape') return closeDeckView(this);
      if (isDeckViewOpen(this)) return;
      if (key === 'l') return this.leave();
      const slot = Number(key);
      if (Number.isInteger(slot) && slot >= 1 && slot <= items.length) this.buy(slot - 1);
    });
  }

  private buy(index: number): void {
    if (this.leaving) return;
    if (this.run.buyShopItem(index)) {
      Sfx.choose();
      saveRun(this.run);
      this.scene.restart({ run: this.run }); // redraw with the new gold and the SOLD tag
    }
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.run.leaveShop();
    enterCurrentNode(this, this.run);
  }
}
