/**
 * ControllerAssignmentManager - Auto-assigns connected gamepads to slots with persistence
 *
 * Responsibilities:
 * - Wire connect/disconnect callbacks from GamepadPoller
 * - On connect: restore to last slot if free, else assign to first free slot (slot 0 reserved for keyboard)
 * - On disconnect: mark slot as absent (freeze to no-input), do NOT reassign
 * - Persist assignments via GamepadPreferenceStore on every change
 * - Provide read-only getAssignments() and onAssignmentChanged callback
 */

import type { GamepadPoller, GamepadPreferenceStore } from '@smash/gamepad-input';

/**
 * Represents an active slot assignment
 */
export interface SlotAssignment {
  /** Gamepad's unique device ID (stable across reconnects) */
  gamepadId: string;
  /** Browser's gamepad.index (may differ on reconnect) */
  gamepadIndex: number;
}

/**
 * Manages automatic assignment of gamepads to input slots
 */
export class ControllerAssignmentManager {
  private poller: GamepadPoller;
  private store: GamepadPreferenceStore;
  private maxSlots: number;
  private assignments: Map<number, SlotAssignment>; // slotIndex → {gamepadId, gamepadIndex}

  /** Callback fired when assignments change (connect/disconnect/restore) */
  onAssignmentChanged: (() => void) | null = null;

  constructor(poller: GamepadPoller, store: GamepadPreferenceStore, maxSlots = 4) {
    this.poller = poller;
    this.store = store;
    this.maxSlots = maxSlots;
    this.assignments = new Map();

    // Load persisted assignments (for reference during reconnect)
    // Note: We don't restore them immediately; only use the saved data to detect known gamepadIds
    const saved = this.store.load();
    console.log('[ControllerAssignmentManager] loaded', saved.length, 'saved assignments');

    // Wire callbacks BEFORE starting poller
    this.poller.onConnect = (gamepad: Gamepad) => this.handleConnect(gamepad);
    this.poller.onDisconnect = (gamepadIndex: number) => this.handleDisconnect(gamepadIndex);

    // Start polling (triggers Chrome late-connect workaround and future connect events)
    this.poller.start();
  }

  /**
   * Get current slot assignments (read-only)
   * @returns Map keyed by slot index (0-3), values are {gamepadId, gamepadIndex}
   */
  getAssignments(): ReadonlyMap<number, SlotAssignment> {
    return new Map(this.assignments);
  }

  /**
   * Handle gamepad connect event
   * Logic:
   * 1. Check if this gamepad was previously assigned (gamepad.id in saved assignments)
   * 2. If yes and that slot is free, restore to it
   * 3. Else, assign to first free slot (excluding slot 0, reserved for keyboard)
   * 4. If no free slot, do nothing (connected but unassigned)
   * 5. Persist and fire callback
   */
  private handleConnect = (gamepad: Gamepad): void => {
    console.log('[ControllerAssignmentManager] connect:', gamepad.id, 'index:', gamepad.index);

    // Check if this gamepad was previously saved to a slot
    const lastKnownSlot = this.store.findSlotForGamepadId(gamepad.id);

    let assignedSlot: number | null = null;

    // Try to restore to last known slot if it's free
    if (lastKnownSlot !== null && lastKnownSlot > 0 && lastKnownSlot < this.maxSlots) {
      if (!this.assignments.has(lastKnownSlot)) {
        assignedSlot = lastKnownSlot;
        console.log(`[ControllerAssignmentManager] restored ${gamepad.id} to slot ${lastKnownSlot}`);
      }
    }

    // If not restored, find first free slot (excluding slot 0)
    if (assignedSlot === null) {
      for (let slot = 1; slot < this.maxSlots; slot++) {
        if (!this.assignments.has(slot)) {
          assignedSlot = slot;
          console.log(`[ControllerAssignmentManager] assigned ${gamepad.id} to slot ${slot}`);
          break;
        }
      }
    }

    // If a slot was found, assign and persist
    if (assignedSlot !== null) {
      this.assignments.set(assignedSlot, {
        gamepadId: gamepad.id,
        gamepadIndex: gamepad.index,
      });
      this.persist();
      this.onAssignmentChanged?.();
    } else {
      console.log(
        `[ControllerAssignmentManager] no free slots for ${gamepad.id} (all ${this.maxSlots} slots occupied)`,
      );
    }
  };

  /**
   * Handle gamepad disconnect event
   * Logic:
   * 1. Find the slot containing this gamepad.index
   * 2. Remove it from assignments (mark as absent, freeze to no-input)
   * 3. Do NOT reassign another controller to this slot
   * 4. Persist and fire callback
   */
  private handleDisconnect = (gamepadIndex: number): void => {
    console.log('[ControllerAssignmentManager] disconnect: gamepad index', gamepadIndex);

    // Find the slot that has this gamepad index
    let disconnectedSlot: number | null = null;
    for (const [slot, assignment] of this.assignments) {
      if (assignment.gamepadIndex === gamepadIndex) {
        disconnectedSlot = slot;
        break;
      }
    }

    if (disconnectedSlot !== null) {
      const assignment = this.assignments.get(disconnectedSlot)!;
      console.log(`[ControllerAssignmentManager] slot ${disconnectedSlot} disconnected: ${assignment.gamepadId}`);
      this.assignments.delete(disconnectedSlot);
      this.persist();
      this.onAssignmentChanged?.();
    }
  };

  /**
   * Persist current assignments to storage
   */
  private persist(): void {
    const toSave = Array.from(this.assignments.entries()).map(([slot, assignment]) => ({
      gamepadId: assignment.gamepadId,
      lastSlotIndex: slot,
    }));
    this.store.save(toSave);
  }
}
