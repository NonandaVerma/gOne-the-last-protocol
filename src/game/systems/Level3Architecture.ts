import * as Phaser from 'phaser';
import { ArenaGeometry } from '../types/game';
import { DynamicPlatformManager } from '../entities/DynamicPlatform';
import { RootlineManager } from './RootlineManager';
import { EventBus } from './EventBus';
import { AudioManager } from './AudioManager';

/**
 * Level 3: The Verdant Abyss Dedicated Architectural Terrain System.
 * Replaces generic floating rectangular slabs with connected living roots,
 * high canopy walkways, hollow tree colossus interior decks, ivory sanctuary bridges,
 * biological elevators, Rootline traversal anchors, and a purpose-built boss arena.
 */
export class Level3Architecture {
  public static build(
    scene: Phaser.Scene,
    staticPlatforms: Phaser.Physics.Arcade.StaticGroup,
    dynamicManager: DynamicPlatformManager,
    arena: ArenaGeometry
  ) {
    const groundTop = arena.groundTop; // 580
    const groundThickness = 140;

    // Helper to forge a solid static floor / structure
    const addSolidFloor = (
      x: number,
      y: number,
      width: number,
      height: number,
      textureKey: string,
      depth = 10
    ) => {
      const tex = scene.textures.get(textureKey).getSourceImage();
      const tw = (tex as { width?: number }).width || 256;
      const th = (tex as { height?: number }).height || 80;

      const plat = staticPlatforms.create(x, y + height / 2, textureKey);
      plat.setScale(width / tw, height / th).setDepth(depth).refreshBody();
      return plat;
    };

    // Helper to add massive grounding root support piers underneath platforms
    const addRootPier = (x: number, topY: number, width = 72) => {
      const h = 740 - topY;
      if (h <= 0) return;
      const key = scene.textures.exists('platform_l3_root_pier')
        ? 'platform_l3_root_pier'
        : 'platform_l3_root';
      const pier = scene.add.image(x, topY + h / 2, key);
      pier.setDisplaySize(width, h).setDepth(5).setAlpha(0.95);
    };

    // Helper to add diagonal bone struts for elevated canopies
    const addCanopyStrut = (x: number, y: number, height = 220) => {
      const key = scene.textures.exists('platform_l3_canopy_strut')
        ? 'platform_l3_canopy_strut'
        : 'platform_l3_root_pier';
      const strut = scene.add.image(x, y + height / 2, key);
      strut.setDisplaySize(36, height).setDepth(5).setAlpha(0.9);
    };

    // =========================================================================
    // STAGE 1 — THE LIVING THRESHOLD (x: 0 - 1400)
    // Gateway opening from alien architecture into the living forest
    // =========================================================================
    // 1. Gateway Bastion Rampart (x: 0 to 420)
    addSolidFloor(210, groundTop, 420, groundThickness, 'platform_l3_root');
    addRootPier(120, groundTop + 10, 80);
    addRootPier(320, groundTop + 10, 80);

    // 2. Living Root Causeway (x: 420 to 840)
    addSolidFloor(630, groundTop, 420, groundThickness, 'platform_l3_root');
    addRootPier(540, groundTop + 10, 84);
    addRootPier(740, groundTop + 10, 84);

    // 3. High Canopy Branch (Upper Route teaching Rootline traversal)
    addSolidFloor(950, 380, 240, 36, 'platform_l3_canopy');
    addCanopyStrut(870, 380, 200);
    addCanopyStrut(1030, 380, 200);

    // 4. Threshold Forest Edge (x: 1060 to 1400)
    addSolidFloor(1230, groundTop, 340, groundThickness, 'platform_l3_root');
    addRootPier(1140, groundTop + 10, 84);
    addRootPier(1320, groundTop + 10, 84);

    // =========================================================================
    // STAGE 2 — THE VERDANT WILDS (x: 1400 - 2800)
    // Multi-tier canopy routes over toxic acid spore chasms
    // =========================================================================
    // Lower Wilds Trunk Ground (x: 1400 to 1820)
    addSolidFloor(1610, groundTop, 420, groundThickness, 'platform_l3_root');
    addRootPier(1500, groundTop + 10, 84);
    addRootPier(1720, groundTop + 10, 84);

    // Acid Spore Chasm gap is at x: 1820 to 2260
    // Mid Canopy Aerial Deck (Walkway spanning the chasm)
    addSolidFloor(2040, 360, 280, 36, 'platform_l3_canopy');
    addCanopyStrut(1940, 360, 220);
    addCanopyStrut(2140, 360, 220);

    // High Observation Canopy (Carrying Aegis of Olympus relic)
    addSolidFloor(2340, 200, 240, 34, 'platform_l3_canopy');
    addCanopyStrut(2340, 200, 380);

    // Lower Wilds Rampart (x: 2260 to 2800)
    addSolidFloor(2530, groundTop, 540, groundThickness, 'platform_l3_root');
    addRootPier(2380, groundTop + 10, 84);
    addRootPier(2680, groundTop + 10, 84);

    // =========================================================================
    // STAGE 3 — THE HOLLOW COLOSSUS (x: 2800 - 4200)
    // Towering hollow tree interior with vertical bio-elevator and curved ribs
    // =========================================================================
    // Colossus Western Interior Floor (x: 2800 to 3200)
    addSolidFloor(3000, groundTop, 400, groundThickness, 'platform_l3_colossus_floor');
    addRootPier(2920, groundTop + 10, 88);
    addRootPier(3120, groundTop + 10, 88);

    // Interior Framing Trunk Rib
    if (scene.textures.exists('platform_l3_colossus_wall')) {
      const ribL = scene.add.image(2840, 380, 'platform_l3_colossus_wall');
      ribL.setDisplaySize(54, 400).setDepth(6).setAlpha(0.9);
      const ribR = scene.add.image(4160, 380, 'platform_l3_colossus_wall');
      ribR.setDisplaySize(54, 400).setDepth(6).setAlpha(0.9);
    }

    // Mid Colossus Interior Deck
    addSolidFloor(3500, 380, 280, 36, 'platform_l3_colossus_floor');
    addRootPier(3500, 416, 48);

    // High Core Power Balcony
    addSolidFloor(3820, 220, 260, 34, 'platform_l3_colossus_floor');
    addRootPier(3820, 254, 48);

    // Colossus Eastern Floor (x: 3660 to 4200)
    addSolidFloor(3930, groundTop, 540, groundThickness, 'platform_l3_colossus_floor');
    addRootPier(3780, groundTop + 10, 84);
    addRootPier(4080, groundTop + 10, 84);

    // =========================================================================
    // STAGE 4 — THE HEARTROOT SANCTUARY (x: 4200 - 5600)
    // Sacred ivory biomechanical cathedral with bloomable energy light-bridge
    // =========================================================================
    // Western Sanctuary Causeway (x: 4200 to 4680)
    addSolidFloor(4440, groundTop, 480, groundThickness, 'platform_l3_sanctuary');
    addRootPier(4340, groundTop + 10, 90);
    addRootPier(4560, groundTop + 10, 90);

    // Central Sanctuary Dais (x: 4680 to 5140)
    addSolidFloor(4910, groundTop, 460, groundThickness, 'platform_l3_sanctuary');
    addRootPier(4800, groundTop + 10, 90);
    addRootPier(5020, groundTop + 10, 90);

    // Upper Cathedral Balconies (Tactical dodging perches during guardian fights)
    addSolidFloor(4640, 440, 180, 34, 'platform_l3_sanctuary');
    addSolidFloor(5180, 440, 180, 34, 'platform_l3_sanctuary');

    // Chasm at x: 5140 to 5480 spanned by blooming Heartroot Energy Bridge!
    const sanctuaryBridge = addSolidFloor(5310, 540, 320, 34, 'platform_l3_sanctuary');
    sanctuaryBridge.setAlpha(0.25);
    const bridgeBody = sanctuaryBridge.body as Phaser.Physics.Arcade.StaticBody;
    bridgeBody.enable = false;

    scene.events.once('heartroot-harmonized', () => {
      bridgeBody.enable = true;
      bridgeBody.updateFromGameObject();
      scene.tweens.add({
        targets: sanctuaryBridge,
        alpha: 1,
        duration: 600,
        ease: 'Sine.easeInOut',
      });
    });

    // Eastern Sanctuary Rampart (x: 5480 to 5600)
    addSolidFloor(5540, groundTop, 140, groundThickness, 'platform_l3_sanctuary');
    addRootPier(5540, groundTop + 10, 84);

    // =========================================================================
    // STAGE 5 — THE BIOSPHERE CRUCIBLE (x: 5600 - 7000)
    // Seed pod approach with braided gold & emerald lines & phased bridges
    // =========================================================================
    // Crucible Western Deck (x: 5600 to 6040)
    addSolidFloor(5820, groundTop, 440, groundThickness, 'platform_l3_crucible');
    addRootPier(5720, groundTop + 10, 88);
    addRootPier(5940, groundTop + 10, 88);

    // High Crucible Conduit Walkways
    addSolidFloor(5960, 400, 220, 34, 'platform_l3_canopy');
    addCanopyStrut(5960, 400, 180);

    // Central Crucible Dais (x: 6460 to 7000)
    addSolidFloor(6730, groundTop, 540, groundThickness, 'platform_l3_crucible');
    addRootPier(6600, groundTop + 10, 88);
    addRootPier(6860, groundTop + 10, 88);

    // High Crucible Balcony (carrying overdrive shard & rune_of_ruin)
    addSolidFloor(6640, 320, 240, 34, 'platform_l3_crucible');

    // =========================================================================
    // STAGE 6 — THE WORLDSEED GUARDIAN (x: 7000 - 8400)
    // Purpose-built boss combat arena matching level-3-stage6.png!
    // =========================================================================
    // Solid, expansive combat arena floor spanning x: 7060 to 8380
    addSolidFloor(7720, groundTop, 1320, groundThickness, 'platform_l3_arena');

    // Heavy foundation root piers underneath arena
    [7200, 7450, 7720, 7990, 8240].forEach((px) => {
      addRootPier(px, groundTop + 10, 92);
    });

    // Left Arched Bone Ledge (matching ivory archway on the left of level-3-stage6.png)
    addSolidFloor(7340, 440, 220, 34, 'platform_l3_arena');
    addCanopyStrut(7340, 440, 140);

    // Right Arched Bone Ledge (matching ivory archway on the right of level-3-stage6.png)
    addSolidFloor(8100, 440, 220, 34, 'platform_l3_arena');
    addCanopyStrut(8100, 440, 140);

    // Worldseed Guardian Arena Arched Bone Walls (Framing boundaries at 7040 and 8400)
    if (scene.textures.exists('platform_l3_arena_wall')) {
      const wallL = scene.add.image(7040, 380, 'platform_l3_arena_wall');
      wallL.setDisplaySize(54, 400).setDepth(20).setAlpha(0.95);
      const wallR = scene.add.image(8400, 380, 'platform_l3_arena_wall');
      wallR.setDisplaySize(54, 400).setDepth(20).setAlpha(0.95);
    }
  }

  public static buildAnchors(rootlineManager: RootlineManager) {
    // Stage 1: Canopy Vault Anchor
    rootlineManager.addAnchor({
      id: 's1_rootline_pull',
      x: 880,
      y: 360,
      kind: 'pull',
      label: 'CANOPY VAULT ANCHOR',
      prompt: '[F] ROOTLINE TETHER // VAULT TO CANOPY',
      radius: 300,
      impulseX: 240,
      impulseY: -450,
    });

    // Stage 2: Canopy Swing Tendril & Spore Catapult
    rootlineManager.addAnchor({
      id: 's2_canopy_transfer',
      x: 1800,
      y: 330,
      kind: 'transfer',
      label: 'CANOPY SWING TENDRIL',
      prompt: '[F] ROOTLINE // SWING ACROSS CHASM',
      radius: 280,
      targetX: 2020,
      targetY: 340,
    });

    rootlineManager.addAnchor({
      id: 's2_spore_launch',
      x: 2160,
      y: 330,
      kind: 'launch',
      label: 'KINETIC SPORE BULB',
      prompt: '[F] SPORE LAUNCH // UPPER DECK',
      radius: 260,
      targetX: 2340,
      impulseX: 220,
      impulseY: -1150,
    });

    // Stage 3: Core Balcony Grapple
    rootlineManager.addAnchor({
      id: 's3_colossus_transfer',
      x: 3650,
      y: 200,
      kind: 'transfer',
      label: 'CORE ROOTLINE ANCHOR',
      prompt: '[F] ROOTLINE // GRAPPLE TO CORE BALCONY',
      radius: 300,
      targetX: 3820,
      targetY: 200,
    });

    // Stage 4: Heartroot Conduit Blossom
    rootlineManager.addAnchor({
      id: 's4_heartroot_bloom',
      x: 4850,
      y: 400,
      kind: 'env',
      label: 'HEARTROOT CONDUIT BLOSSOM',
      prompt: '[E / F] HARMONIZE HEARTROOT CONDUIT',
      radius: 260,
      eventKey: 'heartroot-harmonized',
    });

    // Stage 5: Crucible Spore Launch & Containment Matrix
    rootlineManager.addAnchor({
      id: 's5_crucible_launch',
      x: 6460,
      y: 460,
      kind: 'launch',
      label: 'CRUCIBLE SPORE CATAPULT',
      prompt: '[F] SPORE LAUNCH // UPPER CRUCIBLE DECK',
      radius: 260,
      targetX: 6640,
      impulseX: 180,
      impulseY: -1100,
    });

    rootlineManager.addAnchor({
      id: 's5_crucible_env',
      x: 6720,
      y: 380,
      kind: 'env',
      label: 'WORLDS EED CONTAINMENT MATRIX',
      prompt: '[E / F] OVERCHARGE SEED CONTAINMENT',
      radius: 260,
      eventKey: 'seed-containment-overcharged',
    });

    // Stage 6: Worldseed Guardian Evasion Grapple
    rootlineManager.addAnchor({
      id: 's6_boss_aerial_anchor',
      x: 7720,
      y: 260,
      kind: 'pull',
      label: 'CANOPY EVASION ANCHOR',
      prompt: '[F] ROOTLINE // EVADE GROUND ROOT SWEEP',
      radius: 380,
      impulseX: 0,
      impulseY: -380,
    });
  }
}
