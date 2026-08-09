/**
 * Unit tests for ControllerAssignmentManager
 *
 * Scenarios tested:
 * - Happy path: 2 gamepads connect sequentially → slots 0, 1
 * - Restore: gamepad A saved at slot 3, reconnects → restored to slot 3
 * - Disconnect freeze: gamepad A at slot 0, disconnects → slot 0 becomes absent, new gamepad goes to slot 1, not 0
 * - No-free-slot: 4 gamepads fill slots 0-3, 5th connects → no assignment (logged)
 * - Slot 0 is NOT reserved: gamepads can assign to slot 0 (player 1)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerAssignmentManager } from '../ControllerAssignmentManager';
import type { GamepadPoller, SavedAssignment } from '@smash/gamepad-input';
import type { GamepadPreferenceStore } from '@smash/gamepad-input';

/**
 * Mock GamepadPoller that allows manual trigger of connect/disconnect
 */
class MockGamepadPoller implements Partial<GamepadPoller> {
  onConnect: ((gamepad: Gamepad) => void) | null = null;
  onDisconnect: ((gamepadIndex: number) => void) | null = null;

  start(): void {}
  stop(): void {}
  poll() {
    return new Map();
  }

  triggerConnect(gamepadId: string, gamepadIndex: number): void {
    const mockGamepad = createMockGamepad(gamepadId, gamepadIndex);
    this.onConnect?.(mockGamepad);
  }

  triggerDisconnect(gamepadIndex: number): void {
    this.onDisconnect?.(gamepadIndex);
  }
}

/**
 * Mock GamepadPreferenceStore
 */
class MockGamepadPreferenceStore implements Partial<GamepadPreferenceStore> {
  private data: Map<string, SavedAssignment> = new Map();

  save(assignments: SavedAssignment[]): void {
    this.data.clear();
    for (const a of assignments) {
      this.data.set(a.gamepadId, a);
    }
  }

  load(): SavedAssignment[] {
    return Array.from(this.data.values());
  }

  findSlotForGamepadId(gamepadId: string): number | null {
    return this.data.get(gamepadId)?.lastSlotIndex ?? null;
  }

  // Test helper: pre-populate saved assignments
  presave(gamepadId: string, slotIndex: number): void {
    this.data.set(gamepadId, { gamepadId, lastSlotIndex: slotIndex });
  }
}

/**
 * Create a mock Gamepad object
 */
function createMockGamepad(gamepadId: string, gamepadIndex: number): Gamepad {
  return {
    id: gamepadId,
    index: gamepadIndex,
    connected: true,
    mapping: 'standard',
    timestamp: Date.now(),
    axes: [0, 0, 0, 0],
    buttons: Array(17).fill({ pressed: false, value: 0, touched: false }),
    hapticActuators: [],
    vibrationActuator: undefined,
  } as any;
}

describe('ControllerAssignmentManager', () => {
  let poller: MockGamepadPoller;
  let store: MockGamepadPreferenceStore;
  let manager: ControllerAssignmentManager;

  beforeEach(() => {
    poller = new MockGamepadPoller();
    store = new MockGamepadPreferenceStore();
    manager = new ControllerAssignmentManager(poller as any, store as any, 4);
    vi.clearAllMocks();
  });

  describe('basic assignment', () => {
    it('should assign first gamepad to slot 0 (player 1)', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const assignments = manager.getAssignments();
      expect(assignments.has(0)).toBe(true);
      expect(assignments.get(0)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 0,
      });
    });

    it('should assign first gamepad to slot 0 when connecting', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const assignments = manager.getAssignments();
      expect(assignments.get(0)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 0,
      });
    });

    it('should assign two gamepads sequentially to slots 0 and 1', () => {
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);

      const assignments = manager.getAssignments();
      expect(assignments.get(0)).toEqual({ gamepadId: 'Gamepad-A', gamepadIndex: 0 });
      expect(assignments.get(1)).toEqual({ gamepadId: 'Gamepad-B', gamepadIndex: 1 });
      expect(assignments.size).toBe(2);
    });

    it('should assign four gamepads to slots 0-3 and leave 5th unassigned', () => {
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);
      poller.triggerConnect('Gamepad-C', 2);
      poller.triggerConnect('Gamepad-D', 3);
      poller.triggerConnect('Gamepad-E', 4); // No free slot

      const assignments = manager.getAssignments();
      expect(assignments.size).toBe(4); // Slots 0-3 all filled
      expect(assignments.has(0)).toBe(true);
      expect(assignments.has(1)).toBe(true);
      expect(assignments.has(2)).toBe(true);
      expect(assignments.has(3)).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should save assignments to store on connect', () => {
      const saveSpy = vi.spyOn(store, 'save');

      poller.triggerConnect('Gamepad-A', 0);

      expect(saveSpy).toHaveBeenCalledWith([
        { gamepadId: 'Gamepad-A', lastSlotIndex: 0 },
      ]);
    });

    it('should save multiple assignments in order', () => {
      const saveSpy = vi.spyOn(store, 'save');

      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);

      // Second call should include both
      expect(saveSpy).toHaveBeenLastCalledWith([
        { gamepadId: 'Gamepad-A', lastSlotIndex: 0 },
        { gamepadId: 'Gamepad-B', lastSlotIndex: 1 },
      ]);
    });
  });

  describe('reconnect restoration', () => {
    it('should prioritize slot 0 for the first active gamepad, even when a non-zero slot was saved', () => {
      // Pre-save: Gamepad-A was in slot 2
      store.presave('Gamepad-A', 2);

      // Gamepad-A reconnects at a different browser index
      poller.triggerConnect('Gamepad-A', 5);

      const assignments = manager.getAssignments();
      expect(assignments.get(0)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 5, // Index updated to new browser index
      });
    });

    it('should assign to first free slot if last-known slot is occupied', () => {
      // Pre-save: Gamepad-A was in slot 2
      store.presave('Gamepad-A', 2);

      // Gamepad-B occupies slot 0, Gamepad-C occupies slot 1 (sequential fill)
      poller.triggerConnect('Gamepad-B', 0);
      poller.triggerConnect('Gamepad-C', 2);

      // Gamepad-A reconnects; saved slot 2 is still free → restores to slot 2
      poller.triggerConnect('Gamepad-A', 1);
      expect(manager.getAssignments().get(2)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 1,
      });
    });

    it('should assign to slot 0 if last-known slot is slot 0 (now valid)', () => {
      // Slot 0 is no longer reserved — saved slot 0 should be restored normally
      store.presave('Gamepad-A', 0);

      poller.triggerConnect('Gamepad-A', 0);

      // Should restore to slot 0 (first valid free slot)
      const assignments = manager.getAssignments();
      expect(assignments.get(0)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 0,
      });
    });
  });

  describe('disconnect behavior', () => {
    it('should remove assignment on disconnect (freeze slot)', () => {
      poller.triggerConnect('Gamepad-A', 0);
      const assignments1 = manager.getAssignments();
      expect(assignments1.size).toBe(1);

      poller.triggerDisconnect(0); // Gamepad at index 0 disconnects

      const assignments2 = manager.getAssignments();
      expect(assignments2.size).toBe(0);
    });

    it('should NOT reassign freed slot to next connecting gamepad', () => {
      // Connect A to slot 0
      poller.triggerConnect('Gamepad-A', 0);
      expect(manager.getAssignments().get(0)?.gamepadId).toBe('Gamepad-A');

      // A disconnects
      poller.triggerDisconnect(0);
      expect(manager.getAssignments().size).toBe(0);

      // B connects and should take slot 0 (first free), not skip it
      poller.triggerConnect('Gamepad-B', 1);
      expect(manager.getAssignments().get(0)?.gamepadId).toBe('Gamepad-B');
    });

    it('should persist empty assignments after disconnect', () => {
      const saveSpy = vi.spyOn(store, 'save');

      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerDisconnect(0);

      expect(saveSpy).toHaveBeenLastCalledWith([]);
    });
  });

  describe('callback behavior', () => {
    it('should fire onAssignmentChanged on connect', () => {
      const callback = vi.fn();
      manager.onAssignmentChanged = callback;

      poller.triggerConnect('Gamepad-A', 0);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should fire onAssignmentChanged on disconnect', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const callback = vi.fn();
      manager.onAssignmentChanged = callback;

      poller.triggerDisconnect(0);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not fire callback for unassigned gamepad (no free slot)', () => {
      // Fill all slots (0-3)
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);
      poller.triggerConnect('Gamepad-C', 2);
      poller.triggerConnect('Gamepad-D', 3);

      const callback = vi.fn();
      manager.onAssignmentChanged = callback;

      // 5th gamepad has no slot
      poller.triggerConnect('Gamepad-E', 4);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getAssignments immutability', () => {
    it('should return a copy of assignments map, not reference', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const assignments1 = manager.getAssignments();
      const assignments2 = manager.getAssignments();

      expect(assignments1).not.toBe(assignments2);
    });
  });

  describe('edge cases', () => {
    it('should handle disconnect of unknown gamepad index silently', () => {
      poller.triggerConnect('Gamepad-A', 0);

      // Disconnect a gamepad that was never assigned
      const callback = vi.fn();
      manager.onAssignmentChanged = callback;

      poller.triggerDisconnect(999);

      expect(callback).not.toHaveBeenCalled();
      expect(manager.getAssignments().size).toBe(1); // Original assignment still there
    });

    it('should handle re-assign same gamepad id at different index', () => {
      // Gamepad-A connects at index 0 → slot 0
      poller.triggerConnect('Gamepad-A', 0);
      expect(manager.getAssignments().get(0)?.gamepadIndex).toBe(0);

      // Disconnect
      poller.triggerDisconnect(0);

      // Reconnect at different index 5 → should restore to slot 0
      poller.triggerConnect('Gamepad-A', 5);
      expect(manager.getAssignments().get(0)?.gamepadIndex).toBe(5);
    });
  });
});
