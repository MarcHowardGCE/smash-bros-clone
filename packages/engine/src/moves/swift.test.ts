import { describe, it, expect } from 'vitest';
import { MoveId } from '@smash/shared';
import { getMoveData, getMoveDataForCharacter } from './index.js';
import {
  SWIFT_JAB, SWIFT_FORWARD_TILT, SWIFT_NEUTRAL_AIR, SWIFT_FORWARD_AIR,
  SWIFT_UP_AIR, SWIFT_NEUTRAL_SPECIAL, SWIFT_UP_SPECIAL,
} from './swift.js';

describe('Swift Move Overrides', () => {
  describe('Frame timing matches defaults', () => {
    const cases: Array<[string, MoveId, typeof SWIFT_JAB]> = [
      ['JAB', MoveId.JAB, SWIFT_JAB],
      ['FORWARD_TILT', MoveId.FORWARD_TILT, SWIFT_FORWARD_TILT],
      ['NEUTRAL_AIR', MoveId.NEUTRAL_AIR, SWIFT_NEUTRAL_AIR],
      ['FORWARD_AIR', MoveId.FORWARD_AIR, SWIFT_FORWARD_AIR],
      ['UP_AIR', MoveId.UP_AIR, SWIFT_UP_AIR],
      ['NEUTRAL_SPECIAL', MoveId.NEUTRAL_SPECIAL, SWIFT_NEUTRAL_SPECIAL],
      ['UP_SPECIAL', MoveId.UP_SPECIAL, SWIFT_UP_SPECIAL],
    ];

    for (const [name, id, override] of cases) {
      it(`${name} has identical frame timing to default`, () => {
        const def = getMoveData(id);
        expect(override.startupFrames).toBe(def.startupFrames);
        expect(override.activeFrames).toBe(def.activeFrames);
        expect(override.recoveryFrames).toBe(def.recoveryFrames);
        expect(override.landingLag).toBe(def.landingLag);
        expect(override.isAerial).toBe(def.isAerial);
        expect(override.isGrab).toBe(def.isGrab);
        expect(override.isSpecial).toBe(def.isSpecial);
        expect(override.chargeMax).toBe(def.chargeMax);
      });
    }
  });

  describe('Swift hitbox stats: extended reach, lower damage', () => {
    it('JAB: offsetX 50 (extended from default 45), damage 2, kbGrowth 22', () => {
      const h = SWIFT_JAB.hitboxPerActiveFrame[0];
      expect(h.offsetX).toBe(50);
      expect(h.damage).toBe(2);
      expect(h.knockbackGrowth).toBe(22);
    });

    it('FORWARD_TILT: offsetX 60 (extended from default 55), damage 5', () => {
      const h = SWIFT_FORWARD_TILT.hitboxPerActiveFrame[0];
      expect(h.offsetX).toBe(60);
      expect(h.damage).toBe(5);
    });

    it('NEUTRAL_AIR: radius 36 (extended from default 34), damage 6', () => {
      const h = SWIFT_NEUTRAL_AIR.hitboxPerActiveFrame[0];
      expect(h.radius).toBe(36);
      expect(h.damage).toBe(6);
    });

    it('FORWARD_AIR: offsetX 60 (extended from default 55), damage 9', () => {
      const h = SWIFT_FORWARD_AIR.hitboxPerActiveFrame[0];
      expect(h.offsetX).toBe(60);
      expect(h.damage).toBe(9);
    });

    it('UP_AIR: offsetY -50 (extended from -40), radius 30 (extended from 28), damage 7, kbGrowth 48', () => {
      const h = SWIFT_UP_AIR.hitboxPerActiveFrame[0];
      expect(h.offsetY).toBe(-50);
      expect(h.radius).toBe(30);
      expect(h.damage).toBe(7);
      expect(h.knockbackGrowth).toBe(48);
    });

    it('NEUTRAL_SPECIAL: radius 38 (extended from default 36), damage 6', () => {
      const h = SWIFT_NEUTRAL_SPECIAL.hitboxPerActiveFrame[0];
      expect(h.radius).toBe(38);
      expect(h.damage).toBe(6);
    });

    it('UP_SPECIAL: radius 28 (extended from default 26), vertical launch 90°, damage 4', () => {
      const h = SWIFT_UP_SPECIAL.hitboxPerActiveFrame[0];
      expect(h.radius).toBe(28);
      expect(h.knockbackAngle).toBe(90);
      expect(h.damage).toBe(4);
    });

    it('all Swift moves have hitboxPerActiveFrame.length matching activeFrames', () => {
      const cases = [SWIFT_JAB, SWIFT_FORWARD_TILT, SWIFT_NEUTRAL_AIR, SWIFT_FORWARD_AIR, SWIFT_UP_AIR, SWIFT_UP_SPECIAL];
      for (const m of cases) {
        expect(m.hitboxPerActiveFrame.length).toBe(m.activeFrames);
      }
      // NEUTRAL_SPECIAL has activeFrames: 0 but carries 1 burst hitbox (matches default pattern)
      expect(SWIFT_NEUTRAL_SPECIAL.activeFrames).toBe(0);
      expect(SWIFT_NEUTRAL_SPECIAL.hitboxPerActiveFrame.length).toBe(1);
    });

    it('Swift hits are weaker than defaults across the board', () => {
      const pairs: Array<[typeof SWIFT_JAB, MoveId]> = [
        [SWIFT_JAB, MoveId.JAB],
        [SWIFT_FORWARD_TILT, MoveId.FORWARD_TILT],
        [SWIFT_NEUTRAL_AIR, MoveId.NEUTRAL_AIR],
        [SWIFT_FORWARD_AIR, MoveId.FORWARD_AIR],
        [SWIFT_UP_AIR, MoveId.UP_AIR],
        [SWIFT_NEUTRAL_SPECIAL, MoveId.NEUTRAL_SPECIAL],
        [SWIFT_UP_SPECIAL, MoveId.UP_SPECIAL],
      ];
      for (const [override, id] of pairs) {
        const def = getMoveData(id);
        const swiftDmg = override.hitboxPerActiveFrame[0]?.damage ?? 0;
        const defDmg = def.hitboxPerActiveFrame[0]?.damage ?? 0;
        expect(swiftDmg).toBeLessThan(defDmg);
      }
    });

    it('Swift reach meets or exceeds defaults on all reach-extended moves', () => {
      // JAB, FORWARD_TILT, FORWARD_AIR use offsetX for reach
      expect(SWIFT_JAB.hitboxPerActiveFrame[0].offsetX).toBeGreaterThan(getMoveData(MoveId.JAB).hitboxPerActiveFrame[0].offsetX);
      expect(SWIFT_FORWARD_TILT.hitboxPerActiveFrame[0].offsetX).toBeGreaterThan(getMoveData(MoveId.FORWARD_TILT).hitboxPerActiveFrame[0].offsetX);
      expect(SWIFT_FORWARD_AIR.hitboxPerActiveFrame[0].offsetX).toBeGreaterThan(getMoveData(MoveId.FORWARD_AIR).hitboxPerActiveFrame[0].offsetX);
      // NEUTRAL_AIR, NEUTRAL_SPECIAL, UP_SPECIAL use radius for reach
      expect(SWIFT_NEUTRAL_AIR.hitboxPerActiveFrame[0].radius).toBeGreaterThan(getMoveData(MoveId.NEUTRAL_AIR).hitboxPerActiveFrame[0].radius);
      expect(SWIFT_NEUTRAL_SPECIAL.hitboxPerActiveFrame[0].radius).toBeGreaterThan(getMoveData(MoveId.NEUTRAL_SPECIAL).hitboxPerActiveFrame[0].radius);
      expect(SWIFT_UP_SPECIAL.hitboxPerActiveFrame[0].radius).toBeGreaterThan(getMoveData(MoveId.UP_SPECIAL).hitboxPerActiveFrame[0].radius);
      // UP_AIR uses both offsetY magnitude and radius
      expect(Math.abs(SWIFT_UP_AIR.hitboxPerActiveFrame[0].offsetY)).toBeGreaterThan(Math.abs(getMoveData(MoveId.UP_AIR).hitboxPerActiveFrame[0].offsetY));
      expect(SWIFT_UP_AIR.hitboxPerActiveFrame[0].radius).toBeGreaterThan(getMoveData(MoveId.UP_AIR).hitboxPerActiveFrame[0].radius);
    });
  });

  describe('getMoveDataForCharacter', () => {
    it('returns Swift overrides for swift', () => {
      const move = getMoveDataForCharacter('swift', MoveId.JAB);
      expect(move.hitboxPerActiveFrame[0].offsetX).toBe(50);
      expect(move.hitboxPerActiveFrame[0].damage).toBe(2);
    });

    it('returns defaults for swift on unmapped MoveIds (e.g. DOWN_TILT)', () => {
      const swiftMove = getMoveDataForCharacter('swift', MoveId.DOWN_TILT);
      const defMove = getMoveDataForCharacter('all-rounder', MoveId.DOWN_TILT);
      expect(swiftMove).toBe(defMove);
    });

    it('swift and abe-lincoln overrides do not collide', () => {
      const swiftJab = getMoveDataForCharacter('swift', MoveId.JAB);
      const lincolnJab = getMoveDataForCharacter('abe-lincoln', MoveId.JAB);
      expect(swiftJab.hitboxPerActiveFrame[0].offsetX).toBe(50);
      expect(lincolnJab.hitboxPerActiveFrame[0].offsetX).toBe(58);
    });

    it('all 7 Swift moves resolve with default frame timing preserved', () => {
      const moves = [
        MoveId.JAB, MoveId.FORWARD_TILT, MoveId.NEUTRAL_AIR, MoveId.FORWARD_AIR,
        MoveId.UP_AIR, MoveId.NEUTRAL_SPECIAL, MoveId.UP_SPECIAL,
      ];
      for (const id of moves) {
        const move = getMoveDataForCharacter('swift', id);
        const def = getMoveData(id);
        expect(move.id).toBe(id);
        expect(move.startupFrames).toBe(def.startupFrames);
        expect(move.activeFrames).toBe(def.activeFrames);
        expect(move.recoveryFrames).toBe(def.recoveryFrames);
      }
    });
  });
});
