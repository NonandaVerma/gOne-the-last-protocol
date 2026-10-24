import * as Phaser from 'phaser';

export interface Level6Components {
  solids: Phaser.Physics.Arcade.StaticGroup;
  gates: Phaser.Physics.Arcade.StaticGroup;
  hazards: Phaser.Physics.Arcade.Group;
  arenaGate?: Phaser.Physics.Arcade.Sprite;
  arenaGateClosedY: number;
  arenaGateOpenY: number;
}

/**
 * Level6Architecture — Builds the complete six-stage playable geometry,
 * tactical traversal platforms, sanctum hazards, and the monumental throne arena
 * for Level 6: THE BLACK CROWN.
 */
export class Level6Architecture {
  public static build(
    scene: Phaser.Scene,
    staticPlatforms: Phaser.Physics.Arcade.StaticGroup,
    groundTop = 648
  ): Level6Components {
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

    // Helper: add visual contact shadow
    const addShadow = (x: number, y: number, width: number) => {
      if (!scene.textures.exists('contact_shadow')) return;
      const s = scene.add.image(x, y, 'contact_shadow');
      s.setDepth(6).setAlpha(0.55).setDisplaySize(width * 0.85, 20);
    };

    /* =========================================================================
       STAGE 1: THE CROWN'S SHADOW (x: 0 -> 1400)
       Causeways, entry bridges, and introduction to Protocol Break.
       ========================================================================= */

    // Entry causeway (x: 0 -> 420)
    place(210, groundTop, 'platform_l6_black_metal', 1.7, 1);

    // Bridge slab across Gap 1 [420, 580]
    place(710, groundTop, 'platform_l6_maroon_vein', 1.1, 1);

    // Fortified outpost ground across Gap 2 [840, 1020]
    place(1210, groundTop, 'platform_l6_black_metal', 1.6, 1);

    // Tactical elevated balconies
    place(320, 520, 'platform_l6_black_metal', 0.75, 0.7);
    addShadow(320, 545, 180);

    place(710, 470, 'platform_l6_maroon_vein', 0.85, 0.7);
    addShadow(710, 495, 200);

    place(1180, 490, 'platform_l6_black_metal', 0.75, 0.7);
    addShadow(1180, 515, 180);

    /* =========================================================================
       STAGE 2: THE HARROWED GATE (x: 1400 -> 2800)
       High/low split route, marksman perches, and fortified security gate.
       ========================================================================= */

    // Ground spans with Gap [1950, 2120]
    place(1675, groundTop, 'platform_l6_abyss_steel', 2.2, 1);
    place(2460, groundTop, 'platform_l6_abyss_steel', 2.7, 1);

    // High sniper balconies & traversal tiers
    place(1680, 520, 'platform_l6_abyss_steel', 0.9, 0.7);
    addShadow(1680, 545, 220);

    place(2035, 440, 'platform_l6_abyss_steel', 0.95, 0.7);
    addShadow(2035, 465, 240);

    place(2400, 370, 'platform_l6_maroon_vein', 0.9, 0.7);
    addShadow(2400, 395, 220);

    place(2650, 310, 'platform_l6_abyss_steel', 0.75, 0.7);
    addShadow(2650, 335, 180);

    /* =========================================================================
       STAGE 3: THE HUNTING GROUNDS (x: 2800 -> 4200)
       Open combat slabs, pursuit encounters with agile Crown Stalkers.
       ========================================================================= */

    // Ground spans with Gap [3350, 3550]
    place(3075, groundTop, 'platform_l6_black_metal', 2.2, 1);
    place(3875, groundTop, 'platform_l6_black_metal', 2.6, 1);

    // Stepped combat platforms
    place(3050, 530, 'platform_l6_black_metal', 0.9, 0.7);
    addShadow(3050, 555, 220);

    place(3450, 470, 'platform_l6_maroon_vein', 0.95, 0.7);
    addShadow(3450, 495, 240);

    place(3850, 510, 'platform_l6_abyss_steel', 0.9, 0.7);
    addShadow(3850, 535, 220);

    place(3650, 350, 'platform_l6_black_metal', 0.75, 0.7);
    addShadow(3650, 375, 180);

    /* =========================================================================
       STAGE 4: THE BROKEN SANCTUM (x: 4200 -> 5600)
       Structural collapse, corruption fissures, and crushing barriers.
       ========================================================================= */

    // Ground spans with Gap [4650, 4850]
    place(4425, groundTop, 'platform_l6_sanctum', 1.8, 1);
    place(5225, groundTop, 'platform_l6_sanctum', 3.0, 1);

    // Ascending sanctum ruins
    place(4450, 510, 'platform_l6_sanctum', 0.9, 0.7);
    addShadow(4450, 535, 220);

    place(4750, 450, 'platform_l6_sanctum', 0.95, 0.7);
    addShadow(4750, 475, 240);

    place(5100, 480, 'platform_l6_sanctum', 0.9, 0.7);
    addShadow(5100, 505, 220);

    place(5400, 420, 'platform_l6_maroon_vein', 0.85, 0.7);
    addShadow(5400, 445, 200);

    // Corruption fissure hazard visual effects
    if (scene.textures.exists('hazard_corruption_fissure')) {
      [4420, 5020, 5360].forEach((fx) => {
        const fis = scene.add.sprite(fx, groundTop - 20, 'hazard_corruption_fissure');
        fis.setDepth(11);
        fis.setScale(0.9);
        scene.tweens.add({
          targets: fis,
          alpha: { from: 0.6, to: 1 },
          scaleX: { from: 0.85, to: 1.05 },
          yoyo: true,
          repeat: -1,
          duration: 900,
          ease: 'Sine.easeInOut',
        });
      });
    }

    // Crushing barrier hazard at x: 5100
    if (scene.textures.exists('hazard_crushing_barrier')) {
      const crusher = hazards.create(5100, 330, 'hazard_crushing_barrier') as Phaser.Physics.Arcade.Sprite;
      crusher.setDepth(12);
      const cBody = crusher.body as Phaser.Physics.Arcade.Body;
      cBody.setAllowGravity(false);
      cBody.setSize(140, 40);

      scene.tweens.add({
        targets: crusher,
        y: groundTop - 40,
        duration: 900,
        yoyo: true,
        repeat: -1,
        hold: 800,
        repeatDelay: 1200,
        ease: 'Quad.easeIn',
      });
    }

    /* =========================================================================
       STAGE 5: THE RED WAKE (x: 5600 -> 7000)
       Jagged spires, gauntlet approach to the monumental throne entrance.
       ========================================================================= */

    // Ground spans with Gap [6100, 6300]
    place(5850, groundTop, 'platform_l6_wake', 2.0, 1);
    place(6650, groundTop, 'platform_l6_wake', 2.8, 1);

    // High wake causeways
    place(5850, 500, 'platform_l6_wake', 0.9, 0.7);
    addShadow(5850, 525, 220);

    place(6200, 440, 'platform_l6_wake', 0.95, 0.7);
    addShadow(6200, 465, 240);

    place(6550, 480, 'platform_l6_wake', 0.9, 0.7);
    addShadow(6550, 505, 220);

    place(6850, 420, 'platform_l6_maroon_vein', 0.9, 0.7);
    addShadow(6850, 445, 220);

    /* =========================================================================
       STAGE 6: RA-ONE: THE FINAL PROTOCOL (x: 7000 -> 8600)
       Monumental throne arena with grand entrance pylon, ceiling, and tactical plinths.
       ========================================================================= */

    // Arena Floor: unbroken solid causeway from x: 7150 to x: 8580
    const arenaFloorWidth = 8580 - 7150;
    place(7150 + arenaFloorWidth / 2, groundTop, 'platform_l6_throne', arenaFloorWidth / 256, 1);

    // Arena Ceiling at y: 170 from x: 7150 to x: 8580
    place(7150 + arenaFloorWidth / 2, 170, 'platform_l6_arena_wall', arenaFloorWidth / 256, 0.8);

    // Arena Far-Right Boundary Wall at x: 8580
    const rightWall = place(8580, groundTop - 240, 'platform_l6_arena_wall', 0.35, 6.5);
    (rightWall.body as Phaser.Physics.Arcade.Body).setSize(48, 550);

    // Tactical Balconies for evading Ra-One's Phase 3/4 shockwave slams
    place(7400, 490, 'platform_l6_throne', 0.95, 0.7);
    addShadow(7400, 515, 240);

    place(7850, 410, 'platform_l6_throne', 1.1, 0.7);
    addShadow(7850, 435, 280);

    place(8300, 490, 'platform_l6_throne', 0.95, 0.7);
    addShadow(8300, 515, 240);

    // Heavy Arena Entrance Gate at x: 7150
    // Starts raised (open), slams shut upon entering the arena
    const arenaGateClosedY = groundTop - 150;
    const arenaGateOpenY = groundTop - 450;
    const arenaGate = scene.physics.add.sprite(7150, arenaGateOpenY, 'platform_l6_arena_wall');
    arenaGate.setDepth(14);
    arenaGate.setScale(0.32, 4.2);
    arenaGate.setImmovable(true);
    const agBody = arenaGate.body as Phaser.Physics.Arcade.Body;
    agBody.setAllowGravity(false);
    agBody.setSize(44, 400);

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
