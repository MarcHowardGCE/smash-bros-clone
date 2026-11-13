# Deployment

Deploy from the repository root. The standard production process serves the compiled client and Socket.IO from one Express service. The client and server should run the same revision, especially when room events, input fields, or snapshot formats change.

## Build and run locally

Install the pinned toolchain and dependencies using [local development](DEVELOPMENT.md). Run a fresh `pnpm build` with the default output paths after workspace tests. The server's production-entry test can replace the client bundle with a test build that uses the development endpoint. For the default same-origin deployment, leave `VITE_SERVER_URL` unset at build time. Then start the compiled server in production mode.

```powershell
$env:NODE_ENV = 'production'
pnpm start
```

```sh
NODE_ENV=production pnpm start
```

Open [localhost:3001](http://localhost:3001) with the default port. Express serves `apps/client/dist` in production mode. A client build with an alternate output directory is useful for verification, but the ordinary production server expects the default path. [Production static serving](../../apps/server/src/createApp.ts)

To smoke-test this production build, keep the compiled server running and open its own URL. Start a local match with a fighter from each full-body pack and confirm that the stage and both fighters appear. Check a separate `?renderer=legacy` session for articulated fallback. In Training Dojo, open **Guided Lessons → Throw a jab**, start the lesson, and press Attack three times with a full recovery between presses. The progress should reach **3 / 3**. For an online smoke on the same server, follow the two-client steps below with its local URL.

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

The current production game is hosted on Render. Confirm the target URL and deployed revision for each release check. [Deployed game](https://everybody-throws-hands.onrender.com/)

1. Open the hosted URL in a fresh browser session. Confirm that the main menu appears, start a local match, and check both fighter sprites and the selected arena.
2. Use two independent browser contexts. Create a room, join by invite, confirm fighters and a world, and wait for both clients to enter live play. Check that artwork loads before the countdown and inputs update both clients.
3. Refresh a guest while the match is live and rejoin within the 30-second grace period. Verify that the room, selected stage, and player slot are restored. Repeat while paused, resume from the refreshed guest, and confirm Leave. Check that the guest returns Home and the host sees results.
4. Record the revision, host, browser, WebSocket result, and any visible asset delays. For performance work, capture cold and warm results with the network conditions and cache state recorded. Follow the [release and loading gates](../plans/ACTIVE-WORK.md).

If a release fails these checks, collect the build and runtime logs and redeploy the last known-good revision through the same host. Verify the rollback with the same browser checks.

## Private reconnect credentials

The server issues a private per-seat token in the create or join response. The browser keeps it in session storage for refresh recovery and in memory for reconnects in the current page. Lobby broadcasts and room URLs use public identifiers. The server requires the credential during the existing 30-second grace period, and confirmed Leave removes the seat immediately.

Run the hosted smoke in a fresh room after deploying the client and server together. Browser refresh retains the credential in the same tab. A separate context needs its own seat. [Server reconnect handler](../../apps/server/src/createApp.ts) · [Client reconnect handling](../../apps/client/src/network/GameClient.ts)

## Dated deployment evidence

Local credential verification passed 18 room and socket integration tests, 12 client network tests, both type checks, and a two-browser test that refreshed during pause, recovered the same fighter, resumed, and left deliberately. Socket checks covered missing, malformed, and wrong-seat credentials, replay against a connected seat, and expiry. Rejected requests left the legitimate seat available.

#### Render reconnect signoff

On November 10, 2026, two fresh Chromium contexts played Abe Lincoln against Swift on Stage 1 over the hosted WebSocket connection. Both seats received private reconnect credentials. This was one unthrottled run with normal browser caching. Refresh timings are measured from the start of reload to the first guest snapshot that satisfied the check. [Render game](https://everybody-throws-hands.onrender.com/)

| Check | Result |
| --- | --- |
| Live refresh | The guest returned to the same Swift seat in 2.36 s with the simulation advancing. |
| Paused refresh | The guest returned to the same seat in 1.75 s with the pause menu open. Both clients held tick 186 for the 350 ms observation. |
| Resume | The guest resumed play. Both pause menus closed and simulation ticks advanced on both clients. |
| Confirmed Leave | The guest returned Home, the room link and saved credential cleared, and the host reached results. |

The browser run passed with zero uncaught page errors. The private credentials identify the updated behavior on Render. The hosting provider's revision ID was outside this check.

## Bluehost client pilot

The pilot pull request workflow builds and tests the game and attaches
`eth-bluehost-client-<commit-sha>` to its Actions run. The artifact contains
`apps/client/dist` with the online endpoint set to the existing Render service.
Local and Dojo simulation run in the browser. Online rooms and matches use Render.

Download the artifact for the exact game revision paired with the Render server.
The intended Bluehost destination is `play.zandarecords.com` at
`~/public_html/website_9ed378d6`. The pilot branch builds and publishes to Bluehost from this repository.

The local build produced 978 files and 1,488,072,053 bytes. The staging script
copies the runtime manifests, their referenced images, Pack 03 idle art, and
the other static directories. It preserves source-sheet fallback and excludes
review material in the fighter art directories. The staged build contains 795
files and 1,279,105,347 bytes. The five Socket.IO integration tests passed
with local loopback access and IPv4-first localhost resolution.

The game repository publishes on pushes to deploy/bluehost-client-pilot using the eth-bluehost-pilot environment. Configure ETH_FTP_HOST, ETH_FTP_USER, and ETH_FTP_PASSWORD for the scoped account. Rerun the successful publish job against the same artifact to verify zero changed files. Live FTPS verification is pending.

The CI static-serving test reuses the completed build. Standalone runs build
their own output. The first pilot run failed when the test rebuilt into the
populated Vite output directory.
The pilot workflow installs Playwright Chromium before the client tests.

The scoped pilot uses explicit FTPS with CA validation and accepts the Bluehost FTP alias mismatch. Browser HTTPS and Render connections use their normal certificate validation.

Run 43448034225 uploaded 786 files and its unchanged publish rerun uploaded
zero. The live smoke found a test rebuild had replaced the configured client.
CI stages the initial build before tests and checks its Render endpoint.

### Bluehost live browser smoke

On 2026-11-13, two fresh Chromium contexts created and joined an online
room via the invite URL, confirmed All-Rounder, and reached live play on
Zanda Infinity. All observed HTTPS responses in that run came from
play.zandarecords.com. Both game WebSockets connected directly to Render.
In a second fresh room the guest reloaded during live play and reached the
match again in 1.237 seconds. Reconnect skipped the splash screen.

The remaining pilot smoke covers local and Dojo play, paused reconnect,
rematch, cold and warm transfer measurements, and interrupted atlas retry.

On 2026-11-13, Bluehost reached live local play on Zanda Infinity and live
Dojo Free Practice in Chromium. One unthrottled cold run took 8.04 seconds
from navigation to live play (5.21 seconds after stage confirmation) and
transferred 33.04 MB in Resource Timing subresources. A repeat navigation
in the same browser context took 7.22 seconds (5.12 after confirmation) and
transferred 9.51 MB. These are single-run measurements and include UI
automation and the countdown.

### Bluehost interrupted atlas, paused reconnect, and Play Again

On 2026-11-13, a fresh two-client room on Bluehost used All-Rounder on both
seats and Zanda Infinity. Chromium intercepted and reset four production
atlas requests on the guest. The artwork failure alert appeared and neither
client entered countdown or live play. After clearing the simulated fault,
the guest used Change fighter, selected and confirmed the same fighter, and
the host confirmed the same world. Both clients reached live play.

The host paused and both clients showed Resume. Refreshing the guest restored
the paused overlay in 1.951 seconds. Guest Resume dismissed the overlay in
both clients.

A separate online match reached results through stock loss. Play Again took
both clients to online room entry. They created and joined a fresh room,
reselected the same lineup and world, and reached live play again. Online
Play Again uses a fresh room and requires selection again.

### Coordinated release from main

The release workflow builds and tests the client from the pushed commit.
To enable publishing, set the repository Actions variable ETH_RELEASE_ENABLED
to true and add RENDER_DEPLOY_HOOK_URL to the eth-bluehost-pilot environment
alongside the three existing FTPS secrets. Disable Render auto-deploy in
the service settings so only the release workflow deploys the server.

The workflow requests the exact commit from Render and checks the public
healthz endpoint for that full revision before sending files to Bluehost.
A failed request or a revision that never becomes live blocks the upload.
A publish rerun skips the Render deploy if that revision is already live.
The Render fallback client stays available during this rollout.

To release manually, open Actions, select Release Render server and Bluehost client, choose Run workflow, and select main. The manual run uses the same test and revision checks.
