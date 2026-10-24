import * as Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';

/**
 * Ending A (the villain's) — "EVIL PREVAILS". A ruined skyline under a
 * dominant Ra-One silhouette with periodic red lightning.
 */
export class DefeatScene extends Phaser.Scene {
  private currentLevel = 1;
  /** True when the player died in the boss fight, so retry resumes there. */
  private fromCheckpoint = false;

  constructor() {
    super({ key: 'DefeatScene' });
  }

  init(data: { level?: number; fromCheckpoint?: boolean }) {
    this.currentLevel = data?.level || 1;
    this.fromCheckpoint = Boolean(data?.fromCheckpoint);
  }

  create() {
    const { width, height } = this.cameras.main;

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'DEFEAT');
    AudioManager.getInstance().playMusic('defeat');

    // Clean dark background for Phaser canvas; React's GameOverScreen renders the high-res defeat artwork
    const bg = this.add.graphics();
    bg.fillStyle(0x050811, 1);
    bg.fillRect(0, 0, width, height);

    const onRetry = () =>
      this.scene.start('ArenaScene', {
        level: this.currentLevel,
        fromCheckpoint: this.fromCheckpoint,
      });
    const onReplayStory = () => this.scene.start('ArenaScene', { level: 1, fromCheckpoint: false });
    const onQuit = () => this.scene.start('MainMenuScene');

    EventBus.once(GAME_EVENTS.RESTART_LEVEL, onRetry);
    EventBus.once(GAME_EVENTS.RESTART_STORY, onReplayStory);
    EventBus.once(GAME_EVENTS.QUIT_TO_MENU, onQuit);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, onRetry);
      EventBus.off(GAME_EVENTS.RESTART_STORY, onReplayStory);
      EventBus.off(GAME_EVENTS.QUIT_TO_MENU, onQuit);
    });
  }
}
