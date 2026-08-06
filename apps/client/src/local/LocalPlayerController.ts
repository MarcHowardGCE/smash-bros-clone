import type { InputEvent, PlayerId } from '@smash/shared';
import { InputManager } from '../input/InputManager.js';
import type { LocalPlayerConfig } from './types.js';

export class LocalPlayerController {
  readonly playerId: PlayerId;
  readonly slotIndex: number;
  private readonly inputManager: InputManager;

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
