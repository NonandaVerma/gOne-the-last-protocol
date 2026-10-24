import * as Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';

/**
 * Main menu backdrop: the two factions' colours in open conflict across a
 * vertical seam, with G-One and Ra-One squared off in silhouette. All React
 * menu chrome (title, buttons) renders on top via `MainMenu.tsx`.
 */
export class MainMenuScene extends Phaser.Scene {
  private owned: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Clean dark background for Phaser canvas; React's MainMenu renders the high-res key art and UI
    const bg = this.add.graphics();
    bg.fillStyle(0x030712, 1);
    bg.fillRect(0, 0, width, height);
    this.owned.push(bg);

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'MAIN_MENU');
    AudioManager.getInstance().playMusic('menu');

    // The opening cinematic is the React <IntroCinematic> video shown before
    // this menu, so Play always drops straight into a realm — Realm I for a
    // fresh run, or the furthest unlocked realm when resuming.
    const onStart = (payload?: { level?: number }) => {
      const level = payload?.level ?? 1;
      this.scene.start('ArenaScene', { level, fromCheckpoint: false });
    };
    EventBus.on(GAME_EVENTS.START_GAME, onStart);

    // If autoplay was requested via URL, trigger once Preload & MainMenu are ready
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autoplay') === 'true') {
          const lvl = parseInt(params.get('level') ?? '1', 10);
          this.time.delayedCall(200, () => {
            onStart({ level: lvl });
          });
        }
      } catch (_) {}
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.START_GAME, onStart);
      this.owned.forEach((o) => o.destroy());
      this.owned = [];
    });
  }
}
