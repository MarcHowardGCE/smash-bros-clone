import { GenericInputBits as G, STANDARD_BUTTON_INDEX as I } from '@smash/gamepad-input';
import { INPUT_BITS as B } from '@smash/shared';

// Gamepad API standard indices identify physical positions. The names in G and I are Xbox aliases.
export const ULTIMATE_MENU = { confirm: G.B, cancel: G.A, pause: G.START } as const;
const positions = { attack: G.B, special: G.A, jumpLeft: G.X, jumpTop: G.Y } as const;
const directions: Record<string, string> = {
  LEFT: 'Left stick', RIGHT: 'Left stick', UP: 'Left stick / stick jump', DOWN: 'Left stick',
  TAUNT_UP: 'D-pad Up', TAUNT_SIDE: 'D-pad Left / Right', TAUNT_DOWN: 'D-pad Down',
};
type Labels = { attack: string; special: string; jumpLeft: string; jumpTop: string; shield: string; grab: string; pause: string; step: string };

function makeProfile(id: string, name: string, labels: Labels) {
  const jump = labels.jumpLeft + ' / ' + labels.jumpTop;
  return {
    id, name, ...ULTIMATE_MENU, positions,
    menuLabels: { confirm: labels.attack, cancel: labels.special, pause: labels.pause, story: labels.jumpLeft, step: labels.step },
    jumpLabels: [labels.jumpLeft, labels.jumpTop] as const,
    bindings: [
      { action: 'ATTACK', index: I.B, mask: positions.attack, bit: B.ATTACK, label: labels.attack },
      { action: 'SPECIAL', index: I.A, mask: positions.special, bit: B.SPECIAL, label: labels.special },
      { action: 'JUMP', index: I.X, mask: positions.jumpLeft, bit: B.JUMP, label: jump },
      { action: 'JUMP', index: I.Y, mask: positions.jumpTop, bit: B.JUMP, label: jump },
      { action: 'SHIELD', index: I.LT, mask: G.LT, bit: B.SHIELD, label: labels.shield },
      { action: 'SHIELD', index: I.RT, mask: G.RT, bit: B.SHIELD, label: labels.shield },
      { action: 'GRAB', index: I.LB, mask: G.LB, bit: B.GRAB, label: labels.grab },
      { action: 'GRAB', index: I.RB, mask: G.RB, bit: B.GRAB, label: labels.grab },
    ],
    labels: directions,
    defaults: { stickJump: true, abSmash: true, rightStick: 'smash', sensitivity: 'normal' } as const,
  };
}

export const CONTROLLER_PROFILES = {
  xbox360: makeProfile('ultimate-xbox360-v1', 'Xbox 360 Controller', {
    attack: 'B', special: 'A', jumpLeft: 'X', jumpTop: 'Y', shield: 'LT / RT', grab: 'LB / RB', pause: 'Start', step: 'Back',
  }),
  switchPro: makeProfile('ultimate-switch-pro-v1', 'Nintendo Switch Pro Controller', {
    attack: 'A', special: 'B', jumpLeft: 'Y', jumpTop: 'X', shield: 'ZL / ZR', grab: 'L / R', pause: '+', step: '−',
  }),
  dualSense: makeProfile('ultimate-dualsense-v1', 'PlayStation DualSense', {
    attack: 'Circle', special: 'Cross', jumpLeft: 'Square', jumpTop: 'Triangle', shield: 'L2 / R2', grab: 'L1 / R1', pause: 'Options', step: 'Create',
  }),
} as const;

const STANDARD_PROFILE = makeProfile('ultimate-standard-v1', 'Standard Gamepad', {
  attack: 'Right face', special: 'Bottom face', jumpLeft: 'Left face', jumpTop: 'Top face',
  shield: 'Left / right trigger', grab: 'Left / right bumper', pause: 'Right center button', step: 'Left center button',
});
export type ControllerProfileKey = keyof typeof CONTROLLER_PROFILES;
export type ControllerProfile = ReturnType<typeof makeProfile>;

function profileKey(value: string | null): ControllerProfileKey | undefined {
  return value && Object.prototype.hasOwnProperty.call(CONTROLLER_PROFILES, value) ? value as ControllerProfileKey : undefined;
}

export function detectControllerProfile(id: string): ControllerProfileKey | undefined {
  const name = id.toLowerCase().trim();
  const hardware = name.match(/vendor:\s*(?:0x)?([\da-f]{4})\s+product:\s*(?:0x)?([\da-f]{4})\b/) ??
    name.match(/\b([\da-f]{4})[:-]([\da-f]{4})\b/);
  const vidPid = hardware && hardware[1] + ':' + hardware[2];
  if (vidPid === '057e:2009' || /^(?:nintendo (?:switch )?|switch )?pro controller\b/.test(name)) return 'switchPro';
  if (vidPid === '054c:0ce6' || /\bdualsense\b/.test(name)) return 'dualSense';
  if (vidPid === '045e:028e' || vidPid === '045e:0719' || /\bxbox\s*360\b/.test(name)) return 'xbox360';
  return undefined;
}

const selections = new Map<string, ControllerProfileKey | undefined>();
const detected = new Map<string, ControllerProfileKey | undefined>();
const storageKey = (id: string) => 'smash:controller-profile:v1:' + id;

export function getControllerProfileOverride(id: string): ControllerProfileKey | undefined {
  if (!selections.has(id)) {
    try { selections.set(id, profileKey(globalThis.localStorage?.getItem(storageKey(id)) ?? null)); }
    catch { selections.set(id, undefined); }
  }
  return selections.get(id);
}

export function setControllerProfileOverride(id: string, value: string): void {
  const key = profileKey(value);
  selections.set(id, key);
  try {
    if (key) globalThis.localStorage?.setItem(storageKey(id), key);
    else globalThis.localStorage?.removeItem(storageKey(id));
  } catch { /* Keep the choice for this session. */ }
}

export function getControllerProfile(id: string): ControllerProfile {
  if (!detected.has(id)) detected.set(id, detectControllerProfile(id));
  const key = getControllerProfileOverride(id) ?? detected.get(id);
  return key ? CONTROLLER_PROFILES[key] : STANDARD_PROFILE;
}

export function controllerBindingLabel(profile: ControllerProfile, action: string): string {
  return profile.bindings.find(binding => binding.action === action)?.label ?? profile.labels[action] ?? '—';
}
