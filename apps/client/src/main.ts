import { Application } from 'pixi.js';
import type { PlayerId } from '@smash/shared';
import { STAGE } from '@smash/shared';
import { GameClient } from './network/GameClient.js';
import type { RenderState } from './network/InterpolationBuffer.js';
import { FighterRenderer } from './renderer/FighterRenderer.js';
import { createLayers } from './renderer/layers.js';
import { StageRenderer } from './renderer/StageRenderer.js';
import { UIManager, injectStyles } from './ui/index.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

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

  app.canvas.id = 'game-canvas';
  document.body.appendChild(app.canvas);

  function resize() {
    const scaleX = window.innerWidth / STAGE.WIDTH;
    const scaleY = window.innerHeight / STAGE.HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    app.canvas.style.width = `${STAGE.WIDTH * scale}px`;
    app.canvas.style.height = `${STAGE.HEIGHT * scale}px`;
    app.canvas.style.position = 'absolute';
    app.canvas.style.left = `${(window.innerWidth - STAGE.WIDTH * scale) / 2}px`;
    app.canvas.style.top = `${(window.innerHeight - STAGE.HEIGHT * scale) / 2}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  const layers = createLayers();
  app.stage.addChild(layers.background);
  app.stage.addChild(layers.game);
  app.stage.addChild(layers.ui);

  new StageRenderer(layers.background);

  const fighterRenderers = new Map<PlayerId, FighterRenderer>();

  const uiOverlay = document.getElementById('ui-overlay');
  if (!uiOverlay) {
    throw new Error('#ui-overlay not found');
  }

  const uiManager = new UIManager(uiOverlay);
  let myPlayerId: PlayerId | null = null;

  const updateRenderers = (state: RenderState): void => {
    for (const [id, playerState] of state.players.entries()) {
      let fighterRenderer = fighterRenderers.get(id);
      if (!fighterRenderer) {
        fighterRenderer = new FighterRenderer(layers.game, playerState.slotIndex);
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
  const roomCodeFromUrl = urlParams.get('room');

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
      if (phase === 'countdown') {
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
      } else if (phase === 'match') {
        uiManager.showMatch();
      } else if (phase === 'result') {
        uiManager.showResult(winnerId ?? null, myPlayerId);
      }
    },
    onRoomCreated: (roomCode: string, playerId: PlayerId) => {
      uiManager.showRoomCreated(roomCode);
    },
    onPlayerJoined: (slotIndex: number) => {
      uiManager.showPlayerJoined(slotIndex);
    },
  });

  uiManager.onCreateRoom = () => {
    gameClient.createRoom();
  };

  uiManager.onJoinRoom = (code: string) => {
    uiManager.setRoomCode(code);
    gameClient.joinRoom(code);
  };

  uiManager.onReady = () => {
    gameClient.markReady();
  };

  uiManager.onPlayAgain = () => {
    window.location.href = window.location.pathname;
  };

	(window as Window & {
		__smashDebug?: {
			sendInput: (input: { held: number; pressed: number; released: number }) => void;
			getSnapshot: () => ReturnType<GameClient['getLatestSnapshot']>;
		};
	}).__smashDebug = {
		sendInput: (input) => gameClient.debugSendInput(input),
		getSnapshot: () => gameClient.getLatestSnapshot(),
	};

  window.addEventListener('beforeunload', () => {
    gameClient.disconnect();
  });

  console.log('[client] initialized. Server:', SERVER_URL);
  console.log(`[client] Renderer: ${app.renderer.type === 1 ? 'WebGL' : 'Canvas'}`);
}

main().catch(console.error);
