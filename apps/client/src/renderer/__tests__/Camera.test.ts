import { describe, it, expect, vi } from 'vitest';
import { Camera } from '../../renderer/Camera.js';
import type { Container } from 'pixi.js';

function mockContainer(): Container {
  return {
    scale: { set: vi.fn() },
    position: { set: vi.fn() },
  } as unknown as Container;
}

describe('Camera', () => {
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
    expect(() => camera.update([], 1280, 720)).not.toThrow();
  });

  it('update calls scale and position when given positions', () => {
    const container = mockContainer();
    const camera = new Camera(container);
    camera.update([{ x: 400, y: 500 }, { x: 800, y: 500 }], 1280, 720);
    expect(container.scale.set).toHaveBeenCalled();
    expect(container.position.set).toHaveBeenCalled();
  });
});
