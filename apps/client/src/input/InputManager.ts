import type { InputBitmask, InputEvent, PlayerId } from '@smash/shared';
import { DEFAULT_KEYMAP_P1 } from './keymaps.js';

export class InputManager {
  private currentHeld: InputBitmask = 0;
  private lastHeld: InputBitmask = 0;
  private seqCounter: number = 0;
  private playerId: PlayerId = '';
  private currentTick: number = 0;
  private readonly keymap: Record<string, InputBitmask>;

  // Pending inputs for T14 (LocalPredictor) — stored here, used there
  readonly pendingInputs: InputEvent[] = [];

  constructor(keymap: Record<string, InputBitmask> = DEFAULT_KEYMAP_P1, playerId: PlayerId = '') {
    this.keymap = keymap;
    this.playerId = playerId;
    this.setupListeners();
  }

  setPlayerId(id: PlayerId): void {
    this.playerId = id;
  }

  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

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
   */
  pollInput(): InputEvent | null {
    const held = this.currentHeld;
    const prev = this.lastHeld;

    const pressed = held & ~prev;   // newly pressed this frame
    const released = prev & ~held;  // newly released this frame

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

  getCurrentHeld(): InputBitmask {
    return this.currentHeld;
  }
}
