import type { PlayerId } from '@smash/shared';
import type { StageConfig } from '../stages/stageConfig';
import { escapeHtml, fighterPortrait } from './selectionContent';
import { worldArtwork } from './WorldPreview';

export interface ResultFighter {
  playerId: PlayerId;
  slotIndex: number;
  id: string;
  displayName: string;
  stocks?: number;
}

export interface MatchResult {
  stage: StageConfig;
  fighters: readonly ResultFighter[];
}

export function matchPause(online: boolean, confirming: boolean, pausePrompt: string, confirmPrompt: string): string {
  const mode = online ? 'Online match' : 'Local match';
  const actions = confirming ? `
    <p>${online ? 'Leaving forfeits your place in this online match.' : 'Leaving ends this local match.'}</p>
    <div class="pause-action-row"><button id="pause-stay-btn" class="menu-quiet workspace-primary">Stay</button>
      <button id="confirm-leave-match-btn" class="menu-quiet">Leave Match</button></div>` : `
    <p>${online ? 'The match is paused for everyone in the room.' : 'The match is paused on this device.'}</p>
    <div class="pause-action-row"><button id="resume-btn" class="menu-quiet workspace-primary">Resume · ${pausePrompt}</button>
      <button id="visual-settings-btn" class="menu-quiet">Visual accessibility</button></div>
    <div id="audio-settings-container"></div>
    <footer><button id="main-menu-btn" class="menu-quiet">Leave Match</button></footer>`;
  return `<section class="menu-workspace pause-menu" aria-labelledby="match-pause-title">
    <header><span class="menu-kicker">${mode}</span><h1 id="match-pause-title">${confirming ? 'Leave match?' : 'PAUSED'}</h1></header>
    ${actions}
    <p class="menu-hint">↑↓ Navigate · ←→ Adjust · Enter / ${confirmPrompt} Select</p>
  </section>`;
}

export function matchResult(
  message: string, winnerId: PlayerId | null, online: boolean, result?: MatchResult, canChangeFighters = false,
): string {
  const winner = result?.fighters.find(fighter => fighter.playerId === winnerId);
  const art = result ? ` style="--result-art:url('${escapeHtml(worldArtwork(result.stage))}')"` : '';
  return `<section class="menu-workspace match-result" aria-labelledby="match-result-title">
    <div class="result-feature"${art}>
      ${winner ? `<img src="${escapeHtml(fighterPortrait(winner.id))}" alt="">` : ''}
      <div><span class="menu-kicker">${online ? 'Online' : 'Local'} / Match results</span>
        <h1 id="match-result-title">${escapeHtml(message)}</h1>
        ${winner ? `<p class="result-fighter-name">${escapeHtml(winner.displayName)}</p>` : ''}
        ${result ? `<p>${escapeHtml(result.stage.displayName)}</p>` : ''}</div>
    </div>
    ${result?.fighters.length ? `<div class="result-lineup" aria-label="Match lineup">${result.fighters.map(fighter =>
      `<div class="result-seat" data-winner="${fighter.playerId===winnerId}"><span class="menu-kicker">P${fighter.slotIndex+1}</span>
        <strong>${escapeHtml(fighter.displayName)}</strong><small>${fighter.playerId===winnerId ? 'Winner' : winnerId ? 'Finished' : 'Draw'}${fighter.stocks===undefined ? '' : ` · ${fighter.stocks} ${fighter.stocks===1?'stock':'stocks'} left`}</small></div>`).join('')}</div>` : ''}
    <footer class="workspace-footer"><p>${online ? 'Create or join a room to play again.' : 'Play again with the same fighters and world.'}</p>
      <div class="result-actions"><button id="${online ? 'play-again-btn' : 'local-play-again-btn'}" class="menu-quiet workspace-primary">${online ? 'Online Play' : 'Rematch'}</button>
        ${canChangeFighters ? '<button id="result-change-fighters-btn" class="menu-quiet">Change Fighters</button>' : ''}
        <button id="main-menu-btn" class="menu-quiet">Main Menu</button></div></footer>
  </section>`;
}
