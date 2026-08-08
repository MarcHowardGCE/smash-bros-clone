import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderLocalPlaySetupScreen } from '../LocalPlaySetupScreen';
import type { ControllerAssignmentManager, SlotAssignment } from '../../input/ControllerAssignmentManager';
import type { SeatConfig } from '../../local/types';

function createMockAssignmentManager(
  assignments: Map<number, SlotAssignment> = new Map(),
): ControllerAssignmentManager {
  return {
    getAssignments: () => new Map(assignments),
    onAssignmentChanged: null,
  } as unknown as ControllerAssignmentManager;
}

describe('LocalPlaySetupScreen', () => {
  let container: HTMLElement;
  let onConfirm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onConfirm = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('happy path - default rendering', () => {
    it('renders with no initial, defaults to 2 Players with 1 seat row at CPU: Medium', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      // 2 Players button should be active (white bg)
      const btns = container.querySelectorAll('.lps-count-btn');
      expect(btns).toHaveLength(3);
      expect((btns[0] as HTMLElement).textContent).toBe('2 Players');

      // One seat row (seat 2)
      const cycleBtn = document.getElementById('lps-cycle-0');
      expect(cycleBtn).not.toBeNull();
      expect(cycleBtn!.textContent).toBe('CPU: Medium');

      // No second seat row
      expect(document.getElementById('lps-cycle-1')).toBeNull();
    });

    it('clicking 4 Players shows 3 seat rows', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      // Click "4 Players"
      const btns = container.querySelectorAll('.lps-count-btn');
      (btns[2] as HTMLElement).click();

      // Should now have 3 seat rows
      expect(document.getElementById('lps-cycle-0')).not.toBeNull();
      expect(document.getElementById('lps-cycle-1')).not.toBeNull();
      expect(document.getElementById('lps-cycle-2')).not.toBeNull();

      // All default to CPU: Medium
      expect(document.getElementById('lps-cycle-0')!.textContent).toBe('CPU: Medium');
      expect(document.getElementById('lps-cycle-1')!.textContent).toBe('CPU: Medium');
      expect(document.getElementById('lps-cycle-2')!.textContent).toBe('CPU: Medium');
    });

    it('clicking 3 Players then back to 2 Players trims seats', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      const btns = container.querySelectorAll('.lps-count-btn');
      // Go to 3
      (btns[1] as HTMLElement).click();
      expect(document.getElementById('lps-cycle-1')).not.toBeNull();

      // Back to 2
      const btns2 = container.querySelectorAll('.lps-count-btn');
      (btns2[0] as HTMLElement).click();
      expect(document.getElementById('lps-cycle-1')).toBeNull();
      expect(document.getElementById('lps-cycle-0')).not.toBeNull();
    });
  });

  describe('cycle-order test', () => {
    it('cycles through CPU: Easy → Medium → Hard without gamepad, never same non-gamepad label twice in a row', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      const labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        const cycleBtn = document.getElementById('lps-cycle-0')!;
        cycleBtn.click();
        const updatedBtn = document.getElementById('lps-cycle-0')!;
        labels.push(updatedBtn.textContent!);
      }

      // Should contain "CPU: Hard" at least once
      expect(labels).toContain('CPU: Hard');

      // Never same non-gamepad label twice in a row
      for (let i = 1; i < labels.length; i++) {
        if (labels[i] !== '2nd Human (Gamepad)') {
          expect(labels[i]).not.toBe(labels[i - 1]);
        }
      }
    });
  });

  describe('gamepad-gated option test', () => {
    it('without gamepad assigned, cycling never shows "2nd Human (Gamepad)"', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(new Map()) },
        null,
        onConfirm,
      );

      const labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        const cycleBtn = document.getElementById('lps-cycle-0')!;
        cycleBtn.click();
        labels.push(document.getElementById('lps-cycle-0')!.textContent!);
      }

      expect(labels).not.toContain('2nd Human (Gamepad)');
    });

    it('with gamepad assigned to slot 1, cycling DOES show "2nd Human (Gamepad)"', () => {
      const assignments = new Map<number, SlotAssignment>();
      assignments.set(1, { gamepadId: 'Xbox Controller', gamepadIndex: 0 });

      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(assignments) },
        null,
        onConfirm,
      );

      const labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        const cycleBtn = document.getElementById('lps-cycle-0')!;
        cycleBtn.click();
        labels.push(document.getElementById('lps-cycle-0')!.textContent!);
      }

      expect(labels).toContain('2nd Human (Gamepad)');
    });

    it('slot 2 gamepad gating is independent of slot 1', () => {
      const assignments = new Map<number, SlotAssignment>();
      // Only slot 2 has a gamepad
      assignments.set(2, { gamepadId: 'Xbox Controller', gamepadIndex: 1 });

      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(assignments) },
        null,
        onConfirm,
      );

      // Switch to 3 players
      const btns = container.querySelectorAll('.lps-count-btn');
      (btns[1] as HTMLElement).click();

      // Seat 1 (slot index 1) should NOT have gamepad option
      const seat1Labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        document.getElementById('lps-cycle-0')!.click();
        seat1Labels.push(document.getElementById('lps-cycle-0')!.textContent!);
      }
      expect(seat1Labels).not.toContain('2nd Human (Gamepad)');

      // Seat 2 (slot index 2) SHOULD have gamepad option
      const seat2Labels: string[] = [];
      for (let i = 0; i < 6; i++) {
        document.getElementById('lps-cycle-1')!.click();
        seat2Labels.push(document.getElementById('lps-cycle-1')!.textContent!);
      }
      expect(seat2Labels).toContain('2nd Human (Gamepad)');
    });
  });

  describe('revalidation test', () => {
    it('downgrades human-gamepad to cpu:medium when gamepad is no longer assigned', () => {
      const initial = {
        participantCount: 2 as const,
        seats: [{ kind: 'human-gamepad' as const }] as SeatConfig[],
      };

      // Empty assignments = gamepad unplugged
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(new Map()) },
        initial,
        onConfirm,
      );

      const cycleBtn = document.getElementById('lps-cycle-0')!;
      expect(cycleBtn.textContent).toBe('CPU: Medium');
    });

    it('preserves human-gamepad when gamepad IS still assigned', () => {
      const assignments = new Map<number, SlotAssignment>();
      assignments.set(1, { gamepadId: 'Xbox Controller', gamepadIndex: 0 });

      const initial = {
        participantCount: 2 as const,
        seats: [{ kind: 'human-gamepad' as const }] as SeatConfig[],
      };

      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(assignments) },
        initial,
        onConfirm,
      );

      const cycleBtn = document.getElementById('lps-cycle-0')!;
      expect(cycleBtn.textContent).toBe('2nd Human (Gamepad)');
    });

    it('revalidates multiple seats independently', () => {
      const assignments = new Map<number, SlotAssignment>();
      // Only slot 2 still has gamepad; slot 1 lost it
      assignments.set(2, { gamepadId: 'Xbox Controller', gamepadIndex: 1 });

      const initial = {
        participantCount: 3 as const,
        seats: [
          { kind: 'human-gamepad' },
          { kind: 'human-gamepad' },
        ] as SeatConfig[],
      };

      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager(assignments) },
        initial,
        onConfirm,
      );

      // Seat 1 (slot 1) should be downgraded
      expect(document.getElementById('lps-cycle-0')!.textContent).toBe('CPU: Medium');
      // Seat 2 (slot 2) should be preserved
      expect(document.getElementById('lps-cycle-1')!.textContent).toBe('2nd Human (Gamepad)');
    });
  });

  describe('Start button', () => {
    it('calls onConfirm with current configuration', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      document.getElementById('lps-start-btn')!.click();

      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onConfirm).toHaveBeenCalledWith({
        participantCount: 2,
        seats: [{ kind: 'cpu', difficulty: 'medium' }],
      });
    });

    it('reflects cycled state in onConfirm result', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      // Cycle seat 0 once: medium → hard
      document.getElementById('lps-cycle-0')!.click();

      document.getElementById('lps-start-btn')!.click();

      expect(onConfirm).toHaveBeenCalledWith({
        participantCount: 2,
        seats: [{ kind: 'cpu', difficulty: 'hard' }],
      });
    });

    it('reflects participant count change in onConfirm result', () => {
      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        null,
        onConfirm,
      );

      // Switch to 3 players
      const btns = container.querySelectorAll('.lps-count-btn');
      (btns[1] as HTMLElement).click();

      document.getElementById('lps-start-btn')!.click();

      expect(onConfirm).toHaveBeenCalledWith({
        participantCount: 3,
        seats: [
          { kind: 'cpu', difficulty: 'medium' },
          { kind: 'cpu', difficulty: 'medium' },
        ],
      });
    });
  });

  describe('initial state', () => {
    it('renders with provided initial participant count and seats', () => {
      const initial = {
        participantCount: 3 as const,
        seats: [
          { kind: 'cpu' as const, difficulty: 'hard' as const },
          { kind: 'cpu' as const, difficulty: 'easy' as const },
        ],
      };

      renderLocalPlaySetupScreen(
        container,
        { assignmentManager: createMockAssignmentManager() },
        initial,
        onConfirm,
      );

      expect(document.getElementById('lps-cycle-0')!.textContent).toBe('CPU: Hard');
      expect(document.getElementById('lps-cycle-1')!.textContent).toBe('CPU: Easy');
    });
  });
});
