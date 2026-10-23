import * as Phaser from 'phaser';
import { ArenaGeometry, PlatformSpec } from '../types/game';
import { DynamicPlatformManager } from '../entities/DynamicPlatform';
import { EventBus } from './EventBus';
import { AudioManager } from './AudioManager';

/**
 * Level 2: Infernal Fortress Dedicated Architectural Terrain System.
 * Replaces generic floating rectangular slabs with connected fortress floors,
 * broken bridges, heavy structural beams, motorized lifts, dimensional energy bridges,
 * and a spacious purpose-built boss arena.
 */
export class Level2Architecture {
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

    // Helper to add heavy structural foundation piers underneath platforms
    const addFoundationPier = (x: number, topY: number, width = 64) => {
      const h = 720 - topY;
      if (h <= 0) return;
      const key = scene.textures.exists('platform_l2_bridge_pier')
        ? 'platform_l2_bridge_pier'
        : 'platform_l2_citadel_column';
      if (!scene.textures.exists(key)) return;
      const pier = scene.add.image(x, topY + h / 2, key);
      pier.setDisplaySize(width, h).setDepth(5).setAlpha(0.95);
    };

    // Helper to add industrial overhead ceiling / roof trusses for enclosed feel
    const addCeilingTruss = (x: number, y: number, width: number, height = 36) => {
      const key = scene.textures.exists('platform_l2_citadel') ? 'platform_l2_citadel' : 'platform_l2_vault';
      if (!scene.textures.exists(key)) return;
      const beam = scene.add.image(x, y, key);
      beam.setDisplaySize(width, height).setDepth(6).setAlpha(0.9);
      // Add ceiling support struts
      const strutKey = scene.textures.exists('platform_l2_citadel_column') ? 'platform_l2_citadel_column' : key;
      const colL = scene.add.image(x - width / 2 + 16, y + 60, strutKey);
      colL.setDisplaySize(28, 120).setDepth(5).setAlpha(0.85);
      const colR = scene.add.image(x + width / 2 - 16, y + 60, strutKey);
      colR.setDisplaySize(28, 120).setDepth(5).setAlpha(0.85);
    };

    // =========================================================================
    // STAGE 1 — THE DIVIDE APPROACH (x: 0 - 1400)
    // Fractured fortress approach bridge over boiling lava chasm
    // =========================================================================
    // 1. Bastion Bridgehead (x: 0 to 360)
    addSolidFloor(180, groundTop, 360, groundThickness, 'platform_l2_bridge');
    addFoundationPier(100, groundTop + 10, 80);
    addFoundationPier(280, groundTop + 10, 80);

    // 2. Broken Roadway Span (x: 360 to 740)
    addSolidFloor(550, groundTop, 380, groundThickness, 'platform_l2_bridge');
    addFoundationPier(460, groundTop + 10, 90);
    addFoundationPier(660, groundTop + 10, 90);

    // 3. High Pylon Arch Walkway (Upper Route across the chasm)
    // West Tower Ledge
    addSolidFloor(700, 440, 140, 36, 'platform_l2_bridge');
    addFoundationPier(700, 476, 48);
    // Central High Arch Walkway (holding rune_of_ruin)
    addSolidFloor(930, 340, 200, 36, 'platform_l2_bridge');
    addFoundationPier(860, 376, 32);
    addFoundationPier(1000, 376, 32);
    // East Tower Ledge
    addSolidFloor(1160, 440, 140, 36, 'platform_l2_bridge');
    addFoundationPier(1160, 476, 48);

    // 4. Eastern Fortress Gate Rampart (x: 1080 to 1400)
    addSolidFloor(1240, groundTop, 320, groundThickness, 'platform_l2_bridge');
    addFoundationPier(1140, groundTop + 10, 90);
    addFoundationPier(1320, groundTop + 10, 90);

    // =========================================================================
    // STAGE 2 — THE CRIMSON CITADEL (x: 1400 - 2800)
    // Enclosed industrial fortress interior with multi-deck catwalks & lifts
    // =========================================================================
    // 1. Citadel Entrance Floor (x: 1400 to 1840)
    addSolidFloor(1620, groundTop, 440, groundThickness, 'platform_l2_citadel');
    addFoundationPier(1500, groundTop + 10, 70);
    addFoundationPier(1740, groundTop + 10, 70);

    // Overhead Industrial Roof Girders (creating an enclosed interior fortress feel)
    addCeilingTruss(1650, 140, 500, 32);
    addCeilingTruss(2150, 140, 500, 32);
    addCeilingTruss(2650, 140, 500, 32);

    // 2. Upper Security Mezzanine (x: 1960 to 2480, y: 380) - Solid industrial catwalk
    addSolidFloor(2220, 380, 520, 38, 'platform_l2_citadel');
    addFoundationPier(2020, 418, 44);
    addFoundationPier(2220, 418, 44);
    addFoundationPier(2420, 418, 44);

    // 3. High Sniper Balcony (holding aegis_olympus) reached via launch pad
    addSolidFloor(2320, 220, 200, 32, 'platform_l2_citadel');
    addFoundationPier(2320, 252, 36);

    // 4. Lower Security Corridor (x: 1960 to 2660, y: 580)
    addSolidFloor(2310, groundTop, 700, groundThickness, 'platform_l2_citadel');
    addFoundationPier(2150, groundTop + 10, 80);
    addFoundationPier(2500, groundTop + 10, 80);

    // 5. Blast Gate Outpost (x: 2700 to 2800)
    addSolidFloor(2750, groundTop, 160, groundThickness, 'platform_l2_citadel');

    // =========================================================================
    // STAGE 3 — THE FRACTURE CORE (x: 2800 - 4200)
    // Dimensional reactor chamber with temporary energy bridges & core dais
    // =========================================================================
    // 1. Reactor West Intake Pier (x: 2800 to 3160)
    addSolidFloor(2980, groundTop, 360, groundThickness, 'platform_l2_fracture');
    addFoundationPier(2900, groundTop + 10, 90);
    addFoundationPier(3100, groundTop + 10, 90);

    // 2. Central Reactor Core Foundation & Pedestal (x: 3500 to 3820)
    addSolidFloor(3660, groundTop, 320, groundThickness, 'platform_l2_fracture');
    addFoundationPier(3660, groundTop + 10, 110);
    // Elevated Reactor Core Dais (holding reactor stabilizer terminal)
    addSolidFloor(3660, 440, 220, 38, 'platform_l2_fracture');
    addFoundationPier(3660, 478, 64);

    // Overhead rotating dimensional reactor ring
    if (scene.textures.exists('particle_red') || scene.textures.exists('hazard_emitter')) {
      const ring = scene.add.circle(3660, 210, 64, 0x140308, 0.7);
      ring.setStrokeStyle(4, 0xff243d, 0.85).setDepth(6);
      const innerRing = scene.add.circle(3660, 210, 36, 0x22050e, 0.9);
      innerRing.setStrokeStyle(3, 0xff5a1f, 0.9).setDepth(6);
      scene.tweens.add({
        targets: [ring, innerRing],
        scaleX: { from: 0.9, to: 1.1 },
        scaleY: { from: 1.1, to: 0.9 },
        yoyo: true,
        repeat: -1,
        duration: 1800,
        ease: 'Sine.easeInOut',
      });
    }

    // 3. Reactor Exhaust Bulwark (x: 4100 to 4200)
    addSolidFloor(4150, groundTop, 160, groundThickness, 'platform_l2_fracture');
    addFoundationPier(4150, groundTop + 10, 80);

    // =========================================================================
    // STAGE 4 — THE ENTROPY VAULT (x: 4200 - 5600)
    // High-containment vault with stable containment floors & laser corridors
    // =========================================================================
    // 1. Vault Sub-Level 1 Floor (x: 4200 to 4600)
    addSolidFloor(4400, groundTop, 400, groundThickness, 'platform_l2_vault');
    addFoundationPier(4300, groundTop + 10, 90);
    addFoundationPier(4500, groundTop + 10, 90);
    // Overhead containment roof girder
    addCeilingTruss(4400, 170, 420, 34);

    // 2. Chasm 1 Containment Shelf (x: 4710, y: 520)
    addSolidFloor(4710, 520, 160, 36, 'platform_l2_vault');
    addFoundationPier(4710, 556, 48);

    // 3. Vault Purge Citadel (x: 4820 to 5160)
    addSolidFloor(4990, groundTop, 340, groundThickness, 'platform_l2_vault');
    addFoundationPier(4900, groundTop + 10, 90);
    addFoundationPier(5080, groundTop + 10, 90);
    // Upper Vault Purge Control Balcony (holding terminal at x: 5000)
    addSolidFloor(5000, 420, 240, 36, 'platform_l2_vault');
    addFoundationPier(5000, 456, 56);
    addCeilingTruss(5000, 170, 360, 34);

    // 4. Vault Exit Bulwark (x: 5440 to 5600)
    addSolidFloor(5520, groundTop, 160, groundThickness, 'platform_l2_vault');
    addFoundationPier(5520, groundTop + 10, 90);

    // =========================================================================
    // STAGE 5 — THE ENTROPY NEXUS (x: 5600 - 7000)
    // Escalating molten core dais and collapsing heat shields
    // =========================================================================
    // 1. Nexus Lower Crucible (x: 5600 to 5940)
    addSolidFloor(5770, groundTop, 340, groundThickness, 'platform_l2_nexus');
    addFoundationPier(5700, groundTop + 10, 90);
    addFoundationPier(5880, groundTop + 10, 90);

    // 2. Monumental Central Nexus Dais (x: 6200 to 6600, y: 420)
    addSolidFloor(6400, 420, 400, 44, 'platform_l2_nexus');
    addFoundationPier(6280, 464, 70);
    addFoundationPier(6520, 464, 70);

    // 3. Sanctum Threshold (x: 6900 to 7000)
    addSolidFloor(6950, groundTop, 160, groundThickness, 'platform_l2_nexus');
    addFoundationPier(6950, groundTop + 10, 90);

    // =========================================================================
    // STAGE 6 — THE LAST WARDEN BOSS ARENA (x: 7000 - 8600)
    // Continuous solid combat floor, impassable boundary gates, and tactical balconies
    // =========================================================================
    // 1. CONTINUOUS SOLID COMBAT FLOOR (No gaps! Real boss arena!)
    addSolidFloor(7800, groundTop, 1540, groundThickness, 'platform_l2_arena');
    for (let bx = 7150; bx <= 8450; bx += 260) {
      addFoundationPier(bx, groundTop + 10, 90);
    }

    // 2. Tactical Evacuation Balconies (Architectural corbel ledges for evading ground slams)
    // West Command Balcony
    addSolidFloor(7420, 470, 240, 36, 'platform_l2_arena');
    addFoundationPier(7420, 506, 56);
    // Central Observation Gantry
    addSolidFloor(7850, 380, 260, 36, 'platform_l2_arena');
    addFoundationPier(7850, 416, 56);
    // East Command Balcony
    addSolidFloor(8280, 470, 240, 36, 'platform_l2_arena');
    addFoundationPier(8280, 506, 56);

    // 3. Impassable Arena Boundary Walls
    // West Entrance Wall / Portcullis (x: 7030)
    const wallKey = scene.textures.exists('platform_l2_arena_wall')
      ? 'platform_l2_arena_wall'
      : 'platform_l2_citadel';
    const westWall = scene.add.image(7030, groundTop - 180, wallKey);
    westWall.setDisplaySize(48, 380).setDepth(15).setAlpha(0.95);

    // East Abyss Wall (x: 8570)
    const eastWall = scene.add.image(8570, groundTop - 180, wallKey);
    eastWall.setDisplaySize(48, 380).setDepth(15).setAlpha(0.95);

    // Static physics boundaries for the arena to prevent escaping
    const westBound = staticPlatforms.create(7020, groundTop - 180, wallKey);
    westBound.setScale(40 / 256, 380 / 80).setVisible(false).refreshBody();

    const eastBound = staticPlatforms.create(8580, groundTop - 180, wallKey);
    eastBound.setScale(40 / 256, 380 / 80).setVisible(false).refreshBody();

    // Lava river beneath all chasms
    if (arena.hasLava && scene.textures.exists('lava_surface')) {
      const lava = scene.add.tileSprite(
        0,
        groundTop + groundThickness - 8,
        arena.worldWidth,
        64,
        'lava_surface'
      );
      lava.setOrigin(0, 0).setDepth(7);
      scene.tweens.add({ targets: lava, tilePositionX: 512, duration: 4000, repeat: -1 });
    }
  }
}
