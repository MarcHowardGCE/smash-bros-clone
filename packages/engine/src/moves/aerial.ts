/**
 * @fileoverview Aerial move frame data for the default roster.
 *
 * All aerials set `isAerial: true` and carry a `landingLag` value (frames of
 * lag added when the move connects while airborne). Frame counts must stay in
 * sync with FSM timing tables in `fsm/states/utils.ts`.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const neutralAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 34,
  damage: 8, baseKnockback: 4, knockbackGrowth: 50, knockbackAngle: 45,
  hitlagFrames: 5, hitstunFrames: 14, priority: 1,
};

/** Neutral air — 5 startup, 6 active, 16 recovery, 4 landing lag. Full-body hitbox (radius 34) at 45°. Longest active window of the aerials. */
export const MOVE_NEUTRAL_AIR: MoveData = {
  id: MoveId.NEUTRAL_AIR,
  startupFrames: 5, activeFrames: 6, recoveryFrames: 16,
  hitboxPerActiveFrame: Array(6).fill(neutralAirHitbox),
  landingLag: 4, isAerial: true, isGrab: false, isSpecial: false,
};

const forwardAirHitbox: HitboxData = {
  offsetX: 55, offsetY: -10, radius: 26,
  damage: 12, baseKnockback: 6, knockbackGrowth: 70, knockbackAngle: 30,
  hitlagFrames: 6, hitstunFrames: 20, priority: 1,
};

/** Forward air — 8 startup, 4 active, 18 recovery, 6 landing lag. Forward-reaching hitbox at 30°, solid edgeguard tool. */
export const MOVE_FORWARD_AIR: MoveData = {
  id: MoveId.FORWARD_AIR,
  startupFrames: 8, activeFrames: 4, recoveryFrames: 18,
  hitboxPerActiveFrame: Array(4).fill(forwardAirHitbox),
  landingLag: 6, isAerial: true, isGrab: false, isSpecial: false,
};

const backAirHitbox: HitboxData = {
  offsetX: -55, offsetY: 0, radius: 24,
  damage: 11, baseKnockback: 5, knockbackGrowth: 65, knockbackAngle: 150,
  hitlagFrames: 5, hitstunFrames: 18, priority: 1,
};

/** Back air — 7 startup, 3 active, 14 recovery, 5 landing lag. Rear hitbox at 150°, fast punish behind the character. */
export const MOVE_BACK_AIR: MoveData = {
  id: MoveId.BACK_AIR,
  startupFrames: 7, activeFrames: 3, recoveryFrames: 14,
  hitboxPerActiveFrame: Array(3).fill(backAirHitbox),
  landingLag: 5, isAerial: true, isGrab: false, isSpecial: false,
};

const upAirHitbox: HitboxData = {
  offsetX: 0, offsetY: -45, radius: 28,
  damage: 9, baseKnockback: 4, knockbackGrowth: 60, knockbackAngle: 80,
  hitlagFrames: 5, hitstunFrames: 16, priority: 1,
};

/** Up air — 7 startup, 5 active, 16 recovery, 6 landing lag. Overhead hitbox at 80°, juggle extender. */
export const MOVE_UP_AIR: MoveData = {
  id: MoveId.UP_AIR,
  startupFrames: 7, activeFrames: 5, recoveryFrames: 16,
  hitboxPerActiveFrame: Array(5).fill(upAirHitbox),
  landingLag: 6, isAerial: true, isGrab: false, isSpecial: false,
};

const downAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 40, radius: 24,
  damage: 14, baseKnockback: 6, knockbackGrowth: 60, knockbackAngle: 270,
  hitlagFrames: 7, hitstunFrames: 20, priority: 1,
};

/** Down air — 10 startup, 2 active, 20 recovery, 10 landing lag. Spike at 270°; high landing lag punishes mistimed use. */
export const MOVE_DOWN_AIR: MoveData = {
  id: MoveId.DOWN_AIR,
  startupFrames: 10, activeFrames: 2, recoveryFrames: 20,
  hitboxPerActiveFrame: Array(2).fill(downAirHitbox),
  landingLag: 10, isAerial: true, isGrab: false, isSpecial: false,
};
