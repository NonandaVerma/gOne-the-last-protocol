import * as Phaser from 'phaser';
import { HERO } from './palette';
import {
  Gfx,
  Vec,
  poly,
  outline,
  path,
  mix,
  bloom,
  energyCore,
  forge,
  forgeSheet,
  seeded,
  bolt,
} from './draw';
import { Pose, Proportions, solve, armouredLimb, boot, fist, torsoShell, across } from './rig';

/**
 * G-ONE — the guardian protocol.
 *
 * Sleek graphite-and-silver armour, cyan energy channels, a luminous chest
 * core. Every state is baked as a real multi-frame animation from the shared
 * humanoid rig, so the character breathes, strides and recoils instead of
 * snapping between four static poses.
 */

export const GONE_FRAME_W = 192;
export const GONE_FRAME_H = 224;
/** Sprites are baked at 2x and displayed at 0.5 for free supersampling. */
export const GONE_SCALE = 0.5;

const CX = 96;
const GROUND = 212;

const P: Proportions = {
  torso: 56,
  neck: 11,
  headRadius: 19,
  shoulderHalf: 27,
  hipHalf: 14,
  thigh: 42,
  shin: 40,
  upperArm: 33,
  foreArm: 31,
  thighW: [14, 10.5],
  shinW: [10, 7.5],
  upperArmW: [10.5, 8],
  foreArmW: [8, 6.5],
};

/** Orthonormal basis for a body part rotated by `a` (0 = upright, facing +x). */
function basis(a: number) {
  return {
    f: { x: Math.cos(a), y: Math.sin(a) },
    u: { x: Math.sin(a), y: -Math.cos(a) },
  };
}

function at(c: Vec, a: number, forward: number, upward: number): Vec {
  const b = basis(a);
  return { x: c.x + b.f.x * forward + b.u.x * upward, y: c.y + b.f.y * forward + b.u.y * upward };
}

/**
 * The flowing cyan cape from the key art. Anchored at the back shoulder,
 * trailing behind and below the hip. Drawn first, so the torso and back arm
 * naturally overlap its leading edge — no depth sorting needed beyond call
 * order. `a` (torso lean) already varies per animation frame, so the sway
 * derived from it animates the cape across the baked sheet for free, with no
 * separate time input required.
 */
function cape(g: Gfx, sk: ReturnType<typeof solve>, a: number) {
  const sway = Math.sin(a * 5) * 8;
  const top = at(sk.shoulderBack, a, 4, 20);
  const topBack = at(sk.shoulderBack, a, -8, 15);
  const mid = at(sk.pelvis, a, -20 + sway * 0.4, -2);
  const midBack = at(sk.pelvis, a, -38 + sway * 0.7, -16);
  const tailNear = at(sk.pelvis, a, -24 + sway * 0.9, -50);
  const tailFar = at(sk.pelvis, a, -50 + sway * 1.3, -68);

  // Base cloth mass, darkest at the trailing edge.
  poly(g, [top, topBack, midBack, tailFar, tailNear, mid], mix(HERO.shadow, 0x000000, 0.2), 0.92);
  // Lit inner face, catching the chest core's glow.
  poly(g, [top, mid, midBack, topBack], mix(HERO.base, HERO.shadow, 0.3), 0.75);
  // Energy piping along the trailing edge.
  path(g, [topBack, midBack, tailFar], HERO.energy, 0.55, 2);
  path(g, [top, tailNear], mix(HERO.energy, HERO.shadow, 0.5), 0.3, 1.2);
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

function helmet(g: Gfx, head: Vec, a: number, glow: number) {
  const r = P.headRadius;
  const shell: Vec[] = [
    at(head, a, -r * 0.82, r * 0.52),
    at(head, a, -r * 0.2, r * 1.02),
    at(head, a, r * 0.62, r * 0.84),
    at(head, a, r * 1.02, r * 0.1),
    at(head, a, r * 0.86, -r * 0.72),
    at(head, a, r * 0.1, -r * 1.12),
    at(head, a, -r * 0.72, -r * 0.78),
    at(head, a, -r * 0.95, -r * 0.05),
  ];
  poly(g, shell, mix(HERO.base, HERO.shadow, 0.45), 1);

  // Lit crown.
  poly(
    g,
    [
      at(head, a, -r * 0.82, r * 0.52),
      at(head, a, -r * 0.2, r * 1.02),
      at(head, a, r * 0.5, r * 0.8),
      at(head, a, r * 0.2, r * 0.26),
      at(head, a, -r * 0.7, r * 0.1),
    ],
    HERO.lit,
    1
  );

  // Silver crest ridge.
  poly(
    g,
    [
      at(head, a, -r * 0.3, r * 1.0),
      at(head, a, r * 0.35, r * 0.86),
      at(head, a, r * 0.3, r * 0.62),
      at(head, a, -r * 0.28, r * 0.74),
    ],
    HERO.rim,
    0.9
  );

  // Jaw guard.
  poly(
    g,
    [
      at(head, a, r * 0.2, -r * 0.5),
      at(head, a, r * 0.86, -r * 0.4),
      at(head, a, r * 0.42, -r * 1.12),
      at(head, a, -r * 0.1, -r * 1.0),
    ],
    mix(HERO.base, HERO.shadow, 0.2),
    1
  );

  // Glowing visor band.
  const visor: Vec[] = [
    at(head, a, -r * 0.6, r * 0.2),
    at(head, a, r * 0.92, r * 0.02),
    at(head, a, r * 0.84, -r * 0.44),
    at(head, a, -r * 0.6, -r * 0.3),
  ];
  const vc = at(head, a, r * 0.2, -r * 0.1);
  bloom(g, vc.x, vc.y, r * 1.5, HERO.energy, 0.3 * glow, 5);
  poly(g, visor, mix(HERO.energyDim, HERO.shadow, 0.3), 1);
  poly(
    g,
    [
      at(head, a, -r * 0.48, r * 0.1),
      at(head, a, r * 0.84, -r * 0.06),
      at(head, a, r * 0.78, -r * 0.34),
      at(head, a, -r * 0.48, -r * 0.2),
    ],
    HERO.energy,
    0.92
  );
  path(
    g,
    [at(head, a, -r * 0.3, r * 0.0), at(head, a, r * 0.6, -r * 0.14)],
    HERO.hot,
    0.95,
    2
  );
  outline(g, shell, mix(HERO.rim, HERO.base, 0.45), 0.5, 1.2);
}

function pauldron(g: Gfx, shoulder: Vec, a: number, side: number, depth: number) {
  const s = 1 - depth * 0.3;
  const base = mix(HERO.rim, HERO.base, 0.3 + depth * 0.5);
  const pts: Vec[] = [
    at(shoulder, a, -14 * s, 12 * s),
    at(shoulder, a, 12 * s, 10 * s),
    at(shoulder, a, 16 * s, -6 * s),
    at(shoulder, a, 2 * s, -16 * s),
    at(shoulder, a, -16 * s, -10 * s),
  ];
  poly(g, pts, mix(base, HERO.shadow, 0.35), 1);
  poly(
    g,
    [
      at(shoulder, a, -13 * s, 10 * s),
      at(shoulder, a, 7 * s, 8 * s),
      at(shoulder, a, 8 * s, -2 * s),
      at(shoulder, a, -14 * s, -4 * s),
    ],
    base,
    1
  );
  outline(g, pts, mix(HERO.rim, HERO.base, 0.2), 0.5 - depth * 0.3, 1.2);
  if (depth < 0.5) {
    path(
      g,
      [at(shoulder, a, -13 * s, 11 * s), at(shoulder, a, 13 * s, 9 * s)],
      HERO.energy,
      0.85,
      1.8
    );
  }
  void side;
}

// ---------------------------------------------------------------------------
// Full figure
// ---------------------------------------------------------------------------

export function drawGOne(g: Gfx, pose: Pose) {
  const sk = solve(pose, P);
  const a = pose.lean;
  const headA = pose.lean + pose.headTilt;
  const glow = pose.glow;

  // Ambient backlight so the silhouette separates from dark arenas.
  bloom(g, sk.chest.x, sk.chest.y + 6, 62, HERO.energy, 0.12 * glow, 6);

  // Cape first: furthest-back element, so the body overlaps its leading edge.
  cape(g, sk, a);

  // --- BACK LAYER -----------------------------------------------------------
  armouredLimb(g, sk.shoulderBack, sk.elbowBack, P.upperArmW[0], P.upperArmW[1], HERO, { depth: 0.85 });
  armouredLimb(g, sk.elbowBack, sk.handBack, P.foreArmW[0], P.foreArmW[1], HERO, { depth: 0.85 });
  fist(g, sk.handBack, HERO, 7, 0.85);
  pauldron(g, sk.shoulderBack, a, -1, 0.8);

  armouredLimb(g, sk.hipBack, sk.kneeBack, P.thighW[0], P.thighW[1], HERO, { depth: 0.75, plate: true });
  armouredLimb(g, sk.kneeBack, sk.footBack, P.shinW[0], P.shinW[1], HERO, { depth: 0.75 });
  boot(g, sk.footBack, 1, HERO, 11, 0.75);

  // --- FRONT LEG ------------------------------------------------------------
  armouredLimb(g, sk.hipFront, sk.kneeFront, P.thighW[0], P.thighW[1], HERO, {
    depth: 0.05,
    plate: true,
    channel: true,
  });
  armouredLimb(g, sk.kneeFront, sk.footFront, P.shinW[0], P.shinW[1], HERO, {
    depth: 0.05,
    channel: true,
  });
  boot(g, sk.footFront, 1, HERO, 12, 0);

  // Knee guard.
  g.fillStyle(mix(HERO.rim, HERO.base, 0.4), 1);
  g.fillCircle(sk.kneeFront.x, sk.kneeFront.y, 7);
  g.fillStyle(HERO.energy, 0.8);
  g.fillCircle(sk.kneeFront.x, sk.kneeFront.y, 2.6);

  // --- TORSO ----------------------------------------------------------------
  torsoShell(g, sk, P.shoulderHalf, P.hipHalf, HERO, 0.68);

  // Segmented abdominal bands.
  for (let i = 0; i < 3; i++) {
    const t = 0.16 + i * 0.15;
    const p = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * t, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * t };
    const w = P.hipHalf * (0.86 + i * 0.1);
    path(g, [across(p, a, -w), across(p, a, w)], mix(HERO.shadow, HERO.base, 0.3), 0.9, 3);
  }

  // Pectoral plates.
  const chestLow = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.62, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.62 };
  poly(
    g,
    [
      across(sk.chest, a, -P.shoulderHalf * 0.86),
      across(sk.chest, a, -P.shoulderHalf * 0.08),
      across(chestLow, a, -P.hipHalf * 0.3),
      across(chestLow, a, -P.hipHalf * 1.5),
    ],
    mix(HERO.lit, HERO.base, 0.35),
    1
  );
  poly(
    g,
    [
      across(sk.chest, a, P.shoulderHalf * 0.86),
      across(sk.chest, a, P.shoulderHalf * 0.08),
      across(chestLow, a, P.hipHalf * 0.3),
      across(chestLow, a, P.hipHalf * 1.5),
    ],
    mix(HERO.base, HERO.shadow, 0.25),
    1
  );

  // Belt.
  path(
    g,
    [across(sk.pelvis, a, -P.hipHalf * 1.25), across(sk.pelvis, a, P.hipHalf * 1.25)],
    mix(HERO.rim, HERO.base, 0.55),
    0.9,
    5
  );
  path(
    g,
    [across(sk.pelvis, a, -P.hipHalf * 0.9), across(sk.pelvis, a, P.hipHalf * 0.9)],
    HERO.energy,
    0.8,
    1.6
  );

  // Spine channel from core to belt.
  const coreAt = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.66, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.66 };
  path(g, [coreAt, sk.pelvis], HERO.energy, 0.5, 2.4);

  // --- CHEST CORE -----------------------------------------------------------
  energyCore(g, coreAt.x, coreAt.y, 8.5, HERO.energy, HERO.hot, mix(HERO.shadow, HERO.base, 0.5), glow);

  // Triangular highlight on top of the circular housing — the key art's
  // core reads as a faceted triangle, not a plain disc.
  const triR = 7.5;
  const triPts: Vec[] = [
    { x: coreAt.x, y: coreAt.y - triR },
    { x: coreAt.x - triR * 0.88, y: coreAt.y + triR * 0.7 },
    { x: coreAt.x + triR * 0.88, y: coreAt.y + triR * 0.7 },
  ];
  poly(g, triPts, HERO.hot, 0.55 * glow);
  outline(g, triPts, HERO.energy, 0.9, 1.4);

  // --- FRONT ARM & PAULDRON -------------------------------------------------
  pauldron(g, sk.shoulderFront, a, 1, 0);
  armouredLimb(g, sk.shoulderFront, sk.elbowFront, P.upperArmW[0], P.upperArmW[1], HERO, {
    depth: 0,
    plate: true,
  });
  armouredLimb(g, sk.elbowFront, sk.handFront, P.foreArmW[0], P.foreArmW[1], HERO, {
    depth: 0,
    channel: true,
  });
  fist(g, sk.handFront, HERO, 8, 0, Math.max(0, glow - 0.7));

  // --- HEAD -----------------------------------------------------------------
  armouredLimb(g, sk.neck, sk.chest, 7, 11, HERO, { depth: 0.3 });
  helmet(g, sk.head, headA, glow);
}

// ---------------------------------------------------------------------------
// Pose library
// ---------------------------------------------------------------------------

const STAND_PELVIS_Y = 132;

function basePose(): Pose {
  return {
    pelvis: { x: CX, y: STAND_PELVIS_Y },
    lean: 0.05,
    headTilt: -0.02,
    legBack: [-0.14, -0.18],
    legFront: [0.12, -0.2],
    armBack: [-0.12, 0.34],
    armFront: [0.14, 0.42],
    glow: 1,
  };
}

/** Resolve a straight-legged stance so the feet land exactly on GROUND. */
function groundPose(p: Pose): Pose {
  const sk = solve(p, P);
  const lowest = Math.max(sk.footFront.y, sk.footBack.y);
  const dy = GROUND - lowest;
  return { ...p, pelvis: { x: p.pelvis.x, y: p.pelvis.y + dy } };
}

function idlePose(t: number): Pose {
  const phase = t * Math.PI * 2;
  const breath = Math.sin(phase);
  const p = basePose();
  p.pelvis = { x: CX, y: STAND_PELVIS_Y + breath * 1.6 };
  p.lean = 0.06 + breath * 0.018;
  p.headTilt = -0.03 + Math.sin(phase + 0.7) * 0.03;
  p.legBack = [-0.16 - breath * 0.01, -0.2 + breath * 0.015];
  p.legFront = [0.13 + breath * 0.01, -0.22 - breath * 0.015];
  p.armBack = [-0.14 + breath * 0.05, 0.3 + breath * 0.06];
  p.armFront = [0.16 - breath * 0.05, 0.4 - breath * 0.07];
  p.glow = 0.82 + 0.3 * (0.5 + 0.5 * Math.sin(phase * 2));
  return groundPose(p);
}

function runPose(t: number): Pose {
  const phi = t * Math.PI * 2;
  const p = basePose();
  p.lean = 0.26;
  p.headTilt = -0.12;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y - 4 + Math.cos(phi * 2) * 3.2 };

  const hipF = Math.sin(phi) * 0.95;
  const hipB = Math.sin(phi + Math.PI) * 0.95;
  p.legFront = [hipF, -Math.max(0, Math.sin(phi + 2.3)) * 1.35 - 0.1];
  p.legBack = [hipB, -Math.max(0, Math.sin(phi + Math.PI + 2.3)) * 1.35 - 0.1];

  p.armFront = [-hipF * 0.8 + 0.08, 0.5 + Math.max(0, -Math.sin(phi)) * 0.7];
  p.armBack = [-hipB * 0.8 + 0.08, 0.5 + Math.max(0, -Math.sin(phi + Math.PI)) * 0.7];
  p.glow = 0.95 + 0.2 * Math.abs(Math.sin(phi));
  return p;
}

function jumpPose(t: number): Pose {
  const p = basePose();
  p.lean = 0.14 + t * 0.06;
  p.headTilt = -0.06;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y - 6 };
  p.legFront = [0.78 + t * 0.12, -1.42];
  p.legBack = [0.3 - t * 0.1, -1.1];
  p.armFront = [-0.62 - t * 0.12, 0.5];
  p.armBack = [-0.9 - t * 0.1, 0.42];
  p.glow = 1.15;
  return p;
}

function fallPose(t: number): Pose {
  const p = basePose();
  p.lean = 0.1;
  p.headTilt = 0.04;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y - 4 };
  p.legFront = [0.34, -0.5 - t * 0.1];
  p.legBack = [-0.38, -0.3];
  p.armFront = [-1.05 - t * 0.08, 0.3];
  p.armBack = [-1.25, 0.25];
  p.glow = 1.1;
  return p;
}

function dashPose(t: number): Pose {
  const p = basePose();
  p.lean = 0.82 + t * 0.06;
  p.headTilt = -0.4;
  p.pelvis = { x: CX - 6, y: STAND_PELVIS_Y + 14 };
  p.legFront = [-0.65, -0.55];
  p.legBack = [-1.05, -0.35];
  p.armFront = [1.35, 0.12];
  p.armBack = [-1.5, 0.2];
  p.glow = 1.45;
  return p;
}

function bracePose(t: number): Pose {
  const phase = t * Math.PI * 2;
  const p = basePose();
  p.lean = -0.06;
  p.headTilt = 0.02;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y + 3 + Math.sin(phase) * 1.2 };
  p.legFront = [0.3, -0.5];
  p.legBack = [-0.34, -0.42];
  p.armFront = [0.95 + Math.sin(phase) * 0.05, 1.05];
  p.armBack = [0.8, 1.15];
  p.glow = 1.3 + Math.sin(phase) * 0.15;
  return groundPose(p);
}

function hurtPose(t: number): Pose {
  const p = basePose();
  p.lean = -0.3 - t * 0.08;
  p.headTilt = -0.25;
  p.pelvis = { x: CX + 4, y: STAND_PELVIS_Y + 2 };
  p.legFront = [0.52, -0.35];
  p.legBack = [-0.5, -0.5];
  p.armFront = [-0.85, 0.85];
  p.armBack = [-1.1, 0.7];
  p.glow = 0.5;
  return groundPose(p);
}

function defeatPose(t: number): Pose {
  const p = basePose();
  const k = Math.min(1, t * 1.25);
  p.lean = -0.1 + k * 0.95;
  p.headTilt = 0.1 + k * 0.5;
  p.pelvis = { x: CX - k * 10, y: STAND_PELVIS_Y + k * 48 };
  p.legFront = [0.2 + k * 0.9, -0.3 - k * 1.1];
  p.legBack = [-0.3 - k * 0.5, -0.3 - k * 1.3];
  p.armFront = [0.3 + k * 0.9, 0.4 - k * 0.3];
  p.armBack = [-0.2 - k * 0.8, 0.3];
  p.glow = Math.max(0.08, 1 - k * 1.1);
  return p;
}

// ---------------------------------------------------------------------------
// Baking
// ---------------------------------------------------------------------------

export function buildGOne(scene: Phaser.Scene) {
  const W = GONE_FRAME_W;
  const H = GONE_FRAME_H;

  forgeSheet(scene, 'gone_idle', W, H, 8, (g, t) => drawGOne(g, idlePose(t)), {
    key: 'gone-idle',
    frameRate: 10,
  });

  forgeSheet(scene, 'gone_run', W, H, 10, (g, t) => drawGOne(g, runPose(t)), {
    key: 'gone-run',
    frameRate: 18,
  });

  forgeSheet(scene, 'gone_jump', W, H, 3, (g, t) => drawGOne(g, jumpPose(t)), {
    key: 'gone-jump',
    frameRate: 14,
    repeat: 0,
  });

  forgeSheet(scene, 'gone_fall', W, H, 2, (g, t) => drawGOne(g, fallPose(t)), {
    key: 'gone-fall',
    frameRate: 8,
  });

  forgeSheet(scene, 'gone_dash', W, H, 3, (g, t) => drawGOne(g, dashPose(t)), {
    key: 'gone-dash',
    frameRate: 16,
  });

  forgeSheet(scene, 'gone_brace', W, H, 6, (g, t) => drawGOne(g, bracePose(t)), {
    key: 'gone-brace',
    frameRate: 10,
  });

  forgeSheet(scene, 'gone_hurt', W, H, 2, (g, t) => drawGOne(g, hurtPose(t)), {
    key: 'gone-hurt',
    frameRate: 10,
    repeat: 0,
  });

  forgeSheet(scene, 'gone_defeat', W, H, 8, (g, t) => drawGOne(g, defeatPose(t)), {
    key: 'gone-defeat',
    frameRate: 11,
    repeat: 0,
  });

  // --- Aim-tracking arm cannon overlay --------------------------------------
  // Pivot sits at 14% along the sprite so it rotates around the shoulder.
  forge(scene, 'gone_cannon', 96, 36, (g) => {
    const y = 18;
    // Upper arm into the barrel housing.
    poly(
      g,
      [
        { x: 2, y: y - 11 },
        { x: 40, y: y - 10 },
        { x: 40, y: y + 10 },
        { x: 2, y: y + 11 },
      ],
      mix(HERO.base, HERO.shadow, 0.35),
      1
    );
    poly(
      g,
      [
        { x: 4, y: y - 9 },
        { x: 38, y: y - 8 },
        { x: 38, y: y - 1 },
        { x: 4, y: y - 2 },
      ],
      HERO.lit,
      1
    );
    // Emitter housing.
    poly(
      g,
      [
        { x: 38, y: y - 13 },
        { x: 74, y: y - 9 },
        { x: 80, y: y - 3 },
        { x: 80, y: y + 3 },
        { x: 74, y: y + 9 },
        { x: 38, y: y + 13 },
      ],
      mix(HERO.base, HERO.shadow, 0.15),
      1
    );
    poly(
      g,
      [
        { x: 40, y: y - 11 },
        { x: 72, y: y - 7 },
        { x: 72, y: y - 1 },
        { x: 40, y: y - 3 },
      ],
      mix(HERO.rim, HERO.base, 0.45),
      1
    );
    outline(
      g,
      [
        { x: 38, y: y - 13 },
        { x: 74, y: y - 9 },
        { x: 80, y: y - 3 },
        { x: 80, y: y + 3 },
        { x: 74, y: y + 9 },
        { x: 38, y: y + 13 },
      ],
      mix(HERO.rim, HERO.base, 0.3),
      0.6,
      1.2
    );
    // Muzzle aperture.
    bloom(g, 82, y, 16, HERO.energy, 0.5, 5);
    g.fillStyle(HERO.energy, 0.95);
    g.fillCircle(80, y, 4.2);
    g.fillStyle(HERO.hot, 1);
    g.fillCircle(80, y, 2);
    // Energy rail.
    path(g, [{ x: 20, y: y + 6 }, { x: 70, y: y + 4 }], HERO.energy, 0.85, 2);
    // Elbow joint.
    g.fillStyle(mix(HERO.rim, HERO.base, 0.4), 1);
    g.fillCircle(14, y, 10);
    g.fillStyle(HERO.energy, 0.8);
    g.fillCircle(14, y, 3.4);
  });

  // --- Muzzle flash ---------------------------------------------------------
  forgeSheet(scene, 'gone_muzzle', 96, 64, 4, (g, _t, i) => {
    const k = 1 - i / 4;
    const cx = 18;
    const cy = 32;
    bloom(g, cx, cy, 30 * k, HERO.energy, 0.55 * k, 6);
    poly(
      g,
      [
        { x: cx - 6, y: cy },
        { x: cx + 10, y: cy - 20 * k },
        { x: cx + 72 * k, y: cy },
        { x: cx + 10, y: cy + 20 * k },
      ],
      HERO.energy,
      0.85 * k
    );
    poly(
      g,
      [
        { x: cx - 2, y: cy },
        { x: cx + 10, y: cy - 9 * k },
        { x: cx + 54 * k, y: cy },
        { x: cx + 10, y: cy + 9 * k },
      ],
      HERO.hot,
      0.95 * k
    );
    const r = seeded(900 + i);
    for (let s = 0; s < 3; s++) {
      bolt(
        g,
        { x: cx + 6, y: cy },
        { x: cx + 40 * k + r() * 20, y: cy + (r() - 0.5) * 44 * k },
        HERO.energy,
        1.6,
        6,
        4,
        r,
        0.8 * k
      );
    }
  });
}
