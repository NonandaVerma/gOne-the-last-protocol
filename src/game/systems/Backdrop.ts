import * as Phaser from 'phaser';
import { RealmEnvironment, AmbientKind } from '../types/game';
import { REALMS } from '../data/realms';
import { SaveManager } from './SaveManager';
import { EventBus, GAME_EVENTS } from './EventBus';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  factorX: number;
  /** Continuous self-scroll, px/sec (drifting haze, flowing lava). */
  driftX?: number;
}

/** Per-kind ambient particle tuning. One table instead of a method each. */
const AMBIENT: Record<
  AmbientKind,
  {
    texture: string;
    fromBottom: boolean;
    speedY: [number, number];
    speedX: [number, number];
    scale: [number, number];
    alpha: number;
    lifespan: [number, number];
    frequency: number;
    additive: boolean;
  }
> = {
  embers: {
    texture: 'particle_ember', fromBottom: true,
    speedY: [-140, -46], speedX: [-46, 46], scale: [0.9, 0],
    alpha: 0.9, lifespan: [2600, 5200], frequency: 90, additive: true,
  },
  ash: {
    texture: 'particle_smoke', fromBottom: false,
    speedY: [30, 90], speedX: [-40, 10], scale: [0.5, 0.1],
    alpha: 0.4, lifespan: [4000, 7000], frequency: 120, additive: false,
  },
  motes: {
    texture: 'particle_shard', fromBottom: false,
    speedY: [-26, 26], speedX: [-26, 26], scale: [0.5, 0],
    alpha: 0.55, lifespan: [3200, 5200], frequency: 150, additive: true,
  },
  snow: {
    texture: 'particle_white', fromBottom: false,
    speedY: [40, 110], speedX: [-50, 20], scale: [0.5, 0.2],
    alpha: 0.65, lifespan: [5000, 8000], frequency: 70, additive: false,
  },
  spores: {
    texture: 'particle_blue', fromBottom: true,
    speedY: [-50, -14], speedX: [-24, 24], scale: [0.45, 0],
    alpha: 0.7, lifespan: [4200, 7200], frequency: 130, additive: true,
  },
  rain: {
    texture: 'particle_white', fromBottom: false,
    speedY: [520, 780], speedX: [-140, -70], scale: [0.3, 0.3],
    alpha: 0.26, lifespan: [1500, 1800], frequency: 24, additive: false,
  },
};

/**
 * Multi-plane parallax backdrop, driven entirely by a `RealmEnvironment`.
 *
 * Layers are screen-space tile sprites whose `tilePositionX` is derived from
 * camera scroll, which keeps them seamless across an arena far wider than the
 * viewport at a handful of draw calls rather than thousands of Graphics
 * commands per frame.
 *
 * Previously this class branched per level with hard-coded texture keys and
 * colours; all six realms now run the same code path and differ only by config.
 */
export class Backdrop {
  private scene: Phaser.Scene;
  private layers: Layer[] = [];
  private owned: Phaser.GameObjects.GameObject[] = [];
  private env: RealmEnvironment;
  private stormTimer?: Phaser.Time.TimerEvent;

  /** Null when this realm has no internal sub-stage progression. */
  private sky?: Phaser.GameObjects.Image;
  private viewW = 0;
  private viewH = 0;
  private stages?: Array<{ fromX: number; key: string; label: string }>;
  private activeStageIndex = -1;
  private crossfading = false;

  constructor(scene: Phaser.Scene, level: number, viewW: number, viewH: number) {
    this.scene = scene;
    this.env = REALMS[level] ?? REALMS[1];
    const env = this.env;
    this.viewW = viewW;
    this.viewH = viewH;

    const reduced = SaveManager.getSettings().reducedMotion;

    // --- Painted key art if present, else the procedural sky --------------
    const hasArt = scene.textures.exists(env.backdrop);
    const skyKey = hasArt ? env.backdrop : `sky_${env.id}`;
    if (scene.textures.exists(skyKey)) {
      const sky = scene.add
        .image(0, 0, skyKey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-100);
      sky.setDisplaySize(viewW, viewH);
      this.owned.push(sky);
      this.sky = sky;
    }

    // --- Internal sub-stage progression (Realm 1 today) --------------------
    // Keep only the stages whose texture actually loaded, so one missing or
    // renamed asset degrades to fewer visible stages instead of silently
    // disabling the whole feature (an `every()` check previously meant a
    // single 404 reverted the entire realm to one static backdrop).
    const loadedStages = env.stageBackdrops?.filter((s) => scene.textures.exists(s.key));
    if (loadedStages && loadedStages.length > 0) {
      this.stages = [...loadedStages].sort((a, b) => a.fromX - b.fromX);
      this.activeStageIndex = 0;
      EventBus.emit(GAME_EVENTS.STAGE_ANNOUNCED, this.stages[0].label);
    }

    const push = (key: string, y: number, h: number, factorX: number, depth: number, alpha: number, driftX?: number) => {
      if (!scene.textures.exists(key)) return;
      const t = scene.add
        .tileSprite(0, y, viewW, h, key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        // Painted art already carries most of the depth cue, so the generated
        // bands sit back when it is present and lead when it is not.
        .setAlpha(hasArt ? alpha * 0.55 : alpha);
      this.layers.push({ sprite: t, factorX, driftX: reduced ? 0 : driftX });
      this.owned.push(t);
    };

    // Sky realms get a drifting cloud band; the rest read better without it.
    if (env.skylineStyle === 'spires' || env.skylineStyle === 'crystals') {
      push('cloud_band', 30, 260, 0.04, -92, 0.5, 5);
    }

    // When painted art is present, omit the heavy near/mid procedural bands
    // that drew nonfunctional zigzag spike silhouettes over the environment.
    if (hasArt) {
      push(`far_${env.id}`, viewH - 500, 420, 0.1, -90, 0.25);
    } else {
      push(`far_${env.id}`, viewH - 500, 420, 0.14, -90, 0.7);
      push(`mid_${env.id}`, viewH - 500, 480, 0.3, -80, 0.8);
      push(`near_${env.id}`, viewH - 300, 320, 0.58, -70, 0.9);
    }

    if (!reduced) this.ambient(viewW, viewH);
    if (env.storm) this.storm(viewW, viewH);
  }

  // -------------------------------------------------------------------------

  /** One particle emitter, configured from the realm's ambient kind. */
  private ambient(viewW: number, viewH: number) {
    const spec = AMBIENT[this.env.ambient];
    // Fall back gracefully if the texture factory did not produce this key.
    const texture = this.scene.textures.exists(spec.texture) ? spec.texture : 'particle_white';
    if (!this.scene.textures.exists(texture)) return;

    const emitter = this.scene.add.particles(0, 0, texture, {
      x: { min: 0, max: viewW },
      y: spec.fromBottom ? viewH + 10 : { min: -20, max: viewH * 0.4 },
      speedY: { min: spec.speedY[0], max: spec.speedY[1] },
      speedX: { min: spec.speedX[0], max: spec.speedX[1] },
      scale: { start: spec.scale[0], end: spec.scale[1] },
      alpha: { start: spec.alpha, end: 0 },
      lifespan: { min: spec.lifespan[0], max: spec.lifespan[1] },
      frequency: spec.frequency,
      quantity: 1,
      tint: this.env.ambientTint,
      ...(spec.additive ? { blendMode: Phaser.BlendModes.ADD } : {}),
    });
    emitter.setScrollFactor(0).setDepth(-60);
    this.owned.push(emitter);
  }

  /** Occasional distant flash that briefly rim-lights the whole arena. */
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
        .setTint(this.env.stormTint)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.5));

      const glow = this.scene.add
        .rectangle(0, 0, viewW, viewH, this.env.stormTint, 0.06)
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

    this.updateStage(scrollX);
  }

  /** Crossfade the painted backdrop as the camera crosses a stage boundary. */
  private updateStage(scrollX: number) {
    if (!this.stages || !this.sky || this.crossfading) return;

    const centreX = scrollX + this.viewW / 2;
    let targetIndex = 0;
    for (let i = 0; i < this.stages.length; i++) {
      if (centreX >= this.stages[i].fromX) targetIndex = i;
    }

    if (targetIndex === this.activeStageIndex) return;
    this.activeStageIndex = targetIndex;
    const nextKey = this.stages[targetIndex].key;
    EventBus.emit(GAME_EVENTS.STAGE_ANNOUNCED, this.stages[targetIndex].label);
    const sky = this.sky;
    if (!sky || !sky.active) return;

    this.crossfading = true;
    const overlay = this.scene.add
      .image(0, 0, nextKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-99)
      .setAlpha(0);
    overlay.setDisplaySize(this.viewW, this.viewH);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (sky.active) {
          sky.setTexture(nextKey);
        }
        overlay.destroy();
        this.crossfading = false;
      },
    });
  }

  public destroy() {
    if (this.stormTimer) this.stormTimer.remove(false);
    if (this.sky) this.scene.tweens.killTweensOf(this.sky);
    this.owned.forEach((o) => {
      if (o && (o as { active?: boolean }).active !== false) o.destroy();
    });
    this.owned = [];
    this.layers = [];
  }
}

export { AMBIENT_TINT } from '../data/realms';
