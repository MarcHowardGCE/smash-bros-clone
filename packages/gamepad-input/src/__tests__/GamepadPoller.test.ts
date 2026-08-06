/**
 * GamepadPoller unit tests
 * 
 * Tests: event-driven connect/disconnect, tick-driven poll(),
 * Chrome late-connect workaround, callback firing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GamepadPoller } from '../GamepadPoller.js';
import { sampleGamepadBits, GenericInputBits } from '../standardMapping.js';

/**
 * Mock gamepad factory
 */
function createMockGamepad(
  index: number = 0,
  id: string = `Controller${index}`,
  buttons: boolean[] = Array(17).fill(false),
  axes: number[] = [0, 0, 0, 0]
): Gamepad {
  return {
    index,
    id,
    connected: true,
    mapping: 'standard',
    buttons: buttons.map((pressed) => ({
      pressed,
      touched: false,
      value: pressed ? 1 : 0,
    })),
    axes,
    vibrationActuator: null as any,
  } as unknown as Gamepad;
}

describe('GamepadPoller', () => {
  let poller: GamepadPoller;

  beforeEach(() => {
    poller = new GamepadPoller();
  });

  afterEach(() => {
    poller.stop();
  });

  describe('start() and stop()', () => {
    it('attaches event listeners on start', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      poller.start();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'gamepadconnected',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'gamepaddisconnected',
        expect.any(Function)
      );
    });

    it('removes event listeners on stop', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      poller.start();
      poller.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'gamepadconnected',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'gamepaddisconnected',
        expect.any(Function)
      );
    });

    it('handles multiple start() calls idempotently', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      poller.start();
      poller.start();

      // Should only add listeners once
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });

    it('handles stop() when not started', () => {
      // Should not throw
      expect(() => {
        poller.stop();
      }).not.toThrow();
    });
  });

  describe('Chrome late-connect workaround', () => {
    it('performs immediate sweep on start() for already-connected controllers', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0, 0, 0, 0]);

      // Mock navigator.getGamepads to return a connected controller
      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      const connectCallback = vi.fn();
      poller.onConnect = connectCallback;

      poller.start();

      // onConnect should have been called immediately during start()
      expect(connectCallback).toHaveBeenCalledWith(mockGamepad);
    });

    it('ignores non-standard-mapping gamepads in initial sweep', () => {
      const mockGamepad = createMockGamepad(0, 'PlayStation');
      (mockGamepad as any).mapping = 'unknown';

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      const connectCallback = vi.fn();
      poller.onConnect = connectCallback;

      poller.start();

      // onConnect should NOT be called for non-standard controllers
      expect(connectCallback).not.toHaveBeenCalled();
    });
  });

  describe('poll()', () => {
    it('returns empty map when no gamepads connected', () => {
      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();

      expect(state.size).toBe(0);
    });

    it('returns map with gamepad state and bits keyed by index', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0.7, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();

      expect(state.size).toBe(1);
      expect(state.has(0)).toBe(true);

      const entry = state.get(0);
      expect(entry?.gamepad).toBe(mockGamepad);
      expect((entry?.bits ?? 0) & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT); // 0.7 > 0.5 post-deadzone
    });

    it('samples multiple gamepads', () => {
      const gamepad0 = createMockGamepad(0, 'Controller0', [], [0.7, 0, 0, 0]); // RIGHT
      const gamepad1 = createMockGamepad(1, 'Controller1', [], [-0.7, 0, 0, 0]); // LEFT

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [gamepad0, gamepad1]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();

      expect(state.size).toBe(2);
      expect((state.get(0)?.bits ?? 0) & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT);
      expect((state.get(1)?.bits ?? 0) & GenericInputBits.LEFT).toBe(GenericInputBits.LEFT);
    });

    it('skips null entries in gamepad array', () => {
      const gamepad1 = createMockGamepad(1, 'Controller1', [], [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [null, gamepad1]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();

      expect(state.size).toBe(1);
      expect(state.has(1)).toBe(true);
      expect(state.has(0)).toBe(false);
    });

    it('ignores non-standard-mapping gamepads in poll', () => {
      const standardGamepad = createMockGamepad(0, 'Xbox360', [], [0, 0, 0, 0]);
      const nonStandardGamepad = createMockGamepad(1, 'PlayStation');
      (nonStandardGamepad as any).mapping = 'unknown';

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [standardGamepad, nonStandardGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();

      expect(state.size).toBe(1);
      expect(state.has(0)).toBe(true);
      expect(state.has(1)).toBe(false);
    });

    it('is caller-driven, NOT timer-driven (no internal setInterval)', () => {
      // This test verifies that poll() doesn't set up any timers
      // by checking that no timer callbacks fire unexpectedly

      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const timerSpy = vi.spyOn(global, 'setInterval');

      poller.poll();

      expect(timerSpy).not.toHaveBeenCalled();
    });
  });

  describe('connect/disconnect callbacks', () => {
    it('fires onConnect callback when gamepadconnected event dispatched', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      const connectCallback = vi.fn();
      poller.onConnect = connectCallback;

      poller.start();

      // Manually dispatch gamepadconnected event
      const event = new Event('gamepadconnected') as any;
      event.gamepad = mockGamepad;

      window.dispatchEvent(event);

      expect(connectCallback).toHaveBeenCalledWith(mockGamepad);
    });

    it('fires onDisconnect callback when gamepaddisconnected event dispatched', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      const disconnectCallback = vi.fn();
      poller.onDisconnect = disconnectCallback;

      poller.start();

      // Dispatch disconnect event
      const event = new Event('gamepaddisconnected') as any;
      event.gamepad = mockGamepad;

      window.dispatchEvent(event);

      expect(disconnectCallback).toHaveBeenCalledWith(0);
    });

    it('handles onDisconnect for never-connected gamepad index (no throw)', () => {
      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      const disconnectCallback = vi.fn();
      poller.onDisconnect = disconnectCallback;

      poller.start();

      // Dispatch disconnect for an index that was never connected
      const mockGamepad = createMockGamepad(5, 'UnknownController', [], [0, 0, 0, 0]);
      const event = new Event('gamepaddisconnected') as any;
      event.gamepad = mockGamepad;

      // Should not throw
      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();

      // onDisconnect should still fire (no-op at listener side, per Must-NOT-Have)
      expect(disconnectCallback).toHaveBeenCalledWith(5);
    });

    it('ignores non-standard-mapping gamepads in connect event', () => {
      const nonStandardGamepad = createMockGamepad(0, 'PlayStation');
      (nonStandardGamepad as any).mapping = 'unknown';

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      const connectCallback = vi.fn();
      poller.onConnect = connectCallback;

      poller.start();

      const event = new Event('gamepadconnected') as any;
      event.gamepad = nonStandardGamepad;

      window.dispatchEvent(event);

      // onConnect should NOT be called for non-standard controllers
      expect(connectCallback).not.toHaveBeenCalled();
    });

    it('ignores null gamepad in disconnect event', () => {
      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => []),
        configurable: true,
      });

      const disconnectCallback = vi.fn();
      poller.onDisconnect = disconnectCallback;

      poller.start();

      const event = new Event('gamepaddisconnected') as any;
      event.gamepad = undefined;

      window.dispatchEvent(event);

      // Should not call the disconnect callback for undefined gamepad
      expect(disconnectCallback).not.toHaveBeenCalled();
    });
  });

  describe('button bit sampling', () => {
    it('correctly samples A button to A bit', () => {
      const buttons = Array(17).fill(false);
      buttons[0] = true; // A button
      const mockGamepad = createMockGamepad(0, 'Xbox360', buttons, [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();
      const bits = state.get(0)?.bits ?? 0;

      expect(bits & GenericInputBits.A).toBeTruthy();
    });

    it('correctly samples multiple buttons in one poll', () => {
      const buttons = Array(17).fill(false);
      buttons[0] = true; // A
      buttons[2] = true; // X
      buttons[4] = true; // LB
      const mockGamepad = createMockGamepad(0, 'Xbox360', buttons, [0, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();
      const bits = state.get(0)?.bits ?? 0;

      expect(bits & GenericInputBits.A).toBeTruthy();
      expect(bits & GenericInputBits.X).toBeTruthy();
      expect(bits & GenericInputBits.LB).toBeTruthy();
      expect(bits & GenericInputBits.B).toBeFalsy();
    });
  });

  describe('analog stick bit sampling', () => {
    it('correctly samples right stick movement', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0.7, 0, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();
      const bits = state.get(0)?.bits ?? 0;

      expect((bits & GenericInputBits.RIGHT) === GenericInputBits.RIGHT).toBe(true);
    });

    it('correctly ignores stick movement inside deadzone', () => {
      const mockGamepad = createMockGamepad(0, 'Xbox360', [], [0.1, 0.1, 0, 0]);

      Object.defineProperty(globalThis.navigator, 'getGamepads', {
        value: vi.fn(() => [mockGamepad]),
        configurable: true,
      });

      poller.start();

      const state = poller.poll();
      const bits = state.get(0)?.bits ?? 0;

      // No directional bits should be set for sub-deadzone input
      expect(bits & GenericInputBits.LEFT).toBeFalsy();
      expect(bits & GenericInputBits.RIGHT).toBeFalsy();
      expect(bits & GenericInputBits.UP).toBeFalsy();
      expect(bits & GenericInputBits.DOWN).toBeFalsy();
    });
  });
});
