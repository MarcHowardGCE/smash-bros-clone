/**
 * @fileoverview Human player controller for local offline matches.
 *
 * Wraps {@link InputManager} to satisfy the {@link ITickController} interface
 * used by {@link LocalMatch}. Each frame, {@link LocalPlayerController.pollInput}
 * returns the latest keyboard + gamepad input event for this player's slot.
 */
import type { InputEvent, PlayerId } from '@smash/shared';
import { InputManager } from '../input/InputManager.js';
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
   * @param config - Player config including playerId, slotIndex, keymap, and optional gamepad source
   */
  constructor(config: LocalPlayerConfig) {
    this.playerId = config.playerId;
    this.slotIndex = config.slotIndex;
    this.inputManager = new InputManager(
      config.keymap,
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
