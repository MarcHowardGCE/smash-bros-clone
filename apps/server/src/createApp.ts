/**
 * @fileoverview Express + socket.io application factory.
 *
 * Wires together the HTTP server, socket.io server, CORS configuration, and
 * static file serving. In production (`NODE_ENV=production`) the built client
 * `dist/` is served as static files from the same process, making this a
 * single deployable unit. All game event routing (room lifecycle, input
 * forwarding, match coordination) lives inside the `io.on('connection', ...)`
 * handler returned by this factory.
 */

import type * as http from "node:http";
import express from "express";
import { createServer } from "node:http";
import { decode } from "@msgpack/msgpack";
import type { CharacterId, InputEvent, PlayerId } from "@smash/shared";
import { isCharacterId } from "@smash/shared";
import { Server } from "socket.io";
import { MatchSession } from "./MatchSession.js";
import { RoomManager } from "./RoomManager.js";

/**
 * Creates and configures the Express + socket.io application.
 *
 * @remarks
 * **What this wires up:**
 *
 * - An Express app with optional static file serving in production
 * - A socket.io `Server` bound to the HTTP server with WebSocket-only
 *   transport (`["websocket"]`), a 5 s ping interval, and 10 s ping timeout
 * - CORS origin controlled by the `CLIENT_ORIGIN` environment variable
 *   (defaults to `http://localhost:5173`)
 * - A single {@link RoomManager} instance shared across all connections
 * - A `matchSessions` map keyed by room code holding active {@link MatchSession}
 *   instances
 * - A `countdownTimers` map keyed by room code holding in-flight `setTimeout`
 *   handles so they can be cancelled on early disconnect
 *
 * **Socket events handled:**
 *
 * | Event | Direction | Description |
 * |---|---|---|
 * | `room:create` | client → server | Create a new room; returns `{ roomCode, playerId, slotIndex }` |
 * | `room:join` | client → server | Join an existing room by code |
 * | `player:ready` | client → server | Mark self as ready; triggers character select when all ready |
 * | `character:select` | client → server | Set character choice (unconfirmed) |
 * | `character:confirm` | client → server | Lock in character; triggers 3 s countdown when all confirmed |
 * | `game:input` | client → server | Binary msgpack `InputEvent`; forwarded to the active session |
 * | `game:pause` | client → server | Pause the active match session |
 * | `game:resume` | client → server | Resume a paused match session |
 * | `room:leave` | client → server | Explicit leave (treated identically to disconnect) |
 * | `disconnect` | socket.io | Handles cleanup for any phase |
 *
 * @returns An object containing the raw `httpServer`, the socket.io `io`
 *   instance, and the `roomManager` — all three are exposed so tests can
 *   inspect internal state without going through the socket layer.
 */
export function createApp(): {
	httpServer: http.Server;
	io: Server;
	roomManager: RoomManager;
} {
	const app = express();
	const httpServer = createServer(app);

	if (process.env.NODE_ENV === "production") {
		const clientDistPath = new URL("../../client/dist", import.meta.url)
			.pathname;
		app.use(express.static(clientDistPath));
		app.use((_req, res) => {
			res.sendFile("index.html", { root: clientDistPath });
		});
	}

	const io = new Server(httpServer, {
		transports: ["websocket"],
		cors: {
			origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
			methods: ["GET", "POST"],
		},
		pingInterval: 5000,
		pingTimeout: 10000,
	});

	const roomManager = new RoomManager();
	const matchSessions = new Map<string, MatchSession>();
	const countdownTimers = new Map<string, ReturnType<typeof setTimeout>>();

	io.on("connection", (socket) => {
		console.log(`[server] connected: ${socket.id}`);

		socket.on("room:create", (callback: (data: unknown) => void) => {
			const result = roomManager.createRoom(socket.id);
			socket.join(result.roomCode);
			console.log(`[room] created ${result.roomCode} by ${socket.id}`);
			if (typeof callback === "function") {
				callback(result);
			}
		});

		socket.on(
			"room:join",
			(roomCode: string, callback: (data: unknown) => void) => {
				const result = roomManager.joinRoom(roomCode, socket.id);
				if ("error" in result) {
					if (typeof callback === "function") callback(result);
					return;
				}
				socket.join(roomCode.toUpperCase());
				console.log(
					`[room] ${socket.id} joined ${roomCode} as slot ${result.slotIndex}`,
				);
				socket.to(roomCode.toUpperCase()).emit("room:playerJoined", {
					playerId: result.playerId,
					slotIndex: result.slotIndex,
				});
				if (typeof callback === "function") callback(result);
			},
		);

		socket.on("player:ready", (roomCode: string) => {
			const roomInfo = roomManager.getRoomBySocketId(socket.id);
			if (!roomInfo) return;
			const result = roomManager.setReady(
				roomCode.toUpperCase(),
				roomInfo.playerId,
			);
			if ("error" in result) return;

			io.to(roomCode.toUpperCase()).emit("room:playerReady", {
				playerId: roomInfo.playerId,
			});

			if (result.allReady) {
				console.log(`[room] all ready in ${roomCode}, starting character select`);
				io.to(roomCode.toUpperCase()).emit("room:characterSelectStart", {
					playerIds: roomManager.getPlayerIds(roomCode.toUpperCase()),
				});
			}
		});

		socket.on(
			"character:select",
			(roomCode: string, characterId: string, callback?: (data: unknown) => void) => {
				const roomInfo = roomManager.getRoomBySocketId(socket.id);
				if (!roomInfo) return;

				if (!isCharacterId(characterId)) {
					callback?.({ error: "invalid characterId" });
					return;
				}

				const result = roomManager.selectCharacter(
					roomInfo.room.code,
					roomInfo.playerId,
					characterId,
				);
				if ("error" in result) {
					callback?.(result);
					return;
				}

				io.to(roomInfo.room.code).emit("character:updated", {
					playerId: roomInfo.playerId,
					characterId,
					confirmed: false,
				});
				callback?.({ ok: true });
			},
		);

		socket.on(
			"character:confirm",
			(roomCode: string, callback?: (data: unknown) => void) => {
				const roomInfo = roomManager.getRoomBySocketId(socket.id);
				if (!roomInfo) return;

				const result = roomManager.confirmCharacter(
					roomInfo.room.code,
					roomInfo.playerId,
				);
				if ("error" in result) {
					callback?.({ error: result.error });
					return;
				}

				const slot = roomInfo.room.players.get(roomInfo.playerId);
				const characterId = slot?.characterId ?? "all-rounder";

				io.to(roomInfo.room.code).emit("character:updated", {
					playerId: roomInfo.playerId,
					characterId,
					confirmed: true,
				});
				callback?.({ ok: true, allConfirmed: result.allConfirmed });

				if (result.allConfirmed) {
					console.log(`[room] all characters confirmed in ${roomInfo.room.code}, starting countdown`);
					io.to(roomInfo.room.code).emit("game:countdown", { seconds: 3 });

					const normalizedRoomCode = roomInfo.room.code;
					const timer = setTimeout(() => {
						countdownTimers.delete(normalizedRoomCode);
						roomManager.startMatch(normalizedRoomCode);
						const playerIds = roomManager.getPlayerIds(normalizedRoomCode);
						const characterSelections = roomManager.getCharacterSelections(normalizedRoomCode);
						io.to(normalizedRoomCode).emit("game:start", { playerIds });

						const session = new MatchSession({
							playerIds,
							characterIds: characterSelections as Record<PlayerId, CharacterId>,
							onBroadcast: (binary) => {
								io.to(normalizedRoomCode).emit("game:state", binary);
							},
							onMatchOver: (winnerId) => {
								roomManager.endMatch(normalizedRoomCode);
								matchSessions.delete(normalizedRoomCode);
								io.to(normalizedRoomCode).emit("game:over", { winnerId });
							},
						});

						matchSessions.set(normalizedRoomCode, session);
						session.start();
					}, 3000);

					countdownTimers.set(normalizedRoomCode, timer);
				}
			},
		);

		socket.on("game:input", (data: unknown) => {
			const roomInfo = roomManager.getRoomBySocketId(socket.id);
			if (!roomInfo) return;

			const session = matchSessions.get(roomInfo.room.code);
			if (!session) return;

			try {
				const normalized =
					data instanceof ArrayBuffer
						? new Uint8Array(data)
						: data instanceof Uint8Array
							? data
							: null;
				if (!normalized) return;

				const input = decode(normalized) as InputEvent;
				session.queueInput(roomInfo.playerId, input);
			} catch {
				// Ignore malformed binary input.
			}
		});

		socket.on("game:pause", () => {
			const roomInfo = roomManager.getRoomBySocketId(socket.id);
			if (!roomInfo) return;

			// Only allow pause during MATCH phase
			if (roomInfo.room.phase !== 'MATCH') return;

			const session = matchSessions.get(roomInfo.room.code);
			if (!session) return;

			session.pause();
		});

		socket.on("game:resume", () => {
			const roomInfo = roomManager.getRoomBySocketId(socket.id);
			if (!roomInfo) return;

			// Only allow resume during MATCH phase
			if (roomInfo.room.phase !== 'MATCH') return;

			const session = matchSessions.get(roomInfo.room.code);
			if (!session) return;

			session.resume();
		});

		socket.on("room:leave", () => {
			handleDisconnect(socket.id);
		});

		socket.on("disconnect", (reason) => {
			console.log(`[server] disconnected: ${socket.id} (${reason})`);
			handleDisconnect(socket.id);
		});

		function handleDisconnect(socketId: string) {
			const removed = roomManager.removePlayer(socketId);
			if (!removed) return;
			const { roomCode, playerId } = removed;

			const countdownTimer = countdownTimers.get(roomCode);
			if (countdownTimer) {
				clearTimeout(countdownTimer);
				countdownTimers.delete(roomCode);
			}

			const activeSession = matchSessions.get(roomCode);
			if (activeSession) {
				activeSession.stop();
				matchSessions.delete(roomCode);
			}

			io.to(roomCode).emit("room:playerLeft", { playerId });
			const room = roomManager.getRoom(roomCode);
			if (room && room.phase === "MATCH") {
				const remainingPlayers = roomManager.getPlayerIds(roomCode);
				if (remainingPlayers.length > 0) {
					io.to(roomCode).emit("game:over", {
						winnerId: remainingPlayers[0],
						reason: "disconnect",
					});
				}
				roomManager.endMatch(roomCode);
			}
		}
	});

	return { httpServer, io, roomManager };
}
