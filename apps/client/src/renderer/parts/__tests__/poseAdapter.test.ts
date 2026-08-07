import { describe, it, expect } from 'vitest';
import { getPartTransforms, getLimbDimensions, getBodyDimensions, getHeadRadius } from '../poseAdapter.js';
import { DEFAULT_POSE } from '../../animations.js';
import type { JointPose } from '../../animations.js';

describe('poseAdapter', () => {
  describe('getPartTransforms', () => {
    it('should return all 6 parts for DEFAULT_POSE', () => {
      const transforms = getPartTransforms(DEFAULT_POSE, 0);
      expect(transforms).toHaveProperty('HEAD');
      expect(transforms).toHaveProperty('BODY');
      expect(transforms).toHaveProperty('ARM_L');
      expect(transforms).toHaveProperty('ARM_R');
      expect(transforms).toHaveProperty('LEG_L');
      expect(transforms).toHaveProperty('LEG_R');
    });

    describe('DEFAULT_POSE (bodyScaleX=1.0, bodyScaleY=1.0)', () => {
      const BODY_RADIUS = 22;
      const HEAD_RADIUS = 14;

      it('BODY: should be at origin with identity scale', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const body = transforms.BODY;
        expect(body.x).toBe(0);
        expect(body.y).toBe(0);
        expect(body.rotation).toBe(0);
        expect(body.scaleX).toBe(1.0);
        expect(body.scaleY).toBe(1.0);
      });

      it('HEAD: should be positioned above body center', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const head = transforms.HEAD;
        // hy = -bh * 1.0 + headOffsetY = -22 * 1.0 + 0 = -22
        expect(head.x).toBe(0); // headOffsetX = 0
        expect(head.y).toBe(-22); // -BODY_RADIUS * 1.0
        expect(head.rotation).toBe(0);
        expect(head.scaleX).toBe(1.0);
        expect(head.scaleY).toBe(1.0);
      });

      it('ARM_L: should be at left shoulder with angle offset', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const armL = transforms.ARM_L;
        // x = -bw * 0.7 = -22 * 0.7 = -15.4
        // rotation = leftArmAngle - π/2 = -0.3 - π/2
        expect(armL.x).toBeCloseTo(-15.4, 5);
        expect(armL.y).toBe(0);
        expect(armL.rotation).toBeCloseTo(-0.3 - Math.PI / 2, 5);
        expect(armL.scaleX).toBe(1.0);
        expect(armL.scaleY).toBe(1.0);
      });

      it('ARM_R: should be at right shoulder with angle offset', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const armR = transforms.ARM_R;
        // x = bw * 0.7 = 22 * 0.7 = 15.4
        // rotation = rightArmAngle - π/2 = 0.3 - π/2
        expect(armR.x).toBeCloseTo(15.4, 5);
        expect(armR.y).toBe(0);
        expect(armR.rotation).toBeCloseTo(0.3 - Math.PI / 2, 5);
        expect(armR.scaleX).toBe(1.0);
        expect(armR.scaleY).toBe(1.0);
      });

      it('LEG_L: should be at left hip', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const legL = transforms.LEG_L;
        // x = -8, y = bh * 0.6 = 22 * 0.6 = 13.2
        expect(legL.x).toBe(-8);
        expect(legL.y).toBeCloseTo(13.2, 5);
        expect(legL.rotation).toBe(-0.1); // leftLegAngle
        expect(legL.scaleX).toBe(1.0);
        expect(legL.scaleY).toBe(1.0);
      });

      it('LEG_R: should be at right hip', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 0);
        const legR = transforms.LEG_R;
        // x = 8, y = bh * 0.6 = 22 * 0.6 = 13.2
        expect(legR.x).toBe(8);
        expect(legR.y).toBeCloseTo(13.2, 5);
        expect(legR.rotation).toBe(0.1); // rightLegAngle
        expect(legR.scaleX).toBe(1.0);
        expect(legR.scaleY).toBe(1.0);
      });
    });

    describe('Custom pose with body squash', () => {
      const squashPose: JointPose = {
        leftArmAngle: 0,
        rightArmAngle: 0,
        leftLegAngle: 0,
        rightLegAngle: 0,
        bodyScaleX: 1.1,
        bodyScaleY: 0.8,
        headOffsetX: 0,
        headOffsetY: 0,
      };

      it('BODY: should reflect scale factors', () => {
        const transforms = getPartTransforms(squashPose, 0);
        const body = transforms.BODY;
        expect(body.scaleX).toBe(1.1);
        expect(body.scaleY).toBe(0.8);
      });

      it('HEAD: should adjust position based on body height', () => {
        const transforms = getPartTransforms(squashPose, 0);
        const head = transforms.HEAD;
        // hy = -bh * 1.0 = -(22 * 0.8) = -17.6
        expect(head.y).toBeCloseTo(-17.6, 5);
      });

      it('ARM_L: should adjust pivot based on body width', () => {
        const transforms = getPartTransforms(squashPose, 0);
        const armL = transforms.ARM_L;
        // x = -bw * 0.7 = -(22 * 1.1) * 0.7 = -16.94
        expect(armL.x).toBeCloseTo(-16.94, 5);
      });

      it('LEG_L: should adjust pivot based on body height', () => {
        const transforms = getPartTransforms(squashPose, 0);
        const legL = transforms.LEG_L;
        // y = bh * 0.6 = (22 * 0.8) * 0.6 = 10.56
        expect(legL.y).toBeCloseTo(10.56, 5);
      });
    });

    describe('Head offset', () => {
      const headOffsetPose: JointPose = {
        leftArmAngle: 0,
        rightArmAngle: 0,
        leftLegAngle: 0,
        rightLegAngle: 0,
        bodyScaleX: 1.0,
        bodyScaleY: 1.0,
        headOffsetX: 5,
        headOffsetY: 3,
      };

      it('HEAD: should apply both x and y offsets', () => {
        const transforms = getPartTransforms(headOffsetPose, 0);
        const head = transforms.HEAD;
        expect(head.x).toBe(5); // headOffsetX
        expect(head.y).toBeCloseTo(-19, 5); // -22 + 3
      });
    });

    describe('Invalid slotIndex handling', () => {
      it('should clamp negative slotIndex to 0', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, -5);
        // Should not throw; just use slot 0 pattern
        expect(transforms.BODY).toBeDefined();
      });

      it('should clamp slotIndex > 3 to 3', () => {
        const transforms = getPartTransforms(DEFAULT_POSE, 10);
        // Should not throw; just use slot 3 pattern
        expect(transforms.BODY).toBeDefined();
      });

      it('should accept valid slotIndex 0-3', () => {
        for (let slot = 0; slot <= 3; slot++) {
          const transforms = getPartTransforms(DEFAULT_POSE, slot);
          expect(transforms.BODY).toBeDefined();
        }
      });
    });

    describe('Arm angle transformations', () => {
      const armPose: JointPose = {
        leftArmAngle: Math.PI / 4,
        rightArmAngle: -Math.PI / 4,
        leftLegAngle: 0,
        rightLegAngle: 0,
        bodyScaleX: 1.0,
        bodyScaleY: 1.0,
        headOffsetX: 0,
        headOffsetY: 0,
      };

      it('ARM_L: should subtract π/2 from leftArmAngle', () => {
        const transforms = getPartTransforms(armPose, 0);
        const armL = transforms.ARM_L;
        expect(armL.rotation).toBeCloseTo(Math.PI / 4 - Math.PI / 2, 5);
      });

      it('ARM_R: should subtract π/2 from rightArmAngle', () => {
        const transforms = getPartTransforms(armPose, 0);
        const armR = transforms.ARM_R;
        expect(armR.rotation).toBeCloseTo(-Math.PI / 4 - Math.PI / 2, 5);
      });
    });

    describe('Leg angle transformations', () => {
      const legPose: JointPose = {
        leftArmAngle: 0,
        rightArmAngle: 0,
        leftLegAngle: Math.PI / 6,
        rightLegAngle: -Math.PI / 6,
        bodyScaleX: 1.0,
        bodyScaleY: 1.0,
        headOffsetX: 0,
        headOffsetY: 0,
      };

      it('LEG_L: should use leftLegAngle directly', () => {
        const transforms = getPartTransforms(legPose, 0);
        const legL = transforms.LEG_L;
        expect(legL.rotation).toBeCloseTo(Math.PI / 6, 5);
      });

      it('LEG_R: should use rightLegAngle directly', () => {
        const transforms = getPartTransforms(legPose, 0);
        const legR = transforms.LEG_R;
        expect(legR.rotation).toBeCloseTo(-Math.PI / 6, 5);
      });
    });
  });

  describe('getLimbDimensions', () => {
    it('should return ARM_LENGTH and ARM_WIDTH for arms', () => {
      const armL = getLimbDimensions('ARM_L');
      const armR = getLimbDimensions('ARM_R');
      expect(armL).toEqual({ length: 22, width: 7 });
      expect(armR).toEqual({ length: 22, width: 7 });
    });

    it('should return LEG_LENGTH and LEG_WIDTH for legs', () => {
      const legL = getLimbDimensions('LEG_L');
      const legR = getLimbDimensions('LEG_R');
      expect(legL).toEqual({ length: 24, width: 8 });
      expect(legR).toEqual({ length: 24, width: 8 });
    });

    it('should return null for HEAD and BODY', () => {
      expect(getLimbDimensions('HEAD')).toBeNull();
      expect(getLimbDimensions('BODY')).toBeNull();
    });
  });

  describe('getBodyDimensions', () => {
    it('should return scaled body dimensions', () => {
      const dims = getBodyDimensions(DEFAULT_POSE);
      expect(dims.width).toBe(22); // BODY_RADIUS * 1.0
      expect(dims.height).toBe(22); // BODY_RADIUS * 1.0
    });

    it('should apply scale factors', () => {
      const scaledPose: JointPose = {
        ...DEFAULT_POSE,
        bodyScaleX: 1.5,
        bodyScaleY: 0.7,
      };
      const dims = getBodyDimensions(scaledPose);
      expect(dims.width).toBeCloseTo(33, 5); // 22 * 1.5
      expect(dims.height).toBeCloseTo(15.4, 5); // 22 * 0.7
    });
  });

  describe('getHeadRadius', () => {
    it('should return HEAD_RADIUS constant', () => {
      expect(getHeadRadius()).toBe(14);
    });
  });
});
