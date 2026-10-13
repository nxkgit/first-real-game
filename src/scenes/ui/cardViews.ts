import Phaser from 'phaser';
import type { CardDefinition } from '../../model';
import type { RunState } from '../../game/RunState';
import { CARD_HEIGHT, CARD_WIDTH, buildCardFace } from './cardFace';
import { addButton } from './widgets';

// ---- card list viewer (the deck, a draw pile, a discard pile) ----

const openCardViews = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

export function isDeckViewOpen(scene: Phaser.Scene): boolean {
  return openCardViews.has(scene);
}

export function closeDeckView(scene: Phaser.Scene): void {
  openCardViews.get(scene)?.destroy();
  openCardViews.delete(scene);
}

/** Opens (or closes, if one is open) a full-screen view of a list of cards. */
export function toggleCardView(scene: Phaser.Scene, title: string, cards: CardDefinition[]): void {
  if (isDeckViewOpen(scene)) {
    closeDeckView(scene);
    return;
  }

  // the backdrop is interactive and on top, so nothing underneath can be clicked while it's open
  const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.92).setInteractive();
  backdrop.on('pointerdown', () => closeDeckView(scene));
  const heading = scene.add.text(400, 36, title, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  const hint = scene.add
    .text(400, 62, cards.length === 0 ? 'Nothing here. Click anywhere to close' : 'Click anywhere to close', {
      fontSize: '12px',
      color: '#777788',
    })
    .setOrigin(0.5);
  const view = scene.add.container(0, 0, [backdrop, heading, hint]).setDepth(100);

  // lay cards out in a grid that always fits below the title, shrinking if there are many
  const cols = cards.length > 36 ? 10 : cards.length > 24 ? 8 : 6;
  const rows = Math.max(1, Math.ceil(cards.length / cols));
  const scale = Math.min(0.9, (600 - 100) / (rows * (CARD_HEIGHT + 16)), 740 / (cols * (CARD_WIDTH + 14)));
  const stepX = (CARD_WIDTH + 14) * scale;
  const stepY = (CARD_HEIGHT + 16) * scale;
  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, cards.length - row * cols);
    const x = 400 + (col - (inRow - 1) / 2) * stepX;
    const y = 90 + stepY / 2 + row * stepY;
    view.add(buildCardFace(scene, card).setPosition(x, y).setScale(scale));
  });

  openCardViews.set(scene, view);
  // scenes are reused across restarts, so never let a stale entry outlive the view
  view.once(Phaser.GameObjects.Events.DESTROY, () => openCardViews.delete(scene));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => openCardViews.delete(scene));
}

/** Opens (or closes) the view of every card in the run's deck. */
export function toggleDeckView(scene: Phaser.Scene, run: RunState): void {
  toggleCardView(scene, `Deck (${run.deck.length} cards)`, run.deck);
}

/** Small top-bar "Deck (N)" button that toggles the deck viewer. */
export function addDeckButton(scene: Phaser.Scene, run: RunState, x: number, beforeOpen?: () => void): void {
  addButton(
    scene,
    x,
    22,
    `Deck (${run.deck.length})`,
    () => {
      beforeOpen?.();
      toggleDeckView(scene, run);
    },
    { width: 104, height: 28, fontSize: 13, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false }
  );
}
