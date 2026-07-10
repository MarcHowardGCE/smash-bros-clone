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

function crossesPlatformTop(player: PlayerState, platformY: number): boolean {
  const playerBottom = player.y + PHYSICS.HURTBOX_RADIUS;
  const previousBottom = playerBottom - player.vy;

  return previousBottom <= platformY && playerBottom >= platformY;
}

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
