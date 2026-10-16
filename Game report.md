# G-ONE: THE LAST PROTOCOL — MASTER GAME DOCUMENTATION & TECHNICAL REPORT

> **Tagline:** *Two forces. Three arenas. One final protocol.*  
> **Genre:** Story-Driven 2D Sci-Fi Action Platformer / Boss-Rush Battle  
> **Tech Stack:** Next.js (App Router) + React 18 + TypeScript + Phaser 3 (Arcade Physics) + Tailwind CSS + Web Audio API  
> **Target Platform:** Desktop Browsers (Responsive layout with mobile touch control overlay)  
> **Author & Architect:** Antigravity Senior Game Engineering & Systems Architecture

---

## 1. EXECUTIVE SUMMARY & GAME CONCEPT

**G-ONE: THE LAST PROTOCOL** is a fast-paced, cinematic 2D browser-based action platformer. Inspired by the high-contrast Bollywood science-fiction aesthetic of *Ra.One*—contrasting electric blue/cyan energy armor against menacing crimson/maroon dark technology—the game delivers an original storyline, responsive keyboard-and-mouse combat, telegraphed boss mechanics, dynamic environmental hazards, and decisive one-hit stakes.

The game is completely client-contained with no backend, database, authentication, or external asset dependencies. All visual assets (character spritesheets, platforms, projectiles, particle effects, and decals) are procedurally drawn at runtime into the Phaser texture cache, and all audio effects and multi-track background music are generated in real-time via the browser's Web Audio API synthesizer.

---

## 2. THE THREE ARENAS & LEVEL PROGRESSION

The game spans three escalating battle arenas, culminating in a climactic one-hit battle:

```
[MAIN MENU]
    │
    ▼
[STORY INTRO: 3-Scene Cinematic] (Skippable)
    │
    ▼
[LEVEL 1: THE INFERNAL ARENA] ────────► (Defeat: Ending A)
    │ (Ra-One Defeated)
    ▼
[STORY TRANSITION: Metropolis Infection]
    │
    ▼
[LEVEL 2: THE FALLEN METROPOLIS] ─────► (Defeat: Ending A)
    │ (Ra-One Defeated)
    ▼
[STORY TRANSITION: Reality Fracture]
    │
    ▼
[LEVEL 3: THE ZERO-DAY ABYSS]
    ├── (G-One Falls) ───────────────► [ENDING A: EVIL PREVAILS]
    └── (Ra-One Falls) ──────────────► [ENDING B: LIGHT SURVIVES]
```

### Level 1: The Infernal Arena (The Impact Crater)
- **Environment:** Cracked volcanic obsidian platforms, distant burning fortress silhouettes, bubbling animated lava flows beneath the platforms, and drifting embers.
- **Atmosphere:** Deep fiery crimson/maroon sky (`#1a0505` to `#7f1d1d`).
- **G-One Health:** 3 Energy Units.
- **Ra-One Health:** 8 Segmented Units.
- **Boss Mechanics:**
  - Single red energy bolts directed toward the player.
  - 3-projectile spread volleys.
  - Telegraphed charged mega-orbs (visible charge aura + warning sound).
  - Forward high-speed dash attacks.
  - Defensive recovery frames.

### Level 2: The Fallen Metropolis (The Corrupted Network)
- **Environment:** High-tech ruined cyberpunk metropolis with towering illuminated skyscrapers, broken elevated highway overpasses, and floating platforms.
- **Atmosphere:** Dark smoky indigo/night sky (`#020617` to `#1e1b4b`) with neon signage.
- **G-One Health:** 3 Energy Units.
- **Ra-One Health:** 8 Segmented Units.
- **New Boss Mechanics:**
  - **Aerial Levitation:** Ra-One floats into the air propelled by red thrusters to unleash diagonal projectile volleys.
  - **Faster Projectile Speeds:** Reduced intervals and increased projectile velocity.
  - **Environmental Hazards:** Ra-One summons falling metallic debris from above. Each debris strike displays a flashing red warning circle decal on the ground for 600ms before high-velocity impact.

### Level 3: The Zero-Day Abyss (Decisive 1-Hit Battle)
- **Environment:** Fractured digital dimension suspended in an infinite pitch-black void, featuring pulsing cyan and crimson digital matrix grid lines and floating geometric energy rings.
- **Atmosphere:** Infinite void (`#010206` to `#0b0b24`) with matrix code traces.
- **G-One Health:** **1 Energy Unit** *(One single hit loses the game!)*
- **Ra-One Health:** **1 Energy Unit** *(One single hit wins the game!)*
- **Decisive Battle Mechanics:**
  - **Death Beam:** High-speed laser beam preceded by a blinking red targeting line (800ms telegraph window).
  - **Quantum Teleportation:** Ra-One dissolves into red digital particles and instantly reappears at another node to strike.
  - High tension driven by accelerated tempos, lighting flashes, and instant-loss stakes requiring precise timing of the **Aegis Shield** and **Tactical Dash**.

---

## 3. CHARACTERS, ABILITIES & STATS

### G-One (The Guardian Protocol)
G-One is an artificial intelligence embodied in an athletic humanoid armored shell, designed to protect humanity.

- **Visual Palette:** Graphite and black armor plating, silver mechanical accents, glowing cyan energy conduits along arms/legs/spine, and a bright luminous circular chest energy core with cyan optics.
- **Base Movement Speed:** 380 px/s
- **Jump Velocity:** 620 px/s (Arcade Physics gravity: 1200)
- **Invulnerability Period:** 1500 ms (triggers flashing white/cyan transparency after damage)

#### Abilities & Cooldowns:
1. **Pulse Shot (`Left-Click` or `J`):**
   - Cooldown: 350 ms (150 ms during Overdrive).
   - Projectile Speed: 850 px/s.
   - Damage: 1 Unit (2 Units during Overdrive).
   - Mechanic: Computes true angle between G-One and the mouse cursor, firing directly toward the crosshair.
   - Overdrive Gain: +5% on hit.
2. **Aegis Shield (`Right-Click` or `K`):**
   - Cooldown: 6000 ms | Duration: 2200 ms.
   - Mechanic: Deploys a pulsating hexagonal cyan energy barrier around G-One. Blocks 100% of incoming damage and deflects projectile impacts with blue spark bursts.
3. **Arc Burst (`L`):**
   - Cooldown: 4500 ms.
   - Projectile Speed: 650 px/s.
   - Damage: 2 Units.
   - Mechanic: Fires an expansive rotating crescent blade of electric-blue energy with a wide hitbox.
   - Overdrive Gain: +12% on hit.
4. **Tactical Dash (`Shift`):**
   - Cooldown: 2500 ms | Duration: 220 ms.
   - Dash Speed: 800 px/s.
   - Mechanic: High-speed lateral burst with an elongated motion blur. G-One is completely invulnerable during the dash duration.
5. **Final Overdrive (`E`):**
   - Requirement: 100% Overdrive meter (charged via successful combat hits).
   - Duration: 3000 ms.
   - Mechanic: Triggers a radial shockwave, temporary invulnerability, golden/cyan aura tint, doubled Pulse Shot damage, and reduced cooldown (150ms machine-gun fire).

---

### Ra-One (The Corrupt Anomaly)
Ra-One is an aggressive, calculating machine entity engineered for annihilation and chaos.

- **Visual Palette:** Dark crimson, deep maroon, and jagged black armor plates, horned aggressive helmet silhouette, glowing red eye visor, and a cracked ruby-red chest core emitting energy fissures.
- **AI State Machine:**
  - `idle`: Observes player and adjusts facing orientation.
  - `telegraph`: Scales up slightly with crimson tint and warning cues.
  - `attack`: Dispatches single bolts, spreads, charged orbs, beams, or dashes.
  - `aerial`: Floats above ground with red propulsion fire (Levels 2 & 3).
  - `recover`: Brief cooldown stance between action cycles.
  - `stagger`: Flashes white/red with invulnerability frames upon taking damage.
  - `defeated`: Shatters and dissolves into red digital fragments with screen shake.

---

## 4. CONTROLS SPECIFICATION

Both keyboard and mouse inputs are supported simultaneously without conflicts:

### Desktop Keyboard & Mouse
| Control | Key / Input | Action |
| :--- | :--- | :--- |
| **Move Left** | `A` or `←` | Move G-One left |
| **Move Right** | `D` or `→` | Move G-One right |
| **Jump** | `W`, `Space`, or `↑` | Jump to evade ground hazards & projectiles |
| **Mouse Crosshair** | Pointer movement | Dynamically aims projectile trajectory |
| **Pulse Shot** | `Left-Click` or `J` | Fires blue pulse toward crosshair |
| **Aegis Shield** | `Right-Click` or `K` | Deploys barrier (Context menu suppressed) |
| **Arc Burst** | `L` | Launches heavy crescent blade wave |
| **Tactical Dash** | `Left Shift` | Invulnerable evasive dash |
| **Overdrive** | `E` | Activates when meter reaches 100% |
| **Tactical Pause** | `Esc` | Freezes physics and displays Pause Menu |

### Mobile & Touch Screens
- The game automatically detects touch devices via `ontouchstart` / `navigator.maxTouchPoints`.
- Renders semi-transparent HUD touch buttons:
  - **Left Hand:** Virtual Left, Right, and Jump buttons.
  - **Right Hand:** Virtual Pulse Shot, Aegis Shield, Tactical Dash, and Overdrive triggers.

---

## 5. STORY SCENES & CINEMATIC SCRIPT

### Opening Cinematic (3 Acts) — Skippable via Space / Click
- **Scene 1: The Signal**
  - *Visual:* Dark starry cosmos with moving nebula clouds. A damaged spacecraft with blue propulsion engines streaks across the upper screen.
  - *Transmission Text:*
    `EMERGENCY TRANSFER INITIATED.`  
    `DESTINATION: EARTH.`  
    `GUARDIAN PROTOCOL: ACTIVE.`
- **Scene 2: The Arrival**
  - *Visual:* Transition to impact crater ground zero. A bright blue energy capsule hurtles downward, striking the ground with a massive shockwave and particle blast. G-One emerges from the crater.
  - *Narrative Text:*
    `WHEN THE WORLD LOST ITS LIGHT,`  
    `ONE SIGNAL REFUSED TO DIE.`  
    `G-ONE HAS ENTERED THE COMBAT ARENA.`
- **Scene 3: The Throne**
  - *Visual:* Camera reveals Ra-One seated upon a massive industrial fortress throne. Red lightning illuminates the sky. Ra-One stands, raises his arm, and casts a crimson fireball toward the screen.
  - *Dialogue Text:*
    `THREAT DETECTED: RA-ONE`  
    `"You were designed to protect. I was designed to end."`  
    `GUARDIAN PROTOCOL ENGAGED.`

### Level 2 Transition (Metropolis Infection)
- `THE PHYSICAL SHELL WAS DESTROYED.`
- `THE CORRUPT PROTOCOL SURVIVED.`
- `THE ENTIRE CITY BECAME HIS WEAPON.`

### Level 3 Transition (Reality Fracture)
- `THE ENERGY NETWORK HAS SURPASSED CRITICAL THRESHOLD.`
- `THE BOUNDARY BETWEEN CODE AND PHYSICAL MATTER IS SHATTERED.`
- `ONE FINAL STRIKE WILL DETERMINE THE EXISTENCE OF THIS WORLD.`

### Ending A: Evil Wins (Defeat Sequence)
- **Trigger:** G-One loses all health units in any arena.
- **Aesthetic:** Deep crimson, smoke, rising embers, screen distortion, and Ra-One's silhouette standing above the ruins.
- **Header:** `GUARDIAN SIGNAL LOST // PROTECTION PROTOCOL TERMINATED`
- **Title:** **EVIL PREVAILS**
- **Lore:** *"RA-ONE HAS CLAIMED THE FINAL PROTOCOL. THE WORLD WILL REMEMBER THE NIGHT IT WENT DARK."*
- **Actions:** `RETRY BATTLE`, `RESTART STORY`, `MAIN MENU`.

### Ending B: G-One Wins (Victory Sequence)
- **Trigger:** Ra-One loses his final health unit in Level 3.
- **Aesthetic:** Electric blue and silver skies, central energy burst, ascending blue particles, and the distant skyline illuminating with power.
- **Header:** `RA-ONE CORE: OFFLINE // GUARDIAN PROTOCOL: RESTORED`
- **Title:** **LIGHT SURVIVES**
- **Lore:** *"THE WORLD WAS NOT SAVED BY POWER ALONE. IT WAS SAVED BY THE ONE WHO REFUSED TO ABANDON IT."*
- **Actions:** `PLAY AGAIN`, `REPLAY STORY`, `MAIN MENU`.

---

## 6. SOUND ENGINE & PROCEDURAL AUDIO (Web Audio API)

Implemented in [`AudioManager.ts`](file:///d:/SideProjects-NonandaV\gOne-the_last_protocol\src\game\systems\AudioManager.ts), the game features a pure synthesized audio engine:

1. **Browser Autoplay Compliant:** Automatically initializes and un-suspends the `AudioContext` upon the player's first mouse click or keypress.
2. **SFX Synthesizer Methods:**
   - `playPulseShoot()`: Sawtooth oscillator rapid frequency sweep from 880 Hz down to 220 Hz with exponential decay.
   - `playRaOneShoot()`: Square wave aggressive sweep from 440 Hz down to 90 Hz.
   - `playArcBurst()`: Low-to-high ramping sawtooth wave with wide frequency sweep (220 Hz -> 660 Hz -> 110 Hz).
   - `playShieldActivate()`: Ascending sine wave sweep (260 Hz -> 920 Hz) with soft envelope.
   - `playShieldDeflect()`: Crisp triangle wave deflection harmonic ping at 1200 Hz.
   - `playDash()`: Quick 180ms sawtooth filtered whoosh.
   - `playJump()`: Smooth upward sine chirp (180 Hz -> 420 Hz).
   - `playExplosion()`: White noise audio buffer piped through an exponential lowpass filter with sub-bass decay.
   - `playHit()`: Low punchy square pulse with quick release.
   - `playOverdrive()`: 5-stage rising arpeggio chord (330 Hz, 440 Hz, 550 Hz, 660 Hz, 880 Hz).
3. **Generative BGM Engines:**
   - `menu`: Dual filtered sub-bass drones (55 Hz & 110 Hz) creating an ambient sci-fi atmosphere.
   - `battle`: 16th-note driving cyberpunk bassline (`[55Hz, 65Hz, 73Hz, 55Hz]`) at 280ms tempo.
   - `boss3`: Rapid high-tension pulse bassline (`[49Hz, 52Hz, 58Hz, 65Hz]`) at 180ms tempo.
   - `victory`: Heroic resolving major fanfare progression.
   - `defeat`: Descending minor progression chords.
4. **Volume Subsystems:** Separate sliders for Master Gain, Music Gain, and SFX Gain, alongside an instant mute toggle.

---

## 7. SYSTEM ARCHITECTURE & CODEBASE STRUCTURE

```text
d:\SideProjects-NonandaV\gOne-the_last_protocol\
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Next.js App Router Root Layout with Orbitron/Rajdhani/Inter Google fonts
│   │   ├── page.tsx           # Main page orchestrating React overlays and dynamic Phaser canvas
│   │   └── globals.css        # Sci-fi utility styles, CRT scanline overlay, and glow classes
│   ├── components/game/
│   │   ├── GameCanvas.tsx     # Client-only dynamic Phaser mount, singleton guardian, and resize handler
│   │   ├── GameHUD.tsx        # In-game HUD: segmented core units, ability cooldowns, overdrive bar
│   │   ├── MainMenu.tsx       # Main menu interface, How-to-Play modal, sound toggle
│   │   ├── PauseMenu.tsx      # Tactical pause overlay with resume, restart, settings, and quit
│   │   ├── SettingsMenu.tsx   # Audio sliders, screen shake toggle, reduced motion, display modes
│   │   ├── StoryOverlay.tsx   # Cinematic dialogue subtitle lower-third box with skip button
│   │   ├── GameOverScreen.tsx # Ending A (Evil Prevails) UI
│   │   ├── VictoryScreen.tsx  # Ending B (Light Survives) UI
│   │   └── TouchControls.tsx  # Virtual mobile joystick and ability buttons
│   └── game/
│       ├── config/
│       │   └── gameConfig.ts  # Phaser 3 1280x720 Arcade Physics configuration with FIT scale mode
│       ├── data/
│       │   ├── characters.ts  # Complete numeric configurations for G-One and Ra-One
│       │   ├── levels.ts      # Level 1, 2, 3 configurations, gravity, and boss attack intervals
│       │   └── story.ts       # Dialogues, transmission scripts, and lore texts
│       ├── entities/
│       │   ├── GOne.ts        # Protagonist class (movement, mouse aim, abilities, health, overdrive)
│       │   ├── RaOne.ts       # Boss AI class (state machine, projectiles, flight, hazards, teleports)
│       │   ├── Projectile.ts  # Arcade Physics projectile with particle trail and lifetime bounds
│       │   └── Hazard.ts      # Environmental falling debris with ground warning decals
│       ├── scenes/
│       │   ├── BootScene.ts   # Minimal boot scene
│       │   ├── PreloadScene.ts# Generates procedural textures and sleek progress bar
│       │   ├── MainMenuScene.ts# Energy clash background with floating particles
│       │   ├── StoryScene.ts  # 3-act opening story cinematic
│       │   ├── ArenaScene.ts  # Core combat loop, parallax layers, platform colliders, input loops
│       │   ├── VictoryScene.ts# Ending B celebrating G-One's victory
│       │   └── DefeatScene.ts # Ending A showing Ra-One dominating the ruined world
│       └── systems/
│           ├── AudioManager.ts # Web Audio API procedural synthesizer (SFX & dynamic BGM)
│           ├── EventBus.ts     # Pure TypeScript SSR-safe event emitter bridge
│           ├── ProceduralTextureFactory.ts # Procedural vector texture and particle generator
│           └── SaveManager.ts  # Safe localStorage wrapper for preferences and progress
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.mjs
├── README.md
└── GAME_REPORT.md
```

---

## 8. PHASER & REACT INTEGRATION DETAILS

### Preventing Duplicate Game Instances
During React development and hot-module reloading (HMR), components can mount multiple times. In [`GameCanvas.tsx`](file:///d:/SideProjects-NonandaV\gOne-the_last_protocol\src\components\game\GameCanvas.tsx), we maintain an instance ref `gameRef` and check `isMounted`. Upon unmount:
```typescript
return () => {
  isMounted = false;
  if (gameRef.current) {
    gameRef.current.destroy(true);
    gameRef.current = null;
  }
};
```

### SSR Safety (Preventing `window is not defined`)
Next.js App Router executes code on the server during `next build` static page generation. Because Phaser immediately accesses `window.cordova` upon module evaluation, two critical guardrails were established:
1. [`EventBus.ts`](file:///d:/SideProjects-NonandaV\gOne-the_last_protocol\src\game\systems\EventBus.ts) was built from scratch as a pure TypeScript event emitter without importing `phaser`.
2. [`GameCanvas.tsx`](file:///d:/SideProjects-NonandaV\gOne-the_last_protocol\src\components\game\GameCanvas.tsx) is imported in [`page.tsx`](file:///d:/SideProjects-NonandaV\gOne-the_last_protocol\src\app\page.tsx) using `next/dynamic` with `{ ssr: false }`, and dynamically imports both `phaser` and `gameConfig` inside `useEffect`.

---

## 9. VERIFICATION & VALIDATION RESULTS

The codebase has undergone full verification:

| Check | Tool / Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript Compilation** | `npm run type-check` (`tsc --noEmit`) | **Passed (Exit 0)** | Zero type errors across all scenes, entities, and components |
| **Next.js Production Build** | `npm run build` | **Passed (Exit 0)** | All 4 static routes generated successfully (`/`, `/_not-found`) |
| **HTTP Web Server Test** | `Invoke-WebRequest http://localhost:3000` | **Passed (200 OK)** | Web server renders and returns valid HTML |
| **Phaser Engine Lifecycle** | In-browser dynamic import | **Passed** | 1280x720 canvas mounts and centers properly |
| **Input Handling** | Pointer & Keyboard events | **Passed** | Crosshair tracking, right-click context menu suppression verified |
| **Audio Synthesis** | Web Audio API context | **Passed** | Fully synthesized SFX without 404 missing asset errors |

---

## 10. COMMAND REFERENCE

### Development
```bash
npm run dev
```

### Type Checking
```bash
npm run type-check
```

### Production Build & Launch
```bash
npm run build
npm run start
```
