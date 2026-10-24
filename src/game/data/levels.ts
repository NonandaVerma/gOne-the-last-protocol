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
     5-Stage Progression: Awakening -> Sky Sentinels -> Shattered Bridge ->
     Corrupted Guardian -> Protocol Fragment Sanctuary.
     ========================================================================= */
  1: {
    id: 1,
    name: 'SHATTERED SKIES',
    subtitle: 'Realm I — The First Fracture',
    objective: 'Restore the power conduits, cross the fractured skyways, and secure Protocol Fragment I.',
    playerHealth: 4,
    bossHealth: 7,
    gravity: 1750,
    openingTaunt: '"You were designed to protect. I was designed to end."',
    environment: REALMS[1],
    difficulty: { bossTempoScale: 1.1, hazardWarnScale: 1.5, relicSpawnSeconds: 10 },
    arena: {
      worldWidth: 6400,
      groundTop: GROUND_TOP,
      playerSpawnX: 180,
      bossSpawnX: 4700,
      arenaStartX: 3900,
      hasLava: false,

      // Distinct physical environments across all 5 stages:
      platforms: [
        // ---- STAGE 1: AWAKENING (x: 0 - 1300) ----
        // Industrial machinery block (teaches A/D and jumping over low obstacles)
        { x: 380, y: 570, width: 140 },
        // Mid walkway over drainage gap
        { x: 920, y: 550, width: 180 },

        // ---- STAGE 2: SKY SENTINELS (x: 1300 - 2600) ----
        // Vertical moving lift elevating player from ground up to gantry
        {
          x: 1560,
          y: 520,
          width: 160,
          behaviour: 'moving',
          travelY: -160,
          travelMs: 2200,
        },
        // Lower gantry platform
        { x: 1840, y: 360, width: 280 },
        // Kinetic Launch Pad on the gantry (shoots G-One to upper observation deck)
        {
          x: 1840,
          y: 334,
          width: 64,
          behaviour: 'launch',
          launchVelocityY: -1180,
        },
        // High observation catwalk (reward & sentinel combat)
        { x: 2120, y: 190, width: 340 },
        // Descending approach gantry leading toward the bridge
        { x: 2420, y: 440, width: 240 },

        // ---- STAGE 3: THE SHATTERED BRIDGE (x: 2600 - 3900) ----
        // Bridge western abutment
        { x: 2680, y: 520, width: 240 },
        // 5-state collapsing span sections & stable piers across the sky chasm
        { x: 2940, y: 500, width: 190, behaviour: 'collapsing' },
        { x: 3170, y: 470, width: 150 }, // Stable central pier
        { x: 3400, y: 460, width: 190, behaviour: 'collapsing' },
        { x: 3640, y: 490, width: 190, behaviour: 'collapsing' },
        // Bridge eastern abutment
        { x: 3860, y: 520, width: 220 },

        // ---- STAGE 4: THE CORRUPTED GUARDIAN (x: 3900 - 5200) ----
        // Dedicated combat arena with 2 high-ground tactical dodging platforms
        { x: 4260, y: 460, width: 280 },
        { x: 4860, y: 460, width: 280 },

        // ---- STAGE 5: PROTOCOL FRAGMENT SANCTUARY (x: 5200 - 6400) ----
        // Celestial entrance platform & altar steps
        { x: 5460, y: 540, width: 260 },
        { x: 6050, y: 580, width: 240 },
      ],

      // Physical chasm gaps:
      gaps: [
        [810, 1030],   // Stage 1 drainage gap (220px, inside 408 single jump reach)
        [2800, 3760],  // Stage 3 Shattered Bridge chasm (spanned by collapsing platforms)
      ],

      staticHazards: [
        // STAGE 1: Interactive Power Relay Console (opens security blast door)
        {
          kind: 'terminal',
          x: 640,
          y: GROUND_TOP,
          width: 48,
          label: 'POWER_RELAY',
          prompt: '[E] ACTIVATE POWER CONDUIT',
          eventKey: 'power-relay-activated',
        },
        // STAGE 1: Security blast door — sealed until the power relay above
        // is activated. Previously carried `triggerX`/`warnMs`/`closeMs`/
        // `holdMs` (the "outrun the closing gate" mechanic) with no link to
        // the terminal at all, so the console's own comment ("opens security
        // blast door") was never actually true. Replaced with the simpler,
        // correct behaviour: starts sealed, opens once, permanently, when
        // the terminal's eventKey fires.
        {
          kind: 'security_door',
          x: 1200,
          y: GROUND_TOP,
          width: 44,
          height: 220,
          eventKey: 'power-relay-activated',
        },

        // STAGE 3: Clear, well-telegraphed laser gate before the bridge chasm
        {
          kind: 'laser_gate',
          x: 2560,
          y: GROUND_TOP,
          width: 14,
          height: 220,
          warnMs: 900,
          activeMs: 800,
          cooldownMs: 1500,
        },

        // STAGE 4: Guardian Arena exit gate. Previously used
        // `guardGroup: 'guardian_gate'`, but no enemy anywhere in this
        // realm carries that tag — `isGroupAlive()` returns false for a
        // group with zero members, so the gate was opening on the very
        // first frame of the scene, before the fight even began. Nothing
        // physically stops a player from running past Ra-One once he's
        // awake (`enterArena` only triggers his AI, it isn't a wall), so
        // this let the entire boss fight — and the level — be skipped by
        // sprinting straight to the Stage 5 altar. Switched to the
        // `eventKey` mechanism already built for the terminal/door link:
        // `handleBossDefeated()` already emits 'open_stage5_gate' on this
        // realm's boss death, this gate just needed to listen for it.
        {
          kind: 'locked_gate',
          x: 5180,
          y: GROUND_TOP,
          width: 40,
          height: 240,
          eventKey: 'open_stage5_gate',
        },

        // STAGE 5: Protocol Terminal Console (initializes altar energy)
        {
          kind: 'terminal',
          x: 5680,
          y: GROUND_TOP,
          width: 48,
          label: 'PROTOCOL_CONDUIT',
          prompt: '[E] INITIALIZE PROTOCOL CONDUIT',
          eventKey: 'protocol-conduit-activated',
        },
      ],

      pickups: [
        { x: 920, y: 480, type: 'phoenix_core' },
        // High observation reward in Stage 2 for taking the launch pad
        { x: 2120, y: 130, type: 'overdrive_shard' },
        // Mid-bridge reward in Stage 3 for precision traversal
        { x: 3170, y: 400, type: 'aegis_olympus' },
        // Combat arena preparation relic
        { x: 4260, y: 390, type: 'thunderheart' },
      ],

      enemies: [
        // Stage 1: Recon drone to teach Pulse Shot
        { kind: 'drone', x: 740, y: GROUND_TOP - 60, patrolMin: 680, patrolMax: 800 },
        // Stage 2: Sentinel sky drones and seeker forcing shield & aerial engagement
        { kind: 'seeker', x: 1720, y: 260 },
        { kind: 'drone', x: 2120, y: 130, patrolMin: 2020, patrolMax: 2220 },
        { kind: 'seeker', x: 2360, y: 320 },
        // Stage 3: Sentinel guarding the bridge approach
        { kind: 'drone', x: 2680, y: 460, patrolMin: 2600, patrolMax: 2760 },
      ],
    },
    bossMechanics: {
      canFly: false,
      hasSpread: true,
      hasCharged: true,
      hasHazards: false,
      hasBeams: false,
      canTeleport: false,
      attackIntervalMin: 1800,
      attackIntervalMax: 2400,
      projectileSpeedScale: 0.85,
    },
  },

  /* =========================================================================
     II — INFERNAL FORTRESS
     Six Stages: The Divide Approach -> The Crimson Citadel -> The Fracture Core
     -> The Entropy Vault -> The Entropy Nexus -> The Last Warden.
     ========================================================================= */
  2: {
    id: 2,
    name: 'INFERNAL FORTRESS',
    subtitle: 'Realm II — Six Sectors of Fire & Iron',
    objective: 'Breach the Crimson Citadel, stabilize the reactor core, and defeat The Last Warden.',
    playerHealth: 4,
    bossHealth: 8,
    gravity: 1750,
    openingTaunt: '"You step upon consecrated iron. The Last Warden will see you burn."',
    environment: REALMS[2],
    difficulty: { bossTempoScale: 1.15, hazardWarnScale: 1.25, relicSpawnSeconds: 12 },
    arena: {
      worldWidth: 8600,
      groundTop: GROUND_TOP,
      playerSpawnX: 190,
      bossSpawnX: 7850,
      arenaStartX: 7150,
      hasLava: true,

      platforms: [
        // ---- STAGE 1: THE DIVIDE APPROACH (x: 0 - 1400) ----
        // 5-state collapsing suspension bridge span across the 340px volcanic chasm
        { x: 920, y: 580, width: 220, behaviour: 'collapsing', textureKey: 'platform_l2_bridge' },

        // ---- STAGE 2: THE CRIMSON CITADEL (x: 1400 - 2800) ----
        // Motorized Heavy Freight Lift carrying player from lower transit floor (y:580) to upper security mezzanine (y:380)
        { x: 1880, y: 580, width: 170, behaviour: 'moving', travelY: -200, travelMs: 2200, textureKey: 'platform_l2_citadel' },
        // Kinetic Launch Pad on upper mezzanine: boosts G-One to high sniper balcony
        { x: 2200, y: 366, width: 64, behaviour: 'launch', launchVelocityY: -1150 },

        // ---- STAGE 3: THE FRACTURE CORE (x: 2800 - 4200) ----
        // Phased temporary energy bridge 1 (2.2s active, 1.4s inactive hard-light crimson beam)
        { x: 3330, y: 520, width: 260, behaviour: 'phasing', phaseOnMs: 2200, phaseOffMs: 1400, phaseOffsetMs: 0, textureKey: 'platform_l2_energy_bridge_beam' },
        // Phased temporary energy bridge 2 (offset cycle)
        { x: 3960, y: 500, width: 240, behaviour: 'phasing', phaseOnMs: 2200, phaseOffMs: 1400, phaseOffsetMs: 1200, textureKey: 'platform_l2_energy_bridge_beam' },
        // Overhead magnetic core gantry shuttle
        { x: 3660, y: 260, width: 180, behaviour: 'moving', travelX: 180, travelMs: 2200, textureKey: 'platform_l2_fracture' },

        // ---- STAGE 4: THE ENTROPY VAULT (x: 4200 - 5600) ----
        // Motorized shielded containment ferry traversing toxic breach
        { x: 5300, y: 530, width: 200, behaviour: 'moving', travelX: 180, travelMs: 2400, textureKey: 'platform_l2_vault' },

        // ---- STAGE 5: THE ENTROPY NEXUS (x: 5600 - 7000) ----
        // Ascending core elevator lifting player to central dais
        { x: 6050, y: 580, width: 170, behaviour: 'moving', travelY: -160, travelMs: 2000, textureKey: 'platform_l2_nexus' },
        // Hard-light conduit energy bridge across the thermal breach is managed in Level2Architecture (unlocked at console x:6420)

        // ---- STAGE 6: THE LAST WARDEN (x: 7000 - 8600) ----
        // Solid continuous arena floor and tactical architectural balconies built in Level2Architecture
      ],

      // Measured chasm gaps matching fortress architecture:
      gaps: [
        [740, 1080],   // Stage 1 volcanic chasm (340px)
        [3160, 3500],  // Stage 3 reactor void (340px)
        [3820, 4100],  // Stage 3 east void (280px)
        [4600, 4820],  // Stage 4 containment trench (220px)
        [5160, 5440],  // Stage 4 waste breach (280px)
        [5940, 6180],  // Stage 5 elevator shaft (240px)
        [6600, 6900],  // Stage 5 thermal breach (300px)
        // Stage 6: Zero gaps! Complete solid combat arena floor.
      ],

      staticHazards: [
        // STAGE 1: Bridge entrance laser barrier
        { kind: 'laser_gate', x: 340, y: GROUND_TOP, width: 14, height: 210, warnMs: 900, activeMs: 700, cooldownMs: 1600 },

        // STAGE 2: Interactive Citadel Security Console (overrides blast gate lockdown)
        {
          kind: 'terminal',
          x: 2050,
          y: 380,
          width: 48,
          label: 'CITADEL_OVERRIDE',
          prompt: '[E] OVERRIDE SECURITY LOCKDOWN',
          eventKey: 'citadel-security-unlocked',
        },
        // STAGE 2: Security laser beam barrier guarding lower corridor
        { kind: 'laser_gate', x: 2180, y: GROUND_TOP, width: 14, height: 210, warnMs: 700, activeMs: 900, cooldownMs: 1400, offsetMs: 0 },
        // STAGE 2: Heavy Fortress Blast Gate (opens via console OR wiping citadel_guard squad)
        {
          kind: 'locked_gate',
          x: 2700,
          y: GROUND_TOP,
          width: 44,
          height: 230,
          eventKey: 'citadel-security-unlocked',
          guardGroup: 'citadel_guard',
        },

        // STAGE 3: Reactor Core Stabilizer Console
        {
          kind: 'terminal',
          x: 3660,
          y: 440,
          width: 48,
          label: 'REACTOR_STABILIZER',
          prompt: '[E] STABILIZE REACTOR CORE',
          eventKey: 'reactor-core-stabilized',
        },

        // STAGE 4: Synchronized out-of-phase containment laser gates
        { kind: 'laser_gate', x: 4420, y: GROUND_TOP, width: 14, height: 240, warnMs: 800, activeMs: 900, cooldownMs: 1500, offsetMs: 0 },
        { kind: 'laser_gate', x: 4940, y: GROUND_TOP, width: 14, height: 240, warnMs: 800, activeMs: 900, cooldownMs: 1500, offsetMs: 1500 },
        // STAGE 4: Ground containment corruption zone
        { kind: 'corruption_zone', x: 5080, y: GROUND_TOP, width: 180, warnMs: 700, activeMs: 1100, cooldownMs: 1600, offsetMs: 400 },
        // STAGE 4: Vault Purge Console
        {
          kind: 'terminal',
          x: 5000,
          y: 420,
          width: 48,
          label: 'VAULT_PURGE',
          prompt: '[E] PURGE VAULT CONTAINMENT',
          eventKey: 'vault-purged',
        },

        // STAGE 5: High output laser gate
        { kind: 'laser_gate', x: 6300, y: GROUND_TOP, width: 14, height: 260, warnMs: 600, activeMs: 800, cooldownMs: 1200, offsetMs: 300 },
        // STAGE 5: Nexus corruption surge pool
        { kind: 'corruption_zone', x: 5850, y: GROUND_TOP, width: 200, warnMs: 600, activeMs: 1000, cooldownMs: 1300, offsetMs: 0 },
        // STAGE 5: Nexus Reroute Console (upper dais)
        {
          kind: 'terminal',
          x: 6420,
          y: 420,
          width: 48,
          label: 'NEXUS_REROUTE',
          prompt: '[E] REROUTE NEXUS ENERGY',
          eventKey: 'nexus-rerouted',
        },
        // STAGE 5: Sanctum Portcullis Console (right in front of the gate at x: 6940)
        {
          kind: 'terminal',
          x: 6940,
          y: 580,
          width: 48,
          label: 'SANCTUM_OVERRIDE',
          prompt: '[E] OVERRIDE SANCTUM PORTCULLIS',
          eventKey: 'nexus-rerouted',
        },
      ],

      pickups: [
        // Stage 1: Lower bridge approach & upper suspension arch
        { x: 440, y: 520, type: 'hermes_step' },
        { x: 930, y: 280, type: 'rune_of_ruin' },
        // Stage 2: Sniper balcony
        { x: 2320, y: 160, type: 'aegis_olympus' },
        // Stage 3: Overhead magnetic shuttle
        { x: 3660, y: 200, type: 'thunderheart' },
        // Stage 4: Vault gantry
        { x: 4710, y: 460, type: 'phoenix_core' },
        { x: 5000, y: 360, type: 'overdrive_shard' },
        // Stage 5: Central nexus dais
        { x: 6400, y: 350, type: 'rune_of_ruin' },
        // Stage 6: Central observation gantry
        { x: 7850, y: 320, type: 'thunderheart' },
      ],

      enemies: [
        // Stage 1: Approach defenders
        { kind: 'drone', x: 580, y: GROUND_TOP - 60, patrolMin: 480, patrolMax: 680 },
        { kind: 'seeker', x: 1200, y: 360 },

        // Stage 2: Citadel garrison squad
        { kind: 'drone', x: 1650, y: GROUND_TOP - 60, patrolMin: 1540, patrolMax: 1780, guardGroup: 'citadel_guard' },
        { kind: 'seeker', x: 2320, y: 200, guardGroup: 'citadel_guard' },
        { kind: 'drone', x: 2500, y: GROUND_TOP - 60, patrolMin: 2380, patrolMax: 2620, guardGroup: 'citadel_guard' },

        // Stage 3: Reactor sentinels
        { kind: 'seeker', x: 3300, y: 280 },
        { kind: 'seeker', x: 3800, y: 280 },

        // Stage 4: Vault sentries
        { kind: 'drone', x: 4450, y: GROUND_TOP - 60, patrolMin: 4320, patrolMax: 4560 },
        { kind: 'seeker', x: 5000, y: 260 },

        // Stage 5: Nexus elite vanguard
        { kind: 'drone', x: 5800, y: GROUND_TOP - 60, patrolMin: 5680, patrolMax: 5900 },
        { kind: 'seeker', x: 6400, y: 260 },
        { kind: 'drone', x: 6800, y: GROUND_TOP - 60, patrolMin: 6720, patrolMax: 6920 },
      ],
    },
    bossMechanics: {
      canFly: false,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: false,
      attackIntervalMin: 1100,
      attackIntervalMax: 1500,
      projectileSpeedScale: 1.05,
    },
  },

  /* =========================================================================
     III — THE VERDANT ABYSS
     Six-stage biomechanical alien biosphere with living root networks,
     canopy branches, hollow colossus, sanctuary conduits, and the Worldseed Guardian.
     ========================================================================= */
  3: {
    id: 3,
    name: 'THE VERDANT ABYSS',
    subtitle: 'Realm III — Six Sectors of the Living Megastructure',
    objective: 'Navigate the biomechanical forest and awaken the Worldseed Guardian.',
    playerHealth: 3,
    bossHealth: 10,
    gravity: 1750,
    openingTaunt: '"You tread upon the roots of eternity. The Abyss shall consume your light."',
    environment: REALMS[3],
    difficulty: { bossTempoScale: 1.05, hazardWarnScale: 1.0, relicSpawnSeconds: 12 },
    arena: {
      worldWidth: 8400,
      groundTop: GROUND_TOP,
      playerSpawnX: 180,
      bossSpawnX: 7800,
      arenaStartX: 7150,
      hasLava: false,

      platforms: [
        // ---- STAGE 3: THE HOLLOW COLOSSUS (x: 2800 - 4200) ----
        // Motorized Bio-Elevator ascending vertical hollow trunk
        { x: 3280, y: 648, width: 180, behaviour: 'moving', travelY: -220, travelMs: 2400, textureKey: 'platform_l3_colossus_floor' },

        // ---- STAGE 5: THE BIOSPHERE CRUCIBLE (x: 5600 - 7000) ----
        // Motorized Seed Pod ferry traversing crucible breach
        { x: 6250, y: 530, width: 180, behaviour: 'moving', travelX: 180, travelMs: 2400, textureKey: 'platform_l3_crucible' },
      ],

      // Biological chasms separating structural sectors
      gaps: [
        [860, 1060],   // Stage 1: Living Root Chasm (spanned by stepping root shelves)
        [1820, 2260],  // Stage 2: Acid Spore Chasm (spanned by canopy route & lower recovery shelf)
        [3200, 3660],  // Stage 3: Hollow Colossus Shaft (spanned by bio-elevator & interior decks)
        [5140, 5480],  // Stage 4: Sanctuary Chasm (spanned by blooming light-bridge & root arch)
        [6040, 6460],  // Stage 5: Crucible Chasm (spanned by seed pod ferry & braided conduits)
      ],

      staticHazards: [
        // STAGE 1: Toxic Spore Patch
        { kind: 'spikes', x: 700, y: GROUND_TOP, width: 120 },

        // STAGE 2: Acid Spore Marsh
        { kind: 'spikes', x: 1720, y: GROUND_TOP, width: 140 },
        // STAGE 2: Guarded Bio-Membrane gate
        {
          kind: 'locked_gate',
          x: 2600,
          y: GROUND_TOP,
          width: 18,
          height: 240,
          guardGroup: 'wilds_stalkers',
        },

        // STAGE 3: High output Bio-Laser conduit
        { kind: 'laser_gate', x: 3900, y: GROUND_TOP, width: 14, height: 260, warnMs: 650, activeMs: 850, cooldownMs: 1300, offsetMs: 0 },

        // STAGE 4: Interactive Heartroot Console (seated atop sanctuary altar platform)
        {
          kind: 'terminal',
          x: 4850,
          y: 500,
          width: 48,
          label: 'HEARTROOT_HARMONIZE',
          prompt: '[E] HARMONIZE HEARTROOT CONDUIT',
          eventKey: 'heartroot-harmonized',
        },

        // STAGE 5: Crucible Overcharge Console (seated on dais ground)
        {
          kind: 'terminal',
          x: 6720,
          y: GROUND_TOP,
          width: 48,
          label: 'WORLDS EED_CONTAINMENT',
          prompt: '[E] DISENGAGE WORLDS EED CONTAINMENT',
          eventKey: 'seed-containment-overcharged',
        },
        // STAGE 5: Guarded Sanctuary Portcullis
        {
          kind: 'locked_gate',
          x: 6980,
          y: GROUND_TOP,
          width: 18,
          height: 260,
          guardGroup: 'crucible_guard',
        },
      ],

      pickups: [
        // Stage 1: Canopy branch
        { x: 950, y: 320, type: 'hermes_step' },
        // Stage 2: Upper observation canopy
        { x: 2340, y: 150, type: 'aegis_olympus' },
        // Stage 3: Core Balcony
        { x: 3820, y: 170, type: 'thunderheart' },
        // Stage 4: Sanctuary Terrace
        { x: 5180, y: 390, type: 'rune_of_ruin' },
        // Stage 5: Crucible Dais
        { x: 6640, y: 260, type: 'overdrive_shard' },
        // Stage 6: Central Boss Arena Grapple
        { x: 7720, y: 220, type: 'phoenix_core' },
      ],

      enemies: [
        // Stage 1: Living Threshold defender
        { kind: 'rootstalker', x: 1180, y: GROUND_TOP - 60, patrolMin: 1080, patrolMax: 1340 },

        // Stage 2: Verdant Wilds garrison
        { kind: 'rootstalker', x: 1600, y: GROUND_TOP - 60, patrolMin: 1460, patrolMax: 1760, guardGroup: 'wilds_stalkers' },
        { kind: 'sporecaster', x: 2040, y: 310, guardGroup: 'wilds_stalkers' },
        { kind: 'rootstalker', x: 2460, y: GROUND_TOP - 60, patrolMin: 2340, patrolMax: 2620, guardGroup: 'wilds_stalkers' },

        // Stage 3: Hollow Colossus aerial predators
        { kind: 'canopy_hunter', x: 3500, y: 240 },
        { kind: 'canopy_hunter', x: 3820, y: 160 },

        // Stage 4: Heartroot Sanctuary defenders
        { kind: 'guardian_organism', x: 4900, y: GROUND_TOP - 60, patrolMin: 4740, patrolMax: 5080 },
        { kind: 'sporecaster', x: 4640, y: 380 },

        // Stage 5: Crucible Vanguard
        { kind: 'guardian_organism', x: 5850, y: GROUND_TOP - 60, patrolMin: 5700, patrolMax: 6000, guardGroup: 'crucible_guard' },
        { kind: 'sporecaster', x: 6460, y: 400, guardGroup: 'crucible_guard' },
        { kind: 'rootstalker', x: 6760, y: GROUND_TOP - 60, patrolMin: 6580, patrolMax: 6920, guardGroup: 'crucible_guard' },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: false,
      attackIntervalMin: 1000,
      attackIntervalMax: 1400,
      projectileSpeedScale: 1.1,
    },
  },

  /* =========================================================================
     IV — THE VOIDBORN ABYSS
     Six-Stage Campaign · Gravity Manipulation · Dimensional Combat
     ========================================================================= */
  4: {
    id: 4,
    name: 'THE VOIDBORN ABYSS',
    subtitle: 'Realm IV — Gravity Anomalies of the Shattered Core',
    objective: 'Harness Gravitas, cross the inverted megacity, and stabilize the void rifts.',
    playerHealth: 4,
    bossHealth: 10,
    gravity: 1750,
    openingTaunt: '"The anomaly has consumed better guardians than you. The Void Sovereign shall claim your light."',
    environment: REALMS[4],
    difficulty: { bossTempoScale: 1.12, hazardWarnScale: 1.2, relicSpawnSeconds: 12 },
    arena: {
      worldWidth: 8600,
      groundTop: GROUND_TOP,
      playerSpawnX: 180,
      bossSpawnX: 7850,
      arenaStartX: 7150,
      hasLava: false,

      platforms: [
        // STAGE 1: Motorized Exit Lift
        { x: 1360, y: GROUND_TOP, width: 180, travelY: -220, travelMs: 2500, textureKey: 'platform_l4_void' },

        // STAGE 2: Heavy Anti-Grav Freight Lift
        { x: 2060, y: 540, width: 180, travelY: -220, travelMs: 2400, textureKey: 'platform_l4_megacity' },

        // STAGE 4: Collapsing Crystal Bridge
        { x: 5360, y: 550, width: 220, behaviour: 'collapsing', collapseDelayMs: 850, textureKey: 'platform_l4_cataclysm' },
      ],

      gaps: [
        [420, 560],   // Stage 1: Broken approach chasm (140px jump)
        [2480, 2750], // Stage 2: Inverted megacity chasm (spanned by Gravitas bridge)
        [3520, 3840], // Stage 3: Rift ravine (spanned by destructible monolith and crystal ramp)
        [5280, 5460], // Stage 4: Cataclysm chasm (spanned by collapsing crystal bridge)
        [5940, 6620], // Stage 5: Devouring singularity chasm (spanned by anti-singularity decks)
      ],

      staticHazards: [
        // STAGE 1: Laser barrier
        { kind: 'laser_gate', x: 1200, y: GROUND_TOP, width: 14, height: 260, warnMs: 600, activeMs: 900, cooldownMs: 1400, offsetMs: 0 },

        // STAGE 3: Dimensional Rift Barrier (dispelled by disrupting Rift 1)
        { kind: 'laser_gate', x: 3500, y: GROUND_TOP, width: 18, height: 260, guardGroup: 'rift1_guard' },

        // STAGE 4: Timed Crystal Eruption Hazards
        { kind: 'corruption_zone', x: 4600, y: GROUND_TOP, width: 180, warnMs: 800, activeMs: 1000, cooldownMs: 1200, offsetMs: 0 },
        { kind: 'corruption_zone', x: 4800, y: GROUND_TOP, width: 180, warnMs: 800, activeMs: 1000, cooldownMs: 1200, offsetMs: 400 },
        { kind: 'corruption_zone', x: 5200, y: GROUND_TOP, width: 180, warnMs: 800, activeMs: 1000, cooldownMs: 1200, offsetMs: 800 },

        // STAGE 4: Containment Stabilizer Terminal
        {
          kind: 'terminal',
          x: 5520,
          y: 520,
          width: 48,
          label: 'CRYSTAL_STABILIZER',
          prompt: '[E] STABILIZE CRYSTAL NETWORK',
          eventKey: 'crystal-stabilized',
        },

        // STAGE 5: Singularity Containment Terminal
        {
          kind: 'terminal',
          x: 6860,
          y: 520,
          width: 48,
          label: 'SINGULARITY_CONTAINMENT',
          prompt: '[E] OVERRIDE CONTAINMENT PYLONS',
          eventKey: 'pylons-overloaded',
        },
      ],

      pickups: [
        // Stage 1: Elevated observation shelf
        { x: 680, y: 470, type: 'hermes_step' },
        // Stage 2: High tower balcony
        { x: 2220, y: 260, type: 'aegis_olympus' },
        // Stage 3: Crystal ridge balcony
        { x: 4140, y: 420, type: 'thunderheart' },
        // Stage 4: Resonating node shelf
        { x: 5160, y: 380, type: 'rune_of_ruin' },
        // Stage 5: Containment deck
        { x: 6380, y: 340, type: 'overdrive_shard' },
        // Stage 6: Central arena grapple
        { x: 7800, y: 220, type: 'phoenix_core' },
      ],

      enemies: [
        // Stage 1: Breach Beyond patrol
        { kind: 'void_drone', x: 1140, y: 380 },
        { kind: 'void_drone', x: 1280, y: 340 },

        // Stage 2: Inverted Megacity garrison
        { kind: 'void_drone', x: 1650, y: 320, guardGroup: 'megacity_guard' },
        { kind: 'void_drone', x: 2420, y: 220, guardGroup: 'megacity_guard' },

        // Stage 3: Riftborn Hunt defenders
        { kind: 'rift_stalker', x: 3080, y: GROUND_TOP - 60, patrolMin: 2950, patrolMax: 3250 },
        { kind: 'rift_stalker', x: 3380, y: GROUND_TOP - 60, guardGroup: 'rift1_guard' },
        { kind: 'rift_stalker', x: 3960, y: GROUND_TOP - 60, patrolMin: 3860, patrolMax: 4120 },
        { kind: 'void_drone', x: 4140, y: 340 },

        // Stage 4: Crystal Cataclysm defenders
        { kind: 'gravity_sentinel', x: 5120, y: GROUND_TOP - 60, patrolMin: 4980, patrolMax: 5240 },
        { kind: 'void_drone', x: 4820, y: 360 },

        // Stage 5: Singularity Vanguard
        { kind: 'gravity_sentinel', x: 5820, y: GROUND_TOP - 60, patrolMin: 5680, patrolMax: 5920 },
        { kind: 'void_drone', x: 6220, y: 340 },
        { kind: 'rift_stalker', x: 6760, y: GROUND_TOP - 60, patrolMin: 6640, patrolMax: 6920 },
      ],
    },
    bossMechanics: {
      canFly: true,
      hasSpread: true,
      hasCharged: true,
      hasHazards: true,
      hasBeams: true,
      canTeleport: true,
      attackIntervalMin: 900,
      attackIntervalMax: 1300,
      projectileSpeedScale: 1.15,
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
      // from range, same fairness rule as The Voidborn Abyss (ranged only
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
