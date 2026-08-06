import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalPlayerController } from '../LocalPlayerController.js';
import { LocalMatch } from '../LocalMatch.js';
import { DEFAULT_KEYMAP_P1, DEFAULT_KEYMAP_P2 } from '../../input/keymaps.js';
import { INPUT_BITS } from '@smash/shared';
import type { GamepadInputSource } from '../../input/GamepadInputSource.js';

describe('LocalMatch N-player support (up to 4 controllers)', () => {
  it('constructs 4-controller match with keyboard P1/P2 and mocked gamepad P3/P4', () => {
    // Create mock gamepad sources with distinct fixed bits for P3 and P4
    const mockGamepadP3 = {
      getHeldBits: vi.fn(() => INPUT_BITS.LEFT), // P3 always holds LEFT
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    const mockGamepadP4 = {
      getHeldBits: vi.fn(() => INPUT_BITS.RIGHT), // P4 always holds RIGHT
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    // P1: keyboard, P2: keyboard, P3: gamepad, P4: gamepad
    const p1Controller = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
      gamepadSource: null,
    });

    const p2Controller = new LocalPlayerController({
      playerId: 'local-p2',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 1,
      gamepadSource: null,
    });

    const p3Controller = new LocalPlayerController({
      playerId: 'local-p3',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 2,
      gamepadSource: mockGamepadP3,
    });

    const p4Controller = new LocalPlayerController({
      playerId: 'local-p4',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 3,
      gamepadSource: mockGamepadP4,
    });

    // Construct LocalMatch with all 4 controllers
    const match = new LocalMatch([p1Controller, p2Controller, p3Controller, p4Controller]);

    // Verify engine was initialized with 4 playerIds
    expect(match['controllers'].length).toBe(4);
    expect(match['controllers'][0].playerId).toBe('local-p1');
    expect(match['controllers'][1].playerId).toBe('local-p2');
    expect(match['controllers'][2].playerId).toBe('local-p3');
    expect(match['controllers'][3].playerId).toBe('local-p4');

    // Capture a snapshot to verify 4 players in game state
    let snapshotCaptured: any = null;
    match.onSnapshot = (snapshot) => {
      snapshotCaptured = snapshot;
    };

    // Manually call tick to generate a snapshot (avoids requestAnimationFrame)
    match['tick']();

    // Verify snapshot has 4 players
    expect(snapshotCaptured).not.toBeNull();
    expect(snapshotCaptured.players).toBeDefined();
    const playerIds = Object.keys(snapshotCaptured.players);
    expect(playerIds).toHaveLength(4);
    expect(playerIds).toContain('local-p1');
    expect(playerIds).toContain('local-p2');
    expect(playerIds).toContain('local-p3');
    expect(playerIds).toContain('local-p4');

    // Verify all 4 players have distinct slotIndex (0-3)
    const p1 = snapshotCaptured.players['local-p1'];
    const p2 = snapshotCaptured.players['local-p2'];
    const p3 = snapshotCaptured.players['local-p3'];
    const p4 = snapshotCaptured.players['local-p4'];

    expect(p1.slotIndex).toBe(0);
    expect(p2.slotIndex).toBe(1);
    expect(p3.slotIndex).toBe(2);
    expect(p4.slotIndex).toBe(3);

    // Verify spawn facing direction
    // P1 & P2 have no input yet (no keys pressed), so they remain at spawn facing
    expect(p1.facing).toBe(1); // slot 0: spawn facing right
    expect(p2.facing).toBe(-1); // slot 1: spawn facing left
    
    // CRITICAL: P3 and P4 facing show that GAMEPAD INPUT is applied
    // P3 mock returns LEFT → p3 faces left (-1)
    // P4 mock returns RIGHT → p4 faces right (1)
    expect(p3.facing).toBe(-1); // P3 holds LEFT: faces left
    expect(p4.facing).toBe(1); // P4 holds RIGHT: faces right

    // Verify initial spawn positions are different (index-based)
    // Each slot should have different SPAWN_POSITIONS
    expect(p1.x).not.toBe(p2.x);
    expect(p2.x).not.toBe(p3.x);
    expect(p3.x).not.toBe(p4.x);

    // Cleanup
    match.cleanup();
  });

  it('accepts 2 controllers (backward compat) and creates valid match', () => {
    const p1Ctrl = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
    });

    const p2Ctrl = new LocalPlayerController({
      playerId: 'local-p2',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 1,
    });

    const match = new LocalMatch([p1Ctrl, p2Ctrl]);
    expect(match['controllers'].length).toBe(2);

    let snapshotCaptured: any = null;
    match.onSnapshot = (snapshot) => {
      snapshotCaptured = snapshot;
    };

    match['tick']();

    expect(snapshotCaptured).not.toBeNull();
    expect(Object.keys(snapshotCaptured.players)).toHaveLength(2);

    match.cleanup();
  });

  it('LocalMatch passes gamepadSource from config to InputManager', () => {
    const mockGamepad = {
      getHeldBits: vi.fn(() => INPUT_BITS.JUMP),
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    const ctrl = new LocalPlayerController({
      playerId: 'test-player',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
      gamepadSource: mockGamepad,
    });

    // Verify gamepadSource was passed to InputManager
    const inputManager = (ctrl as any).inputManager;
    expect((inputManager as any).gamepadSource).toBe(mockGamepad);

    ctrl.destroy();
  });
});
