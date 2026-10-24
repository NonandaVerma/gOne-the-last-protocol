import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { Juice } from './Juice';
import { AudioManager } from './AudioManager';
import { EventBus, GAME_EVENTS } from './EventBus';

export interface GravityAnchor {
  id: string;
  x: number;
  y: number;
  kind: 'invert' | 'sling' | 'bridge' | 'pulse' | 'env';
  label: string;
  prompt?: string;
  radius?: number;
  targetX?: number;
  targetY?: number;
  impulseX?: number;
  impulseY?: number;
  eventKey?: string;
  durationMs?: number;
  cooldownMs?: number;
  active?: boolean;
}

export interface GravityWell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'up' | 'down' | 'left' | 'radial';
  force: number;
  pulsing?: boolean;
  pulseIntervalMs?: number;
  label?: string;
}

interface AnchorInstance {
  spec: GravityAnchor;
  sprite: Phaser.GameObjects.Sprite;
  ring: Phaser.GameObjects.Graphics;
  active: boolean;
  coolingUntil: number;
}

interface WellInstance {
  spec: GravityWell;
  zone: Phaser.Geom.Rectangle;
  particles: Phaser.GameObjects.Graphics;
  particlesList: Array<{ x: number; y: number; vy: number; vx: number; alpha: number }>;
  nextPulseAt: number;
  isPulsing: boolean;
}

/**
 * GRAVITAS — GRAVITY REDIRECTION & GRAVITATIONAL WELL SYSTEM
 * The signature mechanic of Level 4: The Voidborn Abyss.
 *
 * Provides:
 * 1. Gravity Anchors:
 *    - Invert: Inverts localized gravity / reverses lifts and floating platforms.
 *    - Sling: Gravitational slingshot projecting G-ONE across chasms to high structures.
 *    - Bridge: Materializes solid hard-light gravitational bridges.
 *    - Pulse: Discharges an expansive gravity wave that stuns enemies and disrupts shields.
 *    - Env: Interaction nodes to disrupt rift anchors, stabilize crystal containment, and overload boss core.
 *
 * 2. Gravity Wells:
 *    - Directional buoyant updrafts (anti-gravity shafts) in the inverted megacity.
 *    - Devouring Singularity leftward pull fields in Stage 5 with telegraphed pulses.
 *    - Safe suppression through Anti-Singularity Bubbles.
 */
export class GravitasManager {
  private scene: Phaser.Scene;
  private player: GOne;
  private juice: Juice;
  private anchors: AnchorInstance[] = [];
  private wells: WellInstance[] = [];
  private focused?: AnchorInstance;
  private tetherGfx: Phaser.GameObjects.Graphics;
  private promptText?: Phaser.GameObjects.Text;
  private keyF?: Phaser.Input.Keyboard.Key;
  private keyE?: Phaser.Input.Keyboard.Key;
  private isEngaged = false;
  private antiSingularityUntil = 0;

  constructor(scene: Phaser.Scene, player: GOne, juice: Juice) {
    this.scene = scene;
    this.player = player;
    this.juice = juice;

    this.tetherGfx = scene.add.graphics();
    this.tetherGfx.setDepth(25);

    this.promptText = scene.add
      .text(0, 0, '', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        color: '#d8b4fe',
        backgroundColor: '#2e104dee',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1.6)
      .setDepth(30)
      .setVisible(false);

    if (scene.input.keyboard) {
      this.keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.keyF.on('down', () => this.tryEngage());

      this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyE.on('down', () => {
        if (this.focused?.spec.kind === 'env') {
          this.tryEngage();
        }
      });
    }

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.focused) return;
      const dist = Phaser.Math.Distance.Between(
        pointer.worldX,
        pointer.worldY,
        this.focused.spec.x,
        this.focused.spec.y
      );
      if (dist <= 80) {
        this.tryEngage();
      }
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  public addAnchor(spec: GravityAnchor) {
    let textureKey = 'gravitas_anchor_idle';
    if (!this.scene.textures.exists(textureKey)) {
      textureKey = 'protocol_fragment';
    }

    const sprite = this.scene.add.sprite(spec.x, spec.y, textureKey);
    sprite.setDepth(16).setTint(0xc084fc);

    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0.95, to: 1.12 },
      alpha: { from: 0.85, to: 1 },
      duration: 1200 + (spec.x % 300),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const ring = this.scene.add.graphics();
    ring.setDepth(17);
    ring.setVisible(false);

    this.anchors.push({
      spec,
      sprite,
      ring,
      active: spec.active !== false,
      coolingUntil: 0,
    });
  }

  public addWell(spec: GravityWell) {
    const zone = new Phaser.Geom.Rectangle(
      spec.x - spec.width / 2,
      spec.y - spec.height / 2,
      spec.width,
      spec.height
    );

    const particles = this.scene.add.graphics();
    particles.setDepth(12);

    const particlesList: Array<{ x: number; y: number; vy: number; vx: number; alpha: number }> = [];
    const count = Math.min(24, Math.floor(spec.width / 20));
    for (let i = 0; i < count; i++) {
      particlesList.push({
        x: Phaser.Math.Between(zone.left, zone.right),
        y: Phaser.Math.Between(zone.top, zone.bottom),
        vy: spec.direction === 'up' ? -Phaser.Math.Between(60, 140) : 0,
        vx: spec.direction === 'left' ? -Phaser.Math.Between(80, 160) : 0,
        alpha: Phaser.Math.FloatBetween(0.3, 0.8),
      });
    }

    this.wells.push({
      spec,
      zone,
      particles,
      particlesList,
      nextPulseAt: 0,
      isPulsing: false,
    });
  }

  public setAnchorActive(id: string, active: boolean) {
    const inst = this.anchors.find((a) => a.spec.id === id);
    if (inst) {
      inst.active = active;
      inst.sprite.setAlpha(active ? 1 : 0.3);
      if (!active) inst.ring.setVisible(false);
    }
  }

  public tryEngage(): boolean {
    if (!this.focused || !this.focused.active || this.isEngaged || this.player.isDead) return false;
    const now = this.scene.time.now;
    if (now < this.focused.coolingUntil) return false;

    const anchor = this.focused.spec;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    this.isEngaged = true;
    AudioManager.getInstance().playDash();

    // Purple gravitational shockwave & impact
    this.juice.impact(anchor.x, anchor.y, 'player', { scale: 1.5, sparks: 16, ring: true });
    this.juice.shake(0.009, 180);

    const duration = anchor.durationMs ?? 4000;
    const cooldown = anchor.cooldownMs ?? 1500;
    this.focused.coolingUntil = now + duration + cooldown;

    // Beam flash
    this.tetherGfx.clear();
    this.tetherGfx.lineStyle(3, 0xd8b4fe, 0.95);
    this.tetherGfx.lineBetween(this.player.x, this.player.y - 30, anchor.x, anchor.y);
    this.scene.time.delayedCall(220, () => this.tetherGfx.clear());

    switch (anchor.kind) {
      case 'invert': {
        EventBus.emit(anchor.eventKey ?? 'grav-lift-inverted', { anchorId: anchor.id });
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: 'Gravitas: Localized gravity field inverted. Platform mechanics altered.',
          speaker: 'SYSTEM',
          duration: 3200,
          priority: 2,
        });
        break;
      }

      case 'sling': {
        const tx = anchor.targetX ?? anchor.x + 220;
        const ty = anchor.targetY ?? anchor.y - 140;
        const ix = anchor.impulseX ?? 320;
        const iy = anchor.impulseY ?? -640;

        body.setVelocity(ix, iy);
        this.juice.shake(0.012, 220);

        this.scene.tweens.add({
          targets: this.player,
          alpha: { from: 0.6, to: 1 },
          duration: 350,
        });
        break;
      }

      case 'bridge': {
        EventBus.emit(anchor.eventKey ?? 'grav-bridge-solidified', { anchorId: anchor.id });
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: 'Gravitas: Hard-light gravity bridge solidified across the chasm.',
          speaker: 'SYSTEM',
          duration: 3200,
          priority: 2,
        });
        break;
      }

      case 'pulse': {
        // Anti-singularity bubble or combat pulse
        this.antiSingularityUntil = now + 5000;
        this.juice.shake(0.015, 300);

        // Disrupt nearby enemies within 400px
        EventBus.emit('gravitas-pulse-fired', { x: anchor.x, y: anchor.y, radius: 400 });
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: 'Gravitas Pulse: Singularity pressure stabilized! Local forces suppressed.',
          speaker: 'G-ONE',
          duration: 3200,
          priority: 2,
        });
        break;
      }

      case 'env': {
        EventBus.emit(anchor.eventKey ?? 'grav-env-triggered', { anchorId: anchor.id });
        break;
      }
    }

    this.scene.time.delayedCall(300, () => {
      this.isEngaged = false;
    });

    return true;
  }

  public update(time: number, delta: number) {
    if (this.player.isDead) {
      this.promptText?.setVisible(false);
      this.focused = undefined;
      return;
    }

    const px = this.player.x;
    const py = this.player.y - 30;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // 1. Check Gravity Wells & apply deterministic forces
    const dt = delta / 1000;
    const isAntiSingularityActive = time < this.antiSingularityUntil;

    for (const well of this.wells) {
      const inside = well.zone.contains(px, py);

      // Render well particles
      well.particles.clear();
      for (const p of well.particlesList) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (well.spec.direction === 'up' && p.y < well.zone.top) {
          p.y = well.zone.bottom;
          p.x = Phaser.Math.Between(well.zone.left, well.zone.right);
        } else if (well.spec.direction === 'left' && p.x < well.zone.left) {
          p.x = well.zone.right;
          p.y = Phaser.Math.Between(well.zone.top, well.zone.bottom);
        }

        well.particles.fillStyle(0xc084fc, p.alpha);
        well.particles.fillCircle(p.x, p.y, 2.5);
      }

      // Border bounds indicator
      well.particles.lineStyle(1.5, 0x9333ea, inside ? 0.6 : 0.2);
      well.particles.strokeRectShape(well.zone);

      if (inside && body) {
        if (well.spec.direction === 'up') {
          // Buoyant anti-gravity upward drift (smooth, capped)
          body.setVelocityY(Math.max(body.velocity.y - well.spec.force * dt, -440));
        } else if (well.spec.direction === 'left') {
          if (!isAntiSingularityActive) {
            // Singularity pull towards left chasm
            body.setVelocityX(body.velocity.x - well.spec.force * dt);
          }
        }
      }
    }

    // 2. Find Nearest Gravity Anchor
    let closest: AnchorInstance | undefined;
    let minDist = Infinity;

    for (const inst of this.anchors) {
      if (!inst.active) {
        inst.ring.setVisible(false);
        continue;
      }

      const dist = Phaser.Math.Distance.Between(px, py, inst.spec.x, inst.spec.y);
      const maxR = inst.spec.radius ?? 280;

      if (dist <= maxR && dist < minDist) {
        minDist = dist;
        closest = inst;
      } else {
        inst.ring.setVisible(false);
      }
    }

    this.focused = closest;

    if (closest) {
      const anchor = closest.spec;
      const isCooling = time < closest.coolingUntil;

      // Draw focus reticle
      closest.ring.clear();
      closest.ring.setVisible(true);

      const color = isCooling ? 0x64748b : 0xd8b4fe;
      closest.ring.lineStyle(2, color, 0.9);
      closest.ring.strokeCircle(anchor.x, anchor.y, 28 + Math.sin(time / 160) * 4);

      if (this.promptText) {
        const prompt = isCooling
          ? `[COOLDOWN ${Math.ceil((closest.coolingUntil - time) / 1000)}s]`
          : anchor.prompt ?? `[F] GRAVITAS // ${anchor.label}`;
        this.promptText
          .setText(prompt)
          .setPosition(anchor.x, anchor.y)
          .setVisible(true);
      }
    } else {
      this.promptText?.setVisible(false);
    }
  }

  public destroy() {
    this.promptText?.destroy();
    this.tetherGfx.destroy();
    for (const a of this.anchors) {
      a.sprite.destroy();
      a.ring.destroy();
    }
    for (const w of this.wells) {
      w.particles.destroy();
    }
    this.anchors = [];
    this.wells = [];
  }
}
