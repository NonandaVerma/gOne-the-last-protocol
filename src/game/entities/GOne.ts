import * as Phaser from 'phaser';
import { G_ONE_CONFIG } from '../data/characters';
import { GONE_SCALE } from '../art/gone';
import { HERO } from '../art/palette';
import { Projectile, spawnProjectile } from './Projectile';
import { AudioManager } from '../systems/AudioManager';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { Juice } from '../systems/Juice';
import type { PowerUpManager } from './PowerUp';

const CFG = G_ONE_CONFIG;
const A = CFG.abilities;

type MotionState = 'idle' | 'run' | 'jump' | 'fall' | 'dash' | 'brace' | 'hurt' | 'defeat';

/**
 * G-One — the player character.
 *
 * Owns its own movement feel (acceleration, coyote time, jump buffering,
 * variable jump height, one thruster-assisted air jump), its abilities and all
 * the feedback that makes those abilities read: muzzle flashes, after-images,
 * deflection sparks and an aim-tracking arm cannon.
 */
export class GOne extends Phaser.Physics.Arcade.Sprite {
  public currentHealth: number;
  public maxHealth: number;
  public overdriveCharge = 0;

  public isShielded = false;
  public isInvulnerable = false;
  public isDashing = false;
  public isOverdriveActive = false;
  public isDead = false;

  private cannon: Phaser.GameObjects.Sprite;
  private muzzle: Phaser.GameObjects.Sprite;
  private shield: Phaser.GameObjects.Sprite;
  private aura?: Phaser.GameObjects.Sprite;
  private shadow?: Phaser.GameObjects.Image;

  private aim = { x: 0, y: 0 };
  private moveInput = 0;
  /**
   * Last non-zero horizontal move direction. Drives the body's visual
   * facing (`setFlipX`) — deliberately NOT the same as `facing` below, which
   * tracks the aim/crosshair side for the cannon's own independent rotation.
   * Coupling body-flip to aim meant running right while the cursor trailed
   * behind flipped the whole body backward mid-run.
   */
  private lastMoveDir = 1;
  private motion: MotionState = 'idle';

  private lastGroundedAt = -9999;
  private jumpBufferedAt = -9999;
  private airJumpsUsed = 0;
  private jumpHeld = false;
  private wasAirborne = false;

  private lastPulseAt = -9999;
  private lastShieldAt = -9999;
  private lastArcAt = -9999;
  private lastDashAt = -9999;

  private hurtUntil = 0;
  private nextCooldownEmit = 0;
  private nextRunDustAt = 0;
  private nextAfterImageAt = 0;

  private pool: Phaser.Physics.Arcade.Group;
  private juice: Juice;
  private powerUps?: PowerUpManager;
  private detach: Array<() => void> = [];

  public setPowerUpManager(m: PowerUpManager) {
    this.powerUps = m;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pool: Phaser.Physics.Arcade.Group,
    juice: Juice,
    initialHealth = 3
  ) {
    super(scene, x, y, 'gone_idle', 0);

    this.pool = pool;
    this.juice = juice;
    this.maxHealth = initialHealth;
    this.currentHealth = initialHealth;
    this.aim = { x: x + 400, y };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(GONE_SCALE);
    this.setDepth(22);

    // Grounds G-One against the painted backdrop rather than reading as a
    // flat cutout pasted over it. Shown only while standing on something.
    if (scene.textures.exists('contact_shadow')) {
      this.shadow = scene.add.image(x, y, 'contact_shadow');
      this.shadow.setDepth(8).setAlpha(0).setDisplaySize(70, 24);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(68, 184);
    body.setOffset(62, 28);
    body.setMaxVelocity(CFG.maxSpeed, 2200);

    // --- Attachments ---------------------------------------------------------
    this.cannon = scene.add.sprite(x, y, 'gone_cannon');
    this.cannon.setOrigin(0.145, 0.5);
    this.cannon.setScale(GONE_SCALE);
    this.cannon.setDepth(23);

    this.muzzle = scene.add.sprite(x, y, 'gone_muzzle', 0);
    this.muzzle.setOrigin(0.19, 0.5);
    this.muzzle.setScale(GONE_SCALE);
    this.muzzle.setDepth(24);
    this.muzzle.setBlendMode(Phaser.BlendModes.ADD);
    this.muzzle.setVisible(false);

    this.shield = scene.add.sprite(x, y, 'aegis_shield', 0);
    this.shield.setDepth(26);
    this.shield.setBlendMode(Phaser.BlendModes.ADD);
    this.shield.setVisible(false);
    this.shield.setScale(GONE_SCALE * 1.25);

    if (scene.textures.exists('aura_overdrive')) {
      this.aura = scene.add.sprite(x, y, 'aura_overdrive', 0);
      this.aura.setDepth(21);
      this.aura.setBlendMode(Phaser.BlendModes.ADD);
      this.aura.setVisible(false);
      this.aura.setScale(GONE_SCALE * 1.1);
    }

    this.play('gone-idle');
    this.bindTriggers();
    this.applyBloom();
  }

  private applyBloom() {
    const renderer = this.scene.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
    try {
      if (typeof (this as any).enableFilters === 'function') {
        (this as any).enableFilters();
        (this as any).filters?.internal?.addGlow(HERO.energy, 4, 0, 1);
        (this.cannon as any).enableFilters();
        (this.cannon as any).filters?.internal?.addGlow(HERO.energy, 4, 0, 1);
      }
    } catch {
      /* Glow is a nicety; never let it break the game. */
    }
  }

  /** React-side / touch control hooks. */
  private bindTriggers() {
    const map: Array<[string, () => void]> = [
      [GAME_EVENTS.TRIGGER_SHOOT, () => this.firePulseShot()],
      [GAME_EVENTS.TRIGGER_SHIELD, () => this.activateShield()],
      [GAME_EVENTS.TRIGGER_ARC, () => this.fireArcBurst()],
      [GAME_EVENTS.TRIGGER_DASH, () => this.performDash()],
      [GAME_EVENTS.TRIGGER_OVERDRIVE, () => this.activateOverdrive()],
      [GAME_EVENTS.TRIGGER_JUMP, () => this.pressJump()],
      [GAME_EVENTS.TRIGGER_MOVE_LEFT, () => this.setMoveInput(-1)],
      [GAME_EVENTS.TRIGGER_MOVE_RIGHT, () => this.setMoveInput(1)],
      [GAME_EVENTS.TRIGGER_STOP_MOVE, () => this.setMoveInput(0)],
    ];
    map.forEach(([evt, fn]) => {
      EventBus.on(evt, fn);
      this.detach.push(() => EventBus.off(evt, fn));
    });
  }

  // =========================================================================
  // Input surface
  // =========================================================================

  public setAimTarget(x: number, y: number) {
    this.aim.x = x;
    this.aim.y = y;
  }

  public setMoveInput(dir: number) {
    this.moveInput = Phaser.Math.Clamp(dir, -1, 1);
    if (this.moveInput !== 0) this.lastMoveDir = Math.sign(this.moveInput);
  }

  public pressJump() {
    this.jumpBufferedAt = this.scene.time.now;
    this.jumpHeld = true;
  }

  /**
   * Variable jump height: releasing the key stops *holding* the jump, and the
   * extra gravity applied in preUpdate shortens the arc. Doing it with gravity
   * rather than a one-off velocity cut keeps the motion smooth and survives a
   * missed keyup (e.g. when the window loses focus mid-jump).
   */
  public releaseJump() {
    this.jumpHeld = false;
  }

  // =========================================================================
  // Geometry helpers
  // =========================================================================

  private get facing(): number {
    return this.aim.x >= this.x ? 1 : -1;
  }

  private get aimAngle(): number {
    return Phaser.Math.Angle.Between(this.shoulderX, this.shoulderY, this.aim.x, this.aim.y);
  }

  private get shoulderX() {
    return this.x + this.facing * 5;
  }

  private get shoulderY() {
    return this.y - 18;
  }

  /** World position of the cannon muzzle, used for spawning and VFX. */
  public get muzzlePoint(): { x: number; y: number } {
    const a = this.aimAngle;
    const reach = 34;
    return {
      x: this.shoulderX + Math.cos(a) * reach,
      y: this.shoulderY + Math.sin(a) * reach,
    };
  }

  // =========================================================================
  // Abilities
  // =========================================================================

  public firePulseShot(): boolean {
    if (this.isDead || this.isDashing) return false;
    const now = this.scene.time.now;
    const cd = this.isOverdriveActive ? A.pulseShot.overdriveCooldown : A.pulseShot.cooldown;
    if (now - this.lastPulseAt < cd) return false;
    this.lastPulseAt = now;

    const angle = this.aimAngle;
    const origin = this.muzzlePoint;

    let dmg = A.pulseShot.damage * (this.isOverdriveActive ? A.overdrive.damageMultiplier : 1);
    let texture = 'proj_pulse';
    let anim = 'proj-pulse';

    if (this.powerUps?.isThunderheartActive()) {
      dmg *= 2;
      texture = 'relic_thunder_bolt';
      anim = '';
      this.juice.impact(origin.x, origin.y, 'player', { scale: 0.8, sparks: 8 });
    }
    if (this.powerUps?.isRuneOfRuinActive()) {
      dmg *= 2;
    }

    spawnProjectile(this.pool, {
      x: origin.x,
      y: origin.y,
      texture,
      anim,
      speed: A.pulseShot.speed * (this.powerUps?.isThunderheartActive() ? 1.25 : 1),
      angle,
      damage: dmg,
      owner: 'player',
      lifespan: 2200,
      scale: 0.62,
      bodyWidth: 26,
      bodyHeight: 14,
    });

    this.showMuzzleFlash(angle);
    AudioManager.getInstance().playPulseShoot();

    // Light recoil keeps spam-firing from being free movement.
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.velocity.x -= Math.cos(angle) * A.pulseShot.recoil;

    this.emitCooldowns(true);
    return true;
  }

  public fireArcBurst(): boolean {
    if (this.isDead || this.isDashing) return false;
    const now = this.scene.time.now;
    if (now - this.lastArcAt < A.arcBurst.cooldown) return false;
    this.lastArcAt = now;

    const angle = this.aimAngle;
    const origin = this.muzzlePoint;

    spawnProjectile(this.pool, {
      x: origin.x,
      y: origin.y,
      texture: 'proj_arc',
      anim: 'proj-arc',
      speed: A.arcBurst.speed,
      angle,
      damage: A.arcBurst.damage * (this.isOverdriveActive ? A.overdrive.damageMultiplier : 1),
      owner: 'player',
      lifespan: 2600,
      scale: 0.78,
      bodyWidth: 60,
      bodyHeight: 60,
      spin: 0.22,
      pierce: A.arcBurst.pierce,
    });

    this.showMuzzleFlash(angle, 1.5);
    this.juice.kick(angle + Math.PI, 7, 130);
    AudioManager.getInstance().playArcBurst();
    this.emitCooldowns(true);
    return true;
  }

  public activateShield(): boolean {
    if (this.isDead) return false;
    const now = this.scene.time.now;
    if (this.isShielded || now - this.lastShieldAt < A.aegisShield.cooldown) return false;

    this.lastShieldAt = now;
    this.isShielded = true;
    AudioManager.getInstance().playShieldActivate();

    this.shield.setVisible(true);
    this.shield.setAlpha(0);
    this.shield.play('aegis-idle');
    this.scene.tweens.add({
      targets: this.shield,
      alpha: 0.95,
      scale: { from: GONE_SCALE * 0.5, to: GONE_SCALE * 1.25 },
      duration: 180,
      ease: 'Back.easeOut',
    });

    this.scene.time.delayedCall(A.aegisShield.duration, () => this.deactivateShield());
    this.emitCooldowns(true);
    return true;
  }

  public deactivateShield() {
    if (!this.isShielded) return;
    this.isShielded = false;
    this.scene.tweens.add({
      targets: this.shield,
      alpha: 0,
      scale: GONE_SCALE * 1.5,
      duration: 200,
      onComplete: () => this.shield.setVisible(false),
    });
    this.emitCooldowns(true);
  }

  public performDash(): boolean {
    if (this.isDead || this.isDashing) return false;
    const now = this.scene.time.now;
    const cdMult = this.powerUps ? this.powerUps.getDashCooldownMultiplier() : 1;
    if (now - this.lastDashAt < A.dash.cooldown * cdMult) return false;

    this.lastDashAt = now;
    this.isDashing = true;
    const dir = this.moveInput !== 0 ? this.moveInput : this.facing;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dir * CFG.dashSpeed, 0);
    body.setMaxVelocity(CFG.dashSpeed, 2200);

    AudioManager.getInstance().playDash();
    this.setMotion('dash');
    this.juice.kick(dir > 0 ? 0 : Math.PI, 6, 120);

    this.scene.time.delayedCall(A.dash.duration, () => {
      this.isDashing = false;
      const b = this.body as Phaser.Physics.Arcade.Body;
      if (b) {
        b.setAllowGravity(true);
        b.setMaxVelocity(CFG.maxSpeed, 2200);
        b.setVelocityX(dir * CFG.maxSpeed * 0.65);
      }
    });

    this.emitCooldowns(true);
    return true;
  }

  public activateOverdrive(): boolean {
    if (this.isDead || this.isOverdriveActive) return false;
    if (this.overdriveCharge < A.overdrive.chargeRequired) return false;

    this.isOverdriveActive = true;
    this.overdriveCharge = 0;
    AudioManager.getInstance().playOverdrive();

    this.juice.flash(HERO.energy, 0.4, 260);
    this.juice.shake(0.012, 380);
    this.juice.zoomPunch(0.05, 220);
    this.juice.impact(this.x, this.y, 'player', { scale: 2.6, sparks: 30, ring: true });
    this.juice.floatText(this.x, this.y - 70, 'OVERDRIVE', HERO.energy, 26);

    EventBus.emit(GAME_EVENTS.OVERDRIVE_BURST, {
      x: this.x,
      y: this.y,
      radius: A.overdrive.burstRadius,
      damage: A.overdrive.burstDamage,
    });

    if (this.aura) {
      this.aura.setVisible(true);
      this.aura.setAlpha(0.9);
      this.aura.play('aura-overdrive');
    }

    this.scene.time.delayedCall(A.overdrive.duration, () => {
      this.isOverdriveActive = false;
      if (this.aura) {
        this.scene.tweens.add({
          targets: this.aura,
          alpha: 0,
          duration: 300,
          onComplete: () => this.aura?.setVisible(false),
        });
      }
      this.emitOverdrive();
    });

    this.emitOverdrive();
    return true;
  }

  public addOverdriveCharge(amount: number) {
    if (this.isOverdriveActive || this.isDead) return;
    const before = this.overdriveCharge;
    this.overdriveCharge = Phaser.Math.Clamp(this.overdriveCharge + amount, 0, 100);
    if (before < 100 && this.overdriveCharge >= 100) {
      this.juice.floatText(this.x, this.y - 72, 'OVERDRIVE READY  [E]', HERO.energy, 18);
    }
    this.emitOverdrive();
  }

  // =========================================================================
  // Damage
  // =========================================================================

  /** @returns true when damage was actually applied. */
  public takeDamage(amount = 1, fromX?: number, unblockable = false): boolean {
    if (this.isDead) return false;
    if (this.isInvulnerable || this.isDashing) return false;

    if (this.powerUps) {
      const incoming = this.powerUps.modifyIncomingDamage(amount);
      if (incoming.absorbed) return false;
      amount = incoming.damage;
    }

    if (this.isShielded && !unblockable) {
      this.onDeflect(fromX);
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);

    AudioManager.getInstance().playHit();
    this.juice.hitStop(90);
    this.juice.shake(0.018, 320);
    this.juice.flash(0xff2a44, 0.3, 200);
    this.juice.impact(this.x, this.y - 10, 'boss', { scale: 1.4, sparks: 16, ring: true });

    const dir = fromX === undefined ? -this.facing : Math.sign(this.x - fromX) || 1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(dir * CFG.hitKnockback, -220);

    EventBus.emit(GAME_EVENTS.PLAYER_HEALTH_CHANGED, {
      current: this.currentHealth,
      max: this.maxHealth,
    });

    if (this.currentHealth <= 0) {
      this.die();
      return true;
    }

    this.hurtUntil = this.scene.time.now + 320;
    this.setMotion('hurt', true);
    this.startInvulnerability();
    return true;
  }

  private onDeflect(fromX?: number) {
    AudioManager.getInstance().playShieldDeflect();
    this.juice.hitStop(45);
    this.juice.shake(0.006, 140);
    this.addOverdriveCharge(A.aegisShield.deflectGain);
    this.juice.floatText(this.x, this.y - 64, 'DEFLECTED', HERO.energy, 17);

    if (this.scene.textures.exists('shield_hit')) {
      const angle =
        fromX === undefined ? Math.PI : Math.atan2(0, fromX - this.x);
      const hit = this.scene.add.sprite(
        this.x + Math.cos(angle) * 26,
        this.y - 6 + Math.sin(angle) * 26,
        'shield_hit',
        0
      );
      hit.setDepth(27).setBlendMode(Phaser.BlendModes.ADD).setScale(0.6);
      let f = 0;
      const ev = this.scene.time.addEvent({
        delay: 50,
        repeat: 3,
        callback: () => {
          f++;
          if (hit.active) hit.setFrame(Math.min(3, f));
        },
      });
      this.scene.tweens.add({
        targets: hit,
        scale: 1.05,
        alpha: 0,
        duration: 240,
        onComplete: () => {
          ev.remove(false);
          hit.destroy();
        },
      });
    }
  }

  private startInvulnerability() {
    this.isInvulnerable = true;
    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });

    this.scene.tweens.add({
      targets: [this, this.cannon],
      alpha: 0.32,
      duration: 95,
      yoyo: true,
      repeat: Math.floor(CFG.invulnerabilityDuration / 190),
      onComplete: () => {
        this.setAlpha(1);
        this.cannon.setAlpha(1);
        this.isInvulnerable = false;
      },
    });
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isShielded = false;
    this.shield.setVisible(false);
    this.cannon.setVisible(false);
    this.muzzle.setVisible(false);
    this.aura?.setVisible(false);
    this.clearTint();
    this.setAlpha(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
      body.enable = false;
    }

    AudioManager.getInstance().playExplosion();
    this.juice.hitStop(140);
    this.juice.shake(0.03, 700);
    this.juice.impact(this.x, this.y, 'player', { scale: 3, sparks: 40, ring: true });

    this.setMotion('defeat', true);

    if (this.scene.textures.exists('particle_shard_blue')) {
      const shards = this.scene.add.particles(this.x, this.y - 10, 'particle_shard_blue', {
        speed: { min: 60, max: 260 },
        angle: { min: 200, max: 340 },
        gravityY: 500,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: -180, max: 180 },
        lifespan: 1400,
        emitting: false,
        blendMode: Phaser.BlendModes.ADD,
      });
      shards.setDepth(25);
      shards.explode(26);
      this.scene.time.delayedCall(1800, () => shards.destroy());
    }

    EventBus.emit(GAME_EVENTS.PLAYER_DIED);
  }

  // =========================================================================
  // Presentation
  // =========================================================================

  private showMuzzleFlash(angle: number, scale = 1) {
    const p = this.muzzlePoint;
    const left = Math.abs(angle) > Math.PI / 2;
    this.muzzle.setPosition(this.shoulderX, this.shoulderY);
    this.muzzle.setRotation(angle);
    this.muzzle.setFlipY(left);
    this.muzzle.setScale(GONE_SCALE * scale);
    this.muzzle.setFrame(0);
    this.muzzle.setVisible(true);
    this.muzzle.setAlpha(1);

    let f = 0;
    const ev = this.scene.time.addEvent({
      delay: 28,
      repeat: 3,
      callback: () => {
        f++;
        if (f > 3) {
          this.muzzle.setVisible(false);
          return;
        }
        this.muzzle.setFrame(f);
      },
    });
    this.scene.time.delayedCall(140, () => {
      ev.remove(false);
      this.muzzle.setVisible(false);
    });
    void p;
  }

  private setMotion(next: MotionState, force = false) {
    if (this.motion === next && !force) return;
    this.motion = next;
    const key = {
      idle: 'gone-idle',
      run: 'gone-run',
      jump: 'gone-jump',
      fall: 'gone-fall',
      dash: 'gone-dash',
      brace: 'gone-brace',
      hurt: 'gone-hurt',
      defeat: 'gone-defeat',
    }[next];
    if (this.scene.anims.exists(key)) this.play(key, true);
  }

  private emitOverdrive() {
    EventBus.emit(GAME_EVENTS.OVERDRIVE_CHANGED, {
      charge: Math.round(this.overdriveCharge),
      isActive: this.isOverdriveActive,
    });
  }

  public emitCooldowns(force = false) {
    const now = this.scene.time.now;
    if (!force && now < this.nextCooldownEmit) return;
    this.nextCooldownEmit = now + 90;

    const left = (at: number, cd: number) => Math.max(0, cd - (now - at));
    EventBus.emit(GAME_EVENTS.COOLDOWNS_CHANGED, {
      pulseShot: { current: left(this.lastPulseAt, A.pulseShot.cooldown), max: A.pulseShot.cooldown },
      aegisShield: {
        current: left(this.lastShieldAt, A.aegisShield.cooldown),
        max: A.aegisShield.cooldown,
        active: this.isShielded,
      },
      arcBurst: { current: left(this.lastArcAt, A.arcBurst.cooldown), max: A.arcBurst.cooldown },
      dash: { current: left(this.lastDashAt, A.dash.cooldown), max: A.dash.cooldown, active: this.isDashing },
      overdrive: { ready: this.overdriveCharge >= 100, active: this.isOverdriveActive },
    });
  }

  // =========================================================================
  // Per-frame
  // =========================================================================

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const grounded = body.blocked.down || body.touching.down;

    if (this.shadow) {
      this.shadow.setPosition(this.x, body.bottom + 2);
      // Fades in when grounded rather than tracking jump height — cheap,
      // and avoids guessing distance-to-ground with no raycast.
      const targetAlpha = grounded && !this.isDead ? 0.5 : 0;
      this.shadow.setAlpha(Phaser.Math.Linear(this.shadow.alpha, targetAlpha, 0.25));
    }

    if (this.isDead) {
      body.setAccelerationX(0);
      this.syncAttachments();
      return;
    }

    const speedMult = this.powerUps ? this.powerUps.getSpeedMultiplier() : 1;
    body.setMaxVelocity(CFG.maxSpeed * speedMult, 2200);

    // --- Facing --------------------------------------------------------------
    // Body orientation follows movement, not the aim/crosshair — the cannon
    // rotates to `aimAngle` independently in syncAttachments(), so the body
    // doesn't need to flip just because the cursor is behind the player.
    this.setFlipX(this.lastMoveDir < 0);

    // --- Horizontal movement -------------------------------------------------
    if (!this.isDashing) {
      const accel = (grounded ? CFG.groundAccel : CFG.airAccel) * speedMult;
      if (this.moveInput !== 0) {
        body.setAccelerationX(this.moveInput * accel);
        body.setDragX(0);
        if (this.powerUps?.isHermesActive() && time >= this.nextRunDustAt) {
          this.juice.afterImage(this, 0x06b6d4, 180, 0.4);
        }
      } else {
        body.setAccelerationX(0);
        body.setDragX(grounded ? CFG.groundDrag : CFG.airDrag);
      }
    }

    // --- Jumping -------------------------------------------------------------
    if (grounded) {
      this.lastGroundedAt = time;
      this.airJumpsUsed = 0;
      if (this.wasAirborne) {
        this.wasAirborne = false;
        this.juice.dust(this.x, body.bottom, 5);
        if (this.scene.textures.exists('ground_wave')) {
          const w = this.scene.add.image(this.x, body.bottom, 'ground_wave');
          w.setDepth(20).setBlendMode(Phaser.BlendModes.ADD).setScale(0.25).setAlpha(0.8);
          this.scene.tweens.add({
            targets: w,
            scaleX: 0.9,
            scaleY: 0.5,
            alpha: 0,
            duration: 260,
            onComplete: () => w.destroy(),
          });
        }
      }
    } else {
      this.wasAirborne = true;
    }

    const wantsJump = time - this.jumpBufferedAt <= CFG.jumpBuffer;
    if (wantsJump && !this.isDashing) {
      const coyoteOk = time - this.lastGroundedAt <= CFG.coyoteTime;
      if (grounded || coyoteOk) {
        body.setVelocityY(-CFG.jumpForce);
        this.lastGroundedAt = -9999;
        this.jumpBufferedAt = -9999;
        AudioManager.getInstance().playJump();
        this.juice.dust(this.x, body.bottom, 3);
      } else if (this.airJumpsUsed < CFG.maxAirJumps) {
        this.airJumpsUsed++;
        this.jumpBufferedAt = -9999;
        body.setVelocityY(-CFG.airJumpForce);
        AudioManager.getInstance().playJump();
        this.juice.impact(this.x, body.bottom, 'player', { scale: 0.8, sparks: 8 });
      }
    }

    if (!this.jumpHeld && body.velocity.y < -40 && !this.isDashing) {
      // Cut the jump once the key is released (handled again on keyup for snappiness).
      body.velocity.y += 2200 * (delta / 1000);
    }

    // --- Animation state -----------------------------------------------------
    if (this.isDashing) {
      this.setMotion('dash');
      if (time >= this.nextAfterImageAt) {
        this.nextAfterImageAt = time + 26;
        this.juice.afterImage(this, HERO.energy, 240, 0.5);
      }
    } else if (time < this.hurtUntil) {
      this.setMotion('hurt');
    } else if (this.isShielded) {
      this.setMotion('brace');
    } else if (!grounded) {
      this.setMotion(body.velocity.y < -20 ? 'jump' : 'fall');
    } else if (Math.abs(body.velocity.x) > 30) {
      this.setMotion('run');
      if (time >= this.nextRunDustAt) {
        this.nextRunDustAt = time + 170;
        this.juice.dust(this.x - Math.sign(body.velocity.x) * 14, body.bottom, 1);
      }
    } else {
      this.setMotion('idle');
    }

    this.syncAttachments();
    this.emitCooldowns();
  }

  private syncAttachments() {
    const angle = this.aimAngle;
    const left = Math.abs(angle) > Math.PI / 2;

    this.cannon.setVisible(!this.isDead && !this.isDashing);
    this.cannon.setPosition(this.shoulderX, this.shoulderY);
    this.cannon.setRotation(angle);
    this.cannon.setFlipY(left);

    this.shield.setPosition(this.x, this.y - 6);
    this.aura?.setPosition(this.x, this.y - 4);
  }

  public destroy(fromScene?: boolean) {
    this.detach.forEach((fn) => fn());
    this.detach = [];
    this.cannon?.destroy();
    this.muzzle?.destroy();
    this.shield?.destroy();
    this.aura?.destroy();
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}

export type { Projectile };
