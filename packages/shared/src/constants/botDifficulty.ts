/**
 * @fileoverview Bot difficulty type and preset constants.
 * `BotDifficulty` is the string union of all supported CPU difficulty levels.
 * `BOT_DIFFICULTY_PRESETS` maps each level to the three tunable parameters
 * that drive the CPU AI's reaction speed, decision quality, and execution accuracy.
 */

/** String union of all supported CPU difficulty levels. */
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
    /**
     * Frames the CPU waits after observing a player action before responding.
     * Lower = faster reactions. At 60 Hz: 3 frames ≈ 50 ms, 18 frames ≈ 300 ms.
     */
    reactionDelayFrames: number;
    /**
     * 0–1 score controlling how well the CPU picks the optimal action.
     * 0.5 = random-ish decisions; 0.92 = near-optimal aggression and recovery.
     */
    decisionQuality: number;
    /**
     * Probability (0–1) that the CPU fumbles an intended input on any given frame.
     * 0 = perfect execution; 0.35 = frequent mistimed or dropped inputs.
     */
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
