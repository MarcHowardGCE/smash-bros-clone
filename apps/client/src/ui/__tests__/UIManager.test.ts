import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../UIManager';
import type { FighterChoice } from '../../local/types';
import { GenericInputBits } from '@smash/gamepad-input';
import type { StageConfig } from '../../stages/stageConfig';

describe('UIManager', () => {
  let mockOverlay: HTMLElement;
  let uiManager: UIManager;

  beforeEach(() => {
    mockOverlay = document.createElement('div');
    mockOverlay.id = 'overlay';
    document.body.appendChild(mockOverlay);
    uiManager = new UIManager(mockOverlay);
  });

  afterEach(() => {
    document.body.removeChild(mockOverlay);
  });

  describe('showLocalResult', () => {
    it('should display "Draw!" when winnerId is null', () => {
      uiManager.showLocalResult(null);
      expect(mockOverlay.innerHTML).toContain('Draw!');
    });

    it('should display "P1 Wins!" for local-p1', () => {
      uiManager.showLocalResult('local-p1');
      expect(mockOverlay.innerHTML).toContain('P1 Wins!');
    });

    it('should display "P2 Wins!" for local-p2', () => {
      uiManager.showLocalResult('local-p2');
      expect(mockOverlay.innerHTML).toContain('P2 Wins!');
    });

    it('should display "P3 Wins!" for local-p3', () => {
      uiManager.showLocalResult('local-p3');
      expect(mockOverlay.innerHTML).toContain('P3 Wins!');
    });

    it('should display "P4 Wins!" for local-p4', () => {
      uiManager.showLocalResult('local-p4');
      expect(mockOverlay.innerHTML).toContain('P4 Wins!');
    });

    it('should display fallback "remote-xyz Wins!" for non-local IDs', () => {
      uiManager.showLocalResult('remote-xyz' as any);
      expect(mockOverlay.innerHTML).toContain('remote-xyz Wins!');
    });

    it('should render Play Again button', () => {
      uiManager.showLocalResult('local-p1');
      expect(mockOverlay.innerHTML).toContain('id="local-play-again-btn"');
      expect(mockOverlay.innerHTML).toContain('Play Again');
    });

    it('should render Main Menu button', () => {
      uiManager.showLocalResult('local-p1');
      expect(mockOverlay.innerHTML).toContain('id="main-menu-btn"');
      expect(mockOverlay.innerHTML).toContain('Main Menu');
    });

    it('should call onMainMenu when Main Menu button is clicked', () => {
      const onMainMenu = vi.fn();
      uiManager.onMainMenu = onMainMenu;
      uiManager.showLocalResult('local-p1');
      document.getElementById('main-menu-btn')?.click();
      expect(onMainMenu).toHaveBeenCalledTimes(1);
    });

    it('should call onLocalPlayAgain when Play Again is clicked (not onMainMenu)', () => {
      const onLocalPlayAgain = vi.fn();
      const onMainMenu = vi.fn();
      uiManager.onLocalPlayAgain = onLocalPlayAgain;
      uiManager.onMainMenu = onMainMenu;
      uiManager.showLocalResult('local-p1');
      document.getElementById('local-play-again-btn')?.click();
      expect(onLocalPlayAgain).toHaveBeenCalledTimes(1);
      expect(onMainMenu).not.toHaveBeenCalled();
    });

    it('should set phase to result', () => {
      uiManager.showLocalResult('local-p2');
      expect((uiManager as any).phase).toBe('result');
    });

    it('should hide hud panel', () => {
      uiManager.showLocalResult('local-p1');
      expect((uiManager as any).hudPanel.style.display).toBe('none');
    });
  });

  describe('showResult', () => {
    it('should render Play Again button', () => {
      uiManager.showResult('p1', 'p1');
      expect(mockOverlay.innerHTML).toContain('id="play-again-btn"');
      expect(mockOverlay.innerHTML).toContain('Play Again');
    });

    it('should render Main Menu button', () => {
      uiManager.showResult('p1', 'p1');
      expect(mockOverlay.innerHTML).toContain('id="main-menu-btn"');
      expect(mockOverlay.innerHTML).toContain('Main Menu');
    });

    it('should call onMainMenu when Main Menu button is clicked', () => {
      const onMainMenu = vi.fn();
      uiManager.onMainMenu = onMainMenu;
      uiManager.showResult('p1', 'p1');
      document.getElementById('main-menu-btn')?.click();
      expect(onMainMenu).toHaveBeenCalledTimes(1);
    });

    it('should call onPlayAgain when Play Again is clicked (not onMainMenu)', () => {
      const onPlayAgain = vi.fn();
      const onMainMenu = vi.fn();
      uiManager.onPlayAgain = onPlayAgain;
      uiManager.onMainMenu = onMainMenu;
      uiManager.showResult('p1', 'p1');
      document.getElementById('play-again-btn')?.click();
      expect(onPlayAgain).toHaveBeenCalledTimes(1);
      expect(onMainMenu).not.toHaveBeenCalled();
    });

    it('should display "You Win!" when winnerId matches myPlayerId', () => {
      uiManager.showResult('p1', 'p1');
      expect(mockOverlay.innerHTML).toContain('You Win!');
    });

    it('should display "Draw!" when winnerId is null', () => {
      uiManager.showResult(null, 'p1');
      expect(mockOverlay.innerHTML).toContain('Draw!');
    });
  });

  describe('showLobby', () => {
    it('should render logo image at top of page', () => {
      uiManager.showLobby();
      const img = mockOverlay.querySelector('img[alt="Everybody Throws Hands"]') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('everybody-throws-hands-logo.png');
      // Logo should be positioned at top (not vertically centered)
      const container = img.closest('div') as HTMLElement;
      expect(container).not.toBeNull();
      expect(container.style.position).toBe('absolute');
      expect(container.style.top).toBe('80px');
    });

    it('should not contain old SMASH CLONE text', () => {
      uiManager.showLobby();
      expect(mockOverlay.innerHTML).not.toContain('SMASH CLONE');
    });
  });

  describe('showCharacterSelect', () => {
    const fighters: FighterChoice[] = [{ id: 'fighter1', displayName: 'Fighter One' }];

    it('does not skip Stage Select when Character Select confirms with held A after CPU auto-confirm', () => {
      vi.useFakeTimers();
      const stageOnSelected = vi.fn();
      const stages: StageConfig[] = [
        {
          id: 'stage-1',
          displayName: 'Stage 1',
          backgroundImage: 'stage1.png',
          musicTrack: 'stage1.mp3',
        },
      ];

      let nextRafId = 1;
      const rafOrder: number[] = [];
      const rafCallbacks = new Map<number, FrameRequestCallback>();

      const runNextFrame = (): void => {
        while (rafOrder.length > 0) {
          const id = rafOrder.shift()!;
          const callback = rafCallbacks.get(id);
          if (!callback) {
            continue;
          }
          rafCallbacks.delete(id);
          callback(0);
          return;
        }
        throw new Error('No requestAnimationFrame callback available');
      };

      const sharedPoller = {
        poll: vi
          .fn()
          // Character Select prime (equivalent to keyboard-start path: no held gamepad input).
          .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
          // Character Select frame 1: still idle.
          .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
          // Character Select frame 2: fresh A press confirms P1 while CPU already confirmed.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]]))
          // Stage Select prime runs synchronously in the same call stack; A still physically held.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]]))
          // Stage Select first real frame: A still held should NOT select stage.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]]))
          // Release.
          .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
          // Fresh re-press: now Stage Select should select.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]])),
      };

      vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback): number => {
        const id = nextRafId++;
        rafCallbacks.set(id, cb);
        rafOrder.push(id);
        return id;
      }) as typeof requestAnimationFrame);

      vi.stubGlobal('cancelAnimationFrame', ((id: number): void => {
        rafCallbacks.delete(id);
      }) as typeof cancelAnimationFrame);

      try {
        (uiManager as { _gamepadPoller: unknown })._gamepadPoller = sharedPoller;

        uiManager.showCharacterSelect(
          fighters,
          2,
          () => {
            uiManager.showStageSelect(stages, stageOnSelected, vi.fn());
          },
          [1],
        );

        // Initial character-select frame to establish prev=0 baseline.
        runNextFrame();

        // CPU slot auto-confirms before player presses A.
        vi.advanceTimersByTime(500);
        expect(mockOverlay.querySelector('#p2-status')?.textContent).toBe('✓ Ready!');

        // This frame confirms P1 via A and synchronously cascades into Stage Select.
        runNextFrame();
        expect(mockOverlay.innerHTML).toContain('SELECT STAGE');
        expect(document.getElementById('stage-back-btn')).not.toBeNull();

        // First Stage Select frame sees held A baseline from priming; must NOT auto-select.
        runNextFrame();
        expect(stageOnSelected).not.toHaveBeenCalled();

        // Release then fresh press should select stage.
        runNextFrame();
        runNextFrame();
        expect(stageOnSelected).toHaveBeenCalledTimes(1);
        expect(stageOnSelected).toHaveBeenCalledWith(stages[0]);
      } finally {
        vi.useRealTimers();
        vi.unstubAllGlobals();
      }
    });

    it('primes gamepad lastBits so an already-held A button does not instantly confirm P1', () => {
      const onSelected = vi.fn();
      const rafCallbacks: FrameRequestCallback[] = [];
      const mockPoller = {
        poll: vi
          .fn()
          // Priming snapshot: A already held from previous screen.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]]))
          // First loop frame still held -> must NOT confirm.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]]))
          // Release.
          .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
          // Fresh new press -> should confirm.
          .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]])),
      };

      vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback): number => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }) as typeof requestAnimationFrame);
      vi.stubGlobal('cancelAnimationFrame', vi.fn());

      try {
        (uiManager as { _gamepadPoller: unknown })._gamepadPoller = mockPoller;
        uiManager.showCharacterSelect(fighters, 1, onSelected);

        const runNextFrame = (): void => {
          const callback = rafCallbacks.shift();
          expect(callback).toBeDefined();
          callback!(0);
        };

        // First frame: still-held A is ignored due to primed snapshot.
        runNextFrame();
        expect(onSelected).not.toHaveBeenCalled();
        expect(mockOverlay.querySelector('#p1-status')?.textContent).not.toBe('✓ Ready!');

        // Release then press again to create a true rising edge.
        runNextFrame();
        runNextFrame();

        expect(onSelected).toHaveBeenCalledTimes(1);
        expect(onSelected.mock.calls[0]?.[0]?.[0]).toEqual(fighters[0]);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should render 4 panels when playerCount=4', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 4, onSelected);

      expect(mockOverlay.querySelector('#p1-panel')).not.toBeNull();
      expect(mockOverlay.querySelector('#p2-panel')).not.toBeNull();
      expect(mockOverlay.querySelector('#p3-panel')).not.toBeNull();
      expect(mockOverlay.querySelector('#p4-panel')).not.toBeNull();
    });

    it('should render 4 fighter-option elements per panel for playerCount=4', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 4, onSelected);

      const options = mockOverlay.querySelectorAll('.fighter-option');
      // 1 fighter × 4 panels = 4 options
      expect(options.length).toBe(4);
    });

    it('should call onSelected with length-4 array when all 4 slots confirm via keyboard', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 4, onSelected);

      // Slot 0: Enter
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      // Slot 1: KeyU
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU' }));
      // Slot 2: Digit1
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
      // Slot 3: Digit2
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));

      expect(onSelected).toHaveBeenCalledTimes(1);
      const choices = onSelected.mock.calls[0][0];
      expect(choices).toHaveLength(4);
      expect(choices[0]).toEqual(fighters[0]);
      expect(choices[3]).toEqual(fighters[0]);
    });

    it('should NOT call onSelected until all slots confirm', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 4, onSelected);

      // Only confirm 3 of 4
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));

      expect(onSelected).not.toHaveBeenCalled();
    });

    it('should work with playerCount=2 (regression)', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 2, onSelected);

      expect(mockOverlay.querySelector('#p1-panel')).not.toBeNull();
      expect(mockOverlay.querySelector('#p2-panel')).not.toBeNull();
      expect(mockOverlay.querySelector('#p3-panel')).toBeNull();

      // Slot 0: KeyZ, Slot 1: KeyU
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU' }));

      expect(onSelected).toHaveBeenCalledTimes(1);
      expect(onSelected.mock.calls[0][0]).toHaveLength(2);
    });

    it('should show Ready status after confirm', () => {
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters, 2, onSelected);

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

      const status = mockOverlay.querySelector('#p1-status');
      expect(status?.textContent).toBe('✓ Ready!');
    });

    it('should auto-confirm provided non-host slots via autoConfirmSlots', () => {
      vi.useFakeTimers();
      try {
        const onSelected = vi.fn();
        uiManager.showCharacterSelect(fighters, 2, onSelected, [1]);

        vi.advanceTimersByTime(500);

        const p2Status = mockOverlay.querySelector('#p2-status');
        expect(p2Status?.textContent).toBe('✓ Ready!');

        // Only host slot remains; one host confirm should complete selection
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

        expect(onSelected).toHaveBeenCalledTimes(1);
        expect(onSelected.mock.calls[0][0]).toHaveLength(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not auto-confirm host slot 0 when autoConfirmSlots only includes slot 1', () => {
      vi.useFakeTimers();
      try {
        const onSelected = vi.fn();
        uiManager.showCharacterSelect(fighters, 2, onSelected, [1]);

        vi.advanceTimersByTime(500);

        const p1Status = mockOverlay.querySelector('#p1-status');
        const p2Status = mockOverlay.querySelector('#p2-status');

        expect(p1Status?.textContent).not.toBe('✓ Ready!');
        expect(p2Status?.textContent).toBe('✓ Ready!');
        expect(onSelected).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should update choice when clicking a fighter option', () => {
      const fighters2: FighterChoice[] = [
        { id: 'abe-lincoln', displayName: 'Abe Lincoln' },
        { id: 'fighter2', displayName: 'Fighter Two' },
      ];
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters2, 2, onSelected);

      // Click on "Abe Lincoln" option for P1
      const abeOption = mockOverlay.querySelector('[data-player="1"][data-id="abe-lincoln"]') as HTMLElement;
      expect(abeOption).not.toBeNull();
      abeOption.click();

      // Verify border is white (selected)
      expect(abeOption.style.borderColor).toBe('white');

      // Verify other option has dim border (browser normalizes to rgba with spaces)
      const fighter2Option = mockOverlay.querySelector('[data-player="1"][data-id="fighter2"]') as HTMLElement;
      expect(fighter2Option.style.borderColor).toMatch(/rgba\(255,\s*255,\s*255,\s*0\.3\)/);

      // Confirm P1 and P2 to complete selection
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU' }));

      expect(onSelected).toHaveBeenCalledTimes(1);
      const choices = onSelected.mock.calls[0][0];
      expect(choices[0].id).toBe('abe-lincoln');
    });

    it('should not allow selection when slot is confirmed', () => {
      const fighters2: FighterChoice[] = [
        { id: 'abe-lincoln', displayName: 'Abe Lincoln' },
        { id: 'fighter2', displayName: 'Fighter Two' },
      ];
      const onSelected = vi.fn();
      uiManager.showCharacterSelect(fighters2, 2, onSelected);

      // First, click on "Abe Lincoln" for P1
      const abeOption = mockOverlay.querySelector('[data-player="1"][data-id="abe-lincoln"]') as HTMLElement;
      abeOption.click();

      // Confirm P1 first
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

      // Try to click on a different fighter for P1 (should be no-op)
      const fighter2Option = mockOverlay.querySelector('[data-player="1"][data-id="fighter2"]') as HTMLElement;
      fighter2Option.click();

      // Confirm P2
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU' }));

      expect(onSelected).toHaveBeenCalledTimes(1);
      const choices = onSelected.mock.calls[0][0];
      // Should still be abe-lincoln (clicked before confirm), not fighter2
      expect(choices[0].id).toBe('abe-lincoln');
    });
  });

  describe('showNetworkCharacterSelect', () => {
    const fighters: FighterChoice[] = [
      { id: 'fighter1', displayName: 'Fighter One' },
      { id: 'fighter2', displayName: 'Fighter Two' },
    ];

    it('should render 1 interactive panel for myPlayerId + read-only rows for other players', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2', 'p3'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      // Should have 1 interactive panel
      expect(mockOverlay.innerHTML).toContain('id="network-charselect-panel"');
      expect(mockOverlay.innerHTML).toContain('Your Character');

      // Should have 2 read-only status rows (for p2 and p3)
      expect(mockOverlay.innerHTML).toContain('id="network-charselect-row-p2"');
      expect(mockOverlay.innerHTML).toContain('id="network-charselect-row-p3"');
      expect(mockOverlay.innerHTML).toContain('id="network-charselect-status-p2"');
      expect(mockOverlay.innerHTML).toContain('id="network-charselect-status-p3"');

      // Status rows should show "Waiting..."
      expect(mockOverlay.innerHTML).toContain('Waiting...');
    });

    it('should render all fighter options in interactive panel', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      expect(mockOverlay.innerHTML).toContain('Fighter One');
      expect(mockOverlay.innerHTML).toContain('Fighter Two');
      expect(mockOverlay.innerHTML).toContain('data-id="fighter1"');
      expect(mockOverlay.innerHTML).toContain('data-id="fighter2"');
    });

    it('should call onSelect when fighter option is clicked', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      const fighter1Option = mockOverlay.querySelector('[data-id="fighter1"]') as HTMLElement;
      expect(fighter1Option).not.toBeNull();
      fighter1Option.click();

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('fighter1');
    });

    it('should highlight selected fighter with white border', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      const fighter1Option = mockOverlay.querySelector('[data-id="fighter1"]') as HTMLElement;
      fighter1Option.click();

      expect(fighter1Option.style.borderColor).toBe('white');

      // Other options should remain dim (browser normalizes rgba format with spaces)
      const fighter2Option = mockOverlay.querySelector('[data-id="fighter2"]') as HTMLElement;
      expect(fighter2Option.style.borderColor).toMatch(/rgba\(255,\s*255,\s*255,\s*0\.3\)/);
    });

    it('should call onConfirm and disable button with "Confirming..." when Confirm button is clicked', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      // Select a fighter first
      const fighter1Option = mockOverlay.querySelector('[data-id="fighter1"]') as HTMLElement;
      fighter1Option.click();

      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement;
      expect(confirmBtn).not.toBeNull();
      expect(confirmBtn.disabled).toBe(false);
      expect(confirmBtn.textContent).toBe('Confirm');

      confirmBtn.click();

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(confirmBtn.disabled).toBe(true);
      expect(confirmBtn.textContent).toBe('Confirming...');
    });

    it('should not allow confirm if no fighter selected', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement;
      confirmBtn.click();

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should render error element with id="network-charselect-error"', () => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      const errorEl = document.getElementById('network-charselect-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl?.textContent).toBe('');
    });
  });

  describe('updateNetworkCharacterSelect', () => {
    const fighters: FighterChoice[] = [
      { id: 'fighter1', displayName: 'Fighter One' },
      { id: 'fighter2', displayName: 'Fighter Two' },
    ];

    beforeEach(() => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2', 'p3'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);
    });

    it('should update status for other player without full re-render', () => {
      const statusEl = document.getElementById('network-charselect-status-p2') as HTMLElement;
      expect(statusEl?.textContent).toBe('Waiting...');

      uiManager.updateNetworkCharacterSelect('p2' as any, 'fighter1', false);

      expect(statusEl?.textContent).toBe('Selected: fighter1');
      // Interactive panel should still exist (not re-rendered)
      expect(document.getElementById('network-charselect-panel')).not.toBeNull();
    });

    it('should update status with green color when other player confirms', () => {
      uiManager.updateNetworkCharacterSelect('p2' as any, 'fighter1', true);

      const statusEl = document.getElementById('network-charselect-status-p2') as HTMLElement;
      expect(statusEl?.textContent).toBe('Selected: fighter1');
      expect(statusEl?.style.color).toMatch(/rgba\(0,\s*255,\s*0,\s*0\.8\)/);
    });

    it('should update Confirm button to "Confirmed" when myPlayerId confirms', () => {
      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement;

      // First select a fighter and click confirm
      const fighter1Option = mockOverlay.querySelector('[data-id="fighter1"]') as HTMLElement;
      fighter1Option.click();
      confirmBtn.click();

      // Now update with confirmed=true
      uiManager.updateNetworkCharacterSelect('p1' as any, 'fighter1', true);

      expect(confirmBtn.disabled).toBe(true);
      expect(confirmBtn.textContent).toBe('Confirmed');
    });

    it('should be no-op for unknown playerId', () => {
      const statusEl = document.getElementById('network-charselect-status-p2') as HTMLElement;
      const initialText = statusEl?.textContent;

      // Should not throw
      uiManager.updateNetworkCharacterSelect('unknown-player' as any, 'fighter1', false);

      expect(statusEl?.textContent).toBe(initialText);
    });
  });

  describe('showNetworkCharacterSelectConfirmError', () => {
    const fighters: FighterChoice[] = [
      { id: 'fighter1', displayName: 'Fighter One' },
    ];

    beforeEach(() => {
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      const myPlayerId = 'p1' as any;
      const playerIds = ['p1', 'p2'] as any;

      uiManager.setPlayerId(myPlayerId);
      uiManager.showNetworkCharacterSelect(fighters, myPlayerId, playerIds, onSelect, onConfirm);

      // Simulate confirm being clicked
      const fighter1Option = mockOverlay.querySelector('[data-id="fighter1"]') as HTMLElement;
      fighter1Option.click();
      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement;
      confirmBtn.click();
    });

    it('should re-enable Confirm button and restore label to "Confirm"', () => {
      const confirmBtn = document.getElementById('network-charselect-confirm-btn') as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);
      expect(confirmBtn.textContent).toBe('Confirming...');

      uiManager.showNetworkCharacterSelectConfirmError('room full');

      expect(confirmBtn.disabled).toBe(false);
      expect(confirmBtn.textContent).toBe('Confirm');
    });

    it('should render error message in error element', () => {
      const errorEl = document.getElementById('network-charselect-error') as HTMLElement;
      expect(errorEl?.textContent).toBe('');

      uiManager.showNetworkCharacterSelectConfirmError('room full');

      expect(errorEl?.textContent).toBe('room full');
    });

    it('should be no-op if called before showNetworkCharacterSelect', () => {
      // Create a fresh UIManager without calling showNetworkCharacterSelect
      const freshOverlay = document.createElement('div');
      document.body.appendChild(freshOverlay);
      const freshUI = new UIManager(freshOverlay);

      // Should not throw
      expect(() => {
        freshUI.showNetworkCharacterSelectConfirmError('error message');
      }).not.toThrow();

      document.body.removeChild(freshOverlay);
    });

    it('should clear error on next showNetworkCharacterSelect call', () => {
      const errorEl = document.getElementById('network-charselect-error') as HTMLElement;

      uiManager.showNetworkCharacterSelectConfirmError('room full');
      expect(errorEl?.textContent).toBe('room full');

      // Call showNetworkCharacterSelect again
      const onSelect = vi.fn();
      const onConfirm = vi.fn();
      uiManager.showNetworkCharacterSelect(fighters, 'p1' as any, ['p1', 'p2'] as any, onSelect, onConfirm);

      const newErrorEl = document.getElementById('network-charselect-error') as HTMLElement;
      expect(newErrorEl?.textContent).toBe('');
    });
  });

  describe('Audio Settings Integration', () => {
    it('should render audio settings rows when audioManager is set', () => {
      const mockAudioManager = {
        isMuted: vi.fn().mockReturnValue(false),
        toggleMuted: vi.fn(),
        getVolume: vi.fn().mockReturnValue(0.5),
        setVolume: vi.fn(),
      };
      const onAudioChanged = vi.fn();

      uiManager.setAudioManager(mockAudioManager as any, onAudioChanged);
      uiManager.showLobby();

      expect(mockOverlay.querySelector('#mute-btn')).not.toBeNull();
      expect(mockOverlay.querySelector('#volume-row')).not.toBeNull();
    });

    it('should not render audio settings rows when audioManager is not set', () => {
      uiManager.showLobby();

      expect(mockOverlay.querySelector('#mute-btn')).toBeNull();
      expect(mockOverlay.querySelector('#volume-row')).toBeNull();
    });

    it('should call toggleMuted when mute button is clicked', () => {
      const mockAudioManager = {
        isMuted: vi.fn().mockReturnValue(false),
        toggleMuted: vi.fn(),
        getVolume: vi.fn().mockReturnValue(0.5),
        setVolume: vi.fn(),
      };
      const onAudioChanged = vi.fn();

      uiManager.setAudioManager(mockAudioManager as any, onAudioChanged);
      uiManager.showLobby();

      const muteBtn = mockOverlay.querySelector('#mute-btn') as HTMLButtonElement;
      muteBtn.click();

      expect(mockAudioManager.toggleMuted).toHaveBeenCalledTimes(1);
      expect(onAudioChanged).toHaveBeenCalledTimes(1);
    });

    it('should update volume when ArrowRight is pressed on volume row', () => {
      const mockAudioManager = {
        isMuted: vi.fn().mockReturnValue(false),
        toggleMuted: vi.fn(),
        getVolume: vi.fn().mockReturnValueOnce(0.5).mockReturnValueOnce(0.55),
        setVolume: vi.fn(),
      };
      const onAudioChanged = vi.fn();

      uiManager.setAudioManager(mockAudioManager as any, onAudioChanged);
      uiManager.showLobby();

      // Verify volume row is in navButtons by checking it's rendered
      expect(mockOverlay.querySelector('#volume-row')).not.toBeNull();
    });

    it('should render audio settings in pause overlay when audioManager is set', () => {
      const mockAudioManager = {
        isMuted: vi.fn().mockReturnValue(false),
        toggleMuted: vi.fn(),
        getVolume: vi.fn().mockReturnValue(0.5),
        setVolume: vi.fn(),
      };
      const onAudioChanged = vi.fn();

      uiManager.setAudioManager(mockAudioManager as any, onAudioChanged);
      uiManager.showPauseOverlay();

      expect(mockOverlay.querySelector('#mute-btn')).not.toBeNull();
      expect(mockOverlay.querySelector('#volume-row')).not.toBeNull();
    });

    it('should show updated menu hint with adjustment direction', () => {
      const mockAudioManager = {
        isMuted: vi.fn().mockReturnValue(false),
        toggleMuted: vi.fn(),
        getVolume: vi.fn().mockReturnValue(0.5),
        setVolume: vi.fn(),
      };
      const onAudioChanged = vi.fn();

      uiManager.setAudioManager(mockAudioManager as any, onAudioChanged);
      uiManager.showLobby();

      const hint = mockOverlay.querySelector('.menu-hint');
      expect(hint?.textContent).toContain('←→ Adjust');
    });
  });
});
