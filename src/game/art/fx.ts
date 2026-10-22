import * as Phaser from 'phaser';
import { HERO, VILLAIN, ACCENT } from './palette';
import {
  Gfx,
  Vec,
  poly,
  outline,
  path,
  mix,
  shade,
  bloom,
  forge,
  forgeSheet,
  seeded,
  bolt,
  regularPoly,
  speckle,
} from './draw';

/**
 * Projectiles, impacts, shields, particles and reticles.
 * Everything here is additive-friendly: dark pixels are transparent so the
 * sprites can be blended with Phaser.BlendModes.ADD without grey boxes.
 */

function softParticle(g: Gfx, size: number, color: number, hot: number = ACCENT.white) {
  const c = size / 2;
  bloom(g, c, c, c, color, 0.55, 6);
  g.fillStyle(color, 0.95);
  g.fillCircle(c, c, c * 0.42);
  g.fillStyle(hot, 1);
  g.fillCircle(c, c, c * 0.2);
}

export function buildFx(scene: Phaser.Scene) {
  // -------------------------------------------------------------------------
  // Particles
  // -------------------------------------------------------------------------
  forge(scene, 'particle_blue', 24, 24, (g) => softParticle(g, 24, HERO.energy, HERO.hot));
  forge(scene, 'particle_red', 24, 24, (g) => softParticle(g, 24, VILLAIN.energy, VILLAIN.hot));
  forge(scene, 'particle_white', 20, 20, (g) => softParticle(g, 20, 0xdbeafe, ACCENT.white));

  /**
   * Soft contact shadow — a flattened dark ellipse with a falling-off edge.
   * Shared by every grounded character and every elevated platform so both
   * read as actually resting on a surface rather than floating flat against
   * the painted backdrop. Reused scaled rather than rebaked per size.
   */
  forge(scene, 'contact_shadow', 128, 48, (g) => {
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      g.fillStyle(0x000000, 0.32 * (1 - t));
      g.fillEllipse(64, 24, 128 * (1 - t * 0.7), 48 * (1 - t * 0.7));
    }
  });

  forge(scene, 'particle_ember', 16, 16, (g) => {
    bloom(g, 8, 8, 8, ACCENT.magma, 0.6, 5);
    g.fillStyle(ACCENT.ember, 0.95);
    g.fillCircle(8, 8, 3);
    g.fillStyle(ACCENT.emberHot, 1);
    g.fillCircle(8, 8, 1.6);
  });

  forge(scene, 'particle_smoke', 48, 48, (g) => {
    for (let i = 6; i >= 1; i--) {
      g.fillStyle(0x6b6f7a, 0.055 * i * 0.5);
      g.fillCircle(24, 24, (24 * i) / 6);
    }
  });

  // Angular shard used for digital disintegration.
  forge(scene, 'particle_shard', 18, 18, (g) => {
    poly(g, [{ x: 9, y: 0 }, { x: 18, y: 8 }, { x: 11, y: 18 }, { x: 1, y: 9 }], VILLAIN.energy, 0.9);
    poly(g, [{ x: 9, y: 3 }, { x: 15, y: 8 }, { x: 10, y: 14 }, { x: 4, y: 9 }], VILLAIN.hot, 0.85);
  });

  forge(scene, 'particle_shard_blue', 18, 18, (g) => {
    poly(g, [{ x: 9, y: 0 }, { x: 18, y: 8 }, { x: 11, y: 18 }, { x: 1, y: 9 }], HERO.energy, 0.9);
    poly(g, [{ x: 9, y: 3 }, { x: 15, y: 8 }, { x: 10, y: 14 }, { x: 4, y: 9 }], HERO.hot, 0.85);
  });

  // -------------------------------------------------------------------------
  // Rings & flashes
  // -------------------------------------------------------------------------
  const ring = (key: string, color: number) =>
    forge(scene, key, 160, 160, (g) => {
      const c = 80;
      g.lineStyle(14, color, 0.12);
      g.strokeCircle(c, c, 66);
      g.lineStyle(6, color, 0.45);
      g.strokeCircle(c, c, 70);
      g.lineStyle(2.5, ACCENT.white, 0.9);
      g.strokeCircle(c, c, 72);
      g.lineStyle(1.5, color, 0.5);
      g.strokeCircle(c, c, 58);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        path(
          g,
          [
            { x: c + Math.cos(a) * 72, y: c + Math.sin(a) * 72 },
            { x: c + Math.cos(a) * 79, y: c + Math.sin(a) * 79 },
          ],
          color,
          0.75,
          2
        );
      }
    });
  ring('shockwave_ring', HERO.energy);
  ring('shockwave_ring_red', VILLAIN.energy);

  // Flat ground shockwave (squashed, used for landings and impacts).
  forge(scene, 'ground_wave', 200, 70, (g) => {
    g.lineStyle(9, 0xbfd9ea, 0.16);
    g.strokeEllipse(100, 35, 190, 56);
    g.lineStyle(3, 0xe6f4ff, 0.75);
    g.strokeEllipse(100, 35, 182, 50);
  });

  // Omni impact burst used on every damage event.
  forgeSheet(scene, 'impact_blue', 128, 128, 5, (g, _t, i) => impactBurst(g, i, HERO.energy, HERO.hot, 700 + i));
  forgeSheet(scene, 'impact_red', 128, 128, 5, (g, _t, i) => impactBurst(g, i, VILLAIN.energy, VILLAIN.hot, 800 + i));

  function impactBurst(g: Gfx, i: number, color: number, hot: number, seed: number) {
    const k = 1 - i / 5;
    const r = seeded(seed);
    const c = 64;
    bloom(g, c, c, 56 * (0.5 + (1 - k) * 0.7), color, 0.6 * k, 6);
    g.fillStyle(hot, 0.95 * k);
    g.fillCircle(c, c, 16 * k + 4);
    g.lineStyle(3 * k + 1, color, 0.85 * k);
    g.strokeCircle(c, c, 18 + (1 - k) * 42);
    for (let s = 0; s < 7; s++) {
      const a = (s / 7) * Math.PI * 2 + r() * 0.5;
      const len = (24 + r() * 34) * (0.4 + (1 - k));
      poly(
        g,
        [
          { x: c + Math.cos(a) * 6, y: c + Math.sin(a) * 6 },
          { x: c + Math.cos(a) * len, y: c + Math.sin(a) * len },
          { x: c + Math.cos(a + 0.22) * 6, y: c + Math.sin(a + 0.22) * 6 },
        ],
        color,
        0.8 * k
      );
    }
  }

  // Dust puff for landings / running.
  forge(scene, 'dust_puff', 56, 40, (g) => {
    for (let i = 5; i >= 1; i--) {
      g.fillStyle(0x8e8578, 0.06 * i);
      g.fillEllipse(28, 26, (54 * i) / 5, (30 * i) / 5);
    }
  });

  // -------------------------------------------------------------------------
  // Crosshair
  // -------------------------------------------------------------------------
  forge(scene, 'crosshair_aim', 72, 72, (g) => {
    const c = 36;
    g.lineStyle(1.4, HERO.energy, 0.9);
    g.strokeCircle(c, c, 24);
    g.lineStyle(1, HERO.energy, 0.35);
    g.strokeCircle(c, c, 30);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      path(
        g,
        [
          { x: c + Math.cos(a) * 15, y: c + Math.sin(a) * 15 },
          { x: c + Math.cos(a) * 26, y: c + Math.sin(a) * 26 },
        ],
        HERO.energy,
        0.95,
        2
      );
    }
    path(g, [{ x: c - 34, y: c }, { x: c - 26, y: c }], HERO.energy, 0.8, 1.6);
    path(g, [{ x: c + 26, y: c }, { x: c + 34, y: c }], HERO.energy, 0.8, 1.6);
    g.fillStyle(HERO.hot, 1);
    g.fillCircle(c, c, 2);
  });

  // Enemy lock-on bracket.
  forge(scene, 'lock_bracket', 120, 120, (g) => {
    const c = 60;
    const s = 44;
    const arm = 16;
    g.lineStyle(2.4, VILLAIN.energy, 0.95);
    const corners: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    corners.forEach(([dx, dy]) => {
      path(g, [{ x: c + dx * s, y: c + dy * s }, { x: c + dx * (s - arm), y: c + dy * s }], VILLAIN.energy, 0.95, 2.4);
      path(g, [{ x: c + dx * s, y: c + dy * s }, { x: c + dx * s, y: c + dy * (s - arm) }], VILLAIN.energy, 0.95, 2.4);
    });
  });

  // -------------------------------------------------------------------------
  // Aegis shield
  // -------------------------------------------------------------------------
  forgeSheet(scene, 'aegis_shield', 180, 180, 6, (g, t) => {
    const c = 90;
    const rot = t * Math.PI * 2;
    const pulse = 0.78 + 0.22 * Math.sin(t * Math.PI * 4);

    bloom(g, c, c, 84, HERO.energy, 0.2 * pulse, 6);

    // Hex cell lattice.
    for (let ring = 1; ring <= 3; ring++) {
      const rr = 26 * ring;
      const cells = ring * 6;
      for (let i = 0; i < cells; i++) {
        const a = rot * (ring % 2 === 0 ? -1 : 1) + (i / cells) * Math.PI * 2;
        const hx = c + Math.cos(a) * rr;
        const hy = c + Math.sin(a) * rr;
        outline(g, regularPoly(hx, hy, 11, 6, rot), HERO.energy, 0.16 * pulse, 1);
      }
    }

    // Shell.
    outline(g, regularPoly(c, c, 80, 6, rot * 0.5), HERO.energy, 0.2, 10);
    outline(g, regularPoly(c, c, 80, 6, rot * 0.5), HERO.energy, 0.95 * pulse, 3);
    outline(g, regularPoly(c, c, 72, 6, -rot * 0.5), HERO.energy, 0.4, 1.4);
    outline(g, regularPoly(c, c, 62, 6, rot), ACCENT.white, 0.3 * pulse, 1.2);

    // Vertex nodes.
    regularPoly(c, c, 80, 6, rot * 0.5).forEach((p) => {
      g.fillStyle(HERO.energy, 0.95);
      g.fillCircle(p.x, p.y, 5);
      g.fillStyle(HERO.hot, 1);
      g.fillCircle(p.x, p.y, 2.4);
    });

    // Radiating struts.
    regularPoly(c, c, 80, 6, rot * 0.5).forEach((p) => {
      path(g, [{ x: c, y: c }, p], HERO.energy, 0.18, 1.6);
    });

    // Core emitter.
    outline(g, regularPoly(c, c, 20, 6, -rot), HERO.energy, 0.9, 2);
    g.fillStyle(HERO.energy, 0.45 * pulse);
    g.fillCircle(c, c, 11);
    g.fillStyle(HERO.hot, 0.9);
    g.fillCircle(c, c, 4);
  }, { key: 'aegis-idle', frameRate: 14 });

  // Shield deflection splash.
  forgeSheet(scene, 'shield_hit', 140, 140, 4, (g, _t, i) => {
    const k = 1 - i / 4;
    const c = 70;
    bloom(g, c, c, 60 * (1.2 - k * 0.5), HERO.energy, 0.5 * k, 6);
    outline(g, regularPoly(c, c, 36 + (1 - k) * 26, 6, 0.3), HERO.hot, 0.9 * k, 3 * k + 0.6);
    const r = seeded(31 + i);
    for (let s = 0; s < 6; s++) {
      const a = r() * Math.PI * 2;
      bolt(
        g,
        { x: c + Math.cos(a) * 14, y: c + Math.sin(a) * 14 },
        { x: c + Math.cos(a) * (40 + r() * 24), y: c + Math.sin(a) * (40 + r() * 24) },
        HERO.energy,
        2,
        7,
        4,
        r,
        0.85 * k
      );
    }
  });

  // -------------------------------------------------------------------------
  // Projectiles
  // -------------------------------------------------------------------------

  // G-One pulse bolt — a lance of light.
  forgeSheet(scene, 'proj_pulse', 72, 28, 4, (g, _t, i) => {
    const w = 72;
    const cy = 14;
    const flick = 0.86 + (i % 2) * 0.16;
    bloom(g, 46, cy, 24 * flick, HERO.energy, 0.42, 6);
    // Trailing comet tail.
    poly(
      g,
      [
        { x: 0, y: cy },
        { x: 30, y: cy - 7 * flick },
        { x: 30, y: cy + 7 * flick },
      ],
      HERO.energyDim,
      0.55
    );
    // Lance body.
    poly(
      g,
      [
        { x: 18, y: cy },
        { x: 44, y: cy - 9 * flick },
        { x: w - 2, y: cy },
        { x: 44, y: cy + 9 * flick },
      ],
      HERO.energy,
      0.95
    );
    poly(
      g,
      [
        { x: 30, y: cy },
        { x: 48, y: cy - 4 * flick },
        { x: w - 6, y: cy },
        { x: 48, y: cy + 4 * flick },
      ],
      HERO.hot,
      1
    );
  }, { key: 'proj-pulse', frameRate: 20 });

  // G-One arc blade — spinning crescent.
  forgeSheet(scene, 'proj_arc', 96, 96, 4, (g, t) => {
    const c = 48;
    const rot = t * Math.PI * 2;
    bloom(g, c, c, 46, HERO.energy, 0.3, 6);
    for (let k = 0; k < 2; k++) {
      const base = rot + k * Math.PI;
      g.lineStyle(13, HERO.energy, 0.18);
      g.beginPath();
      g.arc(c, c, 38, base - 0.9, base + 0.9, false);
      g.strokePath();
      g.lineStyle(6, HERO.energy, 0.95);
      g.beginPath();
      g.arc(c, c, 38, base - 0.85, base + 0.85, false);
      g.strokePath();
      g.lineStyle(2.4, HERO.hot, 1);
      g.beginPath();
      g.arc(c, c, 38, base - 0.8, base + 0.8, false);
      g.strokePath();
    }
    outline(g, regularPoly(c, c, 15, 6, -rot), HERO.energy, 0.85, 2.4);
    g.fillStyle(HERO.hot, 0.95);
    g.fillCircle(c, c, 6);
  }, { key: 'proj-arc', frameRate: 24 });

  // Ra-One bolt — unstable crimson orb.
  forgeSheet(scene, 'proj_raone_bolt', 56, 56, 4, (g, t, i) => {
    const c = 28;
    const r = seeded(210 + i);
    const pulse = 0.85 + 0.2 * Math.sin(t * Math.PI * 2);
    bloom(g, c, c, 26 * pulse, VILLAIN.energy, 0.5, 6);
    poly(
      g,
      [
        { x: 0, y: c },
        { x: 18, y: c - 7 },
        { x: 18, y: c + 7 },
      ],
      VILLAIN.energyDim,
      0.5
    );
    g.lineStyle(2.4, VILLAIN.energy, 0.95);
    g.strokeCircle(c, c, 15 * pulse);
    g.fillStyle(shade(VILLAIN.shadow, 0.1), 1);
    g.fillCircle(c, c, 11);
    g.fillStyle(VILLAIN.energy, 0.95);
    g.fillCircle(c, c, 7 * pulse);
    g.fillStyle(VILLAIN.hot, 1);
    g.fillCircle(c, c, 3.2);
    for (let s = 0; s < 3; s++) {
      const a = r() * Math.PI * 2;
      bolt(
        g,
        { x: c, y: c },
        { x: c + Math.cos(a) * 24, y: c + Math.sin(a) * 24 },
        VILLAIN.energy,
        1.3,
        5,
        3,
        r,
        0.8
      );
    }
  }, { key: 'proj-bolt', frameRate: 18 });

  // Ra-One charged sphere.
  forgeSheet(scene, 'proj_raone_orb', 112, 112, 4, (g, t, i) => {
    const c = 56;
    const r = seeded(320 + i);
    const rot = t * Math.PI * 2;
    bloom(g, c, c, 54, VILLAIN.energy, 0.5, 7);
    g.lineStyle(3, VILLAIN.energy, 0.9);
    g.strokeCircle(c, c, 42);
    outline(g, regularPoly(c, c, 36, 3, rot), VILLAIN.energy, 0.5, 2);
    outline(g, regularPoly(c, c, 36, 3, -rot + 1), VILLAIN.energy, 0.5, 2);
    g.fillStyle(mix(VILLAIN.energyDim, VILLAIN.shadow, 0.3), 1);
    g.fillCircle(c, c, 30);
    g.fillStyle(VILLAIN.energy, 0.95);
    g.fillCircle(c, c, 20);
    g.fillStyle(ACCENT.ember, 0.95);
    g.fillCircle(c, c, 12);
    g.fillStyle(VILLAIN.hot, 1);
    g.fillCircle(c, c, 6);
    for (let s = 0; s < 5; s++) {
      const a = r() * Math.PI * 2;
      bolt(
        g,
        { x: c + Math.cos(a) * 14, y: c + Math.sin(a) * 14 },
        { x: c + Math.cos(a) * 50, y: c + Math.sin(a) * 50 },
        VILLAIN.energy,
        1.6,
        8,
        4,
        r,
        0.75
      );
    }
  }, { key: 'proj-orb', frameRate: 16 });

  // Ra-One lance beam segment (tiled along the beam).
  forgeSheet(scene, 'proj_beam', 160, 56, 3, (g, _t, i) => {
    const h = 56;
    const cy = h / 2;
    const flick = 0.88 + (i % 2) * 0.2;
    g.fillStyle(VILLAIN.energyDim, 0.3);
    g.fillRect(0, cy - 22 * flick, 160, 44 * flick);
    g.fillStyle(VILLAIN.energy, 0.75);
    g.fillRect(0, cy - 13 * flick, 160, 26 * flick);
    g.fillStyle(ACCENT.ember, 0.9);
    g.fillRect(0, cy - 7 * flick, 160, 14 * flick);
    g.fillStyle(VILLAIN.hot, 1);
    g.fillRect(0, cy - 3 * flick, 160, 6 * flick);
    const r = seeded(410 + i);
    for (let s = 0; s < 3; s++) {
      bolt(
        g,
        { x: r() * 40, y: cy },
        { x: 120 + r() * 40, y: cy },
        VILLAIN.hot,
        1.4,
        10 * flick,
        7,
        r,
        0.5
      );
    }
  }, { key: 'proj-beam', frameRate: 22 });

  // -------------------------------------------------------------------------
  // Hazards
  // -------------------------------------------------------------------------
  forge(scene, 'hazard_debris', 88, 80, (g) => {
    const r = seeded(77);
    const body: Vec[] = [
      { x: 10, y: 66 },
      { x: 22, y: 14 },
      { x: 52, y: 4 },
      { x: 78, y: 28 },
      { x: 72, y: 70 },
      { x: 38, y: 78 },
    ];
    poly(g, body, 0x1d2634, 1);
    poly(g, [{ x: 22, y: 14 }, { x: 52, y: 4 }, { x: 60, y: 34 }, { x: 30, y: 40 }], 0x3b4a5e, 1);
    poly(g, [{ x: 30, y: 40 }, { x: 60, y: 34 }, { x: 68, y: 66 }, { x: 40, y: 72 }], 0x141b26, 1);
    speckle(g, 12, 10, 64, 60, 0x64748b, 40, r, 0.25, 2);
    // Re-entry heat on the leading edges.
    path(g, [{ x: 10, y: 66 }, { x: 22, y: 14 }, { x: 52, y: 4 }], ACCENT.magma, 0.95, 4);
    path(g, [{ x: 10, y: 66 }, { x: 22, y: 14 }, { x: 52, y: 4 }], ACCENT.emberHot, 1, 1.6);
    outline(g, body, 0x0b1018, 0.9, 2);
    bloom(g, 30, 20, 30, ACCENT.magma, 0.3, 5);
  });

  forgeSheet(scene, 'hazard_warning', 200, 72, 4, (g, _t, i) => {
    const c = { x: 100, y: 36 };
    const k = 0.55 + (i / 4) * 0.45;
    g.fillStyle(VILLAIN.energy, 0.1 * k);
    g.fillEllipse(c.x, c.y, 190, 62);
    g.lineStyle(3, VILLAIN.energy, 0.9 * k);
    g.strokeEllipse(c.x, c.y, 184 * k, 58 * k);
    g.lineStyle(1.6, ACCENT.ember, 0.8 * k);
    g.strokeEllipse(c.x, c.y, 120 * k, 38 * k);
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI * 2 + Math.PI / 4;
      path(
        g,
        [
          { x: c.x + Math.cos(a) * 60, y: c.y + Math.sin(a) * 20 },
          { x: c.x + Math.cos(a) * 88, y: c.y + Math.sin(a) * 28 },
        ],
        VILLAIN.energy,
        0.9,
        3
      );
    }
    g.fillStyle(VILLAIN.energy, 0.95);
    g.fillCircle(c.x, c.y, 5);
    g.fillStyle(VILLAIN.hot, 1);
    g.fillCircle(c.x, c.y, 2.2);
  }, { key: 'hazard-warn', frameRate: 12 });

  // Ground surge telegraph (level 2/3).
  forgeSheet(scene, 'surge_warning', 160, 120, 4, (g, _t, i) => {
    const r = seeded(610 + i);
    const k = 0.5 + (i / 4) * 0.5;
    g.fillStyle(VILLAIN.energy, 0.08 * k);
    g.fillRect(0, 0, 160, 120);
    for (let s = 0; s < 5; s++) {
      bolt(
        g,
        { x: 20 + s * 30, y: 118 },
        { x: 20 + s * 30 + (r() - 0.5) * 40, y: 118 - 110 * k },
        VILLAIN.energy,
        2,
        12,
        6,
        r,
        0.8 * k
      );
    }
  }, { key: 'surge-warn', frameRate: 14 });

  // -------------------------------------------------------------------------
  // Auras
  // -------------------------------------------------------------------------
  forgeSheet(scene, 'aura_overdrive', 220, 260, 5, (g, t, i) => {
    const r = seeded(880 + i);
    const cx = 110;
    const cy = 130;
    bloom(g, cx, cy, 108, HERO.energy, 0.26, 7);
    for (let s = 0; s < 10; s++) {
      const a = r() * Math.PI * 2;
      bolt(
        g,
        { x: cx + Math.cos(a) * 30, y: cy + Math.sin(a) * 50 },
        { x: cx + Math.cos(a) * 74, y: cy + Math.sin(a) * 118 },
        HERO.energy,
        1.8,
        10,
        5,
        r,
        0.7
      );
    }
    outline(g, regularPoly(cx, cy, 86, 6, t * Math.PI * 2), HERO.energy, 0.3, 2.4);
  }, { key: 'aura-overdrive', frameRate: 16 });

  forgeSheet(scene, 'aura_raone', 260, 300, 5, (g, t, i) => {
    const r = seeded(940 + i);
    const cx = 130;
    const cy = 150;
    bloom(g, cx, cy, 128, VILLAIN.energy, 0.22, 7);
    for (let s = 0; s < 12; s++) {
      const a = r() * Math.PI * 2;
      bolt(
        g,
        { x: cx + Math.cos(a) * 36, y: cy + Math.sin(a) * 60 },
        { x: cx + Math.cos(a) * 92, y: cy + Math.sin(a) * 140 },
        VILLAIN.energy,
        2,
        14,
        5,
        r,
        0.62
      );
    }
    outline(g, regularPoly(cx, cy, 100, 3, -t * Math.PI * 2), VILLAIN.energy, 0.22, 3);
  }, { key: 'aura-raone', frameRate: 14 });

  // Telegraph focus ring that snaps shut before a heavy attack.
  forge(scene, 'telegraph_ring', 240, 240, (g) => {
    const c = 120;
    g.lineStyle(4, VILLAIN.energy, 0.85);
    g.strokeCircle(c, c, 110);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      path(
        g,
        [
          { x: c + Math.cos(a) * 92, y: c + Math.sin(a) * 92 },
          { x: c + Math.cos(a) * 118, y: c + Math.sin(a) * 118 },
        ],
        VILLAIN.energy,
        0.95,
        6
      );
    }
    outline(g, regularPoly(c, c, 78, 3, 0), VILLAIN.energy, 0.5, 3);
  });

  // Letterbox-friendly radial vignette for cinematics (Canvas fallback).
  forge(scene, 'vignette', 256, 144, (g) => {
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      g.fillStyle(0x000000, 0.055);
      g.fillRect(0, 0, 256, 144 * (1 - t) * 0.22);
      g.fillRect(0, 144 - 144 * (1 - t) * 0.22, 256, 144 * (1 - t) * 0.22);
      g.fillRect(0, 0, 256 * (1 - t) * 0.16, 144);
      g.fillRect(256 - 256 * (1 - t) * 0.16, 0, 256 * (1 - t) * 0.16, 144);
    }
  });
}
