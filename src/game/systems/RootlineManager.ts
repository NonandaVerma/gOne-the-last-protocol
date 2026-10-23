import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { Juice } from './Juice';
import { AudioManager } from './AudioManager';
import { EventBus, GAME_EVENTS } from './EventBus';

export interface RootlineAnchor {
  id: string;
  x: number;
  y: number;
  kind: 'pull' | 'launch' | 'transfer' | 'env';
  label: string;
  prompt?: string;
  radius?: number;
  targetX?: number;
  targetY?: number;
  impulseX?: number;
  impulseY?: number;
  eventKey?: string;
  active?: boolean;
}

interface AnchorInstance {
  spec: RootlineAnchor;
  sprite: Phaser.GameObjects.Sprite;
  ring: Phaser.GameObjects.Graphics;
  active: boolean;
}

/**
 * ROOTLINE TRAVERSAL & LIVING MECHANISM MANAGER
 * The signature traversal ability for Level 3 — The Verdant Abyss.
 * Allows G-ONE to tether to designated biomechanical organic anchors:
 * - Pull anchors: draw G-ONE towards branches/elevated structures with vault boost.
 * - Launch anchors: kinetic bio-spore bulbs that propel G-ONE upward to high canopies.
 * - Transfer anchors: parabolic aerial tendril swings across dangerous chasms.
 * - Environmental anchors: bio-nodes harmonized via tether to bloom bridges and unlock membranes.
 */
export class RootlineManager {
  private scene: Phaser.Scene;
  private player: GOne;
  private juice: Juice;
  private anchors: AnchorInstance[] = [];
  private focused?: AnchorInstance;
  private tetherGfx: Phaser.GameObjects.Graphics;
  private isTethering = false;
  private keyF?: Phaser.Input.Keyboard.Key;
  private keyE?: Phaser.Input.Keyboard.Key;
  private promptText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: GOne, juice: Juice) {
    this.scene = scene;
    this.player = player;
    this.juice = juice;

    this.tetherGfx = scene.add.graphics();
    this.tetherGfx.setDepth(25);

    // Contextual floating prompt
    this.promptText = scene.add
      .text(0, 0, '', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        color: '#6ee7b7',
        backgroundColor: '#022c22ee',
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

    // Pointer support: click near focused anchor engages
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.focused) return;
      const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.focused.spec.x, this.focused.spec.y);
      if (dist <= 80) {
        this.tryEngage();
      }
    });
  }

  public addAnchor(spec: RootlineAnchor) {
    let textureKey = 'rootline_anchor_pull';
    if (spec.kind === 'launch') textureKey = 'rootline_anchor_launch';
    else if (spec.kind === 'transfer') textureKey = 'rootline_anchor_transfer';
    else if (spec.kind === 'env') textureKey = 'rootline_anchor_env';

    if (!this.scene.textures.exists(textureKey)) {
      textureKey = 'protocol_fragment';
    }

    const sprite = this.scene.add.sprite(spec.x, spec.y, textureKey);
    sprite.setDepth(16);

    // Soft gentle hover/pulse tween
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0.95, to: 1.08 },
      alpha: { from: 0.85, to: 1 },
      duration: 1200 + (spec.x % 400),
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
    });
  }

  public setAnchorActive(id: string, active: boolean) {
    const inst = this.anchors.find((a) => a.spec.id === id);
    if (inst) {
      inst.active = active;
      inst.sprite.setAlpha(active ? 1 : 0.35);
    }
  }

  public tryEngage(): boolean {
    if (!this.focused || !this.focused.active || this.isTethering || this.player.isDead) return false;
    const anchor = this.focused.spec;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    this.isTethering = true;
    AudioManager.getInstance().playDash();

    // Pulse impact at anchor
    this.juice.impact(anchor.x, anchor.y, 'player', { scale: 1.4, sparks: 14, ring: true });
    this.juice.shake(0.008, 160);

    // Tether action based on kind
    switch (anchor.kind) {
      case 'pull': {
        const startX = this.player.x;
        const startY = this.player.y;
        const duration = 240;

        this.scene.tweens.add({
          targets: this.player,
          x: anchor.x,
          y: anchor.y - 10,
          duration,
          ease: 'Quad.easeIn',
          onUpdate: () => {
            this.drawTether(this.player.x, this.player.y, anchor.x, anchor.y);
          },
          onComplete: () => {
            this.clearTether();
            this.isTethering = false;
            // Upward vault boost
            const exitVx = anchor.impulseX ?? (this.player.x > startX ? 240 : -240);
            const exitVy = anchor.impulseY ?? -440;
            body.setVelocity(exitVx, exitVy);
            this.juice.impact(anchor.x, anchor.y, 'player', { scale: 1.2, sparks: 8 });
            AudioManager.getInstance().playJump();
          },
        });
        return true;
      }

      case 'launch': {
        this.drawTether(this.player.x, this.player.y, anchor.x, anchor.y);
        this.juice.shake(0.014, 260);
        this.juice.impact(anchor.x, anchor.y, 'player', { scale: 2.0, sparks: 24, ring: true });

        const launchVy = anchor.impulseY ?? -1150;
        const launchVx = anchor.impulseX ?? (anchor.targetX ? (anchor.targetX - this.player.x) * 0.75 : 120);

        body.setVelocity(launchVx, launchVy);
        AudioManager.getInstance().playJump();

        this.scene.time.delayedCall(160, () => {
          this.clearTether();
          this.isTethering = false;
        });
        return true;
      }

      case 'transfer': {
        const destX = anchor.targetX ?? anchor.x + 380;
        const destY = anchor.targetY ?? anchor.y;
        const midY = Math.min(this.player.y, anchor.y) - 60;
        const duration = 480;

        const path = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(this.player.x, this.player.y),
          new Phaser.Math.Vector2(anchor.x, midY),
          new Phaser.Math.Vector2(destX, destY)
        );

        let tVal = { val: 0 };
        this.scene.tweens.add({
          targets: tVal,
          val: 1,
          duration,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            const p = path.getPoint(tVal.val);
            this.player.setPosition(p.x, p.y);
            body.setVelocity(0, 0);
            this.drawTether(this.player.x, this.player.y, anchor.x, anchor.y);
          },
          onComplete: () => {
            this.clearTether();
            this.isTethering = false;
            body.setVelocity(160, -120);
            this.juice.impact(destX, destY, 'player', { scale: 1.3, sparks: 10 });
          },
        });
        return true;
      }

      case 'env': {
        this.drawTether(this.player.x, this.player.y, anchor.x, anchor.y);
        this.juice.shake(0.01, 200);
        this.juice.impact(anchor.x, anchor.y, 'player', { scale: 1.8, sparks: 20, ring: true });
        AudioManager.getInstance().playRelicCollect();

        // Blossom bloom animation
        this.scene.tweens.add({
          targets: this.focused.sprite,
          scale: 1.45,
          duration: 200,
          yoyo: true,
          onComplete: () => {
            this.clearTether();
            this.isTethering = false;
            if (anchor.eventKey) {
              EventBus.emit(anchor.eventKey, true);
            }
          },
        });
        return true;
      }
    }

    this.isTethering = false;
    return false;
  }

  private drawTether(x1: number, y1: number, x2: number, y2: number) {
    this.tetherGfx.clear();

    const startX = x1;
    const startY = y1 - 20;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + 15;
    const steps = 10;

    const plotCurve = () => {
      this.tetherGfx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const invT = 1 - t;
        const px = invT * invT * startX + 2 * invT * t * midX + t * t * x2;
        const py = invT * invT * startY + 2 * invT * t * midY + t * t * y2;
        if (i === 0) this.tetherGfx.moveTo(px, py);
        else this.tetherGfx.lineTo(px, py);
      }
      this.tetherGfx.strokePath();
    };

    // Braided outer glowing tendril
    this.tetherGfx.lineStyle(4, 0x10b981, 0.7);
    plotCurve();

    // Intense inner core ray
    this.tetherGfx.lineStyle(1.8, 0x00f0ff, 0.95);
    plotCurve();
  }

  private clearTether() {
    this.tetherGfx.clear();
  }

  public update(time: number, delta: number) {
    if (!this.player || this.player.isDead) {
      this.clearFocus();
      return;
    }

    if (this.isTethering) return;

    const px = this.player.x;
    const py = this.player.y;

    // Find nearest active anchor in range
    let bestAnchor: AnchorInstance | undefined;
    let bestDist = Infinity;

    for (const inst of this.anchors) {
      if (!inst.active) continue;
      const radius = inst.spec.radius ?? 280;
      const dist = Phaser.Math.Distance.Between(px, py, inst.spec.x, inst.spec.y);
      if (dist <= radius && dist < bestDist) {
        bestDist = dist;
        bestAnchor = inst;
      }
    }

    if (bestAnchor !== this.focused) {
      this.clearFocus();
      this.focused = bestAnchor;
      if (this.focused) {
        this.focused.ring.setVisible(true);
        const promptMsg =
          this.focused.spec.prompt ??
          (this.focused.spec.kind === 'env'
            ? '[E / F] HARMONIZE BIO-NODE'
            : this.focused.spec.kind === 'launch'
            ? '[F] KINETIC SPORE LAUNCH'
            : this.focused.spec.kind === 'transfer'
            ? '[F] CANOPY TRANSFER SWING'
            : '[F] ROOTLINE TETHER');

        if (this.promptText) {
          this.promptText.setText(promptMsg);
          this.promptText.setPosition(this.focused.spec.x, this.focused.spec.y - 30);
          this.promptText.setVisible(true);
        }

        EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
          label: 'ROOTLINE READY',
          value: this.focused.spec.label,
        });
      }
    }

    // Animate focused ring
    if (this.focused) {
      const ring = this.focused.ring;
      ring.clear();
      const pulse = 18 + Math.sin(time * 0.008) * 4;
      ring.lineStyle(2, 0x10b981, 0.85);
      ring.strokeCircle(this.focused.spec.x, this.focused.spec.y, pulse);
      ring.lineStyle(1.5, 0x00f0ff, 0.7);
      ring.strokeCircle(this.focused.spec.x, this.focused.spec.y, pulse + 6);
    }
  }

  private clearFocus() {
    if (this.focused) {
      this.focused.ring.clear();
      this.focused.ring.setVisible(false);
      this.focused = undefined;
    }
    this.promptText?.setVisible(false);
  }

  public destroy() {
    this.clearTether();
    this.clearFocus();
    this.tetherGfx.destroy();
    this.promptText?.destroy();
    this.anchors.forEach((a) => {
      a.sprite.destroy();
      a.ring.destroy();
    });
    this.anchors = [];
  }
}
