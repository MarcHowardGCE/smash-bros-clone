import { describe, it, expect } from "vitest";
import { AVAILABLE_FIGHTERS } from "./main.js";

describe("AVAILABLE_FIGHTERS roster", () => {
	it("should contain exactly 3 fighters", () => {
		expect(AVAILABLE_FIGHTERS).toHaveLength(3);
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

	it("should have swift as third fighter with correct id and displayName", () => {
		const fighter = AVAILABLE_FIGHTERS[2];
		expect(fighter).toBeDefined();
		expect(fighter!.id).toBe("swift");
		expect(fighter!.displayName).toBe("Swift");
	});

	it("should maintain order: all-rounder, abe-lincoln, swift", () => {
		const ids = AVAILABLE_FIGHTERS.map((f) => f.id);
		expect(ids).toEqual(["all-rounder", "abe-lincoln", "swift"]);
	});
});
