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
