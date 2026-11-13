import { ControllerAssignmentManager } from '../ControllerAssignmentManager';
import { InputManager } from '../InputManager';
import { afterEach, expect, it, vi } from 'vitest';
import { GamepadPoller, GamepadPreferenceStore } from '@smash/gamepad-input';
import { INPUT_BITS as B, validStickInput } from '@smash/shared';
import { GamepadInputSource } from '../GamepadInputSource';
import { CONTROLLER_PROFILES, controllerBindingLabel, detectControllerProfile, getControllerProfile, setControllerProfileOverride } from '../controllerProfiles';

afterEach(() => { vi.unstubAllGlobals(); });

const devices = [
  { key: 'xbox360', id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', attack: 'B', special: 'A', jump: 'X / Y', shield: 'LT / RT', grab: 'LB / RB', pause: 'Start' },
  { key: 'switchPro', id: 'Generic Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2009)', attack: 'A', special: 'B', jump: 'Y / X', shield: 'ZL / ZR', grab: 'L / R', pause: '+' },
  { key: 'dualSense', id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', attack: 'Circle', special: 'Cross', jump: 'Square / Triangle', shield: 'L2 / R2', grab: 'L1 / R1', pause: 'Options' },
] as const;

function pad(id: string, down: number[], axes = [0, 0, 0, 0], mapping = 'standard', index = 0) {
  return { id, index, mapping, connected: true, axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i), value: Number(down.includes(i)) })) };
}

it.each(devices)('detects $key and exposes its actual button labels', ({ key, id, attack, special, jump, shield, grab, pause }) => {
  expect(getControllerProfile(id)).toBe(CONTROLLER_PROFILES[key]);
  const profile = getControllerProfile(id);
  for (const [action, label] of Object.entries({ ATTACK: attack, SPECIAL: special, JUMP: jump, SHIELD: shield, GRAB: grab })) {
    expect(controllerBindingLabel(profile, action)).toBe(label);
  }
  expect(profile.menuLabels).toMatchObject({ confirm: attack, cancel: special, pause });
});

it.each(devices)('maps $key through the browser poller and the gameplay sampler', ({ id }) => {
  let gamepad = pad(id, []);
  vi.stubGlobal('navigator', { getGamepads: () => [gamepad] });
  const poller = new GamepadPoller();
  const source = new GamepadInputSource(poller, 0);
  for (const [index, action] of [[0, B.SPECIAL], [1, B.ATTACK], [2, B.JUMP], [3, B.JUMP],
    [4, B.GRAB], [5, B.GRAB], [6, B.SHIELD], [7, B.SHIELD], [8, 0], [9, 0],
    [10, 0], [11, 0], [12, B.TAUNT_UP], [13, B.TAUNT_DOWN], [14, B.TAUNT_SIDE], [15, B.TAUNT_SIDE]] as const) {
    gamepad = pad(id, [index]);
    expect(source.getHeldBits(), 'standard button '+index).toBe(action);
  }
  gamepad = pad(id, [2, 3]);
  expect(source.sampleInput()).toMatchObject({ held: B.JUMP, jumpButtons: 3 });
  gamepad = pad(id, [0, 1]);
  expect(source.sampleInput()).toMatchObject({ held: B.SPECIAL | B.ATTACK, faceAttackHeld: true, smashAttack: true });
  gamepad = pad(id, [], [-1, 0, 0, -1]);
  expect(source.sampleInput()).toMatchObject({ held: B.LEFT | B.ATTACK, cStickY: -1, faceAttackHeld: false });
  const profile = getControllerProfile(id);
  for (const [index, command] of [[1, 'confirm'], [0, 'cancel'], [9, 'pause']] as const) {
    gamepad = pad(id, [index]);
    expect(poller.poll().get(0)?.bits).toBe(profile[command]);
  }
});

it('accepts common names and hardware IDs without guessing which Sony wireless model is connected', () => {
  expect(detectControllerProfile('Nintendo Switch Pro Controller')).toBe('switchPro');
  expect(detectControllerProfile('057e-2009-Pro Controller')).toBe('switchPro');
  expect(detectControllerProfile('DualSense Wireless Controller')).toBe('dualSense');
  expect(detectControllerProfile('045e:028e')).toBe('xbox360');
  expect(detectControllerProfile('Wireless Controller (Vendor: 054c Product: 09cc)')).toBeUndefined();
  expect(getControllerProfile('Wireless Controller').name).toBe('Standard Gamepad');
});

it('reads a saved override, resets it to automatic, and leaves unmapped reports neutral', () => {
  const id = 'Ambiguous Standard Controller for profile test';
  const key = 'smash:controller-profile:v1:' + id;
  localStorage.setItem(key, 'switchPro');
  try {
    expect(getControllerProfile(id)).toBe(CONTROLLER_PROFILES.switchPro);
    setControllerProfileOverride(id, 'dualSense');
    expect(localStorage.getItem(key)).toBe('dualSense');
    expect(getControllerProfile(id)).toBe(CONTROLLER_PROFILES.dualSense);
    vi.stubGlobal('navigator', { getGamepads: () => [pad(id, [1], [1, 1, 1, 1], '')] });
    expect(new GamepadInputSource(new GamepadPoller(), 0).sampleInput()).toMatchObject({ connected: false, held: 0 });
  } finally {
    setControllerProfileOverride(id, '');
  }
  expect(getControllerProfile(id).name).toBe('Standard Gamepad');
});

it('reads the assigned index when all three controller families are connected', () => {
  const pads = devices.map(({ id }, index) => pad(id, [index], undefined, 'standard', index));
  vi.stubGlobal('navigator', { getGamepads: () => pads });
  const poller = new GamepadPoller();
  let slot = 0;
  const source = new GamepadInputSource(poller, 0, () => slot);
  expect(source.getHeldBits()).toBe(B.SPECIAL);
  slot = 1;
  expect(source.getHeldBits()).toBe(B.ATTACK);
  slot = 2;
  expect(source.getHeldBits()).toBe(B.JUMP);
});

it.each(devices)('routes a late $key controller from discovery into gameplay packets', ({ id }) => {
  let reports: ReturnType<typeof pad>[] = [];
  vi.stubGlobal('navigator', { getGamepads: () => reports });
  const poller = new GamepadPoller();
  const assignments = new ControllerAssignmentManager(poller, new GamepadPreferenceStore(localStorage), 4);
  const source = new GamepadInputSource(poller, -1, () => assignments.getAssignments().get(0)?.gamepadIndex ?? -1);
  const input = new InputManager({}, 'player', source);
  try {
    reports = [pad(id, [1], [0.8, 0, 0, 0])];
    expect(poller.poll().get(0)?.bits).toBeTruthy();
    expect(assignments.getAssignments().get(0)?.gamepadId).toBe(id);
    const packet = input.pollInput(true)!;
    expect(packet.held).toBe(B.RIGHT | B.ATTACK);
    expect(packet.pressed & B.ATTACK).toBe(B.ATTACK);
    expect(validStickInput(packet)).toBe(true);
  } finally {
    input.destroy();
    poller.stop();
    localStorage.clear();
  }
});
it.each([[devices[0], devices[1]], [devices[1], devices[0]]] as const)(
  'recovers P1 when swapping %j for %j without disconnect events',
  (first, second) => {
    let reports: (ReturnType<typeof pad> | null)[] = [pad(first.id, [])];
    vi.stubGlobal('navigator', { getGamepads: () => reports });
    const poller = new GamepadPoller();
    const seats = new ControllerAssignmentManager(poller, new GamepadPreferenceStore(localStorage), 4);
    const input = new InputManager({}, 'player', new GamepadInputSource(
      poller, -1, () => seats.getAssignments().get(0)?.gamepadIndex ?? -1,
    ));
    try {
      reports.push(pad(second.id, [], undefined, 'standard', 1));
      poller.poll();
      expect(seats.getAssignments().get(1)?.gamepadId).toBe(second.id);
      reports = [null, pad(second.id, [1], [0.8, 0, 0, 0], 'standard', 1)];
      poller.poll();
      expect(seats.getAssignments().has(0)).toBe(false);
      seats.reclaimPrimarySeat();
      expect(seats.getAssignments().get(0)?.gamepadId).toBe(second.id);
      expect(seats.getAssignments().has(1)).toBe(false);
      expect(input.pollInput(true)?.held).toBe(B.RIGHT | B.ATTACK);
    } finally {
      input.destroy();
      poller.stop();
      localStorage.clear();
    }
  },
);
