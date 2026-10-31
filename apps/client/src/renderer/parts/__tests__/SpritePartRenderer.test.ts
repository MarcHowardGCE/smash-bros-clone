import { describe, expect, it } from 'vitest';
import type { CharacterId } from '@smash/shared';
import { Rectangle, Texture } from 'pixi.js';
import { getAnimationPose, type JointPose } from '../../animations.js';
import { PolygonPartRenderer } from '../PolygonPartRenderer.js';
import {
  FIGHTER_VISUAL_CONTRACTS,
  SLOT_COLORS,
  clampSlotIndex,
  type FighterPartVisualContract,
} from '../assetContract.js';
import type { FighterPart, PartTransform, PatternDescriptor } from '../IPartRenderer.js';
import { getPartTransforms } from '../poseAdapter.js';
import { SpritePartRenderer, type TextureProvider } from '../SpritePartRenderer.js';

const PART_DRAW_ORDER: readonly FighterPart[] = ['LEG_L', 'LEG_R', 'BODY', 'ARM_L', 'ARM_R', 'HEAD'] as const;
const IDENTITY_PATTERN: PatternDescriptor = {
  kind: 'solid',
  primaryColor: 0xffffff,
  secondaryColor: 0x000000,
};
const FLOAT_TOLERANCE = 0.5;

function buildTexture(origWidth: number, origHeight: number): Texture {
  return new Texture({
    source: Texture.WHITE.source,
    frame: new Rectangle(0, 0, origWidth, origHeight),
    orig: new Rectangle(0, 0, origWidth, origHeight),
  });
}

function createContractTextureProvider(characterId: CharacterId): TextureProvider {
  return {
    getTexture(_cid: CharacterId, part: FighterPart): Texture {
      const logical = FIGHTER_VISUAL_CONTRACTS[characterId].parts[part].logicalCanvas;
      return buildTexture(logical.width, logical.height);
    },
  };
}

function createScaledDensityTextureProvider(characterId: CharacterId, scaleFactor: number): TextureProvider {
  return {
    getTexture(_cid: CharacterId, part: FighterPart): Texture {
      const logical = FIGHTER_VISUAL_CONTRACTS[characterId].parts[part].logicalCanvas;
      return buildTexture(logical.width * scaleFactor, logical.height * scaleFactor);
    },
  };
}

function applyPoseToRenderers(
  spriteRenderer: SpritePartRenderer,
  polygonRenderer: PolygonPartRenderer,
  pose: JointPose,
): Record<FighterPart, PartTransform> {
  const transforms = getPartTransforms(pose, spriteRenderer.slotIndex);
  for (const part of PART_DRAW_ORDER) {
    spriteRenderer.draw(part, transforms[part], IDENTITY_PATTERN);
    polygonRenderer.draw(part, transforms[part], IDENTITY_PATTERN);
  }
  return transforms;
}

function getJointGlobal(spriteRenderer: SpritePartRenderer, part: FighterPart): { x: number; y: number } {
  const sprite = spriteRenderer.getDisplayObject(part);
  return {
    x: sprite.worldTransform.tx,
    y: sprite.worldTransform.ty,
  };
}

function getReferenceBoundsGlobal(
  spriteRenderer: SpritePartRenderer,
  part: FighterPart,
  contract: FighterPartVisualContract,
): { x: number; y: number; width: number; height: number } {
  const sprite = spriteRenderer.getDisplayObject(part);

  const boundsLeft = contract.referenceBoundsLogical.x;
  const boundsTop = contract.referenceBoundsLogical.y;
  const boundsRight = contract.referenceBoundsLogical.x + contract.referenceBoundsLogical.width;
  const boundsBottom = contract.referenceBoundsLogical.y + contract.referenceBoundsLogical.height;

  const localLeft = boundsLeft - contract.logicalCanvas.width * contract.anchor.x;
  const localTop = boundsTop - contract.logicalCanvas.height * contract.anchor.y;
  const localRight = boundsRight - contract.logicalCanvas.width * contract.anchor.x;
  const localBottom = boundsBottom - contract.logicalCanvas.height * contract.anchor.y;

  const points = [
    sprite.toGlobal({ x: localLeft, y: localTop }),
    sprite.toGlobal({ x: localRight, y: localTop }),
    sprite.toGlobal({ x: localRight, y: localBottom }),
    sprite.toGlobal({ x: localLeft, y: localBottom }),
  ];

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function getReferenceBoundsGlobalFromDisplayObject(
  part: FighterPart,
  displayObject: ReturnType<PolygonPartRenderer['getDisplayObject']>,
  contract: FighterPartVisualContract,
  transform: PartTransform,
): { x: number; y: number; width: number; height: number } {
  const boundsLeft = contract.referenceBoundsLogical.x;
  const boundsTop = contract.referenceBoundsLogical.y;
  const boundsRight = contract.referenceBoundsLogical.x + contract.referenceBoundsLogical.width;
  const boundsBottom = contract.referenceBoundsLogical.y + contract.referenceBoundsLogical.height;

  const localLeftUnscaled = boundsLeft - contract.logicalCanvas.width * contract.anchor.x;
  const localTopUnscaled = boundsTop - contract.logicalCanvas.height * contract.anchor.y;
  const localRightUnscaled = boundsRight - contract.logicalCanvas.width * contract.anchor.x;
  const localBottomUnscaled = boundsBottom - contract.logicalCanvas.height * contract.anchor.y;

  const usesBodyVertexScaling = part === 'BODY';
  const localScaleX = usesBodyVertexScaling ? transform.scaleX : 1;
  const localScaleY = usesBodyVertexScaling ? transform.scaleY : 1;

  const localLeft = localLeftUnscaled * localScaleX;
  const localTop = localTopUnscaled * localScaleY;
  const localRight = localRightUnscaled * localScaleX;
  const localBottom = localBottomUnscaled * localScaleY;

  const points = [
    displayObject.toGlobal({ x: localLeft, y: localTop }),
    displayObject.toGlobal({ x: localRight, y: localTop }),
    displayObject.toGlobal({ x: localRight, y: localBottom }),
    displayObject.toGlobal({ x: localLeft, y: localBottom }),
  ];

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

describe('SpritePartRenderer', () => {
  it('creates one sprite per part in polygon z-order and applies contract anchors', () => {
    const renderer = new SpritePartRenderer('all-rounder', 2, createContractTextureProvider('all-rounder'));
    const contract = FIGHTER_VISUAL_CONTRACTS['all-rounder'];

    expect(renderer.container.children).toHaveLength(6);

    const labels = renderer.container.children.map((child) => child.label);
    expect(labels).toEqual(PART_DRAW_ORDER.map((part) => `sprite-${part}`));

    for (const part of PART_DRAW_ORDER) {
      const sprite = renderer.getDisplayObject(part);
      expect(sprite.anchor.x).toBe(contract.parts[part].anchor.x);
      expect(sprite.anchor.y).toBe(contract.parts[part].anchor.y);
    }
  });

  it('matches polygon renderer joint world positions and reference bounds within 0.5px across representative poses', () => {
    const fixtureCases: ReadonlyArray<{
      readonly name: string;
      readonly characterId: CharacterId;
      readonly slotIndex: number;
      readonly pose: JointPose;
      readonly facing: number;
    }> = [
      {
        name: 'neutral-all-rounder',
        characterId: 'all-rounder',
        slotIndex: 0,
        pose: getAnimationPose('IDLE', 0, null, 'all-rounder'),
        facing: 1,
      },
      {
        name: 'squash-stretch-all-rounder',
        characterId: 'all-rounder',
        slotIndex: 1,
        pose: {
          leftArmAngle: 0.7,
          rightArmAngle: -0.9,
          leftLegAngle: 0.4,
          rightLegAngle: -0.5,
          bodyScaleX: 1.15,
          bodyScaleY: 0.82,
          headOffsetX: 3,
          headOffsetY: -4,
        },
        facing: 1,
      },
      {
        name: 'lincoln-pose',
        characterId: 'abe-lincoln',
        slotIndex: 2,
        pose: getAnimationPose('RUN', 9, null, 'abe-lincoln'),
        facing: 1,
      },
      {
        name: 'facing-flipped',
        characterId: 'swift',
        slotIndex: 3,
        pose: getAnimationPose('WALK', 4, null, 'swift'),
        facing: -1,
      },
    ];

    for (const fixtureCase of fixtureCases) {
      const spriteRenderer = new SpritePartRenderer(
        fixtureCase.characterId,
        fixtureCase.slotIndex,
        createContractTextureProvider(fixtureCase.characterId),
      );
      const polygonRenderer = new PolygonPartRenderer(fixtureCase.slotIndex, fixtureCase.characterId);

      spriteRenderer.container.scale.x = fixtureCase.facing;
      polygonRenderer.container.scale.x = fixtureCase.facing;

      const transforms = applyPoseToRenderers(spriteRenderer, polygonRenderer, fixtureCase.pose);

      const contract = FIGHTER_VISUAL_CONTRACTS[fixtureCase.characterId];

      for (const part of PART_DRAW_ORDER) {
        const spriteJoint = getJointGlobal(spriteRenderer, part);
        const polygonJoint = {
          x: polygonRenderer.getDisplayObject(part).worldTransform.tx,
          y: polygonRenderer.getDisplayObject(part).worldTransform.ty,
        };

        expect(spriteJoint.x).toBeCloseTo(polygonJoint.x, 1);
        expect(spriteJoint.y).toBeCloseTo(polygonJoint.y, 1);

        const spriteBounds = getReferenceBoundsGlobal(spriteRenderer, part, contract.parts[part]);
        const polygonBounds = getReferenceBoundsGlobalFromDisplayObject(
          part,
          polygonRenderer.getDisplayObject(part),
          contract.parts[part],
          transforms[part],
        );

        expect(Math.abs(spriteBounds.x - polygonBounds.x)).toBeLessThanOrEqual(FLOAT_TOLERANCE);
        expect(Math.abs(spriteBounds.y - polygonBounds.y)).toBeLessThanOrEqual(FLOAT_TOLERANCE);
        expect(Math.abs(spriteBounds.width - polygonBounds.width)).toBeLessThanOrEqual(FLOAT_TOLERANCE);
        expect(Math.abs(spriteBounds.height - polygonBounds.height)).toBeLessThanOrEqual(FLOAT_TOLERANCE);
      }
    }
  });

  it('parity check is non-vacuous: perturbing anchor by 0.1 breaks bounds parity', () => {
    const characterId: CharacterId = 'all-rounder';
    const slotIndex = 0;
    const pose = getAnimationPose('IDLE', 0, null, characterId);

    const spriteRenderer = new SpritePartRenderer(characterId, slotIndex, createContractTextureProvider(characterId));
    const polygonRenderer = new PolygonPartRenderer(slotIndex, characterId);
    const transforms = applyPoseToRenderers(spriteRenderer, polygonRenderer, pose);

    const bodyPart = 'BODY' as const;
    const contract = FIGHTER_VISUAL_CONTRACTS[characterId].parts[bodyPart];
    const perturbedContract: FighterPartVisualContract = {
      ...contract,
      anchor: {
        x: contract.anchor.x + 0.1,
        y: contract.anchor.y,
      },
    };

    const spriteBoundsWithPerturbedAnchor = getReferenceBoundsGlobal(
      spriteRenderer,
      bodyPart,
      perturbedContract,
    );
    const polygonBounds = getReferenceBoundsGlobalFromDisplayObject(
      bodyPart,
      polygonRenderer.getDisplayObject(bodyPart),
      contract,
      transforms[bodyPart],
    );

    expect(Math.abs(spriteBoundsWithPerturbedAnchor.x - polygonBounds.x)).toBeGreaterThan(FLOAT_TOLERANCE);
  });

  it('computes fit scale from texture.orig (meta.scale=2 fixture gives 1.0, mismatched density gives non-1.0)', () => {
    const rendererAtMetaScale2 = new SpritePartRenderer('all-rounder', 0, createContractTextureProvider('all-rounder'));
    const headAtMetaScale2 = rendererAtMetaScale2.getDisplayObject('HEAD');
    expect(headAtMetaScale2.scale.x).toBe(1);
    expect(headAtMetaScale2.scale.y).toBe(1);

    const rendererMismatchedDensity = new SpritePartRenderer('all-rounder', 0, createScaledDensityTextureProvider('all-rounder', 2));
    const headMismatchedDensity = rendererMismatchedDensity.getDisplayObject('HEAD');
    expect(headMismatchedDensity.scale.x).toBe(0.5);
    expect(headMismatchedDensity.scale.y).toBe(0.5);
  });

  it('applies SLOT_COLORS to tintable parts with slot clamp and keeps HEAD white', () => {
    const slotCases = [-1, 0, 1, 2, 3, 4] as const;

    for (const slotIndex of slotCases) {
      const renderer = new SpritePartRenderer('all-rounder', slotIndex, createContractTextureProvider('all-rounder'));
      const expectedTint = SLOT_COLORS[clampSlotIndex(slotIndex)]!;

      expect(renderer.slotIndex).toBe(clampSlotIndex(slotIndex));
      expect(renderer.characterId).toBe('all-rounder');

      expect(renderer.getDisplayObject('BODY').tint).toBe(expectedTint);
      expect(renderer.getDisplayObject('ARM_L').tint).toBe(expectedTint);
      expect(renderer.getDisplayObject('ARM_R').tint).toBe(expectedTint);
      expect(renderer.getDisplayObject('LEG_L').tint).toBe(expectedTint);
      expect(renderer.getDisplayObject('LEG_R').tint).toBe(expectedTint);
      expect(renderer.getDisplayObject('HEAD').tint).toBe(0xffffff);
    }
  });

  it('mirrors global joint coordinates when container.scale.x = -1', () => {
    const pose = getAnimationPose('RUN', 7, null, 'all-rounder');
    const spriteRenderer = new SpritePartRenderer('all-rounder', 0, createContractTextureProvider('all-rounder'));

    applyPoseToRenderers(spriteRenderer, new PolygonPartRenderer(0, 'all-rounder'), pose);

    const beforeMirror = getJointGlobal(spriteRenderer, 'ARM_L');
    const beforeMirrorOpposite = getJointGlobal(spriteRenderer, 'ARM_R');

    spriteRenderer.container.scale.x = -1;

    const afterMirror = getJointGlobal(spriteRenderer, 'ARM_L');
    const afterMirrorOpposite = getJointGlobal(spriteRenderer, 'ARM_R');

    expect(afterMirror.x).toBeCloseTo(-beforeMirror.x, 6);
    expect(afterMirror.y).toBeCloseTo(beforeMirror.y, 6);

    expect(afterMirrorOpposite.x).toBeCloseTo(-beforeMirrorOpposite.x, 6);
    expect(afterMirrorOpposite.y).toBeCloseTo(beforeMirrorOpposite.y, 6);
  });
});
