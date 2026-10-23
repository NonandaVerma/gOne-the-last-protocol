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

/** Spore Mortar Projectile — glowing emerald spore bomb fired by Sporecaster. */
function sporeMortarTexture(scene: Phaser.Scene) {
  forge(scene, 'proj_spore_mortar', 24, 24, (g) => {
    g.fillStyle(0x10b981, 0.95);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0x84cc16, 0.9);
    g.fillCircle(12, 12, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 2.5);
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
}

export const ENEMY_FRAME = {
  drone: { w: DRONE_W, h: DRONE_H },
  seeker: { w: SEEKER_W, h: SEEKER_H },
  rootstalker: { w: ROOTSTALKER_W, h: ROOTSTALKER_H },
  sporecaster: { w: SPORECASTER_W, h: SPORECASTER_H },
  canopy_hunter: { w: CANOPY_HUNTER_W, h: CANOPY_HUNTER_H },
  guardian_organism: { w: GUARDIAN_ORGANISM_W, h: GUARDIAN_ORGANISM_H },
} as const;

