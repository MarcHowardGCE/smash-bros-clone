import { MoveId } from '@smash/shared';
import type { JointPose } from './animations.js';

/**
 * Lincoln-specific idle/walk animations.
 * bodyScaleY: 1.15 throughout = 15% taller (tall/lanky archetype).
 * Exaggerated arm-swing on WALK for comedic tone.
 */
export const LINCOLN_ANIMATIONS: Partial<Record<string, JointPose[]>> = {
  IDLE: [
    { leftArmAngle: -0.3, rightArmAngle: 0.3, leftLegAngle: -0.1, rightLegAngle: 0.1, bodyScaleX: 1.0, bodyScaleY: 1.15, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: -0.3, rightArmAngle: 0.3, leftLegAngle: -0.1, rightLegAngle: 0.1, bodyScaleX: 1.0, bodyScaleY: 1.13, headOffsetX: 0, headOffsetY: 1 },
  ],
  WALK: [
    { leftArmAngle: 1.0, rightArmAngle: -1.0, leftLegAngle: 0.6, rightLegAngle: -0.4, bodyScaleX: 1.0, bodyScaleY: 1.15, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1.0, bodyScaleY: 1.15, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: -1.0, rightArmAngle: 1.0, leftLegAngle: -0.4, rightLegAngle: 0.6, bodyScaleX: 1.0, bodyScaleY: 1.15, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1.0, bodyScaleY: 1.15, headOffsetX: 0, headOffsetY: 0 },
  ],
};

/** Lincoln default pose (used as windup/recovery frame in attack anims). */
const LINCOLN_DEFAULT: JointPose = {
  leftArmAngle: -0.3, rightArmAngle: 0.3,
  leftLegAngle: -0.1, rightLegAngle: 0.1,
  bodyScaleX: 1.0, bodyScaleY: 1.15,
  headOffsetX: 0, headOffsetY: 0,
};

function lincolnAttackPose(activePose: JointPose): JointPose[] {
  return [LINCOLN_DEFAULT, activePose, LINCOLN_DEFAULT];
}

/**
 * Lincoln-specific attack move animations for 7 MoveIds.
 * All maintain bodyScaleY >= 1.15 baseline; exaggerated reach on arm-heavy moves.
 */
export const LINCOLN_ATTACK_ANIMATIONS: Partial<Record<MoveId, JointPose[]>> = {
  [MoveId.JAB]: lincolnAttackPose({
    leftArmAngle: -2.8, rightArmAngle: 1.1, leftLegAngle: -0.7, rightLegAngle: 0.5,
    bodyScaleX: 1.04, bodyScaleY: 1.12, headOffsetX: 8, headOffsetY: 0,
  }),
  [MoveId.FORWARD_SMASH]: lincolnAttackPose({
    leftArmAngle: -1.8, rightArmAngle: 2.4, leftLegAngle: -1.0, rightLegAngle: 0.4,
    bodyScaleX: 1.14, bodyScaleY: 1.08, headOffsetX: 14, headOffsetY: -2,
  }),
  [MoveId.DOWN_AIR]: lincolnAttackPose({
    leftArmAngle: 2.5, rightArmAngle: 0.6, leftLegAngle: 1.6, rightLegAngle: -1.6,
    bodyScaleX: 1.06, bodyScaleY: 1.02, headOffsetX: 1, headOffsetY: 10,
  }),
  [MoveId.NEUTRAL_SPECIAL]: lincolnAttackPose({
    leftArmAngle: -1.0, rightArmAngle: 0.4, leftLegAngle: -0.5, rightLegAngle: 0.5,
    bodyScaleX: 0.98, bodyScaleY: 1.18, headOffsetX: 0, headOffsetY: -3,
  }),
  [MoveId.SIDE_SPECIAL]: lincolnAttackPose({
    leftArmAngle: -0.8, rightArmAngle: 1.8, leftLegAngle: -1.1, rightLegAngle: 0.3,
    bodyScaleX: 1.12, bodyScaleY: 1.05, headOffsetX: 12, headOffsetY: 0,
  }),
  [MoveId.UP_SPECIAL]: lincolnAttackPose({
    leftArmAngle: -0.5, rightArmAngle: 2.2, leftLegAngle: -0.4, rightLegAngle: 1.1,
    bodyScaleX: 0.96, bodyScaleY: 1.22, headOffsetX: 0, headOffsetY: -12,
  }),
  [MoveId.DOWN_SPECIAL]: lincolnAttackPose({
    leftArmAngle: -0.2, rightArmAngle: 0.2, leftLegAngle: -1.3, rightLegAngle: 1.3,
    bodyScaleX: 1.08, bodyScaleY: 1.0, headOffsetX: 0, headOffsetY: 9,
  }),
};
