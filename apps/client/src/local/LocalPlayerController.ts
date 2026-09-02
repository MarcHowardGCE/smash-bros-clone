/**
 * @fileoverview Human player controller for local offline matches.
 *
 * Wraps {@link InputManager} to satisfy the {@link ITickController} interface
 * used by {@link LocalMatch}. Each frame, {@link LocalPlayerController.pollInput}
 * returns the latest keyboard + gamepad input event for this player's slot.
 */
import type { InputEvent, PlayerId } from '@smash/shared';
import { InputManager } from '../input/InputManager.js';
import { DEFAULT_KEYMAP_P1, convertPersistedKeymap } from '../input/keymaps.js';
import { SettingsStore } from '../settings/SettingsStore.js';
import type { LocalPlayerConfig } from './types.js';

/**
 * Human player controller for local offline matches.
 *
 * Wraps {@link InputManager} with the {@link ITickController} interface so
 * {@link LocalMatch} can poll it uniformly alongside AI controllers.
 */
export class LocalPlayerController {
  readonly playerId: PlayerId;
  readonly slotIndex: number;
  private readonly inputManager: InputManager;

  /**
   * Create a human player controller.
   *
   * Loads the keymap from SettingsStore if available, else falls back to DEFAULT_KEYMAP_P1.
   *
   * @param config - Player config including playerId, slotIndex, keymap, and optional gamepad source
   */
  constructor(config: LocalPlayerConfig) {
    this.playerId = config.playerId;
    this.slotIndex = config.slotIndex;

    // Load keymap from SettingsStore; fall back to config.keymap or DEFAULT_KEYMAP_P1
    let keymap = config.keymap;
    try {
      const settings = new SettingsStore();
      settings.load();
      const persistedKeymap = settings.get('keymapP1');
      if (persistedKeymap && Object.keys(persistedKeymap).length > 0) {
        keymap = convertPersistedKeymap(persistedKeymap);
      }
    } catch (error) {
      // SettingsStore load failed; gracefully fall back to config keymap
      console.warn('Failed to load keymap from SettingsStore, using default:', error);
    }

    this.inputManager = new InputManager(
      keymap,
      config.playerId,
      config.gamepadSource ?? null
    );
  }

  pollInput(): InputEvent | null {
    return this.inputManager.pollInput();
  }

  setTick(tick: number): void {
    this.inputManager.setCurrentTick(tick);
  }

  destroy(): void {
    this.inputManager.destroy();
  }
}
