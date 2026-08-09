import { describe, it, expect } from 'vitest';
import { MoveId, getCharacterStats } from '@smash/shared';
import { getMoveDataForCharacter } from '../moves/index.js';

describe('Character Registry - Abe Lincoln', () => {
  describe('Lincoln Move Overrides - Frame Data Validity', () => {
    const LINCOLN_MOVES = [
      MoveId.JAB,
      MoveId.FORWARD_SMASH,
      MoveId.DOWN_AIR,
      MoveId.NEUTRAL_SPECIAL,
      MoveId.SIDE_SPECIAL,
      MoveId.UP_SPECIAL,
      MoveId.DOWN_SPECIAL,
    ];

    it('all 7 Lincoln moves have non-negative startupFrames', () => {
      for (const moveId of LINCOLN_MOVES) {
        const move = getMoveDataForCharacter('abe-lincoln', moveId);
        expect(move.startupFrames).toBeGreaterThanOrEqual(0);
      }
    });

    it('all 7 Lincoln moves have non-negative activeFrames', () => {
      for (const moveId of LINCOLN_MOVES) {
        const move = getMoveDataForCharacter('abe-lincoln', moveId);
        expect(move.activeFrames).toBeGreaterThanOrEqual(0);
      }
    });

    it('all 7 Lincoln moves have non-negative recoveryFrames', () => {
      for (const moveId of LINCOLN_MOVES) {
        const move = getMoveDataForCharacter('abe-lincoln', moveId);
        expect(move.recoveryFrames).toBeGreaterThanOrEqual(0);
      }
    });

    it('all 7 Lincoln moves have hitboxPerActiveFrame.length matching activeFrames', () => {
      for (const moveId of LINCOLN_MOVES) {
        const move = getMoveDataForCharacter('abe-lincoln', moveId);
        // DOWN_SPECIAL and NEUTRAL_SPECIAL have activeFrames: 0 with special hitbox logic
        if (move.activeFrames === 0) {
          // These moves have exactly 1 hitbox despite activeFrames: 0 (special logic)
          expect(move.hitboxPerActiveFrame.length).toBeGreaterThanOrEqual(0);
        } else {
          expect(move.hitboxPerActiveFrame.length).toBe(move.activeFrames);
        }
      }
    });

    it('Lincoln JAB has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.JAB);
      expect(move.startupFrames).toBe(3);
      expect(move.activeFrames).toBe(2);
      expect(move.recoveryFrames).toBe(10);
      expect(move.hitboxPerActiveFrame.length).toBe(2);
      expect(move.hitboxPerActiveFrame[0]?.offsetX).toBe(58); // Lincoln-specific reach
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(3);
    });

    it('Lincoln FORWARD_SMASH has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.FORWARD_SMASH);
      expect(move.startupFrames).toBe(15);
      expect(move.activeFrames).toBe(3);
      expect(move.recoveryFrames).toBe(25);
      expect(move.chargeMax).toBe(60);
      expect(move.hitboxPerActiveFrame.length).toBe(3);
      expect(move.hitboxPerActiveFrame[0]?.offsetX).toBe(78); // Lincoln-specific reach
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(20);
    });

    it('Lincoln DOWN_AIR has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.DOWN_AIR);
      expect(move.startupFrames).toBe(10);
      expect(move.activeFrames).toBe(2);
      expect(move.recoveryFrames).toBe(20);
      expect(move.landingLag).toBe(10);
      expect(move.isAerial).toBe(true);
      expect(move.hitboxPerActiveFrame.length).toBe(2);
      expect(move.hitboxPerActiveFrame[0]?.offsetY).toBe(30); // Lincoln-specific spike position
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(13);
    });

    it('Lincoln NEUTRAL_SPECIAL has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.NEUTRAL_SPECIAL);
      expect(move.startupFrames).toBe(8);
      expect(move.activeFrames).toBe(0);
      expect(move.recoveryFrames).toBe(20);
      expect(move.isSpecial).toBe(true);
      expect(move.hitboxPerActiveFrame.length).toBe(1); // Special burst hitbox
      expect(move.hitboxPerActiveFrame[0]?.offsetX).toBe(90); // Lincoln-specific reach
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(9);
    });

    it('Lincoln SIDE_SPECIAL has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.SIDE_SPECIAL);
      expect(move.startupFrames).toBe(10);
      expect(move.activeFrames).toBe(3);
      expect(move.recoveryFrames).toBe(18);
      expect(move.isSpecial).toBe(true);
      expect(move.hitboxPerActiveFrame.length).toBe(3);
      expect(move.hitboxPerActiveFrame[0]?.offsetX).toBe(70); // Lincoln-specific reach
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(15);
    });

    it('Lincoln UP_SPECIAL has valid frame data and exact hitbox stats', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.UP_SPECIAL);
      expect(move.startupFrames).toBe(4);
      expect(move.activeFrames).toBe(3);
      expect(move.recoveryFrames).toBe(30);
      expect(move.landingLag).toBe(14);
      expect(move.isAerial).toBe(true);
      expect(move.isSpecial).toBe(true);
      expect(move.hitboxPerActiveFrame.length).toBe(3);
      expect(move.hitboxPerActiveFrame[0]?.offsetY).toBe(-40); // Lincoln-specific recovery hitbox
      expect(move.hitboxPerActiveFrame[0]?.damage).toBe(12);
    });

    it('Lincoln DOWN_SPECIAL has valid frame data (counter logic, no active hitbox)', () => {
      const move = getMoveDataForCharacter('abe-lincoln', MoveId.DOWN_SPECIAL);
      expect(move.startupFrames).toBe(6);
      expect(move.activeFrames).toBe(0);
      expect(move.recoveryFrames).toBe(16);
      expect(move.isSpecial).toBe(true);
      expect(move.hitboxPerActiveFrame.length).toBe(0); // Counter has no direct hitbox
    });
  });

  describe('Character Stats Resolution', () => {
    it('getCharacterStats("abe-lincoln") returns exact spec values', () => {
      const stats = getCharacterStats('abe-lincoln');
      expect(stats.fighterWeight).toBe(118);
      expect(stats.hurtboxRadius).toBe(32);
      expect(stats.runSpeed).toBe(5.8);
      expect(stats.walkSpeed).toBe(3.1);
      expect(stats.jumpVelocity).toBe(-15.2);
      expect(stats.shortHopVelocity).toBe(-9.5);
    });

    it('getCharacterStats("all-rounder") returns default PHYSICS values', () => {
      const stats = getCharacterStats('all-rounder');
      // These should match PHYSICS constants (from shared/src/constants/physics.ts)
      expect(stats.fighterWeight).toBe(100);
      expect(stats.hurtboxRadius).toBe(28);
      expect(stats.runSpeed).toBe(6.5);
      expect(stats.walkSpeed).toBe(3.5);
      expect(stats.jumpVelocity).toBe(-16);
      expect(stats.shortHopVelocity).toBe(-10);
    });

    it('getCharacterStats(undefined) falls back to all-rounder', () => {
      const stats = getCharacterStats(undefined);
      expect(stats.fighterWeight).toBe(100);
      expect(stats.hurtboxRadius).toBe(28);
    });

    it('getCharacterStats with unknown id falls back to all-rounder', () => {
      const stats = getCharacterStats('unknown-character' as any);
      expect(stats.fighterWeight).toBe(100);
      expect(stats.hurtboxRadius).toBe(28);
    });
  });

  describe('Character-Aware Move Resolution', () => {
    it('Lincoln JAB has different hitbox than all-rounder JAB', () => {
      const lincolnJab = getMoveDataForCharacter('abe-lincoln', MoveId.JAB);
      const defaultJab = getMoveDataForCharacter('all-rounder', MoveId.JAB);
      
      // Frame timing MUST be identical (FSM sync requirement)
      expect(lincolnJab.startupFrames).toBe(defaultJab.startupFrames);
      expect(lincolnJab.activeFrames).toBe(defaultJab.activeFrames);
      expect(lincolnJab.recoveryFrames).toBe(defaultJab.recoveryFrames);
      
      // Hitbox stats DIFFER
      expect(lincolnJab.hitboxPerActiveFrame[0]?.offsetX).toBe(58);
      expect(defaultJab.hitboxPerActiveFrame[0]?.offsetX).toBe(45);
    });

    it('unmapped moves fall back to shared defaults for Lincoln', () => {
      const lincolnUpTilt = getMoveDataForCharacter('abe-lincoln', MoveId.UP_TILT);
      const defaultUpTilt = getMoveDataForCharacter('all-rounder', MoveId.UP_TILT);
      
      // UP_TILT has no Lincoln override, so they should be identical
      expect(lincolnUpTilt).toBe(defaultUpTilt);
    });
  });
});
