import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { RaOne } from '../entities/RaOne';
import { Projectile, createProjectilePool } from '../entities/Projectile';
import { HazardManager } from '../entities/Hazard';
import { StaticHazardField } from '../entities/StaticHazard';
import { DynamicPlatformManager } from '../entities/DynamicPlatform';
import { Enemy, EnemyManager } from '../entities/Enemy';
import { LEVELS, VIEW_W, VIEW_H } from '../data/levels';
import { REALM_TRANSITIONS, getRealmReveal } from '../data/story';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { Juice } from '../systems/Juice';
import { Backdrop } from '../systems/Backdrop';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { HERO, VILLAIN } from '../art/palette';
import { ArenaGeometry, LevelConfig, REALM_COUNT } from '../types/game';
import { PowerUpManager, PowerUpPickup } from '../entities/PowerUp';
import { Level2Architecture } from '../systems/Level2Architecture';
import { Level3Architecture } from '../systems/Level3Architecture';
import { Level4Architecture } from '../systems/Level4Architecture';
import { RootlineManager } from '../systems/RootlineManager';
import { GravitasManager } from '../systems/GravitasManager';
import { LevelState } from '../systems/LevelState';

/**
 * A realm: a traversal approach followed by a boss arena.
 *
 * The player starts at the far left and crosses the approach — platforms,
 * gaps, placed hazards and relics — until they pass `arenaStartX`. That
 * threshold wakes Ra-One, seals the arena and sets the checkpoint, so dying
 * in the fight retries the fight rather than the whole approach.
 *
 * Gameplay logic lives on the entities (`GOne`, `RaOne`, the hazard and
 * platform managers); this scene stays a wiring layer.
 */
export class ArenaScene extends Phaser.Scene {
  public currentLevel = 1;

  private player?: GOne;
  private boss?: RaOne;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private dynamicPlatforms?: DynamicPlatformManager;
  private playerProjectiles?: Phaser.Physics.Arcade.Group;
  private bossProjectiles?: Phaser.Physics.Arcade.Group;
  private hazards?: HazardManager;
  private staticHazards?: StaticHazardField;
  private enemies?: EnemyManager;
  private powerUps?: PowerUpManager;
  private crosshair?: Phaser.GameObjects.Image;
  private lockOn?: Phaser.GameObjects.Image;
  private backdrop?: Backdrop;
  private juice?: Juice;
  private rootlineManager?: RootlineManager;
  private gravitasManager?: GravitasManager;

  private isPaused = false;
  private isLevelEnding = false;
  private groundTop = 648;
  private worldWidth = 2240;

  /* ---- Hybrid traversal state ---- */
  private arenaStartX = 0;
  /** True once the player has crossed the threshold and the fight is live. */
  private arenaEntered = false;
  /** Set when the player starts at (or reaches) the arena; drives retry. */
  private startedAtCheckpoint = false;
  /** Last ground position known to be safe, for pit respawns. */
  private lastSafeX = 0;
  private lastSafeY = 0;
  private gaps: Array<[number, number]> = [];
  private gateVisual?: Phaser.GameObjects.Rectangle;
  private atmosphereGrade?: Phaser.GameObjects.Rectangle;
  /** Guards the Realm 6 finale escalation so it fires exactly once. */
  private finaleEscalated = false;

  /* ---- Stage tracking for Level 1 ---- */
  private currentStageIndex = 1;
  private stageCheckpoints = [180, 1400, 2680, 3960, 5260];
  private announcedStages = new Set<number>();
  private altarSprite?: Phaser.GameObjects.Sprite;
  private fragmentSprite?: Phaser.GameObjects.Sprite;
  private fragmentAbsorbed = false;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyJ?: Phaser.Input.Keyboard.Key;
  private keyK?: Phaser.Input.Keyboard.Key;
  private keyL?: Phaser.Input.Keyboard.Key;
  private keyE?: Phaser.Input.Keyboard.Key;
  private keyShift?: Phaser.Input.Keyboard.Key;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  private pointerWorld = { x: 0, y: 0 };
  private contextMenuHandler?: (e: Event) => void;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  init(data: { level?: number; fromCheckpoint?: boolean }) {
    this.currentLevel = data?.level || 1;
    this.isPaused = false;
    this.isLevelEnding = false;
    this.arenaEntered = false;
    this.finaleEscalated = false;
    this.startedAtCheckpoint = Boolean(data?.fromCheckpoint);
    this.currentStageIndex = 1;
    this.stageCheckpoints = this.currentLevel === 3
      ? [180, 1500, 2900, 4300, 5700, 7100]
      : this.currentLevel === 2
      ? [190, 1440, 2840, 4240, 5640, 7040]
      : [180, 1400, 2680, 3960, 5260];
    this.announcedStages.clear();
    this.fragmentAbsorbed = false;

    const config: LevelConfig = LEVELS[this.currentLevel] || LEVELS[1];
    LevelState.set({
      level: this.currentLevel,
      name: config.name,
      subtitle: config.subtitle,
      objective: config.objective,
    });
    SaveManager.saveUnlockedLevel(this.currentLevel);
    SaveManager.setLastLevel(this.currentLevel);
  }

  create() {
    const config: LevelConfig = LEVELS[this.currentLevel] || LEVELS[1];
    const arena = config.arena;
    this.groundTop = arena.groundTop;
    this.worldWidth = arena.worldWidth;
    this.gaps = arena.gaps ?? [];
    this.arenaStartX = arena.arenaStartX ?? 0;

    this.physics.world.gravity.y = config.gravity;
    this.physics.world.setBounds(0, 0, this.worldWidth, VIEW_H);
    this.cameras.main.setBounds(0, 0, this.worldWidth, VIEW_H);
    this.cameras.main.setZoom(1);

    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'PLAYING');
    EventBus.emit(GAME_EVENTS.LEVEL_LOADED, {
      level: this.currentLevel,
      name: config.name,
      subtitle: config.subtitle,
    });

    AudioManager.getInstance().playMusic(this.currentLevel >= 5 ? 'boss3' : 'battle');

    this.juice = new Juice(this, 40);
    this.backdrop = new Backdrop(this, this.currentLevel, VIEW_W, VIEW_H);
    this.createAtmosphereGrade(config);

    this.playerProjectiles = createProjectilePool(this, 48);
    this.bossProjectiles = createProjectilePool(this, 80);
    this.hazards = new HazardManager(this, this.juice, this.groundTop);

    this.dynamicPlatforms = new DynamicPlatformManager(
      this,
      this.juice,
      `platform_l${this.currentLevel}`,
      arena.platforms.filter((p) => p.behaviour && p.behaviour !== 'static')
    );

    this.createGround(arena);
    this.createStaticPlatforms(arena);

    // Retrying after a death in the fight resumes at the arena mouth.
    let spawnX = this.startedAtCheckpoint && this.arenaStartX
      ? this.arenaStartX - 120
      : arena.playerSpawnX;

    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        const urlSpawn = p.get('spawnX');
        if (urlSpawn) spawnX = parseInt(urlSpawn, 10);
        const urlStage = p.get('stage');
        if (urlStage) {
          const stNum = parseInt(urlStage, 10);
          if (this.currentLevel === 4) {
            const stageStarts = [180, 1560, 2980, 4370, 5770, 7200];
            if (stNum >= 1 && stNum <= 6) {
              spawnX = stageStarts[stNum - 1];
            }
          } else if (this.currentLevel === 3) {
            const stageStarts = [180, 1600, 3000, 4400, 5800, 7200];
            if (stNum >= 1 && stNum <= 6) {
              spawnX = stageStarts[stNum - 1];
            }
          } else if (this.currentLevel === 2) {
            const stageStarts = [190, 1600, 3200, 4400, 5800, 7200];
            if (stNum >= 1 && stNum <= 6) {
              spawnX = stageStarts[stNum - 1];
            }
          } else if (this.currentLevel === 1) {
            const stageStarts = [180, 1500, 2800, 4100, 5400];
            if (stNum >= 1 && stNum <= 5) {
              spawnX = stageStarts[stNum - 1];
            }
          }
        }
      } catch (_) {}
    }

    this.player = new GOne(
      this,
      spawnX,
      this.groundTop - 120,
      this.playerProjectiles,
      this.juice,
      config.playerHealth
    );
    this.lastSafeX = spawnX;
    this.lastSafeY = this.groundTop - 120;

    if (this.currentLevel === 3) {
      this.rootlineManager = new RootlineManager(this, this.player, this.juice);
      Level3Architecture.buildAnchors(this.rootlineManager);
    } else if (this.currentLevel === 4) {
      this.gravitasManager = new GravitasManager(this, this.player, this.juice);
      Level4Architecture.buildAnchors(this.gravitasManager);
    }

    this.staticHazards = new StaticHazardField(
      this,
      this.juice,
      this.hazards.getGroup(),
      arena.staticHazards ?? [],
      config.difficulty.hazardWarnScale
    );

    // Grunts fire through the boss's own projectile pool — it is already
    // overlapped against the player, so no third pool or collider is needed.
    this.enemies = new EnemyManager(this, this.juice, this.bossProjectiles, arena.enemies ?? []);
    this.enemies.setTarget(this.player);

    this.powerUps = new PowerUpManager(this, this.juice, this.currentLevel);
    this.player.setPowerUpManager(this.powerUps);
    this.powerUps.setPlayer(this.player);
    this.placePickups(arena, config.difficulty.relicSpawnSeconds);

    /* Ra-One is built WITHOUT a target, so his update() early-returns and he
       stands inert until the player crosses the threshold. Difficulty scales
       his pacing here rather than inside the AI. */
    const tempo = config.difficulty.bossTempoScale;
    this.boss = new RaOne({
      scene: this,
      x: arena.bossSpawnX,
      y: this.groundTop - 140,
      pool: this.bossProjectiles,
      juice: this.juice,
      level: this.currentLevel,
      health: config.bossHealth,
      mechanics: {
        ...config.bossMechanics,
        attackIntervalMin: Math.round(config.bossMechanics.attackIntervalMin * tempo),
        attackIntervalMax: Math.round(config.bossMechanics.attackIntervalMax * tempo),
      },
      hazards: this.hazards,
      groundTop: this.groundTop,
    });

    this.createArenaGate();

    this.crosshair = this.add.image(VIEW_W / 2, VIEW_H / 2, 'crosshair_aim');
    this.crosshair.setDepth(45).setScrollFactor(0).setAlpha(0.9).setScale(0.9);

    this.lockOn = this.add.image(0, 0, 'lock_bracket');
    this.lockOn.setDepth(29).setAlpha(0.8).setScale(0.75).setVisible(false);

    this.setupCamera();
    this.setupColliders();
    this.setupInput();
    this.setupEventListeners();
    this.createStage5Sanctuary();

    this.pointerWorld = { x: spawnX + 300, y: this.groundTop - 100 };
    this.player.setAimTarget(this.pointerWorld.x, this.pointerWorld.y);

    // Starting at the checkpoint or inside the arena means the fight is already joined.
    if (this.startedAtCheckpoint || !this.arenaStartX || spawnX >= this.arenaStartX) {
      this.enterArena(config, true);
    } else {
      this.announceObjective(config.objective);
      if (this.currentLevel === 1 || this.currentLevel === 2 || this.currentLevel === 3 || this.currentLevel === 4) {
        this.time.delayedCall(400, () => {
          this.checkStageProgression(spawnX);
        });
      }
    }

    this.syncHud();
  }

  // ===========================================================================
  // Geometry
  // ===========================================================================

  /** True if `x` falls inside a pit. */
  private isGap(x: number) {
    return this.gaps.some(([a, b]) => x >= a && x <= b);
  }

  private createGround(arena: ArenaGeometry) {
    const defaultKey = `platform_l${this.currentLevel}`;
    this.platforms = this.physics.add.staticGroup();

    if (this.currentLevel === 2) {
      Level2Architecture.build(this, this.platforms, this.dynamicPlatforms!, arena);
      return;
    }
    if (this.currentLevel === 3) {
      Level3Architecture.build(this, this.platforms, this.dynamicPlatforms!, arena);
      return;
    }
    if (this.currentLevel === 4) {
      Level4Architecture.build(this, this.platforms, this.dynamicPlatforms!, arena);
      return;
    }

    const tile = this.textures.get(defaultKey).getSourceImage();
    const tileW = (tile as { width?: number }).width || 256;
    const tileH = (tile as { height?: number }).height || 80;
    const groundThickness = 140;
    const scaleY = groundThickness / tileH;

    const count = Math.ceil(arena.worldWidth / tileW) + 1;
    for (let i = 0; i < count; i++) {
      const cx = i * tileW + tileW / 2;
      // Omit segments that fall inside a pit. Tested at both edges so a tile
      // is only dropped when it is genuinely inside the gap.
      if (this.isGap(cx - tileW / 2) || this.isGap(cx + tileW / 2)) continue;
      const seg = this.platforms.create(cx, arena.groundTop + groundThickness / 2, defaultKey);
      seg.setScale(1.02, scaleY).refreshBody();
    }

    if (arena.hasLava && this.textures.exists('lava_surface')) {
      const lava = this.add.tileSprite(
        0,
        arena.groundTop + groundThickness - 6,
        arena.worldWidth,
        64,
        'lava_surface'
      );
      lava.setOrigin(0, 0).setDepth(7);
      this.tweens.add({ targets: lava, tilePositionX: 512, duration: 4200, repeat: -1 });
    }
  }

  /** Only plain surfaces here; dynamic ones are owned by DynamicPlatformManager. */
  private createStaticPlatforms(arena: ArenaGeometry) {
    if (!this.platforms || this.currentLevel === 2 || this.currentLevel === 3 || this.currentLevel === 4) return;
    const defaultKey = `platform_l${this.currentLevel}`;
    const tile = this.textures.get(defaultKey).getSourceImage();
    const defaultTileW = (tile as { width?: number }).width || 256;
    const defaultTileH = (tile as { height?: number }).height || 80;

    arena.platforms
      .filter((p) => !p.behaviour || p.behaviour === 'static')
      .forEach((p) => {
        const key = p.textureKey && this.textures.exists(p.textureKey)
          ? p.textureKey
          : defaultKey;
        const curTile = this.textures.get(key).getSourceImage();
        const curTileW = (curTile as { width?: number }).width || defaultTileW;
        const curTileH = (curTile as { height?: number }).height || defaultTileH;

        const scaleX = p.width / curTileW;
        const plat = this.platforms!.create(p.x, p.y + curTileH * 0.3, key);
        plat.setScale(scaleX, 0.65).refreshBody();
        this.addContactShadow(p.x, p.y + curTileH * 0.65, p.width);
      });
  }

  /**
   * A soft dark ellipse beneath an elevated platform so it reads as resting
   * in the scene's own light rather than floating flat against the painted
   * backdrop. Purely decorative — drawn once, never touches collision.
   */
  private addContactShadow(x: number, y: number, width: number) {
    if (!this.textures.exists('contact_shadow')) return;
    const shadow = this.add.image(x, y, 'contact_shadow');
    shadow.setDepth(6).setAlpha(0.55);
    shadow.setDisplaySize(width * 0.82, 22);
  }

  private placePickups(arena: ArenaGeometry, relicSpawnSeconds: number) {
    if (!this.powerUps) return;
    // Hand-placed relics reward exploring the approach...
    (arena.pickups ?? []).forEach((p) => {
      this.powerUps!.spawnRelic(p.x, p.y, p.type);
    });
    // ...while the arena keeps its ambient spawns during the fight, at the
    // cadence this realm's difficulty config asks for.
    this.powerUps.startArenaSpawning(
      arena.platforms.filter((p) => !this.arenaStartX || p.x >= this.arenaStartX),
      relicSpawnSeconds
    );
  }

  /** A visible seam marking where the approach ends and the fight begins. */
  /**
   * A very low-alpha, screen-locked tint matching the realm's own light
   * (its haze colour). Procedurally-drawn characters, platforms and hazards
   * use flat, saturated vector fills; the painted backdrops are colour-graded
   * renders. This wash is the cheap way to put both under the same light
   * instead of looking like two different rendering pipelines stacked on
   * top of each other — screen-space only, additive, deliberately subtle
   * enough to never compete with gameplay readability.
   */
  private createAtmosphereGrade(config: LevelConfig) {
    const grade = this.add
      .rectangle(0, 0, VIEW_W, VIEW_H, config.environment.haze, 0.07)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      // Above the whole gameplay layer (player 22, boss 20, enemies 13,
      // hazards, platforms) so characters are graded too, not just the
      // scenery behind them; below the crosshair (45) and lock-on (29) so
      // those stay fully legible.
      .setDepth(28)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.atmosphereGrade = grade;
  }

  private createArenaGate() {
    if (!this.arenaStartX) return;
    this.gateVisual = this.add
      .rectangle(this.arenaStartX, this.groundTop - 180, 6, 360, HERO.energy, 0.35)
      .setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.gateVisual,
      alpha: { from: 0.2, to: 0.7 },
      scaleX: { from: 1, to: 2.4 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupCamera() {
    if (!this.player) return;
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.08, 0.08, 0, 40);
    cam.centerOn(this.player.x, this.player.y);
    cam.setDeadzone(220, 140);
    cam.fadeIn(260, 0, 0, 0);
  }

  // ===========================================================================
  // Arena threshold
  // ===========================================================================

  /** Wake the boss, close the approach behind the player, set the checkpoint. */
  private enterArena(config: LevelConfig, immediate = false) {
    if (this.arenaEntered) return;
    this.arenaEntered = true;
    this.startedAtCheckpoint = true;

    EventBus.emit('arena-entered', { level: this.currentLevel, immediate });

    if (this.boss && this.player) {
      this.boss.activate(this.player, immediate ? 1500 : 1900);
      this.boss.setTarget(this.player);
    }

    if (this.gateVisual) {
      // The seam flares shut: the approach is no longer the point.
      this.tweens.killTweensOf(this.gateVisual);
      this.tweens.add({
        targets: this.gateVisual,
        scaleX: 14,
        alpha: 0,
        duration: 650,
        onComplete: () => this.gateVisual?.destroy(),
      });
      this.gateVisual = undefined;
    }

    if (!immediate) {
      this.juice?.shake(0.012, 320);
      AudioManager.getInstance().playOverdrive();
    }

    this.time.delayedCall(immediate ? 700 : 500, () => {
      if (this.boss?.active) {
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: config.openingTaunt,
          speaker: this.currentLevel === 4 ? 'THE VOID SOVEREIGN' : this.currentLevel === 3 ? 'THE WORLDSEED GUARDIAN' : this.currentLevel === 2 ? 'THE LAST WARDEN' : 'RA-ONE',
          priority: 2,
        });
      }
    });
  }

  private announceObjective(objective: string) {
    this.time.delayedCall(500, () => {
      if (this.scene.isActive()) {
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: objective,
          speaker: 'SYSTEM',
          priority: 2,
        });
      }
    });
  }

  // ===========================================================================
  // Colliders
  // ===========================================================================

  private setupColliders() {
    if (!this.platforms || !this.player || !this.boss) return;

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);

    // Sealed security doors / locked gates physically block — the shared
    // hazard group below is damage-only overlap, which would let the player
    // walk straight through a "sealed" door with just a damage tick.
    if (this.staticHazards) {
      this.physics.add.collider(this.player, this.staticHazards.getSolidGroup());
    }

    if (this.enemies) {
      // Drones walk the ground and platforms; seekers hover and ignore both.
      this.physics.add.collider(this.enemies.getGroup(), this.platforms);

      if (this.playerProjectiles) {
        this.physics.add.overlap(this.playerProjectiles, this.enemies.getGroup(), (enemyObj, projObj) => {
          const proj = projObj as Projectile;
          const enemy = enemyObj as Enemy;
          if (!proj.active || !enemy.active || proj.owner !== 'player' || this.isLevelEnding) return;
          if (!proj.registerHit(enemy)) return;

          const rawDmg = proj.damage;
          const finalDmg = this.powerUps ? this.powerUps.modifyOutgoingDamage(rawDmg) : rawDmg;
          const killed = enemy.takeDamage(finalDmg) && enemy.health <= 0;
          if (killed && this.player) this.player.addOverdriveCharge(6);
          if (!proj.pierce) proj.kill(true);
        });
      }

      // Contact damage is gated to the drone's active swing window — walking
      // into an idle or recovering drone never costs a unit.
      this.physics.add.overlap(this.enemies.getGroup(), this.player, (playerObj, enemyObj) => {
        const p = playerObj as GOne;
        const enemy = enemyObj as Enemy;
        if (!p.active || !enemy.active || p.isDead || this.isLevelEnding) return;
        if (!enemy.isDealingContactDamage()) return;
        p.takeDamage(enemy.contactDamage, enemy.x);
      });
    }

    // Dynamic platforms carry the player; landing on a collapsing one arms it.
    if (this.dynamicPlatforms) {
      this.physics.add.collider(
        this.player,
        this.dynamicPlatforms.getGroup(),
        (_playerObj, platObj) => {
          const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
          // Only a genuine landing counts — brushing the underside does not.
          if (body?.touching.down) {
            this.dynamicPlatforms?.notifyLanded(platObj as Phaser.GameObjects.GameObject, this.player);
          }
        }
      );
    }

    if (this.playerProjectiles) {
      this.physics.add.overlap(this.playerProjectiles, this.boss, (bossObj, projObj) => {
        const proj = projObj as Projectile;
        const boss = bossObj as RaOne;
        if (!proj.active || !boss.active || proj.owner !== 'player' || this.isLevelEnding) return;
        // A dormant boss cannot be sniped from across the approach.
        if (!this.arenaEntered) return;
        if (!proj.registerHit(boss)) return;

        const rawDmg = proj.damage;
        const finalDmg = this.powerUps ? this.powerUps.modifyOutgoingDamage(rawDmg) : rawDmg;
        const hit = boss.takeDamage(finalDmg);
        if (hit && this.player) {
          this.player.addOverdriveCharge(finalDmg > 1 ? 16 : 6);
        }
        if (!proj.pierce) proj.kill(true);
      });

      // Arc Burst can shred incoming boss shots — a visible reward for aiming well.
      if (this.bossProjectiles) {
        this.physics.add.overlap(this.playerProjectiles, this.bossProjectiles, (a, b) => {
          const pa = a as Projectile;
          const pb = b as Projectile;
          if (pa.owner === 'player' && pa.pierce && pb.active && pb.owner === 'boss' && !pb.unblockable) {
            this.juice?.impact(pb.x, pb.y, 'player', { scale: 0.7, sparks: 8 });
            pb.kill(false);
          }
        });
      }
    }

    if (this.bossProjectiles) {
      this.physics.add.overlap(this.bossProjectiles, this.player, (playerObj, projObj) => {
        const proj = projObj as Projectile;
        const p = playerObj as GOne;
        if (!proj.active || !p.active || proj.owner !== 'boss' || this.isLevelEnding || p.isDead) return;
        if (!proj.registerHit(p)) return;

        p.takeDamage(proj.damage, proj.x, proj.unblockable);
        if (!proj.pierce) proj.kill(true);
      });
    }

    // One overlap covers boss-spawned debris AND placed static hazards, since
    // StaticHazardField registers into the same group.
    if (this.hazards) {
      this.physics.add.overlap(this.hazards.getGroup(), this.player, (playerObj, hazardObj) => {
        const p = playerObj as GOne;
        const hz = hazardObj as Phaser.Physics.Arcade.Sprite;
        if (p.active && hz.active && !this.isLevelEnding && !p.isDead) p.takeDamage(1);
      });
    }

    if (this.powerUps && this.player) {
      this.physics.add.overlap(this.player, this.powerUps.getGroup(), (_playerObj, pickupObj) => {
        const pickup = pickupObj as PowerUpPickup;
        if (pickup.active && !this.isLevelEnding && !this.player?.isDead) {
          this.powerUps?.collect(pickup);
        }
      });
    }
  }

  // ===========================================================================
  // Input
  // ===========================================================================

  private setupInput() {
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
      ]);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this.keyJ.on('down', () => this.player?.firePulseShot());
      this.keyK.on('down', () => this.player?.activateShield());
      this.keyL.on('down', () => this.player?.fireArcBurst());
      this.keyShift.on('down', () => this.player?.performDash());
      this.keyE.on('down', () => {
        if (!this.tryEnvironmentalInteraction()) {
          this.player?.activateOverdrive();
        }
      });
      this.keyEsc.on('down', () => this.togglePause());
      this.keyW.on('down', () => this.player?.pressJump());
      this.keyW.on('up', () => this.player?.releaseJump());
      this.cursors.space.on('down', () => this.player?.pressJump());
      this.cursors.space.on('up', () => this.player?.releaseJump());
      this.cursors.up.on('down', () => this.player?.pressJump());
      this.cursors.up.on('up', () => this.player?.releaseJump());
    }

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointerWorld.x = pointer.worldX;
      this.pointerWorld.y = pointer.worldY;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      AudioManager.getInstance().resume();
      if (pointer.leftButtonDown()) {
        if (this.tryEnvironmentalInteraction({ x: pointer.worldX, y: pointer.worldY })) return;
        this.player?.firePulseShot();
      } else if (pointer.rightButtonDown()) {
        this.player?.activateShield();
      }
    });

    this.contextMenuHandler = (e: Event) => e.preventDefault();
    this.game.canvas?.addEventListener('contextmenu', this.contextMenuHandler);
  }

  // ===========================================================================
  // Events
  // ===========================================================================

  private setupEventListeners() {
    const onShake = (data?: { intensity?: number; duration?: number }) => {
      const settings = SaveManager.getSettings();
      if (!settings.screenShake || settings.reducedMotion) return;
      this.cameras.main.shake(data?.duration || 250, data?.intensity || 0.01);
    };

    const onOverdriveBurst = (data: { x: number; y: number; radius: number; damage: number }) => {
      if (!this.boss || !this.boss.active || this.boss.bossState === 'defeated') return;
      if (!this.arenaEntered) return;
      const dist = Phaser.Math.Distance.Between(data.x, data.y, this.boss.x, this.boss.y);
      if (dist <= data.radius) this.boss.takeDamage(data.damage);
    };

    // Boss Phase Escalation: Reacts dynamically during boss encounters
    const onBossPhaseChanged = (data: { phase: number }) => {
      if (this.currentLevel === 2) {
        EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
          label: 'GUARDIAN PHASE',
          value: `PHASE ${data.phase} (${data.phase >= 3 ? 'OVERLOAD' : 'ENRAGED'})`,
          alert: true,
        });
        this.juice?.zoomPunch(0.04, 240);
        this.juice?.flash(VILLAIN.energy, 0.35, 300);
        this.juice?.shake(0.014, 300);
        AudioManager.getInstance().playOverdrive();
        return;
      }

      if (this.currentLevel === 4) {
        const phaseNames = ['', 'THE GUARDIAN', 'GRAVITY SHIFT', 'EXPOSED CORE'];
        const phaseName = phaseNames[data.phase] ?? 'SINGULARITY COLLAPSE';
        EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
          label: 'VOID SOVEREIGN',
          value: `PHASE ${data.phase} // ${phaseName}`,
          alert: true,
        });
        EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
          text: data.phase === 2
            ? 'THE VOID SOVEREIGN ACTIVATES GRAVITY SHIFT MATRIX. Watch for gravitational anomalies!'
            : 'GRAVITATIONAL CORE EXPOSED. Disrupt the core anchors during the vulnerability window!',
          speaker: 'THE VOID SOVEREIGN',
          duration: 3800,
          priority: 2,
        });
        this.juice?.zoomPunch(0.05, 260);
        this.juice?.flash(0xc084fc, 0.4, 300);
        this.juice?.shake(0.018, 380);
        AudioManager.getInstance().playOverdrive();
        return;
      }
      if (this.currentLevel !== 6 || this.finaleEscalated || data.phase < 3) return;
      this.finaleEscalated = true;
      this.juice?.zoomPunch(0.05, 260);
      this.juice?.flash(VILLAIN.energy, 0.4, 320);
      this.juice?.shake(0.016, 380);
      if (this.atmosphereGrade) {
        this.tweens.add({ targets: this.atmosphereGrade, alpha: 0.16, duration: 500 });
      }
      AudioManager.getInstance().playOverdrive();
    };

    // Level 2 Interactive Terminal Handlers
    const onCitadelUnlocked = () => {
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'SECURITY STATUS',
        value: 'OVERRIDE ACCEPTED - UNLOCKED',
        alert: false,
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'Citadel security lockdown overridden. Inner blast doors open.',
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
    };

    const onReactorStabilized = () => {
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'REACTOR STABILITY',
        value: 'CORE STABILIZED',
        alert: false,
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'Reactor core stabilized. Dimensional flux normalized.',
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
    };

    const onVaultPurged = () => {
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'CONTAINMENT STATUS',
        value: 'SYSTEM PURGED',
        alert: false,
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'Vault purge sequence complete. Containment cycle dampened.',
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
    };

    const onNexusRerouted = () => {
      this.juice?.shake(0.015, 350);
      AudioManager.getInstance().playRelicCollect();
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'NEXUS CONDUIT',
        value: 'POWER REROUTED // BRIDGE ACTIVE',
        alert: false,
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'Nexus power rerouted! Hard-light conduit bridge activated and Sanctum Gate unsealed.',
        speaker: 'SYSTEM',
        duration: 4500,
        priority: 2,
      });
    };

    const onHeartrootHarmonized = () => {
      this.juice?.shake(0.016, 400);
      AudioManager.getInstance().playRelicCollect();
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'HEARTROOT CONDUIT',
        value: 'HARMONIZED // BRIDGE ACTIVE',
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'HEARTROOT CONDUIT HARMONIZED. Living bio-light bridge restored across the sanctuary chasm!',
        speaker: 'SYSTEM',
        duration: 4500,
        priority: 2,
      });
    };

    const onSeedContainmentOvercharged = () => {
      this.juice?.shake(0.018, 450);
      AudioManager.getInstance().playOverdrive();
      EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
        label: 'SEED CONTAINMENT',
        value: 'DISENGAGED // ARBITER AWAITS',
      });
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: 'WORLDS EED CONTAINMENT MATRIX OVERCHARGED. Sanctuary Portal unsealed! Proceed to the Arbiter.',
        speaker: 'SYSTEM',
        duration: 4500,
        priority: 2,
      });
    };

    const onBossDied = () => {
      if (this.isLevelEnding) return;
      this.isLevelEnding = true;
      this.handleBossDefeated();
    };

    const onPlayerDied = () => {
      if (this.isLevelEnding) return;
      this.isLevelEnding = true;
      this.handlePlayerDefeated();
    };

    const onTogglePause = () => {
      if (!this.isPaused) this.togglePause();
    };
    const onResume = () => {
      if (this.isPaused) this.togglePause();
    };
    const onRestartLevel = () => this.restartLevel();
    const onRestartStory = () => this.scene.start('ArenaScene', { level: 1, fromCheckpoint: false });
    const onQuitToMenu = () => this.scene.start('MainMenuScene');

    EventBus.on(GAME_EVENTS.SCREEN_SHAKE, onShake);
    EventBus.on(GAME_EVENTS.OVERDRIVE_BURST, onOverdriveBurst);
    EventBus.on(GAME_EVENTS.BOSS_PHASE_CHANGED, onBossPhaseChanged);
    EventBus.on(GAME_EVENTS.BOSS_DIED, onBossDied);
    EventBus.on(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
    EventBus.on(GAME_EVENTS.PAUSE_GAME, onTogglePause);
    EventBus.on(GAME_EVENTS.RESUME_GAME, onResume);
    EventBus.on(GAME_EVENTS.RESTART_LEVEL, onRestartLevel);
    EventBus.on(GAME_EVENTS.RESTART_STORY, onRestartStory);
    EventBus.on(GAME_EVENTS.QUIT_TO_MENU, onQuitToMenu);

    const onLevelSync = () => this.syncHud();
    EventBus.on('request-level-sync', onLevelSync);

    EventBus.on('citadel-security-unlocked', onCitadelUnlocked);
    EventBus.on('reactor-core-stabilized', onReactorStabilized);
    EventBus.on('vault-purged', onVaultPurged);
    EventBus.on('nexus-rerouted', onNexusRerouted);
    EventBus.on('heartroot-harmonized', onHeartrootHarmonized);
    EventBus.on('seed-containment-overcharged', onSeedContainmentOvercharged);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.SCREEN_SHAKE, onShake);
      EventBus.off(GAME_EVENTS.OVERDRIVE_BURST, onOverdriveBurst);
      EventBus.off(GAME_EVENTS.BOSS_PHASE_CHANGED, onBossPhaseChanged);
      EventBus.off(GAME_EVENTS.BOSS_DIED, onBossDied);
      EventBus.off(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
      EventBus.off(GAME_EVENTS.PAUSE_GAME, onTogglePause);
      EventBus.off(GAME_EVENTS.RESUME_GAME, onResume);
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, onRestartLevel);
      EventBus.off(GAME_EVENTS.RESTART_STORY, onRestartStory);
      EventBus.off(GAME_EVENTS.QUIT_TO_MENU, onQuitToMenu);
      EventBus.off('request-level-sync', onLevelSync);

      EventBus.off('citadel-security-unlocked', onCitadelUnlocked);
      EventBus.off('reactor-core-stabilized', onReactorStabilized);
      EventBus.off('vault-purged', onVaultPurged);
      EventBus.off('nexus-rerouted', onNexusRerouted);
      EventBus.off('heartroot-harmonized', onHeartrootHarmonized);
      EventBus.off('seed-containment-overcharged', onSeedContainmentOvercharged);

      if (this.contextMenuHandler) this.game.canvas?.removeEventListener('contextmenu', this.contextMenuHandler);
      // Teardown order matters: managers own timers and tweens that would
      // otherwise fire against destroyed sprites on the next scene.
      try { this.rootlineManager?.destroy(); } catch (_) {}
      try { this.staticHazards?.destroy(); } catch (_) {}
      try { this.dynamicPlatforms?.destroy(); } catch (_) {}
      try { this.enemies?.destroy(); } catch (_) {}
      try { this.hazards?.clearAll(); } catch (_) {}
      try { this.powerUps?.clearAll(); } catch (_) {}
      try { this.backdrop?.destroy(); } catch (_) {}
      try { this.juice?.clearFreeze(); } catch (_) {}
      try { this.altarSprite?.destroy(); } catch (_) {}
      try { this.fragmentSprite?.destroy(); } catch (_) {}
    });
  }

  private syncHud() {
    const config = LEVELS[this.currentLevel] || LEVELS[1];
    EventBus.emit(GAME_EVENTS.LEVEL_LOADED, {
      level: this.currentLevel,
      name: config.name,
      subtitle: config.subtitle,
    });
    if (!this.player || !this.boss) return;
    EventBus.emit(GAME_EVENTS.PLAYER_HEALTH_CHANGED, {
      current: this.player.currentHealth,
      max: this.player.maxHealth,
    });
    EventBus.emit(GAME_EVENTS.BOSS_HEALTH_CHANGED, {
      current: this.boss.currentHealth,
      max: this.boss.maxHealth,
    });
    EventBus.emit(GAME_EVENTS.OVERDRIVE_CHANGED, { charge: 0, isActive: false });
  }

  // ===========================================================================
  // Transitions
  // ===========================================================================

  private clearCombatObjects() {
    try {
      const kids = (this.bossProjectiles as unknown as { children?: unknown })?.children;
      if (this.bossProjectiles && kids && typeof (kids as { forEach?: unknown }).forEach === 'function') {
        this.bossProjectiles.clear(true, true);
      }
    } catch (_) {}
    try { this.hazards?.clearAll(); } catch (_) {}
    try { this.staticHazards?.destroy(); } catch (_) {}
    try { this.enemies?.destroy(); } catch (_) {}
    try { this.juice?.clearFreeze(); } catch (_) {}
  }

  private handleBossDefeated() {
    this.clearCombatObjects();

    const next = this.currentLevel + 1;
    SaveManager.saveUnlockedLevel(next);

    if (this.currentLevel === 1) {
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: "The Corrupted Guardian falls! Claim the Protocol Fragment to enter Realm II — INFERNAL FORTRESS.",
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
      this.time.delayedCall(1200, () => {
        this.showLevelTransition(2, REALM_TRANSITIONS[2] ?? []);
      });
      return;
    }

    if (this.currentLevel === 2) {
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: "The Last Warden is extinguished. Infernal Fortress has fallen! Transitioning to Realm III — THE VERDANT ABYSS.",
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
      this.time.delayedCall(1200, () => {
        this.showLevelTransition(3, REALM_TRANSITIONS[3] ?? []);
      });
      return;
    }

    if (this.currentLevel === 3) {
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: "The Worldseed Guardian yields. The living biosphere stabilizes! Transitioning to Realm IV — THE VOIDBORN ABYSS.",
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
      this.time.delayedCall(1200, () => {
        this.showLevelTransition(4, REALM_TRANSITIONS[4] ?? []);
      });
      return;
    }

    if (this.currentLevel === 4) {
      EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
        text: "The Void Sovereign dissolves into cosmic ether. The gravitational anomaly collapses! Transitioning to Realm V.",
        speaker: 'SYSTEM',
        duration: 3500,
        priority: 2,
      });
      this.time.delayedCall(1200, () => {
        this.showLevelTransition(5, REALM_TRANSITIONS[5] ?? []);
      });
      return;
    }

    if (next <= REALM_COUNT) {
      this.showLevelTransition(next, REALM_TRANSITIONS[next] ?? []);
    } else {
      EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'VICTORY');
      this.time.delayedCall(1200, () => {
        try { this.powerUps?.clearAll(); } catch (_) {}
        this.scene.start('VictoryScene');
      });
    }
  }

  private showLevelTransition(nextLevel: number, storyLines: string[]) {
    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'LEVEL_TRANSITION');

    const stageArtKey = this.currentLevel === 1
      ? 'bg_realm1_stage5'
      : (this.textures.exists(`bg_realm${nextLevel}`) ? `bg_realm${nextLevel}` : `bg_realm${this.currentLevel}`);
    const hasStageArt = this.textures.exists(stageArtKey);
    const fadeTargets: Phaser.GameObjects.GameObject[] = [];

    if (hasStageArt) {
      const art = this.add
        .image(0, 0, stageArtKey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(79)
        .setAlpha(0);
      art.setDisplaySize(VIEW_W, VIEW_H);
      fadeTargets.push(art);
    }

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(80).setAlpha(0);
    // Let the reward art read as a place, not just a wash behind text.
    overlay.fillStyle(0x070a0f, hasStageArt ? 0.6 : 0.94);
    overlay.fillRect(0, 0, VIEW_W, VIEW_H);

    // The dimensional seam as the transition device: a vertical fracture that
    // expands across the screen before the next realm is revealed.
    const seam = this.add
      .rectangle(VIEW_W / 2, VIEW_H / 2, 4, VIEW_H, 0xffffff, 0.9)
      .setScrollFactor(0)
      .setDepth(83)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);

    const nextName = LEVELS[nextLevel]?.name ?? '';
    const txt = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 50, storyLines.join('\n\n'), {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '22px',
        color: '#9BAAB7',
        align: 'center',
        lineSpacing: 14,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(81)
      .setAlpha(0);

    const title = this.add
      .text(VIEW_W / 2, VIEW_H / 2 + 80, nextName, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '30px',
        color: '#00CFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(82)
      .setAlpha(0);

    // Realm 1's exit is the Protocol Fragment beat: a real interactive pickup
    // rather than a click-anywhere dismissal.
    const isFragmentBeat = hasStageArt && this.currentLevel === 1 && !this.fragmentAbsorbed;

    const prompt = this.add
      .text(
        VIEW_W / 2,
        VIEW_H / 2 + 150,
        isFragmentBeat
          ? '[ CLICK FRAGMENT, PRESS E, OR PRESS SPACE / ENTER TO ENTER REALM II ]'
          : `[ PRESS SPACE / ENTER OR CLICK TO ENTER ${nextName || 'NEXT REALM'} ]`,
        {
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '18px',
          color: '#8395A5',
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(82)
      .setAlpha(0);

    let fragment: Phaser.GameObjects.Arc | undefined;
    if (isFragmentBeat) {
      fragment = this.add
        .circle(VIEW_W / 2, VIEW_H / 2 - 150, 16, HERO.energy, 0.9)
        .setScrollFactor(0)
        .setDepth(82)
        .setAlpha(0)
        .setStrokeStyle(2, 0xffffff, 0.8);
      fadeTargets.push(fragment);
      this.tweens.add({
        targets: fragment,
        scale: { from: 0.85, to: 1.15 },
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: 'Sine.easeInOut',
      });
    }

    // The seam is deliberately excluded here: it stays invisible while the
    // player reads the card and only appears as the expanding wipe on
    // proceed(). Fading it in here was the bug — a static full-opacity line
    // sitting through the whole card, not the intended transition effect.
    this.tweens.add({ targets: [overlay, txt, title, prompt, ...fadeTargets], alpha: 1, duration: 500 });
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.4, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    let hasProceeded = false;
    const cleanupFns: Array<() => void> = [];

    const proceed = () => {
      if (hasProceeded) return;
      hasProceeded = true;

      cleanupFns.forEach((fn) => {
        try { fn(); } catch (_) {}
      });
      cleanupFns.length = 0;

      try { this.powerUps?.clearAll(); } catch (_) {}

      if (isFragmentBeat && fragment) {
        // Absorption: the fragment collapses into a burst rather than just
        // vanishing — the one real reward feedback this beat has to give.
        this.juice?.impact(fragment.x, fragment.y, 'player', { scale: 1.6, sparks: 20, ring: true });
        AudioManager.getInstance().playRelicCollect();
        this.tweens.add({ targets: fragment, scale: 0, alpha: 0, duration: 220 });
      }

      // Seam appears only now, expanding to fill the screen before the next
      // realm loads behind it — the actual transition wipe, not a static line.
      seam.setAlpha(1);
      this.tweens.add({
        targets: seam,
        scaleX: 400,
        duration: 420,
        ease: 'Quad.easeIn',
        delay: isFragmentBeat ? 260 : 0,
        onComplete: () => {
          if (getRealmReveal(nextLevel)) {
            AudioManager.getInstance().stopMusic();
            const onFinished = () => {
              EventBus.off('realm-reveal-finished', onFinished);
              this.scene.restart({ level: nextLevel, fromCheckpoint: false });
            };
            EventBus.on('realm-reveal-finished', onFinished);
            EventBus.emit('play-realm-reveal', { level: nextLevel });
          } else {
            this.scene.restart({ level: nextLevel, fromCheckpoint: false });
          }
        },
      });
    };

    // Brief debounce so a combat click does not skip the card instantly.
    this.time.delayedCall(250, () => {
      // The fragment is the advertised interaction (click it, or press E),
      // but it is NEVER the only way through — every other transition in
      // the game accepts click-anywhere/Space as a safety net, and this one
      // previously didn't. A required precise interaction with zero
      // fallback is exactly the kind of softlock risk this project
      // otherwise guards against everywhere else; fixed by always also
      // wiring the generic fallback below, regardless of isFragmentBeat.
      if (isFragmentBeat && fragment) {
        fragment.setInteractive({ useHandCursor: true });
        fragment.on('pointerdown', proceed);
        cleanupFns.push(() => {
          try {
            fragment?.off('pointerdown', proceed);
          } catch (_) {}
        });

        const onFragmentKey = (e: KeyboardEvent) => {
          if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            proceed();
          }
        };
        window.addEventListener('keydown', onFragmentKey, { capture: true });
        cleanupFns.push(() => window.removeEventListener('keydown', onFragmentKey, { capture: true }));
      }

      prompt.setInteractive({ useHandCursor: true });
      overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, VIEW_W, VIEW_H), Phaser.Geom.Rectangle.Contains);

      prompt.on('pointerdown', proceed);
      overlay.on('pointerdown', proceed);
      this.input.once('pointerdown', proceed);

      cleanupFns.push(() => {
        try {
          prompt.off('pointerdown', proceed);
          overlay.off('pointerdown', proceed);
          this.input.off('pointerdown', proceed);
        } catch (_) {}
      });

      const onWindowKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          proceed();
        }
      };
      window.addEventListener('keydown', onWindowKey, { capture: true });
      cleanupFns.push(() => window.removeEventListener('keydown', onWindowKey, { capture: true }));

      const onWindowClick = () => proceed();
      window.addEventListener('pointerdown', onWindowClick, { capture: true });
      cleanupFns.push(() => window.removeEventListener('pointerdown', onWindowClick, { capture: true }));
    });
  }

  private handlePlayerDefeated() {
    this.clearCombatObjects();
    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'DEFEAT');
    this.time.delayedCall(900, () => {
      try { this.powerUps?.clearAll(); } catch (_) {}
      this.scene.start('DefeatScene', {
        level: this.currentLevel,
        // Reaching the arena banks a checkpoint: retry resumes the fight.
        fromCheckpoint: this.arenaEntered,
      });
    });
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.anims.pauseAll();
      EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'PAUSED');
    } else {
      this.physics.resume();
      this.anims.resumeAll();
      EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'PLAYING');
    }
  }

  public restartLevel() {
    this.scene.restart({ level: this.currentLevel, fromCheckpoint: this.arenaEntered });
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  /**
   * Falling into a pit costs one unit and returns the player to the last
   * ground they stood on, rather than killing outright — a pit is a mistake,
   * not an execution. Clamps safely to the stage checkpoint if lastSafeX is inside a gap.
   */
  private handlePitFall() {
    const p = this.player;
    if (!p || p.isDead || this.isLevelEnding) return;

    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    let respawnX = this.lastSafeX;
    let respawnY = this.lastSafeY;

    if (this.isGap(respawnX) || respawnX <= 0) {
      const stageIdx = this.getCurrentStageIndex(p.x);
      respawnX = this.stageCheckpoints[stageIdx - 1] ?? 180;
      respawnY = this.groundTop - 120;
    }

    p.setPosition(respawnX, respawnY - 40);
    this.juice?.shake(0.012, 220);
    p.takeDamage(1);
  }

  // ===========================================================================
  // Level 1: Stages 1–5 Progression, Sanctuary Altar & Fragment
  // ===========================================================================

  private createStage5Sanctuary() {
    if (this.currentLevel !== 1) return;

    const altarX = 5800;
    const altarY = 580;

    const altarKey = this.textures.exists('protocol_altar') ? 'protocol_altar' : 'hazard_emitter';
    this.altarSprite = this.add.sprite(altarX, altarY - 24, altarKey);
    this.altarSprite.setDepth(15);

    const fragKey = this.textures.exists('protocol_fragment') ? 'protocol_fragment' : 'particle_white';
    this.fragmentSprite = this.add.sprite(altarX, altarY - 110, fragKey);
    this.fragmentSprite.setDepth(26);

    this.tweens.add({
      targets: this.fragmentSprite,
      y: altarY - 128,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.fragmentSprite,
      scale: { from: 0.95, to: 1.15 },
      alpha: { from: 0.85, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fragmentSprite.setInteractive({ useHandCursor: true });
    this.fragmentSprite.on('pointerdown', () => {
      if (this.player && Math.abs(this.player.x - altarX) <= 220) {
        this.collectProtocolFragment();
      }
    });
  }

  private collectProtocolFragment() {
    if (this.fragmentAbsorbed || this.isLevelEnding) return;
    this.fragmentAbsorbed = true;
    this.isLevelEnding = true;

    AudioManager.getInstance().playRelicCollect();
    this.juice?.shake(0.016, 400);
    this.juice?.zoomPunch(0.06, 350);

    const fx = this.fragmentSprite ? this.fragmentSprite.x : 5800;
    const fy = this.fragmentSprite ? this.fragmentSprite.y : 470;
    this.juice?.impact(fx, fy, 'player', { scale: 2.4, sparks: 36, ring: true });

    if (this.fragmentSprite) {
      this.tweens.add({
        targets: this.fragmentSprite,
        scale: 2.5,
        alpha: 0,
        y: fy - 50,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => this.fragmentSprite?.destroy(),
      });
    }

    EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
      text: 'PROTOCOL FRAGMENT 01 SECURED. The shattered sky stabilizes... Synchronizing data stream for Realm 2.',
      speaker: 'G-ONE',
      duration: 4800,
      priority: 2,
    });

    EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
      title: 'PROTOCOL SYNCHRONIZED',
      instruction: 'Core fragment absorbed. Establishing conduit link to the Rust Wastes...',
      timeout: 5000,
    });

    SaveManager.saveUnlockedLevel(2);
    this.time.delayedCall(1600, () => {
      this.showLevelTransition(2, REALM_TRANSITIONS[2] ?? []);
    });
  }

  private tryEnvironmentalInteraction(pointerPos?: { x: number; y: number }): boolean {
    if (!this.player || this.player.isDead || this.isLevelEnding) return false;

    // Stage 5 Fragment
    if (this.currentLevel === 1 && !this.fragmentAbsorbed && this.fragmentSprite?.active) {
      const distToAltar = Math.abs(this.player.x - 5800);
      const clickedNear = pointerPos
        ? Phaser.Math.Distance.Between(pointerPos.x, pointerPos.y, 5800, 470) <= 90
        : false;

      if (distToAltar <= 180 || clickedNear) {
        this.collectProtocolFragment();
        return true;
      }
    }

    // Static Hazard / Terminal interaction
    if (this.staticHazards) {
      const interacted = this.staticHazards.tryInteract(this.player.x);
      if (interacted) {
        this.juice?.shake(0.006, 120);
        return true;
      }
    }

    return false;
  }

  private getCurrentStageIndex(x: number): number {
    if (this.currentLevel === 1) {
      if (x < 1300) return 1;
      if (x < 2600) return 2;
      if (x < 3900) return 3;
      if (x < 5200) return 4;
      return 5;
    }
    if (this.currentLevel === 2 || this.currentLevel === 3 || this.currentLevel === 4) {
      if (x < 1400) return 1;
      if (x < 2800) return 2;
      if (x < 4200) return 3;
      if (x < 5600) return 4;
      if (x < 7000) return 5;
      return 6;
    }
    return 1;
  }

  private checkStageProgression(playerX: number) {
    if (this.currentLevel !== 1 && this.currentLevel !== 2 && this.currentLevel !== 3 && this.currentLevel !== 4) return;
    const stage = this.getCurrentStageIndex(playerX);
    if (stage !== this.currentStageIndex) {
      this.currentStageIndex = stage;
    }

    if (!this.announcedStages.has(stage)) {
      this.announcedStages.add(stage);
      this.triggerStageNarrative(stage);
    }
  }

  private triggerStageNarrative(stage: number) {
    if (this.currentLevel === 1) {
      switch (stage) {
        case 1:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE I OBJECTIVE',
            value: 'RESTORE POWER RELAY [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 1: Awakening — Auxiliary power offline. Access the Power Relay console to override the security blast door.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 1: AWAKENING',
            instruction: 'Move with [A]/[D], Jump with [W]/[Space]. Approach the Power Relay console at x:720 and press [E] to restore power.',
            timeout: 6500,
          });
          break;
        case 2:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE II OBJECTIVE',
            value: 'DEFLECT SENTINEL VOLLEYS',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 2: Sky Sentinels — Aerial patrol detected. Deploy Aegis Shield to deflect incoming plasma barrages.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 2: SKY SENTINELS',
            instruction: 'Step on Launch Pads to scale vertical catwalks. Press [K] or Right-Click to raise Aegis Shield and reflect laser volleys.',
            timeout: 6500,
          });
          break;
        case 3:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE III OBJECTIVE',
            value: 'CROSS COLLAPSING BRIDGE',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 3: The Shattered Bridge — The structure is crumbling over the abyss. Traverse quickly before platforms collapse.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 3: THE SHATTERED BRIDGE',
            instruction: 'Stepping on fractured bridge fragments triggers collapse in 0.7s. Jump decisively across 160-240px gaps.',
            timeout: 6500,
          });
          break;
        case 4:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE IV OBJECTIVE',
            value: 'DEFEAT RA-ONE',
            alert: true,
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 4: The Corrupted Guardian — Ra-One has compromised the primary defense core. Beware his kinetic plating!',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 4: THE CORRUPTED GUARDIAN',
            instruction: 'Ra-One deflects basic Pulse fire during windup. Evade his telegraphed strikes, then counter-attack during his 1.4s exposed cooling phase.',
            timeout: 7000,
          });
          break;
        case 5:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE V OBJECTIVE',
            value: 'ABSORB PROTOCOL FRAGMENT',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 5: Protocol Fragment — The sanctuary core resonates. Approach the altar to claim the fragment.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 5: PROTOCOL FRAGMENT',
            instruction: 'Approach the altar at x:5800. Press [E] or Click the Fragment to absorb Protocol Fragment 01.',
            timeout: 7000,
          });
          break;
      }
      return;
    }

    if (this.currentLevel === 2) {
      switch (stage) {
        case 1:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE I OBJECTIVE',
            value: 'CROSS THE RUINED BRIDGE',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 1: The Divide Approach — The fortress approach is shattered. Cross collapsing spans and breach the perimeter.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 1: THE DIVIDE APPROACH',
            instruction: 'Crumbling volcanic spans shake and fall 0.75s after contact. Time your leaps and use Phase Dash [Shift] to cross wide chasms.',
            timeout: 6500,
          });
          break;
        case 2:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE II OBJECTIVE',
            value: 'OVERRIDE SECURITY GATE [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 2: The Crimson Citadel — Heavy security perimeter active. Hack the Citadel Security Console at x:2050 to lower blast barriers.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 2: THE CRIMSON CITADEL',
            instruction: 'Step on Launch Pads to scale sniper balconies and claim relics. Press [E] at the Security Console to bypass blast doors.',
            timeout: 6500,
          });
          break;
        case 3:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE III OBJECTIVE',
            value: 'STABILIZE REACTOR CORE [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 3: The Fracture Core — Violent dimensional rifts detected. Ride the magnetic ferry and stabilize the cooling console at x:3660.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 3: THE FRACTURE CORE',
            instruction: 'Phased crimson energy bridges cycle in and out on a timed rhythm. Cross with precise momentum or ride the core shuttle.',
            timeout: 6500,
          });
          break;
        case 4:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE IV OBJECTIVE',
            value: 'PURGE VAULT HAZARDS [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 4: The Entropy Vault — High-voltage laser containment online. Access the Vault Purge terminal at x:5000 to neutralize emitters.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 4: THE ENTROPY VAULT',
            instruction: 'Synchronized laser barriers cycle out of phase. Time your dash past active beams or override them at the terminal.',
            timeout: 6500,
          });
          break;
        case 5:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE V OBJECTIVE',
            value: 'REROUTE CORE CONDUIT [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 5: The Entropy Nexus — Core energy destabilizing. Scale the ascending lifts and reroute conduit power at x:6420.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 5: THE ENTROPY NEXUS',
            instruction: 'Ascend moving core elevators to reach the central dais. Rerouting the terminal activates the conduit bridge and opens the sanctum gates.',
            timeout: 6500,
          });
          break;
        case 6:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE VI OBJECTIVE',
            value: 'NEUTRALIZE THE LAST WARDEN',
            alert: true,
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 6: The Last Warden — The ultimate fortress guardian awakens. Beware kinetic shields and arena-wide energy surges!',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 6: THE LAST WARDEN',
            instruction: 'Use elevated tactical masonry platforms to avoid molten ground strikes. Exploit cooling recovery windows after heavy slams.',
            timeout: 7000,
          });
          break;
      }
    }

    if (this.currentLevel === 3) {
      switch (stage) {
        case 1:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE I OBJECTIVE',
            value: 'DISCOVER ROOTLINE ANCHORS [F]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: "Stage 1: The Living Threshold — Biomechanical root structures react to G-ONE's presence. Use Rootline [F] to tether and vault to higher branches.",
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 1: THE LIVING THRESHOLD',
            instruction: 'Approach glowing bio-anchors and press [F] or Click to engage Rootline tether and vault across chasms.',
            timeout: 6500,
          });
          break;
        case 2:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE II OBJECTIVE',
            value: 'NAVIGATE CANOPY CHASM',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 2: The Verdant Wilds — Acidic spore marshes cover the forest floor. Utilize Canopy Swing Tendrils and Spore Launch Bulbs to maintain high ground.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 2: THE VERDANT WILDS',
            instruction: 'Transfer anchors enable parabolic swings across chasms. Spore bulbs propel you to high observation decks with rare relics.',
            timeout: 6500,
          });
          break;
        case 3:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE III OBJECTIVE',
            value: 'ASCEND THE COLOSSUS INTERIOR',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 3: The Hollow Colossus — An immense hollow tree serving as an organic transmission tower. Ride the vertical bio-elevator and traverse core interior gantries.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 3: THE HOLLOW COLOSSUS',
            instruction: 'Board the moving bio-elevator to ascend vertical trunk sections. Beware Canopy Hunters diving from overhead perches.',
            timeout: 6500,
          });
          break;
        case 4:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE IV OBJECTIVE',
            value: 'HARMONIZE HEARTROOT CONDUIT [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 4: The Heartroot Sanctuary — Sacred cathedral of living technology. Access the Heartroot Blossom at x:4850 to restore the retracted light-bridge.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 4: THE HEARTROOT SANCTUARY',
            instruction: 'Harmonize the environmental blossom node [E / F] to channel bio-luminescence and solidify the light-bridge span.',
            timeout: 6500,
          });
          break;
        case 5:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE V OBJECTIVE',
            value: 'OVERCHARGE SEED CONTAINMENT [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 5: The Biosphere Crucible — The core containment chamber. Cross phasing bio-bridges, defeat the Crucible Vanguard, and override containment at x:6720.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 5: THE BIOSPHERE CRUCIBLE',
            instruction: 'Bio-light bridges cycle on timed frequencies. Override containment to unseal the Sanctuary Portal leading to the Arbiter.',
            timeout: 6500,
          });
          break;
        case 6:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE VI OBJECTIVE',
            value: 'DEFEAT THE WORLDS EED GUARDIAN',
            alert: true,
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 6: The Worldseed Guardian — The ancient arbiter of the Verdant Abyss awakens. Grapple with Rootline to evade ground root sweeps!',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 6: THE WORLDSEED GUARDIAN',
            instruction: 'Evade ground root surges using the high central grapple anchor. Time your strikes during the recovery window after energy beams.',
            timeout: 7000,
          });
          break;
      }
    }

    if (this.currentLevel === 4) {
      switch (stage) {
        case 1:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE I OBJECTIVE',
            value: 'DISCOVER GRAVITAS ANCHORS [F]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 1: The Breach Beyond — Gravitational instability detected. Approach the Gravity Anchor and press [F] to invert the exit lift.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 1: THE BREACH BEYOND',
            instruction: 'Approach purple gravity anchors and press [F] or Click to engage Gravitas. Step into vertical updraft wells to float up to high shelves.',
            timeout: 6500,
          });
          break;
        case 2:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE II OBJECTIVE',
            value: 'SCALE INVERTED MEGACITY',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 2: The Gravity Graveyard — The alien megacity hangs inverted. Scale the central tower using the anti-grav lift and sling anchor.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 2: THE GRAVITY GRAVEYARD',
            instruction: 'Ascend through the vertical anti-grav shaft. Activate the Gravitas Sling [F] to vault across to the suspended bridge.',
            timeout: 6500,
          });
          break;
        case 3:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE III OBJECTIVE',
            value: 'COLLAPSE VOID RIFTS [E / F]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 3: The Riftborn Hunt — Hostile dimensional predators emerge from void rifts. Destroy or disrupt the rift anchors to clear the sector.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 3: THE RIFTBORN HUNT',
            instruction: 'Rift Stalkers lunge aggressively. Target the glowing Dimensional Rift Anchors and press [E / F] to collapse the rifts and unseal the path.',
            timeout: 6500,
          });
          break;
        case 4:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE IV OBJECTIVE',
            value: 'STABILIZE CRYSTAL NETWORK [E]',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 4: The Crystal Cataclysm — Tectonic crystal eruptions detected. Time your crossing between eruption cycles and reach the stabilizer console.',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 4: THE CRYSTAL CATACLYSM',
            instruction: 'Watch for the 0.8s warning glow before crystal eruptions pierce the ground. Dash across collapsing crystal bridges before they shatter.',
            timeout: 6500,
          });
          break;
        case 5:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE V OBJECTIVE',
            value: 'SURVIVE SINGULARITY PULL',
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 5: The Devouring Singularity — The gravitational core is collapsing toward the abyss. Deploy Anti-Singularity Bubbles [F] to cross.',
            speaker: 'SYSTEM',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 5: THE DEVOURING SINGULARITY',
            instruction: 'Singularity vortex pulls G-ONE toward the abyss. Activate Anti-Singularity Anchors [F] to deploy stability bubbles that neutralize the gravitational pull.',
            timeout: 6500,
          });
          break;
        case 6:
          EventBus.emit(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, {
            label: 'STAGE VI OBJECTIVE',
            value: 'DEFEAT THE VOID SOVEREIGN',
            alert: true,
          });
          EventBus.emit(GAME_EVENTS.SHOW_SUBTITLE, {
            text: 'Stage 6: The Void Sovereign — The ancient guardian of the gravitational core awakens. Evade gravity fissure surges and disrupt the channeled core!',
            speaker: 'G-ONE',
            duration: 5200,
            priority: 2,
          });
          EventBus.emit(GAME_EVENTS.SHOW_TUTORIAL, {
            title: 'STAGE 6: THE VOID SOVEREIGN',
            instruction: 'Use elevated tactical balconies to evade ground gravity waves. When the Sovereign channels the core, activate the pylon anchors [E / F] to overload and stun it!',
            timeout: 7000,
          });
          break;
      }
    }
  }

  update(time: number, delta: number) {
    this.juice?.update(time);
    this.powerUps?.update(time, delta);
    this.staticHazards?.update(time, delta);
    this.rootlineManager?.update(time, delta);
    this.gravitasManager?.update(time, delta);
    if (this.player) {
      this.staticHazards?.checkTrigger(this.player.x);
      if (!this.player.isDead) {
        this.checkStageProgression(this.player.x);
      }
    }
    this.staticHazards?.updateGuardGroups((g) => this.enemies?.isGroupAlive(g) ?? false);
    this.dynamicPlatforms?.update(time, delta);
    this.enemies?.update(time);

    if (this.backdrop) {
      this.backdrop.update(this.cameras.main.scrollX, this.cameras.main.scrollY, delta);
    }

    if (this.crosshair) {
      const p = this.input.activePointer;
      this.crosshair.setPosition(p.x, p.y);
    }

    // Lock-on only reads as meaningful once the fight is actually live.
    if (this.arenaEntered && this.boss && this.boss.active && this.boss.bossState !== 'defeated') {
      if (this.lockOn) {
        this.lockOn.setVisible(true);
        this.lockOn.setPosition(this.boss.x, this.boss.y - 14);
        const pulse = this.boss.bossState === 'telegraph' ? 0.86 : 0.75;
        this.lockOn.setScale(pulse);
        this.lockOn.setTint(this.boss.bossState === 'telegraph' ? VILLAIN.energy : HERO.energy);
      }
    } else {
      this.lockOn?.setVisible(false);
    }

    if (this.isPaused || !this.player || !this.player.active) return;

    const p = this.player;
    const body = p.body as Phaser.Physics.Arcade.Body;

    // Bank the last safe footing for pit respawns.
    if (body?.blocked.down && !this.isGap(p.x)) {
      this.lastSafeX = p.x;
      this.lastSafeY = p.y;
    }

    // Pit check: the world floor sits below the ground line.
    if (p.y > this.groundTop + 50 && !p.isDead) {
      this.handlePitFall();
    }

    // Threshold crossing wakes the boss.
    if (!this.arenaEntered && this.arenaStartX && p.x >= this.arenaStartX) {
      this.enterArena(LEVELS[this.currentLevel] || LEVELS[1]);
    }

    p.setAimTarget(this.pointerWorld.x, this.pointerWorld.y);

    const isLeft = this.cursors?.left.isDown || this.keyA?.isDown;
    const isRight = this.cursors?.right.isDown || this.keyD?.isDown;
    p.setMoveInput(isLeft ? -1 : isRight ? 1 : 0);
  }
}
