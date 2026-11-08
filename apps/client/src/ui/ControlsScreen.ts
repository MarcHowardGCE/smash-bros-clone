import{MenuNavigator}from'./MenuNavigator';
import{resetStickCalibration,type GamepadPoller}from'@smash/gamepad-input';
import { CONTROLLER_PROFILES, controllerBindingLabel, getControllerProfile, getControllerProfileOverride, setControllerProfileOverride } from '../input/controllerProfiles';
import { renderControllerCalibration } from './ControllerCalibration';
/**
 * @fileoverview Controls screen: per-slot device bindings with live rebind.
 *
 * Renders 4 slot rows showing the assigned device, 8 action bindings, Rebind
 * buttons for keyboard slots, and a Reset-to-Default button per slot. Rebind
 * mode listens for the next keydown and reassigns that key. Gamepad slots
 * show button names but are not rebindable (gamepad mapping is fixed). Custom
 * keymaps persist to `localStorage` under the `smash:keymap:N` key.
 *
 * Follows the external-render-function pattern: {@link renderControlsScreen}
 * returns a `{ destroy }` handle so callers can clean up event listeners.
 */

import { INPUT_BITS } from '@smash/shared';
import type { InputBitmask } from '@smash/shared';
import type { GamepadPreferenceStore } from '@smash/gamepad-input';
import type { ControllerAssignmentManager, SlotAssignment } from '../input/ControllerAssignmentManager';
import {
  withTauntDefaults,
  DEFAULT_KEYMAP_P1,
  DEFAULT_KEYMAP_P2,
  DEFAULT_KEYMAP_P3,
  DEFAULT_KEYMAP_P4,
} from '../input/keymaps';

const ACTION_NAMES = ['LEFT', 'RIGHT', 'UP', 'JUMP', 'DOWN', 'ATTACK', 'SPECIAL', 'SHIELD', 'GRAB','TAUNT_UP','TAUNT_SIDE','TAUNT_DOWN'] as const;
type ActionName = (typeof ACTION_NAMES)[number];

const ACTION_BITS: Record<ActionName, InputBitmask> = {
  LEFT: INPUT_BITS.LEFT,
  RIGHT: INPUT_BITS.RIGHT,
  UP: INPUT_BITS.UP,
  JUMP: INPUT_BITS.JUMP,
  DOWN: INPUT_BITS.DOWN,
  ATTACK: INPUT_BITS.ATTACK,
  SPECIAL: INPUT_BITS.SPECIAL,
  SHIELD: INPUT_BITS.SHIELD,
  GRAB: INPUT_BITS.GRAB,
  TAUNT_UP:INPUT_BITS.TAUNT_UP,TAUNT_SIDE:INPUT_BITS.TAUNT_SIDE,TAUNT_DOWN:INPUT_BITS.TAUNT_DOWN,
};

const DEFAULT_KEYMAPS: Record<string, InputBitmask>[] = [
  DEFAULT_KEYMAP_P1,
  DEFAULT_KEYMAP_P2,
  DEFAULT_KEYMAP_P3,
  DEFAULT_KEYMAP_P4,
];

const STORAGE_KEY_PREFIX = 'smash:keymap:';


interface ControlsScreenDeps {
  gamepadPoller?:GamepadPoller|null;
  assignmentManager: ControllerAssignmentManager;
  preferenceStore: GamepadPreferenceStore;
  onBack: () => void;
}

/**
 * Get the device label for a slot.
 */
function getDeviceLabel(slotIndex: number, assignments: ReadonlyMap<number, SlotAssignment>): string {
  const assignment = assignments.get(slotIndex);
  if (!assignment) {
    // Slot 0 defaults to keyboard.
    // Slot 1 defaults to keyboard layout A only when slot 0 is keyboard.
    if (slotIndex === 0) return 'Keyboard';
    if (slotIndex === 1) {
      return assignments.has(0) ? 'Unassigned' : 'Keyboard (Layout A)';
    }
    return 'Unassigned';
  }
  return getControllerProfile(assignment.gamepadId).name;
}

function isUnassignedSlot(slotIndex: number, assignments: ReadonlyMap<number, SlotAssignment>): boolean {
  if (assignments.has(slotIndex)) {
    return false;
  }

  if (slotIndex === 0) {
    return false;
  }

  if (slotIndex === 1) {
    return assignments.has(0);
  }

  return true;
}

function getGamepadButtonName(
  slotIndex: number,
  assignments: ReadonlyMap<number, SlotAssignment>,
  action: ActionName,
): string {
  const assignment = assignments.get(slotIndex);
  if (!assignment) return '—';

  return controllerBindingLabel(getControllerProfile(assignment.gamepadId), action);
}

/**
 * Load custom keymap from localStorage, or return the default.
 */
function loadKeymap(slotIndex: number): Record<string, InputBitmask> {
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slotIndex}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return withTauntDefaults(parsed as Record<string,InputBitmask>,DEFAULT_KEYMAPS[slotIndex]!);
    } catch { /* fall through */ }
  }
  return { ...DEFAULT_KEYMAPS[slotIndex]! };
}

/**
 * Save custom keymap to localStorage.
 */
function saveKeymap(slotIndex: number, keymap: Record<string, InputBitmask>): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${slotIndex}`, JSON.stringify(keymap));
}

/**
 * Find the key bound to a specific action bit in a keymap.
 * Returns the first matching key, or '—' if none.
 */
function findKeyForAction(keymap: Record<string, InputBitmask>, actionBit: InputBitmask): string {
  for (const [key, bit] of Object.entries(keymap)) {
    if (bit === actionBit) return key;
  }
  return '—';
}

/**
 * Render the controls/settings screen.
 */
export function renderControlsScreen(
  container: HTMLElement,
  deps: ControlsScreenDeps,
): { destroy: () => void } {
  const { assignmentManager, onBack } = deps;
  const keymaps: Record<string, InputBitmask>[] = [0, 1, 2, 3].map(i => loadKeymap(i));
  const listeners: Array<() => void> = [];
  let listeningState: { slotIndex: number; action: ActionName; cleanup: () => void } | null = null;

  let controllerNav:MenuNavigator|null=null;
  let calibrationCleanup:Array<()=>void>=[];
  function render(): void {
    controllerNav?.stop();
    for(const cleanup of calibrationCleanup)cleanup();calibrationCleanup=[];
    const currentAssignments = assignmentManager.getAssignments();
    let html = `
      <div class="overlay-center controls-screen" style="max-width:900px;width:100%;align-items:stretch;max-height:calc(100vh - 32px);overflow-y:auto;padding:16px;box-sizing:border-box;background:rgba(9,18,30,.94);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
          <div style="text-align:left"><div class="controls-heading" style="font-size:32px;letter-spacing:2px">CONTROLS</div><div class="controls-help" style="font-size:12px;margin-top:6px">Ultimate-style controller layout · Right face confirms · Bottom face goes back<br>Right stick: smash / aerial attacks · Left stick up: jump</div></div>
          <button id="controls-back-btn" class="ui-btn" style="font-size:14px">Back</button>
        </div>`;

    for (let slot = 0; slot < 4; slot++) {
      const deviceLabel = getDeviceLabel(slot, currentAssignments);
      const assignment = currentAssignments.get(slot);
      const isGamepad = !!assignment;
      const isUnassigned = isUnassignedSlot(slot, currentAssignments);
      const keymap = keymaps[slot]!;
      const override = assignment && getControllerProfileOverride(assignment.gamepadId);
      const profilePicker = assignment ? `<label for="controller-profile-${slot}">Controller profile</label>
        <select id="controller-profile-${slot}">
          <option value="" ${!override ? 'selected' : ''}>Auto detect</option>
          ${Object.entries(CONTROLLER_PROFILES).map(([key, profile]) =>
            `<option value="${key}" ${override === key ? 'selected' : ''}>${profile.name}</option>`).join('')}
        </select>` : '';

      html += `
        <div class="controls-slot" style="border:1px solid rgba(255,255,255,0.2);padding:16px;margin-bottom:12px;border-radius:4px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:18px">Slot ${slot + 1}: <span style="color:rgba(255,255,255,0.7)">${deviceLabel}</span></div>
            <button id="reset-slot-${slot}" class="ui-btn" style="font-size:12px;padding:4px 12px" ${isUnassigned ? 'disabled' : ''}>Reset to Default</button>
          </div>
          ${profilePicker}
          <div class="controls-binding-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">`;

      for (const action of ACTION_NAMES) {
        const bit = ACTION_BITS[action];
        let currentKey: string;
        if (isUnassigned) {
          currentKey = '—';
        } else if (isGamepad) {
          currentKey = getGamepadButtonName(slot, currentAssignments, action);
        } else {
          currentKey = findKeyForAction(keymap, bit);
        }

        const btnId = `rebind-${slot}-${action}`;
        const rebindDisabled = isUnassigned || isGamepad;
        html += `
            <div style="display:flex;flex-direction:column;align-items:center;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px">
              <div class="binding-label" style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:4px">${action.replaceAll("_"," ")}</div>
              <div id="binding-${slot}-${action}" style="font-size:14px;margin-bottom:6px;min-height:20px">${currentKey}</div>
              <button id="${btnId}" class="ui-btn" style="font-size:11px;padding:2px 8px" ${rebindDisabled ? 'disabled' : ''}>Rebind</button>
            </div>`;
      }

      html += `
          </div>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;
    for(const [slot,assignment] of currentAssignments){const row=container.querySelector('#reset-slot-'+slot)?.parentElement?.parentElement;if(row){const host=document.createElement('div');host.dataset.controllerCalibration=String(slot);row.appendChild(host);calibrationCleanup.push(renderControllerCalibration(host,assignment.gamepadId,assignment.gamepadIndex));}}

    for (const [slot, assignment] of currentAssignments) {
      const id = 'controller-profile-' + slot;
      const select = container.querySelector<HTMLSelectElement>('#' + id);
      select?.addEventListener('change', () => {
        setControllerProfileOverride(assignment.gamepadId, select.value);
        render();
        container.querySelector<HTMLSelectElement>('#' + id)?.focus();
      });
    }

    controllerNav=new MenuNavigator(deps.gamepadPoller);controllerNav.setButtons([{id:'controls-back-btn',element:container.querySelector('#controls-back-btn') as HTMLElement,onActivate:onBack}]);controllerNav.start(onBack);
    // Wire back button
    const backBtn = document.getElementById('controls-back-btn');
    if (backBtn) {
      const handler = () => onBack();
      backBtn.addEventListener('click', handler);
      listeners.push(() => backBtn.removeEventListener('click', handler));
    }

    // Wire reset buttons
    for (let slot = 0; slot < 4; slot++) {
      const resetBtn = document.getElementById(`reset-slot-${slot}`);
      if (resetBtn) {
        const s = slot;
        const handler = () => {
          const assignment=currentAssignments.get(s);
          if(assignment){
            resetStickCalibration(assignment.gamepadId);
            setControllerProfileOverride(assignment.gamepadId, '');
          }
          keymaps[s] = { ...DEFAULT_KEYMAPS[s]! };
          saveKeymap(s, keymaps[s]!);
          render();
        };
        resetBtn.addEventListener('click', handler);
        listeners.push(() => resetBtn.removeEventListener('click', handler));
      }
    }

    // Wire rebind buttons
    for (let slot = 0; slot < 4; slot++) {
      const assignment = currentAssignments.get(slot);
      const isGamepad = !!assignment;
      const isUnassigned = isUnassignedSlot(slot, currentAssignments);
      if (isGamepad || isUnassigned) continue;

      for (const action of ACTION_NAMES) {
        const btn = document.getElementById(`rebind-${slot}-${action}`);
        if (btn) {
          const s = slot;
          const a = action;
          const handler = () => startListening(s, a);
          btn.addEventListener('click', handler);
          listeners.push(() => btn.removeEventListener('click', handler));
        }
      }
    }
  }

  function startListening(slotIndex: number, action: ActionName): void {
    // Cancel any existing listening
    if (listeningState) listeningState.cleanup();

    const bindingEl = document.getElementById(`binding-${slotIndex}-${action}`);
    const btnEl = document.getElementById(`rebind-${slotIndex}-${action}`);
    if (bindingEl) bindingEl.textContent = '...';
    if (btnEl) btnEl.textContent = 'Press a key or button...';

    const onKeyDown = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        // Cancel without changing
        cleanup();
        render();
        return;
      }

      // Apply binding: remove any existing mapping with same key (last-bind-wins)
      const keymap = keymaps[slotIndex]!;
      const targetBit = ACTION_BITS[action];

      // Remove old key for this action
      for (const [key, bit] of Object.entries(keymap)) {
        if (bit === targetBit) {
          delete keymap[key];
        }
      }
      // Remove any action already using this key (last-bind-wins)
      delete keymap[e.code];

      // Set new binding
      keymap[e.code] = targetBit;
      saveKeymap(slotIndex, keymap);

      cleanup();
      render();
    };

    const cleanup = (): void => {
      window.removeEventListener('keydown', onKeyDown, true);
      listeningState = null;
    };

    window.addEventListener('keydown', onKeyDown, true);
    listeningState = { slotIndex, action, cleanup };
  }

  function cleanupAll(): void {
    controllerNav?.stop();controllerNav=null;
    for(const cleanup of calibrationCleanup)cleanup();calibrationCleanup=[];
    if (listeningState) {
      listeningState.cleanup();
      listeningState = null;
    }
    for (const unsub of listeners) unsub();
    listeners.length = 0;
  }

  // Initial render
  render();

  return {
    destroy(): void {
      cleanupAll();
      container.innerHTML = '';
    },
  };
}
