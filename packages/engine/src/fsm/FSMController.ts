import type { InputEvent, PlayerState } from '@smash/shared';
import { PlayerStateEnum } from '@smash/shared';
import { INPUT_BITS } from '@smash/shared';
import type { FSMContext, FSMTransition, IFSMState } from './index.js';
import { AirAttackState } from './states/AirAttackState.js';
import { AirborneState } from './states/AirborneState.js';
import { AirDodgeState } from './states/AirDodgeState.js';
import { AttackState } from './states/AttackState.js';
import { DashState } from './states/DashState.js';
import { DoubleJumpState } from './states/DoubleJumpState.js';
import { GrabHoldingState } from './states/GrabHoldingState.js';
import { GrabState } from './states/GrabState.js';
import { HitstunState } from './states/HitstunState.js';
import { HardLandingState } from './states/HardLandingState.js';
import { LandingLagState } from './states/LandingLagState.js';
import { IdleState } from './states/IdleState.js';
import { JumpsquatState } from './states/JumpsquatState.js';
import { RollState } from './states/RollState.js';
import { RunState } from './states/RunState.js';
import { ShieldState } from './states/ShieldState.js';
import { SpotDodgeState } from './states/SpotDodgeState.js';
import { TechNeutralState } from './states/TechNeutralState.js';
import { TechRollState } from './states/TechRollState.js';
import { WalkState } from './states/WalkState.js';
import { LedgeHangState } from './states/LedgeHangState.js';
import { LedgeClimbState } from './states/LedgeClimbState.js';
import { LedgeJumpState } from './states/LedgeJumpState.js';
import { LedgeAttackState } from './states/LedgeAttackState.js';
import { LedgeRollState } from './states/LedgeRollState.js';

/**
 * FSMController — per-fighter finite state machine driver.
 *
 * WHY state objects are pre-instantiated in a Map:
 *   Several states are stateful across the enter → update → exit lifecycle of a single
 *   activation. AttackState, for example, stores `totalFrames` (derived from the active
 *   MoveData) during `enter()` and reads it on every subsequent `update()` call. If
 *   states were constructed on-demand at transition time that field would be lost the
 *   moment the object was discarded. Pre-instantiating each state once at construction
 *   and looking it up from the Map guarantees each state's own memory persists for the
 *   full duration of its activation.
 *
 * WHY each fighter needs its own FSMController instance:
 *   The state objects carry mutable per-activation data (frame counters, cached move
 *   references, etc.). Sharing one FSMController across multiple fighters would cause
 *   their activations to interleave inside the same state objects, corrupting both.
 *   One controller = one fighter's isolated truth.
 *
 * WHY tick() re-syncs stateName from player.state at the start of each tick:
 *   The server is the authoritative source of truth and can forcibly override a
 *   fighter's state at any tick — for example, snapping the player into HITSTUN the
 *   moment a hit lands. When that override arrives the FSM must detect the mismatch
 *   and switch its active state object immediately; otherwise it would keep running
 *   the old state for an extra tick and "fight back" against the server correction.
 *
 * WHY stateFrame is a per-state counter that resets to 0 on every transition:
 *   States need to know how far into *their own* lifespan they are — "am I on frame 3
 *   of this attack?" not "how many ticks has the match been running?". Resetting to 0
 *   on every transition gives each state an unambiguous 0 → N local timeline that maps
 *   directly onto the startup / active / recovery frame windows declared in MoveData.
 */
export class FSMController {
  private currentState: IFSMState;
  private stateName: PlayerStateEnum;
  private readonly stateRegistry: Map<PlayerStateEnum, IFSMState>;

  constructor(initialState: PlayerStateEnum = PlayerStateEnum.IDLE) {
    this.stateRegistry = new Map([
      [PlayerStateEnum.IDLE, new IdleState()],
      [PlayerStateEnum.WALK, new WalkState()],
      [PlayerStateEnum.DASH, new DashState()],
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
      [PlayerStateEnum.TECH_NEUTRAL, new TechNeutralState()],
      [PlayerStateEnum.TECH_ROLL, new TechRollState()],
      [PlayerStateEnum.HARD_LANDING, new HardLandingState()],
      [PlayerStateEnum.LANDING_LAG, new LandingLagState()],
      [PlayerStateEnum.GRAB, new GrabState()],
      [PlayerStateEnum.GRAB_HOLDING, new GrabHoldingState()],
      [PlayerStateEnum.LEDGE_HANG, new LedgeHangState()],
      [PlayerStateEnum.LEDGE_CLIMB, new LedgeClimbState()],
      [PlayerStateEnum.LEDGE_JUMP, new LedgeJumpState()],
      [PlayerStateEnum.LEDGE_ATTACK, new LedgeAttackState()],
      [PlayerStateEnum.LEDGE_ROLL, new LedgeRollState()],
    ]);

    this.stateName = initialState;
    this.currentState = this.getState(initialState);
  }

	  tick(player: PlayerState, input: InputEvent | null): PlayerState {
    if (player.state !== this.stateName) {
      this.stateName = player.state as PlayerStateEnum;
      this.currentState = this.getState(this.stateName);
    }

    // HITLAG: zero velocity for both attacker and defender during the freeze window.
    // This is a deliberate Smash Bros game-feel mechanic — the brief shared freeze on
    // impact makes hits feel weighty and impactful rather than passing through.
    // No state machine progress occurs during hitlag; the early return skips the rest of tick().
	    if (player.hitlagFramesRemaining > 0) {
	      const decrementedCooldown = Math.max(0, (player.sdiInputCooldown ?? 0) - 1);
	      const leftHeld = Boolean((input?.held ?? 0) & INPUT_BITS.LEFT);
	      const rightHeld = Boolean((input?.held ?? 0) & INPUT_BITS.RIGHT);
	      const upHeld = Boolean((input?.held ?? 0) & INPUT_BITS.JUMP);
	      const downHeld = Boolean((input?.held ?? 0) & INPUT_BITS.DOWN);
	      const inputX = leftHeld === rightHeld ? 0 : leftHeld ? -1 : 1;
	      const inputY = upHeld === downHeld ? 0 : upHeld ? -1 : 1;
	      const hasDirectionalInput = inputX !== 0 || inputY !== 0;
	      const canAcceptSdiInput = decrementedCooldown <= 0;

	      const sdiDeltaX = hasDirectionalInput && canAcceptSdiInput ? inputX * 3 : 0;
	      const sdiDeltaY = hasDirectionalInput && canAcceptSdiInput ? inputY * 3 : 0;
	      const nextSdiCooldown =
	        hasDirectionalInput && canAcceptSdiInput ? 4 : decrementedCooldown;

	      return {
	        ...player,
	        hitlagFramesRemaining: player.hitlagFramesRemaining - 1,
	        sdiInputCooldown: nextSdiCooldown,
	        x: player.x + sdiDeltaX,
	        y: player.y + sdiDeltaY,
	        vx: 0,
	        vy: 0,
	      };
	    }

	    // ASDI (Automatic/Additional SDI): post-hitlag hitstun drift
	    // Applies only when hitlag has ended (hitlagFramesRemaining <= 0) and player is in HITSTUN state.
	    // Each frame with directional input, apply positional drift (not velocity) clamped to max total.
	    if (
	      player.hitlagFramesRemaining <= 0 &&
	      player.state === PlayerStateEnum.HITSTUN &&
	      player.hitstunFramesRemaining > 0
	    ) {
	      const leftHeld = Boolean((input?.held ?? 0) & INPUT_BITS.LEFT);
	      const rightHeld = Boolean((input?.held ?? 0) & INPUT_BITS.RIGHT);
	      const upHeld = Boolean((input?.held ?? 0) & INPUT_BITS.JUMP);
	      const downHeld = Boolean((input?.held ?? 0) & INPUT_BITS.DOWN);
	      const inputX = leftHeld === rightHeld ? 0 : leftHeld ? -1 : 1;
	      const inputY = upHeld === downHeld ? 0 : upHeld ? -1 : 1;
	      const hasDirectionalInput = inputX !== 0 || inputY !== 0;

	      if (hasDirectionalInput) {
	        const currentAccumulated = player.asdiDriftAccumulated ?? 0;
	        const driftDelta = 2; // PHYSICS.ASDI_DRIFT_PX_PER_FRAME
	        const newAccumulated = Math.min(
	          currentAccumulated + driftDelta,
	          30, // PHYSICS.ASDI_MAX_TOTAL_DRIFT_PX
	        );
	        const actualDrift = newAccumulated - currentAccumulated;

	        return {
	          ...player,
	          x: player.x + inputX * actualDrift,
	          y: player.y + inputY * actualDrift,
	          asdiDriftAccumulated: newAccumulated,
	        };
	      }
	    }

    const ctx: FSMContext = {
      player,
      input,
      isGrounded: player.isGrounded,
    };

    let transition = this.currentState.update(ctx, player.stateFrame);

    // stateFrame advances here — before any transition is applied. This is intentional:
    // the current state's update() already ran against the current stateFrame value,
    // so the incremented count correctly represents "frames spent in this state so far"
    // at the moment the transition fires. applyTransition() will reset it to 0 for
    // the incoming state.
    
    // Force drop from grounded states if we walked off an edge
    const groundedStates = [
      PlayerStateEnum.IDLE,
      PlayerStateEnum.WALK,
      PlayerStateEnum.DASH,
      PlayerStateEnum.RUN,
      PlayerStateEnum.JUMPSQUAT,
      PlayerStateEnum.SHIELD,
      PlayerStateEnum.ATTACK,
    ];
    if (!player.isGrounded && groundedStates.includes(player.state as PlayerStateEnum) && !transition) {
      transition = { nextState: PlayerStateEnum.AIRBORNE };
    }

    let nextPlayer: PlayerState = {
      ...player,
      stateFrame: player.stateFrame + 1,
    };

    // HITSTUN is tracked separately from HITLAG:
    // hitlag ends first (typically 3–8 frames) and both fighters emerge from it together;
    // hitstun continues only for the defender and governs how long they remain unable to
    // act during knockback. Decrementing here keeps hitstun counting down every tick even
    // while the state machine is otherwise running normally.
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

    // stateFrame resets to 0 so the incoming state always starts its own frame-count
    // from frame 0, regardless of how many frames elapsed in the outgoing state.
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
