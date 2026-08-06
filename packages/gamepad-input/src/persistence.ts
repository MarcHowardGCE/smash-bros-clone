/**
 * Persistence layer for gamepad slot assignments.
 *
 * Uses gamepad.id (device name string) as the stable key, not gamepad.index
 * (which is reassigned across reconnects and browser restarts).
 *
 * Storage is injectable to allow for localStorage (browser), sessionStorage,
 * or test fakes without direct platform API dependencies.
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
 * A saved gamepad assignment: device ID → last known slot index.
 */
export interface SavedAssignment {
  /** Device identifier string from Gamepad.id (e.g., "Xbox 360 Controller (XInput STANDARD GAMEPAD)") */
  gamepadId: string;
  /** Last slot index this gamepad was assigned to (0–3) */
  lastSlotIndex: number;
}

/**
 * Manages persistence of gamepad → slot assignments.
 *
 * On load of corrupt or missing data, silently returns [] instead of throwing,
 * ensuring graceful degradation on malformed storage.
 */
export class GamepadPreferenceStore {
  private storage: StorageAdapter;
  private storageKey: string;

  /**
   * @param storage - Injected storage adapter (e.g., localStorage, sessionStorage, or test fake)
   * @param storageKey - Storage key for serialized assignments (default: 'smash:gamepad-prefs')
   */
  constructor(storage: StorageAdapter, storageKey = 'smash:gamepad-prefs') {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  /**
   * Persist an array of assignments to storage as JSON.
   *
   * @param assignments - Array of {gamepadId, lastSlotIndex} objects
   */
  save(assignments: SavedAssignment[]): void {
    const json = JSON.stringify(assignments);
    this.storage.setItem(this.storageKey, json);
  }

  /**
   * Load assignments from storage.
   *
   * On missing or corrupt JSON, returns [] without throwing (graceful degradation).
   *
   * @returns Array of saved assignments, or [] if storage is empty or malformed
   */
  load(): SavedAssignment[] {
    const json = this.storage.getItem(this.storageKey);

    // Missing key → return empty array
    if (json === null) {
      return [];
    }

    // Parse JSON; on error, return empty array (do not throw)
    try {
      const assignments = JSON.parse(json);

      // Ensure it's an array; if not, return []
      if (!Array.isArray(assignments)) {
        return [];
      }

      return assignments as SavedAssignment[];
    } catch {
      // Corrupt JSON → return empty array
      return [];
    }
  }

  /**
   * Look up the last slot assigned to a gamepad by its ID.
   *
   * @param gamepadId - Device identifier string
   * @returns The slot index (0–3), or null if not found
   */
  findSlotForGamepadId(gamepadId: string): number | null {
    const assignments = this.load();
    const found = assignments.find((a) => a.gamepadId === gamepadId);
    return found?.lastSlotIndex ?? null;
  }
}
