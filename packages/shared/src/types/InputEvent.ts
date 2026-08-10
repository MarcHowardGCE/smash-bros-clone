/**
 * @fileoverview Input event types and bitmask constants for the binary input protocol.
 * Player inputs are encoded as a uint16 bitmask (`InputBitmask`) and transmitted
 * as `InputEvent` messages over the WebSocket connection. The server reads `pressed`,
 * `held`, and `released` fields every tick to drive the FSM and physics systems.
 */

import type { PlayerId } from './GameState.js';

/**
 * uint16 bitmask encoding all simultaneous button states for one game tick.
 * Each bit corresponds to one action; combine with bitwise OR/AND.
 * Full bit layout:
 * - bit 0 (0x0001): left
 * - bit 1 (0x0002): right
 * - bit 2 (0x0004): jump
 * - bit 3 (0x0008): down
 * - bit 4 (0x0010): attack
 * - bit 5 (0x0020): special
 * - bit 6 (0x0040): shield
 * - bit 7 (0x0080): grab
 */
export type InputBitmask = number;

/**
 * Named bit constants for each action in an `InputBitmask`.
 * Use with bitwise AND to test individual buttons:
 * ```ts
 * if (event.pressed & INPUT_BITS.JUMP) { ... }
 * ```
 */
export const INPUT_BITS = {
  LEFT:    0x0001,
  RIGHT:   0x0002,
  JUMP:    0x0004,
  DOWN:    0x0008,
  ATTACK:  0x0010,
  SPECIAL: 0x0020,
  SHIELD:  0x0040,
  GRAB:    0x0080,
} as const;

/**
 * One frame of player input, sent from client to server via binary msgpack.
 * The server processes inputs in `seq` order per player and tracks
 * `lastConfirmedSeq` in each `StateSnapshot` so the client can prune its
 * prediction buffer.
 */
export interface InputEvent {
  /** Server tick this input targets (used for rollback alignment). */
  tick: number;
  /** Monotonically incrementing sequence number per player; never resets. */
  seq: number;
  playerId: PlayerId;
  /** Bitmask of all buttons currently held this frame. */
  held: InputBitmask;
  /** Bitmask of buttons that transitioned from released to held this frame. */
  pressed: InputBitmask;
  /** Bitmask of buttons that transitioned from held to released this frame. */
  released: InputBitmask;
}
