import * as Phaser from 'phaser';
import { ProceduralTextureFactory } from '../systems/ProceduralTextureFactory';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show a sleek sci-fi loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x0b1120, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);
    progressBox.lineStyle(2, 0x00f0ff, 0.8);
    progressBox.strokeRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'INITIALIZING PROTOCOL...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#00f0ff',
    }).setOrigin(0.5, 0.5);

    /* Painted backdrop per realm. These reuse existing key art rather than
       inventing asset paths — the filenames differ from the realm names
       because the art predates the six-realm structure. */
    this.load.image('bg_realm1', '/images/bg_arrival.png');   // sky fortress + fracture
    this.load.image('bg_realm2', '/images/bg_level1.png');    // Infernal Fortress
    this.load.image('bg_realm3', '/images/bg_defeat.png');    // Vortex Over Floating Ruins
    this.load.image('bg_realm4', '/images/bg_realm4.png');    // Moonlit Citadel of the Frozen Sky
    this.load.image('bg_realm5', '/images/bg_victory.png');   // Celestial Forest Sanctuary
    this.load.image('bg_realm6', '/images/bg_level3.png');    // Crimson Rift: The Final Arena

    this.load.image('bg_arrival', '/images/bg_arrival.png');

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00f0ff, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    // Generate all vector & procedural graphics textures
    ProceduralTextureFactory.generateAllTextures(this);

    // Notify React layer that engine is ready
    EventBus.emit(GAME_EVENTS.SCENE_READY, 'PreloadScene');

    // Proceed to Main Menu Scene
    this.scene.start('MainMenuScene');
  }
}
