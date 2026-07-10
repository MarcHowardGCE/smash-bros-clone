import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const jabHitbox: HitboxData = {
  offsetX: 45, offsetY: 0, radius: 22,
  damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30,
  hitlagFrames: 3, hitstunFrames: 8, priority: 1,
};

export const MOVE_JAB: MoveData = {
  id: MoveId.JAB,
  startupFrames: 3, activeFrames: 2, recoveryFrames: 10,
  hitboxPerActiveFrame: [jabHitbox, jabHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const forwardTiltHitbox: HitboxData = {
  offsetX: 55, offsetY: 0, radius: 25,
  damage: 7, baseKnockback: 4, knockbackGrowth: 60, knockbackAngle: 20,
  hitlagFrames: 5, hitstunFrames: 16, priority: 1,
};

export const MOVE_FORWARD_TILT: MoveData = {
  id: MoveId.FORWARD_TILT,
  startupFrames: 7, activeFrames: 3, recoveryFrames: 12,
  hitboxPerActiveFrame: [forwardTiltHitbox, forwardTiltHitbox, forwardTiltHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const upTiltHitbox: HitboxData = {
  offsetX: 0, offsetY: -50, radius: 28,
  damage: 6, baseKnockback: 3, knockbackGrowth: 55, knockbackAngle: 85,
  hitlagFrames: 4, hitstunFrames: 14, priority: 1,
};

export const MOVE_UP_TILT: MoveData = {
  id: MoveId.UP_TILT,
  startupFrames: 6, activeFrames: 4, recoveryFrames: 14,
  hitboxPerActiveFrame: [upTiltHitbox, upTiltHitbox, upTiltHitbox, upTiltHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const downTiltHitbox: HitboxData = {
  offsetX: 40, offsetY: 15, radius: 20,
  damage: 5, baseKnockback: 2, knockbackGrowth: 45, knockbackAngle: 25,
  hitlagFrames: 3, hitstunFrames: 11, priority: 1,
};

export const MOVE_DOWN_TILT: MoveData = {
  id: MoveId.DOWN_TILT,
  startupFrames: 5, activeFrames: 2, recoveryFrames: 11,
  hitboxPerActiveFrame: [downTiltHitbox, downTiltHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const forwardSmashHitbox: HitboxData = {
  offsetX: 65, offsetY: 0, radius: 30,
  damage: 18, baseKnockback: 12, knockbackGrowth: 100, knockbackAngle: 35,
  hitlagFrames: 8, hitstunFrames: 30, priority: 2,
};

export const MOVE_FORWARD_SMASH: MoveData = {
  id: MoveId.FORWARD_SMASH,
  startupFrames: 15, activeFrames: 3, recoveryFrames: 25,
  hitboxPerActiveFrame: [forwardSmashHitbox, forwardSmashHitbox, forwardSmashHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
  chargeMax: 60,
};

const upSmashHitbox: HitboxData = {
  offsetX: 0, offsetY: -55, radius: 32,
  damage: 16, baseKnockback: 10, knockbackGrowth: 95, knockbackAngle: 80,
  hitlagFrames: 7, hitstunFrames: 28, priority: 2,
};

export const MOVE_UP_SMASH: MoveData = {
  id: MoveId.UP_SMASH,
  startupFrames: 12, activeFrames: 5, recoveryFrames: 22,
  hitboxPerActiveFrame: [upSmashHitbox, upSmashHitbox, upSmashHitbox, upSmashHitbox, upSmashHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
  chargeMax: 60,
};

const downSmashHitboxFront: HitboxData = {
  offsetX: 45, offsetY: 10, radius: 28,
  damage: 14, baseKnockback: 8, knockbackGrowth: 85, knockbackAngle: 40,
  hitlagFrames: 6, hitstunFrames: 24, priority: 2,
};

const downSmashHitboxBack: HitboxData = {
  offsetX: -45, offsetY: 10, radius: 28,
  damage: 14, baseKnockback: 8, knockbackGrowth: 85, knockbackAngle: 140,
  hitlagFrames: 6, hitstunFrames: 24, priority: 2,
};

export const MOVE_DOWN_SMASH: MoveData = {
  id: MoveId.DOWN_SMASH,
  startupFrames: 10, activeFrames: 6, recoveryFrames: 20,
  hitboxPerActiveFrame: [
    downSmashHitboxFront, downSmashHitboxFront, downSmashHitboxFront,
    downSmashHitboxBack, downSmashHitboxBack, downSmashHitboxBack,
  ],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
  chargeMax: 60,
};
