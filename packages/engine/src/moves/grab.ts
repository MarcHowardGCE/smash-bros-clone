import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

export const MOVE_GRAB: MoveData = {
  id: MoveId.GRAB,
  startupFrames: 6, activeFrames: 3, recoveryFrames: 18,
		hitboxPerActiveFrame: [
			{
				offsetX: 26,
				offsetY: 0,
				radius: 18,
				damage: 1,
				baseKnockback: 1,
				knockbackGrowth: 10,
				knockbackAngle: 15,
				hitlagFrames: 2,
				hitstunFrames: 4,
				priority: 1,
			},
		],
  landingLag: 0, isAerial: false, isGrab: true, isSpecial: false,
};

const pummelHitbox: HitboxData = {
  offsetX: 30, offsetY: 0, radius: 20,
  damage: 2, baseKnockback: 0, knockbackGrowth: 0, knockbackAngle: 0,
  hitlagFrames: 2, hitstunFrames: 4, priority: 1,
};

export const MOVE_PUMMEL: MoveData = {
  id: MoveId.PUMMEL,
  startupFrames: 3, activeFrames: 1, recoveryFrames: 8,
  hitboxPerActiveFrame: [pummelHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const forwardThrowHitbox: HitboxData = {
  offsetX: 50, offsetY: 0, radius: 30,
  damage: 8, baseKnockback: 8, knockbackGrowth: 65, knockbackAngle: 30,
  hitlagFrames: 5, hitstunFrames: 18, priority: 1,
};

export const MOVE_FORWARD_THROW: MoveData = {
  id: MoveId.FORWARD_THROW,
  startupFrames: 10, activeFrames: 1, recoveryFrames: 15,
  hitboxPerActiveFrame: [forwardThrowHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const backThrowHitbox: HitboxData = {
  offsetX: -50, offsetY: 0, radius: 30,
  damage: 9, baseKnockback: 9, knockbackGrowth: 70, knockbackAngle: 150,
  hitlagFrames: 5, hitstunFrames: 18, priority: 1,
};

export const MOVE_BACK_THROW: MoveData = {
  id: MoveId.BACK_THROW,
  startupFrames: 12, activeFrames: 1, recoveryFrames: 15,
  hitboxPerActiveFrame: [backThrowHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const upThrowHitbox: HitboxData = {
  offsetX: 0, offsetY: -50, radius: 30,
  damage: 8, baseKnockback: 7, knockbackGrowth: 60, knockbackAngle: 85,
  hitlagFrames: 5, hitstunFrames: 18, priority: 1,
};

export const MOVE_UP_THROW: MoveData = {
  id: MoveId.UP_THROW,
  startupFrames: 12, activeFrames: 1, recoveryFrames: 15,
  hitboxPerActiveFrame: [upThrowHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const downThrowHitbox: HitboxData = {
  offsetX: 0, offsetY: 30, radius: 28,
  damage: 6, baseKnockback: 4, knockbackGrowth: 45, knockbackAngle: 60,
  hitlagFrames: 5, hitstunFrames: 12, priority: 1,
};

export const MOVE_DOWN_THROW: MoveData = {
  id: MoveId.DOWN_THROW,
  startupFrames: 14, activeFrames: 1, recoveryFrames: 18,
  hitboxPerActiveFrame: [downThrowHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};
