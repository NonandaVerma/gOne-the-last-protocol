import * as Phaser from 'phaser';
import { PlatformSpec } from '../types/game';
import { AudioManager } from '../systems/AudioManager';
import { Juice } from '../systems/Juice';

/**
 * PLATFORMS THAT DO NOT STAY PUT.
 *
 * All three behaviours live in one kinematic group so the scene wires a single
 * collider. Bodies are Arcade *dynamic* bodies with gravity off and
 * `immovable` set — the configuration Arcade requires for a surface that moves
 * yet still carries a rider.
 *
 * Fairness rules enforced here:
 *   - `collapsing` only begins to fail once the player has actually stood on
 *     it, and always shows a shudder-and-crack tell before it drops.
 *   - `phasing` fades out over `FADE_MS` rather than vanishing on a frame, so
 *     a player mid-step has time to react.
 *   - Neither is ever the sole route across a gap (see `validateLevels`).
 */

/** How long a collapsing platform shudders before it actually drops. */
const COLLAPSE_WARN_MS = 620;
/** How long before a collapsed platform returns. */
const COLLAPSE_RESPAWN_MS = 2600;
/** Phase in/out duration, so disappearance is never instantaneous. */
const FADE_MS = 260;

interface Managed {
  spec: PlatformSpec;
  sprite: Phaser.Physics.Arcade.Sprite;
  /** `collapsing` state. */
  triggered?: boolean;
  /** `phasing` cycle clock, ms. */
  clock?: number;
  solid?: boolean;
}

export class DynamicPlatformManager {
  private scene: Phaser.Scene;
  private juice: Juice;
  private group: Phaser.Physics.Arcade.Group;
  private items: Managed[] = [];
  private timers: Phaser.Time.TimerEvent[] = [];
  private alive = true;

  constructor(scene: Phaser.Scene, juice: Juice, textureKey: string, specs: PlatformSpec[]) {
    this.scene = scene;
    this.juice = juice;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });

    const tex = scene.textures.get(textureKey).getSourceImage();
    const tileW = (tex as { width?: number }).width || 256;
    const tileH = (tex as { height?: number }).height || 80;

    specs.forEach((spec) => {
      const sprite = this.scene.physics.add.sprite(spec.x, spec.y + tileH * 0.3 * 0.65, textureKey);
      sprite.setScale(spec.width / tileW, 0.65);
      sprite.setDepth(9);

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.pushable = false;
      // The collision box is the platform's own footprint — never wider than
      // what is drawn, so a visually-missed edge is a genuinely missed edge.
      body.setSize(tileW, tileH * 0.65, true);

      this.group.add(sprite);

      const managed: Managed = { spec, sprite, clock: spec.phaseOffsetMs ?? 0, solid: true };
      this.items.push(managed);

      if (spec.behaviour === 'moving') this.startMoving(managed);
      this.tint(managed);
    });
  }

  public getGroup() {
    return this.group;
  }

  private track(ev: Phaser.Time.TimerEvent) {
    this.timers.push(ev);
    return ev;
  }

  /** Behaviour-specific tinting so a platform's nature is readable at a glance. */
  private tint(m: Managed) {
    switch (m.spec.behaviour) {
      case 'moving':
        m.sprite.setTint(0xcfe8ff);
        break;
      case 'collapsing':
        m.sprite.setTint(0xffb5a0);
        break;
      case 'phasing':
        m.sprite.setTint(0x9fe8ff);
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------

  private startMoving(m: Managed) {
    const { travelX = 0, travelY = 0, travelMs = 2400 } = m.spec;
    const body = m.sprite.body as Phaser.Physics.Arcade.Body;

    // Tween the body's velocity target via position, then derive velocity so
    // Arcade's `immovable` rider-carry logic sees a genuinely moving body.
    this.scene.tweens.add({
      targets: m.sprite,
      x: m.sprite.x + travelX,
      y: m.sprite.y + travelY,
      duration: travelMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        body.updateFromGameObject();
      },
    });
  }

  /** Called by the scene when the player lands on a platform. */
  public notifyLanded(platform: Phaser.GameObjects.GameObject) {
    const m = this.items.find((i) => i.sprite === platform);
    if (!m || m.spec.behaviour !== 'collapsing' || m.triggered || !this.alive) return;
    m.triggered = true;

    // Tell: shudder + warm crack tint, well before the drop.
    this.scene.tweens.add({
      targets: m.sprite,
      x: m.sprite.x + 3,
      duration: 55,
      yoyo: true,
      repeat: Math.floor(COLLAPSE_WARN_MS / 110),
      ease: 'Sine.easeInOut',
    });
    m.sprite.setTint(0xff6678);

    this.track(
      this.scene.time.delayedCall(COLLAPSE_WARN_MS, () => {
        if (!this.alive || !m.sprite.active) return;
        this.collapse(m);
      })
    );
  }

  private collapse(m: Managed) {
    const body = m.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    m.solid = false;
    AudioManager.getInstance().playExplosion();
    this.juice.dust(m.sprite.x, m.sprite.y, 6, 0x7a5a48);

    const homeY = m.sprite.y;
    this.scene.tweens.add({
      targets: m.sprite,
      y: homeY + 260,
      alpha: 0,
      angle: Phaser.Math.Between(-12, 12),
      duration: 620,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!this.alive || !m.sprite.active) return;
        // Restore so a retry of the section is possible without a full restart.
        this.track(
          this.scene.time.delayedCall(COLLAPSE_RESPAWN_MS, () => {
            if (!this.alive || !m.sprite.active) return;
            m.sprite.setPosition(m.sprite.x, homeY).setAngle(0);
            m.triggered = false;
            m.solid = true;
            this.tint(m);
            body.enable = true;
            body.updateFromGameObject();
            this.scene.tweens.add({ targets: m.sprite, alpha: 1, duration: 240 });
          })
        );
      },
    });
  }

  // -------------------------------------------------------------------------

  public update(_time: number, delta: number) {
    if (!this.alive) return;

    for (const m of this.items) {
      if (m.spec.behaviour !== 'phasing') continue;

      const onMs = m.spec.phaseOnMs ?? 1600;
      const offMs = m.spec.phaseOffMs ?? 1100;
      m.clock = (m.clock ?? 0) + delta;
      const cycle = onMs + offMs;
      const t = m.clock % cycle;
      const shouldBeSolid = t < onMs;

      if (shouldBeSolid === m.solid) {
        // Pre-warn: blink during the last FADE_MS of the solid window.
        if (m.solid && t > onMs - FADE_MS) {
          m.sprite.setAlpha(0.45 + Math.sin(t * 0.05) * 0.3);
        }
        continue;
      }

      m.solid = shouldBeSolid;
      const body = m.sprite.body as Phaser.Physics.Arcade.Body;

      if (shouldBeSolid) {
        body.enable = true;
        body.updateFromGameObject();
        this.scene.tweens.add({ targets: m.sprite, alpha: 1, duration: FADE_MS });
      } else {
        body.enable = false;
        this.scene.tweens.add({ targets: m.sprite, alpha: 0.12, duration: FADE_MS });
      }
    }
  }

  public destroy() {
    this.alive = false;
    this.timers.forEach((t) => {
      try {
        t.remove(false);
      } catch {
        /* already removed */
      }
    });
    this.timers = [];
    this.items.forEach((m) => this.scene.tweens.killTweensOf(m.sprite));
    this.items = [];
    try {
      this.group.clear(true, true);
    } catch {
      /* group already destroyed with the scene */
    }
  }
}
