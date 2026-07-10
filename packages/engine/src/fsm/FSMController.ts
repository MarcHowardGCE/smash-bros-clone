import type { InputEvent, PlayerState } from '@smash/shared';
import { PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition, IFSMState } from './index.js';
import { AirAttackState } from './states/AirAttackState.js';
import { AirborneState } from './states/AirborneState.js';
import { AirDodgeState } from './states/AirDodgeState.js';
import { AttackState } from './states/AttackState.js';
import { DoubleJumpState } from './states/DoubleJumpState.js';
import { GrabHoldingState } from './states/GrabHoldingState.js';
import { GrabState } from './states/GrabState.js';
import { HitstunState } from './states/HitstunState.js';
import { IdleState } from './states/IdleState.js';
import { JumpsquatState } from './states/JumpsquatState.js';
import { RollState } from './states/RollState.js';
import { RunState } from './states/RunState.js';
import { ShieldState } from './states/ShieldState.js';
import { SpotDodgeState } from './states/SpotDodgeState.js';
import { WalkState } from './states/WalkState.js';

export class FSMController {
  private currentState: IFSMState;
  private stateName: PlayerStateEnum;
  private readonly stateRegistry: Map<PlayerStateEnum, IFSMState>;

  constructor(initialState: PlayerStateEnum = PlayerStateEnum.IDLE) {
    this.stateRegistry = new Map([
      [PlayerStateEnum.IDLE, new IdleState()],
      [PlayerStateEnum.WALK, new WalkState()],
      [PlayerStateEnum.RUN, new RunState()],
      [PlayerStateEnum.JUMPSQUAT, new JumpsquatState()],
      [PlayerStateEnum.AIRBORNE, new AirborneState()],
      [PlayerStateEnum.DOUBLE_JUMP, new DoubleJumpState()],
      [PlayerStateEnum.ATTACK, new AttackState()],
      [PlayerStateEnum.AIR_ATTACK, new AirAttackState()],
      [PlayerStateEnum.SHIELD, new ShieldState()],
      [PlayerStateEnum.ROLL, new RollState()],
      [PlayerStateEnum.SPOT_DODGE, new SpotDodgeState()],
      [PlayerStateEnum.AIR_DODGE, new AirDodgeState()],
      [PlayerStateEnum.HITSTUN, new HitstunState()],
      [PlayerStateEnum.GRAB, new GrabState()],
      [PlayerStateEnum.GRAB_HOLDING, new GrabHoldingState()],
    ]);

    this.stateName = initialState;
    this.currentState = this.getState(initialState);
  }

  tick(player: PlayerState, input: InputEvent | null): PlayerState {
		if (player.state !== this.stateName) {
			this.stateName = player.state as PlayerStateEnum;
			this.currentState = this.getState(this.stateName);
		}

    if (player.hitlagFramesRemaining > 0) {
      return {
        ...player,
        hitlagFramesRemaining: player.hitlagFramesRemaining - 1,
        vx: 0,
        vy: 0,
      };
    }

    const ctx: FSMContext = {
      player,
      input,
      isGrounded: player.isGrounded,
    };

    const transition = this.currentState.update(ctx, player.stateFrame);

    let nextPlayer: PlayerState = {
      ...player,
      stateFrame: player.stateFrame + 1,
    };

    if (player.hitstunFramesRemaining > 0) {
      nextPlayer = {
        ...nextPlayer,
        hitstunFramesRemaining: player.hitstunFramesRemaining - 1,
      };
    }

    if (transition) {
      return this.applyTransition(transition, ctx, nextPlayer, input);
    }

    this.stateName = nextPlayer.state as PlayerStateEnum;
    return nextPlayer;
  }

  getCurrentStateName(): PlayerStateEnum {
    return this.stateName;
  }

  private applyTransition(
    transition: FSMTransition,
    ctx: FSMContext,
    player: PlayerState,
    input: InputEvent | null,
  ): PlayerState {
    this.currentState.exit(ctx);

    const nextStateName = transition.nextState as PlayerStateEnum;
    const nextState = this.getState(nextStateName);
    this.stateName = nextStateName;
    this.currentState = nextState;

    const nextPlayer: PlayerState = {
      ...player,
      state: nextStateName,
      stateFrame: 0,
    };

    const nextCtx: FSMContext = {
      player: nextPlayer,
      input,
      isGrounded: nextPlayer.isGrounded,
    };

    this.currentState.enter(nextCtx);
    return nextPlayer;
  }

  private getState(state: PlayerStateEnum): IFSMState {
    const resolved = this.stateRegistry.get(state);

    if (!resolved) {
      throw new Error(`Unknown FSM state: ${state}`);
    }

    return resolved;
  }
}
