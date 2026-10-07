import Phaser from 'phaser';
import { CREDITS } from '../data/credits';
import { onKeyPress } from './ui';

// The Credits overlay: who made the art. Opens over any scene; click anywhere or press Esc to close.

const open = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();
const listening = new WeakSet<Phaser.Scene>();

export function isCreditsOpen(scene: Phaser.Scene): boolean {
  return open.has(scene);
}

export function closeCredits(scene: Phaser.Scene): void {
  open.get(scene)?.destroy();
  open.delete(scene);
}

/** Opens the credits (or closes them, if already open). */
export function toggleCredits(scene: Phaser.Scene): void {
  if (isCreditsOpen(scene)) {
    closeCredits(scene);
    return;
  }
  // Esc closes it; scenes are reused, so the listener goes in once per run of the scene
  if (!listening.has(scene)) {
    listening.add(scene);
    onKeyPress(scene, (key) => {
      if (key === 'escape' && isCreditsOpen(scene)) closeCredits(scene);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      listening.delete(scene);
      open.delete(scene);
    });
  }

  // the backdrop is interactive and on top, so nothing underneath can be clicked while it is open
  const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.94).setInteractive();
  backdrop.on('pointerdown', () => closeCredits(scene));
  const parts: Phaser.GameObjects.GameObject[] = [backdrop];
  parts.push(scene.add.text(400, 40, 'Credits', { fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
  parts.push(
    scene.add
      .text(400, 70, 'Art used in this game. Click anywhere to close.', { fontSize: '12px', color: '#777788' })
      .setOrigin(0.5)
  );

  const rowHeight = Math.min(66, 470 / CREDITS.length);
  CREDITS.forEach((credit, i) => {
    const y = 100 + i * rowHeight;
    parts.push(
      scene.add.text(60, y, credit.usedFor, { fontSize: '14px', color: '#e8e8f0', fontStyle: 'bold' }),
      scene.add.text(60, y + 18, `${credit.source}, by ${credit.author} (${credit.licence})`, {
        fontSize: '11px',
        color: '#c8c8d8',
        wordWrap: { width: 680 },
      }),
      scene.add.text(60, y + 34, credit.url, { fontSize: '10px', color: '#6f8fb8' })
    );
  });

  const view = scene.add.container(0, 0, parts).setDepth(300);
  open.set(scene, view);
  view.once(Phaser.GameObjects.Events.DESTROY, () => open.delete(scene));
}
