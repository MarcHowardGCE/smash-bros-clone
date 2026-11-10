# Clean-checkout verification

## Baseline

The test used a separate Windows checkout of commit `bb6a69e`, with Node.js 24.13.0 and pnpm 11.20.0. The checkout started without `node_modules` or build output. Bonney and environment files were excluded from checkout. `SMASH_ENV_DIR` pointed to an empty directory. The frozen install reused the local pnpm store, so this run verifies a fresh workspace install with a warm dependency cache. It verifies the committed baseline separately from changes in the working tree.

## Results

| Step | Outcome |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed. Installed 490 packages from the existing store in 11.3 seconds. |
| `pnpm build` | Passed with default settings, including a fresh AssetPack run and both production atlas packs. AssetPack warned about duplicate short frame names, and Vite reported a large bundle. |
| `pnpm typecheck` | Passed in all five workspace packages. |
| `pnpm test` | Stopped at the shared character registry fixture. The fixture expects three entries and the registry contains five. |
| `pnpm -r --no-bail --workspace-concurrency=1 test` | All five packages ran. **2,764 passed, 17 skipped, 1 failed.** The only failure was the same registry assertion. |
| `pnpm exec playwright install chromium` and `pnpm test:e2e --list` | Both passed. Playwright discovered 270 cases across 24 files and three display densities. |
| Portable Chromium smoke | The exact command in the updated guide passed in 17.3 seconds with default asset settings. Playwright started the development processes through `pnpm dev`. |
| Scoped online browser diagnostics | Two online specs reached live play and then failed at the checks below. |

## Test failures and portability

- The [shared registry fixture](../../packages/shared/src/constants/characters.test.ts#L84) still expects three entries. Update it to verify the five-character registry while retaining separate coverage for the legacy match ID list.
- The [online selection spec](../../apps/client/e2e/online-selection.spec.ts#L2) failed its stage-art check after both clients entered live play. It reads the former backdrop container and expects a PNG. The [first-pass direct check](../plans/ACTIVE-WORK.md#first-pass-documentation-validation) verified the current WebP layer and rejoin in the working checkout.
- The [network lifecycle spec](../../apps/client/e2e/network-refinement.spec.ts#L52) reached the guest's deliberate Leave step after pause, refresh/rejoin, and resume. It timed out waiting for the Online Play button after the guest clicked Main Menu. Diagnose that return path and rerun the lifecycle test before signing off.
- The full Playwright suite was left out of this run. [Fighter art review](../../apps/client/e2e/fighter-art-review.spec.ts), [controller calibration](../../apps/client/e2e/controller-calibration.spec.ts), [multiplayer atlas](../../apps/client/e2e/multiplayer-atlas.spec.ts), and [Xbox controls](../../apps/client/e2e/xbox360-controls.spec.ts) reference machine-specific paths for artifacts or fixtures. A clean checkout alone cannot isolate those paths. Move fixtures under the repository or generate them as test setup, and write screenshots to Playwright's test output directory.

## Reproduce

Follow [Local development](../guides/DEVELOPMENT.md) in a disposable checkout. Run the workspace checks and the [portable browser smoke test](../guides/TESTING.md#portable-browser-smoke-test) before expanding scope.

The diagnostic browser run used committed generated assets through `SKIP_ASSETPACK=1` and ran these three specs at DPR 1.

```sh
pnpm test:e2e apps/client/e2e/f3-manual-qa-flow.spec.ts apps/client/e2e/network-refinement.spec.ts apps/client/e2e/online-selection.spec.ts --project=chromium-dpr-1
```

The install, build, and test commands left the clean checkout with no tracked changes. Hosted deployment and cold dependency downloads were outside this verification.

## Follow-up with portable browser tests

A second clean Windows checkout used the same `bb6a69e` baseline. Only this pass's test files were applied. The frozen install used the warm pnpm store, the default build passed, and the workspace type check passed. `pnpm test` finished with **2,765 passed, 17 skipped, and zero failures**.

The registry and Local Play picker now assert the five fighter IDs. The online selection spec checks the current `.scene-art` layer, its WebP asset, and the authoritative stage ID before and after rejoin. The guest timeout came from the pause screen's existing two-step exit. The first click opens Leave Match confirmation. Confirming leaves the room, clears the guest's reconnect state, returns the guest to Home, and gives the host the result. No runtime behavior changed.

The offline reviews resolve committed files relative to the spec and continue to exercise `file:` navigation. Screenshots and generated evidence use Playwright's test output folders. The four-client test keeps its screenshot and JSON there. The calibration test uses a deterministic range input value to test persistence across reload.

- **9 checks passed** across DPR 1, 2, and 3 for online selection and rejoin, pause and deliberate leave, and calibration persistence.
- **4 offline review checks passed** at DPR 1. The targeted roster selection, four-client atlas, Xbox menu, right-stick, and contact-art checks passed and wrote evidence locally.
- A separate Lincoln forward-smash damage test still missed contact after the updated Ready action. It reached the match and observed zero damage from its staged attack. This is separate from the five-fighter selection and confirmation checks.

Run the cross-density confirmation and calibration checks from the repository root.

```sh
pnpm test:e2e apps/client/e2e/controller-calibration.spec.ts apps/client/e2e/network-refinement.spec.ts apps/client/e2e/online-selection.spec.ts --grep "Controls calibrates|online pause|server-backed unconfirm"
```

### Full standard-density diagnostic

The 90-case DPR 1 run completed with 76 passes and 14 failures while the roster-picker and calibration follow-ups were still being refined. Three of those failures subsequently passed in focused reruns. Both corrected online cases, the four-client atlas case, and the repository-relative offline reviews passed in the broad run.

The remaining diagnostic failures were in the Lincoln forward-smash fixture, the visual baseline comparison, six fighter-art and presentation checks, the ledge lifecycle, result-to-Home flow, and replacement-asset proof. The Lincoln damage failure reproduced after the Ready fix. Treat the broad results as a record of that run and rerun the remaining fixtures before a full browser signoff. Generated visual evidence stayed in the isolated checkout.

### Results, ledge lifecycle, and combat fixture follow-up

The isolated Windows checkout used the existing dependencies and generated assets, with the current application and test changes from `aeef3f0` applied over `bb6a69e`. The revised fixtures exercise these paths.

- **Results to Home:** A controlled final-stock blast-zone exit lets the match engine reach Results. The test checks Rematch and Main Menu, returns Home, and checks the Home logo. Six checks passed across DPR 1, 2, and 3 with two runs per density.
- **Ledge lifecycle:** An online guest lands in the room lobby after splash, so waiting for the Home button blocked the former test before Ready. The online check now observes the host's ledge catch in both clients. The jump getup and trump run in a controlled local match because held direction in the online approach could queue a climb before jump input. The final fixture samples the trump state and the engine's ledge owner together. Twelve checks passed across DPR 1, 2, and 3 with two runs per density. The server ledge suite passed 43 tests with 13 skipped. The browser rerun covers online catches and local trumps, so live online trump coverage remains open.
- **Lincoln forward smash:** Grounded spacing and a single keyboard input batch let the browser check the actual `FORWARD_SMASH` move ID and at least 20% damage. Six checks passed across DPR 1, 2, and 3 with two runs per density.
- **Replacement asset proof:** The fixture selects Ready explicitly and opens the legacy renderer that consumes the swapped six-part assets. DPR 1 passed, including the visible replacement marker and restoration verification. The screenshot goes to Playwright's output folder. Run this fixture in a disposable checkout because it temporarily swaps public assets.

A focused DPR 1 rerun of the seven remaining checks passed the live shield SDI case. Confirm its repeatability in the full suite. Five art and presentation checks still fail: reverse roll, kick and fallback routing, Lincoln and Swift roll routing, shield-drop timing, and KO frame progression. The visual baseline comparison also still stops at the first neutral-idle image with 85.6% differing pixels. Review the actual captures against the approved art before refreshing any baselines. Run the full DPR 1 suite after those checks are reconciled, then expand to DPR 2 and 3.

```sh
pnpm test:e2e apps/client/e2e/ledge.spec.ts apps/client/e2e/result-main-menu.spec.ts apps/client/e2e/abe-lincoln-character.spec.ts --grep "ledge catch reaches|two-fighter trump|local results offer|forward smash deals" --repeat-each=2
pnpm test:e2e apps/client/e2e/todo-12-swap-proof.spec.ts --project=chromium-dpr-1
```

### Fighter art and visual baseline verification

The earlier 85.6% neutral-idle diff compared the old grid stage with the game's startup overlay. The fixture now waits for the arena assets, removes the startup overlay, and positions the fighters from the platform surface using their own hurtbox radii. The exposed scene uses the current Stage 1 art and full-body sprites.

The matrix compares fighter and platform pixels with the decorative backdrop hidden. It separately checks that the Stage 1 backdrop is applied and saves a full-arena screenshot. The 30 updated lossless references occupy roughly 25 MB across the three densities, compared with 154 MB for the full-scene candidates. The comparison threshold remains 0.5%. The immediate rerun found **zero differing pixels in all 30 comparisons**.

The fighter-art checks now verify mirrored roll playback, the idle or airborne sprite used for incomplete snapshots, the current Lincoln and Swift roll poses, the shield-drop cue index, and the KO phases. The Star KO check verifies upward retreat, shrinking, and the twinkle. Screen KO is sampled after the impact pose begins, and the KO fixture checks expiry and deduplication. The revised KO browser check covers the three original fighters.

- **DPR 1** — 91 passed in 8 minutes 36 seconds, including the previously failing art checks and live shield SDI.
- **Focused DPR 1, 2, and 3** — all six visual matrix and KO checks passed. The full higher-density runs exposed timing-sensitive browser fixtures, recorded below.

The isolated Windows checkout used `aeef3f0` application and test changes over `bb6a69e`, the earlier browser fixes, and this pass's fixture and reference updates. The browser runs used committed assets with `SKIP_ASSETPACK=1`. The historical screenshots under `docs/assets/evidence/f3-visual` remain as evidence of earlier runs. Current captures, diffs, and per-test reports go to Playwright's test output folders.

```sh
pnpm test:e2e apps/client/e2e/f3-visual-baselines.spec.ts apps/client/e2e/fighter-art-review.spec.ts --grep "captures fixture matrix|KO copies render"
pnpm test:e2e --project=chromium-dpr-1
pnpm test:e2e --project=chromium-dpr-2 --project=chromium-dpr-3
```

#### Higher-density runs and timing fixes

The current workspace build and type check passed after rebuilding local package declarations. The build used checked-in generated assets and still emitted Vite's existing large-chunk warning. The full higher-density browser run had **170 passes, 6 deliberate skips, and 6 failures** in 22 minutes 24 seconds. The skips are the three DPR 1-only diagnostics in each project. DPR 2 had 86 passes and two failures. DPR 3 had 84 passes and four failures. Both visual matrices passed in the full run.

The six failures came from three timing-sensitive fixtures. The blast probe now samples a simulation tick inside the boundary before moving outside and reads the engine counters to check the respawn and invincibility deadlines even when the browser skips a rendered frame. The shield fixture stages low health while shield is held and captures both colors and the release. Lincoln's input batch releases its three keys together as soon as the forward smash starts, keeping the intended spacing through startup.

**All 18 targeted timing checks passed** on the revised fixtures, including all four blast boundaries at each density. The full standard-density run and the full higher-density run above preceded these three test-only changes. A single full-matrix run of the final tree remains available for consolidated signoff.

```sh
pnpm test:e2e apps/client/e2e/abe-lincoln-character.spec.ts apps/client/e2e/blast-zone-boundaries.spec.ts apps/client/e2e/shield-bubble.spec.ts --grep "forward smash deals|boundary KO telemetry|shield bubble renders"
```

#### Consolidated Chromium signoff

One uninterrupted Playwright run on the final test tree completed in 31.2 minutes with **267 passed, six deliberate skips, and zero failures**.

| Display density | Passed | Skipped | Failed |
| --- | ---: | ---: | ---: |
| DPR 1 | 91 | 0 | 0 |
| DPR 2 | 88 | 3 | 0 |
| DPR 3 | 88 | 3 | 0 |

The six skips are the draw-call, forced polygon fallback, and replacement-asset diagnostics configured to run at DPR 1 only. All three passed there. All 30 visual comparisons matched pixel-for-pixel. The asset swap restored the checked-in public assets.

The run used the isolated Windows checkout, with the current `aeef3f0` application and test changes over `bb6a69e`. Before starting, 60 changed source, test, and visual-reference inputs were verified against the active worktree. Playwright started its own development services and used the checked-in generated assets with `SKIP_ASSETPACK=1`. This closes local Chromium browser signoff. Hosted verification and physical hardware testing remain separate workstreams.

```sh
pnpm test:e2e --output test-results-final-browser-matrix
```

## Linux container and hosted release smoke

A clean Docker build passed on Docker Desktop's Linux engine using the current Windows worktree over `aeef3f0`. The build pulled `node:24-slim`, disabled the build cache, and staged 1,189 tracked inputs from the game workspace without environment files. The frozen install downloaded 491 packages. The optional `cpu-features` build could not detect a compiler in the slim image, and pnpm completed the install. Both the server build and production atlas build succeeded.

- **Local production container:** Image `sha256:8bb7c96ed35a446a21424fb58cd94a3da74781295fc5e9e6386c86699ff56aca` returned HTTP 200 on a temporary loopback port. Three Chromium checks passed in 28.8 seconds. They covered local arena and atlas loading, shared Stage 6 selection and live guest refresh, plus online pause, paused refresh, resume, and confirmed leave.
- **Hosted Render service:** Three Chromium checks passed in 54.7 seconds with two independent browser contexts for each online match. Both clients received secure Socket.IO WebSocket frames and the guest observed the host's movement. A live Stage 6 refresh preserved the stage. The paused refresh preserved the guest fighter and resumed simulation. Confirmed leave returned the guest Home, cleared reconnect state, and showed the host its result. Local play on the host loaded the production atlas and Stage 1 artwork. [Deployed game](https://everybody-throws-hands.onrender.com/)
- **Timing and revision:** The first hosted attempt timed out under the default five-second match-start assertion. It passed with a 20-second assertion window. This was a functional smoke test. Cold and warm load timing under throttled conditions remains open. Render served client bundle `index-DnnslYQA.js`, while the local image built `index-BRM95Ob2.js`. The exact deployed revision was unverified.

The container smoke used a temporary Playwright config pointed at the production service and no development server. The hosted checks used the same approach with a WebSocket and movement assertion added to the pause and leave flow. See the [deployment runbook](../guides/DEPLOYMENT.md#post-deploy-smoke-test) for the sequence to repeat after a release.

### Post-deploy Render rerun

After deployment of `3928e5d`, Render served the same client bundle bytes as the locally verified production image. All three Chromium smoke checks passed in 54.7 seconds on the updated host. They covered local arena and atlas loading, shared Stage 6 selection and live refresh, and secure WebSocket movement replication, paused refresh, resume, and confirmed leave. [Deployed game](https://everybody-throws-hands.onrender.com/) · [Post-deploy loading benchmark](../MENU-POLISH-PLAN.md#post-deploy-rerun)

### Hosted recovery stress check

The deployed release still passed the ordinary live refresh path. Under 8 Mbps throttling, the rejoin request arrived too late in both cache modes. A separate interrupted-atlas test preserved the countdown gate but exposed a stalled retry. This limits the earlier hosted smoke signoff to the conditions under which it passed. [Timing and failure evidence](../MENU-POLISH-PLAN.md#render-slow-link-and-recovery-checks)

### Local production recovery verification

The patched production client build and workspace type check passed. All four production browser checks passed, covering interrupted-atlas retry at 8 Mbps plus unthrottled, cache-enabled slow, and cache-bypassed slow reconnects. The two existing mocked main-entry suites failed in the same nine cases on both the prior entry point and the patch because their Pixi mocks lack `Container`. The ten KO presentation tests passed. The targeted Chromium matrix passed all 15 recovery, online, and visual checks across three display densities. All 30 fixture images matched pixel-for-pixel. The published Render bundle still represents the previous hosted recovery stress check. [Timing and reproduction notes](../MENU-POLISH-PLAN.md#reconnect-and-atlas-retry-fixes)

### Render recovery signoff

On the deployed recovery patch, all three 8 Mbps Chromium checks passed. Live refresh restored guest control in 5.27 seconds with browser cache enabled and 6.78 seconds with cache bypassed. After a simulated reset of one fighter atlas, retrying the same lineup returned HTTP 200 and reached live play on both clients in 8.19 seconds. The first artwork alert still took 33.78 seconds to appear. [Hosted timing and test conditions](../MENU-POLISH-PLAN.md#hosted-reconnect-and-retry-verification)

### Local production early-alert verification

The client type check and production build passed. All three 8 Mbps production-browser trials showed the alert within 0.77 seconds of the simulated reset, held the countdown, and recovered the same lineup after retry. Four additional Chromium development checks passed at DPR 1, including the held-page regression, reconnect, and online selection. This patch still needs the hosted rerun. [Timing evidence](../MENU-POLISH-PLAN.md#early-artwork-failure-alert)

### Hosted early-alert verification

All three Render trials passed at 8 Mbps. The artwork alert appeared a median of 3.12 seconds after arena confirmation and 0.88 seconds after the reset. The countdown stayed blocked until the same-lineup retry fetched the atlas successfully. Both players reached live play in every trial. [Hosted timing and test conditions](../MENU-POLISH-PLAN.md#render-early-alert-signoff)

## Documentation refresh step 3 verification

On November 10, 2026, the operating and player guides were compared with the current workspace scripts, Vite and Playwright configuration, deployment manifests, Dojo panel and curriculum, shared stage layouts, movement and recovery code, and reconnect handlers.

- Existing checkout, local Chromium at DPR 1 and 1280 × 720 with isolated client and server ports, empty environment directory, and committed art. The local match smoke, seven menu and Dojo focus tests, and the two-client reconnect, resume, and leave test passed. Total 9 browser cases.
- Four focused client suites passed 216 tests, including all 205 fighter-by-lesson cases and checks for practice setup, the panel, and routine playback.
- Four focused engine suites passed 78 tests for analog ground intent, action buffering, directional air dodge, and tracked launch.
- The documentation check preserved dated evidence and links it from current summaries. These results are from the existing checkout. The [next phase](../plans/DOCUMENTATION-REFRESH.md#execution) repeats the documented workflow from a clean checkout.

## Documentation refresh step 4 clean checkout

On November 10, 2026, the refreshed instructions were exercised against a clean Windows sparse clone of `aff6d55`, using Node.js 24.13.0 and pnpm 11.20.0. Bonney and environment files were excluded. The clone started without workspace dependencies and build output. Vite and Vitest used an empty environment directory. The pnpm store and browser cache were warm.

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed. Installed 490 packages from the existing store in 11.8 s. |
| `pnpm build` and `pnpm typecheck` | Passed in all five packages. The default build regenerated the articulated fallback, built both production transport packs, and reported AssetPack shortcut-name and Vite bundle-size warnings. |
| `pnpm test` | 2,784 passed, 17 skipped, and 20 failed. Shared, gamepad, engine, and server suites passed. All failures were in the client package. |
| Original atlas build and verifier | Passed. Verified 2,305 frame entries on 17 pages, with zero registration error. |
| Newcomer atlas build and inspection | Passed. Checked revision 51, all 844 frame rectangles on three decoded pages, matching clip names and durations, and finite roots. |
| `pnpm -F @smash/client assets:validate` | Passed. Checked all 18 fallback source parts with zero violations. |
| Chromium setup and discovery | `pnpm exec playwright install chromium` passed. `pnpm test:e2e --list` discovered 300 cases in 26 files across three display densities. |
| Development browser smoke | Nine DPR 1 cases passed on alternate local ports. Covered local movement, hit, pause and results, menu and Dojo focus, and a two-client paused refresh, reconnect, resume, and deliberate leave. |
| Compiled production smoke | After a fresh build, `pnpm start` served the game. Three Chromium cases passed. Moonshine and Abe Lincoln loaded their respective packed WebP pages and Stage 1 art, legacy mode loaded articulated textures, and the guided Throw a jab lesson reached 3/3. |

### Failures and guide corrections

- The focused client rerun reproduced 19 failures. Eighteen local and online app-wiring tests stop when the Pixi mock lacks the `Container` export. The renderer bootstrap test reaches jsdom without a usable canvas context. The Dojo clock test missed one tick in the workspace run and passed on the focused rerun. The [testing guide](../guides/TESTING.md#client-startup-and-dojo-clock-regressions) has the focused command. The gate was open at this point. See the [repair and rerun](#client-regression-gate-follow-up) below.
- Playwright's managed startup timed out on the default ports. A separate-terminal attempt reported that port 3001 was in use and Vite advanced past port 5173. The nine cases passed with the client on 55920 and the server on 55921, using a local Playwright base URL and explicit client socket URL. The exact temporary config and command in the revised guide passed all nine cases again in 32.3 s. [Testing guide](../guides/TESTING.md#browser-checks)
- The server production-entry test invokes a workspace build under Vitest. The test-generated client bundle pointed to localhost:3001, which left the first production browser run at Connecting to server when the compiled server was listening on a different port. Rebuilding from the normal shell before `pnpm start` restored the same-origin endpoint and all three production cases passed. [Deployment guide](../guides/DEPLOYMENT.md#build-and-run-locally)
- Atlas commands were run from the repository root. The rebuilt PNGs and packed manifests had no tracked content differences. The three generated JSON reports showed line-ending changes in the temporary clone. The [atlas guide](../assets/FIGHTER-PRODUCTION-ATLAS.md#current-packaging-workflow) now calls out rebuilding the production output after packing.

No deployment, full browser matrix, physical-controller check, or native Ultimate comparison was part of this rehearsal.

## Client regression gate follow-up

On November 10, 2026, a fresh Windows sparse clone of `aff6d55` was tested with the five changed client test files applied. The run used Node.js 24.13.0, pnpm 11.20.0, the warm dependency store, and an empty Vite and Vitest environment directory.

The three app-entry suites now share a Pixi startup fixture that supplies the stage container and resize surface before the app starts. The local flow checks now cover restoring focus to Local Play and loading only the selected fighters with their required idle art. The Dojo clock fixture drives a controlled animation frame just inside the 60-tick interval and verifies exactly 60 ticks and identical player states at 1×, 0.5×, and 0.25×.

| Check | Result |
| --- | --- |
| Frozen install, build, and type check | Passed. |
| Four targeted client suites | 22 passed in the fresh clone and 22 passed in the working checkout. |
| `pnpm test` | 2,804 passed, 17 existing skips, zero failures. All 884 client tests passed. |

The client regression gate is closed. The changes affect test fixtures and their expectations.
