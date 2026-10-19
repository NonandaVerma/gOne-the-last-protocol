import * as Phaser from 'phaser';
import { buildGOne } from '../art/gone';
import { buildRaOne } from '../art/raone';
import { buildFx } from '../art/fx';
import { buildArena } from '../art/arena';
import { buildRelics } from '../art/relics';

/**
 * Bakes every texture and animation the game needs.
 *
 * The project ships with no binary art assets on purpose: all sprites are
 * generated at boot from vector drawing code (see `src/game/art/*`). Characters
 * are baked as real multi-frame spritesheets off a shared humanoid rig, so the
 * animation system is identical to one driven by hand-drawn sheets - dropping in
 * PNG spritesheets later only means changing the loader, not the gameplay code.
 */
export class ProceduralTextureFactory {
  public static generateAllTextures(scene: Phaser.Scene) {
    buildFx(scene);
    buildGOne(scene);
    buildRaOne(scene);
    buildArena(scene);
    buildRelics(scene);
  }

  /**
   * True when a texture is present. Used by entities to degrade gracefully
   * instead of crashing on a missing key.
   */
  public static has(scene: Phaser.Scene, key: string): boolean {
    const ok = scene.textures.exists(key);
    if (!ok && process.env.NODE_ENV !== 'production') {
      console.warn(`[G-ONE] Missing texture "${key}" - falling back to a placeholder.`);
    }
    return ok;
  }
}
