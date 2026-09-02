/**
 * @fileoverview Audio preferences persistence layer.
 *
 * Stores and retrieves audio settings (volume + muted state) using an injected
 * {@link StorageAdapter} (compatible with `localStorage` / `sessionStorage`).
 *
 * Designed for graceful degradation: corrupt or missing storage data always
 * returns sensible defaults rather than throwing.
 */

/**
 * Injected storage adapter interface.
 * Matches localStorage/sessionStorage API: getItem/setItem with nullable string values.
 */
export interface StorageAdapter {
  /**
   * Retrieve a value by key.
   * @returns The stored value, or null if not found.
   */
  getItem(key: string): string | null;

  /**
   * Store a value by key.
   */
  setItem(key: string, value: string): void;
}

/**
 * Audio preferences: volume (0–1) and muted state.
 */
export interface AudioPreferences {
  /** Playback volume level (0.0–1.0). */
  volume: number;
  /** Whether audio is muted. */
  muted: boolean;
}

/** Storage key for persisted audio preferences. */
export const AUDIO_PREFERENCES_KEY = 'smash:audio-prefs';

/** Default audio preferences: 30% volume, not muted. */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  volume: 0.3,
  muted: false,
};

/**
 * Load audio preferences from storage.
 *
 * On missing or corrupt JSON, returns defaults without throwing (graceful degradation).
 * Sanitizes individual fields: volume is clamped to [0,1], muted is coerced to boolean.
 *
 * @param storage - Injected storage adapter
 * @returns Audio preferences with validated/sanitized fields
 */
export function loadAudioPreferences(storage: StorageAdapter): AudioPreferences {
  const json = storage.getItem(AUDIO_PREFERENCES_KEY);

  // Missing key → return defaults
  if (json === null) {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }

  // Parse JSON; on error, return defaults (do not throw)
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }

  // Ensure it's an object; if not, return defaults
  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }

  const obj = parsed as Record<string, unknown>;

  // Sanitize volume: must be a number in [0,1]
  let volume = DEFAULT_AUDIO_PREFERENCES.volume;
  if (typeof obj.volume === 'number') {
    volume = Math.max(0, Math.min(1, obj.volume));
  }

  // Sanitize muted: must be a boolean
  let muted = DEFAULT_AUDIO_PREFERENCES.muted;
  if (typeof obj.muted === 'boolean') {
    muted = obj.muted;
  }

  return { volume, muted };
}

/**
 * Save audio preferences to storage as JSON.
 *
 * Clamps volume to [0,1] before writing.
 *
 * @param storage - Injected storage adapter
 * @param prefs - Preferences to persist
 */
export function saveAudioPreferences(
  storage: StorageAdapter,
  prefs: AudioPreferences
): void {
  const sanitized: AudioPreferences = {
    volume: Math.max(0, Math.min(1, prefs.volume)),
    muted: Boolean(prefs.muted),
  };
  const json = JSON.stringify(sanitized);
  storage.setItem(AUDIO_PREFERENCES_KEY, json);
}
