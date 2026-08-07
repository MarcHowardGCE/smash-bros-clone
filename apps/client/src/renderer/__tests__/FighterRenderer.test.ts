import { describe, it, expect, vi } from 'vitest';
import { Container } from 'pixi.js';
import { FighterRenderer } from '../FighterRenderer';

describe('FighterRenderer', () => {
  describe('destroy()', () => {
    it('should destroy the container and all children (6 part Graphics)', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      // Container should have been added to parent
      expect(parent.children).toContain(renderer.container);

      // The partRenderer container (with 6 Graphics children) is a child
      const partContainer = renderer.container.children[0] as Container;
      expect(partContainer.children.length).toBe(6);

      // Spy on container.destroy
      const destroySpy = vi.spyOn(renderer.container, 'destroy');

      renderer.destroy();

      // destroy({ children: true }) should have been called
      expect(destroySpy).toHaveBeenCalledWith({ children: true });
    });

    it('should remove the container from parent after destroy', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      expect(parent.children.length).toBe(1);
      renderer.destroy();
      expect(parent.children.length).toBe(0);
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

    it('should skip redraw when state and frame unchanged (dirty-check)', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      const player = {
        x: 50,
        y: 50,
        facing: 1 as const,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        state: 'IDLE',
        stateFrame: 5,
        slotIndex: 0,
        currentMoveId: null,
      };

      // First call triggers redraw
      renderer.update(player);

      // Get the part container's first child (LEG_L Graphics)
      const partContainer = renderer.container.children[0] as Container;
      const legGraphics = partContainer.children[0]!;
      const clearSpy = vi.spyOn(legGraphics as any, 'clear');

      // Second call with same state/frame - should NOT redraw
      renderer.update({ ...player, x: 60 });

      expect(clearSpy).not.toHaveBeenCalled();
    });
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
    const basePlayer = {
      x: 100,
      y: 200,
      facing: 1 as const,
      isInvincible: false,
      isKnockedOut: false,
      isShielding: false,
      shieldHealth: 100,
      state: 'SHIELD',
      stateFrame: 0,
      slotIndex: 0,
      currentMoveId: null,
    };

    it('should show shield bubble when isShielding=true', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      renderer.update({ ...basePlayer, isShielding: true, shieldHealth: 100 });

      // Shield bubble is the second child of the fighter container (after partRenderer container)
      const shieldBubble = renderer.container.children[1]!;
      expect(shieldBubble).toBeDefined();
      expect(shieldBubble.visible).toBe(true);
    });

    it('should hide shield bubble when isShielding=false', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      // First show it
      renderer.update({ ...basePlayer, isShielding: true, shieldHealth: 100 });
      const shieldBubble = renderer.container.children[1]!;
      expect(shieldBubble.visible).toBe(true);

      // Then hide it
      renderer.update({ ...basePlayer, isShielding: false, shieldHealth: 100, stateFrame: 1 });
      expect(shieldBubble.visible).toBe(false);
    });

    it('should hide shield bubble immediately on shield break (shieldHealth=0)', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      // Show at low health
      renderer.update({ ...basePlayer, isShielding: true, shieldHealth: 5 });
      const shieldBubble = renderer.container.children[1]!;
      expect(shieldBubble.visible).toBe(true);

      // Shield break — isShielding becomes false
      renderer.update({ ...basePlayer, isShielding: false, shieldHealth: 0, state: 'IDLE', stateFrame: 1 });
      expect(shieldBubble.visible).toBe(false);
    });

    it('should start hidden before any shielding occurs', () => {
      const parent = new Container();
      const renderer = new FighterRenderer(parent, 0);

      renderer.update(basePlayer);

      const shieldBubble = renderer.container.children[1]!;
      expect(shieldBubble.visible).toBe(false);
    });
  });
});
