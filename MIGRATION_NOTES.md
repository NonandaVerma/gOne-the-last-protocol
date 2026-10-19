# G-ONE: THE LAST PROTOCOL — MIGRATION & ARCHITECTURAL REPORT

## 1. Executive Summary

This document records the comprehensive architectural modernization, Phaser 4 migration, dependency and security audit, critical bug resolution, and content completion for **G-ONE: THE LAST PROTOCOL**.

- **Game Engine**: Migrated from Phaser 3 to Phaser 4 (`phaser@^4.2.1`).
- **Framework**: Modernized to Next.js `15.5.28` (LTS patched against critical CVEs while maintaining full React 18.3.1 compatibility).
- **Linter & Tooling**: Upgraded to ESLint `9.20.0` with flat/legacy compatible configuration, eliminating all deprecated packages (`rimraf@3`, `inflight@1`, `@humanwhocodes/*`, `glob@7`).
- **Security Audit**: Eliminated all Critical and High production runtime vulnerabilities; resolved PostCSS XSS / path traversal / CPU exhaustion via npm overrides (`postcss@^8.5.30`, `postcss-selector-parser@^7.1.6`).
- **Gameplay Completeness**: All 3 levels (Chapter I, II, III), 6 mythological power-up relics, dual endings (Light Survives vs Evil Prevails), and audio/visual juice are fully playable and verified.

---

## 2. Dependency Modernization & Security Remediation

### 2.1 Next.js Critical Vulnerabilities (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4)
- **Problem**: Next.js 14 had critical Remote Code Execution (RCE), request smuggling, and SSRF advisories. Upgrading directly to Next.js 16 would require React 19, breaking Phaser 3/4 canvas integration and React bindings.
- **Solution**: Upgraded to `next@15.5.28`, which backports all critical security fixes and is officially compatible with React 18.3.1.
- **Verification**: Zero critical vulnerabilities reported. Clean compilation via `npm run build`.

### 2.2 Deprecated Tooling Elimination
- `rimraf@3.0.2` & `inflight@1.0.6`: Removed via upgrade from ESLint 8.57 to ESLint 9.20.0.
- `@humanwhocodes/config-array` & `@humanwhocodes/object-schema`: Replaced with maintained `@eslint/config-array` and `@eslint/object-schema`.
- `glob@7.2.3`: Replaced with modern glob / fast-glob.

### 2.3 PostCSS & Selector Parser Overrides
- **Problem**: Transitive PostCSS dependencies in Tailwind 3.4 had parsing and CPU exhaustion advisories.
- **Solution**: Declared explicit npm overrides in `package.json`:
  ```json
  "overrides": {
    "postcss": "^8.5.30",
    "postcss-selector-parser": "^7.1.6"
  }
  ```
- **Verification**: `npm ls postcss` confirms resolved version is `8.5.30`.

### 2.4 Build-time Dependency Isolation: `braces@3.0.3`
- **Context**: `braces <= 3.0.3` has advisory GHSA-vfj7-8cjw-p6xm.
- **Resolution**: `3.0.3` is currently the highest published version on npm. Resolving it via `npm audit fix --force` would install Tailwind CSS v4, introducing breaking styling shifts across all UI components. Because this vulnerability is build-time/dev-only within chokidar file watching and fast-glob (isolated from the client browser runtime), keeping Tailwind 3.4.17 with `braces@3.0.3` preserves styling fidelity while introducing zero runtime risk to players.

### 2.5 Native Script Verification: `unrs-resolver`
- **Audit**: Verified `unrs-resolver@1.12.2` as a legitimate Rust-based native N-API resolver for TypeScript imports. Approved via `npm install-scripts approve unrs-resolver`.

---

## 3. Phaser 4 Migration Details

### 3.1 PostFX Pipeline to Unified Filters
- **Phaser 3 Legacy**: `sprite.postFX.addGlow(...)`
- **Phaser 4 Implementation**:
  ```typescript
  if ((sprite as any).enableFilters && (sprite as any).filters?.internal) {
    (sprite as any).enableFilters();
    (sprite as any).filters.internal.addGlow(color, 2, 0, false, 0.1, 10);
  }
  ```
  Applied in `src/game/entities/GOne.ts` and `src/game/entities/RaOne.ts`.

### 3.2 Tint Fill Migration
- **Phaser 3 Legacy**: `sprite.setTintFill(0xffffff)` (removed in Phaser 4).
- **Phaser 4 Implementation**:
  ```typescript
  if ((Phaser as any).TintModes?.FILL) {
    sprite.setTint(0xffffff).setTintMode((Phaser as any).TintModes.FILL);
  } else {
    sprite.setTint(0xffffff);
  }
  ```
  Guarantees damage flash rendering across all canvas/WebGL render pipelines without throwing undefined method exceptions.

### 3.3 Canvas Keyboard Capture
- Enabled `windowEvents: true` in `gameConfig.ts` to prevent Phaser from conflicting with React DOM events or capturing outside typing.

---

## 4. Critical Bug Fixes

### 4.1 Unexpected Hindi / IME Text Input Bug
- **Symptom**: Pressing combat controls (Space, WASD, JKL) triggered random Hindi characters (`र`, `त`, `क`) in browser inputs or address bar.
- **Root Cause**: Unfocused Phaser canvas allowed key events to bubble up to active DOM inputs or trigger operating system IME input editors when focused on buttons.
- **Fix**:
  1. Handled `compositionstart` in `GameCanvas.tsx` to suppress unwanted IME composition while leaving standard `KeyboardEvent` flow uninhibited.
  2. Canvas container configured with `tabIndex={0}` and auto-focused on click.
  3. Registered Phaser `addCapture([SPACE, UP, DOWN, LEFT, RIGHT])` in `ArenaScene.ts` so space and arrow keys don't scroll the webpage while ensuring Phaser receives and processes every keydown/keyup event without `event.defaultPrevented` drops.
  4. All UI buttons (`MainMenu`, `GameHUD`, `PauseMenu`, `SettingsMenu`, `GameOverScreen`, `VictoryScreen`) execute `e.currentTarget.blur()` on click to immediately drop DOM focus.

### 4.2 Player Death Freeze Bug
- **Symptom**: When G-One reaches 0 HP, game froze on a black screen or locked up indefinitely.
- **Root Cause**: `GOne.die()` was invoking nested cascading timeouts (`delayedCall(900, ... delayedCall(1400, ...))`), while Ra-One continued attacking and creating colliders against a dead entity body.
- **Fix**:
  1. Disabled physics body immediately upon fatal damage: `this.disableBody(true, false)`.
  2. Emitted `GAME_EVENTS.PLAYER_DIED` and `GAME_EVENTS.DEFEAT` deterministically with a single clean transition.
  3. Added `isLevelEnding` state guards in `ArenaScene.ts` and `GOne.isDead` check to cancel enemy projectile targeting.

### 4.3 Level Progression Failure Bug
- **Symptom**: Defeating Ra-One caused duplicate victory triggers or failed to advance to Chapter II / Chapter III.
- **Root Cause**: Boss death animations triggered multiple damage callbacks per projectile frame, firing duplicate `BOSS_DIED` events.
- **Fix**:
  1. Added `isLevelEnding` latch in `ArenaScene.ts`.
  2. Cleared all active boss projectiles and hazards upon defeat.
  3. Implemented narrative transition screen between Level 1 -> Level 2 and Level 2 -> Level 3.

---

## 5. Mythological Visuals & Relic Power-Ups

### 5.1 Mythological Theme Overhaul
- **G-One**: Re-themed as the celestial Greek-divine guardian (Zeus/Athena armor, golden and cyan halos, laurel-crowned crest).
- **Ra-One**: Re-themed as the cataclysmic Viking/Norse destroyer (spiked war-helm, raven sigil, blood-red and magma-orange runic core).
- **Typography**: Google Fonts integrated into `layout.tsx` (`Cinzel Decorative`, `Cinzel`, `Cormorant Garamond`, `Inter`).

### 5.2 Functional Relics (`PowerUpManager`)
Six distinct mythological power-ups spawn dynamically in arenas:
1. **Aegis of Olympus**: Absorbs up to 2 incoming hits with an orbiting golden celestial shield.
2. **Thunderheart**: Infuses Pulse Shot with Zeus's lightning, doubling projectile damage for 10 seconds.
3. **Phoenix Core**: Restores 1 unit of divine health instantly.
4. **Hermes' Step**: Increases movement speed by 40% and cuts dash cooldown in half with winged golden footstep particles.
5. **Overdrive Shard**: Grants +50 Overdrive meter immediately.
6. **Rune of Ruin**: High risk/reward — doubles outgoing damage (+100%), but increases incoming damage taken by +1.

All relics are baked procedurally into textures at runtime via HTML5 Canvas in `src/game/art/relics.ts` and loaded by `ProceduralTextureFactory.ts`.

---

## 6. Three-Level Campaign Design

| Level | Name | Narrative Arc | Boss Mechanics | Player HP / Boss HP |
|---|---|---|---|---|
| **Level 1** | The Infernal Arena | The Impact Crater: G-One awakens to challenge Ra-One. | Ground melee, spread pulse shots, charged magma bursts. | 3 HP / 8 HP |
| **Level 2** | The Fallen Metropolis | The Corrupted Network: Ra-One takes to the air. | Flight/hovering, spread fire, falling debris hazards with visual telegraphs. | 3 HP / 8 HP |
| **Level 3** | The Zero-Day Abyss | Decisive Protocol: The final duel in the void. | Teleportation, charged death beams, ground surges, hyper-speed combat. Sudden death: **1 HP vs 1 HP**. | 1 HP / 1 HP |

Dual Endings:
- **Victory (Light Survives)**: Unlocked by defeating Level 3. G-One seals Ra-One into the core, preserving the mortal realm.
- **Defeat (Evil Prevails)**: Occurs upon player death in any level. Ra-One's corruption spreads, offering the player a chance to retry.

---

## 7. Verification Results

| Test / Check | Command | Result |
|---|---|---|
| **TypeScript Compilation** | `npm run type-check` | **0 errors (Pass)** |
| **ESLint Analysis** | `npm run lint` | **0 errors, 0 warnings (Pass)** |
| **Production Build** | `npm run build` | **Successfully compiled & prerendered (Pass)** |
| **Security Audit** | `npm audit` | **0 critical, 0 production vulnerabilities (Pass)** |
