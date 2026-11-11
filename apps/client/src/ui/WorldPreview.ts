import { getStageLayout } from '@smash/shared';
import type { StageConfig } from '../stages/stageConfig';
import { escapeHtml, fighterPortrait, WORLD_STORIES } from './selectionContent';

export function worldArtwork(stage: StageConfig): string {
  const base = import.meta.env.BASE_URL || '/';
  if(stage.menuImage)return base+'menu-art/'+stage.menuImage;
  return base + (WORLD_STORIES[stage.id] ? 'menu-art/'+stage.id+'.webp' : 'backgrounds/'+stage.backgroundImage);
}

function arenaDiagram(stage: StageConfig): string {
  const layout = getStageLayout(stage.id);
  const floor = layout.mainPlatform;
  const platforms = [floor, ...layout.platforms];
  const top = Math.min(...platforms.map(platform => platform.y)) - 40;
  const left = Math.min(...platforms.map(platform => platform.x)) - 38;
  const right = Math.max(...platforms.map(platform => platform.x+platform.width)) + 38;
  const bottom = Math.max(...platforms.map(platform => platform.y+platform.height)) + 40;
  return `<div class="world-layout-map">
    <svg role="img" aria-label="Arena layout: one main floor and ${layout.platforms.length} pass-through platforms" viewBox="${left} ${top} ${right-left} ${bottom-top}">
      ${platforms.map(platform => `<rect class="${platform.solid ? 'world-map-solid' : 'world-map-soft'}" x="${platform.x}" y="${platform.y}" width="${platform.width}" height="${platform.height}" rx="4"/>`).join('')}
    </svg><div><b>Platform layout</b><small>${layout.platforms.length} pass-through platforms · Static arena</small></div></div>`;
}

export function renderWorldPreview(
  panel: HTMLElement,
  stages: readonly StageConfig[],
  index: number,
): void {
  const stage = stages[index];
  const id = stage ? stage.id+(stage.backgroundVariant===undefined?'':':'+stage.backgroundVariant) : 'random';
  if (panel.dataset.worldPreview === id) return;
  panel.dataset.worldPreview = id;
  if (!stage) {
    panel.innerHTML = `<div class="world-art-slot world-random-art" aria-hidden="true">
      ${stages.map(world => `<img src="${escapeHtml(worldArtwork(world))}" alt="">`).join('')}<span>✦</span></div>
      <div class="world-preview-summary"><span class="menu-kicker">Random world</span><h2>Let the world choose you</h2>
        <p>Confirm to draw one arena from the ${stages.length} available worlds.</p></div>`;
    return;
  }
  const info = WORLD_STORIES[stage.id];
  panel.innerHTML = `<div class="world-art-slot"><img src="${escapeHtml(worldArtwork(stage))}" alt=""></div>
    <div class="world-preview-summary"><span class="menu-kicker">World ${String(index+1).padStart(2,'0')}</span>
      <h2>${escapeHtml(stage.displayName)}</h2><p class="world-hook">${escapeHtml(info?.hook ?? '')}</p>
      ${arenaDiagram(stage)}
      ${info ? `<p id="stage-story">${escapeHtml(info.story)}</p>` : ''}
    </div>`;
}

export interface MatchIntro {
  stage: StageConfig;
  fighters: readonly { id: string; displayName: string; slotIndex: number }[];
}

export function matchIntro(intro: MatchIntro): string {
  const fighters = intro.fighters;
  return `<section class="menu-workspace match-intro" aria-label="Match intro">
    <div class="match-intro-art" style="--intro-art:url('${escapeHtml(worldArtwork(intro.stage))}')"></div>
    <header><span class="menu-kicker">Entering the arena</span><h1>${escapeHtml(intro.stage.displayName)}</h1></header>
    <div class="match-lineup">
    ${fighters.map((fighter,index) => `<div class="match-intro-fighter">
      <img src="${escapeHtml(fighterPortrait(fighter.id))}" alt=""><span>P${fighter.slotIndex+1}</span><strong>${escapeHtml(fighter.displayName)}</strong>
    </div>${index===0 && fighters.length===2 ? '<strong class="match-versus" aria-label="versus">VS</strong>' : ''}`).join('')}</div>
    <div class="match-intro-count" role="status"></div>
  </section>`;
}
