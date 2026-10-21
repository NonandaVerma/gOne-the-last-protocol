import * as Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';
import { VILLAIN } from '../art/palette';
import { bandRect, seeded } from '../art/draw';

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

    const bg = this.add.graphics();
    bandRect(bg, 0, 0, width, height, 0x050000, 0x450a0a, 36);

    const ruins = this.add.graphics();
    const rng = seeded(42);
    ruins.fillStyle(0x0f0202, 0.95);
    for (let i = 0; i < 9; i++) {
      const bh = 150 + rng() * 120;
      ruins.fillRect(i * 150, height - bh - 40, 140, bh);
      ruins.fillTriangle(i * 150, height - bh - 40, i * 150 + 70, height - bh - 90, i * 150 + 140, height - bh - 40);
    }

    if (this.textures.exists('particle_red')) {
      const particles = this.add.particles(width / 2, height - 30, 'particle_red', {
        speedY: { min: -140, max: -40 },
        speedX: { min: -50, max: 50 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 2500,
        frequency: 60,
        x: { min: -width / 2, max: width / 2 },
        blendMode: Phaser.BlendModes.ADD,
      });
      particles.setDepth(5);
    }

    if (this.anims.exists('raone-idle')) {
      const raone = this.add.sprite(width / 2, height * 0.54, 'raone_idle', 0);
      raone.setScale(1.5).setDepth(10).setTint(0xff6677);
      raone.play('raone-idle');
    }

    this.time.addEvent({
      delay: 3400,
      loop: true,
      callback: () => {
        const flash = this.add.graphics();
        flash.fillStyle(VILLAIN.energy, 0.22);
        flash.fillRect(0, 0, width, height);
        this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
      },
    });

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
