export const MATCH_CONFIG = {
  STOCKS: 3,                            // lives per player; standard Smash Bros stock count
  RESPAWN_INVINCIBILITY_FRAMES: 180,    // 3 seconds at 60 Hz — long enough to reach the stage safely
  RESPAWN_PLATFORM_Y: 200,             // px from top; spawns above main platform (y=500) so fighter falls in
  RESPAWN_DELAY_FRAMES: 120,           // 2 seconds at 60 Hz before respawning after a KO
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  COUNTDOWN_SECONDS: 3,
  RESULT_DISPLAY_SECONDS: 5,
} as const;
