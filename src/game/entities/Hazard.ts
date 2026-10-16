import * as Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { Juice } from '../systems/Juice';

/**
 * Environmental hazards.
 *
 * Contract: nothing in here ever damages the player without first showing a
 * telegraph on the ground for at least `WARNING_MS`. The warning is animated and
 * accelerates as impact approaches, so danger is readable from motion as well as
 * from colour.
 */
const WARNING_MS = 700;

export class HazardManager {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.Group;
  private juice: Juice;
  private groundTop: number;
  private alive = true;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(scene: Phaser.Scene, juice: Juice, groundTop: number) {
    this.scene = scene;
    this.juice = juice;
    this.groundTop = groundTop;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearAll());
  }

  public getGroup() {
    return this.group;
  }

  private track(ev: Phaser.Time.TimerEvent) {
    this.timers.push(ev);
    return ev;
  }

  /** Telegraph on the ground, then drop a burning chunk of the city. */
  public dropDebris(targetX: number) {
    if (!this.alive) return;
    const x = Phaser.Math.Clamp(
      targetX,
      this.scene.physics.world.bounds.x + 60,
      this.scene.physics.world.bounds.right - 60
    );

    const warn = this.scene.add.sprite(x, this.groundTop - 8, 'hazard_warning', 0);
    warn.setDepth(12).setAlpha(0.85).setScale(0.55);
    warn.play('hazard-warn');

    this.scene.tweens.add({
      targets: warn,
      scaleX: 0.9,
      scaleY: 0.9,
      alpha: 1,
      duration: WARNING_MS,
      ease: 'Quad.easeIn',
    });

    this.track(
      this.scene.time.delayedCall(WARNING_MS, () => {
        warn.destroy();
        if (!this.alive) return;
        this.spawnFallingChunk(x);
      })
    );
  }

  private spawnFallingChunk(x: number) {
    const debris = this.scene.physics.add.sprite(x, -80, 'hazard_debris');
    debris.setDepth(21).setScale(0.62);
    this.group.add(debris);

    const body = debris.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(1150);
    body.setSize(70, 64, true);
    debris.setAngularVelocity(Phaser.Math.Between(-320, 320));

    const trail = this.scene.add.particles(0, 0, 'particle_ember', {
      follow: debris,
      speed: { min: 20, max: 90 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 420,
      frequency: 22,
      blendMode: Phaser.BlendModes.ADD,
    });
    trail.setDepth(20);

    const watcher = this.track(
      this.scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (!debris.active) {
            watcher.remove(false);
            return;
          }
          if (debris.y >= this.groundTop - 24) {
            watcher.remove(false);
            this.impact(debris, x);
            trail.stop();
            this.scene.time.delayedCall(500, () => trail.destroy());
          }
        },
      })
    );
  }

  private impact(debris: Phaser.Physics.Arcade.Sprite, x: number) {
    AudioManager.getInstance().playExplosion();
    this.juice.shake(0.014, 280);
    this.juice.impact(x, this.groundTop - 16, 'boss', { scale: 1.8, sparks: 20, ring: true });
    this.juice.dust(x, this.groundTop, 8, 0x7a5a48);
    debris.destroy();
  }

  /**
   * A strip of ground that becomes lethal for a short window.
   * Used in the later arenas to deny space rather than to snipe the player.
   */
  public groundSurge(centerX: number, width = 260) {
    if (!this.alive) return;
    const warn = this.scene.add.sprite(centerX, this.groundTop - 54, 'surge_warning', 0);
    warn.setDepth(12).setAlpha(0.9);
    warn.setDisplaySize(width, 120);
    warn.setBlendMode(Phaser.BlendModes.ADD);
    warn.play('surge-warn');

    this.track(
      this.scene.time.delayedCall(WARNING_MS + 150, () => {
        warn.destroy();
        if (!this.alive) return;

        const zone = this.scene.physics.add.sprite(centerX, this.groundTop - 60, 'surge_warning', 3);
        zone.setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
        zone.setDisplaySize(width, 130);
        zone.play('surge-warn');
        this.group.add(zone);

        const body = zone.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(width / (zone.scaleX || 1), 130 / (zone.scaleY || 1), true);

        AudioManager.getInstance().playArcBurst();
        this.juice.shake(0.01, 200);

        this.track(
          this.scene.time.delayedCall(620, () => {
            this.scene.tweens.add({
              targets: zone,
              alpha: 0,
              duration: 180,
              onComplete: () => zone.destroy(),
            });
          })
        );
      })
    );
  }

  public clearAll() {
    this.alive = false;
    this.timers.forEach((t) => t.remove(false));
    this.timers = [];
    this.group.clear(true, true);
  }
}
