import type { PlayerId } from '@smash/shared';
import type { RenderState } from '../network/InterpolationBuffer.js';
import type { FighterChoice } from '../local/types.js';
import { renderControlsScreen } from './ControlsScreen.js';

export type UIPhase = 'connecting' | 'lobby' | 'waiting' | 'countdown' | 'match' | 'result' | 'controls' | 'paused';

export class UIManager {
  private overlay: HTMLElement;
  private hudPanel: HTMLElement;
  private phase: UIPhase = 'connecting';
  private myPlayerId: PlayerId | null = null;
  private roomCode: string | null = null;
  private playerCount: number = 0;

  onCreateRoom: (() => void) | null = null;
  onJoinRoom: ((code: string) => void) | null = null;
  onReady: (() => void) | null = null;
  onPlayAgain: (() => void) | null = null;
  onLocalPlay: (() => void) | null = null;
  onLocalPlayAgain: (() => void) | null = null;
  onOpenControls: (() => void) | null = null;
  onResume: (() => void) | null = null;
  onMainMenu: (() => void) | null = null;

  constructor(overlayElement: HTMLElement) {
    this.overlay = overlayElement;
    this.hudPanel = document.createElement('div');
    this.hudPanel.id = 'hud-panel';
    this.hudPanel.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 40px; font-family: monospace; color: white;
      pointer-events: none; z-index: 20;
    `;
    document.body.appendChild(this.hudPanel);
    this.showConnecting();
  }

  setPlayerId(id: PlayerId): void {
    this.myPlayerId = id;
  }

  setRoomCode(code: string): void {
    this.roomCode = code;
  }

  showConnecting(): void {
    this.phase = 'connecting';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:24px">Connecting to server...</div>
      </div>`;
  }

  showLobby(): void {
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    const urlParams = new URLSearchParams(window.location.search);
    const existingRoom = urlParams.get('room');

    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:40px;letter-spacing:4px;margin-bottom:32px">SMASH CLONE</div>
        ${existingRoom
          ? `<div style="font-size:18px;margin-bottom:24px">Room: <span style="font-size:24px">${existingRoom}</span></div>
             <button id="ready-btn" class="ui-btn">Ready</button>`
          : `<button id="create-btn" class="ui-btn" style="margin-bottom:16px">Create Room</button>
             <div style="display:flex;gap:8px;align-items:center">
               <input id="join-code" class="ui-input" placeholder="ROOM CODE" maxlength="6">
               <button id="join-btn" class="ui-btn">Join</button>
             </div>`
        }
        <button id="local-play-btn" class="ui-btn" style="margin-top:24px">Local Play</button>
        <button id="controls-btn" class="ui-btn" style="margin-top:12px">Controls</button>
      </div>`;

    document.getElementById('create-btn')?.addEventListener('click', () => this.onCreateRoom?.());
    document.getElementById('join-btn')?.addEventListener('click', () => {
      const code = (document.getElementById('join-code') as HTMLInputElement)?.value?.trim().toUpperCase();
      if (code?.length === 6) this.onJoinRoom?.(code);
    });
    document.getElementById('ready-btn')?.addEventListener('click', () => {
      this.onReady?.();
      this.showWaiting();
    });
    document.getElementById('local-play-btn')?.addEventListener('click', () => this.onLocalPlay?.());
    document.getElementById('controls-btn')?.addEventListener('click', () => this.onOpenControls?.());
    document.getElementById('join-code')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('join-btn')?.click();
    });
  }

  showControls(deps: { assignmentManager: any; preferenceStore: any }): void {
    this.phase = 'controls';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = '';
    
    renderControlsScreen(this.overlay, {
      ...deps,
      onBack: () => this.showLobby(),
    });
  }

  showCharacterSelect(
    fighters: FighterChoice[],
    playerCount: number,
    onSelected: (choices: FighterChoice[]) => void
  ): void {
    this.hudPanel.style.display = 'none';

    // Keyboard confirm keys per slot (slot 0: Enter/Z, slot 1: U, slots 2-3: fallback keys)
    const CONFIRM_KEYS: string[][] = [
      ['Enter', 'KeyZ'],
      ['KeyU'],
      ['Digit1'],
      ['Digit2'],
    ];

    const choices: (FighterChoice | null)[] = Array(playerCount).fill(null);
    const confirmed: boolean[] = Array(playerCount).fill(false);
    const rafIds: number[] = [];

    // Render N panels dynamically
    const panelsHtml = (() => {
      let html = '';
      for (let i = 0; i < playerCount; i++) {
        const confirmHint = i === 0 ? 'Enter or Z' : i === 1 ? 'U' : CONFIRM_KEYS[i]?.[0] ?? 'Gamepad A';
        html += `
        <div id="p${i + 1}-panel" style="text-align:center">
          <div style="font-size:20px;margin-bottom:16px">P${i + 1} Choose</div>
          ${fighters.map(f => `
            <div class="fighter-option" data-player="${i + 1}" data-id="${f.id}"
                 style="border:2px solid rgba(255,255,255,0.3);padding:12px 24px;margin-bottom:8px;cursor:pointer;font-size:18px">
              ${f.displayName}
            </div>
          `).join('')}
          <div id="p${i + 1}-status" style="font-size:14px;margin-top:12px;color:rgba(255,255,255,0.5)">
            Press ${confirmHint} to confirm
          </div>
        </div>`;
      }
      return html;
    })();

    this.overlay.innerHTML = `
      <div class="overlay-center" style="flex-direction:row;gap:60px">
        ${panelsHtml}
      </div>`;

    // Auto-select the first fighter for each player (since there's only one fighter today)
    if (fighters[0]) {
      for (let i = 0; i < playerCount; i++) {
        choices[i] = fighters[0];
        document.querySelectorAll(`[data-player="${i + 1}"]`).forEach(el => {
          (el as HTMLElement).style.borderColor = 'white';
        });
      }
    }

    const cleanup = () => {
      window.removeEventListener('keydown', onKey);
      for (const id of rafIds) {
        cancelAnimationFrame(id);
      }
      rafIds.length = 0;
    };

    const checkAllConfirmed = () => {
      if (confirmed.every(c => c) && choices.every(c => c !== null)) {
        cleanup();
        onSelected(choices as FighterChoice[]);
      }
    };

    const confirmSlot = (slotIndex: number) => {
      if (confirmed[slotIndex]) return;
      confirmed[slotIndex] = true;
      const status = document.getElementById(`p${slotIndex + 1}-status`);
      if (status) { status.textContent = '✓ Ready!'; status.style.color = 'white'; }
      checkAllConfirmed();
    };

    const onKey = (e: KeyboardEvent) => {
      for (let i = 0; i < playerCount; i++) {
        if (!confirmed[i] && CONFIRM_KEYS[i]?.includes(e.code)) {
          confirmSlot(i);
          break;
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // Gamepad A-button polling for slots 1-3 (if gamepad-input available)
    if (typeof requestAnimationFrame !== 'undefined' && (this as any)._gamepadPoller) {
      const poller = (this as any)._gamepadPoller;
      for (let i = 1; i < playerCount; i++) {
        const slotIndex = i;
        const gamepadIndex = i - 1; // gamepads assigned to slots 1-3 map to gamepad indices 0-2
        const checkGamepad = () => {
          if (confirmed[slotIndex]) return;
          const state = poller.poll().get(gamepadIndex);
          if (state?.bits & 0x0010) { // GenericInputBits.A
            confirmSlot(slotIndex);
          } else {
            rafIds.push(requestAnimationFrame(checkGamepad));
          }
        };
        rafIds.push(requestAnimationFrame(checkGamepad));
      }
    }
  }

  showRoomCreated(code: string): void {
    this.phase = 'lobby';
    this.roomCode = code;
    this.playerCount = 1;
    this.hudPanel.style.display = 'none';

    const url = new URL(window.location.href);
    url.searchParams.set('room', code);
    window.history.replaceState({}, '', url.toString());

    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:18px;margin-bottom:8px">Room Created</div>
        <div style="font-size:56px;letter-spacing:8px;margin-bottom:8px">${code}</div>
        <button id="copy-btn" class="ui-btn" style="margin-bottom:24px;font-size:14px">Copy Link</button>
        <div id="player-list" style="font-size:14px;margin-bottom:24px">
          <div>P1: You (waiting to ready...)</div>
        </div>
        <button id="ready-btn" class="ui-btn">Ready</button>
      </div>`;

    document.getElementById('copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
      if (copyBtn) copyBtn.textContent = 'Copied!';
    });
    document.getElementById('ready-btn')?.addEventListener('click', () => {
      this.onReady?.();
      this.showWaiting();
    });
  }

  showPlayerJoined(slotIndex: number): void {
    this.playerCount = Math.max(this.playerCount, slotIndex + 1);
    const playerList = document.getElementById('player-list');
    if (playerList) {
      playerList.innerHTML = '';
      for (let i = 0; i < this.playerCount; i++) {
        playerList.innerHTML += `<div>P${i + 1}: ${i === 0 ? 'You' : 'Player ' + (i + 1)} ✓</div>`;
      }
    }
  }

  showWaiting(): void {
    this.phase = 'waiting';
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement | null;
    if (readyBtn) {
      readyBtn.textContent = 'Waiting for others...';
      readyBtn.disabled = true;
      readyBtn.style.opacity = '0.5';
    }
  }

  showCountdown(count: number): void {
    this.phase = 'countdown';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="overlay-center" style="font-size:120px;font-weight:bold;letter-spacing:8px">
        ${count > 0 ? count : 'GO!'}
      </div>`;
  }

  showMatch(): void {
    this.phase = 'match';
    this.overlay.innerHTML = '';
    this.hudPanel.style.display = 'flex';
  }

  showPauseOverlay(): void {
    this.phase = 'paused';
    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:48px;letter-spacing:4px;margin-bottom:40px">PAUSED</div>
        <button id="resume-btn" class="ui-btn" style="margin-bottom:16px">Resume</button>
        <button id="main-menu-btn" class="ui-btn">Main Menu</button>
      </div>`;

    document.getElementById('resume-btn')?.addEventListener('click', () => this.onResume?.());
    document.getElementById('main-menu-btn')?.addEventListener('click', () => this.onMainMenu?.());
  }

  hidePauseOverlay(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'match';
    this.overlay.innerHTML = '';
    this.hudPanel.style.display = 'flex';
  }

  getPhase(): UIPhase {
    return this.phase;
  }

  showResult(winnerId: PlayerId | null, myPlayerId: PlayerId | null): void {
    this.phase = 'result';
    this.hudPanel.style.display = 'none';
    const isMe = winnerId === myPlayerId;
    const msg = winnerId
      ? (isMe ? 'You Win!' : 'Player Wins!')
      : 'Draw!';

    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:64px;margin-bottom:32px">${msg}</div>
        <button id="play-again-btn" class="ui-btn">Play Again</button>
      </div>`;

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      this.onPlayAgain?.();
    });
  }

  private interpolateDamageColor(percent: number): string {
    // 0% = white, 75% = yellow, 150%+ = red
    let r: number, g: number, b: number;

    if (percent <= 75) {
      // 0% (white) → 75% (yellow): interpolate green from 255 to 255, red stays 255, blue goes 255 → 0
      const t = percent / 75;
      r = 255;
      g = 255;
      b = Math.round(255 * (1 - t));
    } else {
      // 75% (yellow) → 150%+ (red): interpolate green from 255 → 0, red stays 255, blue stays 0
      const t = Math.min(1, (percent - 75) / 75);
      r = 255;
      g = Math.round(255 * (1 - t));
      b = 0;
    }

    return `rgb(${r},${g},${b})`;
  }

  updateHUD(state: RenderState, myPlayerId: PlayerId | null): void {
    if (this.phase !== 'match') return;

    const players = [...state.players.values()].sort((a, b) => a.slotIndex - b.slotIndex);

    this.hudPanel.innerHTML = players.map((p) => {
      const isMe = p.id === myPlayerId;
      const stocks = p.stocks ?? 0;
      const maxStocks = 3;
      const stockBar = '■'.repeat(Math.max(0, stocks)) + '□'.repeat(Math.max(0, maxStocks - stocks));
      const percent = Math.floor(p.percent ?? 0);
      const damageColor = this.interpolateDamageColor(percent);

      return `<div style="text-align:center;${isMe ? 'text-shadow:0 0 8px #fff' : ''}">
        <div style="font-size:12px;margin-bottom:4px">P${p.slotIndex + 1}${isMe ? ' ★' : ''}</div>
        <div style="font-size:32px;font-weight:bold;color:${damageColor}">${percent}%</div>
        <div style="font-size:18px;letter-spacing:2px;margin-top:4px">${stockBar}</div>
      </div>`;
    }).join('');

    let roomDisplay = document.getElementById('room-code-display');
    if (!roomDisplay) {
      roomDisplay = document.createElement('div');
      roomDisplay.id = 'room-code-display';
      roomDisplay.style.cssText = `
        position:fixed;top:12px;left:16px;font-family:monospace;font-size:12px;
        color:rgba(255,255,255,0.5);z-index:20;pointer-events:none;
      `;
      document.body.appendChild(roomDisplay);
    }
    if (this.roomCode) {
      roomDisplay.textContent = `Room: ${this.roomCode}`;
      roomDisplay.style.display = 'block';
    }
  }

  hideRoomCode(): void {
    const el = document.getElementById('room-code-display');
    if (el) el.style.display = 'none';
  }

  showLocalResult(winnerId: PlayerId | null): void {
    this.phase = 'result';
    this.hudPanel.style.display = 'none';
    this.hideRoomCode();

    let msg: string;
    if (!winnerId) {
      msg = 'Draw!';
    } else {
      const match = winnerId.match(/^local-p(\d+)$/);
      if (match) {
        const playerNum = match[1];
        msg = `P${playerNum} Wins!`;
      } else {
        msg = `${winnerId} Wins!`;
      }
    }

    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:64px;margin-bottom:32px">${msg}</div>
        <button id="local-play-again-btn" class="ui-btn">Play Again</button>
      </div>`;

    document.getElementById('local-play-again-btn')?.addEventListener('click', () => {
      this.onLocalPlayAgain?.();
    });
  }
}
