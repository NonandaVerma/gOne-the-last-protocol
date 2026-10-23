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
    this.load.image('bg_realm1', '/images/level1-stage1.png'); // Shattered Skies, stage 1: Awakening

    /* Realm 1's five-stage internal progression (Awakening -> Sky Sentinels ->
       Shattered Bridge -> Corrupted Guardian -> Protocol Fragment). Stages 1-4
       are the four backdrops the player actually crosses — Backdrop.ts
       crossfades between them as the camera moves through the realm's world-X
       (see STAGE_BACKDROPS in realms.ts). Stage 5 has no separate traversal
       geometry yet, so its art is used for the post-boss transition card
       instead of being wired to unbuilt gameplay. */
    this.load.image('bg_realm1_stage2', '/images/level1-stage2.png'); // Sky Sentinels
    this.load.image('bg_realm1_stage3', '/images/level1-stage3.png'); // The Shattered Bridge
    this.load.image('bg_realm1_stage4', '/images/level1-stage4.png'); // The Corrupted Guardian
    this.load.image('bg_realm1_stage5', '/images/level1-stage5.png'); // Protocol Fragment

    /* Realm 2's six-stage internal progression (The Divide Approach -> The Crimson Citadel ->
       The Fracture Core -> The Entropy Vault -> The Entropy Nexus -> The Last Warden). */
    this.load.image('bg_realm2', '/images/level2-stage1.png');        // Infernal Fortress default
    this.load.image('bg_realm2_stage1', '/images/level2-stage1.png'); // The Divide Approach
    this.load.image('bg_realm2_stage2', '/images/level2-stage2.png'); // The Crimson Citadel
    this.load.image('bg_realm2_stage3', '/images/level2-stage3.png'); // The Fracture Core
    this.load.image('bg_realm2_stage4', '/images/level2-stage4.png'); // The Entropy Vault
    this.load.image('bg_realm2_stage5', '/images/level2-stage5.png'); // The Entropy Nexus
    this.load.image('bg_realm2_stage6', '/images/level2-stage6.jpg'); // The Last Warden

    /* Realm 3's six-stage internal progression (The Living Threshold -> The Verdant Wilds ->
       The Hollow Colossus -> The Heartroot Sanctuary -> The Biosphere Crucible -> The Worldseed Guardian). */
    this.load.image('bg_realm3', '/images/level3-stage1.png');        // The Verdant Abyss default
    this.load.image('bg_realm3_stage1', '/images/level3-stage1.png'); // The Living Threshold
    this.load.image('bg_realm3_stage2', '/images/level3-stage2.png'); // The Verdant Wilds
    this.load.image('bg_realm3_stage3', '/images/level3-stage3.png'); // The Hollow Colossus
    this.load.image('bg_realm3_stage4', '/images/level3-stage4.png'); // The Heartroot Sanctuary
    this.load.image('bg_realm3_stage5', '/images/level3-stage5.png'); // The Biosphere Crucible
    this.load.image('bg_realm3_stage6', '/images/level-3-stage6.png'); // The Worldseed Guardian

    this.load.image('bg_realm4', '/images/bg_realm4.png');    // Moonlit Citadel of the Frozen Sky
    this.load.image('bg_realm5', '/images/bg_victory.png');   // Celestial Forest Sanctuary
    this.load.image('bg_realm6', '/images/Six Realms of the Shattered Protocol.png'); // Final Arena

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
