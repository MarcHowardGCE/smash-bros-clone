# Stage 10: Zanda Infinity

Added November 10, 2026. Zanda Infinity is an ordinary selectable world in Local Play, online rooms, Random World, and the Training Dojo. It has no unlock or random-only gate. Pack 03 production remains paused during this stage addition.

## Source and identity

The user supplied three illustrated environments and four transparent platform images. The design context is the [Brainstorm surreal stages chat](chatgpt-conversation://6aeb412f-c6e4-83ea-a75c-36ad246d00ae). Its latest direction supersedes the earlier hidden-stage proposal: one arena, three equally likely cosmetic environments, one soundtrack. The shared Library page could not be retrieved, so the subsequently attached local platform files are the actual source assets. The unused image generated before those files arrived is not shipped.

The player-facing name is **Zanda Infinity**, with the hook “Where the music becomes the world.” The story presents the studio, archive, and transmission network as three functions of Zanda Entertainment. It leaves open whether Zanda creates, discovers, or records the other worlds. The complete in-game story is visible in World Select without a toggle or scrolling. [Story text](../../apps/client/src/ui/selectionContent.ts)

| Environment | Supplied master | Runtime background |
| --- | --- | --- |
| Creation / studio | Zanda’s Infinite Recording Cosmos.webp | stage10-studio.webp |
| Preservation / archive | Zanda’s Infinite Record Archive.webp | stage10-archive.webp |
| Transmission / broadcast | Zanda’s Cosmic Broadcast Empire.webp | stage10-broadcast.webp |

All supplied image sources are preserved under [art-source/zanda-infinity](../../art-source/zanda-infinity/). platform-layout.png is the supplied Ornate Vinyl Battle Platforms.png. The other three supplied platform studies are preserved as platform-alternative-1.png through platform-alternative-3.png. Their transparency was checked. The layout sheet supplies the main sprite and a reusable upper-platform sprite; alternatives are not randomized.

## Selection and network behavior

A World Select screen resolves one uniform background index for Zanda. Repeated focus, preview, confirmation, and preparation reuse that resolved object. The selected preview and match intro use a matching 800 × 450 derivative. Random World includes Stage 10 at the same arena-level weight as every other world, with an independent three-way cosmetic choice. A Dojo entry resolves its background once. Resets and direct rematches retain the current resolved world; choosing a world again creates a new selection session. Repeated outcomes are valid.

The host sends the stage ID and optional backgroundVariant. The server validates both against the shared registries, stores stageBackgroundVariant in the room, and includes it in selection, countdown, start, and rejoin data. A guest never rolls its own variant. The server rejects a changed cosmetic selection once artwork preparation starts. Simulation still receives only stage10; its geometry and gameplay do not vary with the background. Loading is keyed by stage ID plus image, so a new appearance of the same stage reloads correctly. The arena readiness promise includes that chosen background and platform textures before live play. The existing 30-second stable-fallback policy remains unchanged; no new cold hosted-load signoff is claimed.

[Stage registry and visual helpers](../../apps/client/src/stages/stageConfig.ts) · [Shared cosmetic choices](../../packages/shared/src/constants/stageVisuals.ts) · [Room validation](../../apps/server/src/RoomManager.ts) · [Network event handlers](../../apps/server/src/createApp.ts)

## Arena and artwork registration

The Infinite Vinyl arena has one solid floor at x=230, y=510, width=820, and ledges at x=230 and x=1050. Pass-through platforms are x=300/y=365/width=170, x=555/y=275/width=170, and x=810/y=365/width=170. Existing stage walls and blast bounds are retained. Four spawn positions are derived from the same floor. Every background uses these exact coordinates.

The artwork is anchored to its front gold landing rim. The visible rear perspective surface sits above the collision line; the ornate underside has no added collision. Main and upper crops, including their landing-line offsets, are recorded in [registration.json](../../art-source/zanda-infinity/registration.json). [Geometry](../../packages/shared/src/constants/stageLayouts.ts) · [Renderer](../../apps/client/src/renderer/StageRenderer.ts)

Rebuild the derivatives from the repository root:

```sh
node scripts/assets/pack-zanda-stage.mjs
```

The [packer](../../scripts/assets/pack-zanda-stage.mjs) uses the client’s declared sharp dependency and leaves source files intact. Runtime backgrounds are 1920 × 1080 WebP at quality 82, about 600–641 KB each. Menu derivatives are about 147–168 KB each. The main platform is about 215 KB; the upper platform is about 52 KB, with preserved alpha. Only the chosen full-resolution background loads for a match.

The supplied STAGE 7 - SOMETHING HAPPENED.mp3 is used for Stage 10 despite its original filename. [stage10.mp3](../../apps/client/public/audio/stage10.mp3) retains the supplied recording. Browser decoding verified 99.6535 seconds, 48 kHz, and two channels. The existing audio player loops the whole track. A listening review and any seamless-loop edit remain open; no composition or audio-content changes were made.

## Verification and handoff

Automated local verification on November 10:

- Twelve focused client checks passed for variant selection, stable preview/confirmation, backdrop preferences, and existing selection behavior. Eight menu-polish checks also passed on a separate targeted run.
- Twenty-eight server checks passed: authoritative selection and invalid variants, floor and soft-platform contact, ledges, identity, deterministic four-player replays across all ten stages, and Dojo world reset coverage.
- Five existing socket integration checks passed, including countdown, disconnect, and rejoin behavior. Thirty-two client network selection/reconnect regression checks also passed.
- All four saved Zanda browser regression tests passed. All three backgrounds passed real local-match loading and pause checks. A fresh two-client match preserved the host preview in the guest preview and match; guest refresh retained the same archive background.
- All ten local stories and Random World passed full-text, no-scrollbar, and stable-size checks at 1280 × 720, 800 × 600, 640 × 360, 390 × 640, and 320 × 568. All ten guest stories passed at 1280 × 720, 640 × 360, and 320 × 568.
- Dojo entry, grounded fighters, and music decoding passed with All-Rounder and Hoagie. The gameplay screenshot was visually reviewed for the gold landing rim and background readability.
- Client and server type checks and an isolated production client build passed. The build retained the existing large-chunk advisory.

Portable [Zanda browser checks](../../apps/client/e2e/zanda-stage.spec.ts), [selection unit checks](../../apps/client/src/stages/stageConfig.test.ts), and [server selection checks](../../apps/server/src/RoomManager.onlineSelection.test.ts) cover the new paths. Use the [testing guide](../guides/TESTING.md) to supply the correct running frontend/backend pair for browser tests.

Review locally at http://127.0.0.1:5196/ with its updated backend on port 5197. The pre-existing 5194 session was not interrupted. Deploy client and server together because stage10 and its cosmetic setup field are new. Hosted smoke testing, four-player human readability/recovery, and the music loop listening check remain open. Then return to the Pack 03 contact-art work in the [active-work index](../plans/ACTIVE-WORK.md).
