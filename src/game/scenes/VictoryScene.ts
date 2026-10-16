import * as Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';
import { HERO } from '../art/palette';
import { bandRect } from '../art/draw';

/**
 * Ending A — "LIGHT SURVIVES". Calm, blue, a city slowly re-lighting behind an
 * alert (not celebrating) G-One. The React `VictoryScreen` overlays the title
 * card and buttons on top of this backdrop.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'VICTORY');
    AudioManager.getInstance().playMusic('victory');

    const bg = this.add.graphics();
    bandRect(bg, 0, 0, width, height, 0x020617, 0x0c4a6e, 36);

    const city = this.add.graphics();
    for (let i = 0; i < 11; i++) {
      const bh = 180 + Math.sin(i) * 80;
      city.fillStyle(0x082f49, 0.8);
      city.fillRect(i * 120, height - bh - 60, 110, bh);
    }
    for (let i = 0; i < 11; i++) {
      const bh = 180 + Math.sin(i) * 80;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          city.fillStyle(HERO.energy, 0.2);
          city.fillRect(i * 120 + 20 + c * 25, height - bh - 40 + r * 30, 14, 14);
        }
      }
    }
    // Windows relight progressively.
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 3200,
      onUpdate: (tw) => city.setAlpha(0.3 + 0.7 * (tw.getValue() ?? 0)),
    });

    if (this.textures.exists('shockwave_ring')) {
      const burst = this.add.image(width / 2, height * 0.38, 'shockwave_ring');
      burst.setScale(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: burst, scaleX: 4, scaleY: 4, alpha: 0.2, duration: 3000, yoyo: true, repeat: -1 });
    }

    if (this.textures.exists('particle_blue')) {
      const particles = this.add.particles(width / 2, height - 50, 'particle_blue', {
        speedY: { min: -120, max: -40 },
        speedX: { min: -40, max: 40 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 3000,
        frequency: 70,
        x: { min: -width / 2, max: width / 2 },
        blendMode: Phaser.BlendModes.ADD,
      });
      particles.setDepth(5);
    }

    if (this.anims.exists('gone-idle')) {
      const gone = this.add.sprite(width / 2, height * 0.6, 'gone_idle', 0);
      gone.setScale(1.3).setDepth(10);
      gone.play('gone-idle');
    }

    const onPlayAgain = () => this.scene.start('ArenaScene', { level: 1 });
    const onReplayStory = () => this.scene.start('StoryScene');
    const onQuit = () => this.scene.start('MainMenuScene');

    EventBus.once(GAME_EVENTS.RESTART_LEVEL, onPlayAgain);
    EventBus.once(GAME_EVENTS.RESTART_STORY, onReplayStory);
    EventBus.once(GAME_EVENTS.QUIT_TO_MENU, onQuit);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, onPlayAgain);
      EventBus.off(GAME_EVENTS.RESTART_STORY, onReplayStory);
      EventBus.off(GAME_EVENTS.QUIT_TO_MENU, onQuit);
    });
  }
}
