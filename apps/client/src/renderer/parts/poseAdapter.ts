/**
 * @fileoverview Converts a JointPose into per-part PixiJS transforms.
 *
 * Extracts the positional math that was previously embedded in
 * `FighterRenderer.redraw()` and exposes it as pure functions so that any
 * {@link IPartRenderer} implementation can position parts correctly without
 * duplicating geometry constants.
 */
import type { JointPose } from '../animations.js';
import type { FighterPart, PartTransform } from './IPartRenderer.js';

// Fighter dimensions (must match FighterRenderer.ts)
const BODY_RADIUS = 22;
const HEAD_RADIUS = 14;
const ARM_LENGTH = 22;
const ARM_WIDTH = 7;
const LEG_LENGTH = 24;
const LEG_WIDTH = 8;

/**
 * Converts a JointPose to per-part transforms.
 * Extracts the positional math from FighterRenderer.redraw() and related methods.
 *
 * @param pose - The joint pose (angles, scales, offsets)
 * @param slotIndex - Fighter slot (0-3) for pattern selection; invalid indices default to 0
 * @returns Record mapping each FighterPart to its PartTransform
 */
export function getPartTransforms(
  pose: JointPose,
  slotIndex: number
): Record<FighterPart, PartTransform> {
  // Clamp slotIndex to valid range [0, 3]
  const validSlotIndex = Math.max(0, Math.min(3, slotIndex));

  // Apply body squash/stretch (from redraw line 60-61)
  const bw = BODY_RADIUS * pose.bodyScaleX;
  const bh = BODY_RADIUS * pose.bodyScaleY;

  return {
    // Body: pentagon centered at origin
    BODY: {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: pose.bodyScaleX,
      scaleY: pose.bodyScaleY,
    },

    // Head: positioned above body (from redraw line 75-76)
    HEAD: {
      x: pose.headOffsetX,
      y: -bh * 1.0 + pose.headOffsetY,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },

    // Left arm: pivot at (-bw * 0.7, 0), rotated by (leftArmAngle - π/2)
    // Transform: position + rotation
    ARM_L: {
      x: -bw * 0.7,
      y: 0,
      rotation: pose.leftArmAngle - Math.PI / 2,
      scaleX: 1.0,
      scaleY: 1.0,
    },

    // Right arm: pivot at (+bw * 0.7, 0), rotated by (rightArmAngle - π/2)
    ARM_R: {
      x: bw * 0.7,
      y: 0,
      rotation: pose.rightArmAngle - Math.PI / 2,
      scaleX: 1.0,
      scaleY: 1.0,
    },

    // Left leg: pivot at (-8, bh * 0.6), rotated by leftLegAngle
    LEG_L: {
      x: -8,
      y: bh * 0.6,
      rotation: pose.leftLegAngle,
      scaleX: 1.0,
      scaleY: 1.0,
    },

    // Right leg: pivot at (+8, bh * 0.6), rotated by rightLegAngle
    LEG_R: {
      x: 8,
      y: bh * 0.6,
      rotation: pose.rightLegAngle,
      scaleX: 1.0,
      scaleY: 1.0,
    },
  };
}

/**
 * Helper: Get limb dimensions (length, width) for a given part.
 * Used by renderers to draw limbs with correct proportions.
 */
export function getLimbDimensions(part: FighterPart): { length: number; width: number } | null {
  switch (part) {
    case 'ARM_L':
    case 'ARM_R':
      return { length: ARM_LENGTH, width: ARM_WIDTH };
    case 'LEG_L':
    case 'LEG_R':
      return { length: LEG_LENGTH, width: LEG_WIDTH };
    default:
      return null;
  }
}

/**
 * Helper: Get body dimensions (width, height) for a given pose.
 * Used by renderers to draw the pentagon body.
 */
export function getBodyDimensions(pose: JointPose): { width: number; height: number } {
  return {
    width: BODY_RADIUS * pose.bodyScaleX,
    height: BODY_RADIUS * pose.bodyScaleY,
  };
}

/**
 * Helper: Get head radius.
 */
export function getHeadRadius(): number {
  return HEAD_RADIUS;
}
