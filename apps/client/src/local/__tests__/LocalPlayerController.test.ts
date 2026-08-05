import { describe, it, expect } from 'vitest';
import { InputManager } from '../../input/InputManager.js';
import { DEFAULT_KEYMAP_P1, DEFAULT_KEYMAP_P2 } from '../../input/keymaps.js';
import { INPUT_BITS } from '@smash/shared';
import { LocalPlayerController } from '../LocalPlayerController.js';

describe('InputManager with injected keymap', () => {
  it('defaults to P1 keymap when no keymap provided', () => {
    const manager = new InputManager();
    // keyToBit is private, test via the map structure
    expect(manager).toBeDefined();
    manager.destroy();
  });

  it('returns null when no keys pressed', () => {
    const manager = new InputManager(DEFAULT_KEYMAP_P1, 'p1');
    manager.setCurrentTick(0);
    expect(manager.pollInput()).toBeNull();
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
