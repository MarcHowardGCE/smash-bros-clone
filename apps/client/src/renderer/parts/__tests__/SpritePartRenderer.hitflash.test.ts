import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import {
  SpritePartRenderer,
  applyHitFlash,
  getSharedHitFlashFilter,
} from '../SpritePartRenderer';

describe('SpritePartRenderer hit flash filter', () => {
  it('attaches filter when active and removes it when inactive', () => {
    const container = new Container();
    const shared = getSharedHitFlashFilter();

    applyHitFlash(container, true);
    expect(container.filters).toEqual([shared]);

    applyHitFlash(container, false);
    expect(container.filters).toBeNull();
  });

  it('does not attach duplicate filters over rapid toggles', () => {
    const container = new Container();
    const shared = getSharedHitFlashFilter();

    let maxAttached = 0;
    for (let i = 0; i < 10; i++) {
      applyHitFlash(container, true);
      const attached = container.filters ?? [];
      maxAttached = Math.max(maxAttached, attached.length);
      expect(attached).toEqual([shared]);

      applyHitFlash(container, true);
      const attachedAfterRepeat = container.filters ?? [];
      maxAttached = Math.max(maxAttached, attachedAfterRepeat.length);
      expect(attachedAfterRepeat).toEqual([shared]);

      applyHitFlash(container, false);
      expect(container.filters).toBeNull();
    }

    expect(maxAttached).toBe(1);
  });

  it('all renderer instances share the same filter object identity', () => {
    const rendererA = new SpritePartRenderer('assets/a.png');
    const rendererB = new SpritePartRenderer('assets/b.png');
    const shared = getSharedHitFlashFilter();

    rendererA.setHitFlash(true);
    rendererB.setHitFlash(true);

    expect(rendererA.container.filters?.[0]).toBe(shared);
    expect(rendererB.container.filters?.[0]).toBe(shared);
    expect(rendererA.container.filters?.[0]).toBe(rendererB.container.filters?.[0]);
  });

  it('50 containers flashed still use exactly one filter instance', () => {
    const shared = getSharedHitFlashFilter();
    const containers = Array.from({ length: 50 }, () => new Container());
    const seen = new Set<object>();

    for (const container of containers) {
      applyHitFlash(container, true);
      if (container.filters?.[0]) {
        seen.add(container.filters[0]);
      }
    }

    expect(seen.size).toBe(1);
    expect(seen.has(shared as unknown as object)).toBe(true);
  });
});
