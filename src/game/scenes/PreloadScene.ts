import * as Phaser from 'phaser';
import { ProceduralTextureFactory } from '../systems/ProceduralTextureFactory';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { Analytics } from '../systems/Analytics';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Clean dark obsidian backdrop — no raw wireframes on canvas
    const bg = this.add.graphics();
    bg.fillStyle(0x030712, 1);
    bg.fillRect(0, 0, width, height);

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

    /* Realm 4's six-stage internal progression (The Breach Beyond -> The Gravity Graveyard ->
       The Riftborn Hunt -> The Crystal Cataclysm -> The Devouring Singularity -> The Void Sovereign). */
    this.load.image('bg_realm4', '/images/level4-stage1.png');        // The Voidborn Abyss default
    this.load.image('bg_realm4_stage1', '/images/level4-stage1.png'); // The Breach Beyond
    this.load.image('bg_realm4_stage2', '/images/level4-stage2.png'); // The Gravity Graveyard
    this.load.image('bg_realm4_stage3', '/images/level4-stage3.png'); // The Riftborn Hunt
    this.load.image('bg_realm4_stage4', '/images/level4-stage4.png'); // The Crystal Cataclysm
    this.load.image('bg_realm4_stage5', '/images/level4-stage5.png'); // The Devouring Singularity
    this.load.image('bg_realm4_stage6', '/images/level4-stage6.png'); // The Void Sovereign

    /* Realm 5's six-stage internal progression (The Entry Protocol -> The Recursive Engine ->
       The Desync Expanse -> The Null Foundry -> The Firewall Citadel -> The Overwrite Core). */
    this.load.image('bg_realm5', '/images/level5-stage1.png');        // The Overwrite default
    this.load.image('bg_realm5_stage1', '/images/level5-stage1.png'); // The Entry Protocol
    this.load.image('bg_realm5_stage2', '/images/level5-stage2.png'); // The Recursive Engine
    this.load.image('bg_realm5_stage3', '/images/level5-stage3.png'); // The Desync Expanse
    this.load.image('bg_realm5_stage4', '/images/level5-stage4.png'); // The Null Foundry
    this.load.image('bg_realm5_stage5', '/images/level5-stage5.png'); // The Firewall Citadel
    this.load.image('bg_realm5_stage6', '/images/level5-stage6.png'); // The Overwrite Core

    /* Realm 6's six-stage internal progression (The Crown's Shadow -> The Harrowed Gate ->
       The Hunting Grounds -> The Broken Sanctum -> The Red Wake -> Ra-One: The Final Protocol). */
    this.load.image('bg_realm6', '/images/level6-stage1.png');        // The Black Crown default
    this.load.image('bg_realm6_stage1', '/images/level6-stage1.png'); // The Crown's Shadow
    this.load.image('bg_realm6_stage2', '/images/level6-stage2.png'); // The Harrowed Gate
    this.load.image('bg_realm6_stage3', '/images/level6-stage3.png'); // The Hunting Grounds
    this.load.image('bg_realm6_stage4', '/images/level6-stage4.png'); // The Broken Sanctum
    this.load.image('bg_realm6_stage5', '/images/level6-stage5.png'); // The Red Wake
    this.load.image('bg_realm6_stage6', '/images/level6-stage6.png'); // Ra-One: The Final Protocol

    // Defeat background
    this.load.image('bg_defeat', '/images/defeat.png');

    // Common realm transition background
    this.load.image('bg_gameplay', '/images/gameplay.png');
  }

  create() {
    // Generate all vector & procedural graphics textures
    ProceduralTextureFactory.generateAllTextures(this);

    // Notify React layer that engine is ready
    EventBus.emit(GAME_EVENTS.SCENE_READY, 'PreloadScene');
    // Phaser + all procedural textures initialised successfully — this is
    // the "engine actually works" signal, distinct from a bare page view.
    Analytics.gameLoaded();

    // Proceed to Main Menu Scene
    this.scene.start('MainMenuScene');
  }
}
