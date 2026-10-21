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
  title: 'THE RUINED CITADEL',
  subtitle: 'CHAPTER II — FALLEN METROPOLIS',
  text: [
    'The volcanic vanguard has crumbled, yet the destroyer endures.',
    'Ra-One has ascended to the spires of the shattered metropolis.',
    'Beware the falling debris and the fury of his aerial barrage.',
  ],
  speaker: 'NARRATOR',
  visualCues: {
    skyColor: '#0a0d18',
    lightning: 'red',
  },
};

export const LEVEL_3_TRANSITION: StorySlide = {
  id: 'transition-l3',
  title: 'THE FINAL DIVINE RECKONING',
  subtitle: 'CHAPTER III — THE ZERO-DAY ABYSS  //  ONE HIT DECIDES',
  text: [
    'The boundary between Olympus and the abyss has shattered.',
    'All mortal armor is stripped bare. Only pure divine spirit remains.',
    'A single decisive blow will dictate whether light survives or darkness rules.',
  ],
  speaker: 'SYSTEM',
  visualCues: {
    skyColor: '#02020a',
    lightning: 'blue',
  },
};

/**
 * Narration shown when entering each realm after the first.
 *
 * Keyed by the realm being entered, so `REALM_TRANSITIONS[3]` plays on the way
 * into Void Canyons. One world degrading, not six unrelated places.
 */
export const REALM_TRANSITIONS: Record<number, string[]> = {
  2: [
    'THE SKY-FORTRESS HAS FALLEN BEHIND YOU.',
    'WHAT BURNS AHEAD WAS ONCE THE SAME STONE.',
    'THE CORRUPTION HAS LEARNED TO SPREAD.',
  ],
  3: [
    'THE PROTOCOL NO LONGER HOLDS THE BOUNDARY.',
    'MATTER AND CODE BLEED INTO ONE ANOTHER.',
    'NOTHING HERE WILL STAY BENEATH YOUR FEET.',
  ],
  4: [
    'BEYOND THE RIFT, A FRAGMENT OF ORDER SURVIVES.',
    'THE OBSERVATORY HAS WATCHED SINCE BEFORE THE FRACTURE.',
    'ITS LIGHT-BRIDGES ANSWER ONLY TO TIMING.',
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
