export interface LevelMetadata {
  level: number;
  name: string;
  subtitle: string;
  objective?: string;
}

/**
 * Authoritative single source of truth for the active realm and level identity.
 * Avoids asynchronous React mount timing bugs where GameHUD missed the initial LEVEL_LOADED event.
 */
export class LevelState {
  private static current: LevelMetadata = {
    level: 1,
    name: 'SHATTERED SKIES',
    subtitle: 'Realm I — The First Fracture',
    objective: 'Restore the power conduits, cross the fractured skyways, and secure Protocol Fragment I.',
  };

  public static set(meta: LevelMetadata) {
    this.current = { ...meta };
  }

  public static get(): LevelMetadata {
    return { ...this.current };
  }

  public static isLevel2(): boolean {
    return this.current.level === 2;
  }
}
