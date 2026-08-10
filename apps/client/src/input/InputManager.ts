/**
 * @fileoverview Keyboard + gamepad input polling and event emission.
 *
 * {@link InputManager} captures `keydown`/`keyup` events, merges them with an
 * optional {@link GamepadInputSource}, and produces {@link InputEvent} objects
 * on state change. Each frame the caller invokes {@link InputManager.pollInput};
 * the returned event (or null if nothing changed) is handed to the engine
 * and/or the network layer.
 */
import type { InputBitmask, InputEvent, PlayerId } from '@smash/shared';
import { DEFAULT_KEYMAP_P1 } from './keymaps.js';
import type { GamepadInputSource } from './GamepadInputSource.js';

/**
 * Polls keyboard and gamepad input, emitting {@link InputEvent} objects on state change.
 *
 * Merges keyboard bits with optional gamepad bits before computing pressed/released
 * diffs — this prevents false "released" events when one input device releases
 * while the other still holds the same action.
 */
export class InputManager {
  private currentHeld: InputBitmask = 0;
  private lastHeld: InputBitmask = 0;
  private seqCounter: number = 0;
  private playerId: PlayerId = '';
  private currentTick: number = 0;
  private readonly keymap: Record<string, InputBitmask>;
  private gamepadSource: GamepadInputSource | null = null;

  // Pending inputs for T14 (LocalPredictor) — stored here, used there
  readonly pendingInputs: InputEvent[] = [];

  /**
   * Create an InputManager and register keyboard listeners.
   *
   * @param keymap - Key-code to bitmask mapping (defaults to P1 layout)
   * @param playerId - Player ID stamped on emitted events
   * @param gamepadSource - Optional gamepad source merged with keyboard bits each frame
   */
  constructor(
    keymap: Record<string, InputBitmask> = DEFAULT_KEYMAP_P1,
    playerId: PlayerId = '',
    gamepadSource?: GamepadInputSource | null
  ) {
    this.keymap = keymap;
    this.playerId = playerId;
    this.gamepadSource = gamepadSource ?? null;
    this.setupListeners();
  }

  /** Update the player ID stamped on future emitted events. */
  setPlayerId(id: PlayerId): void {
    this.playerId = id;
  }

  /** Update the current tick stamped on future emitted events. */
  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  /** Replace the active gamepad source. Pass null to disable gamepad input. */
  setGamepadSource(source: GamepadInputSource | null): void {
    this.gamepadSource = source;
  }

  /** Remove keyboard event listeners. Call when the input manager is no longer needed. */
  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private setupListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const bit = this.keyToBit(e.code);
    if (bit !== 0) {
      e.preventDefault();
      this.currentHeld |= bit;
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const bit = this.keyToBit(e.code);
    if (bit !== 0) {
      this.currentHeld &= ~bit;
    }
  };

  private keyToBit(code: string): InputBitmask {
    return this.keymap[code] ?? 0;
  }

  /**
   * Called each rAF tick. Returns an InputEvent if state changed, null if no change.
   * Merges gamepad input bits with keyboard bits BEFORE computing pressed/released diff
   * to prevent false "released" events when keyboard releases while gamepad holds.
   */
  pollInput(): InputEvent | null {
    // Merge keyboard and gamepad bits BEFORE computing diff (critical for correctness)
    let gamepadBits: InputBitmask = 0;
    if (this.gamepadSource) {
      try {
        gamepadBits = this.gamepadSource.getHeldBits();
      } catch (error) {
        // Gamepad source threw (e.g., permission denied, device error)
        // Gracefully degrade: treat as no gamepad input
        console.error('GamepadInputSource.getHeldBits() threw:', error);
        gamepadBits = 0;
      }
    }

    // Merge keyboard and gamepad bits with OR (both active simultaneously)
    const held = this.currentHeld | gamepadBits;
    const prev = this.lastHeld;

    const pressed = held & ~prev;   // newly pressed this frame
    const released = prev & ~held;  // newly released this frame

    // Update with merged value (not keyboard-only) so next frame's diff is correct
    this.lastHeld = held;

    // Only emit event if something changed OR if we're holding keys
    if (held === 0 && pressed === 0 && released === 0) return null;

    const event: InputEvent = {
      tick: this.currentTick,
      seq: this.seqCounter++,
      playerId: this.playerId,
      held,
      pressed,
      released,
    };

    return event;
  }

  /** Return the current raw keyboard held bitmask (without gamepad merge). */
  getCurrentHeld(): InputBitmask {
    return this.currentHeld;
  }
}
