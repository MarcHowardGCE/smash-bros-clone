import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../UIManager';
import type { FighterChoice } from '../../local/types';

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
    it('should render logo image with light card background', () => {
      uiManager.showLobby();
      const img = mockOverlay.querySelector('img[alt="Everybody Throws Hands"]') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('everybody-throws-hands-logo.png');
      const card = img.parentElement as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.style.background).toBe('rgb(255, 255, 255)');
    });

    it('should not contain old SMASH CLONE text', () => {
      uiManager.showLobby();
      expect(mockOverlay.innerHTML).not.toContain('SMASH CLONE');
    });
  });

  describe('showCharacterSelect', () => {
    const fighters: FighterChoice[] = [{ id: 'fighter1', displayName: 'Fighter One' }];

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
  });
});
