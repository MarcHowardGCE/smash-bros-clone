import {getStageLayout} from '@smash/shared';
import { WORLD_STORIES, escapeHtml } from './selectionContent';
import{XBOX360_PROFILE as CONTROLLER_PROFILE}from'../input/xbox360Profile';
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
        btn.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      } else {
        btn.classList.remove('menu-selected');
      }
    });
    const stage=stages[selectedIndex];
    if(stage && stage.id!==lastPreviewId){lastPreviewId=stage.id;onPreview?.(stage);}
    const info=stage?WORLD_STORIES[stage.id]:undefined;
    const panel=container.querySelector<HTMLElement>('#stage-preview');
    if(panel){panel.innerHTML=stage ? '<img class="world-preview-art" src="'+normalizedBaseUrl+(info?'menu-art/'+stage.id+'.webp':'backgrounds/'+stage.backgroundImage)+'" alt="'+escapeHtml(stage.displayName)+'"><div class="world-copy"><small>WORLD '+String(selectedIndex+1).padStart(2,'0')+'</small><h2>'+escapeHtml(stage.displayName)+'</h2>'+(info?'<b>'+escapeHtml(info.hook)+'</b><p>'+escapeHtml(info.text)+'</p><button id="stage-story-toggle" class="ui-btn" aria-expanded="false">Read the story · X</button><p id="stage-story" hidden>'+escapeHtml(info.story)+'</p>':'')+'<p class="world-arena-note">'+getStageLayout(stage.id).platforms.length+' pass-through platforms · Static layout</p></div>' : '<div class="world-copy"><h2>Let the world choose you</h2><p>Random selects from these '+stages.length+' worlds.</p></div>';panel.querySelector('#stage-story-toggle')?.addEventListener('click',toggleStory);}
  }
  function toggleStory():void { const story=container.querySelector<HTMLElement>('#stage-story'),button=container.querySelector('#stage-story-toggle');if(story){story.hidden=!story.hidden;button?.setAttribute('aria-expanded',String(!story.hidden));} }

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

  container.innerHTML = '<div class="overlay-center world-selection"><header><small>SIX IMPOSSIBLE WORLDS</small><h1>Choose your world</h1></header><div class="world-layout"><div><div class="stage-grid">'+stages.map((stage,i)=>'<button class="stage-grid-btn ui-btn" data-stage-idx="'+i+'" aria-label="'+escapeHtml(stage.displayName)+'"><img src="'+normalizedBaseUrl+(WORLD_STORIES[stage.id]?'menu-art/'+stage.id+'.webp':'backgrounds/'+stage.backgroundImage)+'" alt=""><span>'+escapeHtml(WORLD_STORIES[stage.id]?.short??stage.displayName)+'</span></button>').join('')+'</div><button class="ui-btn world-random" data-stage-idx="'+randomIndex+'">✦ Random world</button></div><section id="stage-preview" aria-live="polite"></section></div>'+(onBack?'<button id="stage-back-btn" class="ui-btn">← Back</button>':'')+'</div><div class="menu-hint">Arrows / D-pad · Browse • Enter / '+CONTROLLER_PROFILE.menuLabels.confirm+' Select • X / I Story'+(onBack?' • Esc / '+CONTROLLER_PROFILE.menuLabels.cancel+' Back':'')+'</div>';

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
      case 'i':
      case 'I':
        e.preventDefault();toggleStory();break;
      case 'Enter':
      case ' ':
        if((e.target as HTMLElement)?.closest?.('#stage-story-toggle, #stage-back-btn'))return;
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
        if (pressed & GenericInputBits.X) toggleStory();
        if (pressed & CONTROLLER_PROFILE.confirm) selectStage(selectedIndex);
        if(disposed)return;
        if (pressed & CONTROLLER_PROFILE.cancel) goBack();

        lastBitsPerGamepad.set(gpIndex, bits);
      }

      if (rafId === null) return;
      rafId = requestAnimationFrame(pollGamepad);
    };
    rafId = requestAnimationFrame(pollGamepad);
  }
  return {destroy:cleanup};
}
