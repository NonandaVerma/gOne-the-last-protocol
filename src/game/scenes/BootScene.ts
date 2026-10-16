import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Minimal boot graphics if needed
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
