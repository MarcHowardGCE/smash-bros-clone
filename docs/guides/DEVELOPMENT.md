# Local development

## Prerequisites and first run

Use Node.js 24 and pnpm 11.20.0. Node.js 24.13.0 is the locally verified version. The [workspace manifest](../../pnpm-workspace.yaml) includes only `apps/*` and `packages/*`. Use the pnpm lockfile for installs and keep the separate `bonney/` project out of fighter workflows.

Run these commands from the repository root.

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

The initial build produces compiled exports for workspace dependencies. Open [localhost:5173](http://localhost:5173). The client runs on **5173** and the Socket.IO server runs on **3001** by default. Both processes start under `pnpm dev`. For separate terminals, run `pnpm -F @smash/client dev` and `pnpm -F @smash/server dev`. The pnpm commands work on Windows and Unix. The optional Bash-based recipes in the [justfile](../../justfile) require a Unix-compatible shell.

## Run with an empty environment directory

Vite and Vitest honor `SMASH_ENV_DIR`. Set it in the shell that starts builds, development, or tests. Use the following commands in PowerShell.

```powershell
$ethEnvDir = Join-Path ([System.IO.Path]::GetTempPath()) ("eth-env-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $ethEnvDir | Out-Null
$env:SMASH_ENV_DIR = $ethEnvDir
```

Use the following commands in a POSIX shell.

```sh
SMASH_ENV_DIR="$(mktemp -d)"
export SMASH_ENV_DIR
```

The game starts locally with defaults. [Vite configuration](../../apps/client/vite.config.ts) also supports `SMASH_BUILD_OUT_DIR` for an isolated client build and `SMASH_PUBLIC_DIR` for an alternate public asset directory. Use the default client output for the ordinary production server, which serves `apps/client/dist`.

## Asset development and troubleshooting

- AssetPack generates the articulated fallback atlas from `raw-assets/`. Set `SKIP_ASSETPACK=1` before build or development to use committed generated assets. Use `$env:SKIP_ASSETPACK = '1'` in PowerShell or `export SKIP_ASSETPACK=1` in a POSIX shell. Leave it unset when iterating on raw parts. See [replacing fighter art](../assets/REPLACING-FIGHTER-ART.md).
- `ERR_PNPM_IGNORED_BUILDS` calls for checking the pinned pnpm version and the workspace's `allowBuilds` entries. Review the named dependency before changing the allowlist. [Workspace configuration](../../pnpm-workspace.yaml)
- Unresolved workspace packages after install usually warrant rebuilding from the root. If only a compiled shared package is stale, build that package and restart the consuming process.
- If Home loads but an online room fails, check that both dev processes are running, verify the printed ports, and look for the WebSocket request in browser developer tools. Vite can choose a different port when 5173 is taken. For a custom backend port, set `PORT` for the server and `VITE_SERVER_URL` for Vite, then restart the affected processes.
- If a fighter appears as fallback geometry, check the asset requests and the renderer query string. `?renderer=polygon` is a diagnostic override. The live roster and production atlases are covered by the [asset documentation](../README.md#fighter-art-and-assets).

The [clean-checkout record](../history/clean-checkout-verification.md) confirms the frozen install and default build on Windows. For the portable browser smoke test and known test failures, see [Testing](TESTING.md). For production runtime and host configuration, see [Deployment](DEPLOYMENT.md).
