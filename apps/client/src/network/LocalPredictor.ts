import { applyMovementInput, startJump } from '@smash/engine';
import { INPUT_BITS, PlayerStateEnum, type InputEvent, type PlayerId, type PlayerState, type StateSnapshot } from '@smash/shared';

function clonePlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    activeHitbox: player.activeHitbox ? { ...player.activeHitbox } : null,
  };
}

export class LocalPredictor {
  private confirmedState: PlayerState | null = null;
  private pendingInputs: InputEvent[] = [];
  private predictedState: PlayerState | null = null;
  private readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  onInput(input: InputEvent): void {
    if (!this.predictedState) {
      return;
    }

    this.pendingInputs.push(input);
    this.predictedState = this.applyLocalMovement(this.predictedState, input);
  }

  onServerSnapshot(snapshot: StateSnapshot): void {
    const serverPlayerState = snapshot.players[this.playerId];
    if (!serverPlayerState) {
      return;
    }

    this.confirmedState = clonePlayerState(serverPlayerState);

    const lastSeq = snapshot.lastConfirmedSeq[this.playerId] ?? -1;
    this.pendingInputs = this.pendingInputs.filter((input) => input.seq > lastSeq);
    this.predictedState = this.replayFromConfirmed();
  }

  initialize(playerState: PlayerState): void {
    this.confirmedState = clonePlayerState(playerState);
    this.predictedState = clonePlayerState(playerState);
    this.pendingInputs = [];
  }

  getPredictedState(): PlayerState | null {
    return this.predictedState ? clonePlayerState(this.predictedState) : null;
  }

  private replayFromConfirmed(): PlayerState {
    const baseState = this.confirmedState ?? this.predictedState;
    if (!baseState) {
      throw new Error('LocalPredictor replay attempted before initialization');
    }

    let state = clonePlayerState(baseState);
    for (const input of this.pendingInputs) {
      state = this.applyLocalMovement(state, input);
    }

    return state;
  }

  private applyLocalMovement(player: PlayerState, input: InputEvent): PlayerState {
		let nextPlayer = clonePlayerState(player);
		if ((input.pressed & INPUT_BITS.JUMP) !== 0) {
			nextPlayer = startJump(nextPlayer, false);
		}
		const moved = applyMovementInput(nextPlayer, input);
    const facing = this.getFacing(player.facing, input);
    const nextState = this.getVisualState(moved, input);
    const stateFrame = player.state === nextState ? player.stateFrame + 1 : 0;

    return {
      ...moved,
      facing,
      state: nextState,
      stateFrame,
    };
  }

  private getFacing(currentFacing: 1 | -1, input: InputEvent): 1 | -1 {
    const movingLeft = (input.held & INPUT_BITS.LEFT) !== 0;
    const movingRight = (input.held & INPUT_BITS.RIGHT) !== 0;

    if (movingLeft && !movingRight) {
      return -1;
    }

    if (movingRight && !movingLeft) {
      return 1;
    }

    return currentFacing;
  }

  private getVisualState(player: PlayerState, input: InputEvent): PlayerState['state'] {
		if (player.hitstunFramesRemaining > 0) {
			return PlayerStateEnum.HITSTUN;
		}

		if (
			(input.pressed & (INPUT_BITS.ATTACK | INPUT_BITS.SPECIAL | INPUT_BITS.GRAB)) !== 0
		) {
			return player.isGrounded ? PlayerStateEnum.ATTACK : PlayerStateEnum.AIR_ATTACK;
		}

		if ((input.pressed & INPUT_BITS.JUMP) !== 0 && player.isGrounded) {
			return PlayerStateEnum.JUMPSQUAT;
		}

    if (!player.isGrounded) {
      return PlayerStateEnum.AIRBORNE;
    }

    const movingLeft = (input.held & INPUT_BITS.LEFT) !== 0;
    const movingRight = (input.held & INPUT_BITS.RIGHT) !== 0;
    return movingLeft !== movingRight ? PlayerStateEnum.WALK : PlayerStateEnum.IDLE;
  }
}
