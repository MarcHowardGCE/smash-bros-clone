import { MenuNavigator, type MenuButton } from './MenuNavigator';
import { settingsHeader, settingsHint, settingsTabEntries, type SettingsRoute } from './SettingsShell';
import { escapeHtml } from './selectionContent';
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
  route?: SettingsRoute;
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


export function renderControlsScreen(container: HTMLElement, deps: ControlsScreenDeps): {
  destroy: () => void; refresh: () => void;
} {
  const slots = [0, 1, 2, 3];
  const keymaps = slots.map(loadKeymap);
  let activeSlot = 0;
  let calibrating = false;
  let nav: MenuNavigator | undefined;
  let stopCalibration: (() => void) | undefined;
  let stopRebind: (() => void) | undefined;

  function render(focusId?: string): void {
    stopRebind?.();
    nav?.stop();
    stopCalibration?.();
    stopCalibration = undefined;
    const assignments = deps.assignmentManager.getAssignments();
    const assignment = assignments.get(activeSlot);
    if (!assignment) calibrating = false;

    const seats = slots.map(slot => `<button type="button" class="menu-quiet" id="control-seat-${slot}"
      aria-pressed="${slot===activeSlot}"><strong>P${slot+1}</strong><small>${escapeHtml(getDeviceLabel(slot, assignments))}</small></button>`).join('');
    const panels = slots.map(slot => {
      const pad = assignments.get(slot);
      const unassigned = isUnassignedSlot(slot, assignments);
      const override = pad && getControllerProfileOverride(pad.gamepadId);
      const profilePicker = pad ? `<label for="controller-profile-${slot}">Controller profile</label>
        <select id="controller-profile-${slot}"><option value="" ${!override ? 'selected' : ''}>Auto detect</option>
        ${Object.entries(CONTROLLER_PROFILES).map(([key, profile]) =>
          `<option value="${key}" ${override===key?'selected':''}>${profile.name}</option>`).join('')}</select>` : '';
      return `<section class="settings-detail controls-seat-panel" ${slot!==activeSlot || calibrating ? 'hidden' : ''}>
        <div class="picker-header"><div><span class="menu-kicker">Player ${slot+1}</span><h2>${escapeHtml(getDeviceLabel(slot, assignments))}</h2></div>
          <button id="reset-slot-${slot}" class="menu-quiet" ${unassigned ? 'disabled' : ''}>Reset to Default</button></div>
        ${pad ? `<div class="settings-device-row">${profilePicker}<button id="calibrate-slot-${slot}" class="menu-quiet">Stick settings</button></div>` : ''}
        ${unassigned ? '<p>Connect a controller to configure this seat.</p>' : ''}
        <div class="settings-bindings" ${unassigned ? 'hidden' : ''}>${ACTION_NAMES.map(action => {
          const binding = unassigned ? '—' : pad ? getGamepadButtonName(slot, assignments, action) : findKeyForAction(keymaps[slot]!, ACTION_BITS[action]);
          return `<div class="settings-binding"><span class="binding-label">${action.replaceAll('_',' ')}</span>
            <kbd id="binding-${slot}-${action}">${escapeHtml(binding)}</kbd>
            ${!pad && !unassigned ? `<button id="rebind-${slot}-${action}" class="menu-quiet" aria-label="Rebind ${action.toLowerCase().replaceAll('_',' ')}">Rebind</button>` : ''}</div>`;
        }).join('')}</div></section>`;
    }).join('');
    container.innerHTML = `<section class="menu-workspace settings-workspace controls-screen">
      ${settingsHeader('controls','controls-back-btn',deps.route)}
      <div class="settings-body"><div class="settings-seats" role="group" aria-label="Controller seat">${seats}</div>${panels}
      ${calibrating ? `<section class="settings-detail settings-calibration"><div class="picker-header"><h2>Player ${activeSlot+1} · Stick settings</h2>
      <button id="controls-calibration-back" class="menu-quiet">← Bindings</button></div><div data-controller-calibration="${activeSlot}"></div></section>` : ''}</div>
      ${settingsHint(deps.route?.prompt)}</section>`;

    const navigator = new MenuNavigator(deps.gamepadPoller);
    nav = navigator;
    const entries: MenuButton[] = [];
    const add = (id: string, action: () => void, navigate = true) => {
      const button = container.querySelector<HTMLButtonElement>('#'+id);
      if (!button) return;
      button.addEventListener('click',action);
      if (navigate && !button.disabled) entries.push({id,element:button,onActivate:action});
    };
    for (const slot of slots) {
      const id = 'control-seat-'+slot;
      add(id, () => {
        if (activeSlot===slot && !calibrating) return;
        activeSlot=slot;
        calibrating=false;
        render(id);
      });
    }
    for (const slot of slots) {
      const active = slot===activeSlot && !calibrating;
      const pad = assignments.get(slot);
      const profile = container.querySelector<HTMLSelectElement>('#controller-profile-'+slot);
      if (profile && pad) {
        profile.addEventListener('change',()=>{setControllerProfileOverride(pad.gamepadId,profile.value);render(profile.id);});
        if (active) entries.push(settingField(profile));
      }
      add('calibrate-slot-'+slot,()=>{calibrating=true;render('controls-calibration-back');},active);
      for (const action of ACTION_NAMES) add('rebind-'+slot+'-'+action,()=>listen(slot,action),active);
      add('reset-slot-'+slot,()=>{
        if (pad) {
          resetStickCalibration(pad.gamepadId);
          setControllerProfileOverride(pad.gamepadId,'');
        }
        keymaps[slot]={...DEFAULT_KEYMAPS[slot]!};
        saveKeymap(slot,keymaps[slot]!);
        render('reset-slot-'+slot);
      },active);
    }
    const back = () => {
      if (calibrating) { calibrating=false; render('calibrate-slot-'+activeSlot); }
      else deps.onBack();
    };
    const calibration = container.querySelector<HTMLElement>('[data-controller-calibration]');
    if (calibration && assignment) {
      stopCalibration = renderControllerCalibration(calibration,assignment.gamepadId,assignment.gamepadIndex);
      calibration.querySelector('details')!.open=true;
      add('controls-calibration-back',back);
      for (const [index,field] of Array.from(calibration.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('input,select,button')).entries()) {
        field.id='calibration-field-'+index;
        entries.push(field instanceof HTMLButtonElement
          ? {id:field.id,element:field,onActivate:()=>field.click()} : settingField(field));
      }
    }
    add('controls-back-btn',deps.onBack);
    entries.push(...settingsTabEntries(container,deps.route));
    entries.forEach((entry,index)=>{
      entry.element.addEventListener('focus',()=>navigator.selectIndex(index));
      if (entry.element.matches('input,select')) entry.element.addEventListener('keydown', event => {
        if (event.key==='Escape') { event.stopPropagation(); back(); }
      });
    });
    navigator.setButtons(entries);
    if (focusId) {
      const index=entries.findIndex(entry=>entry.id===focusId);
      navigator.selectIndex(index);
      entries[index]?.element.focus();
    }
    navigator.start(back);
  }

  function settingField(element: HTMLInputElement | HTMLSelectElement): MenuButton {
    const adjust = (delta: -1 | 1) => {
      if (element instanceof HTMLSelectElement) {
        element.selectedIndex=(element.selectedIndex+delta+element.length)%element.length;
        element.dispatchEvent(new Event('change'));
      } else if (element.type==='range') {
        if (delta>0) element.stepUp(); else element.stepDown();
        element.dispatchEvent(new Event('input'));
      } else element.click();
    };
    return {id:element.id,element,onActivate:()=>adjust(1),onAdjust:adjust};
  }

  function listen(slot: number, action: ActionName): void {
    stopRebind?.();
    const id='rebind-'+slot+'-'+action;
    container.querySelector('#binding-'+slot+'-'+action)!.textContent='...';
    container.querySelector('#'+id)!.textContent='Press a key or button...';
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.code!=='Escape') {
        const keymap=keymaps[slot]!;
        const bit=ACTION_BITS[action];
        for (const [key,value] of Object.entries(keymap)) if (value===bit) delete keymap[key];
        keymap[event.code]=bit;
        saveKeymap(slot,keymap);
      }
      stopRebind?.();
      render(id);
    };
    stopRebind=()=>{window.removeEventListener('keydown',onKey,true);stopRebind=undefined;};
    window.addEventListener('keydown',onKey,true);
  }

  render();
  return {
    refresh:()=>render(document.activeElement?.id),
    destroy:()=>{nav?.stop();stopCalibration?.();stopRebind?.();container.replaceChildren();},
  };
}
