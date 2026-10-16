export type GameState =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'STORY_INTRO'
  | 'LEVEL_TRANSITION'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'DEFEAT';

export type LevelId = 1 | 2 | 3;

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

export interface ArenaGeometry {
  /** Total scrollable arena width; the camera is clamped to this. */
  worldWidth: number;
  /** World Y of the walkable ground surface. */
  groundTop: number;
  platforms: PlatformSpec[];
  playerSpawnX: number;
  bossSpawnX: number;
  /** Level 1 only - animated molten river drawn under the ground lip. */
  hasLava: boolean;
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

export interface LevelConfig {
  id: LevelId;
  name: string;
  subtitle: string;
  playerHealth: number;
  bossHealth: number;
  gravity: number;
  arena: ArenaGeometry;
  bossMechanics: BossMechanics;
  /** Line Ra-One delivers when the arena loads. */
  openingTaunt: string;
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
