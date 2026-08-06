import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderControlsScreen } from '../ControlsScreen';
import type { ControllerAssignmentManager, SlotAssignment } from '../../input/ControllerAssignmentManager';
import type { GamepadPreferenceStore } from '@smash/gamepad-input';

function createMockAssignmentManager(
  assignments: Map<number, SlotAssignment> = new Map(),
): ControllerAssignmentManager {
  return {
    getAssignments: () => new Map(assignments),
    onAssignmentChanged: null,
  } as unknown as ControllerAssignmentManager;
}

function createMockPreferenceStore(): GamepadPreferenceStore {
  return {
    save: vi.fn(),
    load: vi.fn().mockReturnValue([]),
    findSlotForGamepadId: vi.fn().mockReturnValue(null),
  } as unknown as GamepadPreferenceStore;
}

describe('ControlsScreen', () => {
  let container: HTMLElement;
  let onBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
    onBack = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders keyboard label for slot 0 and gamepad label for slot 1', () => {
    const assignments = new Map<number, SlotAssignment>();
    assignments.set(1, { gamepadId: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', gamepadIndex: 0 });

    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(assignments),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    expect(container.innerHTML).toContain('Keyboard');
    expect(container.innerHTML).toContain('Xbox Controller');
    expect(container.innerHTML).toContain('Unassigned'); // slots 2,3

    destroy();
  });

  it('renders all 8 action labels per slot', () => {
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    for (const action of ['LEFT', 'RIGHT', 'JUMP', 'DOWN', 'ATTACK', 'SPECIAL', 'SHIELD', 'GRAB']) {
      expect(container.innerHTML).toContain(action);
    }

    destroy();
  });

  it('rebind: click Rebind on LEFT for slot 0, press KeyQ, updates DOM and localStorage', () => {
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    // Click rebind button for slot 0 LEFT
    const rebindBtn = document.getElementById('rebind-0-LEFT');
    expect(rebindBtn).not.toBeNull();
    rebindBtn!.click();

    // Should show listening state
    expect(document.getElementById('rebind-0-LEFT')!.textContent).toBe('Press a key or button...');

    // Dispatch keydown for KeyQ
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ', bubbles: true }));

    // After rebind, binding should show KeyQ
    const bindingEl = document.getElementById('binding-0-LEFT');
    expect(bindingEl!.textContent).toBe('KeyQ');

    // localStorage should contain KeyQ
    const stored = localStorage.getItem('smash:keymap:0');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed['KeyQ']).toBe(0x0001); // INPUT_BITS.LEFT

    destroy();
  });

  it('rebind: pressing ESC cancels without changing binding', () => {
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    const rebindBtn = document.getElementById('rebind-0-LEFT');
    rebindBtn!.click();

    // Press ESC
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));

    // Binding should still show original key (ArrowLeft or KeyA — first match from default)
    const bindingEl = document.getElementById('binding-0-LEFT');
    expect(bindingEl!.textContent).not.toBe('...');
    expect(bindingEl!.textContent).not.toBe('Escape');

    // localStorage should NOT have been set
    const stored = localStorage.getItem('smash:keymap:0');
    expect(stored).toBeNull();

    destroy();
  });

  it('reset to default restores original keymap', () => {
    // First, rebind something
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    // Rebind LEFT to KeyQ
    document.getElementById('rebind-0-LEFT')!.click();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ', bubbles: true }));
    expect(localStorage.getItem('smash:keymap:0')).not.toBeNull();

    // Click reset
    document.getElementById('reset-slot-0')!.click();

    // localStorage should be updated to default
    const stored = JSON.parse(localStorage.getItem('smash:keymap:0')!);
    expect(stored['ArrowLeft']).toBe(0x0001); // restored default

    // KeyQ should no longer be in the map
    expect(stored['KeyQ']).toBeUndefined();

    destroy();
  });

  it('back button calls onBack', () => {
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    document.getElementById('controls-back-btn')!.click();
    expect(onBack).toHaveBeenCalledOnce();

    destroy();
  });

  it('destroy removes listeners and clears container', () => {
    const { destroy } = renderControlsScreen(container, {
      assignmentManager: createMockAssignmentManager(),
      preferenceStore: createMockPreferenceStore(),
      onBack,
    });

    destroy();
    expect(container.innerHTML).toBe('');
  });
});
