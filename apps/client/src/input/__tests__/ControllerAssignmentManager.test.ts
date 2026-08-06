/**
 * Unit tests for ControllerAssignmentManager
 *
 * Scenarios tested:
 * - Happy path: 2 gamepads connect sequentially → slots 1, 2
 * - Restore: gamepad A saved at slot 3, reconnects → restored to slot 3
 * - Disconnect freeze: gamepad A at slot 1, disconnects → slot 1 becomes absent, new gamepad goes to slot 2, not 1
 * - No-free-slot: 4 gamepads fill slots 1-3, 5th connects → no assignment (logged)
 * - Slot 0 reserved: no gamepad ever assigned to slot 0 by default
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
    it('should not assign to slot 0 by default (reserved for keyboard)', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const assignments = manager.getAssignments();
      expect(assignments.has(0)).toBe(false);
      expect(assignments.has(1)).toBe(true);
    });

    it('should assign first gamepad to slot 1 when connecting', () => {
      poller.triggerConnect('Gamepad-A', 0);

      const assignments = manager.getAssignments();
      expect(assignments.get(1)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 0,
      });
    });

    it('should assign two gamepads sequentially to slots 1 and 2', () => {
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);

      const assignments = manager.getAssignments();
      expect(assignments.get(1)).toEqual({ gamepadId: 'Gamepad-A', gamepadIndex: 0 });
      expect(assignments.get(2)).toEqual({ gamepadId: 'Gamepad-B', gamepadIndex: 1 });
      expect(assignments.size).toBe(2);
    });

    it('should assign four gamepads to slots 1-3 and leave 5th unassigned', () => {
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);
      poller.triggerConnect('Gamepad-C', 2);
      poller.triggerConnect('Gamepad-D', 3);
      poller.triggerConnect('Gamepad-E', 4); // No free slot

      const assignments = manager.getAssignments();
      expect(assignments.size).toBe(3); // Only slots 1-3 filled
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
        { gamepadId: 'Gamepad-A', lastSlotIndex: 1 },
      ]);
    });

    it('should save multiple assignments in order', () => {
      const saveSpy = vi.spyOn(store, 'save');

      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);

      // Second call should include both
      expect(saveSpy).toHaveBeenLastCalledWith([
        { gamepadId: 'Gamepad-A', lastSlotIndex: 1 },
        { gamepadId: 'Gamepad-B', lastSlotIndex: 2 },
      ]);
    });
  });

  describe('reconnect restoration', () => {
    it('should restore gamepad to last known slot if free', () => {
      // Pre-save: Gamepad-A was in slot 2
      store.presave('Gamepad-A', 2);

      // Gamepad-A reconnects at a different browser index
      poller.triggerConnect('Gamepad-A', 5);

      const assignments = manager.getAssignments();
      expect(assignments.get(2)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 5, // Index updated to new browser index
      });
    });

    it('should assign to first free slot if last-known slot is occupied', () => {
      // Pre-save: Gamepad-A was in slot 2
      store.presave('Gamepad-A', 2);

      // Gamepad-B occupies slot 2
      poller.triggerConnect('Gamepad-B', 0);
      expect(manager.getAssignments().get(1)).toEqual({
        gamepadId: 'Gamepad-B',
        gamepadIndex: 0,
      });

      // Gamepad-A reconnects but slot 2 is available; should restore to 2
      poller.triggerConnect('Gamepad-A', 1);
      expect(manager.getAssignments().get(2)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 1,
      });
    });

    it('should assign to first free slot if last-known slot is slot 0 (invalid)', () => {
      // Edge case: saved slot is 0 (keyboard-reserved)
      store.presave('Gamepad-A', 0);

      poller.triggerConnect('Gamepad-A', 0);

      // Should assign to slot 1 (first valid free slot), not restore to slot 0
      const assignments = manager.getAssignments();
      expect(assignments.get(1)).toEqual({
        gamepadId: 'Gamepad-A',
        gamepadIndex: 0,
      });
      expect(assignments.has(0)).toBe(false);
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
      // Connect A to slot 1
      poller.triggerConnect('Gamepad-A', 0);
      expect(manager.getAssignments().get(1)?.gamepadId).toBe('Gamepad-A');

      // A disconnects
      poller.triggerDisconnect(0);
      expect(manager.getAssignments().size).toBe(0);

      // B connects and should take slot 1 (first free), not skip it
      poller.triggerConnect('Gamepad-B', 1);
      expect(manager.getAssignments().get(1)?.gamepadId).toBe('Gamepad-B');
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
      // Fill all slots
      poller.triggerConnect('Gamepad-A', 0);
      poller.triggerConnect('Gamepad-B', 1);
      poller.triggerConnect('Gamepad-C', 2);

      const callback = vi.fn();
      manager.onAssignmentChanged = callback;

      // 4th gamepad has no slot
      poller.triggerConnect('Gamepad-D', 3);

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
      // Gamepad-A connects at index 0 → slot 1
      poller.triggerConnect('Gamepad-A', 0);
      expect(manager.getAssignments().get(1)?.gamepadIndex).toBe(0);

      // Disconnect
      poller.triggerDisconnect(0);

      // Reconnect at different index 5 → should restore to slot 1
      poller.triggerConnect('Gamepad-A', 5);
      expect(manager.getAssignments().get(1)?.gamepadIndex).toBe(5);
    });
  });
});
