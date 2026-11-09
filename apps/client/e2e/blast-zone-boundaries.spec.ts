import { dismissSplash, chooseFirstStage } from "./helpers/flow";
import { expect, test, type Page } from "@playwright/test";

type Boundary = "left" | "right" | "top" | "bottom";

type KOEventData = {
	readonly playerId: string;
	readonly boundary: Boundary;
	readonly tick: number;
};

type DebugPlayer = {
	readonly id: string;
	readonly slotIndex: number;
	readonly stocks: number;
	readonly x: number;
	readonly y: number;
	readonly tick: number;
	readonly isInvincible: boolean;
	readonly invincibilityFrames: number;
	readonly respawnTimer: number;
};

const MATCH_CONFIG = {
	RESPAWN_DELAY_FRAMES: 120,
	RESPAWN_INVINCIBILITY_FRAMES: 180,
	RESPAWN_PLATFORM_Y: 200,
} as const;

const STAGE = {
	BLAST_LEFT: -300,
	BLAST_RIGHT: 1580,
	BLAST_TOP: -200,
	BLAST_BOTTOM: 820,
	SPAWN_X_P1: 415,
} as const;

const BOUNDARY_PROBES: Record<
	Boundary,
	{
		readonly near: { readonly x: number; readonly y: number };
		readonly over: { readonly x: number; readonly y: number };
	}
> = {
	left: {
		near: { x: STAGE.BLAST_LEFT + 8, y: 320 },
		over: { x: STAGE.BLAST_LEFT - 6, y: 320 },
	},
	right: {
		near: { x: STAGE.BLAST_RIGHT - 8, y: 320 },
		over: { x: STAGE.BLAST_RIGHT + 6, y: 320 },
	},
	top: {
		near: { x: 640, y: STAGE.BLAST_TOP + 8 },
		over: { x: 640, y: STAGE.BLAST_TOP - 6 },
	},
	bottom: {
		near: { x: 640, y: STAGE.BLAST_BOTTOM - 8 },
		over: { x: 640, y: STAGE.BLAST_BOTTOM + 6 },
	},
};

async function startLocalMatch(page: Page): Promise<void> {
	await page.goto("/");
  await dismissSplash(page);
	await page.waitForSelector("#local-play-btn", { timeout: 10_000 });
	await page.click("#local-play-btn");
	await page.waitForSelector("#lps-start-btn", { timeout: 10_000 });
	await page.click("#lps-start-btn");
	await page.keyboard.press("Enter");
	await page.keyboard.press("KeyU");
  await chooseFirstStage(page);
	await page.waitForFunction(
		() => {
			const debug = (
				window as Window & {
					__smashDebug?: { getSnapshot?: () => { matchPhase?: string } | null };
				}
			).__smashDebug;
			return debug?.getSnapshot?.()?.matchPhase === "match";
		},
		{ timeout: 15_000, polling: 50 },
	);
	await page.waitForTimeout(300);
}

async function getPlayerBySlot(
	page: Page,
	slotIndex: number,
): Promise<DebugPlayer> {
	const player = await page.evaluate((targetSlot: number) => {
		const snapshot = (
			window as Window & {
				__smashDebug?: {
					getSnapshot?: () =>
						| {
								tick: number;
								players: Record<
									string,
									{
										id: string;
										slotIndex: number;
										stocks: number;
										x: number;
										y: number;
										isInvincible: boolean;
										invincibilityFrames: number;
										respawnTimer: number;
									}
								>;
						  }
						| null;
				};
			}
		).__smashDebug?.getSnapshot?.();

		if (!snapshot) {
			return null;
		}

		const candidate = Object.values(snapshot.players).find(
			(entry) => entry.slotIndex === targetSlot,
		);
		if (!candidate) {
			return null;
		}

		return {
			id: candidate.id,
			slotIndex: candidate.slotIndex,
			stocks: candidate.stocks,
			x: candidate.x,
			y: candidate.y,
			tick: snapshot.tick,
			isInvincible: candidate.isInvincible,
			invincibilityFrames: candidate.invincibilityFrames,
			respawnTimer: candidate.respawnTimer,
		};
	}, slotIndex);

	if (!player) {
		throw new Error(`slot ${slotIndex} not found in debug snapshot`);
	}

	return player;
}

async function crossBlastBoundary(page: Page, player: DebugPlayer, boundary: Boundary): Promise<void> {
	await page.evaluate(({ id, stocks, near, over, keepInside }) => {
		const debug = window.__smashDebug;
		const startTick = debug.getSnapshot().tick;
		if (!debug.forcePosition(id, near.x, near.y)) throw new Error(`Could not position ${id}`);
		// Point away from the bottom blast zone while sampling the inside position.
		if (keepInside) debug.getSnapshot().players[id].vy = -8;

		return new Promise<void>((resolve, reject) => {
			const deadline = performance.now() + 2000;
			const sample = () => {
				const snapshot = debug.getSnapshot();
				if (snapshot.tick > startTick) {
					if (snapshot.players[id]?.stocks !== stocks) {
						reject(new Error("The inside probe consumed a stock"));
					} else if (!debug.forcePosition(id, over.x, over.y)) {
						reject(new Error(`Could not cross the blast boundary with ${id}`));
					} else {
						resolve();
					}
				} else if (performance.now() >= deadline) {
					reject(new Error("The simulation did not advance after the inside probe"));
				} else {
					requestAnimationFrame(sample);
				}
			};
			requestAnimationFrame(sample);
		});
	}, { id: player.id, stocks: player.stocks, ...BOUNDARY_PROBES[boundary], keepInside: boundary === "bottom" });
}

async function drainKOEvents(page: Page): Promise<void> {
	await page.evaluate(() => {
		const debug = (
			window as Window & {
				__smashDebug?: { getKOEvents?: () => readonly KOEventData[] };
			}
		).__smashDebug;
		debug?.getKOEvents?.();
	});
}

async function pollKOEvent(
	page: Page,
	playerId: string,
	boundary: Boundary,
	timeoutMs: number,
): Promise<KOEventData> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const event = await page.evaluate(
			(payload: { playerId: string; boundary: Boundary }) => {
				const debug = (
					window as Window & {
						__smashDebug?: { getKOEvents?: () => readonly KOEventData[] };
					}
				).__smashDebug;
				const events = debug?.getKOEvents?.() ?? [];
				return (
					events.find(
						(entry) =>
							entry.playerId === payload.playerId &&
							entry.boundary === payload.boundary,
					) ?? null
				);
			},
			{ playerId, boundary },
		);

		if (event) {
			return event;
		}

		await page.waitForTimeout(16);
	}

	throw new Error(`KO event timeout for boundary ${boundary}`);
}

async function verifyRespawnAndInvincibility(
	page: Page,
	respawning: DebugPlayer,
	koTick: number,
): Promise<void> {
	expect(respawning.respawnTimer).toBeGreaterThan(0);
	expect(respawning.x).toBe(STAGE.SPAWN_X_P1);
	expect(respawning.y).toBe(MATCH_CONFIG.RESPAWN_PLATFORM_Y);
	expect(respawning.isInvincible).toBe(true);
	expect(respawning.invincibilityFrames).toBe(MATCH_CONFIG.RESPAWN_INVINCIBILITY_FRAMES);

	// Remaining counters give the transition tick even when Chromium skips a rendered frame.
	const releaseTick = respawning.tick + respawning.respawnTimer;
	const invincibilityEndTick = releaseTick + respawning.invincibilityFrames;
	expect(Math.abs(releaseTick - koTick - MATCH_CONFIG.RESPAWN_DELAY_FRAMES)).toBeLessThanOrEqual(1);

	let observedInvincibilityAfterRelease = false;
	await expect.poll(async () => {
		const current = await getPlayerBySlot(page, 0);
		expect(current.id).toBe(respawning.id);
		expect(current.stocks).toBe(respawning.stocks);
		if (current.tick < releaseTick) {
			expect(current.tick + current.respawnTimer).toBe(releaseTick);
			return false;
		}

		expect(current.respawnTimer).toBe(0);
		const remaining = Math.max(0, invincibilityEndTick - current.tick);
		expect(current.invincibilityFrames).toBe(remaining);
		expect(current.isInvincible).toBe(remaining > 0);
		observedInvincibilityAfterRelease ||= remaining > 0;
		return remaining === 0;
	}, { timeout: 8000 }).toBe(true);
	expect(observedInvincibilityAfterRelease).toBe(true);
}

async function runBoundaryScenario(page: Page, boundary: Boundary): Promise<void> {
	await startLocalMatch(page);
	const initial = await getPlayerBySlot(page, 0);
	await drainKOEvents(page);

	await crossBlastBoundary(page, initial, boundary);

	const koEvent = await pollKOEvent(page, initial.id, boundary, 4_000);
	const afterKO = await getPlayerBySlot(page, 0);
	expect(initial.stocks - afterKO.stocks).toBe(1);

	await verifyRespawnAndInvincibility(page, afterKO, koEvent.tick);
}

test.describe("Tier-1 blast-zone deterministic telemetry", () => {
	test.setTimeout(60_000);

	test("left boundary KO telemetry", async ({ page }) => {
		await runBoundaryScenario(page, "left");
	});

	test("right boundary KO telemetry", async ({ page }) => {
		await runBoundaryScenario(page, "right");
	});

	test("top boundary KO telemetry", async ({ page }) => {
		await runBoundaryScenario(page, "top");
	});

	test("bottom boundary KO telemetry", async ({ page }) => {
		await runBoundaryScenario(page, "bottom");
	});
});
