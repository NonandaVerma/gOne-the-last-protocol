import * as Phaser from 'phaser';
import { GOne } from '../entities/GOne';
import { RaOne } from '../entities/RaOne';
import { Projectile, createProjectilePool } from '../entities/Projectile';
import { HazardManager } from '../entities/Hazard';
import { LEVELS, VIEW_W, VIEW_H } from '../data/levels';
import { LEVEL_2_TRANSITION, LEVEL_3_TRANSITION } from '../data/story';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { Juice } from '../systems/Juice';
import { Backdrop } from '../systems/Backdrop';
import { EventBus, GAME_EVENTS } from '../systems/EventBus';
import { HERO, VILLAIN } from '../art/palette';
import { ArenaGeometry } from '../types/game';

/**
 * The playable arena. Owns the fight: geometry, camera, colliders, input and
 * the handful of state transitions (boss defeated -> next level, player dead
 * -> defeat screen) that tie a level together.
 *
 * Gameplay logic itself lives on the entities (`GOne`, `RaOne`, `HazardManager`)
 * so this scene stays a thin wiring layer.
 */
export class ArenaScene extends Phaser.Scene {
  public currentLevel = 1;

  private player?: GOne;
  private boss?: RaOne;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private playerProjectiles?: Phaser.Physics.Arcade.Group;
  private bossProjectiles?: Phaser.Physics.Arcade.Group;
  private hazards?: HazardManager;
  private crosshair?: Phaser.GameObjects.Image;
  private lockOn?: Phaser.GameObjects.Image;
  private backdrop?: Backdrop;
  private juice?: Juice;

  private isPaused = false;
  private isLevelEnding = false;
  private groundTop = 648;
  private worldWidth = 2240;

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

  init(data: { level?: number }) {
    this.currentLevel = data?.level || 1;
    this.isPaused = false;
    this.isLevelEnding = false;
    SaveManager.saveUnlockedLevel(this.currentLevel);
  }

  create() {
    const config = LEVELS[this.currentLevel] || LEVELS[1];
    const arena = config.arena;
    this.groundTop = arena.groundTop;
    this.worldWidth = arena.worldWidth;

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

    AudioManager.getInstance().playMusic(this.currentLevel === 3 ? 'boss3' : 'battle');

    this.juice = new Juice(this, 40);
    this.backdrop = new Backdrop(this, this.currentLevel, VIEW_W, VIEW_H);

    this.createGround(arena);
    this.createPlatforms(arena);

    this.playerProjectiles = createProjectilePool(this, 48);
    this.bossProjectiles = createProjectilePool(this, 80);
    this.hazards = new HazardManager(this, this.juice, this.groundTop);

    this.player = new GOne(
      this,
      arena.playerSpawnX,
      this.groundTop - 120,
      this.playerProjectiles,
      this.juice,
      config.playerHealth
    );

    this.boss = new RaOne({
      scene: this,
      x: arena.bossSpawnX,
      y: this.groundTop - 140,
      pool: this.bossProjectiles,
      juice: this.juice,
      level: this.currentLevel,
      health: config.bossHealth,
      mechanics: config.bossMechanics,
      hazards: this.hazards,
      groundTop: this.groundTop,
    });
    this.boss.setTarget(this.player);

    this.crosshair = this.add.image(VIEW_W / 2, VIEW_H / 2, 'crosshair_aim');
    this.crosshair.setDepth(45).setScrollFactor(0).setAlpha(0.9).setScale(0.9);

    this.lockOn = this.add.image(0, 0, 'lock_bracket');
    this.lockOn.setDepth(29).setAlpha(0.8).setScale(0.75).setVisible(false);

    this.setupCamera();
    this.setupColliders();
    this.setupInput();
    this.setupEventListeners();

    this.pointerWorld = { x: arena.playerSpawnX + 300, y: this.groundTop - 100 };
    this.player.setAimTarget(this.pointerWorld.x, this.pointerWorld.y);

    this.announceBoss(config.openingTaunt);
    this.syncHud();
  }

  // ===========================================================================
  // Geometry
  // ===========================================================================

  private createGround(arena: ArenaGeometry) {
    const key = this.currentLevel === 1 ? 'platform_l1' : this.currentLevel === 2 ? 'platform_l2' : 'platform_l3';
    this.platforms = this.physics.add.staticGroup();

    const tile = this.textures.get(key).getSourceImage();
    const tileW = tile.width || 256;
    const tileH = tile.height || 80;
    const groundThickness = 140;
    const scaleY = groundThickness / tileH;

    const count = Math.ceil(arena.worldWidth / tileW) + 1;
    for (let i = 0; i < count; i++) {
      const seg = this.platforms.create(i * tileW + tileW / 2, arena.groundTop + groundThickness / 2, key);
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

  private createPlatforms(arena: ArenaGeometry) {
    if (!this.platforms) return;
    const key = this.currentLevel === 1 ? 'platform_l1' : this.currentLevel === 2 ? 'platform_l2' : 'platform_l3';
    const tile = this.textures.get(key).getSourceImage();
    const tileW = tile.width || 256;
    const tileH = tile.height || 80;

    arena.platforms.forEach((p) => {
      const scaleX = p.width / tileW;
      const plat = this.platforms!.create(p.x, p.y + tileH * 0.3, key);
      plat.setScale(scaleX, 0.65).refreshBody();
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
  // Colliders
  // ===========================================================================

  private setupColliders() {
    if (!this.platforms || !this.player || !this.boss) return;

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);

    if (this.playerProjectiles) {
      this.physics.add.overlap(this.playerProjectiles, this.boss, (bossObj, projObj) => {
        const proj = projObj as Projectile;
        const boss = bossObj as RaOne;
        if (!proj.active || !boss.active || proj.owner !== 'player') return;
        if (!proj.registerHit(boss)) return;

        const hit = boss.takeDamage(proj.damage);
        if (hit && this.player) {
          this.player.addOverdriveCharge(proj.damage > 1 ? 16 : 6);
        }
        if (!proj.pierce) proj.kill(true);
      });

      // Arc Burst can also shred incoming boss shots - a visible reward for aiming well.
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
        if (!proj.active || !p.active || proj.owner !== 'boss') return;
        if (!proj.registerHit(p)) return;

        p.takeDamage(proj.damage, proj.x, proj.unblockable);
        if (!proj.pierce) proj.kill(true);
      });
    }

    if (this.hazards) {
      this.physics.add.overlap(this.hazards.getGroup(), this.player, (playerObj, hazardObj) => {
        const p = playerObj as GOne;
        const hz = hazardObj as Phaser.Physics.Arcade.Sprite;
        if (p.active && hz.active) p.takeDamage(1);
      });
    }
  }

  // ===========================================================================
  // Input
  // ===========================================================================

  private setupInput() {
    if (this.input.keyboard) {
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
    const onRestartStory = () => this.scene.start('StoryScene');
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
      this.hazards?.clearAll();
      this.backdrop?.destroy();
      this.juice?.clearFreeze();
    });
  }

  private announceBoss(taunt: string) {
    this.time.delayedCall(900, () => {
      if (this.boss?.active) this.juice?.taunt(taunt, VILLAIN.energy);
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

  private handleBossDefeated() {
    if (this.currentLevel === 1) {
      this.showLevelTransition(2, LEVEL_2_TRANSITION.text);
    } else if (this.currentLevel === 2) {
      this.showLevelTransition(3, LEVEL_3_TRANSITION.text);
    } else {
      this.time.delayedCall(1400, () => this.scene.start('VictoryScene'));
    }
  }

  private showLevelTransition(nextLevel: number, storyLines: string[]) {
    EventBus.emit(GAME_EVENTS.GAME_STATE_CHANGED, 'LEVEL_TRANSITION');

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(80).setAlpha(0);
    overlay.fillStyle(0x000000, 0.88);
    overlay.fillRect(0, 0, VIEW_W, VIEW_H);

    const txt = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 40, storyLines.join('\n\n'), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '20px',
        color: '#3ae9ff',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(81)
      .setAlpha(0);

    const prompt = this.add
      .text(VIEW_W / 2, VIEW_H / 2 + 110, '[ SPACE / CLICK TO ENTER NEXT ARENA ]', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(81)
      .setAlpha(0);

    this.tweens.add({ targets: [overlay, txt, prompt], alpha: 1, duration: 700 });

    const proceed = () => this.scene.restart({ level: nextLevel });
    this.time.delayedCall(900, () => {
      this.input.once('pointerdown', proceed);
      this.input.keyboard?.once('keydown-SPACE', proceed);
      this.input.keyboard?.once('keydown-ENTER', proceed);
    });
  }

  private handlePlayerDefeated() {
    this.time.delayedCall(1400, () => this.scene.start('DefeatScene', { level: this.currentLevel }));
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
    this.scene.restart({ level: this.currentLevel });
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  update(time: number, delta: number) {
    this.juice?.update(time);

    if (this.backdrop) {
      this.backdrop.update(this.cameras.main.scrollX, this.cameras.main.scrollY, delta);
    }

    if (this.crosshair) {
      const p = this.input.activePointer;
      this.crosshair.setPosition(p.x, p.y);
    }

    if (this.boss && this.boss.active && this.boss.bossState !== 'defeated') {
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

    this.player.setAimTarget(this.pointerWorld.x, this.pointerWorld.y);

    const isLeft = this.cursors?.left.isDown || this.keyA?.isDown;
    const isRight = this.cursors?.right.isDown || this.keyD?.isDown;
    this.player.setMoveInput(isLeft ? -1 : isRight ? 1 : 0);
  }
}
