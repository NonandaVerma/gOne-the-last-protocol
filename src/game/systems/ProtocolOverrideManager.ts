import * as Phaser from 'phaser';
import { Juice } from './Juice';
import { AudioManager } from './AudioManager';
import { EventBus, GAME_EVENTS } from './EventBus';

export type ProtocolState = 'baseline' | 'overwritten';

export interface ReconfigurablePlatform {
  sprite: Phaser.Physics.Arcade.Sprite;
  baseline: { x: number; y: number; active: boolean };
  overwritten: { x: number; y: number; active: boolean };
}

export interface ProtocolNodeSpec {
  id: string;
  x: number;
  y: number;
  structureId: string;
  initialState?: ProtocolState;
  label?: string;
  onToggled?: (newState: ProtocolState) => void;
}

export interface CompressionPressSpec {
  x: number;
  y: number;
  retractedY: number;
  slammedY: number;
  warnMs?: number;
  activeMs?: number;
  recoveryMs?: number;
}

/**
 * ProtocolOverrideManager — The signature gameplay system for Level 5: THE OVERWRITE.
 * Manages two-state reconfigurable architecture, protocol nodes, sliding security barriers,
 * and industrial compression mechanisms.
 */
export class ProtocolOverrideManager {
  private scene: Phaser.Scene;
  private juice: Juice;
  private nodes: Map<string, {
    spec: ProtocolNodeSpec;
    sprite: Phaser.GameObjects.Sprite;
    ring: Phaser.GameObjects.Image;
    state: ProtocolState;
    inRange: boolean;
  }> = new Map();

  private structures: Map<string, ReconfigurablePlatform[]> = new Map();
  private reconfigurableGroup: Phaser.Physics.Arcade.Group;
  private compressionPresses: Array<{
    sprite: Phaser.Physics.Arcade.Sprite;
    spec: CompressionPressSpec;
    state: 'idle' | 'warning' | 'active' | 'recovery';
    timer: number;
  }> = [];

  private promptText?: Phaser.GameObjects.Text;
  private promptBg?: Phaser.GameObjects.Graphics;
  private activeTargetNodeId?: string;
  private isDestroyed = false;

  constructor(scene: Phaser.Scene, juice: Juice) {
    this.scene = scene;
    this.juice = juice;
    this.reconfigurableGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.createPromptUI();
  }

  public getReconfigurableGroup(): Phaser.Physics.Arcade.Group {
    return this.reconfigurableGroup;
  }

  private createPromptUI() {
    this.promptBg = this.scene.add.graphics().setDepth(50).setVisible(false);
    this.promptText = this.scene.add
      .text(0, 0, '[F] OVERRIDE PROTOCOL', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f59e0b',
        stroke: '#05070a',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(51)
      .setVisible(false);
  }

  /** Register a reconfigurable structure with baseline & overwritten platform specs. */
  public registerStructure(structureId: string, platforms: ReconfigurablePlatform[]) {
    this.structures.set(structureId, platforms);
    // Apply initial baseline state
    platforms.forEach((p) => {
      this.reconfigurableGroup.add(p.sprite);
      p.sprite.setPosition(p.baseline.x, p.baseline.y);
      p.sprite.setVisible(p.baseline.active);
      const body = p.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.enable = p.baseline.active;
        body.reset(p.baseline.x, p.baseline.y);
      }
    });
  }

  /** Register an interactive Protocol Node controlling a structure. */
  public addNode(spec: ProtocolNodeSpec) {
    const initialState = spec.initialState ?? 'baseline';
    const textureKey = initialState === 'baseline' ? 'protocol_node_baseline' : 'protocol_node_overwritten';

    const sprite = this.scene.add.sprite(spec.x, spec.y, textureKey).setDepth(22);
    const ring = this.scene.add.image(spec.x, spec.y, 'protocol_node_baseline')
      .setDepth(21)
      .setScale(1.3)
      .setAlpha(0.4)
      .setTint(0xf59e0b);

    this.scene.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0.1,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      this.tryInteractNode(spec.id);
    });

    this.nodes.set(spec.id, {
      spec,
      sprite,
      ring,
      state: initialState,
      inRange: false,
    });
  }

  /** Register a timed industrial compression press in Stage 4. */
  public addCompressionPress(spec: CompressionPressSpec, group: Phaser.Physics.Arcade.Group) {
    const sprite = group.create(spec.x, spec.retractedY, 'compression_press') as Phaser.Physics.Arcade.Sprite;
    sprite.setImmovable(true);
    sprite.setDepth(24);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(170, 130);

    this.compressionPresses.push({
      sprite,
      spec,
      state: 'idle',
      timer: 0,
    });
  }

  /** Player presses [F] or clicks: attempts contextual interaction with nearest node. */
  public tryInteract(playerX: number, playerY: number): boolean {
    let nearestNodeId: string | null = null;
    let minDist = 160;

    this.nodes.forEach((node, id) => {
      const dist = Phaser.Math.Distance.Between(playerX, playerY, node.spec.x, node.spec.y);
      if (dist < minDist) {
        minDist = dist;
        nearestNodeId = id;
      }
    });

    if (nearestNodeId) {
      return this.tryInteractNode(nearestNodeId);
    }
    return false;
  }

  private tryInteractNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Toggle state
    const nextState: ProtocolState = node.state === 'baseline' ? 'overwritten' : 'baseline';
    node.state = nextState;

    // Update visuals
    node.sprite.setTexture(nextState === 'baseline' ? 'protocol_node_baseline' : 'protocol_node_overwritten');
    this.juice.impact(node.spec.x, node.spec.y, 'player', { scale: 1.2, sparks: 14, ring: true });
    this.juice.flash(0xf59e0b, 0.25, 160);
    this.juice.shake(0.012, 220);
    AudioManager.getInstance().playRelicCollect();

    // Reconfigure linked structure
    const linkedPlatforms = this.structures.get(node.spec.structureId);
    if (linkedPlatforms) {
      linkedPlatforms.forEach((p) => {
        const target = nextState === 'baseline' ? p.baseline : p.overwritten;
        const body = p.sprite.body as Phaser.Physics.Arcade.Body;

        if (target.active) {
          p.sprite.setVisible(true);
          if (body) body.enable = true;
          this.scene.tweens.add({
            targets: p.sprite,
            x: target.x,
            y: target.y,
            alpha: 1,
            duration: 320,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
              if (body) {
                body.x = p.sprite.x - body.halfWidth;
                body.y = p.sprite.y - body.halfHeight;
              }
            },
            onComplete: () => {
              if (body) {
                body.reset(target.x, target.y);
              }
            },
          });
        } else {
          this.scene.tweens.add({
            targets: p.sprite,
            alpha: 0,
            duration: 250,
            ease: 'Quad.easeIn',
            onComplete: () => {
              p.sprite.setVisible(false);
              if (body) body.enable = false;
            },
          });
        }
      });
    }

    // Fire callback if defined
    if (node.spec.onToggled) {
      node.spec.onToggled(nextState);
    }

    EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
      label: 'PROTOCOL OVERRIDE',
      value: `${node.spec.structureId.toUpperCase()} // ${nextState.toUpperCase()}`,
      alert: nextState === 'overwritten',
    });

    EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
      text: `PROTOCOL RECONFIGURED: ${node.spec.structureId.replace(/_/g, ' ').toUpperCase()} switched to ${nextState.toUpperCase()} configuration.`,
      speaker: 'SYSTEM',
      duration: 3200,
      priority: 2,
    });

    return true;
  }

  /** Update per frame: manages focus proximity, UI prompt, and compression press state machines. */
  public update(player: Phaser.Physics.Arcade.Sprite, delta: number) {
    if (this.isDestroyed || !player.active) return;

    let closestNode: { id: string; x: number; y: number } | null = null;
    let closestDist = 160;

    this.nodes.forEach((node, id) => {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, node.spec.x, node.spec.y);
      const inRange = dist <= 160;
      node.inRange = inRange;
      node.ring.setVisible(inRange);

      if (inRange && dist < closestDist) {
        closestDist = dist;
        closestNode = { id, x: node.spec.x, y: node.spec.y };
      }
    });

    if (closestNode) {
      const c = closestNode as { id: string; x: number; y: number };
      this.activeTargetNodeId = c.id;
      if (this.promptText && this.promptBg) {
        this.promptText.setPosition(c.x, c.y - 36).setVisible(true);
        this.promptBg.clear();
        this.promptBg.fillStyle(0x0a0c10, 0.85);
        this.promptBg.fillRoundedRect(c.x - 90, c.y - 48, 180, 24, 6);
        this.promptBg.lineStyle(1.5, 0xf59e0b, 0.9);
        this.promptBg.strokeRoundedRect(c.x - 90, c.y - 48, 180, 24, 6);
        this.promptBg.setVisible(true);
      }
    } else {
      this.activeTargetNodeId = undefined;
      this.promptText?.setVisible(false);
      this.promptBg?.setVisible(false);
    }

    // Update Compression Presses (Stage 4)
    this.updateCompressionPresses(delta, player);
  }

  private updateCompressionPresses(delta: number, player: Phaser.Physics.Arcade.Sprite) {
    this.compressionPresses.forEach((press) => {
      press.timer += delta;
      const warnMs = press.spec.warnMs ?? 800;
      const activeMs = press.spec.activeMs ?? 500;
      const recoveryMs = press.spec.recoveryMs ?? 1600;

      switch (press.state) {
        case 'idle':
          if (press.timer >= 1200) {
            press.state = 'warning';
            press.timer = 0;
            press.sprite.setTint(0xf59e0b);
            this.juice.impact(press.sprite.x, press.spec.retractedY + 60, 'boss', { scale: 0.8, sparks: 6 });
          }
          break;

        case 'warning':
          // Flash amber before violent drop
          if (Math.floor(press.timer / 100) % 2 === 0) {
            press.sprite.setTint(0xfbbf24);
          } else {
            press.sprite.setTint(0xd97706);
          }

          if (press.timer >= warnMs) {
            press.state = 'active';
            press.timer = 0;
            press.sprite.clearTint();
            // Slam down
            this.scene.tweens.add({
              targets: press.sprite,
              y: press.spec.slammedY,
              duration: 120,
              ease: 'Quad.easeIn',
              onComplete: () => {
                this.juice.shake(0.016, 280);
                this.juice.impact(press.sprite.x, press.spec.slammedY + 50, 'boss', { scale: 1.5, sparks: 16 });
                AudioManager.getInstance().playExplosion();
              },
            });
          }
          break;

        case 'active':
          // Active crushing window: check overlap with player
          if (press.sprite.getBounds().contains(player.x, player.y) && !player.getData('isDead')) {
            player.emit('takeDamage', 1);
          }

          if (press.timer >= activeMs) {
            press.state = 'recovery';
            press.timer = 0;
            // Retract back up
            this.scene.tweens.add({
              targets: press.sprite,
              y: press.spec.retractedY,
              duration: 700,
              ease: 'Sine.easeInOut',
            });
          }
          break;

        case 'recovery':
          if (press.timer >= recoveryMs) {
            press.state = 'idle';
            press.timer = 0;
          }
          break;
      }
    });
  }

  /** Reset all nodes and structures to checkpoint baseline states. */
  public resetToCheckpoint() {
    this.nodes.forEach((node) => {
      node.state = node.spec.initialState ?? 'baseline';
      node.sprite.setTexture(node.state === 'baseline' ? 'protocol_node_baseline' : 'protocol_node_overwritten');
      const linkedPlatforms = this.structures.get(node.spec.structureId);
      if (linkedPlatforms) {
        linkedPlatforms.forEach((p) => {
          const target = node.state === 'baseline' ? p.baseline : p.overwritten;
          p.sprite.setPosition(target.x, target.y);
          p.sprite.setVisible(target.active);
          const body = p.sprite.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.enable = target.active;
            body.reset(target.x, target.y);
          }
        });
      }
    });
  }

  public destroy() {
    this.isDestroyed = true;
    this.promptText?.destroy();
    this.promptBg?.destroy();
    this.nodes.forEach((n) => {
      n.sprite.destroy();
      n.ring.destroy();
    });
    this.nodes.clear();
    this.structures.clear();
    try {
      this.reconfigurableGroup.destroy(true);
    } catch (_) {}
    this.compressionPresses = [];
  }
}
