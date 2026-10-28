import { describe, it, expect } from 'vitest';
import { RELIC_DEFINITIONS } from './relics';

describe('RELIC_DEFINITIONS', () => {
  const entries = Object.entries(RELIC_DEFINITIONS);

  it('has exactly the six documented relics', () => {
    expect(entries).toHaveLength(6);
  });

  it('every relic key matches its own declared id', () => {
    // GameHUD and PowerUpManager both key off this id — a mismatch here would
    // mean a relic silently fails to display or stack correctly.
    for (const [key, relic] of entries) {
      expect(relic.id).toBe(key);
    }
  });

  it('every relic has non-empty display text', () => {
    for (const [, relic] of entries) {
      expect(relic.name.length).toBeGreaterThan(0);
      expect(relic.tagline.length).toBeGreaterThan(0);
      expect(relic.description.length).toBeGreaterThan(0);
    }
  });

  it('every relic duration is zero (instant) or positive, never negative', () => {
    for (const [, relic] of entries) {
      expect(relic.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('every relic color is a valid 24-bit hex value', () => {
    for (const [, relic] of entries) {
      expect(relic.color).toBeGreaterThanOrEqual(0);
      expect(relic.color).toBeLessThanOrEqual(0xffffff);
    }
  });
});
