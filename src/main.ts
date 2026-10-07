import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';
import { DPR, GAME_HEIGHT, GAME_WIDTH } from './display';

new Phaser.Game({
  type: Phaser.AUTO,
  width: Math.round(GAME_WIDTH * DPR),
  height: Math.round(GAME_HEIGHT * DPR),
  zoom: 1 / DPR,
  parent: 'app',
  backgroundColor: '#1b1b24',
  scene: [CombatScene],
});
