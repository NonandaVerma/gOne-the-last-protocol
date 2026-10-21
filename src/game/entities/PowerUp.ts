import * as Phaser from 'phaser';
import { RelicType, RelicConfig, ActiveRelicState } from '../types/game';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { AudioManager } from '../systems/AudioManager';
import { Juice } from '../systems/Juice';
import { GOne } from './GOne';
import { RELIC_DEFINITIONS } from '../data/relics';

/**
 * Relic presentation data lives in `../data/relics` (Phaser-free) so React
 * UI can import it during SSR. Re-exported here for existing call sites.
 */
export { RELIC_DEFINITIONS };

/**
 * Floating Relic Pickup Sprite in the arena.
 */
export class PowerUpPickup extends Phaser.Physics.Arcade.Sprite {
  public relicType: RelicType;
  private halo?: Phaser.GameObjects.Image;
  private bobTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, relicType: RelicType) {
    const key = RELIC_DEFINITIONS[relicType]?.icon || 'relic_aegis_olympus';
    super(scene, x, y, key);
    this.relicType = relicType;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body for crisp pickup overlap

    this.setDepth(18);
    this.setScale(0.85);

    // Rotating celestial halo ring
    if (scene.textures.exists('telegraph_ring')) {
      this.halo = scene.add.image(x, y, 'telegraph_ring');
      this.halo.setDepth(17);
      this.halo.setScale(0.5);
      this.halo.setTint(RELIC_DEFINITIONS[relicType]?.color || 0x38bdf8);
      this.halo.setAlpha(0.65);
      scene.tweens.add({
        targets: this.halo,
        rotation: Math.PI * 2,
        duration: 4000,
        repeat: -1,
      });
    }

    // Gentle floating bob
    this.bobTween = scene.tweens.add({
      targets: [this, this.halo].filter(Boolean),
      y: y - 10,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect() {
    this.bobTween?.stop();
    this.halo?.destroy();
    this.destroy();
  }

  public destroy(fromScene?: boolean) {
    this.bobTween?.stop();
    this.halo?.destroy();
    super.destroy(fromScene);
  }
}

/**
 * Manages Relic power-up spawning, active timers, modifiers, and HUD updates.
 */
export class PowerUpManager {
  private scene: Phaser.Scene;
  private player?: GOne;
  private juice: Juice;
  private level: number;

  private group: Phaser.Physics.Arcade.StaticGroup;
  private activeRelics: Map<RelicType, { expiresAt: number; maxDuration: number; charges?: number }> = new Map();
  private barrierSprite?: Phaser.GameObjects.Sprite;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private updateTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, juice: Juice, level: number) {
    this.scene = scene;
    this.juice = juice;
    this.level = level;
    this.group = scene.physics.add.staticGroup();

    // Barrier sprite attached to G-One when Aegis of Olympus is active
    if (scene.textures.exists('relic_shield_barrier')) {
      this.barrierSprite = scene.add.sprite(0, 0, 'relic_shield_barrier');
      this.barrierSprite.setDepth(26);
      this.barrierSprite.setBlendMode(Phaser.BlendModes.ADD);
      this.barrierSprite.setVisible(false);
      this.barrierSprite.setScale(0.7);
      scene.tweens.add({
        targets: this.barrierSprite,
        rotation: Math.PI * 2,
        duration: 3000,
        repeat: -1,
      });
    }

    // Sync HUD active relic state every 200ms
    this.updateTimer = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => this.tick(),
    });
  }

  public setPlayer(player: GOne) {
    this.player = player;
  }

  public getGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.group;
  }

  /**
   * Spawn a specific or random relic at (x, y).
   */
  public spawnRelic(x: number, y: number, forcedType?: RelicType): PowerUpPickup {
    const types: RelicType[] = [
      'aegis_olympus',
      'thunderheart',
      'phoenix_core',
      'hermes_step',
      'overdrive_shard',
      'rune_of_ruin',
    ];
    // In Level 3 (1-hit battle), favor Thunderheart, Aegis, Hermes and Overdrive
    const pool = this.level === 3 
      ? ['aegis_olympus', 'thunderheart', 'hermes_step', 'overdrive_shard', 'rune_of_ruin'] as RelicType[]
      : types;

    const relicType = forcedType || Phaser.Utils.Array.GetRandom(pool);
    const pickup = new PowerUpPickup(this.scene, x, y, relicType);
    this.group.add(pickup);
    return pickup;
  }

  /**
   * Start recurring relic spawns across arena platforms.
   *
   * @param intervalSeconds per-realm cadence from `LevelConfig.difficulty`.
   *        Harder realms space relics further apart; the final realm tightens
   *        again so a long fight still offers recovery.
   */
  public startArenaSpawning(
    platformCoords: Array<{ x: number; y: number }>,
    intervalSeconds = 18
  ) {
    if (platformCoords.length === 0) return;

    // Initial spawn on one of the platforms
    const firstPlat = Phaser.Utils.Array.GetRandom(platformCoords);
    this.spawnRelic(firstPlat.x, firstPlat.y - 45);

    // Recurring spawn if fewer than 2 are active on screen
    this.spawnTimer = this.scene.time.addEvent({
      delay: Math.max(4000, intervalSeconds * 1000),
      loop: true,
      callback: () => {
        if (this.group.getLength() < 2) {
          const plat = Phaser.Utils.Array.GetRandom(platformCoords);
          this.spawnRelic(plat.x, plat.y - 45);
        }
      },
    });
  }

  /**
   * Handle player collecting a relic.
   */
  public collect(pickup: PowerUpPickup) {
    const relicType = pickup.relicType;
    const def = RELIC_DEFINITIONS[relicType];
    if (!def) return;

    AudioManager.getInstance().playRelicCollect();
    this.juice.impact(pickup.x, pickup.y, 'player', { scale: 1.6, sparks: 24, ring: true });
    this.juice.floatText(pickup.x, pickup.y - 20, `${def.name.toUpperCase()}!`, def.color, 18);

    pickup.collect();

    // Apply immediate effect
    this.applyRelicEffect(relicType, def);
    this.emitActiveRelics();
  }

  private applyRelicEffect(relicType: RelicType, def: RelicConfig) {
    const now = this.scene.time.now;

    switch (relicType) {
      case 'aegis_olympus': {
        this.activeRelics.set('aegis_olympus', {
          expiresAt: now + (def.duration || 12000),
          maxDuration: def.duration || 12000,
          charges: 2, // Absorbs up to 2 hits
        });
        if (this.barrierSprite) {
          this.barrierSprite.setVisible(true);
          this.barrierSprite.setAlpha(0.9);
        }
        break;
      }

      case 'thunderheart': {
        this.activeRelics.set('thunderheart', {
          expiresAt: now + (def.duration || 10000),
          maxDuration: def.duration || 10000,
        });
        break;
      }

      case 'phoenix_core': {
        if (this.player && this.player.active && !this.player.isDead) {
          // Restore 1 HP, capped at level's max health (won't break level 3's 1-hit rule!)
          if (this.player.currentHealth < this.player.maxHealth) {
            this.player.currentHealth = Math.min(this.player.maxHealth, this.player.currentHealth + 1);
            EventBus.emit(GAME_EVENTS.PLAYER_HEALTH_CHANGED, {
              current: this.player.currentHealth,
              max: this.player.maxHealth,
            });
            this.juice.floatText(this.player.x, this.player.y - 60, '+1 HEALTH RESTORED', 0xfacc15, 17);
          } else {
            this.juice.floatText(this.player.x, this.player.y - 60, 'HEALTH AT MAXIMUM', 0xfacc15, 16);
          }
        }
        break;
      }

      case 'hermes_step': {
        this.activeRelics.set('hermes_step', {
          expiresAt: now + (def.duration || 12000),
          maxDuration: def.duration || 12000,
        });
        break;
      }

      case 'overdrive_shard': {
        if (this.player && this.player.active && !this.player.isDead) {
          this.player.addOverdriveCharge(50);
          this.juice.floatText(this.player.x, this.player.y - 60, '+50% OVERDRIVE CHARGE', 0xa855f7, 17);
        }
        break;
      }

      case 'rune_of_ruin': {
        this.activeRelics.set('rune_of_ruin', {
          expiresAt: now + (def.duration || 14000),
          maxDuration: def.duration || 14000,
        });
        this.juice.floatText(this.player?.x || 0, (this.player?.y || 0) - 80, 'BERSERKER: +100% DMG / +1 DMG TAKEN', 0xdc2626, 15);
        break;
      }
    }

    EventBus.emit(GAME_EVENTS.RELIC_COLLECTED, {
      relic: relicType,
      name: def.name,
      tagline: def.tagline,
      description: def.description,
      color: def.color,
    });
  }

  // --- Combat Modifiers queried by GOne & ArenaScene ---

  public isThunderheartActive(): boolean {
    const r = this.activeRelics.get('thunderheart');
    return !!r && r.expiresAt > this.scene.time.now;
  }

  public isHermesActive(): boolean {
    const r = this.activeRelics.get('hermes_step');
    return !!r && r.expiresAt > this.scene.time.now;
  }

  public isRuneOfRuinActive(): boolean {
    const r = this.activeRelics.get('rune_of_ruin');
    return !!r && r.expiresAt > this.scene.time.now;
  }

  public isAegisOlympusActive(): boolean {
    const r = this.activeRelics.get('aegis_olympus');
    return !!r && r.expiresAt > this.scene.time.now && (r.charges ?? 0) > 0;
  }

  /**
   * Modify damage dealt by G-One's attacks.
   */
  public modifyOutgoingDamage(baseDamage: number): number {
    let dmg = baseDamage;
    if (this.isThunderheartActive()) {
      dmg *= 2; // Zeus lightning double strike
    }
    if (this.isRuneOfRuinActive()) {
      dmg *= 2; // Berserker oath
    }
    return dmg;
  }

  /**
   * Check if incoming damage is absorbed by Aegis of Olympus, or increased by Rune of Ruin.
   */
  public modifyIncomingDamage(baseDamage: number): { damage: number; absorbed: boolean } {
    const aegis = this.activeRelics.get('aegis_olympus');
    if (aegis && aegis.expiresAt > this.scene.time.now && (aegis.charges ?? 0) > 0) {
      aegis.charges = (aegis.charges ?? 1) - 1;
      AudioManager.getInstance().playShieldDeflect();
      this.juice.hitStop(60);
      this.juice.shake(0.01, 200);
      this.juice.floatText(this.player?.x || 0, (this.player?.y || 0) - 60, `OLYMPUS DEFLECTION! (${aegis.charges} LEFT)`, 0xf59e0b, 17);

      if (aegis.charges <= 0) {
        this.activeRelics.delete('aegis_olympus');
        if (this.barrierSprite) this.barrierSprite.setVisible(false);
      }
      this.emitActiveRelics();
      return { damage: 0, absorbed: true };
    }

    let finalDamage = baseDamage;
    if (this.isRuneOfRuinActive()) {
      finalDamage += 1; // Risk: +1 extra damage taken
    }
    return { damage: finalDamage, absorbed: false };
  }

  public getSpeedMultiplier(): number {
    return this.isHermesActive() ? 1.4 : 1.0;
  }

  public getDashCooldownMultiplier(): number {
    return this.isHermesActive() ? 0.5 : 1.0;
  }

  public update(time: number, delta: number) {
    if (this.barrierSprite && this.player && this.player.active) {
      this.barrierSprite.setPosition(this.player.x, this.player.y - 10);
    }
  }

  private tick() {
    const now = this.scene.time.now;
    let changed = false;

    this.activeRelics.forEach((data, type) => {
      if (data.expiresAt <= now) {
        this.activeRelics.delete(type);
        changed = true;
        if (type === 'aegis_olympus' && this.barrierSprite) {
          this.barrierSprite.setVisible(false);
        }
      }
    });

    if (changed || this.activeRelics.size > 0) {
      this.emitActiveRelics();
    }
  }

  private emitActiveRelics() {
    const now = this.scene.time.now;
    const list: ActiveRelicState[] = [];

    this.activeRelics.forEach((data, type) => {
      const def = RELIC_DEFINITIONS[type];
      const remaining = Math.max(0, data.expiresAt - now);
      list.push({
        id: type,
        name: def.name,
        remainingMs: remaining,
        maxMs: data.maxDuration,
        charges: data.charges,
      });
    });

    EventBus.emit(GAME_EVENTS.ACTIVE_RELICS_CHANGED, list);
  }

  public clearAll() {
    try {
      this.spawnTimer?.destroy();
      this.updateTimer?.destroy();
      this.activeRelics.clear();
      this.barrierSprite?.destroy();
      if (this.group) {
        const children = (this.group as any).children;
        if (children && typeof children.forEach === 'function') {
          this.group.clear(true, true);
        }
      }
    } catch (_) {}
    try {
      this.emitActiveRelics();
    } catch (_) {}
  }
}
