import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericInputBits } from '@smash/gamepad-input';
import { MenuNavigator } from '../MenuNavigator';

describe('MenuNavigator', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('primes gamepad bits so held input does not move or activate until a true rising edge', () => {
    const firstBtn = document.createElement('button');
    const secondBtn = document.createElement('button');
    container.appendChild(firstBtn);
    container.appendChild(secondBtn);

    const firstActivate = vi.fn();
    const secondActivate = vi.fn();

    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback): number => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }) as typeof requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const heldBits = GenericInputBits.DOWN | GenericInputBits.A;
    const poller = {
      poll: vi
        .fn()
        // Priming snapshot.
        .mockReturnValueOnce(new Map([[0, { bits: heldBits }]]))
        // First frame still held: should do nothing.
        .mockReturnValueOnce(new Map([[0, { bits: heldBits }]]))
        // Release.
        .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
        // Fresh down press: should move selection.
        .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.DOWN }]]))
        // Release.
        .mockReturnValueOnce(new Map([[0, { bits: 0 }]]))
        // Fresh A press: should activate selected (second) button.
        .mockReturnValueOnce(new Map([[0, { bits: GenericInputBits.A }]])),
    };

    const nav = new MenuNavigator(poller as unknown as ConstructorParameters<typeof MenuNavigator>[0]);
    nav.setButtons([
      { id: 'first', element: firstBtn, onActivate: firstActivate },
      { id: 'second', element: secondBtn, onActivate: secondActivate },
    ]);
    nav.start();

    const runNextFrame = (): void => {
      const callback = rafCallbacks.shift();
      expect(callback).toBeDefined();
      callback!(0);
    };

    runNextFrame();
    expect(firstBtn.classList.contains('menu-selected')).toBe(true);
    expect(secondBtn.classList.contains('menu-selected')).toBe(false);
    expect(firstActivate).not.toHaveBeenCalled();
    expect(secondActivate).not.toHaveBeenCalled();

    runNextFrame();
    runNextFrame();
    expect(firstBtn.classList.contains('menu-selected')).toBe(false);
    expect(secondBtn.classList.contains('menu-selected')).toBe(true);

    runNextFrame();
    runNextFrame();
    expect(secondActivate).toHaveBeenCalledTimes(1);

    nav.stop();
  });
});
