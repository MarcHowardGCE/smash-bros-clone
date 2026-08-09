import type { GamepadPoller, GamepadPreferenceStore } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';
import type { PlayerId } from '@smash/shared';
import type { RenderState } from '../network/InterpolationBuffer.js';
import type { ControllerAssignmentManager } from '../input/ControllerAssignmentManager.js';
import type { FighterChoice, SeatConfig } from '../local/types.js';
import { renderControlsScreen } from './ControlsScreen.js';
import { renderLocalPlaySetupScreen } from './LocalPlaySetupScreen.js';
import { MenuNavigator } from './MenuNavigator.js';
import type { MenuButton } from './MenuNavigator.js';

export type UIPhase = 'connecting' | 'lobby' | 'waiting' | 'countdown' | 'match' | 'result' | 'controls' | 'paused';

export class UIManager {
  private overlay: HTMLElement;
  private hudPanel: HTMLElement;
  private phase: UIPhase = 'connecting';
  private myPlayerId: PlayerId | null = null;
  private roomCode: string | null = null;
  private playerCount: number = 0;
  private menuNav: MenuNavigator | null = null;
  _gamepadPoller: GamepadPoller | null = null;

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

  private stopMenuNav(): void {
    if (this.menuNav) {
      this.menuNav.stop();
      this.menuNav = null;
    }
  }

  showConnecting(): void {
    this.stopMenuNav();
    this.phase = 'connecting';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:24px">Connecting to server...</div>
      </div>`;
  }

  showSplash(onContinue: () => void): void {
    this.stopMenuNav();
    this.phase = 'connecting';
    this.hudPanel.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="splash-screen" id="splash-screen">
        <img src="/branding/zanda-logo.png" alt="Zanda Entertainment" class="splash-logo">
        <div class="splash-continue">Press any button to continue</div>
      </div>`;

    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      let dismissed = false;
      let rafId: number | null = null;

      const dismiss = (): void => {
        if (dismissed) return;
        dismissed = true;
        
        // Cancel gamepad polling
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
          onContinue();
        }, 800);
        splashScreen.removeEventListener('click', handleClick);
      };

      const handleClick = (): void => {
        dismiss();
      };

      // Gamepad polling for any button press
      if (typeof requestAnimationFrame !== 'undefined' && this._gamepadPoller) {
        const poller = this._gamepadPoller;
        let lastBits = new Map<number, number>();
        const checkGamepads = (): void => {
          const states = poller.poll();
          for (const [gpIndex, state] of states) {
            const bits = state.bits;
            const prev = lastBits.get(gpIndex) ?? 0;
            const pressed = bits & ~prev;

            // Any button press dismisses splash
            if (pressed !== 0) {
              dismiss();
              return;
            }

            lastBits.set(gpIndex, bits);
          }
          
          // Continue polling if not dismissed
          if (!dismissed) {
            rafId = requestAnimationFrame(checkGamepads);
          }
        };
        rafId = requestAnimationFrame(checkGamepads);
      }

      splashScreen.addEventListener('click', handleClick);
    }
  }

  showLobby(): void {
    this.stopMenuNav();
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    const urlParams = new URLSearchParams(window.location.search);
    const existingRoom = urlParams.get('room');

    this.overlay.innerHTML = `
      <div style="position:absolute;top:80px;left:50%;transform:translateX(-50%);text-align:center;color:white;font-family:monospace;pointer-events:all;z-index:10;">
        <img src="/branding/everybody-throws-hands-logo.png" alt="Everybody Throws Hands" style="max-width:min(700px,80vw);height:auto;display:block;margin:0 auto 48px auto;">
        ${existingRoom
          ? `<div style="font-size:18px;margin-bottom:24px">Room: <span style="font-size:24px">${existingRoom}</span></div>
             <button id="ready-btn" class="ui-btn">Ready</button>`
          : `<button id="create-btn" class="ui-btn" style="margin-bottom:16px">Create Room</button>
             <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin:0 auto 16px auto;max-width:fit-content">
               <input id="join-code" class="ui-input" placeholder="ROOM CODE" maxlength="6">
               <button id="join-btn" class="ui-btn">Join</button>
             </div>`
        }
        <button id="local-play-btn" class="ui-btn" style="margin-top:8px">Local Play</button>
        <button id="controls-btn" class="ui-btn" style="margin-top:12px">Controls</button>
      </div>
      <div class="menu-hint">↑↓ Navigate • Enter/A Select</div>`;

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

    // Menu navigation
    this.menuNav = new MenuNavigator(this._gamepadPoller);
    const navButtons: MenuButton[] = [];
    if (existingRoom) {
      const readyEl = document.getElementById('ready-btn');
      if (readyEl) {
        navButtons.push({ id: 'ready-btn', element: readyEl, onActivate: () => { this.onReady?.(); this.showWaiting(); } });
      }
    } else {
      const createEl = document.getElementById('create-btn');
      if (createEl) {
        navButtons.push({ id: 'create-btn', element: createEl, onActivate: () => this.onCreateRoom?.() });
      }
      const joinEl = document.getElementById('join-btn');
      if (joinEl) {
        navButtons.push({ id: 'join-btn', element: joinEl, onActivate: () => {
          const code = (document.getElementById('join-code') as HTMLInputElement)?.value?.trim().toUpperCase();
          if (code?.length === 6) this.onJoinRoom?.(code);
        } });
      }
    }
    const localEl = document.getElementById('local-play-btn');
    if (localEl) {
      navButtons.push({ id: 'local-play-btn', element: localEl, onActivate: () => this.onLocalPlay?.() });
    }
    const controlsEl = document.getElementById('controls-btn');
    if (controlsEl) {
      navButtons.push({ id: 'controls-btn', element: controlsEl, onActivate: () => this.onOpenControls?.() });
    }
    this.menuNav.setButtons(navButtons);
    this.menuNav.start();
  }

  showControls(deps: { assignmentManager: ControllerAssignmentManager; preferenceStore: GamepadPreferenceStore }): void {
    this.stopMenuNav();
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
    onSelected: (choices: FighterChoice[]) => void,
    autoConfirmSlots: number[] = [],
    onBack?: () => void,
    gamepadSlotByIndex?: ReadonlyMap<number, number>,
  ): void {
    this.stopMenuNav();
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
    const selectedFighterIndex: number[] = Array(playerCount).fill(0);
    const rafIds: number[] = [];
    const autoConfirmSlotSet = new Set(autoConfirmSlots);

    // Render N panels dynamically
    const panelsHtml = (() => {
      let html = '';
      for (let i = 0; i < playerCount; i++) {
        const isCpuSlot = autoConfirmSlotSet.has(i);
        const panelRole = i === 0 ? 'You' : isCpuSlot ? 'CPU' : 'Human';
        const confirmHint = isCpuSlot
          ? 'CPU auto-confirms'
          : i === 0
            ? 'Enter or Z'
            : i === 1
              ? 'U'
              : CONFIRM_KEYS[i]?.[0] ?? 'Gamepad A';
        html += `
        <div id="p${i + 1}-panel" style="text-align:center">
          <div style="font-size:20px;margin-bottom:16px">P${i + 1} (${panelRole}) Choose</div>
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
      </div>
      ${onBack ? '<button id="charsel-back-btn" class="ui-btn" style="position:absolute;top:24px;left:24px;font-size:14px;padding:8px 16px">← Back</button>' : ''}
      <div class="menu-hint">${onBack ? 'Esc/B Back • ' : ''}Confirm to start</div>`;

    // Back button click
    if (onBack) {
      document.getElementById('charsel-back-btn')?.addEventListener('click', () => {
        cleanup();
        onBack();
      });
    }

    // Click-to-select: attach listeners to fighter options
    for (let i = 0; i < playerCount; i++) {
      const playerElements = document.querySelectorAll(`[data-player="${i + 1}"]`);
      playerElements.forEach(el => {
        (el as HTMLElement).addEventListener('click', () => {
          // Only allow selection if slot not confirmed
          if (confirmed[i]) return;
          
          const fighterId = (el as HTMLElement).getAttribute('data-id');
          const selectedFighter = fighters.find(f => f.id === fighterId);
          
          if (selectedFighter) {
            choices[i] = selectedFighter;
            
            // Update border styling: clicked option gets white, others dim
            playerElements.forEach(option => {
              (option as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
            });
            (el as HTMLElement).style.borderColor = 'white';
          }
        });
      });
    }

    // Auto-select the first fighter for each player (since there's only one fighter today)
    if (fighters[0]) {
      for (let i = 0; i < playerCount; i++) {
        choices[i] = fighters[0];
        // Only highlight fighters[0] with white border
        const fighterElement = document.querySelector(
          `[data-player="${i + 1}"][data-id="${fighters[0].id}"]`
        );
        if (fighterElement) {
          (fighterElement as HTMLElement).style.borderColor = 'white';
        }
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
      // Back navigation via Escape
      if (e.key === 'Escape' && onBack) {
        e.preventDefault();
        cleanup();
        onBack();
        return;
      }
      for (let i = 0; i < playerCount; i++) {
        if (!confirmed[i] && CONFIRM_KEYS[i]?.includes(e.code)) {
          confirmSlot(i);
          break;
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // Gamepad polling for confirm (A) and back (B)
    if (typeof requestAnimationFrame !== 'undefined' && this._gamepadPoller) {
      const poller = this._gamepadPoller;
      let lastBits = new Map<number, number>();
      const checkGamepads = (): void => {
        const states = poller.poll();
        for (const [gpIndex, state] of states) {
          const bits = state.bits;
          const prev = lastBits.get(gpIndex) ?? 0;
          const pressed = bits & ~prev;

          // B button → back
          if ((pressed & 0x0020) && onBack) {
            cleanup();
            onBack();
            return;
          }

          // D-pad up/down → cycle through fighters
          if (pressed & GenericInputBits.UP) {
            const slotIndex = gamepadSlotByIndex?.get(gpIndex) ?? gpIndex;
            if (slotIndex < playerCount && !confirmed[slotIndex]) {
              // Decrement index, wrap to last fighter if at first
              const currentIndex = selectedFighterIndex[slotIndex] ?? 0;
              selectedFighterIndex[slotIndex] = (currentIndex - 1 + fighters.length) % fighters.length;
              const selectedFighter = fighters[selectedFighterIndex[slotIndex]];
              if (selectedFighter) {
                choices[slotIndex] = selectedFighter;
                
                // Update visual styling: selected option gets white, others dim
                const playerElements = document.querySelectorAll(`[data-player="${slotIndex + 1}"]`);
                playerElements.forEach(el => {
                  (el as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
                });
                const selectedElement = document.querySelector(
                  `[data-player="${slotIndex + 1}"][data-id="${selectedFighter.id}"]`
                );
                if (selectedElement) {
                  (selectedElement as HTMLElement).style.borderColor = 'white';
                }
              }
            }
          }

          if (pressed & GenericInputBits.DOWN) {
            const slotIndex = gamepadSlotByIndex?.get(gpIndex) ?? gpIndex;
            if (slotIndex < playerCount && !confirmed[slotIndex]) {
              // Increment index, wrap to first fighter if at last
              const currentIndex = selectedFighterIndex[slotIndex] ?? 0;
              selectedFighterIndex[slotIndex] = (currentIndex + 1) % fighters.length;
              const selectedFighter = fighters[selectedFighterIndex[slotIndex]];
              if (selectedFighter) {
                choices[slotIndex] = selectedFighter;
                
                // Update visual styling: selected option gets white, others dim
                const playerElements = document.querySelectorAll(`[data-player="${slotIndex + 1}"]`);
                playerElements.forEach(el => {
                  (el as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
                });
                const selectedElement = document.querySelector(
                  `[data-player="${slotIndex + 1}"][data-id="${selectedFighter.id}"]`
                );
                if (selectedElement) {
                  (selectedElement as HTMLElement).style.borderColor = 'white';
                }
              }
            }
          }

          // A button → confirm for matching slot
          if (pressed & 0x0010) {
            const slotIndex = gamepadSlotByIndex?.get(gpIndex) ?? gpIndex;
            if (slotIndex < playerCount && !confirmed[slotIndex]) {
              confirmSlot(slotIndex);
            }
          }

          lastBits.set(gpIndex, bits);
        }
        
        // Check if cleanup was called before scheduling next frame
        if (rafIds.length === 0) return;
        
        rafIds.push(requestAnimationFrame(checkGamepads));
      };
      rafIds.push(requestAnimationFrame(checkGamepads));
    }

    // Auto-confirm CPU slots after a brief delay to allow UI to render
    if (autoConfirmSlots.length > 0) {
      setTimeout(() => {
        for (const slotIndex of autoConfirmSlots) {
          if (slotIndex < playerCount && !confirmed[slotIndex]) {
            confirmSlot(slotIndex);
          }
        }
      }, 500);
    }
  }

  showLocalPlaySetup(
    deps: { assignmentManager: ControllerAssignmentManager },
    initial: { participantCount: 2 | 3 | 4; seats: SeatConfig[] } | null,
    onConfirm: (result: { participantCount: 2 | 3 | 4; seats: SeatConfig[] }) => void,
    onBack?: () => void,
  ): void {
    this.stopMenuNav();
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = '';

    renderLocalPlaySetupScreen(this.overlay, deps, initial, onConfirm, onBack, this._gamepadPoller);
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
    this.stopMenuNav();
    this.phase = 'countdown';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="overlay-center" style="font-size:120px;font-weight:bold;letter-spacing:8px">
        ${count > 0 ? count : 'GO!'}
      </div>`;
  }

  showMatch(): void {
    this.stopMenuNav();
    this.phase = 'match';
    this.overlay.innerHTML = '';
    this.hudPanel.style.display = 'flex';
  }

  showPauseOverlay(): void {
    this.stopMenuNav();
    this.phase = 'paused';
    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:48px;letter-spacing:4px;margin-bottom:40px">PAUSED</div>
        <button id="resume-btn" class="ui-btn" style="margin-bottom:16px">Resume</button>
        <button id="main-menu-btn" class="ui-btn">Main Menu</button>
      </div>
      <div class="menu-hint">↑↓ Navigate • Enter/A Select</div>`;

    document.getElementById('resume-btn')?.addEventListener('click', () => this.onResume?.());
    document.getElementById('main-menu-btn')?.addEventListener('click', () => this.onMainMenu?.());

    // Menu navigation for pause screen
    this.menuNav = new MenuNavigator(this._gamepadPoller);
    const navButtons: MenuButton[] = [];
    const resumeEl = document.getElementById('resume-btn');
    if (resumeEl) {
      navButtons.push({ id: 'resume-btn', element: resumeEl, onActivate: () => this.onResume?.() });
    }
    const menuEl = document.getElementById('main-menu-btn');
    if (menuEl) {
      navButtons.push({ id: 'main-menu-btn', element: menuEl, onActivate: () => this.onMainMenu?.() });
    }
    this.menuNav.setButtons(navButtons);
    this.menuNav.start(() => this.onResume?.());
  }

  hidePauseOverlay(): void {
    if (this.phase !== 'paused') return;
    this.stopMenuNav();
    this.phase = 'match';
    this.overlay.innerHTML = '';
    this.hudPanel.style.display = 'flex';
  }

  getPhase(): UIPhase {
    return this.phase;
  }

  showResult(winnerId: PlayerId | null, myPlayerId: PlayerId | null): void {
    this.stopMenuNav();
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
        <button id="main-menu-btn" class="ui-btn" style="margin-top:12px">Main Menu</button>
      </div>
      <div class="menu-hint">↑↓ Navigate • Enter/A Select</div>`;

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      this.onPlayAgain?.();
    });
    document.getElementById('main-menu-btn')?.addEventListener('click', () => {
      this.onMainMenu?.();
    });

    // Menu navigation for result screen
    this.menuNav = new MenuNavigator(this._gamepadPoller);
    const navButtons: MenuButton[] = [];
    const playAgainEl = document.getElementById('play-again-btn');
    if (playAgainEl) {
      navButtons.push({ id: 'play-again-btn', element: playAgainEl, onActivate: () => this.onPlayAgain?.() });
    }
    const menuEl = document.getElementById('main-menu-btn');
    if (menuEl) {
      navButtons.push({ id: 'main-menu-btn', element: menuEl, onActivate: () => this.onMainMenu?.() });
    }
    this.menuNav.setButtons(navButtons);
    this.menuNav.start();
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
    this.stopMenuNav();
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
        <button id="main-menu-btn" class="ui-btn" style="margin-top:12px">Main Menu</button>
      </div>
      <div class="menu-hint">↑↓ Navigate • Enter/A Select</div>`;

    document.getElementById('local-play-again-btn')?.addEventListener('click', () => {
      this.onLocalPlayAgain?.();
    });
    document.getElementById('main-menu-btn')?.addEventListener('click', () => {
      this.onMainMenu?.();
    });

    // Menu navigation for local result screen
    this.menuNav = new MenuNavigator(this._gamepadPoller);
    const navButtons: MenuButton[] = [];
    const playAgainEl = document.getElementById('local-play-again-btn');
    if (playAgainEl) {
      navButtons.push({ id: 'local-play-again-btn', element: playAgainEl, onActivate: () => this.onLocalPlayAgain?.() });
    }
    const menuEl = document.getElementById('main-menu-btn');
    if (menuEl) {
      navButtons.push({ id: 'main-menu-btn', element: menuEl, onActivate: () => this.onMainMenu?.() });
    }
    this.menuNav.setButtons(navButtons);
    this.menuNav.start();
  }
}
