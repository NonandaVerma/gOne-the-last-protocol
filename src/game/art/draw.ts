import * as Phaser from 'phaser';

/**
 * Low level drawing helpers shared by every procedural texture in the game.
 *
 * IMPORTANT: `Graphics.fillGradientStyle()` is silently ignored when a Graphics
 * object is baked with `generateTexture()` - the canvas command renderer skips
 * the GRADIENT_FILL_STYLE opcode entirely. Everything here therefore builds
 * gradients by hand out of interpolated bands, which renders identically under
 * both the WebGL and Canvas backends.
 */

export interface Vec {
  x: number;
  y: number;
}

export const vec = (x: number, y: number): Vec => ({ x, y });

export type Gfx = Phaser.GameObjects.Graphics;

// ---------------------------------------------------------------------------
// Colour maths
// ---------------------------------------------------------------------------

/** Linearly blend two 0xRRGGBB colours. */
export function mix(a: number, b: number, t: number): number {
  const k = Phaser.Math.Clamp(t, 0, 1);
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}

/** Lighten (amount > 0) or darken (amount < 0) a colour, amount in -1..1. */
export function shade(color: number, amount: number): number {
  return amount >= 0 ? mix(color, 0xffffff, amount) : mix(color, 0x000000, -amount);
}

// ---------------------------------------------------------------------------
// Deterministic randomness - art must be identical on every page load
// ---------------------------------------------------------------------------

export type Rng = () => number;

/** mulberry32 - tiny, fast, well distributed seeded PRNG. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (r: Rng, min: number, max: number) => min + r() * (max - min);
export const randInt = (r: Rng, min: number, max: number) => Math.floor(min + r() * (max - min + 1));

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Project a point `len` away from `origin`; angle 0 points straight DOWN (+y). */
export function project(origin: Vec, angle: number, len: number): Vec {
  return {
    x: origin.x + Math.sin(angle) * len,
    y: origin.y + Math.cos(angle) * len,
  };
}

/** Unit normal (perpendicular) of the a->b direction. */
export function normal(a: Vec, b: Vec): Vec {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

export function lerpVec(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function regularPoly(cx: number, cy: number, radius: number, sides: number, rotation = 0): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * Math.PI * 2) / sides;
    pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Fills & strokes
// ---------------------------------------------------------------------------

export function poly(g: Gfx, pts: Vec[], color: number, alpha = 1) {
  if (pts.length < 3) return;
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
}

export function outline(g: Gfx, pts: Vec[], color: number, alpha = 1, width = 1) {
  if (pts.length < 2) return;
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.strokePath();
}

export function path(g: Gfx, pts: Vec[], color: number, alpha = 1, width = 1) {
  if (pts.length < 2) return;
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

/** Vertical banded gradient - the hand-rolled replacement for fillGradientStyle. */
export function bandRect(
  g: Gfx,
  x: number,
  y: number,
  w: number,
  h: number,
  top: number,
  bottom: number,
  steps = 28,
  alphaTop = 1,
  alphaBottom = 1
) {
  const n = Math.max(2, Math.min(steps, Math.ceil(h)));
  const sh = h / n;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    g.fillStyle(mix(top, bottom, t), alphaTop + (alphaBottom - alphaTop) * t);
    // Overdraw by a fraction of a pixel so bands never show a seam.
    g.fillRect(x, y + i * sh, w, sh + 0.75);
  }
}

/** Horizontal banded gradient. */
export function bandRectH(
  g: Gfx,
  x: number,
  y: number,
  w: number,
  h: number,
  left: number,
  right: number,
  steps = 28,
  alphaLeft = 1,
  alphaRight = 1
) {
  const n = Math.max(2, Math.min(steps, Math.ceil(w)));
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    g.fillStyle(mix(left, right, t), alphaLeft + (alphaRight - alphaLeft) * t);
    g.fillRect(x + i * sw, y, sw + 0.75, h);
  }
}

/** Soft radial bloom built from concentric discs - cheap and renderer agnostic. */
export function bloom(g: Gfx, x: number, y: number, radius: number, color: number, strength = 0.35, layers = 7) {
  for (let i = layers; i >= 1; i--) {
    const t = i / layers;
    const a = strength * Math.pow(1 - t, 1.9);
    if (a <= 0.004) continue;
    g.fillStyle(color, a);
    g.fillCircle(x, y, radius * t);
  }
}

/** Glowing energy core: bloom -> housing -> ring -> incandescent centre. */
export function energyCore(
  g: Gfx,
  x: number,
  y: number,
  radius: number,
  energy: number,
  hot: number,
  housing: number,
  intensity = 1
) {
  bloom(g, x, y, radius * 3.2, energy, 0.3 * intensity, 7);
  g.fillStyle(housing, 1);
  g.fillCircle(x, y, radius * 1.26);
  g.lineStyle(Math.max(1, radius * 0.16), shade(housing, 0.35), 0.9);
  g.strokeCircle(x, y, radius * 1.26);
  g.fillStyle(mix(energy, housing, 0.45), 1);
  g.fillCircle(x, y, radius);
  g.fillStyle(energy, 1);
  g.fillCircle(x, y, radius * 0.68 * intensity + radius * 0.1);
  g.fillStyle(hot, 1);
  g.fillCircle(x, y, radius * 0.33 * intensity);
}

/** Jagged electrical arc between two points. */
export function bolt(
  g: Gfx,
  a: Vec,
  b: Vec,
  color: number,
  width: number,
  spread: number,
  segments: number,
  r: Rng,
  alpha = 1
) {
  const pts: Vec[] = [a];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const p = lerpVec(a, b, t);
    const n = normal(a, b);
    const off = (r() - 0.5) * 2 * spread * Math.sin(t * Math.PI);
    pts.push({ x: p.x + n.x * off, y: p.y + n.y * off });
  }
  pts.push(b);
  path(g, pts, color, alpha * 0.3, width * 2.6);
  path(g, pts, color, alpha, width);
}

/** Speckle noise used to break up flat metal and rock surfaces. */
export function speckle(
  g: Gfx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  count: number,
  r: Rng,
  alpha = 0.18,
  size = 1.4
) {
  g.fillStyle(color, alpha);
  for (let i = 0; i < count; i++) {
    g.fillRect(x + r() * w, y + r() * h, size, size);
  }
}

// ---------------------------------------------------------------------------
// Texture baking
// ---------------------------------------------------------------------------

export interface AnimSpec {
  key: string;
  frameRate: number;
  repeat?: number;
}

/**
 * Bake `count` frames side by side into a single texture, register each frame,
 * and optionally create the matching animation.
 *
 * Uses the Graphics canvas transform stack so each frame can be drawn in its own
 * local coordinate space starting at (0, 0).
 */
export function forgeSheet(
  scene: Phaser.Scene,
  key: string,
  frameW: number,
  frameH: number,
  count: number,
  draw: (g: Gfx, t: number, index: number) => void,
  anim?: AnimSpec
) {
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < count; i++) {
      g.save();
      g.translateCanvas(i * frameW, 0);
      draw(g, count > 1 ? i / count : 0, i);
      g.restore();
    }
    g.generateTexture(key, frameW * count, frameH);
    g.destroy();

    const texture = scene.textures.get(key);
    for (let i = 0; i < count; i++) {
      texture.add(i, 0, i * frameW, 0, frameW, frameH);
    }
  }

  if (anim && !scene.anims.exists(anim.key)) {
    scene.anims.create({
      key: anim.key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: count - 1 }),
      frameRate: anim.frameRate,
      repeat: anim.repeat ?? -1,
    });
  }
}

/** Bake a single still texture. */
export function forge(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (g: Gfx) => void
) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
