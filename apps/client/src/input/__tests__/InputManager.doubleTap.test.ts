/**
 * @fileoverview Tests for InputManager double-tap smash detection.
 *
 * Covers: double-tap detection with mocked time, intent consumption, regression
 * against default behavior (without the option enabled).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INPUT_BITS, type InputBitmask } from '@smash/shared';
import { InputManager } from '../InputManager.js';

// Mock keymap that maps ArrowLeft to LEFT and ArrowRight to RIGHT
const testKeymap: Record<string, InputBitmask> = {
  ArrowLeft: INPUT_BITS.LEFT,
  ArrowRight: INPUT_BITS.RIGHT,
  KeyA: INPUT_BITS.LEFT,
  KeyD: INPUT_BITS.RIGHT,
  ArrowUp: INPUT_BITS.JUMP,
  KeyW: INPUT_BITS.JUMP,
  KeyX: INPUT_BITS.JUMP,
  ArrowDown: INPUT_BITS.DOWN,
  KeyZ: INPUT_BITS.ATTACK,
  KeyS: INPUT_BITS.SPECIAL,
  ShiftLeft: INPUT_BITS.SHIELD,
  ShiftRight: INPUT_BITS.SHIELD,
  KeyC: INPUT_BITS.GRAB,
};

describe('InputManager.doubleTapSmash', () => {
  let manager: InputManager;
  let now = 0;

  beforeEach(() => {
    now = 0;
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    // Mock getCurrentTime to use our controlled `now` variable
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    vi.restoreAllMocks();
  });

  it('should be disabled by default (backward compatibility)', () => {
    manager = new InputManager(testKeymap, 'p1');
    expect(manager.getSmashIntent()).toBe(false);

    // Simulate double-tap without the option
    const leftKeyDown = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown);

    expect(manager.getSmashIntent()).toBe(false);
  });

  it('should detect double-tap within 250ms threshold', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First press left at t=0
    const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown1);
    expect(manager.getSmashIntent()).toBe(false); // First press, no intent yet

    // Second press left at t=100ms (within 250ms)
    now = 100;
    const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown2);

    expect(manager.getSmashIntent()).toBe(true); // Double-tap detected
  });

  it('should not set intent beyond 250ms threshold', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First press left at t=0
    const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown1);

    // Second press left at t=500ms (well beyond 250ms threshold)
    now = 500;
    const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown2);

    expect(manager.getSmashIntent()).toBe(false); // No intent, threshold exceeded
  });

  it('should detect double-tap at 249ms (within threshold)', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First press left at t=0
    const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown1);

    // Second press left at t=249ms (within 250ms threshold)
    now = 249;
    const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown2);

    expect(manager.getSmashIntent()).toBe(true); // Within threshold
  });

  it('should detect double-tap for right direction', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First press right at t=0
    const rightKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowRight' });
    window.dispatchEvent(rightKeyDown1);

    // Second press right at t=100ms
    now = 100;
    const rightKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowRight' });
    window.dispatchEvent(rightKeyDown2);

    expect(manager.getSmashIntent()).toBe(true);
  });

  it('should not set intent when switching directions', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // Press left at t=0
    const leftKeyDown = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown);

    // Press right at t=100ms (different direction)
    now = 100;
    const rightKeyDown = new KeyboardEvent('keydown', { code: 'ArrowRight' });
    window.dispatchEvent(rightKeyDown);

    expect(manager.getSmashIntent()).toBe(false); // No intent for mixed directions
  });

  it('should consume intent when consumeSmashIntent is called', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // Set up double-tap
    const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown1);

    now = 100;
    const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown2);

    expect(manager.getSmashIntent()).toBe(true);

    // Consume it
    const consumed = manager.consumeSmashIntent();
    expect(consumed).toBe(true);

    // Should be cleared now
    expect(manager.getSmashIntent()).toBe(false);
  });

  it('should clear intent only on attack press (simulated by consumeSmashIntent)', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // Set up double-tap
    const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown1);

    now = 100;
    const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftKeyDown2);

    expect(manager.getSmashIntent()).toBe(true);

    // Polling input (simulates game tick) should NOT clear intent
    manager.pollInput();
    expect(manager.getSmashIntent()).toBe(true); // Still set

    // Only consumeSmashIntent clears it
    manager.consumeSmashIntent();
    expect(manager.getSmashIntent()).toBe(false);
  });

  it('should work with alternative keymap (e.g., KeyA for left)', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First press KeyA (mapped to LEFT) at t=0
    const keyA1 = new KeyboardEvent('keydown', { code: 'KeyA' });
    window.dispatchEvent(keyA1);

    // Second press KeyA at t=100ms
    now = 100;
    const keyA2 = new KeyboardEvent('keydown', { code: 'KeyA' });
    window.dispatchEvent(keyA2);

    expect(manager.getSmashIntent()).toBe(true);
  });

  it('should not detect double-tap for non-directional keys', () => {
    manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
    vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

    // First attack press at t=0
    const attackKeyDown1 = new KeyboardEvent('keydown', { code: 'KeyZ' });
    window.dispatchEvent(attackKeyDown1);

    // Second attack press at t=100ms
    now = 100;
    const attackKeyDown2 = new KeyboardEvent('keydown', { code: 'KeyZ' });
    window.dispatchEvent(attackKeyDown2);

    expect(manager.getSmashIntent()).toBe(false); // Non-directional keys don't trigger smash intent
  });

  describe('Regression: default behavior unchanged', () => {
    it('should emit input events unchanged when double-tap is disabled', () => {
      manager = new InputManager(testKeymap, 'p1'); // No option, defaults to false

      manager.setCurrentTick(0);
      const event1 = manager.pollInput();
      expect(event1).toBe(null); // No input yet

      // Press left
      const leftKeyDown = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
      window.dispatchEvent(leftKeyDown);

      manager.setCurrentTick(1);
      const event2 = manager.pollInput();

      expect(event2).not.toBe(null);
      expect(event2?.held).toBe(INPUT_BITS.LEFT);
      expect(event2?.pressed).toBe(INPUT_BITS.LEFT);
    });

    it('should report identical held bits with or without double-tap enabled', () => {
      const manager1 = new InputManager(testKeymap, 'p1'); // Disabled
      const manager2 = new InputManager(testKeymap, 'p1', { doubleTapSmash: true }); // Enabled

      manager1.setCurrentTick(0);
      manager2.setCurrentTick(0);

      // Both press left
      const leftKeyDown1 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
      const leftKeyDown2 = new KeyboardEvent('keydown', { code: 'ArrowLeft' });

      // Dispatch to both (they share the global listener)
      window.dispatchEvent(leftKeyDown1);

      // Re-dispatch for the second manager (or create a new event)
      window.dispatchEvent(leftKeyDown2);

      manager1.setCurrentTick(1);
      manager2.setCurrentTick(1);

      const event1 = manager1.pollInput();
      const event2 = manager2.pollInput();

      // Both should report the same held bits
      expect(event1?.held).toBe(event2?.held);
      expect(event1?.pressed).toBe(event2?.pressed);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid successive presses correctly', () => {
      manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
      vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

      // First left press at t=0
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(manager.getSmashIntent()).toBe(false);

      // Second left press at t=100ms
      now = 100;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(manager.getSmashIntent()).toBe(true);

      // Third left press at t=150ms (within 250ms of the second press)
      now = 150;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(manager.getSmashIntent()).toBe(true); // Intent still/re-set

      // Consume it
      manager.consumeSmashIntent();
      expect(manager.getSmashIntent()).toBe(false);

      // Fourth press at t=450ms (reset context, >250ms from last at 150, so no intent)
      now = 450;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(manager.getSmashIntent()).toBe(false); // Reset, new tracking started
    });

    it('should preserve smash intent across multiple pollInput calls', () => {
      manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
      vi.spyOn(manager as any, 'getCurrentTime').mockImplementation(() => now);

      // Set up double-tap
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      now = 100;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));

      expect(manager.getSmashIntent()).toBe(true);

      // Poll multiple times without consuming
      manager.setCurrentTick(1);
      manager.pollInput();
      expect(manager.getSmashIntent()).toBe(true);

      manager.setCurrentTick(2);
      manager.pollInput();
      expect(manager.getSmashIntent()).toBe(true);

      // Still there until consumed
      manager.pollInput();
      expect(manager.getSmashIntent()).toBe(true);
    });
  });

  describe('Constructor overload compatibility', () => {
    it('should accept options as the third parameter', () => {
      manager = new InputManager(testKeymap, 'p1', { doubleTapSmash: true });
      expect(manager.getSmashIntent).toBeDefined();
    });

    it('should accept options as the fourth parameter (legacy gamepad path)', () => {
      manager = new InputManager(testKeymap, 'p1', null, { doubleTapSmash: true });
      expect(manager.getSmashIntent).toBeDefined();
    });

    it('should work without any options (backward compatible)', () => {
      manager = new InputManager(testKeymap, 'p1');
      expect(manager.getSmashIntent()).toBe(false); // Default disabled
    });
  });
});
