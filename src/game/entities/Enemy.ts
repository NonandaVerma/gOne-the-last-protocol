import * as Phaser from 'phaser';
import { EnemyKind, EnemySpec } from '../types/game';
import { VILLAIN } from '../art/palette';
import { ENEMY_FRAME } from '../art/enemies';
import { Juice } from '../systems/Juice';
import { AudioManager } from '../systems/AudioManager';
import { spawnProjectile } from './Projectile';
import { GOne } from './GOne';

/**
 * GRUNT ENEMIES — corruption given crude, hostile form along a realm's
 * traversal approach, distinct from Ra-One himself.
 *
 * Every enemy runs one explicit state machine, independent of kind:
 *
 *   idle -> alert -> telegraph -> attack -> recover -> (idle | alert)
 *                                                -> stagger (on hit, any state but attack)
 *                                                -> dead
 *
 * The contract that matters for fairness: no damage is ever dealt without a
 * preceding `telegraph` of at least `TELEGRAPH_MS`, matching the same rule
 * `StaticHazardField` enforces for environmental hazards.
 */

type EnemyState = 'idle' | 'alert' | 'telegraph' | 'attack' | 'recover' | 'stagger' | 'dead';

const TELEGRAPH_MS = 550;
const RECOVER_MS = 650;
const STAGGER_MS = 260;
const HIT_FLASH_MS = 90;

interface KindConfig {
  frame: { w: number; h: number };
  health: number;
  speed: number;
  /** World-px radius at which `idle` -> `alert`. */
  detectRange: number;
  /** Melee: lunge range. Ranged: preferred standoff distance. */
  engageRange: number;
  contactDamage: number;
  attackCooldownMs: number;
}

const KIND_CONFIG: Record<EnemyKind, KindConfig> = {
  drone: {
    frame: ENEMY_FRAME.drone,
    health: 2,
    speed: 130,
    detectRange: 340,
    engageRange: 46,
    contactDamage: 1,
    attackCooldownMs: 1400,
  },
  seeker: {
    frame: ENEMY_FRAME.seeker,
    health: 2,
    speed: 70,
    detectRange: 460,
    engageRange: 320,
    contactDamage: 1,
    attackCooldownMs: 1800,
  },
  rootstalker: {
    frame: ENEMY_FRAME.rootstalker,
    health: 3,
    speed: 190,
    detectRange: 440,
    engageRange: 70,
    contactDamage: 1,
    attackCooldownMs: 1300,
  },
  sporecaster: {
    frame: ENEMY_FRAME.sporecaster,
    health: 3,
    speed: 0,
    detectRange: 560,
    engageRange: 500,
    contactDamage: 1,
    attackCooldownMs: 2200,
  },
  canopy_hunter: {
    frame: ENEMY_FRAME.canopy_hunter,
    health: 2,
    speed: 160,
    detectRange: 480,
    engageRange: 220,
    contactDamage: 1,
    attackCooldownMs: 1600,
  },
  guardian_organism: {
    frame: ENEMY_FRAME.guardian_organism,
    health: 5,
    speed: 95,
    detectRange: 400,
    engageRange: 80,
    contactDamage: 2,
    attackCooldownMs: 2000,
  },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public readonly kind: EnemyKind;
  public readonly guardGroup?: string;
  public health: number;
  public readonly maxHealth: number;
  public state: EnemyState = 'idle';

  private cfg: KindConfig;
  private juice: Juice;
  private target?: GOne;
  private projectiles?: Phaser.Physics.Arcade.Group;
  private patrolMin: number;
  private patrolMax: number;
  private nextAttackAt = 0;
  private stateUntil = 0;
  private facing = -1;
  private shadow?: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    spec: EnemySpec,
    juice: Juice,
    projectiles: Phaser.Physics.Arcade.Group
  ) {
    const cfg = KIND_CONFIG[spec.kind];
    super(scene, spec.x, spec.y, `enemy_${spec.kind}`);
    this.kind = spec.kind;
    this.guardGroup = spec.guardGroup;
    this.cfg = cfg;
    this.health = cfg.health;
    this.maxHealth = cfg.health;
    this.juice = juice;
    this.projectiles = projectiles;
    this.patrolMin = spec.patrolMin ?? spec.x - 200;
    this.patrolMax = spec.patrolMax ?? spec.x + 200;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(13);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (spec.kind === 'seeker') {
      // Hovers: no gravity, held at its spawn height. No ground reference is
      // stored for it, so it gets no shadow rather than a guessed one.
      body.setAllowGravity(false);
    } else {
      body.setAllowGravity(true);
      body.setCollideWorldBounds(false);
      if (scene.textures.exists('contact_shadow')) {
        this.shadow = scene.add.image(spec.x, spec.y, 'contact_shadow');
        this.shadow.setDepth(8).setAlpha(0.45).setDisplaySize(44, 16);
      }
    }
    body.setSize(cfg.frame.w * 0.7, cfg.frame.h * 0.82, true);
  }

  public setTarget(t: GOne) {
    this.target = t;
  }

  private transitionTo(s: EnemyState, durationMs = 0) {
    this.state = s;
    this.stateUntil = this.scene.time.now + durationMs;
  }

  /** @returns true if the hit was applied (false for an already-dead/invulnerable enemy). */
  public takeDamage(amount: number): boolean {
    if (this.state === 'dead' || !this.active) return false;

    this.health -= amount;
    this.setTexture(`enemy_${this.kind}_hit`);
    this.scene.time.delayedCall(HIT_FLASH_MS, () => {
      if (this.active) this.setTexture(`enemy_${this.kind}`);
    });

    this.juice.impact(this.x, this.y, 'player', { scale: 0.75, sparks: 10 });
    AudioManager.getInstance().playHit();

    if (this.health <= 0) {
      this.die();
      return true;
    }

    // Attacking is not interruptible (fairness: a telegraphed swing still
    // lands even if you trade hits with it), everything else staggers.
    if (this.state !== 'attack') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      this.transitionTo('stagger', STAGGER_MS);
    }
    return true;
  }

  private die() {
    this.transitionTo('dead');
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    AudioManager.getInstance().playExplosion();
    this.juice.impact(this.x, this.y, 'player', { scale: 1.3, sparks: 18, ring: true });
    this.juice.dust(this.x, this.y, 6, 0x3a0a10);

    if (this.shadow) this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 320 });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scale * 0.6,
      angle: this.facing > 0 ? 70 : -70,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  public destroy(fromScene?: boolean) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }

  /** Contact melee hit — called by the scene's overlap, gated to the attack window. */
  public isDealingContactDamage(): boolean {
    return this.state === 'attack' && this.kind === 'drone';
  }

  public get contactDamage() {
    return this.cfg.contactDamage;
  }

  // -------------------------------------------------------------------------

  private fireAtTarget() {
    if (!this.target || !this.projectiles) return;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    spawnProjectile(this.projectiles, {
      x: this.x,
      y: this.y,
      texture: 'proj_raone_bolt',
      speed: 520,
      angle,
      damage: this.cfg.contactDamage,
      owner: 'boss',
      lifespan: 2200,
    });
    AudioManager.getInstance().playRaOneShoot();
  }

  public update(time: number) {
    if (this.state === 'dead' || !this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const target = this.target;

    if (this.shadow) this.shadow.setPosition(this.x, body.bottom + 2);
    const distToTarget = target ? Math.abs(target.x - this.x) : Infinity;

    switch (this.state) {
      case 'idle': {
        // Simple patrol within bounds so an un-aggroed enemy still reads as alive.
        const dir = Math.sign(Math.sin(time / 900 + this.x)) || 1;
        const next = this.x + dir * 0.6;
        if (next > this.patrolMin && next < this.patrolMax) {
          body.setVelocityX(dir * this.cfg.speed * 0.3);
          this.facing = dir;
        } else {
          body.setVelocityX(0);
        }
        this.setFlipX(this.facing > 0);

        if (target && target.active && !target.isDead && distToTarget < this.cfg.detectRange) {
          this.transitionTo('alert');
        }
        break;
      }

      case 'alert': {
        if (!target || !target.active || target.isDead) {
          this.transitionTo('idle');
          break;
        }
        this.facing = Math.sign(target.x - this.x) || this.facing;
        this.setFlipX(this.facing > 0);

        if (this.kind === 'drone' || this.kind === 'rootstalker' || this.kind === 'guardian_organism') {
          if (distToTarget > this.cfg.engageRange) {
            body.setVelocityX(this.facing * this.cfg.speed);
          } else {
            body.setVelocityX(0);
            if (time >= this.nextAttackAt) this.beginTelegraph();
          }
        } else if (this.kind === 'sporecaster') {
          // Stationary turret pod
          body.setVelocity(0, 0);
          if (distToTarget <= this.cfg.engageRange) {
            if (time >= this.nextAttackAt) this.beginTelegraph();
          }
        } else if (this.kind === 'canopy_hunter') {
          // Arboreal predator hovering/patrolling high
          if (distToTarget > this.cfg.engageRange + 60) {
            body.setVelocityX(this.facing * this.cfg.speed);
          } else {
            body.setVelocityX(0);
            if (time >= this.nextAttackAt) this.beginTelegraph();
          }
        } else {
          // seeker: maintain standoff distance, strafe rather than close in.
          if (distToTarget < this.cfg.engageRange - 40) {
            body.setVelocityX(-this.facing * this.cfg.speed * 0.6);
          } else if (distToTarget > this.cfg.engageRange + 60) {
            body.setVelocityX(this.facing * this.cfg.speed * 0.6);
          } else {
            body.setVelocityX(0);
            if (time >= this.nextAttackAt) this.beginTelegraph();
          }
        }

        if (distToTarget > this.cfg.detectRange * 1.5) this.transitionTo('idle');
        break;
      }

      case 'telegraph': {
        body.setVelocityX(0);
        // A slow brightening scale reads as "about to act" independent of colour.
        const t = 1 - (this.stateUntil - time) / TELEGRAPH_MS;
        this.setScale(1 + Math.min(1, Math.max(0, t)) * 0.14);
        if (time >= this.stateUntil) this.commitAttack();
        break;
      }

      case 'attack': {
        if (time >= this.stateUntil) {
          this.setScale(1);
          this.nextAttackAt = time + this.cfg.attackCooldownMs;
          this.transitionTo('recover', RECOVER_MS);
        }
        break;
      }

      case 'recover': {
        body.setVelocityX(0);
        if (time >= this.stateUntil) this.transitionTo('alert');
        break;
      }

      case 'stagger': {
        if (time >= this.stateUntil) this.transitionTo('alert');
        break;
      }
    }
  }

  private beginTelegraph() {
    this.transitionTo('telegraph', TELEGRAPH_MS);
    const tint = this.kind === 'rootstalker' || this.kind === 'sporecaster' ? 0x10b981 : VILLAIN.rim;
    this.setTint(tint);
    this.scene.time.delayedCall(TELEGRAPH_MS, () => {
      if (this.active) this.clearTint();
    });
  }

  private commitAttack() {
    this.transitionTo('attack', 260);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.kind === 'drone') {
      body.setVelocityX(this.facing * this.cfg.speed * 2.2);
    } else if (this.kind === 'rootstalker') {
      body.setVelocityX(this.facing * this.cfg.speed * 2.6);
      body.setVelocityY(-180);
      AudioManager.getInstance().playDash();
    } else if (this.kind === 'sporecaster') {
      this.fireSporeMortar();
    } else if (this.kind === 'canopy_hunter') {
      body.setVelocity(this.facing * 340, 240);
      AudioManager.getInstance().playDash();
    } else if (this.kind === 'guardian_organism') {
      this.slamShockwave();
    } else {
      this.fireAtTarget();
    }
  }

  private fireSporeMortar() {
    if (!this.target || !this.projectiles) return;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    // Calculated launch velocity for a high arcing mortar
    const speed = Math.min(540, Math.max(340, dist * 0.95));
    const angle = Math.atan2(dy - 140, dx);

    spawnProjectile(this.projectiles, {
      x: this.x,
      y: this.y - 20,
      texture: 'proj_spore_mortar',
      speed,
      angle,
      damage: this.cfg.contactDamage,
      owner: 'boss',
      gravityY: 340,
      lifespan: 3000,
      scale: 1.2,
    });
    AudioManager.getInstance().playRaOneShoot();
  }

  private slamShockwave() {
    this.juice.shake(0.012, 280);
    this.juice.impact(this.x, this.y + 24, 'boss', { scale: 1.6, sparks: 16 });
    AudioManager.getInstance().playExplosion();

    if (!this.projectiles) return;
    // Emit two shockwave bursts left and right
    [-1, 1].forEach((dir) => {
      spawnProjectile(this.projectiles!, {
        x: this.x + dir * 28,
        y: this.y + 20,
        texture: 'proj_raone_bolt',
        speed: 360,
        angle: dir > 0 ? 0 : Math.PI,
        damage: this.cfg.contactDamage,
        owner: 'boss',
        lifespan: 1400,
        scale: 1.3,
      });
    });
  }
}

/**
 * Owns every grunt in a realm's traversal approach: spawning from level data,
 * driving each enemy's per-frame AI, and cleanup on scene shutdown.
 */
export class EnemyManager {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.Group;
  private enemies: Enemy[] = [];

  constructor(
    scene: Phaser.Scene,
    juice: Juice,
    enemyProjectiles: Phaser.Physics.Arcade.Group,
    specs: EnemySpec[]
  ) {
    this.scene = scene;
    this.group = scene.physics.add.group();

    specs.forEach((spec) => {
      const e = new Enemy(scene, spec, juice, enemyProjectiles);
      this.group.add(e);
      this.enemies.push(e);
    });
  }

  public setTarget(player: GOne) {
    this.enemies.forEach((e) => e.setTarget(player));
  }

  /** True while any living, active enemy still carries this guard group. */
  public isGroupAlive(guardGroup: string): boolean {
    return this.enemies.some((e) => e.active && e.guardGroup === guardGroup);
  }

  public getGroup() {
    return this.group;
  }

  public update(time: number) {
    this.enemies = this.enemies.filter((e) => e.active);
    this.enemies.forEach((e) => e.update(time));
  }

  public destroy() {
    this.enemies.forEach((e) => {
      try {
        e.destroy();
      } catch {
        /* already torn down */
      }
    });
    this.enemies = [];
    try {
      this.group.clear(true, true);
    } catch {
      /* group destroyed with the scene */
    }
  }
}
