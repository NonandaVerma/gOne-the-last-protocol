import { LevelConfig } from '../types/game';

/** Logical render size; the camera FITs this into whatever the browser gives us. */
export const VIEW_W = 1280;
export const VIEW_H = 720;

/** Arenas are wider than the viewport so the camera can travel and parallax reads. */
export const WORLD_W = 2240;
export const GROUND_TOP = 648;

/**
 * All gameplay tuning lives here and in `characters.ts` so difficulty can be
 * retuned without touching any systems code.
 */
export const LEVELS: Record<number, LevelConfig> = {
  1: {
    id: 1,
    name: 'THE INFERNAL ARENA',
    subtitle: 'Chapter I — The Impact Crater',
    playerHealth: 3,
    bossHealth: 8,
    gravity: 1750,
    openingTaunt: '"You were designed to protect. I was designed to end."',
    arena: {
      worldWidth: WORLD_W,
      groundTop: GROUND_TOP,
      platforms: [
        { x: 430, y: 498, width: 268 },
        { x: 1120, y: 446, width: 312 },
        { x: 1810, y: 498, width: 268 },
      ],
      playerSpawnX: 300,
      bossSpawnX: 1620,
      hasLava: true,
    },
    bossMechanics: {
      canFly: false,
      hasSpread: true,
      hasCharged: true,
      hasHazards: false,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 950,
      attackIntervalMax: 1500,
      projectileSpeedScale: 1,
    },
  },

  2: {
    id: 2,
    name: 'THE FALLEN METROPOLIS',
    subtitle: 'Chapter II — The Corrupted Network',
    playerHealth: 3,
    bossHealth: 8,
    gravity: 1750,
    openingTaunt: '"Your shield cannot protect a dying world."',
    arena: {
      worldWidth: WORLD_W,
      groundTop: GROUND_TOP,
      platforms: [
        { x: 360, y: 508, width: 244 },
        { x: 770, y: 412, width: 286 },
        { x: 1210, y: 508, width: 244 },
        { x: 1630, y: 404, width: 300 },
        { x: 1990, y: 512, width: 228 },
      ],
      playerSpawnX: 280,
      bossSpawnX: 1680,
      hasLava: false,
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 780,
      attackIntervalMax: 1250,
      projectileSpeedScale: 1.15,
    },
  },

  3: {
    id: 3,
    name: 'THE ZERO-DAY ABYSS',
    subtitle: 'Chapter III — Decisive Protocol  //  ONE HIT DECIDES',
    playerHealth: 1,
    bossHealth: 1,
    gravity: 1750,
    openingTaunt: '"Let this world witness its final error."',
    arena: {
      worldWidth: WORLD_W,
      groundTop: GROUND_TOP,
      platforms: [
        { x: 430, y: 470, width: 240 },
        { x: 1120, y: 398, width: 330 },
        { x: 1810, y: 470, width: 240 },
      ],
      playerSpawnX: 320,
      bossSpawnX: 1600,
      hasLava: false,
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: true,
      // The final duel is slower per action but every attack is lethal,
      // so readability matters more than pressure.
      attackIntervalMin: 1100,
      attackIntervalMax: 1600,
      projectileSpeedScale: 1.2,
    },
  },
};
