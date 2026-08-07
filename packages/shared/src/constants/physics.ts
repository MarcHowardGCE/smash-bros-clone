export const SMASH_CHARGE_MAX_FRAMES = 60;

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
  GRAB_OFFSET_X: 40,                // px; horizontal offset for pinning victim position during active grab hold
  FIGHTER_WEIGHT: 100,              // knockback formula weight divisor; higher = less knockback taken
  TUMBLE_THRESHOLD: 80,             // knockback magnitude threshold for tumble state (SSB-style)
  TECH_WINDOW_FRAMES: 20,           // buffered tech input window before landing while tumbling
  TECH_NEUTRAL_FRAMES: 26,          // neutral tech total vulnerable lock duration (invincible during animation)
  TECH_ROLL_FRAMES: 40,             // directional tech roll total animation duration
  TECH_MISS_LANDING_FRAMES: 30,     // missed-tech prone/hard-landing lock duration
   TECH_LOCKOUT_FRAMES: 40,          // cooldown after failed tech attempt before another buffer is allowed
   SHIELD_MAX_HEALTH: 100,           // shield starts full; reaching 0 triggers shield break stun
   SHIELD_DRAIN_PER_FRAME: 0.4,      // HP lost per frame while shielding (~250 frames before breaking)
   SHIELD_REGEN_PER_FRAME: 0.2,      // HP gained per frame when not shielding (slower than drain by design)
   SHIELD_BREAK_STUN_FRAMES: 150,    // ~2.5 seconds at 60 Hz; long enough to guarantee a punish
   PERFECT_SHIELD_WINDOW_FRAMES: 4,  // frames after shield raise during which perfect shield (powershield) is active
   LEDGE_GRAB_RADIUS: 50,            // px — proximity radius for hurtbox-to-ledge-point circleOverlap check
  LEDGE_GRAB_VERTICAL_TOLERANCE: 40, // px — max vertical distance above/below ledge y where grab is valid
  LEDGE_HANG_INVINCIBILITY_FRAMES: 45, // frames of invincibility granted on ledge grab (flat, not percent-based)
  LEDGE_REGRAB_COOLDOWN_FRAMES: 30, // frames before same player can regrab same ledge after dropping (~0.5s)
  LEDGE_CLIMB_FRAMES: 40,           // total animation/lock frames for climb getup
  LEDGE_JUMP_FRAMES: 12,            // frames before ledge jump becomes airborne-controllable
  LEDGE_ATTACK_FRAMES: 60,          // total animation frames for ledge attack getup
  LEDGE_ATTACK_HITBOX_START_FRAME: 20, // frame hitbox becomes active during ledge attack
  LEDGE_ATTACK_HITBOX_END_FRAME: 27, // frame hitbox deactivates during ledge attack
  LEDGE_ROLL_FRAMES: 45,            // total animation frames for roll getup
  LEDGE_DROP_FRAMES: 19,            // frames of helpless drop before normal airborne control resumes (unused FSM, informational)
  LEDGE_TRUMP_POP_VX: 3,            // horizontal speed applied to a trumped player (× outward direction)
  LEDGE_TRUMP_POP_VY: -6,           // upward velocity applied to a trumped player (negative = upward)
  LEDGE_TRUMP_INVINCIBILITY_FRAMES: 20, // brief invincibility grace period for the popped player
  COUNTER_DAMAGE_MULTIPLIER: 1.3,   // scales reflected damage when Down Special counter window is active
  COUNTER_KNOCKBACK_MULTIPLIER: 1.2, // scales reflected knockback magnitude for successful counters
  COUNTER_ANGLE_DEGREES: 45,        // launch angle used by counter-hit resolution (mirrored by defender facing)
} as const;

export type Physics = typeof PHYSICS;
