import { describe, it, expect, vi } from 'vitest';
import { GAME_EVENTS } from './EventBus';

// Each test gets its own emitter instance via a fresh module import, since the
// exported `EventBus` is a shared singleton — reusing it across tests would
// leak listeners between cases.
async function freshEventBus() {
  vi.resetModules();
  const mod = await import('./EventBus');
  return mod.EventBus;
}

describe('EventBus', () => {
  it('delivers an emitted event to a registered listener', async () => {
    const bus = await freshEventBus();
    const fn = vi.fn();
    bus.on('test-event', fn);
    bus.emit('test-event', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('stops delivering to a listener after off() removes it', async () => {
    const bus = await freshEventBus();
    const fn = vi.fn();
    bus.on('test-event', fn);
    bus.off('test-event', fn);
    bus.emit('test-event');
    expect(fn).not.toHaveBeenCalled();
  });

  it('once() fires exactly one time', async () => {
    const bus = await freshEventBus();
    const fn = vi.fn();
    bus.once('test-event', fn);
    bus.emit('test-event');
    bus.emit('test-event');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('a throwing listener does not prevent other listeners from running', async () => {
    // Regression guard: this is what keeps one bad handler (e.g. a React
    // component mid-unmount) from silently swallowing every other system
    // listening on the same event — ArenaScene relies on this heavily.
    const bus = await freshEventBus();
    const good = vi.fn();
    bus.on('test-event', () => {
      throw new Error('boom');
    });
    bus.on('test-event', good);
    expect(() => bus.emit('test-event')).not.toThrow();
    expect(good).toHaveBeenCalled();
  });

  it('removeAllListeners() clears every registered event', async () => {
    const bus = await freshEventBus();
    const fn = vi.fn();
    bus.on('test-event', fn);
    bus.removeAllListeners();
    bus.emit('test-event');
    expect(fn).not.toHaveBeenCalled();
  });

  it('GAME_EVENTS has no duplicate event-name values', () => {
    // A typo that collides two distinct event constants onto the same string
    // would silently cross-wire unrelated systems (e.g. a boss-state listener
    // firing on a settings change). This is the cheapest possible guard against it.
    const values = Object.values(GAME_EVENTS);
    expect(new Set(values).size).toBe(values.length);
  });
});
