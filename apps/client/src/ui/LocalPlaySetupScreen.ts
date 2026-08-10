/**
 * @fileoverview Local Play Setup screen.
 *
 * Renders the participant-count picker (2/3/4 players) and per-seat CPU
 * difficulty / second-human-gamepad selectors. Follows the
 * external-render-function pattern: {@link renderLocalPlaySetupScreen} writes
 * HTML into the provided container and manages its own keyboard + gamepad
 * navigation lifecycle, tearing down cleanly when the screen is dismissed.
 *
 * Seat 0 is always the local human host and is never configurable here.
 */

import type { GamepadPoller } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';
import type { ControllerAssignmentManager } from '../input/ControllerAssignmentManager';
import type { SeatConfig } from '../local/types';
import { MenuNavigator } from './MenuNavigator.js';
import type { MenuButton } from './MenuNavigator.js';

type ParticipantCount = 2 | 3 | 4;

interface SetupDeps {
  assignmentManager: ControllerAssignmentManager;
}

interface SetupResult {
  participantCount: ParticipantCount;
  seats: SeatConfig[];
}

/** Cycle order for seat options (gamepad option conditionally included). */
const CPU_OPTIONS: SeatConfig[] = [
  { kind: 'cpu', difficulty: 'easy' },
  { kind: 'cpu', difficulty: 'medium' },
  { kind: 'cpu', difficulty: 'hard' },
];

function seatLabel(config: SeatConfig): string {
  if (config.kind === 'human-gamepad') return '2nd Human (Gamepad)';
  const cap = config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1);
  return `CPU: ${cap}`;
}

/**
 * Revalidation pass: downgrade any human-gamepad seat whose slot no longer has an assignment.
 */
function revalidateSeats(seats: SeatConfig[], deps: SetupDeps): SeatConfig[] {
  const assignments = deps.assignmentManager.getAssignments();
  return seats.map((seat, idx) => {
    const slotIndex = idx + 1;
    if (seat.kind === 'human-gamepad' && !assignments.get(slotIndex)) {
      return { kind: 'cpu', difficulty: 'medium' };
    }
    return seat;
  });
}

function buildCycleOptions(slotIndex: number, deps: SetupDeps): SeatConfig[] {
  const assignments = deps.assignmentManager.getAssignments();
  const options: SeatConfig[] = [...CPU_OPTIONS];
  if (assignments.get(slotIndex)) {
    options.push({ kind: 'human-gamepad' });
  }
  return options;
}

function nextCycleOption(current: SeatConfig, slotIndex: number, deps: SetupDeps): SeatConfig {
  const options = buildCycleOptions(slotIndex, deps);
  const currentLabel = seatLabel(current);
  const currentIdx = options.findIndex(o => seatLabel(o) === currentLabel);
  const nextIdx = (currentIdx + 1) % options.length;
  return options[nextIdx]!;
}

function prevCycleOption(current: SeatConfig, slotIndex: number, deps: SetupDeps): SeatConfig {
  const options = buildCycleOptions(slotIndex, deps);
  const currentLabel = seatLabel(current);
  const currentIdx = options.findIndex(o => seatLabel(o) === currentLabel);
  const prevIdx = (currentIdx - 1 + options.length) % options.length;
  return options[prevIdx]!;
}

/**
 * Render the Local Play Setup screen into the given container.
 */
export function renderLocalPlaySetupScreen(
  container: HTMLElement,
  deps: SetupDeps,
  initial: SetupResult | null,
  onConfirm: (result: SetupResult) => void,
  onBack?: () => void,
  gamepadPoller?: GamepadPoller | null,
): void {
  let participantCount: ParticipantCount = initial?.participantCount ?? 2;
  let seats: SeatConfig[] = initial
    ? revalidateSeats(initial.seats.slice(0, participantCount - 1), deps)
    : buildDefaultSeats(participantCount);
  let menuNav: MenuNavigator | null = null;
  let focusedSeatIndex = 0;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  let rafId: number | null = null;
  let lastBitsPerGamepad = new Map<number, number>();

  function buildDefaultSeats(count: ParticipantCount): SeatConfig[] {
    return Array.from({ length: count - 1 }, () => ({ kind: 'cpu' as const, difficulty: 'medium' as const }));
  }

  function stopNav(): void {
    if (menuNav) {
      menuNav.stop();
      menuNav = null;
    }
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastBitsPerGamepad.clear();
  }

  function updateSeatFocus(): void {
    for (let i = 0; i < seats.length; i++) {
      const cycleBtn = document.getElementById(`lps-cycle-${i}`);
      if (cycleBtn) {
        if (i === focusedSeatIndex) {
          cycleBtn.classList.add('seat-focused');
        } else {
          cycleBtn.classList.remove('seat-focused');
        }
      }
    }
  }

  function cycleSeatRight(seatIdx: number): void {
    if (seatIdx >= 0 && seatIdx < seats.length) {
      const slotIndex = seatIdx + 1;
      seats[seatIdx] = nextCycleOption(seats[seatIdx]!, slotIndex, deps);
      const cycleBtn = document.getElementById(`lps-cycle-${seatIdx}`);
      if (cycleBtn) {
        cycleBtn.textContent = seatLabel(seats[seatIdx]!);
      }
    }
  }

  function cycleSeatLeft(seatIdx: number): void {
    if (seatIdx >= 0 && seatIdx < seats.length) {
      const slotIndex = seatIdx + 1;
      seats[seatIdx] = prevCycleOption(seats[seatIdx]!, slotIndex, deps);
      const cycleBtn = document.getElementById(`lps-cycle-${seatIdx}`);
      if (cycleBtn) {
        cycleBtn.textContent = seatLabel(seats[seatIdx]!);
      }
    }
  }

  function render(): void {
    stopNav();

    let html = `
      <div class="overlay-center" style="max-width:600px;width:100%;align-items:stretch">
        <div style="font-size:32px;letter-spacing:2px;margin-bottom:24px">LOCAL PLAY SETUP</div>
        <div id="lps-player-btns" style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">`;

    for (const count of [2, 3, 4] as const) {
      const active = participantCount === count;
      const activeStyle = active ? 'background:#fff;color:#000;' : '';
      html += `<button class="ui-btn lps-count-btn" data-count="${count}" style="display:inline-block;${activeStyle}">${count} Players</button>`;
    }

    html += `</div><div id="lps-seats" style="margin-bottom:24px">`;

    for (let i = 0; i < seats.length; i++) {
      const seatNum = i + 1;
      const config = seats[i]!;
      const focusClass = i === focusedSeatIndex ? ' seat-focused' : '';
      html += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;margin-bottom:8px">
          <span style="font-size:16px">Seat ${seatNum + 1}:</span>
          <button id="lps-cycle-${i}" class="ui-btn${focusClass}" style="font-size:14px;padding:8px 16px">${seatLabel(config)}</button>
        </div>`;
    }

    html += `</div>
        <button id="lps-start-btn" class="ui-btn" style="font-size:20px;padding:14px 36px">Start</button>
        ${onBack ? '<button id="lps-back-btn" class="ui-btn" style="margin-top:12px;font-size:14px;padding:8px 16px">← Back</button>' : ''}
      </div>
      <div class="menu-hint">↑↓ Navigate • ←→ Cycle Seat • Enter/A Select${onBack ? ' • Esc/B Back' : ''}</div>`;

    container.innerHTML = html;
    wireListeners();
    wireNav();
  }

  function wireListeners(): void {
    // Participant count buttons
    const countBtns = container.querySelectorAll('.lps-count-btn');
    countBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newCount = Number((btn as HTMLElement).dataset['count']) as ParticipantCount;
        if (newCount === participantCount) return;
        participantCount = newCount;
        // Resize seats array: keep existing, add defaults for new, trim excess
        while (seats.length < participantCount - 1) {
          seats.push({ kind: 'cpu', difficulty: 'medium' });
        }
        seats = seats.slice(0, participantCount - 1);
        render();
      });
    });

    // Seat cycle buttons
    for (let i = 0; i < seats.length; i++) {
      const cycleBtn = document.getElementById(`lps-cycle-${i}`);
      if (cycleBtn) {
        const idx = i;
        cycleBtn.addEventListener('click', () => {
          const slotIndex = idx + 1;
          seats[idx] = nextCycleOption(seats[idx]!, slotIndex, deps);
          render();
        });
      }
    }

    // Start button
    const startBtn = document.getElementById('lps-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        stopNav();
        onConfirm({ participantCount, seats: [...seats] });
      });
    }

    // Back button
    if (onBack) {
      const backBtn = document.getElementById('lps-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          stopNav();
          onBack();
        });
      }
    }

    // Keyboard handler for left/right seat cycling
    keyHandler = (e: KeyboardEvent) => {
      if (e.repeat) {
        return;
      }

      // Don't intercept when an input field is focused
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          cycleSeatLeft(focusedSeatIndex);
          break;
        case 'ArrowRight':
          e.preventDefault();
          cycleSeatRight(focusedSeatIndex);
          break;
      }
    };
    window.addEventListener('keydown', keyHandler);
  }

  function wireNav(): void {
    menuNav = new MenuNavigator(gamepadPoller);
    const navButtons: MenuButton[] = [];

    // Player count buttons
    const countBtns = container.querySelectorAll('.lps-count-btn');
    countBtns.forEach(btn => {
      const el = btn as HTMLElement;
      navButtons.push({
        id: `count-${el.dataset['count']}`,
        element: el,
        onActivate: () => el.click(),
      });
    });

    // Seat cycle buttons
    for (let i = 0; i < seats.length; i++) {
      const cycleBtn = document.getElementById(`lps-cycle-${i}`);
      if (cycleBtn) {
        navButtons.push({
          id: `cycle-${i}`,
          element: cycleBtn,
          onActivate: () => cycleBtn.click(),
        });
      }
    }

    // Start button
    const startBtn = document.getElementById('lps-start-btn');
    if (startBtn) {
      navButtons.push({
        id: 'start',
        element: startBtn,
        onActivate: () => startBtn.click(),
      });
    }

    // Back button
    if (onBack) {
      const backBtn = document.getElementById('lps-back-btn');
      if (backBtn) {
        navButtons.push({
          id: 'back',
          element: backBtn,
          onActivate: () => backBtn.click(),
        });
      }
    }

    menuNav.setButtons(navButtons);
    menuNav.start(onBack ? () => { stopNav(); onBack(); } : undefined);

    // Gamepad polling for left/right seat cycling
    if (gamepadPoller) {
      lastBitsPerGamepad.clear();

      // Prime with current state so already-held buttons are not treated as fresh presses.
      for (const [gpIndex, state] of gamepadPoller.poll()) {
        lastBitsPerGamepad.set(gpIndex, state.bits);
      }

      const pollGamepad = (): void => {
        const states = gamepadPoller.poll();

        for (const [gpIndex, state] of states) {
          const bits = state.bits;
          const lastBits = lastBitsPerGamepad.get(gpIndex) ?? 0;

          // Edge-detect: fire only on rising edge
          const pressed = bits & ~lastBits;

          if (pressed & GenericInputBits.LEFT) {
            cycleSeatLeft(focusedSeatIndex);
          }
          if (pressed & GenericInputBits.RIGHT) {
            cycleSeatRight(focusedSeatIndex);
          }

          lastBitsPerGamepad.set(gpIndex, bits);
        }

        // Check if stopped before scheduling next frame
        if (rafId === null) return;

        rafId = requestAnimationFrame(pollGamepad);
      };
      rafId = requestAnimationFrame(pollGamepad);
    }
  }

  render();
}
