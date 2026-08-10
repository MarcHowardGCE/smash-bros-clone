/**
 * @fileoverview LocalPredictor - client-side prediction and server reconciliation
 * for the local player in the smash-bros-clone netcode stack.
 *
 * Without prediction every keystroke would feel delayed by the full network
 * round-trip (~50-200 ms). This module applies the local player's inputs
 * immediately in the browser so movement feels instant, while the server
 * remains authoritative for everything that matters competitively (damage,
 * knockback, stocks, hit detection).
 *
 * See the class-level JSDoc for the full reconciliation algorithm.
 */
import { applyMovementInput, startJump } from '@smash/engine';
import { INPUT_BITS, PlayerStateEnum, type InputEvent, type PlayerId, type PlayerState, type StateSnapshot } from '@smash/shared';

// activeHitbox is a nested object; a plain spread of `player` would copy only the
// reference, meaning two cloned states would share the same hitbox object. Any mutation
// to one clone's hitbox (e.g. the prediction applying a new active hit) would silently
// corrupt the other. The explicit inner spread breaks that aliasing.
function clonePlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    activeHitbox: player.activeHitbox ? { ...player.activeHitbox } : null,
  };
}

/**
 * LocalPredictor — client-side prediction and server reconciliation for the local player.
 *
 * WHY client-side prediction exists:
 *   Without it every keystroke would feel delayed by the full network round-trip
 *   (~50–200 ms). Prediction applies the local player's inputs immediately in the
 *   browser so movement feels instant. The server remains authoritative for everything
 *   that matters competitively (damage, knockback, stocks, hit detection).
 *
 * HOW reconciliation works:
 *   The client maintains a `pendingInputs` queue — inputs that have been applied
 *   locally but not yet acknowledged by the server. On each server snapshot:
 *     1. The confirmed player state from the snapshot is accepted as ground truth.
 *     2. Inputs the server has already processed (seq <= lastConfirmedSeq) are discarded.
 *     3. The remaining pending inputs are replayed in order on top of the confirmed state.
 *   The result becomes the new `predictedState` shown to the renderer.
 *
 * WHY pendingInputs uses sequence numbers (seq):
 *   The server echoes back `lastConfirmedSeq` per player in every snapshot. Inputs with
 *   seq <= lastConfirmedSeq are already baked into the confirmed state we just received;
 *   keeping them would double-apply their movement effect. Sequence numbers let us trim
 *   exactly the right subset in O(n) without relying on wall-clock time or round-trip
 *   estimates.
 *
 * WHY applyLocalMovement is a simplified physics approximation:
 *   Running the full server FSM (AttackState, HitstunState, hitbox detection, etc.) on
 *   the client would require keeping all server-side combat state in sync, drastically
 *   increasing complexity and the risk of divergence. Instead, only movement physics are
 *   predicted — position, velocity, facing, and a coarse visual state. The server is
 *   solely authoritative on combat outcomes; any misprediction is corrected on the next
 *   snapshot.
 */
export class LocalPredictor {
  private confirmedState: PlayerState | null = null;
  private pendingInputs: InputEvent[] = [];
  private predictedState: PlayerState | null = null;
  private readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  /**
   * Registers a new input event, applies it to the predicted state immediately,
   * and queues it in `pendingInputs` for later reconciliation.
   *
   * @param input - The seq-stamped input event from `InputManager`.
   */
  onInput(input: InputEvent): void {
    if (!this.predictedState) {
      return;
    }

    this.pendingInputs.push(input);
    this.predictedState = this.applyLocalMovement(this.predictedState, input);
  }

  /**
   * Reconciles local prediction against the authoritative server snapshot.
   *
   * Client-side prediction + reconciliation:
   * 1. Apply input immediately to local state (no wait for server)
   * 2. On server snapshot: find the matching seq number in the pending-input buffer
   * 3. Prune all inputs <= confirmed seq
   * 4. Replay remaining unconfirmed inputs forward from the confirmed server state
   * 5. This ensures movement feels instant while the server remains authoritative for combat
   *
   * @param snapshot - The latest authoritative state broadcast by the server.
   */
  onServerSnapshot(snapshot: StateSnapshot): void {
    const serverPlayerState = snapshot.players[this.playerId];
    if (!serverPlayerState) {
      return;
    }

    this.confirmedState = clonePlayerState(serverPlayerState);

    // Trim confirmed inputs — the server has already processed every input with
    // seq <= lastSeq and their effect is reflected in the snapshot state we just
    // received. Keeping them would cause those inputs to be replayed again on top
    // of confirmed state, double-applying their movement.
    const lastSeq = snapshot.lastConfirmedSeq[this.playerId] ?? -1;
    this.pendingInputs = this.pendingInputs.filter((input) => input.seq > lastSeq);
    this.predictedState = this.replayFromConfirmed();
  }

  /**
   * Seeds the predictor with an initial authoritative player state on first
   * snapshot receipt. Must be called before `onInput` or `onServerSnapshot`.
   *
   * @param playerState - The first authoritative state for this player from the server.
   */
  initialize(playerState: PlayerState): void {
    this.confirmedState = clonePlayerState(playerState);
    this.predictedState = clonePlayerState(playerState);
    this.pendingInputs = [];
  }

  /**
   * Returns a defensive clone of the current predicted state for the renderer.
   * Returns `null` if the predictor has not yet been initialized.
   */
  getPredictedState(): PlayerState | null {
    return this.predictedState ? clonePlayerState(this.predictedState) : null;
  }

  private replayFromConfirmed(): PlayerState {
    const baseState = this.confirmedState ?? this.predictedState;
    if (!baseState) {
      throw new Error('LocalPredictor replay attempted before initialization');
    }

    // Replay all still-pending inputs from scratch on top of confirmed state.
    // Starting fresh from confirmed absorbs any server correction (position, velocity,
    // state) before layering on unacknowledged inputs. This keeps the prediction
    // visually consistent with the server's version of reality while preserving the
    // responsiveness of inputs the server hasn't seen yet.
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

  // CLIENT-ONLY visual approximation — infers a display state from movement physics
  // and raw input bits. This is NOT a faithful FSM run: ATTACK lasts only one predicted
  // frame, jumpsquat duration is not tracked, and hitlag/hitstun entry is simplified.
  // The server's FSM result, delivered via snapshot, is always the authoritative state.
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
