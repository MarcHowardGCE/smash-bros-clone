import { describe, it, expect } from 'vitest';
import { MoveId } from '@smash/shared';
import { getMoveData } from './index.js';

describe('Move Definitions', () => {
  it('getMoveData(MoveId.JAB) returns correct startupFrames', () => {
    const jab = getMoveData(MoveId.JAB);
    expect(jab.startupFrames).toBe(3);
    expect(jab.id).toBe(MoveId.JAB);
    expect(jab.isAerial).toBe(false);
  });

  it('all 23 MoveId values resolve without throwing', () => {
    const moveIds = Object.values(MoveId);
    expect(moveIds).toHaveLength(23);
    for (const id of moveIds) {
      expect(() => getMoveData(id as MoveId)).not.toThrow();
    }
  });

  it('all moves have valid frame data (non-negative integers)', () => {
    for (const id of Object.values(MoveId)) {
      const move = getMoveData(id as MoveId);
      expect(move.startupFrames).toBeGreaterThanOrEqual(0);
      expect(move.activeFrames).toBeGreaterThanOrEqual(0);
      expect(move.recoveryFrames).toBeGreaterThanOrEqual(0);
    }
  });

  it('aerials have non-zero landingLag', () => {
    const aerials = [MoveId.NEUTRAL_AIR, MoveId.FORWARD_AIR, MoveId.BACK_AIR, MoveId.UP_AIR, MoveId.DOWN_AIR];
    for (const id of aerials) {
      const move = getMoveData(id);
      expect(move.landingLag).toBeGreaterThan(0);
      expect(move.isAerial).toBe(true);
    }
  });

  it('specials are marked isSpecial: true', () => {
    const specials = [MoveId.NEUTRAL_SPECIAL, MoveId.SIDE_SPECIAL, MoveId.UP_SPECIAL, MoveId.DOWN_SPECIAL];
    for (const id of specials) {
      expect(getMoveData(id).isSpecial).toBe(true);
    }
  });

  it('grab is marked isGrab: true', () => {
    expect(getMoveData(MoveId.GRAB).isGrab).toBe(true);
  });

  it('smash attacks have chargeMax defined', () => {
    const smashes = [MoveId.FORWARD_SMASH, MoveId.UP_SMASH, MoveId.DOWN_SMASH];
    for (const id of smashes) {
      expect(getMoveData(id).chargeMax).toBeDefined();
      expect(getMoveData(id).chargeMax).toBeGreaterThan(0);
    }
  });

  it('getMoveData throws for invalid id', () => {
    expect(() => getMoveData('INVALID' as MoveId)).toThrow();
  });
});
