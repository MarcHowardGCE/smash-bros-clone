import { INPUT_BITS } from '@smash/shared';
import type { InputBitmask, InputEvent, PlayerId } from '@smash/shared';

export class InputManager {
  private currentHeld: InputBitmask = 0;
  private lastHeld: InputBitmask = 0;
  private seqCounter: number = 0;
  private playerId: PlayerId = '';
  private currentTick: number = 0;

  // Pending inputs for T14 (LocalPredictor) — stored here, used there
  readonly pendingInputs: InputEvent[] = [];

  constructor() {
    this.setupListeners();
  }

  setPlayerId(id: PlayerId): void {
    this.playerId = id;
  }

  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      const bit = this.keyToBit(e.code);
      if (bit !== 0) {
        e.preventDefault();
        this.currentHeld |= bit;
      }
    });

    window.addEventListener('keyup', (e) => {
      const bit = this.keyToBit(e.code);
      if (bit !== 0) {
        this.currentHeld &= ~bit;
      }
    });
  }

  private keyToBit(code: string): InputBitmask {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        return INPUT_BITS.LEFT;
      case 'ArrowRight':
      case 'KeyD':
        return INPUT_BITS.RIGHT;
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyX':
        return INPUT_BITS.JUMP;
      case 'ArrowDown':
        return INPUT_BITS.DOWN;
      case 'KeyZ':
      case 'KeyU':
        return INPUT_BITS.ATTACK;
      case 'KeyS':
      case 'KeyI':
        return INPUT_BITS.SPECIAL;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyO':
        return INPUT_BITS.SHIELD;
      case 'KeyC':
      case 'KeyP':
        return INPUT_BITS.GRAB;
      default:
        return 0;
    }
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
