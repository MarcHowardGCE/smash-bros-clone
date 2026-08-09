import { describe, it, expect } from 'vitest';
import { BOT_DIFFICULTY_PRESETS } from './botDifficulty.js';

describe('BOT_DIFFICULTY_PRESETS', () => {
  it('should have exactly 3 difficulty levels', () => {
    expect(Object.keys(BOT_DIFFICULTY_PRESETS)).toHaveLength(3);
  });

  it('should have easy preset with correct values', () => {
    expect(BOT_DIFFICULTY_PRESETS.easy.reactionDelayFrames).toBe(18);
    expect(BOT_DIFFICULTY_PRESETS.easy.decisionQuality).toBe(0.5);
    expect(BOT_DIFFICULTY_PRESETS.easy.executionErrorRate).toBe(0.35);
  });

  it('should have medium preset with correct values', () => {
    expect(BOT_DIFFICULTY_PRESETS.medium.reactionDelayFrames).toBe(8);
    expect(BOT_DIFFICULTY_PRESETS.medium.decisionQuality).toBe(0.75);
    expect(BOT_DIFFICULTY_PRESETS.medium.executionErrorRate).toBe(0.15);
  });

  it('should have hard preset with correct values', () => {
    expect(BOT_DIFFICULTY_PRESETS.hard.reactionDelayFrames).toBe(3);
    expect(BOT_DIFFICULTY_PRESETS.hard.decisionQuality).toBe(0.92);
    expect(BOT_DIFFICULTY_PRESETS.hard.executionErrorRate).toBe(0.08);
  });
});
