import type { PracticeLabAction } from '../practice/PracticePanel';
import { MenuNavigator, type MenuButton } from './MenuNavigator';
import { escapeHtml } from './selectionContent';

const tabs = ['Session', 'Timing & Display', 'Recordings', 'Settings'] as const;
const descriptions = [
  'Set the conditions for your next repetition.',
  'Slow the fight down, step one tick, or inspect contact and launch behavior.',
  'Record your inputs and play them back through the training partner.',
  'Adjust presentation for this session.',
];
const sessionIds = ['dojo-lab-fatigue', 'dojo-launch-percent-you', 'dojo-launch-percent-partner'];
const recordingIds = ['slot', 'record', 'play', 'mirror', 'loop', 'delay'].map(id => 'dojo-lab-' + id);

interface DojoPauseOptions {
  tab: number;
  selectTab: (index: number) => void;
  actions: () => PracticeLabAction[];
  reset: () => void;
  lessons: () => void;
  visuals: () => void;
  resume: () => void;
  leave: () => void;
  pausePrompt: string;
  confirmPrompt: string;
  settings: () => { container: HTMLElement; buttons: MenuButton[] } | undefined;
}

export function renderDojoPause(root: HTMLElement, nav: MenuNavigator, options: DojoPauseOptions): void {
  let active = options.tab;
  const groups: PracticeLabAction[][] = [[], [], [], []];
  for (const action of options.actions()) {
    const group = sessionIds.includes(action.id) ? 0 : recordingIds.includes(action.id) ? 2 : 1;
    groups[group]!.push(action);
  }

  const button = (id: string, label: string, className = 'menu-quiet') =>
    `<button type="button" id="${id}" class="${className}">${label}</button>`;

  root.innerHTML = `
    <section class="dojo-console" aria-labelledby="dojo-console-title">
      <header><div><span class="menu-kicker">Training Dojo</span><h1 id="dojo-console-title">Practice paused</h1></div>
      <span class="dojo-paused-badge">● Paused</span></header>
      <div class="dojo-tab-bar" role="tablist" aria-label="Practice settings">${tabs.map((title,i) =>
        `<button type="button" class="menu-quiet" id="dojo-tab-${i}" role="tab" aria-controls="dojo-pane-${i}">${title}</button>`).join('')}</div>
      <div class="dojo-console-body">${tabs.map((title,i) =>
        `<section id="dojo-pane-${i}" role="tabpanel" aria-labelledby="dojo-tab-${i}">
          <h2 tabindex="-1">${title}</h2><p>${descriptions[i]}</p>
          <div class="dojo-console-grid">${groups[i]!.map(action => button('pause-'+action.id,escapeHtml(action.label))).join('')}
          ${i===0 ? button('dojo-pause-menu','Dojo lessons') : ''}
          ${i===1 ? '<p class="dojo-console-note">Input trace and launch readout are available in the live Dojo panel.</p>' : ''}
          ${i===2 && !groups[i]!.length ? '<p>Recordings are available in Free Practice.</p>' : ''}
          ${i===3 ? button('visual-settings-btn','Visual accessibility')+'<div id="audio-settings-container"></div>' : ''}
          </div></section>`).join('')}</div>
      <footer><div class="dojo-footer-actions">
        ${button('resume-btn','Resume · '+options.pausePrompt,'ui-btn picker-primary')}
        ${button('dojo-pause-reset','Reset arena')}
        ${button('main-menu-btn','Main Menu')}
      </div><p class="picker-help">↑↓ Navigate · ←→ Browse tabs · Enter / ${options.confirmPrompt} Open tab or select action</p></footer>
    </section>`;

  const settings = options.settings();
  if (settings) root.querySelector('#audio-settings-container')!.append(settings.container);
  const tabButtons = tabs.map((_,i) => root.querySelector<HTMLButtonElement>('#dojo-tab-'+i)!);
  const panes = tabs.map((_,i) => root.querySelector<HTMLElement>('#dojo-pane-'+i)!);
  let entries: MenuButton[] = [];
  const bindings = new Map<string, MenuButton>();
  function bind(id: string, run: (event: MouseEvent) => void, adjust?: (delta: -1 | 1) => void): void {
    const element = root.querySelector<HTMLButtonElement>('#'+id)!;
    element.addEventListener('click', run);
    bindings.set(id, { id, element, onActivate: () => element.click(), onAdjust: adjust });
  }
  function refreshActions(): void {
    for (const action of options.actions()) {
      const element = root.querySelector<HTMLButtonElement>('#pause-'+action.id);
      if (!element) continue;
      element.textContent = action.label;
      element.disabled = Boolean(action.disabled);
    }
  }
  function setTabStop(index: number): void {
    tabButtons.forEach((button, i) => { button.tabIndex = i === index ? 0 : -1; });
  }
  function select(index: number, highlight = 'dojo-tab-'+index): void {
    active = index;
    options.selectTab(index);
    tabButtons.forEach((element,i) => {
      const selected = String(i === index);
      if (element.getAttribute('aria-selected') !== selected) element.setAttribute('aria-selected', selected);
      panes[i]!.hidden = i !== index;
    });
    setTabStop(index);
    entries = [
      bindings.get('resume-btn')!,
      ...tabButtons.map(element => bindings.get(element.id)!),
      ...groups[index]!.map(action => bindings.get('pause-'+action.id)!),
      ...(index===0 ? [bindings.get('dojo-pause-menu')!] : []),
      ...(index===3 ? [bindings.get('visual-settings-btn')!, ...(settings?.buttons ?? [])] : []),
      bindings.get('dojo-pause-reset')!,
      bindings.get('main-menu-btn')!,
    ];
    nav.setButtons(entries);
    nav.selectIndex(entries.findIndex(entry => entry.id === highlight));
  }
  tabButtons.forEach((element, i) => {
    // Pointer activation opens the panel without focusing a tab as its selection changes.
    element.addEventListener('mousedown', event => {
      if (event.button === 0) event.preventDefault();
    });
    bind(element.id, event => {
      if (i !== active) select(i);
      const target = event.detail > 0 ? panes[i]!.querySelector('h2')! : element;
      target.focus({ preventScroll: true });
    }, delta => {
      const next = (i + delta + tabs.length) % tabs.length;
      tabButtons[next]!.focus({ preventScroll: true });
    });
  });
  const tabBar = root.querySelector<HTMLElement>('.dojo-tab-bar')!;
  tabBar.addEventListener('focusin', event => {
    const index = tabButtons.findIndex(button => button === event.target);
    if (index !== -1) setTabStop(index);
  });
  tabBar.addEventListener('focusout', event => {
    if (!tabBar.contains(event.relatedTarget as Node | null)) setTabStop(active);
  });
  for (const action of groups.flat()) {
    bind('pause-'+action.id, () => {
      const latest = options.actions().find(entry => entry.id === action.id);
      if (latest && !latest.disabled) latest.run();
      refreshActions();
    });
  }
  bind('resume-btn', options.resume);
  bind('dojo-pause-reset', options.reset);
  bind('dojo-pause-menu', options.lessons);
  bind('visual-settings-btn', options.visuals);
  bind('main-menu-btn', options.leave);
  root.querySelector('.dojo-console')!.addEventListener('focusin', event => {
    nav.selectIndex(entries.findIndex(entry => entry.element === event.target));
  });
  refreshActions();
  const initialFocus = active === 0 ? 'resume-btn' : 'dojo-tab-'+active;
  select(active, initialFocus);
  nav.start(options.resume);
  bindings.get(initialFocus)?.element.focus();
}
