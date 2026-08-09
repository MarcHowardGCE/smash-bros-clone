import { describe, it, expect } from "vitest";
import { AVAILABLE_FIGHTERS } from "./main.js";

describe("AVAILABLE_FIGHTERS roster", () => {
	it("should contain exactly 2 fighters", () => {
		expect(AVAILABLE_FIGHTERS).toHaveLength(2);
	});

	it("should have all-rounder as first fighter with correct id and displayName", () => {
		const fighter = AVAILABLE_FIGHTERS[0];
		expect(fighter).toBeDefined();
		expect(fighter!.id).toBe("all-rounder");
		expect(fighter!.displayName).toBe("All-Rounder");
	});

	it("should have abe-lincoln as second fighter with correct id and displayName", () => {
		const fighter = AVAILABLE_FIGHTERS[1];
		expect(fighter).toBeDefined();
		expect(fighter!.id).toBe("abe-lincoln");
		expect(fighter!.displayName).toBe("Abe Lincoln");
	});

	it("should maintain order: all-rounder then abe-lincoln", () => {
		const ids = AVAILABLE_FIGHTERS.map((f) => f.id);
		expect(ids).toEqual(["all-rounder", "abe-lincoln"]);
	});
});
