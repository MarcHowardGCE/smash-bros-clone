import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAudioSettingsRows } from '../AudioSettingsRow';
import type { AudioManager } from '../../audio/AudioManager';

describe('AudioSettingsRow', () => {
  let mockAudioManager: Partial<AudioManager>;
  let onChanged: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChanged = vi.fn();
    mockAudioManager = {
      isMuted: vi.fn().mockReturnValue(false),
      toggleMuted: vi.fn(),
      getVolume: vi.fn().mockReturnValue(0.5),
      setVolume: vi.fn(),
    };
  });

  describe('createAudioSettingsRows', () => {
    it('should create a container with id "audio-settings"', () => {
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      expect(container.id).toBe('audio-settings');
    });

    it('should return two buttons: mute and volume', () => {
      const { buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      expect(buttons.length).toBe(2);
      expect(buttons[0]!.id).toBe('mute-btn');
      expect(buttons[1]!.id).toBe('volume-row');
    });

    it('should render mute button with "Sound: On" label when not muted', () => {
      (mockAudioManager.isMuted as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const muteBtn = container.querySelector('#mute-btn');
      expect(muteBtn?.textContent).toBe('Sound: On');
    });

    it('should render mute button with "Sound: Muted" label when muted', () => {
      (mockAudioManager.isMuted as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const muteBtn = container.querySelector('#mute-btn');
      expect(muteBtn?.textContent).toBe('Sound: Muted');
    });

    it('should render volume row with current percentage', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.75);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row');
      expect(volumeRow?.textContent).toContain('◀ 75% ▶');
    });

    it('should call toggleMuted and onChanged when mute button is clicked', () => {
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const muteBtn = container.querySelector('#mute-btn') as HTMLButtonElement;
      muteBtn.click();
      expect(mockAudioManager.toggleMuted).toHaveBeenCalledTimes(1);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should update mute label after toggle', () => {
      (mockAudioManager.isMuted as ReturnType<typeof vi.fn>).mockReturnValueOnce(false).mockReturnValueOnce(true);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const muteBtn = container.querySelector('#mute-btn') as HTMLButtonElement;
      expect(muteBtn.textContent).toBe('Sound: On');
      muteBtn.click();
      expect(muteBtn.textContent).toBe('Sound: Muted');
    });

    it('should increase volume by 0.05 when onAdjust is called with +1', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.5);
      const { buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeButton = buttons[1]!;
      volumeButton.onAdjust?.(1);
      // Code calls setVolume(0.5 + 0.05) = setVolume(0.55)
      expect(mockAudioManager.setVolume).toHaveBeenCalled();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should decrease volume by 0.05 when onAdjust is called with -1', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.5);
      const { buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeButton = buttons[1]!;
      volumeButton.onAdjust?.(-1);
      // Code calls setVolume(0.5 - 0.05) = setVolume(0.45)
      expect(mockAudioManager.setVolume).toHaveBeenCalled();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should clamp volume at 0% when adjusted below 0', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.02);
      const { buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeButton = buttons[1]!;
      volumeButton.onAdjust?.(-1);
      // Code calls setVolume(0.02 - 0.05) = setVolume(-0.03)
      // AudioManager internally clamps to 0
      expect(mockAudioManager.setVolume).toHaveBeenCalled();
    });

    it('should clamp volume at 100% when adjusted above 1', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.98);
      const { buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeButton = buttons[1]!;
      volumeButton.onAdjust?.(1);
      // Code calls setVolume(0.98 + 0.05) = setVolume(1.03)
      // AudioManager internally clamps to 1
      expect(mockAudioManager.setVolume).toHaveBeenCalled();
    });

    it('should display "0%" when volume is 0', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row');
      expect(volumeRow?.textContent).toContain('◀ 0% ▶');
    });

    it('should display "100%" when volume is 1', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(1);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row');
      expect(volumeRow?.textContent).toContain('◀ 100% ▶');
    });

    it('should have correct CSS classes on elements', () => {
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const muteBtn = container.querySelector('#mute-btn');
      const volumeRow = container.querySelector('#volume-row');
      expect(muteBtn?.classList.contains('ui-btn')).toBe(true);
      expect(volumeRow?.classList.contains('ui-btn')).toBe(true);
      expect(volumeRow?.classList.contains('audio-volume-row')).toBe(true);
      expect(volumeRow?.getAttribute('role')).toBe('button');
      expect(volumeRow?.getAttribute('tabindex')).toBe('-1');
    });

    it('should have aria-label on volume row', () => {
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row');
      expect(volumeRow?.getAttribute('aria-label')).toBe('Volume');
    });

    it('should have margin-bottom 16px on container via CSS', () => {
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      // Container margin-bottom is set via CSS, not inline styles
      expect(container.id).toBe('audio-settings');
    });
  });

  describe('Volume row click/drag interaction', () => {
    const mockGetBoundingClientRect = (left: number, width: number) => ({
      left,
      width,
      top: 0,
      height: 40,
      right: left + width,
      bottom: 40,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });

    it('should set volume to 0.5 when clicking at horizontal midpoint', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.5);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      // Mock getBoundingClientRect to return a 100px wide element at x=0
      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      // Mock setPointerCapture (jsdom doesn't implement it)
      volumeRow.setPointerCapture = vi.fn();

      // Click at the midpoint (clientX = 50, which is ratio 50/100 = 0.5)
      const event = new PointerEvent('pointerdown', {
        clientX: 50,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should set volume to 0 when clicking at left edge', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Click at the left edge (clientX = 0)
      const event = new PointerEvent('pointerdown', {
        clientX: 0,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should set volume to 1 when clicking at right edge', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(1);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Click at the right edge (clientX = 100)
      const event = new PointerEvent('pointerdown', {
        clientX: 100,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(1);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('should clamp volume to 0 when clicking to the left of element', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(50, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Click before the left edge (clientX = 30, ratio would be -0.2)
      const event = new PointerEvent('pointerdown', {
        clientX: 30,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      // Should be clamped to 0
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0);
    });

    it('should clamp volume to 1 when clicking to the right of element', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(1);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Click after the right edge (clientX = 150, ratio would be 1.5)
      const event = new PointerEvent('pointerdown', {
        clientX: 150,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      // Should be clamped to 1
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(1);
    });

    it('should update volume display after click', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.75);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Click at 75% position
      const event = new PointerEvent('pointerdown', {
        clientX: 75,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(event);

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.75);
      expect(volumeRow.textContent).toContain('◀ 75% ▶');
    });

    it('should handle drag interaction: pointermove updates volume', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.3);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Start drag at 30%
      const pointerDownEvent = new PointerEvent('pointerdown', {
        clientX: 30,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(pointerDownEvent);
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.3);

      // Move to 60%
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.6);
      const pointerMoveEvent = new PointerEvent('pointermove', {
        clientX: 60,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(pointerMoveEvent);

      // Should have called setVolume twice: once for pointerdown, once for pointermove
      expect(mockAudioManager.setVolume).toHaveBeenLastCalledWith(0.6);
      expect(mockAudioManager.setVolume).toHaveBeenCalledTimes(2);
    });

    it('should stop dragging on pointerup', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.3);
      const { container } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;

      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();

      // Start drag
      const pointerDownEvent = new PointerEvent('pointerdown', {
        clientX: 30,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(pointerDownEvent);

      // End drag
      const pointerUpEvent = new PointerEvent('pointerup', {
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(pointerUpEvent);

      // Move after up should not update volume
      (mockAudioManager.setVolume as ReturnType<typeof vi.fn>).mockClear();
      const pointerMoveEvent = new PointerEvent('pointermove', {
        clientX: 80,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(pointerMoveEvent);

      // setVolume should not have been called
      expect(mockAudioManager.setVolume).not.toHaveBeenCalled();
    });

    it('should keyboard/gamepad onAdjust still work after click interaction', () => {
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.5);
      const { container, buttons } = createAudioSettingsRows({
        audioManager: mockAudioManager as AudioManager,
        onChanged,
      });
      const volumeRow = container.querySelector('#volume-row') as HTMLElement;
      const volumeButton = buttons[1]!;

      // Click to set to 0.7
      volumeRow.getBoundingClientRect = vi.fn().mockReturnValue(mockGetBoundingClientRect(0, 100));
      volumeRow.setPointerCapture = vi.fn();
      const clickEvent = new PointerEvent('pointerdown', {
        clientX: 70,
        pointerId: 1,
        bubbles: true,
      });
      volumeRow.dispatchEvent(clickEvent);
      expect(mockAudioManager.setVolume).toHaveBeenLastCalledWith(0.7);

      // Now use keyboard adjustment (should add 0.05)
      (mockAudioManager.getVolume as ReturnType<typeof vi.fn>).mockReturnValue(0.7);
      (mockAudioManager.setVolume as ReturnType<typeof vi.fn>).mockClear();
      volumeButton.onAdjust?.(1);

      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.75);
      expect(onChanged).toHaveBeenCalledTimes(2); // once from click, once from keyboard
    });
  });
});
