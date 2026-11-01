# Learnings — cartoon-asset-pipeline

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

- 2026-10-31 — Todo 1 can be completed without external art imports by using a deterministic script-authored placeholder path: generate exact-contract PNG canvases with `pngjs`, place outputs directly at `raw-assets/fighters{m}/all-rounder{tps}/`, and produce an inventory script that reports alpha bounding boxes for evidence docs.
- 2026-10-31 — For Route B documentation, explicitly state when **no AI model** was used (script-authored fallback), include `model: none`, `prompts: none`, and still record rejected CC-BY candidate evidence so failure-path QA remains satisfied.

- Todo 2 contract implementation: keep `assetDensity = 2` explicit in contract data, then prove `logicalCanvas = rawCanvas / 2` and `anchor = jointPx/rawCanvasPx` with tests for every part and character.
- Luminance acceptance must run on post-multiply colors (`SLOT_COLORS` multiplied by `#F5F5F5`), not raw slot swatches; this preserves correctness for the in-engine tint pipeline.
- Head/body clipping prevention is strongest when asserted from renderer-derived constants (`HEAD_RADIUS`, hat/beard extents, `BODY_RADIUS`, coattail extent) rather than hardcoded headroom literals in tests.
- Todo 3 validator: resolve raw-assets root from module location (not process cwd) so CLI/test invocation context cannot silently produce assets-checked=0 with false skip-only success.
- Todo 3 validator: keep real-art gate green before Todo 4 by explicit skip-with-message only for missing character dirs and explicit TODO skip for all-rounder when current placeholder art fails contract checks.
- Todo 6 hit flash: avoid container tint for sprite silhouettes by adding optional `IPartRenderer.setHitFlash(active)` and routing through FighterRenderer with a tint fallback only when method is absent.
- Todo 6 filter implementation: use a single module-level Pixi v8 Filter singleton (shared GlProgram + GpuProgram) and attach via `container.filters = [shared]`/`null`; duplicate guard in helper keeps rapid toggles capped at one attached filter.
- Todo 6 testability: keep SpritePartRenderer stub behavior unchanged for draw path, but export `getSharedHitFlashFilter()` + `applyHitFlash(container, active)` so filter identity and attach/detach behavior are testable even before full sprite implementation.
- Todo 4 asset generation: keep one deterministic generator script as single source of authored raw art for all 3 characters, outputting to literal-tag paths (`fighters{m}/<id>{tps}`) so validator and later AssetPack input stay aligned.
- Todo 4 contract enforcement: for HEAD/BODY, explicitly paint a 12px opaque band starting at joint Y to satisfy joint-underlap (this fixed the prior all-rounder HEAD underlap violation from Todo 3 evidence).
- Todo 7 SpritePartRenderer: keep constructor synchronous by injecting a TextureProvider, build one sprite per part in polygon z-order, and compute fit scale from `logicalCanvas.width / texture.orig.width` so `@2x` assets resolve to 1.0 while mismatched density still renders correctly.
- Todo 7 parity tests: compare sprite vs polygon at transform semantics (joint world coordinates + referenceBoundsLogical transformed bounds) instead of Pixi layout bounds, and include a deliberate anchor perturbation QA step to prove parity assertions are non-vacuous.
- Todo 5 AssetPack pipeline: a custom post-manifest normalizer pipe is useful for deterministic aliasing (`fighters/<characterId>`) and root-absolute `/assets/...` URLs without changing raw-asset tags (`fighters{m}` + `<id>{tps}`).
- Todo 5 determinism guard should check both byte-level output equality and git porcelain untracked detection; `git diff` alone misses newly-generated untracked files.
- Todo 5 density safety: assert atlas `meta.scale === 2` and per-frame `sourceSize` against raw contract dimensions (160x160 head/body, 64x128 limbs) so metadata regressions fail loud instead of silently forcing renderer-side scale hacks.
- Todo 7 implementation detail: to compare sprite vs polygon fairly, parity checks must use transformed `referenceBoundsLogical` in local part space (via `toGlobal`) rather than Pixi layout bounds, which include transparent sprite canvas and will falsely fail.
- Todo 7 QA guard: include an explicit anchor-perturbation failure test (+0.1 anchor delta) so parity assertions prove sensitivity instead of passing vacuously.
- Todo 8 factory wiring: `createPartRenderer` must fail fast in `'sprite'` mode when no `TextureProvider` is passed (clear throw), while still defaulting `characterId` to `'all-rounder'`; this keeps polygon behavior unchanged and prevents silent white-texture fallbacks from masking missing preload wiring.
- Todo 9 preload safety: keep a sheet-scoped provider keyed by `CharacterId` and resolve `sheet.textures[frameName]` (never global frame aliases), because all atlases share `head/body/arm/leg` keys and alias-cache collisions can silently cross-wire Swift textures into other fighters.
- Todo 9 fallback model: decide renderer mode once at boot with an all-or-nothing gate (manifest init fail, bundle fail, timeout, or any missing of 6 required frames across 3 characters => polygon), and never throw—warning + degrade matches SFX precedent.
- Todo 10 renderer wiring: keep `FighterRenderer` backward-compatible by adding an optional 4th constructor options param (`mode`, `textureProvider`) while defaulting mode to polygon via factory defaults; this preserves existing test call sites and enables main bootstrap to inject resolved mode/provider once.
- Todo 11 test migration: for renderer-mode parity, avoid Pixi child-index and `Graphics.clear` internals; assert through `IPartRenderer` contract (`draw` call counts) with a shared polygon/sprite case matrix and a Texture.WHITE-based injected provider fixture so dirty-check and lifecycle behavior are validated identically across both implementations.
- Todo 12 animation coverage: derive coverage sets directly from exported enums (`PlayerStateEnum`, `MoveId`) and assert totals/contracts explicitly (`25`, `22`, `47`) so enum drift fails loudly; assert `MoveId.LEDGE_ATTACK` exclusion by name rather than by index/length.
- Todo 12 AIR_ATTACK nuance: `getAnimationPose` aliases `AIR_ATTACK -> ATTACK`, so table entry coverage must be explicit (`ANIMATIONS['AIR_ATTACK']`) and recorded as dead-via-alias, otherwise mapped-count assertions can pass without touching the entry.
- Todo 12 swap proof: browser-level replaceability can be proven without production code changes by generating temp replacement raw assets, running AssetPack in-test, hot-swapping `public/assets` with guaranteed restore in `finally`, and asserting both no preload fallback warning and replacement-color pixels in screenshot.
- Todo 14 documentation guard: keep the artist-facing numeric table in `docs/assets/REPLACING-FIGHTER-ART.md` mechanically synced to `assetContract.ts` via a parser-based Vitest; this turns silent docs drift into deterministic CI failure.
- Todo 14 evidence workflow: capture both happy-path doc-follow execution and a deliberate one-number perturbation failure/recovery cycle in the same evidence file to prove the drift test is active rather than ceremonial.

## Todo 13
- createApp.ts:67 uses new URL(...).pathname -> '/C:/...' on Windows: express.static + SPA catch-all both 404 on Windows production. Real bug (should use fileURLToPath); out of scope. createApp.assets.test.ts is describe.skipIf(win32). Evidence captured by patching gitignored apps/server/dist.
- On POSIX: atlas json -> application/json, png -> image/png, missing -> 200 text/html (catch-all).
