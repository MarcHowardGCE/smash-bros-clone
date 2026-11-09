import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { STAGE, type CharacterId } from '@smash/shared';
import { expect, it } from 'vitest';
import type { FullBodyPilotAssets } from './FullBodyPilot.js';
import { KOPresentation } from './KOPresentation.js';

const at = (frame: number) => frame * 1000 / 60;
function setup(kind: 'star' | 'screen', vx = 0, x = 420, characterId: CharacterId = 'all-rounder',
  size: { width: number; height: number } = { width: STAGE.WIDTH, height: STAGE.HEIGHT }, y = -90, captureTumble = false) {
  const stage = new Container();
  const world = stage.addChild(new Container());
  const viewport = stage.addChild(new Container());
  const frames = [84, 24, 63, 70].map((height, index) => ({
    texture: new Texture({ source: Texture.WHITE.source, frame: new Rectangle(index, 0, 55, height) }),
    root: [15, 50], offsetY: 0,
  }));
  const clip = { scale: 1, frames };
  const assets: FullBodyPilotAssets = { characters: { [characterId]: { ko_star: clip, ko_screen: clip, tumble: clip } } };
  const source = captureTumble ? world.addChild(new Sprite(frames[2]!.texture)) : undefined;
  source?.anchor.set(0.5);
  source?.scale.set(0.75);
  const presenter = new KOPresentation(world, viewport, assets, size, () => source);
  const player = { id: 'victim', characterId, koVisual: { id: 1, kind, x, y, facing: 1 as const, exitVelocity: { x: vx, y: -30 } } };
  presenter.update([player], 0);
  return { presenter, world, viewport, player, read: () => presenter.getDiagnostics()[0]! };
}

it('Star KO re-enters through the upper edge, shrinks, and hands off to the twinkle', () => {
  const { presenter, world, viewport, player, read } = setup('star');
  const start = read();
  expect(start.alpha).toBe(1);
  expect(start.y + start.height / 2).toBeLessThan(0);
  world.position.set(400, -200);
  presenter.update([player], at(30));
  expect(viewport.children).toHaveLength(1);
  expect(world.children).toHaveLength(0);
  expect(read().y).toBeGreaterThan(0);
  expect(read().x).toBeCloseTo(start.x);
  expect(read().height).toBeLessThan(start.height);
  presenter.tick(at(102));
  expect(read().y).toBeCloseTo(STAGE.HEIGHT * 0.08);
  expect(read().visible).toBe(false);
  expect(read().accentVisible).toBe(true);
  presenter.tick(at(121));
  expect(viewport.children).toHaveLength(0);
});

it('Star KO continues the outgoing drawing and keeps crop changes out of the depth curve', () => {
  const { presenter, read } = setup('star', 0, 640, 'all-rounder', undefined, 75, true);
  const first = read();
  expect(first.frameRect).toBe('2,0');
  expect(first.height).toBeCloseTo(63 * 0.75);
  presenter.tick(at(4.99));
  const before = read();
  expect(before.y).toBeLessThan(first.y);
  presenter.tick(at(5.01));
  const after = read();
  expect(after.frameRect).toBe('3,0');
  expect(Math.hypot(after.width, after.height)).toBeCloseTo(Math.hypot(before.width, before.height), 0);
});

it.each([-1, 1])('Star KO follows launch direction %s even when it points away from center', direction => {
  const x = direction < 0 ? 420 : STAGE.WIDTH - 420;
  const { presenter, read } = setup('star', direction * 20, x);
  presenter.tick(at(30));
  expect((read().x - x) * direction).toBeGreaterThan(0);
  presenter.tick(at(102));
  expect((read().x - x) * direction).toBeGreaterThan(0);
  expect(read().accentVisible).toBe(true);
});

it.each([180, STAGE.WIDTH - 180])('Screen KO from x=%s approaches the center and clears the bottom', x => {
  const { presenter, read } = setup('screen', 18, x);
  const start = read();
  presenter.tick(at(20.1));
  const impact = read();
  expect(impact.height).toBeGreaterThan(start.height * 4);
  expect(impact.accentVisible).toBe(true);
  expect(impact.x).toBeCloseTo(STAGE.WIDTH / 2);
  expect(presenter.hasSpecialKO()).toBe(true);
  expect(presenter.hasScreenKOOverHUD()).toBe(false);
  presenter.tick(at(32));
  expect(read().y).toBeCloseTo(impact.y);
  expect(read().frameRect).toBe(impact.frameRect);
  presenter.tick(at(58.5));
  expect(read().x).toBeCloseTo(impact.x);
  expect(read().visible).toBe(true);
  expect(read().y - read().height / 2).toBeLessThan(STAGE.HEIGHT);
  expect(read().y + read().height / 2).toBeGreaterThan(STAGE.HEIGHT);
  expect(presenter.hasScreenKOOverHUD()).toBe(true);
  presenter.tick(at(60));
  expect(read().visible).toBe(false);
  expect(read().blastVisible).toBe(false);
  presenter.tick(at(80));
  expect(read().blastVisible).toBe(true);
  expect(read().y - read().height / 2).toBeCloseTo(STAGE.HEIGHT);
  expect(presenter.hasScreenKOOverHUD()).toBe(true);
  presenter.tick(at(105));
  expect(presenter.getDiagnostics()).toEqual([]);
  expect(presenter.hasScreenKOOverHUD()).toBe(false);
  expect(presenter.hasSpecialKO()).toBe(false);
});

it('Screen KO settles before impact and keeps perspective scale through pose swaps', () => {
  const { presenter, read } = setup('screen', -30, 180);
  for (let frame = 0; frame < 20; frame++) {
    presenter.tick(at(frame));
    if (read().y + read().height / 2 > 0) expect(read().x).toBe(STAGE.WIDTH / 2);
  }
  presenter.tick(at(19));
  const approach = read();
  presenter.tick(at(20.1));
  const impact = read();
  expect(approach.x).toBe(impact.x);
  expect(impact.y - approach.y).toBeLessThan(3);
  expect(impact.scale - approach.scale).toBeLessThan(0.15);
  presenter.tick(at(44));
  expect(read().scale).toBeCloseTo(impact.scale);
  expect(read().blastVisible).toBe(false);
});

it('clears the actual tall viewport and anchors the blast there', () => {
  const { presenter, read } = setup('screen', 0, 640, 'hulk-hoagie', { width: 1280, height: 1060 });
  presenter.tick(at(58));
  expect(read().visible).toBe(true);
  expect(read().y + read().height / 2).toBeGreaterThan(1060);
  expect(read().y - read().height / 2).toBeLessThan(1060);
  presenter.tick(at(80));
  expect(read().y - read().height / 2).toBeCloseTo(1060);
  expect(read().blastY).toBe(1060);
  expect(read().blastVisible).toBe(true);
});

it('continues a visible upward launch before returning toward the camera', () => {
  const { presenter, read } = setup('screen', 7, 760, 'all-rounder', undefined, 80);
  const start = read();
  presenter.tick(at(4));
  expect(read().x).toBeGreaterThan(start.x);
  expect(read().y).toBeLessThan(start.y);
  presenter.tick(at(32));
  expect(read().x).toBe(STAGE.WIDTH / 2);
  expect(read().accentVisible).toBe(true);
});

it('Hoagie tips back and recedes before clearing the same lower edge', () => {
  const { presenter, read } = setup('screen', 0, 880, 'hulk-hoagie');
  presenter.tick(at(42));
  const start = read();
  presenter.tick(at(58.5));
  expect(read().x).toBe(start.x);
  expect(read().scale).toBeLessThan(start.scale * 0.6);
  expect(read().visible).toBe(true);
  presenter.tick(at(80));
  expect(read().y - read().height / 2).toBeCloseTo(STAGE.HEIGHT);
  expect(read().blastVisible).toBe(true);
});
