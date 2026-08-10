/**
 * @fileoverview Public barrel for the FSM subsystem.
 *
 * Exports the `FSMController` class, all 25 concrete state implementations,
 * the shared interfaces (`FSMContext`, `FSMTransition`, `IFSMState`), and the
 * convenience helpers `createFSM` / `tickFSM` used by `GameEngine`.
 *
 * Import order within this file deliberately places interface definitions before
 * class exports so consumers can import types and implementations from one path.
 */
import type { InputEvent, PlayerState } from '@smash/shared';
import { PlayerStateEnum } from '@smash/shared';
import { FSMController } from './FSMController.js';

export interface FSMContext {
  player: PlayerState;
  input: InputEvent | null;
  isGrounded: boolean;
}

export interface FSMTransition {
  nextState: string;
  data?: Record<string, unknown>;
}

export interface IFSMState {
  enter(ctx: FSMContext): void;
  update(ctx: FSMContext, frame: number): FSMTransition | null;
  exit(ctx: FSMContext): void;
}

export function createFSM(initialState: PlayerStateEnum = PlayerStateEnum.IDLE): FSMController {
  return new FSMController(initialState);
}

export function tickFSM(controller: FSMController, player: PlayerState, input: InputEvent | null): PlayerState {
  return controller.tick(player, input);
}

export { FSMController } from './FSMController.js';
export { AirAttackState } from './states/AirAttackState.js';
export { AirborneState } from './states/AirborneState.js';
export { AirDodgeState } from './states/AirDodgeState.js';
export { AttackState } from './states/AttackState.js';
export { DashState } from './states/DashState.js';
export { DoubleJumpState } from './states/DoubleJumpState.js';
export { GrabHoldingState } from './states/GrabHoldingState.js';
export { GrabState } from './states/GrabState.js';
export { HitstunState } from './states/HitstunState.js';
export { HardLandingState } from './states/HardLandingState.js';
export { LandingLagState } from './states/LandingLagState.js';
export { IdleState } from './states/IdleState.js';
export { JumpsquatState } from './states/JumpsquatState.js';
export { RollState } from './states/RollState.js';
export { RunState } from './states/RunState.js';
export { ShieldState } from './states/ShieldState.js';
export { SpotDodgeState } from './states/SpotDodgeState.js';
export { TechNeutralState } from './states/TechNeutralState.js';
export { TechRollState } from './states/TechRollState.js';
export { WalkState } from './states/WalkState.js';
export { LedgeHangState } from './states/LedgeHangState.js';
export { LedgeClimbState } from './states/LedgeClimbState.js';
export { LedgeJumpState } from './states/LedgeJumpState.js';
export { LedgeAttackState } from './states/LedgeAttackState.js';
export { LedgeRollState } from './states/LedgeRollState.js';
