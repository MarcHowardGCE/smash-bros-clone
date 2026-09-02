/**
 * @fileoverview Shared audio settings component (mute toggle + volume slider).
 * 
 * Exported factory function creates a container with two rows:
 * 1. Mute button: toggles sound on/off with label reflecting state
 * 2. Volume row: shows current percentage with left/right adjust
 */

import type { AudioManager } from '../audio/AudioManager.js';
import type { MenuButton } from './MenuNavigator.js';

/** Dependencies for the audio settings component. */
export interface AudioSettingsDeps {
  audioManager: AudioManager;
  onChanged: () => void;
}

/**
 * Create a reusable audio settings component with mute + volume rows.
 *
 * @param deps - AudioManager and onChange callback
 * @returns Container element and MenuButton array for navigation
 */
export function createAudioSettingsRows(deps: AudioSettingsDeps): {
  container: HTMLElement;
  buttons: MenuButton[];
} {
  const { audioManager, onChanged } = deps;

  // Create the main container
  const container = document.createElement('div');
  container.id = 'audio-settings';

  // ============================================================================
  // Mute row
  // ============================================================================
  const muteRow = document.createElement('button');
  muteRow.id = 'mute-btn';
  muteRow.className = 'ui-btn';
  muteRow.type = 'button';

  // Update mute label based on current state
  const updateMuteLabel = (): void => {
    muteRow.textContent = audioManager.isMuted() ? 'Sound: Muted' : 'Sound: On';
  };

  updateMuteLabel();

  const handleMuteToggle = (): void => {
    audioManager.toggleMuted();
    updateMuteLabel();
    onChanged();
  };

  muteRow.addEventListener('click', handleMuteToggle);

  // ============================================================================
  // Volume row
  // ============================================================================
  const volumeRow = document.createElement('div');
  volumeRow.id = 'volume-row';
  volumeRow.className = 'ui-btn audio-volume-row';
  volumeRow.setAttribute('role', 'button');
  volumeRow.setAttribute('tabindex', '-1');
  volumeRow.setAttribute('aria-label', 'Volume');

  const volumeLabel = document.createElement('span');
  volumeLabel.textContent = 'Volume';

  const volumeValue = document.createElement('span');
  volumeValue.style.marginLeft = '12px';

  // Update volume display
  const updateVolumeDisplay = (): void => {
    const percent = Math.round(audioManager.getVolume() * 100);
    volumeValue.textContent = `◀ ${percent}% ▶`;
  };

  updateVolumeDisplay();

  volumeRow.appendChild(volumeLabel);
  volumeRow.appendChild(volumeValue);

  // ============================================================================
  // Volume row click/drag handling
  // ============================================================================
  let isDragging = false;

  const setVolumeFromPosition = (clientX: number): void => {
    const rect = volumeRow.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioManager.setVolume(ratio);
    updateVolumeDisplay();
    onChanged();
  };

  const handlePointerDown = (e: PointerEvent): void => {
    isDragging = true;
    if (volumeRow.setPointerCapture) {
      volumeRow.setPointerCapture(e.pointerId);
    }
    setVolumeFromPosition(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent): void => {
    if (isDragging) {
      setVolumeFromPosition(e.clientX);
    }
  };

  const handlePointerUp = (): void => {
    isDragging = false;
  };

  volumeRow.addEventListener('pointerdown', handlePointerDown);
  volumeRow.addEventListener('pointermove', handlePointerMove);
  volumeRow.addEventListener('pointerup', handlePointerUp);
  volumeRow.addEventListener('pointercancel', handlePointerUp);

  // Assemble container
  container.appendChild(muteRow);
  container.appendChild(volumeRow);

  // ============================================================================
  // MenuButton definitions
  // ============================================================================
  const muteButton: MenuButton = {
    id: 'mute-btn',
    element: muteRow,
    onActivate: handleMuteToggle,
  };

  const volumeButton: MenuButton = {
    id: 'volume-row',
    element: volumeRow,
    onActivate: () => {
      // Volume is adjusted via onAdjust, not onActivate
    },
    onAdjust: (delta: -1 | 1) => {
      const newVolume = audioManager.getVolume() + delta * 0.05;
      audioManager.setVolume(newVolume);
      updateVolumeDisplay();
      onChanged();
    },
  };

  return {
    container,
    buttons: [muteButton, volumeButton],
  };
}
