import { MenuNavigator, type MenuButton } from '../ui/MenuNavigator';
import { controllerPrompt, type PromptRenderer } from '../ui/controllerPrompts';
import { getControllerProfile, type ControllerProfile } from '../input/controllerProfiles';
import type { GamepadPoller } from '@smash/gamepad-input';
import { dojoButtonGuide, LESSONS, type PracticeConfig, type DummyMode } from './curriculum';
import { STAGES } from '../stages/stageConfig';
import { escapeHtml, fighterPortrait } from '../ui/selectionContent';

const fighters = [
  ['all-rounder','All-Rounder'], ['abe-lincoln','Abe Lincoln'], ['swift','Swift'],
  ['moonshine','Moonshine'], ['hulk-hoagie','“Hulk” Hoagie'],
] as const;
const modes: readonly DummyMode[] = ['still','shield','jab','mixed','up-smash'];
const behaviorNames = ['Passive','Shield','Telegraphed jab','Alternating attack / special','Telegraphed two-hit up smash'];
const tiers = ['Basics','Advanced','Subtle'] as const;
const selectionKey = 'eth:dojo:setup:v1';

export function renderPracticeSetup(
  root: HTMLElement, poller: GamepadPoller | null, onStart: (config: PracticeConfig) => void, onBack: () => void,
  prompt: PromptRenderer = controllerPrompt, getProfile: () => ControllerProfile = () => getControllerProfile(''),
): { destroy: () => void } {
  let saved: Partial<PracticeConfig> = {};
  try { saved = JSON.parse(localStorage.getItem(selectionKey) ?? '{}') ?? {}; } catch { /* use defaults */ }
  let fighter = Math.max(0, fighters.findIndex(([id]) => id===saved.fighter));
  let partner = Math.max(0, fighters.findIndex(([id]) => id===saved.dummy));
  let stage = Math.max(0, STAGES.findIndex(world => world.id===saved.stageId));
  let mode = Math.max(0, modes.findIndex(behavior => behavior===saved.dummyMode));
  let lesson = LESSONS.find(entry => entry.id===saved.lessonId) ?? LESSONS[0]!;
  let tier = lesson.tier;
  let guided = Boolean(saved.lessonId && LESSONS.some(entry => entry.id===saved.lessonId));

  root.innerHTML = `<section class="menu-workspace dojo-library" aria-labelledby="dojo-title">
    <header class="picker-header"><div><span class="menu-kicker">Practice / Training Dojo</span><h1 id="dojo-title">Training Dojo</h1></div>
      <button type="button" id="dojo-back" class="menu-quiet">← Main Menu</button></header>
    <div class="settings-tabs" role="group" aria-label="Practice mode">
      <button type="button" id="dojo-mode-free" class="menu-quiet">Free Practice</button>
      <button type="button" id="dojo-mode-lessons" class="menu-quiet">Guided Lessons</button>
    </div>
    <div class="dojo-library-body">
      <section class="settings-detail dojo-session"><span class="menu-kicker">Session setup</span><h2>Make it yours</h2>
        <div class="dojo-fighter-pair"><img id="dojo-fighter-art" alt=""><img id="dojo-partner-art" alt=""></div>
        <div class="dojo-session-options">${['fighter','partner','stage','behavior'].map(id=>`<button type="button" id="dojo-${id}" class="menu-quiet"></button>`).join('')}</div>
        <p id="dojo-partner-rule">Lessons set the partner’s behavior for each technique.</p></section>
      <section id="dojo-free-pane" class="settings-detail"><span class="menu-kicker">Open sandbox</span><h2>Free Practice</h2>
        <p>Practice inputs, test launch distances, or record partner routines at your own pace.</p>
        <ul class="dojo-free-rules"><li>Damage stays fixed</li><li>Unlimited resets</li><li>No wins or losses</li></ul></section>
      <section id="dojo-lessons-pane" class="settings-detail dojo-curriculum"><span class="menu-kicker">Lesson library</span>
        <div class="settings-tabs" role="group" aria-label="Lesson difficulty">${tiers.map(name=>`<button type="button" id="dojo-tier-${name}" class="menu-quiet">${name}</button>`).join('')}</div>
        <div class="dojo-lesson-browser"><div class="dojo-lesson-list">${LESSONS.map(entry=>`<button type="button" class="menu-quiet dojo-lesson-card" id="practice-lesson-${entry.id}" data-lesson="${entry.id}">
          <span class="dojo-lesson-title">${escapeHtml(entry.title)}</span><small data-completion="${entry.id}" hidden></small></button>`).join('')}</div>
          <div class="dojo-lesson-detail"><span class="menu-kicker" id="dojo-lesson-tier"></span><h2 id="dojo-lesson-name"></h2>
            <p id="dojo-lesson-hint"></p><p id="dojo-lesson-input"></p><strong id="dojo-lesson-progress"></strong></div></div></section>
    </div>
    <p id="dojo-art-status" role="status"></p>
    <footer class="workspace-footer"><p class="picker-help dojo-footnote">↑↓ Navigate · ←→ Adjust · Enter / ${prompt('confirm')} select · Escape / ${prompt('cancel')} back</p>
      <button type="button" id="practice-free" class="menu-quiet workspace-primary">Enter Free Practice</button>
      <button type="button" id="dojo-start-lesson" class="menu-quiet workspace-primary">Start Lesson</button></footer>
  </section>`;
  const nav = new MenuNavigator(poller);
  const all = new Map<string, MenuButton>();
  let visible: MenuButton[] = [];
  const get = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>('#'+id)!;
  const label = (id: string, value: string) => { get(id).textContent = value; };
  const config = (lessonId: string | null): PracticeConfig => ({
    fighter: fighters[fighter]![0], dummy: fighters[partner]![0], stageId: STAGES[stage]!.id, dummyMode: modes[mode]!, lessonId,
  });
  const completed = (id: string) => {
    try { return localStorage.getItem('eth:dojo:v1:'+fighters[fighter]![0]+':'+id)==='complete'; }
    catch { return false; }
  };
  function refresh(highlight = 'dojo-mode-free'): void {
    try { localStorage.setItem(selectionKey, JSON.stringify(config(guided ? lesson.id : null))); } catch { /* session still works */ }
    label('dojo-fighter','Fighter · '+fighters[fighter]![1]);
    label('dojo-partner','Partner · '+fighters[partner]![1]);
    label('dojo-stage','World · '+STAGES[stage]!.displayName);
    label('dojo-behavior','Partner behavior · '+behaviorNames[mode]);
    get<HTMLImageElement>('dojo-fighter-art').src = fighterPortrait(fighters[fighter]![0]);
    get<HTMLImageElement>('dojo-partner-art').src = fighterPortrait(fighters[partner]![0]);
    get('dojo-mode-free').setAttribute('aria-pressed', String(!guided));
    get('dojo-mode-lessons').setAttribute('aria-pressed', String(guided));
    for (const id of ['dojo-free-pane','dojo-behavior','practice-free']) get(id).hidden = guided;
    for (const id of ['dojo-lessons-pane','dojo-partner-rule','dojo-start-lesson']) get(id).hidden = !guided;
    for (const name of tiers) get('dojo-tier-'+name).setAttribute('aria-pressed', String(name===tier));
    for (const entry of LESSONS) {
      const button = get('practice-lesson-'+entry.id);
      button.hidden = entry.tier!==tier;
      button.setAttribute('aria-pressed', String(entry.id===lesson.id));
      const completion = button.querySelector('small')!;
      completion.hidden = !completed(entry.id);
      completion.textContent = completion.hidden ? '' : 'Completed';
    }
    label('dojo-lesson-tier', lesson.tier);
    label('dojo-lesson-name', lesson.title);
    label('dojo-lesson-hint', lesson.hint);
    label('dojo-lesson-input', dojoButtonGuide(getProfile(),lesson));
    label('dojo-lesson-progress', completed(lesson.id) ? 'Completed · 3 of 3' : 'Goal · 3 successful repetitions');
    visible = [...all.values()].filter(entry => !entry.element.closest('[hidden]'));
    nav.setButtons(visible);
    nav.selectIndex(visible.findIndex(entry => entry.id===highlight));
  }
  function bind(id: string, action: () => void, adjust?: (delta: -1 | 1) => void): void {
    const element = get(id);
    element.addEventListener('click',action);
    element.addEventListener('focus',()=>nav.selectIndex(visible.findIndex(entry=>entry.id===id)));
    all.set(id,{id,element,onActivate:action,onAdjust:adjust});
  }
  function cycle(id: string, length: number, read: () => number, write: (value: number) => void): void {
    const adjust = (delta: -1 | 1) => { write((read()+delta+length)%length); refresh(id); };
    bind(id,()=>adjust(1),adjust);
  }
  bind('dojo-mode-free',()=>{guided=false;refresh('dojo-mode-free');});
  bind('dojo-mode-lessons',()=>{guided=true;refresh('dojo-mode-lessons');});
  cycle('dojo-fighter',fighters.length,()=>fighter,value=>{fighter=value;});
  cycle('dojo-partner',fighters.length,()=>partner,value=>{partner=value;});
  cycle('dojo-stage',STAGES.length,()=>stage,value=>{stage=value;});
  cycle('dojo-behavior',modes.length,()=>mode,value=>{mode=value;});
  for (const name of tiers) bind('dojo-tier-'+name,()=>{
    if (tier!==name) { tier=name; lesson=LESSONS.find(entry=>entry.tier===name)!; }
    refresh('dojo-tier-'+name);
  });
  for (const entry of LESSONS) bind('practice-lesson-'+entry.id,()=>{lesson=entry;refresh('practice-lesson-'+entry.id);});
  bind('practice-free',()=>onStart(config(null)));
  bind('dojo-start-lesson',()=>onStart(config(lesson.id)));
  bind('dojo-back',onBack);
  refresh(guided ? 'dojo-mode-lessons' : 'dojo-mode-free');
  nav.start(onBack);
  return { destroy:()=>nav.stop() };
}
