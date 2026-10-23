import * as Phaser from 'phaser';
import { RealmEnvironment, SkylineStyle } from '../types/game';
import { REALMS } from '../data/realms';
import {
  Gfx,
  Rng,
  Vec,
  bandRect,
  bloom,
  forge,
  mix,
  path,
  poly,
  rand,
  seeded,
  speckle,
} from './draw';

/**
 * THE SHARED REALM RENDERER.
 *
 * One implementation drives all six environments; a realm contributes only a
 * `RealmEnvironment` config. Adding a seventh realm means adding a config, not
 * another bespoke layer function.
 *
 * Every realm produces the same texture set:
 *   sky_<id>        full-screen gradient + atmosphere
 *   far_<id>        distant silhouette band  (parallax 0.14)
 *   mid_<id>        mid silhouette band      (parallax 0.30)
 *   near_<id>       foreground framing band  (parallax 0.58)
 *   platform_l<id>  tiling platform material
 */

export const LAYER_W = 1536;
export const SKY_W = 1280;
export const SKY_H = 720;

const ENTROPY = 0xff243d;

/** Bleed crimson into a colour in proportion to the realm's corruption. */
const corrupt = (color: number, corruption: number, amount = 0.5) =>
  mix(color, ENTROPY, corruption * amount);

/* ---------------------------------------------------------------------------
   Silhouette band construction
   --------------------------------------------------------------------------- */

/** Summed sine bands -> a repeatable, seamless ridge profile. */
function ridgeFn(r: Rng, width: number, bands: Array<[number, number]>) {
  const phases = bands.map(() => r() * Math.PI * 2);
  return (x: number) => {
    let y = 0;
    bands.forEach(([freq, amp], i) => {
      y += Math.sin((x / width) * Math.PI * 2 * freq + phases[i]) * amp;
    });
    return y;
  };
}

/**
 * Draw one silhouette band in the realm's architectural language.
 *
 * Each style fills the same contract — opaque mass from `baseY` to the bottom,
 * rim-lit along its upper edge — so parallax depth and readability behave
 * identically no matter which realm is rendering.
 */
function skyline(
  g: Gfx,
  style: SkylineStyle,
  width: number,
  height: number,
  baseY: number,
  color: number,
  rim: number,
  rimAlpha: number,
  r: Rng,
  scale: number
) {
  const pts: Vec[] = [];

  switch (style) {
    /* Tall cathedral spires — the pristine sky fortress. */
    case 'spires': {
      let x = 0;
      pts.push({ x: 0, y: baseY });
      while (x < width) {
        const w = rand(r, 46, 104) * scale;
        const h = rand(r, 50, 190) * scale;
        const top = baseY - h;
        pts.push({ x, y: baseY - h * 0.25 });
        pts.push({ x: x + w * 0.5, y: top });          // spire point
        pts.push({ x: x + w, y: baseY - h * 0.25 });
        x += w + rand(r, 10, 46) * scale;
      }
      pts.push({ x: width, y: baseY });
      break;
    }

    /* Jagged volcanic rock. */
    case 'ridges': {
      const fn = ridgeFn(r, width, [[1, 54], [2, 30], [3, 18], [5, 10]]);
      for (let x = 0; x <= width; x += 12) pts.push({ x, y: baseY + fn(x) * scale });
      break;
    }

    /* Fractured slabs floating at broken angles. */
    case 'shards': {
      let x = 0;
      pts.push({ x: 0, y: baseY });
      while (x < width) {
        const w = rand(r, 70, 170) * scale;
        const h = rand(r, 30, 150) * scale;
        const tilt = rand(r, -34, 34) * scale;
        pts.push({ x, y: baseY - h });
        pts.push({ x: x + w, y: baseY - h + tilt });
        pts.push({ x: x + w, y: baseY - rand(r, 0, 26) * scale });
        x += w;
      }
      pts.push({ x: width, y: baseY });
      break;
    }

    /* Angular ice formations — hard facets, no curves. */
    case 'crystals': {
      let x = 0;
      pts.push({ x: 0, y: baseY });
      while (x < width) {
        const w = rand(r, 40, 110) * scale;
        const h = rand(r, 60, 210) * scale;
        pts.push({ x, y: baseY });
        pts.push({ x: x + w * 0.28, y: baseY - h });   // sheared peak
        pts.push({ x: x + w * 0.62, y: baseY - h * 0.55 });
        pts.push({ x: x + w, y: baseY - h * 0.1 });
        x += w + rand(r, 4, 30) * scale;
      }
      pts.push({ x: width, y: baseY });
      break;
    }

    /* Colossal trunks with a ragged canopy overhead. */
    case 'canopy': {
      let x = 0;
      pts.push({ x: 0, y: baseY });
      while (x < width) {
        const w = rand(r, 54, 130) * scale;
        const h = rand(r, 80, 230) * scale;
        pts.push({ x, y: baseY - h * 0.2 });
        pts.push({ x: x + w * 0.2, y: baseY - h });
        pts.push({ x: x + w * 0.5, y: baseY - h * 0.78 });  // canopy dip
        pts.push({ x: x + w * 0.8, y: baseY - h * 0.96 });
        pts.push({ x: x + w, y: baseY - h * 0.22 });
        x += w + rand(r, 6, 34) * scale;
      }
      pts.push({ x: width, y: baseY });
      break;
    }

    /* Colosseum tiers stepping down toward the centre seam. */
    case 'arena': {
      const steps = 9;
      pts.push({ x: 0, y: baseY });
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = t * width;
        // Dip toward the middle: the arena bowl.
        const dip = Math.sin(t * Math.PI) * 70 * scale;
        const jag = rand(r, -14, 14) * scale;
        pts.push({ x, y: baseY - 150 * scale + dip + jag });
        pts.push({ x: x + width / steps / 2, y: baseY - 120 * scale + dip + jag });
      }
      pts.push({ x: width, y: baseY });
      break;
    }
  }

  // Opaque mass down to the band's bottom edge.
  poly(g, [...pts, { x: width, y: height }, { x: 0, y: height }], color, 1);
  // Rim light along the upper contour.
  path(g, pts, rim, rimAlpha, 2);
}

/* ---------------------------------------------------------------------------
   Sky
   --------------------------------------------------------------------------- */

function skyTexture(scene: Phaser.Scene, env: RealmEnvironment) {
  forge(scene, `sky_${env.id}`, SKY_W, SKY_H, (g) => {
    bandRect(g, 0, 0, SKY_W, SKY_H * 0.55, env.skyTop, env.skyMid, 40);
    bandRect(g, 0, SKY_H * 0.55 - 1, SKY_W, SKY_H * 0.45 + 1, env.skyMid, env.skyLow, 40);

    const r = seeded(env.id * 101 + 7);

    // Horizon glow.
    bloom(g, SKY_W * 0.5, SKY_H * 0.98, 640, env.haze, env.hazeStrength, 9);

    // Stars for the dark realms, cloud masses for the bright ones.
    if (env.skyTop < 0x0a1a2a) {
      for (let i = 0; i < 150; i++) {
        g.fillStyle(r() > 0.85 ? env.rimFar : 0xe8f1ff, 0.2 + r() * 0.55);
        g.fillCircle(r() * SKY_W, r() * SKY_H * 0.7, r() > 0.92 ? 1.8 : 1);
      }
    } else {
      for (let i = 0; i < 26; i++) {
        g.fillStyle(mix(env.skyTop, 0xffffff, 0.25), 0.07 + r() * 0.1);
        g.fillEllipse(r() * SKY_W, r() * SKY_H * 0.5, 240 + r() * 420, 50 + r() * 80);
      }
    }

    // The dimensional seam: a vertical fracture that widens with corruption.
    if (env.corruption > 0.02) {
      const sx = SKY_W * 0.5;
      bloom(g, sx, SKY_H * 0.4, 90 + env.corruption * 260, env.rimNear, env.corruption * 0.3, 8);
      path(
        g,
        [
          { x: sx + rand(r, -18, 18), y: 0 },
          { x: sx + rand(r, -26, 26), y: SKY_H * 0.35 },
          { x: sx + rand(r, -20, 20), y: SKY_H * 0.7 },
          { x: sx + rand(r, -14, 14), y: SKY_H },
        ],
        0xffffff,
        0.25 + env.corruption * 0.5,
        1 + env.corruption * 3
      );
    }
  });
}

/* ---------------------------------------------------------------------------
   Parallax bands
   --------------------------------------------------------------------------- */

function layerTextures(scene: Phaser.Scene, env: RealmEnvironment) {
  const far = corrupt(env.silhouetteFar, env.corruption, 0.22);
  const near = corrupt(env.silhouetteNear, env.corruption, 0.14);

  forge(scene, `far_${env.id}`, LAYER_W, 420, (g) => {
    const r = seeded(env.id * 311 + 11);
    skyline(g, env.skylineStyle, LAYER_W, 420, 230, far, env.rimFar, 0.3, r, 1);
  });

  forge(scene, `mid_${env.id}`, LAYER_W, 480, (g) => {
    const r = seeded(env.id * 523 + 29);
    skyline(g, env.skylineStyle, LAYER_W, 480, 300, mix(far, 0x000000, 0.3), env.rimFar, 0.42, r, 1.25);
    // Scattered lit windows / energy cells in the mid band.
    speckle(g, 0, 150, LAYER_W, 180, env.rimFar, 70, r, 0.3, 2);
  });

  forge(scene, `near_${env.id}`, LAYER_W, 320, (g) => {
    const r = seeded(env.id * 787 + 53);
    skyline(g, env.skylineStyle, LAYER_W, 320, 190, near, env.rimNear, 0.5, r, 0.8);
  });
}

/* ---------------------------------------------------------------------------
   Platform material
   --------------------------------------------------------------------------- */

/**
 * Platform material.
 *
 * Reads as a broken fragment of floating architecture — matching the painted
 * key art's ruined-bridge language — rather than a solid colour bar. The
 * silhouette only gets ragged in the LOWER portion of the frame (below
 * `solidBottom`); the collision body is the full texture rectangle regardless
 * of what's drawn transparent (Arcade's `refreshBody()` syncs to display size,
 * not pixel content), so none of this touches gameplay geometry. The lit top
 * lip — the actual landing surface — is untouched from the previous version.
 */
function platformTexture(scene: Phaser.Scene, env: RealmEnvironment) {
  const W = 256;
  const H = 80;
  /** Below this Y the silhouette breaks apart into hanging fragments. */
  const solidBottom = 54;

  forge(scene, `platform_l${env.id}`, W, H, (g) => {
    const r = seeded(env.id * 7919);

    // Solid mass — darkening downward, stops short of the full frame height.
    bandRect(g, 0, 0, W, solidBottom, env.platformBody, env.platformDeep, 20);

    // Fractured rock/structure detail in the solid face only.
    for (let i = 0; i < 12; i++) {
      const x = r() * W;
      const y = 18 + r() * (solidBottom - 26);
      poly(
        g,
        [
          { x, y },
          { x: x + rand(r, 14, 44), y: y + rand(r, -8, 8) },
          { x: x + rand(r, 10, 34), y: y + rand(r, 10, 26) },
        ],
        r() > 0.5 ? mix(env.platformBody, 0x000000, 0.3) : env.platformDeep,
        0.7
      );
    }

    /* Broken underside: jagged, partial-coverage chunks hanging below the
       solid mass with gaps between them, so sky/backdrop shows through —
       the "ruined fragment" silhouette instead of a clean rectangle. */
    let x = 6;
    while (x < W - 10) {
      const chunkW = rand(r, 22, 46);
      if (r() > 0.3) {
        const drop = rand(r, 10, 24);
        poly(
          g,
          [
            { x, y: solidBottom - 4 },
            { x: x + chunkW * 0.3, y: solidBottom + drop },
            { x: x + chunkW * 0.7, y: solidBottom + drop * 0.7 },
            { x: x + chunkW, y: solidBottom - 4 },
          ],
          mix(env.platformDeep, 0x000000, 0.2),
          0.9
        );
      }
      x += chunkW + rand(r, 8, 20);
    }

    // Thin structural struts hanging from the mass — reinforces "fragment of
    // a larger structure" rather than a complete, self-contained object.
    for (let i = 0; i < 3; i++) {
      const sx = (W / 4) * (i + 0.6) + rand(r, -14, 14);
      const len = rand(r, 14, 24);
      path(
        g,
        [{ x: sx, y: solidBottom - 6 }, { x: sx + rand(r, -4, 4), y: solidBottom + len }],
        env.platformDeep,
        0.8,
        2.4
      );
      g.fillStyle(mix(env.platformDeep, 0x000000, 0.3), 0.9);
      g.fillCircle(sx, solidBottom + len, 2.4);
    }

    // One dangling cable with a glowing junction node — the single accent
    // tying the platform's lighting to the realm's energy colour.
    const cableX = W * (0.25 + r() * 0.5);
    const cableLen = rand(r, 18, 30);
    path(
      g,
      [
        { x: cableX, y: solidBottom - 2 },
        { x: cableX + rand(r, -8, 8), y: solidBottom + cableLen * 0.6 },
        { x: cableX + rand(r, -6, 6), y: solidBottom + cableLen },
      ],
      0x0a0a0a,
      0.85,
      1.6
    );
    g.fillStyle(corrupt(env.platformEnergy, env.corruption, 0.5), 1);
    g.fillCircle(cableX + rand(r, -6, 6), solidBottom + cableLen, 2.2);

    // Energy seams — periodic so horizontally tiled copies line up seamlessly.
    const seamColor = corrupt(env.platformEnergy, env.corruption, 0.6);
    for (let v = 0; v < 2; v++) {
      const pts: Vec[] = [];
      for (let px = 0; px <= W; px += 16) {
        pts.push({ x: px, y: 28 + v * 16 + Math.sin((px / W) * Math.PI * 2 * (v + 1)) * 5 });
      }
      path(g, pts, seamColor, 0.6, 3);
      path(g, pts, 0xffffff, 0.5, 1);
    }

    /* The lit top lip is drawn LAST and kept high-contrast: this is the edge
       the player actually lands on, so it must never be ambiguous against
       decorative side detail. Unchanged from the previous version. */
    bandRect(g, 0, 0, W, 13, env.platformTop, mix(env.platformTop, env.platformBody, 0.8), 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], mix(env.platformTop, 0xffffff, 0.5), 0.85, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], env.platformDeep, 0.6, 1.5);
  });
}

/* ---------------------------------------------------------------------------
   Level 2: Infernal Fortress Dedicated Terrain Materials
   --------------------------------------------------------------------------- */

function buildLevel2Materials(scene: Phaser.Scene) {
  const W = 256;
  const H = 80;
  const solidBottom = 54;

  // 1. Stage 1 — The Divide Approach: Dark volcanic basalt & infernal iron roadway
  forge(scene, 'platform_l2_bridge', W, H, (g) => {
    const r = seeded(2101);
    bandRect(g, 0, 0, W, solidBottom, 0x220c10, 0x0c0406, 20);

    // Glowing molten fissure cracks
    for (let i = 0; i < 12; i++) {
      const x = r() * W;
      const y = 16 + r() * (solidBottom - 24);
      poly(g, [{ x, y }, { x: x + rand(r, 12, 34), y: y + rand(r, -6, 6) }, { x: x + rand(r, 8, 26), y: y + rand(r, 8, 18) }], 0x140507, 0.85);
    }
    for (let i = 0; i < 3; i++) {
      const fx = W * (0.2 + i * 0.3) + rand(r, -10, 10);
      path(g, [{ x: fx, y: 16 }, { x: fx + rand(r, -6, 6), y: 32 }, { x: fx + rand(r, -10, 10), y: solidBottom - 4 }], 0xff3b14, 0.8, 2);
    }

    // Broken underside with hanging basalt slag & suspension iron links
    let x = 8;
    while (x < W - 12) {
      const chunkW = rand(r, 20, 44);
      const drop = rand(r, 12, 24);
      poly(g, [{ x, y: solidBottom - 4 }, { x: x + chunkW * 0.4, y: solidBottom + drop }, { x: x + chunkW * 0.8, y: solidBottom + drop * 0.6 }, { x: x + chunkW, y: solidBottom - 4 }], 0x080204, 0.95);
      x += chunkW + rand(r, 6, 16);
    }
    for (let i = 0; i < 2; i++) {
      const cx = (W / 3) * (i + 1) + rand(r, -10, 10);
      path(g, [{ x: cx, y: solidBottom - 2 }, { x: cx + 2, y: solidBottom + 12 }, { x: cx - 2, y: solidBottom + 22 }], 0x2b1014, 0.9, 3);
    }

    // Landing lip: dark volcanic stone with glowing molten crimson seam
    bandRect(g, 0, 0, W, 13, 0x5a1e24, 0x220c10, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xff3b20, 0.9, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0xff1e38, 0.7, 1.5);
  });

  // Vertical Stone Foundation Pier (Stage 1 Bridge Pier)
  forge(scene, 'platform_l2_bridge_pier', 96, 240, (g) => {
    bandRect(g, 0, 0, 96, 240, 0x18080b, 0x080204, 20);
    for (let py = 20; py < 240; py += 32) {
      path(g, [{ x: 4, y: py }, { x: 92, y: py }], 0x050102, 0.9, 2);
      path(g, [{ x: 4, y: py }, { x: 92, y: py }], 0xff243d, 0.25, 1);
    }
    g.lineStyle(2, 0x2b1014, 0.9);
    g.strokeRect(2, 2, 92, 236);
  });

  // 2. Stage 2 — The Crimson Citadel: Heavy industrial treadplate steel
  forge(scene, 'platform_l2_citadel', W, H, (g) => {
    bandRect(g, 0, 0, W, solidBottom, 0x1c1a22, 0x0e0d12, 20);

    // Industrial plate seams & rivet rows
    for (let px = 32; px < W; px += 48) {
      path(g, [{ x: px, y: 14 }, { x: px, y: solidBottom }], 0x08070a, 0.9, 2);
      g.fillStyle(0x35323e, 1);
      g.fillCircle(px - 6, 24, 2);
      g.fillCircle(px - 6, 42, 2);
    }

    // Heavy foundation brackets
    for (let i = 0; i < 3; i++) {
      const bx = W * (0.2 + i * 0.3);
      poly(g, [{ x: bx - 10, y: solidBottom - 4 }, { x: bx + 10, y: solidBottom - 4 }, { x: bx + 4, y: solidBottom + 18 }, { x: bx - 4, y: solidBottom + 18 }], 0x121017, 1);
    }

    // Landing lip: brushed carbon steel with crimson warning line
    bandRect(g, 0, 0, W, 13, 0x3d3745, 0x1c1a22, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xff243d, 0.8, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x08070a, 0.9, 2);
  });

  // Heavy Industrial Steel I-Beam Column
  forge(scene, 'platform_l2_citadel_column', 48, 240, (g) => {
    bandRect(g, 0, 0, 48, 240, 0x16141a, 0x0a090d, 15);
    g.fillStyle(0x0a090d, 1);
    g.fillRect(10, 0, 28, 240);
    for (let py = 16; py < 240; py += 28) {
      g.fillStyle(0x35323e, 1);
      g.fillCircle(6, py, 2);
      g.fillCircle(42, py, 2);
    }
  });

  // 3. Stage 3 — The Fracture Core: Dimensional reactor dock (NO PINK, NO MAGENTA)
  forge(scene, 'platform_l2_fracture', W, H, (g) => {
    const r = seeded(2303);
    bandRect(g, 0, 0, W, solidBottom, 0x1e0b12, 0x090206, 20);

    // Deep crimson reactor veins
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      const y = 14 + r() * (solidBottom - 22);
      poly(g, [{ x, y }, { x: x + rand(r, 14, 38), y: y + rand(r, -8, 8) }, { x: x + rand(r, 8, 28), y: y + rand(r, 8, 20) }], 0x110408, 0.85);
    }
    for (let v = 0; v < 2; v++) {
      const pts: Vec[] = [];
      for (let px = 0; px <= W; px += 20) {
        pts.push({ x: px, y: 26 + v * 16 + Math.sin((px / W) * Math.PI * 3 + v) * 5 });
      }
      path(g, pts, 0xff1e38, 0.75, 2.5);
      path(g, pts, 0x8a1524, 0.5, 1);
    }

    // Heavy reactor foundation blocks
    let x = 10;
    while (x < W - 14) {
      const chunkW = rand(r, 22, 48);
      const drop = rand(r, 14, 24);
      poly(g, [{ x, y: solidBottom - 4 }, { x: x + chunkW * 0.5, y: solidBottom + drop }, { x: x + chunkW, y: solidBottom - 4 }], 0x070104, 0.95);
      x += chunkW + rand(r, 10, 20);
    }

    // Landing lip: dark containment alloy with bright crimson reactor seam
    bandRect(g, 0, 0, W, 13, 0x4d1622, 0x1e0b12, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xff243d, 0.9, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x8a1524, 0.7, 1.5);
  });

  // Energy Bridge Emitter Pylon
  forge(scene, 'platform_l2_energy_bridge_pylon', 32, 90, (g) => {
    bandRect(g, 0, 0, 32, 90, 0x221a24, 0x0f0b12, 10);
    g.fillStyle(0xff243d, 0.9);
    g.fillCircle(16, 20, 6);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(16, 20, 2.5);
    g.lineStyle(2, 0xff3b14, 0.8);
    g.strokeRect(4, 34, 24, 48);
  });

  // Energy Bridge Hard-Light Beam
  forge(scene, 'platform_l2_energy_bridge_beam', 240, 24, (g) => {
    g.fillStyle(0xff243d, 0.75);
    g.fillRect(0, 4, 240, 16);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(0, 10, 240, 4);
    g.lineStyle(1.5, 0xff5a1f, 0.85);
    g.strokeRect(0, 4, 240, 16);
  });

  // 4. Stage 4 — The Entropy Vault: Near-black containment alloy
  forge(scene, 'platform_l2_vault', W, H, (g) => {
    bandRect(g, 0, 0, W, solidBottom, 0x161014, 0x080507, 20);

    for (let px = 24; px < W; px += 36) {
      path(g, [{ x: px, y: 14 }, { x: px, y: solidBottom }], 0x050304, 0.9, 2);
    }
    // Restrained amber warning lights
    for (let i = 0; i < 4; i++) {
      const lx = 32 + i * 56;
      g.fillStyle(0xd97706, 0.85);
      g.fillRect(lx, 30, 8, 4);
      g.lineStyle(1, 0xb45309, 0.9);
      g.strokeRect(lx, 30, 8, 4);
    }

    // Heavy containment bottom blocks
    for (let i = 0; i < 3; i++) {
      const cx = (W / 3) * (i + 0.5);
      poly(g, [{ x: cx - 18, y: solidBottom - 4 }, { x: cx + 18, y: solidBottom - 4 }, { x: cx + 12, y: solidBottom + 16 }, { x: cx - 12, y: solidBottom + 16 }], 0x080406, 1);
    }

    // Landing lip: heavy matte dark titanium with restrained amber security status seam
    bandRect(g, 0, 0, W, 13, 0x33222a, 0x161014, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xd97706, 0.8, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0xff243d, 0.6, 1.5);
  });

  // 5. Stage 5 — The Entropy Nexus: Nexus obsidian core plates & molten channels
  forge(scene, 'platform_l2_nexus', W, H, (g) => {
    const r = seeded(2505);
    bandRect(g, 0, 0, W, solidBottom, 0x1c060d, 0x080104, 20);

    // Surging molten-crimson energy channels
    for (let v = 0; v < 2; v++) {
      const pts: Vec[] = [];
      for (let px = 0; px <= W; px += 16) {
        pts.push({ x: px, y: 24 + v * 18 + Math.sin((px / W) * Math.PI * 4 + v) * 5 });
      }
      path(g, pts, 0xff243d, 0.85, 3.5);
      path(g, pts, 0xff5a1f, 0.7, 1.5);
    }

    // Suspended nexus shards below
    let x = 8;
    while (x < W - 10) {
      const chunkW = rand(r, 24, 46);
      const drop = rand(r, 12, 24);
      poly(g, [{ x, y: solidBottom - 4 }, { x: x + chunkW * 0.4, y: solidBottom + drop }, { x: x + chunkW, y: solidBottom - 4 }], 0x080103, 0.95);
      x += chunkW + rand(r, 8, 18);
    }

    // Landing lip: intense molten crimson-ember edge
    bandRect(g, 0, 0, W, 13, 0x5a1220, 0x1c060d, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xff5a1f, 0.9, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0xff243d, 0.85, 2);
  });

  // 6. Stage 6 — The Last Warden: Boss arena dark reinforced flooring with blood-red runes
  forge(scene, 'platform_l2_arena', W, H, (g) => {
    bandRect(g, 0, 0, W, solidBottom, 0x1f080e, 0x090204, 20);

    // Central blood-red rune runnels
    for (let px = 20; px < W; px += 42) {
      path(g, [{ x: px, y: 18 }, { x: px + 10, y: 32 }, { x: px, y: 46 }], 0xff1e38, 0.75, 2.5);
      path(g, [{ x: px, y: 18 }, { x: px + 10, y: 32 }, { x: px, y: 46 }], 0xff5a1f, 0.4, 1);
    }

    // Heavy framing pillar brackets
    for (let i = 0; i < 4; i++) {
      const bx = (W / 4) * (i + 0.5);
      poly(g, [{ x: bx - 14, y: solidBottom - 4 }, { x: bx + 14, y: solidBottom - 4 }, { x: bx + 8, y: solidBottom + 20 }, { x: bx - 8, y: solidBottom + 20 }], 0x0e0205, 1);
      g.fillStyle(0xff243d, 0.8);
      g.fillCircle(bx, solidBottom + 10, 2.5);
    }

    // Landing lip: polished dark crimson steel with intense blood-red energy rim
    bandRect(g, 0, 0, W, 13, 0x4d121c, 0x1f080e, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xff243d, 0.95, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x8a1524, 0.8, 2);
  });

  // Arena Boundary Wall / Impassable Portcullis
  forge(scene, 'platform_l2_arena_wall', 48, 380, (g) => {
    bandRect(g, 0, 0, 48, 380, 0x1a080d, 0x080204, 25);
    for (let py = 20; py < 380; py += 38) {
      poly(g, [{ x: 6, y: py }, { x: 24, y: py + 12 }, { x: 42, y: py }, { x: 24, y: py + 18 }], 0xff243d, 0.7);
    }
    g.lineStyle(2, 0x4a141e, 0.9);
    g.strokeRect(2, 2, 44, 376);
  });
}

/**
 * Level 3: The Verdant Abyss Dedicated Architectural Material Suite.
 * Replaces generic floating slabs with massive living root pathways,
 * curved canopy walkways, hollow tree interior colossus decks, ivory sanctuary causeways,
 * biological elevators, Rootline traversal anchors, and the Worldseed Guardian boss arena.
 */
function buildLevel3Materials(scene: Phaser.Scene) {
  const W = 256;
  const H = 80;
  const solidBottom = 54;

  // 1. Stage 1 — The Living Threshold: Massive living root bridge with emerald vascular veins
  forge(scene, 'platform_l3_root', W, H, (g) => {
    const r = seeded(3101);
    bandRect(g, 0, 0, W, solidBottom, 0x152219, 0x08110b, 20);

    // Twisting organic root grain and bark fibers
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      const y = 14 + r() * (solidBottom - 22);
      poly(
        g,
        [
          { x, y },
          { x: x + rand(r, 16, 44), y: y + rand(r, -6, 6) },
          { x: x + rand(r, 10, 32), y: y + rand(r, 6, 20) },
        ],
        r() > 0.4 ? 0x0c170f : 0x060e08,
        0.85
      );
    }

    // Bioluminescent emerald vascular sap channels
    for (let v = 0; v < 2; v++) {
      const pts: Vec[] = [];
      for (let px = 0; px <= W; px += 18) {
        pts.push({ x: px, y: 22 + v * 18 + Math.sin((px / W) * Math.PI * 3 + v * 1.5) * 6 });
      }
      path(g, pts, 0x10b981, 0.75, 2.5);
      path(g, pts, 0x6ee7b7, 0.5, 1);
    }

    // Hanging fibrous root tendrils below
    let x = 6;
    while (x < W - 10) {
      const chunkW = rand(r, 18, 40);
      const drop = rand(r, 12, 26);
      poly(
        g,
        [
          { x, y: solidBottom - 4 },
          { x: x + chunkW * 0.4, y: solidBottom + drop },
          { x: x + chunkW * 0.8, y: solidBottom + drop * 0.7 },
          { x: x + chunkW, y: solidBottom - 4 },
        ],
        0x071009,
        0.95
      );
      x += chunkW + rand(r, 8, 16);
    }

    // Landing lip: pale ivory mineral cap with vibrant emerald bio-edge
    bandRect(g, 0, 0, W, 13, 0x223528, 0x152219, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0x6ee7b7, 0.9, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x10b981, 0.8, 2);
  });

  // Vertical Root Support Pier (Grounding Root Trunk)
  forge(scene, 'platform_l3_root_pier', 96, 260, (g) => {
    bandRect(g, 0, 0, 96, 260, 0x111c14, 0x070e0a, 20);
    for (let py = 16; py < 260; py += 30) {
      path(g, [{ x: 4, y: py }, { x: 92, y: py }], 0x050a07, 0.9, 2);
      path(g, [{ x: 4, y: py }, { x: 92, y: py }], 0x10b981, 0.35, 1);
    }
    // Vertical vascular sap line
    path(g, [{ x: 48, y: 0 }, { x: 48, y: 260 }], 0x10b981, 0.6, 2);
    g.lineStyle(2, 0x1b2e21, 0.9);
    g.strokeRect(2, 2, 92, 256);
  });

  // 2. Stage 2 — The Verdant Wilds: High canopy branch with bone struts & emerald foliage
  forge(scene, 'platform_l3_canopy', W, H, (g) => {
    const r = seeded(3202);
    bandRect(g, 0, 0, W, solidBottom, 0x19271c, 0x0b150d, 20);

    // Pale ivory bone rib struts
    for (let px = 28; px < W; px += 44) {
      poly(
        g,
        [
          { x: px - 8, y: 14 },
          { x: px + 8, y: 14 },
          { x: px + 4, y: solidBottom },
          { x: px - 4, y: solidBottom },
        ],
        0xede9d0,
        0.85
      );
    }

    // Emerald leaf membrane accents below
    for (let i = 0; i < 3; i++) {
      const lx = W * (0.2 + i * 0.3);
      poly(
        g,
        [
          { x: lx - 14, y: solidBottom - 4 },
          { x: lx + 14, y: solidBottom - 4 },
          { x: lx, y: solidBottom + 20 },
        ],
        0x059669,
        0.85
      );
    }

    // Landing lip: pale ivory bone surface with jade leaf trim
    bandRect(g, 0, 0, W, 13, 0xede9d0, 0xd8d3b8, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xffffff, 0.95, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x10b981, 0.85, 2);
  });

  // Diagonal Ivory Canopy Strut
  forge(scene, 'platform_l3_canopy_strut', 48, 240, (g) => {
    bandRect(g, 0, 0, 48, 240, 0xede9d0, 0xbbb599, 15);
    g.lineStyle(2, 0x10b981, 0.7);
    g.strokeRect(2, 2, 44, 236);
    for (let py = 20; py < 240; py += 32) {
      g.fillStyle(0x10b981, 0.8);
      g.fillCircle(24, py, 3);
    }
  });

  // 3. Stage 3 — The Hollow Colossus: Biomechanical hollow tree interior deck
  forge(scene, 'platform_l3_colossus_floor', W, H, (g) => {
    const r = seeded(3303);
    bandRect(g, 0, 0, W, solidBottom, 0x141b16, 0x070c09, 20);

    // Data-sap conduit channels
    for (let px = 24; px < W; px += 36) {
      path(g, [{ x: px, y: 14 }, { x: px, y: solidBottom }], 0x040806, 0.95, 2);
    }
    // Intertwined root cable conduits
    path(g, [{ x: 0, y: 32 }, { x: W, y: 32 }], 0x10b981, 0.7, 2.5);

    // Amber warning node sockets
    for (let i = 0; i < 4; i++) {
      const nx = 36 + i * 56;
      g.fillStyle(0xf59e0b, 0.85);
      g.fillRect(nx, 24, 8, 4);
      g.lineStyle(1, 0xd97706, 0.9);
      g.strokeRect(nx, 24, 8, 4);
    }

    // Heavy internal trunk foundation brackets
    for (let i = 0; i < 3; i++) {
      const cx = (W / 3) * (i + 0.5);
      poly(
        g,
        [
          { x: cx - 16, y: solidBottom - 4 },
          { x: cx + 16, y: solidBottom - 4 },
          { x: cx + 10, y: solidBottom + 18 },
          { x: cx - 10, y: solidBottom + 18 },
        ],
        0x09120b,
        1
      );
    }

    // Landing lip: dark charcoal alloy with bright emerald data seam
    bandRect(g, 0, 0, W, 13, 0x243328, 0x141b16, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0x34d399, 0.9, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0xf59e0b, 0.7, 1.5);
  });

  // Hollow Colossus Curved Rib Wall
  forge(scene, 'platform_l3_colossus_wall', 56, 380, (g) => {
    bandRect(g, 0, 0, 56, 380, 0x121a14, 0x060c08, 25);
    for (let py = 20; py < 380; py += 36) {
      poly(
        g,
        [
          { x: 8, y: py },
          { x: 28, y: py + 12 },
          { x: 48, y: py },
          { x: 28, y: py + 18 },
        ],
        0x10b981,
        0.75
      );
    }
    g.lineStyle(2, 0x223826, 0.9);
    g.strokeRect(2, 2, 52, 376);
  });

  // 4. Stage 4 — The Heartroot Sanctuary: Cathedral ivory causeway with emerald conduits
  forge(scene, 'platform_l3_sanctuary', W, H, (g) => {
    const r = seeded(3404);
    bandRect(g, 0, 0, W, solidBottom, 0x223126, 0x0d1710, 20);

    // Sacred ivory paving blocks
    for (let px = 20; px < W; px += 40) {
      poly(
        g,
        [
          { x: px - 16, y: 14 },
          { x: px + 16, y: 14 },
          { x: px + 12, y: solidBottom },
          { x: px - 12, y: solidBottom },
        ],
        0xede9d0,
        0.8
      );
    }

    // Sacred heartroot energy conduit running along center
    path(g, [{ x: 0, y: 28 }, { x: W, y: 28 }], 0x10b981, 0.9, 3);
    path(g, [{ x: 0, y: 28 }, { x: W, y: 28 }], 0xffffff, 0.7, 1.5);

    // Ivory corbel arches below
    for (let i = 0; i < 4; i++) {
      const cx = (W / 4) * (i + 0.5);
      poly(
        g,
        [
          { x: cx - 12, y: solidBottom - 4 },
          { x: cx + 12, y: solidBottom - 4 },
          { x: cx, y: solidBottom + 22 },
        ],
        0xd8d3b8,
        0.95
      );
    }

    // Landing lip: polished ivory stone with radiant emerald aura seam
    bandRect(g, 0, 0, W, 13, 0xede9d0, 0xd5d0b4, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xffffff, 1, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x10b981, 0.9, 2);
  });

  // 5. Stage 5 — The Biosphere Crucible: Seed pod approach with braided gold & emerald lines
  forge(scene, 'platform_l3_crucible', W, H, (g) => {
    const r = seeded(3505);
    bandRect(g, 0, 0, W, solidBottom, 0x18241b, 0x09110b, 20);

    // Converging golden energy veins
    for (let v = 0; v < 2; v++) {
      const pts: Vec[] = [];
      for (let px = 0; px <= W; px += 16) {
        pts.push({ x: px, y: 22 + v * 18 + Math.sin((px / W) * Math.PI * 4 + v) * 5 });
      }
      path(g, pts, 0xf59e0b, 0.85, 3);
      path(g, pts, 0x10b981, 0.6, 1.5);
    }

    // Heavy seed pod ribbing underneath
    let x = 8;
    while (x < W - 10) {
      const chunkW = rand(r, 22, 44);
      const drop = rand(r, 14, 24);
      poly(
        g,
        [
          { x, y: solidBottom - 4 },
          { x: x + chunkW * 0.5, y: solidBottom + drop },
          { x: x + chunkW, y: solidBottom - 4 },
        ],
        0x08100a,
        0.95
      );
      x += chunkW + rand(r, 8, 18);
    }

    // Landing lip: polished dark jade with golden amber energy rim
    bandRect(g, 0, 0, W, 13, 0x2a3e2e, 0x18241b, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xf59e0b, 0.95, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x10b981, 0.85, 2);
  });

  // 6. Stage 6 — The Worldseed Guardian: Boss arena expansive ivory battle floor
  forge(scene, 'platform_l3_arena', W, H, (g) => {
    const r = seeded(3606);
    bandRect(g, 0, 0, W, solidBottom, 0x1c2920, 0x0c1610, 20);

    // Expansive ivory stone slabs matching level-3-stage6.png
    for (let px = 24; px < W; px += 48) {
      poly(
        g,
        [
          { x: px - 20, y: 14 },
          { x: px + 20, y: 14 },
          { x: px + 16, y: solidBottom },
          { x: px - 16, y: solidBottom },
        ],
        0xede9d0,
        0.85
      );
      // Golden circuit veins embedded in the floor
      path(g, [{ x: px, y: 14 }, { x: px, y: solidBottom }], 0xf59e0b, 0.8, 2);
    }

    // Massive framing ivory roots below
    for (let i = 0; i < 4; i++) {
      const bx = (W / 4) * (i + 0.5);
      poly(
        g,
        [
          { x: bx - 16, y: solidBottom - 4 },
          { x: bx + 16, y: solidBottom - 4 },
          { x: bx + 10, y: solidBottom + 22 },
          { x: bx - 10, y: solidBottom + 22 },
        ],
        0x121c15,
        1
      );
      g.fillStyle(0x10b981, 0.8);
      g.fillCircle(bx, solidBottom + 12, 3);
    }

    // Landing lip: pristine ivory finish with golden core and emerald rim
    bandRect(g, 0, 0, W, 13, 0xede9d0, 0xd8d3b8, 8);
    path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0xf59e0b, 0.95, 2);
    path(g, [{ x: 0, y: 13 }, { x: W, y: 13 }], 0x10b981, 0.9, 2);
  });

  // Worldseed Guardian Arena Arched Bone Wall (matching framing in level-3-stage6.png)
  forge(scene, 'platform_l3_arena_wall', 54, 380, (g) => {
    bandRect(g, 0, 0, 54, 380, 0xede9d0, 0xd0cab0, 25);
    for (let py = 20; py < 380; py += 36) {
      poly(
        g,
        [
          { x: 8, y: py },
          { x: 27, y: py + 12 },
          { x: 46, y: py },
          { x: 27, y: py + 18 },
        ],
        0xf59e0b,
        0.75
      );
    }
    g.lineStyle(2, 0x10b981, 0.85);
    g.strokeRect(2, 2, 50, 376);
  });

  // Biological Membrane Barrier (dissolves when overcharge terminal activates)
  forge(scene, 'platform_l3_membrane', 40, 240, (g) => {
    bandRect(g, 0, 0, 40, 240, 0x059669, 0x022c22, 15);
    g.fillStyle(0x34d399, 0.35);
    g.fillRect(4, 4, 32, 232);
    for (let py = 16; py < 240; py += 24) {
      g.fillStyle(0x6ee7b7, 0.8);
      g.fillCircle(20, py, 4);
      g.lineStyle(1.5, 0x10b981, 0.7);
      g.strokeCircle(20, py, 9);
    }
  });

  // ---------------------------------------------------------------------------
  // ROOTLINE ANCHOR PROPS & ENVIRONMENTAL NODES
  // ---------------------------------------------------------------------------

  // 1. Rootline Pull Anchor Node: bioluminescent green spore bulb
  forge(scene, 'rootline_anchor_pull', 48, 48, (g) => {
    // Outer root petal frame
    g.fillStyle(0x064e3b, 0.9);
    g.fillCircle(24, 24, 22);
    g.lineStyle(2, 0x10b981, 0.9);
    g.strokeCircle(24, 24, 22);

    // Glowing core bulb
    g.fillStyle(0x10b981, 0.95);
    g.fillCircle(24, 24, 13);
    g.fillStyle(0x00f0ff, 0.9);
    g.fillCircle(24, 24, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 24, 3);
  });

  // 2. Rootline Launch Bulb: kinetic upward bio-spore bulb
  forge(scene, 'rootline_anchor_launch', 64, 32, (g) => {
    // Ivory base bracket
    g.fillStyle(0xede9d0, 1);
    g.fillRect(4, 16, 56, 14);
    g.lineStyle(1.5, 0x10b981, 0.9);
    g.strokeRect(4, 16, 56, 14);

    // Kinetic bulb plate
    g.fillStyle(0x10b981, 0.9);
    g.fillRect(10, 8, 44, 8);
    for (let i = 0; i < 3; i++) {
      const cx = 20 + i * 12;
      poly(g, [{ x: cx - 4, y: 22 }, { x: cx, y: 14 }, { x: cx + 4, y: 22 }], 0xffffff, 0.9);
    }
  });

  // 3. Rootline Transfer Anchor: tendril swing loop
  forge(scene, 'rootline_anchor_transfer', 48, 48, (g) => {
    g.fillStyle(0x064e3b, 0.85);
    g.fillCircle(24, 24, 20);
    g.lineStyle(2.5, 0x34d399, 0.95);
    g.strokeCircle(24, 24, 18);
    g.fillStyle(0x10b981, 0.9);
    g.fillCircle(24, 24, 8);
  });

  // 4. Environmental Bloom Node: crystalline blossom node
  forge(scene, 'rootline_anchor_env', 52, 52, (g) => {
    // Ivory base petal ring
    poly(
      g,
      [
        { x: 26, y: 2 },
        { x: 42, y: 12 },
        { x: 50, y: 26 },
        { x: 42, y: 40 },
        { x: 26, y: 50 },
        { x: 10, y: 40 },
        { x: 2, y: 26 },
        { x: 10, y: 12 },
      ],
      0xede9d0,
      1
    );
    g.lineStyle(2, 0x10b981, 0.9);
    g.strokeCircle(26, 26, 20);

    // Pulsing crystalline blossom center
    g.fillStyle(0xf59e0b, 0.9);
    g.fillCircle(26, 26, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(26, 26, 4);
  });

  // 5. Spore Cloud Hazard Emitter
  forge(scene, 'spore_cloud_hazard', 96, 44, (g) => {
    const r = seeded(3707);
    g.fillStyle(0x062b1e, 0.95);
    g.fillEllipse(48, 30, 92, 26);
    for (let i = 0; i < 14; i++) {
      g.fillStyle(r() > 0.5 ? 0x10b981 : 0x84cc16, 0.35 + r() * 0.45);
      g.fillEllipse(r() * 96, 16 + r() * 20, 10 + r() * 22, 6 + r() * 12);
    }
    for (let i = 0; i < 5; i++) {
      const cx = r() * 96;
      path(g, [{ x: cx, y: 32 }, { x: cx + rand(r, -4, 4), y: 8 + r() * 10 }], 0x6ee7b7, 0.6, 1.5);
    }
  });
}

/* ---------------------------------------------------------------------------
   Entry point
   --------------------------------------------------------------------------- */

/** Generate every texture for a single realm. */
export function buildRealm(scene: Phaser.Scene, env: RealmEnvironment) {
  skyTexture(scene, env);
  layerTextures(scene, env);
  platformTexture(scene, env);
}

/** Generate textures for all six realms. */
export function buildAllRealms(scene: Phaser.Scene) {
  Object.values(REALMS).forEach((env) => buildRealm(scene, env));
  buildLevel2Materials(scene);
  buildLevel3Materials(scene);
}

