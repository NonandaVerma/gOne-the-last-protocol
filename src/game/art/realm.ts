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
}
