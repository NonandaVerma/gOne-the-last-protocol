import * as Phaser from 'phaser';
import { SaveManager } from './SaveManager';
import { HERO, VILLAIN, ACCENT } from '../art/palette';

export type Faction = 'player' | 'boss' | 'neutral';

export interface ImpactOptions {
  /** Visual scale multiplier. */
  scale?: number;
  /** Number of sparks. */
  sparks?: number;
  /** Expanding shockwave ring. */
  ring?: boolean;
  /** Milliseconds of hit-stop. */
  freeze?: number;
  /** Camera shake strength (0..1 Phaser units). */
  shake?: number;
}

/**
 * Game feel layer: hit-stop, directional camera kicks, impact bursts,
 * after-images and floating combat text.
 *
 * Every effect respects the player's "screen shake" and "reduced motion"
 * accessibility settings.
 */
export class Juice {
  private scene: Phaser.Scene;
  private freezeUntil = 0;
  private frozen = false;
  private depth: number;

  constructor(scene: Phaser.Scene, depth = 40) {
    this.scene = scene;
    this.depth = depth;

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.frozen = false;
      this.freezeUntil = 0;
    });
  }

  private get motionOk() {
    return !SaveManager.getSettings().reducedMotion;
  }

  private get shakeOk() {
    const s = SaveManager.getSettings();
    return s.screenShake && !s.reducedMotion;
  }

  /** Must be called from the scene's update loop. */
  public update(time: number) {
    if (this.frozen && time >= this.freezeUntil) {
      this.frozen = false;
      this.scene.physics.world.resume();
      this.scene.tweens.timeScale = 1;
    }
  }

  /** Brief world freeze that makes hits land with weight. */
  public hitStop(ms: number) {
    if (!this.motionOk || ms <= 0) return;
    const until = this.scene.time.now + ms;
    if (this.frozen) {
      this.freezeUntil = Math.max(this.freezeUntil, until);
      return;
    }
    this.frozen = true;
    this.freezeUntil = until;
    this.scene.physics.world.pause();
    this.scene.tweens.timeScale = 0.25;
  }

  /** Release any active freeze immediately (used when a scene is torn down). */
  public clearFreeze() {
    if (!this.frozen) return;
    this.frozen = false;
    this.scene.physics.world.resume();
    this.scene.tweens.timeScale = 1;
  }

  public shake(intensity: number, duration = 220) {
    if (!this.shakeOk) return;
    this.scene.cameras.main.shake(duration, intensity, false);
  }

  /** Directional camera nudge - reads far better than a symmetric shake. */
  public kick(angle: number, strength = 10, duration = 160) {
    if (!this.motionOk) return;
    const cam = this.scene.cameras.main;
    const ox = Math.cos(angle) * strength;
    const oy = Math.sin(angle) * strength;
    cam.scrollX += ox;
    cam.scrollY += oy;
    this.scene.tweens.add({
      targets: cam,
      scrollX: cam.scrollX - ox,
      scrollY: cam.scrollY - oy,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  public zoomPunch(amount = 0.035, duration = 140) {
    if (!this.motionOk) return;
    const cam = this.scene.cameras.main;
    const base = 1;
    cam.setZoom(base + amount);
    this.scene.tweens.add({
      targets: cam,
      zoom: base,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  /** Full-screen colour wash, e.g. for overdrive or a boss phase change. */
  public flash(color: number, alpha = 0.35, duration = 220) {
    if (!this.motionOk) return;
    const c = Phaser.Display.Color.IntegerToRGB(color);
    const k = Phaser.Math.Clamp(alpha, 0, 1);
    this.scene.cameras.main.flash(duration, c.r * k, c.g * k, c.b * k, true);
  }

  /** The signature hit effect: burst sprite, sparks, optional ring and freeze. */
  public impact(x: number, y: number, faction: Faction, opts: ImpactOptions = {}) {
    const scale = opts.scale ?? 1;
    const isPlayer = faction === 'player';
    const burstKey = isPlayer ? 'impact_blue' : 'impact_red';
    const particleKey = isPlayer ? 'particle_blue' : 'particle_red';
    const color = isPlayer ? HERO.energy : VILLAIN.energy;

    if (this.scene.textures.exists(burstKey)) {
      const burst = this.scene.add.sprite(x, y, burstKey, 0);
      burst.setDepth(this.depth);
      burst.setBlendMode(Phaser.BlendModes.ADD);
      burst.setScale(scale * 0.8);
      burst.setRotation(Math.random() * Math.PI * 2);
      this.scene.tweens.add({
        targets: burst,
        scale: scale * 1.5,
        alpha: 0,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => burst.destroy(),
      });
      // Step through the baked frames for a crunchier pop.
      let f = 0;
      const stepper = this.scene.time.addEvent({
        delay: 45,
        repeat: 3,
        callback: () => {
          f++;
          if (burst.active) burst.setFrame(Math.min(4, f));
        },
      });
      this.scene.time.delayedCall(280, () => stepper.remove(false));
    }

    const sparks = opts.sparks ?? 12;
    if (sparks > 0 && this.scene.textures.exists(particleKey)) {
      const emitter = this.scene.add.particles(x, y, particleKey, {
        speed: { min: 90 * scale, max: 320 * scale },
        angle: { min: 0, max: 360 },
        scale: { start: 0.75 * scale, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 180, max: 420 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      emitter.setDepth(this.depth);
      emitter.explode(sparks);
      this.scene.time.delayedCall(520, () => emitter.destroy());
    }

    if (opts.ring) {
      const ringKey = isPlayer ? 'shockwave_ring' : 'shockwave_ring_red';
      if (this.scene.textures.exists(ringKey)) {
        const ring = this.scene.add.image(x, y, ringKey);
        ring.setDepth(this.depth - 1);
        ring.setBlendMode(Phaser.BlendModes.ADD);
        ring.setScale(0.15 * scale);
        ring.setAlpha(0.9);
        this.scene.tweens.add({
          targets: ring,
          scale: 1.5 * scale,
          alpha: 0,
          duration: 420,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });
      }
    }

    if (opts.freeze) this.hitStop(opts.freeze);
    if (opts.shake) this.shake(opts.shake, 200);
    void color;
  }

  /** Dust kicked up on landings and hard stops. */
  public dust(x: number, y: number, amount = 6, tint = 0xb9a893) {
    if (!this.scene.textures.exists('dust_puff')) return;
    for (let i = 0; i < amount; i++) {
      const puff = this.scene.add.image(
        x + Phaser.Math.Between(-18, 18),
        y - Phaser.Math.Between(0, 6),
        'dust_puff'
      );
      puff.setDepth(this.depth - 5);
      puff.setTint(tint);
      puff.setAlpha(0.6);
      puff.setScale(Phaser.Math.FloatBetween(0.3, 0.7));
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + Phaser.Math.Between(-40, 40),
        y: puff.y - Phaser.Math.Between(6, 22),
        scale: puff.scale * 2.1,
        alpha: 0,
        duration: Phaser.Math.Between(420, 720),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
  }

  /** Ghost trail frame cloned from a live sprite. */
  public afterImage(
    source: Phaser.GameObjects.Sprite,
    tint: number,
    life = 260,
    startAlpha = 0.55
  ) {
    if (!this.motionOk || !source.active) return;
    const ghost = this.scene.add.sprite(source.x, source.y, source.texture.key, source.frame.name);
    ghost.setFlipX(source.flipX);
    ghost.setScale(source.scaleX, source.scaleY);
    ghost.setDepth(source.depth - 1);
    ghost.setTint(tint);
    ghost.setAlpha(startAlpha);
    ghost.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: life,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  /** Floating combat / status text. */
  public floatText(
    x: number,
    y: number,
    message: string,
    color: number = ACCENT.white,
    size: number = 20
  ) {
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const text = this.scene.add
      .text(x, y, message, {
        fontFamily: 'Orbitron, Rajdhani, sans-serif',
        fontSize: `${size}px`,
        color: hex,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(this.depth + 5);

    this.scene.tweens.add({
      targets: text,
      y: y - 52,
      alpha: 0,
      scale: 1.15,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /*
   * `taunt()` was removed: it drew boss/objective dialogue directly on the
   * Phaser canvas with a hardcoded 'Rajdhani, sans-serif' font string, which
   * does not reliably resolve to the same next/font-loaded Rajdhani the React
   * UI uses — a second, visually inconsistent text pipeline sitting in the
   * same bottom band as `NarrationOverlay`. All former call sites now emit
   * `GAME_EVENTS.SHOW_SUBTITLE` instead, so there's one subtitle system,
   * one font, one position.
   */
}
