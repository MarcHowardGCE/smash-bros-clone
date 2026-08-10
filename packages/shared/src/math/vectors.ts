/**
 * @fileoverview Pure math utilities for 2D vectors and game-specific calculations.
 * No side effects, no imports from outside this package. Used by the engine,
 * server, and client for physics, hitbox collision, and knockback resolution.
 */

import type { Vec2, Circle } from '../types/GameState.js';

/**
 * Linear interpolation between two numbers.
 *
 * @param a - Start value (returned when `t` = 0).
 * @param b - End value (returned when `t` = 1).
 * @param t - Interpolation factor; typically in [0, 1] but not clamped.
 * @returns The value `a + (b - a) * t`.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamps a number to the inclusive range [min, max].
 *
 * @param value - The number to clamp.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 * @returns `value` clamped between `min` and `max`.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Adds two 2D vectors component-wise.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns A new `Vec2` equal to `{ x: a.x + b.x, y: a.y + b.y }`.
 */
export function vecAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Multiplies a 2D vector by a scalar.
 *
 * @param v - The vector to scale.
 * @param scale - Scalar multiplier applied to both components.
 * @returns A new `Vec2` equal to `{ x: v.x * scale, y: v.y * scale }`.
 */
export function vecScale(v: Vec2, scale: number): Vec2 {
  return { x: v.x * scale, y: v.y * scale };
}

/**
 * Computes the Euclidean length (magnitude) of a 2D vector.
 *
 * @param v - The vector to measure.
 * @returns `√(v.x² + v.y²)`.
 */
export function vecLength(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Returns a unit vector in the same direction as `v`.
 * Returns `{ x: 0, y: 0 }` for the zero vector to avoid division by zero.
 *
 * @param v - The vector to normalise.
 * @returns A `Vec2` with magnitude 1 (or the zero vector if `v` has zero length).
 */
export function vecNormalize(v: Vec2): Vec2 {
  const len = vecLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Tests whether two circles overlap (used for hitbox vs hurtbox collision).
 * Uses squared-distance comparison to avoid a square-root on every check.
 *
 * @param a - First circle (position + radius).
 * @param b - Second circle (position + radius).
 * @returns `true` when the distance between centres is less than the sum of radii.
 */
export function circleOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;
  return distSq < radiusSum * radiusSum;
}

/**
 * Converts an angle in degrees to radians.
 *
 * @param degrees - Angle in degrees.
 * @returns Equivalent angle in radians.
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts a knockback magnitude and launch angle into a 2D velocity vector.
 *
 * The angle is measured from the horizontal (0° = directly right, 90° = straight up).
 * `attackerFacing` mirrors the horizontal component so the defender is always
 * launched away from the attacker regardless of which way the attacker is facing.
 *
 * Formula:
 * ```
 * vx = cos(angleDegs) × magnitude × attackerFacing
 * vy = −sin(angleDegs) × magnitude   // negative because y increases downward
 * ```
 *
 * @param magnitude - Knockback magnitude computed by the Smash Bros formula.
 * @param angleDegs - Launch angle in degrees (0 = horizontal, 90 = straight up).
 * @param attackerFacing - Direction the attacker faces: 1 = right, -1 = left.
 * @returns A `Vec2` representing the defender's knockback velocity in px/frame.
 */
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
