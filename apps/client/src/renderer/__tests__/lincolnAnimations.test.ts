import { MoveId } from '@smash/shared';
import { describe, expect, it } from 'vitest';
import { getAnimationPose, ANIMATIONS, ATTACK_MOVE_ANIMATIONS } from '../animations';
import { LINCOLN_ANIMATIONS, LINCOLN_ATTACK_ANIMATIONS } from '../lincolnAnimations';

describe('Lincoln character-specific animations', () => {
  describe('IDLE pose', () => {
    it('returns Lincoln IDLE pose when characterId is abe-lincoln', () => {
      const pose = getAnimationPose('IDLE', 0, null, 'abe-lincoln');
      // Lincoln IDLE has bodyScaleY 1.15 at frame 0
      expect(pose.bodyScaleY).toBeCloseTo(1.15, 2);
    });

    it('returns shared IDLE pose when characterId is all-rounder', () => {
      const pose = getAnimationPose('IDLE', 0, null, 'all-rounder');
      // Shared IDLE at frame 0 starts at DEFAULT_POSE bodyScaleY = 1.0
      expect(pose.bodyScaleY).toBeCloseTo(1.0, 2);
    });

    it('returns shared IDLE pose when characterId is undefined', () => {
      const pose = getAnimationPose('IDLE', 0, null, undefined);
      expect(pose.bodyScaleY).toBeCloseTo(1.0, 2);
    });
  });

  describe('WALK pose', () => {
    it('returns Lincoln WALK with exaggerated arm-swing for abe-lincoln', () => {
      const pose = getAnimationPose('WALK', 0, null, 'abe-lincoln');
      // Lincoln WALK frame 0: leftArmAngle = 1.0 (double the shared 0.5)
      expect(pose.leftArmAngle).toBeCloseTo(1.0, 2);
      expect(pose.bodyScaleY).toBeCloseTo(1.15, 2);
    });

    it('returns shared WALK for all-rounder', () => {
      const pose = getAnimationPose('WALK', 0, null, 'all-rounder');
      // Shared WALK frame 0: leftArmAngle = 0.5
      expect(pose.leftArmAngle).toBeCloseTo(0.5, 2);
      expect(pose.bodyScaleY).toBeCloseTo(1.0, 2);
    });
  });

  describe('attack animations', () => {
    const LINCOLN_MOVE_IDS: MoveId[] = [
      MoveId.JAB,
      MoveId.FORWARD_SMASH,
      MoveId.DOWN_AIR,
      MoveId.NEUTRAL_SPECIAL,
      MoveId.SIDE_SPECIAL,
      MoveId.UP_SPECIAL,
      MoveId.DOWN_SPECIAL,
    ];

    it('uses Lincoln attack poses for mapped MoveIds when abe-lincoln', () => {
      for (const moveId of LINCOLN_MOVE_IDS) {
        const lincolnPose = getAnimationPose('ATTACK', 15, moveId, 'abe-lincoln');
        const sharedPose = getAnimationPose('ATTACK', 15, moveId, 'all-rounder');
        // Lincoln and shared should differ for these move IDs
        expect(lincolnPose).not.toEqual(sharedPose);
      }
    });

    it('uses shared attack poses for all-rounder', () => {
      for (const moveId of LINCOLN_MOVE_IDS) {
        const allRounderPose = getAnimationPose('ATTACK', 15, moveId, 'all-rounder');
        const undefinedPose = getAnimationPose('ATTACK', 15, moveId, undefined);
        expect(allRounderPose).toEqual(undefinedPose);
      }
    });

    it('falls back to shared attack for unmapped Lincoln MoveIds', () => {
      // FORWARD_TILT is NOT in LINCOLN_ATTACK_ANIMATIONS
      const lincolnPose = getAnimationPose('ATTACK', 15, MoveId.FORWARD_TILT, 'abe-lincoln');
      const sharedPose = getAnimationPose('ATTACK', 15, MoveId.FORWARD_TILT, undefined);
      expect(lincolnPose).toEqual(sharedPose);
    });
  });

  describe('unmapped state fallback', () => {
    it('falls back to shared JUMPSQUAT for Lincoln (not in Lincoln tables)', () => {
      const lincolnPose = getAnimationPose('JUMPSQUAT', 0, null, 'abe-lincoln');
      const sharedPose = getAnimationPose('JUMPSQUAT', 0, null, undefined);
      expect(lincolnPose).toEqual(sharedPose);
    });

    it('falls back to shared RUN for Lincoln (not in Lincoln tables)', () => {
      const lincolnPose = getAnimationPose('RUN', 0, null, 'abe-lincoln');
      const sharedPose = getAnimationPose('RUN', 0, null, undefined);
      expect(lincolnPose).toEqual(sharedPose);
    });

    it('falls back to shared HITSTUN for Lincoln (not in Lincoln tables)', () => {
      const lincolnPose = getAnimationPose('HITSTUN', 0, null, 'abe-lincoln');
      const sharedPose = getAnimationPose('HITSTUN', 0, null, undefined);
      expect(lincolnPose).toEqual(sharedPose);
    });
  });

  describe('data integrity', () => {
    it('LINCOLN_ANIMATIONS contains IDLE and WALK', () => {
      expect(LINCOLN_ANIMATIONS.IDLE).toBeDefined();
      expect(LINCOLN_ANIMATIONS.WALK).toBeDefined();
      expect(LINCOLN_ANIMATIONS.IDLE!.length).toBeGreaterThanOrEqual(2);
      expect(LINCOLN_ANIMATIONS.WALK!.length).toBeGreaterThanOrEqual(2);
    });

    it('LINCOLN_ATTACK_ANIMATIONS contains 7 MoveIds', () => {
      const keys = Object.keys(LINCOLN_ATTACK_ANIMATIONS);
      expect(keys).toHaveLength(7);
    });

    it('all Lincoln IDLE/WALK keyframes have bodyScaleY >= 1.13', () => {
      for (const frame of LINCOLN_ANIMATIONS.IDLE!) {
        expect(frame.bodyScaleY).toBeGreaterThanOrEqual(1.13);
      }
      for (const frame of LINCOLN_ANIMATIONS.WALK!) {
        expect(frame.bodyScaleY).toBeGreaterThanOrEqual(1.13);
      }
    });
  });
});
