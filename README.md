# G-ONE: THE LAST PROTOCOL

> Two forces. Six collapsing realms. One final protocol.

A browser-based, story-driven 2D sci-fi action platformer built with **Next.js 15**, **React 18**, **TypeScript**, **Phaser 4**, and **Tailwind CSS**, deployed on **Vercel**. The player controls **G-ONE**, a guardian protocol, through six escalating realms against **RA-ONE**, an entropic anomaly, combining real cinematic video sequences with Arcade-physics platforming and telegraphed boss combat.

This README reflects the game as it actually exists in the repository today, verified against the source — not the game's original design draft. Where something in the project is ambiguous, incomplete, or unverified, this document says so explicitly rather than guessing.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Game Synopsis](#2-game-synopsis)
3. [Storyline: G-One, Ra-One, and the Conflict](#3-storyline-g-one-ra-one-and-the-conflict)
4. [World, Setting, and Visual Identity](#4-world-setting-and-visual-identity)
5. [Complete Realm and Stage Guide](#5-complete-realm-and-stage-guide)
6. [Characters, Enemies, and Bosses](#6-characters-enemies-and-bosses)
7. [Powers and Abilities](#7-powers-and-abilities)
8. [Key Features](#8-key-features)
9. [Combat and Controls Guide](#9-combat-and-controls-guide)
10. [How to Play](#10-how-to-play)
11. [Technology Stack](#11-technology-stack)
12. [Architecture and Project Directory](#12-architecture-and-project-directory)
13. [Cinematic and Asset Production Workflow](#13-cinematic-and-asset-production-workflow)
14. [Requirements](#14-requirements)
15. [Installation and Local Development](#15-installation-and-local-development)
16. [Build and Deployment on Vercel](#16-build-and-deployment-on-vercel)
17. [Analytics and Engagement Tracking](#17-analytics-and-engagement-tracking)
18. [Testing and Quality Assurance](#18-testing-and-quality-assurance)
19. [Performance and Compatibility](#19-performance-and-compatibility)
20. [Security Considerations](#20-security-considerations)
21. [Known Issues and Limitations](#21-known-issues-and-limitations)
22. [Troubleshooting](#22-troubleshooting)
23. [Future Improvements](#23-future-improvements)
24. [Credits and AI-Assisted Development](#24-credits-and-ai-assisted-development)
25. [License and Asset Rights](#25-license-and-asset-rights)

---

## 1. Project Overview

**Genre:** Story-driven 2D sci-fi action platformer / boss-rush
**Engine:** Phaser 4 (Arcade Physics), mounted inside a Next.js App Router page
**Presentation:** Real cinematic MP4 video (opening teaser + per-realm reveal videos) layered as React/DOM overlays above the Phaser canvas, plus in-engine boss fights, platforming, and environmental mechanics
**Platform:** Desktop browsers (keyboard + mouse) with a touch-control overlay for mobile/tablet
**Deployment:** Vercel, static/serverless Next.js build — no backend, database, or authentication layer

---

## 2. Game Synopsis

Reality is fracturing along the seam between two opposing forces: **Order**, the principle that built the Protocol, and **Entropy**, the corruption unraveling it realm by realm. **G-ONE** is the Protocol's guardian — assembled, deployed, and sent in to hold each collapsing realm against the thing that broke it. **RA-ONE** is what's doing the breaking: an anomaly that doesn't just oppose G-ONE, it re-manifests as the dominant threat of each realm it corrupts, under different names and different forms, with the true confrontation reserved for the last one.

The player's job across six realms is consistent even as the environments and threats change completely: clear a realm's hazards and defenses, defeat whatever has seized control of it, and move to the next fracture before it collapses entirely.

---

## 3. Storyline: G-One, Ra-One, and the Conflict

**G-ONE — the Guardian Protocol.** The playable protagonist. Carries Pulse Shot, Aegis Shield, Arc Burst, Tactical Dash, and a chargeable Final Overdrive burst. Visually coded in cyan/"Order" color language throughout the HUD and effects.

**RA-ONE — the Corrupt Anomaly.** The antagonist, voiced through recurring red/crimson "Entropy" visual coding. Ra-One is confirmed (via `src/game/data/characters.ts`'s `RA_ONE_CONFIG` and the in-HUD boss titles) to be the throughline antagonist across all six realms, but is fought under different identities as each realm's dominant guardian/threat:

| Realm | Boss encountered |
|---|---|
| I — Shattered Skies | Ra-One (base form) |
| II — Infernal Fortress | The Last Warden |
| III — The Verdant Abyss | The Worldseed Guardian |
| IV — The Voidborn Abyss | The Void Sovereign |
| V — The Overwrite | The Protocol Warden |
| VI — The Black Crown | Ra-One: The Final Protocol |

The opening cinematic (`video_intro.mp4`, played via `IntroCinematic.tsx`) establishes the premise visually; the exact shot-by-shot narrative beyond its on-screen subtitle cues (see §13) is carried by the footage itself, which this document does not attempt to transcribe.

Each realm transition (`src/game/data/story.ts`, `REALM_TRANSITIONS`) narrates the stakes in-fiction — the realm behind collapsing, the next one's threat, the player's objective — and realms I–IV additionally have a full video reveal cinematic (`REALM_REVEALS` in `story.ts`) with timed subtitle cues played before gameplay begins. **Realms V and VI currently have no reveal video configured in code** — this is flagged in §21 as an unverified gap rather than assumed to be either an intentional design choice or an oversight.

The **Protocol Fragment**, introduced in Realm I's fifth stage, is the series' central macguffin — confirmed in code (`ArenaScene.collectProtocolFragment`) as a collectible tied to Realm I's sanctuary altar. Whether later realms have an equivalent fragment-collection beat is not confirmed in the current build; only Realm I's is implemented.

The confirmed endings:
- **Defeat — "EVIL PREVAILS"**: triggered whenever G-ONE's health reaches zero, in any realm (`DEFEAT_STORY` in `story.ts`).
- **Victory — "LIGHT SURVIVES"**: triggered by defeating Ra-One in Realm VI, The Black Crown (`VICTORY_STORY` in `story.ts`).

---

## 4. World, Setting, and Visual Identity

The visual language is built around two colors doing all the narrative work: **cyan/ice for Order** (G-ONE, the Protocol, "safe" HUD states) and **crimson/red for Entropy** (Ra-One, corruption, alert states) — confirmed directly in the HUD source (`GameHUD.tsx`) and its own internal documentation, which explicitly rules out a third accent color to keep that language legible. Realm III introduces a third, deliberate exception: an emerald/verdant palette for its "living megastructure" biome, reflected in its own HUD boss-panel styling.

Each realm has its own fully painted background art generated per stage (see §13) — confirmed via `PreloadScene.ts`, which loads a distinct background image per realm per internal stage (4–6 stages each), crossfaded during traversal by `Backdrop.ts`. Six realms, each with its own environmental theme (per `levels.ts`/`realms.ts` naming): fractured industrial skyways, a volcanic iron fortress, a biomechanical living forest, an inverted-gravity void megacity, an artificial "overwritten" reality, and a final throne-room realm. Stage names and their in-fiction meaning are detailed per-realm in §5.

---

## 5. Complete Realm and Stage Guide

Source of truth: `src/game/data/levels.ts` (realm identity, objectives, boss taunts), `src/game/scenes/ArenaScene.ts` (`triggerStageNarrative`, the per-stage HUD objective labels and tutorial prompts actually shown in-game). Every realm has 5–6 internal stages the player crosses in a single continuous arena, each ending in that realm's boss.

### Realm I — Shattered Skies
*Subtitle: "Realm I — The First Fracture" · Objective: restore the power conduits, cross the fractured skyways, secure Protocol Fragment I · G-ONE health: 4 units*

| Stage | Name | What happens |
|---|---|---|
| 1 | Awakening | Restore the Power Relay console (`[E]` at a fixed world position) to override a security blast door — the tutorial stage for movement and jumping. |
| 2 | Sky Sentinels | Aerial patrol fires volleys; Launch Pads let the player scale vertical catwalks. Aegis Shield (`K`/RMB) is introduced here to reflect incoming laser fire. |
| 3 | The Shattered Bridge | A collapsing bridge — stepping on a fragment triggers its collapse ~0.7s later, forcing committed jumps across 160–240px gaps. |
| 4 | The Corrupted Guardian | Mid-realm miniboss fight: Ra-One deflects basic Pulse Shot fire during his windup; the player must bait an attack and counter during his ~1.4s exposed cooldown window. |
| 5 | Protocol Fragment | The realm's sanctuary altar — approach and interact (`[E]`/click) to absorb Protocol Fragment I, the realm's macguffin payoff. |

### Realm II — Infernal Fortress
*Subtitle: "Realm II — Six Sectors of Fire & Iron" · Objective: breach the Crimson Citadel, stabilize the reactor core, defeat The Last Warden · G-ONE health: 4 units*

| Stage | Name | What happens |
|---|---|---|
| 1 | The Divide Approach | Crumbling volcanic bridge spans collapse ~0.75s after contact; Phase/Tactical Dash is the intended tool for crossing wide chasms. |
| 2 | The Crimson Citadel | A guarded security perimeter — hacking the Citadel Security Console (`[E]`) lowers blast barriers; Launch Pads reach sniper balconies holding relics. |
| 3 | The Fracture Core | Ride a magnetic ferry across phased energy bridges that cycle in and out on a timed rhythm, then stabilize the core's cooling console. |
| 4 | The Entropy Vault | High-voltage, out-of-phase laser containment emitters guard a Vault Purge terminal that neutralizes them. |
| 5 | The Entropy Nexus | Ascending core elevators lead to a conduit-reroute terminal that opens the sanctum gates to the boss arena. |
| 6 | The Last Warden | Boss fight. Kinetic shields and arena-wide energy surges; elevated tactical masonry platforms are the designed counter to its molten ground-slam attacks. |

### Realm III — The Verdant Abyss
*Subtitle: "Realm III — Six Sectors of the Living Megastructure" · Objective: navigate the biomechanical forest, awaken the Worldseed Guardian · G-ONE health: 3 units*

Introduces the **Rootline** traversal mechanic (`RootlineManager.ts`), bound to `F`/click.

| Stage | Name | What happens |
|---|---|---|
| 1 | The Living Threshold | Bio-anchors react to G-ONE's presence; Rootline tether (`F`) vaults the player across chasms — the tutorial stage for this realm's core mechanic. |
| 2 | The Verdant Wilds | Acidic spore marshes cover the floor; Canopy Swing Tendrils and Spore Launch Bulbs reach elevated relic caches. |
| 3 | The Hollow Colossus | A hollow living "tree" acting as an organic transmission tower — ride a moving bio-elevator while evading diving Canopy Hunters. |
| 4 | The Heartroot Sanctuary | Harmonizing the Heartroot Blossom node (`[E]`/`[F]`) restores a retracted light-bridge. |
| 5 | The Biosphere Crucible | Bio-light bridges cycle on timed frequencies; defeating the Crucible Vanguard and overriding containment unseals the Sanctuary Portal to the boss. |
| 6 | The Worldseed Guardian | Boss fight. Ground root-sweep attacks; the high central Rootline grapple anchor is the designed evasion tool, with counterattacks timed to its post-beam recovery window. |

### Realm IV — The Voidborn Abyss
*Subtitle: "Realm IV — Gravity Anomalies of the Shattered Core" · Objective: harness Gravitas, cross the inverted megacity, stabilize the void rifts · G-ONE health: 4 units*

Introduces the **Gravitas** mechanic (`GravitasManager.ts`), bound to `F`/click.

| Stage | Name | What happens |
|---|---|---|
| 1 | The Breach Beyond | Gravity Anchors (`F`/click) invert an exit lift; vertical updraft wells float the player to high shelves. |
| 2 | The Gravity Graveyard | An inverted alien megacity — an anti-grav lift and a Gravitas Sling vault across to a suspended bridge. |
| 3 | The Riftborn Hunt | Rift Stalker enemies lunge aggressively; targeting glowing Dimensional Rift Anchors (`[E]`/`[F]`) collapses the rifts and clears the sector. |
| 4 | The Crystal Cataclysm | Tectonic crystal eruptions telegraph with a ~0.8s warning glow before piercing the ground; crossing requires dashing between eruption cycles. |
| 5 | The Devouring Singularity | A collapsing gravitational core pulls the player toward the abyss; Anti-Singularity Anchors (`F`) deploy stability bubbles to neutralize the pull. |
| 6 | The Void Sovereign | Boss fight. Ground gravity-wave attacks, countered from elevated tactical balconies; channeling pylon anchors (`[E]`/`[F]`) during its core-channel window overloads and stuns it. |

### Realm V — The Overwrite
*Subtitle: "Realm V — The Hostile Reality Rewrite" · Objective: infiltrate the six sectors, override the corrupted architecture, breach the core · G-ONE health: 3 units*

Introduces a **Protocol Node reconfiguration** mechanic (`ProtocolOverrideManager.ts`), bound to `F`/click.

| Stage | Name | What happens |
|---|---|---|
| 1 | The Entry Protocol | Amber Protocol Nodes (`F`/click) reconfigure structures between baseline and overwritten states — the tutorial stage for this mechanic. |
| 2 | The Recursive Engine | Multi-tier industrial machinery; reconfiguring a node toggles a gantry, revealing an elevated cache. |
| 3 | The Desync Expanse | Mismatched, desynchronized metallic slabs patrolled by Security Drones and Protocol Enforcers. |
| 4 | The Null Foundry | Hydraulic compression presses flash amber ~0.75s before slamming, with a ~1.5s recovery window to dash through. |
| 5 | The Firewall Citadel | Elite Firewall Sentinels guard a blast-gate console that opens the path to the Overwrite Core. |
| 6 | The Protocol Warden | Boss fight. Electric amber energy bursts and hydraulic dash lunges, played from elevated observation gantries. |

### Realm VI — The Black Crown
*Subtitle: "Realm VI — The Final Protocol. One Ending Remains." · Objective: traverse the six sectors, execute Protocol Break, destroy Ra-One · G-ONE health: 3 units*

Introduces the **Protocol Break** counter mechanic (`ProtocolBreakManager.ts`), bound to `F`/click.

| Stage | Name | What happens |
|---|---|---|
| 1 | The Crown's Shadow | Elite sentinels telegraph heavy attacks with a cyan reticle; executing Protocol Break (`F`/click) during the telegraph stuns them — the tutorial stage for this realm's core mechanic. |
| 2 | The Harrowed Gate | Dominion Marksmen fire from elevated vantage points; Aegis Shield or a closing dash is the designed counter. |
| 3 | The Hunting Grounds | Agile Crown Stalkers execute pursuit lunges across chasms; stepped tactical slabs and Overdrive bursts clear pursuit squads. |
| 4 | The Broken Sanctum | Dark corruption fissures and timing-cycled crushing barriers, crossed during their reset windows. |
| 5 | The Red Wake | Elite Sentinels guard the final approach bridge; Protocol Break during their shockwave telegraph opens large damage windows. |
| 6 | Ra-One: The Final Protocol | Final boss fight. An apocalypse-overload channel that must be interrupted with Protocol Break (`F`) for a ~3.5s vulnerability window — the decisive confrontation of the game. |

---

## 6. Characters, Enemies, and Bosses

**G-ONE** — the player character. Cyan/Order visual identity, four active abilities plus a chargeable Overdrive burst (see §7). Takes 1300ms of invulnerability after a hit (`G_ONE_CONFIG.invulnerabilityDuration`).

**Ra-One / realm-specific boss forms** — see the table in §3 for which identity appears in which realm. Confirmed boss AI (`RaOne.ts`, `RA_ONE_CONFIG`) runs a phase system based on remaining health fraction (100% → 62% → 30%), each phase increasing speed and aggression and unlocking more attacks: single bolts, 3-shot spreads, telegraphed charged orbs, death beams, and ground slams, plus flight/levitation in later realms. Boss defeat is a single state machine (`idle → telegraph → attack → recover → stagger → defeated`) — confirmed idempotent against duplicate hit events.

**Realm-specific enemies and hazards** exist per realm (Rift Stalkers, Security Drones, Protocol Enforcers, Crown Stalkers, Dominion Marksmen, Canopy Hunters, the Crucible Vanguard, and others named in §5's stage table) via each realm's `EnemyManager`/`StaticHazardField` configuration in `src/game/data/levels.ts` and `src/game/art/enemies.ts`. This document does not re-derive each enemy's individual attack pattern beyond what's listed per stage above, to avoid inventing combat details not explicit in the source.

---

## 7. Powers and Abilities

All five are live, functional abilities (not cosmetic placeholders) — confirmed wired in `GOne.ts` and `ArenaScene.setupInput()`.

| Ability | Binding | Cooldown | Effect |
|---|---|---|---|
| **Pulse Shot** | `J` / Left-click | 230ms (110ms during Overdrive) | Fires a 1150px/s energy bolt toward the cursor; 1 damage, +6% Overdrive charge per hit. |
| **Aegis Shield** | `K` / Right-click | 5200ms, 1900ms duration | Blocks all non-piercing incoming damage; +14% Overdrive per deflected hit. Does **not** block environmental fall damage (see §21 — this was a confirmed exploit, now fixed). |
| **Arc Burst** | `L` | 3800ms | A piercing, 780px/s crescent wave dealing 2 damage; passes through the boss instead of being consumed on hit. +16% Overdrive per hit. |
| **Tactical Dash** | `Shift` | 1700ms, 185ms duration | Full invulnerability during the dash; +8% Overdrive if it passes through a projectile. |
| **Final Overdrive** | `E` (once meter hits 100%) | — | 4200ms of 2x damage, plus a 1-damage, 220px-radius release shockwave on activation. |

**Realm-specific environmental tether abilities**, all bound to `F`/click, are distinct systems introduced one realm at a time rather than universal G-ONE powers: **Rootline** (Realm III), **Gravitas** (Realm IV), **Protocol Node reconfiguration** (Realm V), and **Protocol Break** (Realm VI). See §5 for what each does in context.

---

## 8. Key Features

- Six fully realized realms, each with 5–6 internal stages, unique traversal mechanics, and a dedicated boss.
- Real cinematic video presentation: a full opening teaser plus per-realm reveal cinematics (confirmed for Realms I–IV; see §21 for the V/VI gap), with timed subtitle cues, skip controls, and resilient autoplay-policy handling (see §19).
- Five core combat abilities plus four realm-specific traversal/puzzle mechanics.
- Boss AI with a confirmed three-phase escalation system scaling speed, aggression, and attack variety with remaining health.
- Six collectible relic power-ups (`src/game/data/relics.ts`) with distinct combat effects, from damage buffs to a deliberate risk/reward "more damage dealt, more damage taken" relic.
- Full keyboard + mouse control scheme, with a touch-control overlay for mobile (all five core abilities covered, including Arc Burst, which was a confirmed gap fixed during this audit).
- Procedurally-driven HUD: segmented health readouts, live ability cooldown meters, an Overdrive charge bar, and a stage-objective indicator synced to a single authoritative level-state source (`LevelState.ts`), not duplicated per-component state.
- Local save/progress persistence via `localStorage`, safe against private-browsing storage failures.
- Vercel Web Analytics integration with custom gameplay-milestone events (see §17).

---

## 9. Combat and Controls Guide

| Action | Desktop | Mobile (touch) | Notes |
|---|---|---|---|
| Move | `A`/`D` or arrow keys | Left/Right pads | |
| Jump | `W` / `Space` / `↑` | Jump pad | Coyote time + jump buffering implemented (`G_ONE_CONFIG.coyoteTime`/`jumpBuffer`). |
| Pulse Shot | `J` / Left-click | Pulse pad | Aims at the live cursor position on desktop. |
| Aegis Shield | `K` / Right-click | Shield pad | |
| Arc Burst | `L` | Arc Burst pad | Added to the touch overlay during this audit — previously unreachable on mobile. |
| Tactical Dash | `Shift` | Dash pad | |
| Final Overdrive | `E` (also the environmental-interact key) | Overdrive pad | On desktop, `E` tries an environmental interaction first (e.g. a console) before falling back to Overdrive — touch has no equivalent context-sensitive fallback; mobile players use realm consoles via tap/other prompts instead (unverified on a real device — see §19). |
| Realm-specific tether (Rootline / Gravitas / Reconfigure / Protocol Break) | `F` / click | Not confirmed on touch | Phaser's pointer input underlies both mouse clicks and taps, so a tap should trigger it — not verified on a physical touch device. |
| Pause | `Esc` | Pause button (HUD) | |

---

## 10. How to Play

1. The game opens on a title screen; a full-screen teaser cinematic plays once per browser session (skippable with Space/click, or available again anytime via the "Teaser" button).
2. **Initiate Protocol** starts a new run at Realm I, or **Continue** resumes at the player's furthest unlocked realm.
3. Each realm begins with a reveal cinematic where one is configured (Realms I–IV), skippable the same way as the intro.
4. Gameplay is a single continuous horizontally-traversed arena per realm — cross hazards and stages in order, using the realm's specific traversal mechanic where introduced, until reaching that realm's boss.
5. On realm-boss defeat, a transition screen narrates the stakes and advances to the next realm (or the Victory screen, after Realm VI).
6. On G-ONE's death, a Defeat screen offers retry (resuming at the realm's entrance checkpoint), replaying the full story from Realm I, or returning to the main menu.
7. `Esc` pauses at any time during gameplay, with resume/restart/settings/quit options.

---

## 11. Technology Stack

Confirmed from `package.json` and source imports:

- **Phaser** `^4.2.1` — game engine, Arcade Physics
- **Next.js** `^15.5.28` (App Router) — React framework, build/deploy pipeline
- **React** / **React DOM** `^18.3.1`
- **TypeScript** `^5.7.2` (strict mode per `tsconfig.json`)
- **Tailwind CSS** `^3.4.17` — all React UI styling
- **lucide-react** — icon set used throughout the HUD/menus
- **Web Audio API** (via `AudioManager.ts`) — procedural SFX/music synthesis, no external audio files
- **@vercel/analytics** — page-view and custom gameplay-event tracking (added during this audit; see §17)
- **Vitest** `^5.0.5` — test runner for the pure-logic modules (added during this audit; see §18)
- **ESLint** `^9.20.0`, **tsc --noEmit** — the remaining static-analysis tooling
- **Vercel** — deployment target (inferred from project framing and `next build` output shape; no `vercel.json` is present, meaning deployment relies entirely on Vercel's Next.js zero-config detection)

No backend, database, authentication, or server-side API route exists anywhere in `src/` — this is a fully client-side application.

---

## 12. Architecture and Project Directory

```
src/
├── app/
│   ├── layout.tsx            # Root layout, Google Fonts, Vercel <Analytics/>
│   ├── page.tsx               # Top-level game-state owner; wires EventBus to React overlays
│   └── globals.css
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx            # Phaser mount/teardown, now with an init-failure recovery screen
│   │   ├── GameHUD.tsx               # Health/cooldown/Overdrive/stage HUD
│   │   ├── MainMenu.tsx              # Title screen, continue/restart, teaser modal
│   │   ├── IntroCinematic.tsx        # Opening video overlay
│   │   ├── LevelRevealCinematic.tsx  # Per-realm reveal video overlay
│   │   ├── LevelTransitionScreen.tsx # Between-realm narrative card
│   │   ├── StageBanner.tsx           # Brief realm/stage-advance toast
│   │   ├── NarrationOverlay.tsx      # Centralized subtitle/narration presentation
│   │   ├── TutorialPanel.tsx         # Upper-left per-stage instruction panel
│   │   ├── TouchControls.tsx         # Mobile touch overlay
│   │   ├── EndingScreen.tsx          # Shared Victory/Defeat presentation
│   │   ├── VictoryScreen.tsx / GameOverScreen.tsx
│   │   ├── PauseMenu.tsx / SettingsMenu.tsx / HowToPlayModal.tsx
│   └── ui/                    # ProtocolButton, ModalShell, Seam — shared presentational primitives
└── game/
    ├── config/gameConfig.ts   # Phaser config: 1280×720 logical res, ENVELOP scale mode, Arcade Physics
    ├── data/
    │   ├── levels.ts           # Per-realm identity, arena geometry, difficulty tuning (953 lines, all 6 realms)
    │   ├── characters.ts       # G-ONE / Ra-One combat tuning constants
    │   ├── story.ts            # Cinematic cues, realm transitions, ending copy
    │   ├── realms.ts           # Per-stage backdrop/label configuration
    │   └── relics.ts           # The six relic definitions
    ├── entities/               # GOne, RaOne, Projectile, Enemy, Hazard, PowerUp, DynamicPlatform, StaticHazard
    ├── scenes/
    │   ├── BootScene.ts → PreloadScene.ts → MainMenuScene.ts → ArenaScene.ts → VictoryScene.ts / DefeatScene.ts
    │   └── ArenaScene.ts       # The core gameplay scene — all combat, traversal, and progression logic
    ├── systems/
    │   ├── EventBus.ts                 # SSR-safe Phaser↔React event bridge
    │   ├── LevelState.ts               # Single source of truth for current realm/stage HUD identity
    │   ├── SaveManager.ts              # localStorage progress/settings persistence
    │   ├── AudioManager.ts             # Procedural Web Audio synthesizer
    │   ├── Analytics.ts                # Vercel custom-event tracking wrapper
    │   ├── RootlineManager.ts / GravitasManager.ts / ProtocolOverrideManager.ts / ProtocolBreakManager.ts
    │   └── Level2Architecture.ts … Level6Architecture.ts  # Per-realm arena construction helpers
    ├── art/                    # Procedural vector/canvas art generation (palette, rig, enemies, fx, arena dressing)
    └── types/game.ts           # Shared TypeScript interfaces
```

Public assets live under `public/images/` — six realms' worth of stage background art (WebP, optimized during this audit — see §19) and the cinematic MP4 files.

---

## 13. Cinematic and Asset Production Workflow

Per the project owner's account: the teaser and per-realm reveal cinematics were generated using **Gemini Omni**, and the painted stage background artwork for each realm/stage was generated using **Gemini Nano Banana**. This document states that attribution as given, without inventing specific model versions, settings, or generation dates beyond what's been confirmed.

The runtime game engine (Phaser scenes, entity logic, combat systems, HUD, save system) is hand-built TypeScript, developed in an AI-assisted ("vibe-coded") workflow — distinct from the AI-generated creative assets (video and background art) described above. During this audit, the background art was further processed (resized and re-encoded to WebP) for web delivery performance — see §19; this re-encoding is a confirmed, applied engineering step, not part of the original generation.

---

## 14. Requirements

- **Node.js**: no explicit minimum is pinned in `package.json`; `@types/node@^20.17.10` implies a Node 20.x development target. Node 18.18+ should work for Next.js 15 but is unverified here.
- **npm**: the project uses `package-lock.json` (npm), not yarn/pnpm.
- **Browser**: any modern evergreen browser with WebGL/Canvas and HTML5 video support (Chrome, Firefox, Edge, Safari). No specific minimum version has been tested — see §19 for what's actually been verified versus assumed.
- No environment variables are required to run or build the project.

---

## 15. Installation and Local Development

```bash
# 1. Clone and enter the project
git clone <repository-url>
cd gOne-the_last_protocol

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# -> http://localhost:3000 (bound to 0.0.0.0, so it's reachable on your LAN too)

# 4. Type-check
npm run type-check

# 5. Lint
npm run lint

# 6. Production build
npm run build

# 7. Preview the production build
npm run start

# 8. Run the automated test suite
npm run test
```

---

## 16. Build and Deployment on Vercel

- **Build command**: `next build` (Vercel's default Next.js detection handles this automatically — no `vercel.json` is present or required).
- **Output**: a standard Next.js build; the app prerenders as static content (confirmed: `npm run build` reports all routes as `○ (Static)`).
- **Environment variables**: none required.
- **Headers**: baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are configured in `next.config.mjs`, added during this audit. No Content-Security-Policy is set — deliberately, since the app depends on local video/audio/WebGL and a CSP written without live testing against all of that risks silently breaking the cinematics.
- **Verifying a deployment**: load the deployed URL, confirm the main menu renders, the teaser plays, and `Initiate Protocol` reaches gameplay. Check the Vercel dashboard's Analytics tab for incoming page views once deployed (see §17).

---

## 17. Analytics and Engagement Tracking

Added during this audit. Two layers:

1. **Page views** — `@vercel/analytics`'s `<Analytics />` component in `src/app/layout.tsx`. This requires enabling **Web Analytics** for the project in the Vercel dashboard (Project → Analytics tab) — it does nothing until that's turned on, even though the package is installed.
2. **Custom gameplay events** — `src/game/systems/Analytics.ts`, fired at verified points in the actual code (not merely page navigation):

   | Event | Fires when |
   |---|---|
   | `game_loaded` | Phaser finishes initializing in `PreloadScene` |
   | `game_start_clicked` | The player clicks Initiate Protocol / Continue / the teaser's "Enter the Fracture" |
   | `cinematic_started` / `_completed` / `_skipped` | Per cinematic (intro or realm reveal), distinguishing natural playback end from a Space/click/error-recovery skip |
   | `gameplay_started` | First time `ArenaScene` creates in a session |
   | `level_started` | Every realm entry/restart, tagged with realm number |
   | `level_completed` | A realm's boss is defeated |
   | `player_defeated` | G-ONE's health reaches zero |

Every call is wrapped in a `typeof window` guard and a try/catch — analytics can never break gameplay, including when blocked by an ad-blocker or a privacy-focused browser.

**What this does and doesn't tell you**: page views (and their Referrers panel) will show traffic from a LinkedIn post once analytics is enabled and the post is live after that point — it cannot reconstruct visits from before analytics was turned on. `game_start_clicked` vs. `gameplay_started` gives you a start-button conversion rate; `cinematic_skipped` vs. `cinematic_completed` gives you a watch-through rate for the teaser and reveals.

---

## 18. Testing and Quality Assurance

**Automated tests**: `vitest` (added during this audit) covers the pure, Phaser-free systems — `EventBus`, `SaveManager`, `LevelState`, and the `LEVELS`/`RELIC_DEFINITIONS` data tables. 26 tests across 5 files, all passing. Run with `npm run test` (single run) or `npm run test:watch`. Several tests directly guard against regressions found and fixed during this audit — e.g. `SaveManager`'s "progress only ever increases" invariant (Phase 9) and `EventBus`'s "one throwing listener doesn't break the others" guarantee (which `ArenaScene` leans on heavily).

Not yet covered: anything that imports Phaser (scenes, entities) or React (components) — both would need additional tooling (a Phaser-aware test harness / jsdom + React Testing Library respectively) beyond what's installed now. `npm run type-check` (`tsc --noEmit`) and `npm run lint` (ESLint 9) remain the other two automated gates, both passing.

**Manual verification performed during this audit**: `npm run type-check`, `npm run lint`, and `npm run build` were run after every code change described in this document and confirmed clean. Gameplay behavior itself (the actual bug fixes — transition race condition, pitfall/shield exploit, missing touch control, broken tutorial text, broken victory background) was verified by reading the exact code paths involved, not by manual in-browser play-testing — this document does not claim hands-on QA across devices/browsers that wasn't actually performed.

**Device/browser coverage**: not independently verified in this audit. See §19 for the honest state of that claim.

---

## 19. Performance and Compatibility

**Confirmed and fixed during this audit:**
- All 36 per-realm background images were 2752×1536 PNGs averaging ~7.5MB each (~280MB total), loaded unconditionally before the main menu could render, for every realm regardless of which one the player would actually play. Converted to resized (max 1920px wide), quality-82 WebP — **280MB → 6.4MB**, visually verified against the originals with no perceptible loss.
- Two duplicate video files (~64MB combined) were confirmed byte-for-byte identical to files still in active use, and removed.
- `public/images/` now totals ~140MB, entirely video.

**Not independently verified (no tooling available in this environment):**
- Cinematic video codec/bitrate/resolution was not inspected or re-encoded — no `ffmpeg`/`ffprobe` was available to do this safely. The ~140MB of video is the single largest remaining asset-performance opportunity in the project.
- Cross-browser testing (desktop Chrome/Firefox/Edge, mobile Safari/Chrome) was not performed in this audit — claims about compatibility beyond what the code itself guards against (e.g. autoplay-policy fallback handling in the cinematic components) are unverified.

**Mobile compatibility**: the Phaser Scale Manager uses `ENVELOP` mode (fills the viewport, crops the overflowing axis) with `autoCenter: CENTER_BOTH`, and touch input is enabled in `gameConfig.ts`. All five core combat abilities now have touch controls (Arc Burst was missing until this audit). The realm-specific `F`-bound tether abilities rely on Phaser's unified pointer input, which should cover taps, but this has not been confirmed on a physical touch device.

---

## 20. Security Considerations

- **No backend, no secrets**: confirmed via `npm audit` (0 vulnerabilities, dev and prod) and a source-wide check for hardcoded credentials, `dangerouslySetInnerHTML`/`innerHTML`, `eval`, and committed `.env` files — none found.
- **Baseline HTTP security headers** were added to `next.config.mjs` during this audit (see §16). No CSP is set, deliberately, for the reason given there.
- **Client-side progression is not — and cannot be — tamper-proof.** `SaveManager` stores unlocked-realm progress in plain `localStorage`, and several debug URL parameters (`?level=`, `?spawnX=`, `?stage=`, `?autoplay=true`) let a player jump directly to any realm/stage. This is a confirmed, reproducible local-state bypass, not a traditional vulnerability: there is no backend, no other user, and no trusted shared state for it to compromise. Adding server-side validation here would mean standing up a backend this single-player game doesn't otherwise need. Documented as an accepted boundary, not fixed.

---

## 21. Known Issues and Limitations

Confirmed, reproducible issues found and fixed during this audit (kept here for the record; all are resolved in the current code):
- A level-transition prompt in `ArenaScene.ts` could leave stale `window` event listeners attached if the scene was torn down any way other than clicking/pressing through it, causing a later keypress/click to silently restart a dead scene instance. **Fixed.**
- Aegis Shield voided all pitfall/fall damage entirely (a shield check meant for projectiles was incorrectly also applied to environmental hazard damage). **Fixed.**
- Every `SHOW_TUTORIAL` event across all six realms (~35 call sites) used field names (`instruction`/`timeout`) that didn't match what the HUD's `TutorialPanel` expected (`prompt`/`duration`) — every in-stage tutorial popup rendered with blank body text. **Fixed.**
- `VictoryScreen.tsx` referenced a background image file that did not exist in the project (`bg_victory.png`), so the game's final victory screen silently rendered with no background art. **Fixed** — falls back to the Phaser-rendered victory backdrop instead.
- Arc Burst had no touch-control equivalent, making it unusable on mobile. **Fixed.**
- A large narrative-paragraph subtitle fired on every single stage crossing across all six realms, obstructing the gameplay viewport. **Fixed** — removed in favor of the existing compact HUD objective chip and tutorial panel, which already carried the same information.

**Open, unresolved, or intentionally undecided:**
- Realm I's boss-defeat flow tells the player to "claim the Protocol Fragment," but the realm transition fires automatically ~1.2s later regardless of whether the fragment was actually collected — fragment collection currently reads as cosmetic/narrative rather than a progression gate. Not changed, since it's unclear whether that's intentional.
- Realms V and VI have no reveal-cinematic video configured in `story.ts`'s `REALM_REVEALS` — unverified whether this is a content gap or intentional (e.g. footage not yet produced for those realms).
- Cinematic video files remain unoptimized (see §19) pending access to video-processing tooling.
- Debug URL parameters remain active in production (see §20) — an accepted, documented boundary, not a defect.

---

## 22. Troubleshooting

- **Black screen on load**: check the browser console for errors. `GameCanvas.tsx` now shows a "Protocol failed to initialise" recovery screen with a Reload button if Phaser itself fails to start (e.g. unsupported WebGL) — if you see a fully blank screen with no recovery UI at all, that's a new, unreported failure mode worth filing.
- **Cinematic won't play / is silent**: browsers block audible autoplay without a user gesture. Both `IntroCinematic.tsx` and `LevelRevealCinematic.tsx` detect this (`NotAllowedError`/`AbortError`) and present an explicit "Play — Sound On" button instead of silently failing.
- **Cinematic won't skip**: Space, Enter, or a click should all work; if none do, the cinematic has likely hit its `error` phase (video failed to decode/load) and should show a "Continue" button automatically.
- **No audio**: `AudioManager` requires a user gesture to unsuspend the Web Audio `AudioContext` (browser policy) — click or press any key once.
- **Progression looks wrong after editing localStorage or using debug URL params**: this is expected client-side behavior, not a bug — see §20.
- **Touch controls not responding**: confirm the browser reports a touch-capable device (`TouchControls.tsx` gates on `ontouchstart`/`navigator.maxTouchPoints`); this has not been verified on a physical device during this audit.

---

## 23. Future Improvements

Reasonable, not-yet-implemented ideas — not commitments:
- Re-encode the cinematic MP4s (resolution/bitrate pass) once a proper video toolchain is available.
- Migrate the remaining `<img>` tags (`EndingScreen.tsx`, `LevelTransitionScreen.tsx`, `MainMenu.tsx`) to `next/image` for automatic responsive sizing (currently only flagged by ESLint, not acted on, since it's a larger structural change than a straight swap).
- Resolve the Realm I fragment-collection ambiguity one way or the other — either gate the transition on it, or drop the "claim the fragment" prompt.
- Produce (or confirm the absence of) reveal cinematics for Realms V and VI.
- Extend automated test coverage to Phaser scenes/entities and React components, which need additional tooling (a Phaser-aware harness, jsdom + React Testing Library) beyond the Vitest setup added for pure-logic modules in this audit.

---

## 24. Credits and AI-Assisted Development

This project was built through an AI-assisted, "vibe-coded" development workflow. Per the project owner's account: cinematic video sequences were generated with **Gemini Omni**, and per-realm background artwork was generated with **Gemini Nano Banana**. AI-assisted code and AI-generated assets were both reviewed and iterated on, not accepted uncritically — AI assistance does not by itself guarantee bug-free or secure code, which is the premise of this audit document existing at all.

---

## 25. License and Asset Rights

**No LICENSE file exists in this repository.** An earlier version of this README claimed an MIT license; that claim was not backed by an actual license file and has been removed rather than carried forward. If you intend to distribute, relicense, or commercialize this project, add an explicit license file reflecting your actual intent first.

Separately, verify the usage and redistribution terms of the AI-generated video and image assets (§24) with their respective generation platforms before any commercial use — AI-generated assets are not automatically free of all licensing considerations.
