import * as Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { ArenaScene } from '../scenes/ArenaScene';
import { VictoryScene } from '../scenes/VictoryScene';
import { DefeatScene } from '../scenes/DefeatScene';

/** Logical design resolution - Scale.FIT letterboxes this into the real canvas. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#03060d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1750 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
      transparent: false,
    },
    fps: {
      target: 60,
      smoothStep: true,
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
      windowEvents: true,
    },
    disableContextMenu: true,
    // The opening cinematic is now the React <IntroCinematic> video; the old
    // StoryScene (spaceship / starfield / code panels) has been retired so the
    // game has exactly one startup sequence.
    scene: [BootScene, PreloadScene, MainMenuScene, ArenaScene, VictoryScene, DefeatScene],
  };
};
