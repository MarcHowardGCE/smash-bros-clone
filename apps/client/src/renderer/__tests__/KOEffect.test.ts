import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { KOEffect, KO_EFFECT_DURATION } from '../KOEffect';

describe('KOEffect', () => {
  describe('initialization', () => {
    it('should create 8 star particles in its container', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      // KOEffect container is added to parent
      expect(parent.children).toContain(effect.container);
      // 8 star Graphics children
      expect(effect.container.children.length).toBe(8);
    });

    it('should start inactive', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);
      expect(effect.active).toBe(false);
    });

    it('should have all stars hidden initially', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);
      for (const child of effect.container.children) {
        expect(child.visible).toBe(false);
      }
    });
  });

  describe('start()', () => {
    it('should set active to true and show stars', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();

      expect(effect.active).toBe(true);
      for (const child of effect.container.children) {
        expect(child.visible).toBe(true);
        expect(child.alpha).toBe(1.0);
      }
    });

    it('should reset frame counter on repeated start', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      effect.tick(); // frame 1
      effect.tick(); // frame 2
      expect(effect.currentFrame).toBe(2);

      effect.start(); // reset
      expect(effect.currentFrame).toBe(0);
    });
  });

  describe('tick() — rotation', () => {
    it('should return 18°/frame cumulative rotation', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);
      const expectedPerFrame = (Math.PI * 2) / 20; // 18° in radians

      effect.start();

      const rot1 = effect.tick(); // frame 1
      expect(rot1).toBeCloseTo(1 * expectedPerFrame, 5);

      const rot2 = effect.tick(); // frame 2
      expect(rot2).toBeCloseTo(2 * expectedPerFrame, 5);
    });

    it('should complete 360° every 20 frames', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      let rotation = 0;
      for (let i = 0; i < 20; i++) {
        rotation = effect.tick();
      }
      expect(rotation).toBeCloseTo(Math.PI * 2, 5);
    });

    it('should complete 720° (2 full rotations) over 40 frames', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      let rotation = 0;
      for (let i = 0; i < KO_EFFECT_DURATION; i++) {
        rotation = effect.tick();
      }
      expect(rotation).toBeCloseTo(Math.PI * 4, 5);
    });

    it('should return 0 when inactive', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);
      expect(effect.tick()).toBe(0);
    });
  });

  describe('tick() — star particles', () => {
    it('should move stars outward over time', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      effect.tick(); // frame 1

      // First star (angle=0) should move right
      const star0 = effect.container.children[0]!;
      expect(star0.x).toBeGreaterThan(0);
      expect(star0.y).toBeCloseTo(0, 1);
    });

    it('should fade stars linearly from 1.0 to 0.0 over 40 frames', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();

      // At frame 20 (halfway): alpha should be ~0.5
      for (let i = 0; i < 20; i++) {
        effect.tick();
      }
      const star = effect.container.children[0]!;
      expect(star.alpha).toBeCloseTo(0.5, 1);
    });

    it('should reach alpha 0 at frame 40', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      for (let i = 0; i < KO_EFFECT_DURATION; i++) {
        effect.tick();
      }
      // Effect stops at frame 40, stars hidden
      for (const child of effect.container.children) {
        expect(child.visible).toBe(false);
      }
    });
  });

  describe('auto-stop after duration', () => {
    it('should deactivate after 40 frames', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      for (let i = 0; i < KO_EFFECT_DURATION; i++) {
        effect.tick();
      }

      expect(effect.active).toBe(false);
    });

    it('should hide all stars after completion', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      for (let i = 0; i < KO_EFFECT_DURATION; i++) {
        effect.tick();
      }

      for (const child of effect.container.children) {
        expect(child.visible).toBe(false);
      }
    });
  });

  describe('double-KO independence', () => {
    it('two KOEffect instances on different parents run independently', () => {
      const parent1 = new Container();
      const parent2 = new Container();
      const effect1 = new KOEffect(parent1);
      const effect2 = new KOEffect(parent2);

      // Start effect1 first
      effect1.start();
      effect1.tick(); // frame 1
      effect1.tick(); // frame 2

      // Start effect2 later
      effect2.start();
      effect2.tick(); // frame 1

      // effect1 is at frame 2, effect2 at frame 1
      expect(effect1.currentFrame).toBe(2);
      expect(effect2.currentFrame).toBe(1);

      // Each has its own active state
      expect(effect1.active).toBe(true);
      expect(effect2.active).toBe(true);

      // Run effect1 to completion
      for (let i = 2; i < KO_EFFECT_DURATION; i++) {
        effect1.tick();
      }
      expect(effect1.active).toBe(false);
      expect(effect2.active).toBe(true); // still running
    });

    it('star positions differ between instances at same frame', () => {
      const parent1 = new Container();
      const parent2 = new Container();
      const effect1 = new KOEffect(parent1);
      const effect2 = new KOEffect(parent2);

      effect1.start();
      effect2.start();

      // Advance effect1 more than effect2
      effect1.tick();
      effect1.tick();
      effect2.tick();

      // effect1 stars are farther out
      const star1 = effect1.container.children[0]!;
      const star2 = effect2.container.children[0]!;
      expect(star1.x).toBeGreaterThan(star2.x);
    });
  });

  describe('stop()', () => {
    it('should deactivate and hide stars', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      effect.start();
      effect.tick();
      effect.stop();

      expect(effect.active).toBe(false);
      for (const child of effect.container.children) {
        expect(child.visible).toBe(false);
      }
    });
  });

  describe('destroy()', () => {
    it('should destroy container and remove from parent', () => {
      const parent = new Container();
      const effect = new KOEffect(parent);

      expect(parent.children.length).toBe(1);
      effect.destroy();
      expect(parent.children.length).toBe(0);
    });
  });
});
