import { Ramp } from './palette';
import { Gfx, Vec, poly, outline, path, project, normal, mix, shade, bloom } from './draw';

/**
 * A tiny forward-kinematics humanoid rig.
 *
 * Every character frame in the game is a pose of this rig rendered with
 * cel-shaded armour segments, which is what gives the sprites real,
 * frame-by-frame animation instead of a handful of static silhouettes.
 *
 * Angle convention: 0 radians points straight DOWN (+y). Positive angles swing
 * toward +x, i.e. "forward" for a character facing right.
 */

export interface Proportions {
  torso: number;
  neck: number;
  headRadius: number;
  shoulderHalf: number;
  hipHalf: number;
  thigh: number;
  shin: number;
  upperArm: number;
  foreArm: number;
  /** Segment widths: [thighTop, thighBottom, shinTop, shinBottom, armTop, armBottom] */
  thighW: [number, number];
  shinW: [number, number];
  upperArmW: [number, number];
  foreArmW: [number, number];
}

export interface Pose {
  /** Pelvis position in frame space. */
  pelvis: Vec;
  /** Torso tilt from vertical; positive leans forward (+x). */
  lean: number;
  /** Extra head tilt on top of the torso lean. */
  headTilt: number;
  /** [hipAngle, kneeAngle] for the far (background) leg. */
  legBack: [number, number];
  /** [hipAngle, kneeAngle] for the near (foreground) leg. */
  legFront: [number, number];
  /** [shoulderAngle, elbowAngle] for the far arm. */
  armBack: [number, number];
  /** [shoulderAngle, elbowAngle] for the near arm. */
  armFront: [number, number];
  /** Energy core brightness 0..1.5. */
  glow: number;
}

export interface Skeleton {
  pelvis: Vec;
  chest: Vec;
  neck: Vec;
  head: Vec;
  hipBack: Vec;
  kneeBack: Vec;
  footBack: Vec;
  hipFront: Vec;
  kneeFront: Vec;
  footFront: Vec;
  shoulderBack: Vec;
  elbowBack: Vec;
  handBack: Vec;
  shoulderFront: Vec;
  elbowFront: Vec;
  handFront: Vec;
  lean: number;
}

/** Move "up" along the torso axis. */
function up(origin: Vec, angle: number, len: number): Vec {
  return {
    x: origin.x + Math.sin(angle) * len,
    y: origin.y - Math.cos(angle) * len,
  };
}

/** Offset sideways from a torso-axis point. */
function across(origin: Vec, angle: number, amount: number): Vec {
  return {
    x: origin.x + Math.cos(angle) * amount,
    y: origin.y + Math.sin(angle) * amount,
  };
}

export function solve(pose: Pose, p: Proportions): Skeleton {
  const chest = up(pose.pelvis, pose.lean, p.torso);
  const neck = up(chest, pose.lean, p.neck);
  const head = up(neck, pose.lean + pose.headTilt, p.headRadius * 0.92);

  const hipBack = across(pose.pelvis, pose.lean, -p.hipHalf);
  const hipFront = across(pose.pelvis, pose.lean, p.hipHalf);
  const shoulderBack = across(chest, pose.lean, -p.shoulderHalf);
  const shoulderFront = across(chest, pose.lean, p.shoulderHalf);

  const kneeBack = project(hipBack, pose.legBack[0], p.thigh);
  const footBack = project(kneeBack, pose.legBack[0] + pose.legBack[1], p.shin);
  const kneeFront = project(hipFront, pose.legFront[0], p.thigh);
  const footFront = project(kneeFront, pose.legFront[0] + pose.legFront[1], p.shin);

  const elbowBack = project(shoulderBack, pose.armBack[0], p.upperArm);
  const handBack = project(elbowBack, pose.armBack[0] + pose.armBack[1], p.foreArm);
  const elbowFront = project(shoulderFront, pose.armFront[0], p.upperArm);
  const handFront = project(elbowFront, pose.armFront[0] + pose.armFront[1], p.foreArm);

  return {
    pelvis: pose.pelvis,
    chest,
    neck,
    head,
    hipBack,
    kneeBack,
    footBack,
    hipFront,
    kneeFront,
    footFront,
    shoulderBack,
    elbowBack,
    handBack,
    shoulderFront,
    elbowFront,
    handFront,
    lean: pose.lean,
  };
}

// ---------------------------------------------------------------------------
// Armour rendering
// ---------------------------------------------------------------------------

export interface LimbOptions {
  /** 0..1 - how far back in the depth stack this limb is (darkens it). */
  depth?: number;
  /** Draw a glowing energy channel along the limb. */
  channel?: boolean;
  /** Light comes from the -x side by default; flip for back-lit limbs. */
  lightSide?: 1 | -1;
  /** Faceted plate overlay near the top of the segment. */
  plate?: boolean;
}

function quad(a: Vec, b: Vec, wa: number, wb: number): Vec[] {
  const n = normal(a, b);
  return [
    { x: a.x + n.x * wa, y: a.y + n.y * wa },
    { x: b.x + n.x * wb, y: b.y + n.y * wb },
    { x: b.x - n.x * wb, y: b.y - n.y * wb },
    { x: a.x - n.x * wa, y: a.y - n.y * wa },
  ];
}

/**
 * A cel-shaded armour segment: dark base silhouette, lit face offset toward the
 * key light, a bright bevel edge and an optional energy channel.
 */
export function armouredLimb(
  g: Gfx,
  a: Vec,
  b: Vec,
  wa: number,
  wb: number,
  ramp: Ramp,
  opts: LimbOptions = {}
) {
  const depth = opts.depth ?? 0;
  const side = opts.lightSide ?? -1;
  const base = mix(ramp.base, ramp.shadow, depth * 0.65);
  const lit = mix(ramp.lit, ramp.shadow, depth * 0.6);
  const rim = mix(ramp.rim, ramp.base, 0.15 + depth * 0.45);

  // 1. Full silhouette in the darkest value.
  poly(g, quad(a, b, wa, wb), mix(base, ramp.shadow, 0.55), 1);

  // 2. Lit face, inset and pushed toward the key light.
  const n = normal(a, b);
  const la = { x: a.x + n.x * side * wa * 0.22, y: a.y + n.y * side * wa * 0.22 };
  const lb = { x: b.x + n.x * side * wb * 0.22, y: b.y + n.y * side * wb * 0.22 };
  poly(g, quad(la, lb, wa * 0.72, wb * 0.72), base, 1);

  // 3. Narrow specular bevel on the lit edge.
  const ea = { x: a.x + n.x * side * wa * 0.62, y: a.y + n.y * side * wa * 0.62 };
  const eb = { x: b.x + n.x * side * wb * 0.62, y: b.y + n.y * side * wb * 0.62 };
  poly(g, quad(ea, eb, wa * 0.26, wb * 0.26), lit, 1);
  path(g, [ea, eb], rim, 0.55 - depth * 0.3, Math.max(0.8, wa * 0.16));

  // 4. Faceted plate cap near the joint.
  if (opts.plate) {
    const mid = { x: a.x + (b.x - a.x) * 0.34, y: a.y + (b.y - a.y) * 0.34 };
    poly(g, quad(a, mid, wa * 1.12, wb * 1.0), mix(base, ramp.lit, 0.35 - depth * 0.3), 1);
    outline(g, quad(a, mid, wa * 1.12, wb * 1.0), mix(ramp.rim, ramp.base, 0.5), 0.45, 1);
  }

  // 5. Energy channel.
  if (opts.channel && depth < 0.5) {
    path(g, [a, b], ramp.energy, 0.22, Math.max(2.4, wa * 0.55));
    path(g, [a, b], ramp.energy, 0.9, Math.max(1, wa * 0.2));
    path(g, [a, b], ramp.hot, 0.75, Math.max(0.6, wa * 0.09));
  }
}

/** Armoured boot anchored at an ankle, pointing along `facing` (+1 right). */
export function boot(g: Gfx, ankle: Vec, facing: number, ramp: Ramp, size: number, depth = 0) {
  const base = mix(ramp.base, ramp.shadow, 0.3 + depth * 0.5);
  const lit = mix(ramp.lit, ramp.shadow, depth * 0.6);
  const toe = size * 1.5;
  const heel = size * 0.62;
  const h = size * 0.82;
  const pts: Vec[] = [
    { x: ankle.x - facing * heel, y: ankle.y - h },
    { x: ankle.x + facing * toe * 0.75, y: ankle.y - h * 0.95 },
    { x: ankle.x + facing * toe, y: ankle.y - h * 0.22 },
    { x: ankle.x + facing * toe * 0.92, y: ankle.y },
    { x: ankle.x - facing * heel, y: ankle.y },
  ];
  poly(g, pts, base, 1);
  outline(g, pts, mix(ramp.rim, ramp.base, 0.45), 0.4, 1);
  poly(
    g,
    [
      { x: ankle.x - facing * heel * 0.7, y: ankle.y - h * 0.9 },
      { x: ankle.x + facing * toe * 0.6, y: ankle.y - h * 0.82 },
      { x: ankle.x + facing * toe * 0.55, y: ankle.y - h * 0.5 },
      { x: ankle.x - facing * heel * 0.7, y: ankle.y - h * 0.5 },
    ],
    lit,
    1
  );
  if (depth < 0.4) {
    path(
      g,
      [
        { x: ankle.x - facing * heel * 0.85, y: ankle.y - 1 },
        { x: ankle.x + facing * toe * 0.9, y: ankle.y - 1 },
      ],
      ramp.energy,
      0.9,
      1.8
    );
  }
}

/** Gauntlet / fist at the end of an arm. */
export function fist(g: Gfx, hand: Vec, ramp: Ramp, radius: number, depth = 0, glowT = 0) {
  const base = mix(ramp.base, ramp.shadow, 0.2 + depth * 0.5);
  if (glowT > 0 && depth < 0.5) bloom(g, hand.x, hand.y, radius * 3.4, ramp.energy, 0.42 * glowT, 6);
  g.fillStyle(base, 1);
  g.fillCircle(hand.x, hand.y, radius);
  g.fillStyle(mix(ramp.lit, ramp.shadow, depth * 0.6), 1);
  g.fillCircle(hand.x - radius * 0.26, hand.y - radius * 0.26, radius * 0.62);
  if (depth < 0.5) {
    g.fillStyle(ramp.energy, 0.55 + glowT * 0.45);
    g.fillCircle(hand.x, hand.y, radius * (0.3 + glowT * 0.3));
    if (glowT > 0.4) {
      g.fillStyle(ramp.hot, 1);
      g.fillCircle(hand.x, hand.y, radius * 0.18 * glowT);
    }
  }
}

/**
 * Tapered torso shell built from the shoulder line down to the hips, with a
 * lit face and a bevelled collar. Returns the polygon so callers can layer
 * chest plates on top.
 */
export function torsoShell(
  g: Gfx,
  sk: Skeleton,
  shoulderHalf: number,
  hipHalf: number,
  ramp: Ramp,
  waistPinch = 0.72
): Vec[] {
  const lean = sk.lean;
  const waist = { x: sk.pelvis.x + (sk.chest.x - sk.pelvis.x) * 0.34, y: sk.pelvis.y + (sk.chest.y - sk.pelvis.y) * 0.34 };
  const wHalf = hipHalf * waistPinch + shoulderHalf * 0.12;

  const shell: Vec[] = [
    across(sk.chest, lean, -shoulderHalf),
    across(sk.chest, lean, shoulderHalf),
    across(waist, lean, wHalf),
    across(sk.pelvis, lean, hipHalf * 1.1),
    across(sk.pelvis, lean, -hipHalf * 1.1),
    across(waist, lean, -wHalf),
  ];

  poly(g, shell, mix(ramp.base, ramp.shadow, 0.5), 1);

  // Lit left face.
  const litFace: Vec[] = [
    across(sk.chest, lean, -shoulderHalf * 0.92),
    across(sk.chest, lean, shoulderHalf * 0.1),
    across(waist, lean, wHalf * 0.1),
    across(sk.pelvis, lean, -hipHalf * 0.1),
    across(sk.pelvis, lean, -hipHalf * 1.02),
    across(waist, lean, -wHalf * 0.95),
  ];
  poly(g, litFace, ramp.base, 1);

  // Bevel strip.
  const bevel: Vec[] = [
    across(sk.chest, lean, -shoulderHalf * 0.92),
    across(sk.chest, lean, -shoulderHalf * 0.45),
    across(waist, lean, -wHalf * 0.4),
    across(sk.pelvis, lean, -hipHalf * 0.45),
    across(sk.pelvis, lean, -hipHalf * 1.02),
    across(waist, lean, -wHalf * 0.95),
  ];
  poly(g, bevel, ramp.lit, 1);

  outline(g, shell, mix(ramp.rim, ramp.base, 0.55), 0.5, 1.1);
  return shell;
}

export { across, up };
