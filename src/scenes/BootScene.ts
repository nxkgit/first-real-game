import Phaser from 'phaser';
import { newRun } from '../data/run';
import { enterCurrentNode } from './ui';

/** First scene: starts a fresh run and hands off to its first node. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    enterCurrentNode(this, newRun());
  }
}
