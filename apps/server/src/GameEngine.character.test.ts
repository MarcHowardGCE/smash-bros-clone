import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine.js';
import type { PlayerState, InputEvent, PlayerId, GameState } from '@smash/shared';
import { INPUT_BITS, MoveId, PlayerStateEnum } from '@smash/shared';

describe('GameEngine character-aware move resolution', () => {
  let engine: GameEngine;
  const P1 = 'player-one';
  const P2 = 'player-two';

  function makeInput(playerId: string, tick: number, held: number, pressed: number): InputEvent {
    return { tick, seq: tick, playerId, held, pressed, released: 0 };
  }

  function getMutableState(engine: GameEngine): GameState {
    return (engine as unknown as { state: GameState }).state;
  }

  function tick(
    engine: GameEngine,
    inputs: Partial<Record<PlayerId, InputEvent | null>> = {},
  ): GameState {
    const playerIds = Object.keys(getMutableState(engine).players) as PlayerId[];
    const inputMap = new Map<PlayerId, InputEvent | null>();

    for (const playerId of playerIds) {
      inputMap.set(playerId, inputs[playerId] ?? null);
    }

    return engine.tickGame(inputMap);
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

  describe('characterIds constructor param', () => {
    it('defaults to all-rounder when characterIds not provided', () => {
      engine = new GameEngine({ playerIds: [P1, P2] });
      const snapshot = engine.getSnapshot(0, { [P1]: 0, [P2]: 0 });

      expect(snapshot.players[P1]?.characterId).toBe('all-rounder');
      expect(snapshot.players[P2]?.characterId).toBe('all-rounder');
    });

    it('accepts per-player characterIds and sets PlayerState.characterId', () => {
      engine = new GameEngine({
        playerIds: [P1, P2],
        characterIds: { [P1]: 'abe-lincoln', [P2]: 'all-rounder' },
      });
      const snapshot = engine.getSnapshot(0, { [P1]: 0, [P2]: 0 });

      expect(snapshot.players[P1]?.characterId).toBe('abe-lincoln');
      expect(snapshot.players[P2]?.characterId).toBe('all-rounder');
    });

    it('defaults missing characterIds to all-rounder', () => {
      engine = new GameEngine({
        playerIds: [P1, P2],
        characterIds: { [P1]: 'abe-lincoln' },
      });
      const snapshot = engine.getSnapshot(0, { [P1]: 0, [P2]: 0 });

      expect(snapshot.players[P1]?.characterId).toBe('abe-lincoln');
      expect(snapshot.players[P2]?.characterId).toBe('all-rounder');
    });
  });

  describe('Lincoln move resolution', () => {
    beforeEach(() => {
      engine = new GameEngine({
        playerIds: [P1],
        characterIds: { [P1]: 'abe-lincoln' },
      });
    });

    it('resolves Lincoln JAB with Lincoln hitbox stats (offsetX: 58)', () => {
      // Prime player to be in JAB attack state, at first active frame (stateFrame 3)
      primePlayer(engine, P1, {
        y: 500,
        isGrounded: true,
        state: PlayerStateEnum.ATTACK,
        stateFrame: 3,  // First active frame for JAB (startupFrames: 3)
        currentMoveId: MoveId.JAB,
        hitPlayerIds: new Set<string>(),
      });

      // Tick once to compute hitbox
      tick(engine, { [P1]: null });

      const snapshot = engine.getSnapshot(0, { [P1]: 0 });
      const p1 = snapshot.players[P1]!;

      // Hitbox should be Lincoln's JAB with offsetX: 58
      expect(p1.activeHitbox).not.toBeNull();
      expect(p1.activeHitbox?.offsetX).toBe(58); // Lincoln JAB
      expect(p1.activeHitbox?.radius).toBe(22);
      expect(p1.activeHitbox?.damage).toBe(3);
    });

    it('all-rounder resolves default JAB with offsetX: 45', () => {
      // Create engine with all-rounder
      engine = new GameEngine({
        playerIds: [P1],
        characterIds: { [P1]: 'all-rounder' },
      });

      // Prime player to be in JAB attack state, at first active frame
      primePlayer(engine, P1, {
        y: 500,
        isGrounded: true,
        state: PlayerStateEnum.ATTACK,
        stateFrame: 3,  // First active frame for JAB
        currentMoveId: MoveId.JAB,
        hitPlayerIds: new Set<string>(),
      });

      // Tick once to compute hitbox
      tick(engine, { [P1]: null });

      const snapshot = engine.getSnapshot(0, { [P1]: 0 });
      const p1 = snapshot.players[P1]!;

      // Hitbox should be default JAB with offsetX: 45
      expect(p1.activeHitbox).not.toBeNull();
      expect(p1.activeHitbox?.offsetX).toBe(45); // Default JAB
      expect(p1.activeHitbox?.radius).toBe(22);
    });

    it('Lincoln FORWARD_SMASH resolves with Lincoln hitbox stats (offsetX: 78)', () => {
      // Prime player to be in FORWARD_SMASH attack state, at first active frame (stateFrame 15)
      primePlayer(engine, P1, {
        y: 500,
        facing: 1,
        isGrounded: true,
        state: PlayerStateEnum.ATTACK,
        stateFrame: 15,  // First active frame for FORWARD_SMASH (startupFrames: 15)
        currentMoveId: MoveId.FORWARD_SMASH,
        chargeFrames: 0,
        hitPlayerIds: new Set<string>(),
      });

      // Tick once to compute hitbox
      tick(engine, { [P1]: null });

      const snapshot = engine.getSnapshot();
      const p1 = snapshot.players[P1]!;

      // Hitbox should be Lincoln's FORWARD_SMASH with offsetX: 78
      expect(p1.activeHitbox).not.toBeNull();
      expect(p1.activeHitbox?.offsetX).toBe(78); // Lincoln FORWARD_SMASH
      expect(p1.activeHitbox?.damage).toBe(20);
    });
  });
});
