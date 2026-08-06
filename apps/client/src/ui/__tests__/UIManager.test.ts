import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../UIManager';

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

    it('should set phase to result', () => {
      uiManager.showLocalResult('local-p2');
      expect(uiManager.phase).toBe('result');
    });

    it('should hide hud panel', () => {
      uiManager.showLocalResult('local-p1');
      expect(uiManager.hudPanel.style.display).toBe('none');
    });
  });
});
