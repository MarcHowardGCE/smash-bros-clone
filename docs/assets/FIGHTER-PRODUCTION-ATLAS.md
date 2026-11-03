# Fighter production atlas and validation


## Production atlas and replicated movement hooks — batch 21 (2026-11-03)

Completed the drawing screen for all 2,289 registered body frames on 24 inspected montages: no new blocking palette, costume, silhouette or clipping issue found. This signs off the static drawing screen for integration, not the authoritative motion timing of unimplemented actions. Source PNGs and source manifest revision 18 are preserved.

Added production atlases (two pixels per world unit, premultiplied-alpha bilinear sampling, two-pixel extrusion): 15 pages total, eight loaded live. Live decoded texture storage drops from 1,214,237,188 bytes across 193 equivalent source sheets to 134,217,728 bytes (128 MiB), an 88.9% reduction; live PNG downloads total 30,726,124 bytes. The verifier checks all 2,305 body/effect frame entries, bounds and world-space roots/sockets; maximum registration error is zero. Memory figures exclude GPU overhead, mipmaps and legacy renderer resources.

Connected nine additional clips per fighter: rise/apex/fall/fast-fall loops, double-jump transition, soft landing and three downward dodge variants. Fast-fall/dodge-direction metadata now survives local, remote and predicted-local render paths. Double jump uses the replicated resource change to play twelve simulation ticks even if a snapshot misses the one-tick trigger; repeated snapshots freeze and interruption cancels. Current supported dodge vectors are inherited from the engine; no new combat or movement physics was introduced. Runtime loading is now 63 clips per fighter; the original source manifest retains its historical 54-live/82-prepared flags. Runtime policy and production manifest supersede those flags for the nine promoted clips.

Four actual browser clients passed atlas rendering, duplicate-player identification, movement propagation, synchronized pause and refresh/rejoin. All 35 browser tests passed, along with TypeScript and ten focused hook/contact/effect/marker/metadata unit tests. A complete Vite production build with staged public assets passed. The packaged game loaded all eight live atlas pages with no failed requests or page errors. Original review sheets are excluded from the production distribution; legacy part rendering remains available. Development/review distributions retain source-sheet fallback (?atlas=source); the staged production distribution falls back to legacy parts when atlas art is unavailable.

Remaining engine integration: 73 prepared clips per fighter still need mappings, event metadata or mechanics. This includes overlapping legacy/alternative variants, not 73 independent mechanics. Prioritize jab 2/3 and dash attack, floor/getup actions and shield reactions, then paired footstools, recovery lockout, movement transition cues and presentation. Full-body mode remains optional (?renderer=fullbody). Low-end device/memory testing, WAN/packet-loss stress and exhaustive animation-in-context testing are outside this local validation. See docs/assets/FIGHTER-PRODUCTION-ATLAS.md and integration-signoff.html/json.

Rebuild workflow (repository root):

1. node scripts/assets/build-production-fighter-atlas.mjs
2. node scripts/assets/verify-production-fighter-atlas.mjs
3. node scripts/assets/stage-production-public.mjs ABS_STAGING_DIRECTORY
4. From apps/client, run the Vite build with publicDir set to that staging directory, public copying enabled, SKIP_ASSETPACK=1 and SMASH_ENV_DIR pointing at the empty environment directory.
5. pnpm exec playwright test --config playwright.art-integration.config.ts (requires existing client on 5193 and server on 3001; does not auto-start environment-loading commands).

Runtime policy: apps/client/src/renderer/fullbody/preparedHooks.ts. Atlas generation carries the same nine promoted names; regenerate and verify after promotion changes. Never ship a stale atlas after source manifest changes. Production loading checks source revision before choosing the atlas. Four-player test: apps/client/e2e/multiplayer-atlas.spec.ts. Static drawing montage review is recorded in integration-signoff.json.


Production builds can set SMASH_PUBLIC_DIR to a staged public folder and SMASH_BUILD_OUT_DIR to an isolated output folder. Keep SMASH_ENV_DIR pointed at the empty environment folder and SKIP_ASSETPACK=1 for this pipeline. Batch 22 connects 74 clips per fighter; eight live atlas pages use 128 MiB decoded texture memory.
