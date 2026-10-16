import * as Phaser from 'phaser';

export type ProjectileOwner = 'player' | 'boss';

export interface FireOptions {
  x: number;
  y: number;
  texture: string;
  /** Animation key to play, if the texture was baked as a sheet. */
  anim?: string;
  speed: number;
  /** Direction in radians. */
  angle: number;
  damage: number;
  owner: ProjectileOwner;
  lifespan?: number;
  /** Body size in world pixels; defaults to the frame size. */
  bodyWidth?: number;
  bodyHeight?: number;
  /** Display scale. */
  scale?: number;
  /** Spin instead of pointing along the velocity. */
  spin?: number;
  /** Pass through targets instead of being consumed on hit. */
  pierce?: boolean;
  /** Ignore the Aegis Shield (used sparingly - always telegraphed). */
  unblockable?: boolean;
  /** Stretch horizontally to this display width (beams). */
  stretchTo?: number;
  /** Attach a particle trail. Reserved for a handful of heavy projectiles. */
  trail?: boolean;
  /** Gravity scale, 0 for straight-line shots. */
  gravityY?: number;
}

/**
 * A pooled projectile. Instances are recycled through a physics Group, so a
 * long fight never allocates: `group.get()` revives a dead projectile and
 * `fire()` reconfigures it.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage = 1;
  public owner: ProjectileOwner = 'player';
  public pierce = false;
  public unblockable = false;

  private expiresAt = 0;
  private spin = 0;
  private trail?: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Targets already damaged by this piercing shot. */
  private struck = new WeakSet<object>();

  constructor(scene: Phaser.Scene, x = 0, y = 0, texture = 'proj_pulse') {
    super(scene, x, y, texture);
    scene.physics.add.existing(this);
    this.setDepth(18);
    this.setBlendMode(Phaser.BlendModes.ADD);
    this.setActive(false);
    this.setVisible(false);
  }

  public fire(opts: FireOptions) {
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.struck = new WeakSet();
    this.damage = opts.damage;
    this.owner = opts.owner;
    this.pierce = !!opts.pierce;
    this.unblockable = !!opts.unblockable;
    this.spin = opts.spin ?? 0;

    this.setTexture(opts.texture);
    this.setPosition(opts.x, opts.y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(opts.scale ?? 1);
    this.setRotation(this.spin ? 0 : opts.angle);

    if (opts.anim && this.scene.anims.exists(opts.anim)) {
      this.play(opts.anim, true);
    } else {
      this.stop();
    }

    if (opts.stretchTo) {
      this.setRotation(opts.angle);
      this.displayWidth = opts.stretchTo;
      this.setOrigin(0, 0.5);
    } else {
      this.setOrigin(0.5, 0.5);
    }

    if (body) {
      body.enable = true;
      body.setAllowGravity(!!opts.gravityY);
      body.setGravityY(opts.gravityY ?? 0);
      body.setVelocity(Math.cos(opts.angle) * opts.speed, Math.sin(opts.angle) * opts.speed);
      const w = opts.bodyWidth ?? this.displayWidth * 0.55;
      const h = opts.bodyHeight ?? this.displayHeight * 0.55;
      body.setSize(w / (this.scaleX || 1), h / (this.scaleY || 1), true);
      if (opts.stretchTo) {
        // Beams keep an axis-aligned box that covers their full reach.
        body.setSize(opts.stretchTo / (this.scaleX || 1), h / (this.scaleY || 1), false);
        body.setOffset(0, (this.height - h / (this.scaleY || 1)) / 2);
      }
    }

    this.expiresAt = this.scene.time.now + (opts.lifespan ?? 2600);

    if (opts.trail && this.scene.textures.exists(this.trailKey())) {
      this.trail?.destroy();
      this.trail = this.scene.add.particles(0, 0, this.trailKey(), {
        follow: this,
        speed: { min: 10, max: 60 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.75, end: 0 },
        lifespan: 260,
        frequency: 22,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.trail.setDepth(17);
    }
  }

  private trailKey() {
    return this.owner === 'player' ? 'particle_blue' : 'particle_red';
  }

  /**
   * Returns false if this specific target was already struck by this piercing
   * shot (so an Arc Burst can shred a boss and chew through its own back-up
   * shots in the same frame without double-dipping on either).
   */
  public registerHit(target: object): boolean {
    if (!this.pierce) return true;
    if (this.struck.has(target)) return false;
    this.struck.add(target);
    return true;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    if (this.spin) this.rotation += this.spin * (delta / 16.666);

    const bounds = this.scene.physics.world.bounds;
    if (
      time >= this.expiresAt ||
      this.x < bounds.x - 240 ||
      this.x > bounds.right + 240 ||
      this.y < bounds.y - 320 ||
      this.y > bounds.bottom + 320
    ) {
      this.kill(false);
    }
  }

  /** Return to the pool, optionally leaving an impact spark behind. */
  public kill(spark = true) {
    if (!this.active) return;

    if (spark && this.scene) {
      const key = this.trailKey();
      if (this.scene.textures.exists(key)) {
        const e = this.scene.add.particles(this.x, this.y, key, {
          speed: { min: 60, max: 200 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 240,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        });
        e.setDepth(19);
        e.explode(6);
        this.scene.time.delayedCall(320, () => e.destroy());
      }
    }

    if (this.trail) {
      this.trail.stop();
      const t = this.trail;
      this.trail = undefined;
      this.scene.time.delayedCall(320, () => t.destroy());
    }

    this.stop();
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.stop();
      body.enable = false;
    }
  }

  /** Back-compat alias used by older call sites. */
  public destroyWithEffect(spark = true) {
    this.kill(spark);
  }
}

/** Create a pre-warmed pool for one side of the fight. */
export function createProjectilePool(scene: Phaser.Scene, size = 64) {
  return scene.physics.add.group({
    classType: Projectile,
    maxSize: size,
    runChildUpdate: true,
  });
}

/** Grab a projectile from the pool and fire it. Returns null if the pool is full. */
export function spawnProjectile(
  group: Phaser.Physics.Arcade.Group,
  opts: FireOptions
): Projectile | null {
  const proj = group.get(opts.x, opts.y) as Projectile | null;
  if (!proj) return null;
  proj.fire(opts);
  return proj;
}
