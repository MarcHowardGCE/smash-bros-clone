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
	await page.waitForSelector("#local-play-btn", { timeout: 10_000 });
	await page.click("#local-play-btn");
	await page.waitForSelector("#lps-start-btn", { timeout: 10_000 });
	await page.click("#lps-start-btn");
	await page.keyboard.press("Enter");
	await page.keyboard.press("KeyU");
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
			respawnTimer: candidate.respawnTimer,
		};
	}, slotIndex);

	if (!player) {
		throw new Error(`slot ${slotIndex} not found in debug snapshot`);
	}

	return player;
}

async function forcePosition(
	page: Page,
	playerId: string,
	x: number,
	y: number,
): Promise<void> {
	const ok = await page.evaluate(
		(payload: { playerId: string; x: number; y: number }) => {
			const debug = (
				window as Window & {
					__smashDebug?: {
						forcePosition?: (playerId: string, x: number, y: number) => boolean;
					};
				}
			).__smashDebug;
			return debug?.forcePosition?.(payload.playerId, payload.x, payload.y) ?? false;
		},
		{ playerId, x, y },
	);

	if (!ok) {
		throw new Error(`forcePosition failed for player ${playerId}`);
	}
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
	playerId: string,
	koTick: number,
): Promise<void> {
	let releaseSnapshot: DebugPlayer | null = null;
	const releaseDeadline = Date.now() + 8_000;
	while (Date.now() < releaseDeadline) {
		const current = await getPlayerBySlot(page, 0);
		if (current.id !== playerId) {
			throw new Error(`expected slot-0 id ${playerId}, got ${current.id}`);
		}

		if (current.respawnTimer === 0) {
			releaseSnapshot = current;
			break;
		}

		await page.waitForTimeout(16);
	}

	if (!releaseSnapshot) {
		throw new Error("respawn release timer did not reach 0");
	}

	const respawnDelayFrames = releaseSnapshot.tick - koTick;
	expect(respawnDelayFrames).toBeGreaterThanOrEqual(
		MATCH_CONFIG.RESPAWN_DELAY_FRAMES - 2,
	);
	expect(respawnDelayFrames).toBeLessThanOrEqual(
		MATCH_CONFIG.RESPAWN_DELAY_FRAMES + 2,
	);

	expect(Math.abs(releaseSnapshot.x - STAGE.SPAWN_X_P1)).toBeLessThanOrEqual(3);
	expect(Math.abs(releaseSnapshot.y - MATCH_CONFIG.RESPAWN_PLATFORM_Y)).toBeLessThanOrEqual(
		3,
	);

	let invincibilityEndTick: number | null = null;
	const invincibilityDeadline = Date.now() + 8_000;
	while (Date.now() < invincibilityDeadline) {
		const current = await getPlayerBySlot(page, 0);
		if (!current.isInvincible) {
			invincibilityEndTick = current.tick;
			break;
		}
		await page.waitForTimeout(16);
	}

	if (invincibilityEndTick === null) {
		throw new Error("invincibility did not end within timeout");
	}

	const invincibilityFrames = invincibilityEndTick - releaseSnapshot.tick;
	expect(invincibilityFrames).toBeGreaterThanOrEqual(
		MATCH_CONFIG.RESPAWN_INVINCIBILITY_FRAMES - 2,
	);
	expect(invincibilityFrames).toBeLessThanOrEqual(
		MATCH_CONFIG.RESPAWN_INVINCIBILITY_FRAMES + 2,
	);
}

async function runBoundaryScenario(page: Page, boundary: Boundary): Promise<void> {
	await startLocalMatch(page);
	const initial = await getPlayerBySlot(page, 0);
	await drainKOEvents(page);

	const probe = BOUNDARY_PROBES[boundary];
	await forcePosition(page, initial.id, probe.near.x, probe.near.y);
	await page.waitForTimeout(50);
	await forcePosition(page, initial.id, probe.over.x, probe.over.y);

	const koEvent = await pollKOEvent(page, initial.id, boundary, 4_000);
	const afterKO = await getPlayerBySlot(page, 0);
	expect(initial.stocks - afterKO.stocks).toBe(1);

	await verifyRespawnAndInvincibility(page, initial.id, koEvent.tick);
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
