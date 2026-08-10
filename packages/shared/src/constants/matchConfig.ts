/**
 * @fileoverview Match configuration constants: stock count, respawn timing, player limits,
 * and lobby countdown/result display durations. These values are shared between the server
 * (which enforces them) and the client (which uses them for UI display).
 */

/**
 * Top-level match rule constants consumed by both the server's match session
 * and the client's HUD and lobby UI.
 */
export const MATCH_CONFIG = {
  /** Lives per player; standard Smash Bros stock count. Reaching 0 eliminates the player. */
  STOCKS: 3,
  /**
   * Frames of invincibility granted after respawning (3 seconds at 60 Hz).
   * Long enough for the fighter to fall from the spawn position and reach the stage safely.
   */
  RESPAWN_INVINCIBILITY_FRAMES: 180,
  /**
   * y coordinate (px from top) from which a respawning fighter drops in.
   * Positioned above the main platform (y = 500) so the fighter falls naturally onto it.
   */
  RESPAWN_PLATFORM_Y: 200,
  /**
   * Frames after a KO before the fighter respawns (2 seconds at 60 Hz).
   * The client shows a respawn countdown during this window.
   */
  RESPAWN_DELAY_FRAMES: 120,
  /** Maximum simultaneous players per match room. */
  MAX_PLAYERS: 4,
  /** Minimum players required to start a match. */
  MIN_PLAYERS: 2,
  /** Countdown duration in seconds shown before the match begins. */
  COUNTDOWN_SECONDS: 3,
  /** Seconds the result screen is displayed before returning to the lobby. */
  RESULT_DISPLAY_SECONDS: 5,
} as const;
