import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalPlayerController } from '../LocalPlayerController.js';
import { LocalMatch } from '../LocalMatch.js';
import { DEFAULT_KEYMAP_P1, DEFAULT_KEYMAP_P2, DEFAULT_KEYMAP_P3, DEFAULT_KEYMAP_P4 } from '../../input/keymaps.js';
import { INPUT_BITS, MoveId, PlayerStateEnum } from '@smash/shared';
import type { GamepadInputSource } from '../../input/GamepadInputSource.js';
import type { ITickController } from '../types.js';

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
    expect(match['controllers'][0]?.playerId).toBe('local-p1');
    expect(match['controllers'][1]?.playerId).toBe('local-p2');
    expect(match['controllers'][2]?.playerId).toBe('local-p3');
    expect(match['controllers'][3]?.playerId).toBe('local-p4');

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

  it('4-player local match integration test - 10 ticks with mixed keyboard/gamepad inputs', () => {
    // Create mock gamepad sources with distinct fixed bits for P3 and P4
    const mockGamepadP3 = {
      getHeldBits: vi.fn(() => INPUT_BITS.LEFT), // P3 always holds LEFT
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    const mockGamepadP4 = {
      getHeldBits: vi.fn(() => INPUT_BITS.RIGHT), // P4 always holds RIGHT
      updateGamepadIndex: vi.fn(),
    } as unknown as GamepadInputSource;

    // Construct 4 LocalPlayerControllers:
    // - P1: keyboard (DEFAULT_KEYMAP_P1), no input (idle)
    // - P2: keyboard (DEFAULT_KEYMAP_P2), no input (idle)
    // - P3: gamepad (mocked LEFT input)
    // - P4: gamepad (mocked RIGHT input)
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
      keymap: DEFAULT_KEYMAP_P3, // Keyboard fallback (not used, gamepad takes precedence)
      slotIndex: 2,
      gamepadSource: mockGamepadP3,
    });

    const p4Controller = new LocalPlayerController({
      playerId: 'local-p4',
      keymap: DEFAULT_KEYMAP_P4, // Keyboard fallback (not used, gamepad takes precedence)
      slotIndex: 3,
      gamepadSource: mockGamepadP4,
    });

    // Build LocalMatch with all 4 controllers
    const match = new LocalMatch([p1Controller, p2Controller, p3Controller, p4Controller]);

    // Verify engine was initialized with 4 controllers
    expect(match['controllers'].length).toBe(4);
    expect(match['controllers'][0]?.playerId).toBe('local-p1');
    expect(match['controllers'][1]?.playerId).toBe('local-p2');
    expect(match['controllers'][2]?.playerId).toBe('local-p3');
    expect(match['controllers'][3]?.playerId).toBe('local-p4');

    // Capture snapshots across multiple ticks
    const snapshots: any[] = [];
    match.onSnapshot = (snapshot) => {
      snapshots.push(snapshot);
    };

    // Tick 10 times to allow movement to accumulate
    for (let i = 0; i < 10; i++) {
      match['tick']();
    }

    // Verify we captured 10 snapshots
    expect(snapshots.length).toBe(10);

    // Take the final snapshot for assertions
    const finalSnapshot = snapshots[snapshots.length - 1];
    expect(finalSnapshot).not.toBeNull();
    expect(finalSnapshot.players).toBeDefined();

    // Verify all 4 players exist in final snapshot
    const playerIds = Object.keys(finalSnapshot.players);
    expect(playerIds).toHaveLength(4);
    expect(playerIds).toContain('local-p1');
    expect(playerIds).toContain('local-p2');
    expect(playerIds).toContain('local-p3');
    expect(playerIds).toContain('local-p4');

    // Verify all 4 players have distinct slotIndex (0-3)
    const p1 = finalSnapshot.players['local-p1'];
    const p2 = finalSnapshot.players['local-p2'];
    const p3 = finalSnapshot.players['local-p3'];
    const p4 = finalSnapshot.players['local-p4'];

    expect(p1.slotIndex).toBe(0);
    expect(p2.slotIndex).toBe(1);
    expect(p3.slotIndex).toBe(2);
    expect(p4.slotIndex).toBe(3);

    // Verify movement reflects distinct inputs after 10 ticks:
    // - P1 & P2 have no input (keyboard idle) → remain near spawn x positions
    // - P3 holds LEFT (gamepad) → x position should decrease (move left from spawn)
    // - P4 holds RIGHT (gamepad) → x position should increase (move right from spawn)
    
    // Capture initial positions from first snapshot
    const initialSnapshot = snapshots[0];
    const p1Initial = initialSnapshot.players['local-p1'];
    const p2Initial = initialSnapshot.players['local-p2'];
    const p3Initial = initialSnapshot.players['local-p3'];
    const p4Initial = initialSnapshot.players['local-p4'];

    // P1 & P2: no input → x should remain unchanged (or very close due to physics rounding)
    expect(Math.abs(p1.x - p1Initial.x)).toBeLessThan(5); // Allow small physics drift
    expect(Math.abs(p2.x - p2Initial.x)).toBeLessThan(5);

    // P3: LEFT input → x should decrease significantly over 10 ticks
    expect(p3.x).toBeLessThan(p3Initial.x);
    expect(p3Initial.x - p3.x).toBeGreaterThan(5); // At least 5 units moved left (realistic for 10 ticks)

    // P4: RIGHT input → x should increase significantly over 10 ticks
    expect(p4.x).toBeGreaterThan(p4Initial.x);
    expect(p4.x - p4Initial.x).toBeGreaterThan(5); // At least 5 units moved right (realistic for 10 ticks)

    // Verify all 4 players have different x positions at end (distinct trajectories)
    const xPositions = [p1.x, p2.x, p3.x, p4.x];
    const uniqueXPositions = new Set(xPositions);
    expect(uniqueXPositions.size).toBe(4); // All 4 x positions are distinct

    // Verify facing directions reflect input:
    // - P3 holds LEFT → faces left (-1)
    // - P4 holds RIGHT → faces right (1)
    expect(p3.facing).toBe(-1);
    expect(p4.facing).toBe(1);

    // Cleanup
    match.cleanup();
  });

  it('clears hitEvents after each local snapshot so flash is not retriggered forever', () => {
    const p1Controller = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
    });

    const p2Controller = new LocalPlayerController({
      playerId: 'local-p2',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 1,
    });

    const match = new LocalMatch([p1Controller, p2Controller]);
    const engine = (match as any).engine;
    const state = (engine as any).state;

    // Prime deterministic overlap hit setup for one jab hit on next tick.
    state.players['local-p1'] = {
      ...state.players['local-p1'],
      x: 640,
      y: 300,
      facing: 1,
      state: PlayerStateEnum.ATTACK,
      stateFrame: 2,
      isGrounded: true,
      isInvincible: false,
      invincibilityFrames: 0,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      currentMoveId: MoveId.JAB,
      hitPlayerIds: new Set<string>(),
      activeHitbox: {
        offsetX: 0,
        offsetY: 0,
        radius: 20,
        damage: 4,
        baseKnockback: 12,
        knockbackGrowth: 100,
        knockbackAngle: 45,
        hitlagFrames: 3,
        hitstunFrames: 8,
        priority: 2,
      },
    };

    state.players['local-p2'] = {
      ...state.players['local-p2'],
      x: 650,
      y: 300,
      state: PlayerStateEnum.IDLE,
      stateFrame: 0,
      isGrounded: true,
      isInvincible: false,
      invincibilityFrames: 0,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      activeHitbox: null,
      currentMoveId: null,
    };

    const snapshots: any[] = [];
    match.onSnapshot = (snapshot) => snapshots.push(snapshot);

    match['tick']();
    match['tick']();

    expect(snapshots.length).toBe(2);
    expect(snapshots[0].hitEvents).toHaveLength(1);
    expect(snapshots[1].hitEvents).toEqual([]);

    match.cleanup();
  });
});

describe('LocalMatch ITickController.observe() wiring', () => {
  it('calls observe() on all controllers after each tick (mixed human+AI)', () => {
    // Create a mock AI controller that implements ITickController with observe
    const mockAIController: ITickController = {
      playerId: 'ai-p3',
      slotIndex: 2,
      setTick: vi.fn(),
      pollInput: vi.fn(() => null),
      destroy: vi.fn(),
      observe: vi.fn(),
    };

    // Create a real human controller (LocalPlayerController)
    const humanController = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
    });

    // Construct LocalMatch with mixed controllers
    const match = new LocalMatch([humanController, mockAIController]);

    let snapshotCaptured: any = null;
    match.onSnapshot = (snapshot) => {
      snapshotCaptured = snapshot;
    };

    // Tick 3 times
    match['tick']();
    match['tick']();
    match['tick']();

    // Verify observe was called 3 times with GameState
    expect(mockAIController.observe).toHaveBeenCalledTimes(3);

    // Verify each call received a valid GameState object
    const calls = (mockAIController.observe as any).mock.calls;
    for (const [state] of calls) {
      expect(state).toBeDefined();
      expect(state.matchPhase).toBeDefined();
      expect(state.players).toBeDefined();
    }

    // Cleanup
    match.cleanup();
  });

  it('does not throw when human-only controllers have no observe method (regression)', () => {
    // Create 2 human controllers (LocalPlayerController does not implement observe)
    const p1Controller = new LocalPlayerController({
      playerId: 'local-p1',
      keymap: DEFAULT_KEYMAP_P1,
      slotIndex: 0,
    });

    const p2Controller = new LocalPlayerController({
      playerId: 'local-p2',
      keymap: DEFAULT_KEYMAP_P2,
      slotIndex: 1,
    });

    // Construct LocalMatch with only human controllers
    const match = new LocalMatch([p1Controller, p2Controller]);

    let snapshotCaptured: any = null;
    match.onSnapshot = (snapshot) => {
      snapshotCaptured = snapshot;
    };

    // Tick multiple times - should not throw
    expect(() => {
      for (let i = 0; i < 5; i++) {
        match['tick']();
      }
    }).not.toThrow();

    // Verify snapshots were still captured
    expect(snapshotCaptured).not.toBeNull();
    expect(snapshotCaptured.players).toBeDefined();

    // Cleanup
    match.cleanup();
  });
});
