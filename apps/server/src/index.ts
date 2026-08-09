import { createApp } from "./createApp.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const { httpServer, io, roomManager } = createApp();

httpServer.listen(PORT, () => {
	const address = httpServer.address();
	const listeningPort =
		typeof address === "object" && address
			? address.port
			: PORT;
	console.log(`[server] listening on port ${listeningPort}`);
	console.log(`[server] transports: WebSocket only`);
});

export { io, roomManager };
