import Phaser from 'phaser';
import type { CardDefinition } from '../game/types';
import { cardText } from '../game/describe';
import type { RunNode, RunState } from '../game/RunState';
import { setCurrentRun } from '../session';
import { clearSavedRun, recordFinishedRun, saveRun } from '../storage';

// Small UI pieces shared by the run's scenes. Placeholder look, like the rest of the visuals.

export const CARD_WIDTH = 110;
export const CARD_HEIGHT = 150;

const TYPE_COLOR: Record<string, number> = {
  attack: 0xd9534f,
  skill: 0x4f8fd9,
  power: 0xb07de0,
};

/** A card's face (frame, cost badge, name, type, description), centered on the container's origin. */
export function buildCardFace(scene: Phaser.Scene, card: CardDefinition): Phaser.GameObjects.Container {
  const accent = TYPE_COLOR[card.type] ?? 0x888888;

  const g = scene.add.graphics();
  g.fillStyle(0x2c2c3c, 1);
  g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
  g.lineStyle(2, accent, 1);
  g.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);

  const costBadge = scene.add.circle(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, 13, accent);
  const costText = scene.add
    .text(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, `${card.cost}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  // name sits below the cost badge so long names never run into it; shrink to fit the width
  const nameText = scene.add
    .text(0, -36, card.name, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
    .setOrigin(0.5);
  for (let size = 13; nameText.width > CARD_WIDTH - 12 && size >= 10; size--) nameText.setFontSize(size);
  const typeText = scene.add.text(0, -19, card.type.toUpperCase(), { fontSize: '10px', color: '#9a9aae' }).setOrigin(0.5);
  const descText = scene.add
    .text(0, 28, cardText(card), {
      fontSize: '11px',
      color: '#d8d8e4',
      wordWrap: { width: CARD_WIDTH - 16 },
      align: 'center',
    })
    .setOrigin(0.5);

  return scene.add.container(0, 0, [g, costBadge, costText, nameText, typeText, descText]);
}

/** A clickable rectangle button with a hover grow. Returns its container. */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { width?: number; height?: number; fontSize?: number; fill?: number; stroke?: number; once?: boolean } = {}
): Phaser.GameObjects.Container {
  const { width = 180, height = 46, fontSize = 16, fill = 0x2b6b3d, stroke = 0x4fae6f, once = true } = opts;
  const bg = scene.add.rectangle(0, 0, width, height, fill).setStrokeStyle(2, stroke);
  const text = scene.add.text(0, 0, label, { fontSize: `${fontSize}px`, color: '#ffffff' }).setOrigin(0.5);
  const button = scene.add.container(x, y, [bg, text]);

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => scene.tweens.add({ targets: button, scale: 1.05, duration: 100 }));
  bg.on('pointerout', () => scene.tweens.add({ targets: button, scale: 1, duration: 100 }));
  bg.on('pointerdown', () => {
    // scene-changing buttons take one click only; the switch happens on the next frame
    if (once) bg.disableInteractive();
    onClick();
  });
  return button;
}

/**
 * Calls `handler` with the lowercased key for each key press while the scene is running.
 * Listens to the DOM directly rather than Phaser's keyboard plugin: the plugin re-dispatches
 * every key still in its per-frame queue whenever another key event arrives in the same frame,
 * so two quick presses (or a press and release) could fire a handler twice. Held keys are ignored.
 */
export function onKeyPress(scene: Phaser.Scene, handler: (key: string) => void): void {
  const listener = (event: KeyboardEvent): void => {
    // typing in the dev panel's boxes must not play cards
    const target = event.target;
    if (target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (!event.repeat) handler(event.key.toLowerCase());
  };
  window.addEventListener('keydown', listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', listener));
}

// ---- deck viewer ----

const openDeckViews = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

export function isDeckViewOpen(scene: Phaser.Scene): boolean {
  return openDeckViews.has(scene);
}

export function closeDeckView(scene: Phaser.Scene): void {
  openDeckViews.get(scene)?.destroy();
  openDeckViews.delete(scene);
}

/** Opens (or closes, if open) a full-screen view of every card in the run's deck. */
export function toggleDeckView(scene: Phaser.Scene, run: RunState): void {
  if (isDeckViewOpen(scene)) {
    closeDeckView(scene);
    return;
  }

  // the backdrop is interactive and on top, so nothing underneath can be clicked while it's open
  const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.92).setInteractive();
  backdrop.on('pointerdown', () => closeDeckView(scene));
  const title = scene.add
    .text(400, 36, `Deck (${run.deck.length} cards)`, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })
    .setOrigin(0.5);
  const hint = scene.add
    .text(400, 62, 'Click anywhere to close', { fontSize: '12px', color: '#777788' })
    .setOrigin(0.5);
  const view = scene.add.container(0, 0, [backdrop, title, hint]).setDepth(100);

  // lay cards out in a grid that always fits below the title, shrinking if the deck gets big
  const cols = 6;
  const rows = Math.max(1, Math.ceil(run.deck.length / cols));
  const scale = Math.min(0.9, (600 - 100) / (rows * (CARD_HEIGHT + 16)));
  const stepX = (CARD_WIDTH + 14) * scale;
  const stepY = (CARD_HEIGHT + 16) * scale;
  run.deck.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, run.deck.length - row * cols);
    const x = 400 + (col - (inRow - 1) / 2) * stepX;
    const y = 90 + stepY / 2 + row * stepY;
    view.add(buildCardFace(scene, card).setPosition(x, y).setScale(scale));
  });

  openDeckViews.set(scene, view);
  // scenes are reused across restarts, so never let a stale entry outlive the view
  view.once(Phaser.GameObjects.Events.DESTROY, () => openDeckViews.delete(scene));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => openDeckViews.delete(scene));
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

/** Top-left run status line: floor, gold, and (outside combat, where HP isn't otherwise shown) HP. */
export function addRunHud(scene: Phaser.Scene, run: RunState, opts: { showHp?: boolean } = {}): Phaser.GameObjects.Text {
  const parts = [`Floor ${run.floor}/${run.totalFloors}`, `Gold ${run.gold}`];
  if (opts.showHp) parts.unshift(`HP ${run.hp}/${run.maxHp}`);
  return scene.add.text(20, 22, parts.join('    '), { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0, 0.5);
}

/** Runs whose report has already been stored, so re-entering the end screen doesn't store it twice. */
const reportedRuns = new WeakSet<RunState>();

const NODE_SCENE: Record<RunNode['kind'], string> = { combat: 'CombatScene', rest: 'RestScene', shop: 'ShopScene' };

/** Starts whichever scene matches where the run is now. Every scene transition goes through here. */
export function enterCurrentNode(scene: Phaser.Scene, run: RunState): void {
  setCurrentRun(run);
  if (run.phase === 'won' || run.phase === 'lost') {
    // the run is over: keep its report for the playtester and forget the save
    if (!reportedRuns.has(run)) {
      reportedRuns.add(run);
      recordFinishedRun(run);
    }
    clearSavedRun();
    scene.scene.start('RunEndScene', { run });
    return;
  }
  saveRun(run); // every stop is a save point
  if (run.phase === 'reward') {
    scene.scene.start('RewardScene', { run });
  } else {
    scene.scene.start(NODE_SCENE[run.currentNode.kind], { run });
  }
}
