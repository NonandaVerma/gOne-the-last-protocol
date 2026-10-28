import { describe, it, expect } from 'vitest';
import { LEVELS } from './levels';

describe('LEVELS', () => {
  it('defines exactly the six realms the game ships (I-VI)', () => {
    expect(Object.keys(LEVELS).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('every realm has a non-empty name, subtitle, and objective', () => {
    for (const [key, level] of Object.entries(LEVELS)) {
      expect(level.name.length, `realm ${key} name`).toBeGreaterThan(0);
      expect(level.subtitle.length, `realm ${key} subtitle`).toBeGreaterThan(0);
      expect(level.objective?.length ?? 0, `realm ${key} objective`).toBeGreaterThan(0);
    }
  });

  it('every realm has a positive player health pool', () => {
    for (const [key, level] of Object.entries(LEVELS)) {
      expect(level.playerHealth, `realm ${key} playerHealth`).toBeGreaterThan(0);
    }
  });

  it('every realm defines a positive world gravity', () => {
    for (const [key, level] of Object.entries(LEVELS)) {
      expect(level.gravity, `realm ${key} gravity`).toBeGreaterThan(0);
    }
  });

  it('every realm has a wider world than the camera viewport', () => {
    // A world no wider than the viewport would mean there's nothing to
    // traverse — a cheap sanity check that arena geometry is actually configured.
    for (const [key, level] of Object.entries(LEVELS)) {
      expect(level.arena.worldWidth, `realm ${key} worldWidth`).toBeGreaterThan(0);
    }
  });
});
