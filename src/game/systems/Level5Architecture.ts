import * as Phaser from 'phaser';
import { ProtocolOverrideManager } from './ProtocolOverrideManager';

export interface Level5Components {
  solids: Phaser.Physics.Arcade.StaticGroup;
  gates: Phaser.Physics.Arcade.StaticGroup;
  hazards: Phaser.Physics.Arcade.Group;
  arenaGate?: Phaser.Physics.Arcade.Sprite;
  arenaGateClosedY: number;
  arenaGateOpenY: number;
}

/**
 * Level5Architecture — Builds the complete six-stage playable geometry,
 * reconfigurable architecture, protocol nodes, and hazards for Level 5: THE OVERWRITE.
 */
export class Level5Architecture {
  public static build(
    scene: Phaser.Scene,
    staticPlatforms: Phaser.Physics.Arcade.StaticGroup,
    protocolManager: ProtocolOverrideManager,
    groundTop = 648
  ): Level5Components {
    const solids = staticPlatforms;
    const gates = scene.physics.add.staticGroup();
    const hazards = scene.physics.add.group({ allowGravity: false, immovable: true });

    // Helper: place a static platform with exact arcade physics bounds
    const place = (x: number, y: number, key: string, scaleX = 1, scaleY = 1): Phaser.Physics.Arcade.Sprite => {
      const p = solids.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
      p.setScale(scaleX, scaleY);
      p.refreshBody();
      p.setDepth(10);
      return p;
    };

    // Helper: create a dynamic reconfigurable platform sprite
    const createReconfigurable = (x: number, y: number, key: string, width = 256): Phaser.Physics.Arcade.Sprite => {
      const sprite = scene.physics.add.sprite(x, y, key);
      sprite.setImmovable(true);
      sprite.setDepth(12);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(width, 48);
      body.setOffset(0, 0);
      return sprite;
    };

    /* =========================================================================
       STAGE 1: THE ENTRY PROTOCOL (x: 0 -> 1400)
       Introduction to reconfigurable architecture & protocol nodes.
       ========================================================================= */

    // Starting causeway
    place(200, groundTop, 'platform_l5_chrome', 1.8, 1);
    place(520, groundTop, 'platform_l5_chrome', 1.4, 1);

    // Intermediate ivory landing shelf before the broken bridge
    place(440, 520, 'platform_l5_ivory', 0.9, 1);

    // Reconfigurable Bridge across the breach (x: 760 -> 1040)
    // Baseline: Bridge sections retracted/misaligned (impassable without jump)
    // Overwritten: Bridge sections assemble into a continuous solid causeway
    const s1BridgePartA = createReconfigurable(780, groundTop + 140, 'platform_l5_chrome', 200);
    const s1BridgePartB = createReconfigurable(980, groundTop + 140, 'platform_l5_chrome', 200);

    protocolManager.registerStructure('entry_bridge', [
      {
        sprite: s1BridgePartA,
        baseline: { x: 780, y: groundTop + 140, active: false },
        overwritten: { x: 780, y: groundTop, active: true },
      },
      {
        sprite: s1BridgePartB,
        baseline: { x: 980, y: groundTop + 140, active: false },
        overwritten: { x: 980, y: groundTop, active: true },
      },
    ]);

    // Protocol Node 1 at x: 640 (activates entry bridge)
    protocolManager.addNode({
      id: 'node_entry_bridge',
      x: 640,
      y: groundTop - 36,
      structureId: 'entry_bridge',
      initialState: 'baseline',
    });

    // Solid landing after the bridge
    place(1180, groundTop, 'platform_l5_chrome', 1.6, 1);

    // Stage 1 Security Barrier at x: 1380
    const s1Barrier = createReconfigurable(1380, groundTop - 40, 'platform_l5_citadel', 64);
    s1Barrier.setDisplaySize(48, 160);
    const s1Body = s1Barrier.body as Phaser.Physics.Arcade.Body;
    s1Body.setSize(48, 160);

    protocolManager.registerStructure('stage1_gate', [
      {
        sprite: s1Barrier,
        baseline: { x: 1380, y: groundTop - 40, active: true },
        overwritten: { x: 1380, y: groundTop - 240, active: false },
      },
    ]);

    protocolManager.addNode({
      id: 'node_stage1_gate',
      x: 1260,
      y: groundTop - 36,
      structureId: 'stage1_gate',
      initialState: 'baseline',
    });

    /* =========================================================================
       STAGE 2: THE RECURSIVE ENGINE (x: 1400 -> 2800)
       Multi-level vertical machinery & moving structural assemblies.
       ========================================================================= */

    // Lower transit deck
    place(1560, groundTop, 'platform_l5_machinery', 1.5, 1);
    place(1980, groundTop, 'platform_l5_machinery', 1.4, 1);

    // Multi-tier machinery climb:
    place(1620, 510, 'platform_l5_ivory', 0.9, 1);
    place(1860, 420, 'platform_l5_ivory', 0.9, 1);
    place(2140, 340, 'platform_l5_ivory', 0.9, 1);

    // Reconfigurable Engine Assembly:
    // Toggles between lower crossing and upper elevated observation deck
    const s2Assembly = createReconfigurable(2440, 480, 'platform_l5_machinery', 220);

    protocolManager.registerStructure('engine_assembly', [
      {
        sprite: s2Assembly,
        baseline: { x: 2440, y: 480, active: true },
        overwritten: { x: 2440, y: 310, active: true },
      },
    ]);

    protocolManager.addNode({
      id: 'node_engine_assembly',
      x: 2260,
      y: 304,
      structureId: 'engine_assembly',
      initialState: 'baseline',
    });

    // Elevated secret cache platform at x: 2540, y: 220
    place(2540, 220, 'platform_l5_ivory', 0.8, 1);

    // Exit platform for Stage 2
    place(2680, groundTop, 'platform_l5_machinery', 1.5, 1);

    /* =========================================================================
       STAGE 3: THE DESYNC EXPANSE (x: 2800 -> 4200)
       Mismatched geometric slabs, displaced architecture, split routes.
       ========================================================================= */

    place(2940, groundTop, 'platform_l5_desync', 1.4, 1);
    place(3200, 530, 'platform_l5_desync', 1.1, 1);

    // Reconfigurable Desync Bridge over wide chasm (x: 3420 -> 3740)
    const s3DesyncSpan = createReconfigurable(3580, groundTop + 160, 'platform_l5_desync', 240);

    protocolManager.registerStructure('desync_bridge', [
      {
        sprite: s3DesyncSpan,
        baseline: { x: 3580, y: groundTop + 160, active: false },
        overwritten: { x: 3580, y: 520, active: true },
      },
    ]);

    protocolManager.addNode({
      id: 'node_desync_bridge',
      x: 3280,
      y: 494,
      structureId: 'desync_bridge',
      initialState: 'baseline',
    });

    // Upper sniper ridge overlooking the expanse
    place(3840, 410, 'platform_l5_ivory', 1.0, 1);
    place(4080, groundTop, 'platform_l5_desync', 1.5, 1);

    /* =========================================================================
       STAGE 4: THE NULL FOUNDRY (x: 4200 -> 5600)
       Timed industrial compression presses & reconstruction hazards.
       ========================================================================= */

    place(4340, groundTop, 'platform_l5_foundry', 1.5, 1);
    place(4660, groundTop, 'platform_l5_foundry', 1.6, 1);

    // Industrial Compression Presses (Stage 4 timed hazards)
    // Press 1 slams down at x: 4740
    protocolManager.addCompressionPress(
      {
        x: 4740,
        y: 200,
        retractedY: 200,
        slammedY: groundTop - 80,
        warnMs: 750,
        activeMs: 450,
        recoveryMs: 1500,
      },
      hazards
    );

    // Intermediate safe gantry under the presses
    place(4980, 510, 'platform_l5_foundry', 1.1, 1);

    // Press 2 slams down at x: 5240
    protocolManager.addCompressionPress(
      {
        x: 5240,
        y: 200,
        retractedY: 200,
        slammedY: groundTop - 80,
        warnMs: 750,
        activeMs: 450,
        recoveryMs: 1500,
      },
      hazards
    );

    // Reconfigurable conveyor bridge across the foundry pit
    const s4Conveyor = createReconfigurable(5360, groundTop + 120, 'platform_l5_foundry', 220);

    protocolManager.registerStructure('foundry_conveyor', [
      {
        sprite: s4Conveyor,
        baseline: { x: 5360, y: groundTop + 120, active: false },
        overwritten: { x: 5360, y: 530, active: true },
      },
    ]);

    protocolManager.addNode({
      id: 'node_foundry_conveyor',
      x: 5040,
      y: 474,
      structureId: 'foundry_conveyor',
      initialState: 'baseline',
    });

    place(5520, groundTop, 'platform_l5_foundry', 1.5, 1);

    /* =========================================================================
       STAGE 5: THE FIREWALL CITADEL (x: 5600 -> 7000)
       Layered security barriers, tactical combat cover, elite defenses.
       ========================================================================= */

    place(5740, groundTop, 'platform_l5_citadel', 1.5, 1);

    // Tactical defense bastions
    place(5880, 520, 'platform_l5_citadel', 1.0, 1);
    place(6140, 440, 'platform_l5_citadel', 1.0, 1);

    // Heavy Citadel Blast Gate blocking passage at x: 6360
    const s5BlastGate = createReconfigurable(6360, groundTop - 50, 'platform_l5_citadel', 56);
    s5BlastGate.setDisplaySize(48, 180);
    const s5Body = s5BlastGate.body as Phaser.Physics.Arcade.Body;
    s5Body.setSize(48, 180);

    protocolManager.registerStructure('citadel_gate', [
      {
        sprite: s5BlastGate,
        baseline: { x: 6360, y: groundTop - 50, active: true },
        overwritten: { x: 6360, y: groundTop - 260, active: false },
      },
    ]);

    protocolManager.addNode({
      id: 'node_citadel_gate',
      x: 6140,
      y: 404,
      structureId: 'citadel_gate',
      initialState: 'baseline',
    });

    // Outer courtyard before boss arena
    place(6540, groundTop, 'platform_l5_citadel', 1.6, 1);
    place(6840, groundTop, 'platform_l5_citadel', 1.6, 1);

    /* =========================================================================
       STAGE 6: THE OVERWRITE CORE (x: 7000 -> 8600)
       Monumental Prime Protocol Engine chamber & Protocol Warden Boss Arena.
       ========================================================================= */

    // Solid boss combat floor spanning the arena
    place(7300, groundTop, 'platform_l5_core', 1.8, 1);
    place(7700, groundTop, 'platform_l5_core', 1.8, 1);
    place(8100, groundTop, 'platform_l5_core', 1.8, 1);
    place(8460, groundTop, 'platform_l5_core', 1.6, 1);

    // Floating vantage platforms for combat mobility and tactical cover
    place(7480, 480, 'platform_l5_ivory', 1.1, 1);
    place(7940, 480, 'platform_l5_ivory', 1.1, 1);

    // Elevated protocol nodes for Phase 3 shield disruption
    place(7340, 360, 'platform_l5_ivory', 0.8, 1);
    place(8160, 360, 'platform_l5_ivory', 0.8, 1);

    // Arena boundary walls & ceiling to lock fight
    place(8580, groundTop - 180, 'platform_l5_arena_wall', 1, 1);
    place(7800, 180, 'platform_l5_machinery', 4.5, 0.8); // Ceiling

    // Arena Entrance Blast Gate at x: 7150
    // Starts open at y: 220, slams shut to y: 440 once player enters
    const arenaGateClosedY = groundTop - 180;
    const arenaGateOpenY = 220;
    const arenaGate = scene.physics.add.sprite(7150, arenaGateOpenY, 'platform_l5_arena_wall');
    arenaGate.setImmovable(true);
    arenaGate.setDepth(20);
    const gateBody = arenaGate.body as Phaser.Physics.Arcade.Body;
    gateBody.setAllowGravity(false);
    gateBody.setSize(48, 420);

    return {
      solids,
      gates,
      hazards,
      arenaGate,
      arenaGateClosedY,
      arenaGateOpenY,
    };
  }
}
