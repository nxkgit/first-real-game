import Phaser from 'phaser';
import type { RunState } from '../game/RunState';
import { relicText } from '../game/describe';
import { Sfx } from '../audio/Sfx';
import { STARTER_DECK_SIZE } from '../data/tunables';
import { addScreenBackdrop } from './art';
import { useLayoutCamera } from '../display';
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
 * After a won fight: pick one of the offered cards, or take gold instead (see DESIGN_LOG.md).
 * Also reused for the pre-run starter-deck draft (`draft: true` in init data) — DESIGN_LOG.md
 * "Starter deck draft", 2026-10-08: same 1-of-3 picker, no gold option, and no skip (there is no
 * cancel path here at all, by design, draft or not).
 */
export class RewardScene extends Phaser.Scene {
  private run!: RunState;
  private draft = false;
  /** Guards against a second click landing before the scene switch takes effect. */
  private chosen = false;

  constructor() {
    super('RewardScene');
  }

  init(data: { run: RunState; draft?: boolean }): void {
    this.run = data.run;
    this.draft = Boolean(data.draft);
    this.chosen = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    addScreenBackdrop(this, 'reward');
    if (!this.draft) {
      const hud = addRunHud(this, this.run, { showHp: true });
      addDeckButton(this, this.run, hud.x + hud.width + 70);
      addReportButton(this, hud.x + hud.width + 70);
    } else {
      addReportButton(this); // the draft screen has no run readout or Deck button
    }
    addSettingsButton(this);

    const cards = this.draft ? this.run.pendingDraftOffer : this.run.pendingReward?.cards;
    if (!cards) throw new Error(`RewardScene started with no pending ${this.draft ? 'draft offer' : 'reward'}`);
    const relic = this.draft ? undefined : this.run.pendingReward?.relic;
    const gold = this.draft ? undefined : this.run.pendingReward?.gold;

    this.add
      .text(400, 90, this.draft ? 'Choose a starting card' : 'Choose a reward', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(
        400,
        128,
        this.draft
          ? `Pick one card for your starting deck (${this.run.deck.length + 1} of ${STARTER_DECK_SIZE}).`
          : 'Add one card to your deck, or take the gold instead.',
        { fontSize: '14px', color: '#9a9aae' }
      )
      .setOrigin(0.5);
    if (relic) {
      // an elite's relic comes whichever you pick
      this.add
        .rectangle(400, 168, 560, 34, 0x24243a)
        .setStrokeStyle(2, 0xd8b23c);
      this.add
        .text(400, 168, `Relic with either choice: ${relic.name}. ${relicText(relic)}`, {
          fontSize: '12px',
          color: '#ffe066',
          align: 'center',
          wordWrap: { width: 540 },
        })
        .setOrigin(0.5);
    }

    const spacing = 150;
    const startX = 400 - ((cards.length - 1) * spacing) / 2;
    const cardY = 275;
    cards.forEach((card, i) => {
      const x = startX + i * spacing;
      const face = buildCardFace(this, card).setPosition(x, cardY);
      const zone = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0).setInteractive({ useHandCursor: true });
      face.add(zone);
      zone.on('pointerover', () => this.tweens.add({ targets: face, scale: 1.08, y: cardY - 8, duration: 120 }));
      zone.on('pointerout', () => this.tweens.add({ targets: face, scale: 1, y: cardY, duration: 120 }));
      zone.on('pointerdown', () => this.choose(() => (this.draft ? this.run.pickDraftCard(i) : this.run.takeRewardCard(i))));
    });

    if (!this.draft) {
      this.add.text(400, 395, 'or', { fontSize: '16px', color: '#9a9aae' }).setOrigin(0.5);
      addButton(this, 400, 445, `Take ${gold} gold`, () => this.choose(() => this.run.takeRewardGold()), {
        width: 200,
        fill: 0x6b5a1f,
        stroke: 0xd8b23c,
      });
    }
    this.add
      .text(
        400,
        500,
        this.draft ? `Picked ${this.run.deck.length} of ${STARTER_DECK_SIZE}.` : `Deck: ${this.run.deck.length} cards.  Gold can be spent at a shop.`,
        { fontSize: '12px', color: '#777788' }
      )
      .setOrigin(0.5);

    // keys: 1-3 pick that card, G takes the gold (not in a draft round), D / Esc for the deck view
    onKeyPress(this, (key) => {
      if (key === 'd') return toggleDeckView(this, this.run);
      if (key === 'escape') return closeDeckView(this);
      if (isDeckViewOpen(this)) return;
      if (!this.draft && key === 'g') return this.choose(() => this.run.takeRewardGold());
      const slot = Number(key);
      if (Number.isInteger(slot) && slot >= 1 && slot <= cards.length) {
        this.choose(() => (this.draft ? this.run.pickDraftCard(slot - 1) : this.run.takeRewardCard(slot - 1)));
      }
    });
  }

  private choose(apply: () => void): void {
    if (this.chosen) return;
    this.chosen = true;
    apply();
    Sfx.choose();
    enterCurrentNode(this, this.run);
  }
}
