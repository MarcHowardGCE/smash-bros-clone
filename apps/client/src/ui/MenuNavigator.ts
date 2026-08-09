/**
 * MenuNavigator - Unified keyboard + gamepad navigation for all menu screens.
 *
 * Supports:
 * - Arrow keys (Up/Down) + W/S for vertical navigation
 * - Enter/Space to activate selected button
 * - Escape to trigger back/cancel
 * - Gamepad D-pad/stick for navigation
 * - Gamepad A to activate, B to back
 *
 * Edge-triggers only (no repeat on held buttons) for gamepad inputs.
 */

import type { GamepadPoller, GamepadState } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';

export interface MenuButton {
  id: string;
  element: HTMLElement;
  onActivate: () => void;
}

export class MenuNavigator {
  private buttons: MenuButton[] = [];
  private selectedIndex = 0;
  private poller: GamepadPoller | null = null;
  private rafId: number | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private lastBitsPerGamepad = new Map<number, number>();

  constructor(poller?: GamepadPoller | null) {
    this.poller = poller ?? null;
  }

  setButtons(buttons: MenuButton[]): void {
    this.buttons = buttons;
    this.selectedIndex = 0;
    this.updateVisuals();
  }

  start(onBack?: () => void): void {
    this.updateVisuals();

    this.keyHandler = (e: KeyboardEvent) => {
      // Don't intercept when an input field is focused
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.moveSelection(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.moveSelection(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.activateSelected();
          break;
        case 'Escape':
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    if (this.poller) {
      this.lastBitsPerGamepad.clear();
      const pollGamepad = (): void => {
        const states: ReadonlyMap<number, GamepadState> = this.poller!.poll();

        for (const [gpIndex, state] of states) {
          const bits = state.bits;
          const lastBits = this.lastBitsPerGamepad.get(gpIndex) ?? 0;

          // Edge-detect: fire only on rising edge
          const pressed = bits & ~lastBits;

          if (pressed & GenericInputBits.DOWN) {
            this.moveSelection(1);
          }
          if (pressed & GenericInputBits.UP) {
            this.moveSelection(-1);
          }
          if (pressed & GenericInputBits.A) {
            this.activateSelected();
          }
          if ((pressed & GenericInputBits.B) && onBack) {
            onBack();
          }

          this.lastBitsPerGamepad.set(gpIndex, bits);
        }

        this.rafId = requestAnimationFrame(pollGamepad);
      };
      this.rafId = requestAnimationFrame(pollGamepad);
    }
  }

  stop(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastBitsPerGamepad.clear();
  }

  private moveSelection(delta: number): void {
    if (this.buttons.length === 0) return;
    this.selectedIndex =
      (this.selectedIndex + delta + this.buttons.length) % this.buttons.length;
    this.updateVisuals();
  }

  private activateSelected(): void {
    this.buttons[this.selectedIndex]?.onActivate();
  }

  private updateVisuals(): void {
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i]!;
      if (i === this.selectedIndex) {
        btn.element.classList.add('menu-selected');
      } else {
        btn.element.classList.remove('menu-selected');
      }
    }
  }
}
