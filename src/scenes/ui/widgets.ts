import Phaser from 'phaser';
import { getSettings } from '../../app/settings';
import { addBorder } from '../artLoader';
import { gameKeyFrom } from '../keyFilter';

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
  const border = addBorder(scene, width, height, stroke, 10);
  const button = scene.add.container(x, y, border ? [bg, border, text] : [bg, text]);

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
    const key = gameKeyFrom(event);
    if (key !== null) handler(key);
  };
  window.addEventListener('keydown', listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', listener));
}

/** Shakes the camera unless the player has turned motion down in the settings. */
export function shakeCamera(scene: Phaser.Scene, duration: number, intensity: number): void {
  if (!getSettings().reducedMotion) scene.cameras.main.shake(duration, intensity);
}
