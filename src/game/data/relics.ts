import { RelicType, RelicConfig } from '../types/game';

/**
 * Presentation data for the six collectible fragments.
 *
 * Deliberately kept Phaser-free so React UI (the field manual, the HUD) can
 * import it during server rendering — `PowerUp.ts` pulls in Phaser, which
 * touches `window` at module load and would break `next build` prerender.
 *
 * `id`, `icon` and `duration` are mechanical and must not drift. Only the
 * player-facing name/tagline/description and the tint moved from the old
 * Greek-mythology framing onto the Protocol vocabulary and the Order/Entropy
 * palette (the previous amber, orange and violet tints were a third accent
 * the art direction no longer allows).
 */
export const RELIC_DEFINITIONS: Record<RelicType, RelicConfig> = {
  aegis_olympus: {
    id: 'aegis_olympus',
    name: 'Protocol Shield',
    tagline: 'Absorption Lattice',
    description: 'Wraps G-One in a hardlight lattice that absorbs incoming damage.',
    icon: 'relic_aegis_olympus',
    color: 0x00cfff,
    duration: 12000,
  },
  thunderheart: {
    id: 'thunderheart',
    name: 'Surge Core',
    tagline: 'Overcharged Pulse',
    description: 'Overcharges primary Pulse Shots into arc discharges that deal double damage.',
    icon: 'relic_thunderheart',
    color: 0x278bff,
    duration: 10000,
  },
  phoenix_core: {
    id: 'phoenix_core',
    name: 'Reboot Pulse',
    tagline: 'Core Restoration',
    description: 'Instantly restores 1 health unit (cannot exceed arena maximum).',
    icon: 'relic_phoenix_core',
    color: 0xe8faff,
    duration: 0,
  },
  hermes_step: {
    id: 'hermes_step',
    name: 'Phase Shift',
    tagline: 'Velocity Override',
    description: 'Grants +40% movement speed and halves dash cooldown with phase trails.',
    icon: 'relic_hermes_step',
    color: 0x5ed8ff,
    duration: 12000,
  },
  overdrive_shard: {
    id: 'overdrive_shard',
    name: 'Overdrive Shard',
    tagline: 'Charge Injection',
    description: 'Instantly infuses +50 Overdrive charge to unleash Final Overdrive sooner.',
    icon: 'relic_overdrive_shard',
    color: 0xa6e7ff,
    duration: 0,
  },
  rune_of_ruin: {
    id: 'rune_of_ruin',
    name: 'Ruin Protocol',
    tagline: 'Corrupted Bargain',
    description: 'Risk / Reward: Grants +100% damage output, but all incoming hits inflict +1 extra damage.',
    icon: 'relic_rune_of_ruin',
    color: 0xff243d,
    duration: 14000,
  },
};
