import type { PlayerId, StateSnapshot } from "@smash/shared";
import { STAGE } from "@smash/shared";
import { Application } from "pixi.js";
import { DEFAULT_KEYMAP_P1, DEFAULT_KEYMAP_P2 } from "./input/keymaps.js";
import { LocalMatch } from "./local/LocalMatch.js";
import { LocalPlayerController } from "./local/LocalPlayerController.js";
import type { FighterChoice } from "./local/types.js";
import { GameClient } from "./network/GameClient.js";
import type {
	RenderPlayerState,
	RenderState,
} from "./network/InterpolationBuffer.js";
import { Camera } from "./renderer/Camera.js";
import { FighterRenderer } from "./renderer/FighterRenderer.js";
import { createLayers } from "./renderer/layers.js";
import { StageRenderer } from "./renderer/StageRenderer.js";
import { injectStyles, UIManager } from "./ui/index.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const AVAILABLE_FIGHTERS: FighterChoice[] = [
	{ id: "all-rounder", displayName: "All-Rounder" },
];

async function main() {
	injectStyles();

	const app = new Application();
	await app.init({
		background: 0x000000,
		width: STAGE.WIDTH,
		height: STAGE.HEIGHT,
		antialias: true,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true,
	});

	app.canvas.id = "game-canvas";
	document.body.appendChild(app.canvas);

	function resize() {
		const scaleX = window.innerWidth / STAGE.WIDTH;
		const scaleY = window.innerHeight / STAGE.HEIGHT;
		const scale = Math.min(scaleX, scaleY);
		app.canvas.style.width = `${STAGE.WIDTH * scale}px`;
		app.canvas.style.height = `${STAGE.HEIGHT * scale}px`;
		app.canvas.style.position = "absolute";
		app.canvas.style.left = `${(window.innerWidth - STAGE.WIDTH * scale) / 2}px`;
		app.canvas.style.top = `${(window.innerHeight - STAGE.HEIGHT * scale) / 2}px`;
	}
	window.addEventListener("resize", resize);
	resize();

	const layers = createLayers();
	app.stage.addChild(layers.background);
	app.stage.addChild(layers.game);
	app.stage.addChild(layers.ui);

	new StageRenderer(layers.background);

	const fighterRenderers = new Map<PlayerId, FighterRenderer>();

	const uiOverlay = document.getElementById("ui-overlay");
	if (!uiOverlay) {
		throw new Error("#ui-overlay not found");
	}

	const uiManager = new UIManager(uiOverlay);
	let myPlayerId: PlayerId | null = null;
	let isLocalMode = false;
	let localMatch: LocalMatch | null = null;
	let camera: Camera | null = null;
	let localCountdownInterval: number | null = null;
	let localCountdownTimeout: number | null = null;

	const clearLocalCountdown = (): void => {
		if (localCountdownInterval !== null) {
			window.clearInterval(localCountdownInterval);
			localCountdownInterval = null;
		}
		if (localCountdownTimeout !== null) {
			window.clearTimeout(localCountdownTimeout);
			localCountdownTimeout = null;
		}
	};

	const cleanupLocalMode = (): void => {
		clearLocalCountdown();
		localMatch?.cleanup();
		localMatch = null;
		camera?.reset();
	};

	const snapshotToRenderState = (snapshot: StateSnapshot): RenderState => {
		const players = new Map<PlayerId, RenderPlayerState>(
			Object.entries(snapshot.players).map(([id, playerState]) => [
				id,
				{
					id: playerState.id,
					slotIndex: playerState.slotIndex,
					x: playerState.x,
					y: playerState.y,
					vx: playerState.vx,
					vy: playerState.vy,
					facing: playerState.facing,
					state: playerState.state,
					stateFrame: playerState.stateFrame,
					percent: playerState.percent,
					stocks: playerState.stocks,
					isInvincible: playerState.isInvincible,
					isKnockedOut: playerState.isKnockedOut,
				},
			]),
		);

		return {
			players,
			matchPhase: snapshot.matchPhase,
			winnerId: snapshot.winnerId,
		};
	};

	const updateRenderers = (state: RenderState): void => {
		for (const [id, playerState] of state.players.entries()) {
			let fighterRenderer = fighterRenderers.get(id);
			if (!fighterRenderer) {
				fighterRenderer = new FighterRenderer(
					layers.game,
					playerState.slotIndex,
				);
				fighterRenderers.set(id, fighterRenderer);
			}
			fighterRenderer.update(playerState);
		}

		for (const [id, fighterRenderer] of fighterRenderers.entries()) {
			if (!state.players.has(id)) {
				fighterRenderer.destroy();
				fighterRenderers.delete(id);
			}
		}
	};

	const urlParams = new URLSearchParams(window.location.search);
	const roomCodeFromUrl = urlParams.get("room");

	const gameClient = new GameClient({
		serverUrl: SERVER_URL,
		onConnected: () => {
			if (roomCodeFromUrl) {
				uiManager.setRoomCode(roomCodeFromUrl.toUpperCase());
				gameClient.joinRoom(roomCodeFromUrl);
				uiManager.showLobby();
				return;
			}
			uiManager.showLobby();
		},
		onPlayerAssigned: (playerId, roomCode) => {
			myPlayerId = playerId;
			uiManager.setPlayerId(playerId);
			uiManager.setRoomCode(roomCode);
		},
		onRenderState: (state: RenderState, localPlayerId: PlayerId) => {
			updateRenderers(state);
			uiManager.updateHUD(state, localPlayerId);
		},
		onMatchPhaseChange: (phase: string, winnerId?: PlayerId | null) => {
			if (phase === "countdown") {
				let count = 3;
				uiManager.showCountdown(count);
				const interval = setInterval(() => {
					count--;
					if (count > 0) {
						uiManager.showCountdown(count);
					} else {
						uiManager.showCountdown(0);
						clearInterval(interval);
						setTimeout(() => uiManager.showMatch(), 1000);
					}
				}, 1000);
			} else if (phase === "match") {
				uiManager.showMatch();
			} else if (phase === "result") {
				uiManager.showResult(winnerId ?? null, myPlayerId);
			}
		},
		onRoomCreated: (roomCode: string) => {
			uiManager.showRoomCreated(roomCode);
		},
		onPlayerJoined: (slotIndex: number) => {
			uiManager.showPlayerJoined(slotIndex);
		},
	});

	uiManager.onCreateRoom = () => {
		if (isLocalMode) {
			return;
		}
		gameClient.createRoom();
	};

	uiManager.onJoinRoom = (code: string) => {
		if (isLocalMode) {
			return;
		}
		uiManager.setRoomCode(code);
		gameClient.joinRoom(code);
	};

	uiManager.onReady = () => {
		if (isLocalMode) {
			return;
		}
		gameClient.markReady();
	};

	uiManager.onPlayAgain = () => {
		window.location.href = window.location.pathname;
	};

	const startLocalMatch = (
		_p1Choice: FighterChoice,
		_p2Choice: FighterChoice,
	): void => {
		cleanupLocalMode();

		if (!camera) {
			camera = new Camera(layers.game);
		}

		const p1Controller = new LocalPlayerController({
			playerId: "local-p1",
			keymap: DEFAULT_KEYMAP_P1,
			slotIndex: 0,
		});
		const p2Controller = new LocalPlayerController({
			playerId: "local-p2",
			keymap: DEFAULT_KEYMAP_P2,
			slotIndex: 1,
		});

		localMatch = new LocalMatch([p1Controller, p2Controller]);
		localMatch.onSnapshot = (snapshot) => {
			const renderState = snapshotToRenderState(snapshot);
			updateRenderers(renderState);
			uiManager.updateHUD(renderState, null);

			const positions = Object.values(snapshot.players).map((player) => ({
				x: player.x,
				y: player.y,
			}));
			camera?.update(positions, window.innerWidth, window.innerHeight);

			if (snapshot.matchPhase === "result") {
				clearLocalCountdown();
				uiManager.showLocalResult(snapshot.winnerId);
			}
		};

		uiManager.hideRoomCode();
		let count = 3;
		uiManager.showCountdown(count);
		localCountdownInterval = window.setInterval(() => {
			count -= 1;
			if (count > 0) {
				uiManager.showCountdown(count);
				return;
			}

			uiManager.showCountdown(0);
			clearLocalCountdown();
			localCountdownTimeout = window.setTimeout(() => {
				localCountdownTimeout = null;
				uiManager.showMatch();
				localMatch?.start();
			}, 1000);
		}, 1000);
	};

	uiManager.onLocalPlay = () => {
		if (!isLocalMode) {
			isLocalMode = true;
			gameClient.disconnect();
		}

		uiManager.showCharacterSelect(AVAILABLE_FIGHTERS, (p1Choice, p2Choice) => {
			startLocalMatch(p1Choice, p2Choice);
		});
	};

	uiManager.onLocalPlayAgain = () => {
		cleanupLocalMode();
		for (const [, renderer] of fighterRenderers) {
			renderer.destroy();
		}
		fighterRenderers.clear();
		uiManager.showCharacterSelect(AVAILABLE_FIGHTERS, (p1Choice, p2Choice) => {
			startLocalMatch(p1Choice, p2Choice);
		});
	};

	(
		window as Window & {
			__smashDebug?: {
				sendInput: (input: {
					held: number;
					pressed: number;
					released: number;
				}) => void;
				getSnapshot: () => ReturnType<GameClient["getLatestSnapshot"]>;
			};
		}
	).__smashDebug = {
		sendInput: (input) => gameClient.debugSendInput(input),
		getSnapshot: () => gameClient.getLatestSnapshot(),
	};

	if (import.meta.env.DEV) {
		(
			window as Window & {
				__DEBUG_GAME_STATE__?: () => ReturnType<GameClient["getLatestSnapshot"]>;
			}
		).__DEBUG_GAME_STATE__ = () => gameClient.getLatestSnapshot?.() ?? null;
	}

	window.addEventListener("beforeunload", () => {
		cleanupLocalMode();
		gameClient.disconnect();
	});

	if (import.meta.env.DEV) {
		console.log("[client] initialized. Server:", SERVER_URL);
		console.log(
			`[client] Renderer: ${app.renderer.type === 1 ? "WebGL" : "Canvas"}`,
		);
	}
}

main().catch(console.error);
