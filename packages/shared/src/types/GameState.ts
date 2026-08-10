/**
 * @fileoverview Core game state types shared between the engine, server, and client.
 * Defines the canonical shape of every player, the full game world, network snapshots,
 * and event payloads emitted on hit and KO.
 */

import type { MoveId } from './MoveData.js';
import type { CharacterId } from './Character.js';

/** Opaque string identifier for a connected player (socket id or similar). */
export type PlayerId = string;

/** A 2D position or velocity vector in pixel-space. */
export interface Vec2 {
  x: number;
  y: number;
}

/** A circle in pixel-space used for hitbox and hurtbox collision checks. */
export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * All data needed to resolve a single active hitbox collision frame.
 * Offsets are relative to the attacking fighter's position; the engine
 * applies `attackerFacing` when computing world-space hit position.
 */
export interface HitboxData {
  /** Horizontal offset from the fighter's origin in px (positive = forward). */
  offsetX: number;
  /** Vertical offset from the fighter's origin in px (positive = downward). */
  offsetY: number;
  /** Radius of the hitbox circle in px. */
  radius: number;
  /** Percent damage dealt to the defender on clean hit. */
  damage: number;
  /** Flat knockback added regardless of defender's percent (Smash Bros formula). */
  baseKnockback: number;
  /** Scaling factor applied to knockback as defender percent rises. */
  knockbackGrowth: number;
  /** Launch angle in degrees (0 = horizontal, 90 = straight up). */
  knockbackAngle: number;
  /** Frames both attacker and defender are frozen on hit (gives hits "weight"). */
  hitlagFrames: number;
  /**
   * Optional override for hitstun duration in frames.
   * When omitted, hitstun scales dynamically from the resulting knockback magnitude.
   */
  hitstunFrames?: number;
  /** Higher priority wins when two hitboxes trade on the same frame. */
  priority: number;
}

/**
 * Complete authoritative state for a single fighter at one simulation tick.
 * The server broadcasts this inside `StateSnapshot`; the client uses it for
 * rendering, prediction reconciliation, and interpolation.
 */
export interface PlayerState {
  id: PlayerId;
  /** Slot index (0–3) used for character colour/pattern assignment. */
  slotIndex: number;
  /** World-space x position in px. */
  x: number;
  /** World-space y position in px (positive = downward). */
  y: number;
  /** Horizontal velocity in px/frame. */
  vx: number;
  /** Vertical velocity in px/frame (negative = upward). */
  vy: number;
  /** Direction the fighter faces: 1 = right, -1 = left. */
  facing: 1 | -1;
  /** Current FSM state name (a `PlayerStateEnum` string value). */
  state: string;
  /** Frames spent in the current FSM state. Frozen during hitlag. */
  stateFrame: number;
  /** Hitlag frames remaining; both fighters freeze while this is non-zero. */
  hitlagFramesRemaining: number;
  /** SDI input cooldown; prevents double-dipping the same directional input. */
  sdiInputCooldown?: number;
  /** Frames the defender cannot act due to hitstun. */
  hitstunFramesRemaining: number;
  /** True while the fighter is in tumble (high-knockback hitstun). */
  isTumbling: boolean;
  /** Remaining frames inside the tech-input buffer window before landing. */
  techWindowFrames: number;
  /** Cooldown frames after a failed tech before another buffer is accepted. */
  techLockoutFrames: number;
  /** Remaining frames in the L-cancel window after an aerial. */
  lCancelWindowFrames: number;
  /** Landing lag frames locked in when an aerial move lands without L-cancel. */
  landingLagFrames: number;
  /** Accumulated percent damage (no cap; higher = more knockback taken). */
  percent: number;
  /** Lives remaining. Reaching 0 ends the match for this player. */
  stocks: number;
  /** True when the fighter is standing on solid ground or a platform. */
  isGrounded: boolean;
  /** True while the fighter is off-screen being processed for respawn. */
  isKnockedOut: boolean;
  /** True if the double-jump resource has not yet been consumed this airborne stint. */
  hasDoubleJump: boolean;
  /** True if the air-dodge resource has not yet been consumed this airborne stint. */
  hasAirDodge: boolean;
  /** Consecutive wall-jump count without landing; used for velocity decay. */
  wallJumpStreak: number;
  /** True while the fighter is fast-falling (down input held in air). */
  isFastFalling: boolean;
  /** True while the fighter is invincible (respawn grace, ledge grab, etc.). */
  isInvincible: boolean;
  /** Remaining invincibility frames. */
  invincibilityFrames: number;
  /** True while the shield button is held and the shield FSM state is active. */
  isShielding: boolean;
  /** Shield HP (0–100). Reaching 0 triggers shield-break stun. */
  shieldHealth: number;
  /** Frames of shield-hit stun remaining. */
  shieldStunFrames: number;
  /** True while this fighter has an opponent grabbed. */
  isGrabbing: boolean;
  /** The PlayerId of the grabbed opponent, or null if not grabbing. */
  grabbedPlayerId: PlayerId | null;
  /** The ledge id this fighter is hanging from, or null. */
  ledgeId: string | null;
  /** The active hitbox for the current move frame, or null when inactive. */
  activeHitbox: HitboxData | null;
  /** The move currently being executed, or null when idle. */
  currentMoveId: MoveId | null;
  /** Queue of recently used move ids for stale-move knockback decay (FIFO, max 9). */
  staleMoveQueue: MoveId[];
  /** Landing-lag and special flag cached from the move that launched this aerial. */
  currentMove?: {
    landingLag: number;
    isSpecial: boolean;
  };
  /** Set of player ids this move instance has already hit (prevents multi-hit per swing). */
  hitPlayerIds: Set<string>;
  /** Frames a smash attack has been charged (0 when not charging). */
  chargeFrames: number;
  /** Cumulative px of ASDI drift applied this hitstun instance. */
  asdiDriftAccumulated?: number;
  /** Facing direction of the last attacker; used by counter resolution. */
  lastHitByFacing?: 1 | -1 | null;
  /** Knockback angle of the last hit; used by counter resolution. */
  lastHitKnockbackAngle?: number | null;
  /** Pending vx component of knockback to be applied on hitlag exit. */
  pendingKnockbackVx?: number | null;
  /** Pending vy component of knockback to be applied on hitlag exit. */
  pendingKnockbackVy?: number | null;
  /** Frames remaining before this fighter respawns after a KO. */
  respawnTimer: number;
  /** Direction of an active air-dodge, or null. */
  airDodgeDirection: { x: number; y: number } | null;
  /** Which character skin/stats this player is using. */
  characterId?: CharacterId;
}

/**
 * Authoritative game world at a single simulation tick.
 * Owned by the server; never mutated by clients.
 */
export interface GameState {
  /** Monotonically incrementing simulation tick counter (60 Hz). */
  tick: number;
  /** All active players keyed by PlayerId. */
  players: Record<PlayerId, PlayerState>;
  /** Current phase of the match lifecycle. */
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  /** PlayerId of the winner once `matchPhase === 'result'`, otherwise null. */
  winnerId: PlayerId | null;
  /** Maps each ledge id to the PlayerId currently hanging there, or null. */
  ledges: Record<string, string | null>;
}

/**
 * Payload emitted when a hitbox connects with a hurtbox.
 * Used by the client to trigger hit-effects and sound.
 */
export interface HitEventData {
  attackerId: PlayerId;
  defenderId: PlayerId;
  moveId: MoveId;
  /** Percent damage dealt on this hit. */
  damage: number;
  /** Computed knockback magnitude after the Smash Bros formula. */
  knockbackMagnitude: number;
  /** World-space x coordinate of the hit (for particle/SFX placement). */
  worldX: number;
  /** World-space y coordinate of the hit (for particle/SFX placement). */
  worldY: number;
}

/**
 * Payload emitted when a fighter crosses a blast zone.
 * Used by the server to deduct stocks and by the client to show KO effects.
 */
export interface KOEventData {
  playerId: PlayerId;
  /** Which blast-zone boundary was crossed. */
  boundary: 'left' | 'right' | 'top' | 'bottom';
  /** Tick on which the KO occurred. */
  tick: number;
}

/**
 * Binary network snapshot broadcast by the server at 20 Hz.
 * Carries the full game state plus hit events that occurred since the last
 * snapshot, and the highest confirmed input sequence per player for
 * client-side prediction reconciliation.
 */
export interface StateSnapshot {
  /** Simulation tick this snapshot was captured at. */
  tick: number;
  /** Wall-clock timestamp (ms) when the snapshot was serialised. */
  timestamp: number;
  /** Highest input seq the server has processed for each player. */
  lastConfirmedSeq: Record<PlayerId, number>;
  players: Record<PlayerId, PlayerState>;
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  winnerId: PlayerId | null;
  ledges: Record<string, string | null>;
  /** All hit events that fired between the previous snapshot and this one. */
  hitEvents: HitEventData[];
}
