import { describe, it, expect } from 'vitest';
import { MoveId } from '@smash/shared';
import { getMoveData, getMoveDataForCharacter } from './index.js';
import {
  LINCOLN_JAB, LINCOLN_FORWARD_SMASH, LINCOLN_DOWN_AIR,
  LINCOLN_NEUTRAL_SPECIAL, LINCOLN_SIDE_SPECIAL, LINCOLN_UP_SPECIAL, LINCOLN_DOWN_SPECIAL,
} from './lincoln.js';

describe('Lincoln Move Overrides', () => {
  describe('Frame timing matches defaults', () => {
    it('JAB has identical frame timing to default', () => {
      const def = getMoveData(MoveId.JAB);
      expect(LINCOLN_JAB.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_JAB.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_JAB.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_JAB.landingLag).toBe(def.landingLag);
      expect(LINCOLN_JAB.isAerial).toBe(def.isAerial);
      expect(LINCOLN_JAB.isGrab).toBe(def.isGrab);
      expect(LINCOLN_JAB.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_JAB.chargeMax).toBe(def.chargeMax);
    });

    it('FORWARD_SMASH has identical frame timing to default', () => {
      const def = getMoveData(MoveId.FORWARD_SMASH);
      expect(LINCOLN_FORWARD_SMASH.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_FORWARD_SMASH.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_FORWARD_SMASH.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_FORWARD_SMASH.landingLag).toBe(def.landingLag);
      expect(LINCOLN_FORWARD_SMASH.isAerial).toBe(def.isAerial);
      expect(LINCOLN_FORWARD_SMASH.isGrab).toBe(def.isGrab);
      expect(LINCOLN_FORWARD_SMASH.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_FORWARD_SMASH.chargeMax).toBe(def.chargeMax);
    });

    it('DOWN_AIR has identical frame timing to default', () => {
      const def = getMoveData(MoveId.DOWN_AIR);
      expect(LINCOLN_DOWN_AIR.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_DOWN_AIR.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_DOWN_AIR.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_DOWN_AIR.landingLag).toBe(def.landingLag);
      expect(LINCOLN_DOWN_AIR.isAerial).toBe(def.isAerial);
      expect(LINCOLN_DOWN_AIR.isGrab).toBe(def.isGrab);
      expect(LINCOLN_DOWN_AIR.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_DOWN_AIR.chargeMax).toBe(def.chargeMax);
    });

    it('NEUTRAL_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.NEUTRAL_SPECIAL);
      expect(LINCOLN_NEUTRAL_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_NEUTRAL_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_NEUTRAL_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_NEUTRAL_SPECIAL.landingLag).toBe(def.landingLag);
      expect(LINCOLN_NEUTRAL_SPECIAL.isAerial).toBe(def.isAerial);
      expect(LINCOLN_NEUTRAL_SPECIAL.isGrab).toBe(def.isGrab);
      expect(LINCOLN_NEUTRAL_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_NEUTRAL_SPECIAL.chargeMax).toBe(def.chargeMax);
    });

    it('SIDE_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.SIDE_SPECIAL);
      expect(LINCOLN_SIDE_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_SIDE_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_SIDE_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_SIDE_SPECIAL.landingLag).toBe(def.landingLag);
      expect(LINCOLN_SIDE_SPECIAL.isAerial).toBe(def.isAerial);
      expect(LINCOLN_SIDE_SPECIAL.isGrab).toBe(def.isGrab);
      expect(LINCOLN_SIDE_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_SIDE_SPECIAL.chargeMax).toBe(def.chargeMax);
    });

    it('UP_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.UP_SPECIAL);
      expect(LINCOLN_UP_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_UP_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_UP_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_UP_SPECIAL.landingLag).toBe(def.landingLag);
      expect(LINCOLN_UP_SPECIAL.isAerial).toBe(def.isAerial);
      expect(LINCOLN_UP_SPECIAL.isGrab).toBe(def.isGrab);
      expect(LINCOLN_UP_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_UP_SPECIAL.chargeMax).toBe(def.chargeMax);
    });

    it('DOWN_SPECIAL has identical frame timing to default', () => {
      const def = getMoveData(MoveId.DOWN_SPECIAL);
      expect(LINCOLN_DOWN_SPECIAL.startupFrames).toBe(def.startupFrames);
      expect(LINCOLN_DOWN_SPECIAL.activeFrames).toBe(def.activeFrames);
      expect(LINCOLN_DOWN_SPECIAL.recoveryFrames).toBe(def.recoveryFrames);
      expect(LINCOLN_DOWN_SPECIAL.landingLag).toBe(def.landingLag);
      expect(LINCOLN_DOWN_SPECIAL.isAerial).toBe(def.isAerial);
      expect(LINCOLN_DOWN_SPECIAL.isGrab).toBe(def.isGrab);
      expect(LINCOLN_DOWN_SPECIAL.isSpecial).toBe(def.isSpecial);
      expect(LINCOLN_DOWN_SPECIAL.chargeMax).toBe(def.chargeMax);
    });
  });

  describe('Lincoln hitbox stats match spec', () => {
    it('JAB has Lincoln hitbox stats (offsetX: 58, damage: 3)', () => {
      const hitbox = LINCOLN_JAB.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(58);
      expect(hitbox.damage).toBe(3);
    });

    it('FORWARD_SMASH has Lincoln hitbox stats (offsetX: 78, damage: 20)', () => {
      const hitbox = LINCOLN_FORWARD_SMASH.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(78);
      expect(hitbox.damage).toBe(20);
    });

    it('DOWN_AIR has Lincoln hitbox stats (offsetY: 30, damage: 13, angle: 270)', () => {
      const hitbox = LINCOLN_DOWN_AIR.hitboxPerActiveFrame[0];
      expect(hitbox.offsetY).toBe(30);
      expect(hitbox.damage).toBe(13);
      expect(hitbox.knockbackAngle).toBe(270);
    });

    it('NEUTRAL_SPECIAL has Lincoln hitbox stats (offsetX: 90, damage: 9)', () => {
      const hitbox = LINCOLN_NEUTRAL_SPECIAL.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(90);
      expect(hitbox.damage).toBe(9);
    });

    it('SIDE_SPECIAL has Lincoln hitbox stats (offsetX: 70, damage: 15)', () => {
      const hitbox = LINCOLN_SIDE_SPECIAL.hitboxPerActiveFrame[0];
      expect(hitbox.offsetX).toBe(70);
      expect(hitbox.damage).toBe(15);
    });

    it('UP_SPECIAL has Lincoln hitbox stats (offsetY: -40, damage: 12, angle: 85)', () => {
      const hitbox = LINCOLN_UP_SPECIAL.hitboxPerActiveFrame[0];
      expect(hitbox.offsetY).toBe(-40);
      expect(hitbox.damage).toBe(12);
      expect(hitbox.knockbackAngle).toBe(85);
    });

    it('DOWN_SPECIAL has empty hitboxPerActiveFrame (counter mechanism)', () => {
      expect(LINCOLN_DOWN_SPECIAL.hitboxPerActiveFrame).toEqual([]);
      // Verify startupFrames: 6 matches GameEngine.ts counter threshold
      expect(LINCOLN_DOWN_SPECIAL.startupFrames).toBe(6);
    });
  });

  describe('getMoveDataForCharacter', () => {
    it('returns Lincoln overrides for abe-lincoln', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.JAB);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(58);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(3);
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
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.FORWARD_TILT);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(55);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(7);
    });

    it('all 7 Lincoln moves resolve via getMoveDataForCharacter', () => {
      const moves = [
        MoveId.JAB,
        MoveId.FORWARD_SMASH,
        MoveId.DOWN_AIR,
        MoveId.NEUTRAL_SPECIAL,
        MoveId.SIDE_SPECIAL,
        MoveId.UP_SPECIAL,
        MoveId.DOWN_SPECIAL,
      ];

      for (const moveId of moves) {
        const move = getMoveDataForCharacter('abe-lincoln', moveId);
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
