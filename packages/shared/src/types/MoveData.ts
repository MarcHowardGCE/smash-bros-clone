/**
 * @fileoverview Move identifier enumeration and move-data type definitions.
 * `MoveId` names all 23 moves in the game (22 playable + ledge attack).
 * `MoveData` is the declarative descriptor consumed by the engine's move
 * execution system to drive startup/active/recovery timing and hitbox layout.
 */

import type { HitboxData } from './GameState.js';

/**
 * Exhaustive enumeration of every move a fighter can execute.
 *
 * Grounded normals: JAB, FORWARD_TILT, UP_TILT, DOWN_TILT
 * Smash attacks (chargeable): FORWARD_SMASH, UP_SMASH, DOWN_SMASH
 * Aerial normals: NEUTRAL_AIR, FORWARD_AIR, BACK_AIR, UP_AIR, DOWN_AIR
 * Special moves: NEUTRAL_SPECIAL, SIDE_SPECIAL, UP_SPECIAL, DOWN_SPECIAL
 * Grab game: GRAB, PUMMEL, FORWARD_THROW, BACK_THROW, UP_THROW, DOWN_THROW
 * Ledge option: LEDGE_ATTACK
 */
export enum MoveId {
  /** Fast 3-frame startup combo starter; primary grounded neutral tool. */
  JAB = 'JAB',
  /** Mid-range grounded poke; safe on shield at proper spacing. */
  FORWARD_TILT = 'FORWARD_TILT',
  /** Grounded anti-air launcher; sends opponents upward for juggle follow-ups. */
  UP_TILT = 'UP_TILT',
  /** Low-profile grounded poke; hits crouching and landing opponents. */
  DOWN_TILT = 'DOWN_TILT',
  /** Chargeable horizontal KO move; charge capped at SMASH_CHARGE_MAX_FRAMES. */
  FORWARD_SMASH = 'FORWARD_SMASH',
  /** Chargeable multi-hit upward KO move. */
  UP_SMASH = 'UP_SMASH',
  /** Chargeable two-sided KO move; hitbox covers both front and back. */
  DOWN_SMASH = 'DOWN_SMASH',
  /** Full-body aerial hitbox; neutral combo and juggle tool. */
  NEUTRAL_AIR = 'NEUTRAL_AIR',
  /** Strong horizontal aerial; primary edge-guard and punish tool. */
  FORWARD_AIR = 'FORWARD_AIR',
  /** Hits behind the fighter while airborne. */
  BACK_AIR = 'BACK_AIR',
  /** Upward aerial; juggle and combo extender. */
  UP_AIR = 'UP_AIR',
  /** Downward spike aerial; high risk, spikes offstage opponents. */
  DOWN_AIR = 'DOWN_AIR',
  /** Grounded/aerial burst hitbox; primary neutral special zoning tool. */
  NEUTRAL_SPECIAL = 'NEUTRAL_SPECIAL',
  /** Horizontal dash hit; aggressive approach and edge-guard option. */
  SIDE_SPECIAL = 'SIDE_SPECIAL',
  /** Upward recovery launch with a hitbox on initial frames; primary recovery move. */
  UP_SPECIAL = 'UP_SPECIAL',
  /** Counter with a brief invincibility window; reflects damage and knockback on success. */
  DOWN_SPECIAL = 'DOWN_SPECIAL',
  /** Grab startup; transitions to GRAB_HOLDING on successful catch. */
  GRAB = 'GRAB',
  /** Repeated hit while holding an opponent; deals small damage per input. */
  PUMMEL = 'PUMMEL',
  /** Throw releasing the opponent forward. */
  FORWARD_THROW = 'FORWARD_THROW',
  /** Throw releasing the opponent backward. */
  BACK_THROW = 'BACK_THROW',
  /** Throw launching the opponent upward for juggle setups. */
  UP_THROW = 'UP_THROW',
  /** Throw spiking the opponent downward. */
  DOWN_THROW = 'DOWN_THROW',
  /** Getup attack from a ledge hang; hitbox active between LEDGE_ATTACK_HITBOX_START_FRAME and END_FRAME. */
  LEDGE_ATTACK = 'LEDGE_ATTACK',
}

/**
 * Declarative descriptor for a single move.
 * The engine reads this at move-start and drives frame counting,
 * hitbox activation, and landing-lag assignment from these values.
 */
export interface MoveData {
  /** Which move this descriptor belongs to. */
  id: MoveId;
  /** Frames before the first active hitbox frame (windup). */
  startupFrames: number;
  /** Number of consecutive frames the hitbox is live. */
  activeFrames: number;
  /** Frames after the last active frame before the fighter returns to IDLE. */
  recoveryFrames: number;
  /**
   * Per-active-frame hitbox array. Index 0 = first active frame.
   * Multiple entries in a single frame element produce simultaneous hitboxes.
   */
  hitboxPerActiveFrame: HitboxData[];
  /** Landing lag frames applied if this aerial move lands before recovery ends. */
  landingLag: number;
  /** True for aerial moves; affects FSM state (AIR_ATTACK vs ATTACK). */
  isAerial: boolean;
  /** True for grab moves; triggers grab-resolution logic instead of hitbox collision. */
  isGrab: boolean;
  /** True for special moves; used by L-cancel and landing-lag rules. */
  isSpecial: boolean;
  /** Maximum charge frames; present only on chargeable smash attacks. */
  chargeMax?: number;
}
