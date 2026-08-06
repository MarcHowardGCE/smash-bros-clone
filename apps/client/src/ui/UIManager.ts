import type { PlayerId } from '@smash/shared';
import type { RenderState } from '../network/InterpolationBuffer.js';
import type { FighterChoice } from '../local/types.js';

export type UIPhase = 'connecting' | 'lobby' | 'waiting' | 'countdown' | 'match' | 'result';

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
    document.getElementById('join-code')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('join-btn')?.click();
    });
  }

  showCharacterSelect(
    fighters: FighterChoice[],
    onSelected: (p1: FighterChoice, p2: FighterChoice) => void
  ): void {
    this.hudPanel.style.display = 'none';
    let p1Choice: FighterChoice | null = null;
    let p2Choice: FighterChoice | null = null;

    // Render the overlay with two panels side by side
    this.overlay.innerHTML = `
      <div class="overlay-center" style="flex-direction:row;gap:60px">
        <div id="p1-panel" style="text-align:center">
          <div style="font-size:20px;margin-bottom:16px">P1 Choose</div>
          ${fighters.map(f => `
            <div class="fighter-option" data-player="1" data-id="${f.id}" 
                 style="border:2px solid rgba(255,255,255,0.3);padding:12px 24px;margin-bottom:8px;cursor:pointer;font-size:18px">
              ${f.displayName}
            </div>
          `).join('')}
          <div id="p1-status" style="font-size:14px;margin-top:12px;color:rgba(255,255,255,0.5)">
            Press Enter or Z to confirm
          </div>
        </div>
        <div id="p2-panel" style="text-align:center">
          <div style="font-size:20px;margin-bottom:16px">P2 Choose</div>
          ${fighters.map(f => `
            <div class="fighter-option" data-player="2" data-id="${f.id}"
                 style="border:2px solid rgba(255,255,255,0.3);padding:12px 24px;margin-bottom:8px;cursor:pointer;font-size:18px">
              ${f.displayName}
            </div>
          `).join('')}
          <div id="p2-status" style="font-size:14px;margin-top:12px;color:rgba(255,255,255,0.5)">
            Press U to confirm
          </div>
        </div>
      </div>`;

    // Auto-select the first fighter for each player (since there's only one)
    if (fighters[0]) {
      p1Choice = fighters[0];
      p2Choice = fighters[0];
      // Highlight first option for both
      document.querySelectorAll('[data-player="1"]').forEach(el => {
        (el as HTMLElement).style.borderColor = 'white';
      });
      document.querySelectorAll('[data-player="2"]').forEach(el => {
        (el as HTMLElement).style.borderColor = 'white';
      });
    }

    let p1Confirmed = false;
    let p2Confirmed = false;

    const checkBothConfirmed = () => {
      if (p1Confirmed && p2Confirmed && p1Choice && p2Choice) {
        this.overlay.removeEventListener('keydown', onKey as EventListener);
        window.removeEventListener('keydown', onKey);
        onSelected(p1Choice, p2Choice);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!p1Confirmed && (e.code === 'Enter' || e.code === 'KeyZ')) {
        p1Confirmed = true;
        const status = document.getElementById('p1-status');
        if (status) { status.textContent = '✓ Ready!'; status.style.color = 'white'; }
        checkBothConfirmed();
      }
      if (!p2Confirmed && e.code === 'KeyU') {
        p2Confirmed = true;
        const status = document.getElementById('p2-status');
        if (status) { status.textContent = '✓ Ready!'; status.style.color = 'white'; }
        checkBothConfirmed();
      }
    };

    window.addEventListener('keydown', onKey);
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

  updateHUD(state: RenderState, myPlayerId: PlayerId | null): void {
    if (this.phase !== 'match') return;

    const players = [...state.players.values()].sort((a, b) => a.slotIndex - b.slotIndex);

    this.hudPanel.innerHTML = players.map((p) => {
      const isMe = p.id === myPlayerId;
      const stocks = p.stocks ?? 0;
      const maxStocks = 3;
      const stockBar = '■'.repeat(Math.max(0, stocks)) + '□'.repeat(Math.max(0, maxStocks - stocks));
      const percent = Math.floor(p.percent ?? 0);

      return `<div style="text-align:center;${isMe ? 'text-shadow:0 0 8px #fff' : ''}">
        <div style="font-size:12px;margin-bottom:4px">P${p.slotIndex + 1}${isMe ? ' ★' : ''}</div>
        <div style="font-size:32px;font-weight:bold">${percent}%</div>
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
