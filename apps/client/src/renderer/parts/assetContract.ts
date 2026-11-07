import type { MatchCharacterId } from '@smash/shared';
import type { FighterPart } from './IPartRenderer.js';

export const ASSET_DENSITY = 2 as const;

export const SLOT_COLORS = [0xFFFFFF, 0xFFC400, 0xE02020, 0x081442] as const;

export type SlotColor = (typeof SLOT_COLORS)[number];

export interface PixelSize {
  readonly width: number;
  readonly height: number;
}

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

export interface NormalizedAnchor {
  readonly x: number;
  readonly y: number;
}

export interface LogicalBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type FighterPartFilename =
  | 'head.png'
  | 'body.png'
  | 'arm_l.png'
  | 'arm_r.png'
  | 'leg_l.png'
  | 'leg_r.png';

export interface FighterPartVisualContract {
  readonly filename: FighterPartFilename;
  readonly rawCanvasPx: PixelSize;
  readonly logicalCanvas: PixelSize;
  readonly jointPx: PixelPoint;
  readonly anchor: NormalizedAnchor;
  readonly referenceBoundsLogical: LogicalBounds;
  readonly tintable: boolean;
}

export interface FighterVisualContract {
  readonly assetDensity: typeof ASSET_DENSITY;
  readonly parts: Record<FighterPart, FighterPartVisualContract>;
}

function createDefaultContract(): FighterVisualContract {
  return {
    assetDensity: ASSET_DENSITY,
    parts: {
      HEAD: {
        filename: 'head.png',
        rawCanvasPx: { width: 160, height: 160 },
        logicalCanvas: { width: 80, height: 80 },
        jointPx: { x: 80, y: 80 },
        anchor: { x: 0.5, y: 0.5 },
        referenceBoundsLogical: { x: 26, y: 26, width: 28, height: 28 },
        tintable: false,
      },
      BODY: {
        filename: 'body.png',
        rawCanvasPx: { width: 160, height: 160 },
        logicalCanvas: { width: 80, height: 80 },
        jointPx: { x: 80, y: 80 },
        anchor: { x: 0.5, y: 0.5 },
        referenceBoundsLogical: { x: 18, y: 18, width: 44, height: 44 },
        tintable: true,
      },
      ARM_L: {
        filename: 'arm_l.png',
        rawCanvasPx: { width: 64, height: 128 },
        logicalCanvas: { width: 32, height: 64 },
        jointPx: { x: 32, y: 8 },
        anchor: { x: 0.5, y: 0.0625 },
        referenceBoundsLogical: { x: 12.5, y: 4, width: 7, height: 22 },
        tintable: true,
      },
      ARM_R: {
        filename: 'arm_r.png',
        rawCanvasPx: { width: 64, height: 128 },
        logicalCanvas: { width: 32, height: 64 },
        jointPx: { x: 32, y: 8 },
        anchor: { x: 0.5, y: 0.0625 },
        referenceBoundsLogical: { x: 12.5, y: 4, width: 7, height: 22 },
        tintable: true,
      },
      LEG_L: {
        filename: 'leg_l.png',
        rawCanvasPx: { width: 64, height: 128 },
        logicalCanvas: { width: 32, height: 64 },
        jointPx: { x: 32, y: 8 },
        anchor: { x: 0.5, y: 0.0625 },
        referenceBoundsLogical: { x: 12, y: 4, width: 8, height: 24 },
        tintable: true,
      },
      LEG_R: {
        filename: 'leg_r.png',
        rawCanvasPx: { width: 64, height: 128 },
        logicalCanvas: { width: 32, height: 64 },
        jointPx: { x: 32, y: 8 },
        anchor: { x: 0.5, y: 0.0625 },
        referenceBoundsLogical: { x: 12, y: 4, width: 8, height: 24 },
        tintable: true,
      },
    },
  };
}

export const FIGHTER_VISUAL_CONTRACTS: Record<MatchCharacterId, FighterVisualContract> = {
  'all-rounder': createDefaultContract(),
  'abe-lincoln': createDefaultContract(),
  'swift': createDefaultContract(),
};

export function clampSlotIndex(slotIndex: number): number {
  return Math.max(0, Math.min(3, slotIndex));
}

export function getSlotColor(slotIndex: number): SlotColor {
  return SLOT_COLORS[clampSlotIndex(slotIndex)]!;
}
