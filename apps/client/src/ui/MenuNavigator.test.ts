import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MenuNavigator, MenuButton } from './MenuNavigator';
import { GenericInputBits } from '@smash/gamepad-input';
import type { GamepadPoller, GamepadState } from '@smash/gamepad-input';

describe('MenuNavigator', () => {
  let navigator: MenuNavigator;
  let buttons: MenuButton[];
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create test buttons
    const createButton = (id: string, hasAdjust: boolean = false): MenuButton => {
      const element = document.createElement('button');
      element.textContent = id;
      container.appendChild(element);

      const button: MenuButton = {
        id,
        element,
        onActivate: vi.fn(),
      };

      if (hasAdjust) {
        button.onAdjust = vi.fn();
      }

      return button;
    };

    buttons = [
      createButton('button-0', false),
      createButton('button-1', true),  // has onAdjust
      createButton('button-2', false),
    ];

    navigator = new MenuNavigator();
    navigator.setButtons(buttons);
  });

  afterEach(() => {
    navigator.stop();
    document.body.removeChild(container);
  });

  describe('keyboard left/right adjustment', () => {
    it('should call onAdjust(-1) when ArrowLeft on button with onAdjust', () => {
      navigator.start();

      // Move to button-1 (has onAdjust)
      const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(moveEvent);

      // Reset mock to ensure only the left event is counted
      const adjust = buttons[1]!.onAdjust as any;
      adjust.mockClear();

      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      navigator['keyHandler']?.(leftEvent);

      expect(buttons[1]!.onAdjust).toHaveBeenCalledWith(-1);
      expect(buttons[1]!.onAdjust).toHaveBeenCalledTimes(1);
    });

    it('should call onAdjust(1) when ArrowRight on button with onAdjust', () => {
      navigator.start();

      // Move to button-1
      const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(moveEvent);

      const adjust = buttons[1]!.onAdjust as any;
      adjust.mockClear();

      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      navigator['keyHandler']?.(rightEvent);

      expect(buttons[1]!.onAdjust).toHaveBeenCalledWith(1);
      expect(buttons[1]!.onAdjust).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onAdjust when ArrowLeft on button WITHOUT onAdjust', () => {
      navigator.start();

      // button-0 is selected by default and has no onAdjust
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      navigator['keyHandler']?.(leftEvent);

      // No crash, and no onActivate either
      expect(buttons[0]!.onActivate).not.toHaveBeenCalled();
    });

    it('should NOT call onAdjust when ArrowRight on button WITHOUT onAdjust', () => {
      navigator.start();

      // button-0 is selected by default and has no onAdjust
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      navigator['keyHandler']?.(rightEvent);

      // No crash, and no onActivate either
      expect(buttons[0]!.onActivate).not.toHaveBeenCalled();
    });

    it('should not move selection when left/right on button with onAdjust', () => {
      navigator.start();

      // Move to button-1
      const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(moveEvent);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);

      // Press left
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      navigator['keyHandler']?.(leftEvent);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);

      // Press right
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      navigator['keyHandler']?.(rightEvent);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);
    });
  });

  describe('vertical navigation (regression)', () => {
    it('should move selection down with ArrowDown', () => {
      navigator.start();
      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(event);

      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);
    });

    it('should move selection up with ArrowUp', () => {
      navigator.start();

      // Move to button-1 first
      let event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(event);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);

      // Move up
      event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      navigator['keyHandler']?.(event);
      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(true);
    });

    it('should wrap selection around with ArrowUp from first button', () => {
      navigator.start();
      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      navigator['keyHandler']?.(event);

      // Should wrap to last button (index 2)
      expect(buttons[2]!.element.classList.contains('menu-selected')).toBe(true);
    });
  });

  describe('activation (regression)', () => {
    it('should activate selected button with Enter', () => {
      navigator.start();

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      navigator['keyHandler']?.(event);

      expect(buttons[0]!.onActivate).toHaveBeenCalled();
    });

    it('should activate selected button with Space', () => {
      navigator.start();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      navigator['keyHandler']?.(event);

      expect(buttons[0]!.onActivate).toHaveBeenCalled();
    });
  });

  describe('back button', () => {
    it('should call onBack when Escape is pressed', () => {
      const onBack = vi.fn();
      navigator.start(onBack);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      navigator['keyHandler']?.(event);

      expect(onBack).toHaveBeenCalled();
    });

    it('should not call onBack when Escape pressed without onBack callback', () => {
      navigator.start();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      // Should not crash
      navigator['keyHandler']?.(event);
    });
  });

  describe('selection visuals', () => {
    it('should apply menu-selected class to first button on start', () => {
      navigator.start();

      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(true);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(false);
      expect(buttons[2]!.element.classList.contains('menu-selected')).toBe(false);
    });

    it('should update selected class when selection changes', () => {
      navigator.start();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(event);

      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(false);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);
      expect(buttons[2]!.element.classList.contains('menu-selected')).toBe(false);
    });
  });

  describe('setButtons resets selection', () => {
    it('should reset selection to 0 when setButtons is called', () => {
      navigator.start();

      // Move to button-1
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(event);
      expect(buttons[1]!.element.classList.contains('menu-selected')).toBe(true);

      // Call setButtons
      navigator.setButtons(buttons);

      // Should be back at button-0
      expect(buttons[0]!.element.classList.contains('menu-selected')).toBe(true);
    });
  });

  describe('stop cleans up listeners', () => {
    it('should remove keyboard listener when stopped', () => {
      navigator.start();

      const oldHandler = navigator['keyHandler'];
      navigator.stop();

      // After stop, keyHandler should be null
      expect(navigator['keyHandler']).toBe(null);
    });
  });

  describe('MenuButton interface optional onAdjust', () => {
    it('should accept MenuButton without onAdjust', () => {
      const btn: MenuButton = {
        id: 'test',
        element: document.createElement('button'),
        onActivate: vi.fn(),
      };
      expect(btn.onAdjust).toBeUndefined();
    });

    it('should accept MenuButton with onAdjust', () => {
      const btn: MenuButton = {
        id: 'test',
        element: document.createElement('button'),
        onActivate: vi.fn(),
        onAdjust: vi.fn(),
      };
      expect(btn.onAdjust).toBeDefined();
      expect(typeof btn.onAdjust).toBe('function');
    });
  });

  describe('keyboard repeat handling', () => {
    it('should ignore repeat events for arrow keys', () => {
      navigator.start();

      // Move to button-1
      const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigator['keyHandler']?.(moveEvent);

      const adjust = buttons[1]!.onAdjust as any;
      adjust.mockClear();

      // Simulate repeat event
      const repeatEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', repeat: true });
      navigator['keyHandler']?.(repeatEvent);

      expect(buttons[1]!.onAdjust).not.toHaveBeenCalled();
    });
  });
});
