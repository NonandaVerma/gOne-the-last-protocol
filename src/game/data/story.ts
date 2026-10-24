import { StorySlide } from '../types/game';

export const OPENING_STORY: StorySlide[] = [
  {
    id: 'intro-1',
    title: 'THE CELESTIAL TRANSMISSION',
    subtitle: 'OLYMPIAN CONCLAVE // SECTOR ZERO',
    text: [
      'The sacred pillars have collapsed into volcanic ruin.',
      'A cataclysm of blood and iron engulfs the mortal realm.',
      'The Divine Guardian Protocol is summoned.',
    ],
    speaker: 'SYSTEM',
    visualCues: {
      skyColor: '#050811',
      showShip: true,
      lightning: 'blue',
    },
  },
  {
    id: 'intro-2',
    title: 'THE DIVINE DESCENT',
    subtitle: 'THE IMPACT CRATER // ASHEN REACHES',
    text: [
      'Adorned in celestial silver and celestial blue fire,',
      'G-One descends into the scorched crater of humanity.',
      'A solitary godlike shield against impending oblivion.',
    ],
    speaker: 'NARRATOR',
    visualCues: {
      skyColor: '#1a0505',
      showCrater: true,
      lightning: 'blue',
    },
  },
  {
    id: 'intro-3',
    title: 'THE VIKING DESTROYER',
    subtitle: 'THE THRONE OF RAGNAROK',
    text: [
      'From the molten volcanic throne rises Ra-One.',
      'Armed with dark Nordic runes and apocalyptic flames:',
      '"You were fashioned to protect the weak. I was forged to incinerate them."',
    ],
    speaker: 'RA-ONE',
    visualCues: {
      skyColor: '#2b0000',
      showThrone: true,
      lightning: 'red',
    },
  },
];

export const LEVEL_2_TRANSITION: StorySlide = {
  id: 'transition-l2',
  title: 'INFERNAL FORTRESS',
  subtitle: 'CHAPTER II — SIX SECTORS OF FIRE & IRON',
  text: [
    'The sky-fortress has fallen behind you into volcanic ruin.',
    'Ra-One has entrenched his legions within the Infernal Fortress.',
    'Traverse the fractured bridge, breach the citadel, and silence The Last Warden.',
  ],
  speaker: 'SYSTEM',
  visualCues: {
    skyColor: '#140305',
    lightning: 'red',
  },
};

export const LEVEL_3_TRANSITION: StorySlide = {
  id: 'transition-l3',
  title: 'THE VERDANT ABYSS',
  subtitle: 'CHAPTER III — THE BIOMECHANICAL BIOSPHERE',
  text: [
    'The Infernal Fortress crumbles into scorched ash behind you.',
    'Beyond lies the Verdant Abyss — where alien technology and colossal roots intertwine.',
    'Traverse the living canopy, breach the Colossus, and confront The Worldseed Guardian.',
  ],
  speaker: 'SYSTEM',
  visualCues: {
    skyColor: '#031d17',
    lightning: 'blue',
  },
};

/**
 * Narration shown when entering each realm after the first.
 *
 * Keyed by the realm being entered, so `REALM_TRANSITIONS[3]` plays on the way
 * into The Verdant Abyss. One world degrading, not six unrelated places.
 */
export const REALM_TRANSITIONS: Record<number, string[]> = {
  2: [
    'THE SKY-FORTRESS HAS FALLEN BEHIND YOU.',
    'CONSECRATED IRON AND VOLCANIC STONE ENGULF THE REALM.',
    'SIX SECTORS OF CORRUPTION BAR YOUR PATH TO THE WARDEN.',
  ],
  3: [
    'THE LAST WARDEN IS EXTINGUISHED.',
    'ENTERING REALM III — THE VERDANT ABYSS.',
    'BIOMECHANICAL ROOTS AWAKEN ACROSS SIX LIVING SECTORS.',
  ],
  4: [
    'AN ANOMALOUS SIGNAL PULLS G-ONE INTO THE COSMIC VOID.',
    'ENTERING REALM IV — THE VOIDBORN ABYSS.',
    'GRAVITATIONAL FIELDS FRACTURE ACROSS SIX UNSTABLE SECTORS.',
  ],
  5: [
    'LIFE FOUND THE RUINS AND GREW THROUGH THEM.',
    'IT GREW THROUGH THE CORRUPTION TOO.',
    'EVERYTHING YOU HAVE LEARNED IS REQUIRED HERE.',
  ],
  6: [
    'THE SEAM IS FULLY OPEN.',
    'ORDER AND ENTROPY STAND ON THE SAME GROUND.',
    'ONE FINAL STRIKE DECIDES THE EXISTENCE OF THIS WORLD.',
  ],
};

export const DEFEAT_STORY = {
  header: 'DIVINE SHIELD SHATTERED',
  subtext: 'THE OLYMPIAN GUARDIAN HAS FALLEN // RAGNAROK HAS COMMENCED',
  mainTitle: 'EVIL PREVAILS',
  lore: 'RA-ONE ASCENDS THE BLACKENED PYRE. THE DIVINE LIGHT IS EXTINGUISHED, AND THE NORDIC FIRE RULES OVER THE ASHES.',
};

export const VICTORY_STORY = {
  header: 'THE DESTROYER VANQUISHED',
  subtext: 'GUARDIAN PROTOCOL FULFILLED // THE CELESTIAL DAWN IS RESTORED',
  mainTitle: 'LIGHT SURVIVES',
  lore: 'WITH ZEUS’S WRATH AND ATHENA’S AEGIS, G-ONE SHATTERS THE CORRUPT ESSENCE OF RA-ONE. THE REALM IS RENEWED IN RADIANT GLORY.',
};

export interface RevealCue {
  from: number;
  to: number;
  text: string;
}

export interface RealmRevealConfig {
  video: string;
  cues?: RevealCue[];
}

export const REALM_REVEALS: Record<number, RealmRevealConfig> = {
  1: {
    video: '/images/level1_reveal.mp4',
    cues: [
      { from: 0.05, to: 0.22, text: 'The Heart Crystal has fractured. Reality is next.' },
      { from: 0.28, to: 0.46, text: 'A guardian wakes with no memory of the war that made him.' },
      { from: 0.52, to: 0.7, text: 'What corrupted the sanctuary still moves within it.' },
      { from: 0.76, to: 0.92, text: 'The first fragment of the Protocol waits ahead.' },
    ],
  },
  2: {
    video: '/images/level2-reveal.mp4',
    cues: [
      { from: 0.04, to: 0.18, text: "The skyway falls away. Beyond the fracture lies the burning crucible of Ra-One's domain." },
      { from: 0.22, to: 0.38, text: "Infernal Fortress—consecrated to entropy, forged of volcanic iron and molten fire." },
      { from: 0.42, to: 0.58, text: "Deep inside, a corrupted dimensional reactor fractures the bedrock of reality." },
      { from: 0.62, to: 0.78, text: "At the threshold of the inner sanctum, The Last Warden awakens." },
      { from: 0.82, to: 0.96, text: "Breach the citadel. Stabilize the core. Enter Realm II — INFERNAL FORTRESS." },
    ],
  },
};

export function getRealmReveal(level: number): RealmRevealConfig | undefined {
  return REALM_REVEALS[level];
}

