import { describe, expect, it } from 'vitest';
import type { MatchCharacterId } from '@smash/shared';
import {
  ASSET_DENSITY,
  FIGHTER_VISUAL_CONTRACTS,
  SLOT_COLORS,
  clampSlotIndex,
} from '../assetContract.js';

// Derived from PolygonPartRenderer.ts geometry constants/accessory extents.
const HEAD_RADIUS = 14;
const HAT_EXTRA_ABOVE = 20;
const BEARD_EXTRA_BELOW = 10;
const BODY_RADIUS = 22;
const COATTAIL_EXTRA_BELOW = 12;

const CLOTHING_BASE_COLOR = 0xf5f5f5;
const LUMINANCE_DELTA_MIN = 0.12;

const CHARACTER_IDS: readonly MatchCharacterId[] = ['all-rounder', 'abe-lincoln', 'swift'];

function hexToUnitRgb(color: number): readonly [number, number, number] {
  return [((color >> 16) & 0xff) / 255, ((color >> 8) & 0xff) / 255, (color & 0xff) / 255] as const;
}

function multiplyRgb(
  lhs: readonly [number, number, number],
  rhs: readonly [number, number, number],
): readonly [number, number, number] {
  return [lhs[0] * rhs[0], lhs[1] * rhs[1], lhs[2] * rhs[2]] as const;
}

function srgbToLinear(component: number): number {
  return component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
}

describe('assetContract', () => {
  it('covers every MatchCharacterId with a typed FighterVisualContract', () => {
    expect(Object.keys(FIGHTER_VISUAL_CONTRACTS).sort()).toEqual([...CHARACTER_IDS].sort());
    for (const id of CHARACTER_IDS) {
      expect(FIGHTER_VISUAL_CONTRACTS[id].assetDensity).toBe(ASSET_DENSITY);
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('HEAD');
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('BODY');
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('ARM_L');
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('ARM_R');
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('LEG_L');
      expect(FIGHTER_VISUAL_CONTRACTS[id].parts).toHaveProperty('LEG_R');
    }
  });

  it('uses exact lowercase filenames and tintable flags', () => {
    const contract = FIGHTER_VISUAL_CONTRACTS['all-rounder'];
    expect(contract.parts.HEAD.filename).toBe('head.png');
    expect(contract.parts.BODY.filename).toBe('body.png');
    expect(contract.parts.ARM_L.filename).toBe('arm_l.png');
    expect(contract.parts.ARM_R.filename).toBe('arm_r.png');
    expect(contract.parts.LEG_L.filename).toBe('leg_l.png');
    expect(contract.parts.LEG_R.filename).toBe('leg_r.png');

    expect(contract.parts.HEAD.tintable).toBe(false);
    expect(contract.parts.BODY.tintable).toBe(true);
    expect(contract.parts.ARM_L.tintable).toBe(true);
    expect(contract.parts.ARM_R.tintable).toBe(true);
    expect(contract.parts.LEG_L.tintable).toBe(true);
    expect(contract.parts.LEG_R.tintable).toBe(true);
  });

  it('keeps anchor exactly jointPx/rawCanvasPx and each anchor component within [0,1]', () => {
    for (const characterId of CHARACTER_IDS) {
      const parts = FIGHTER_VISUAL_CONTRACTS[characterId].parts;
      for (const part of Object.values(parts)) {
        expect(part.anchor.x).toBe(part.jointPx.x / part.rawCanvasPx.width);
        expect(part.anchor.y).toBe(part.jointPx.y / part.rawCanvasPx.height);
        expect(part.anchor.x).toBeGreaterThanOrEqual(0);
        expect(part.anchor.x).toBeLessThanOrEqual(1);
        expect(part.anchor.y).toBeGreaterThanOrEqual(0);
        expect(part.anchor.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('sets logicalCanvas exactly to rawCanvasPx / 2 (asset density model)', () => {
    for (const characterId of CHARACTER_IDS) {
      const parts = FIGHTER_VISUAL_CONTRACTS[characterId].parts;
      for (const part of Object.values(parts)) {
        expect(part.logicalCanvas.width).toBe(part.rawCanvasPx.width / 2);
        expect(part.logicalCanvas.height).toBe(part.rawCanvasPx.height / 2);
      }
    }
  });

  it('matches referenceBounds dimensions to PolygonPartRenderer geometry', () => {
    const parts = FIGHTER_VISUAL_CONTRACTS['all-rounder'].parts;
    expect(parts.ARM_L.referenceBoundsLogical.width).toBe(7);
    expect(parts.ARM_L.referenceBoundsLogical.height).toBe(22);
    expect(parts.ARM_R.referenceBoundsLogical.width).toBe(7);
    expect(parts.ARM_R.referenceBoundsLogical.height).toBe(22);
    expect(parts.LEG_L.referenceBoundsLogical.width).toBe(8);
    expect(parts.LEG_L.referenceBoundsLogical.height).toBe(24);
    expect(parts.LEG_R.referenceBoundsLogical.width).toBe(8);
    expect(parts.LEG_R.referenceBoundsLogical.height).toBe(24);
    expect(parts.HEAD.referenceBoundsLogical.width).toBe(28);
    expect(parts.HEAD.referenceBoundsLogical.height).toBe(28);
    expect(parts.BODY.referenceBoundsLogical.width).toBe(44);
    expect(parts.BODY.referenceBoundsLogical.height).toBe(44);
  });

  it('provides required head/body headroom from PolygonPartRenderer-derived constants', () => {
    const parts = FIGHTER_VISUAL_CONTRACTS['all-rounder'].parts;

    const requiredHeadAbove = HEAD_RADIUS + HAT_EXTRA_ABOVE;
    const requiredHeadBelow = HEAD_RADIUS + BEARD_EXTRA_BELOW;
    const requiredBodyBelow = BODY_RADIUS + COATTAIL_EXTRA_BELOW;

    const headAbove = parts.HEAD.logicalCanvas.height * parts.HEAD.anchor.y;
    const headBelow = parts.HEAD.logicalCanvas.height * (1 - parts.HEAD.anchor.y);
    const bodyBelow = parts.BODY.logicalCanvas.height * (1 - parts.BODY.anchor.y);

    expect(headAbove).toBeGreaterThanOrEqual(requiredHeadAbove);
    expect(headBelow).toBeGreaterThanOrEqual(requiredHeadBelow);
    expect(bodyBelow).toBeGreaterThanOrEqual(requiredBodyBelow);
  });

  it('ensures all 6 pairwise slot-color luminance deltas are >= 0.12 after #F5F5F5 multiply', () => {
    const baseRgb = hexToUnitRgb(CLOTHING_BASE_COLOR);
    const postMultiplyLuminance = SLOT_COLORS.map((slotColor) =>
      relativeLuminance(multiplyRgb(hexToUnitRgb(slotColor), baseRgb)),
    );

    const pairwiseDeltas: number[] = [];
    for (let i = 0; i < postMultiplyLuminance.length; i += 1) {
      for (let j = i + 1; j < postMultiplyLuminance.length; j += 1) {
        pairwiseDeltas.push(Math.abs(postMultiplyLuminance[i]! - postMultiplyLuminance[j]!));
      }
    }

    expect(pairwiseDeltas).toHaveLength(6);
    for (const delta of pairwiseDeltas) {
      expect(delta).toBeGreaterThanOrEqual(LUMINANCE_DELTA_MIN);
    }
  });

  it('clamps slot index to [0,3] before indexing slot colors', () => {
    expect(clampSlotIndex(-1)).toBe(0);
    expect(clampSlotIndex(0)).toBe(0);
    expect(clampSlotIndex(3)).toBe(3);
    expect(clampSlotIndex(4)).toBe(3);
  });
});
