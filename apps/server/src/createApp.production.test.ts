import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as createClient } from "socket.io-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AckResponse = { readonly [key: string]: unknown };

const START_TIMEOUT_MS = 30_000;

	describe("production entrypoint preservation", () => {
	let serverProcess: ChildProcess | null = null;
	let port = 0;

	beforeAll(async () => {
		const repoRoot = path.resolve(__dirname, "../../..");
		execSync("pnpm build", { cwd: repoRoot, stdio: "inherit" });

		serverProcess = spawn("node", ["apps/server/dist/index.js"], {
			cwd: repoRoot,
			env: {
				...process.env,
				PORT: "0",
			},
			stdio: ["ignore", "pipe", "pipe"],
		});

		port = await new Promise<number>((resolve, reject) => {
			if (!serverProcess) {
				reject(new Error("Server process was not created"));
				return;
			}

			const child = serverProcess;
			if (!child.stdout || !child.stderr) {
				reject(new Error("Server process stdio pipes were not available"));
				return;
			}

			const timeoutHandle = setTimeout(() => {
				reject(new Error("Timed out waiting for server listening log"));
			}, START_TIMEOUT_MS);

			let stdoutBuffer = "";
			let stderrBuffer = "";

			const onStdout = (chunk: Buffer) => {
				const text = chunk.toString("utf8");
				stdoutBuffer += text;
				const match = stdoutBuffer.match(/\[server\] listening on port (\d+)/);
				if (match?.[1]) {
					clearTimeout(timeoutHandle);
					resolve(Number(match[1]));
				}
			};

			const onStderr = (chunk: Buffer) => {
				stderrBuffer += chunk.toString("utf8");
			};

			child.stdout.on("data", onStdout);
			child.stderr.on("data", onStderr);

			child.once("exit", (code, signal) => {
				clearTimeout(timeoutHandle);
				reject(
					new Error(
						`Production server exited before listen (code=${String(code)} signal=${String(signal)}) stdout=${stdoutBuffer} stderr=${stderrBuffer}`,
					),
				);
			});
		});
	}, 120_000);

	afterAll(async () => {
		if (serverProcess) {
			serverProcess.kill();
			await new Promise<void>((resolve) => {
				serverProcess?.once("exit", () => resolve());
			});
			serverProcess = null;
		}
	});

	it("boots dist index and accepts websocket room:create ack", async () => {
		expect(port).toBeGreaterThanOrEqual(0);

		const socket = createClient(`http://127.0.0.1:${port}`, {
			transports: ["websocket"],
			reconnection: false,
		});

		await new Promise<void>((resolve, reject) => {
			const timeoutHandle = setTimeout(() => {
				reject(new Error("Socket connect timeout"));
			}, START_TIMEOUT_MS);
			socket.once("connect", () => {
				clearTimeout(timeoutHandle);
				resolve();
			});
		});

		const roomCreate = await new Promise<AckResponse>((resolve, reject) => {
			const timeoutHandle = setTimeout(() => {
				reject(new Error("room:create ack timeout"));
			}, START_TIMEOUT_MS);

			socket.emit("room:create", (response: AckResponse) => {
				clearTimeout(timeoutHandle);
				resolve(response);
			});
		});

		expect(typeof roomCreate.roomCode).toBe("string");
		expect(String(roomCreate.roomCode)).toHaveLength(6);

		socket.disconnect();
	});
});
