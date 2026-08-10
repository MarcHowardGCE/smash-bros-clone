/**
 * @fileoverview Special move frame data for the default roster.
 *
 * Specials set `isSpecial: true`. MOVE_DOWN_SPECIAL is a counter — its empty
 * `hitboxPerActiveFrame` is intentional; the counter-hit logic lives in
 * GameEngine.ts and uses `startupFrames: 6` as the invincibility window boundary.
 * Frame counts here MUST stay in sync with that hard-coded threshold.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const neutralSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 36,
  damage: 10, baseKnockback: 5, knockbackGrowth: 55, knockbackAngle: 40,
  hitlagFrames: 6, hitstunFrames: 16, priority: 1,
};

/** Neutral special — 8 startup, 0 active frames (projectile spawn), 20 recovery. Wide hitbox (radius 36) at 40°. */
export const MOVE_NEUTRAL_SPECIAL: MoveData = {
  id: MoveId.NEUTRAL_SPECIAL,
  startupFrames: 8, activeFrames: 0, recoveryFrames: 20,
  hitboxPerActiveFrame: [neutralSpecialHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const sideSpecialHitbox: HitboxData = {
  offsetX: 50, offsetY: 0, radius: 28,
  damage: 9, baseKnockback: 5, knockbackGrowth: 60, knockbackAngle: 25,
  hitlagFrames: 5, hitstunFrames: 16, priority: 1,
};

/** Side special — 10 startup, 3 active, 18 recovery. Forward dash hitbox at 25°, covers horizontal distance. */
export const MOVE_SIDE_SPECIAL: MoveData = {
  id: MoveId.SIDE_SPECIAL,
  startupFrames: 10, activeFrames: 3, recoveryFrames: 18,
  hitboxPerActiveFrame: Array(3).fill(sideSpecialHitbox),
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const upSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: -35, radius: 26,
  damage: 6, baseKnockback: 4, knockbackGrowth: 45, knockbackAngle: 75,
  hitlagFrames: 4, hitstunFrames: 12, priority: 1,
};

/** Up special — 4 startup, 3 active, 30 recovery, 14 landing lag. Recovery move (`isAerial: true`); launches at 75°, high recovery lag punishes missed use. */
export const MOVE_UP_SPECIAL: MoveData = {
  id: MoveId.UP_SPECIAL,
  startupFrames: 4, activeFrames: 3, recoveryFrames: 30,
  hitboxPerActiveFrame: Array(3).fill(upSpecialHitbox),
  landingLag: 14, isAerial: true, isGrab: false, isSpecial: true,
};

/**
 * Down special — 6 startup, 0 active, 16 recovery. Counter move: empty hitboxes
 * because GameEngine.ts handles counter-hit damage directly. The invincibility
 * window is `stateFrame < 6` — this MUST equal `startupFrames`.
 */
export const MOVE_DOWN_SPECIAL: MoveData = {
  id: MoveId.DOWN_SPECIAL,
  startupFrames: 6, activeFrames: 0, recoveryFrames: 16,
  hitboxPerActiveFrame: [],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};
