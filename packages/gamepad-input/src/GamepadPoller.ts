/**
 * GamepadPoller - tick-driven gamepad polling with connect/disconnect detection
 * 
 * Follows the same pattern as InputManager: event-driven connection detection,
 * tick-driven polling via external caller (NOT internal setInterval).
 * 
 * Handles Chrome late-connect quirk: performs immediate navigator.getGamepads()
 * sweep on start() before listener attachment.
 */

import { sampleGamepadBits, type GenericInputBitmask } from './standardMapping.js';

/**
 * Represents a connected gamepad with its sampled input bits
 */
export interface GamepadState {
  gamepad: Gamepad;
  bits: GenericInputBitmask;
}

/**
 * GamepadPoller - manages gamepad lifecycle and polling
 * 
 * Mirrors InputManager's architecture:
 * - setupListeners: attach event handlers for connect/disconnect
 * - poll: caller-driven tick-based sampling (returns current state map)
 */
export class GamepadPoller {
  private isStarted = false;
  private connectedGamepads = new Map<number, Gamepad>();

  // Public callbacks - fire from browser events (not from poll())
  onConnect: ((gamepad: Gamepad) => void) | null = null;
  onDisconnect: ((gamepadIndex: number) => void) | null = null;

  /**
   * Start listening for gamepad connect/disconnect events
   * Performs immediate sweep to catch already-connected controllers (Chrome quirk)
   */
  start(): void {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;

    // Attach event listeners
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    // Chrome quirk: perform immediate sweep for controllers already connected
    // before listener attachment (some controllers may not fire connect event)
    const gamepads = navigator.getGamepads?.() ?? [];
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad && gamepad.mapping === 'standard') {
        this.connectedGamepads.set(i, gamepad);
        this.onConnect?.(gamepad);
      }
    }
  }

  /**
   * Stop listening for gamepad events
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;

    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    this.connectedGamepads.clear();
  }

  /**
   * Poll current gamepad state - called once per external tick (rAF/game-tick)
   * Returns map keyed by gamepad.index with {gamepad, bits} entries
   * 
   * This is tick-driven by the caller, NOT via internal setInterval
   */
  poll(): ReadonlyMap<number, GamepadState> {
    const result = new Map<number, GamepadState>();

    // Query current gamepad state via native API
    const gamepads = navigator.getGamepads?.() ?? [];

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];

      // Skip null entries and non-standard-mapping gamepads
      if (!gamepad || gamepad.mapping !== 'standard') {
        continue;
      }

      // Sample this gamepad's input bits
      const bits = sampleGamepadBits(gamepad);

      result.set(i, { gamepad, bits });
    }

    return result;
  }

  /**
   * Internal event handler - called when a gamepad connects
   * Fires the onConnect callback with the new gamepad
   */
  private readonly handleGamepadConnected = (event: any): void => {
    const gamepad = event.gamepad as Gamepad | undefined;

    if (!gamepad || gamepad.mapping !== 'standard') {
      return;
    }

    // Ignore duplicate browser connect events for an index we already track
    // (can happen after initial start() sweep in some browser flows).
    if (this.connectedGamepads.has(gamepad.index)) {
      return;
    }

    // Track this gamepad
    this.connectedGamepads.set(gamepad.index, gamepad);

    // Notify listener
    this.onConnect?.(gamepad);
  };

  /**
   * Internal event handler - called when a gamepad disconnects
   * Fires the onDisconnect callback with the gamepad index
   * Per Must-NOT-Have: does NOT throw on already-disconnected index
   */
  private readonly handleGamepadDisconnected = (event: any): void => {
    const gamepad = event.gamepad as Gamepad | undefined;

    if (!gamepad) {
      return;
    }

    const index = gamepad.index;

    // Remove from tracking (silent no-op if not found)
    this.connectedGamepads.delete(index);

    // Notify listener
    this.onDisconnect?.(index);
  };
}
