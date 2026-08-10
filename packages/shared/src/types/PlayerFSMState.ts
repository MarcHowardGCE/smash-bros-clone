/**
 * @fileoverview Player finite-state machine (FSM) state enumeration.
 * Defines the 25 mutually-exclusive states a fighter can occupy at any tick.
 * The engine's FSM module uses these values to drive all state transitions,
 * physics overrides, and animation selection.
 */

/**
 * Exhaustive enumeration of every FSM state a fighter can be in.
 *
 * Ground states: IDLE, WALK, DASH, RUN
 * Jump states: JUMPSQUAT, AIRBORNE, DOUBLE_JUMP
 * Attack states: ATTACK (grounded), AIR_ATTACK (aerial)
 * Defensive states: SHIELD, ROLL, SPOT_DODGE, AIR_DODGE
 * Hitstun / tech states: HITSTUN, TECH_NEUTRAL, TECH_ROLL, HARD_LANDING, LANDING_LAG
 * Grab states: GRAB, GRAB_HOLDING
 * Ledge states: LEDGE_HANG, LEDGE_CLIMB, LEDGE_ATTACK, LEDGE_ROLL, LEDGE_JUMP
 */
export enum PlayerStateEnum {
  /** Standing still on the ground, accepting all inputs. */
  IDLE = 'IDLE',
  /** Walking left or right at WALK_SPEED. */
  WALK = 'WALK',
  /** Initial dash burst; transitions to RUN after a short window. */
  DASH = 'DASH',
  /** Sustained run at RUN_SPEED. */
  RUN = 'RUN',
  /** Pre-jump crouch; lasts JUMPSQUAT_FRAMES before going airborne. */
  JUMPSQUAT = 'JUMPSQUAT',
  /** Normal airborne state after a full or short hop. */
  AIRBORNE = 'AIRBORNE',
  /** Second jump consumed in the air. */
  DOUBLE_JUMP = 'DOUBLE_JUMP',
  /** Executing a grounded attack move. */
  ATTACK = 'ATTACK',
  /** Executing an aerial attack move. */
  AIR_ATTACK = 'AIR_ATTACK',
  /** Shield held; absorbs hits and drains shield health each frame. */
  SHIELD = 'SHIELD',
  /** Grounded roll dodge; grants brief intangibility. */
  ROLL = 'ROLL',
  /** In-place dodge (no movement); brief intangibility window. */
  SPOT_DODGE = 'SPOT_DODGE',
  /** Directional air-dodge; consumes the air-dodge resource. */
  AIR_DODGE = 'AIR_DODGE',
  /** Taking knockback; cannot act until hitstunFramesRemaining reaches 0. */
  HITSTUN = 'HITSTUN',
  /** Successful neutral tech on landing while tumbling. */
  TECH_NEUTRAL = 'TECH_NEUTRAL',
  /** Successful directional tech roll on landing while tumbling. */
  TECH_ROLL = 'TECH_ROLL',
  /** Missed tech; prone hard-landing lockout. */
  HARD_LANDING = 'HARD_LANDING',
  /** Aerial-move landing lag; reduced by L-cancel. */
  LANDING_LAG = 'LANDING_LAG',
  /** Active grab startup frames; grab hitbox is live. */
  GRAB = 'GRAB',
  /** Opponent is pinned; accepts pummel and throw inputs. */
  GRAB_HOLDING = 'GRAB_HOLDING',
  /** Hanging on a ledge; invincibility active for LEDGE_HANG_INVINCIBILITY_FRAMES. */
  LEDGE_HANG = 'LEDGE_HANG',
  /** Climbing up from a ledge; locked for LEDGE_CLIMB_FRAMES. */
  LEDGE_CLIMB = 'LEDGE_CLIMB',
  /** Ledge attack getup; hitbox active between LEDGE_ATTACK_HITBOX_START_FRAME and END_FRAME. */
  LEDGE_ATTACK = 'LEDGE_ATTACK',
  /** Ledge roll getup; locked for LEDGE_ROLL_FRAMES. */
  LEDGE_ROLL = 'LEDGE_ROLL',
  /** Ledge jump; brief locked window before full airborne control resumes. */
  LEDGE_JUMP = 'LEDGE_JUMP',
}

/**
 * Subset of player state fields relevant to tech and landing-lag resolution.
 * Used internally by the FSM; the full fighter state lives in `GameState.PlayerState`.
 */
export interface PlayerState {
  isTumbling: boolean;
  /** Remaining frames inside the tech-input buffer window before landing. */
  techWindowFrames: number;
  /** Cooldown frames after a failed tech before another buffer is accepted. */
  techLockoutFrames: number;
  /** Landing lag frames locked in when an aerial move lands without L-cancel. */
  landingLagFrames: number;
}
