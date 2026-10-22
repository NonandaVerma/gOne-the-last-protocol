import * as Phaser from 'phaser';
import { StaticHazardSpec } from '../types/game';
import { AudioManager } from '../systems/AudioManager';
import { Juice } from '../systems/Juice';

/**
 * PLACED ENVIRONMENTAL HAZARDS.
 *
 * Every cyclic hazard runs the same four-phase lifecycle:
 *
 *   idle      -> inert, body disabled, dim
 *   warning   -> body still disabled, visibly charging (scale/alpha/flicker)
 *   active    -> body enabled, fully lit, damaging
 *   cooldown  -> body disabled, visibly venting
 *
 * Two invariants hold for every hazard here:
 *   1. The damaging body is enabled ONLY during `active`, and its bounds are
 *      the visible shape — never larger.
 *   2. `active` is never entered without a preceding `warning` of at least
 *      `warnMs`, so damage is always telegraphed.
 *
 * Spikes are the deliberate exception: permanently active, permanently
 * visible, and never animated — a pure positioning problem.
 */

type Phase = 'idle' | 'warning' | 'active' | 'cooldown';

interface Cyclic {
  spec: StaticHazardSpec;
  sprite: Phaser.Physics.Arcade.Sprite;
  /** Beam column drawn between emitters; laser gates only. */
  decor: Phaser.GameObjects.GameObject[];
  phase: Phase;
  /** ms remaining in the current phase. */
  remaining: number;
  warnMs: number;
  activeMs: number;
  cooldownMs: number;
}

type DoorPhase = 'open' | 'warning' | 'closing' | 'sealed' | 'opening';

interface SecurityDoor {
  spec: StaticHazardSpec;
  panel: Phaser.Physics.Arcade.Sprite;
  openY: number;
  closedY: number;
  phase: DoorPhase;
  remaining: number;
  warnMs: number;
  closeMs: number;
  holdMs: number;
  triggered: boolean;
}

interface LockedGate {
  spec: StaticHazardSpec;
  panel: Phaser.Physics.Arcade.Sprite;
  openY: number;
  closedY: number;
  opened: boolean;
}

export class StaticHazardField {
  private scene: Phaser.Scene;
  private juice: Juice;
  private group: Phaser.Physics.Arcade.Group;
  private cyclic: Cyclic[] = [];
  private doors: SecurityDoor[] = [];
  private gates: LockedGate[] = [];
  private owned: Phaser.GameObjects.GameObject[] = [];
  private alive = true;
  /**
   * Sealed doors/gates need genuine physical blocking, not the shared
   * damage group — that group is wired to the player via `physics.add
   * .overlap` (damage-only; the player passes straight through), so a
   * "locked gate" built on it would never actually stop anyone. This group
   * gets its own `collider` from the scene instead.
   */
  private solidGroup: Phaser.Physics.Arcade.Group;

  /**
   * @param group  shared damage group the scene already overlaps with the
   *               player, so hazards need no collider wiring of their own.
   * @param warnScale per-realm multiplier on every warning window; >1 is more
   *               forgiving, which is how early realms stay readable.
   */
  constructor(
    scene: Phaser.Scene,
    juice: Juice,
    group: Phaser.Physics.Arcade.Group,
    specs: StaticHazardSpec[],
    warnScale: number
  ) {
    this.scene = scene;
    this.juice = juice;
    this.group = group;
    this.solidGroup = scene.physics.add.group({ allowGravity: false, immovable: true });

    specs.forEach((spec) => {
      if (spec.kind === 'spikes') this.buildSpikes(spec);
      else if (spec.kind === 'security_door') this.buildSecurityDoor(spec, warnScale);
      else if (spec.kind === 'locked_gate') this.buildLockedGate(spec);
      else this.buildCyclic(spec, warnScale);
    });
  }

  // -------------------------------------------------------------------------
  // Spikes — always on, never a surprise.
  // -------------------------------------------------------------------------

  private buildSpikes(spec: StaticHazardSpec) {
    const h = 34;
    const sprite = this.scene.physics.add.sprite(spec.x, spec.y - h / 2, 'hazard_spikes');
    sprite.setDisplaySize(spec.width, h).setDepth(14);
    sprite.setOrigin(0.5, 0.5);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    // Hitbox is inset: only the upper spike points hurt, so brushing the
    // base while landing beside them does not read as an unfair hit.
    body.setSize(spec.width * 0.92, h * 0.6, true);

    this.group.add(sprite);
    this.owned.push(sprite);
  }

  // -------------------------------------------------------------------------
  // Security door — trigger-based, not cyclic. Armed once by crossing
  // `triggerX`, then warns, seals, holds, and reopens. Never a permanent
  // block: even a player caught on the wrong side gets it back after holdMs.
  // -------------------------------------------------------------------------

  private buildSecurityDoor(spec: StaticHazardSpec, warnScale: number) {
    const height = spec.height ?? 220;
    const openY = spec.y - height - 20;
    const closedY = spec.y - height / 2;

    const top = this.scene.add.image(spec.x, spec.y - height - 12, 'hazard_door_housing').setDepth(17);
    this.owned.push(top);

    const panel = this.scene.physics.add.sprite(spec.x, openY, 'hazard_door_panel');
    panel.setDisplaySize(spec.width, height).setDepth(16);

    const body = panel.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.enable = false;

    this.solidGroup.add(panel);
    this.owned.push(panel);

    this.doors.push({
      spec,
      panel,
      openY,
      closedY,
      phase: 'open',
      remaining: 0,
      warnMs: Math.round((spec.warnMs ?? 900) * warnScale),
      closeMs: spec.closeMs ?? 700,
      holdMs: spec.holdMs ?? 2500,
      triggered: false,
    });
  }

  /** Scene calls this every frame with the player's world X. */
  /** Scene colliders this against the player for genuine physical blocking. */
  public getSolidGroup() {
    return this.solidGroup;
  }

  public checkTrigger(playerX: number) {
    for (const d of this.doors) {
      if (!d.triggered && d.spec.triggerX !== undefined && playerX >= d.spec.triggerX) {
        d.triggered = true;
        this.armDoor(d);
      }
    }
  }

  private armDoor(d: SecurityDoor) {
    d.phase = 'warning';
    d.remaining = d.warnMs;
    AudioManager.getInstance().playShieldDeflect();
    this.scene.tweens.add({
      targets: d.panel,
      alpha: { from: 1, to: 0.4 },
      duration: 160,
      yoyo: true,
      repeat: Math.max(1, Math.floor(d.warnMs / 320)),
    });
  }

  private closeDoor(d: SecurityDoor) {
    d.phase = 'closing';
    d.remaining = d.closeMs;
    d.panel.setAlpha(1);
    AudioManager.getInstance().playExplosion();
    this.juice.shake(0.008, 180);
    this.scene.tweens.add({
      targets: d.panel,
      y: d.closedY,
      duration: d.closeMs,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        const body = d.panel.body as Phaser.Physics.Arcade.Body;
        body.updateFromGameObject();
      },
    });
  }

  private sealDoor(d: SecurityDoor) {
    d.phase = 'sealed';
    d.remaining = d.holdMs;
    const body = d.panel.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.updateFromGameObject();
  }

  private openDoor(d: SecurityDoor) {
    d.phase = 'opening';
    d.remaining = 400;
    const body = d.panel.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.scene.tweens.add({
      targets: d.panel,
      y: d.openY,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        d.phase = 'open';
        d.triggered = false; // re-armable if the player walks back and forth
      },
    });
  }

  // -------------------------------------------------------------------------
  // Locked gate — starts sealed, opens once and permanently once its guard
  // group is cleared. Progression-gated, not timed; no telegraph needed
  // since the barrier is visible and solid from the moment the player can
  // see it, same as any ordinary wall.
  // -------------------------------------------------------------------------

  private buildLockedGate(spec: StaticHazardSpec) {
    const height = spec.height ?? 220;
    const closedY = spec.y - height / 2;
    const openY = spec.y - height - 40;

    const housing = this.scene.add.image(spec.x, spec.y - height - 12, 'hazard_door_housing').setDepth(17);
    this.owned.push(housing);

    const panel = this.scene.physics.add.sprite(spec.x, closedY, 'hazard_door_panel');
    panel.setDisplaySize(spec.width, height).setDepth(16).setTint(0xffb347);

    const body = panel.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.enable = true;

    this.solidGroup.add(panel);
    this.owned.push(panel);

    this.gates.push({ spec, panel, openY, closedY, opened: false });
  }

  /**
   * Scene calls this every frame with a lookup for whether a guard group is
   * still alive. Opens any gate whose group has just been cleared.
   */
  public updateGuardGroups(isGroupAlive: (guardGroup: string) => boolean) {
    for (const gate of this.gates) {
      if (gate.opened || !gate.spec.guardGroup) continue;
      if (isGroupAlive(gate.spec.guardGroup)) continue;

      gate.opened = true;
      const body = gate.panel.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      AudioManager.getInstance().playOverdrive();
      this.juice.shake(0.008, 220);
      this.scene.tweens.add({
        targets: gate.panel,
        y: gate.openY,
        alpha: 0.3,
        duration: 650,
        ease: 'Quad.easeOut',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Cyclic hazards — laser gates and corruption zones.
  // -------------------------------------------------------------------------

  private buildCyclic(spec: StaticHazardSpec, warnScale: number) {
    const warnMs = Math.round((spec.warnMs ?? 650) * warnScale);
    const activeMs = spec.activeMs ?? 900;
    const cooldownMs = spec.cooldownMs ?? 1200;

    let sprite: Phaser.Physics.Arcade.Sprite;
    const decor: Phaser.GameObjects.GameObject[] = [];

    if (spec.kind === 'laser_gate') {
      const height = spec.height ?? 220;
      const topY = spec.y - height;

      // The beam itself.
      sprite = this.scene.physics.add.sprite(spec.x, spec.y - height / 2, 'particle_white');
      sprite.setDisplaySize(spec.width, height).setDepth(16);
      sprite.setTint(0xff243d).setBlendMode(Phaser.BlendModes.ADD);

      // Emitter housings read as machinery even when the beam is off, so the
      // player can see where a gate will appear before it ever fires.
      const top = this.scene.add.image(spec.x, topY, 'hazard_emitter').setDepth(17).setFlipY(true);
      const bottom = this.scene.add.image(spec.x, spec.y, 'hazard_emitter').setDepth(17);
      decor.push(top, bottom);
      this.owned.push(top, bottom);
    } else {
      // corruption_zone
      const height = spec.height ?? 36;
      sprite = this.scene.physics.add.sprite(spec.x, spec.y - height / 2, 'hazard_corruption');
      sprite.setDisplaySize(spec.width, height).setDepth(14);
    }

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.enable = false;

    this.group.add(sprite);
    this.owned.push(sprite);

    const entry: Cyclic = {
      spec,
      sprite,
      decor,
      phase: 'idle',
      // Stagger the cycle so a row of gates fires in sequence rather than together.
      remaining: spec.offsetMs ?? 0,
      warnMs,
      activeMs,
      cooldownMs,
    };
    this.cyclic.push(entry);
    this.applyPhase(entry, 'idle');
  }

  // -------------------------------------------------------------------------

  private applyPhase(h: Cyclic, phase: Phase) {
    h.phase = phase;
    const body = h.sprite.body as Phaser.Physics.Arcade.Body;
    const isLaser = h.spec.kind === 'laser_gate';

    switch (phase) {
      case 'idle':
        body.enable = false;
        h.sprite.setAlpha(isLaser ? 0 : 0.28).setVisible(true);
        h.sprite.setScale(h.sprite.scaleX, h.sprite.scaleY);
        h.decor.forEach((d) => (d as Phaser.GameObjects.Image).setTint(0x8395a5));
        h.remaining = h.cooldownMs;
        break;

      case 'warning': {
        body.enable = false;
        h.decor.forEach((d) => (d as Phaser.GameObjects.Image).setTint(0xff6678));
        // Charge-up: a thin flickering pilot beam / brightening stain.
        this.scene.tweens.add({
          targets: h.sprite,
          alpha: { from: isLaser ? 0.08 : 0.3, to: isLaser ? 0.45 : 0.6 },
          duration: h.warnMs,
          ease: 'Quad.easeIn',
        });
        if (isLaser) {
          h.sprite.setAlpha(0.1);
          this.scene.tweens.add({
            targets: h.sprite,
            scaleX: { from: h.sprite.scaleX * 0.25, to: h.sprite.scaleX },
            duration: h.warnMs,
            ease: 'Quad.easeIn',
          });
        }
        h.remaining = h.warnMs;
        break;
      }

      case 'active':
        body.enable = true;
        h.sprite.setAlpha(1);
        h.decor.forEach((d) => (d as Phaser.GameObjects.Image).setTint(0xffffff));
        AudioManager.getInstance().playArcBurst();
        this.juice.shake(0.006, 140);
        h.remaining = h.activeMs;
        break;

      case 'cooldown':
        body.enable = false;
        this.scene.tweens.add({
          targets: h.sprite,
          alpha: isLaser ? 0 : 0.28,
          duration: Math.min(220, h.cooldownMs),
        });
        h.decor.forEach((d) => (d as Phaser.GameObjects.Image).setTint(0x8395a5));
        h.remaining = h.cooldownMs;
        break;
    }
  }

  public update(_time: number, delta: number) {
    if (!this.alive) return;
    for (const h of this.cyclic) {
      h.remaining -= delta;
      if (h.remaining > 0) continue;
      switch (h.phase) {
        case 'idle':
        case 'cooldown':
          this.applyPhase(h, 'warning');
          break;
        case 'warning':
          this.applyPhase(h, 'active');
          break;
        case 'active':
          this.applyPhase(h, 'cooldown');
          break;
      }
    }

    for (const d of this.doors) {
      if (d.phase === 'open') continue;
      d.remaining -= delta;
      if (d.remaining > 0) continue;
      switch (d.phase) {
        case 'warning':
          this.closeDoor(d);
          break;
        case 'closing':
          this.sealDoor(d);
          break;
        case 'sealed':
          this.openDoor(d);
          break;
        // 'opening' resolves itself via the tween's onComplete.
      }
    }
  }

  public destroy() {
    this.alive = false;
    this.cyclic.forEach((h) => {
      this.scene.tweens.killTweensOf(h.sprite);
    });
    this.cyclic = [];
    this.doors.forEach((d) => {
      this.scene.tweens.killTweensOf(d.panel);
    });
    this.doors = [];
    this.gates.forEach((g) => {
      this.scene.tweens.killTweensOf(g.panel);
    });
    this.gates = [];
    try {
      this.solidGroup.clear(true, true);
    } catch {
      /* group already destroyed with the scene */
    }
    this.owned.forEach((o) => {
      try {
        if (o && (o as { active?: boolean }).active !== false) o.destroy();
      } catch {
        /* already torn down by the scene */
      }
    });
    this.owned = [];
  }
}
