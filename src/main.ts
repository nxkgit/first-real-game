import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#1b1b24',
  scene: [CombatScene],
});
