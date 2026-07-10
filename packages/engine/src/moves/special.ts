import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const neutralSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 36,
  damage: 10, baseKnockback: 5, knockbackGrowth: 55, knockbackAngle: 40,
  hitlagFrames: 6, hitstunFrames: 16, priority: 1,
};

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

export const MOVE_UP_SPECIAL: MoveData = {
  id: MoveId.UP_SPECIAL,
  startupFrames: 4, activeFrames: 3, recoveryFrames: 30,
  hitboxPerActiveFrame: Array(3).fill(upSpecialHitbox),
  landingLag: 14, isAerial: true, isGrab: false, isSpecial: true,
};

export const MOVE_DOWN_SPECIAL: MoveData = {
  id: MoveId.DOWN_SPECIAL,
  startupFrames: 6, activeFrames: 0, recoveryFrames: 16,
  hitboxPerActiveFrame: [],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};
