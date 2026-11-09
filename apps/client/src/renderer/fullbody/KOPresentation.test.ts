import { Container, Rectangle, Texture } from 'pixi.js';
import { STAGE } from '@smash/shared';
import { expect, it } from 'vitest';
import type { FullBodyPilotAssets } from './FullBodyPilot.js';
import { KOPresentation } from './KOPresentation.js';

const at = (frame: number) => frame * 1000 / 60;
function setup(kind: 'star' | 'screen') {
  const stage = new Container();
  const world = stage.addChild(new Container());
  const viewport = stage.addChild(new Container());
  const frames = [84, 24, 63, 70].map((height, index) => ({
    texture: new Texture({ source: Texture.WHITE.source, frame: new Rectangle(index, 0, 55, height) }),
    root: [15, 50], offsetY: 0,
  }));
  const clip = { scale: 1, frames };
  const assets: FullBodyPilotAssets = { characters: { 'all-rounder': { ko_star: clip, ko_screen: clip } } };
  const presenter = new KOPresentation(world, viewport, assets);
  const player = { id: 'victim', koVisual: { id: 1, kind, x: 420, y: -90, facing: 1 as const } };
  presenter.update([player], 0);
  return { presenter, world, viewport, player, read: () => presenter.getDiagnostics()[0]! };
}

it('Star KO climbs while shrinking, hands off to the twinkle, and cleans up', () => {
  const { presenter, world, viewport, player, read } = setup('star');
  const start = read();
  world.position.set(400, -200);
  presenter.update([player], at(30));
  expect(viewport.children).toHaveLength(1);
  expect(world.children).toHaveLength(0);
  expect(read().y).toBeLessThan(start.y);
  expect(read().x).toBeGreaterThan(start.x);
  expect(read().height).toBeLessThan(start.height);
  presenter.tick(at(68));
  expect(read().y).toBeCloseTo(STAGE.HEIGHT * 0.08);
  expect(read().visible).toBe(false);
  expect(read().accentVisible).toBe(true);
  presenter.tick(at(86));
  expect(viewport.children).toHaveLength(0);
});

it('Screen KO approaches, holds its impact pose, and slides off the bottom', () => {
  const { presenter, read } = setup('screen');
  const start = read();
  presenter.tick(at(17));
  const impact = read();
  expect(impact.height).toBeGreaterThan(start.height * 4);
  expect(impact.accentVisible).toBe(true);
  presenter.tick(at(32));
  expect(read().y).toBeCloseTo(impact.y);
  expect(read().frameRect).toBe(impact.frameRect);
  presenter.tick(at(66.5));
  expect(read().y - read().height / 2).toBeGreaterThan(STAGE.HEIGHT);
  presenter.tick(at(68));
  expect(presenter.getDiagnostics()).toEqual([]);
});
