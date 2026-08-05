import type { InputEvent } from '@smash/shared';
import { INPUT_BITS, MoveId, PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition, IFSMState } from '../index.js';

// Fallback used when currentMoveId is null or unrecognised. 20 frames (~333ms) is
// a safe default that prevents a broken attack from locking the fighter indefinitely.
export const DEFAULT_MOVE_TOTAL_FRAMES = 20;

// Total frame counts per move (startup + active + recovery). Duplicated here from
// packages/engine/src/moves/ to avoid a circular import: FSM states need frame
// counts to know when to exit (e.g. AttackState transitions to IDLE after totalFrames),
// but importing MoveData directly would create engine/fsm → engine/moves → engine/fsm.
// Keeping a lightweight lookup here breaks the cycle.
const MOVE_TOTAL_FRAMES: Partial<Record<MoveId, number>> = {
  [MoveId.JAB]: 20,
  [MoveId.FORWARD_TILT]: 24,
  [MoveId.UP_TILT]: 22,
  [MoveId.DOWN_TILT]: 22,
  [MoveId.FORWARD_SMASH]: 40,
  [MoveId.UP_SMASH]: 36,
  [MoveId.DOWN_SMASH]: 38,
  [MoveId.NEUTRAL_AIR]: 28,
  [MoveId.FORWARD_AIR]: 30,
  [MoveId.BACK_AIR]: 26,
  [MoveId.UP_AIR]: 24,
  [MoveId.DOWN_AIR]: 32,
  [MoveId.NEUTRAL_SPECIAL]: 32,
  [MoveId.SIDE_SPECIAL]: 34,
  [MoveId.UP_SPECIAL]: 38,
  [MoveId.DOWN_SPECIAL]: 30,
  [MoveId.GRAB]: 20,
  [MoveId.PUMMEL]: 16,
  [MoveId.FORWARD_THROW]: 28,
  [MoveId.BACK_THROW]: 28,
  [MoveId.UP_THROW]: 30,
  [MoveId.DOWN_THROW]: 30,
};

export abstract class BaseState implements IFSMState {
  enter(_ctx: FSMContext): void {}
  exit(_ctx: FSMContext): void {}
  abstract update(ctx: FSMContext, frame: number): FSMTransition | null;
}

export function transition(nextState: PlayerStateEnum): FSMTransition {
  return { nextState };
}

export function isHeld(input: InputEvent | null, bit: number): boolean {
  return Boolean((input?.held ?? 0) & bit);
}

export function isPressed(input: InputEvent | null, bit: number): boolean {
  return Boolean((input?.pressed ?? 0) & bit);
}

export function isDirectionHeld(input: InputEvent | null): boolean {
  return isHeld(input, INPUT_BITS.LEFT) || isHeld(input, INPUT_BITS.RIGHT);
}

export function resolveMoveTotalFrames(moveId: string | null): number {
  if (!moveId) {
    return DEFAULT_MOVE_TOTAL_FRAMES;
  }

  return MOVE_TOTAL_FRAMES[moveId as MoveId] ?? DEFAULT_MOVE_TOTAL_FRAMES;
}

export { INPUT_BITS, PHYSICS, PlayerStateEnum };
