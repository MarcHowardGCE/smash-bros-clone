import { settingsHeader, settingsHint, settingsTabEntries, type SettingsRoute } from './SettingsShell';
import { matchPause, matchResult, type MatchResult } from './MatchMenus';
import{renderPracticeSetup}from'../practice/PracticeSetup.js';
import type{PracticeConfig}from'../practice/curriculum.js';
import type { PracticeLabAction } from '../practice/PracticePanel';
import {renderVisualSettingsScreen} from './VisualSettingsScreen';
import type {StageBackdrop} from '../renderer/StageBackdrop';
import { fighterComparison, fighterTile } from './FighterComparison';
import { renderDojoPause } from './DojoPause';
import { homeMenu, onlineEntry, roomLobby, roomSeats, type LobbySeat } from './EntryMenus';
import { FIGHTER_PRESENTATION, escapeHtml, fighterPortrait } from './selectionContent';
import { STAGES } from '../stages/stageConfig';
import { matchIntro, renderWorldPreview, type MatchIntro } from './WorldPreview';
import { ULTIMATE_MENU, getControllerProfile } from '../input/controllerProfiles';
import { controllerPrompt, refreshControllerPrompts, type PromptAction } from './controllerPrompts';
/**
 * @fileoverview HTML overlay UI manager for all game phases.
 *
 * Owns the full-screen overlay `<div>` and the HUD panel. Each game phase has
 * a dedicated `show*` method that injects HTML and wires event handlers.
 * Phases: connecting → splash → lobby → waiting → countdown → match →
 * paused → result. Local-play adds its own variants (local result, local
 * play setup, stage select, character select).
 *
 * Gamepad navigation is delegated to {@link MenuNavigator}; the active
 * navigator is stopped and replaced on every phase transition.
 */
import type { GamepadPoller, GamepadPreferenceStore } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';
import { VERSION } from '@smash/shared';
import type { PlayerId } from '@smash/shared';
import type { RenderState } from '../network/InterpolationBuffer.js';
import type { ControllerAssignmentManager } from '../input/ControllerAssignmentManager.js';
import type { FighterChoice, SeatConfig } from '../local/types.js';
import type { StageConfig } from '../stages/stageConfig.js';
import { renderControlsScreen } from './ControlsScreen.js';
import { renderLocalPlaySetupScreen } from './LocalPlaySetupScreen.js';
import { renderStageSelectScreen } from './StageSelectScreen.js';
import { MenuNavigator } from './MenuNavigator.js';
import type { MenuButton } from './MenuNavigator.js';
import { createAudioSettingsRows } from './AudioSettingsRow.js';
import type { AudioManager } from '../audio/AudioManager.js';

/** All phases the UI can be in at any given time. */
export type UIPhase = 'connecting' | 'lobby' | 'waiting' | 'countdown' | 'match' | 'result' | 'controls' | 'paused';

/**
 * Manages the HTML overlay and HUD for every UI phase of the game.
 *
 * Each `show*` method tears down the current phase, injects fresh HTML into
 * the overlay element, wires click/keyboard handlers, and (where applicable)
 * starts a {@link MenuNavigator} for gamepad/keyboard navigation.
 */
export class UIManager {
  private dojoPauseTab = 0;
  private practiceSetupHandle:{destroy:()=>void}|null=null;
  onPractice:(()=>void)|null=null;
  onPracticeReset:(()=>void)|null=null;
  onPracticeMenu:(()=>void)|null=null;
  onPracticeLabActions: (() => PracticeLabAction[]) | null = null;
  private visualSettingsHandle:{destroy:()=>void}|null=null;
  private visualSettingsFromPause=false;
  private stageScreenHandle:{destroy:()=>void}|null=null;
  private networkRestoreChoice:((id:string)=>void)|null=null;
  private networkRosterUpdate: ((id: PlayerId, fighter: string, ready: boolean) => void) | null = null;
  private networkSelectionState:{pending:boolean;confirmed:boolean}|null=null;
  private characterScreenCleanup:(()=>void)|null=null;
  private controlsScreenHandle: ReturnType<typeof renderControlsScreen> | null = null;
  private overlay: HTMLElement;
  private hudPanel: HTMLElement;
  private phase: UIPhase = 'connecting';
  private myPlayerId: PlayerId | null = null;
  private roomCode: string | null = null;
  private roomPlayers: readonly LobbySeat[] = [];
  private roomHost?: string;
  private playerCount: number = 0;
  private menuNav: MenuNavigator | null = null;
  _gamepadPoller: GamepadPoller | null = null;
  controllerIdForSlot?: (slot: number) => string | undefined;
  private activeControllerId: string | undefined;

  getControllerPromptProfile(slot?: number) {
    const id = slot === undefined
      ? this.activeControllerId ?? this.controllerIdForSlot?.(0)
      : this.controllerIdForSlot?.(slot);
    return getControllerProfile(id ?? '');
  }

  setActiveController(id?: string): void {
    if (this.activeControllerId === id) return;
    this.activeControllerId = id;
    this.refreshControllerHints();
  }

  refreshControlAssignments(): void { this.controlsScreenHandle?.refresh(); }

  refreshControllerHints(): void {
    refreshControllerPrompts(this.overlay, slot => this.getControllerPromptProfile(slot));
  }

  private prompt = (action: PromptAction, slot?: number): string =>
    controllerPrompt(action, this.getControllerPromptProfile(slot), slot);
  getPromptRenderer(): (action: PromptAction) => string { return this.prompt; }
  private audioManager: AudioManager | null = null;
  private onAudioChanged: (() => void) | null = null;

  onCreateRoom: (() => void) | null = null;
  onJoinRoom: ((code: string) => void) | null = null;
  onReady: (() => void) | null = null;
  onPlayAgain: (() => void) | null = null;
  onLocalPlay: (() => void) | null = null;
  onLocalPlayAgain: (() => void) | null = null;
  onLocalChangeFighters: (() => void) | null = null;
  onOpenVisualSettings:(()=>void)|null=null;
  onOpenControls: (() => void) | null = null;
  onOpenSound: (() => void) | null = null;
  onResume: (() => void) | null = null;
  onMainMenu: (() => void) | null = null;

  /**
   * Create the UIManager and attach the HUD panel to the document body.
   * Immediately shows the connecting phase.
   *
   * @param overlayElement - Full-screen overlay element for phase HTML
   */
  constructor(overlayElement: HTMLElement) {
    this.overlay = overlayElement;
    this.hudPanel = document.createElement('div');
    this.hudPanel.id = 'hud-panel';
    this.hudPanel.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 40px; font-family: monospace; color: white;
      pointer-events: none; z-index: 20; background:#241e2c; padding:12px 22px; border:1px solid #b19465; border-radius:6px; max-width:calc(100vw - 32px);
    `;
    document.body.appendChild(this.hudPanel);
    this.showConnecting();
  }

  /** Set the local player ID for result screen win/loss display. */
  setPlayerId(id: PlayerId): void {
    this.myPlayerId = id;
  }

  /** Store the room code for display in the in-match HUD. */
  setRoomCode(code: string): void {
    this.roomCode = code;
  }

  /** Set the AudioManager for rendering audio controls in menus. */
  setAudioManager(am: AudioManager, onChanged: () => void): void {
    this.audioManager = am;
    this.onAudioChanged = onChanged;
  }

  private stopMenuNav(): void {
    this.practiceSetupHandle?.destroy();this.practiceSetupHandle=null;
    const roomDisplay=document.getElementById('room-code-display');if(roomDisplay)roomDisplay.style.display='none';
    this.visualSettingsHandle?.destroy();this.visualSettingsHandle=null;this.visualSettingsFromPause=false;
    this.characterScreenCleanup?.(); this.characterScreenCleanup=null;
    this.networkSelectionState=null;this.networkRestoreChoice=null;this.networkRosterUpdate=null;
    this.stageScreenHandle?.destroy();this.stageScreenHandle=null;
    this.overlay.classList.add('menu-shell');
    this.overlay.dataset.menuSurface = 'menu';
    this.controlsScreenHandle?.destroy();this.controlsScreenHandle=null;
    if (this.menuNav) {
      this.menuNav.stop();
      this.menuNav = null;
    }
  }

  /** Return an HTML snippet for the version badge (fixed bottom-right). */
  private versionTag(): string {
    return `<div style="position:fixed;bottom:10px;right:10px;font-family:monospace;font-size:12px;color:rgba(255,255,255,0.6);z-index:100;pointer-events:none">v${VERSION}</div>`;
  }

  /** Show the "Connecting to server…" phase. */
  showConnecting(): void {
    this.stopMenuNav();
    this.phase = 'connecting';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="overlay-center">
        <div style="font-size:24px">Connecting to server...</div>
      </div>`;
  }

  /**
   * Show the Zanda Entertainment splash screen.
   * Dismissed on any click or gamepad button press; calls `onContinue` after fade.
   *
   * @param onContinue - Called after the splash fade completes
   */
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

        // Prime with current state so already-held buttons are not treated as fresh presses.
        for (const [gpIndex, state] of poller.poll()) {
          lastBits.set(gpIndex, state.bits);
        }

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


  focusMenuControl(selector: string): void {
    this.overlay.querySelector<HTMLElement>(selector)?.focus();
  }

  /** Route into the room when returning from selection, otherwise show Home. */
  showLobby(): void {
    if (this.roomCode && new URL(window.location.href).searchParams.has('room') && this.roomPlayers.length) {
      this.showRoomLobby();
      return;
    }
    this.roomCode = null;
    this.roomPlayers = [];
    this.stopMenuNav();
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = homeMenu(this.prompt('confirm')) + this.versionTag();

    const actions: Record<string, () => void> = {
      'local-play-btn': () => this.onLocalPlay?.(),
      'online-play-btn': () => this.showOnlineEntry(),
      'practice-btn': () => this.onPractice?.(),
      'controls-btn': () => this.onOpenControls?.(),
      'visual-settings-btn': () => this.onOpenVisualSettings?.(),
    };
    const entries = this.bindMenuActions(actions);
    entries.push(...this.bindMenuActions({ 'home-audio-btn': () => this.onOpenSound?.() }));
    this.startEntryNav(entries);
  }

  showOnlineEntry(code = '', joining = false): void {
    this.stopMenuNav();
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = onlineEntry(code);
    const form = this.overlay.querySelector<HTMLFormElement>('#online-join-form')!;
    const input = form.querySelector<HTMLInputElement>('#join-code')!;
    const status = this.overlay.querySelector<HTMLElement>('#online-entry-status')!;
    const goBack = () => {
      if (input.readOnly) return;
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url);
      this.showLobby();
      this.focusMenuControl('#online-play-btn');
    };
    const create = () => {
      this.setOnlinePending('Creating room…');
      this.onCreateRoom?.();
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (input.readOnly) return;
      const roomCode = input.value.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
        status.textContent = 'Enter a six-character room code.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      this.setOnlinePending('Joining room…');
      this.onJoinRoom?.(roomCode);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') goBack();
    });
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      status.textContent = '';
    });
    this.startEntryNav(this.bindMenuActions({
      'create-btn': create,
      'join-btn': null,
      'online-back-btn': goBack,
    }), goBack);
    if (joining) this.setOnlinePending('Joining room…');
    this.focusMenuControl(joining ? '#join-code' : '#create-btn');
  }

  private setOnlinePending(message: string): void {
    const status = this.overlay.querySelector('#online-entry-status');
    if (!status) return;
    status.textContent = message;
    this.overlay.querySelector<HTMLInputElement>('#join-code')!.readOnly = true;
    for (const button of this.overlay.querySelectorAll<HTMLButtonElement>('.online-entry button')) button.disabled = true;
  }

  showRoomJoinError(message: string): void {
    const status = this.overlay.querySelector('#online-entry-status');
    if (!status) return;
    status.textContent = message;
    const input = this.overlay.querySelector<HTMLInputElement>('#join-code')!;
    input.readOnly = false;
    input.setAttribute('aria-invalid', 'true');
    for (const button of this.overlay.querySelectorAll<HTMLButtonElement>('.online-entry button')) button.disabled = false;
  }

  private bindMenuActions(actions: Record<string, (() => void) | null>): MenuButton[] {
    return Object.entries(actions).map(([id, run]) => {
      const element = this.overlay.querySelector<HTMLButtonElement>('#'+id)!;
      if (run) element.addEventListener('click', run);
      return { id, element, onActivate: () => element.click() };
    });
  }

  private startEntryNav(entries: MenuButton[], back?: () => void): void {
    const nav = new MenuNavigator(this._gamepadPoller);
    this.menuNav = nav;
    this.overlay.querySelector('.menu-workspace')?.addEventListener('focusin', event => {
      nav.selectIndex(entries.findIndex(entry => entry.element === event.target));
    });
    nav.setButtons(entries);
    nav.start(back);
  }

  /**
   * Show the Controls screen (device bindings + rebind UI).
   *
   * @param deps - Assignment manager and gamepad preference store needed by the controls screen
   */
  showVisualSettings(scene:StageBackdrop,fromPause:boolean,onBack:()=>void,route?:SettingsRoute):void {
    this.stopMenuNav();this.phase='controls';this.visualSettingsFromPause=fromPause;this.hudPanel.style.display='none';
    this.visualSettingsHandle=renderVisualSettingsScreen(this.overlay,scene,onBack,this._gamepadPoller,this.prompt,route);
  }

  showControls(deps: { assignmentManager: ControllerAssignmentManager; preferenceStore: GamepadPreferenceStore }, fromPause = false, onBack = () => this.showLobby(), route?: SettingsRoute): void {
    this.stopMenuNav();
    this.phase = 'controls';
    this.visualSettingsFromPause = fromPause;
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = '';
    
    this.controlsScreenHandle=renderControlsScreen(this.overlay, {
      gamepadPoller:this._gamepadPoller,
      ...deps,
      onBack, route,
    });
  }


  showSoundSettings(fromPause: boolean, onBack: () => void, route?: SettingsRoute): void {
    this.stopMenuNav();
    this.phase = 'controls';
    this.visualSettingsFromPause = fromPause;
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = `<section class="menu-workspace settings-workspace sound-settings">
      ${settingsHeader('sound', 'sound-back', route)}
      <div class="settings-body"><section class="settings-detail"><span class="menu-kicker">Audio</span><h2>Sound</h2>
      <p>Adjust the game’s master volume or mute it. Changes are saved on this device.</p><div id="sound-options"></div></section></div>
      ${settingsHint(this.prompt)}</section>`;
    const entries: MenuButton[] = [];
    if (this.audioManager) {
      const rows = createAudioSettingsRows({ audioManager: this.audioManager, onChanged: () => this.onAudioChanged?.() });
      this.overlay.querySelector('#sound-options')!.append(rows.container);
      entries.push(...rows.buttons);
    }
    entries.push(...this.bindMenuActions({ 'sound-back': onBack }), ...settingsTabEntries(this.overlay, route));
    this.startEntryNav(entries, onBack);
  }

  showCharacterSelect(
    fighters: FighterChoice[],
    playerCount: number,
    onSelected: (choices: FighterChoice[]) => void,
    autoConfirmSlots: number[] = [],
    onBack?: () => void,
    gamepadSlotByIndex?: ReadonlyMap<number, number> | (() => ReadonlyMap<number, number>),
    initialChoices: readonly FighterChoice[] = [],
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

    const choices: (FighterChoice | null)[] = Array.from({length:playerCount},(_,i)=>fighters.find(f=>f.id===initialChoices[i]?.id)??null);
    const confirmed: boolean[] = Array(playerCount).fill(false);
    const autoConfirmSlotSet = new Set(autoConfirmSlots);
    // Initialize selectedFighterIndex: -1 for human slots (no selection), 0 for CPU slots
    const selectedFighterIndex: number[] = Array(playerCount).fill(0).map((_, i) => 
      initialChoices[i] ? fighters.findIndex(f=>f.id===initialChoices[i]?.id) : autoConfirmSlotSet.has(i) ? 0 : -1
    );
    const rafIds: number[] = [];
    let disposed=false;
    let cpuTimer:ReturnType<typeof setTimeout>|undefined;

    console.log('[CharSelect] autoConfirmSlots:', autoConfirmSlots, 'autoConfirmSlotSet:', Array.from(autoConfirmSlotSet));
    console.log('[CharSelect] gamepadSlotByIndex:', typeof gamepadSlotByIndex === 'function' ? 'live assignments' : Array.from(gamepadSlotByIndex ?? []));

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
              : CONFIRM_KEYS[i]?.[0] ?? `keyboard`;
        html += `
        <section id="p${i + 1}-panel" class="fighter-player-panel" style="--player-color:${['#7cbab0','#db889a','#e0b567','#a796d4'][i]}">
          <button type="button" class="menu-quiet fighter-seat-title" data-inspect-seat="${i}" aria-pressed="${i===0}">
            ${playerCount > 2 ? `<img data-seat-portrait="${i}" alt="" draggable="false">` : ''}
            <span>P${i+1} · ${panelRole}</span><strong id="p${i+1}-identity"></strong>
          </button>
          <div id="p${i + 1}-status" style="font-size:14px;margin-top:12px;color:rgba(255,255,255,0.5)">
            ${isCpuSlot ? confirmHint : `Press ${confirmHint} or ${this.prompt('confirm',i)} to confirm`}
          </div>
          ${isCpuSlot ? '' : `<button type="button" class="ui-btn fighter-ready" data-ready-slot="${i}">Ready · ${this.prompt('confirm',i)}</button>`}
        </section>`;
      }
      return html;
    })();

    this.overlay.innerHTML = `
      <section class="fighter-picker fighter-picker-faceoff" aria-label="Fighter selection">
        <header class="picker-header"><div><span class="menu-kicker">Local play / ${fighters.length} fighters</span><h1>Choose your fighter</h1></div>
          ${onBack ? '<button id="charsel-back-btn" class="menu-quiet">← Back</button>' : ''}</header>
        <div class="fighter-comparison"></div>
        <div class="fighter-rosters">
          <div class="fighter-roster fighter-roster-shared" aria-label="Shared fighter roster">
            ${fighters.map(f => `<button type="button" class="fighter-option" data-player="1" data-id="${escapeHtml(f.id)}">${fighterTile(f, true)}<span class="fighter-cursors"></span></button>`).join('')}
          </div>
        </div>
        <footer><div class="fighter-seats" style="--players:${playerCount}">${panelsHtml}</div>
          <p class="picker-help">Arrows / D-pad browse · I / ${this.prompt('story',0)} cycles comparison · Select a seat to edit it</p></footer>
      </section>`;

    // Back button click
    if (onBack) {
      document.getElementById('charsel-back-btn')?.addEventListener('click', () => {
        cleanup();
        onBack();
      });
    }

    const comparison = fighterComparison(this.overlay, fighters, true);
    let inspectedSeat = 0;
    const options = [...this.overlay.querySelectorAll<HTMLButtonElement>('.fighter-roster-shared .fighter-option')];
    const refreshRoster = () => {
      for (const option of options) {
        const seats = selectedFighterIndex.flatMap((index, slot) =>
          (fighters[index] ?? fighters[0])?.id === option.dataset.id ? [slot] : []);
        option.dataset.player = String(inspectedSeat + 1);
        option.setAttribute('aria-pressed', String(seats.includes(inspectedSeat)));
        option.querySelector('.fighter-cursors')!.innerHTML = seats.map(slot =>
          `<span data-seat="${slot}" data-locked="${confirmed[slot]}" aria-label="Player ${slot + 1}${confirmed[slot] ? ' ready' : ''}">P${slot + 1}${confirmed[slot] ? ' ✓' : ''}</span>`).join('');
      }
    };
    const showComparison = () => {
      const fighter = fighters[selectedFighterIndex[inspectedSeat]!] ?? fighters[0];
      const opponent = (inspectedSeat + 1) % playerCount;
      const reference = fighters[selectedFighterIndex[opponent]!] ?? fighters[0];
      if (fighter) comparison.show(fighter, reference);
    };
    const inspectSeat = (slot: number) => {
      inspectedSeat = slot;
      this.overlay.querySelectorAll<HTMLElement>('[data-inspect-seat]').forEach(button => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.inspectSeat) === slot));
      });
      refreshRoster();
      showComparison();
    };
    this.overlay.querySelectorAll<HTMLElement>('[data-inspect-seat]').forEach(button => {
      button.addEventListener('click', () => inspectSeat(Number(button.dataset.inspectSeat)));
    });
    const updateIdentity = (slot: number, fighter: FighterChoice) => {
      const name = this.overlay.querySelector('#p'+(slot+1)+'-identity');
      if (name) name.textContent = fighter.displayName;
      const portrait = this.overlay.querySelector<HTMLImageElement>(`[data-seat-portrait="${slot}"]`);
      const source = fighterPortrait(fighter.id);
      if (portrait && source && portrait.getAttribute('src') !== source) portrait.src = source;
      refreshRoster();
      showComparison();
    };
    for (let slot = 0; slot < playerCount; slot++) {
      const fighter = choices[slot] ?? fighters[0];
      if (!fighter) continue;
      if (autoConfirmSlotSet.has(slot)) choices[slot] = fighter;
      updateIdentity(slot, fighter);
    }
    for (const option of options) option.addEventListener('click', () => {
      const slot = inspectedSeat;
      if (confirmed[slot] && !autoConfirmSlotSet.has(slot)) return;
      const index = fighters.findIndex(fighter => fighter.id === option.dataset.id);
      if (index < 0) return;
      if (autoConfirmSlotSet.has(slot)) confirmed[slot] = false;
      selectedFighterIndex[slot] = index;
      choices[slot] = fighters[index]!;
      updateIdentity(slot, fighters[index]!);
      if (autoConfirmSlotSet.has(slot)) confirmSlot(slot);
    });

    const cleanup = () => {
      disposed=true;
      if(cpuTimer!==undefined)clearTimeout(cpuTimer);
      if(this.characterScreenCleanup===cleanup)this.characterScreenCleanup=null;
      window.removeEventListener('keydown', onKey);
      for (const id of rafIds) {
        cancelAnimationFrame(id);
      }
      rafIds.length = 0;
    };

    this.characterScreenCleanup=cleanup;
    const checkAllConfirmed = () => {
      // Only advance if all slots confirmed AND at least one human slot is confirmed
      const humanSlotsConfirmed = confirmed.some((c, i) => c && !autoConfirmSlotSet.has(i));
      if (confirmed.every(c => c) && choices.every(c => c !== null) && humanSlotsConfirmed) {
        cleanup();
        onSelected(choices as FighterChoice[]);
      }
    };

    const confirmSlot = (slotIndex: number) => {
      if (disposed || confirmed[slotIndex]) return;
      confirmed[slotIndex] = true;
      refreshRoster();
      this.overlay.querySelector('#p'+(slotIndex+1)+'-panel')?.setAttribute('data-ready','true');
      const status = document.getElementById(`p${slotIndex + 1}-status`);
      if (status) { status.textContent = '✓ Ready!'; status.style.color = 'white'; }
      const readyButton=this.overlay.querySelector<HTMLButtonElement>(`[data-ready-slot="${slotIndex}"]`);if(readyButton){readyButton.disabled=false;readyButton.innerHTML='Change fighter · '+this.prompt('cancel',slotIndex);}
      checkAllConfirmed();
    };

    const unlockSlot=(slot:number):boolean=>{
      if(disposed||!confirmed[slot]||autoConfirmSlotSet.has(slot))return false;
      confirmed[slot]=false;
      refreshRoster();
      this.overlay.querySelector('#p'+(slot+1)+'-panel')?.setAttribute('data-ready','false');
      const status=this.overlay.querySelector<HTMLElement>('#p'+(slot+1)+'-status');
      if(status){status.textContent='Choosing · confirm when ready';status.style.color='#e6d3b2';}
      const button=this.overlay.querySelector<HTMLButtonElement>('[data-ready-slot="'+slot+'"]');
      if(button){button.disabled=false;button.innerHTML='Ready · '+this.prompt('confirm',slot);}
      return true;
    };
    const applySelectedChoiceForSlot = (slotIndex: number): boolean => {
      const currentIndex = selectedFighterIndex[slotIndex];
      const resolvedIndex =
        currentIndex !== undefined && currentIndex >= 0 && currentIndex < fighters.length
          ? currentIndex
          : 0;
      const selectedFighter = fighters[resolvedIndex];
      if (!selectedFighter) {
        return false;
      }

      selectedFighterIndex[slotIndex] = resolvedIndex;
      choices[slotIndex] = selectedFighter;
      updateIdentity(slotIndex,selectedFighter);

      return true;
    };

    this.overlay.querySelectorAll<HTMLElement>('[data-ready-slot]').forEach(button=>button.addEventListener('click',()=>{const slot=Number(button.dataset.readySlot);if(!unlockSlot(slot)&&applySelectedChoiceForSlot(slot))confirmSlot(slot);}));
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) {
        return;
      }

      if (e.code === 'KeyI') { e.preventDefault(); comparison.cycle(); return; }
      if(e.key==='Enter' && (e.target as HTMLElement)?.closest?.('button'))return;
      // Back navigation via Escape
      if(e.key==='Escape' && unlockSlot(0)){e.preventDefault();return;}
      if (e.key === 'Escape' && onBack) {
        e.preventDefault();
        cleanup();
        onBack();
        return;
      }

      // Keyboard arrow key navigation for human slot 0 only
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const slotIndex = 0; // Keyboard browsing remains assigned to player 1.
        inspectSeat(slotIndex);
        if (!confirmed[slotIndex]) {
          const currentIndex = selectedFighterIndex[slotIndex];
          if (currentIndex === undefined || currentIndex < 0) {
            // Initialize to first fighter if not yet selected
            selectedFighterIndex[slotIndex] = 0;
          } else {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              selectedFighterIndex[slotIndex] = (currentIndex - 1 + fighters.length) % fighters.length;
            } else {
              selectedFighterIndex[slotIndex] = (currentIndex + 1) % fighters.length;
            }
          }
          const selectedFighter = fighters[selectedFighterIndex[slotIndex]];
          if (selectedFighter) {
            updateIdentity(slotIndex,selectedFighter);
          }
        }
        return;
      }

      for (let i = 0; i < playerCount; i++) {
        if (!confirmed[i] && CONFIRM_KEYS[i]?.includes(e.code)) {
          if (applySelectedChoiceForSlot(i)) {
            confirmSlot(i);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // Gamepad polling for confirm (A) and back (B)
    if (typeof requestAnimationFrame !== 'undefined' && this._gamepadPoller) {
      const poller = this._gamepadPoller;
      let lastBits = new Map<number, number>();

      // Prime with current state so already-held buttons are not treated as fresh presses.
      for (const [gpIndex, state] of poller.poll()) {
        lastBits.set(gpIndex, state.bits);
      }

      const checkGamepads = (): void => {
        const states = poller.poll();
        const slots = typeof gamepadSlotByIndex === 'function' ? gamepadSlotByIndex() : gamepadSlotByIndex;
        for (const index of lastBits.keys()) if (!states.has(index)) lastBits.delete(index);
        for (const [gpIndex, state] of states) {
          const slotForPad = slots?.get(gpIndex) ?? (typeof gamepadSlotByIndex === 'function' ? undefined : gpIndex);
          if (slotForPad === undefined || slotForPad < 0 || slotForPad >= playerCount) continue;
          const bits = state.bits;
          const prev = lastBits.get(gpIndex) ?? 0;
          const pressed = bits & ~prev;
          if (pressed & GenericInputBits.X) { inspectSeat(slotForPad); comparison.cycle(); }
          if (pressed & (GenericInputBits.UP | GenericInputBits.DOWN | GenericInputBits.LEFT | GenericInputBits.RIGHT)) {
            inspectSeat(slotForPad);
          }

          // A button → back
          if(pressed & ULTIMATE_MENU.cancel){
            const slot=slotForPad;
            if(unlockSlot(slot)){lastBits.set(gpIndex,bits);continue;}
            if(slot===0&&onBack){cleanup();onBack();return;}
          }

            // D-pad up/down → cycle through fighters (visual highlight only, no auto-select)
            if (pressed & (GenericInputBits.UP | GenericInputBits.LEFT)) {
              const slotIndex = slotForPad;
              console.log('[CharSelect] Gamepad', gpIndex, 'D-pad UP pressed, mapped to slotIndex:', slotIndex);
              if (slotIndex < playerCount && !confirmed[slotIndex]) {
                // Decrement index, wrap to last fighter if at first
                const currentIndex = selectedFighterIndex[slotIndex];
                if (currentIndex === undefined || currentIndex < 0) {
                  // Initialize to first fighter if not yet selected
                  selectedFighterIndex[slotIndex] = 0;
                } else {
                  selectedFighterIndex[slotIndex] = (currentIndex - 1 + fighters.length) % fighters.length;
                }
                const selectedFighter = fighters[selectedFighterIndex[slotIndex]];
                if (selectedFighter) {
                  updateIdentity(slotIndex,selectedFighter);
                }
              }
            }

            if (pressed & (GenericInputBits.DOWN | GenericInputBits.RIGHT)) {
              const slotIndex = slotForPad;
              console.log('[CharSelect] Gamepad', gpIndex, 'D-pad DOWN pressed, mapped to slotIndex:', slotIndex);
              if (slotIndex < playerCount && !confirmed[slotIndex]) {
                // Increment index, wrap to first fighter if at last
                const currentIndex = selectedFighterIndex[slotIndex];
                if (currentIndex === undefined || currentIndex < 0) {
                  // Initialize to first fighter if not yet selected
                  selectedFighterIndex[slotIndex] = 0;
                } else {
                  selectedFighterIndex[slotIndex] = (currentIndex + 1) % fighters.length;
                }
                const selectedFighter = fighters[selectedFighterIndex[slotIndex]];
                if (selectedFighter) {
                  updateIdentity(slotIndex,selectedFighter);
                }
              }
            }

           // B button → set choice and confirm for matching slot
            if (pressed & ULTIMATE_MENU.confirm) {
              const slotIndex = slotForPad;
              console.log('[CharSelect] Gamepad', gpIndex, 'A button pressed, mapped to slotIndex:', slotIndex);
              if (slotIndex < playerCount && !confirmed[slotIndex]) {
                if (applySelectedChoiceForSlot(slotIndex)) {
                  confirmSlot(slotIndex);
                }
              }
            }

          lastBits.set(gpIndex, bits);
        }
        
        // Check if cleanup was called before scheduling next frame
        if (rafIds.length === 0) return;
        
        rafIds[0]=requestAnimationFrame(checkGamepads);
      };
      rafIds.push(requestAnimationFrame(checkGamepads));
    }

    // Auto-confirm CPU slots after a brief delay to allow UI to render
    if (autoConfirmSlots.length > 0) {
      cpuTimer=setTimeout(() => {
        if(disposed)return;
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

    renderLocalPlaySetupScreen(this.overlay, deps, initial, onConfirm, onBack, this._gamepadPoller, this.prompt);
  }

  showStageSelect(
    stages: StageConfig[],
    onSelected: (stage: StageConfig) => void,
    onBack?: () => void,
    onPreview?: (stage:StageConfig)=>void,
    initialStageId?:string,
  ): void {
    this.stopMenuNav();
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = '';

    this.stageScreenHandle=renderStageSelectScreen(this.overlay, stages, onSelected, onBack, this._gamepadPoller,onPreview,initialStageId,this.prompt);
  }


  /** Enter the room after the server assigns an invite code. */
  showRoomCreated(code: string): void {
    this.roomCode = code;
    this.playerCount = 1;
    const playerId = this.myPlayerId;
    this.roomPlayers = playerId ? [{ playerId, slotIndex: 0 }] : [];
    this.roomHost = playerId ?? undefined;
    this.showRoomLobby();
  }

  updateRoomLobby(players: readonly LobbySeat[], hostId?: string): void {
    this.roomPlayers = players;
    this.roomHost = hostId;
    if (!this.roomCode) return;
    if (!this.overlay.querySelector('.online-room')) this.showRoomLobby();
    else this.refreshRoomLobby();
  }

  private showRoomLobby(): void {
    if (!this.roomCode) return;
    this.stopMenuNav();
    this.phase = 'lobby';
    this.hudPanel.style.display = 'none';
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomCode);
    window.history.replaceState({}, '', url);
    this.overlay.innerHTML = roomLobby(this.roomCode);
    const copyStatus = this.overlay.querySelector('#copy-room-status')!;
    this.startEntryNav(this.bindMenuActions({
      'ready-btn': () => {
        if (this.phase === 'waiting') return;
        this.showWaiting();
        this.onReady?.();
      },
      'copy-btn': async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          copyStatus.textContent = 'Invite link copied.';
        } catch {
          copyStatus.textContent = 'Could not copy the link. Share the room code above.';
        }
      },
      'leave-room-btn': () => {
        this.onMainMenu?.();
        this.focusMenuControl('#online-play-btn');
      },
    }));
    this.refreshRoomLobby();
    this.focusMenuControl('#copy-btn');
  }

  private refreshRoomLobby(): void {
    const list = this.overlay.querySelector('#player-list');
    if (!list) return;
    list.innerHTML = roomSeats(this.roomPlayers, this.myPlayerId, this.roomHost);
    this.overlay.querySelector('#room-seat-count')!.textContent = this.roomPlayers.length + ' / 4';
    const ready = this.roomPlayers.find(player => player.playerId === this.myPlayerId)?.ready ?? false;
    const button = this.overlay.querySelector<HTMLButtonElement>('#ready-btn')!;
    button.setAttribute('aria-disabled', String(ready));
    button.textContent = ready ? 'Ready ✓' : 'Ready';
    this.phase = ready ? 'waiting' : 'lobby';
    this.overlay.querySelector('#room-ready-status')!.textContent = ready
      ? 'Waiting for other players.'
      : 'Mark yourself ready when you’re set.';
  }

  /** Update the legacy player count used by the match HUD. */
  showPlayerJoined(slotIndex: number): void {
    this.playerCount = Math.max(this.playerCount, slotIndex + 1);
  }

  showWaiting(): void {
    this.phase = 'waiting';
    const button = this.overlay.querySelector<HTMLButtonElement>('#ready-btn');
    if (button) {
      const status = this.overlay.querySelector("#room-ready-status");
      if (status) status.textContent = 'Setting ready…';
      button.textContent = 'Setting ready…';
      button.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Show the countdown overlay (3, 2, 1, GO!).
   *
   * @param count - Countdown value; 0 renders "GO!"
   */

  showCountdown(count: number | null, intro?: MatchIntro): void {
    let panel = this.overlay.querySelector<HTMLElement>('.match-intro');
    if (this.phase !== 'countdown' || !panel || !intro) {
      this.stopMenuNav();
      this.phase = 'countdown';
      this.overlay.dataset.menuSurface = 'game';
      this.hudPanel.style.display = 'none';
      this.overlay.innerHTML = intro ? matchIntro(intro) : '<div class="overlay-center match-countdown-fallback" role="status"></div>';
      panel = this.overlay.querySelector('.match-intro');
    }
    const countNode = panel?.querySelector('.match-intro-count') ?? this.overlay.querySelector('.match-countdown-fallback');
    if (countNode) {
      countNode.textContent = count === null ? 'Loading arena…' : count === 0 ? 'GO!' : String(count);
      countNode.classList.toggle('match-intro-loading', count === null);
    }
  }
  showPracticeSetup(onStart:(config:PracticeConfig)=>void,onBack:()=>void):void {
    this.stopMenuNav();this.phase='controls';this.hudPanel.style.display='none';
    this.practiceSetupHandle=renderPracticeSetup(this.overlay,this._gamepadPoller,onStart,onBack,this.prompt,()=>this.getControllerPromptProfile(0));
  }
  hideCombatHUD():void{this.hudPanel.style.display='none';}
  setScreenKOOverHUD(active: boolean): void {
    this.hudPanel.toggleAttribute('data-screen-ko-overlap', active);
  }
  /** Clear the overlay and show the in-match HUD panel. */
  showMatch(showFightCue = false): void {
    this.stopMenuNav();
    this.phase = 'match';
    this.overlay.dataset.menuSurface = 'game';
    this.overlay.innerHTML = showFightCue ? '<div class="match-fight-cue" role="status">GO!</div>' : '';
    if (showFightCue) {
      const cue = this.overlay.querySelector('.match-fight-cue');
      setTimeout(() => cue?.remove(), 450);
    }
    this.hudPanel.style.display = 'flex';
  }

  /** Show the pause overlay with Resume and Main Menu buttons. */
  showPauseOverlay(online = false): void {
    this.stopMenuNav();
    this.phase = 'paused';
    this.overlay.dataset.menuSurface = 'pause';
    if (this.onPracticeMenu) {
      this.menuNav = new MenuNavigator(this._gamepadPoller);
      renderDojoPause(this.overlay, this.menuNav, {
        tab: this.dojoPauseTab,
        selectTab: tab => { this.dojoPauseTab = tab; },
        actions: () => this.onPracticeLabActions?.() ?? [],
        reset: () => this.onPracticeReset?.(),
        lessons: () => this.onPracticeMenu?.(),
        visuals: () => this.onOpenVisualSettings?.(),
        resume: () => this.onResume?.(),
        leave: () => this.onMainMenu?.(),
        pausePrompt: this.prompt('pause'),
        confirmPrompt: this.prompt('confirm'),
        settings: () => this.audioManager ? createAudioSettingsRows({
          audioManager: this.audioManager,
          onChanged: () => this.onAudioChanged?.(),
        }) : undefined,
      });
      return;
    }

    this.renderMatchPause(online);
  }

  private renderMatchPause(online: boolean, confirming = false): void {
    this.stopMenuNav();
    this.overlay.dataset.menuSurface = 'pause';
    this.overlay.innerHTML = matchPause(online, confirming, this.prompt('pause'), this.prompt('confirm')) +
      this.versionTag();
    if (confirming) {
      const stay = () => {
        this.renderMatchPause(online);
        this.focusMenuControl('#main-menu-btn');
      };
      this.startEntryNav(this.bindMenuActions({
        'pause-stay-btn': stay,
        'confirm-leave-match-btn': () => this.onMainMenu?.(),
      }), stay);
      this.focusMenuControl('#pause-stay-btn');
      return;
    }

    const entries = this.bindMenuActions({
      'resume-btn': () => this.onResume?.(),
      'visual-settings-btn': () => this.onOpenVisualSettings?.(),
    });
    if (this.audioManager) {
      const audio = createAudioSettingsRows({
        audioManager: this.audioManager,
        onChanged: () => this.onAudioChanged?.(),
      });
      this.overlay.querySelector('#audio-settings-container')!.append(audio.container);
      entries.push(...audio.buttons);
    }
    entries.push(...this.bindMenuActions({ 'main-menu-btn': () => this.renderMatchPause(online, true) }));
    this.startEntryNav(entries, () => this.onResume?.());
    this.focusMenuControl('#resume-btn');
  }

  cancelPauseExit(): boolean {
    const stay = this.overlay.querySelector<HTMLButtonElement>('#pause-stay-btn');
    if (!stay) return false;
    stay.click();
    return true;
  }
  /** Hide the pause overlay and restore the match HUD. No-op if not paused. */
  hidePauseOverlay(): void {
    if (this.phase !== 'paused' && !this.visualSettingsFromPause) return;
    this.visualSettingsFromPause=false;
    this.stopMenuNav();
    this.phase = 'match';
    this.overlay.dataset.menuSurface='game';
    this.overlay.innerHTML = '';
    this.hudPanel.style.display = 'flex';
  }

  /** Return the current UI phase. */
  getPhase(): UIPhase {
    return this.phase;
  }

  /**
   * Show the networked match result screen.
   *
   * @param winnerId - Player ID of the winner, or null for a draw
   * @param myPlayerId - Local player's ID for win/loss display
   */

  showResult(winnerId: PlayerId | null, myPlayerId: PlayerId | null, result?: MatchResult): void {
    const winner = result?.fighters.find(fighter => fighter.playerId === winnerId);
    const message = !winnerId ? 'Draw!' : winnerId === myPlayerId ? 'You Win!' :
      winner ? `P${winner.slotIndex + 1} Wins!` : 'Player Wins!';
    this.renderResult(message, winnerId, true, result);
  }

  private renderResult(message: string, winnerId: PlayerId | null, online: boolean, result?: MatchResult): void {
    this.stopMenuNav();
    this.phase = 'result';
    this.hudPanel.style.display = 'none';
    this.overlay.innerHTML = matchResult(message, winnerId, online, result, !online && Boolean(this.onLocalChangeFighters)) +
      `<div class="menu-hint">↑↓ Navigate · Enter / ${this.prompt('confirm')} Select</div>` + this.versionTag();

    const entries = this.bindMenuActions(online
      ? { 'play-again-btn': () => this.onPlayAgain?.() }
      : { 'local-play-again-btn': () => this.onLocalPlayAgain?.() });
    if (!online && this.onLocalChangeFighters) {
      entries.push(...this.bindMenuActions({ 'result-change-fighters-btn': this.onLocalChangeFighters }));
    }
    entries.push(...this.bindMenuActions({ 'main-menu-btn': () => this.onMainMenu?.() }));
    this.startEntryNav(entries);
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

  /**
   * Update the in-match HUD with current damage percentages and stock counts.
   * No-op if the current phase is not `'match'`.
   *
   * @param state - Latest render state containing all player data
   * @param myPlayerId - Local player's ID for the highlight star indicator
   */
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
        color:#f1e3bf;background:#241e2c;padding:6px 10px;border:1px solid #b19465;border-radius:4px;z-index:20;pointer-events:none;
      `;
      document.body.appendChild(roomDisplay);
    }
    if (this.roomCode) {
      roomDisplay.textContent = `Room: ${this.roomCode}`;
      roomDisplay.style.display = 'block';
    }else{roomDisplay.style.display='none';roomDisplay.textContent='';}
  }

  /** Hide the room code display element. */
  hideRoomCode(): void {
    const el = document.getElementById('room-code-display');
    if (el) el.style.display = 'none';
  }

  /**
   * Show the local-play result screen.
   *
   * @param winnerId - Player ID of the winner (`'local-p1'`, etc.), or null for a draw
   */

  showLocalResult(winnerId: PlayerId | null, result?: MatchResult): void {
    const winner = result?.fighters.find(fighter => fighter.playerId === winnerId);
    const seat = winner ? String(winner.slotIndex + 1) : winnerId?.match(/^local-p(\d+)$/)?.[1];
    const message = !winnerId ? 'Draw!' : `${seat ? 'P'+seat : winnerId} Wins!`;
    this.renderResult(message, winnerId, false, result);
  }
  showNetworkCharacterSelect(
    fighters: FighterChoice[],
    myPlayerId: PlayerId,
    playerIds: PlayerId[],
    onSelect: (characterId: string) => void,
    onConfirm: () => void,
    onUnconfirm?:()=>void,
    onBack?:()=>void,
  ): void {
    this.stopMenuNav();
    this.hudPanel.style.display = 'none';

    // Track selected character for local player
    let selectedCharacterId: string | null = null;
    const selectionState={pending:false,confirmed:false};
    this.networkSelectionState=selectionState;

    // One interactive roster and read-only status cards for other players.
    const myPlayerIndex = playerIds.indexOf(myPlayerId);
    const otherPlayerIds = playerIds.filter(id => id !== myPlayerId);

    const statusRowsHtml = otherPlayerIds.map((playerId, index) => `
      <div id="network-charselect-row-${escapeHtml(playerId)}" class="network-seat-status">
        <strong>Player ${index >= myPlayerIndex ? index + 2 : index + 1}</strong>
        <span id="network-charselect-status-${escapeHtml(playerId)}">Choosing…</span>
      </div>
    `).join('');
    this.overlay.innerHTML = `
      <section class="fighter-picker fighter-picker-faceoff fighter-picker-online" aria-label="Online fighter selection">
        <header class="picker-header"><div><span class="menu-kicker">Online / ${fighters.length} fighters</span><h1>Choose your fighter</h1></div></header>
        <div class="fighter-comparison"></div>
        <div id="network-charselect-panel" class="fighter-roster fighter-roster-shared">
          ${fighters.map(f => `<button type="button" id="network-fighter-${escapeHtml(f.id)}" class="network-fighter-option" data-id="${escapeHtml(f.id)}">${fighterTile(f, true)}<span class="fighter-cursors"></span></button>`).join('')}
        </div>
        <footer class="network-picker-footer"><div class="network-seats">${statusRowsHtml}</div>
          <div id="network-charselect-error" role="status"></div>
          <button id="network-charselect-confirm-btn" class="ui-btn picker-primary">Confirm</button>
          <p class="picker-help">Arrows / D-pad browse · Enter / ${this.prompt('confirm')} select · Esc / ${this.prompt('cancel')} back</p>
        </footer>
      </section>`;
    const comparison = fighterComparison(this.overlay, fighters, true);
    const opponentId = otherPlayerIds[0];
    const choices = new Map<PlayerId, { fighter: string; ready: boolean }>();
    const options = [...this.overlay.querySelectorAll<HTMLButtonElement>('.network-fighter-option')];
    let previewId = fighters[0]?.id;
    const renderChoices = () => {
      const fighter = fighters.find(f => f.id === previewId);
      const rival = fighters.find(f => f.id === (opponentId && choices.get(opponentId)?.fighter));
      if (fighter) comparison.show(fighter, rival);
      for (const option of options) {
        option.setAttribute('aria-pressed', String(option.dataset.id === selectedCharacterId));
        option.querySelector('.fighter-cursors')!.innerHTML = playerIds.map((id, slot) => {
          const choice = choices.get(id);
          if (!choice || choice.fighter !== option.dataset.id) return '';
          return `<span data-seat="${slot}" data-locked="${choice.ready}" aria-label="Player ${slot+1}${choice.ready ? ' ready' : ''}">P${slot+1}${choice.ready ? ' ✓' : ''}</span>`;
        }).join('');
      }
    };
    const preview = (id?: string) => {
      if (selectionState.confirmed || selectionState.pending || !id) return;
      previewId = id;
      renderChoices();
    };
    this.networkRestoreChoice = id => { selectedCharacterId = id; previewId = id; };
    this.networkRosterUpdate = (id, fighter, ready) => {
      choices.set(id, { fighter, ready });
      renderChoices();
    };
    for (const option of options) option.addEventListener('click', () => {
      if (selectionState.pending || selectionState.confirmed) return;
      const fighterId = option.dataset.id;
      if (!fighterId) return;
      selectedCharacterId = fighterId;
      choices.set(myPlayerId, { fighter: fighterId, ready: false });
      preview(fighterId);
      onSelect(fighterId);
    });

    // Attach confirm button listener
    const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if(selectionState.confirmed){onUnconfirm?.();return;}
        if (selectionState.pending || !selectedCharacterId) return;

        selectionState.pending = true;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirming...';

        onConfirm();
      });
    }
    this.menuNav=new MenuNavigator(this._gamepadPoller);
    const entries: MenuButton[] = Array.from(this.overlay.querySelectorAll<HTMLElement>('.network-fighter-option')).map((element,index) => ({
      id: 'network-choice-'+index, element, onActivate: () => element.click(), onHighlight: () => preview(element.dataset.id),
    }));
    if(confirmBtn)entries.push({id:'network-ready',element:confirmBtn,onActivate:()=>confirmBtn.click()});
    entries.push({id:'fighter-compare-next',element:comparison.next,onActivate:()=>comparison.cycle(),onAdjust:comparison.cycle});
    this.overlay.querySelector('.fighter-picker')?.addEventListener('focusin', event => {
      this.menuNav?.selectIndex(entries.findIndex(entry => entry.element === event.target));
    });
    this.menuNav.setButtons(entries);
    this.menuNav.start(() => {
      if (selectionState.pending) return;
      if (selectionState.confirmed) onUnconfirm?.();
      else onBack?.();
    });
  }


  showNetworkStageWaiting(stage: StageConfig, onChangeFighter: () => void, preparationStatus?: string): void {
    const stageIndex = STAGES.findIndex(world => world.id === stage.id);
    const stages = stageIndex < 0 ? [stage] : STAGES.map(world=>world.id===stage.id?stage:world);
    let panel = this.overlay.querySelector<HTMLElement>('#guest-world-preview');
    if (!panel) {
      this.stopMenuNav();
      this.hudPanel.style.display = 'none';
      this.overlay.innerHTML = `
        <section class="menu-workspace world-selection world-guest world-selection-arena" aria-labelledby="guest-world-title">
          <header class="picker-header"><div><span class="menu-kicker" id="guest-world-kicker"></span><h1 id="guest-world-title">Host is choosing</h1></div>
            <span class="world-live-label" id="guest-world-live"></span></header>
          <section id="guest-world-preview" class="world-preview-panel" aria-label="Host’s highlighted world"></section>
          <p id="network-charselect-error" role="alert"></p>
          <footer class="workspace-footer"><p class="picker-help" id="guest-world-status" role="status"></p>
            <button type="button" class="menu-quiet" id="online-change-fighter">Change fighter · ${this.prompt('cancel')}</button></footer>
        </section>`;
      panel = this.overlay.querySelector('#guest-world-preview')!;
      this.menuNav = new MenuNavigator(this._gamepadPoller);
      this.menuNav.start(onChangeFighter);
      const change = this.overlay.querySelector<HTMLButtonElement>('#online-change-fighter')!;
      change.addEventListener('click', onChangeFighter);
      change.addEventListener('focus', () => this.menuNav?.selectIndex(0));
      this.menuNav.setButtons([{ id: change.id, element: change, onActivate: () => change.click() }]);
    }
    this.overlay.querySelector('#guest-world-kicker')!.textContent = preparationStatus ? 'Online / Match setup' : 'Online / Guest preview';
    this.overlay.querySelector('#guest-world-live')!.textContent = preparationStatus ? '● Checking artwork' : '● Live preview';
    this.overlay.querySelector('#guest-world-title')!.textContent = preparationStatus ? 'Preparing match' : 'Host is choosing';
    this.overlay.querySelector('#guest-world-status')!.textContent = preparationStatus ?? 'The host chooses the arena for everyone.';
    renderWorldPreview(panel, stages, Math.max(0, stageIndex));
  }
  updateNetworkCharacterSelect(playerId: PlayerId, characterId: string, confirmed: boolean): void {
    // Restore the authoritative choice without sending another selection request.
    if (playerId === this.myPlayerId) {
      this.networkRestoreChoice?.(characterId);
      if(!confirmed&&this.networkSelectionState?.confirmed){this.networkSelectionState.confirmed=false;this.networkSelectionState.pending=false;const button=this.overlay.querySelector<HTMLButtonElement>('#network-charselect-confirm-btn');if(button){button.disabled=false;button.textContent='Confirm';}}
      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement | null;
      if (confirmBtn) {
        if (confirmed) {
          if(this.networkSelectionState){this.networkSelectionState.pending=false;this.networkSelectionState.confirmed=true;}
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = 'Change fighter · '+this.prompt('cancel');
        }
        // If not confirmed, button state is already managed by showNetworkCharacterSelect
      }
      this.networkRosterUpdate?.(playerId, characterId, confirmed);
      return;
    }

    this.networkRosterUpdate?.(playerId, characterId, confirmed);
    // Update for other players: update their status row
    const statusEl = document.getElementById(`network-charselect-status-${playerId}`);
    if (statusEl) {
      if (confirmed) {
        statusEl.textContent = (confirmed ? 'Ready · ' : 'Selected · ') + (FIGHTER_PRESENTATION[characterId]?.name ?? characterId);
        statusEl.style.color = 'rgba(0,255,0,0.8)';
      } else {
        statusEl.textContent = (confirmed ? 'Ready · ' : 'Selected · ') + (FIGHTER_PRESENTATION[characterId]?.name ?? characterId);
        statusEl.style.color = 'rgba(255,255,255,0.7)';
      }
    }
  }

  showNetworkCharacterSelectConfirmError(message: string): void {
    if(this.networkSelectionState?.confirmed){const el=this.overlay.querySelector('#network-charselect-error');if(el)el.textContent=message;return;}
    if(this.networkSelectionState)this.networkSelectionState.pending=false;
    // Re-enable the Confirm button
    const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    }

    // Render error message
    const errorEl = document.getElementById('network-charselect-error');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
}

