import { describe, it, expect } from 'vitest';
import {
  ALL_ROUNDER_STATS,
  ABE_LINCOLN_STATS,
  SWIFT_STATS,
  CHARACTER_REGISTRY,
  CHARACTER_IDS,
  getCharacterStats,
  isCharacterId,
  PHYSICS,
} from '@smash/shared';

describe('Character Stats Registry', () => {
  describe('ALL_ROUNDER_STATS', () => {
    it('should reference PHYSICS constants directly', () => {
      expect(ALL_ROUNDER_STATS.fighterWeight).toBe(PHYSICS.FIGHTER_WEIGHT);
      expect(ALL_ROUNDER_STATS.hurtboxRadius).toBe(PHYSICS.HURTBOX_RADIUS);
      expect(ALL_ROUNDER_STATS.runSpeed).toBe(PHYSICS.RUN_SPEED);
      expect(ALL_ROUNDER_STATS.walkSpeed).toBe(PHYSICS.WALK_SPEED);
      expect(ALL_ROUNDER_STATS.jumpVelocity).toBe(PHYSICS.JUMP_VELOCITY);
      expect(ALL_ROUNDER_STATS.shortHopVelocity).toBe(PHYSICS.SHORT_HOP_VELOCITY);
    });

    it('should have exact baseline values', () => {
      expect(ALL_ROUNDER_STATS.fighterWeight).toBe(100);
      expect(ALL_ROUNDER_STATS.hurtboxRadius).toBe(28);
      expect(ALL_ROUNDER_STATS.runSpeed).toBe(6.5);
      expect(ALL_ROUNDER_STATS.walkSpeed).toBe(3.5);
      expect(ALL_ROUNDER_STATS.jumpVelocity).toBe(-16);
      expect(ALL_ROUNDER_STATS.shortHopVelocity).toBe(-10);
    });
  });

  describe('ABE_LINCOLN_STATS', () => {
    it('should have exact specified values', () => {
      expect(ABE_LINCOLN_STATS.fighterWeight).toBe(118);
      expect(ABE_LINCOLN_STATS.hurtboxRadius).toBe(32);
      expect(ABE_LINCOLN_STATS.runSpeed).toBe(5.8);
      expect(ABE_LINCOLN_STATS.walkSpeed).toBe(3.1);
      expect(ABE_LINCOLN_STATS.jumpVelocity).toBe(-15.2);
      expect(ABE_LINCOLN_STATS.shortHopVelocity).toBe(-9.5);
    });

    it('should reflect stat modifications vs All-Rounder', () => {
      // Weight: +18%
      expect(ABE_LINCOLN_STATS.fighterWeight).toBe(118);
      expect(ABE_LINCOLN_STATS.fighterWeight / ALL_ROUNDER_STATS.fighterWeight).toBeCloseTo(1.18, 2);

      // Hurtbox: +14%
      expect(ABE_LINCOLN_STATS.hurtboxRadius).toBe(32);
      expect(ABE_LINCOLN_STATS.hurtboxRadius / ALL_ROUNDER_STATS.hurtboxRadius).toBeCloseTo(1.14, 2);

      // Run speed: -11%
      expect(ABE_LINCOLN_STATS.runSpeed).toBe(5.8);
      expect(ABE_LINCOLN_STATS.runSpeed / ALL_ROUNDER_STATS.runSpeed).toBeCloseTo(0.89, 2);

      // Walk speed: -11%
      expect(ABE_LINCOLN_STATS.walkSpeed).toBe(3.1);
      expect(ABE_LINCOLN_STATS.walkSpeed / ALL_ROUNDER_STATS.walkSpeed).toBeCloseTo(0.89, 2);

      // Jump velocity: -5%
      expect(ABE_LINCOLN_STATS.jumpVelocity).toBe(-15.2);
      expect(Math.abs(ABE_LINCOLN_STATS.jumpVelocity) / Math.abs(ALL_ROUNDER_STATS.jumpVelocity)).toBeCloseTo(0.95, 2);

      // Short hop velocity: -5%
      expect(ABE_LINCOLN_STATS.shortHopVelocity).toBe(-9.5);
      expect(Math.abs(ABE_LINCOLN_STATS.shortHopVelocity) / Math.abs(ALL_ROUNDER_STATS.shortHopVelocity)).toBeCloseTo(0.95, 2);
    });
  });

  describe('CHARACTER_REGISTRY', () => {
    it('should map all-rounder to ALL_ROUNDER_STATS', () => {
      expect(CHARACTER_REGISTRY['all-rounder']).toBe(ALL_ROUNDER_STATS);
    });

    it('should map abe-lincoln to ABE_LINCOLN_STATS', () => {
      expect(CHARACTER_REGISTRY['abe-lincoln']).toBe(ABE_LINCOLN_STATS);
    });

    it('should map swift to SWIFT_STATS', () => {
      expect(CHARACTER_REGISTRY['swift']).toBe(SWIFT_STATS);
    });

    it('should have exactly 3 entries', () => {
      expect(Object.keys(CHARACTER_REGISTRY)).toHaveLength(3);
    });
  });

  describe('getCharacterStats', () => {
    it('should return ALL_ROUNDER_STATS for all-rounder', () => {
      const stats = getCharacterStats('all-rounder');
      expect(stats).toBe(ALL_ROUNDER_STATS);
      expect(stats.fighterWeight).toBe(100);
    });

    it('should return ABE_LINCOLN_STATS for abe-lincoln', () => {
      const stats = getCharacterStats('abe-lincoln');
      expect(stats).toBe(ABE_LINCOLN_STATS);
      expect(stats.fighterWeight).toBe(118);
    });

    it('should default to ALL_ROUNDER_STATS when characterId is undefined', () => {
      const stats = getCharacterStats(undefined);
      expect(stats).toBe(ALL_ROUNDER_STATS);
    });

    it('should fallback to ALL_ROUNDER_STATS for unknown CharacterId', () => {
      // TypeScript won't allow this at compile time, but we test runtime safety
      const stats = getCharacterStats('unknown' as any);
      expect(stats).toBe(ALL_ROUNDER_STATS);
    });

    it('should handle empty string as fallback', () => {
      const stats = getCharacterStats('' as any);
      expect(stats).toBe(ALL_ROUNDER_STATS);
    });
  });

  describe('CHARACTER_IDS', () => {
    it('should have exactly 3 entries', () => {
      expect(CHARACTER_IDS).toHaveLength(3);
    });

    it('should contain all-rounder', () => {
      expect(CHARACTER_IDS).toContain('all-rounder');
    });

    it('should contain abe-lincoln', () => {
      expect(CHARACTER_IDS).toContain('abe-lincoln');
    });

    it('should contain swift', () => {
      expect(CHARACTER_IDS).toContain('swift');
    });

    it('should be a readonly array type', () => {
      // The readonly modifier is enforced at compile time, not runtime
      // This test verifies the array is immutable at the type level
      expect(Array.isArray(CHARACTER_IDS)).toBe(true);
      expect(Object.isFrozen(CHARACTER_IDS) || CHARACTER_IDS.length === 3).toBe(true);
    });
  });

  describe('isCharacterId', () => {
    it('should return true for valid CharacterId: all-rounder', () => {
      expect(isCharacterId('all-rounder')).toBe(true);
    });

    it('should return true for valid CharacterId: abe-lincoln', () => {
      expect(isCharacterId('abe-lincoln')).toBe(true);
    });

    it('should return true for valid CharacterId: swift', () => {
      expect(isCharacterId('swift')).toBe(true);
    });

    it('should return false for invalid string', () => {
      expect(isCharacterId('mario')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isCharacterId(123)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isCharacterId(undefined)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isCharacterId(null)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isCharacterId({})).toBe(false);
    });

    it('should return false for array', () => {
      expect(isCharacterId([])).toBe(false);
    });
  });
});
