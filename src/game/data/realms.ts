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
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm2_stage1', label: 'Stage I — The Divide Approach' },
      { fromX: 1400, key: 'bg_realm2_stage2', label: 'Stage II — The Crimson Citadel' },
      { fromX: 2800, key: 'bg_realm2_stage3', label: 'Stage III — The Fracture Core' },
      { fromX: 4200, key: 'bg_realm2_stage4', label: 'Stage IV — The Entropy Vault' },
      { fromX: 5600, key: 'bg_realm2_stage5', label: 'Stage V — The Entropy Nexus' },
      { fromX: 7000, key: 'bg_realm2_stage6', label: 'Stage VI — The Last Warden' },
    ],
    skyTop: 0x140305,
    skyMid: 0x3d080d,
    skyLow: 0x7a180b,
    haze: 0xff3b14,
    hazeStrength: 0.35,
    skylineStyle: 'ridges',
    silhouetteFar: 0x220507,
    silhouetteNear: 0x0c0203,
    rimFar: 0xff4a1a,
    rimNear: ENTROPY,
    platformTop: 0x5a2e2b,
    platformBody: 0x221316,
    platformDeep: 0x0d0508,
    platformEnergy: 0xff243d,
    ambient: 'embers',
    ambientTint: 0xff6a1f,
    storm: true,
    stormTint: ENTROPY,
    corruption: 0.48,
  },

  /* ---------------------------------------------------------------------
     III — THE VERDANT ABYSS
     Alien biomechanical forest where technology and colossal roots intertwine.
     --------------------------------------------------------------------- */
  3: {
    id: 3,
    backdrop: 'bg_realm3',
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm3_stage1', label: 'Stage I — The Living Threshold' },
      { fromX: 1400, key: 'bg_realm3_stage2', label: 'Stage II — The Verdant Wilds' },
      { fromX: 2800, key: 'bg_realm3_stage3', label: 'Stage III — The Hollow Colossus' },
      { fromX: 4200, key: 'bg_realm3_stage4', label: 'Stage IV — The Heartroot Sanctuary' },
      { fromX: 5600, key: 'bg_realm3_stage5', label: 'Stage V — The Biosphere Crucible' },
      { fromX: 7000, key: 'bg_realm3_stage6', label: 'Stage VI — The Worldseed Guardian' },
    ],
    skyTop: 0x031d17,
    skyMid: 0x064e3b,
    skyLow: 0x0d5e46,
    haze: 0x34d399,
    hazeStrength: 0.32,
    skylineStyle: 'canopy',
    silhouetteFar: 0x062b1e,
    silhouetteNear: 0x02160f,
    rimFar: 0x10b981,
    rimNear: 0x6ee7b7,
    platformTop: 0xede9d0,
    platformBody: 0x18201a,
    platformDeep: 0x090e0b,
    platformEnergy: 0x10b981,
    ambient: 'spores',
    ambientTint: 0x34d399,
    storm: false,
    stormTint: 0x10b981,
    corruption: 0.28,
  },

  /* ---------------------------------------------------------------------
     IV — THE VOIDBORN ABYSS
     Six-Stage Campaign · Gravity Manipulation · Dimensional Combat
     --------------------------------------------------------------------- */
  4: {
    id: 4,
    backdrop: 'bg_realm4',
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm4_stage1', label: 'Stage I — The Breach Beyond' },
      { fromX: 1400, key: 'bg_realm4_stage2', label: 'Stage II — The Gravity Graveyard' },
      { fromX: 2800, key: 'bg_realm4_stage3', label: 'Stage III — The Riftborn Hunt' },
      { fromX: 4200, key: 'bg_realm4_stage4', label: 'Stage IV — The Crystal Cataclysm' },
      { fromX: 5600, key: 'bg_realm4_stage5', label: 'Stage V — The Devouring Singularity' },
      { fromX: 7000, key: 'bg_realm4_stage6', label: 'Stage VI — The Void Sovereign' },
    ],
    skyTop: 0x0a0314,
    skyMid: 0x1f0b38,
    skyLow: 0x4a187a,
    haze: 0xc084fc,
    hazeStrength: 0.32,
    skylineStyle: 'crystals',
    silhouetteFar: 0x160728,
    silhouetteNear: 0x090212,
    rimFar: 0xa855f7,
    rimNear: 0xd8b4fe,
    platformTop: 0xf3e8ff,
    platformBody: 0x581c87,
    platformDeep: 0x140424,
    platformEnergy: 0xa855f7,
    ambient: 'embers',
    ambientTint: 0xc084fc,
    storm: false,
    stormTint: 0x7e22ce,
    corruption: 0.75,
  },

  /* ---------------------------------------------------------------------
     V — THE OVERWRITE
     Six-Stage Campaign · Protocol Override · Reconfigurable Architecture
     --------------------------------------------------------------------- */
  5: {
    id: 5,
    backdrop: 'bg_realm5',
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm5_stage1', label: 'Stage I — The Entry Protocol' },
      { fromX: 1400, key: 'bg_realm5_stage2', label: 'Stage II — The Recursive Engine' },
      { fromX: 2800, key: 'bg_realm5_stage3', label: 'Stage III — The Desync Expanse' },
      { fromX: 4200, key: 'bg_realm5_stage4', label: 'Stage IV — The Null Foundry' },
      { fromX: 5600, key: 'bg_realm5_stage5', label: 'Stage V — The Firewall Citadel' },
      { fromX: 7000, key: 'bg_realm5_stage6', label: 'Stage VI — The Overwrite Core' },
    ],
    skyTop: 0x08090b,
    skyMid: 0x141820,
    skyLow: 0x242a36,
    haze: 0xf59e0b,
    hazeStrength: 0.28,
    skylineStyle: 'spires',
    silhouetteFar: 0x11141a,
    silhouetteNear: 0x07090c,
    rimFar: 0xd1d5db,
    rimNear: 0xf59e0b,
    platformTop: 0xf3f4f6,
    platformBody: 0x1f242d,
    platformDeep: 0x0a0c10,
    platformEnergy: 0xf59e0b,
    ambient: 'motes',
    ambientTint: 0xf59e0b,
    storm: false,
    stormTint: 0xf59e0b,
    corruption: 0.82,
  },

  /* ---------------------------------------------------------------------
     VI — THE BLACK CROWN
     The ultimate hostile domain controlled by Ra-One.
     --------------------------------------------------------------------- */
  6: {
    id: 6,
    backdrop: 'bg_realm6',
    stageBackdrops: [
      { fromX: 0, key: 'bg_realm6_stage1', label: "Stage I — The Crown's Shadow" },
      { fromX: 1400, key: 'bg_realm6_stage2', label: 'Stage II — The Harrowed Gate' },
      { fromX: 2800, key: 'bg_realm6_stage3', label: 'Stage III — The Hunting Grounds' },
      { fromX: 4200, key: 'bg_realm6_stage4', label: 'Stage IV — The Broken Sanctum' },
      { fromX: 5600, key: 'bg_realm6_stage5', label: 'Stage V — The Red Wake' },
      { fromX: 7000, key: 'bg_realm6_stage6', label: 'Stage VI — Ra-One: The Final Protocol' },
    ],
    skyTop: 0x07070a,
    skyMid: 0x200810,
    skyLow: 0x350812,
    haze: 0x641329,
    hazeStrength: 0.32,
    skylineStyle: 'arena',
    silhouetteFar: 0x071426,
    silhouetteNear: 0x07070a,
    rimFar: 0x203858,
    rimNear: 0x641329,
    platformTop: 0xc5bdb4,
    platformBody: 0x07070a,
    platformDeep: 0x030305,
    platformEnergy: 0x641329,
    ambient: 'ash',
    ambientTint: 0x641329,
    storm: true,
    stormTint: 0x203858,
    corruption: 1.0,
  },
};

/** Ambient light tint applied to the arena per realm. */
export const AMBIENT_TINT: Record<number, number> = Object.fromEntries(
  Object.values(REALMS).map((r) => [r.id, r.ambientTint])
);
