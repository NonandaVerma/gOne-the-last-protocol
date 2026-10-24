import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { RaOne } from '../entities/RaOne';
import { Enemy, EnemyManager } from '../entities/Enemy';
import { Juice } from './Juice';
import { AudioManager } from './AudioManager';
import { EventBus, GAME_EVENTS } from './EventBus';

export interface BreakTarget {
  x: number;
  y: number;
  isInterruptible: () => boolean;
  interrupt: (durationMs?: number) => void;
}

/**
 * PROTOCOL BREAK MANAGER
 *
 * Drives the signature combat interrupt mechanic for Level 6 — THE BLACK CROWN.
 *
 * When an elite sentinel or Ra-One enters a heavy control telegraph or channeling state,
 * this manager tracks the target, displays the spinning cyan reticle and [F] prompt,
 * and processes player interrupt inputs. On successful break:
 * - The channeled attack is aborted.
 * - The target takes heavy rupture damage.
 * - The target is locked in an exposed recovery stun window (2.5s – 3.5s).
 */
export class ProtocolBreakManager {
  private scene: Phaser.Scene;
  private juice: Juice;
  private reticle?: Phaser.GameObjects.Sprite;
  private promptText?: Phaser.GameObjects.Text;
  private currentTarget?: BreakTarget;
  private lastAlertState = false;

  constructor(scene: Phaser.Scene, juice: Juice) {
    this.scene = scene;
    this.juice = juice;

    if (scene.textures.exists('protocol_break_indicator')) {
      this.reticle = scene.add.sprite(0, 0, 'protocol_break_indicator');
      this.reticle.setDepth(35);
      this.reticle.setBlendMode(Phaser.BlendModes.ADD);
      this.reticle.setVisible(false);
      this.reticle.setScale(0.85);

      scene.tweens.add({
        targets: this.reticle,
        scale: { from: 0.8, to: 1.05 },
        alpha: { from: 0.8, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: 400,
        ease: 'Sine.easeInOut',
      });
    }

    this.promptText = scene.add.text(0, 0, '[F] PROTOCOL BREAK', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#00F0FF',
      fontStyle: 'bold',
      backgroundColor: '#07070Aee',
      padding: { x: 6, y: 3 },
    });
    this.promptText.setOrigin(0.5, 1);
    this.promptText.setDepth(36);
    this.promptText.setVisible(false);
  }

  public update(player: GOne, boss?: RaOne, enemyManager?: EnemyManager, _delta: number = 16) {
    if (!player || player.isDead || !player.active) {
      this.hideIndicator();
      return;
    }

    const target = this.findBestInterruptibleTarget(player, boss, enemyManager);
    this.currentTarget = target;

    if (target) {
      if (!this.lastAlertState) {
        this.lastAlertState = true;
        EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
          label: 'PROTOCOL BREAK',
          value: 'PRESS [F] / CLICK TO STUN',
          alert: true,
        });
      }

      if (this.reticle) {
        this.reticle.setVisible(true);
        this.reticle.setPosition(target.x, target.y - 10);
        this.reticle.rotation += 0.05;
      }
      if (this.promptText) {
        this.promptText.setVisible(true);
        this.promptText.setPosition(target.x, target.y - 55);
      }
    } else {
      if (this.lastAlertState) {
        this.lastAlertState = false;
        EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
          label: 'PROTOCOL BREAK',
          value: 'SYSTEM STABLE',
          alert: false,
        });
      }
      this.hideIndicator();
    }
  }

  private findBestInterruptibleTarget(
    player: GOne,
    boss?: RaOne,
    enemyManager?: EnemyManager
  ): BreakTarget | undefined {
    const maxRange = 420;

    // Check boss first
    if (boss && boss.active && (boss as any).isInterruptibleForProtocolBreak?.()) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y);
      if (dist <= maxRange) {
        return {
          x: boss.x,
          y: boss.y,
          isInterruptible: () => (boss as any).isInterruptibleForProtocolBreak?.() ?? false,
          interrupt: (dur?: number) => (boss as any).interruptProtocolBreak?.(dur),
        };
      }
    }

    // Check grunt enemies
    if (enemyManager) {
      const activeEnemies = enemyManager.getEnemies();
      for (const enemy of activeEnemies) {
        if (enemy.isInterruptible()) {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (dist <= maxRange) {
            return {
              x: enemy.x,
              y: enemy.y,
              isInterruptible: () => enemy.isInterruptible(),
              interrupt: (dur?: number) => enemy.interrupt(dur),
            };
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Attempts to execute Protocol Break.
   * Returns true if a target was successfully interrupted.
   */
  public tryProtocolBreak(
    playerX: number,
    playerY: number,
    pointerWorld?: { x: number; y: number }
  ): boolean {
    if (!this.currentTarget || !this.currentTarget.isInterruptible()) {
      return false;
    }

    const t = this.currentTarget;
    const distToPlayer = Phaser.Math.Distance.Between(playerX, playerY, t.x, t.y);
    const distToPointer = pointerWorld
      ? Phaser.Math.Distance.Between(pointerWorld.x, pointerWorld.y, t.x, t.y)
      : Infinity;

    // Trigger if within reach of player or directly clicked
    if (distToPlayer <= 450 || distToPointer <= 120) {
      t.interrupt(3500);

      this.juice.zoomPunch(0.06, 280);
      this.juice.flash(0x00f0ff, 0.45, 260);
      this.juice.shake(0.02, 380);
      this.juice.impact(t.x, t.y, 'player', { scale: 2.4, sparks: 32, ring: true });
      this.juice.floatText(t.x, t.y - 70, 'PROTOCOL BREAK!', 0x00f0ff, 22);
      AudioManager.getInstance().playOverdrive();

      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'PROTOCOL BREAK',
        value: 'STUN APPLIED // VULNERABLE',
        alert: false,
      });

      this.hideIndicator();
      this.currentTarget = undefined;
      return true;
    }

    return false;
  }

  private hideIndicator() {
    this.reticle?.setVisible(false);
    this.promptText?.setVisible(false);
  }

  public destroy() {
    this.reticle?.destroy();
    this.promptText?.destroy();
    this.currentTarget = undefined;
  }
}
