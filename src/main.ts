import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { RestScene } from './scenes/RestScene';
import { RewardScene } from './scenes/RewardScene';
import { RunEndScene } from './scenes/RunEndScene';
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
  scene: [BootScene, CombatScene, RewardScene, RestScene, RunEndScene],
});

fitGameToWindow(game);
