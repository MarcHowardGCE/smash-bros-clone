import type { Vec2, Circle } from '../types/GameState.js';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function vecAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vecScale(v: Vec2, scale: number): Vec2 {
  return { x: v.x * scale, y: v.y * scale };
}

export function vecLength(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vecNormalize(v: Vec2): Vec2 {
  const len = vecLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function circleOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;
  return distSq < radiusSum * radiusSum;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function knockbackAngleToVelocity(
  magnitude: number,
  angleDegs: number,
  attackerFacing: 1 | -1
): Vec2 {
  const rad = degreesToRadians(angleDegs);
  const vx = Math.cos(rad) * magnitude * attackerFacing;
  const vy = -Math.sin(rad) * magnitude;
  return { x: vx, y: vy };
}
