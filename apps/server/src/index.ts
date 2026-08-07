import express from "express";
import { createServer } from "node:http";
import { decode } from "@msgpack/msgpack";
import type { InputEvent } from "@smash/shared";
import { Server } from "socket.io";
import { MatchSession } from "./MatchSession.js";
import { RoomManager } from "./RoomManager.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

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
			console.log(`[room] all ready in ${roomCode}, starting countdown`);
			io.to(roomCode.toUpperCase()).emit("game:countdown", { seconds: 3 });

			const normalizedRoomCode = roomCode.toUpperCase();
			const timer = setTimeout(() => {
				countdownTimers.delete(normalizedRoomCode);
				roomManager.startMatch(normalizedRoomCode);
				const playerIds = roomManager.getPlayerIds(normalizedRoomCode);
				io.to(normalizedRoomCode).emit("game:start", { playerIds });

				const session = new MatchSession(
					playerIds,
					(binary) => {
						io.to(normalizedRoomCode).emit("game:state", binary);
					},
					(winnerId) => {
						roomManager.endMatch(normalizedRoomCode);
						matchSessions.delete(normalizedRoomCode);
						io.to(normalizedRoomCode).emit("game:over", { winnerId });
					},
				);

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

httpServer.listen(PORT, () => {
	console.log(`[server] listening on port ${PORT}`);
	console.log(`[server] transports: WebSocket only`);
});

export { io, roomManager };
