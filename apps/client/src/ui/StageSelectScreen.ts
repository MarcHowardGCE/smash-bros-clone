/**
 * @fileoverview Stage Select screen with grid navigation.
 *
 * Renders a grid of stage thumbnails plus a Random button. Supports keyboard
 * arrow navigation, Enter/Space to confirm, Escape to go back, and gamepad
 * D-pad/A/B equivalents. Follows the external-render-function pattern:
 * {@link renderStageSelectScreen} writes HTML into the provided container and
 * manages its own input lifecycle, cleaning up on selection or back.
 */

import type { GamepadPoller } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';
import { STAGES, getRandomStage, type StageConfig } from '../stages/stageConfig.js';

/** Number of columns in the stage grid. */
const GRID_COLS = 2;

/**
 * Render the Stage Select screen into the given container.
 */
export function renderStageSelectScreen(
  container: HTMLElement,
  stages: readonly StageConfig[],
  onSelected: (stage: StageConfig) => void,
  onBack?: () => void,
  gamepadPoller?: GamepadPoller | null,
): void {
  /** Total navigable items: stages + 1 random button. */
  const totalItems = stages.length + 1;
  const randomIndex = stages.length;

  let selectedIndex = 0;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  let rafId: number | null = null;
  let lastBitsPerGamepad = new Map<number, number>();
  let disposed = false;

  function cleanup(): void {
    disposed = true;
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

  function selectStage(index: number): void {
    cleanup();
    if (index === randomIndex) {
      onSelected(getRandomStage());
    } else {
      const stage = stages[index];
      if (stage) onSelected(stage);
    }
  }

  function goBack(): void {
    if (onBack) {
      cleanup();
      onBack();
    }
  }

  function updateVisuals(): void {
    const allBtns = container.querySelectorAll<HTMLElement>('[data-stage-idx]');
    allBtns.forEach((btn) => {
      const idx = Number(btn.dataset['stageIdx']);
      if (idx === selectedIndex) {
        btn.classList.add('menu-selected');
      } else {
        btn.classList.remove('menu-selected');
      }
    });
  }

  function moveGrid(direction: 'up' | 'down' | 'left' | 'right'): void {
    const stageCount = stages.length;
    const rows = Math.ceil(stageCount / GRID_COLS);

    if (selectedIndex === randomIndex) {
      // On random button
      switch (direction) {
        case 'up': {
          // Move to last row, keep centered (left column)
          const lastRowStart = (rows - 1) * GRID_COLS;
          selectedIndex = Math.min(lastRowStart, stageCount - 1);
          break;
        }
        case 'down':
        case 'left':
        case 'right':
          // No movement
          break;
      }
    } else {
      // On a stage button in the grid
      const row = Math.floor(selectedIndex / GRID_COLS);
      const col = selectedIndex % GRID_COLS;

      switch (direction) {
        case 'left':
          if (col > 0) selectedIndex -= 1;
          break;
        case 'right':
          if (col < GRID_COLS - 1 && selectedIndex + 1 < stageCount) {
            selectedIndex += 1;
          }
          break;
        case 'up':
          if (row > 0) selectedIndex -= GRID_COLS;
          break;
        case 'down':
          if (row < rows - 1) {
            const newIdx = selectedIndex + GRID_COLS;
            if (newIdx < stageCount) {
              selectedIndex = newIdx;
            } else {
              selectedIndex = randomIndex;
            }
          } else {
            // Last row → random button
            selectedIndex = randomIndex;
          }
          break;
      }
    }

    updateVisuals();
  }

  // --- Render HTML ---
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  let gridHtml = '';
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    const imgPath = `${normalizedBaseUrl}backgrounds/${stage.backgroundImage}`;
    gridHtml += `<button class="ui-btn stage-grid-btn" data-stage-idx="${i}" style="display:flex;flex-direction:column;align-items:center;padding:10px;min-width:200px;gap:8px;cursor:pointer">
      <img src="${imgPath}" alt="${stage.displayName}" style="width:180px;height:100px;object-fit:cover;display:block;border-radius:6px;pointer-events:none">
      <span style="font-size:14px;letter-spacing:1px;opacity:0.9">${stage.displayName}</span>
    </button>`;
  }

  container.innerHTML = `
    <div class="overlay-center" style="max-width:560px;width:100%;align-items:center">
      <div style="font-size:32px;letter-spacing:2px;margin-bottom:24px">SELECT STAGE</div>
      <div class="stage-grid" style="display:grid;grid-template-columns:repeat(${GRID_COLS},1fr);gap:16px;margin-bottom:20px;width:100%">
        ${gridHtml}
      </div>
      <button class="ui-btn stage-grid-btn" data-stage-idx="${randomIndex}" style="display:flex;flex-direction:column;align-items:center;padding:10px 24px;min-width:200px;gap:8px;width:100%;cursor:pointer">
        <div style="width:180px;height:100px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(255,255,255,0.05);border:2px dashed rgba(255,255,255,0.3);font-size:42px;opacity:0.7">?</div>
        <span style="font-size:14px;letter-spacing:1px;opacity:0.9">Random</span>
      </button>
      ${onBack ? '<button id="stage-back-btn" class="ui-btn" style="margin-top:16px;font-size:14px;padding:8px 16px">← Back</button>' : ''}
    </div>
    <div class="menu-hint">↑↓←→ Navigate • Enter/A Select${onBack ? ' • Esc/B Back' : ''}</div>`;

  // --- Wire click listeners ---
  const allBtns = container.querySelectorAll<HTMLElement>('[data-stage-idx]');
  allBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset['stageIdx']);
      selectStage(idx);
    });
  });

  if (onBack) {
    document.getElementById('stage-back-btn')?.addEventListener('click', goBack);
  }

  // Initial visual highlight
  updateVisuals();

  // --- Keyboard navigation ---
  keyHandler = (e: KeyboardEvent) => {
    if (e.repeat) {
      return;
    }

    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveGrid('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveGrid('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveGrid('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveGrid('right');
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectStage(selectedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        goBack();
        break;
    }
  };
  window.addEventListener('keydown', keyHandler);

  // --- Gamepad polling ---
  if (gamepadPoller) {
    lastBitsPerGamepad.clear();

    // Prime with current state so already-held buttons are not treated as fresh presses.
    for (const [gpIndex, state] of gamepadPoller.poll()) {
      lastBitsPerGamepad.set(gpIndex, state.bits);
    }

    const pollGamepad = (): void => {
      if (disposed) return;

      const states = gamepadPoller.poll();

      for (const [gpIndex, state] of states) {
        const bits = state.bits;
        const lastBits = lastBitsPerGamepad.get(gpIndex) ?? 0;
        const pressed = bits & ~lastBits;

        if (pressed & GenericInputBits.UP) moveGrid('up');
        if (pressed & GenericInputBits.DOWN) moveGrid('down');
        if (pressed & GenericInputBits.LEFT) moveGrid('left');
        if (pressed & GenericInputBits.RIGHT) moveGrid('right');
        if (pressed & GenericInputBits.A) selectStage(selectedIndex);
        if (pressed & GenericInputBits.B) goBack();

        lastBitsPerGamepad.set(gpIndex, bits);
      }

      if (rafId === null) return;
      rafId = requestAnimationFrame(pollGamepad);
    };
    rafId = requestAnimationFrame(pollGamepad);
  }
}
