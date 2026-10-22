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

export function buildEnemies(scene: Phaser.Scene) {
  droneTexture(scene, false);
  droneTexture(scene, true);
  seekerTexture(scene, false);
  seekerTexture(scene, true);
}

export const ENEMY_FRAME = {
  drone: { w: DRONE_W, h: DRONE_H },
  seeker: { w: SEEKER_W, h: SEEKER_H },
} as const;
