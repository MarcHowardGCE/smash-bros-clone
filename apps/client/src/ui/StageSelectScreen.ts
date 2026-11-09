import { renderWorldPreview, toggleWorldStory, worldArtwork } from './WorldPreview';
import { WORLD_STORIES, escapeHtml } from './selectionContent';
import { ULTIMATE_MENU } from '../input/controllerProfiles';
import { controllerPrompt, type PromptRenderer } from './controllerPrompts';
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
import type { StageConfig } from '../stages/stageConfig.js';

/** Number of columns in the stage grid. */
const GRID_COLS = 3;

/**
 * Render the Stage Select screen into the given container.
 */
export function renderStageSelectScreen(
  container: HTMLElement,
  stages: readonly StageConfig[],
  onSelected: (stage: StageConfig) => void,
  onBack?: () => void,
  gamepadPoller?: GamepadPoller | null,
  onPreview?: (stage:StageConfig)=>void,
  initialStageId?:string,
  prompt: PromptRenderer = controllerPrompt,
): {destroy:()=>void} {
  /** Total navigable items: stages + 1 random button. */
  const totalItems = stages.length + 1;
  const randomIndex = stages.length;

  let selectedIndex = Math.max(0,stages.findIndex(s=>s.id===initialStageId));
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  let rafId: number | null = null;
  let lastBitsPerGamepad = new Map<number, number>();
  let disposed = false;
  let lastPreviewId:string|undefined;

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
    if(disposed)return;
    cleanup();
    if (index === randomIndex) {
      const stage=stages[Math.floor(Math.random()*stages.length)];
      if(stage)onSelected(stage);
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
        btn.setAttribute('aria-pressed', 'true');
        btn.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      } else {
        btn.classList.remove('menu-selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    const stage=stages[selectedIndex];
    if(stage && stage.id!==lastPreviewId){lastPreviewId=stage.id;onPreview?.(stage);}
    const panel = container.querySelector<HTMLElement>('#stage-preview')!;
    renderWorldPreview(panel, stages, selectedIndex, prompt);
    container.querySelector('#stage-confirm-btn')!.textContent = stage ? 'Choose World' : 'Choose Random World';
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


  container.innerHTML = `
    <section class="menu-workspace world-selection" aria-labelledby="world-select-title">
      <header class="picker-header"><div><span class="menu-kicker">Arena / ${stages.length} worlds</span><h1 id="world-select-title">Choose your world</h1></div>
        ${onBack ? '<button id="stage-back-btn" class="menu-quiet">← Back</button>' : ''}</header>
      <div class="world-browser">
        <div class="world-catalog">
          <div class="world-tiles">${stages.map((stage,index) => `<button type="button" class="world-tile menu-quiet" data-stage-idx="${index}" aria-label="${escapeHtml(stage.displayName)}">
            <img src="${escapeHtml(worldArtwork(stage))}" alt=""><span><small>${String(index+1).padStart(2,'0')}</small>${escapeHtml(WORLD_STORIES[stage.id]?.short ?? stage.displayName)}</span>
          </button>`).join('')}</div>
          <button type="button" class="menu-quiet world-random-choice" data-stage-idx="${randomIndex}"><span aria-hidden="true">✦</span> Random world</button>
        </div>
        <section id="stage-preview" class="world-preview-panel" aria-label="World preview"></section>
      </div>
      <footer class="workspace-footer"><p class="picker-help">Arrows / D-pad browse · Enter / ${prompt('confirm')} Select · ${prompt('story')} / I Story${onBack ? ' · Esc / '+prompt('cancel')+' Back' : ''}</p>
        <button type="button" class="menu-quiet workspace-primary" id="stage-confirm-btn">Choose World</button></footer>
    </section>`;
  // --- Wire click listeners ---
  const allBtns = container.querySelectorAll<HTMLElement>('[data-stage-idx]');
  allBtns.forEach((btn) => {
    const preview=()=>{selectedIndex=Number(btn.dataset['stageIdx']);updateVisuals();};
    btn.addEventListener('mouseenter',preview);
    btn.addEventListener('focus',preview);
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset['stageIdx']);
      selectStage(idx);
    });
  });

  if (onBack) {
    document.getElementById('stage-back-btn')?.addEventListener('click', goBack);
  }

  container.querySelector('#stage-confirm-btn')?.addEventListener('click', () => selectStage(selectedIndex));

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

    if (document.activeElement?.id === 'stage-story' && e.key.startsWith('Arrow')) return;
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
      case 'i':
      case 'I':
        e.preventDefault();toggleWorldStory(container);break;
      case 'Enter':
      case ' ':
        if((e.target as HTMLElement)?.closest?.('#stage-story-toggle, #stage-story, #stage-back-btn, #stage-confirm-btn'))return;
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
        if (pressed & GenericInputBits.X) toggleWorldStory(container);
        if (pressed & ULTIMATE_MENU.confirm) selectStage(selectedIndex);
        if(disposed)return;
        if (pressed & ULTIMATE_MENU.cancel) goBack();

        lastBitsPerGamepad.set(gpIndex, bits);
      }

      if (rafId === null) return;
      rafId = requestAnimationFrame(pollGamepad);
    };
    rafId = requestAnimationFrame(pollGamepad);
  }
  return {destroy:cleanup};
}
