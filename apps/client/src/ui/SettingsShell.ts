import type { MenuButton } from './MenuNavigator';
import { controllerPrompt, type PromptRenderer } from './controllerPrompts';

export type SettingsTab = 'controls' | 'visual' | 'sound';
export interface SettingsRoute {
  open: (tab: SettingsTab) => void;
  prompt: PromptRenderer;
}

export function settingsHeader(active: SettingsTab, backId: string, route?: SettingsRoute): string {
  const tabs = [['controls','Controls'],['visual','Accessibility'],['sound','Sound']] as const;
  return `<header class="picker-header"><div><span class="menu-kicker">Game options</span><h1 tabindex="-1">Settings</h1></div>
    <button type="button" id="${backId}" class="menu-quiet">← Back</button></header>
    ${route ? `<nav class="settings-tabs" aria-label="Settings sections">${tabs.map(([id,label]) =>
      `<button type="button" class="menu-quiet" data-settings-tab="${id}" ${id===active ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>` : ''}`;
}

export function settingsTabEntries(root: HTMLElement, route?: SettingsRoute): MenuButton[] {
  if (!route) return [];
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[data-settings-tab]:not([aria-current])'), element => {
    const activate = () => route.open(element.dataset.settingsTab as SettingsTab);
    element.addEventListener('click', activate);
    return { id: 'settings-'+element.dataset.settingsTab, element, onActivate: activate };
  });
}

export function settingsHint(prompt: PromptRenderer = controllerPrompt): string {
  return `<p class="picker-help">↑↓ Navigate · ←→ Adjust · Enter / ${prompt('confirm')} Select · Esc / ${prompt('cancel')} Back</p>`;
}
