import * as Phaser from 'phaser';
import { OPENING_STORY } from '../data/story';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';
import { HERO, VILLAIN } from '../art/palette';
import { bandRect } from '../art/draw';

/**
 * Opening cinematic: three beats (signal -> arrival -> throne) told with the
 * same procedural art the gameplay uses, so there's no tonal seam between the
 * cutscene and the fight it leads into.
 */
export class StoryScene extends Phaser.Scene {
  private isSkipped = false;
  private container?: Phaser.GameObjects.Container;
  private skipPrompt?: Phaser.GameObjects.Text;
  private pendingTimers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super({ key: 'StoryScene' });
  }

  create() {
    this.isSkipped = false;
    const { width, height } = this.cameras.main;

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'STORY_INTRO');
    AudioManager.getInstance().playMusic('battle');

    this.skipPrompt = this.add
      .text(width - 36, 28, '[ SPACE / CLICK TO SKIP ]', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        color: '#3ae9ff',
      })
      .setOrigin(1, 0.5)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    this.skipPrompt.on('pointerdown', () => this.skipIntro());

    this.input.keyboard?.on('keydown-SPACE', () => this.skipIntro());
    this.input.keyboard?.on('keydown-ENTER', () => this.skipIntro());
    this.input.keyboard?.on('keydown-ESC', () => this.skipIntro());

    const onSkip = () => this.skipIntro();
    EventBus.once(GAME_EVENTS.SKIP_INTRO, onSkip);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.SKIP_INTRO, onSkip);
    });

    this.playStep(0);
  }

  private later(delay: number, fn: () => void) {
    const ev = this.time.delayedCall(delay, () => {
      this.pendingTimers = this.pendingTimers.filter((e) => e !== ev);
      if (!this.isSkipped) fn();
    });
    this.pendingTimers.push(ev);
  }

  private playStep(index: number) {
    if (this.isSkipped) return;
    const { width, height } = this.cameras.main;

    this.container?.destroy();
    this.container = this.add.container(0, 0);

    const slide = OPENING_STORY[index];
    if (!slide) {
      this.startGame();
      return;
    }

    EventBus.emit(GAME_EVENTS.STORY_STEP, { index, total: OPENING_STORY.length, slide });

    if (index === 0) this.sceneSignal(width, height);
    else if (index === 1) this.sceneArrival(width, height);
    else this.sceneThrone(width, height);
  }

  private renderCaption(title: string | undefined, subtitle: string | undefined, lines: string[]) {
    if (!this.container) return;
    const { width, height } = this.cameras.main;
    const y = height - 150;

    const panel = this.add.graphics().setDepth(40);
    panel.fillStyle(0x000000, 0.55);
    panel.fillRect(0, y - 40, width, 150);
    panel.lineStyle(1, HERO.energy, 0.3);
    panel.lineBetween(0, y - 40, width, y - 40);
    this.container.add(panel);

    if (title) {
      const t = this.add
        .text(width / 2, y - 16, title, {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '16px',
          color: '#3ae9ff',
          letterSpacing: 4,
        } as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5)
        .setDepth(41);
      this.container.add(t);
    }
    if (subtitle) {
      const s = this.add
        .text(width / 2, y + 8, subtitle, {
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '12px',
          color: '#94a3b8',
        })
        .setOrigin(0.5)
        .setDepth(41);
      this.container.add(s);
    }

    const body = this.add
      .text(width / 2, y + 44, lines.join('\n'), {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '19px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setAlpha(0);
    this.container.add(body);
    this.tweens.add({ targets: body, alpha: 1, duration: 500 });
  }

  // ---------------------------------------------------------------------------
  // Scene 1 — The Signal
  // ---------------------------------------------------------------------------

  private sceneSignal(width: number, height: number) {
    const sky = this.add.graphics().setDepth(0);
    bandRect(sky, 0, 0, width, height, 0x02040a, 0x0b1430, 30);
    this.container!.add(sky);

    for (let i = 0; i < 70; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.7),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 1)
      );
      this.container!.add(star);
    }

    const cloud = this.textures.exists('cloud_band')
      ? this.add.tileSprite(0, height * 0.55, width, 260, 'cloud_band').setOrigin(0, 0).setAlpha(0.6)
      : undefined;
    if (cloud) this.container!.add(cloud);

    const ship = this.add.graphics().setDepth(2);
    ship.fillStyle(0x1b3146, 1);
    ship.fillTriangle(0, 20, 110, 0, 110, 42);
    ship.fillStyle(0x0a0f1d, 1);
    ship.fillTriangle(10, 20, 100, 8, 100, 32);
    ship.fillStyle(HERO.energy, 0.9);
    ship.fillRect(108, 15, 22, 12);
    ship.setPosition(-130, height * 0.34);
    this.container!.add(ship);

    if (this.textures.exists('particle_blue')) {
      const trail = this.add.particles(0, 0, 'particle_blue', {
        speed: { min: 40, max: 120 },
        scale: { start: 1, end: 0 },
        lifespan: 320,
        blendMode: Phaser.BlendModes.ADD,
      });
      trail.startFollow(ship, 118, 22);
      this.container!.add(trail);
    }

    this.tweens.add({
      targets: ship,
      x: width + 160,
      y: height * 0.5,
      duration: 3400,
      ease: 'Linear',
    });

    this.later(4100, () => this.playStep(1));
  }

  // ---------------------------------------------------------------------------
  // Scene 2 — The Arrival
  // ---------------------------------------------------------------------------

  private sceneArrival(width: number, height: number) {
    const sky = this.add.graphics().setDepth(0);
    bandRect(sky, 0, 0, width, height, 0x1a0405, 0x450a0a, 30);
    this.container!.add(sky);

    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x120305, 1);
    ground.fillRect(0, height - 120, width, 120);
    ground.fillStyle(0x000000, 1);
    ground.fillEllipse(width * 0.35, height - 118, 240, 46);
    this.container!.add(ground);

    const capsule = this.add.circle(width * 0.35, -50, 16, HERO.energy);
    capsule.setDepth(2);
    this.container!.add(capsule);

    this.tweens.add({
      targets: capsule,
      y: height - 134,
      duration: 750,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        capsule.destroy();
        AudioManager.getInstance().playExplosion();
        this.cameras.main.shake(380, 0.018);

        if (this.textures.exists('shockwave_ring')) {
          const shock = this.add.image(width * 0.35, height - 118, 'shockwave_ring');
          shock.setScale(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
          this.container?.add(shock);
          this.tweens.add({
            targets: shock,
            scaleX: 5,
            scaleY: 2,
            alpha: 0,
            duration: 560,
            onComplete: () => shock.destroy(),
          });
        }

        if (this.anims.exists('gone-idle')) {
          const gone = this.add.sprite(width * 0.35, height - 140, 'gone_idle', 0);
          gone.setScale(0.9).setAlpha(0).setDepth(4);
          gone.play('gone-idle');
          this.container?.add(gone);
          this.tweens.add({ targets: gone, alpha: 1, y: height - 162, duration: 650 });
        }
      },
    });

    this.later(4300, () => this.playStep(2));
  }

  // ---------------------------------------------------------------------------
  // Scene 3 — The Throne
  // ---------------------------------------------------------------------------

  private sceneThrone(width: number, height: number) {
    const sky = this.add.graphics().setDepth(0);
    bandRect(sky, 0, 0, width, height, 0x1f0404, 0x0d0202, 30);
    this.container!.add(sky);

    const throne = this.add.graphics().setDepth(1);
    throne.fillStyle(0x0d0607, 1);
    throne.fillRect(width * 0.68, height - 330, 170, 250);
    throne.fillStyle(0x2d0606, 1);
    throne.fillTriangle(width * 0.68 - 24, height - 330, width * 0.68 + 85, height - 392, width * 0.68 + 194, height - 330);
    this.container!.add(throne);

    const flash = this.add.graphics().setDepth(5).setAlpha(0);
    flash.fillStyle(VILLAIN.energy, 0.3);
    flash.fillRect(0, 0, width, height);
    this.container!.add(flash);
    this.tweens.add({ targets: flash, alpha: 1, duration: 70, yoyo: true, repeat: 3, onComplete: () => flash.destroy() });

    if (this.anims.exists('raone-idle')) {
      const raone = this.add.sprite(width * 0.74, height - 210, 'raone_idle', 0);
      raone.setScale(1.05).setFlipX(true).setDepth(2);
      raone.play('raone-idle');
      this.container!.add(raone);

      this.later(1100, () => {
        if (!raone.active) return;
        raone.play('raone-strike', true);
        AudioManager.getInstance().playRaOneShoot();

        if (this.textures.exists('proj_raone_orb')) {
          const fireball = this.add.sprite(raone.x - 30, raone.y - 10, 'proj_raone_orb', 0).setDepth(3);
          fireball.play('proj-orb');
          this.container?.add(fireball);
          this.tweens.add({
            targets: fireball,
            x: width * 0.16,
            y: height * 0.68,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 850,
            onComplete: () => {
              this.cameras.main.shake(300, 0.02);
              AudioManager.getInstance().playExplosion();
              this.later(500, () => this.startGame());
            },
          });
        } else {
          this.later(850, () => this.startGame());
        }
      });
    } else {
      this.later(2200, () => this.startGame());
    }
  }

  private skipIntro() {
    if (this.isSkipped) return;
    this.isSkipped = true;
    this.pendingTimers.forEach((t) => t.remove(false));
    this.pendingTimers = [];
    this.startGame();
  }

  private startGame() {
    this.scene.start('ArenaScene', { level: 1 });
  }

  shutdown() {
    this.pendingTimers.forEach((t) => t.remove(false));
    this.pendingTimers = [];
    this.container?.destroy();
    this.skipPrompt?.destroy();
  }
}
