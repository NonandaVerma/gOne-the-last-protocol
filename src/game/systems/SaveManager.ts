import { GameSettings } from '../types/game';

const SETTINGS_KEY = 'gone_protocol_settings_v1';
const PROGRESS_KEY = 'gone_protocol_progress_v1';

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

  public static getUnlockedLevel(): number {
    if (typeof window === 'undefined') return 1;
    try {
      const level = localStorage.getItem(PROGRESS_KEY);
      return level ? parseInt(level, 10) || 1 : 1;
    } catch {
      return 1;
    }
  }

  public static saveUnlockedLevel(level: number) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getUnlockedLevel();
      if (level > current) {
        localStorage.setItem(PROGRESS_KEY, level.toString());
      }
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }

  public static resetProgress() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {}
  }
}
