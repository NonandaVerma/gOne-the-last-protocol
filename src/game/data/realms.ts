import { RealmEnvironment } from '../types/game';

/**
 * THE SIX REALMS.
 *
 * One world in six states of collapse, not six unrelated biomes. `corruption`
 * is the through-line: it climbs from 0.05 (Shattered Skies, barely touched)
 * to 1.0 (Final Arena, Order and Entropy fully interleaved), and the shared
 * environment renderer bleeds crimson into every silhouette and platform seam
 * in proportion to it.
 *
 * Painted backdrops reuse existing key art in `/public/images`; the procedural
 * parallax layers are generated on top from these same values, so the two
 * always agree tonally.
 */

/* Shared faction anchors, kept literal here so a realm can be read at a glance. */
const ORDER = 0x00cfff;
const ORDER_DEEP = 0x278bff;
const ICE = 0xe8faff;
const ENTROPY = 0xff243d;
const ENTROPY_DEEP = 0xc9102b;

export const REALMS: Record<number, RealmEnvironment> = {
  /* ---------------------------------------------------------------------
     I — SHATTERED SKIES
     The pristine world, moments after the first fracture. Teaches the game.
     --------------------------------------------------------------------- */
  1: {
    id: 1,
    backdrop: 'bg_realm1',
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm1', label: 'Stage I — Awakening' },
      { fromX: 1300, key: 'bg_realm1_stage2', label: 'Stage II — Sky Sentinels' },
      { fromX: 2600, key: 'bg_realm1_stage3', label: 'Stage III — The Shattered Bridge' },
      { fromX: 3900, key: 'bg_realm1_stage4', label: 'Stage IV — The Corrupted Guardian' },
      { fromX: 5200, key: 'bg_realm1_stage5', label: 'Stage V — Protocol Fragment' },
    ],
    skyTop: 0x0a2a4d,
    skyMid: 0x1d5f91,
    skyLow: 0x8fc9e8,
    haze: 0xd8f1ff,
    hazeStrength: 0.3,
    skylineStyle: 'spires',
    silhouetteFar: 0x16405f,
    silhouetteNear: 0x0b2138,
    rimFar: ORDER,
    rimNear: ICE,
    platformTop: 0xcfe3f0,
    platformBody: 0x4a6d87,
    platformDeep: 0x16293a,
    platformEnergy: ORDER,
    ambient: 'motes',
    ambientTint: ICE,
    storm: false,
    stormTint: ORDER,
    corruption: 0.05,
  },

  /* ---------------------------------------------------------------------
     II — INFERNAL FORTRESS
     The same architecture, now burning. Entropy announces itself.
     --------------------------------------------------------------------- */
  2: {
    id: 2,
    backdrop: 'bg_realm2',
    skyTop: 0x1a0406,
    skyMid: 0x4a0b10,
    skyLow: 0x8c2410,
    haze: 0xff5a1e,
    hazeStrength: 0.34,
    skylineStyle: 'ridges',
    silhouetteFar: 0x2a0709,
    silhouetteNear: 0x0d0203,
    rimFar: 0xff6a2a,
    rimNear: ENTROPY,
    platformTop: 0x6b5a52,
    platformBody: 0x2a2429,
    platformDeep: 0x0a0507,
    platformEnergy: 0xff4a0d,
    ambient: 'embers',
    ambientTint: 0xff8a1f,
    storm: true,
    stormTint: ENTROPY,
    corruption: 0.45,
  },

  /* ---------------------------------------------------------------------
     III — VOID CANYONS
     Reality itself coming apart. Platforms stop being dependable.
     --------------------------------------------------------------------- */
  3: {
    id: 3,
    backdrop: 'bg_realm3',
    skyTop: 0x05030f,
    skyMid: 0x1a0b38,
    skyLow: 0x3d1a5c,
    haze: 0x8a3ad6,
    hazeStrength: 0.28,
    skylineStyle: 'shards',
    silhouetteFar: 0x160a2b,
    silhouetteNear: 0x080415,
    rimFar: 0x9d5bff,
    rimNear: ENTROPY,
    platformTop: 0x5a4a78,
    platformBody: 0x241a3d,
    platformDeep: 0x0a0618,
    platformEnergy: 0x9d5bff,
    ambient: 'motes',
    ambientTint: 0xb07aff,
    storm: true,
    stormTint: 0x9d5bff,
    corruption: 0.6,
  },

  /* ---------------------------------------------------------------------
     IV — FROZEN OBSERVATORY
     Order preserved under ice — but the ice is not solid ground.
     --------------------------------------------------------------------- */
  4: {
    id: 4,
    backdrop: 'bg_realm4',
    skyTop: 0x030d1f,
    skyMid: 0x0e2f52,
    skyLow: 0x5b9fc9,
    haze: 0xbfe9ff,
    hazeStrength: 0.26,
    skylineStyle: 'crystals',
    silhouetteFar: 0x0f2f4a,
    silhouetteNear: 0x061727,
    rimFar: 0x7fd4ff,
    rimNear: ICE,
    platformTop: 0xd6f0ff,
    platformBody: 0x3f6d8f,
    platformDeep: 0x0c1f30,
    platformEnergy: 0x7fd4ff,
    ambient: 'snow',
    ambientTint: ICE,
    storm: false,
    stormTint: ORDER_DEEP,
    corruption: 0.5,
  },

  /* ---------------------------------------------------------------------
     V — ANCIENT FOREST
     Life grown through the ruins — and corrupted by what it grew through.
     --------------------------------------------------------------------- */
  5: {
    id: 5,
    backdrop: 'bg_realm5',
    skyTop: 0x04130f,
    skyMid: 0x0d2e24,
    skyLow: 0x2f6b4e,
    haze: 0x7fe8b0,
    hazeStrength: 0.24,
    skylineStyle: 'canopy',
    silhouetteFar: 0x0a2a1f,
    silhouetteNear: 0x04130d,
    rimFar: 0x4fd8a0,
    rimNear: ENTROPY_DEEP,
    platformTop: 0x6d7a58,
    platformBody: 0x2a3327,
    platformDeep: 0x080f0a,
    platformEnergy: 0x5fe8b8,
    ambient: 'spores',
    ambientTint: 0x7fffc4,
    storm: false,
    stormTint: 0x4fd8a0,
    corruption: 0.72,
  },

  /* ---------------------------------------------------------------------
     VI — FINAL ARENA
     Both forces at full strength, meeting on the seam.
     --------------------------------------------------------------------- */
  6: {
    id: 6,
    backdrop: 'bg_realm6',
    skyTop: 0x0a0208,
    skyMid: 0x2d0714,
    skyLow: 0x6b1024,
    haze: ENTROPY,
    hazeStrength: 0.36,
    skylineStyle: 'arena',
    silhouetteFar: 0x1d0610,
    silhouetteNear: 0x080207,
    rimFar: ORDER,
    rimNear: ENTROPY,
    platformTop: 0x8a93a8,
    platformBody: 0x1d2430,
    platformDeep: 0x05070c,
    platformEnergy: ORDER,
    ambient: 'ash',
    ambientTint: ENTROPY,
    storm: true,
    stormTint: ICE,
    corruption: 1.0,
  },
};

/** Ambient light tint applied to the arena per realm. */
export const AMBIENT_TINT: Record<number, number> = Object.fromEntries(
  Object.values(REALMS).map((r) => [r.id, r.ambientTint])
);
