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

The server's production-entry test runs a workspace build under Vitest and writes to the default output directories. Set environment overrides before invoking the test command so child processes inherit them. After testing, rerun `pnpm build` from the normal shell before starting or publishing production output. The test build can leave the client pointed at the development server. Record deliberate skips separately from passes.

### Client startup and Dojo clock regressions

The latest clean-clone workspace run passed 2,804 tests with 17 existing skips and zero failures. The earlier Pixi startup failures and the intermittent Dojo clock comparison were fixed in the client fixtures. [Repair and rerun](../history/clean-checkout-verification.md#client-regression-gate-follow-up)

To run the targeted client cases from the repository root:

```sh
pnpm -F @smash/client exec vitest run src/__tests__/main.local-play-flow.test.ts src/__tests__/main.network-character-select-flow.test.ts src/__tests__/main.renderer-bootstrap.test.ts src/practice/PracticeClock.test.ts
```

## Browser checks

Install Chromium for the workspace's Playwright version, then run the desired scope.

```sh
pnpm exec playwright install chromium
pnpm test:e2e --list
```

The [Playwright configuration](../../playwright.config.ts) runs Chromium at display densities 1, 2, and 3 using a 1280 × 720 viewport and one worker. It starts `pnpm dev` and waits for port 5173. Outside CI it can reuse an already running client. For a clean run, stop other development instances on ports 5173 and 3001. The client can open while a server port conflict still prevents online play.

If managed startup times out, start the two workspace development commands in separate terminals from the repository root:

```sh
pnpm -F @smash/server dev
```

```sh
pnpm -F @smash/client dev
```

Check that the server reports port 3001 and the client is reachable on port 5173. Run the same Playwright command in a third terminal. Outside CI, Playwright reuses the running client. Keep the environment-directory override set in each terminal.

If the default ports belong to another process, use free ports instead. For example, set `PORT=55921` for the server and `VITE_SERVER_URL=http://127.0.0.1:55921` for the client. Start the client with `pnpm -F @smash/client exec vite --host 127.0.0.1 --port 55920 --strictPort`. In a temporary `playwright.local.config.ts` at the repository root, point Playwright at the running client and disable managed startup:

```ts
import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  webServer: undefined,
  use: { ...config.use, baseURL: 'http://127.0.0.1:55920' },
});
```

Append `--config playwright.local.config.ts` to the same test command. Keep the temporary config out of the commit.

### Portable browser smoke test

Start with the staged local match. It uses repository assets and Playwright's managed dev startup.

```sh
pnpm test:e2e apps/client/e2e/f3-manual-qa-flow.spec.ts --project=chromium-dpr-1
```

For menu, Dojo focus, and two-client reconnect checks, run:

```sh
pnpm test:e2e apps/client/e2e/menu-keyboard-focus.spec.ts apps/client/e2e/network-refinement.spec.ts --project=chromium-dpr-1
```

For asset-replacement and visual baselines, run `pnpm test:e2e:visual`.

The visual command runs the asset-replacement and visual baseline specs. The replacement tests can temporarily change generated assets. Use an isolated checkout, let the tests finish restoring their inputs, and check the asset diff before continuing.

Run the full inventory at standard density first, then run the higher-density projects.

```sh
pnpm test:e2e --project=chromium-dpr-1
pnpm test:e2e --project=chromium-dpr-2 --project=chromium-dpr-3
```

The visual matrix compares lossless fighter and platform captures at each display density. Each run saves the current screenshots, diffs, a comparison report, and a full Stage 1 image to Playwright's test output folder. Set `UPDATE_BASELINES=1` only for an intentional baseline refresh. Review the new captures, clear that setting, and rerun the comparisons. The [last consolidated Chromium signoff](../history/clean-checkout-verification.md#consolidated-chromium-signoff) recorded 267 passes and six expected skips across the three densities. Use it as a dated baseline and record the result of each new run.

## Documentation links and headings

From the repository root, run `pnpm docs:check`. The Node script needs no extra packages. It checks relative Markdown link and image targets, reference destinations, and Markdown headings or explicit anchors in the root docs, docs directory, workspaces, and PR template. It skips code examples, external URLs, generated output, Bonney, and sensitive paths. A broken target prints the source file and line and returns a failing exit status. Review changed guidance against the code as well.

## Record signoff

- Include the commit or build, command, environment, cases run, skips, and result. For browser runs, include viewport and device pixel ratio. For controller runs, include browser, hardware model, connection type, and which inputs were exercised.
- Separate staged regression results, human playtesting, local production previews, hosted results, and version-matched reference measurements. Keep frame parity claims tied to the exact fixture and reference.
- Save summaries and reproduction steps under `docs/`. Link artifacts with repository-relative paths when checked in. Label task-workspace artifacts explicitly when the team cannot fetch them from the checkout.
- Use the [Dojo](../TRAINING-DOJO.md) for repeatable gameplay experiments and the [deployment guide](DEPLOYMENT.md#post-deploy-smoke-test) for hosted checks.
