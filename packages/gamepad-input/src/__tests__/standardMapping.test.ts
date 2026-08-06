import { describe, it, expect } from 'vitest';
import {
  STANDARD_BUTTON_INDEX,
  GenericInputBits,
  applyRadialDeadzone,
  sampleGamepadBits,
} from '../standardMapping.js';

describe('standardMapping', () => {
  describe('STANDARD_BUTTON_INDEX', () => {
    it('should have correct W3C button indices', () => {
      expect(STANDARD_BUTTON_INDEX.A).toBe(0);
      expect(STANDARD_BUTTON_INDEX.B).toBe(1);
      expect(STANDARD_BUTTON_INDEX.X).toBe(2);
      expect(STANDARD_BUTTON_INDEX.Y).toBe(3);
      expect(STANDARD_BUTTON_INDEX.LB).toBe(4);
      expect(STANDARD_BUTTON_INDEX.RB).toBe(5);
      expect(STANDARD_BUTTON_INDEX.LT).toBe(6);
      expect(STANDARD_BUTTON_INDEX.RT).toBe(7);
      expect(STANDARD_BUTTON_INDEX.BACK).toBe(8);
      expect(STANDARD_BUTTON_INDEX.START).toBe(9);
      expect(STANDARD_BUTTON_INDEX.LS).toBe(10);
      expect(STANDARD_BUTTON_INDEX.RS).toBe(11);
      expect(STANDARD_BUTTON_INDEX.DPAD_UP).toBe(12);
      expect(STANDARD_BUTTON_INDEX.DPAD_DOWN).toBe(13);
      expect(STANDARD_BUTTON_INDEX.DPAD_LEFT).toBe(14);
      expect(STANDARD_BUTTON_INDEX.DPAD_RIGHT).toBe(15);
      expect(STANDARD_BUTTON_INDEX.GUIDE).toBe(16);
    });
  });

  describe('GenericInputBits', () => {
    it('should have distinct bit flags', () => {
      const bits = Object.values(GenericInputBits);
      const uniqueBits = new Set(bits);
      expect(uniqueBits.size).toBe(bits.length);
    });

    it('should fit in uint16', () => {
      Object.values(GenericInputBits).forEach((bit) => {
        expect(bit).toBeLessThanOrEqual(0xffff);
      });
    });
  });

  describe('applyRadialDeadzone', () => {
    it('should return [0, 0] when magnitude < deadzone', () => {
      const [x, y] = applyRadialDeadzone(0.1, 0.1, 0.2);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });

    it('should rescale when magnitude >= deadzone', () => {
      const [x, y] = applyRadialDeadzone(0.6, 0, 0.2);
      // magnitude = 0.6, scale = (0.6 - 0.2) / (1 - 0.2) = 0.4 / 0.8 = 0.5
      // x = (0.6 / 0.6) * 0.5 = 0.5
      expect(x).toBeCloseTo(0.5, 5);
      expect(y).toBe(0);
    });

    it('should handle diagonal input', () => {
      const [x, y] = applyRadialDeadzone(0.6, 0.6, 0.2);
      // magnitude = sqrt(0.72) ≈ 0.8485
      // scale = (0.8485 - 0.2) / 0.8 ≈ 0.8106
      // x = y = (0.6 / 0.8485) * 0.8106 ≈ 0.574
      expect(x).toBeCloseTo(y, 5);
      expect(x).toBeGreaterThan(0.5);
    });

    it('should use default deadzone 0.2', () => {
      const [x1, y1] = applyRadialDeadzone(0.15, 0, 0.2);
      const [x2, y2] = applyRadialDeadzone(0.15, 0);
      expect(x1).toBe(x2);
      expect(y1).toBe(y2);
    });

    it('should return [0, 0] at exactly deadzone threshold', () => {
      const [x, y] = applyRadialDeadzone(0.2, 0, 0.2);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });

    it('should rescale at exactly above threshold', () => {
      const [x, y] = applyRadialDeadzone(0.2001, 0, 0.2);
      expect(x).toBeGreaterThan(0);
    });
  });

  describe('sampleGamepadBits', () => {
    it('should return 0 for null gamepad', () => {
      expect(sampleGamepadBits(null)).toBe(0);
    });

    it('should return 0 for undefined gamepad', () => {
      expect(sampleGamepadBits(undefined)).toBe(0);
    });

    it('should return 0 for non-standard mapping', () => {
      const gamepad = createMockGamepad({});
      // Can't directly assign to readonly mapping, so bypass with type cast
      const nonStandard = gamepad as any;
      nonStandard.mapping = 'xinput';
      expect(sampleGamepadBits(nonStandard)).toBe(0);
    });

    it('should detect RIGHT from left stick > 0.5', () => {
      const gamepad = createMockGamepad({
        axes: [0.6, 0, 0, 0],
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT);
      expect(bits & GenericInputBits.LEFT).toBe(0);
    });

    it('should detect LEFT from left stick < -0.5', () => {
      const gamepad = createMockGamepad({
        axes: [-0.6, 0, 0, 0],
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LEFT).toBe(GenericInputBits.LEFT);
      expect(bits & GenericInputBits.RIGHT).toBe(0);
    });

    it('should detect UP from left stick < -0.5', () => {
      const gamepad = createMockGamepad({
        axes: [0, -0.6, 0, 0],
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.UP).toBe(GenericInputBits.UP);
      expect(bits & GenericInputBits.DOWN).toBe(0);
    });

    it('should detect DOWN from left stick > 0.5', () => {
      const gamepad = createMockGamepad({
        axes: [0, 0.6, 0, 0],
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.DOWN).toBe(GenericInputBits.DOWN);
      expect(bits & GenericInputBits.UP).toBe(0);
    });

    it('should return no direction bits when stick within deadzone', () => {
      const gamepad = createMockGamepad({
        axes: [0.1, 0.1, 0, 0],
      });
      const bits = sampleGamepadBits(gamepad, 0.2);
      expect(bits & GenericInputBits.LEFT).toBe(0);
      expect(bits & GenericInputBits.RIGHT).toBe(0);
      expect(bits & GenericInputBits.UP).toBe(0);
      expect(bits & GenericInputBits.DOWN).toBe(0);
    });

    it('should detect A button', () => {
      const buttons = Array(17).fill({ pressed: false, value: 0, touched: false });
      buttons[0] = { pressed: true, value: 1, touched: true };
      const gamepad = createMockGamepad({ buttons });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.A).toBe(GenericInputBits.A);
    });

    it('should detect B button', () => {
      const buttons = Array(17).fill({ pressed: false, value: 0, touched: false });
      buttons[1] = { pressed: true, value: 1, touched: true };
      const gamepad = createMockGamepad({ buttons });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.B).toBe(GenericInputBits.B);
    });

    it('should detect X button', () => {
      const buttons = Array(17).fill({ pressed: false, value: 0, touched: false });
      buttons[2] = { pressed: true, value: 1, touched: true };
      const gamepad = createMockGamepad({ buttons });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.X).toBe(GenericInputBits.X);
    });

    it('should detect Y button', () => {
      const buttons = Array(17).fill({ pressed: false, value: 0, touched: false });
      buttons[3] = { pressed: true, value: 1, touched: true };
      const gamepad = createMockGamepad({ buttons });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.Y).toBe(GenericInputBits.Y);
    });

    it('should detect LB button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(4).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LB).toBe(GenericInputBits.LB);
    });

    it('should detect RB button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(5).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.RB).toBe(GenericInputBits.RB);
    });

    it('should detect LT button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(6).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LT).toBe(GenericInputBits.LT);
    });

    it('should detect RT button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(7).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.RT).toBe(GenericInputBits.RT);
    });

    it('should detect BACK button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(8).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.BACK).toBe(GenericInputBits.BACK);
    });

    it('should detect START button', () => {
      const gamepad = createMockGamepad({
        buttons: Array(9).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.START).toBe(GenericInputBits.START);
    });

    it('should detect DPAD_UP button as UP bit', () => {
      const gamepad = createMockGamepad({
        buttons: Array(12).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.UP).toBe(GenericInputBits.UP);
    });

    it('should detect DPAD_DOWN button as DOWN bit', () => {
      const gamepad = createMockGamepad({
        buttons: Array(13).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.DOWN).toBe(GenericInputBits.DOWN);
    });

    it('should detect DPAD_LEFT button as LEFT bit', () => {
      const gamepad = createMockGamepad({
        buttons: Array(14).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LEFT).toBe(GenericInputBits.LEFT);
    });

    it('should detect DPAD_RIGHT button as RIGHT bit', () => {
      const gamepad = createMockGamepad({
        buttons: Array(15).fill({ pressed: false }).concat([{ pressed: true }]),
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT);
    });

    it('should combine stick and D-pad directions', () => {
      const gamepad = createMockGamepad({
        axes: [0.6, 0, 0, 0], // RIGHT from stick
        buttons: Array(13).fill({ pressed: false }).concat([{ pressed: true }]), // DOWN from D-pad (index 13)
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT);
      expect(bits & GenericInputBits.DOWN).toBe(GenericInputBits.DOWN);
    });

    it('should handle custom deadzone', () => {
      const gamepad = createMockGamepad({
        axes: [0.65, 0, 0, 0],
      });
      // With default deadzone 0.2, should have RIGHT (0.65 rescales to ~0.56)
      const bits1 = sampleGamepadBits(gamepad, 0.2);
      expect(bits1 & GenericInputBits.RIGHT).toBe(GenericInputBits.RIGHT);

      // With higher deadzone 0.4, should not have RIGHT (0.65 rescales to ~0.42)
      const bits2 = sampleGamepadBits(gamepad, 0.4);
      expect(bits2 & GenericInputBits.RIGHT).toBe(0);
    });

    it('should ignore right analog stick (axes 2, 3)', () => {
      const gamepad = createMockGamepad({
        axes: [0, 0, 0.8, 0.8], // Right stick only
      });
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LEFT).toBe(0);
      expect(bits & GenericInputBits.RIGHT).toBe(0);
      expect(bits & GenericInputBits.UP).toBe(0);
      expect(bits & GenericInputBits.DOWN).toBe(0);
    });

    it('should handle missing buttons array gracefully', () => {
      const gamepad: Gamepad = {
        ...createMockGamepad({}),
        buttons: undefined as any,
      };
      expect(() => sampleGamepadBits(gamepad)).not.toThrow();
      expect(sampleGamepadBits(gamepad)).toBe(0);
    });

    it('should handle missing axes gracefully', () => {
      const gamepad: Gamepad = {
        ...createMockGamepad({}),
        axes: undefined as any,
      };
      expect(() => sampleGamepadBits(gamepad)).not.toThrow();
      const bits = sampleGamepadBits(gamepad);
      expect(bits & GenericInputBits.LEFT).toBe(0);
      expect(bits & GenericInputBits.RIGHT).toBe(0);
    });
  });
});

/**
 * Helper: Create a mock Gamepad object with custom properties
 */
function createMockGamepad(overrides: Partial<Gamepad> = {}): Gamepad {
  return {
    id: 'mock-gamepad',
    index: 0,
    connected: true,
    timestamp: Date.now(),
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array(17).fill({ pressed: false, value: 0, touched: false }),
    vibrationActuator: undefined,
    hapticActuators: [],
    ...overrides,
  } as unknown as Gamepad;
}
