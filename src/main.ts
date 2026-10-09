import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { DraftIntroScene } from './scenes/DraftIntroScene';
import { EventScene } from './scenes/EventScene';
import { HeroSelectScene } from './scenes/HeroSelectScene';
import { MapScene } from './scenes/MapScene';
import { RestScene } from './scenes/RestScene';
import { RewardScene } from './scenes/RewardScene';
import { RunEndScene } from './scenes/RunEndScene';
import { ShopScene } from './scenes/ShopScene';
import { CANVAS_ZOOM, fitGameToWindow, fittedCanvasSize } from './display';

const { width, height } = fittedCanvasSize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width,
  height,
  zoom: CANVAS_ZOOM,
  parent: 'app',
  backgroundColor: '#1b1b24',
  disableContextMenu: true, // right-click cancels card targeting
  scene: [BootScene, HeroSelectScene, DraftIntroScene, MapScene, CombatScene, RewardScene, RestScene, ShopScene, EventScene, RunEndScene],
});

fitGameToWindow(game);

// the developer panel is a separate chunk, loaded only when the address has ?dev
if (new URLSearchParams(window.location.search).has('dev')) {
  void import('./dev/devPanel').then((m) => m.installDevPanel(game));
}

// Test hook, inert unless the address has ?e2e (see docs/E2E.md): exposes the game and a frame
// stepper so the browser tests can drive the loop by hand. It changes no gameplay.
if (new URLSearchParams(window.location.search).has('e2e')) {
  let clock = performance.now();
  const channel = new MessageChannel();
  const nextTask = (): Promise<void> =>
    new Promise((resolve) => {
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(0);
    });
  Object.assign(window, {
    __game: game,
    /** Runs `frames` game frames on a virtual clock, yielding between frames so promises (animation queues) can run. Returns the clock (ms). */
    __step: async (frames = 1, deltaMs = 16): Promise<number> => {
      for (let i = 0; i < frames; i++) {
        clock += deltaMs;
        game.step(clock, deltaMs);
        await nextTask();
      }
      return clock;
    },
  });
}
