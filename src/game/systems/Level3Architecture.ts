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

    // 2. Living Root Causeway (x: 420 to 860)
    addSolidFloor(640, groundTop, 440, groundThickness, 'platform_l3_root');
    addRootPier(540, groundTop + 10, 84);
    addRootPier(740, groundTop + 10, 84);

    // 3. Graduated Root Shelves & Canopy Branch across the [860, 1060] chasm
    // Low stepping root shelf: effortless 78px rise from ground (y: 648 -> 570)
    addSolidFloor(900, 570, 150, 32, 'platform_l3_root');
    addRootPier(900, 602, 54);

    // Mid stepping root shelf: gentle 70px rise (y: 570 -> 500)
    addSolidFloor(1010, 500, 150, 32, 'platform_l3_root');
    addRootPier(1010, 532, 54);

    // High Canopy Branch (Upper Route teaching Rootline traversal, carrying hermes_step relic)
    addSolidFloor(960, 440, 220, 34, 'platform_l3_canopy');
    addCanopyStrut(880, 440, 180);
    addCanopyStrut(1040, 440, 180);

    // 4. Threshold Forest Edge (x: 1060 to 1400)
    addSolidFloor(1230, groundTop, 340, groundThickness, 'platform_l3_root');
    addRootPier(1140, groundTop + 10, 84);
    addRootPier(1320, groundTop + 10, 84);

    // =========================================================================
    // STAGE 2 — THE VERDANT WILDS (x: 1400 - 2800)
    // Multi-tier canopy routes over toxic acid spore chasms with recovery decks
    // =========================================================================
    // Lower Wilds Trunk Ground (x: 1400 to 1820)
    addSolidFloor(1610, groundTop, 420, groundThickness, 'platform_l3_root');
    addRootPier(1500, groundTop + 10, 84);
    addRootPier(1720, groundTop + 10, 84);

    // Pre-chasm takeoff root ledge (x: 1780, y: 560)
    addSolidFloor(1780, 560, 160, 32, 'platform_l3_root');
    addRootPier(1780, 592, 56);

    // Acid Spore Chasm gap is at x: 1820 to 2260
    // Mid Canopy Aerial Deck (Walkway bridging the chasm)
    addSolidFloor(1980, 480, 220, 34, 'platform_l3_canopy');
    addCanopyStrut(1980, 480, 160);

    // Ascending canopy deck
    addSolidFloor(2160, 420, 200, 34, 'platform_l3_canopy');
    addCanopyStrut(2160, 420, 220);

    // Safe lower recovery root deck (sits right above acid marsh to catch missed jumps)
    addSolidFloor(2040, 620, 280, 30, 'platform_l3_root');
    addRootPier(2040, 650, 70);

    // High Observation Canopy (Carrying Aegis of Olympus relic)
    addSolidFloor(2340, 320, 220, 34, 'platform_l3_canopy');
    addCanopyStrut(2340, 320, 260);

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

    // Interior Framing Trunk Ribs
    if (scene.textures.exists('platform_l3_colossus_wall')) {
      const ribL = scene.add.image(2840, 380, 'platform_l3_colossus_wall');
      ribL.setDisplaySize(54, 400).setDepth(6).setAlpha(0.9);
      const ribR = scene.add.image(4160, 380, 'platform_l3_colossus_wall');
      ribR.setDisplaySize(54, 400).setDepth(6).setAlpha(0.9);
    }

    // Lower Interior Rib Shelf
    addSolidFloor(3200, 540, 180, 32, 'platform_l3_colossus_floor');
    addRootPier(3200, 572, 60);

    // Mid Colossus Interior Deck
    addSolidFloor(3460, 450, 240, 34, 'platform_l3_colossus_floor');
    addRootPier(3460, 484, 56);

    // High Core Power Balcony (Carrying thunderheart relic)
    addSolidFloor(3760, 320, 240, 34, 'platform_l3_colossus_floor');
    addRootPier(3760, 354, 56);

    // Descending Eastern Rib Shelf (stepping down into eastern floor)
    addSolidFloor(3660, 530, 180, 32, 'platform_l3_colossus_floor');
    addRootPier(3660, 562, 60);

    // Colossus Eastern Floor (x: 3660 to 4200)
    addSolidFloor(3930, groundTop, 540, groundThickness, 'platform_l3_colossus_floor');
    addRootPier(3780, groundTop + 10, 84);
    addRootPier(4080, groundTop + 10, 84);

    // =========================================================================
    // STAGE 4 — THE HEARTROOT SANCTUARY (x: 4200 - 5600)
    // Sacred ivory biomechanical cathedral with accessible altar and bloomable bridge
    // =========================================================================
    // Western Sanctuary Causeway (x: 4200 to 4680)
    addSolidFloor(4440, groundTop, 480, groundThickness, 'platform_l3_sanctuary');
    addRootPier(4340, groundTop + 10, 90);
    addRootPier(4560, groundTop + 10, 90);

    // Central Sanctuary Dais (x: 4680 to 5140)
    addSolidFloor(4910, groundTop, 460, groundThickness, 'platform_l3_sanctuary');
    addRootPier(4800, groundTop + 10, 90);
    addRootPier(5020, groundTop + 10, 90);

    // Altar Platform Supporting HEARTROOT_HARMONIZE Console (x: 4850, y: 500)
    addSolidFloor(4850, 500, 220, 34, 'platform_l3_sanctuary');
    addRootPier(4850, 534, 60);

    // Stepping ledges up to the cathedral altar
    addSolidFloor(4660, 560, 160, 30, 'platform_l3_sanctuary');
    addSolidFloor(5040, 560, 160, 30, 'platform_l3_sanctuary');

    // Upper Cathedral Balconies (Tactical dodging perches during guardian fights)
    addSolidFloor(4640, 420, 180, 32, 'platform_l3_sanctuary');
    addSolidFloor(5180, 420, 180, 32, 'platform_l3_sanctuary');

    // Chasm at x: 5140 to 5480 spanned by blooming Heartroot Energy Bridge!
    const sanctuaryBridge = addSolidFloor(5310, 550, 340, 34, 'platform_l3_sanctuary');
    sanctuaryBridge.setAlpha(0.25);
    const bridgeBody = sanctuaryBridge.body as Phaser.Physics.Arcade.StaticBody;
    bridgeBody.enable = false;

    // Upper Ivory Root Archway across the chasm (Alternative parkour route)
    addSolidFloor(5310, 440, 200, 32, 'platform_l3_sanctuary');

    const onHeartrootHarmonized = () => {
      bridgeBody.enable = true;
      bridgeBody.updateFromGameObject();
      scene.tweens.add({
        targets: sanctuaryBridge,
        alpha: 1,
        duration: 600,
        ease: 'Sine.easeInOut',
      });
    };
    EventBus.on('heartroot-harmonized', onHeartrootHarmonized);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('heartroot-harmonized', onHeartrootHarmonized);
    });

    // Eastern Sanctuary Rampart (x: 5480 to 5600)
    addSolidFloor(5540, groundTop, 140, groundThickness, 'platform_l3_sanctuary');
    addRootPier(5540, groundTop + 10, 84);

    // =========================================================================
    // STAGE 5 — THE BIOSPHERE CRUCIBLE (x: 5600 - 7000)
    // Braided root conduits with motorized seed pod ferry across chasm
    // =========================================================================
    // Crucible Western Deck (x: 5600 to 6040)
    addSolidFloor(5820, groundTop, 440, groundThickness, 'platform_l3_crucible');
    addRootPier(5720, groundTop + 10, 88);
    addRootPier(5940, groundTop + 10, 88);

    // Stepping root arches across the [6040, 6460] chasm
    // 1. Takeoff Root Arch
    addSolidFloor(6080, 530, 160, 32, 'platform_l3_crucible');
    addRootPier(6080, 562, 60);

    // 2. High Canopy Conduit Walkway
    addSolidFloor(5960, 420, 220, 34, 'platform_l3_canopy');
    addCanopyStrut(5960, 420, 180);

    // 3. Intermediate Root Anchor
    addSolidFloor(6250, 440, 180, 32, 'platform_l3_crucible');
    addRootPier(6250, 472, 60);

    // 4. Landing Root Arch
    addSolidFloor(6420, 530, 160, 32, 'platform_l3_crucible');
    addRootPier(6420, 562, 60);

    // Central Crucible Dais (x: 6460 to 7000)
    addSolidFloor(6730, groundTop, 540, groundThickness, 'platform_l3_crucible');
    addRootPier(6600, groundTop + 10, 88);
    addRootPier(6860, groundTop + 10, 88);

    // High Crucible Balcony (carrying overdrive shard & rune_of_ruin)
    addSolidFloor(6640, 360, 240, 34, 'platform_l3_crucible');

    // =========================================================================
    // STAGE 6 — THE WORLDSEED GUARDIAN (x: 7000 - 8400)
    // Purpose-built boss combat arena matching level-3-stage6.png!
    // =========================================================================
    // Solid, expansive combat arena floor spanning x: 7040 to 8380
    addSolidFloor(7710, groundTop, 1340, groundThickness, 'platform_l3_arena');

    // Heavy foundation root piers underneath arena
    [7200, 7450, 7720, 7990, 8240].forEach((px) => {
      addRootPier(px, groundTop + 10, 92);
    });

    // Left Arched Bone Ledge (matching ivory archway on the left of level-3-stage6.png)
    addSolidFloor(7340, 460, 220, 34, 'platform_l3_arena');
    addCanopyStrut(7340, 460, 140);

    // Right Arched Bone Ledge (matching ivory archway on the right of level-3-stage6.png)
    addSolidFloor(8080, 460, 220, 34, 'platform_l3_arena');
    addCanopyStrut(8080, 460, 140);

    // Worldseed Guardian Arena Arched Bone Walls (Framing boundaries at 7040 and 8400)
    if (scene.textures.exists('platform_l3_arena_wall')) {
      const wallL = scene.add.image(7040, 470, 'platform_l3_arena_wall');
      wallL.setDisplaySize(48, 220).setDepth(20).setAlpha(0.95);
      const wallR = scene.add.image(8400, 470, 'platform_l3_arena_wall');
      wallR.setDisplaySize(48, 220).setDepth(20).setAlpha(0.95);
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
      targetX: 1980,
      targetY: 460,
    });

    rootlineManager.addAnchor({
      id: 's2_spore_launch',
      x: 2160,
      y: 400,
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
      targetX: 3760,
      targetY: 300,
    });

    // Stage 4: Heartroot Conduit Blossom
    rootlineManager.addAnchor({
      id: 's4_heartroot_bloom',
      x: 4850,
      y: 460,
      kind: 'env',
      label: 'HEARTROOT CONDUIT BLOSSOM',
      prompt: '[E / F] HARMONIZE HEARTROOT CONDUIT',
      radius: 260,
      eventKey: 'heartroot-harmonized',
    });

    // Stage 5: Crucible Spore Launch & Containment Matrix
    rootlineManager.addAnchor({
      id: 's5_crucible_launch',
      x: 6420,
      y: 510,
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
      y: 600,
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
