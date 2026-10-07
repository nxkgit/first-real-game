import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { Sfx } from '../audio/Sfx';
import { useLayoutCamera } from '../display';
import { CARD_HEIGHT, CARD_WIDTH, addButton, addRunHud, buildCardFace, enterCurrentNode } from './ui';

/** After a won fight: pick one of the offered cards, or take gold instead (see DESIGN_LOG.md). */
export class RewardScene extends Phaser.Scene {
  private run!: RunState;
  /** Guards against a second click landing before the scene switch takes effect. */
  private chosen = false;

  constructor() {
    super('RewardScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.chosen = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addRunHud(this, this.run, { showHp: true });

    const offer = this.run.pendingReward;
    if (!offer) throw new Error('RewardScene started with no pending reward');

    this.add.text(400, 90, 'Choose a reward', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 128, 'Add one card to your deck, or take the gold instead.', { fontSize: '14px', color: '#9a9aae' })
      .setOrigin(0.5);

    const spacing = 150;
    const startX = 400 - ((offer.cards.length - 1) * spacing) / 2;
    const cardY = 275;
    offer.cards.forEach((card, i) => {
      const x = startX + i * spacing;
      const face = buildCardFace(this, card).setPosition(x, cardY);
      const zone = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0).setInteractive({ useHandCursor: true });
      face.add(zone);
      zone.on('pointerover', () => this.tweens.add({ targets: face, scale: 1.08, y: cardY - 8, duration: 120 }));
      zone.on('pointerout', () => this.tweens.add({ targets: face, scale: 1, y: cardY, duration: 120 }));
      zone.on('pointerdown', () => this.choose(() => this.run.takeRewardCard(i)));
    });

    this.add.text(400, 395, 'or', { fontSize: '16px', color: '#9a9aae' }).setOrigin(0.5);
    addButton(this, 400, 445, `Take ${offer.gold} gold`, () => this.choose(() => this.run.takeRewardGold()), {
      width: 200,
      fill: 0x6b5a1f,
      stroke: 0xd8b23c,
    });
    this.add
      .text(400, 500, `Deck: ${this.run.deck.length} cards.  Gold is saved for a shop (not built yet).`, {
        fontSize: '12px',
        color: '#777788',
      })
      .setOrigin(0.5);
  }

  private choose(apply: () => void): void {
    if (this.chosen) return;
    this.chosen = true;
    apply();
    Sfx.cardPlay();
    enterCurrentNode(this, this.run);
  }
}
