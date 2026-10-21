import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { RaOne } from '../entities/RaOne';
import { Projectile, createProjectilePool } from '../entities/Projectile';
import { HazardManager } from '../entities/Hazard';
import { StaticHazardField } from '../entities/StaticHazard';
import { DynamicPlatformManager } from '../entities/DynamicPlatform';
import { LEVELS, VIEW_W, VIEW_H } from '../data/levels';
import { REALM_TRANSITIONS } from '../data/story';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { Juice } from '../systems/Juice';
import { Backdrop } from '../systems/Backdrop';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { HERO, VILLAIN } from '../art/palette';
import { ArenaGeometry, LevelConfig, REALM_COUNT } from '../types/game';
import { PowerUpManager, PowerUpPickup } from '../entities/PowerUp';

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
  private powerUps?: PowerUpManager;
  private crosshair?: Phaser.GameObjects.Image;
  private lockOn?: Phaser.GameObjects.Image;
  private backdrop?: Backdrop;
  private juice?: Juice;

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
    this.startedAtCheckpoint = Boolean(data?.fromCheckpoint);
    SaveManager.saveUnlockedLevel(this.currentLevel);
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

    this.createGround(arena);
    this.createStaticPlatforms(arena);

    this.playerProjectiles = createProjectilePool(this, 48);
    this.bossProjectiles = createProjectilePool(this, 80);
    this.hazards = new HazardManager(this, this.juice, this.groundTop);

    // Retrying after a death in the fight resumes at the arena mouth.
    const spawnX = this.startedAtCheckpoint && this.arenaStartX
      ? this.arenaStartX - 120
      : arena.playerSpawnX;

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

    this.dynamicPlatforms = new DynamicPlatformManager(
      this,
      this.juice,
      `platform_l${this.currentLevel}`,
      arena.platforms.filter((p) => p.behaviour && p.behaviour !== 'static')
    );

    this.staticHazards = new StaticHazardField(
      this,
      this.juice,
      this.hazards.getGroup(),
      arena.staticHazards ?? [],
      config.difficulty.hazardWarnScale
    );

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

    this.pointerWorld = { x: spawnX + 300, y: this.groundTop - 100 };
    this.player.setAimTarget(this.pointerWorld.x, this.pointerWorld.y);

    // Starting at the checkpoint means the fight is already joined.
    if (this.startedAtCheckpoint || !this.arenaStartX) {
      this.enterArena(config, true);
    } else {
      this.announceObjective(config.objective);
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
    const key = `platform_l${this.currentLevel}`;
    this.platforms = this.physics.add.staticGroup();

    const tile = this.textures.get(key).getSourceImage();
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
      const seg = this.platforms.create(cx, arena.groundTop + groundThickness / 2, key);
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
    if (!this.platforms) return;
    const key = `platform_l${this.currentLevel}`;
    const tile = this.textures.get(key).getSourceImage();
    const tileW = (tile as { width?: number }).width || 256;
    const tileH = (tile as { height?: number }).height || 80;

    arena.platforms
      .filter((p) => !p.behaviour || p.behaviour === 'static')
      .forEach((p) => {
        const scaleX = p.width / tileW;
        const plat = this.platforms!.create(p.x, p.y + tileH * 0.3, key);
        plat.setScale(scaleX, 0.65).refreshBody();
      });
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
      if (this.boss?.active) this.juice?.taunt(config.openingTaunt, VILLAIN.energy);
    });
  }

  private announceObjective(objective: string) {
    this.time.delayedCall(500, () => {
      if (this.scene.isActive()) this.juice?.taunt(objective, HERO.energy);
    });
  }

  // ===========================================================================
  // Colliders
  // ===========================================================================

  private setupColliders() {
    if (!this.platforms || !this.player || !this.boss) return;

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);

    // Dynamic platforms carry the player; landing on a collapsing one arms it.
    if (this.dynamicPlatforms) {
      this.physics.add.collider(
        this.player,
        this.dynamicPlatforms.getGroup(),
        (_playerObj, platObj) => {
          const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
          // Only a genuine landing counts — brushing the underside does not.
          if (body?.touching.down) {
            this.dynamicPlatforms?.notifyLanded(platObj as Phaser.GameObjects.GameObject);
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
      this.keyE.on('down', () => this.player?.activateOverdrive());
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
      if (pointer.leftButtonDown()) this.player?.firePulseShot();
      else if (pointer.rightButtonDown()) this.player?.activateShield();
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
    EventBus.on(GAME_EVENTS.BOSS_DIED, onBossDied);
    EventBus.on(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
    EventBus.on(GAME_EVENTS.PAUSE_GAME, onTogglePause);
    EventBus.on(GAME_EVENTS.RESUME_GAME, onResume);
    EventBus.on(GAME_EVENTS.RESTART_LEVEL, onRestartLevel);
    EventBus.on(GAME_EVENTS.RESTART_STORY, onRestartStory);
    EventBus.on(GAME_EVENTS.QUIT_TO_MENU, onQuitToMenu);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GAME_EVENTS.SCREEN_SHAKE, onShake);
      EventBus.off(GAME_EVENTS.OVERDRIVE_BURST, onOverdriveBurst);
      EventBus.off(GAME_EVENTS.BOSS_DIED, onBossDied);
      EventBus.off(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
      EventBus.off(GAME_EVENTS.PAUSE_GAME, onTogglePause);
      EventBus.off(GAME_EVENTS.RESUME_GAME, onResume);
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, onRestartLevel);
      EventBus.off(GAME_EVENTS.RESTART_STORY, onRestartStory);
      EventBus.off(GAME_EVENTS.QUIT_TO_MENU, onQuitToMenu);
      if (this.contextMenuHandler) this.game.canvas?.removeEventListener('contextmenu', this.contextMenuHandler);
      // Teardown order matters: managers own timers and tweens that would
      // otherwise fire against destroyed sprites on the next scene.
      try { this.staticHazards?.destroy(); } catch (_) {}
      try { this.dynamicPlatforms?.destroy(); } catch (_) {}
      try { this.hazards?.clearAll(); } catch (_) {}
      try { this.powerUps?.clearAll(); } catch (_) {}
      try { this.backdrop?.destroy(); } catch (_) {}
      try { this.juice?.clearFreeze(); } catch (_) {}
    });
  }

  private syncHud() {
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
    try { this.juice?.clearFreeze(); } catch (_) {}
  }

  private handleBossDefeated() {
    this.clearCombatObjects();

    const next = this.currentLevel + 1;
    if (next <= REALM_COUNT) {
      SaveManager.saveUnlockedLevel(next);
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

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(80).setAlpha(0);
    overlay.fillStyle(0x070a0f, 0.94);
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

    const prompt = this.add
      .text(VIEW_W / 2, VIEW_H / 2 + 150, '[ CLICK OR PRESS SPACE TO CONTINUE ]', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '18px',
        color: '#8395A5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(82)
      .setAlpha(0);

    this.tweens.add({ targets: [overlay, txt, title, prompt, seam], alpha: 1, duration: 500 });
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

      // Seam expands to fill the screen, then the next realm loads behind it.
      this.tweens.add({
        targets: seam,
        scaleX: 400,
        duration: 420,
        ease: 'Quad.easeIn',
        onComplete: () => this.scene.restart({ level: nextLevel, fromCheckpoint: false }),
      });
    };

    prompt.setInteractive({ useHandCursor: true });
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, VIEW_W, VIEW_H), Phaser.Geom.Rectangle.Contains);

    // Brief debounce so a combat click does not skip the card instantly.
    this.time.delayedCall(250, () => {
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
   * not an execution.
   */
  private handlePitFall() {
    const p = this.player;
    if (!p || p.isDead || this.isLevelEnding) return;

    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    p.setPosition(this.lastSafeX, this.lastSafeY - 40);
    this.juice?.shake(0.01, 200);
    p.takeDamage(1);
  }

  update(time: number, delta: number) {
    this.juice?.update(time);
    this.powerUps?.update(time, delta);
    this.staticHazards?.update(time, delta);
    this.dynamicPlatforms?.update(time, delta);

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
