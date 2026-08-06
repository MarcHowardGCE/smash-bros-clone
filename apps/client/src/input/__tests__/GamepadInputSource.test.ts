import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GamepadInputSource } from '../GamepadInputSource';
import { GenericInputBits } from '@smash/gamepad-input';
import { INPUT_BITS } from '@smash/shared';

describe('GamepadInputSource', () => {
  let mockPoller: any;
  let source: GamepadInputSource;

  beforeEach(() => {
    // Mock GamepadPoller with fixed poll() return values
    mockPoller = {
      poll: vi.fn(() => new Map()),
    };
    source = new GamepadInputSource(mockPoller, 0);
  });

  describe('getHeldBits', () => {
    it('should return 0 for disconnected gamepad', () => {
      mockPoller.poll.mockReturnValue(new Map());
      const bits = source.getHeldBits();
      expect(bits).toBe(0);
    });

    it('should map Generic A to INPUT_BITS.JUMP', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.A }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.JUMP).toBe(INPUT_BITS.JUMP);
    });

    it('should map Generic DPAD_UP to INPUT_BITS.JUMP', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.UP }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.JUMP).toBe(INPUT_BITS.JUMP);
    });

    it('should map Generic X to INPUT_BITS.ATTACK', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.X }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.ATTACK).toBe(INPUT_BITS.ATTACK);
    });

    it('should map Generic B to INPUT_BITS.SPECIAL', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.B }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.SPECIAL).toBe(INPUT_BITS.SPECIAL);
    });

    it('should map Generic LB to INPUT_BITS.SHIELD', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.LB }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.SHIELD).toBe(INPUT_BITS.SHIELD);
    });

    it('should map Generic RB to INPUT_BITS.SHIELD', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.RB }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.SHIELD).toBe(INPUT_BITS.SHIELD);
    });

    it('should map Generic LT to INPUT_BITS.GRAB', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.LT }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.GRAB).toBe(INPUT_BITS.GRAB);
    });

    it('should map Generic RT to INPUT_BITS.GRAB', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.RT }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.GRAB).toBe(INPUT_BITS.GRAB);
    });

    it('should map Generic LEFT to INPUT_BITS.LEFT', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.LEFT }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.LEFT).toBe(INPUT_BITS.LEFT);
    });

    it('should map Generic RIGHT to INPUT_BITS.RIGHT', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.RIGHT }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.RIGHT).toBe(INPUT_BITS.RIGHT);
    });

    it('should map Generic DOWN to INPUT_BITS.DOWN', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: GenericInputBits.DOWN }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.DOWN).toBe(INPUT_BITS.DOWN);
    });

    it('should combine multiple inputs correctly', () => {
      const combinedGeneric = GenericInputBits.A | GenericInputBits.RIGHT;
      mockPoller.poll.mockReturnValue(
        new Map([[0, { gamepad: {}, bits: combinedGeneric }]])
      );
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.JUMP).toBe(INPUT_BITS.JUMP);
      expect(bits & INPUT_BITS.RIGHT).toBe(INPUT_BITS.RIGHT);
    });

    it('should return 0 when gamepad at wrong index', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[1, { gamepad: {}, bits: GenericInputBits.A }]])
      );
      // source is looking for gamepad index 0
      const bits = source.getHeldBits();
      expect(bits).toBe(0);
    });
  });

  describe('updateGamepadIndex', () => {
    it('should switch to new gamepad index', () => {
      mockPoller.poll.mockReturnValue(
        new Map([[1, { gamepad: {}, bits: GenericInputBits.A }]])
      );
      source.updateGamepadIndex(1);
      const bits = source.getHeldBits();
      expect(bits & INPUT_BITS.JUMP).toBe(INPUT_BITS.JUMP);
    });
  });
});
