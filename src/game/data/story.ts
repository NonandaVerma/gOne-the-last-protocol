import { StorySlide } from '../types/game';

export const OPENING_STORY: StorySlide[] = [
  {
    id: 'intro-1',
    title: 'THE TRANSMISSION',
    subtitle: 'ORBITAL SECTOR 7 // RUINED ATMOSPHERE',
    text: [
      'EMERGENCY TRANSFER INITIATED.',
      'DESTINATION: EARTH.',
      'GUARDIAN PROTOCOL: ACTIVE.',
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
    title: 'THE ARRIVAL',
    subtitle: 'IMPACT ZONE // GROUND ZERO',
    text: [
      'WHEN THE WORLD LOST ITS LIGHT,',
      'ONE SIGNAL REFUSED TO DIE.',
      'G-ONE HAS ENTERED THE COMBAT ARENA.',
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
    title: 'THE ANOMALY',
    subtitle: 'THE THRONE OF DESTRUCTION',
    text: [
      'THREAT DETECTED: RA-ONE.',
      '"You were designed to protect. I was designed to end."',
      'GUARDIAN PROTOCOL ENGAGED.',
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
  title: 'METROPOLIS INFECTION',
  subtitle: 'THE NETWORK EXPANDS',
  text: [
    'THE PHYSICAL SHELL WAS DESTROYED.',
    'THE CORRUPT PROTOCOL SURVIVED.',
    'THE ENTIRE CITY BECAME HIS WEAPON.',
  ],
  speaker: 'NARRATOR',
  visualCues: {
    skyColor: '#0a0d18',
    lightning: 'red',
  },
};

export const LEVEL_3_TRANSITION: StorySlide = {
  id: 'transition-l3',
  title: 'REALITY FRACTURE',
  subtitle: 'THE ZERO-DAY ABYSS',
  text: [
    'THE ENERGY NETWORK HAS SURPASSED CRITICAL THRESHOLD.',
    'THE BOUNDARY BETWEEN CODE AND PHYSICAL MATTER IS SHATTERED.',
    'ONE FINAL STRIKE WILL DETERMINE THE EXISTENCE OF THIS WORLD.',
  ],
  speaker: 'SYSTEM',
  visualCues: {
    skyColor: '#02020a',
    lightning: 'blue',
  },
};

export const DEFEAT_STORY = {
  header: 'GUARDIAN SIGNAL LOST',
  subtext: 'PROTECTION PROTOCOL TERMINATED // THE LAST LIGHT HAS FALLEN',
  mainTitle: 'EVIL PREVAILS',
  lore: 'RA-ONE HAS CLAIMED THE FINAL PROTOCOL. THE WORLD WILL REMEMBER THE NIGHT IT WENT DARK.',
};

export const VICTORY_STORY = {
  header: 'RA-ONE CORE: OFFLINE',
  subtext: 'GUARDIAN PROTOCOL: RESTORED // THE FINAL SIGNAL HAS BEEN ANSWERED',
  mainTitle: 'LIGHT SURVIVES',
  lore: 'THE WORLD WAS NOT SAVED BY POWER ALONE. IT WAS SAVED BY THE ONE WHO REFUSED TO ABANDON IT.',
};
