import * as Phaser from 'phaser';
import { VILLAIN, ACCENT } from './palette';
import { energyCore, forge, outline, poly } from './draw';

/**
 * CORRUPTION SPAWN — the small enemies that populate a realm's traversal
 * approach, distinct from Ra-One himself. Visually they read as fragments of
 * his corruption given crude form: jagged obsidian-crimson silhouettes with
 * the same energy language as the boss, at a fraction of the detail — these
 * are grunts, not a second boss rig.
 *
 * Two textures, each with a base frame and a `_hit` flash frame baked
 * alongside it so damage feedback is a texture swap, not a runtime tint
 * recompute.
 */

const DRONE_W = 56;
const DRONE_H = 64;
const SEEKER_W = 52;
const SEEKER_H = 58;

/** Corrupted Drone — compact, four-legged, melee lunger. */
function droneTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_drone_hit' : 'enemy_drone';
  const body = hit ? 0xffffff : VILLAIN.base;
  const rim = hit ? 0xffffff : VILLAIN.rim;
  const core = hit ? 0xffffff : VILLAIN.energy;

  forge(scene, key, DRONE_W, DRONE_H, (g) => {
    const cx = DRONE_W / 2;
    // Low, wide hull — reads as "stays near the ground, lunges forward".
    const hull: Array<{ x: number; y: number }> = [
      { x: cx - 20, y: 44 },
      { x: cx - 24, y: 28 },
      { x: cx - 10, y: 14 },
      { x: cx + 10, y: 14 },
      { x: cx + 24, y: 28 },
      { x: cx + 20, y: 44 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.85, 1.6);

    // Four stubby legs.
    [-20, -9, 9, 20].forEach((dx) => {
      poly(
        g,
        [
          { x: cx + dx - 3, y: 40 },
          { x: cx + dx + 3, y: 40 },
          { x: cx + dx + 2, y: 58 },
          { x: cx + dx - 2, y: 58 },
        ],
        VILLAIN.shadow,
        1
      );
    });

    // Crimson core, the readable "this is alive" tell shared with Ra-One.
    energyCore(g, cx, 26, 7, core, 0xffffff, VILLAIN.shadow, 1);

    // Fanged head ridge facing right (sprite is flipped for left-facing).
    poly(
      g,
      [
        { x: cx + 10, y: 14 },
        { x: cx + 26, y: 10 },
        { x: cx + 14, y: 20 },
      ],
      VILLAIN.shadow,
      1
    );
  });
}

/** Rift Seeker — slender, hovers, keeps range, visible targeting eye. */
function seekerTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_seeker_hit' : 'enemy_seeker';
  const body = hit ? 0xffffff : VILLAIN.base;
  const rim = hit ? 0xffffff : VILLAIN.rim;
  const core = hit ? 0xffffff : ACCENT.crimson;

  forge(scene, key, SEEKER_W, SEEKER_H, (g) => {
    const cx = SEEKER_W / 2;
    // Tall, narrow hull with wing-like stabilizers — reads as "ranged, agile".
    const hull: Array<{ x: number; y: number }> = [
      { x: cx, y: 6 },
      { x: cx + 12, y: 22 },
      { x: cx + 9, y: 44 },
      { x: cx, y: 52 },
      { x: cx - 9, y: 44 },
      { x: cx - 12, y: 22 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.85, 1.6);

    // Stabilizer fins.
    poly(g, [{ x: cx - 12, y: 24 }, { x: cx - 26, y: 30 }, { x: cx - 12, y: 34 }], VILLAIN.shadow, 1);
    poly(g, [{ x: cx + 12, y: 24 }, { x: cx + 26, y: 30 }, { x: cx + 12, y: 34 }], VILLAIN.shadow, 1);

    // The targeting eye — the single most important readable tell, since
    // its glow intensifies during the telegraph before firing.
    energyCore(g, cx, 20, 6, core, 0xffffff, VILLAIN.shadow, 1);
  });
}

const ROOTSTALKER_W = 64;
const ROOTSTALKER_H = 56;
const SPORECASTER_W = 56;
const SPORECASTER_H = 68;
const CANOPY_HUNTER_W = 60;
const CANOPY_HUNTER_H = 64;
const GUARDIAN_ORGANISM_W = 72;
const GUARDIAN_ORGANISM_H = 76;

/** Rootstalker — fast, quad-pedal bio-predator lunging along root pathways. */
function rootstalkerTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_rootstalker_hit' : 'enemy_rootstalker';
  const body = hit ? 0xffffff : 0x121e15;
  const rim = hit ? 0xffffff : 0x10b981;
  const core = hit ? 0xffffff : 0x34d399;

  forge(scene, key, ROOTSTALKER_W, ROOTSTALKER_H, (g) => {
    const cx = ROOTSTALKER_W / 2;
    // Sleek predatory carapace
    const hull = [
      { x: cx - 22, y: 38 },
      { x: cx - 26, y: 22 },
      { x: cx - 8, y: 12 },
      { x: cx + 18, y: 16 },
      { x: cx + 28, y: 30 },
      { x: cx + 16, y: 40 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.9, 1.8);

    // Quad chitinous root legs
    [-22, -10, 8, 22].forEach((dx) => {
      poly(
        g,
        [
          { x: cx + dx - 3, y: 36 },
          { x: cx + dx + 3, y: 36 },
          { x: cx + dx + 2, y: 54 },
          { x: cx + dx - 2, y: 54 },
        ],
        0x08120a,
        1
      );
    });

    // Emerald bio-core eye cluster
    energyCore(g, cx + 12, 22, 6, core, 0xffffff, 0x061107, 1);

    // Forward razor root mandibles
    poly(
      g,
      [
        { x: cx + 18, y: 24 },
        { x: cx + 30, y: 22 },
        { x: cx + 22, y: 32 },
      ],
      0xede9d0,
      1
    );
  });
}

/** Sporecaster — stationary bulbous bio-turret firing arched spore mortar pods. */
function sporecasterTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_sporecaster_hit' : 'enemy_sporecaster';
  const body = hit ? 0xffffff : 0x18241b;
  const rim = hit ? 0xffffff : 0x10b981;
  const core = hit ? 0xffffff : 0x84cc16;

  forge(scene, key, SPORECASTER_W, SPORECASTER_H, (g) => {
    const cx = SPORECASTER_W / 2;
    // Bulbous root pod base
    g.fillStyle(0x0c160f, 1);
    g.fillEllipse(cx, 54, 48, 22);

    // Upper swollen spore blossom
    const blossom = [
      { x: cx, y: 8 },
      { x: cx + 18, y: 22 },
      { x: cx + 22, y: 44 },
      { x: cx, y: 52 },
      { x: cx - 22, y: 44 },
      { x: cx - 18, y: 22 },
    ];
    poly(g, blossom, body, 1);
    outline(g, blossom, rim, 0.85, 1.8);

    // Pulsing spore nucleus
    energyCore(g, cx, 28, 8, core, 0xffffff, 0x061107, 1);

    // Glowing spore pore vent on top
    g.fillStyle(0x34d399, 0.9);
    g.fillCircle(cx, 12, 5);
  });
}

/** Canopy Hunter — arboreal winged predator perching high and diving. */
function canopyHunterTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_canopy_hunter_hit' : 'enemy_canopy_hunter';
  const body = hit ? 0xffffff : 0x1a261d;
  const rim = hit ? 0xffffff : 0xede9d0;
  const core = hit ? 0xffffff : 0x10b981;

  forge(scene, key, CANOPY_HUNTER_W, CANOPY_HUNTER_H, (g) => {
    const cx = CANOPY_HUNTER_W / 2;
    // Slender insectoid torso
    const hull = [
      { x: cx, y: 6 },
      { x: cx + 14, y: 20 },
      { x: cx + 10, y: 48 },
      { x: cx, y: 58 },
      { x: cx - 10, y: 48 },
      { x: cx - 14, y: 20 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.9, 1.6);

    // Translucent emerald membrane wings
    poly(
      g,
      [
        { x: cx - 12, y: 18 },
        { x: cx - 28, y: 12 },
        { x: cx - 26, y: 36 },
        { x: cx - 10, y: 32 },
      ],
      0x059669,
      0.75
    );
    poly(
      g,
      [
        { x: cx + 12, y: 18 },
        { x: cx + 28, y: 12 },
        { x: cx + 26, y: 36 },
        { x: cx + 10, y: 32 },
      ],
      0x059669,
      0.75
    );

    // Targeting visor
    energyCore(g, cx, 18, 5, core, 0xffffff, 0x051208, 1);
  });
}

/** Guardian Organism — elite bio-sentinel with ivory bone carapace and shockwave sweep. */
function guardianOrganismTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_guardian_organism_hit' : 'enemy_guardian_organism';
  const body = hit ? 0xffffff : 0x162319;
  const rim = hit ? 0xffffff : 0xede9d0;
  const core = hit ? 0xffffff : 0xf59e0b;

  forge(scene, key, GUARDIAN_ORGANISM_W, GUARDIAN_ORGANISM_H, (g) => {
    const cx = GUARDIAN_ORGANISM_W / 2;
    // Massive biomechanical bone carapace
    const hull = [
      { x: cx - 28, y: 52 },
      { x: cx - 32, y: 28 },
      { x: cx - 16, y: 10 },
      { x: cx + 16, y: 10 },
      { x: cx + 32, y: 28 },
      { x: cx + 28, y: 52 },
      { x: cx, y: 64 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.95, 2);

    // Frontal ivory bone shield plates
    poly(
      g,
      [
        { x: cx - 24, y: 20 },
        { x: cx - 8, y: 16 },
        { x: cx - 10, y: 46 },
        { x: cx - 26, y: 42 },
      ],
      0xede9d0,
      1
    );
    poly(
      g,
      [
        { x: cx + 8, y: 16 },
        { x: cx + 24, y: 20 },
        { x: cx + 26, y: 42 },
        { x: cx + 10, y: 46 },
      ],
      0xede9d0,
      1
    );

    // Amber bio-reactor core
    energyCore(g, cx, 30, 8, core, 0xffffff, 0x102012, 1);
  });
}

/** Level 4: Void Drone — hovering alien drone with anti-grav thrusters and purple ocular lens. */
const VOID_DRONE_W = 58;
const VOID_DRONE_H = 62;
function voidDroneTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_void_drone_hit' : 'enemy_void_drone';
  const body = hit ? 0xffffff : 0x160824;
  const rim = hit ? 0xffffff : 0xa855f7;
  const core = hit ? 0xffffff : 0xc084fc;

  forge(scene, key, VOID_DRONE_W, VOID_DRONE_H, (g) => {
    const cx = VOID_DRONE_W / 2;
    // Diamond floating hull with swept-back stabilizer blades
    const hull = [
      { x: cx, y: 8 },
      { x: cx + 18, y: 24 },
      { x: cx + 12, y: 46 },
      { x: cx, y: 56 },
      { x: cx - 12, y: 46 },
      { x: cx - 18, y: 24 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.9, 1.8);

    // Lateral anti-grav thruster pods
    poly(g, [{ x: cx - 18, y: 22 }, { x: cx - 28, y: 28 }, { x: cx - 18, y: 36 }], 0x2e104d, 1);
    poly(g, [{ x: cx + 18, y: 22 }, { x: cx + 28, y: 28 }, { x: cx + 18, y: 36 }], 0x2e104d, 1);

    // Ocular void sensor
    energyCore(g, cx, 28, 8, core, 0xffffff, 0x3b0764, 1);
  });
}

/** Level 4: Rift Stalker — low quadrupedal dimensional hunter with crystal spines. */
const RIFT_STALKER_W = 76;
const RIFT_STALKER_H = 54;
function riftStalkerTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_rift_stalker_hit' : 'enemy_rift_stalker';
  const body = hit ? 0xffffff : 0x1a092a;
  const rim = hit ? 0xffffff : 0x9333ea;
  const crystal = hit ? 0xffffff : 0xd8b4fe;

  forge(scene, key, RIFT_STALKER_W, RIFT_STALKER_H, (g) => {
    const cx = RIFT_STALKER_W / 2;
    // Low, muscular prowler hull
    const torso = [
      { x: cx - 28, y: 34 },
      { x: cx - 24, y: 18 },
      { x: cx + 8, y: 14 },
      { x: cx + 32, y: 26 },
      { x: cx + 22, y: 38 },
      { x: cx - 12, y: 42 },
    ];
    poly(g, torso, body, 1);
    outline(g, torso, rim, 0.85, 1.6);

    // Amethyst dorsal crystal spines
    poly(g, [{ x: cx - 14, y: 18 }, { x: cx - 10, y: 4 }, { x: cx - 4, y: 16 }], crystal, 0.95);
    poly(g, [{ x: cx + 2, y: 15 }, { x: cx + 8, y: 2 }, { x: cx + 14, y: 16 }], crystal, 0.95);

    // Fanged maw and eyes
    g.fillStyle(0xc084fc, 0.9);
    g.fillCircle(cx + 26, 24, 2.5);
  });
}

/** Level 4: Gravity Sentinel — towering armored construct with heavy gravitational plating. */
const GRAVITY_SENTINEL_W = 80;
const GRAVITY_SENTINEL_H = 92;
function gravitySentinelTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_gravity_sentinel_hit' : 'enemy_gravity_sentinel';
  const body = hit ? 0xffffff : 0x11041f;
  const rim = hit ? 0xffffff : 0x7e22ce;
  const shield = hit ? 0xffffff : 0xa855f7;

  forge(scene, key, GRAVITY_SENTINEL_W, GRAVITY_SENTINEL_H, (g) => {
    const cx = GRAVITY_SENTINEL_W / 2;
    // Broad, heavy angular chassis
    const torso = [
      { x: cx - 26, y: 18 },
      { x: cx + 26, y: 18 },
      { x: cx + 34, y: 48 },
      { x: cx + 20, y: 82 },
      { x: cx - 20, y: 82 },
      { x: cx - 34, y: 48 },
    ];
    poly(g, torso, body, 1);
    outline(g, torso, rim, 0.9, 2);

    // Massive frontal gravitational crest plate
    poly(g, [{ x: cx - 18, y: 24 }, { x: cx + 18, y: 24 }, { x: cx + 14, y: 56 }, { x: cx - 14, y: 56 }], 0x240938, 1);
    outline(g, [{ x: cx - 18, y: 24 }, { x: cx + 18, y: 24 }, { x: cx + 14, y: 56 }, { x: cx - 14, y: 56 }], shield, 0.95, 1.6);

    // Gravitational core
    energyCore(g, cx, 40, 10, shield, 0xffffff, 0x160324, 1);
  });
}

/** Spore Mortar Projectile — toxic emerald pod launched by Sporecasters in Realm 3. */
function sporeMortarTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_spore_mortar', 20, 20, (g) => {
    g.fillStyle(0x059669, 0.95);
    g.fillCircle(10, 10, 9);
    g.fillStyle(0x34d399, 0.9);
    g.fillCircle(10, 10, 6);
    g.fillStyle(0xa7f3d0, 1);
    g.fillCircle(10, 10, 2.5);
  });
}

/** Void Plasma Projectile — tracking dark-violet energy orb fired by Void Drones & Void Sovereign. */
function voidPlasmaTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_void_plasma', 24, 24, (g) => {
    g.fillStyle(0x7e22ce, 0.95);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xc084fc, 0.9);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 3);
  });
}

/** Level 5: Security Drone — hovering graphite drone with electric amber optic lens. */
const SECURITY_DRONE_W = 56;
const SECURITY_DRONE_H = 58;
function securityDroneTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_security_drone_hit' : 'enemy_security_drone';
  const body = hit ? 0xffffff : 0x181a20;
  const rim = hit ? 0xffffff : 0xd1d5db;
  const core = hit ? 0xffffff : 0xf59e0b;

  forge(scene, key, SECURITY_DRONE_W, SECURITY_DRONE_H, (g) => {
    const cx = SECURITY_DRONE_W / 2;
    // Swept angular graphite chassis
    const hull = [
      { x: cx, y: 6 },
      { x: cx + 22, y: 22 },
      { x: cx + 16, y: 46 },
      { x: cx, y: 52 },
      { x: cx - 16, y: 46 },
      { x: cx - 22, y: 22 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.9, 1.8);

    // Pale ivory wing struts
    poly(g, [{ x: cx - 14, y: 18 }, { x: cx - 26, y: 24 }, { x: cx - 14, y: 32 }], 0xf3f4f6, 1);
    poly(g, [{ x: cx + 14, y: 18 }, { x: cx + 26, y: 24 }, { x: cx + 14, y: 32 }], 0xf3f4f6, 1);

    // Ocular amber sensor
    energyCore(g, cx, 26, 7, core, 0xffffff, 0x451a03, 1);
  });
}

/** Level 5: Protocol Enforcer — bipedal cyber-enforcer with black-chrome plating and amber plasma blade. */
const PROTOCOL_ENFORCER_W = 68;
const PROTOCOL_ENFORCER_H = 74;
function protocolEnforcerTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_protocol_enforcer_hit' : 'enemy_protocol_enforcer';
  const body = hit ? 0xffffff : 0x111317;
  const rim = hit ? 0xffffff : 0x4b5563;
  const amber = hit ? 0xffffff : 0xf59e0b;

  forge(scene, key, PROTOCOL_ENFORCER_W, PROTOCOL_ENFORCER_H, (g) => {
    const cx = PROTOCOL_ENFORCER_W / 2;
    // Heavy angular cyber-chassis
    const torso = [
      { x: cx - 20, y: 16 },
      { x: cx + 20, y: 16 },
      { x: cx + 24, y: 48 },
      { x: cx + 14, y: 68 },
      { x: cx - 14, y: 68 },
      { x: cx - 24, y: 48 },
    ];
    poly(g, torso, body, 1);
    outline(g, torso, rim, 0.9, 1.8);

    // Ivory shoulder plates
    poly(g, [{ x: cx - 26, y: 14 }, { x: cx - 14, y: 14 }, { x: cx - 14, y: 30 }, { x: cx - 28, y: 26 }], 0xf3f4f6, 1);
    poly(g, [{ x: cx + 14, y: 14 }, { x: cx + 26, y: 14 }, { x: cx + 28, y: 26 }, { x: cx + 14, y: 30 }], 0xf3f4f6, 1);

    // Amber visor conduit
    g.fillStyle(amber, 0.95);
    g.fillRect(cx - 10, 24, 20, 5);

    // Plasma blade attachment on right arm
    poly(g, [{ x: cx + 24, y: 36 }, { x: cx + 32, y: 56 }, { x: cx + 22, y: 48 }], amber, 0.95);
  });
}

/** Level 5: Firewall Sentinel — towering construct with heavy frontal barrier plates and amber crest. */
const FIREWALL_SENTINEL_W = 84;
const FIREWALL_SENTINEL_H = 94;
function firewallSentinelTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_firewall_sentinel_hit' : 'enemy_firewall_sentinel';
  const body = hit ? 0xffffff : 0x0c0e12;
  const rim = hit ? 0xffffff : 0xd1d5db;
  const amber = hit ? 0xffffff : 0xf59e0b;

  forge(scene, key, FIREWALL_SENTINEL_W, FIREWALL_SENTINEL_H, (g) => {
    const cx = FIREWALL_SENTINEL_W / 2;
    // Towering monolithic chassis
    const torso = [
      { x: cx - 28, y: 18 },
      { x: cx + 28, y: 18 },
      { x: cx + 36, y: 52 },
      { x: cx + 24, y: 86 },
      { x: cx - 24, y: 86 },
      { x: cx - 36, y: 52 },
    ];
    poly(g, torso, body, 1);
    outline(g, torso, rim, 0.95, 2);

    // Heavy ivory defense crest
    poly(g, [{ x: cx - 22, y: 24 }, { x: cx + 22, y: 24 }, { x: cx + 18, y: 60 }, { x: cx - 18, y: 60 }], 0xe5e7eb, 1);
    outline(g, [{ x: cx - 22, y: 24 }, { x: cx + 22, y: 24 }, { x: cx + 18, y: 60 }, { x: cx - 18, y: 60 }], 0x4b5563, 0.9, 1.5);

    // Central amber reactor core
    energyCore(g, cx, 42, 10, amber, 0xffffff, 0x1f1406, 1);
  });
}

/** Electric Amber Security Bolt — fired by Security Drones & Firewall Sentinels. */
function securityBoltTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_security_bolt', 24, 24, (g) => {
    g.fillStyle(0xd97706, 0.95);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xf59e0b, 0.9);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 3);
  });
}

const CROWN_STALKER_W = 64;
const CROWN_STALKER_H = 48;
const DOMINION_MARKSMAN_W = 54;
const DOMINION_MARKSMAN_H = 58;
const CROWN_SENTINEL_W = 78;
const CROWN_SENTINEL_H = 88;

/** Crown Stalker — aggressive quad-pedal pursuit predator in The Black Crown. */
function crownStalkerTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_crown_stalker_hit' : 'enemy_crown_stalker';
  const body = hit ? 0xffffff : 0x07070a;
  const rim = hit ? 0xffffff : 0x350812;
  const core = hit ? 0xffffff : 0x641329;

  forge(scene, key, CROWN_STALKER_W, CROWN_STALKER_H, (g) => {
    const cx = CROWN_STALKER_W / 2;
    // Sleek predatory chassis
    const torso = [
      { x: cx - 24, y: 18 },
      { x: cx + 18, y: 12 },
      { x: cx + 30, y: 22 },
      { x: cx + 22, y: 34 },
      { x: cx - 18, y: 36 },
      { x: cx - 28, y: 28 },
    ];
    poly(g, torso, body, 1);
    outline(g, torso, rim, 0.95, 2);

    // Ashen metal clawed limbs
    [-20, -6, 10, 22].forEach((dx, i) => {
      poly(g, [
        { x: cx + dx - 3, y: 32 },
        { x: cx + dx + 3, y: 32 },
        { x: cx + dx + (i % 2 === 0 ? 5 : -5), y: 46 },
      ], 0x77747a, 1);
    });

    // Blood maroon tracking visor
    energyCore(g, cx + 16, 20, 5, core, 0xffffff, 0x050204, 1);
  });
}

/** Dominion Marksman — hovering ranged sniper with abyss navy plating. */
function dominionMarksmanTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_dominion_marksman_hit' : 'enemy_dominion_marksman';
  const body = hit ? 0xffffff : 0x071426;
  const rim = hit ? 0xffffff : 0x203858;
  const core = hit ? 0xffffff : 0x641329;

  forge(scene, key, DOMINION_MARKSMAN_W, DOMINION_MARKSMAN_H, (g) => {
    const cx = DOMINION_MARKSMAN_W / 2;
    // Elevated angular sniper chassis
    const hull = [
      { x: cx, y: 10 },
      { x: cx + 24, y: 24 },
      { x: cx + 18, y: 46 },
      { x: cx, y: 54 },
      { x: cx - 18, y: 46 },
      { x: cx - 24, y: 24 },
    ];
    poly(g, hull, body, 1);
    outline(g, hull, rim, 0.95, 2);

    // Midnight steel-blue stabilizer fins
    poly(g, [{ x: cx - 24, y: 20 }, { x: cx - 16, y: 36 }, { x: cx - 26, y: 40 }], 0x203858, 0.9);
    poly(g, [{ x: cx + 24, y: 20 }, { x: cx + 16, y: 36 }, { x: cx + 26, y: 40 }], 0x203858, 0.9);

    // Long sniper barrel
    g.fillStyle(0x77747a, 0.95);
    g.fillRect(cx - 3, 44, 6, 12);

    // Blood maroon targeting eye
    energyCore(g, cx, 28, 6, core, 0xffffff, 0x030810, 1);
  });
}

/** Crown Sentinel — towering void-black armor construct with interruptible power strike. */
function crownSentinelTexture(scene: Phaser.Scene, hit: boolean) {
  const key = hit ? 'enemy_crown_sentinel_hit' : 'enemy_crown_sentinel';
  const body = hit ? 0xffffff : 0x07070a;
  const rim = hit ? 0xffffff : 0x350812;
  const core = hit ? 0xffffff : 0x641329;

  forge(scene, key, CROWN_SENTINEL_W, CROWN_SENTINEL_H, (g) => {
    const cx = CROWN_SENTINEL_W / 2;
    // Massive monolithic obsidian armor
    const chassis = [
      { x: cx - 32, y: 18 },
      { x: cx + 32, y: 18 },
      { x: cx + 38, y: 56 },
      { x: cx + 24, y: 84 },
      { x: cx - 24, y: 84 },
      { x: cx - 38, y: 56 },
    ];
    poly(g, chassis, body, 1);
    outline(g, chassis, rim, 0.95, 2.5);

    // Pale ash reinforced chestplate
    poly(g, [{ x: cx - 20, y: 24 }, { x: cx + 20, y: 24 }, { x: cx + 16, y: 58 }, { x: cx - 16, y: 58 }], 0xc5bdb4, 1);
    outline(g, [{ x: cx - 20, y: 24 }, { x: cx + 20, y: 24 }, { x: cx + 16, y: 58 }, { x: cx - 16, y: 58 }], 0x77747a, 0.9, 1.5);

    // Midnight steel-blue buckler trim
    poly(g, [{ x: cx - 34, y: 32 }, { x: cx - 24, y: 32 }, { x: cx - 26, y: 64 }, { x: cx - 36, y: 60 }], 0x203858, 0.95);

    // Glowing blood-maroon reactor core
    energyCore(g, cx, 42, 10, core, 0xffffff, 0x020204, 1);
  });
}

/** Blood Maroon Crown Bolt — fired by Dominion Marksmen and Ra-One. */
function crownBoltTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_crown_bolt', 32, 16, (g) => {
    // Midnight steel-blue trailing energy
    poly(g, [{ x: 2, y: 8 }, { x: 18, y: 2 }, { x: 30, y: 8 }, { x: 18, y: 14 }], 0x203858, 0.85);
    // Blood maroon piercing core
    poly(g, [{ x: 8, y: 8 }, { x: 20, y: 4 }, { x: 28, y: 8 }, { x: 20, y: 12 }], 0x641329, 0.95);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 8, 3);
  });
}

/** Blood Maroon Void Singularity Orb. */
function crownOrbTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_crown_orb', 48, 48, (g) => {
    g.fillStyle(0x350812, 0.9);
    g.fillCircle(24, 24, 22);
    g.fillStyle(0x641329, 0.95);
    g.fillCircle(24, 24, 16);
    g.fillStyle(0x203858, 0.8);
    g.fillCircle(24, 24, 9);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 24, 4);
  });
}

export function buildEnemies(scene: Phaser.Scene) {
  droneTexture(scene, false);
  droneTexture(scene, true);
  seekerTexture(scene, false);
  seekerTexture(scene, true);
  rootstalkerTexture(scene, false);
  rootstalkerTexture(scene, true);
  sporecasterTexture(scene, false);
  sporecasterTexture(scene, true);
  canopyHunterTexture(scene, false);
  canopyHunterTexture(scene, true);
  guardianOrganismTexture(scene, false);
  guardianOrganismTexture(scene, true);
  sporeMortarTexture(scene);

  // Level 4 enemies
  voidDroneTexture(scene, false);
  voidDroneTexture(scene, true);
  riftStalkerTexture(scene, false);
  riftStalkerTexture(scene, true);
  gravitySentinelTexture(scene, false);
  gravitySentinelTexture(scene, true);
  voidPlasmaTexture(scene);

  // Level 5 enemies
  securityDroneTexture(scene, false);
  securityDroneTexture(scene, true);
  protocolEnforcerTexture(scene, false);
  protocolEnforcerTexture(scene, true);
  firewallSentinelTexture(scene, false);
  firewallSentinelTexture(scene, true);
  securityBoltTexture(scene);

  // Level 6 enemies & projectiles
  crownStalkerTexture(scene, false);
  crownStalkerTexture(scene, true);
  dominionMarksmanTexture(scene, false);
  dominionMarksmanTexture(scene, true);
  crownSentinelTexture(scene, false);
  crownSentinelTexture(scene, true);
  crownBoltTexture(scene);
  crownOrbTexture(scene);
}

export const ENEMY_FRAME = {
  drone: { w: DRONE_W, h: DRONE_H },
  seeker: { w: SEEKER_W, h: SEEKER_H },
  rootstalker: { w: ROOTSTALKER_W, h: ROOTSTALKER_H },
  sporecaster: { w: SPORECASTER_W, h: SPORECASTER_H },
  canopy_hunter: { w: CANOPY_HUNTER_W, h: CANOPY_HUNTER_H },
  guardian_organism: { w: GUARDIAN_ORGANISM_W, h: GUARDIAN_ORGANISM_H },
  void_drone: { w: VOID_DRONE_W, h: VOID_DRONE_H },
  rift_stalker: { w: RIFT_STALKER_W, h: RIFT_STALKER_H },
  gravity_sentinel: { w: GRAVITY_SENTINEL_W, h: GRAVITY_SENTINEL_H },
  security_drone: { w: SECURITY_DRONE_W, h: SECURITY_DRONE_H },
  protocol_enforcer: { w: PROTOCOL_ENFORCER_W, h: PROTOCOL_ENFORCER_H },
  firewall_sentinel: { w: FIREWALL_SENTINEL_W, h: FIREWALL_SENTINEL_H },
  crown_stalker: { w: CROWN_STALKER_W, h: CROWN_STALKER_H },
  dominion_marksman: { w: DOMINION_MARKSMAN_W, h: DOMINION_MARKSMAN_H },
  crown_sentinel: { w: CROWN_SENTINEL_W, h: CROWN_SENTINEL_H },
} as const;

