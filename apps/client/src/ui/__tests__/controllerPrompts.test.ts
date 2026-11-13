import { afterEach, expect, it, vi } from 'vitest';
import { GamepadPoller } from '@smash/gamepad-input';
import { STAGES } from '../../stages/stageConfig';
import { UIManager } from '../UIManager';

const xbox = 'Xbox 360 Controller';
const pro = 'Nintendo Switch Pro Controller';
const dual = 'DualSense Wireless Controller';
const fighters = [{ id:'all-rounder', displayName:'All-Rounder' }, { id:'swift', displayName:'Swift' }];

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

function setup() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const ui = new UIManager(root);
  const text = (selector: string) => root.querySelector(selector)?.textContent;
  return { root, ui, text };
}

it('uses the assigned device per fighter seat, including when controller indices differ from seats', () => {
  const { ui, text } = setup();
  const ids = [dual, xbox, pro];
  const slotByIndex = new Map([[0,2],[1,0],[2,1]]);
  const idForSlot = new Map([[0,xbox],[1,pro],[2,dual]]);
  ui.controllerIdForSlot = slot => idForSlot.get(slot);
  ui._gamepadPoller = new GamepadPoller();
  let index = -1, button = -1;
  vi.stubGlobal('navigator', { getGamepads: () => ids.map((id, padIndex) => ({
    id, index:padIndex, mapping:'standard', connected:true, axes:[0,0,0,0],
    buttons:Array.from({ length:17 }, (_,i) => ({ pressed:index===padIndex&&button===i })),
  })) });
  let frame: FrameRequestCallback | undefined;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame=callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', () => { frame=undefined; });
  ui.setActiveController(pro);
  ui.showCharacterSelect(fighters,3,vi.fn(),[],vi.fn(),()=>slotByIndex);
  expect([0,1,2].map(slot=>text('[data-ready-slot="'+slot+'"]'))).toEqual(['Ready · B','Ready · A','Ready · Circle']);
  for (const [pad, slot, cancel] of [[0,2,'Cross'],[1,0,'A'],[2,1,'B']] as const) {
    index=pad;button=1;frame?.(0);
    expect(text('[data-ready-slot="'+slot+'"]')).toBe('Change fighter · '+cancel);
    button=-1;frame?.(1);
    button=0;frame?.(2);
    expect(text('[data-ready-slot="'+slot+'"]')).toBe('Ready · '+[ 'B','A','Circle' ][slot]);
    button=-1;frame?.(3);
  }
  idForSlot.set(1,dual);
  idForSlot.delete(2);
  slotByIndex.set(0,1);
  slotByIndex.delete(2);
  ui.refreshControllerHints();
  expect(text('[data-ready-slot="1"]')).toBe('Ready · Circle');
  expect(text('[data-ready-slot="2"]')).toBe('Ready · Right face');
  index=0;button=1;frame?.(4);
  expect(text('[data-ready-slot="1"]')).toBe('Change fighter · Cross');
  ui.showMatch();
});

it('refreshes shared prompts as different controllers take over without rebuilding the screen', () => {
  const { root, ui, text } = setup();
  ui.controllerIdForSlot = slot => slot===0 ? xbox : undefined;
  ui.showLobby();
  const localPlay = root.querySelector('#local-play-btn');
  expect(text('.menu-hint')).toContain('Enter / B Select');
  ui.setActiveController(dual);
  expect(text('.menu-hint')).toContain('Enter / Circle Select');
  expect(root.querySelector('#local-play-btn')).toBe(localPlay);
  ui.showStageSelect(STAGES,vi.fn(),vi.fn());
  expect(text('.world-selection .picker-help')).not.toContain('Story');
  expect(text('.world-selection .picker-help')).toContain('Esc / Cross Back');
  ui.setActiveController(pro);
  expect(text('.world-selection .picker-help')).toContain('Enter / A Select');
  expect(text('.world-selection .picker-help')).not.toContain('Story');
  expect(text('.world-selection .picker-help')).toContain('Esc / B Back');
  ui.showPauseOverlay();
  expect(text('#resume-btn')).toBe('Resume · +');
  ui.setActiveController(dual);
  expect(text('#resume-btn')).toBe('Resume · Options');
  ui.setActiveController();
  expect(text('#resume-btn')).toBe('Resume · Start');
  ui.showPracticeSetup(vi.fn(),vi.fn());
  expect(text('.dojo-footnote')).toContain('Enter / B select');
  ui.setActiveController(pro);
  expect(text('.dojo-footnote')).toContain('Enter / A select · Escape / B back');
  ui.showMatch();
});
