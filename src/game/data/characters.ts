/**
 * Central difficulty / feel tuning.
 * Nothing in the systems code hard-codes a number that lives here.
 */

export const G_ONE_CONFIG = {
  name: 'G-ONE',
  title: 'THE GUARDIAN PROTOCOL',

  // --- Locomotion -----------------------------------------------------------
  maxSpeed: 430,
  groundAccel: 3400,
  airAccel: 2100,
  groundDrag: 3200,
  airDrag: 900,
  jumpForce: 830,
  /** Second jump is weaker so it reads as a thruster assist, not a double leap. */
  airJumpForce: 700,
  maxAirJumps: 1,
  /** ms of grace after walking off a ledge during which a jump still works. */
  coyoteTime: 110,
  /** ms a jump press is remembered while airborne. */
  jumpBuffer: 130,
  /** Releasing jump early cuts upward velocity by this factor. */
  jumpCutFactor: 0.42,
  dashSpeed: 1000,

  maxHealth: 3,
  invulnerabilityDuration: 1300,
  /** Knockback applied to G-One when hit. */
  hitKnockback: 320,

  abilities: {
    pulseShot: {
      name: 'Pulse Shot',
      cooldown: 230,
      overdriveCooldown: 110,
      speed: 1150,
      damage: 1,
      overdriveGain: 6,
      /** Recoil pushback, keeps rapid fire from being free positioning. */
      recoil: 70,
    },
    aegisShield: {
      name: 'Aegis Shield',
      cooldown: 5200,
      duration: 1900,
      /** Blocks all damage from anything not flagged `piercing`. */
      damageReduction: 1,
      /** Overdrive earned per deflected hit - rewards good defence. */
      deflectGain: 14,
    },
    arcBurst: {
      name: 'Arc Burst',
      cooldown: 3800,
      speed: 780,
      damage: 2,
      overdriveGain: 16,
      /** Arc blades pass through the boss instead of being consumed. */
      pierce: true,
    },
    dash: {
      name: 'Tactical Dash',
      cooldown: 1700,
      duration: 185,
      invulnerableDuringDash: true,
      /** Overdrive earned for dashing through a projectile. */
      dodgeGain: 8,
    },
    overdrive: {
      name: 'Final Overdrive',
      chargeRequired: 100,
      duration: 4200,
      /** Damage multiplier while active. */
      damageMultiplier: 2,
      /** Release shockwave damage on activation. */
      burstDamage: 1,
      burstRadius: 220,
    },
  },
} as const;

export const RA_ONE_CONFIG = {
  name: 'RA-ONE',
  title: 'THE CORRUPT ANOMALY',

  walkSpeed: 190,
  dashSpeed: 760,
  hoverHeight: 300,
  /** Preferred distance from G-One; the AI repositions toward this band. */
  idealRangeMin: 320,
  idealRangeMax: 620,

  invulnerabilityDuration: 620,
  staggerDuration: 520,

  projectiles: {
    singleShot: { speed: 640, damage: 1, telegraph: 420 },
    spreadShot: { speed: 580, damage: 1, telegraph: 560, spread: 0.26, count: 3 },
    chargedOrb: { speed: 400, damage: 1, telegraph: 900, radius: 38 },
    deathBeam: { damage: 1, telegraph: 850, duration: 420 },
    slam: { damage: 1, telegraph: 700, radius: 210 },
  },

  /**
   * Phase thresholds as a fraction of max health. Crossing one speeds the boss
   * up, intensifies the aura and unlocks the more aggressive attacks.
   */
  phases: [
    { atHealthFraction: 1.0, speedScale: 1.0, aggression: 0.0 },
    { atHealthFraction: 0.62, speedScale: 0.84, aggression: 0.35 },
    { atHealthFraction: 0.3, speedScale: 0.68, aggression: 0.7 },
  ],

  dialogues: {
    level1Encounter: '"You were designed to protect. I was designed to end."',
    level2Encounter: '"Your shield cannot protect a dying world."',
    level3Encounter: '"Let this world witness its final error."',
    phase2: '"Your resistance is only another variable."',
    phase3: '"Then we end together."',
    onDefeat: '"THE PROTOCOL... WILL NEVER... CEASE."',
  },
} as const;
