import { describe, it, expect, vi } from 'vitest';
import { Container, Graphics, Rectangle, Texture } from 'pixi.js';
import { FighterRenderer } from '../FighterRenderer';
import type { FighterPart, IPartRenderer } from '../parts/IPartRenderer';
import type { TextureProvider } from '../parts/SpritePartRenderer';
import * as partsFactory from '../parts/index';

type RenderableState = {
  x: number;
  y: number;
  facing: 1 | -1;
  isInvincible: boolean;
  isKnockedOut: boolean;
  isShielding: boolean;
  shieldHealth: number;
  state: string;
  stateFrame: number;
  slotIndex: number;
  currentMoveId: null;
};

function makePlayerState(overrides: Partial<RenderableState> = {}): RenderableState {
  return {
    x: 100,
    y: 200,
    facing: 1,
    isInvincible: false,
    isKnockedOut: false,
    isShielding: false,
    shieldHealth: 100,
    state: 'IDLE',
    stateFrame: 0,
    slotIndex: 0,
    currentMoveId: null,
    ...overrides,
  };
}

function getPartRenderer(renderer: FighterRenderer): IPartRenderer {
  return (renderer as unknown as { partRenderer: IPartRenderer }).partRenderer;
}

const PART_DRAW_ORDER: readonly FighterPart[] = ['LEG_L', 'LEG_R', 'BODY', 'ARM_L', 'ARM_R', 'HEAD'] as const;

function buildTexture(origWidth: number, origHeight: number): Texture {
  return new Texture({
    source: Texture.WHITE.source,
    frame: new Rectangle(0, 0, origWidth, origHeight),
    orig: new Rectangle(0, 0, origWidth, origHeight),
  });
}

function createSpriteFixture(): {
  readonly options: { readonly mode: 'sprite'; readonly textureProvider: TextureProvider };
  readonly textures: Record<FighterPart, Texture>;
} {
  const textures: Record<FighterPart, Texture> = {
    HEAD: buildTexture(160, 160),
    BODY: buildTexture(160, 160),
    ARM_L: buildTexture(64, 128),
    ARM_R: buildTexture(64, 128),
    LEG_L: buildTexture(64, 128),
    LEG_R: buildTexture(64, 128),
  };

  const textureProvider: TextureProvider = {
    getTexture(_characterId, part) {
      return textures[part];
    },
  };

  return {
    options: {
      mode: 'sprite',
      textureProvider,
    },
    textures,
  };
}

type RendererCase = {
  readonly name: 'polygon' | 'sprite';
  readonly createOptions: () => {
    readonly options?: { readonly mode: 'sprite'; readonly textureProvider: TextureProvider };
    readonly textures?: Record<FighterPart, Texture>;
  };
};

const RENDERER_CASES: readonly RendererCase[] = [
  {
    name: 'polygon',
    createOptions: () => ({}),
  },
  {
    name: 'sprite',
    createOptions: () => {
      const fixture = createSpriteFixture();
      return {
        options: fixture.options,
        textures: fixture.textures,
      };
    },
  },
] as const;

const SPRITE_RENDERER_CASE = RENDERER_CASES.find(
  (caseDef) => caseDef.name === 'sprite',
);

function createRendererForCase(caseDef: RendererCase): {
  readonly parent: Container;
  readonly renderer: FighterRenderer;
  readonly textures?: Record<FighterPart, Texture>;
} {
  const parent = new Container();
  const { options, textures } = caseDef.createOptions();
  const renderer = new FighterRenderer(parent, 0, 'all-rounder', options);

  return { parent, renderer, textures };
}

function getShieldBubble(renderer: FighterRenderer): Graphics {
  const shieldBubble = renderer.container.children.find((child) => child instanceof Graphics);
  if (!(shieldBubble instanceof Graphics)) {
    throw new Error('Shield bubble Graphics child not found.');
  }
  return shieldBubble;
}

describe('FighterRenderer', () => {
  describe('constructor wiring', () => {
    it('threads mode and provider into createPartRenderer', () => {
      const parent = new Container();
      const provider = {
        getTexture: () => Texture.EMPTY,
      };
      const createPartRendererSpy = vi.spyOn(partsFactory, 'createPartRenderer');

      new FighterRenderer(parent, 2, 'abe-lincoln', {
        mode: 'sprite',
        textureProvider: provider,
      });

      expect(createPartRendererSpy).toHaveBeenCalledWith('sprite', 2, 'abe-lincoln', provider);
    });

    it('throws a clear error when sprite mode is provided without a texture provider', () => {
      const parent = new Container();

      expect(() => {
        new FighterRenderer(parent, 0, undefined, { mode: 'sprite' });
      }).toThrowError('Sprite renderer mode requires a TextureProvider.');
    });
  });

  describe('destroy()', () => {
    for (const caseDef of RENDERER_CASES) {
      it(`calls container.destroy({ children: true }) in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);
        const destroySpy = vi.spyOn(renderer.container, 'destroy');

        renderer.destroy();

        expect(destroySpy).toHaveBeenCalledWith({ children: true });
      });

      it(`removes renderer container from parent in ${caseDef.name} mode`, () => {
        const { parent, renderer } = createRendererForCase(caseDef);

        expect(parent.children).toContain(renderer.container);

        renderer.destroy();

        expect(parent.children).not.toContain(renderer.container);
      });
    }

    it('keeps shared sprite textures alive after destroy() in sprite mode', () => {
      if (!SPRITE_RENDERER_CASE) {
        throw new Error('Sprite renderer case not found.');
      }

      const { renderer, textures } = createRendererForCase(SPRITE_RENDERER_CASE);
      if (!textures) {
        throw new Error('Sprite textures fixture missing.');
      }

      renderer.destroy();

      for (const part of PART_DRAW_ORDER) {
        expect(textures[part].destroyed).toBe(false);
      }
    });
  });

  describe('update()', () => {
    it('should set container position, facing, and alpha from player state', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      renderer.update({
        x: 100,
        y: 200,
        facing: -1,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        state: 'IDLE',
        stateFrame: 0,
        slotIndex: 0,
        currentMoveId: null,
      });

      expect(renderer.container.x).toBe(100);
      expect(renderer.container.y).toBe(200);
      expect(renderer.container.scale.x).toBe(-1);
      expect(renderer.container.alpha).toBe(1.0);
    });

    for (const caseDef of RENDERER_CASES) {
      it(`dirty-check keeps draw call count flat when state/stateFrame unchanged in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);
        const partRenderer = getPartRenderer(renderer);
        const drawSpy = vi.spyOn(partRenderer, 'draw');

        const player = makePlayerState({
          x: 50,
          y: 50,
          state: 'IDLE',
          stateFrame: 5,
        });

        renderer.update(player);
        expect(drawSpy).toHaveBeenCalledTimes(6);

        renderer.update({ ...player, x: 60 });
        renderer.update({ ...player, x: 70 });

        expect(drawSpy).toHaveBeenCalledTimes(6);
      });
    }

    for (const caseDef of RENDERER_CASES) {
      it(`applies invincibility alpha 0.4 in ${caseDef.name} mode`, () => {
        const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(200);
        try {
          const { renderer } = createRendererForCase(caseDef);

          renderer.update(makePlayerState({ isInvincible: true }));

          expect(renderer.container.alpha).toBe(0.4);
        } finally {
          nowSpy.mockRestore();
        }
      });
    }

    for (const caseDef of RENDERER_CASES) {
      it(`drives KO effect rotation and reset identically in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);
        const partRenderer = getPartRenderer(renderer);

        renderer.update(makePlayerState({ isKnockedOut: true, stateFrame: 1 }));

        expect(partRenderer.container.rotation).toBeGreaterThan(0);

        renderer.update(makePlayerState({ isKnockedOut: false, stateFrame: 2 }));

        expect(partRenderer.container.rotation).toBe(0);
      });
    }
  });

  describe('getPart()', () => {
    it('should return the display object for a given FighterPart', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      const head = renderer.getPart('HEAD');
      expect(head).toBeDefined();
      expect(head).toBeInstanceOf(Container);
    });
  });

  describe('shield bubble', () => {
    for (const caseDef of RENDERER_CASES) {
      it(`shows shield bubble when shielding in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);

        renderer.update(makePlayerState({ isShielding: true, shieldHealth: 100, state: 'SHIELD' }));

        expect(getShieldBubble(renderer).visible).toBe(true);
      });

      it(`hides shield bubble when shielding stops in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);
        renderer.update(makePlayerState({ isShielding: true, shieldHealth: 100, state: 'SHIELD' }));

        const shieldBubble = getShieldBubble(renderer);
        expect(shieldBubble.visible).toBe(true);

        renderer.update(makePlayerState({ isShielding: false, shieldHealth: 100, state: 'SHIELD', stateFrame: 1 }));

        expect(shieldBubble.visible).toBe(false);
      });

      it(`hides shield bubble immediately on shield break in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);

        renderer.update(makePlayerState({ isShielding: true, shieldHealth: 5, state: 'SHIELD' }));

        const shieldBubble = getShieldBubble(renderer);
        expect(shieldBubble.visible).toBe(true);

        renderer.update(makePlayerState({ isShielding: false, shieldHealth: 0, state: 'IDLE', stateFrame: 1 }));

        expect(shieldBubble.visible).toBe(false);
      });

      it(`starts with shield bubble hidden in ${caseDef.name} mode`, () => {
        const { renderer } = createRendererForCase(caseDef);

        renderer.update(makePlayerState());

        expect(getShieldBubble(renderer).visible).toBe(false);
      });
    }
  });

  describe('hit flash', () => {
    it('applies tint fallback when part renderer does not implement setHitFlash', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);
      const partRenderer = getPartRenderer(renderer);

      renderer.startHitFlash();

      expect(partRenderer.container.tint).toBe(0xffdd44);

      for (let frame = 1; frame <= 4; frame++) {
        renderer.update(makePlayerState({ stateFrame: frame }));
      }

      expect(partRenderer.container.tint).toBe(0xffffff);
    });

    it('uses setHitFlash when available and keeps container tint at default', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);
      const partRenderer = getPartRenderer(renderer);
      const calls: boolean[] = [];

      partRenderer.setHitFlash = (active: boolean) => {
        calls.push(active);
      };

      renderer.startHitFlash();

      for (let frame = 1; frame <= 4; frame++) {
        renderer.update(makePlayerState({ stateFrame: frame }));
      }

      expect(calls).toEqual([true, false]);
      expect(partRenderer.container.tint).toBe(0xffffff);
    });
  });
});
