import { CONTROLLER_PROFILES, controllerBindingLabel } from './controllerProfiles';

export const XBOX360_PROFILE = CONTROLLER_PROFILES.xbox360;
export function xboxBindingLabel(action: string): string {
  return controllerBindingLabel(XBOX360_PROFILE, action);
}