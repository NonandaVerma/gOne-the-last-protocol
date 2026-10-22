import { LevelConfig } from '../types/game';
import { REALMS } from './realms';

/** Logical render size; the camera FITs this into whatever the browser gives us. */
export const VIEW_W = 1280;
export const VIEW_H = 720;

/** World Y of the walkable ground surface, shared by every realm. */
export const GROUND_TOP = 648;

/**
 * ===========================================================================
 * JUMP BUDGET — every gap and platform height below is derived from these.
 * ===========================================================================
 * With gravity 1750, jumpForce 830, airJumpForce 700 and maxSpeed 430
 * (see `characters.ts`):
 *
 *   single jump     peak  197px   airtime 0.95s   horizontal reach  408px
 *   + air jump      peak  337px   airtime 1.49s   horizontal reach  640px
 *
 * Design bands used throughout:
 *   gap <= 240    forgiving, single jump with margin        (realms I–II)
 *   gap <= 300    committed single jump                     (realms III+)
 *   gap <= 360    single jump at near-full speed            (realms IV+)
 *   gap <= 520    requires the air jump                     (realms V–VI)
 *   rise <= 170   reachable in one jump from flat ground
 *   rise <= 300   reachable using the air jump
 *
 * No mandatory gap in any realm exceeds 520px, and no mandatory rise exceeds
 * 300px, so every required traversal is physically possible with margin.
 */
const MAX_SINGLE = 408;
const MAX_DOUBLE = 640;

/**
 * All gameplay tuning lives here and in `characters.ts` so difficulty can be
 * retuned without touching systems code.
 *
 * Each realm is a hybrid: a traversal approach on the left, then a boss arena
 * to the right of `arenaStartX`. Crossing that line wakes Ra-One and sets the
 * checkpoint, so dying in the fight retries the fight rather than the approach.
 */
export const LEVELS: Record<number, LevelConfig> = {
  /* =========================================================================
     I — SHATTERED SKIES
     Teaches movement, jumping and the first relic. Generous throughout.
     ========================================================================= */
  1: {
    id: 1,
    name: 'SHATTERED SKIES',
    subtitle: 'Realm I — The First Fracture',
    objective: 'Cross the fracturing sky-fortress and confront the anomaly.',
    playerHealth: 4,
    bossHealth: 6,
    gravity: 1750,
    openingTaunt: '"You were designed to protect. I was designed to end."',
    environment: REALMS[1],
    difficulty: { bossTempoScale: 1.35, hazardWarnScale: 1.6, relicSpawnSeconds: 9 },
    arena: {
      worldWidth: 3400,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 2880,
      arenaStartX: 1860,
      hasLava: false,
      // Long flat run-up (Stage 1), then a rising vertical section (Stage 2),
      // then the bridge proper (Stage 3), then the arena (Stage 4).
      platforms: [
        { x: 760, y: 540, width: 320 },
        // Stage 2 "Sky Sentinels" — a vertical energy lift the player can
        // ride up to an elevated optional platform. The MANDATORY route is
        // still the ground-level path below, so missing or skipping the lift
        // never blocks progress; it's a reachable bonus, not a gate.
        {
          x: 980,
          y: 420,
          width: 140,
          behaviour: 'moving',
          travelY: -160,
          travelMs: 2600,
        },
        { x: 1180, y: 506, width: 300 },
        // Stage 3 "The Shattered Bridge" — the span itself collapses once
        // stood on. The 1660 platform (unchanged height/reach from before)
        // remains as the fallback route for a player who doesn't trust it.
        { x: 1420, y: 474, width: 220, behaviour: 'collapsing' },
        { x: 1660, y: 474, width: 220 },
        // Arena (Stage 4 — the boss floor itself)
        { x: 2180, y: 498, width: 300 },
        { x: 2620, y: 440, width: 340 },
        { x: 3060, y: 498, width: 300 },
      ],
      // One 220px pit — a single forgiving jump, well inside the 408 budget.
      gaps: [[900, 1120]],
      staticHazards: [
        // Stage 1 "Awakening" power-failure beat: crossing x=250 arms a
        // klaxon warning, then the gate seals at x=550. ~300px of run-up at
        // maxSpeed (430px/s, ~0.7s) against a 1.6s warn+close budget — easy
        // to clear at a dead sprint, reads as tense rather than being a real
        // execution check, matching Realm 1's deliberately forgiving curve.
        { kind: 'security_door', x: 550, y: GROUND_TOP, width: 40, height: 220, triggerX: 250, warnMs: 900, closeMs: 700, holdMs: 2500 },
        // Stage 3: spikes and the gate sit BEFORE the collapsing platform's
        // footprint (1310-1530), not beneath it — spikes never telegraph, so
        // a mistimed collapse dropping the player onto them would be an
        // unreadable hit. This way the ground route's danger is resolved
        // before the player ever commits to the elevated crossing.
        { kind: 'spikes', x: 1250, y: GROUND_TOP, width: 100 },
        { kind: 'laser_gate', x: 1300, y: GROUND_TOP, width: 14, height: 240, warnMs: 700, activeMs: 850, cooldownMs: 1300, offsetMs: 0 },
      ],
      pickups: [
        // Reward for taking the Stage 2 lift rather than walking past it.
        { x: 980, y: 356, type: 'overdrive_shard' },
        { x: 1180, y: 440, type: 'phoenix_core' },
        { x: 1660, y: 410, type: 'aegis_olympus' },
      ],
      // Corruption's first foothold in an otherwise untouched realm — two
      // grunts on the wide run-up (room to practice Pulse Shot or just dash
      // past), a third on the first platform, a Seeker stationed on the
      // elevated Stage 2 lift platform (forces aerial engagement while
      // riding the lift), and one more guarding the approach to the gate.
      enemies: [
        { kind: 'drone', x: 540, y: GROUND_TOP - 60, patrolMin: 440, patrolMax: 680 },
        { kind: 'drone', x: 1180, y: 440, patrolMin: 1040, patrolMax: 1320 },
        { kind: 'seeker', x: 980, y: 300 },
        { kind: 'seeker', x: 1680, y: GROUND_TOP - 170 },
      ],
    },
    bossMechanics: {
      canFly: false,
      hasSpread: false,
      hasCharged: true,
      hasHazards: false,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 1500,
      attackIntervalMax: 2100,
      projectileSpeedScale: 0.85,
    },
  },

  /* =========================================================================
     II — INFERNAL FORTRESS
     Introduces timed hazards: laser gates and falling debris.
     ========================================================================= */
  2: {
    id: 2,
    name: 'INFERNAL FORTRESS',
    subtitle: 'Realm II — Where Fire Rewrites the Rules',
    objective: 'Breach the burning fortress before the corruption spreads.',
    playerHealth: 4,
    bossHealth: 7,
    gravity: 1750,
    openingTaunt: '"Your shield cannot protect a dying world."',
    environment: REALMS[2],
    difficulty: { bossTempoScale: 1.15, hazardWarnScale: 1.35, relicSpawnSeconds: 11 },
    arena: {
      worldWidth: 3600,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 3060,
      arenaStartX: 1980,
      hasLava: true,
      platforms: [
        { x: 700, y: 530, width: 280 },
        { x: 1080, y: 486, width: 260 },
        { x: 1460, y: 520, width: 260 },
        { x: 1760, y: 470, width: 240 },
        // Arena
        { x: 2320, y: 508, width: 280 },
        { x: 2760, y: 430, width: 320 },
        { x: 3220, y: 508, width: 280 },
      ],
      gaps: [[860, 1080], [1620, 1840]],
      staticHazards: [
        // Two gates firing out of phase: pass one, then the next opens.
        { kind: 'laser_gate', x: 980, y: GROUND_TOP, width: 14, height: 200, warnMs: 700, activeMs: 900, cooldownMs: 1400, offsetMs: 0 },
        { kind: 'laser_gate', x: 1340, y: GROUND_TOP, width: 14, height: 200, warnMs: 700, activeMs: 900, cooldownMs: 1400, offsetMs: 1500 },
        { kind: 'spikes', x: 1240, y: GROUND_TOP, width: 160 },
        // The fortress's inner gate: sealed on sight, not a timed hazard.
        // Stays shut until the 'inner_hall' guard group is wiped, then opens
        // once and permanently — the "breach" beat, not another gauntlet.
        { kind: 'locked_gate', x: 1900, y: GROUND_TOP, width: 40, height: 220, guardGroup: 'inner_hall' },
      ],
      pickups: [
        { x: 1080, y: 420, type: 'aegis_olympus' },
        { x: 1760, y: 404, type: 'overdrive_shard' },
      ],
      // A fortress now actually garrisoned: a free-roaming drone in the
      // outer approach, then the inner-hall squad (drone + seeker) that
      // must be cleared before the locked gate above will open.
      enemies: [
        { kind: 'drone', x: 750, y: GROUND_TOP - 60, patrolMin: 650, patrolMax: 850 },
        { kind: 'drone', x: 1870, y: GROUND_TOP - 60, patrolMin: 1848, patrolMax: 1895, guardGroup: 'inner_hall' },
        { kind: 'seeker', x: 1750, y: GROUND_TOP - 180, guardGroup: 'inner_hall' },
      ],
    },
    bossMechanics: {
      canFly: false,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 1200,
      attackIntervalMax: 1700,
      projectileSpeedScale: 0.95,
    },
  },

  /* =========================================================================
     III — VOID CANYONS
     Platforms stop being dependable: collapsing and moving surfaces.
     ========================================================================= */
  3: {
    id: 3,
    name: 'VOID CANYONS',
    subtitle: 'Realm III — Between Worlds, Time Breaks',
    objective: 'Traverse the collapsing rift where nothing holds still.',
    playerHealth: 3,
    bossHealth: 8,
    gravity: 1750,
    openingTaunt: '"Even the ground rejects you now."',
    environment: REALMS[3],
    difficulty: { bossTempoScale: 1.0, hazardWarnScale: 1.15, relicSpawnSeconds: 13 },
    arena: {
      worldWidth: 3800,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 3240,
      arenaStartX: 2120,
      hasLava: false,
      platforms: [
        { x: 640, y: 540, width: 240 },
        // A convenience mid-crossing, not a requirement — both gaps below
        // are directly jumpable at ground level (300px/320px, under the
        // 408px single-jump budget), so a collapse never strands anyone.
        { x: 980, y: 510, width: 200, behaviour: 'collapsing' },
        { x: 1300, y: 486, width: 220 },
        // Route choice: the low ferry (safe, slow) vs the high ledge above
        // it (air-jump only, faster, carries the bonus relic). Both cross
        // the same gap; neither is mandatory.
        { x: 1640, y: 470, width: 200, behaviour: 'moving', travelX: 300, travelMs: 2600 },
        { x: 1640, y: 360, width: 160 },
        { x: 2000, y: 500, width: 240 },
        // Arena
        { x: 2420, y: 496, width: 280 },
        { x: 2860, y: 424, width: 300 },
        { x: 3340, y: 496, width: 280 },
      ],
      gaps: [[800, 1100], [1480, 1800]],
      staticHazards: [
        { kind: 'spikes', x: 1300, y: GROUND_TOP, width: 180 },
        { kind: 'laser_gate', x: 2000, y: GROUND_TOP, width: 14, height: 240, warnMs: 650, activeMs: 850, cooldownMs: 1200, offsetMs: 0 },
      ],
      pickups: [
        { x: 1300, y: 420, type: 'hermes_step' },
        // Reward for taking the high ledge over the ferry.
        { x: 1640, y: 300, type: 'rune_of_ruin' },
        { x: 2000, y: 434, type: 'phoenix_core' },
      ],
      // A canyon that was previously unguarded: a drone holding the solid
      // ground between the two chasms, and a seeker stationed near the
      // ferry crossing so riding it (or taking the high ledge) means fighting
      // at range mid-traversal rather than a free pass.
      enemies: [
        { kind: 'drone', x: 1200, y: GROUND_TOP - 60, patrolMin: 1140, patrolMax: 1280 },
        { kind: 'seeker', x: 1640, y: 240 },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 1050,
      attackIntervalMax: 1500,
      projectileSpeedScale: 1.0,
    },
  },

  /* =========================================================================
     IV — FROZEN OBSERVATORY
     Pattern recognition: phasing platforms you must read before committing.
     ========================================================================= */
  4: {
    id: 4,
    name: 'FROZEN OBSERVATORY',
    subtitle: 'Realm IV — Secrets Hidden in Eternal Silence',
    objective: 'Time the frozen light-bridges and reach the observatory core.',
    playerHealth: 3,
    bossHealth: 9,
    gravity: 1750,
    openingTaunt: '"This silence has outlasted better guardians than you."',
    environment: REALMS[4],
    difficulty: { bossTempoScale: 0.92, hazardWarnScale: 1.0, relicSpawnSeconds: 14 },
    arena: {
      worldWidth: 4000,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 3420,
      arenaStartX: 2260,
      hasLava: false,
      platforms: [
        { x: 620, y: 540, width: 240 },
        // Three bridges alternating on a 1.8s/1.2s cycle, staggered so a
        // patient player always has a next surface arriving.
        { x: 940, y: 505, width: 190, behaviour: 'phasing', phaseOnMs: 1800, phaseOffMs: 1200, phaseOffsetMs: 0 },
        { x: 1260, y: 480, width: 190, behaviour: 'phasing', phaseOnMs: 1800, phaseOffMs: 1200, phaseOffsetMs: 1000 },
        { x: 1580, y: 505, width: 190, behaviour: 'phasing', phaseOnMs: 1800, phaseOffMs: 1200, phaseOffsetMs: 2000 },
        { x: 1900, y: 460, width: 220, behaviour: 'moving', travelY: -140, travelMs: 2400 },
        { x: 2140, y: 520, width: 220 },
        // Arena
        { x: 2540, y: 492, width: 280 },
        { x: 3000, y: 418, width: 300 },
        { x: 3500, y: 492, width: 280 },
      ],
      gaps: [[780, 1060], [1400, 1700]],
      staticHazards: [
        { kind: 'laser_gate', x: 1260, y: GROUND_TOP, width: 14, height: 260, warnMs: 600, activeMs: 800, cooldownMs: 1100, offsetMs: 400 },
        { kind: 'spikes', x: 2040, y: GROUND_TOP, width: 200 },
        { kind: 'corruption_zone', x: 1700, y: GROUND_TOP, width: 240, warnMs: 700, activeMs: 1100, cooldownMs: 1600, offsetMs: 0 },
      ],
      pickups: [
        { x: 1260, y: 414, type: 'aegis_olympus' },
        { x: 1900, y: 394, type: 'thunderheart' },
      ],
      // Mostly ranged pressure here, deliberately: a melee drone chasing the
      // player across the phasing bridges or the vertical lift risks knocking
      // them into a gap mid-timing-puzzle, which is a different (unfair) kind
      // of difficulty than "read the pattern." One drone sits on the single
      // stretch of genuinely solid ground instead; seekers watch the two
      // precision sections from range without closing in.
      enemies: [
        { kind: 'drone', x: 1150, y: GROUND_TOP - 60, patrolMin: 1080, patrolMax: 1380 },
        { kind: 'seeker', x: 1550, y: 320 },
        { kind: 'seeker', x: 1900, y: 280 },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: false,
      attackIntervalMin: 950,
      attackIntervalMax: 1350,
      projectileSpeedScale: 1.1,
    },
  },

  /* =========================================================================
     V — ANCIENT FOREST
     Combination realm: every mechanic so far, layered.
     ========================================================================= */
  5: {
    id: 5,
    name: 'ANCIENT FOREST',
    subtitle: 'Realm V — Where the Protocol Still Breathes',
    objective: 'Cut through the overgrown ruin before the rot reaches the core.',
    playerHealth: 3,
    bossHealth: 10,
    gravity: 1750,
    openingTaunt: '"Even life here answers to me now."',
    environment: REALMS[5],
    difficulty: { bossTempoScale: 0.85, hazardWarnScale: 0.9, relicSpawnSeconds: 16 },
    arena: {
      worldWidth: 4200,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 3620,
      arenaStartX: 2420,
      hasLava: false,
      platforms: [
        { x: 600, y: 536, width: 220 },
        { x: 900, y: 500, width: 180, behaviour: 'collapsing' },
        { x: 1220, y: 470, width: 200, behaviour: 'moving', travelX: 260, travelMs: 2200 },
        { x: 1580, y: 496, width: 190, behaviour: 'phasing', phaseOnMs: 1600, phaseOffMs: 1100, phaseOffsetMs: 0 },
        { x: 1880, y: 452, width: 190, behaviour: 'phasing', phaseOnMs: 1600, phaseOffMs: 1100, phaseOffsetMs: 900 },
        { x: 2180, y: 500, width: 220, behaviour: 'collapsing' },
        // Arena
        { x: 2700, y: 486, width: 280 },
        { x: 3160, y: 412, width: 300 },
        { x: 3700, y: 486, width: 280 },
      ],
      gaps: [[760, 1040], [1380, 1680], [2020, 2300]],
      staticHazards: [
        { kind: 'corruption_zone', x: 1220, y: GROUND_TOP, width: 260, warnMs: 600, activeMs: 1200, cooldownMs: 1400, offsetMs: 0 },
        { kind: 'corruption_zone', x: 1900, y: GROUND_TOP, width: 260, warnMs: 600, activeMs: 1200, cooldownMs: 1400, offsetMs: 1300 },
        { kind: 'laser_gate', x: 1580, y: GROUND_TOP, width: 14, height: 280, warnMs: 550, activeMs: 800, cooldownMs: 1000, offsetMs: 500 },
        { kind: 'spikes', x: 2340, y: GROUND_TOP, width: 180 },
      ],
      pickups: [
        { x: 1580, y: 430, type: 'phoenix_core' },
        { x: 1880, y: 386, type: 'rune_of_ruin' },
        { x: 2180, y: 434, type: 'overdrive_shard' },
      ],
      // The realm's own identity is "every mechanic layered" — enemy
      // pressure layers the same way: two drones holding the two solid-
      // ground stretches between the three gaps, and two seekers watching
      // the phasing-bridge section and the final approach to the arena gate
      // from range, same fairness rule as Frozen Observatory (ranged only
      // near precision terrain, melee only on genuinely solid ground).
      enemies: [
        { kind: 'drone', x: 1150, y: GROUND_TOP - 60, patrolMin: 1090, patrolMax: 1330 },
        { kind: 'drone', x: 1800, y: GROUND_TOP - 60, patrolMin: 1720, patrolMax: 1960 },
        { kind: 'seeker', x: 1580, y: 300 },
        { kind: 'seeker', x: 2340, y: 260 },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: true,
      attackIntervalMin: 850,
      attackIntervalMax: 1200,
      projectileSpeedScale: 1.15,
    },
  },

  /* =========================================================================
     VI — FINAL ARENA
     Short, dense approach; the realm is mostly the fight.
     ========================================================================= */
  6: {
    id: 6,
    name: 'FINAL ARENA',
    subtitle: 'Realm VI — The Last Protocol. One Ending Remains.',
    objective: 'End it on the seam.',
    playerHealth: 2,
    bossHealth: 12,
    gravity: 1750,
    openingTaunt: '"Let this world witness its final error."',
    environment: REALMS[6],
    difficulty: { bossTempoScale: 0.8, hazardWarnScale: 0.85, relicSpawnSeconds: 12 },
    arena: {
      worldWidth: 3800,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 3180,
      arenaStartX: 1700,
      hasLava: true,
      platforms: [
        { x: 560, y: 520, width: 200, behaviour: 'collapsing' },
        { x: 880, y: 474, width: 190, behaviour: 'phasing', phaseOnMs: 1500, phaseOffMs: 1000, phaseOffsetMs: 0 },
        { x: 1200, y: 452, width: 200, behaviour: 'moving', travelX: 280, travelMs: 2000 },
        { x: 1540, y: 500, width: 220 },
        // Arena — symmetrical around the seam, the way the key art frames it.
        { x: 2040, y: 486, width: 300 },
        { x: 2560, y: 400, width: 340 },
        { x: 3080, y: 486, width: 300 },
      ],
      gaps: [[700, 1000], [1340, 1620]],
      staticHazards: [
        { kind: 'laser_gate', x: 880, y: GROUND_TOP, width: 14, height: 300, warnMs: 500, activeMs: 750, cooldownMs: 950, offsetMs: 0 },
        { kind: 'corruption_zone', x: 1200, y: GROUND_TOP, width: 280, warnMs: 550, activeMs: 1100, cooldownMs: 1250, offsetMs: 600 },
        { kind: 'spikes', x: 1480, y: GROUND_TOP, width: 160 },
      ],
      pickups: [
        { x: 1200, y: 386, type: 'aegis_olympus' },
        { x: 1540, y: 434, type: 'phoenix_core' },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: true,
      attackIntervalMin: 750,
      attackIntervalMax: 1100,
      projectileSpeedScale: 1.25,
    },
  },
};

/* Kept for compatibility with anything still importing the old constants. */
export const WORLD_W = LEVELS[1].arena.worldWidth;

/**
 * Development guard: verifies no realm ships a mandatory gap or rise the
 * player physically cannot clear. Runs only outside production builds.
 */
export function validateLevels(): string[] {
  const problems: string[] = [];
  Object.values(LEVELS).forEach((lvl) => {
    (lvl.arena.gaps ?? []).forEach(([a, b]) => {
      const span = b - a;
      if (span > MAX_DOUBLE) {
        problems.push(`Realm ${lvl.id}: gap ${a}-${b} spans ${span}px (> ${MAX_DOUBLE} double-jump reach)`);
      }
    });
    lvl.arena.platforms.forEach((p) => {
      const rise = lvl.arena.groundTop - p.y;
      if (rise > 300) {
        problems.push(`Realm ${lvl.id}: platform at ${p.x} rises ${rise}px (> 300 double-jump ceiling)`);
      }
    });
  });
  return problems;
}

void MAX_SINGLE;
