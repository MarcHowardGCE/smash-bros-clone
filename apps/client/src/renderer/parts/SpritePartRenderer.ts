/**
 * @fileoverview Sprite-based fighter part renderer (stub).
 *
 * Implements {@link IPartRenderer} using PixiJS {@link Sprite} instances.
 * Currently a stub — no art assets exist yet. When sprite art ships, this
 * class will load a texture atlas and select frames per animation state.
 * See ROADMAP.md "Visuals" section for sprite art requirements.
 */
import { Container, Filter, GlProgram, GpuProgram } from 'pixi.js';
import { Sprite } from 'pixi.js';
import type { FighterPart, IPartRenderer, PartTransform, PatternDescriptor } from './IPartRenderer';

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

/**
 * Sprite-based fighter part renderer.
 * 
 * Currently a stub implementation — no art assets exist yet.
 * When sprite art is available, this will:
 * - Load a texture atlas
 * - Create Sprite instances per part
 * - Apply frame selection based on animation state
 * 
 * See ROADMAP.md Visuals section for sprite art requirements.
 */
export class SpritePartRenderer implements IPartRenderer {
  readonly container: Container;
  private atlasPath: string;
  private displayObjects: Map<FighterPart, Sprite>;

  /**
   * Create a sprite renderer for a fighter part.
   * 
   * @param atlasPath - Path to the texture atlas (e.g., 'assets/fighter-atlas.png')
   *                    Not loaded until textures are available.
   */
  constructor(atlasPath: string) {
    this.atlasPath = atlasPath;
    this.container = new Container();
    this.displayObjects = new Map();
  }

  setHitFlash(active: boolean): void {
    applyHitFlash(this.container, active);
  }

  /**
   * Get or create a Sprite display object for a fighter part.
   * 
   * @param part - The body part (HEAD, BODY, ARM_L, etc.)
   * @returns A PixiJS Sprite instance for this part
   */
  getDisplayObject(part: FighterPart): Sprite {
    if (!this.displayObjects.has(part)) {
      // Create a placeholder sprite (no texture yet)
      const sprite = new Sprite();
      sprite.name = `sprite-${part}`;
      this.displayObjects.set(part, sprite);
    }
    return this.displayObjects.get(part)!;
  }

  /**
   * Draw a fighter part with sprite rendering.
   * 
   * Currently throws an error because no art assets exist.
   * Once sprite art is available, this will:
   * - Select the appropriate frame from the texture atlas
   * - Apply the transform (position, rotation, scale)
   * - Apply the pattern (color tint or overlay)
   * 
   * @param part - The body part to render
   * @param transform - Position, rotation, and scale
   * @param pattern - Color and pattern descriptor
   * @throws Error indicating sprite art is not yet available
   */
  draw(part: FighterPart, transform: PartTransform, pattern: PatternDescriptor): void {
    throw new Error(
      'SpritePartRenderer not yet implemented — no art assets exist. ' +
      'See ROADMAP.md Visuals section for sprite art requirements.'
    );
  }
}
