import { describe, it, expect } from 'vitest';
import { MoveId } from '@smash/shared';
import { getMoveData, getMoveDataForCharacter } from './index.js';
import {
  SWIFT_JAB, SWIFT_NEUTRAL_AIR, SWIFT_FORWARD_AIR, SWIFT_DOWN_AIR,
  SWIFT_FORWARD_SMASH, SWIFT_NEUTRAL_SPECIAL, SWIFT_UP_SPECIAL, SWIFT_DOWN_SPECIAL,
} from './swift.js';

describe('Swift Move Overrides', () => {
  describe('Frame timing matches defaults', () => {
    it('JAB has identical frame timing to default', () => {
      const def = getMoveData(MoveId.JAB);
      expect(SWIFT_JAB.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_JAB.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_JAB.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_JAB.landingLag).toBe(def.landingLag);
      expect(SWIFT_JAB.isAerial).toBe(def.isAerial);
      expect(SWIFT_JAB.isGrab).toBe(def.isGrab);
      expect(SWIFT_JAB.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_JAB.chargeMax).toBe(def.chargeMax);
    });

    it('NEUTRAL_AIR has identical frame timing to default', () => {
      const def = getMoveData(MoveId.NEUTRAL_AIR);
      expect(SWIFT_NEUTRAL_AIR.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_NEUTRAL_AIR.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_NEUTRAL_AIR.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_NEUTRAL_AIR.landingLag).toBe(def.landingLag);
      expect(SWIFT_NEUTRAL_AIR.isAerial).toBe(def.isAerial);
      expect(SWIFT_NEUTRAL_AIR.isGrab).toBe(def.isGrab);
      expect(SWIFT_NEUTRAL_AIR.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_NEUTRAL_AIR.chargeMax).toBe(def.chargeMax);
    });

    it('FORWARD_AIR has identical frame timing to default', () => {
      const def = getMoveData(MoveId.FORWARD_AIR);
      expect(SWIFT_FORWARD_AIR.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_FORWARD_AIR.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_FORWARD_AIR.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_FORWARD_AIR.landingLag).toBe(def.landingLag);
      expect(SWIFT_FORWARD_AIR.isAerial).toBe(def.isAerial);
      expect(SWIFT_FORWARD_AIR.isGrab).toBe(def.isGrab);
      expect(SWIFT_FORWARD_AIR.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_FORWARD_AIR.chargeMax).toBe(def.chargeMax);
    });

    it('DOWN_AIR has identical frame timing to default', () => {
      const def = getMoveData(MoveId.DOWN_AIR);
      expect(SWIFT_DOWN_AIR.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_DOWN_AIR.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_DOWN_AIR.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_DOWN_AIR.landingLag).toBe(def.landingLag);
      expect(SWIFT_DOWN_AIR.isAerial).toBe(def.isAerial);
      expect(SWIFT_DOWN_AIR.isGrab).toBe(def.isGrab);
      expect(SWIFT_DOWN_AIR.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_DOWN_AIR.chargeMax).toBe(def.chargeMax);
    });

    it('FORWARD_SMASH has identical frame timing to default', () => {
      const def = getMoveData(MoveId.FORWARD_SMASH);
      expect(SWIFT_FORWARD_SMASH.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_FORWARD_SMASH.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_FORWARD_SMASH.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_FORWARD_SMASH.landingLag).toBe(def.landingLag);
      expect(SWIFT_FORWARD_SMASH.isAerial).toBe(def.isAerial);
      expect(SWIFT_FORWARD_SMASH.isGrab).toBe(def.isGrab);
      expect(SWIFT_FORWARD_SMASH.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_FORWARD_SMASH.chargeMax).toBe(def.chargeMax);
    });

    it('NEUTRAL_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.NEUTRAL_SPECIAL);
      expect(SWIFT_NEUTRAL_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_NEUTRAL_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_NEUTRAL_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_NEUTRAL_SPECIAL.landingLag).toBe(def.landingLag);
      expect(SWIFT_NEUTRAL_SPECIAL.isAerial).toBe(def.isAerial);
      expect(SWIFT_NEUTRAL_SPECIAL.isGrab).toBe(def.isGrab);
      expect(SWIFT_NEUTRAL_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_NEUTRAL_SPECIAL.chargeMax).toBe(def.chargeMax);
    });

    it('UP_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.UP_SPECIAL);
      expect(SWIFT_UP_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_UP_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_UP_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_UP_SPECIAL.landingLag).toBe(def.landingLag);
      expect(SWIFT_UP_SPECIAL.isAerial).toBe(def.isAerial);
      expect(SWIFT_UP_SPECIAL.isGrab).toBe(def.isGrab);
      expect(SWIFT_UP_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_UP_SPECIAL.chargeMax).toBe(def.chargeMax);
    });

    it('DOWN_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.DOWN_SPECIAL);
      expect(SWIFT_DOWN_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(SWIFT_DOWN_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(SWIFT_DOWN_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(SWIFT_DOWN_SPECIAL.landingLag).toBe(def.landingLag);
      expect(SWIFT_DOWN_SPECIAL.isAerial).toBe(def.isAerial);
      expect(SWIFT_DOWN_SPECIAL.isGrab).toBe(def.isGrab);
      expect(SWIFT_DOWN_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(SWIFT_DOWN_SPECIAL.chargeMax).toBe(def.chargeMax);
    });
  });

  describe('Swift hitbox stats match spec', () => {
    it('JAB has Swift hitbox stats (offsetX: 40, damage: 2)', () => {
      const hitbox = SWIFT_JAB.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(40);
      expect(hitbox.damage).toBe(2);
      expect(hitbox.knockbackGrowth).toBe(25);
    });

    it('NEUTRAL_AIR has Swift hitbox stats (damage: 7, radius: 32)', () => {
      const hitbox = SWIFT_NEUTRAL_AIR.hitboxPerActiveFrame[0];
      expect(hitbox.damage).toBe(7);
      expect(hitbox.radius).toBe(32);
      expect(hitbox.knockbackGrowth).toBe(45);
    });

    it('FORWARD_AIR has Swift hitbox stats (offsetX: 52, damage: 13)', () => {
      const hitbox = SWIFT_FORWARD_AIR.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(52);
      expect(hitbox.damage).toBe(13);
      expect(hitbox.knockbackGrowth).toBe(72);
    });

    it('DOWN_AIR has Swift hitbox stats (offsetY: 28, damage: 12, angle: 270)', () => {
      const hitbox = SWIFT_DOWN_AIR.hitboxPerActiveFrame[0];
      expect(hitbox.offsetY).toBe(28);
      expect(hitbox.damage).toBe(12);
      expect(hitbox.knockbackAngle).toBe(270);
      expect(hitbox.knockbackGrowth).toBe(55);
    });

    it('FORWARD_SMASH has Swift hitbox stats (offsetX: 62, damage: 16)', () => {
      const hitbox = SWIFT_FORWARD_SMASH.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(62);
      expect(hitbox.damage).toBe(16);
      expect(hitbox.knockbackGrowth).toBe(95);
    });

    it('NEUTRAL_SPECIAL has Swift hitbox stats (radius: 34, damage: 9)', () => {
      const hitbox = SWIFT_NEUTRAL_SPECIAL.hitboxPerActiveFrame[0];
      expect(hitbox.radius).toBe(34);
      expect(hitbox.damage).toBe(9);
      expect(hitbox.knockbackGrowth).toBe(50);
    });

    it('UP_SPECIAL has Swift hitbox stats (offsetY: -35, damage: 6, knockbackGrowth: 40)', () => {
      const hitbox = SWIFT_UP_SPECIAL.hitboxPerActiveFrame[0];
      expect(hitbox.offsetY).toBe(-35);
      expect(hitbox.damage).toBe(6);
      expect(hitbox.knockbackGrowth).toBe(40);
      expect(hitbox.knockbackAngle).toBe(75);
    });

    it('DOWN_SPECIAL has empty hitboxPerActiveFrame (counter mechanism)', () => {
      expect(SWIFT_DOWN_SPECIAL.hitboxPerActiveFrame).toEqual([]);
      expect(SWIFT_DOWN_SPECIAL.startupFrames).toBe(6);
    });
  });

  describe('getMoveDataForCharacter', () => {
    it('returns Swift overrides for swift', () => {
      const move = getMoveDataForCharacter('swift', MoveId.JAB);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(40);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(2);
    });

    it('returns default for all-rounder', () => {
      const move = getMoveDataForCharacter('all-rounder', MoveId.JAB);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(45);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(3);
    });

    it('returns default for undefined characterId', () => {
      const move = getMoveDataForCharacter(undefined, MoveId.JAB);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(45);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(3);
    });

    it('falls back to default for unmapped MoveIds', () => {
      const move = getMoveDataForCharacter('swift', MoveId.FORWARD_TILT);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(55);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(7);
    });

    it('all 8 Swift moves resolve via getMoveDataForCharacter', () => {
      const moves = [
        MoveId.JAB,
        MoveId.NEUTRAL_AIR,
        MoveId.FORWARD_AIR,
        MoveId.DOWN_AIR,
        MoveId.FORWARD_SMASH,
        MoveId.NEUTRAL_SPECIAL,
        MoveId.UP_SPECIAL,
        MoveId.DOWN_SPECIAL,
      ];

      for (const moveId of moves) {
        const move = getMoveDataForCharacter('swift', moveId);
        expect(move.id).toBe(moveId);
        // Verify frame timing still matches default
        const def = getMoveData(moveId);
        expect(move.startupFrames).toBe(def.startupFrames);
        expect(move.activeFrames).toBe(def.activeFrames);
        expect(move.recoveryFrames).toBe(def.recoveryFrames);
      }
    });
  });
});
