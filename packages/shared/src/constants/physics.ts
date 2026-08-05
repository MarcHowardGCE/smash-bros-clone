export const PHYSICS = {
  GRAVITY: 0.65,                    // px/frame² — tuned for a floaty but responsive jump arc
  TERMINAL_VELOCITY: 18,            // px/frame — caps fall speed; prevents tunneling through thin platforms
  JUMP_VELOCITY: -16,               // px/frame (negative = upward); full hop reaches ~196px height
  SHORT_HOP_VELOCITY: -10,          // px/frame; tap jump gives ~77px height for fast aerial combos
  SHORT_HOP_THRESHOLD_FRAMES: 3,    // frames JUMP must be held to trigger full hop vs short hop
  AIR_SPEED: 0.9,                   // px/frame² acceleration in the air; intentionally lower than ground
  AIR_FRICTION: 0.85,               // multiplier per frame when no direction held while airborne
  GROUND_FRICTION: 0.7,             // multiplier per frame when no direction held while grounded
  FAST_FALL_MULTIPLIER: 1.8,        // applied to vy each frame during fast fall; compounds quickly
  RUN_SPEED: 6.5,                   // px/frame max horizontal ground speed
  WALK_SPEED: 3.5,                  // px/frame max horizontal ground speed during walk
  DOUBLE_JUMP_VELOCITY: -14,        // px/frame; slightly weaker than full hop for balance
  JUMPSQUAT_FRAMES: 3,              // frames of crouch before leaving ground (authentic Smash timing)
  HURTBOX_RADIUS: 28,               // px; fighter collision sphere radius used for both hurt and platform checks
  FIGHTER_WEIGHT: 100,              // knockback formula weight divisor; higher = less knockback taken
  SHIELD_MAX_HEALTH: 100,           // shield starts full; reaching 0 triggers shield break stun
  SHIELD_DRAIN_PER_FRAME: 0.4,      // HP lost per frame while shielding (~250 frames before breaking)
  SHIELD_REGEN_PER_FRAME: 0.2,      // HP gained per frame when not shielding (slower than drain by design)
  SHIELD_BREAK_STUN_FRAMES: 150,    // ~2.5 seconds at 60 Hz; long enough to guarantee a punish
} as const;

export type Physics = typeof PHYSICS;
