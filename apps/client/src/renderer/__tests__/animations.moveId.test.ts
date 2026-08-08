import { MoveId } from '@smash/shared';
import { describe, expect, it } from 'vitest';
import { ANIMATIONS, ATTACK_MOVE_ANIMATIONS, getAnimationPose } from '../animations';

const REQUIRED_MOVE_IDS: readonly MoveId[] = [
  MoveId.JAB,
  MoveId.FORWARD_TILT,
  MoveId.UP_TILT,
  MoveId.DOWN_TILT,
  MoveId.FORWARD_SMASH,
  MoveId.UP_SMASH,
  MoveId.DOWN_SMASH,
  MoveId.NEUTRAL_SPECIAL,
  MoveId.SIDE_SPECIAL,
  MoveId.UP_SPECIAL,
  MoveId.DOWN_SPECIAL,
  MoveId.GRAB,
  MoveId.PUMMEL,
  MoveId.FORWARD_THROW,
  MoveId.BACK_THROW,
  MoveId.UP_THROW,
  MoveId.DOWN_THROW,
  MoveId.NEUTRAL_AIR,
  MoveId.FORWARD_AIR,
  MoveId.BACK_AIR,
  MoveId.UP_AIR,
  MoveId.DOWN_AIR,
];

const ANGLE_KEYS = [
  'leftArmAngle',
  'rightArmAngle',
  'leftLegAngle',
  'rightLegAngle',
] as const;

const GENERIC_ATTACK_ANIMATION = ANIMATIONS.ATTACK ?? [];

function maxAngleDelta(
  a: (typeof GENERIC_ATTACK_ANIMATION)[number],
  b: (typeof GENERIC_ATTACK_ANIMATION)[number],
): number {
  return Math.max(...ANGLE_KEYS.map((key) => Math.abs(a[key] - b[key])));
}

describe('animations move-id attack differentiation', () => {
  it('contains 22 required MoveId attack entries with at least 2 keyframes each', () => {
    expect(Object.keys(ATTACK_MOVE_ANIMATIONS)).toHaveLength(22);

    for (const moveId of REQUIRED_MOVE_IDS) {
      const animation = ATTACK_MOVE_ANIMATIONS[moveId as keyof typeof ATTACK_MOVE_ANIMATIONS];
      expect(animation).toBeDefined();
      expect(animation.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every move pose at least 0.2 rad from generic ATTACK fallback', () => {
    const genericAttackPose = GENERIC_ATTACK_ANIMATION[1];
    expect(genericAttackPose).toBeDefined();

    for (const moveId of REQUIRED_MOVE_IDS) {
      const movePose = ATTACK_MOVE_ANIMATIONS[moveId as keyof typeof ATTACK_MOVE_ANIMATIONS][1]!;
      expect(maxAngleDelta(movePose, genericAttackPose!)).toBeGreaterThanOrEqual(0.2);
    }
  });

  it('enforces >=0.2 rad pairwise separation between all move poses', () => {
    for (let i = 0; i < REQUIRED_MOVE_IDS.length; i += 1) {
      const leftMoveId = REQUIRED_MOVE_IDS[i]!;
      const leftPose = ATTACK_MOVE_ANIMATIONS[leftMoveId as keyof typeof ATTACK_MOVE_ANIMATIONS][1]!;

      for (let j = i + 1; j < REQUIRED_MOVE_IDS.length; j += 1) {
        const rightMoveId = REQUIRED_MOVE_IDS[j]!;
        const rightPose = ATTACK_MOVE_ANIMATIONS[rightMoveId as keyof typeof ATTACK_MOVE_ANIMATIONS][1]!;
        expect(
          maxAngleDelta(leftPose, rightPose),
          `${leftMoveId} vs ${rightMoveId}`,
        ).toBeGreaterThanOrEqual(0.2);
      }
    }
  });

  it('falls back to generic ATTACK when MoveId is missing', () => {
    expect(getAnimationPose('ATTACK', 15, null)).toEqual(getAnimationPose('ATTACK', 15));
    expect(getAnimationPose('AIR_ATTACK', 10, undefined)).toEqual(getAnimationPose('ATTACK', 10));
  });
});
