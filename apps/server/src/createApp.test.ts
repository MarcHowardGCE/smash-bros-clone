import type { AddressInfo } from "node:net";
import { decode } from "@msgpack/msgpack";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as createClient, type Socket } from "socket.io-client";
import { createApp } from "./createApp.js";

type AckResponse = { readonly [key: string]: unknown };

const EVENT_TIMEOUT_MS = 7000;

function waitForEvent<T>(
	socket: Socket,
	event: string,
	timeoutMs = EVENT_TIMEOUT_MS,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeoutHandle = setTimeout(() => {
			socket.off(event, onEvent);
			reject(new Error(`Timed out waiting for ${event}`));
		}, timeoutMs);

		function onEvent(payload: T) {
			clearTimeout(timeoutHandle);
			resolve(payload);
		}

		socket.once(event, onEvent);
	});
}

function waitForConnect(socket: Socket): Promise<void> {
	if (socket.connected) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve, reject) => {
		const timeoutHandle = setTimeout(() => {
			socket.off("connect", onConnect);
			reject(new Error("Socket connect timeout"));
		}, EVENT_TIMEOUT_MS);

		function onConnect() {
			clearTimeout(timeoutHandle);
			resolve();
		}

		socket.once("connect", onConnect);
	});
}

function emitWithAck<T>(
	socket: Socket,
	event: string,
	...args: readonly unknown[]
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeoutHandle = setTimeout(() => {
			reject(new Error(`Ack timeout for ${event}`));
		}, EVENT_TIMEOUT_MS);

		socket.emit(event, ...args, (response: T) => {
			clearTimeout(timeoutHandle);
			resolve(response);
		});
	});
}

const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

function requireSocket(
	socket: Socket | undefined,
	name: string,
): Socket {
	if (!socket) {
		throw new Error(`Missing socket: ${name}`);
	}
	return socket;
}

describe("createApp socket integration", () => {
	let sockets: Socket[] = [];
	let roomCode = "";
	let httpServer: ReturnType<typeof createApp>["httpServer"];
	let io: ReturnType<typeof createApp>["io"];
	let roomManager: ReturnType<typeof createApp>["roomManager"];

	beforeEach(() => {
		const app = createApp();
		httpServer = app.httpServer;
		io = app.io;
		roomManager = app.roomManager;
	});

	afterEach(async () => {
		for (const socket of sockets) {
			if (socket.connected) {
				socket.disconnect();
			}
		}
		sockets = [];
		roomCode = "";

		await new Promise<void>((resolve) => {
			io.close(() => resolve());
		});
		await new Promise<void>((resolve) => {
			httpServer.close(() => resolve());
		});
	});

	async function bootAndConnect(count: 2): Promise<readonly [Socket, Socket]>;
	async function bootAndConnect(
		count: 3,
	): Promise<readonly [Socket, Socket, Socket]>;
	async function bootAndConnect(count: number): Promise<readonly Socket[]> {
		await new Promise<void>((resolve) => {
			httpServer.listen(0, resolve);
		});
		const port = (httpServer.address() as AddressInfo).port;

		const created = Array.from({ length: count }, () =>
			createClient(`http://localhost:${port}`, {
				transports: ["websocket"],
				reconnection: false,
			}),
		);

		sockets = [...created];
		await Promise.all(created.map((socket) => waitForConnect(socket)));
		return created;
	}

	it("runs room:create -> character select -> countdown -> game:start and carries selected characters in game:state", async () => {
		const connected = await bootAndConnect(2);
		const clientA = requireSocket(connected[0], "clientA");
		const clientB = requireSocket(connected[1], "clientB");

		const roomCreated = await emitWithAck<AckResponse>(clientA, "room:create");
		roomCode = String(roomCreated.roomCode);
		const playerAId = String(roomCreated.playerId);

		const roomJoined = await emitWithAck<AckResponse>(
			clientB,
			"room:join",
			roomCode,
		);
		const playerBId = String(roomJoined.playerId);

		let countdownBeforeConfirm = false;
		const onEarlyCountdown = () => {
			countdownBeforeConfirm = true;
		};
		clientA.once("game:countdown", onEarlyCountdown);
		clientB.once("game:countdown", onEarlyCountdown);

		const aCharacterSelectStart = waitForEvent<{ readonly playerIds: string[] }>(
			clientA,
			"room:characterSelectStart",
		);
		const bCharacterSelectStart = waitForEvent<{ readonly playerIds: string[] }>(
			clientB,
			"room:characterSelectStart",
		);

		clientA.emit("player:ready", roomCode);
		clientB.emit("player:ready", roomCode);

		const [aStartPayload, bStartPayload] = await Promise.all([
			aCharacterSelectStart,
			bCharacterSelectStart,
		]);
		expect(aStartPayload.playerIds).toContain(playerAId);
		expect(aStartPayload.playerIds).toContain(playerBId);
		expect(bStartPayload.playerIds).toContain(playerAId);
		expect(bStartPayload.playerIds).toContain(playerBId);
		expect(countdownBeforeConfirm).toBe(false);

		const seenUpdatesA = new Map<string, string>();
		const seenUpdatesB = new Map<string, string>();
		const updateDoneA = new Promise<void>((resolve) => {
			clientA.on(
				"character:updated",
				(payload: { readonly playerId: string; readonly characterId: string }) => {
					seenUpdatesA.set(payload.playerId, payload.characterId);
					if (
						seenUpdatesA.get(playerAId) === "abe-lincoln" &&
						seenUpdatesA.get(playerBId) === "all-rounder"
					) {
						resolve();
					}
				},
			);
		});
		const updateDoneB = new Promise<void>((resolve) => {
			clientB.on(
				"character:updated",
				(payload: { readonly playerId: string; readonly characterId: string }) => {
					seenUpdatesB.set(payload.playerId, payload.characterId);
					if (
						seenUpdatesB.get(playerAId) === "abe-lincoln" &&
						seenUpdatesB.get(playerBId) === "all-rounder"
					) {
						resolve();
					}
				},
			);
		});

		const selectAckA = await emitWithAck<AckResponse>(
			clientA,
			"character:select",
			roomCode,
			"abe-lincoln",
		);
		expect(selectAckA.ok).toBe(true);

		const selectAckB = await emitWithAck<AckResponse>(
			clientB,
			"character:select",
			roomCode,
			"all-rounder",
		);
		expect(selectAckB.ok).toBe(true);

		await Promise.all([updateDoneA, updateDoneB]);

		const countdownA = waitForEvent<{ readonly seconds: number }>(
			clientA,
			"game:countdown",
		);
		const countdownB = waitForEvent<{ readonly seconds: number }>(
			clientB,
			"game:countdown",
		);

		const confirmAckA = await emitWithAck<AckResponse>(
			clientA,
			"character:confirm",
			roomCode,
		);
		expect(confirmAckA.ok).toBe(true);
		expect(confirmAckA.allConfirmed).toBe(false);

		const confirmAckB = await emitWithAck<AckResponse>(
			clientB,
			"character:confirm",
			roomCode,
		);
		expect(confirmAckB.ok).toBe(true);
		expect(confirmAckB.allConfirmed).toBe(true);

		const [countdownPayloadA, countdownPayloadB] = await Promise.all([
			countdownA,
			countdownB,
		]);
		expect(countdownPayloadA.seconds).toBe(3);
		expect(countdownPayloadB.seconds).toBe(3);

		const [gameStartA, gameStartB] = await Promise.all([
			waitForEvent<{ readonly playerIds: string[] }>(clientA, "game:start", 10000),
			waitForEvent<{ readonly playerIds: string[] }>(clientB, "game:start", 10000),
		]);
		expect(gameStartA.playerIds).toContain(playerAId);
		expect(gameStartA.playerIds).toContain(playerBId);
		expect(gameStartB.playerIds).toContain(playerAId);
		expect(gameStartB.playerIds).toContain(playerBId);

		const stateA = await waitForEvent<Uint8Array>(clientA, "game:state", 10000);
		const decoded = decode(stateA) as {
			readonly players: Record<
				string,
				{ readonly characterId?: string | undefined }
			>;
		};

		expect(decoded.players[playerAId]?.characterId).toBe("abe-lincoln");
		expect(decoded.players[playerBId]?.characterId).toBe("all-rounder");
	});

	it("resets to LOBBY and allows rejoin when a player disconnects during CHARACTER_SELECT", async () => {
		const connected = await bootAndConnect(3);
		const clientA = requireSocket(connected[0], "clientA");
		const clientB = requireSocket(connected[1], "clientB");
		const clientC = requireSocket(connected[2], "clientC");

		const roomCreated = await emitWithAck<AckResponse>(clientA, "room:create");
		roomCode = String(roomCreated.roomCode);
		const playerBJoin = await emitWithAck<AckResponse>(
			clientB,
			"room:join",
			roomCode,
		);
		const playerBId = String(playerBJoin.playerId);

		const characterSelectStart = waitForEvent<unknown>(
			clientA,
			"room:characterSelectStart",
		);
		clientA.emit("player:ready", roomCode);
		clientB.emit("player:ready", roomCode);
		await characterSelectStart;

		const playerLeft = waitForEvent<{ readonly playerId: string }>(
			clientA,
			"room:playerLeft",
		);
		clientB.disconnect();

		const playerLeftPayload = await playerLeft;
		expect(playerLeftPayload.playerId).toBe(playerBId);
		expect(roomManager.getRoom(roomCode)?.phase).toBe("LOBBY");

		const joinThird = await emitWithAck<AckResponse>(
			clientC,
			"room:join",
			roomCode,
		);
		expect(joinThird.error).toBeUndefined();
		expect(typeof joinThird.playerId).toBe("string");
	});

	it("cancels countdown and prevents game:start when a player disconnects during COUNTDOWN", async () => {
		const connected = await bootAndConnect(3);
		const clientA = requireSocket(connected[0], "clientA");
		const clientB = requireSocket(connected[1], "clientB");
		const clientC = requireSocket(connected[2], "clientC");

		const roomCreated = await emitWithAck<AckResponse>(clientA, "room:create");
		roomCode = String(roomCreated.roomCode);
		const playerBJoin = await emitWithAck<AckResponse>(
			clientB,
			"room:join",
			roomCode,
		);
		const playerBId = String(playerBJoin.playerId);

		const characterSelectStart = waitForEvent<unknown>(
			clientA,
			"room:characterSelectStart",
		);
		clientA.emit("player:ready", roomCode);
		clientB.emit("player:ready", roomCode);
		await characterSelectStart;

		await emitWithAck<AckResponse>(
			clientA,
			"character:confirm",
			roomCode,
		);

		const countdownA = waitForEvent<{ readonly seconds: number }>(
			clientA,
			"game:countdown",
		);
		await emitWithAck<AckResponse>(
			clientB,
			"character:confirm",
			roomCode,
		);
		await countdownA;

		let gameStartReceived = false;
		clientA.on("game:start", () => {
			gameStartReceived = true;
		});

		const playerLeft = waitForEvent<{ readonly playerId: string }>(
			clientA,
			"room:playerLeft",
		);
		clientB.disconnect();

		const playerLeftPayload = await playerLeft;
		expect(playerLeftPayload.playerId).toBe(playerBId);

		await wait(4000);
		expect(gameStartReceived).toBe(false);
		expect(roomManager.getRoom(roomCode)?.phase).toBe("LOBBY");

		const joinThird = await emitWithAck<AckResponse>(
			clientC,
			"room:join",
			roomCode,
		);
		expect(joinThird.error).toBeUndefined();
		expect(typeof joinThird.playerId).toBe("string");
	});

	it("keeps session alive during MATCH phase disconnect and allows rejoin within grace window", async () => {
		const connected = await bootAndConnect(2);
		const clientA = requireSocket(connected[0], "clientA");
		const clientB = requireSocket(connected[1], "clientB");

		// Create room and join
		const roomCreated = await emitWithAck<AckResponse>(clientA, "room:create");
		roomCode = String(roomCreated.roomCode);
		const playerAId = String(roomCreated.playerId);

		const playerBJoin = await emitWithAck<AckResponse>(
			clientB,
			"room:join",
			roomCode,
		);
		const playerBId = String(playerBJoin.playerId);

		// Ready up and start character select
		const characterSelectStart = waitForEvent<unknown>(
			clientA,
			"room:characterSelectStart",
		);
		clientA.emit("player:ready", roomCode);
		clientB.emit("player:ready", roomCode);
		await characterSelectStart;

		// Confirm characters and countdown
		const countdownA = waitForEvent<{ readonly seconds: number }>(
			clientA,
			"game:countdown",
		);
		await emitWithAck<AckResponse>(
			clientA,
			"character:confirm",
			roomCode,
		);
		await emitWithAck<AckResponse>(
			clientB,
			"character:confirm",
			roomCode,
		);
		await countdownA;

		// Wait for game to start
		const gameStartA = waitForEvent<{ readonly playerIds: readonly string[] }>(
			clientA,
			"game:start",
		);
		const gameStartB = waitForEvent<{ readonly playerIds: readonly string[] }>(
			clientB,
			"game:start",
		);
		await Promise.all([gameStartA, gameStartB]);

		// Verify match is in progress
		const room = roomManager.getRoom(roomCode);
		expect(room?.phase).toBe("MATCH");

		// Disconnect player B (simulating network drop)
		const playerDisconnected = waitForEvent<{ readonly playerId: string; readonly graceSeconds: number }>(
			clientA,
			"room:playerDisconnected",
		);
		clientB.disconnect();

		const disconnectPayload = await playerDisconnected;
		expect(disconnectPayload.playerId).toBe(playerBId);
		expect(disconnectPayload.graceSeconds).toBe(30);

		// Verify session is still alive
		const roomAfterDisconnect = roomManager.getRoom(roomCode);
		expect(roomAfterDisconnect?.phase).toBe("MATCH");

		// Verify player B slot is marked as disconnected
		const playerBSlot = roomAfterDisconnect?.players.get(playerBId);
		expect(playerBSlot).toBeDefined();
		expect(playerBSlot?.socketId).toBeDefined(); // Original socket still bound until rejoin

		// Reconnect player B with new socket ID
		const addr = httpServer.address();
		const port = typeof addr === 'object' && addr !== null ? addr.port : 3001;
		const clientBReconnected = createClient(`http://localhost:${port}`, {
			transports: ["websocket"],
		});
		await waitForConnect(clientBReconnected);

		const rejoinResult = await emitWithAck<{ readonly ok: boolean; readonly error?: string }>(
			clientBReconnected,
			"room:rejoin",
			{ roomCode, playerId: playerBId },
		);
		expect(rejoinResult.ok).toBe(true);
		expect(rejoinResult.error).toBeUndefined();

		// Verify player is re-joined
		const playerRejoined = waitForEvent<{ readonly playerId: string }>(
			clientA,
			"room:playerRejoined",
		);
		await playerRejoined;

		const roomAfterRejoin = roomManager.getRoom(roomCode);
		expect(roomAfterRejoin?.phase).toBe("MATCH");

		const playerBSlotAfterRejoin = roomAfterRejoin?.players.get(playerBId);
		expect(playerBSlotAfterRejoin?.socketId).toBe(clientBReconnected.id);

		sockets.push(clientBReconnected);
	});

	it("rejects rejoin after grace window expires", async () => {
		const connected = await bootAndConnect(2);
		const clientA = requireSocket(connected[0], "clientA");
		const clientB = requireSocket(connected[1], "clientB");

		// Create room and start match (abbreviated flow)
		const roomCreated = await emitWithAck<AckResponse>(clientA, "room:create");
		roomCode = String(roomCreated.roomCode);
		const playerAId = String(roomCreated.playerId);

		const playerBJoin = await emitWithAck<AckResponse>(
			clientB,
			"room:join",
			roomCode,
		);
		const playerBId = String(playerBJoin.playerId);

		// Ready up
		const characterSelectStart = waitForEvent<unknown>(
			clientA,
			"room:characterSelectStart",
		);
		clientA.emit("player:ready", roomCode);
		clientB.emit("player:ready", roomCode);
		await characterSelectStart;

		// Confirm characters
		const countdownA = waitForEvent<{ readonly seconds: number }>(
			clientA,
			"game:countdown",
		);
		await emitWithAck<AckResponse>(clientA, "character:confirm", roomCode);
		await emitWithAck<AckResponse>(clientB, "character:confirm", roomCode);
		await countdownA;

		// Wait for game start
		const gameStartA = waitForEvent<{ readonly playerIds: readonly string[] }>(
			clientA,
			"game:start",
		);
		const gameStartB = waitForEvent<{ readonly playerIds: readonly string[] }>(
			clientB,
			"game:start",
		);
		await Promise.all([gameStartA, gameStartB]);

		// Disconnect player B
		const playerDisconnected = waitForEvent<{ readonly playerId: string; readonly graceSeconds: number }>(
			clientA,
			"room:playerDisconnected",
		);
		clientB.disconnect();
		await playerDisconnected;

		// Wait for grace window to expire (31 seconds) — need extended timeout for this test
		await wait(31000);

		// Try to rejoin after grace window expired
		const addr = httpServer.address();
		const port = typeof addr === 'object' && addr !== null ? addr.port : 3001;
		const clientBReconnected = createClient(`http://localhost:${port}`, {
			transports: ["websocket"],
		});
		await waitForConnect(clientBReconnected);

		const rejoinResult = await emitWithAck<{ readonly ok: boolean; readonly error?: string }>(
			clientBReconnected,
			"room:rejoin",
			{ roomCode, playerId: playerBId },
		);
		expect(rejoinResult.ok).toBe(false);
		expect(rejoinResult.error).toBe("Rejoin grace window expired");

		sockets.push(clientBReconnected);
	}, 40000); // Extended timeout for grace window expiry test
});
