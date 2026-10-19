import * as Phaser from 'phaser';
import { forge, bloom, energyCore, mix, shade, poly, outline, Vec } from './draw';
import { HERO, VILLAIN, ACCENT } from './palette';

/**
 * Procedural visual assets for the 6 mythological Relics / Power-Ups:
 * 1. Aegis of Olympus (Defensive Barrier)
 * 2. Thunderheart (Zeus Chain Lightning Attack)
 * 3. Phoenix Core (Health Recovery)
 * 4. Hermes' Step (Mobility & Dash Boost)
 * 5. Overdrive Shard (Instant +50 Overdrive)
 * 6. Rune of Ruin (Risk/Reward Viking Runic Tablet)
 */

export function buildRelics(scene: Phaser.Scene) {
  // 1. Aegis of Olympus (Golden Olympian Shield)
  forge(scene, 'relic_aegis_olympus', 80, 80, (g) => {
    bloom(g, 40, 40, 36, 0xf59e0b, 0.45, 6);
    // Outer golden disc
    g.fillStyle(0xd97706, 1);
    g.fillCircle(40, 40, 28);
    // Inner radiant bronze
    g.fillStyle(0xf59e0b, 1);
    g.fillCircle(40, 40, 24);
    g.lineStyle(2, 0xfef08a, 0.9);
    g.strokeCircle(40, 40, 24);
    // Celestial cyan Greek cross / boss
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(36, 22, 8, 36);
    g.fillRect(22, 36, 36, 8);
    // Center jewel
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 40, 6);
    // Laurels rim
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const lx = 40 + Math.cos(angle) * 20;
      const ly = 40 + Math.sin(angle) * 20;
      g.fillStyle(0xfde047, 0.9);
      g.fillCircle(lx, ly, 3);
    }
  });

  // 2. Thunderheart (Zeus Thunder Core)
  forge(scene, 'relic_thunderheart', 80, 80, (g) => {
    bloom(g, 40, 40, 38, 0x0ea5e9, 0.5, 7);
    bloom(g, 40, 40, 24, 0x38bdf8, 0.7, 5);
    // Heart/Core silhouette
    g.fillStyle(0x0284c7, 1);
    g.fillCircle(32, 32, 14);
    g.fillCircle(48, 32, 14);
    poly(g, [{ x: 19, y: 36 }, { x: 61, y: 36 }, { x: 40, y: 60 }], 0x0284c7, 1);
    // High-voltage lightning bolt across core
    const boltPts: Vec[] = [
      { x: 43, y: 16 },
      { x: 34, y: 36 },
      { x: 44, y: 36 },
      { x: 37, y: 62 },
      { x: 50, y: 33 },
      { x: 41, y: 33 },
      { x: 47, y: 16 },
    ];
    poly(g, boltPts, 0xffffff, 1);
    outline(g, boltPts, 0x38bdf8, 1, 1.5);
  });

  // 3. Phoenix Core (Golden Solar Recovery Egg)
  forge(scene, 'relic_phoenix_core', 80, 80, (g) => {
    bloom(g, 40, 40, 36, 0xf97316, 0.5, 6);
    bloom(g, 40, 40, 22, 0xfacc15, 0.7, 5);
    // Solar egg
    g.fillStyle(0xea580c, 1);
    g.fillEllipse(40, 42, 22, 30);
    g.fillStyle(0xf59e0b, 1);
    g.fillEllipse(40, 40, 16, 22);
    g.fillStyle(0xfef08a, 1);
    g.fillEllipse(40, 38, 10, 14);
    // Phoenix crest wings
    g.fillStyle(0xf97316, 0.9);
    g.fillTriangle(40, 18, 20, 38, 30, 46);
    g.fillTriangle(40, 18, 60, 38, 50, 46);
    // Center radiant white spark
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 38, 4);
  });

  // 4. Hermes' Step (Winged Talaria Sandal)
  forge(scene, 'relic_hermes_step', 80, 80, (g) => {
    bloom(g, 40, 40, 36, 0x06b6d4, 0.45, 6);
    // Golden sole
    poly(g, [{ x: 22, y: 52 }, { x: 58, y: 52 }, { x: 54, y: 58 }, { x: 26, y: 58 }], 0xd97706, 1);
    poly(g, [{ x: 25, y: 46 }, { x: 55, y: 46 }, { x: 58, y: 52 }, { x: 22, y: 52 }], 0xf59e0b, 1);
    // Celestial wings rising up
    const wingL: Vec[] = [{ x: 30, y: 48 }, { x: 12, y: 32 }, { x: 16, y: 18 }, { x: 32, y: 34 }];
    const wingR: Vec[] = [{ x: 42, y: 48 }, { x: 68, y: 32 }, { x: 64, y: 18 }, { x: 48, y: 34 }];
    poly(g, wingL, 0xe0f2fe, 0.95);
    outline(g, wingL, 0x38bdf8, 1, 1.5);
    poly(g, wingR, 0xe0f2fe, 0.95);
    outline(g, wingR, 0x38bdf8, 1, 1.5);
    // Inner wing feathers
    g.fillStyle(0x38bdf8, 0.8);
    g.fillTriangle(20, 26, 26, 20, 32, 34);
    g.fillTriangle(60, 26, 54, 20, 48, 34);
  });

  // 5. Overdrive Shard (Crystalline Prismatic Shard)
  forge(scene, 'relic_overdrive_shard', 80, 80, (g) => {
    bloom(g, 40, 40, 38, 0xa855f7, 0.5, 6);
    bloom(g, 40, 40, 20, 0x38bdf8, 0.7, 5);
    // Prismatic diamond crystal
    const diamond: Vec[] = [
      { x: 40, y: 14 },
      { x: 56, y: 38 },
      { x: 40, y: 66 },
      { x: 24, y: 38 },
    ];
    poly(g, diamond, 0x7e22ce, 1);
    outline(g, diamond, 0xc084fc, 1, 2);
    // Facet highlights
    g.fillStyle(0x38bdf8, 0.85);
    g.fillTriangle(40, 14, 40, 66, 24, 38);
    g.fillStyle(0xe9d5ff, 0.9);
    g.fillTriangle(40, 14, 56, 38, 40, 40);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 38, 5);
  });

  // 6. Rune of Ruin (Viking Molten Black Iron Tablet)
  forge(scene, 'relic_rune_of_ruin', 80, 80, (g) => {
    bloom(g, 40, 40, 38, 0xdc2626, 0.55, 6);
    // Volcanic stone slab
    const stone: Vec[] = [
      { x: 22, y: 18 },
      { x: 58, y: 16 },
      { x: 62, y: 62 },
      { x: 20, y: 64 },
    ];
    poly(g, stone, 0x18181b, 1);
    outline(g, stone, 0xef4444, 0.9, 2);
    // Runic cracks in stone
    g.lineStyle(1.5, 0xf97316, 0.8);
    g.lineBetween(22, 28, 32, 34);
    g.lineBetween(58, 48, 46, 52);
    // Algiz / Viking Rune carved in molten red/gold
    g.lineStyle(3.5, 0xffedd5, 1);
    g.lineBetween(40, 24, 40, 56);
    g.lineBetween(40, 34, 28, 22);
    g.lineBetween(40, 34, 52, 22);
    // Inner burning glow
    g.lineStyle(1.5, 0xef4444, 0.9);
    g.lineBetween(40, 24, 40, 56);
    g.lineBetween(40, 34, 28, 22);
    g.lineBetween(40, 34, 52, 22);
  });

  // Full-body Celestial Aegis Barrier for G-One (renders around player when Aegis of Olympus is active)
  forge(scene, 'relic_shield_barrier', 160, 160, (g) => {
    bloom(g, 80, 80, 72, 0xf59e0b, 0.35, 6);
    bloom(g, 80, 80, 64, 0x38bdf8, 0.5, 5);
    g.lineStyle(3, 0xfef08a, 0.85);
    g.strokeCircle(80, 80, 68);
    g.lineStyle(2, 0x38bdf8, 0.9);
    g.strokeCircle(80, 80, 62);
    // Radiant cross-spokes
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      g.lineStyle(2, 0xfef08a, 0.6);
      g.lineBetween(80 + Math.cos(a) * 58, 80 + Math.sin(a) * 58, 80 + Math.cos(a) * 68, 80 + Math.sin(a) * 68);
    }
  });

  // Thunder Chain Lightning Spark
  forge(scene, 'relic_thunder_bolt', 64, 64, (g) => {
    bloom(g, 32, 32, 28, 0x38bdf8, 0.8, 6);
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(10, 14, 26, 32);
    g.lineBetween(26, 32, 20, 34);
    g.lineBetween(20, 34, 54, 52);
  });
}
