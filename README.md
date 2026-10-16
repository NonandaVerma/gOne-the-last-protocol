# G-ONE: THE LAST PROTOCOL
> *Two forces. Three arenas. One final protocol.*

A polished, playable, story-driven 2D browser action platformer built with **Next.js (App Router)**, **TypeScript**, **Phaser 3**, **Tailwind CSS**, and **Web Audio API**.

---

## 🎮 Game Concept & Lore

In a dystopian future where artificial intelligence dictates the survival of planets, **G-One**—an embodied technological guardian—descends to Earth to face the corrupt, chaotic entity **Ra-One**. 

Across three escalating battle arenas, the player engages in fast-paced side-scrolling combat featuring energy projectiles, tactical shields, evasive dashes, environmental hazards, and decisive 1-hit stakes.

---

## 🕹️ Controls Guide

### Keyboard
- **Move Left / Right:** `A` / `D` or `Left Arrow` / `Right Arrow`
- **Jump:** `W` or `Space` or `Up Arrow`
- **Pulse Shot:** `J` (aims towards crosshair)
- **Aegis Shield:** `K` (blocks 100% incoming damage while active)
- **Arc Burst:** `L` (wide-angle high-damage crescent wave)
- **Tactical Dash:** `Shift` (evasive burst with invulnerability frames)
- **Final Overdrive:** `E` (activates when charge reaches 100%; grants high-speed firepower and invulnerability)
- **Pause / Resume:** `Esc`

### Mouse
- **Aiming:** Pointer position controls the aiming crosshair and projectile angle.
- **Left-Click:** Fire Pulse Shot toward the cursor.
- **Right-Click:** Activate Aegis Shield (browser context menu suppressed).

### Mobile / Touch
- Virtual on-screen D-pad (Move Left, Move Right, Jump) and ability buttons (Pulse, Shield, Dash, Overdrive) automatically activate on touch devices.

---

## ⚔️ The Three Arenas

### 1. Chapter I: The Infernal Arena
- **Environment:** Volcanic landscape, cracked obsidian platforms, animated lava flows, and drifting embers.
- **Boss Mechanics:** Ra-One fires single bolts, 3-projectile spreads, telegraphed charged mega-orbs, and forward charge rushes.
- **Health:** G-One: 3 units | Ra-One: 8 units.

### 2. Chapter II: The Fallen Metropolis
- **Environment:** Rain-slicked cyber metropolis with neon skyscrapers, broken highways, and floating platforms.
- **Boss Mechanics:** Ra-One unlocks aerial levitation, diagonal firing sweeps, and calls telegraphed environmental debris hazards that crash with warning target indicators.
- **Health:** G-One: 3 units | Ra-One: 8 units.

### 3. Chapter III: The Zero-Day Abyss (Decisive 1-Hit Battle)
- **Environment:** Fractured digital dimension suspended in a dark void with pulsating cybernetic circuit traces.
- **Boss Mechanics:** Decisive one-hit stakes! Ra-One fires high-speed death laser beams with telegraph warnings, performs instant particle teleports, and releases rapid energy bursts.
- **Health:** G-One: 1 unit | Ra-One: 1 unit.

---

## 🎬 Cinematic Sequences & Endings

- **Opening Cinematic (3 Scenes):**
  1. *The Signal:* Damaged spacecraft entering ruined atmosphere with active transmission.
  2. *The Arrival:* Energy capsule crashes into impact crater; G-One emerges.
  3. *The Throne:* Ra-One revealed upon mechanical throne launching initial fireball.
  *(Skip anytime via Spacebar or Click)*.
- **Ending A: EVIL PREVAILS:** Dramatic crimson defeat sequence if G-One falls. Ra-One silhouette towers over the dark world.
- **Ending B: LIGHT SURVIVES:** Heroic electric-blue victory sequence if Ra-One is defeated. Cities re-illuminate in the distance.

---

## 🛠️ Architecture & Tech Stack

```text
src/
├── app/
│   ├── layout.tsx         # Google Fonts (Orbitron, Rajdhani, Inter)
│   ├── page.tsx           # React UI container & dynamic Phaser loader
│   └── globals.css        # Sci-fi glows, scanline shaders, CRT styling
├── components/game/
│   ├── GameCanvas.tsx     # Client-only singleton Phaser mount & cleanup
│   ├── GameHUD.tsx        # Segmented health indicators, cooldowns, overdrive
│   ├── MainMenu.tsx       # Interactive menu, How-to-Play modal, sound toggle
│   ├── PauseMenu.tsx      # Tactical pause with restart and settings access
│   ├── SettingsMenu.tsx   # Audio sliders, screen shake, reduced motion
│   ├── StoryOverlay.tsx   # Cinematic dialogue subtitles & skip controls
│   ├── GameOverScreen.tsx # Ending A (Evil Prevails) UI
│   ├── VictoryScreen.tsx  # Ending B (Light Survives) UI
│   └── TouchControls.tsx  # Responsive virtual buttons for mobile/touch
├── game/
│   ├── config/
│   │   └── gameConfig.ts  # Phaser 1280x720 Arcade Physics configuration
│   ├── data/
│   │   ├── characters.ts  # Stats, cooldowns, and ability configs
│   │   ├── levels.ts      # 3 arenas and boss AI mechanics
│   │   └── story.ts       # Dialogues, transmissions, and lore
│   ├── entities/
│   │   ├── GOne.ts        # Protagonist class (movement, mouse aim, abilities)
│   │   ├── RaOne.ts       # Boss AI state machine (attacks, flight, teleport)
│   │   ├── Projectile.ts  # Physics projectiles with particle trails
│   │   └── Hazard.ts      # Environmental falling debris with telegraphs
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MainMenuScene.ts
│   │   ├── StoryScene.ts
│   │   ├── ArenaScene.ts
│   │   ├── VictoryScene.ts
│   │   └── DefeatScene.ts
│   └── systems/
│       ├── AudioManager.ts            # Web Audio API procedural synthesizer
│       ├── EventBus.ts                # SSR-safe decoupled Phaser-React bridge
│       ├── ProceduralTextureFactory.ts # High-res vector texture generator
│       └── SaveManager.ts             # Safe localStorage settings & progress
```

---

## 🚀 Running the Game Locally

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check
```bash
npm run type-check
```

### Production Build
```bash
npm run build
npm run start
```
