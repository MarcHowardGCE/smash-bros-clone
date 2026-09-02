/**
 * @fileoverview localStorage-backed settings store with fallback to in-memory storage.
 *
 * Persists user preferences (volume, keybinds) under the key `smash:settings:v1`.
 * Private-mode browsers that throw on localStorage access fall back to in-memory storage.
 */

/** Settings data structure. */
export interface Settings {
  volume: number;
  keymapP1: Record<string, string>;
}

/** Default settings. */
const DEFAULT_SETTINGS: Settings = {
  volume: 0.7,
  keymapP1: {
    ArrowLeft: 'LEFT',
    KeyA: 'LEFT',
    ArrowRight: 'RIGHT',
    KeyD: 'RIGHT',
    ArrowUp: 'JUMP',
    KeyW: 'JUMP',
    KeyX: 'JUMP',
    ArrowDown: 'DOWN',
    KeyZ: 'ATTACK',
    KeyS: 'SPECIAL',
    ShiftLeft: 'SHIELD',
    ShiftRight: 'SHIELD',
    KeyC: 'GRAB',
  },
};

const STORAGE_KEY = 'smash:settings:v1';

/**
 * Manages settings persistence via localStorage with automatic fallback to in-memory storage.
 *
 * Private-mode browsers throw on localStorage access; this store catches and falls back
 * gracefully to in-memory storage. All methods are safe to call regardless of storage
 * availability.
 */
export class SettingsStore {
  private data: Settings = { ...DEFAULT_SETTINGS };
  private canUseStorage: boolean = true;

  /**
   * Load settings from localStorage. If unavailable or corrupt, load defaults.
   * Sets the fallback flag for subsequent operations.
   */
  load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        // Validate that parsed data has the expected shape
        if (
          typeof parsed.volume === 'number' &&
          typeof parsed.keymapP1 === 'object' &&
          parsed.keymapP1 !== null
        ) {
          this.data = parsed;
        } else {
          this.data = { ...DEFAULT_SETTINGS };
        }
      } else {
        this.data = { ...DEFAULT_SETTINGS };
      }
      this.canUseStorage = true;
    } catch (err) {
      // localStorage is unavailable (private mode, quota exceeded, etc.)
      this.data = { ...DEFAULT_SETTINGS };
      this.canUseStorage = false;
    }
  }

  /**
   * Save current settings to localStorage. If storage is unavailable, silently fail
   * (in-memory state is preserved).
   */
  save(): void {
    if (!this.canUseStorage) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      // Quota exceeded, privacy mode, or other storage error.
      // In-memory state is preserved; next reload will re-attempt storage.
      this.canUseStorage = false;
    }
  }

  /**
   * Get a setting value. Returns the current in-memory value.
   */
  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.data[key];
  }

  /**
   * Set a setting value and immediately persist to storage.
   */
  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.data[key] = value;
    this.save();
  }
}
