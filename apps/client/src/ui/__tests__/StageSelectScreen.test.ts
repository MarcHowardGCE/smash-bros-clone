import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStageSelectScreen } from '../StageSelectScreen';
import type { StageConfig } from '../../stages/stageConfig';

describe('StageSelectScreen', () => {
  let container: HTMLElement;

  const stages: StageConfig[] = [
    {
      id: 'stage-1',
      displayName: 'Stage 1',
      backgroundImage: 'stage1.png',
      musicTrack: 'stage1.mp3',
    },
    {
      id: 'stage-2',
      displayName: 'Stage 2',
      backgroundImage: 'stage2.png',
      musicTrack: 'stage2.mp3',
    },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('ignores repeated Enter and still allows a genuine Enter confirmation', () => {
    const onSelected = vi.fn();
    renderStageSelectScreen(container, stages, onSelected);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    expect(onSelected).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSelected).toHaveBeenCalledTimes(1);
    expect(onSelected).toHaveBeenCalledWith(stages[0]);
  });
});
