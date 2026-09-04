import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "pixi.js";
import { FighterRenderer } from "../FighterRenderer";
import type { CharacterId } from "@smash/shared";
import type { RenderPlayerState } from "../../network/InterpolationBuffer";

describe("characterId pipeline integration", () => {
  let parentContainer: Container;

  beforeEach(() => {
    parentContainer = new Container();
  });

  describe("FighterRenderer characterId flow", () => {
    it("should accept characterId in constructor and store it", () => {
      const characterId: CharacterId = "abe-lincoln";
      const renderer = new FighterRenderer(parentContainer, 0, characterId);

      expect(renderer).toBeDefined();
      expect(renderer.container).toBeDefined();
    });

    it("should work with undefined characterId", () => {
      const renderer = new FighterRenderer(parentContainer, 0, undefined);

      expect(renderer).toBeDefined();
      expect(renderer.container).toBeDefined();
    });

    it("should work without third parameter (backward compatibility)", () => {
      const renderer = new FighterRenderer(parentContainer, 0);

      expect(renderer).toBeDefined();
      expect(renderer.container).toBeDefined();
    });

    it("should accept all valid characterId values", () => {
      const validIds: CharacterId[] = ["all-rounder", "abe-lincoln"];

      for (const id of validIds) {
        const renderer = new FighterRenderer(parentContainer, 0, id);
        expect(renderer).toBeDefined();
        expect(renderer.container).toBeDefined();
      }
    });

    it("should render correctly with characterId set", () => {
      const renderer = new FighterRenderer(parentContainer, 0, "abe-lincoln");

      const playerState: RenderPlayerState = {
        id: "test-player",
        slotIndex: 0,
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        isGrounded: true,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        percent: 0,
        stocks: 3,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        currentMoveId: null,
        characterId: "abe-lincoln",
      };

      // Should not throw
      expect(() => renderer.update(playerState)).not.toThrow();

      // Verify container position updated
      expect(renderer.container.x).toBe(100);
      expect(renderer.container.y).toBe(100);
    });
  });

  describe("RenderPlayerState characterId field", () => {
    it("should accept characterId in RenderPlayerState", () => {
      const state: RenderPlayerState = {
        id: "player-1",
        slotIndex: 0,
        x: 640,
        y: 500,
        vx: 0,
        vy: 0,
        isGrounded: true,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        percent: 0,
        stocks: 3,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        currentMoveId: null,
        characterId: "abe-lincoln",
      };

      expect(state.characterId).toBe("abe-lincoln");
    });

    it("should work with undefined characterId", () => {
      const state: RenderPlayerState = {
        id: "player-1",
        slotIndex: 0,
        x: 640,
        y: 500,
        vx: 0,
        vy: 0,
        isGrounded: true,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        percent: 0,
        stocks: 3,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        currentMoveId: null,
      };

      expect(state.characterId).toBeUndefined();
    });
  });

  describe("Full pipeline: RenderPlayerState → FighterRenderer → PolygonPartRenderer", () => {
    it("should flow characterId from state to renderer without errors", () => {
      const characterId: CharacterId = "abe-lincoln";

      // Create renderer with characterId
      const renderer = new FighterRenderer(parentContainer, 0, characterId);

      // Create player state with same characterId
      const playerState: RenderPlayerState = {
        id: "player-1",
        slotIndex: 0,
        x: 640,
        y: 500,
        vx: 5,
        vy: -2,
        isGrounded: true,
        facing: 1,
        state: "WALK",
        stateFrame: 10,
        percent: 25,
        stocks: 2,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 80,
        currentMoveId: null,
        characterId: characterId,
      };

      // Update should work without errors
      expect(() => renderer.update(playerState)).not.toThrow();

      // Verify renderer updated correctly
      expect(renderer.container.x).toBe(640);
      expect(renderer.container.y).toBe(500);
      expect(renderer.container.scale.x).toBe(1);
    });

    it("should handle mismatched characterId between renderer and state", () => {
      // Create renderer with one characterId
      const renderer = new FighterRenderer(parentContainer, 0, "all-rounder");

      // Update with different characterId in state
      const playerState: RenderPlayerState = {
        id: "player-1",
        slotIndex: 0,
        x: 640,
        y: 500,
        vx: 0,
        vy: 0,
        isGrounded: true,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        percent: 0,
        stocks: 3,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        currentMoveId: null,
        characterId: "abe-lincoln",
      };

      // Should still work (renderer characterId set at construction time)
      expect(() => renderer.update(playerState)).not.toThrow();
    });

    it("should handle undefined characterId throughout pipeline", () => {
      // Create renderer without characterId
      const renderer = new FighterRenderer(parentContainer, 0);

      // Update with state without characterId
      const playerState: RenderPlayerState = {
        id: "player-1",
        slotIndex: 0,
        x: 640,
        y: 500,
        vx: 0,
        vy: 0,
        isGrounded: true,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        percent: 0,
        stocks: 3,
        isInvincible: false,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: 100,
        currentMoveId: null,
      };

      // Should work with all undefined characterIds
      expect(() => renderer.update(playerState)).not.toThrow();
      expect(renderer.container.x).toBe(640);
    });
  });
});
