import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const neutralAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 34,
  damage: 8, baseKnockback: 4, knockbackGrowth: 50, knockbackAngle: 45,
  hitlagFrames: 5, hitstunFrames: 14, priority: 1,
};

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

export const MOVE_DOWN_AIR: MoveData = {
  id: MoveId.DOWN_AIR,
  startupFrames: 10, activeFrames: 2, recoveryFrames: 20,
  hitboxPerActiveFrame: Array(2).fill(downAirHitbox),
  landingLag: 10, isAerial: true, isGrab: false, isSpecial: false,
};
