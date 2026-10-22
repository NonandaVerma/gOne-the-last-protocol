type EventCallback = (...args: any[]) => void;

class CustomEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public on(event: string, fn: EventCallback): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return this;
  }

  public once(event: string, fn: EventCallback): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      fn(...args);
    };
    return this.on(event, wrapper);
  }

  public off(event: string, fn?: EventCallback): this {
    if (!fn) {
      this.listeners.delete(event);
      return this;
    }
    const set = this.listeners.get(event);
    if (set) {
      set.delete(fn);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    // Clone set to prevent mutation issues if a listener unsubscribes during emit
    const callbacks = Array.from(set);
    callbacks.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`Error in EventBus listener for event "${event}":`, err);
      }
    });
    return true;
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Singleton EventBus instance to bridge Phaser scenes and React components safely in SSR and client
export const EventBus = new CustomEventEmitter();

// Event names as constants for strict typing and avoidance of typos
export const GAME_EVENTS = {
  // Game lifecycle
  SCENE_READY: 'scene-ready',
  GAME_STATE_CHANGED: 'game-state-changed',
  START_GAME: 'start-game',
  RESTART_LEVEL: 'restart-level',
  RESTART_STORY: 'restart-story',
  RESUME_GAME: 'resume-game',
  PAUSE_GAME: 'pause-game',
  QUIT_TO_MENU: 'quit-to-menu',
  NEXT_LEVEL: 'next-level',
  SKIP_INTRO: 'skip-intro',

  // Player state
  PLAYER_HEALTH_CHANGED: 'player-health-changed',
  PLAYER_DAMAGED: 'player-damaged',
  PLAYER_DIED: 'player-died',
  OVERDRIVE_CHANGED: 'overdrive-changed',
  OVERDRIVE_BURST: 'overdrive-burst',
  COOLDOWNS_CHANGED: 'cooldowns-changed',

  // Boss state
  BOSS_HEALTH_CHANGED: 'boss-health-changed',
  BOSS_DAMAGED: 'boss-damaged',
  BOSS_DIED: 'boss-died',
  BOSS_STATE_CHANGED: 'boss-state-changed',
  BOSS_PHASE_CHANGED: 'boss-phase-changed',

  // Level & story
  LEVEL_LOADED: 'level-loaded',
  STORY_STEP: 'story-step',
  /** Fired by Backdrop whenever a realm's internal stage backdrop changes. */
  STAGE_ANNOUNCED: 'stage-announced',
  SCREEN_SHAKE: 'screen-shake',

  // Settings
  SETTINGS_CHANGED: 'settings-changed',

  // Relics & Power-ups
  RELIC_COLLECTED: 'relic-collected',
  ACTIVE_RELICS_CHANGED: 'active-relics-changed',
  LEVEL_COMPLETED: 'level-completed',

  // Narration & Subtitles
  SHOW_SUBTITLE: 'show-subtitle',
  HIDE_SUBTITLE: 'hide-subtitle',

  // Tutorials & Instructions
  SHOW_TUTORIAL: 'show-tutorial',
  HIDE_TUTORIAL: 'hide-tutorial',
  INTERACTION_PROMPT: 'interaction-prompt',

  // Input triggers from React UI (e.g. mobile virtual buttons or HUD clicks)
  TRIGGER_MOVE_LEFT: 'trigger-move-left',
  TRIGGER_MOVE_RIGHT: 'trigger-move-right',
  TRIGGER_STOP_MOVE: 'trigger-stop-move',
  TRIGGER_JUMP: 'trigger-jump',
  TRIGGER_SHOOT: 'trigger-shoot',
  TRIGGER_SHIELD: 'trigger-shield',
  TRIGGER_ARC: 'trigger-arc',
  TRIGGER_DASH: 'trigger-dash',
  TRIGGER_OVERDRIVE: 'trigger-overdrive',
} as const;
