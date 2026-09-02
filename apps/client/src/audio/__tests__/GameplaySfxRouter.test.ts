import { PlayerStateEnum, type PlayerId } from "@smash/shared";
import { describe, expect, it, vi } from "vitest";
import {
  GameplaySfxRouter,
  type GameplaySfxPlayerState,
} from "../GameplaySfxRouter.js";

function player(
  overrides: Partial<GameplaySfxPlayerState> = {},
): GameplaySfxPlayerState {
  return {
    id: "p1",
    state: PlayerStateEnum.IDLE,
    vy: 0,
    isGrounded: true,
    stocks: 3,
    ...overrides,
  };
}

function frame(...players: GameplaySfxPlayerState[]) {
  return {
    players: new Map(players.map((entry) => [entry.id as PlayerId, entry])),
  };
}

describe("GameplaySfxRouter", () => {
  it("seeds the first frame without playing sounds", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });

    router.processFrame(frame(player({ state: PlayerStateEnum.SHIELD })));

    expect(play).not.toHaveBeenCalled();
  });

  it("plays jump once when entering a jump state", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });
    router.processFrame(frame(player()));

    router.processFrame(frame(player({ state: PlayerStateEnum.JUMPSQUAT })));
    router.processFrame(frame(player({ state: PlayerStateEnum.JUMPSQUAT })));
    router.processFrame(
      frame(
        player({
          state: PlayerStateEnum.AIRBORNE,
          isGrounded: false,
          vy: -8,
        }),
      ),
    );

    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith("jump");
  });

  it("detects a jump when prediction or snapshot cadence skips jumpsquat", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });
    router.processFrame(frame(player()));

    router.processFrame(
      frame(
        player({
          state: PlayerStateEnum.AIRBORNE,
          isGrounded: false,
          vy: -7,
        }),
      ),
    );

    expect(play).toHaveBeenCalledWith("jump");
  });

  it("does not treat walking off an edge as a jump", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });
    router.processFrame(frame(player()));

    router.processFrame(
      frame(
        player({
          state: PlayerStateEnum.AIRBORNE,
          isGrounded: false,
          vy: 0,
        }),
      ),
    );

    expect(play).not.toHaveBeenCalled();
  });

  it("plays land and shield only on their rising edges", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });
    router.processFrame(
      frame(
        player({
          state: PlayerStateEnum.AIRBORNE,
          isGrounded: false,
        }),
      ),
    );

    router.processFrame(frame(player()));
    router.processFrame(frame(player({ state: PlayerStateEnum.SHIELD })));
    router.processFrame(frame(player({ state: PlayerStateEnum.SHIELD })));

    expect(play.mock.calls).toEqual([["land"], ["shield"]]);
  });

  it("plays KO on a stock decrement and deduplicates an immediate result event", () => {
    let now = 1000;
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play }, () => now);
    router.processFrame(frame(player()));

    router.processFrame(frame(player({ stocks: 2 })));
    router.processMatchResult();
    now += 251;
    router.processMatchResult();

    expect(play.mock.calls).toEqual([["ko"], ["ko"]]);
  });

  it("forgets removed players and resets explicitly between matches", () => {
    const play = vi.fn();
    const router = new GameplaySfxRouter({ play });
    router.processFrame(frame(player()));
    router.processFrame(frame());
    router.processFrame(frame(player({ stocks: 2 })));
    router.reset();
    router.processFrame(frame(player({ state: PlayerStateEnum.SHIELD })));

    expect(play).not.toHaveBeenCalled();
  });
});
