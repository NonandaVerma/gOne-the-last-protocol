import * as Phaser from 'phaser';
import { VILLAIN } from './palette';
import {
  Gfx,
  Vec,
  poly,
  outline,
  path,
  mix,
  shade,
  bloom,
  energyCore,
  forgeSheet,
  seeded,
  bolt,
  rand,
  Rng,
} from './draw';
import { Pose, Proportions, solve, armouredLimb, boot, fist, torsoShell, across } from './rig';

/**
 * RA-ONE — the corrupted protocol.
 *
 * Heavier, taller and deliberately asymmetric against G-One's clean silhouette:
 * jagged obsidian plating, a swept horn crown, crimson fissures that bleed light
 * and an unstable furnace core in the chest.
 */

export const RAONE_FRAME_W = 224;
export const RAONE_FRAME_H = 248;
export const RAONE_SCALE = 0.5;

const CX = 112;
const GROUND = 236;

const P: Proportions = {
  torso: 62,
  neck: 10,
  headRadius: 20,
  shoulderHalf: 34,
  hipHalf: 17,
  thigh: 45,
  shin: 43,
  upperArm: 36,
  foreArm: 34,
  thighW: [18, 13],
  shinW: [13, 10],
  upperArmW: [13.5, 10.5],
  foreArmW: [11, 9],
};

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
 * The tattered crimson-black cape from the key art — torn into ragged
 * strips rather than one smooth sheet, distinguishing it in silhouette alone
 * from G-One's flowing cape. Anchored at the back shoulder, drawn first so
 * the torso and back arm overlap its leading edge.
 */
function tatteredCape(g: Gfx, sk: ReturnType<typeof solve>, a: number, r: Rng) {
  const sway = Math.sin(a * 4) * 10;
  const top = at(sk.shoulderBack, a, 6, 24);
  const topBack = at(sk.shoulderBack, a, -10, 18);
  const mid = at(sk.pelvis, a, -22 + sway * 0.4, 0);
  const midBack = at(sk.pelvis, a, -44 + sway * 0.7, -18);

  // Base cloth mass behind the torn strips.
  poly(g, [top, topBack, midBack, mid], mix(VILLAIN.shadow, 0x000000, 0.3), 0.9);

  // Ragged torn strips hanging from the back edge — each a different length
  // so the hem reads as damaged rather than a clean fringe.
  const strips = 4;
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const base = {
      x: midBack.x + (mid.x - midBack.x) * t * 0.35,
      y: midBack.y + (mid.y - midBack.y) * t * 0.35,
    };
    const len = rand(r, 30, 56);
    const tip = at(base, a, -len * 0.35 + rand(r, -6, 6), -len);
    const notch = at(base, a, -len * 0.15, -len * 0.55);
    poly(
      g,
      [base, notch, tip, { x: base.x - 6, y: base.y + 4 }],
      mix(VILLAIN.shadow, 0x000000, 0.2 + t * 0.15),
      0.88
    );
  }

  // Crimson piping along the collar edge only — the torn strips stay dark.
  path(g, [top, topBack], VILLAIN.energy, 0.5, 2);
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

function hornedHelm(g: Gfx, head: Vec, a: number, glow: number) {
  const r = P.headRadius;

  // Swept horns behind the skull.
  const horn = (dir: number, len: number, rise: number) => {
    const root = at(head, a, -r * 0.35 * dir, r * 0.55);
    const tip = at(head, a, -len, rise);
    const mid = at(head, a, -len * 0.45, rise * 0.78 + r * 0.25);
    poly(
      g,
      [root, mid, tip, at(head, a, -len * 0.42, rise * 0.5), at(head, a, -r * 0.2 * dir, r * 0.15)],
      mix(VILLAIN.base, VILLAIN.shadow, 0.25),
      1
    );
    path(g, [root, mid, tip], VILLAIN.energy, 0.7, 1.8);
    void dir;
  };
  horn(1, r * 2.0, r * 1.5);
  horn(-1, r * 1.5, r * 1.9);

  const shell: Vec[] = [
    at(head, a, -r * 0.95, r * 0.35),
    at(head, a, -r * 0.3, r * 1.05),
    at(head, a, r * 0.55, r * 0.9),
    at(head, a, r * 1.08, r * 0.05),
    at(head, a, r * 0.9, -r * 0.85),
    at(head, a, r * 0.05, -r * 1.25),
    at(head, a, -r * 0.8, -r * 0.85),
    at(head, a, -r * 1.05, -r * 0.1),
  ];
  poly(g, shell, mix(VILLAIN.base, VILLAIN.shadow, 0.45), 1);
  poly(
    g,
    [
      at(head, a, -r * 0.95, r * 0.35),
      at(head, a, -r * 0.3, r * 1.05),
      at(head, a, r * 0.4, r * 0.85),
      at(head, a, r * 0.05, r * 0.2),
      at(head, a, -r * 0.85, r * 0.05),
    ],
    VILLAIN.lit,
    1
  );

  // Angular jaw.
  poly(
    g,
    [
      at(head, a, r * 0.1, -r * 0.45),
      at(head, a, r * 0.92, -r * 0.35),
      at(head, a, r * 0.46, -r * 1.25),
      at(head, a, -r * 0.2, -r * 1.05),
    ],
    mix(VILLAIN.base, VILLAIN.shadow, 0.1),
    1
  );

  // Burning eye slit.
  const ec = at(head, a, r * 0.32, -r * 0.08);
  bloom(g, ec.x, ec.y, r * 1.9, VILLAIN.energy, 0.42 * glow, 6);
  poly(
    g,
    [
      at(head, a, -r * 0.45, r * 0.18),
      at(head, a, r * 0.98, -r * 0.02),
      at(head, a, r * 0.9, -r * 0.4),
      at(head, a, -r * 0.45, -r * 0.18),
    ],
    VILLAIN.energy,
    0.95
  );
  path(
    g,
    [at(head, a, -r * 0.1, r * 0.02), at(head, a, r * 0.72, -r * 0.12)],
    VILLAIN.hot,
    0.95,
    2.4
  );
  outline(g, shell, mix(VILLAIN.rim, VILLAIN.base, 0.6), 0.45, 1.3);
}

function spikedPauldron(g: Gfx, shoulder: Vec, a: number, scale: number, depth: number) {
  const s = scale * (1 - depth * 0.25);
  const base = mix(VILLAIN.base, VILLAIN.shadow, 0.2 + depth * 0.5);
  const pts: Vec[] = [
    at(shoulder, a, -20 * s, 16 * s),
    at(shoulder, a, 8 * s, 20 * s),
    at(shoulder, a, 22 * s, 2 * s),
    at(shoulder, a, 6 * s, -18 * s),
    at(shoulder, a, -22 * s, -12 * s),
  ];
  poly(g, pts, base, 1);
  poly(
    g,
    [
      at(shoulder, a, -18 * s, 14 * s),
      at(shoulder, a, 4 * s, 16 * s),
      at(shoulder, a, 8 * s, 2 * s),
      at(shoulder, a, -18 * s, -2 * s),
    ],
    mix(VILLAIN.lit, VILLAIN.shadow, depth * 0.5),
    1
  );
  // Blade spikes.
  poly(
    g,
    [
      at(shoulder, a, -20 * s, 15 * s),
      at(shoulder, a, -40 * s, 30 * s),
      at(shoulder, a, -6 * s, 19 * s),
    ],
    mix(base, VILLAIN.shadow, 0.2),
    1
  );
  poly(
    g,
    [
      at(shoulder, a, -4 * s, 19 * s),
      at(shoulder, a, -14 * s, 38 * s),
      at(shoulder, a, 10 * s, 18 * s),
    ],
    mix(base, VILLAIN.shadow, 0.35),
    1
  );
  outline(g, pts, mix(VILLAIN.rim, VILLAIN.base, 0.72), 0.4 - depth * 0.25, 1.2);
  if (depth < 0.5) {
    path(
      g,
      [at(shoulder, a, -18 * s, 14 * s), at(shoulder, a, 18 * s, 4 * s)],
      VILLAIN.energy,
      0.85,
      2
    );
  }
}

/** Crimson fissures bleeding light across the armour. */
function fissures(g: Gfx, sk: ReturnType<typeof solve>, a: number, glow: number, r: Rng) {
  const mid = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.5, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.5 };
  const cracks: Array<[Vec, Vec]> = [
    [across(sk.chest, a, -P.shoulderHalf * 0.6), across(mid, a, -P.hipHalf * 0.2)],
    [across(sk.chest, a, P.shoulderHalf * 0.5), across(sk.pelvis, a, P.hipHalf * 0.6)],
    [across(mid, a, P.hipHalf * 0.9), across(sk.pelvis, a, -P.hipHalf * 0.3)],
    [sk.hipBack, sk.kneeBack],
    [sk.hipFront, sk.kneeFront],
  ];
  cracks.forEach(([p0, p1], i) => {
    bolt(g, p0, p1, VILLAIN.energy, 1.8, 4, 4, r, (0.55 + glow * 0.4) * (i < 3 ? 1 : 0.6));
  });
}

// ---------------------------------------------------------------------------
// Full figure
// ---------------------------------------------------------------------------

export function drawRaOne(g: Gfx, pose: Pose, phase = 1) {
  const sk = solve(pose, P);
  const a = pose.lean;
  const headA = pose.lean + pose.headTilt;
  const glow = pose.glow;
  const r = seeded(1337);

  // Dark aura swelling with the boss phase.
  bloom(g, sk.chest.x, sk.chest.y, 92 * (0.8 + phase * 0.25), VILLAIN.energy, 0.1 + phase * 0.07, 7);

  // Cape first: furthest-back element, so the body overlaps its leading edge.
  tatteredCape(g, sk, a, r);

  // --- BACK LAYER -----------------------------------------------------------
  armouredLimb(g, sk.shoulderBack, sk.elbowBack, P.upperArmW[0], P.upperArmW[1], VILLAIN, { depth: 0.85 });
  armouredLimb(g, sk.elbowBack, sk.handBack, P.foreArmW[0], P.foreArmW[1], VILLAIN, { depth: 0.85 });
  fist(g, sk.handBack, VILLAIN, 9, 0.85);
  spikedPauldron(g, sk.shoulderBack, a, 0.95, 0.8);

  armouredLimb(g, sk.hipBack, sk.kneeBack, P.thighW[0], P.thighW[1], VILLAIN, { depth: 0.75, plate: true });
  armouredLimb(g, sk.kneeBack, sk.footBack, P.shinW[0], P.shinW[1], VILLAIN, { depth: 0.75 });
  boot(g, sk.footBack, 1, VILLAIN, 13, 0.75);

  // --- FRONT LEG ------------------------------------------------------------
  armouredLimb(g, sk.hipFront, sk.kneeFront, P.thighW[0], P.thighW[1], VILLAIN, {
    depth: 0.05,
    plate: true,
  });
  armouredLimb(g, sk.kneeFront, sk.footFront, P.shinW[0], P.shinW[1], VILLAIN, { depth: 0.05 });
  boot(g, sk.footFront, 1, VILLAIN, 14, 0);

  // Jagged knee spike.
  poly(
    g,
    [
      { x: sk.kneeFront.x - 10, y: sk.kneeFront.y - 6 },
      { x: sk.kneeFront.x - 24, y: sk.kneeFront.y + 4 },
      { x: sk.kneeFront.x - 4, y: sk.kneeFront.y + 8 },
    ],
    mix(VILLAIN.base, VILLAIN.shadow, 0.2),
    1
  );

  // --- TORSO ----------------------------------------------------------------
  torsoShell(g, sk, P.shoulderHalf, P.hipHalf, VILLAIN, 0.74);

  // Jagged rib plates.
  const chestLow = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.6, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.6 };
  poly(
    g,
    [
      across(sk.chest, a, -P.shoulderHalf * 0.95),
      across(sk.chest, a, -P.shoulderHalf * 0.05),
      across(chestLow, a, -P.hipHalf * 0.2),
      across(chestLow, a, -P.hipHalf * 1.8),
    ],
    mix(VILLAIN.lit, VILLAIN.base, 0.45),
    1
  );
  poly(
    g,
    [
      across(sk.chest, a, P.shoulderHalf * 0.95),
      across(sk.chest, a, P.shoulderHalf * 0.05),
      across(chestLow, a, P.hipHalf * 0.2),
      across(chestLow, a, P.hipHalf * 1.8),
    ],
    mix(VILLAIN.base, VILLAIN.shadow, 0.35),
    1
  );

  // Faulds — downward pointing blades over the hips.
  for (let i = -1; i <= 1; i++) {
    const anchor = across(sk.pelvis, a, i * P.hipHalf * 0.95);
    poly(
      g,
      [
        { x: anchor.x - 9, y: anchor.y - 2 },
        { x: anchor.x + 9, y: anchor.y - 2 },
        { x: anchor.x + 2, y: anchor.y + 20 },
      ],
      mix(VILLAIN.base, VILLAIN.shadow, 0.28),
      1
    );
  }

  fissures(g, sk, a, glow, r);

  // --- FURNACE CORE ---------------------------------------------------------
  const coreAt = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.64, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.64 };
  energyCore(g, coreAt.x, coreAt.y, 10.5, VILLAIN.energy, VILLAIN.hot, shade(VILLAIN.shadow, 0.1), glow);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.4;
    bolt(
      g,
      coreAt,
      { x: coreAt.x + Math.cos(ang) * 26, y: coreAt.y + Math.sin(ang) * 26 },
      VILLAIN.energy,
      1.4,
      5,
      3,
      r,
      0.5 * glow
    );
  }

  // --- FRONT ARM ------------------------------------------------------------
  spikedPauldron(g, sk.shoulderFront, a, 1.2, 0);
  armouredLimb(g, sk.shoulderFront, sk.elbowFront, P.upperArmW[0], P.upperArmW[1], VILLAIN, {
    depth: 0,
    plate: true,
  });
  armouredLimb(g, sk.elbowFront, sk.handFront, P.foreArmW[0], P.foreArmW[1], VILLAIN, { depth: 0 });
  fist(g, sk.handFront, VILLAIN, 10.5, 0, Math.max(0, glow - 0.6));

  // Claw talons.
  const clawDir = Math.atan2(sk.handFront.y - sk.elbowFront.y, sk.handFront.x - sk.elbowFront.x);
  for (let i = -1; i <= 1; i++) {
    const ang = clawDir + i * 0.42;
    poly(
      g,
      [
        { x: sk.handFront.x, y: sk.handFront.y },
        { x: sk.handFront.x + Math.cos(ang) * 19, y: sk.handFront.y + Math.sin(ang) * 19 },
        {
          x: sk.handFront.x + Math.cos(ang + 0.3) * 9,
          y: sk.handFront.y + Math.sin(ang + 0.3) * 9,
        },
      ],
      mix(VILLAIN.base, VILLAIN.shadow, 0.1),
      1
    );
  }

  // --- HEAD -----------------------------------------------------------------
  armouredLimb(g, sk.neck, sk.chest, 9, 14, VILLAIN, { depth: 0.3 });
  hornedHelm(g, sk.head, headA, glow);
}

// ---------------------------------------------------------------------------
// Pose library
// ---------------------------------------------------------------------------

const STAND_PELVIS_Y = 148;

function basePose(): Pose {
  return {
    pelvis: { x: CX, y: STAND_PELVIS_Y },
    lean: -0.04,
    headTilt: 0.06,
    legBack: [-0.22, -0.2],
    legFront: [0.2, -0.24],
    armBack: [-0.28, 0.42],
    armFront: [0.3, 0.5],
    glow: 1,
  };
}

function groundPose(p: Pose): Pose {
  const sk = solve(p, P);
  const lowest = Math.max(sk.footFront.y, sk.footBack.y);
  return { ...p, pelvis: { x: p.pelvis.x, y: p.pelvis.y + (GROUND - lowest) } };
}

function idlePose(t: number): Pose {
  const phase = t * Math.PI * 2;
  const breath = Math.sin(phase);
  const p = basePose();
  p.pelvis = { x: CX, y: STAND_PELVIS_Y + breath * 2.2 };
  p.lean = -0.05 + breath * 0.025;
  p.headTilt = 0.08 - breath * 0.03;
  p.legBack = [-0.24, -0.22];
  p.legFront = [0.22, -0.26];
  p.armBack = [-0.3 + breath * 0.06, 0.4 + breath * 0.08];
  p.armFront = [0.32 - breath * 0.06, 0.52 - breath * 0.08];
  p.glow = 0.8 + 0.35 * (0.5 + 0.5 * Math.sin(phase * 2 + 1));
  return groundPose(p);
}

function stridePose(t: number): Pose {
  const phi = t * Math.PI * 2;
  const p = basePose();
  p.lean = 0.14;
  p.headTilt = -0.04;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y - 2 + Math.cos(phi * 2) * 2.6 };
  const hipF = Math.sin(phi) * 0.7;
  const hipB = Math.sin(phi + Math.PI) * 0.7;
  p.legFront = [hipF, -Math.max(0, Math.sin(phi + 2.3)) * 1.1 - 0.12];
  p.legBack = [hipB, -Math.max(0, Math.sin(phi + Math.PI + 2.3)) * 1.1 - 0.12];
  p.armFront = [-hipF * 0.5 + 0.2, 0.6];
  p.armBack = [-hipB * 0.5 + 0.2, 0.6];
  p.glow = 1;
  return p;
}

/** Winding up — arm drawn back, body coiled, core flaring. */
function chargePose(t: number): Pose {
  const p = basePose();
  const k = t;
  p.lean = -0.16 - k * 0.1;
  p.headTilt = 0.12;
  p.pelvis = { x: CX - 4, y: STAND_PELVIS_Y + 4 };
  p.legFront = [0.46, -0.42];
  p.legBack = [-0.52, -0.5];
  p.armFront = [-1.0 - k * 0.35, 1.25];
  p.armBack = [-0.5, 0.9];
  p.glow = 1.1 + k * 0.6;
  return groundPose(p);
}

/** Release — full forward extension. */
function strikePose(t: number): Pose {
  const p = basePose();
  const k = t;
  p.lean = 0.3 + k * 0.1;
  p.headTilt = -0.16;
  p.pelvis = { x: CX + 6, y: STAND_PELVIS_Y + 2 };
  p.legFront = [0.72, -0.4];
  p.legBack = [-0.72, -0.35];
  p.armFront = [1.42 + k * 0.1, 0.1];
  p.armBack = [-1.0, 0.55];
  p.glow = 1.6 - k * 0.3;
  return groundPose(p);
}

function hoverPose(t: number): Pose {
  const phase = t * Math.PI * 2;
  const p = basePose();
  p.lean = -0.12;
  p.headTilt = 0.1;
  p.pelvis = { x: CX, y: STAND_PELVIS_Y - 16 + Math.sin(phase) * 4 };
  p.legFront = [0.46 + Math.sin(phase) * 0.06, -0.72];
  p.legBack = [0.16, -0.5];
  p.armFront = [0.72, 0.85];
  p.armBack = [0.5, 0.95];
  p.glow = 1.25 + Math.sin(phase) * 0.2;
  return p;
}

function staggerPose(t: number): Pose {
  const p = basePose();
  p.lean = -0.4 - t * 0.1;
  p.headTilt = -0.3;
  p.pelvis = { x: CX + 7, y: STAND_PELVIS_Y + 4 };
  p.legFront = [0.62, -0.42];
  p.legBack = [-0.58, -0.56];
  p.armFront = [-1.0, 0.95];
  p.armBack = [-1.25, 0.8];
  p.glow = 1.5;
  return groundPose(p);
}

function defeatPose(t: number): Pose {
  const p = basePose();
  const k = Math.min(1, t * 1.2);
  p.lean = -0.05 - k * 0.55;
  p.headTilt = -0.2 - k * 0.5;
  p.pelvis = { x: CX + k * 6, y: STAND_PELVIS_Y + k * 40 };
  p.legFront = [0.3 + k * 1.0, -0.3 - k * 1.2];
  p.legBack = [-0.4 - k * 0.6, -0.3 - k * 1.3];
  p.armFront = [-0.4 - k * 0.9, 0.5 + k * 0.4];
  p.armBack = [-0.6 - k * 0.7, 0.4];
  p.glow = Math.max(0.1, 1.6 - k * 1.6);
  return p;
}

// ---------------------------------------------------------------------------
// Baking
// ---------------------------------------------------------------------------

export function buildRaOne(scene: Phaser.Scene) {
  const W = RAONE_FRAME_W;
  const H = RAONE_FRAME_H;

  forgeSheet(scene, 'raone_idle', W, H, 8, (g, t) => drawRaOne(g, idlePose(t)), {
    key: 'raone-idle',
    frameRate: 9,
  });

  forgeSheet(scene, 'raone_stride', W, H, 8, (g, t) => drawRaOne(g, stridePose(t)), {
    key: 'raone-stride',
    frameRate: 13,
  });

  forgeSheet(scene, 'raone_charge', W, H, 5, (g, t) => drawRaOne(g, chargePose(t), 1.2), {
    key: 'raone-charge',
    frameRate: 10,
    repeat: 0,
  });

  forgeSheet(scene, 'raone_strike', W, H, 4, (g, t) => drawRaOne(g, strikePose(t), 1.3), {
    key: 'raone-strike',
    frameRate: 16,
    repeat: 0,
  });

  forgeSheet(scene, 'raone_hover', W, H, 6, (g, t) => drawRaOne(g, hoverPose(t), 1.1), {
    key: 'raone-hover',
    frameRate: 10,
  });

  forgeSheet(scene, 'raone_stagger', W, H, 2, (g, t) => drawRaOne(g, staggerPose(t)), {
    key: 'raone-stagger',
    frameRate: 10,
    repeat: 0,
  });

  forgeSheet(scene, 'raone_defeat', W, H, 8, (g, t) => drawRaOne(g, defeatPose(t)), {
    key: 'raone-defeat',
    frameRate: 10,
    repeat: 0,
  });

  // Hover thruster plume, drawn beneath the sprite.
  forgeSheet(scene, 'raone_plume', 120, 110, 4, (g, _t, i) => {
    const r = seeded(50 + i);
    const cx = 60;
    const flick = 0.85 + (i % 2) * 0.22;
    bloom(g, cx, 18, 54 * flick, VILLAIN.energy, 0.3, 6);
    poly(
      g,
      [
        { x: cx - 30, y: 0 },
        { x: cx + 30, y: 0 },
        { x: cx + 8, y: 96 * flick },
        { x: cx - 8, y: 96 * flick },
      ],
      VILLAIN.energyDim,
      0.45
    );
    poly(
      g,
      [
        { x: cx - 20, y: 0 },
        { x: cx + 20, y: 0 },
        { x: cx + 5, y: 72 * flick },
        { x: cx - 5, y: 72 * flick },
      ],
      VILLAIN.energy,
      0.85
    );
    poly(
      g,
      [
        { x: cx - 9, y: 0 },
        { x: cx + 9, y: 0 },
        { x: cx, y: 44 * flick },
      ],
      0xffc9a0,
      0.95
    );
    for (let s = 0; s < 3; s++) {
      bolt(
        g,
        { x: cx + (r() - 0.5) * 26, y: 6 },
        { x: cx + (r() - 0.5) * 46, y: 60 + r() * 30 },
        VILLAIN.energy,
        1.2,
        8,
        4,
        r,
        0.55
      );
    }
  }, { key: 'raone-plume', frameRate: 16 });
}
