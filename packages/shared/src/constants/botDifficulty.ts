export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Bot difficulty presets tuned against research-backed reaction bands.
 * 
 * Retuning rationale (Todo 4):
 * - easy: reactionDelayFrames 15→18 (wider reaction window, more human-like), executionErrorRate 0.3→0.35 (more fumbles)
 * - medium: kept as stable middle ground (reactionDelayFrames 8, executionErrorRate 0.15)
 * - hard: reactionDelayFrames 3 (fast but not frame-perfect), executionErrorRate 0.05→0.08 (slight increase for realism)
 * 
 * Branch boundaries preserved: decisionQuality thresholds (0.5, 0.75, 0.92) remain unchanged.
 */
export const BOT_DIFFICULTY_PRESETS: Record<
  BotDifficulty,
  {
    reactionDelayFrames: number;
    decisionQuality: number;
    executionErrorRate: number;
  }
> = {
  easy: {
    reactionDelayFrames: 18,
    decisionQuality: 0.5,
    executionErrorRate: 0.35,
  },
  medium: {
    reactionDelayFrames: 8,
    decisionQuality: 0.75,
    executionErrorRate: 0.15,
  },
  hard: {
    reactionDelayFrames: 3,
    decisionQuality: 0.92,
    executionErrorRate: 0.08,
  },
} as const;
