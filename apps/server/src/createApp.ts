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
import { fileURLToPath } from "node:url";
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
 * | `character:confirm` | client → server | Lock in character; opens shared stage selection when all confirmed |
 * | `game:input` | client → server | Binary msgpack `InputEvent`; forwarded to the active session |
 * | `game:pause` | client → server | Pause the active match session |
 * | `game:resume` | client → server | Resume a paused match session |
 * | `room:leave` | client → server | Explicit leave: remove slot and forfeit immediately |
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
		const clientDistPath = fileURLToPath(new URL("../../client/dist", import.meta.url));
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
  const disconnectTimers = new Map<PlayerId, ReturnType<typeof setTimeout>>();
  httpServer.on("close", () => {
    for (const timer of countdownTimers.values()) clearTimeout(timer);
    for (const timer of disconnectTimers.values()) clearTimeout(timer);
    for (const session of matchSessions.values()) session.stop();
    countdownTimers.clear();
    disconnectTimers.clear();
    matchSessions.clear();
  });

	io.on("connection", (socket) => {
		console.log(`[server] connected: ${socket.id}`);

		socket.on("room:create", (callback: (data: unknown) => void) => {
			if (roomManager.getRoomBySocketId(socket.id)) return;
      const result = roomManager.createRoom(socket.id);
			socket.join(result.roomCode);
			console.log(`[room] created ${result.roomCode} by ${socket.id}`);
			if (typeof callback === "function") {
				callback(result);
			}
      broadcastSelection(result.roomCode);
		});

		socket.on(
			"room:join",
			(roomCode: string, callback: (data: unknown) => void) => {
				if (typeof roomCode !== "string") return;
        if (roomManager.getRoomBySocketId(socket.id)) return;
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
        broadcastSelection(roomCode.toUpperCase());
			},
		);

		socket.on("player:ready", (roomCode: string) => {
      if (typeof roomCode !== "string") return;
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
			} else {
        broadcastSelection(roomCode.toUpperCase());
      }
		});

		socket.on(
			"character:select",
			(roomCode: string, characterId: string, callback?: (data: unknown) => void) => {
				const roomInfo = roomManager.getRoomBySocketId(socket.id);
				if (!roomInfo) return;

				if (!isCharacterId(characterId) && characterId !== 'moonshine' && characterId !== 'hulk-hoagie') {
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
                broadcastSelection(roomInfo.room.code);
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

                broadcastSelection(roomInfo.room.code);
			},
		);

    const broadcastSelection=(code:string)=>{const state=roomManager.getSelectionState(code);if(state)io.to(code).emit('room:selectionState',state);};
    socket.on('selection:sync',()=>{const info=roomManager.getRoomBySocketId(socket.id);if(info)socket.emit('room:selectionState',roomManager.getSelectionState(info.room.code));});
    socket.on('character:unconfirm',(_code:unknown,ack?: (result:unknown)=>void)=>{
      const info=roomManager.getRoomBySocketId(socket.id);if(!info){if(typeof ack==='function')ack({error:'Not in room'});return;}
      const result=roomManager.unconfirmCharacter(info.room.code,info.playerId);if(typeof ack==='function')ack(result);if(!('error'in result))broadcastSelection(info.room.code);
    });
    socket.on('selection:back',(_code:unknown,ack?: (result:unknown)=>void)=>{
      const info=roomManager.getRoomBySocketId(socket.id);if(!info){if(typeof ack==='function')ack({error:'Not in room'});return;}
      const result=roomManager.selectionBack(info.room.code,info.playerId);if(typeof ack==='function')ack(result);if(!('error'in result))broadcastSelection(info.room.code);
    });
    socket.on('stage:select',(_code:unknown,stage:unknown,ack?: (result:unknown)=>void)=>{
      const info=roomManager.getRoomBySocketId(socket.id);if(!info){if(typeof ack==='function')ack({error:'Not in room'});return;}
      const result=roomManager.selectStage(info.room.code,info.playerId,stage);if(typeof ack==='function')ack(result);if(!('error'in result))broadcastSelection(info.room.code);
    });
    socket.on('stage:confirm',(_code:unknown,ack?: (result:unknown)=>void)=>{
      const roomInfo=roomManager.getRoomBySocketId(socket.id);if(!roomInfo){if(typeof ack==='function')ack({error:'Not in room'});return;}
      const result=roomManager.confirmStage(roomInfo.room.code,roomInfo.playerId);if(typeof ack==='function')ack(result);
      				if (!("error" in result)) {
					console.log(`[room] all characters confirmed in ${roomInfo.room.code}, starting countdown after stage confirmation`);
					io.to(roomInfo.room.code).emit("game:countdown", { seconds: 3, stageId:roomInfo.room.stageId });

					const normalizedRoomCode = roomInfo.room.code;
					const timer = setTimeout(() => {
						countdownTimers.delete(normalizedRoomCode);
						if(roomManager.getRoom(normalizedRoomCode)?.phase!=='COUNTDOWN')return;
						roomManager.startMatch(normalizedRoomCode);
						const playerIds = roomManager.getPlayerIds(normalizedRoomCode);
						const characterSelections = roomManager.getCharacterSelections(normalizedRoomCode);
						io.to(normalizedRoomCode).emit("game:start", { playerIds, stageId:roomInfo.room.stageId });

						const session = new MatchSession({
              stageId:roomInfo.room.stageId,
							playerIds,
							characterIds: characterSelections as Record<PlayerId, CharacterId>,
							onPauseChange: (paused) => {
                io.to(normalizedRoomCode).emit(paused ? "game:paused" : "game:resumed");
              },
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
    });

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

  socket.on("room:rejoin", (data: unknown, callback?: (response: unknown) => void) => {
    if (typeof callback !== "function") return;
    if (!data || typeof data !== "object") {
      callback({ ok: false, error: "Missing roomCode or playerId" }); return;
    }
    const { roomCode, playerId } = data as { roomCode?: unknown; playerId?: unknown };
    if (typeof roomCode !== "string" || typeof playerId !== "string") {
      callback({ ok: false, error: "Missing roomCode or playerId" }); return;
    }
    const code = roomCode.toUpperCase();
    const result = roomManager.rejoinRoom(code, playerId, socket.id);
    if ("error" in result) { callback({ ok: false, error: result.error }); return; }
    clearTimeout(disconnectTimers.get(playerId));
    disconnectTimers.delete(playerId);
    socket.join(code);
    const room = roomManager.getRoom(code)!;
    const session = matchSessions.get(code);
    callback({ ok: true, slotIndex: result.slotIndex, phase: room.phase, stageId:room.stageId, paused: session?.isPaused ?? false });
    socket.emit("room:stage",{stageId:room.stageId});
    socket.emit("room:selectionState",roomManager.getSelectionState(code));
    session?.syncState(binary => socket.emit("game:state", binary));
    io.to(code).emit("room:playerRejoined", { playerId });
  });

  socket.on("room:leave", () => {
    const lookup = roomManager.getRoomBySocketId(socket.id);
    if (!lookup) return;
    socket.leave(lookup.room.code);
    removeDepartedPlayer(socket.id, lookup.room.code, lookup.playerId);
  });

	socket.on("disconnect", (reason) => {
		console.log(`[server] disconnected: ${socket.id} (${reason})`);
		handleDisconnect(socket.id);
	});

  function removeDepartedPlayer(socketId: string, roomCode: string, playerId: PlayerId) {
    clearTimeout(disconnectTimers.get(playerId));
    disconnectTimers.delete(playerId);
    roomManager.removePlayer(socketId);
    const countdown = countdownTimers.get(roomCode);
    if (countdown) { clearTimeout(countdown); countdownTimers.delete(roomCode); }
    matchSessions.get(roomCode)?.forfeitPlayer(playerId);
    if (!roomManager.getRoom(roomCode)) {
      matchSessions.get(roomCode)?.stop();
      matchSessions.delete(roomCode);
    }
    io.to(roomCode).emit("room:playerLeft", { playerId });
    broadcastSelection(roomCode);
  }

	function handleDisconnect(socketId: string) {
		const lookup = roomManager.getRoomBySocketId(socketId);
		if (!lookup) return;
		const { room, playerId } = lookup;
		const roomCode = room.code;

		// For LOBBY/CHARACTER_SELECT/COUNTDOWN phases, use immediate removal
		if (room.phase !== "MATCH") {
			removeDepartedPlayer(socketId, roomCode, playerId);
			return;
		}

		// For MATCH phase, use grace window with disconnected state
		matchSessions.get(roomCode)?.releaseInput(playerId);
    const marked = roomManager.markDisconnected(playerId);
		if ("error" in marked) return;

		// Notify remaining players of disconnection (with grace window)
		io.to(roomCode).emit("room:playerDisconnected", {
			playerId,
			graceSeconds: 30,
		});

		// A real timer enforces expiry even if nobody attempts to reconnect.
    clearTimeout(disconnectTimers.get(playerId));
    const expiry = setTimeout(() => {
      disconnectTimers.delete(playerId);
      removeDepartedPlayer(socketId, roomCode, playerId);
    }, 30_000);
    expiry.unref();
    disconnectTimers.set(playerId, expiry);
	}
	});

	return { httpServer, io, roomManager };
}
