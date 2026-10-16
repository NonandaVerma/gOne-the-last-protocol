import * as Phaser from 'phaser';
import { ACCENT, ATMOSPHERE, HERO, VILLAIN } from './palette';
import {
  Gfx,
  Vec,
  poly,
  outline,
  path,
  mix,
  shade,
  bloom,
  bandRect,
  forge,
  seeded,
  Rng,
  rand,
  randInt,
  speckle,
  bolt,
  regularPoly,
} from './draw';

/**
 * Arena art: seamless parallax strips, platform surfaces and ground materials.
 *
 * All horizontally scrolling layers are built from *periodic* functions (sums of
 * sine waves whose frequencies are whole numbers over the strip width), so they
 * tile without a visible seam no matter how far the camera travels.
 */

export const LAYER_W = 1536;
export const SKY_W = 1280;
export const SKY_H = 720;

/** Build a periodic height function that is guaranteed to wrap seamlessly. */
function ridgeFn(r: Rng, width: number, bands: Array<[number, number]>) {
  const phases = bands.map(() => r() * Math.PI * 2);
  return (x: number) => {
    let sum = 0;
    bands.forEach(([freq, amp], i) => {
      sum += amp * Math.sin((2 * Math.PI * freq * x) / width + phases[i]);
    });
    return sum;
  };
}

/** Fill a silhouette under a periodic ridge line. */
function ridgeBand(
  g: Gfx,
  width: number,
  height: number,
  baseY: number,
  fn: (x: number) => number,
  color: number,
  step = 12,
  rimColor?: number,
  rimAlpha = 0.5
) {
  const pts: Vec[] = [];
  for (let x = 0; x <= width; x += step) pts.push({ x, y: baseY + fn(x) });
  const shape = [...pts, { x: width, y: height }, { x: 0, y: height }];
  poly(g, shape, color, 1);
  if (rimColor !== undefined) path(g, pts, rimColor, rimAlpha, 2);
}

// ---------------------------------------------------------------------------

function skyTexture(scene: Phaser.Scene, key: string, level: 1 | 2 | 3) {
  forge(scene, key, SKY_W, SKY_H, (g) => {
    const a = ATMOSPHERE[level];
    bandRect(g, 0, 0, SKY_W, SKY_H * 0.55, a.skyTop, a.skyMid, 40);
    bandRect(g, 0, SKY_H * 0.55 - 1, SKY_W, SKY_H * 0.45 + 1, a.skyMid, a.skyLow, 40);

    const r = seeded(level * 101 + 7);

    if (level === 1) {
      // Volcanic glow dome on the horizon plus churning ash clouds.
      bloom(g, SKY_W * 0.62, SKY_H * 0.92, 620, a.haze, 0.3, 9);
      bloom(g, SKY_W * 0.2, SKY_H * 0.98, 420, ACCENT.magma, 0.18, 8);
      for (let i = 0; i < 26; i++) {
        const cx = r() * SKY_W;
        const cy = r() * SKY_H * 0.52;
        const rr = 60 + r() * 150;
        g.fillStyle(mix(a.skyTop, 0x000000, 0.35), 0.1 + r() * 0.12);
        g.fillCircle(cx, cy, rr);
      }
    } else if (level === 2) {
      // Starfield + cold city uplight.
      for (let i = 0; i < 180; i++) {
        const sx = r() * SKY_W;
        const sy = r() * SKY_H * 0.7;
        const s = r();
        g.fillStyle(s > 0.85 ? 0xbfdcff : 0xe8f1ff, 0.25 + r() * 0.6);
        g.fillCircle(sx, sy, s > 0.92 ? 1.8 : 1);
      }
      bloom(g, SKY_W * 0.5, SKY_H * 1.02, 700, a.haze, 0.2, 9);
      bloom(g, SKY_W * 0.78, SKY_H * 0.95, 380, VILLAIN.energy, 0.12, 8);
      for (let i = 0; i < 14; i++) {
        g.fillStyle(0x0b1430, 0.22);
        g.fillEllipse(r() * SKY_W, SKY_H * 0.18 + r() * SKY_H * 0.3, 300 + r() * 420, 60 + r() * 70);
      }
    } else {
      // The abyss: a black void lit only by two opposing singularities.
      bloom(g, SKY_W * 0.26, SKY_H * 0.42, 460, HERO.energy, 0.1, 9);
      bloom(g, SKY_W * 0.76, SKY_H * 0.46, 460, VILLAIN.energy, 0.1, 9);
      for (let i = 0; i < 120; i++) {
        g.fillStyle(r() > 0.5 ? HERO.energy : VILLAIN.energy, 0.08 + r() * 0.18);
        g.fillRect(r() * SKY_W, r() * SKY_H, 1 + r() * 2, 1 + r() * 2);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Level 1 — The Infernal Arena
// ---------------------------------------------------------------------------

function infernalLayers(scene: Phaser.Scene) {
  const a = ATMOSPHERE[1];

  forge(scene, 'far_1', LAYER_W, 420, (g) => {
    const r = seeded(11);
    const fn = ridgeFn(r, LAYER_W, [
      [1, 54],
      [2, 30],
      [3, 18],
      [5, 10],
    ]);
    ridgeBand(g, LAYER_W, 420, 210, fn, a.silhouetteFar, 10, ACCENT.magma, 0.3);
    // Distant eruption plumes.
    for (let i = 0; i < 4; i++) {
      const x = 180 + i * 360 + rand(r, -60, 60);
      const y = 210 + fn(x);
      bloom(g, x, y, 90, ACCENT.magma, 0.3, 7);
      poly(
        g,
        [
          { x: x - 16, y },
          { x: x + 16, y },
          { x: x + 6, y: y - 120 },
          { x: x - 8, y: y - 150 },
        ],
        mix(ACCENT.magma, a.silhouetteFar, 0.55),
        0.5
      );
    }
  });

  forge(scene, 'mid_1', LAYER_W, 480, (g) => {
    const r = seeded(23);
    const fn = ridgeFn(r, LAYER_W, [
      [2, 36],
      [3, 22],
      [6, 12],
    ]);
    ridgeBand(g, LAYER_W, 480, 260, fn, a.silhouette, 8);

    // Industrial fortress blocks with furnace windows.
    for (let i = 0; i < 7; i++) {
      const bx = 60 + i * 210 + randInt(r, -24, 24);
      const bw = randInt(r, 80, 150);
      const bh = randInt(r, 130, 250);
      const by = 250 + fn(bx) - bh;
      g.fillStyle(shade(a.silhouette, -0.3), 1);
      g.fillRect(bx, by, bw, bh + 240);
      // Roof mass.
      poly(
        g,
        [
          { x: bx - 10, y: by },
          { x: bx + bw * 0.5, y: by - 34 },
          { x: bx + bw + 10, y: by },
        ],
        shade(a.silhouette, -0.45),
        1
      );
      // Stack.
      g.fillStyle(shade(a.silhouette, -0.5), 1);
      g.fillRect(bx + bw * 0.72, by - 90, 16, 96);
      bloom(g, bx + bw * 0.8, by - 92, 40, ACCENT.magma, 0.3, 5);

      for (let row = 0; row < Math.floor(bh / 34); row++) {
        for (let col = 0; col < Math.floor(bw / 30); col++) {
          if (r() > 0.45) continue;
          g.fillStyle(r() > 0.6 ? ACCENT.emberHot : ACCENT.ember, 0.45 + r() * 0.5);
          g.fillRect(bx + 10 + col * 30, by + 16 + row * 34, 13, 9);
        }
      }
    }
    speckle(g, 0, 240, LAYER_W, 240, ACCENT.magma, 120, r, 0.07, 2);
  });

  forge(scene, 'near_1', LAYER_W, 320, (g) => {
    const r = seeded(37);
    const fn = ridgeFn(r, LAYER_W, [
      [3, 22],
      [5, 14],
      [9, 7],
    ]);
    ridgeBand(g, LAYER_W, 320, 150, fn, 0x070102, 7, ACCENT.magma, 0.45);
    // Broken pylons leaning out of the rock.
    for (let i = 0; i < 9; i++) {
      const x = 70 + i * 165 + rand(r, -30, 30);
      const y = 150 + fn(x);
      const h = rand(r, 50, 120);
      const tilt = rand(r, -18, 18);
      poly(
        g,
        [
          { x: x - 7, y },
          { x: x + 7, y },
          { x: x + 4 + tilt, y: y - h },
          { x: x - 4 + tilt, y: y - h },
        ],
        0x120305,
        1
      );
      path(g, [{ x: x - 2, y }, { x: x + tilt, y: y - h }], ACCENT.magma, 0.5, 1.6);
    }
  });

  // Molten river surface.
  forge(scene, 'lava_surface', 512, 128, (g) => {
    const r = seeded(59);
    bandRect(g, 0, 0, 512, 128, 0xffd36b, 0x5e0b05, 24);
    g.fillStyle(ACCENT.magma, 0.85);
    g.fillRect(0, 10, 512, 118);
    bandRect(g, 0, 0, 512, 22, 0xfff3c4, ACCENT.magma, 10);
    // Cooled crust islands.
    for (let i = 0; i < 26; i++) {
      const x = r() * 512;
      const y = 14 + r() * 96;
      const w = 20 + r() * 70;
      const h = 6 + r() * 16;
      g.fillStyle(0x24090a, 0.85);
      g.fillEllipse(x, y, w, h);
      path(g, [{ x: x - w / 2, y: y - h / 2 }, { x: x + w / 2, y: y - h / 2 }], ACCENT.emberHot, 0.5, 1.4);
    }
    // Flow striations.
    for (let i = 0; i < 10; i++) {
      const y = 20 + i * 11;
      path(
        g,
        [
          { x: 0, y },
          { x: 170, y: y + Math.sin(i) * 5 },
          { x: 340, y: y - Math.sin(i) * 5 },
          { x: 512, y },
        ],
        ACCENT.emberHot,
        0.18,
        2
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Level 2 — The Fallen Metropolis
// ---------------------------------------------------------------------------

function metropolisLayers(scene: Phaser.Scene) {
  const a = ATMOSPHERE[2];

  const towers = (
    g: Gfx,
    r: Rng,
    count: number,
    baseY: number,
    minH: number,
    maxH: number,
    color: number,
    litChance: number,
    winScale: number
  ) => {
    const gap = LAYER_W / count;
    for (let i = 0; i < count; i++) {
      const bw = gap * rand(r, 0.52, 0.92);
      const bx = i * gap + (gap - bw) / 2;
      const bh = rand(r, minH, maxH);
      const by = baseY - bh;
      g.fillStyle(color, 1);
      g.fillRect(bx, by, bw, bh + 400);
      // Setback crown.
      g.fillStyle(shade(color, -0.25), 1);
      g.fillRect(bx + bw * 0.2, by - 26, bw * 0.6, 28);
      // Antenna + beacon.
      g.fillStyle(shade(color, 0.2), 1);
      g.fillRect(bx + bw * 0.48, by - 64, 3, 40);
      g.fillStyle(r() > 0.5 ? VILLAIN.energy : HERO.energy, 0.9);
      g.fillCircle(bx + bw * 0.5, by - 64, 2.6);

      const cols = Math.max(2, Math.floor(bw / (22 * winScale)));
      const rows = Math.max(3, Math.floor(bh / (26 * winScale)));
      for (let c = 0; c < cols; c++) {
        for (let w = 0; w < rows; w++) {
          if (r() > litChance) continue;
          const hot = r();
          g.fillStyle(hot > 0.86 ? VILLAIN.energy : hot > 0.4 ? HERO.energy : 0xa7c8e8, 0.25 + r() * 0.6);
          g.fillRect(
            bx + 7 + c * 22 * winScale,
            by + 16 + w * 26 * winScale,
            10 * winScale,
            8 * winScale
          );
        }
      }
    }
  };

  forge(scene, 'far_2', LAYER_W, 460, (g) => {
    const r = seeded(71);
    towers(g, r, 22, 430, 170, 400, a.silhouetteFar, 0.26, 0.7);
    g.fillStyle(a.skyLow, 0.35);
    g.fillRect(0, 300, LAYER_W, 160);
  });

  forge(scene, 'mid_2', LAYER_W, 520, (g) => {
    const r = seeded(83);
    towers(g, r, 13, 500, 230, 460, a.silhouette, 0.4, 1);

    // Neon billboards bolted to the facades.
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 240 + rand(r, -40, 40);
      const y = 120 + r() * 180;
      const w = rand(r, 50, 110);
      const h = rand(r, 26, 90);
      const col = r() > 0.5 ? 0xff2f8f : HERO.energy;
      bloom(g, x + w / 2, y + h / 2, Math.max(w, h) * 1.4, col, 0.3, 6);
      g.fillStyle(col, 0.16);
      g.fillRect(x, y, w, h);
      g.lineStyle(2.4, col, 0.95);
      g.strokeRect(x, y, w, h);
      for (let l = 0; l < Math.floor(h / 14); l++) {
        path(
          g,
          [
            { x: x + 8, y: y + 10 + l * 14 },
            { x: x + w - 8 - r() * 20, y: y + 10 + l * 14 },
          ],
          col,
          0.75,
          3
        );
      }
    }
  });

  forge(scene, 'near_2', LAYER_W, 340, (g) => {
    const r = seeded(97);
    // Elevated highway deck with broken spans.
    const deckY = 120;
    for (let seg = 0; seg < 8; seg++) {
      const x = seg * (LAYER_W / 8);
      const w = LAYER_W / 8 - (seg % 3 === 1 ? 70 : 6);
      g.fillStyle(0x0c1220, 1);
      g.fillRect(x, deckY, w, 30);
      g.fillStyle(0x161f33, 1);
      g.fillRect(x, deckY, w, 8);
      path(g, [{ x, y: deckY - 2 }, { x: x + w, y: deckY - 2 }], HERO.energy, 0.75, 2.4);
      path(g, [{ x, y: deckY - 2 }, { x: x + w, y: deckY - 2 }], HERO.energy, 0.18, 8);
      // Pillars.
      if (seg % 2 === 0) {
        g.fillStyle(0x090e1a, 1);
        g.fillRect(x + w * 0.4, deckY + 30, 34, 300);
      }
      // Hanging rebar at a fracture.
      if (seg % 3 === 1) {
        for (let k = 0; k < 4; k++) {
          path(
            g,
            [
              { x: x + w, y: deckY + 6 + k * 4 },
              { x: x + w + 10 + r() * 16, y: deckY + 26 + r() * 20 },
            ],
            0x3b4a5e,
            0.8,
            1.4
          );
        }
      }
    }
    // Low drifting smog.
    for (let i = 0; i < 16; i++) {
      g.fillStyle(0x121a30, 0.14);
      g.fillEllipse(r() * LAYER_W, 230 + r() * 100, 240 + r() * 300, 50 + r() * 50);
    }
  });
}

// ---------------------------------------------------------------------------
// Level 3 — The Zero-Day Abyss
// ---------------------------------------------------------------------------

function abyssLayers(scene: Phaser.Scene) {
  forge(scene, 'far_3', LAYER_W, 480, (g) => {
    const r = seeded(131);
    // Vast broken rings hanging in the void.
    for (let i = 0; i < 5; i++) {
      const x = 140 + i * 300 + rand(r, -60, 60);
      const y = 120 + r() * 220;
      const rad = 60 + r() * 110;
      const col = i % 2 === 0 ? HERO.energy : VILLAIN.energy;
      g.lineStyle(3, col, 0.2);
      g.strokeCircle(x, y, rad);
      g.lineStyle(1.4, col, 0.3);
      g.strokeCircle(x, y, rad * 0.62);
      outline(g, regularPoly(x, y, rad * 0.8, 6, r() * 3), col, 0.16, 2);
    }
    // Drifting fragments of the earlier arenas.
    for (let i = 0; i < 26; i++) {
      const x = r() * LAYER_W;
      const y = r() * 460;
      const w = 18 + r() * 60;
      const h = 6 + r() * 20;
      g.fillStyle(0x060a16, 0.95);
      g.fillRect(x, y, w, h);
      g.lineStyle(1, r() > 0.5 ? HERO.energy : VILLAIN.energy, 0.3);
      g.strokeRect(x, y, w, h);
    }
  });

  forge(scene, 'mid_3', LAYER_W, 520, (g) => {
    const r = seeded(149);
    // Circuit trace plane.
    for (let i = 0; i < 46; i++) {
      let x = r() * LAYER_W;
      let y = r() * 520;
      const col = r() > 0.55 ? VILLAIN.energy : HERO.energy;
      const pts: Vec[] = [{ x, y }];
      for (let s = 0; s < 4; s++) {
        if (s % 2 === 0) x += rand(r, -120, 160);
        else y += rand(r, -90, 90);
        pts.push({ x, y });
      }
      path(g, pts, col, 0.14, 2);
      g.fillStyle(col, 0.4);
      g.fillCircle(pts[pts.length - 1].x, pts[pts.length - 1].y, 2.4);
    }
    // Energy pillars rising from below.
    for (let i = 0; i < 7; i++) {
      const x = 90 + i * 210 + rand(r, -40, 40);
      const col = i % 2 === 0 ? HERO.energy : VILLAIN.energy;
      g.fillStyle(col, 0.05);
      g.fillRect(x - 16, 0, 32, 520);
      path(g, [{ x, y: 0 }, { x, y: 520 }], col, 0.28, 2);
    }
  });

  forge(scene, 'near_3', LAYER_W, 300, (g) => {
    const r = seeded(163);
    for (let i = 0; i < 16; i++) {
      const x = r() * LAYER_W;
      const y = 40 + r() * 220;
      const w = 40 + r() * 120;
      const h = 10 + r() * 26;
      poly(
        g,
        [
          { x, y },
          { x: x + w, y: y - 6 },
          { x: x + w - 10, y: y + h },
          { x: x + 8, y: y + h + 4 },
        ],
        0x03060f,
        1
      );
      outline(
        g,
        [
          { x, y },
          { x: x + w, y: y - 6 },
          { x: x + w - 10, y: y + h },
          { x: x + 8, y: y + h + 4 },
        ],
        r() > 0.5 ? HERO.energy : VILLAIN.energy,
        0.35,
        1.4
      );
    }
  });

  // Scrolling data grid.
  forge(scene, 'grid_3', 256, 256, (g) => {
    g.lineStyle(1, HERO.energy, 0.1);
    for (let i = 0; i <= 256; i += 32) {
      path(g, [{ x: i, y: 0 }, { x: i, y: 256 }], HERO.energy, 0.09, 1);
      path(g, [{ x: 0, y: i }, { x: 256, y: i }], HERO.energy, 0.09, 1);
    }
    g.fillStyle(HERO.energy, 0.3);
    for (let i = 0; i <= 256; i += 64) {
      for (let j = 0; j <= 256; j += 64) g.fillRect(i - 1, j - 1, 2, 2);
    }
  });
}

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------

function platformTexture(scene: Phaser.Scene, key: string, level: 1 | 2 | 3) {
  const W = 256;
  const H = 80;
  forge(scene, key, W, H, (g) => {
    const r = seeded(level * 7919);

    if (level === 1) {
      bandRect(g, 0, 0, W, H, 0x2a2429, 0x0a0507, 20);
      // Fractured rock face.
      for (let i = 0; i < 16; i++) {
        const x = r() * W;
        const y = 16 + r() * (H - 24);
        poly(
          g,
          [
            { x, y },
            { x: x + rand(r, 14, 44), y: y + rand(r, -8, 8) },
            { x: x + rand(r, 10, 34), y: y + rand(r, 10, 26) },
          ],
          r() > 0.5 ? 0x1c1619 : 0x070304,
          0.75
        );
      }
      // Lit top lip.
      bandRect(g, 0, 0, W, 13, 0x6b5a52, 0x2a2024, 8);
      path(g, [{ x: 0, y: 1 }, { x: W, y: 1 }], 0x9c8276, 0.6, 2);
      // Magma veins (periodic so tiles line up).
      for (let v = 0; v < 3; v++) {
        const pts: Vec[] = [];
        for (let x = 0; x <= W; x += 16) {
          pts.push({ x, y: 22 + v * 18 + Math.sin((x / W) * Math.PI * 2 * (v + 1)) * 7 });
        }
        path(g, pts, ACCENT.magma, 0.75, 3.5);
        path(g, pts, ACCENT.emberHot, 0.9, 1.3);
      }
      bandRect(g, 0, H - 8, W, 8, ACCENT.magma, 0x2a0704, 6, 0.75, 0.2);
    } else if (level === 2) {
      bandRect(g, 0, 0, W, H, 0x253449, 0x080d16, 20);
      g.fillStyle(0x1a2638, 1);
      g.fillRect(0, 12, W, H - 12);
      // Panel seams + rivets.
      for (let x = 0; x < W; x += 32) {
        path(g, [{ x, y: 14 }, { x, y: H - 6 }], 0x0d141f, 0.8, 1.4);
        g.fillStyle(0x4d627d, 1);
        g.fillCircle(x + 16, 26, 2.2);
        g.fillCircle(x + 16, H - 18, 2.2);
      }
      speckle(g, 0, 14, W, H - 20, 0x5b7a9c, 90, r, 0.08, 2);
      // Neon edge.
      g.fillStyle(HERO.energy, 0.18);
      g.fillRect(0, 0, W, 12);
      g.fillStyle(HERO.energy, 0.95);
      g.fillRect(0, 3, W, 5);
      path(g, [{ x: 0, y: 5 }, { x: W, y: 5 }], ACCENT.white, 0.85, 1.6);
      path(g, [{ x: 0, y: H - 3 }, { x: W, y: H - 3 }], HERO.energy, 0.45, 2);
    } else {
      bandRect(g, 0, 0, W, H, 0x070b18, 0x01030a, 16);
      g.lineStyle(2, HERO.energy, 0.85);
      g.strokeRect(1, 1, W - 2, H - 2);
      for (let x = 0; x < W; x += 24) {
        path(g, [{ x, y: 4 }, { x, y: H - 4 }], HERO.energy, 0.09, 1);
      }
      const trace = (y: number, col: number) => {
        const pts: Vec[] = [
          { x: 0, y },
          { x: 70, y },
          { x: 92, y: y + 14 },
          { x: 164, y: y + 14 },
          { x: 186, y },
          { x: W, y },
        ];
        path(g, pts, col, 0.85, 2);
        g.fillStyle(col, 1);
        g.fillCircle(92, y + 14, 2.6);
        g.fillCircle(186, y, 2.6);
      };
      trace(26, HERO.energy);
      trace(52, VILLAIN.energy);
      g.fillStyle(0x0b1324, 1);
      g.fillRect(112, 32, 32, 18);
      outline(
        g,
        [
          { x: 112, y: 32 },
          { x: 144, y: 32 },
          { x: 144, y: 50 },
          { x: 112, y: 50 },
        ],
        HERO.energy,
        0.7,
        1.2
      );
      g.fillStyle(HERO.energy, 0.2);
      g.fillRect(0, 0, W, 5);
    }
  });
}

// ---------------------------------------------------------------------------

export function buildArena(scene: Phaser.Scene) {
  skyTexture(scene, 'sky_1', 1);
  skyTexture(scene, 'sky_2', 2);
  skyTexture(scene, 'sky_3', 3);

  infernalLayers(scene);
  metropolisLayers(scene);
  abyssLayers(scene);

  platformTexture(scene, 'platform_l1', 1);
  platformTexture(scene, 'platform_l2', 2);
  platformTexture(scene, 'platform_l3', 3);

  // Soft cloud band used in the intro cinematic.
  forge(scene, 'cloud_band', 1024, 260, (g) => {
    const r = seeded(211);
    for (let i = 0; i < 40; i++) {
      const x = r() * 1024;
      const y = 40 + r() * 180;
      const w = 160 + r() * 340;
      const h = 30 + r() * 70;
      g.fillStyle(0x1b2236, 0.08 + r() * 0.1);
      g.fillEllipse(x, y, w, h);
    }
  });

  // Reusable lightning streak for storm flashes.
  forge(scene, 'lightning_streak', 180, 420, (g) => {
    const r = seeded(307);
    bolt(g, { x: 90, y: 0 }, { x: 90 + rand(r, -40, 40), y: 420 }, VILLAIN.energy, 4, 34, 12, r, 0.9);
    bolt(g, { x: 90, y: 60 }, { x: 150, y: 260 }, VILLAIN.energy, 2.4, 20, 7, r, 0.6);
  });
}
