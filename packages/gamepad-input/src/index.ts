/**
 * @fileoverview Public API for the gamepad-input package.
 *
 * Re-exports all symbols from the three sub-modules:
 * - {@link ./standardMapping} - W3C standard-mapping constants, deadzone math, and bit sampling
 * - {@link ./persistence} - localStorage-backed gamepad slot assignment persistence
 * - {@link ./GamepadPoller} - tick-driven gamepad poller with connect/disconnect lifecycle
 */

export * from './standardMapping.js';
export * from './persistence.js';
export * from './GamepadPoller.js';
