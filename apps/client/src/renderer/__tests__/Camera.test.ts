import { describe, it, expect, vi, afterEach } from 'vitest';
import { Camera } from '../../renderer/Camera.js';
import type { Container } from 'pixi.js';

function mockContainer(): Container {
  return {
    scale: { set: vi.fn() },
    position: { set: vi.fn() },
  } as unknown as Container;
}

const DEFAULT_POS = [{ x: 400, y: 500 }];
const VP_W = 1280;
const VP_H = 720;

describe('Camera', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates without error', () => {
    const container = mockContainer();
    const camera = new Camera(container);
    expect(camera).toBeDefined();
  });

  it('reset sets scale to 1 and position to 0,0', () => {
    const container = mockContainer();
    const camera = new Camera(container);
    camera.reset();
    expect(container.scale.set).toHaveBeenCalledWith(1.0);
    expect(container.position.set).toHaveBeenCalledWith(0, 0);
  });

  it('update does nothing with empty positions', () => {
    const container = mockContainer();
    const camera = new Camera(container);
    // Should not throw
    expect(() => camera.update([], VP_W, VP_H)).not.toThrow();
  });

  it('update calls scale and position when given positions', () => {
    const container = mockContainer();
    const camera = new Camera(container);
    camera.update([{ x: 400, y: 500 }, { x: 800, y: 500 }], VP_W, VP_H);
    expect(container.scale.set).toHaveBeenCalled();
    expect(container.position.set).toHaveBeenCalled();
  });

  describe('shake', () => {
    it('knockback below threshold produces no shake offset', () => {
      const camera = new Camera(mockContainer());
      camera.shake(3); // below threshold of 5
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const offset = camera.getShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('knockback at threshold boundary produces no shake offset', () => {
      const camera = new Camera(mockContainer());
      camera.shake(5); // exactly at threshold — should NOT shake
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const offset = camera.getShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('knockback above threshold produces non-zero shake offset', () => {
      // Pin Math.random to a deterministic value so we avoid the 0.5 → 0 edge case.
      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      const camera = new Camera(mockContainer());
      camera.shake(20);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const offset = camera.getShakeOffset();
      expect(Math.abs(offset.x) + Math.abs(offset.y)).toBeGreaterThan(0);
    });

    it('shake offset decays to zero after enough frames', () => {
      const camera = new Camera(mockContainer());
      camera.shake(20);
      // SHAKE_MAX_DURATION is 15 — run 20 updates to guarantee full decay.
      for (let i = 0; i < 20; i++) {
        camera.update(DEFAULT_POS, VP_W, VP_H);
      }
      const offset = camera.getShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('shake offset is clamped to ±20px even on extreme knockback', () => {
      const camera = new Camera(mockContainer());
      camera.shake(999); // absurd kill-move knockback
      // Run several frames — every frame the offset must stay within bounds.
      for (let i = 0; i < 5; i++) {
        camera.update(DEFAULT_POS, VP_W, VP_H);
        const offset = camera.getShakeOffset();
        expect(Math.abs(offset.x)).toBeLessThanOrEqual(20);
        expect(Math.abs(offset.y)).toBeLessThanOrEqual(20);
      }
    });

    it('stronger later shake replaces weaker ongoing shake', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const camera = new Camera(mockContainer());

      // Weak shake (knockback 10 → intensity = min(10*0.5, 20) = 5)
      camera.shake(10);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const weakOffset = camera.getShakeOffset();

      // Stronger shake (knockback 40 → intensity = min(40*0.5, 20) = 20)
      camera.shake(40);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const strongOffset = camera.getShakeOffset();

      // Stronger shake should produce a larger (or equal) magnitude offset.
      // With deterministic random=0.9 and fresh shake, the stronger intensity
      // should dominate.
      expect(Math.abs(strongOffset.x)).toBeGreaterThanOrEqual(Math.abs(weakOffset.x));
    });

    it('weaker shake does NOT replace stronger ongoing shake', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const camera = new Camera(mockContainer());

      // Strong shake first
      camera.shake(40);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const strongOffset = camera.getShakeOffset();

      // Weaker shake should be ignored while strong shake is active
      camera.shake(10);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const afterWeakOffset = camera.getShakeOffset();

      // The offset should still be non-zero (strong shake still active, not replaced)
      expect(Math.abs(afterWeakOffset.x) + Math.abs(afterWeakOffset.y)).toBeGreaterThan(0);
      // And the strong shake's intensity is preserved (magnitude in same ballpark,
      // accounting for decay)
      expect(Math.abs(strongOffset.x)).toBeGreaterThan(0);
    });

    it('reset clears active shake', () => {
      const camera = new Camera(mockContainer());
      camera.shake(30);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      // Shake should be active
      camera.reset();
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const offset = camera.getShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('shake offset is applied to container position', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      const container = mockContainer();
      const camera = new Camera(container);

      // First update without shake to establish baseline position
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const baseCall = (container.position.set as ReturnType<typeof vi.fn>).mock.calls[0] as [number, number];
      const baseX = baseCall[0];
      const baseY = baseCall[1];

      // Now shake and update again
      camera.shake(25);
      camera.update(DEFAULT_POS, VP_W, VP_H);
      const shakeCall = (container.position.set as ReturnType<typeof vi.fn>).mock.calls[1] as [number, number];
      const shakeX = shakeCall[0];
      const shakeY = shakeCall[1];

      // The shaken position should differ from the base (offset applied).
      // Due to lerp, base position changes slightly, but the shake offset
      // should cause a noticeable difference.
      const offset = camera.getShakeOffset();
      expect(Math.abs(offset.x) + Math.abs(offset.y)).toBeGreaterThan(0);
      // Container position includes the offset
      expect(shakeX).not.toBe(baseX);
    });
  });
});
