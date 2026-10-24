import * as Phaser from 'phaser';
import { ArenaGeometry } from '../types/game';
import { DynamicPlatformManager } from '../entities/DynamicPlatform';
import { GravitasManager } from './GravitasManager';
import { EventBus } from './EventBus';
import { AudioManager } from './AudioManager';

/**
 * Level 4: The Voidborn Abyss Dedicated Architectural Terrain System.
 *
 * Implements the six-stage progressive campaign geometry:
 * - Stage 1: The Breach Beyond — obsidian-violet fractured bedrock & introductory updraft well.
 * - Stage 2: The Gravity Graveyard — inverted megacity skyscrapers, tower climbs, vertical anti-grav shaft & slingshot anchor.
 * - Stage 3: The Riftborn Hunt — crystalline geological ridges, destructible crystal barriers & dimensional rift anchors.
 * - Stage 4: The Crystal Cataclysm — fractured tectonic plates, timed 4-phase crystal eruptions & sentinel shielding node.
 * - Stage 5: The Devouring Singularity — heavy void alloy platforms, singularity pull zone & anti-singularity anchors.
 * - Stage 6: The Void Sovereign Boss Arena — expansive continuous combat floor, tactical balconies & twin pylon overload anchors.
 */
export class Level4Architecture {
  public static build(
    scene: Phaser.Scene,
    staticPlatforms: Phaser.Physics.Arcade.StaticGroup,
    dynamicManager: DynamicPlatformManager,
    arena: ArenaGeometry
  ) {
    const groundTop = arena.groundTop; // 648
    const groundThickness = 140;

    // Helper to forge a solid static floor
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

    // Helper to add massive grounding void piers underneath platforms
    const addVoidPier = (x: number, topY: number, width = 72) => {
      const h = 780 - topY;
      if (h <= 0) return;
      const key = scene.textures.exists('platform_l4_pylon')
        ? 'platform_l4_pylon'
        : 'platform_l4_void';
      const pier = scene.add.image(x, topY + h / 2, key);
      pier.setDisplaySize(width, h).setDepth(5).setAlpha(0.95);
    };

    // Helper to add inverted megacity ceiling trusses
    const addCeilingTruss = (x: number, y: number, width: number, height = 36) => {
      const key = scene.textures.exists('platform_l4_megacity')
        ? 'platform_l4_megacity'
        : 'platform_l4_void';
      const beam = scene.add.image(x, y, key);
      beam.setDisplaySize(width, height).setDepth(6).setAlpha(0.9);
    };

    // =========================================================================
    // STAGE 1 — THE BREACH BEYOND (x: 0 - 1400)
    // Stable arrival zone, gentle gap, first anti-grav well & exit lift
    // =========================================================================
    // 1. Arrival Platform (x: 0 to 420)
    addSolidFloor(210, groundTop, 420, groundThickness, 'platform_l4_void');
    addVoidPier(140, groundTop + 10, 84);
    addVoidPier(300, groundTop + 10, 84);

    // 2. Broken Approach Shelf (x: 560 to 800) across [420, 560] chasm (140px jump)
    addSolidFloor(680, groundTop, 240, groundThickness, 'platform_l4_void');
    addVoidPier(680, groundTop + 10, 88);

    // Elevated Observation Shelf
    addSolidFloor(680, 530, 160, 32, 'platform_l4_void');

    // 3. Elevated Alien Shelf above first gravity well
    addSolidFloor(960, 440, 220, 34, 'platform_l4_void');
    addVoidPier(960, 474, 52);

    // 4. Descending Ledge
    addSolidFloor(1140, 530, 180, 32, 'platform_l4_void');
    addVoidPier(1140, 562, 52);

    // 5. Stage 1 Outpost Floor (x: 1220 to 1400)
    addSolidFloor(1310, groundTop, 220, groundThickness, 'platform_l4_void');
    addVoidPier(1310, groundTop + 10, 88);

    // =========================================================================
    // STAGE 2 — THE GRAVITY GRAVEYARD (x: 1400 - 2800)
    // Inverted megacity, vertical tower ascent, anti-grav shaft & suspended bridge
    // =========================================================================
    // 1. Megacity Entry Catwalk (x: 1400 to 1720)
    addSolidFloor(1560, groundTop, 320, groundThickness, 'platform_l4_megacity');
    addVoidPier(1480, groundTop + 10, 80);
    addVoidPier(1640, groundTop + 10, 80);

    // Inverted ceiling girder overhead
    addCeilingTruss(1650, 130, 460, 34);

    // 2. Tower Ascent: Multi-Tiered Architectural Catwalks
    // Base Tower Foundation
    addSolidFloor(1840, groundTop, 240, groundThickness, 'platform_l4_megacity');
    addVoidPier(1840, groundTop + 10, 90);

    // Tier 1 Ledge
    addSolidFloor(1760, 540, 160, 32, 'platform_l4_megacity');
    // Tier 2 Ledge
    addSolidFloor(1920, 440, 160, 32, 'platform_l4_megacity');
    // High Spire Balcony
    addSolidFloor(2220, 320, 220, 36, 'platform_l4_megacity');
    addVoidPier(2220, 356, 56);

    // 3. Suspended Sky-Bridge Catwalk
    addSolidFloor(2420, 280, 220, 34, 'platform_l4_megacity');

    // 4. Phased Gravity-Shift Bridge across [2480, 2760] Chasm
    const gravBridge = addSolidFloor(2620, 460, 260, 32, 'platform_l4_megacity');
    gravBridge.setAlpha(0.28);
    const bridgeBody = gravBridge.body as Phaser.Physics.Arcade.StaticBody;
    bridgeBody.enable = false;

    const onBridgeSolidified = () => {
      bridgeBody.enable = true;
      bridgeBody.updateFromGameObject();
      scene.tweens.add({
        targets: gravBridge,
        alpha: 1,
        duration: 500,
        ease: 'Sine.easeInOut',
      });
    };
    EventBus.on('grav-bridge-solidified', onBridgeSolidified);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('grav-bridge-solidified', onBridgeSolidified);
    });

    // 5. Megacity Bastion (x: 2750 to 2860)
    addSolidFloor(2800, groundTop, 160, groundThickness, 'platform_l4_megacity');
    addVoidPier(2800, groundTop + 10, 90);

    // =========================================================================
    // STAGE 3 — THE RIFTBORN HUNT (x: 2800 - 4200)
    // Crystalline wilderness, destructible crystal monolith & rift anchor arenas
    // =========================================================================
    // 1. Crystal Approach Floor (x: 2860 to 3200)
    addSolidFloor(3030, groundTop, 340, groundThickness, 'platform_l4_crystal');
    addVoidPier(2950, groundTop + 10, 88);
    addVoidPier(3110, groundTop + 10, 88);

    // Stepping crystal shelf
    addSolidFloor(3120, 530, 180, 32, 'platform_l4_crystal');

    // 2. Rift 1 Dais (x: 3200 to 3520)
    addSolidFloor(3360, groundTop, 320, groundThickness, 'platform_l4_crystal');
    addVoidPier(3360, groundTop + 10, 90);

    // 3. Destructible Crystal Monolith Barrier (x: 3640)
    const crystalWall = scene.add.image(3640, groundTop - 70, 'platform_l4_crystal');
    crystalWall.setDisplaySize(44, 160).setDepth(15).setAlpha(0.95);
    const crystalWallBody = staticPlatforms.create(3640, groundTop - 70, 'platform_l4_crystal');
    crystalWallBody.setScale(44 / 256, 160 / 80).setVisible(false).refreshBody();

    const onRift1Disrupted = () => {
      crystalWallBody.destroy();
      scene.tweens.add({
        targets: crystalWall,
        alpha: 0,
        scaleY: 0,
        duration: 400,
        onComplete: () => crystalWall.destroy(),
      });
      AudioManager.getInstance().playOverdrive();
    };
    EventBus.on('rift1-disrupted', onRift1Disrupted);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('rift1-disrupted', onRift1Disrupted);
    });

    // Crystal Ramp
    addSolidFloor(3760, 560, 180, 32, 'platform_l4_crystal');

    // 4. Primary Rift Arena Floor (x: 3840 to 4200)
    addSolidFloor(4020, groundTop, 360, groundThickness, 'platform_l4_crystal');
    addVoidPier(3920, groundTop + 10, 90);
    addVoidPier(4120, groundTop + 10, 90);

    // Flanking crystal sniper balconies
    addSolidFloor(3840, 480, 160, 32, 'platform_l4_crystal');
    addSolidFloor(4140, 480, 160, 32, 'platform_l4_crystal');

    // =========================================================================
    // STAGE 4 — THE CRYSTAL CATACLYSM (x: 4200 - 5600)
    // Tectonic crystal plates, timed eruptions & sentinel shield node
    // =========================================================================
    // 1. Fracture Field Entrance (x: 4200 to 4550)
    addSolidFloor(4370, groundTop, 340, groundThickness, 'platform_l4_cataclysm');
    addVoidPier(4300, groundTop + 10, 90);
    addVoidPier(4460, groundTop + 10, 90);

    // 2. Safe Elevated Stepping Shelves
    addSolidFloor(4620, 500, 180, 32, 'platform_l4_cataclysm');
    addSolidFloor(4820, 500, 180, 32, 'platform_l4_cataclysm');

    // Intermediate ground causeway
    addSolidFloor(4720, groundTop, 220, groundThickness, 'platform_l4_cataclysm');

    // 3. Sentinel Arena Floor (x: 4940 to 5280)
    addSolidFloor(5110, groundTop, 340, groundThickness, 'platform_l4_cataclysm');
    addVoidPier(5020, groundTop + 10, 90);
    addVoidPier(5200, groundTop + 10, 90);

    // Resonating Crystal Node Shelf
    addSolidFloor(5160, 440, 180, 34, 'platform_l4_crystal');

    // 4. Crystal Stabilizer Rampart (x: 5460 to 5600)
    addSolidFloor(5530, groundTop, 160, groundThickness, 'platform_l4_cataclysm');
    addVoidPier(5530, groundTop + 10, 90);

    // =========================================================================
    // STAGE 5 — THE DEVOURING SINGULARITY (x: 5600 - 7000)
    // Singularity approach, anti-singularity bubble stepping decks & threshold
    // =========================================================================
    // 1. Singularity Approach Deck (x: 5600 to 5940)
    addSolidFloor(5770, groundTop, 340, groundThickness, 'platform_l4_singularity');
    addVoidPier(5700, groundTop + 10, 90);
    addVoidPier(5860, groundTop + 10, 90);

    // 2. Stepping Containment Decks spanning chasm
    addSolidFloor(6060, 530, 180, 32, 'platform_l4_singularity');
    addSolidFloor(6220, 460, 180, 32, 'platform_l4_singularity');
    addSolidFloor(6380, 400, 180, 32, 'platform_l4_singularity');
    addSolidFloor(6540, 500, 180, 32, 'platform_l4_singularity');

    // 3. Singularity Threshold Dais (x: 6620 to 7000)
    addSolidFloor(6810, groundTop, 380, groundThickness, 'platform_l4_singularity');
    addVoidPier(6720, groundTop + 10, 90);
    addVoidPier(6900, groundTop + 10, 90);

    // Single approach step to the boss threshold
    addSolidFloor(6960, 520, 160, 32, 'platform_l4_singularity');

    // =========================================================================
    // STAGE 6 — THE VOID SOVEREIGN BOSS ARENA (x: 7000 - 8600)
    // Continuous solid combat floor, tactical balconies & impassable boundary walls
    // =========================================================================
    // 1. CONTINUOUS SOLID COMBAT ARENA FLOOR (x: 7040 to 8540, 1500px wide!)
    addSolidFloor(7790, groundTop, 1500, groundThickness, 'platform_l4_arena');
    for (let bx = 7180; bx <= 8440; bx += 240) {
      addVoidPier(bx, groundTop + 10, 90);
    }

    // 2. Tactical Evacuation Balconies
    // West Command Balcony
    addSolidFloor(7360, 460, 240, 36, 'platform_l4_arena');
    addVoidPier(7360, 496, 56);
    // East Command Balcony
    addSolidFloor(8240, 460, 240, 36, 'platform_l4_arena');
    addVoidPier(8240, 496, 56);

    // 3. Impassable Arena Boundary Walls
    const wallKey = scene.textures.exists('platform_l4_arena_wall')
      ? 'platform_l4_arena_wall'
      : 'platform_l4_arena';

    // West Entrance Wall starts raised open at y: 220 so G-ONE enters without barrier!
    const westWall = scene.add.image(7040, 220, wallKey);
    westWall.setDisplaySize(48, 220).setDepth(15).setAlpha(0.95);

    // East Void Boundary Wall
    const eastWall = scene.add.image(8560, groundTop - 180, wallKey);
    eastWall.setDisplaySize(48, 380).setDepth(15).setAlpha(0.95);
    const eastBound = staticPlatforms.create(8570, groundTop - 180, wallKey);
    eastBound.setScale(40 / 256, 380 / 80).setVisible(false).refreshBody();

    // When G-ONE enters the arena (at arenaStartX = 7150), slam the west gate shut!
    let westBoundCreated = false;
    const onArenaEntered = (data?: { level?: number }) => {
      if (data && data.level !== undefined && data.level !== 4) return;
      scene.tweens.killTweensOf(westWall);
      scene.tweens.add({
        targets: westWall,
        y: 470,
        duration: 400,
        ease: 'Bounce.easeOut',
      });
      if (!westBoundCreated) {
        westBoundCreated = true;
        const westBound = staticPlatforms.create(7040, 470, wallKey);
        westBound.setScale(40 / 256, 220 / 80).setVisible(false).refreshBody();
      }
    };

    EventBus.on('arena-entered', onArenaEntered);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('arena-entered', onArenaEntered);
    });
  }

  public static buildAnchors(gravitasManager: GravitasManager) {
    // Stage 1: Gravity Lift Anchor
    gravitasManager.addAnchor({
      id: 's1_grav_lift_anchor',
      x: 1260,
      y: 460,
      kind: 'invert',
      label: 'GRAVITY LIFT ANCHOR',
      prompt: '[F] GRAVITAS // INVERT EXIT LIFT',
      radius: 280,
      eventKey: 'stage1-lift-inverted',
    });

    // Stage 1: Introductory Updraft Gravity Well
    gravitasManager.addWell({
      id: 's1_updraft_well',
      x: 880,
      y: 560,
      width: 180,
      height: 240,
      direction: 'up',
      force: 850,
      label: 'LOCALIZED GRAVITATIONAL UPDRAFT',
    });

    // Stage 2: Tower Slingshot & Anti-Grav Shaft
    gravitasManager.addAnchor({
      id: 's2_tower_anchor',
      x: 2060,
      y: 260,
      kind: 'sling',
      label: 'KINETIC GRAVITAS SLING',
      prompt: '[F] GRAVITAS // SLING TO HIGH TOWER',
      radius: 280,
      targetX: 2360,
      targetY: 240,
      impulseX: 320,
      impulseY: -620,
    });

    gravitasManager.addAnchor({
      id: 's2_bridge_anchor',
      x: 2480,
      y: 420,
      kind: 'bridge',
      label: 'HARD-LIGHT GRAVITY BRIDGE',
      prompt: '[F] GRAVITAS // SOLIDIFY BRIDGE',
      radius: 280,
      eventKey: 'grav-bridge-solidified',
    });

    gravitasManager.addWell({
      id: 's2_tower_shaft_well',
      x: 2060,
      y: 440,
      width: 160,
      height: 300,
      direction: 'up',
      force: 880,
      label: 'INVERTED MEGACITY ANTI-GRAV SHAFT',
    });

    // Stage 3: Dimensional Rift Anchors
    gravitasManager.addAnchor({
      id: 's3_rift_anchor_1',
      x: 3340,
      y: 460,
      kind: 'env',
      label: 'DIMENSIONAL RIFT ANCHOR',
      prompt: '[E / F] DISRUPT DIMENSIONAL RIFT',
      radius: 280,
      eventKey: 'rift1-disrupted',
    });

    gravitasManager.addAnchor({
      id: 's3_rift_anchor_2',
      x: 4050,
      y: 400,
      kind: 'env',
      label: 'PRIMARY VOID RIFT ANCHOR',
      prompt: '[E / F] COLLAPSE VOID RIFT',
      radius: 280,
      eventKey: 'rift2-collapsed',
    });

    // Stage 4: Crystal Containment Node
    gravitasManager.addAnchor({
      id: 's4_crystal_node_anchor',
      x: 5160,
      y: 440,
      kind: 'pulse',
      label: 'RESONATING CRYSTAL NODE',
      prompt: '[F] GRAVITAS // DISCHARGE CRYSTAL OVERLOAD',
      radius: 280,
      eventKey: 'crystal-node-discharged',
    });

    // Stage 5: Devouring Singularity Pull Well & Anti-Singularity Bubbles
    gravitasManager.addWell({
      id: 's5_singularity_well',
      x: 6300,
      y: 500,
      width: 800,
      height: 380,
      direction: 'left',
      force: 420,
      label: 'DEVOURING SINGULARITY VORTEX',
    });

    gravitasManager.addAnchor({
      id: 's5_bubble_anchor_1',
      x: 6060,
      y: 480,
      kind: 'pulse',
      label: 'ANTI-SINGULARITY STABILIZER',
      prompt: '[F] GRAVITAS // DEPLOY STABILITY BUBBLE',
      radius: 280,
    });

    gravitasManager.addAnchor({
      id: 's5_bubble_anchor_2',
      x: 6380,
      y: 360,
      kind: 'pulse',
      label: 'ANTI-SINGULARITY STABILIZER',
      prompt: '[F] GRAVITAS // DEPLOY STABILITY BUBBLE',
      radius: 280,
    });

    // Stage 6: Void Sovereign Aerial Grapple & Core Interruption Anchors
    gravitasManager.addAnchor({
      id: 's6_boss_aerial_anchor',
      x: 7800,
      y: 260,
      kind: 'sling',
      label: 'AERIAL GRAVITAS ANCHOR',
      prompt: '[F] GRAVITAS // EVADE VOID FISSURE',
      radius: 360,
      targetX: 7800,
      targetY: 260,
      impulseX: 0,
      impulseY: -420,
    });

    gravitasManager.addAnchor({
      id: 's6_core_anchor_west',
      x: 7420,
      y: 380,
      kind: 'env',
      label: 'WEST CONTAINMENT PYLON',
      prompt: '[E / F] OVERLOAD SINGULARITY CORE',
      radius: 260,
      eventKey: 'sovereign-core-overloaded',
    });

    gravitasManager.addAnchor({
      id: 's6_core_anchor_east',
      x: 8180,
      y: 380,
      kind: 'env',
      label: 'EAST CONTAINMENT PYLON',
      prompt: '[E / F] OVERLOAD SINGULARITY CORE',
      radius: 260,
      eventKey: 'sovereign-core-overloaded',
    });
  }
}
