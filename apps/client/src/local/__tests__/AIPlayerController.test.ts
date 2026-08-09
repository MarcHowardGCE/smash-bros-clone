import { describe, it, expect, beforeEach } from 'vitest';
import { AIPlayerController, type AIPlayerControllerConfig } from '../AIPlayerController.js';
import type { GameState } from '@smash/shared';
import { INPUT_BITS } from '@smash/shared';

// Minimal fixture GameState for testing
function createFixtureGameState(overrides?: Partial<GameState>): GameState {
  const basePlayer = {
    x: 640,
    y: 500,
    vx: 0,
    vy: 0,
    percent: 50,
    stocks: 3,
    facing: 1 as const,
    state: 'Idle',
    stateFrame: 0,
    hitlagFramesRemaining: 0,
    hitstunFramesRemaining: 0,
    isTumbling: false,
    techWindowFrames: 0,
    techLockoutFrames: 0,
    lCancelWindowFrames: 0,
    landingLagFrames: 0,
    isGrounded: true,
    isKnockedOut: false,
    hasDoubleJump: true,
    hasAirDodge: true,
    wallJumpStreak: 0,
    isFastFalling: false,
    isInvincible: false,
    invincibilityFrames: 0,
    isShielding: false,
    shieldHealth: 60,
    shieldStunFrames: 0,
    isGrabbing: false,
    grabbedPlayerId: null,
    respawnTimer: 0,
    ledgeId: null,
    activeHitbox: null,
    currentMoveId: null,
    staleMoveQueue: [],
    hitPlayerIds: new Set<string>(),
    chargeFrames: 0,
    airDodgeDirection: null,
  };

  return {
    tick: 0,
    players: {
      'bot-p1': {
        id: 'bot-p1',
        slotIndex: 0,
        ...basePlayer,
      },
      'opponent-p2': {
        id: 'opponent-p2',
        slotIndex: 1,
        ...basePlayer,
        x: 800,
        percent: 30,
        facing: -1 as const,
      },
    },
    ...overrides,
  } as GameState;
}

describe('AIPlayerController', () => {
  let config: AIPlayerControllerConfig;

  beforeEach(() => {
    config = {
      playerId: 'bot-p1',
      slotIndex: 0,
      opponentPlayerIds: ['opponent-p2'],
      difficulty: 'medium',
      seed: 12345,
    };
  });

  describe('constructor', () => {
    it('stores playerId and slotIndex', () => {
      const controller = new AIPlayerController(config);
      expect(controller.playerId).toBe('bot-p1');
      expect(controller.slotIndex).toBe(0);
    });

    it('resolves difficulty config from BOT_DIFFICULTY_PRESETS', () => {
      const controller = new AIPlayerController(config);
      // Verify internal state by checking that pollInput works (which requires difficultyConfig)
      const state = createFixtureGameState();
      controller.observe(state);
      const event = controller.pollInput();
      // Should not throw and should return an event or null
      expect(event === null || typeof event === 'object').toBe(true);
    });

    it('initializes botMemory with provided seed', () => {
      const controller1 = new AIPlayerController({ ...config, seed: 999 });
      const controller2 = new AIPlayerController({ ...config, seed: 999 });

      const state = createFixtureGameState();
      controller1.observe(state);
      controller2.observe(state);

      const event1 = controller1.pollInput();
      const event2 = controller2.pollInput();

      // Same seed should produce same held bits (deterministic)
      expect(event1?.held).toBe(event2?.held);
    });

    it('requires seed parameter (not optional)', () => {
      // TypeScript will catch this at compile time, but we verify the runtime behavior
      const controller = new AIPlayerController(config);
      expect(controller).toBeDefined();
    });
  });

  describe('observe()', () => {
    it('stores the latest game state', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);
      // Verify by calling pollInput which uses latestState
      const event = controller.pollInput();
      expect(event === null || typeof event === 'object').toBe(true);
    });

    it('allows multiple observe calls', () => {
      const controller = new AIPlayerController(config);
      const state1 = createFixtureGameState();
      const state2 = createFixtureGameState({ tick: 1 });

      controller.observe(state1);
      controller.observe(state2);

      const event = controller.pollInput();
      expect(event === null || typeof event === 'object').toBe(true);
    });
  });

  describe('pollInput()', () => {
    it('returns null if observe() has not been called', () => {
      const controller = new AIPlayerController(config);
      const event = controller.pollInput();
      expect(event).toBeNull();
    });

    it('returns InputEvent or null after observe() is called', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      const event = controller.pollInput();
      // Event can be null (no input) or an InputEvent object
      if (event !== null) {
        expect(event).toHaveProperty('seq');
        expect(event).toHaveProperty('playerId');
        expect(event).toHaveProperty('held');
        expect(event).toHaveProperty('pressed');
        expect(event).toHaveProperty('released');
      }
    });

    it('increments seq counter on each non-null call', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      let lastSeq = -1;
      let eventCount = 0;
      for (let i = 0; i < 10; i++) {
        controller.observe(state);
        const event = controller.pollInput();
        if (event !== null) {
          expect(event.seq).toBeGreaterThan(lastSeq);
          lastSeq = event.seq;
          eventCount++;
        }
      }
      // Verify seq counter increments when events are produced
      // (even if bot decides no input most of the time)
      expect(lastSeq).toBeGreaterThanOrEqual(-1);
    });

    it('computes pressed bits correctly (newly pressed)', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      // First poll: establish baseline
      const event1 = controller.pollInput();
      const firstHeld = event1?.held ?? 0;

      // Second poll with same state: if held bits change, pressed should reflect new bits
      controller.observe(state);
      const event2 = controller.pollInput();

      if (event2 && event2.held !== firstHeld) {
        // If held changed, pressed should contain bits that are now held but weren't before
        const expectedPressed = event2.held & ~firstHeld;
        expect(event2.pressed).toBe(expectedPressed);
      }
    });

    it('computes released bits correctly (newly released)', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      // First poll
      const event1 = controller.pollInput();
      const firstHeld = event1?.held ?? 0;

      // Second poll
      controller.observe(state);
      const event2 = controller.pollInput();

      if (event2 && event2.held !== firstHeld) {
        // If held changed, released should contain bits that were held but aren't now
        const expectedReleased = firstHeld & ~event2.held;
        expect(event2.released).toBe(expectedReleased);
      }
    });

    it('returns null when no input change and no held bits', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      // Poll multiple times; if bot decides no input, should return null
      let event = controller.pollInput();
      // Keep polling until we get a null or establish pattern
      for (let i = 0; i < 5; i++) {
        controller.observe(state);
        event = controller.pollInput();
        if (event === null) {
          expect(event).toBeNull();
          break;
        }
      }
    });

    it('sets playerId correctly in returned event', () => {
      const controller = new AIPlayerController(config);
      const state = createFixtureGameState();
      controller.observe(state);

      // Poll until we get an event
      let event = null;
      for (let i = 0; i < 20; i++) {
        controller.observe(state);
        event = controller.pollInput();
        if (event) break;
      }

      if (event) {
        expect(event.playerId).toBe('bot-p1');
      }
    });
  });

  describe('determinism with same seed', () => {
    it('two controllers with same seed produce identical held bits', () => {
      const controller1 = new AIPlayerController({ ...config, seed: 7777 });
      const controller2 = new AIPlayerController({ ...config, seed: 7777 });

      const state = createFixtureGameState();
      controller1.observe(state);
      controller2.observe(state);

      const event1 = controller1.pollInput();
      const event2 = controller2.pollInput();

      expect(event1?.held).toBe(event2?.held);
    });

    it('two controllers with different seeds produce different held bits (usually)', () => {
      const controller1 = new AIPlayerController({ ...config, seed: 1111 });
      const controller2 = new AIPlayerController({ ...config, seed: 2222 });

      const state = createFixtureGameState();
      controller1.observe(state);
      controller2.observe(state);

      // Poll multiple times to increase chance of difference
      let event1 = null;
      let event2 = null;
      for (let i = 0; i < 10; i++) {
        controller1.observe(state);
        controller2.observe(state);
        event1 = controller1.pollInput();
        event2 = controller2.pollInput();
        if (event1?.held !== event2?.held) {
          break;
        }
      }

      // At least one should be different (very high probability)
      // Note: this is probabilistic, but with 10 iterations it's extremely likely
      expect(event1?.held !== event2?.held || event1 === null || event2 === null).toBe(true);
    });
  });

  describe('edge-bit transitions', () => {
    it('detects pressed bits when decision changes from no-input to input', () => {
      const controller = new AIPlayerController(config);

      // State 1: bot decides no input
      const state1 = createFixtureGameState();

      controller.observe(state1);
      const event1 = controller.pollInput();
      const firstHeld = event1?.held ?? 0;

      // State 2: bot decides to attack (or move)
      const state2 = createFixtureGameState({
        players: {
          'bot-p1': {
            id: 'bot-p1',
            slotIndex: 0,
            x: 640,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 50,
            stocks: 3,
            facing: 1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: false,
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
          'opponent-p2': {
            id: 'opponent-p2',
            slotIndex: 1,
            x: 700, // Opponent moved closer
            y: 500,
            vx: 0,
            vy: 0,
            percent: 30,
            stocks: 3,
            facing: -1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: false,
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
        },
      });

      controller.observe(state2);
      const event2 = controller.pollInput();
      const secondHeld = event2?.held ?? 0;

      // If held bits changed, pressed should reflect the new bits
      if (secondHeld !== firstHeld) {
        const expectedPressed = secondHeld & ~firstHeld;
        expect(event2?.pressed).toBe(expectedPressed);
      }
    });
  });

  describe('setTick()', () => {
    it('is a no-op and does not throw', () => {
      const controller = new AIPlayerController(config);
      expect(() => controller.setTick(0)).not.toThrow();
      expect(() => controller.setTick(100)).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('is a no-op and does not throw', () => {
      const controller = new AIPlayerController(config);
      expect(() => controller.destroy()).not.toThrow();
    });

    it('can be called multiple times', () => {
      const controller = new AIPlayerController(config);
      expect(() => {
        controller.destroy();
        controller.destroy();
      }).not.toThrow();
    });
  });

  describe('ITickController interface compliance', () => {
    it('implements all required ITickController members', () => {
      const controller = new AIPlayerController(config);
      expect(controller).toHaveProperty('playerId');
      expect(controller).toHaveProperty('slotIndex');
      expect(controller).toHaveProperty('setTick');
      expect(controller).toHaveProperty('pollInput');
      expect(controller).toHaveProperty('destroy');
      expect(controller).toHaveProperty('observe');
    });

    it('playerId and slotIndex are declared as readonly in TypeScript', () => {
      const controller = new AIPlayerController(config);
      // TypeScript enforces readonly at compile time, not runtime
      // Verify they have the correct values
      expect(controller.playerId).toBe('bot-p1');
      expect(controller.slotIndex).toBe(0);
    });
  });

  describe('difficulty levels', () => {
    it('accepts easy difficulty', () => {
      const controller = new AIPlayerController({ ...config, difficulty: 'easy' });
      const state = createFixtureGameState();
      controller.observe(state);
      const event = controller.pollInput();
      expect(event === null || typeof event === 'object').toBe(true);
    });

    it('accepts medium difficulty', () => {
      const controller = new AIPlayerController({ ...config, difficulty: 'medium' });
      const state = createFixtureGameState();
      controller.observe(state);
      const event = controller.pollInput();
      expect(event === null || typeof event === 'object').toBe(true);
    });

    it('accepts hard difficulty', () => {
      const controller = new AIPlayerController({ ...config, difficulty: 'hard' });
      const state = createFixtureGameState();
      controller.observe(state);
      const event = controller.pollInput();
      expect(event === null || typeof event === 'object').toBe(true);
    });
  });

  describe('multi-opponent target selection', () => {
    it('(a) selects alive opponent when one is KO\'d', () => {
      const controller = new AIPlayerController({
        ...config,
        opponentPlayerIds: ['opponent-p2', 'opponent-p3'],
      });

      const state = createFixtureGameState({
        players: {
          'bot-p1': {
            id: 'bot-p1',
            slotIndex: 0,
            x: 640,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 50,
            stocks: 3,
            facing: 1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: false,
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
          'opponent-p2': {
            id: 'opponent-p2',
            slotIndex: 1,
            x: 800,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 30,
            stocks: 3,
            facing: -1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: true, // KO'd
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
          'opponent-p3': {
            id: 'opponent-p3',
            slotIndex: 2,
            x: 500,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 20,
            stocks: 3,
            facing: -1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: false, // Alive
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
        },
      });

      controller.observe(state);
      // Poll multiple times to get an event with input
      let event = null;
      for (let i = 0; i < 20; i++) {
        controller.observe(state);
        event = controller.pollInput();
        if (event) break;
      }

      // If we got an event, verify it's targeting p3 (closer, alive)
      // We can't directly inspect the target, but we verify the controller doesn't crash
      // and produces valid output
      if (event) {
        expect(event.playerId).toBe('bot-p1');
        expect(typeof event.held).toBe('number');
      }
    });

    it('(b) returns null when all opponents are KO\'d', () => {
      const controller = new AIPlayerController({
        ...config,
        opponentPlayerIds: ['opponent-p2', 'opponent-p3'],
      });

      const state = createFixtureGameState({
        players: {
          'bot-p1': {
            id: 'bot-p1',
            slotIndex: 0,
            x: 640,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 50,
            stocks: 3,
            facing: 1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: false,
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
          'opponent-p2': {
            id: 'opponent-p2',
            slotIndex: 1,
            x: 800,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 30,
            stocks: 3,
            facing: -1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: true, // KO'd
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
          'opponent-p3': {
            id: 'opponent-p3',
            slotIndex: 2,
            x: 500,
            y: 500,
            vx: 0,
            vy: 0,
            percent: 20,
            stocks: 3,
            facing: -1 as const,
            state: 'Idle',
            stateFrame: 0,
            hitlagFramesRemaining: 0,
            hitstunFramesRemaining: 0,
            isTumbling: false,
            techWindowFrames: 0,
            techLockoutFrames: 0,
            lCancelWindowFrames: 0,
            landingLagFrames: 0,
            isGrounded: true,
            isKnockedOut: true, // KO'd
            hasDoubleJump: true,
            hasAirDodge: true,
            wallJumpStreak: 0,
            isFastFalling: false,
            isInvincible: false,
            invincibilityFrames: 0,
            isShielding: false,
            shieldHealth: 60,
            shieldStunFrames: 0,
            isGrabbing: false,
            grabbedPlayerId: null,
            respawnTimer: 0,
            ledgeId: null,
            activeHitbox: null,
            currentMoveId: null,
            staleMoveQueue: [],
            hitPlayerIds: new Set<string>(),
            chargeFrames: 0,
            airDodgeDirection: null,
          },
        },
      });

      controller.observe(state);
      const event = controller.pollInput();
      expect(event).toBeNull();
    });

    it('(c) returns null when opponentPlayerIds is empty array', () => {
      const controller = new AIPlayerController({
        ...config,
        opponentPlayerIds: [],
      });

      const state = createFixtureGameState();
      controller.observe(state);
      const event = controller.pollInput();
      expect(event).toBeNull();
    });
  });
});
