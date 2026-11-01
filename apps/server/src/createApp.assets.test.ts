import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const START_TIMEOUT_MS = 30_000;

// createApp.ts:67 derives the dist dir via `new URL(...).pathname`, which yields
// "/C:/..." on Windows so express.static (and the SPA catch-all) 404 there.
// Fixing that is out of scope (no non-test server changes); run on POSIX/CI.
describe.skipIf(process.platform === "win32")("production static serving of /assets", () => {
	let serverProcess: ChildProcess | null = null;
	let port = 0;

	beforeAll(async () => {
		const repoRoot = path.resolve(__dirname, "../../..");
		// SKIP_ASSETPACK=1: rely on the committed generated atlases.
		execSync("pnpm build", {
			cwd: repoRoot,
			env: { ...process.env, SKIP_ASSETPACK: "1" },
			encoding: "utf8",
		});

		const child = spawn("node", ["apps/server/dist/index.js"], {
			cwd: repoRoot,
			env: { ...process.env, PORT: "0", NODE_ENV: "production" },
			stdio: ["ignore", "pipe", "pipe"],
		});
		serverProcess = child;

		port = await new Promise<number>((resolve, reject) => {
			const timeoutHandle = setTimeout(() => {
				reject(new Error("Timed out waiting for server listening log"));
			}, START_TIMEOUT_MS);
			let stdout = "";
			let stderr = "";
			child.stdout?.on("data", (chunk: Buffer) => {
				stdout += chunk.toString("utf8");
				const match = stdout.match(/\[server\] listening on port (\d+)/);
				if (match?.[1]) {
					clearTimeout(timeoutHandle);
					resolve(Number(match[1]));
				}
			});
			child.stderr?.on("data", (chunk: Buffer) => {
				stderr += chunk.toString("utf8");
			});
			child.once("exit", (code, signal) => {
				clearTimeout(timeoutHandle);
				reject(
					new Error(
						`Server exited before listen (code=${String(code)} signal=${String(signal)}) stdout=${stdout} stderr=${stderr}`,
					),
				);
			});
		});
	}, 120_000);

	afterAll(async () => {
		if (serverProcess) {
			const child = serverProcess;
			serverProcess = null;
			child.kill();
			await new Promise<void>((resolve) => {
				child.once("exit", () => resolve());
			});
		}
	});

	it("serves a committed atlas JSON with a JSON content type", async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/assets/fighters/all-rounder@2x.png.json`,
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("application/json");
		const body: unknown = await res.json();
		expect(body).toHaveProperty("frames");
	});

	it("serves a committed atlas PNG with an image content type", async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/assets/fighters/all-rounder@2x.png`,
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("image/png");
	});

	it("returns 200 text/html for a missing asset (SPA catch-all, createApp.ts:66)", async () => {
		// createApp.ts serves index.html for every request express.static misses,
		// so a missing asset is NOT a 404. This proves the positive cases above are
		// content-type-discriminated and not false positives from the fallback.
		const res = await fetch(`http://127.0.0.1:${port}/assets/does-not-exist.json`);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
	});
});
