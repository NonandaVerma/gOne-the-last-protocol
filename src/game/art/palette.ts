/**
 * Centralised colour language for G-ONE: THE LAST PROTOCOL.
 *
 * The whole game reads as "cold guardian blue vs. hot corrupted crimson".
 * Every surface is built from a 5-stop ramp (shadow -> base -> lit -> rim -> hot)
 * so cel-shading stays consistent between characters, props and environments.
 */

export interface Ramp {
  /** Deepest occluded value - almost black, tinted toward the faction hue. */
  shadow: number;
  /** Main armour body colour. */
  base: number;
  /** Side of a surface facing the key light. */
  lit: number;
  /** Polished metal trim / bevel. */
  rim: number;
  /** Faction energy colour. */
  energy: number;
  /** Dimmer energy, used for inner glow falloff. */
  energyDim: number;
  /** Incandescent core, nearly white. */
  hot: number;
}

/** G-One — graphite armour, silver trim, electric cyan energy. */
export const HERO: Ramp = {
  shadow: 0x070d18,
  base: 0x1b3146,
  lit: 0x3f6b92,
  rim: 0xc8e4f6,
  energy: 0x3ae9ff,
  energyDim: 0x0a85b5,
  hot: 0xeefbff,
};

/** Ra-One — obsidian plating, blood-iron trim, crimson furnace energy. */
export const VILLAIN: Ramp = {
  shadow: 0x100205,
  base: 0x3a0a10,
  lit: 0x7a1722,
  rim: 0xf0b0b8,
  energy: 0xff2a44,
  energyDim: 0x8f0a1c,
  hot: 0xfff0e8,
};

/** Shared accents used by UI, projectiles and environment lighting. */
export const ACCENT = {
  cyan: 0x3ae9ff,
  cyanDeep: 0x0a85b5,
  crimson: 0xff2a44,
  crimsonDeep: 0x8f0a1c,
  ember: 0xff8a1f,
  emberHot: 0xffd977,
  magma: 0xff4a0d,
  white: 0xffffff,
  steel: 0x8da4bd,
  steelDark: 0x2b3a4d,
  void: 0x03060d,
} as const;

/** Level-specific atmosphere tints used by the parallax backdrops. */
export const ATMOSPHERE = {
  1: {
    skyTop: 0x1a0406,
    skyMid: 0x4a0b10,
    skyLow: 0x8c2410,
    haze: 0xff5a1e,
    silhouette: 0x0d0203,
    silhouetteFar: 0x2a0709,
  },
  2: {
    skyTop: 0x030613,
    skyMid: 0x0b1430,
    skyLow: 0x1d2a57,
    haze: 0x2f6bd0,
    silhouette: 0x060a16,
    silhouetteFar: 0x121c38,
  },
  3: {
    skyTop: 0x000000,
    skyMid: 0x04050f,
    skyLow: 0x090a1c,
    haze: 0x2a3cff,
    silhouette: 0x02030a,
    silhouetteFar: 0x080b1c,
  },
} as const;
