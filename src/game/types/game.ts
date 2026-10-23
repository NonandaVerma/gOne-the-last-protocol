export type GameState =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'STORY_INTRO'
  | 'LEVEL_TRANSITION'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'DEFEAT';

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6;

/** Total realms in the campaign. Single source of truth for progression. */
export const REALM_COUNT = 6;

export type BossState =
  | 'spawning'
  | 'idle'
  | 'reposition'
  | 'telegraph'
  | 'attack'
  | 'recover'
  | 'stagger'
  | 'aerial'
  | 'defeated';

export interface CharacterStats {
  maxHealth: number;
  currentHealth: number;
  speed: number;
  jumpForce: number;
  isInvulnerable: boolean;
  isShielded: boolean;
  isDashing: boolean;
  overdriveCharge: number; // 0 to 100
  isOverdriveActive: boolean;
}

export interface BossStats {
  maxHealth: number;
  currentHealth: number;
  phase: number;
  state: BossState;
  isVulnerable: boolean;
}

export interface CooldownInfo {
  current: number;
  max: number;
  active?: boolean;
}

export interface AbilityCooldowns {
  pulseShot: CooldownInfo;
  aegisShield: CooldownInfo;
  arcBurst: CooldownInfo;
  dash: CooldownInfo;
  overdrive: { ready: boolean; active: boolean };
}

/** A solid surface. `y` is the TOP of the platform, `x` its centre. */
export interface PlatformSpec {
  x: number;
  y: number;
  width: number;
}

/** Behaviour a platform exhibits beyond being solid ground. */
export type PlatformBehaviour =
  /** Ordinary static surface. */
  | 'static'
  /** Patrols between two points; carries the player. */
  | 'moving'
  /** Cracks, shudders, then drops away once stood on. Respawns after a delay. */
  | 'collapsing'
  /** Materialises and dematerialises on a fixed cycle. */
  | 'phasing'
  /** Kinetic jump pad that boosts the player upward. */
  | 'launch';

/** A solid surface with optional dynamic behaviour. */
export interface PlatformSpec {
  x: number;
  y: number;
  width: number;
  behaviour?: PlatformBehaviour;
  /** `moving`: travel distance in px (sign sets initial direction). */
  travelX?: number;
  travelY?: number;
  /** `moving`: one-way traversal time in ms. */
  travelMs?: number;
  /** `phasing`: ms visible, then ms absent. */
  phaseOnMs?: number;
  phaseOffMs?: number;
  /** `phasing`: offset into the cycle so neighbours alternate. */
  phaseOffsetMs?: number;
  /** `launch`: upward impulse velocity (defaults to -1150). */
  launchVelocityY?: number;
  /** Optional custom texture key for stage-specific materials. */
  textureKey?: string;
}

/** Stationary or cyclic dangers placed along the traversal route. */
export type StaticHazardKind =
  /** Always-on spike bed. Pure positioning challenge. */
  | 'spikes'
  /** Beam between two emitters, cycling warn -> active -> cooldown. */
  | 'laser_gate'
  /** Ground patch that pulses dangerous on a cycle. */
  | 'corruption_zone'
  /**
   * Trigger-based, not cyclic: armed once the player crosses `triggerX`,
   * then flashes a warning, slides shut, blocks/damages while sealed, and
   * reopens after `holdMs` — never a permanent block. The "outrun the
   * closing gate" tension beat.
   */
  | 'security_door'
  /**
   * Starts sealed and stays sealed until every enemy in `guardGroup` is
   * defeated, then opens once, permanently. The "clear the defenders to
   * breach the gate" encounter beat — progression-gated, not timed.
   */
  | 'locked_gate'
  /** Blast door / security bulkhead. */
  | 'door'
  /** Interactive power relay or terminal console. */
  | 'terminal';

export interface StaticHazardSpec {
  kind: StaticHazardKind;
  x: number;
  y: number;
  width: number;
  height?: number;
  hazardId?: string;
  gateId?: string;
  requiresTrigger?: boolean;
  /** Cycle timing for `laser_gate` / `corruption_zone` (ms). */
  warnMs?: number;
  activeMs?: number;
  cooldownMs?: number;
  /** Offset into the cycle, so a row of gates fires in sequence. */
  offsetMs?: number;
  /** `security_door` only: world X that arms the closing sequence once crossed. */
  triggerX?: number;
  /** `security_door` only: ms the seal animation takes once warning ends. */
  closeMs?: number;
  /** `security_door` only: ms the door stays sealed before reopening. */
  holdMs?: number;
  /** `locked_gate` only: the `EnemySpec.guardGroup` id that must be cleared. */
  guardGroup?: string;
  /** `terminal` only: interactive prompt and event identifier. */
  label?: string;
  prompt?: string;
  eventKey?: string;
}

/** A relic placed deliberately rather than spawned at random. */
export interface PickupSpec {
  x: number;
  y: number;
  type: RelicType;
}

/** Grunt enemies populating a realm's traversal approach. */
export type EnemyKind =
  /** Ground-bound melee lunger. */
  | 'drone'
  /** Hovering ranged attacker that keeps its distance. */
  | 'seeker'
  /** Fast quad-pedal root predator that lunges along terrain. */
  | 'rootstalker'
  /** Stationed bio-artillery launching bursting spore mortar projectiles. */
  | 'sporecaster'
  /** Arboreal predator that climbs on elevated canopies and dives down. */
  | 'canopy_hunter'
  /** Elite bio-armored guardian protecting sacred passages. */
  | 'guardian_organism';

export interface EnemySpec {
  kind: EnemyKind;
  x: number;
  y: number;
  /** `drone` only: patrol bounds: it won't chase past these world X values. */
  patrolMin?: number;
  patrolMax?: number;
  /** Enemies sharing an id are tracked together by a `locked_gate` guarding them. */
  guardGroup?: string;
}

export interface ArenaGeometry {
  /** Total scrollable arena width; the camera is clamped to this. */
  worldWidth: number;
  /** World Y of the walkable ground surface. */
  groundTop: number;
  platforms: PlatformSpec[];
  playerSpawnX: number;
  bossSpawnX: number;
  /** Animated molten river drawn under the ground lip. */
  hasLava: boolean;

  /* ---- Hybrid traversal section (left of the arena) ---- */
  /**
   * World X where the boss arena begins. The player traverses everything to
   * the left of this line; crossing it wakes Ra-One and seals the arena.
   * Omit for a pure arena with no approach.
   */
  arenaStartX?: number;
  /** Hazards placed along the approach. */
  staticHazards?: StaticHazardSpec[];
  /** Hand-placed relics rewarding exploration of the approach. */
  pickups?: PickupSpec[];
  /** Pits in the ground: [startX, endX] pairs. Falling in costs a unit. */
  gaps?: Array<[number, number]>;
  /** Grunt enemies placed along the approach. */
  enemies?: EnemySpec[];
}

export interface BossMechanics {
  canFly: boolean;
  hasSpread: boolean;
  hasCharged: boolean;
  hasHazards: boolean;
  hasBeams: boolean;
  canTeleport: boolean;
  /** Pause between finished actions, in ms, scaled by boss phase. */
  attackIntervalMin: number;
  attackIntervalMax: number;
  projectileSpeedScale: number;
}

/* ===========================================================================
   ENVIRONMENT
   Every realm renders through one shared system; these values are the only
   thing that differs between them, so no scene owns hard-coded colours.
   =========================================================================== */

/** How the distant silhouette band is shaped. */
export type SkylineStyle =
  | 'spires'    // pristine sky-fortress towers
  | 'ridges'    // jagged volcanic rock
  | 'shards'    // fractured floating slabs
  | 'crystals'  // angular ice formations
  | 'canopy'    // colossal overgrown trunks
  | 'arena';    // the final colosseum

/** Ambient particle behaviour. */
export type AmbientKind = 'embers' | 'ash' | 'motes' | 'snow' | 'spores' | 'rain';

export interface RealmEnvironment {
  id: LevelId;
  /** Painted key-art backdrop under the parallax layers. */
  backdrop: string;
  /**
   * Internal narrative sub-stages within this realm, each with its own
   * painted backdrop. `Backdrop` crossfades to the last entry whose `fromX`
   * is at or before the camera's current centre, so the world visibly
   * advances through the realm's story beats as the player traverses it.
   * The first entry should have `fromX: 0`. Omit for a realm with a single
   * backdrop (the default `backdrop` field above is used instead).
   */
  stageBackdrops?: Array<{ fromX: number; key: string; label: string }>;

  /* Sky gradient, top to horizon */
  skyTop: number;
  skyMid: number;
  skyLow: number;
  /** Horizon bloom colour and strength. */
  haze: number;
  hazeStrength: number;

  /* Silhouette bands */
  skylineStyle: SkylineStyle;
  silhouetteFar: number;
  silhouetteNear: number;
  /** Energy rim picking out silhouette edges. */
  rimFar: number;
  rimNear: number;

  /* Platform material */
  platformTop: number;
  platformBody: number;
  platformDeep: number;
  /** Energy seam running through the platform face. */
  platformEnergy: number;

  /* Ambience */
  ambient: AmbientKind;
  ambientTint: number;
  /** Distant lightning / reality flashes. */
  storm: boolean;
  stormTint: number;

  /**
   * 0 = untouched Order, 1 = fully consumed by Entropy. Drives how much
   * crimson bleeds into the silhouettes and platform seams, so the campaign
   * reads as one world degrading rather than six unrelated biomes.
   */
  corruption: number;
}

/* ===========================================================================
   DIFFICULTY
   Explicit per-realm knobs instead of a blanket multiplier.
   =========================================================================== */

export interface DifficultySpec {
  /** Ra-One's reaction delay scale; >1 is slower and more readable. */
  bossTempoScale: number;
  /** Multiplier on every hazard's warning window. >1 = more forgiving. */
  hazardWarnScale: number;
  /** Seconds between ambient relic spawns during the boss fight. */
  relicSpawnSeconds: number;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  subtitle: string;
  playerHealth: number;
  bossHealth: number;
  gravity: number;
  arena: ArenaGeometry;
  bossMechanics: BossMechanics;
  environment: RealmEnvironment;
  difficulty: DifficultySpec;
  /** Line Ra-One delivers when the arena loads. */
  openingTaunt: string;
  /** One-line brief shown as the realm begins. */
  objective: string;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
}

export interface StorySlide {
  id: string;
  title?: string;
  subtitle?: string;
  text: string[];
  speaker?: 'SYSTEM' | 'G-ONE' | 'RA-ONE' | 'NARRATOR';
  visualCues?: {
    skyColor?: string;
    showShip?: boolean;
    showCrater?: boolean;
    showThrone?: boolean;
    lightning?: 'blue' | 'red';
  };
}

export type RelicType =
  | 'aegis_olympus'
  | 'thunderheart'
  | 'phoenix_core'
  | 'hermes_step'
  | 'overdrive_shard'
  | 'rune_of_ruin';

export interface RelicConfig {
  id: RelicType;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: number;
  duration?: number;
}

export interface ActiveRelicState {
  id: RelicType;
  name: string;
  remainingMs: number;
  maxMs: number;
  charges?: number;
}

