/**
 * @fileoverview Sprite-based fighter part renderer.
 *
 * Implements {@link IPartRenderer} using PixiJS {@link Sprite} instances.
 * Texture lookup is injected so this renderer stays synchronous and testable.
 */
import type { CharacterId } from '@smash/shared';
import { Container, Filter, GlProgram, GpuProgram, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FighterPart, IPartRenderer, PartTransform, PatternDescriptor } from './IPartRenderer';
import { FIGHTER_VISUAL_CONTRACTS, clampSlotIndex, getSlotColor } from './assetContract.js';

const PART_DRAW_ORDER: readonly FighterPart[] = ['LEG_L', 'LEG_R', 'BODY', 'ARM_L', 'ARM_R', 'HEAD'] as const;

export type TextureProvider = {
  getTexture(characterId: CharacterId, part: FighterPart): Texture;
};

const HIT_FLASH_COLOR = 0xffdd44;
const HIT_FLASH_R = ((HIT_FLASH_COLOR >> 16) & 0xff) / 255;
const HIT_FLASH_G = ((HIT_FLASH_COLOR >> 8) & 0xff) / 255;
const HIT_FLASH_B = (HIT_FLASH_COLOR & 0xff) / 255;

const FILTER_NAME = 'smash-hit-flash-color-replace';

const FILTER_VERTEX_GLSL = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const FILTER_FRAGMENT_GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;

void main(void)
{
    vec4 color = texture(uTexture, vTextureCoord);
    if (color.a <= 0.0) {
        finalColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    finalColor = vec4(${HIT_FLASH_R.toFixed(6)}, ${HIT_FLASH_G.toFixed(6)}, ${HIT_FLASH_B.toFixed(6)}, color.a);
}
`;

const FILTER_PROGRAM_WGSL = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>
};

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition: vec2<f32>,
) -> VSOutput {
  return VSOutput(
    filterVertexPosition(aPosition),
    filterTextureCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
) -> @location(0) vec4<f32> {
  let color = textureSample(uTexture, uSampler, uv);
  if (color.a <= 0.0) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  return vec4<f32>(${HIT_FLASH_R.toFixed(6)}, ${HIT_FLASH_G.toFixed(6)}, ${HIT_FLASH_B.toFixed(6)}, color.a);
}
`;

const SHARED_HIT_FLASH_FILTER = new Filter({
  glProgram: GlProgram.from({
    name: FILTER_NAME,
    vertex: FILTER_VERTEX_GLSL,
    fragment: FILTER_FRAGMENT_GLSL,
  }),
  gpuProgram: GpuProgram.from({
    name: FILTER_NAME,
    vertex: {
      source: FILTER_PROGRAM_WGSL,
      entryPoint: 'mainVertex',
    },
    fragment: {
      source: FILTER_PROGRAM_WGSL,
      entryPoint: 'mainFragment',
    },
  }),
});

export function getSharedHitFlashFilter(): Filter {
  return SHARED_HIT_FLASH_FILTER;
}

export function applyHitFlash(container: Container, active: boolean): void {
  if (active) {
    const existing = container.filters;
    if (existing?.includes(SHARED_HIT_FLASH_FILTER)) {
      return;
    }
    container.filters = [SHARED_HIT_FLASH_FILTER];
    return;
  }

  container.filters = null;
}

export class SpritePartRenderer implements IPartRenderer {
  readonly container: Container;

  private readonly fighterCharacterId: CharacterId;
  private readonly clampedSlotIndex: number;
  private readonly sprites: Record<FighterPart, Sprite>;
  private readonly fitScaleByPart: Record<FighterPart, number>;

  get characterId(): CharacterId {
    return this.fighterCharacterId;
  }

  get slotIndex(): number {
    return this.clampedSlotIndex;
  }

  constructor(characterId: CharacterId, slotIndex: number, textureProvider: TextureProvider) {
    this.fighterCharacterId = characterId;
    this.clampedSlotIndex = clampSlotIndex(slotIndex);
    this.container = new Container();

    const artId = characterId === 'moonshine' ? 'swift' : characterId === 'hulk-hoagie' ? 'abe-lincoln' : characterId;
    const contract = FIGHTER_VISUAL_CONTRACTS[artId];
    const sprites = {} as Record<FighterPart, Sprite>;
    const fitScaleByPart = {} as Record<FighterPart, number>;

    for (const part of PART_DRAW_ORDER) {
      const partContract = contract.parts[part];
      const texture = textureProvider.getTexture(artId, part);
      const fitScale = partContract.logicalCanvas.width / texture.orig.width;

      const sprite = new Sprite(texture);
      sprite.label = `sprite-${part}`;
      sprite.anchor.set(partContract.anchor.x, partContract.anchor.y);
      sprite.scale.set(fitScale, fitScale);
      sprite.tint = partContract.tintable ? getSlotColor(this.clampedSlotIndex) : 0xffffff;

      sprites[part] = sprite;
      fitScaleByPart[part] = fitScale;
      this.container.addChild(sprite);
    }

    this.sprites = sprites;
    this.fitScaleByPart = fitScaleByPart;
  }

  setHitFlash(active: boolean): void {
    applyHitFlash(this.container, active);
  }

  getDisplayObject(part: FighterPart): Sprite {
    return this.sprites[part];
  }

  draw(part: FighterPart, transform: PartTransform, pattern: PatternDescriptor): void {
    // Intentionally unused in sprite mode. Pattern is a polygon-era styling
    // channel; sprite tinting is driven by contract.tintable + slot color.
    void pattern;

    const sprite = this.sprites[part];
    const fitScale = this.fitScaleByPart[part];

    sprite.x = transform.x;
    sprite.y = transform.y;
    sprite.rotation = transform.rotation;
    sprite.scale.x = fitScale * transform.scaleX;
    sprite.scale.y = fitScale * transform.scaleY;
  }
}
