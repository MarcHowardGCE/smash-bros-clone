import { INPUT_BITS, PHYSICS, STAGE, type InputEvent, type PlayerState } from '@smash/shared';
import type { StageData } from './types.js';

const DEFAULT_STAGE: StageData = {
  width: STAGE.WIDTH,
  height: STAGE.HEIGHT,
  blastTop: STAGE.BLAST_TOP,
  blastBottom: STAGE.BLAST_BOTTOM,
  blastLeft: STAGE.BLAST_LEFT,
  blastRight: STAGE.BLAST_RIGHT,
  mainPlatform: {
    id: 'main',
    ...STAGE.MAIN_PLATFORM,
  },
  platforms: STAGE.PLATFORMS.map((platform) => ({ ...platform })),
  ledges: STAGE.LEDGES.map((ledge) => ({ ...ledge })),
  spawnPositions: [...STAGE.SPAWN_POSITIONS],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isHeld(input: InputEvent, bit: number): boolean {
  return (input.held & bit) !== 0;
}

function isPressed(input: InputEvent, bit: number): boolean {
  return (input.pressed & bit) !== 0;
}

function isWithinPlatformBounds(playerX: number, platform: StageData['mainPlatform']): boolean {
  return playerX >= platform.x && playerX <= platform.x + platform.width;
}

function landOnPlatform(player: PlayerState, platformY: number): PlayerState {
  return {
    ...player,
    y: platformY - PHYSICS.HURTBOX_RADIUS,
    vy: 0,
    isGrounded: true,
    isFastFalling: false,
    hasDoubleJump: true,
  };
}

// Tunneling prevention: checks whether the player's bottom edge crossed the platform
// surface between the previous frame and this frame, rather than just checking current
// position. Without this, a fast-moving player (high vy) can pass entirely through a
// thin platform in a single tick and never trigger the landing check.
function crossesPlatformTop(player: PlayerState, platformY: number): boolean {
  const playerBottom = player.y + PHYSICS.HURTBOX_RADIUS;
  const previousBottom = playerBottom - player.vy;

  return previousBottom <= platformY && playerBottom >= platformY;
}

// Applies per-frame gravitational acceleration. Only runs when airborne — grounded
// players are held at platform height by checkPlatformCollision instead.
// isFastFalling multiplies vy when already moving downward (vy > 0), simulating
// the player choosing to accelerate toward the ground. The FAST_FALL_MULTIPLIER
// check on vy > 0 prevents fast fall from applying on the way up.
export function applyGravity(player: PlayerState): PlayerState {
  if (player.isGrounded) {
    return player;
  }

  let vy = player.vy + PHYSICS.GRAVITY;

  if (player.isFastFalling && vy > 0) {
    vy *= PHYSICS.FAST_FALL_MULTIPLIER;
  }

  return {
    ...player,
    vy: Math.min(vy, PHYSICS.TERMINAL_VELOCITY),
  };
}

export function applyMovement(player: PlayerState, input: InputEvent): PlayerState {
  const movingLeft = isHeld(input, INPUT_BITS.LEFT);
  const movingRight = isHeld(input, INPUT_BITS.RIGHT);
  let vx = player.vx;

  if (player.isGrounded) {
    if (movingLeft) {
      vx = clamp(vx - PHYSICS.WALK_SPEED * 0.2, -PHYSICS.RUN_SPEED, PHYSICS.RUN_SPEED);
    }

    if (movingRight) {
      vx = clamp(vx + PHYSICS.WALK_SPEED * 0.2, -PHYSICS.RUN_SPEED, PHYSICS.RUN_SPEED);
    }

    if (!movingLeft && !movingRight) {
      vx *= PHYSICS.GROUND_FRICTION;
    }
  } else {
    const airSpeedLimit = PHYSICS.AIR_SPEED * 8;

    // Air speed cap is deliberately loose (8× the acceleration factor) so the player
    // has wide lateral freedom in the air. The tight limit only applies in rare edge
    // cases (e.g. extreme knockback velocity); normal aerial drift never reaches it.

    if (movingLeft) {
      vx = clamp(vx - PHYSICS.AIR_SPEED * 0.15, -airSpeedLimit, airSpeedLimit);
    }

    if (movingRight) {
      vx = clamp(vx + PHYSICS.AIR_SPEED * 0.15, -airSpeedLimit, airSpeedLimit);
    }

    if (!movingLeft && !movingRight) {
      vx *= PHYSICS.AIR_FRICTION;
    }
  }

  return {
    ...player,
    vx,
    x: player.x + vx,
    y: player.y + player.vy,
  };
}

// Sets the initial upward velocity for a jump. Called by GameEngine when the
// JUMPSQUAT → AIRBORNE transition fires (full hop or short hop is determined by
// how long JUMP was held, evaluated in JumpsquatState before the transition).
// For double jump: consumes hasDoubleJump and ignores isGrounded check, allowing
// one aerial jump regardless of current vy.
export function startJump(player: PlayerState, isShortHop: boolean): PlayerState {
  if (player.isGrounded) {
    return {
      ...player,
      vy: isShortHop ? PHYSICS.SHORT_HOP_VELOCITY : PHYSICS.JUMP_VELOCITY,
      isGrounded: false,
      isFastFalling: false,
    };
  }

  if (!player.hasDoubleJump) {
    return player;
  }

  return {
    ...player,
    vy: PHYSICS.DOUBLE_JUMP_VELOCITY,
    hasDoubleJump: false,
    isFastFalling: false,
  };
}

export function resolveJump(player: PlayerState, input: InputEvent, jumpHeldFrames: number): PlayerState {
  if (!isPressed(input, INPUT_BITS.JUMP)) {
    return player;
  }

  const isShortHop = jumpHeldFrames < PHYSICS.SHORT_HOP_THRESHOLD_FRAMES;
  return startJump(player, isShortHop);
}

// Fast fall activates when the player holds DOWN while airborne and already moving
// downward (vy >= 0). The vy >= 0 guard prevents fast fall from triggering on the
// way up — it would cancel the jump arc. Once activated, isFastFalling is latched
// true and vy is set to a high fraction of TERMINAL_VELOCITY for instant fall speed.
export function applyFastFall(player: PlayerState, input: InputEvent): PlayerState {
  if (
    player.isGrounded ||
    player.isFastFalling ||
    !isHeld(input, INPUT_BITS.DOWN) ||
    player.vy < 0
  ) {
    return player;
  }

  return {
    ...player,
    isFastFalling: true,
    vy: PHYSICS.TERMINAL_VELOCITY * 0.8,
  };
}

// Resolves platform landing and blast-zone KO detection.
// Blast zones are checked first: any position outside the stage boundary immediately
// sets isKnockedOut. Platform landing uses crossesPlatformTop (see above) to handle
// tunneling. Only checks landing (vy >= 0) — a player moving upward passes through
// platform bottoms freely, matching Smash Bros soft-platform behaviour.
export function checkPlatformCollision(player: PlayerState, stage: StageData): PlayerState {
  if (player.y > stage.blastBottom || player.y < stage.blastTop || player.x < stage.blastLeft || player.x > stage.blastRight) {
    return {
      ...player,
      isKnockedOut: true,
    };
  }

  if (player.vy < 0) {
    return player;
  }

  if (isWithinPlatformBounds(player.x, stage.mainPlatform) && crossesPlatformTop(player, stage.mainPlatform.y)) {
    return landOnPlatform(player, stage.mainPlatform.y);
  }

  for (const platform of stage.platforms) {
    if (isWithinPlatformBounds(player.x, platform) && crossesPlatformTop(player, platform.y)) {
      return landOnPlatform(player, platform.y);
    }
  }

  return player;
}

export function applyMovementInput(player: PlayerState, input: InputEvent): PlayerState {
  const stage: StageData = isHeld(input, INPUT_BITS.DOWN)
    ? {
        ...DEFAULT_STAGE,
        platforms: [],
      }
    : DEFAULT_STAGE;

  return checkPlatformCollision(applyMovement(applyGravity(player), input), stage);
}
