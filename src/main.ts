import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { EventScene } from './scenes/EventScene';
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
  scene: [BootScene, MapScene, CombatScene, RewardScene, RestScene, ShopScene, EventScene, RunEndScene],
});

fitGameToWindow(game);

// the developer panel is a separate chunk, loaded only when the address has ?dev
if (new URLSearchParams(window.location.search).has('dev')) {
  void import('./dev/devPanel').then((m) => m.installDevPanel(game));
}
