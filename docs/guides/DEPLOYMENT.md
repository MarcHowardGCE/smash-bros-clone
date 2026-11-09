# Deployment

Deploy from the repository root. The standard production process serves the compiled client and Socket.IO from one Express service. The client and server should run the same revision, especially when room events, input fields, or snapshot formats change.

## Build and run locally

Install the pinned toolchain and dependencies using [local development](DEVELOPMENT.md). Run `pnpm build` with the default output paths. Start the compiled server in production mode.

```powershell
$env:NODE_ENV = 'production'
pnpm start
```

```sh
NODE_ENV=production pnpm start
```

Open [localhost:3001](http://localhost:3001) with the default port. Express serves `apps/client/dist` in production mode. A client build with an alternate output directory is useful for verification, but the ordinary production server expects the default path. [Production static serving](../../apps/server/src/createApp.ts)

## Deployment targets

| Target | Source and workflow |
| --- | --- |
| Docker | The [root Dockerfile](../../Dockerfile) uses Node 24, pnpm 11.20.0, a frozen install, and committed atlases. It builds from the repository root. The [Docker ignore rules](../../.dockerignore) constrain the context to the fighter workspace and exclude environment files. |
| Fly.io | [`fly.toml`](../../fly.toml) selects the root Dockerfile, internal port 3001, and forced HTTPS. Authenticate the Fly CLI for the intended app and check the app name in the config before running `pnpm deploy:fly`. |
| Render | [`render.yaml`](../../render.yaml) defines the native Node Blueprint build and start commands. Connect the repository through that Blueprint. The `pnpm deploy:render` script prints instructions. |

For a local container smoke test, run from the repository root.

```sh
docker build -t everybody-throws-hands .
docker run --rm -p 3001:3001 everybody-throws-hands
```

## Configuration

| Variable | Where it is read | Purpose |
| --- | --- | --- |
| `PORT` | Server runtime | Listen port. Defaults to 3001. On Fly it should match `internal_port`. |
| `NODE_ENV` | Server runtime | Set to `production` to enable static client serving. |
| `CLIENT_ORIGIN` | Server runtime | Socket.IO CORS origin setting. Defaults to the local Vite origin. This setting is separate from reconnect authentication. |
| `VITE_SERVER_URL` | Client build or Vite dev startup | Optional backend URL for separate hosting. The client otherwise uses its page origin in production and localhost:3001 in development. Rebuild after changing the production value. |

Socket.IO is configured for WebSocket transport. A page load only proves static serving. The post-deploy check should exercise a room over the hosted WebSocket connection.

## Post-deploy smoke test

1. Open the hosted URL in a fresh browser session. Confirm that the main menu appears, start a local match, and check both fighter sprites and the selected arena.
2. Use two independent browser contexts. Create a room, join by invite, confirm fighters and a world, and wait for both clients to enter live play. Check that artwork loads before the countdown and inputs update both clients.
3. Refresh a guest while the match is live and rejoin within the 30-second grace period. Verify that the room, selected stage, and player slot are restored. Test explicit Leave separately.
4. Record the revision, host, browser, WebSocket result, and any visible asset delays. For performance work, capture cold and warm results with the network conditions and cache state recorded. Follow the [release and loading gates](../plans/ACTIVE-WORK.md).

If a release fails these checks, collect the build and runtime logs and redeploy the last known-good revision through the same host. Verify the rollback with the same browser checks. Rejoin identity hardening and hosted network signoff are tracked separately from the runbook.
