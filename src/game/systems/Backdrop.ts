import * as Phaser from 'phaser';
import { ACCENT, HERO, VILLAIN } from '../art/palette';
import { SaveManager } from './SaveManager';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  factorX: number;
  /** Continuous self-scroll, px/sec (drifting haze, flowing lava). */
  driftX?: number;
  factorY?: number;
}

/**
 * Multi-plane parallax backdrop.
 *
 * Layers are screen-space tile sprites whose `tilePositionX` is driven from the
 * camera scroll, which keeps them perfectly seamless over an arena far wider
 * than the viewport and costs a handful of draw calls instead of thousands of
 * Graphics commands per frame.
 */
export class Backdrop {
  private scene: Phaser.Scene;
  private layers: Layer[] = [];
  private owned: Phaser.GameObjects.GameObject[] = [];
  private level: number;
  private stormTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, level: number, viewW: number, viewH: number) {
    this.scene = scene;
    this.level = level;

    const reduced = SaveManager.getSettings().reducedMotion;

    // --- Sky (locked to the camera) -----------------------------------------
    const sky = scene.add
      .image(0, 0, `sky_${level}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);
    sky.setDisplaySize(viewW, viewH);
    this.owned.push(sky);

    const push = (
      key: string,
      y: number,
      h: number,
      factorX: number,
      depth: number,
      alpha = 1,
      driftX?: number
    ) => {
      if (!scene.textures.exists(key)) return;
      const t = scene.add
        .tileSprite(0, y, viewW, h, key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(alpha);
      this.layers.push({ sprite: t, factorX, driftX: reduced ? 0 : driftX });
      this.owned.push(t);
    };

    if (level === 1) {
      push('cloud_band', 40, 260, 0.04, -92, 0.7, 5);
      push('far_1', viewH - 500, 420, 0.14, -90);
      push('mid_1', viewH - 480, 480, 0.3, -80);
      push('near_1', viewH - 300, 320, 0.56, -70);
      this.ambientEmbers(viewW, viewH);
    } else if (level === 2) {
      push('cloud_band', 20, 260, 0.03, -92, 0.5, 4);
      push('far_2', viewH - 520, 460, 0.13, -90);
      push('mid_2', viewH - 540, 520, 0.3, -80);
      push('near_2', viewH - 330, 340, 0.58, -70);
      this.ambientRain(viewW, viewH);
      this.storm(viewW, viewH);
    } else {
      push('grid_3', 0, viewH, 0.1, -95, 0.55, 8);
      push('far_3', viewH - 560, 480, 0.16, -90);
      push('mid_3', viewH - 560, 520, 0.34, -80);
      push('near_3', viewH - 300, 300, 0.6, -70);
      this.ambientMotes(viewW, viewH);
      this.storm(viewW, viewH);
    }
  }

  // -------------------------------------------------------------------------

  private ambientEmbers(viewW: number, viewH: number) {
    if (!this.scene.textures.exists('particle_ember')) return;
    const embers = this.scene.add.particles(0, 0, 'particle_ember', {
      x: { min: 0, max: viewW },
      y: viewH + 10,
      speedY: { min: -140, max: -46 },
      speedX: { min: -46, max: 46 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 2600, max: 5200 },
      frequency: 90,
      blendMode: Phaser.BlendModes.ADD,
      quantity: 2,
    });
    embers.setScrollFactor(0).setDepth(-60);
    this.owned.push(embers);

    const smoke = this.scene.add.particles(0, 0, 'particle_smoke', {
      x: { min: 0, max: viewW },
      y: viewH - 40,
      speedY: { min: -36, max: -12 },
      speedX: { min: -16, max: 16 },
      scale: { start: 0.6, end: 2.6 },
      alpha: { start: 0.2, end: 0 },
      lifespan: 6000,
      frequency: 420,
      tint: 0x7a2a16,
    });
    smoke.setScrollFactor(0.2).setDepth(-65);
    this.owned.push(smoke);
  }

  private ambientRain(viewW: number, viewH: number) {
    if (!this.scene.textures.exists('particle_white')) return;
    const rain = this.scene.add.particles(0, 0, 'particle_white', {
      x: { min: -80, max: viewW + 80 },
      y: -20,
      speedY: { min: 520, max: 780 },
      speedX: { min: -140, max: -70 },
      scaleX: 0.12,
      scaleY: { start: 1.5, end: 1.5 },
      alpha: { start: 0.26, end: 0.08 },
      lifespan: 1600,
      frequency: 24,
      quantity: 2,
      tint: 0x9fc6ff,
    });
    rain.setScrollFactor(0).setDepth(-55);
    this.owned.push(rain);
    void viewH;
  }

  private ambientMotes(viewW: number, viewH: number) {
    if (!this.scene.textures.exists('particle_shard_blue')) return;
    const motes = this.scene.add.particles(0, 0, 'particle_shard_blue', {
      x: { min: 0, max: viewW },
      y: { min: 0, max: viewH },
      speedY: { min: -26, max: 26 },
      speedX: { min: -26, max: 26 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.55, end: 0 },
      rotate: { min: 0, max: 360 },
      lifespan: 4200,
      frequency: 160,
      blendMode: Phaser.BlendModes.ADD,
      tint: [HERO.energy, VILLAIN.energy],
    });
    motes.setScrollFactor(0.3).setDepth(-58);
    this.owned.push(motes);
  }

  /** Occasional distant lightning that briefly rim-lights the whole arena. */
  private storm(viewW: number, viewH: number) {
    if (SaveManager.getSettings().reducedMotion) return;
    if (!this.scene.textures.exists('lightning_streak')) return;

    const fire = () => {
      if (!this.scene.scene.isActive()) return;
      const streak = this.scene.add
        .image(Phaser.Math.Between(80, viewW - 80), Phaser.Math.Between(0, 60), 'lightning_streak')
        .setScrollFactor(0.1)
        .setDepth(-75)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.5));
      if (this.level === 3) streak.setTint(Phaser.Math.Between(0, 1) ? HERO.energy : VILLAIN.energy);

      const glow = this.scene.add
        .rectangle(0, 0, viewW, viewH, this.level === 3 ? HERO.energy : VILLAIN.energy, 0.06)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-74)
        .setAlpha(0);

      this.scene.tweens.add({
        targets: [streak, glow],
        alpha: { from: 0, to: 1 },
        duration: 60,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          streak.destroy();
          glow.destroy();
        },
      });
      this.owned.push(streak, glow);
    };

    const scheduleNext = () => {
      this.stormTimer = this.scene.time.delayedCall(Phaser.Math.Between(4200, 9000), () => {
        fire();
        scheduleNext();
      });
    };
    scheduleNext();
  }

  // -------------------------------------------------------------------------

  public update(scrollX: number, _scrollY: number, delta: number) {
    for (const layer of this.layers) {
      layer.sprite.tilePositionX = scrollX * layer.factorX + (layer.sprite.getData('drift') || 0);
      if (layer.driftX) {
        const d = (layer.sprite.getData('drift') || 0) + (layer.driftX * delta) / 1000;
        layer.sprite.setData('drift', d);
      }
    }
  }

  public destroy() {
    if (this.stormTimer) this.stormTimer.remove(false);
    this.owned.forEach((o) => {
      if (o && (o as { active?: boolean }).active !== false) o.destroy();
    });
    this.owned = [];
    this.layers = [];
  }
}

export const AMBIENT_TINT: Record<number, number> = {
  1: ACCENT.magma,
  2: HERO.energy,
  3: VILLAIN.energy,
};
