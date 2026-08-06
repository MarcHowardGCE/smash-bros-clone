import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../../input/InputManager.js';
import { DEFAULT_KEYMAP_P1, DEFAULT_KEYMAP_P2 } from '../../input/keymaps.js';
import { INPUT_BITS } from '@smash/shared';
import { LocalPlayerController } from '../LocalPlayerController.js';
import type { GamepadInputSource } from '../../input/GamepadInputSource.js';

describe('InputManager with injected keymap', () => {
  it('defaults to P1 keymap: KeyA maps to LEFT', () => {
    // DEFAULT_KEYMAP_P1 maps KeyA → INPUT_BITS.LEFT
    expect(DEFAULT_KEYMAP_P1['KeyA']).toBe(INPUT_BITS.LEFT);
    // DEFAULT_KEYMAP_P2 maps KeyJ → INPUT_BITS.LEFT (not KeyA)
    expect(DEFAULT_KEYMAP_P2['KeyA']).toBeUndefined();
  });

  it('returns null when no keys pressed', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');
    manager.setCurrentTick(0);
    expect(manager.pollInput()).toBeNull();
    manager.destroy();
  });
});

describe('InputManager gamepad merge (merge-before-diff)', () => {
  it('merges gamepad bits with keyboard bits before computing pressed/released diff', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');
    manager.setCurrentTick(1);

    // Create a mock GamepadInputSource
    const mockGamepadSource = {
      getHeldBits: vi.fn(() => INPUT_BITS.LEFT),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    manager.setGamepadSource(mockGamepadSource);

    // Scenario: keyboard LEFT down, gamepad LEFT down
    // Simulate keyboard pressing LEFT by directly setting the bit
    // We'll use the public interface via events if possible, but InputManager
    // doesn't expose keyboard simulation easily, so we test the merge logic directly.

    // Step 1: Both keyboard and gamepad hold LEFT
    // Simulate keyboard has LEFT pressed (this.currentHeld = INPUT_BITS.LEFT)
    // We need to manually trigger this; since we can't easily dispatch keyboard events in this test,
    // we'll create a new InputManager and test the core merge logic.

    // For a clean test, create a fresh manager and manually set up state
    const keyboardAndGamepadManager = new InputManager(
      { KeyA: INPUT_BITS.LEFT }, // Custom keymap
      'test-player'
    );
    keyboardAndGamepadManager.setCurrentTick(1);

    const mockGamepad = {
      getHeldBits: vi.fn(() => INPUT_BITS.LEFT),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;
    keyboardAndGamepadManager.setGamepadSource(mockGamepad);

    // Manually set currentHeld as if keyboard has LEFT pressed
    // (InputManager.pollInput() reads this.currentHeld directly)
    (keyboardAndGamepadManager as any).currentHeld = INPUT_BITS.LEFT;
    (keyboardAndGamepadManager as any).lastHeld = INPUT_BITS.LEFT;

    // Tick 1: Both held, expect no pressed/released
    let event = keyboardAndGamepadManager.pollInput();
    expect(event).not.toBeNull();
    expect(event!.held).toBe(INPUT_BITS.LEFT); // LEFT is held
    expect(event!.pressed).toBe(0); // Nothing newly pressed
    expect(event!.released).toBe(0); // Nothing newly released

    // Tick 2: Keyboard releases LEFT, but gamepad still holds LEFT
    // After keyboard release, this.currentHeld should be 0
    (keyboardAndGamepadManager as any).currentHeld = 0;
    // gamepad still returns LEFT via mock

    event = keyboardAndGamepadManager.pollInput();
    expect(event).not.toBeNull();
    // CRITICAL: LEFT should STILL be held (via gamepad) because merge happens BEFORE diff
    expect(event!.held).toBe(INPUT_BITS.LEFT);
    // CRITICAL: LEFT should NOT be in released (no false positive)
    expect(event!.released).toBe(0);
    // Nothing pressed
    expect(event!.pressed).toBe(0);

    keyboardAndGamepadManager.destroy();
  });

  it('gracefully handles gamepad source that throws exception', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');
    manager.setCurrentTick(1);

    // Create a mock that throws
    const mockGamepadSourceThrows = {
      getHeldBits: vi.fn(() => {
        throw new Error('Simulated gamepad error');
      }),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    manager.setGamepadSource(mockGamepadSourceThrows);

    // Manually set currentHeld as if keyboard has some input
    (manager as any).currentHeld = INPUT_BITS.JUMP;
    (manager as any).lastHeld = 0;

    // Should NOT throw, should return event with keyboard-only bits
    const event = manager.pollInput();
    expect(event).not.toBeNull();
    expect(event!.held).toBe(INPUT_BITS.JUMP); // Keyboard-only
    expect(event!.pressed).toBe(INPUT_BITS.JUMP); // Newly pressed
    expect(event!.released).toBe(0);

    manager.destroy();
  });

  it('returns 0 when gamepad source is null', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');
    manager.setCurrentTick(1);

    // No gamepad source set
    expect((manager as any).gamepadSource).toBeNull();

    // Manually set keyboard input
    (manager as any).currentHeld = INPUT_BITS.ATTACK;
    (manager as any).lastHeld = 0;

    const event = manager.pollInput();
    expect(event).not.toBeNull();
    expect(event!.held).toBe(INPUT_BITS.ATTACK); // Keyboard only
    expect(event!.pressed).toBe(INPUT_BITS.ATTACK);

    manager.destroy();
  });
});

describe('InputManager setGamepadSource', () => {
  it('accepts and stores gamepad source', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');

    const mockSource = {
      getHeldBits: vi.fn(() => 0),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    manager.setGamepadSource(mockSource);
    expect((manager as any).gamepadSource).toBe(mockSource);

    manager.destroy();
  });

  it('allows clearing gamepad source by passing null', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');

    const mockSource = {
      getHeldBits: vi.fn(() => 0),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    manager.setGamepadSource(mockSource);
    expect((manager as any).gamepadSource).toBe(mockSource);

    manager.setGamepadSource(null);
    expect((manager as any).gamepadSource).toBeNull();

    manager.destroy();
  });
});

describe('LocalPlayerController', () => {
  it('creates with correct playerId and slotIndex', () => {
    const ctrl = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
    });
    expect(ctrl.playerId).toBe('local-p1');
    expect(ctrl.slotIndex).toBe(0);
    ctrl.destroy();
  });

  it('creates P2 controller with correct slotIndex', () => {
    const ctrl = new LocalPlayerController({
      playerId: 'local-p2',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 1,
    });
    expect(ctrl.playerId).toBe('local-p2');
    expect(ctrl.slotIndex).toBe(1);
    ctrl.destroy();
  });

  it('P1 and P2 keymaps have distinct keys', () => {
    // Verify the keymaps don't share entries that would cause conflicts
    const p1Keys = Object.keys(DEFAULT_KEYMAP_P1);
    const p2Keys = Object.keys(DEFAULT_KEYMAP_P2);
    // P2 keys should all be distinct from P1 primary navigation
    expect(p2Keys).toContain('KeyJ');
    expect(p2Keys).toContain('KeyL');
    expect(p1Keys).not.toContain('KeyJ');
    expect(p1Keys).not.toContain('KeyL');
  });

  it('P2 keymap maps KeyJ to LEFT', () => {
    expect(DEFAULT_KEYMAP_P2.KeyJ).toBe(INPUT_BITS.LEFT);
  });

  it('P2 keymap maps KeyL to RIGHT', () => {
    expect(DEFAULT_KEYMAP_P2.KeyL).toBe(INPUT_BITS.RIGHT);
  });
});
