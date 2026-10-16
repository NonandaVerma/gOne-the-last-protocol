import * as Phaser from 'phaser';
import { RA_ONE_CONFIG } from '../data/characters';
import { RAONE_SCALE } from '../art/raone';
import { VILLAIN } from '../art/palette';
import { spawnProjectile, FireOptions } from './Projectile';
import { HazardManager } from './Hazard';
import { AudioManager } from '../systems/AudioManager';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { Juice } from '../systems/Juice';
import { BossMechanics, BossState } from '../types/game';

const CFG = RA_ONE_CONFIG;
const PJ = CFG.projectiles;

interface RaOneDeps {
  scene: Phaser.Scene;
  x: number;
  y: number;
  pool: Phaser.Physics.Arcade.Group;
  juice: Juice;
  level: number;
  health: number;
  mechanics: BossMechanics;
  hazards?: HazardManager;
  groundTop: number;
}

type ActionId =
  | 'single'
  | 'spread'
  | 'orb'
  | 'dash'
  | 'hover'
  | 'hazard'
  | 'slam'
  | 'beam'
  | 'blink';

/**
 * RA-ONE — the boss.
 *
 * Driven by an explicit state machine ticked from `preUpdate` (never from a
 * free-running Phaser timer), so pausing the scene genuinely pauses the fight
 * and an action can never start while another is still resolving.
 *
 * Every attack follows the same contract: a readable TELEGRAPH window with a
 * shrinking focus ring and a colour pulse, then the strike, then a RECOVER
 * window during which the boss is a free target. Difficulty comes from timing,
 * not from invisible damage.
 */
export class RaOne extends Phaser.Physics.Arcade.Sprite {
  public currentHealth: number;
  public maxHealth: number;
  public bossState: BossState = 'spawning';
  public phase = 1;
  public isInvulnerable = false;

  private level: number;
  private mechanics: BossMechanics;
  private pool: Phaser.Physics.Arcade.Group;
  private juice: Juice;
  private hazards?: HazardManager;
  private groundTop: number;
  private target?: Phaser.Physics.Arcade.Sprite;

  private nextActionAt = 0;
  private stateUntil = 0;
  private busy = false;
  private flying = false;

  private aura?: Phaser.GameObjects.Sprite;
  private plume?: Phaser.GameObjects.Sprite;
  private ring?: Phaser.GameObjects.Image;
  private beamGuide?: Phaser.GameObjects.Graphics;
  private pending: Phaser.Time.TimerEvent[] = [];
  private telegraphTweens: Phaser.Tweens.Tween[] = [];
  private beamTracker?: Phaser.Time.TimerEvent;

  constructor(d: RaOneDeps) {
    super(d.scene, d.x, d.y, 'raone_idle', 0);

    this.level = d.level;
    this.mechanics = d.mechanics;
    this.pool = d.pool;
    this.juice = d.juice;
    this.hazards = d.hazards;
    this.groundTop = d.groundTop;
    this.maxHealth = d.health;
    this.currentHealth = d.health;

    d.scene.add.existing(this);
    d.scene.physics.add.existing(this);

    this.setScale(RAONE_SCALE);
    this.setDepth(20);
    this.setFlipX(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(84, 196);
    body.setOffset(70, 40);
    body.setDragX(1600);

    this.plume = d.scene.add.sprite(d.x, d.y, 'raone_plume', 0);
    this.plume.setOrigin(0.5, 0);
    this.plume.setScale(RAONE_SCALE);
    this.plume.setDepth(19);
    this.plume.setBlendMode(Phaser.BlendModes.ADD);
    this.plume.setVisible(false);

    if (d.scene.textures.exists('aura_raone')) {
      this.aura = d.scene.add.sprite(d.x, d.y, 'aura_raone', 0);
      this.aura.setDepth(19);
      this.aura.setBlendMode(Phaser.BlendModes.ADD);
      this.aura.setScale(RAONE_SCALE * 1.1);
      this.aura.setAlpha(0);
      this.aura.play('aura-raone');
    }

    this.ring = d.scene.add.image(d.x, d.y, 'telegraph_ring');
    this.ring.setDepth(21);
    this.ring.setBlendMode(Phaser.BlendModes.ADD);
    this.ring.setVisible(false);

    this.beamGuide = d.scene.add.graphics();
    this.beamGuide.setDepth(18);

    this.play('raone-idle');
    this.applyGlow();

    // Dramatic entrance before the AI takes over.
    this.nextActionAt = d.scene.time.now + 1500;
    this.bossState = 'idle';
  }

  private applyGlow() {
    if (!(this.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
    try {
      this.postFX.addGlow(VILLAIN.energy, 1.3, 0, false, 0.1, 10);
    } catch {
      /* non fatal */
    }
  }

  public setTarget(t: Phaser.Physics.Arcade.Sprite) {
    this.target = t;
  }

  private later(delay: number, fn: () => void) {
    const ev = this.scene.time.delayedCall(delay, () => {
      this.pending = this.pending.filter((p) => p !== ev);
      if (this.active && this.bossState !== 'defeated') fn();
    });
    this.pending.push(ev);
    return ev;
  }

  /** Cancel every in-flight timer/tween belonging to the current action. */
  private clearPending() {
    this.pending.forEach((ev) => ev.remove(false));
    this.pending = [];
    this.telegraphTweens.forEach((t) => t.stop());
    this.telegraphTweens = [];
    this.beamTracker?.remove(false);
    this.beamTracker = undefined;
    this.clearTint();
  }

  // =========================================================================
  // Phases
  // =========================================================================

  private get phaseInfo() {
    return CFG.phases[Math.min(this.phase - 1, CFG.phases.length - 1)];
  }

  private refreshPhase() {
    const frac = this.currentHealth / this.maxHealth;
    let next = 1;
    CFG.phases.forEach((p, i) => {
      if (frac <= p.atHealthFraction) next = i + 1;
    });
    if (next === this.phase) return;

    this.phase = next;
    EventBus.emit(GAME_EVENTS.BOSS_PHASE_CHANGED, { phase: this.phase });

    this.juice.flash(VILLAIN.energy, 0.32, 300);
    this.juice.shake(0.02, 450);
    this.juice.impact(this.x, this.y, 'boss', { scale: 3, sparks: 30, ring: true });
    AudioManager.getInstance().playOverdrive();

    if (this.aura) {
      this.scene.tweens.add({
        targets: this.aura,
        alpha: 0.35 + this.phase * 0.2,
        duration: 400,
      });
    }

    this.juice.taunt(this.phase === 2 ? CFG.dialogues.phase2 : CFG.dialogues.phase3);
  }

  // =========================================================================
  // State machine
  // =========================================================================

  private enter(state: BossState, duration: number) {
    this.bossState = state;
    this.stateUntil = this.scene.time.now + duration;
    EventBus.emit(GAME_EVENTS.BOSS_STATE_CHANGED, { state, phase: this.phase });
  }

  private finishAction(recoverMs: number) {
    this.enter('recover', recoverMs);
    this.later(recoverMs, () => {
      if (this.bossState === 'recover') {
        this.busy = false;
        this.bossState = 'idle';
        this.play('raone-idle', true);
        this.scheduleNext();
      }
    });
  }

  private scheduleNext(extra = 0) {
    const m = this.mechanics;
    const scale = this.phaseInfo.speedScale;
    const wait = Phaser.Math.Between(m.attackIntervalMin, m.attackIntervalMax) * scale + extra;
    this.nextActionAt = this.scene.time.now + wait;
  }

  /** Weighted action choice that reacts to range and phase. */
  private chooseAction(): ActionId {
    const m = this.mechanics;
    const dist = this.target ? Math.abs(this.target.x - this.x) : 500;
    const aggression = this.phaseInfo.aggression;
    const options: Array<[ActionId, number]> = [];

    options.push(['single', dist > 260 ? 24 : 10]);
    if (m.hasSpread) options.push(['spread', dist > 220 ? 22 : 12]);
    if (m.hasCharged) options.push(['orb', dist > 380 ? 20 : 10]);
    options.push(['dash', dist > 420 ? 10 + aggression * 22 : 4]);
    options.push(['slam', dist < 380 ? 14 + aggression * 14 : 4]);
    if (m.canFly) options.push(['hover', 14 + aggression * 10]);
    if (m.hasHazards) options.push(['hazard', 14 + aggression * 8]);
    if (m.hasBeams) options.push(['beam', 20 + aggression * 14]);
    if (m.canTeleport) options.push(['blink', 16]);

    const total = options.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [id, w] of options) {
      roll -= w;
      if (roll <= 0) return id;
    }
    return 'single';
  }

  private runAction(id: ActionId) {
    this.busy = true;
    switch (id) {
      case 'single':
        return this.actSingle();
      case 'spread':
        return this.actSpread();
      case 'orb':
        return this.actOrb();
      case 'dash':
        return this.actDash();
      case 'slam':
        return this.actSlam();
      case 'hover':
        return this.actHover();
      case 'hazard':
        return this.actHazard();
      case 'beam':
        return this.actBeam();
      case 'blink':
        return this.actBlink();
    }
  }

  // --- Telegraph -----------------------------------------------------------

  private telegraph(duration: number, then: () => void) {
    this.enter('telegraph', duration);
    this.play('raone-charge', true);

    if (this.ring) {
      this.ring.setVisible(true);
      this.ring.setPosition(this.x, this.y - 12);
      this.ring.setAlpha(0.9);
      this.ring.setScale(1.5);
      this.ring.setRotation(0);
      this.telegraphTweens.push(
        this.scene.tweens.add({
          targets: this.ring,
          scale: 0.42,
          rotation: Math.PI,
          alpha: 0.35,
          duration,
          ease: 'Quad.easeIn',
          onComplete: () => this.ring?.setVisible(false),
        })
      );
    }

    // Colour pulse makes the windup unmistakable even with effects turned down.
    this.telegraphTweens.push(
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        onUpdate: (tw) => {
          if (!this.active) return;
          const v = tw.getValue() ?? 0;
          if (Math.sin(v * Math.PI * 10) > 0) this.setTintFill(VILLAIN.energy);
          else this.clearTint();
        },
        onComplete: () => this.clearTint(),
      })
    );

    this.later(duration, () => {
      this.clearTint();
      this.enter('attack', 300);
      this.play('raone-strike', true);
      then();
    });
  }

  private aimAtTarget(offsetY = -12) {
    if (!this.target) return 0;
    return Phaser.Math.Angle.Between(this.x, this.y + offsetY, this.target.x, this.target.y - 10);
  }

  private faceTarget() {
    if (!this.target) return;
    this.setFlipX(this.target.x < this.x);
  }

  private get muzzle() {
    const dir = this.flipX ? -1 : 1;
    return { x: this.x + dir * 34, y: this.y - 14 };
  }

  private shoot(angle: number, speed: number, texture: string, anim: string, opts: Partial<FireOptions> = {}) {
    const m = this.muzzle;
    spawnProjectile(this.pool, {
      x: m.x,
      y: m.y,
      texture,
      anim,
      speed: speed * this.mechanics.projectileSpeedScale,
      angle,
      damage: 1,
      owner: 'boss',
      lifespan: 3200,
      scale: 0.6,
      bodyWidth: 24,
      bodyHeight: 24,
      ...opts,
    });
    this.juice.impact(m.x, m.y, 'boss', { scale: 0.55, sparks: 4 });
  }

  // --- Actions -------------------------------------------------------------

  private actSingle() {
    this.faceTarget();
    this.telegraph(PJ.singleShot.telegraph * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playRaOneShoot();
      this.shoot(this.aimAtTarget(), PJ.singleShot.speed, 'proj_raone_bolt', 'proj-bolt');
      this.finishAction(520);
    });
  }

  private actSpread() {
    this.faceTarget();
    this.telegraph(PJ.spreadShot.telegraph * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playRaOneShoot();
      const base = this.aimAtTarget();
      const count = PJ.spreadShot.count + (this.phase >= 3 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        this.shoot(base + t * PJ.spreadShot.spread * 2, PJ.spreadShot.speed, 'proj_raone_bolt', 'proj-bolt');
      }
      this.finishAction(640);
    });
  }

  private actOrb() {
    this.faceTarget();
    this.telegraph(PJ.chargedOrb.telegraph * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playExplosion();
      this.juice.shake(0.01, 240);
      this.shoot(this.aimAtTarget(), PJ.chargedOrb.speed, 'proj_raone_orb', 'proj-orb', {
        scale: 0.7,
        bodyWidth: 54,
        bodyHeight: 54,
        lifespan: 4200,
        trail: true,
      });
      this.finishAction(820);
    });
  }

  private actDash() {
    if (!this.target) return this.finishAction(400);
    this.faceTarget();
    const dir = this.target.x < this.x ? -1 : 1;

    this.telegraph(430 * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playDash();
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(dir * CFG.dashSpeed);
      this.play('raone-stride', true);

      const trail = this.scene.time.addEvent({
        delay: 30,
        repeat: 11,
        callback: () => this.juice.afterImage(this, VILLAIN.energy, 220, 0.45),
      });

      this.later(380, () => {
        body.setVelocityX(0);
        trail.remove(false);
        this.finishAction(560);
      });
    });
  }

  /** Ground slam — a close-range shockwave that punishes standing still. */
  private actSlam() {
    this.faceTarget();
    this.telegraph(PJ.slam.telegraph * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playExplosion();
      this.juice.shake(0.022, 420);
      this.juice.hitStop(60);

      const body = this.body as Phaser.Physics.Arcade.Body;
      const originY = body.bottom;
      this.juice.impact(this.x, originY, 'boss', { scale: 2.4, sparks: 26, ring: true });
      this.juice.dust(this.x, originY, 10, 0x6b2b22);

      // Two shockwaves travelling outward along the floor.
      [-1, 1].forEach((dir) => {
        spawnProjectile(this.pool, {
          x: this.x + dir * 46,
          y: originY - 22,
          texture: 'proj_raone_bolt',
          anim: 'proj-bolt',
          speed: 520 * this.mechanics.projectileSpeedScale,
          angle: dir > 0 ? 0 : Math.PI,
          damage: 1,
          owner: 'boss',
          lifespan: 2400,
          scale: 0.95,
          bodyWidth: 44,
          bodyHeight: 44,
        });
      });

      this.finishAction(880);
    });
  }

  private actHover() {
    if (!this.target) return this.finishAction(400);
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.flying = true;
    this.enter('aerial', 2600);
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    this.play('raone-hover', true);
    this.plume?.setVisible(true);
    this.plume?.play('raone-plume', true);

    const bounds = this.scene.physics.world.bounds;
    const destX = Phaser.Math.Clamp(
      this.target.x + (this.target.x < bounds.centerX ? 420 : -420),
      bounds.x + 180,
      bounds.right - 180
    );

    this.scene.tweens.add({
      targets: this,
      x: destX,
      y: CFG.hoverHeight,
      duration: 620,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.bossState === 'defeated') return;
        this.faceTarget();
        // Diagonal barrage while airborne.
        let shots = 0;
        const volley = this.scene.time.addEvent({
          delay: 230,
          repeat: 2 + (this.phase >= 2 ? 1 : 0),
          callback: () => {
            if (this.bossState === 'defeated') return;
            shots++;
            AudioManager.getInstance().playRaOneShoot();
            this.shoot(this.aimAtTarget(0), PJ.spreadShot.speed * 1.1, 'proj_raone_bolt', 'proj-bolt');
          },
        });

        this.later(1250, () => {
          volley.remove(false);
          this.scene.tweens.add({
            targets: this,
            y: this.groundTop - 56,
            duration: 420,
            ease: 'Quad.easeIn',
            onComplete: () => {
              body.setAllowGravity(true);
              this.flying = false;
              this.plume?.setVisible(false);
              this.juice.shake(0.01, 200);
              this.juice.dust(this.x, this.groundTop, 8, 0x6b2b22);
              this.finishAction(620);
            },
          });
          void shots;
        });
      },
    });
  }

  private actHazard() {
    if (!this.hazards || !this.target) return this.finishAction(400);
    this.faceTarget();
    this.telegraph(520 * this.phaseInfo.speedScale, () => {
      AudioManager.getInstance().playRaOneShoot();
      const px = this.target!.x;
      const drops = this.phase >= 2 ? 3 : 2;
      for (let i = 0; i < drops; i++) {
        const offset = i === 0 ? 0 : Phaser.Math.Between(-240, 240);
        this.later(i * 260, () => this.hazards?.dropDebris(px + offset));
      }
      this.finishAction(820);
    });
  }

  private actBeam() {
    if (!this.target || !this.beamGuide) return this.finishAction(400);
    this.faceTarget();

    const dir = this.flipX ? -1 : 1;
    const originX = this.x + dir * 30;
    const originY = this.y - 14;
    const bounds = this.scene.physics.world.bounds;
    const reach = dir > 0 ? bounds.right - originX : originX - bounds.x;

    // Thin tracking guide line that locks in before the beam fires.
    const guide = this.beamGuide;
    const lockY = this.target.y - 10;
    this.beamTracker = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        guide.clear();
        if (!this.active) return;
        guide.lineStyle(2, VILLAIN.energy, 0.75);
        guide.lineBetween(originX, originY, originX + dir * reach, lockY);
      },
    });

    this.enter('telegraph', PJ.deathBeam.telegraph);
    this.play('raone-charge', true);

    this.later(PJ.deathBeam.telegraph, () => {
      this.beamTracker?.remove(false);
      this.beamTracker = undefined;
      guide.clear();
      this.enter('attack', PJ.deathBeam.duration);
      this.play('raone-strike', true);

      AudioManager.getInstance().playExplosion();
      this.juice.shake(0.026, 420);
      this.juice.flash(VILLAIN.energy, 0.25, 180);

      const angle = Math.atan2(lockY - originY, dir * reach);
      const beam = spawnProjectile(this.pool, {
        x: originX,
        y: originY,
        texture: 'proj_beam',
        anim: 'proj-beam',
        speed: 0,
        angle: dir > 0 ? angle : Math.PI - angle,
        damage: 1,
        owner: 'boss',
        lifespan: PJ.deathBeam.duration,
        scale: 0.55,
        pierce: true,
        stretchTo: reach,
        bodyHeight: 26,
      });
      if (beam) {
        this.scene.tweens.add({
          targets: beam,
          scaleY: { from: 0.1, to: 0.55 },
          duration: 90,
        });
      }

      this.finishAction(900);
    });
  }

  private actBlink() {
    const bounds = this.scene.physics.world.bounds;
    this.enter('reposition', 520);
    AudioManager.getInstance().playDash();
    this.burstShards(this.x, this.y);
    this.setVisible(false);

    const px = this.target?.x ?? bounds.centerX;
    const candidates = [px - 480, px + 480, px - 300, px + 300].filter(
      (x) => x > bounds.x + 140 && x < bounds.right - 140
    );
    const destX = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : bounds.centerX;

    this.later(300, () => {
      this.setPosition(destX, this.groundTop - 56);
      this.setVisible(true);
      this.burstShards(destX, this.y);
      this.faceTarget();
      this.later(140, () => this.actSpread());
    });
  }

  private burstShards(x: number, y: number) {
    if (!this.scene.textures.exists('particle_shard')) return;
    const e = this.scene.add.particles(x, y, 'particle_shard', {
      speed: { min: 80, max: 300 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: -180, max: 180 },
      lifespan: 420,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    });
    e.setDepth(21);
    e.explode(20);
    this.scene.time.delayedCall(520, () => e.destroy());
  }

  // =========================================================================
  // Damage
  // =========================================================================

  public takeDamage(amount = 1): boolean {
    if (this.isInvulnerable || this.bossState === 'defeated') return false;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    AudioManager.getInstance().playHit();

    this.juice.hitStop(amount > 1 ? 85 : 55);
    this.juice.shake(0.01 + amount * 0.004, 220);
    this.juice.impact(this.x, this.y - 16, 'player', {
      scale: 1 + amount * 0.3,
      sparks: 10 + amount * 6,
      ring: amount > 1,
    });

    EventBus.emit(GAME_EVENTS.BOSS_HEALTH_CHANGED, {
      current: this.currentHealth,
      max: this.maxHealth,
    });

    if (this.currentHealth <= 0) {
      this.defeat();
      return true;
    }

    this.refreshPhase();

    // Staggering out of a telegraph is the player's reward for pressure.
    if (this.bossState === 'telegraph' || this.bossState === 'idle' || this.bossState === 'recover') {
      this.clearPending();
      this.ring?.setVisible(false);
      this.beamGuide?.clear();
      this.enter('stagger', CFG.staggerDuration);
      this.play('raone-stagger', true);
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (!this.flying && body) body.setVelocityX(this.flipX ? 140 : -140);

      this.later(CFG.staggerDuration, () => {
        this.busy = false;
        this.bossState = 'idle';
        this.play('raone-idle', true);
        this.scheduleNext(120);
      });
    }

    this.isInvulnerable = true;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.active && this.clearTint());
    this.scene.time.delayedCall(CFG.invulnerabilityDuration, () => {
      this.isInvulnerable = false;
    });

    return true;
  }

  private defeat() {
    if (this.bossState === 'defeated') return;
    this.bossState = 'defeated';
    this.clearPending();
    this.ring?.setVisible(false);
    this.beamGuide?.clear();
    this.plume?.setVisible(false);
    this.scene.tweens.killTweensOf(this);
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setAllowGravity(false);
      body.enable = false;
    }

    AudioManager.getInstance().playExplosion();
    this.juice.hitStop(180);
    this.juice.shake(0.035, 900);
    this.juice.flash(VILLAIN.energy, 0.45, 420);
    this.juice.taunt(CFG.dialogues.onDefeat);
    this.play('raone-defeat', true);

    if (this.aura) {
      this.scene.tweens.add({ targets: this.aura, alpha: 0, duration: 600 });
    }

    // Repeated bursts as the shell comes apart.
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(140 * i, () => {
        if (!this.active) return;
        this.juice.impact(
          this.x + Phaser.Math.Between(-40, 40),
          this.y + Phaser.Math.Between(-50, 30),
          'boss',
          { scale: 1.3, sparks: 14, ring: i % 2 === 0 }
        );
      });
    }

    this.scene.time.delayedCall(900, () => {
      this.burstShards(this.x, this.y - 20);
      this.burstShards(this.x, this.y - 60);
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          EventBus.emit(GAME_EVENTS.BOSS_DIED);
        },
      });
    });
  }

  // =========================================================================
  // Per-frame
  // =========================================================================

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this.aura?.setPosition(this.x, this.y - 10);
    if (this.plume?.visible) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      this.plume.setPosition(this.x, body ? body.bottom - 16 : this.y + 40);
      this.plume.setFlipX(this.flipX);
    }

    if (this.bossState === 'defeated' || !this.target || !this.target.active) return;

    // Idle repositioning: close the gap, or back off if crowded.
    if (!this.busy && this.bossState === 'idle' && !this.flying) {
      this.faceTarget();
      const body = this.body as Phaser.Physics.Arcade.Body;
      const dist = Math.abs(this.target.x - this.x);
      const dir = Math.sign(this.target.x - this.x) || 1;

      if (dist > CFG.idealRangeMax) {
        body.setVelocityX(dir * CFG.walkSpeed);
        this.play('raone-stride', true);
      } else if (dist < CFG.idealRangeMin) {
        body.setVelocityX(-dir * CFG.walkSpeed * 0.9);
        this.play('raone-stride', true);
      } else {
        body.setVelocityX(0);
        this.play('raone-idle', true);
      }

      if (time >= this.nextActionAt) {
        body.setVelocityX(0);
        this.runAction(this.chooseAction());
      }
    }

    void this.stateUntil;
  }

  public destroy(fromScene?: boolean) {
    this.clearPending();
    this.aura?.destroy();
    this.plume?.destroy();
    this.ring?.destroy();
    this.beamGuide?.destroy();
    super.destroy(fromScene);
  }
}
