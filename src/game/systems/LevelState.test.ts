import { describe, it, expect } from 'vitest';
import { LevelState } from './LevelState';

describe('LevelState', () => {
  it('starts as the Realm I default before any level loads', () => {
    const state = LevelState.get();
    expect(state.level).toBe(1);
    expect(state.name).toBeTruthy();
  });

  it('set() replaces the authoritative state, and get() returns a copy of it', () => {
    LevelState.set({ level: 3, name: 'THE VERDANT ABYSS', subtitle: 'Realm III' });
    const a = LevelState.get();
    expect(a.level).toBe(3);
    expect(a.name).toBe('THE VERDANT ABYSS');

    // Mutating the returned object must not corrupt the internal state —
    // GameHUD and other consumers read this on every render.
    a.name = 'TAMPERED';
    expect(LevelState.get().name).toBe('THE VERDANT ABYSS');
  });

  it('isLevel2() reflects whatever was last set()', () => {
    LevelState.set({ level: 2, name: 'INFERNAL FORTRESS', subtitle: 'Realm II' });
    expect(LevelState.isLevel2()).toBe(true);

    LevelState.set({ level: 1, name: 'SHATTERED SKIES', subtitle: 'Realm I' });
    expect(LevelState.isLevel2()).toBe(false);
  });
});
