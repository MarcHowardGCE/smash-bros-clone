import { getStageLayout } from '@smash/shared';
import { STAGES } from '../../stages/stageConfig';
import { afterEach, expect, it, vi } from 'vitest';
import { UIManager } from '../UIManager';

function setup() {
  const root = document.body.appendChild(document.createElement('div'));
  const ui = new UIManager(root);
  const button = (selector: string) => root.querySelector<HTMLButtonElement>(selector)!;
  return { root, ui, button };
}

afterEach(() => { document.body.innerHTML = ''; });

it('shows live fighter stats and cycles a comparison without changing the pick', () => {
  const { root, ui, button } = setup();
  const done = vi.fn();
  const roster = [
    { id:'all-rounder', displayName:'All-Rounder' },
    { id:'swift', displayName:'Swift' },
    { id:'moonshine', displayName:'Moonshine' },
  ];
  ui.showCharacterSelect(roster, 2, done);
  button('[data-player="1"][data-id="swift"]').click();
  button('#fighter-compare-next').click();
  const values = root.querySelector('.fighter-stat-sheet table')!.textContent;
  expect(values).toMatch(/Swift.*Moonshine.*75.*87.*6\.80.*6\.65/s);
  expect(root.querySelector('#p1-identity')?.textContent).toBe('Swift');
  expect(root.querySelector('[data-player="1"][data-id="swift"]')?.getAttribute('aria-pressed')).toBe('true');
  expect(done).not.toHaveBeenCalled();
  ui.showMatch();
});

it('keeps the Dojo tab and focus while a practice option updates', () => {
  const { ui, button } = setup();
  let ticks = 0;
  ui.onPracticeMenu = vi.fn();
  ui.onPracticeLabActions = () => [{
    id:'dojo-lab-step', label:'Step one tick · '+ticks, run: () => { ticks++; },
  }];
  ui.showPauseOverlay();
  button('#dojo-tab-1').click();
  const step = button('#pause-dojo-lab-step');
  step.focus();
  step.click();
  expect(step.textContent).toBe('Step one tick · 1');
  expect(document.activeElement).toBe(step);
  expect(button('#dojo-tab-1').getAttribute('aria-selected')).toBe('true');
  expect(button('#resume-btn').closest('[hidden]')).toBeNull();
  expect(button('#dojo-pause-reset').closest('[hidden]')).toBeNull();
  ui.hidePauseOverlay();
});

it('validates room codes and shows a server error without leaving Online Play', () => {
  const { root, ui, button } = setup();
  const join = vi.fn();
  ui.onJoinRoom = join;
  ui.showLobby();
  button('#online-play-btn').click();
  const form = root.querySelector<HTMLFormElement>('#online-join-form')!;
  const input = root.querySelector<HTMLInputElement>('#join-code')!;
  form.dispatchEvent(new Event('submit', { cancelable:true }));
  expect(join).not.toHaveBeenCalled();
  expect(input.getAttribute('aria-invalid')).toBe('true');
  input.value = 'abc123';
  form.dispatchEvent(new Event('submit', { cancelable:true }));
  expect(join).toHaveBeenCalledWith('ABC123');
  expect(button('#join-btn').disabled).toBe(true);
  ui.showRoomJoinError('Room not found');
  expect(root.querySelector('#online-entry-status')?.textContent).toBe('Room not found');
  expect(button('#join-btn').disabled).toBe(false);
  ui.showMatch();
});

it('shows server readiness and clears it when returning to the room from selection', () => {
  const { root, ui, button } = setup();
  const ready = vi.fn();
  ui.setPlayerId('p1');
  ui.showRoomCreated('ABC123');
  ui.onReady = ready;
  const players = [{ playerId:'p1', slotIndex:0 }, { playerId:'p2', slotIndex:1 }];
  ui.updateRoomLobby(players,'p1');
  button('#ready-btn').click();
  expect(ready).toHaveBeenCalledOnce();
  expect(button('#ready-btn').disabled).toBe(true);
  ui.updateRoomLobby([{ ...players[0]!, ready:true }, players[1]!],'p1');
  expect(root.querySelectorAll('.room-seat[data-ready="true"]')).toHaveLength(1);
  expect(root.querySelector('#room-seat-count')?.textContent).toBe('2 / 4');
  ui.updateRoomLobby(players,'p1');
  expect(button('#ready-btn').disabled).toBe(false);
  ui.showMatch();
  window.history.replaceState({}, '', window.location.pathname);
});


it('keeps the guest story open while the authoritative preview changes', () => {
  const { root, ui, button } = setup();
  const change = vi.fn();
  ui.showNetworkStageWaiting(STAGES[0]!, change);
  button('#stage-story-toggle').click();
  const footer = button('#online-change-fighter');
  ui.showNetworkStageWaiting(STAGES[5]!, change);
  expect(button('#online-change-fighter')).toBe(footer);
  expect(button('#stage-story-toggle').getAttribute('aria-expanded')).toBe('true');
  const diagram = root.querySelector('.world-layout-map svg')!;
  const floor = getStageLayout('stage6').mainPlatform;
  const rect = diagram.querySelector('.world-map-solid')!;
  expect(rect.getAttribute('x')).toBe(String(floor.x));
  expect(rect.getAttribute('y')).toBe(String(floor.y));
  expect(rect.getAttribute('width')).toBe(String(floor.width));
  expect(diagram.querySelectorAll('.world-map-soft')).toHaveLength(3);
  footer.click();
  expect(change).toHaveBeenCalledOnce();
  ui.showMatch();
});

it('retains the match intro and its images between loading, countdown and GO', () => {
  const { root, ui } = setup();
  const intro = { stage: STAGES[4]!, fighters: [{ id:'swift', displayName:'Swift', slotIndex:0 }] };
  ui.showCountdown(null, intro);
  const panel = root.querySelector('.match-intro')!;
  expect(panel.textContent).toContain('Loading arena');
  ui.showCountdown(3, intro);
  ui.showCountdown(0, intro);
  expect(root.querySelector('.match-intro')).toBe(panel);
  expect(panel.textContent).toContain('Swift');
  expect(panel.querySelector('.match-intro-count')?.textContent).toBe('GO!');
  ui.showMatch();
  expect(root.querySelector('.match-intro')).toBeNull();
});


it('keeps the match paused when backing out of the leave confirmation', () => {
  const { root, ui, button } = setup();
  ui.onMainMenu = vi.fn();
  ui.onResume = vi.fn();
  ui.showPauseOverlay(true);
  expect(root.querySelector('.pause-menu')?.textContent).toContain('paused for everyone');
  button('#main-menu-btn').click();
  expect(root.querySelector('.pause-menu')?.textContent).toContain('forfeits');
  expect(ui.cancelPauseExit()).toBe(true);
  expect(ui.getPhase()).toBe('paused');
  expect(ui.onMainMenu).not.toHaveBeenCalled();
  expect(ui.onResume).not.toHaveBeenCalled();
  button('#main-menu-btn').click();
  button('#confirm-leave-match-btn').click();
  expect(ui.onMainMenu).toHaveBeenCalledOnce();
  ui.hidePauseOverlay();
});

it('shows the winner portrait and marks the actual seat in the result lineup', () => {
  const { root, ui, button } = setup();
  ui.onLocalChangeFighters = vi.fn();
  ui.showLocalResult('local-p2', { stage: STAGES[1]!, fighters: [
    { playerId:'local-p1', slotIndex:0, id:'swift', displayName:'Swift', stocks:0 },
    { playerId:'local-p2', slotIndex:1, id:'abe-lincoln', displayName:'Abe Lincoln', stocks:1 },
  ] });
  expect(root.querySelector('.result-feature img')?.getAttribute('src')).toContain('abe-lincoln');
  expect(root.querySelector('[data-winner="true"]')?.textContent).toMatch(/P2.*Abe Lincoln.*Winner · 1 stock left/s);
  button('#result-change-fighters-btn').click();
  expect(ui.onLocalChangeFighters).toHaveBeenCalledOnce();
  ui.showMatch();
});

