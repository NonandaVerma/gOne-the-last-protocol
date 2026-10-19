# G-ONE: THE LAST PROTOCOL
> *Two primordial forces. Three cosmic battlegrounds. One final protocol.*

[![Phaser 4](https://img.shields.io/badge/Phaser-4.2.1-blue.svg)](https://phaser.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.28-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-9.20.0-4B32C3.svg)](https://eslint.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete, feature-rich, high-performance 2D action-combat browser platformer built with **Next.js 15**, **TypeScript**, **Phaser 4**, **Tailwind CSS**, and the **Web Audio API**.

The game features an epic mythological collision: **G-One**, the celestial Greek-divine guardian imbued with Olympian light, stands against **Ra-One**, a Viking-inspired cosmic cataclysm bent on global eradication.

---

## 📑 Table of Contents
1. [Game Lore & Concept](#-game-lore--concept)
2. [Key Features & System Highlights](#-key-features--system-highlights)
3. [Combat & Controls Guide](#-combat--controls-guide)
4. [Mythological Relic Power-Ups](#-mythological-relic-power-ups)
5. [The Three Arena Chapters](#-the-three-arena-chapters)
6. [Cinematic Prologue & Dual Endings](#-cinematic-prologue--dual-endings)
7. [Phaser 4 Engine Migration](#-phaser-4-engine-migration)
8. [Dependency Modernization & Security Remediation](#-dependency-modernization--security-remediation)
9. [Critical Bug Fixes Resolved](#-critical-bug-fixes-resolved)
10. [Visual Polish & Procedural Art Pipeline](#-visual-polish--procedural-art-pipeline)
11. [Architecture & Project Directory](#-architecture--project-directory)
12. [Running Locally & Verification](#-running-locally--verification)

---

## 🌌 Game Lore & Concept

In an era where synthetic demigods wage war over planetary consciousness:
* **G-One (The Olympian Avatar)** descends clad in celestial Aegis armor, crowned with golden laurels and powered by pure harmonic energy. Designed to safeguard mortal existence, G-One wields focused pulse shots, defensive barriers, and high-frequency crescent arcs.
* **Ra-One (The Asgardian Ruin)** manifests as a barbaric techno-Viking terror—wearing a spiked iron helm, blood-runic sigils, and a blazing magma-infused core. Ra-One seeks to purge humanity and rewrite reality in fire and zero-day ash.

Across three escalating arenas, the conflict transitions from a volcanic impact crater to a rain-drenched cyberpunk metropolis, culminating in a sudden-death duel within the digital void where a single strike decides the fate of all creation.

---

## ⚡ Key Features & System Highlights

* **Pure Browser-Only Execution**: Zero backend, zero external databases, zero authentication barriers. Fully playable locally or hosted on any static edge CDN.
* **Migrated to Phaser 4**: Leveraging Phaser 4's modern unified filter pipeline, hardware-accelerated rendering, and improved memory lifecycle.
* **Complete 3-Level Campaign**: Three hand-crafted stages with unique platform layouts, environmental hazards, dynamic boss AI phases, and distinct visual themes.
* **6 Functional Mythological Relics**: Collectible power-ups that spawn dynamically across platforms, drastically altering combat dynamics through shield buffs, lightning cascades, movement acceleration, and risk/reward multipliers.
* **Dynamic Audio Synthesizer**: Procedural multi-track Web Audio synthesizer generating adaptive retro synth BGM, laser hums, impact rumbles, and relic chimes without requiring external audio assets.
* **Responsive Control Schemes**: Full keyboard & mouse support with cursor-aimed projectiles, right-click shielding, and touch-ready virtual on-screen controls for mobile/tablet devices.
* **Accessibility & Performance Options**: Real-time settings modal for master/BGM/SFX volumes, screen shake toggles, reduced-motion preferences, and fullscreen mode.

---

## 🕹️ Combat & Controls Guide

### Desktop Controls

| Action | Primary Key | Secondary / Mouse | Description |
|---|---|---|---|
| **Move Left / Right** | `A` / `D` | `←` / `→` | High-responsiveness platformer locomotion. |
| **Jump / Double-Jump** | `W` | `Space` / `↑` | Jump with variable height; jump again mid-air to double-jump. |
| **Aim Crosshair** | Mouse Position | Virtual Pointer | Smooth reticle following pointer with lead-targeting assist. |
| **Pulse Shot** | `J` | **Left Mouse Click** | Fires focused energy bolts toward the crosshair reticle. |
| **Aegis Shield** | `K` | **Right Mouse Click** | Summons an energy shield blocking 100% of front-facing incoming attacks. |
| **Arc Burst** | `L` | — | Emits a high-damage crescent wave capable of destroying enemy projectiles. |
| **Tactical Dash** | `Left Shift` | `Right Shift` | Rapid omnidirectional dash with full invulnerability frames (i-frames). |
| **Final Overdrive** | `E` | — | Activates at 100% Overdrive: grants temporary invincibility, +100% fire rate, and emits a massive screen-clearing blast. |
| **Tactical Pause** | `Esc` | — | Suspends simulation; opens pause menu to resume, restart arena, or access settings. |

### Mobile / Touch Controls
* **Virtual Joystick / D-Pad**: On-screen directional buttons for Left, Right, and Jump.
* **Action Buttons**: Dedicated touch buttons for Pulse Shot, Aegis Shield, Dash, and Overdrive.

---

## 🏺 Mythological Relic Power-Ups

During arena combat, ancient divine relics spawn atop arena platforms. Collecting a relic grants G-One immediate combat bonuses:

```
 +--------------------+       +--------------------+       +--------------------+
 |  AEGIS OF OLYMPUS  |       |    THUNDERHEART    |       |    PHOENIX CORE    |
 | [Orbital Barrier]  |       |  [Chain Lightning] |       |  [Divine Renewal]  |
 | Absorbs 2 attacks  |       | 2x damage for 10s  |       |  Restores 1 HP     |
 +--------------------+       +--------------------+       +--------------------+

 +--------------------+       +--------------------+       +--------------------+
 |    HERMES' STEP    |       |  OVERDRIVE SHARD   |       |    RUNE OF RUIN    |
 |  [Winged Agility]  |       | [Instant Charge]   |       |  [Cursed Might]    |
 | +40% Speed, -50% CD|       | +50 Overdrive meter|       | +100% Dmg, +1 Taken|
 +--------------------+       +--------------------+       +--------------------+
```

1. **Aegis of Olympus**: Athena's golden aegis manifests as an orbiting celestial shield around G-One, absorbing up to 2 direct hits before dissolving.
2. **Thunderheart**: Zeus's celestial thunder infuses G-One's Pulse Shot, turning bolts into electrified chain lightning dealing double damage (2x) for 10 seconds.
3. **Phoenix Core**: The solar spark of the mythical Phoenix immediately restores 1 unit of health (capped at the level maximum).
4. **Hermes' Step**: Blessed by the Messenger God; increases G-One's movement speed by +40% and cuts tactical dash cooldown by 50% with golden winged trail particles.
5. **Overdrive Shard**: A condensed fragment of divine ether instantly grants +50 Overdrive charge, accelerating access to Final Overdrive.
6. **Rune of Ruin**: An ancient berserker rune offering immense risk and reward: grants +100% outgoing damage, but increases incoming damage taken by +1.

All relics are procedurally rasterized onto high-DPI HTML5 canvases at game boot via [`src/game/art/relics.ts`](file:///e:/My%20Projects/gOne/src/game/art/relics.ts).

---

## 🏛️ The Three Arena Chapters

### Chapter I: The Infernal Arena (The Impact Crater)
* **Setting**: Volcanic crater flanked by cracked obsidian basalt, animated magma rivers, and drifting ember particles.
* **G-One Stats**: 3 Health Units.
* **Ra-One Stats**: 8 Health Units.
* **Boss AI Mechanics**:
  * Ground locomotion and platform patrol.
  * Rapid single-bolt pulse shots.
  * 3-projectile spread volleys.
  * Telegraphed charged magma spheres.
  * Opening Taunt: *"You were designed to protect. I was designed to end."*

### Chapter II: The Fallen Metropolis (The Corrupted Network)
* **Setting**: Neon-lit cyberpunk ruins in a torrential downpour, featuring multi-tiered platforms and broken transit lines.
* **G-One Stats**: 3 Health Units.
* **Ra-One Stats**: 8 Health Units.
* **Boss AI Mechanics**:
  * **Levitation & Flight**: Ra-One hovers freely across aerial platforms.
  * **Falling Debris Hazards**: Summons burning urban wreckage crashing from the sky, preceded by high-visibility ground warning telegraphs.
  * Accelerated projectile speed (+15%).
  * Opening Taunt: *"Your shield cannot protect a dying world."*

### Chapter III: The Zero-Day Abyss (Decisive Protocol)
* **Setting**: The core mainframe suspended in an infinite dark cyber-void with pulsing circuit grids.
* **G-One Stats**: **1 Health Unit (Sudden Death)**.
* **Ra-One Stats**: **1 Health Unit (Sudden Death)**.
* **Boss AI Mechanics**:
  * **Lethal One-Hit Stakes**: A single clean hit from either combatant ends the war.
  * **Particle Teleportation**: Ra-One blinks through the void to disorient player aim.
  * **Charged Death Beams**: High-speed penetrating laser beams with linear targeting lines.
  * **Ground Surges**: Erupting digital columns that temporarily deny platform terrain.
  * Opening Taunt: *"Let this world witness its final error."*

---

## 🎬 Cinematic Prologue & Dual Endings

### Cinematic Prologue (3 Scenes)
* **Scene 1 — The Signal**: A damaged orbital vessel enters Earth's ruined atmosphere broadcasting emergency telemetry.
* **Scene 2 — The Arrival**: A divine energy capsule impacts the surface crater; G-One awakens with glowing celestial laurels.
* **Scene 3 — The Throne**: Ra-One is unveiled upon a shattered cybernetic throne, initiating the clash.
* *(Skip anytime using `Spacebar`, `Enter`, or on-screen click)*.

### Narrative Dual Endings
* **Ending A: EVIL PREVAILS (Defeat)**
  * Triggered when G-One runs out of health in any chapter.
  * Dramatic crimson visual sequence; Ra-One's corrupted avatar looms over the planet.
  * Offers instant level retry or return to the prologue.
* **Ending B: LIGHT SURVIVES (Victory)**
  * Triggered upon landing the decisive strike in Chapter III.
  * Electric-blue divine radiance washes over the mainframe, restoring planetary power.
  * **Battle Telemetry Screen**: Displays total clear time, damage absorbed, and relics collected.

---

## 🔧 Phaser 4 Engine Migration

The project was fully migrated from legacy Phaser 3 to modern **Phaser 4 (`4.2.1`)**:

1. **Filter Pipeline Migration**:
   * *Phaser 3*: Used deprecated `sprite.postFX.addGlow()`.
   * *Phaser 4*: Migrated to the modern unified filter architecture:
     ```typescript
     if ((sprite as any).enableFilters && (sprite as any).filters?.internal) {
       (sprite as any).enableFilters();
       (sprite as any).filters.internal.addGlow(color, 2, 0, false, 0.1, 10);
     }
     ```
2. **Tint Modes Modernization**:
   * *Phaser 3*: Relied on `sprite.setTintFill()`, which was removed in Phaser 4.
   * *Phaser 4*: Migrated to:
     ```typescript
     sprite.setTint(0xffffff).setTintMode((Phaser as any).TintModes.FILL);
     ```
3. **Event Windowing**:
   * Set `windowEvents: true` in `gameConfig.ts` to allow harmonious coexistence between Next.js React DOM events and Phaser's Arcade Physics canvas.

---

## 🛡️ Dependency Modernization & Security Remediation

| Package | Original State | Modernized State | Security Rationale |
|---|---|---|---|
| **Next.js** | `14.2.x` (Vulnerable) | **`15.5.28` (LTS Patched)** | Resolves critical RCE & SSRF vulnerabilities (**GHSA-p293-qw3h-jr36**, **GHSA-2xp9-vwfh-vxw4**) while retaining full **React 18.3.1** compatibility. |
| **Phaser** | `3.80.1` | **`4.2.1`** | Modernized 2D canvas/WebGL rendering pipeline and unified filter system. |
| **ESLint** | `8.57.1` (Deprecated) | **`9.20.0`** | Migrated to modern ESLint 9 ecosystem with `@eslint/config-array` and `@eslint/object-schema`. |
| **PostCSS** | `8.4.38` (Vulnerable) | **`8.5.30` (Override)** | Eliminates CSS parsing denial-of-service and selector vulnerabilities. |
| **Rimraf / Inflight** | `3.0.2` / `1.0.6` | **Eliminated** | Removed obsolete transitive dependencies through ESLint 9 modernization. |
| **Native Scripts** | Unapproved | **Approved `unrs-resolver`** | Verified Rust N-API TypeScript module and approved via npm script approval. |

---

## 🐛 Critical Bug Fixes Resolved

1. **Unexpected Hindi / IME Text Input Bug**:
   * *Issue*: Pressing combat keys (`Space`, `WASD`, `JKL`) in certain browser configurations caused Hindi characters (`र`, `त`, `क`) to type into focused DOM elements or the browser URL bar.
   * *Resolution*: Intercepted `compositionstart` in [`GameCanvas.tsx`](file:///e:/My%20Projects/gOne/src/components/game/GameCanvas.tsx) to block unwanted IME composition outside input fields, added Phaser `addCapture([SPACE, UP, DOWN, LEFT, RIGHT])` in [`ArenaScene.ts`](file:///e:/My%20Projects/gOne/src/game/scenes/ArenaScene.ts) to stop browser scrolling without dropping keyboard events, and attached `e.currentTarget.blur()` across all React UI buttons to prevent DOM focus retention.
2. **Player Death Freeze Bug**:
   * *Issue*: When G-One reached 0 HP, nested timers caused the game to lock up indefinitely while Ra-One continued attacking a dead sprite.
   * *Resolution*: Disabled the player physics body immediately upon defeat (`disableBody(true, false)`), cancelled enemy targeting, and dispatched deterministic transition events.
3. **Boss Defeat & Level Progression Failure**:
   * *Issue*: Multi-projectile hits caused duplicate boss defeat triggers, leaving orphaned hazards on screen and breaking stage transitions.
   * *Resolution*: Added an `isLevelEnding` state latch, purged active boss projectiles and debris on defeat, and wired smooth narrative transition interstitials between levels.
4. **Duplicate Subtitle Artifacts**:
   * *Issue*: StoryScene rendered duplicate Phaser canvas text underneath the React StoryOverlay.
   * *Resolution*: Consolidated subtitle rendering exclusively within React and synchronized `EventBus.SKIP_INTRO` cleanly.

---

## 🎨 Visual Polish & Procedural Art Pipeline

* **Pure Procedural Graphics**: No placeholder squares, basic circles, or emojis. Character models, boss sprites, weapons, particles, and power-up relics are drawn using procedural vector canvas paths:
  * [`src/game/art/characters.ts`](file:///e:/My%20Projects/gOne/src/game/art/characters.ts) — G-One divine suit & Ra-One dark Viking armor.
  * [`src/game/art/relics.ts`](file:///e:/My%20Projects/gOne/src/game/art/relics.ts) — The 6 mythological relics and the Aegis of Olympus orbital barrier.
  * [`src/game/art/projectiles.ts`](file:///e:/My%20Projects/gOne/src/game/art/projectiles.ts) — Energy bolts, plasma arcs, charged mega-orbs, and laser beams.
* **Typography Hierarchy**: Integrated via Google Fonts in [`src/app/layout.tsx`](file:///e:/My%20Projects/gOne/src/app/layout.tsx):
  * **Titles & Boss Names**: `Cinzel Decorative` & `Cinzel` (Mythological, classical authority).
  * **Dialogues & Lore**: `Cormorant Garamond` (Heroic epic narrative).
  * **System Telemetry & HUD**: `Inter` & `monospace` (Crisp sci-fi legibility).

---

## 📂 Architecture & Project Directory

```text
gOne/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout & Google Fonts integration
│   │   ├── page.tsx               # Next.js main client container & Phaser mount
│   │   └── globals.css            # Sci-fi glows, scanlines, and animations
│   ├── components/game/
│   │   ├── GameCanvas.tsx         # Phaser canvas lifecycle, resize, & key interceptor
│   │   ├── GameHUD.tsx            # Divine health gauges, cooldowns, overdrive & relic meters
│   │   ├── MainMenu.tsx           # Title menu, story start, & How-to-Play modal
│   │   ├── PauseMenu.tsx          # Celestial Repose pause menu with blur guards
│   │   ├── SettingsMenu.tsx       # Volume sliders, screen shake, & reduced motion
│   │   ├── StoryOverlay.tsx       # Cinematic subtitles & skip controls
│   │   ├── GameOverScreen.tsx     # Ending A (Evil Prevails) retry interface
│   │   ├── VictoryScreen.tsx      # Ending B (Light Survives) victory telemetry
│   │   └── TouchControls.tsx      # Mobile/tablet on-screen virtual joystick & buttons
│   └── game/
│       ├── art/
│       │   ├── characters.ts      # Vector drawing routines for G-One and Ra-One
│       │   ├── palette.ts         # Divine cyan/gold vs Viking crimson/amber colors
│       │   ├── projectiles.ts     # Procedural energy projectile textures
│       │   └── relics.ts          # Procedural texture generator for all 6 relics
│       ├── config/
│       │   └── gameConfig.ts      # Phaser 4 Arcade Physics (1280x720) configuration
│       ├── data/
│       │   ├── characters.ts      # Combat tuning (speeds, cooldowns, damage stats)
│       │   ├── levels.ts          # Configurations for Chapters I, II, and III
│       │   └── story.ts           # Cinematic script, taunts, and level transitions
│       ├── entities/
│       │   ├── GOne.ts            # Protagonist entity (movement, jump, abilities, relics)
│       │   ├── RaOne.ts           # Boss AI state machine (melee, flight, beams, teleports)
│       │   ├── Projectile.ts      # Reusable pooled projectile physics objects
│       │   ├── Hazard.ts          # Falling debris & ground surge environmental hazards
│       │   └── PowerUp.ts         # PowerUpPickup & PowerUpManager for the 6 relics
│       ├── scenes/
│       │   ├── BootScene.ts       # Initial engine bootstrap
│       │   ├── PreloadScene.ts    # Texture factory initialization & asset baking
│       │   ├── MainMenuScene.ts   # Interactive background scene for main menu
│       │   ├── StoryScene.ts      # Cinematic 3-part intro sequence
│       │   ├── ArenaScene.ts      # Main playable combat arena (levels 1, 2, 3)
│       │   ├── DefeatScene.ts     # Game over backdrop
│       │   └── VictoryScene.ts    # Final victory scene
│       ├── systems/
│       │   ├── AudioManager.ts    # Web Audio API multi-channel procedural synthesizer
│       │   ├── Backdrop.ts        # Parallax arena backdrop generator
│       │   ├── EventBus.ts        # Decoupled event emitter bridging Phaser and React
│       │   ├── Juice.ts           # Screen shake, hit flash, particles, and floating text
│       │   ├── ProceduralTextureFactory.ts # Master texture baking manager
│       │   └── SaveManager.ts     # LocalStorage persistence for progress and settings
│       └── types/
│           └── game.ts            # Complete TypeScript interfaces for game systems
├── MIGRATION_NOTES.md             # In-depth architectural and dependency audit report
├── tailwind.config.js             # Divine, destroyer, and mythological color tokens
├── tsconfig.json                  # Strict TypeScript configuration
└── package.json                   # Dependencies, overrides, and build scripts
```

---

## 🚀 Running Locally & Verification

### Prerequisites
* **Node.js**: v18.18+ or v20+ recommended.
* **npm**: v9+ or v10+.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Verify TypeScript Compilation
```bash
npm run type-check
```
*Expected Result*: 0 compilation errors across all Phaser 4 entities, scenes, and React components.

### 4. Run Linter
```bash
npm run lint
```
*Expected Result*: `✔ No ESLint warnings or errors`.

### 5. Build for Production
```bash
npm run build
```
*Expected Result*: Clean static compilation and prerendering of Next.js production bundles.

### 6. Run Security Audit
```bash
npm audit
```
*Expected Result*: 0 critical, 0 production vulnerabilities.

---

## 📜 License
This project is open-source under the [MIT License](LICENSE). Built for high-performance browser gameplay.
