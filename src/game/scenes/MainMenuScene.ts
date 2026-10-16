import * as Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';
import { HERO, VILLAIN } from '../art/palette';
import { bandRect } from '../art/draw';

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

    const bg = this.add.graphics();
    bandRect(bg, 0, 0, width, height, 0x030712, 0x0b1020, 40);
    this.owned.push(bg);

    // Faction glows on either side.
    const glowL = this.add.image(width * 0.22, height * 0.5, 'particle_blue').setScale(40).setAlpha(0.12).setBlendMode(Phaser.BlendModes.ADD);
    const glowR = this.add.image(width * 0.78, height * 0.5, 'particle_red').setScale(40).setAlpha(0.12).setBlendMode(Phaser.BlendModes.ADD);
    this.owned.push(glowL, glowR);
    this.tweens.add({ targets: glowL, alpha: 0.2, scale: 44, yoyo: true, repeat: -1, duration: 2600 });
    this.tweens.add({ targets: glowR, alpha: 0.2, scale: 44, yoyo: true, repeat: -1, duration: 2200 });

    if (this.textures.exists('particle_blue')) {
      const blue = this.add.particles(width * 0.22, height * 0.58, 'particle_blue', {
        speed: { min: 20, max: 90 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 1600,
        frequency: 90,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.owned.push(blue);
    }
    if (this.textures.exists('particle_red')) {
      const red = this.add.particles(width * 0.78, height * 0.58, 'particle_red', {
        speed: { min: 20, max: 90 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 1600,
        frequency: 90,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.owned.push(red);
    }

    // Standing figures.
    if (this.anims.exists('gone-idle')) {
      const gone = this.add.sprite(width * 0.24, height * 0.78, 'gone_idle', 0);
      gone.setScale(0.72).setDepth(5);
      gone.play('gone-idle');
      this.owned.push(gone);
    }
    if (this.anims.exists('raone-idle')) {
      const raone = this.add.sprite(width * 0.76, height * 0.8, 'raone_idle', 0);
      raone.setScale(0.72).setFlipX(true).setDepth(5);
      raone.play('raone-idle');
      this.owned.push(raone);
    }

    // Central clash seam.
    const seam = this.add.graphics();
    seam.setDepth(3);
    this.owned.push(seam);
    const seamTween = this.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 4200,
      loop: -1,
      onUpdate: (tw) => {
        seam.clear();
        const t = tw.getValue() ?? 0;
        const offset = Math.sin((t * Math.PI) / 180) * 36;
        seam.lineStyle(2, HERO.energy, 0.3);
        seam.lineBetween(width * 0.5 + offset, 0, width * 0.5 - offset, height);
        seam.lineStyle(2, VILLAIN.energy, 0.3);
        seam.lineBetween(width * 0.5 - offset, 0, width * 0.5 + offset, height);
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => seamTween.stop());

    // Ground glow.
    const floor = this.add.graphics().setDepth(2);
    floor.fillStyle(HERO.energyDim, 0.12);
    floor.fillEllipse(width * 0.24, height * 0.9, 260, 40);
    floor.fillStyle(VILLAIN.energyDim, 0.12);
    floor.fillEllipse(width * 0.76, height * 0.9, 260, 40);
    this.owned.push(floor);

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'MAIN_MENU');
    AudioManager.getInstance().playMusic('menu');

    const onStart = () => this.scene.start('StoryScene');
    EventBus.once(GAME_EVENTS.START_GAME, onStart);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.START_GAME, onStart);
      this.owned.forEach((o) => o.destroy());
      this.owned = [];
    });
  }
}
