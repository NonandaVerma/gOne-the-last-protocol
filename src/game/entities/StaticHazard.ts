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

export class StaticHazardField {
  private scene: Phaser.Scene;
  private juice: Juice;
  private group: Phaser.Physics.Arcade.Group;
  private cyclic: Cyclic[] = [];
  private owned: Phaser.GameObjects.GameObject[] = [];
  private alive = true;

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

    specs.forEach((spec) => {
      if (spec.kind === 'spikes') this.buildSpikes(spec);
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
  }

  public destroy() {
    this.alive = false;
    this.cyclic.forEach((h) => {
      this.scene.tweens.killTweensOf(h.sprite);
    });
    this.cyclic = [];
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
