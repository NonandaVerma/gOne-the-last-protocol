import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from './SaveManager';

/** Minimal in-memory localStorage stand-in — enough for SaveManager's get/set/remove usage. */
function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  } as Storage;
}

beforeEach(() => {
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', makeMemoryStorage());
});

describe('SaveManager', () => {
  it('defaults to realm 1 unlocked on a fresh save', () => {
    expect(SaveManager.getUnlockedLevel()).toBe(1);
    expect(SaveManager.getLastLevel()).toBe(1);
  });

  it('saveUnlockedLevel only ever raises progress, never lowers it', () => {
    // This is the exact invariant Phase 9 (progression integrity) depends on:
    // a later, lower-numbered save call must not silently un-unlock a realm
    // the player already reached.
    SaveManager.saveUnlockedLevel(4);
    expect(SaveManager.getUnlockedLevel()).toBe(4);

    SaveManager.saveUnlockedLevel(2);
    expect(SaveManager.getUnlockedLevel()).toBe(4);

    SaveManager.saveUnlockedLevel(6);
    expect(SaveManager.getUnlockedLevel()).toBe(6);
  });

  it('setLastLevel also unlocks that level as a side effect', () => {
    SaveManager.setLastLevel(3);
    expect(SaveManager.getLastLevel()).toBe(3);
    expect(SaveManager.getUnlockedLevel()).toBe(3);
  });

  it('tracks per-realm reveal-seen state independently', () => {
    expect(SaveManager.hasSeenReveal(1)).toBe(false);
    SaveManager.markRevealSeen(1);
    expect(SaveManager.hasSeenReveal(1)).toBe(true);
    expect(SaveManager.hasSeenReveal(2)).toBe(false);
  });

  it('resetProgress clears unlocked level, last level, and all reveal flags', () => {
    SaveManager.saveUnlockedLevel(5);
    SaveManager.markRevealSeen(1);
    SaveManager.markRevealSeen(2);

    SaveManager.resetProgress();

    expect(SaveManager.getUnlockedLevel()).toBe(1);
    expect(SaveManager.getLastLevel()).toBe(1);
    expect(SaveManager.hasSeenReveal(1)).toBe(false);
    expect(SaveManager.hasSeenReveal(2)).toBe(false);
  });

  it('never throws when localStorage itself throws (private-browsing mode)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage disabled');
      },
      setItem: () => {
        throw new Error('storage disabled');
      },
      removeItem: () => {
        throw new Error('storage disabled');
      },
    } as unknown as Storage);

    expect(() => SaveManager.getUnlockedLevel()).not.toThrow();
    expect(() => SaveManager.saveUnlockedLevel(3)).not.toThrow();
    expect(() => SaveManager.resetProgress()).not.toThrow();
    expect(SaveManager.getUnlockedLevel()).toBe(1);
  });

  it('getSettings falls back to defaults when nothing is saved yet', () => {
    const settings = SaveManager.getSettings();
    expect(settings.masterVolume).toBeGreaterThan(0);
    expect(typeof settings.soundEnabled).toBe('boolean');
  });
});
