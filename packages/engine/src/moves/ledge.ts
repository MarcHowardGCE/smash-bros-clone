/**
 * @fileoverview Ledge option move frame data for the default roster.
 *
 * MOVE_LEDGE_ATTACK is the only ledge option with a hitbox. Ledge roll and
 * ledge jump are handled as state transitions in the FSM without MoveData;
 * this file contains only the attack variant.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const ledgeAttackHitbox: HitboxData = {
  // The ledge state holds the fighter center 10 units below the lip.
  offsetX: 50, offsetY: -100, radius: 24,
  damage: 6, baseKnockback: 3, knockbackGrowth: 50, knockbackAngle: 20,
  hitlagFrames: 4, hitstunFrames: 14, priority: 1,
};

// Ledge attack: 20 startup frames, 8 active frames (20-27), 32 recovery frames = 60 total
/** Ledge attack — 20 startup, 8 active, 32 recovery. Low-angle hit (20°) that covers the ledge; 60 total frames, punishable on shield. */
export const MOVE_LEDGE_ATTACK: MoveData = {
  id: MoveId.LEDGE_ATTACK,
  startupFrames: 20, activeFrames: 8, recoveryFrames: 32,
  hitboxPerActiveFrame: Array(8).fill(ledgeAttackHitbox),
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};
