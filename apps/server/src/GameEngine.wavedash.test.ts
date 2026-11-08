import { describe, expect, it } from 'vitest';
import {
	INPUT_BITS,
	PHYSICS,
	PlayerStateEnum,
	type GameState,
	type InputEvent,
	type PlayerId,
	type PlayerState,
} from '@smash/shared';
import { GameEngine } from './GameEngine.js';
import {airDodgeLandingLag} from '@smash/engine';

function makeInput(playerId: PlayerId, bits = 0): InputEvent {
	return {
		tick: 0,
		seq: 0,
		playerId,
		held: bits,
		pressed: bits,
		released: 0,
	};
}

function getMutableState(engine: GameEngine): GameState {
	return (engine as unknown as { state: GameState }).state;
}

function primePlayer(
	engine: GameEngine,
	playerId: PlayerId,
	overrides: Partial<PlayerState>,
): void {
	const state = getMutableState(engine);
	const player = state.players[playerId];

	if (!player) {
		throw new Error(`Unknown player: ${playerId}`);
	}

	state.players[playerId] = {
		...player,
		...overrides,
	};
}

function tick(
	engine: GameEngine,
	inputs: Partial<Record<PlayerId, InputEvent | null>> = {},
): GameState {
	const inputMap = new Map<PlayerId, InputEvent | null>();
	const playerIds = Object.keys(getMutableState(engine).players) as PlayerId[];

	for (const playerId of playerIds) {
		inputMap.set(playerId, inputs[playerId] ?? null);
	}

	return engine.tickGame(inputMap);
}

describe('GameEngine air-dodge landing (replaces legacy synthetic wavedash)', () => {
	it('diagonal landing preserves flight momentum and enters recovery', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_DODGE,
			stateFrame: 5,
			isGrounded: false,
			airDodgeDirection: { x: 1, y: 1 }, // downward + right
			landingLagFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wavedash landing');
		}

		// Should land and transition to LANDING_LAG
		expect(player.isGrounded).toBe(true);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.landingLagFrames).toBe(airDodgeLandingLag({characterId:player.characterId,stateFrame:6,airDodgeDirection:{x:1,y:1}})-1);
		// Landing preserves current directional-flight momentum.
		expect(player.vx).toBeCloseTo(PHYSICS.AIR_DODGE_SPEED / Math.sqrt(2));
	});

	it('wavedash slide velocity decays via GROUND_FRICTION each subsequent tick', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 500,
			vx: PHYSICS.WAVEDASH_INITIAL_SLIDE_VELOCITY,
			vy: 0,
			state: PlayerStateEnum.LANDING_LAG,
			stateFrame: 0,
			isGrounded: true,
			landingLagFrames: 10,
		});

		// Tick with no input (no direction held) — should apply GROUND_FRICTION
		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after friction decay');
		}

		// vx should be decayed by GROUND_FRICTION
		const expectedVx = PHYSICS.WAVEDASH_INITIAL_SLIDE_VELOCITY * PHYSICS.GROUND_FRICTION;
		expect(player.vx).toBeCloseTo(expectedVx, 5);
		// Still in LANDING_LAG, landingLagFrames should decrement
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.landingLagFrames).toBe(9);
	});

	it('neutral AIR_DODGE landing (no directional component) behaves normally without wavedash', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_DODGE,
			stateFrame: 5,
			isGrounded: false,
			airDodgeDirection: { x: 0, y: 0 }, // neutral dodge
			landingLagFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after neutral dodge landing');
		}

		// Neutral dodge also has landing recovery.
		expect(player.isGrounded).toBe(true);
		// vx should remain 0 (no wavedash momentum)
		expect(player.vx).toBe(0);
		// Neutral dodge landing must complete its ten recovery ticks.
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.landingLagFrames).toBe(9);
	});

	it('horizontal AIR_DODGE recovery landing (no downward component) does not wavedash', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_DODGE,
			stateFrame: 14, // after directional travel ends
			isGrounded: false,
			airDodgeDirection: { x: 1, y: 0 }, // horizontal only, no downward
			landingLagFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after horizontal-only dodge landing');
		}

		// Horizontal dodge also has landing recovery.
		expect(player.isGrounded).toBe(true);
		expect(player.vx).toBe(0);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.landingLagFrames).toBeGreaterThanOrEqual(11);
	});

	it('left diagonal landing preserves flight momentum without synthetic boost', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_DODGE,
			stateFrame: 5,
			isGrounded: false,
			airDodgeDirection: { x: -1, y: 1 }, // downward + left
			landingLagFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after left wavedash landing');
		}

		// Should land and transition to LANDING_LAG
		expect(player.isGrounded).toBe(true);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.landingLagFrames).toBe(airDodgeLandingLag({characterId:player.characterId,stateFrame:6,airDodgeDirection:{x:1,y:1}})-1);
		// Landing preserves leftward flight momentum.
		expect(player.vx).toBeCloseTo(-PHYSICS.AIR_DODGE_SPEED / Math.sqrt(2));
	});

	it('regression: hasAirDodge=false blocks second directional dodge (wavedash spam prevention)', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;

		// Prime player: airborne, hasAirDodge already consumed (false)
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - 100, // airborne
			vx: 0,
			vy: -5, // moving upward
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			hasAirDodge: false, // Already used air dodge this airborne period
			airDodgeDirection: null,
			landingLagFrames: 0,
		});

		// Attempt to trigger second directional dodge (shield + down + right)
		const state = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.SHIELD | INPUT_BITS.DOWN | INPUT_BITS.RIGHT),
		});
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after second dodge attempt');
		}

		// Should NOT transition to AIR_DODGE because hasAirDodge is false
		expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(player.hasAirDodge).toBe(false);
	});

	it('regression: hasAirDodge resets on landing, allowing second wavedash after landing', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE_MAIN_Y = 500;

		// Step 1: Prime player in AIR_DODGE state, about to land with wavedash direction
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE_MAIN_Y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_DODGE,
			stateFrame: 5,
			isGrounded: false,
			hasAirDodge: false, // Already consumed by this air dodge
			airDodgeDirection: { x: 1, y: 1 }, // downward + right (wavedash)
			landingLagFrames: 0,
		});

		// Tick to land and trigger wavedash
		let state = tick(engine, { p1: null });
		let player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wavedash landing');
		}

		// Verify landing recovery without synthetic momentum.
		expect(player.isGrounded).toBe(true);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(player.vx).toBeCloseTo(PHYSICS.AIR_DODGE_SPEED / Math.sqrt(2));
		// KEY REGRESSION TEST: hasAirDodge should be reset on landing
		expect(player.hasAirDodge).toBe(true);

		// Step 2: Wait for landing lag to finish (tick until state changes to IDLE)
		let tickCount = 0;
		while (player?.state === PlayerStateEnum.LANDING_LAG && tickCount < 20) {
			state = tick(engine, { p1: null });
			player = state.players.p1;
			tickCount++;
		}

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after landing lag');
		}

		// Should be grounded and idle now
		expect(player.isGrounded).toBe(true);
		expect(player.state).toBe(PlayerStateEnum.IDLE);
		// hasAirDodge should still be true (reset from landing)
		expect(player.hasAirDodge).toBe(true);

		// Step 3: Prime player back into airborne state (simulating jump)
		primePlayer(engine, 'p1', {
			...player,
			y: STAGE_MAIN_Y - 100, // airborne
			vy: -5, // moving upward
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			hasAirDodge: true, // Should still be true from landing reset
		});

		// Step 4: Attempt second wavedash (should succeed because hasAirDodge is true)
		state = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.SHIELD | INPUT_BITS.DOWN | INPUT_BITS.RIGHT),
		});
		player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after second dodge attempt');
		}

		// Should transition to AIR_DODGE because hasAirDodge is true
		expect(player.state).toBe(PlayerStateEnum.AIR_DODGE);
		expect(player.hasAirDodge).toBe(false); // Consumed by second dodge
	});
});

it('air-dodge landing starts refresh immediately while actions still wait for recovery',()=>{
 const engine=new GameEngine({playerIds:['p1']});
 primePlayer(engine,'p1',{x:640,y:471,vx:0,vy:4,state:PlayerStateEnum.AIR_DODGE,stateFrame:5,isGrounded:false,airDodgeDirection:{x:0,y:0},dodgeFatigue:3,dodgeRecoveryTicks:120,dodgeRefreshTicks:undefined});
 let p=tick(engine).players.p1!;expect(p.landingLagFrames).toBe(9);expect(p.dodgeRefreshPending).toBe(false);expect(p.dodgeRefreshTicks).toBe(60);
 p=tick(engine,{p1:makeInput('p1',INPUT_BITS.ATTACK)}).players.p1!;expect(p.state).toBe(PlayerStateEnum.LANDING_LAG);expect(p.dodgeRefreshTicks).toBe(59);
 while(p.landingLagFrames>3)p=tick(engine).players.p1!;
 p=tick(engine,{p1:makeInput('p1',INPUT_BITS.ATTACK)}).players.p1!;
 for(let n=0;n<5&&p.state!==PlayerStateEnum.ATTACK;n++)p=tick(engine).players.p1!;
 expect(p.state).toBe(PlayerStateEnum.ATTACK);expect(p.dodgeRefreshPending).toBe(false);expect(p.dodgeRefreshTicks).toBeLessThan(60);
});

it('hit-interrupted dodge starts refresh after hitlag, before airborne hitstun ends',()=>{
 const engine=new GameEngine({playerIds:['p1']});
 primePlayer(engine,'p1',{state:PlayerStateEnum.AIR_DODGE,stateFrame:40,isGrounded:false,x:640,y:200,airDodgeDirection:{x:1,y:0},dodgeFatigue:4,dodgeRecoveryTicks:120,dodgeRefreshTicks:undefined});
 const state=getMutableState(engine),hit={hit:true,damage:3,hitlagFrames:2,hitstunFrames:20,knockbackVx:1,knockbackVy:0};
 state.players.p1=(engine as any).applyHit(state.players.p1,hit,1);
 let p=state.players.p1!;expect(p.dodgeRefreshPending).toBe(true);expect(p.dodgeRefreshTicks).toBeUndefined();
 for(let n=0;n<2;n++){p=tick(engine).players.p1!;expect(p.dodgeRefreshTicks).toBeUndefined();}
 p=tick(engine).players.p1!;expect(p.dodgeRefreshPending).toBe(false);expect(p.dodgeRefreshTicks).toBe(60);expect(p.hitstunFramesRemaining).toBeGreaterThan(0);expect(p.isGrounded).toBe(false);
});
it('airdodge ledge interruption arms refresh immediately',()=>{const engine=new GameEngine({playerIds:['p1']});const p={...getMutableState(engine).players.p1!,state:PlayerStateEnum.AIR_DODGE,dodgeFatigue:3,dodgeRefreshTicks:undefined};const result=(engine as any).snapPlayerToLedge(p,'left');expect(result.state).toBe(PlayerStateEnum.LEDGE_HANG);expect(result.dodgeRefreshTicks).toBe(60);});
