export type BotDifficulty = 'easy' | 'medium' | 'hard';

export const BOT_DIFFICULTY_PRESETS: Record<
  BotDifficulty,
  {
    reactionDelayFrames: number;
    decisionQuality: number;
    executionErrorRate: number;
  }
> = {
  easy: {
    reactionDelayFrames: 15,
    decisionQuality: 0.5,
    executionErrorRate: 0.3,
  },
  medium: {
    reactionDelayFrames: 8,
    decisionQuality: 0.75,
    executionErrorRate: 0.15,
  },
  hard: {
    reactionDelayFrames: 3,
    decisionQuality: 0.92,
    executionErrorRate: 0.05,
  },
} as const;
