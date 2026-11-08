/**
 * @fileoverview Physics constants that govern the game simulation.
 * Every tunable value that affects movement, jumping, shields, techs, ledges,
 * walls, and advanced mechanics lives here. The engine reads these at runtime;
 * character-specific overrides in `CharacterStats` shadow individual fields
 * where needed.
 */

/**
 * Maximum frames a smash attack can be charged before damage and knockback
 * are capped. Charging beyond this frame count grants no additional benefit.
 */
export const SMASH_CHARGE_MAX_FRAMES = 60;

/**
 * Central physics parameter object for the game simulation.
 * All numeric values are in pixels (px) or frames at 60 Hz unless noted.
 *
 * Jump timing quick-reference:
 * - Full hop: JUMP_VELOCITY applied; reaches ~196 px of height
 * - Short hop: SHORT_HOP_VELOCITY applied when JUMP is released within
 *   SHORT_HOP_THRESHOLD_FRAMES frames of the button going down
 * - Jumpsquat: JUMPSQUAT_FRAMES frames of crouch before leaving the ground
 */
export const PHYSICS = {
  SHIELD_DROP_FRAMES:11,
  SPOT_DODGE_ATTACK_CANCEL_FRAME:19,SPOT_DODGE_TOTAL_FRAMES:25,
  /** Digital hitstop displacement tuning; world-unit calibration is not certified Ultimate data. */
  SDI_DISTANCE_WORLD:3,SDI_COOLDOWN_TICKS:4,ASDI_EXIT_DISTANCE_WORLD:2,
  /** Prima short-hop guide / Rubendal calculator; not full formula parity. */
  SHORT_HOP_AERIAL_DAMAGE_MULTIPLIER:0.85,
  ONE_ON_ONE_DAMAGE_MULTIPLIER:1.2,
  /** Custom shared dodge tuning; separately audited from Ultimate frame data. */
  DODGE_INTANGIBILITY_START:3,DODGE_INTANGIBILITY_END:12,
  AIR_DODGE_TRAVEL_START:3,AIR_DODGE_TRAVEL_END:13,AIR_DODGE_SPEED:6,
  ROLL_TRAVEL_START:3,ROLL_TRAVEL_END:15,ROLL_SPEED:4,
  /** Initial shared recovery tuning; not verified Ultimate frame data. */
  UP_SPECIAL_LAUNCH_VELOCITY: -16,
  HELPLESS_LANDING_FRAMES: 14,
  /** px/frame² downward acceleration each tick. Tuned for a floaty but responsive arc. */
  GRAVITY: 0.65,
  /** px/frame maximum fall speed; prevents tunneling through thin platforms. */
  TERMINAL_VELOCITY: 18,
  /** px/frame initial vertical velocity on a full hop (negative = upward). Reaches ~196 px height. */
  JUMP_VELOCITY: -16,
  /** px/frame initial vertical velocity on a short hop (negative = upward). Reaches ~77 px height. */
  SHORT_HOP_VELOCITY: -10,
  /**
   * Number of frames from jump-button-down by which JUMP must be released
   * to trigger a short hop instead of a full hop.
   * Releasing on frame 1, 2, or 3 → short hop; holding past frame 3 → full hop.
   */
  SHORT_HOP_THRESHOLD_FRAMES: 3,
  /** px/frame² horizontal acceleration while airborne; lower than ground for floatier feel. */
  AIR_SPEED: 0.9,
  /** Velocity multiplier per frame when no direction is held while airborne (air friction). */
  AIR_FRICTION: 0.85,
  /** Velocity multiplier per frame when no direction is held while grounded (ground friction). */
  GROUND_FRICTION: 0.7,
  /** Multiplier applied to `vy` each frame during fast fall; compounds quickly. */
  FAST_FALL_MULTIPLIER: 1.8,
  /** Maximum horizontal ground speed in px/frame during run. */
  RUN_SPEED: 6.5,
  /** Maximum horizontal ground speed in px/frame during walk. */
  WALK_SPEED: 3.5,
  /** px/frame initial vertical velocity on a double jump (negative = upward); weaker than full hop. */
  DOUBLE_JUMP_VELOCITY: -14,
  /** Frames of pre-jump crouch before the fighter leaves the ground (authentic Smash timing). */
  JUMPSQUAT_FRAMES: 3,
  /** Fighter collision sphere radius in px; used for both hurtbox and platform checks. */
  HURTBOX_RADIUS: 28,
  /** Horizontal offset in px for pinning the victim's position during an active grab hold. */
  GRAB_OFFSET_X: 40,
  /** Knockback formula weight divisor for the default fighter; higher = less knockback taken. */
  FIGHTER_WEIGHT: 100,
  /** Knockback magnitude threshold above which the defender enters tumble state (SSB-style). */
  TUMBLE_THRESHOLD: 80,
  /** Buffered tech-input window in frames before landing while tumbling. */
  TECH_WINDOW_FRAMES: 20,
  LAUNCH_TECH_BUFFER_TICKS: 12,
  LAUNCH_TECH_REPEAT_TICKS: 28,
  LAUNCH_TECH_AIR_DODGE_TICKS: 15,
  WALL_TECH_JUMP_WINDOW_TICKS: 5,
  CEILING_TECH_FRAMES: 26,
  CEILING_TECH_INTANGIBILITY_FRAMES: 17,
  /** Total frames locked in neutral tech (invincible during the animation). */
  TECH_NEUTRAL_FRAMES: 26,
  /** Total animation duration in frames for a directional tech roll. */
  TECH_ROLL_FRAMES: 40,
  /** Frames locked in the missed-tech prone/hard-landing state. */
  TECH_MISS_LANDING_FRAMES: 30,
  /** Cooldown frames after a failed tech attempt before another buffer window opens. */
  TECH_LOCKOUT_FRAMES: 40,
  /** Shield HP at full health; reaching 0 triggers shield-break stun. */
  SHIELD_MAX_HEALTH: 100,
  /** Shield HP lost per frame while shielding (~250 frames before a break at full health). */
  SHIELD_DRAIN_PER_FRAME: 0.4,
  /** Shield HP recovered per frame when not shielding (slower than drain by design). */
  SHIELD_REGEN_PER_FRAME: 0.2,
  /** Frames of shield-break stun (~2.5 s at 60 Hz); long enough to guarantee a punish. */
  SHIELD_BREAK_STUN_FRAMES: 150,
  /** Frames after shield raise during which a perfect shield (powershield) is active. */
  PERFECT_SHIELD_WINDOW_FRAMES: 5,
  SHIELD_PARRY_MIN_HOLD_FRAMES:3,
  // Custom hitstop advantage pending versioned Ultimate hitlag calibration.
  PARRY_ATTACKER_EXTRA_HITLAG:11,
  /** Proximity radius in px for the hurtbox-to-ledge-point `circleOverlap` check. */
  LEDGE_GRAB_RADIUS: 50,
  /** Maximum vertical distance in px above or below ledge `y` where a grab is valid. */
  LEDGE_GRAB_VERTICAL_TOLERANCE: 40,
  /** Frames of invincibility granted on ledge grab (flat, not percent-scaled). */
  LEDGE_HANG_INVINCIBILITY_FRAMES: 45,
  /** Minimum ticks from leaving a ledge to the next grab of that edge. */
  LEDGE_REGRAB_COOLDOWN_FRAMES: 44,
  /** Total grabs, including the first, before landing or taking a reaction hit. */
  LEDGE_CONSECUTIVE_GRAB_LIMIT: 6,
  /** Total animation and lock frames for the ledge climb getup option. */
  LEDGE_CLIMB_FRAMES: 40,
  /** Frames before a ledge jump becomes fully airborne-controllable. */
  LEDGE_JUMP_FRAMES: 12,
  /** Total animation frames for the ledge attack getup option. */
  LEDGE_ATTACK_FRAMES: 60,
  /** Frame on which the hitbox becomes active during a ledge attack. */
  LEDGE_ATTACK_HITBOX_START_FRAME: 20,
  /** Frame on which the hitbox deactivates during a ledge attack. */
  LEDGE_ATTACK_HITBOX_END_FRAME: 27,
  /** Total animation frames for the ledge roll getup option. */
  LEDGE_ROLL_FRAMES: 45,
  /** Frames of helpless drop before normal airborne control resumes after ledge drop (informational). */
  LEDGE_DROP_FRAMES: 19,
  /** Horizontal speed in px/frame applied to a ledge-trumped player (× outward direction). */
  LEDGE_TRUMP_POP_VX: 3,
  /** Upward velocity in px/frame applied to a ledge-trumped player (negative = upward). */
  LEDGE_TRUMP_POP_VY: -6,
  /** Action lock after the displaced fighter is ejected. Horizontal drift remains available. */
  LEDGE_TRUMP_RECOVERY_FRAMES: 28,
  /** Scales reflected damage when the Down Special counter window is active. */
  COUNTER_DAMAGE_MULTIPLIER: 1.3,
  /** Scales reflected knockback magnitude for a successful counter hit. */
  COUNTER_KNOCKBACK_MULTIPLIER: 1.2,
  /** Launch angle in degrees used by counter-hit resolution (mirrored by defender's facing). */
  COUNTER_ANGLE_DEGREES: 45,
  /** Deprecated legacy drift parameter; no longer used by the hitstop model. */
  ASDI_DRIFT_PX_PER_FRAME: 2,
  /** Cumulative ASDI drift cap in px per hitstun instance. */
  ASDI_MAX_TOTAL_DRIFT_PX: 30,
  /** px proximity to a wall's x coordinate to count as "touching". */
  WALL_CONTACT_TOLERANCE_PX: 6,
  /** Horizontal velocity in px/frame away from the wall on a wall jump; slightly above RUN_SPEED. */
  WALL_JUMP_HORIZONTAL_VELOCITY: 7,
  /** Vertical velocity in px/frame on a wall jump (negative = upward); matches DOUBLE_JUMP_VELOCITY magnitude. */
  WALL_JUMP_VERTICAL_VELOCITY: -14,
  /** Multiplier applied to vertical velocity per consecutive wall jump without landing (decay). */
  WALL_JUMP_HEIGHT_DECAY: 0.75,
  /** Floor multiplier so wall-jump vertical velocity decay never reaches ~0. */
  WALL_JUMP_MIN_VELOCITY_MULTIPLIER: 0.4,
  /** Frames of intangibility after a wall jump. */
  WALL_JUMP_INTANGIBILITY_FRAMES: 10,
  /** Frames of intangibility after a wall tech. */
  WALL_TECH_INTANGIBILITY_FRAMES: 12,
  /** Standard landing duration when an aerial auto-cancels, including contact. */
  AUTO_CANCEL_LANDING_FRAMES: 4,
  STANDING_HITSTUN_LANDING_FRAMES: 4,
  TUMBLE_DODGE_BUFFER_TICKS: 9,
  /** Initial horizontal slide velocity in px/frame on a wavedash; decays via GROUND_FRICTION each frame. */
  WAVEDASH_INITIAL_SLIDE_VELOCITY: 8,
  /** Landing lag frames from an air-dodge landing (wavedash); Melee spec-verified. */
  WAVEDASH_LANDING_LAG_FRAMES: 10,
} as const;

/** Derived type of the `PHYSICS` constant object; useful for typed parameter passing. */
export type Physics = typeof PHYSICS;
