import Phaser from 'phaser';
import { ANIMATION_SPEEDS, getSettings, onSettingsChange, updateSettings } from '../../app/settings';
import { toggleCredits } from '../credits';
import { addButton } from './widgets';
import { startNewRun } from './navigation';

// ---- settings ----

/** Applies the animation-speed setting to a scene and keeps it in step if the setting changes. */
function followAnimationSpeed(scene: Phaser.Scene): void {
  const apply = (): void => {
    scene.tweens.timeScale = getSettings().animationSpeed;
    scene.time.timeScale = getSettings().animationSpeed;
  };
  apply();
  const off = onSettingsChange(apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
}

/** Adds the small Settings button in the bottom-right corner, and applies the saved animation speed. */
export function addSettingsButton(scene: Phaser.Scene, options: { canRestart?: boolean } = {}): void {
  const canRestart = options.canRestart ?? true;
  followAnimationSpeed(scene);
  let panel: Phaser.GameObjects.Container | null = null;

  const close = (): void => {
    panel?.destroy();
    panel = null;
  };
  /** "Abandon this run?": Yes goes to a new run (the hero select screen), Cancel returns to Settings. */
  const openConfirm = (): void => {
    close();
    const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.8).setInteractive();
    backdrop.on('pointerdown', close);
    const box = scene.add.rectangle(400, 300, 380, 190, 0x1b1b24).setStrokeStyle(2, 0x5a5a72).setInteractive();
    const title = scene.add.text(400, 245, 'Abandon this run?', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const note = scene.add.text(400, 280, 'Your progress will be lost.', { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0.5);
    const yes = addButton(scene, 330, 335, 'Yes', () => startNewRun(scene, false), { width: 120, height: 36, fontSize: 15 });
    const cancel = addButton(scene, 470, 335, 'Cancel', openSettings, {
      width: 120,
      height: 36,
      fontSize: 15,
      fill: 0x2a2a3a,
      stroke: 0x5a5a72,
      once: false,
    });
    panel = scene.add.container(0, 0, [backdrop, box, title, note, yes, cancel]).setDepth(200);
  };
  const extra = canRestart ? 50 : 0;
  const openSettings = (): void => {
    close();
    const parts: Phaser.GameObjects.GameObject[] = [];
    const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.8).setInteractive();
    backdrop.on('pointerdown', close);
    const box = scene.add.rectangle(400, 300 + extra / 2, 380, 340 + extra, 0x1b1b24).setStrokeStyle(2, 0x5a5a72).setInteractive();
    parts.push(backdrop, box);
    parts.push(scene.add.text(400, 152, 'Settings', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));

    const s = getSettings();
    const row = (y: number, label: string, value: string, onClick: () => void): void => {
      parts.push(scene.add.text(240, y, label, { fontSize: '15px', color: '#c8c8d8' }).setOrigin(0, 0.5));
      parts.push(
        addButton(scene, 530, y, value, onClick, {
          width: 130,
          height: 30,
          fontSize: 14,
          fill: 0x2a2a3a,
          stroke: 0x5a5a72,
          once: false,
        })
      );
    };
    const volumeSteps = [0, 0.25, 0.5, 0.75, 1];
    row(205, 'Effects volume', `${Math.round(s.volume * 100)}%`, () => {
      const next = volumeSteps.find((v) => v > s.volume + 0.001) ?? 0;
      updateSettings({ volume: next });
      openSettings();
    });
    row(243, 'Music volume', `${Math.round(s.musicVolume * 100)}%`, () => {
      const next = volumeSteps.find((v) => v > s.musicVolume + 0.001) ?? 0;
      updateSettings({ musicVolume: next });
      openSettings();
    });
    row(281, 'Sound & music', s.muted ? 'Off' : 'On', () => {
      updateSettings({ muted: !s.muted });
      openSettings();
    });
    row(319, 'Animation speed', `${s.animationSpeed}x`, () => {
      const next = ANIMATION_SPEEDS[(ANIMATION_SPEEDS.indexOf(s.animationSpeed) + 1) % ANIMATION_SPEEDS.length];
      updateSettings({ animationSpeed: next });
      openSettings();
    });
    row(357, 'Screen shake', s.reducedMotion ? 'Off' : 'On', () => {
      updateSettings({ reducedMotion: !s.reducedMotion });
      openSettings();
    });
    if (canRestart) {
      parts.push(
        addButton(scene, 400, 410, 'Restart run', openConfirm, {
          width: 260,
          height: 36,
          fontSize: 15,
          fill: 0x4a2430,
          stroke: 0x8a4a5a,
          once: false,
        })
      );
    }
    parts.push(
      addButton(scene, 330, 415 + extra, 'Credits', () => toggleCredits(scene), {
        width: 120,
        height: 36,
        fontSize: 15,
        fill: 0x2a2a3a,
        stroke: 0x5a5a72,
        once: false,
      })
    );
    parts.push(addButton(scene, 470, 415 + extra, 'Close', close, { width: 120, height: 36, fontSize: 15, once: false }));
    panel = scene.add.container(0, 0, parts).setDepth(200);
  };

  addButton(scene, 756, 586, 'Settings', () => (panel ? close() : openSettings()), {
    width: 76,
    height: 22,
    fontSize: 11,
    fill: 0x2a2a3a,
    stroke: 0x5a5a72,
    once: false,
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (panel = null));
}
