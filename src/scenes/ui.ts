import Phaser from 'phaser';
import type { CardDefinition } from '../game/types';
import type { RunState } from '../game/RunState';

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
    .text(0, 28, card.description, {
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
  opts: { width?: number; fill?: number; stroke?: number } = {}
): Phaser.GameObjects.Container {
  const { width = 180, fill = 0x2b6b3d, stroke = 0x4fae6f } = opts;
  const bg = scene.add.rectangle(0, 0, width, 46, fill).setStrokeStyle(2, stroke);
  const text = scene.add.text(0, 0, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
  const button = scene.add.container(x, y, [bg, text]);

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => scene.tweens.add({ targets: button, scale: 1.05, duration: 100 }));
  bg.on('pointerout', () => scene.tweens.add({ targets: button, scale: 1, duration: 100 }));
  bg.on('pointerdown', () => {
    bg.disableInteractive(); // one click per button; the scene changes right after
    onClick();
  });
  return button;
}

/** Top-left run status line: floor, gold, and (outside combat, where HP isn't otherwise shown) HP. */
export function addRunHud(scene: Phaser.Scene, run: RunState, opts: { showHp?: boolean } = {}): Phaser.GameObjects.Text {
  const parts = [`Floor ${run.floor}/${run.totalFloors}`, `Gold ${run.gold}`];
  if (opts.showHp) parts.unshift(`HP ${run.hp}/${run.maxHp}`);
  return scene.add.text(20, 22, parts.join('    '), { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0, 0.5);
}

/** Starts whichever scene matches where the run is now. Every scene transition goes through here. */
export function enterCurrentNode(scene: Phaser.Scene, run: RunState): void {
  if (run.phase === 'won' || run.phase === 'lost') {
    scene.scene.start('RunEndScene', { run });
  } else if (run.phase === 'reward') {
    scene.scene.start('RewardScene', { run });
  } else {
    scene.scene.start(run.currentNode.kind === 'combat' ? 'CombatScene' : 'RestScene', { run });
  }
}
