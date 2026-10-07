import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';
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
  scene: [CombatScene],
});

fitGameToWindow(game);
