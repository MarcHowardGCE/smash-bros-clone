import type { PlayerState, Stage } from '@smash/shared';
import { MoveId } from '@smash/shared';
import { getMoveData } from '../moves/index.js';

const THREAT_RANGE = 150;

/**
 * Calculate Euclidean distance between two players.
 * Pure function, no side effects.
 */
export function distanceBetween(a: PlayerState, b: PlayerState): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine if a player is off-stage and should trigger recovery.
 * Fires BEFORE the fighter reaches the blast zone.
 * Pure function, no side effects.
 */
export function isOffStage(player: PlayerState, stage: Stage): boolean {
  const mainPlatform = stage.MAIN_PLATFORM;
  const leftBound = mainPlatform.x - 40;
  const rightBound = mainPlatform.x + mainPlatform.width + 40;
  const bottomBound = mainPlatform.y + 60;

  return (
    player.x < leftBound ||
    player.x > rightBound ||
    player.y > bottomBound
  );
}

/**
 * Determine if an opponent's hitbox is incoming and within reaction range.
 * Measures frames since the opponent's hitbox actually BECAME active,
 * not raw move-age.
 * Pure function, no side effects.
 */
export function isThreatIncoming(
  self: PlayerState,
  opponent: PlayerState,
  reactionDelayFrames: number
): boolean {
  // No active hitbox = no threat
  if (opponent.activeHitbox === null || opponent.currentMoveId === null) {
    return false;
  }

  // Get move data to determine when hitbox became active
  const moveData = getMoveData(opponent.currentMoveId);
  const framesSinceActive = opponent.stateFrame - moveData.startupFrames;

  // Check if hitbox has been active long enough and is in range
  return (
    framesSinceActive >= reactionDelayFrames &&
    distanceBetween(self, opponent) <= THREAT_RANGE
  );
}

/**
 * Determine if an opponent is in their punish window (recovery frames).
 * True when the opponent's move is in recovery phase.
 * Pure function, no side effects.
 */
export function isPunishWindow(opponent: PlayerState): boolean {
  // No active move = not in punish window
  if (opponent.currentMoveId === null) {
    return false;
  }

  const moveData = getMoveData(opponent.currentMoveId);
  const recoveryStart = moveData.startupFrames + moveData.activeFrames;
  const recoveryEnd = recoveryStart + moveData.recoveryFrames;

  // Check if stateFrame is within recovery window
  return opponent.stateFrame >= recoveryStart && opponent.stateFrame < recoveryEnd;
}

/**
 * Determine whether jumping is needed to reach a grounded opponent on a platform.
 * Pure function, no side effects.
 */
export function platformJumpNeeded(self: PlayerState, opponent: PlayerState): boolean {
  const verticalDelta = opponent.y - self.y;
  const horizontalDelta = Math.abs(opponent.x - self.x);

  return (
    verticalDelta < -90 &&
    opponent.isGrounded === true &&
    horizontalDelta <= 260
  );
}
