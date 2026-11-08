import { getControllerProfile, type ControllerProfile } from '../input/controllerProfiles';

export type PromptAction = keyof ControllerProfile['menuLabels'];
export type PromptRenderer = (action: PromptAction) => string;

export function controllerPrompt(action: PromptAction, profile = getControllerProfile(''), slot?: number): string {
  const seat = slot === undefined ? '' : ' data-controller-slot="' + slot + '"';
  return '<span data-controller-prompt="' + action + '"' + seat + '>' + profile.menuLabels[action] + '</span>';
}

export function refreshControllerPrompts(root: HTMLElement, resolve: (slot?: number) => ControllerProfile): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-controller-prompt]')) {
    const slot = element.dataset.controllerSlot;
    const action = element.dataset.controllerPrompt as PromptAction;
    const label = resolve(slot === undefined ? undefined : Number(slot)).menuLabels[action];
    if (element.textContent !== label) element.textContent = label;
  }
}
