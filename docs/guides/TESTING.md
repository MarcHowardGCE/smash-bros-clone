# Testing and verification

Follow [local development](DEVELOPMENT.md) for the toolchain, initial build, and optional empty environment directory. Run tests from the repository root unless a command says otherwise.

## Workspace checks

```sh
pnpm build
pnpm test
pnpm typecheck
```

`pnpm test` runs the five fighter workspace suites with Vitest. `pnpm lint` runs the same TypeScript check as `pnpm typecheck`. Package-specific runs are useful while iterating.

```sh
pnpm -F @smash/engine test
pnpm -F @smash/server test
pnpm -F @smash/client test src/renderer/fullbody/KOPresentation.test.ts
```

The default workspace test command stops at the first failing package. For a diagnostic run across all five packages, use `pnpm -r --no-bail --workspace-concurrency=1 test`. Its exit status still reports failures. See the [clean-checkout baseline](../history/clean-checkout-verification.md).

The server's production-entry tests can invoke builds. Set environment overrides before invoking the test command so child processes inherit them. Record deliberate skips separately from passes.

## Browser checks

Install Chromium for the workspace's Playwright version, then run the desired scope.

```sh
pnpm exec playwright install chromium
pnpm test:e2e --list
```

The [Playwright configuration](../../playwright.config.ts) runs Chromium at display densities 1, 2, and 3 using a 1280 × 720 viewport and one worker. It starts `pnpm dev` and waits for port 5173. Outside CI it can reuse an already running client. For a clean run, stop other development instances on ports 5173 and 3001. The client can open while a server port conflict still prevents online play.

### Portable browser smoke test

Start with the staged local match. It uses repository assets and Playwright's managed dev startup.

```sh
pnpm test:e2e apps/client/e2e/f3-manual-qa-flow.spec.ts --project=chromium-dpr-1
```

For asset-replacement and visual baselines, run `pnpm test:e2e:visual`.

The visual command runs the asset-replacement and visual baseline specs. The replacement tests can temporarily change generated assets. Use an isolated checkout, let the tests finish restoring their inputs, and check the asset diff before continuing.

Run the full inventory at standard density first, then run the higher-density projects.

```sh
pnpm test:e2e --project=chromium-dpr-1
pnpm test:e2e --project=chromium-dpr-2 --project=chromium-dpr-3
```

The visual matrix compares lossless fighter and platform captures at each display density. Each run saves the current screenshots, diffs, a comparison report, and a full Stage 1 image to Playwright's test output folder. Set `UPDATE_BASELINES=1` only for an intentional baseline refresh. Review the new captures, clear that setting, and rerun the comparisons. See the [verification history](../history/clean-checkout-verification.md) for run results.

## Record signoff

- Include the commit or build, command, environment, cases run, skips, and result. For browser runs, include viewport and device pixel ratio. For controller runs, include browser, hardware model, connection type, and which inputs were exercised.
- Separate staged regression results, human playtesting, local production previews, hosted results, and version-matched reference measurements. Keep frame parity claims tied to the exact fixture and reference.
- Save summaries and reproduction steps under `docs/`. Link artifacts with repository-relative paths when checked in. Label task-workspace artifacts explicitly when the team cannot fetch them from the checkout.
- Use the [Dojo](../TRAINING-DOJO.md) for repeatable gameplay experiments and the [deployment guide](DEPLOYMENT.md#post-deploy-smoke-test) for hosted checks.
