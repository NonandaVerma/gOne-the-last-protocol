import { GameSettings } from '../types/game';

const SETTINGS_KEY = 'gone_protocol_settings_v1';
const PROGRESS_KEY = 'gone_protocol_progress_v1';
const LAST_LEVEL_KEY = 'gone_protocol_last_level_v1';

const PROGRESS_KEYS = [
  'gone_protocol_last_level_v1',
  'gone_protocol_progress_v1',
  'gone_protocol_progress',
  'gone_protocol_level',
  'gone_last_level',
  'gone_level',
  'last_level',
  'unlocked_level',
];

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  screenShake: true,
  reducedMotion: false,
  soundEnabled: true,
};

export class SaveManager {
  public static getSettings(): GameSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: GameSettings) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  /** Returns highest unlocked level across all fallback keys. */
  public static getUnlockedLevel(): number {
    if (typeof window === 'undefined') return 1;
    try {
      let highest = 1;
      for (const key of PROGRESS_KEYS) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = parseInt(val, 10);
          if (parsed >= 1 && parsed <= 6 && parsed > highest) {
            highest = parsed;
          }
        }
      }
      return highest;
    } catch {
      return 1;
    }
  }

  /** Returns the most recently attempted or selected realm level. */
  public static getLastLevel(): number {
    if (typeof window === 'undefined') return 1;
    try {
      const last = localStorage.getItem(LAST_LEVEL_KEY);
      if (last) {
        const parsed = parseInt(last, 10);
        if (parsed >= 1 && parsed <= 6) return Math.max(parsed, this.getUnlockedLevel());
      }
      return this.getUnlockedLevel();
    } catch {
      return 1;
    }
  }

  /** Saves the player's last attempted level and updates progression. */
  public static setLastLevel(level: number) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_LEVEL_KEY, level.toString());
      this.saveUnlockedLevel(level);
    } catch (e) {
      console.warn('Failed to save last level:', e);
    }
  }

  public static saveUnlockedLevel(level: number) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getUnlockedLevel();
      const highest = Math.max(current, level);
      localStorage.setItem(PROGRESS_KEY, highest.toString());
      localStorage.setItem(LAST_LEVEL_KEY, highest.toString());
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }

  public static hasSeenReveal(level: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`gone_seen_reveal_${level}`) === 'true';
    } catch {
      return false;
    }
  }

  public static markRevealSeen(level: number) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`gone_seen_reveal_${level}`, 'true');
    } catch {}
  }

  public static resetProgress() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(LAST_LEVEL_KEY);
      for (const k of PROGRESS_KEYS) {
        localStorage.removeItem(k);
      }
      for (let lvl = 1; lvl <= 6; lvl++) {
        localStorage.removeItem(`gone_seen_reveal_${lvl}`);
      }
    } catch {}
  }
}
