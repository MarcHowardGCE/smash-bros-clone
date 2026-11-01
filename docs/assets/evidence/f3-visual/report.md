# F3 visual QA report

- mode: baseline-compare
- hook: query-gated fixture harness at /?e2e-fixture=1 (plus e2e-force-webgl=1 for draw-call measurement), exposed via window.__smashE2E
- pixelmatch threshold: 0.1
- max differing pixels: 0.5%

## Hook added

- Added a **query-gated test-only render fixture harness** in `apps/client/src/main.ts`:
  - `?e2e-fixture=1` enables fixture mode and exposes `window.__smashE2E`.
  - `?e2e-force-webgl=1` forces WebGL preference for draw-call instrumentation.
  - `?renderer=polygon` still forces polygon fallback and is asserted in e2e.
- Hook API used by Playwright:
  - `renderFixture(name)`
  - `measureDrawCalls(name)`
  - `getRendererMode()`
  - `getGameScale()`
- Production behavior is unchanged unless the explicit e2e query params are present.
- dpr-1: renderer mode=polygon
- dpr-1/neutral-idle: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-0: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-1: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-2: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-3: mismatch=0/921600 (0.0000%)
- dpr-1/lincoln-idle: mismatch=0/921600 (0.0000%)
- dpr-1/facing-flipped: mismatch=0/921600 (0.0000%)
- dpr-1/squash-stretch: mismatch=0/921600 (0.0000%)
- dpr-1/invincibility-alpha-0.4: mismatch=3880/921600 (0.4210%)
- dpr-1/camera-scale-0.4: mismatch=0/921600 (0.0000%)
- draw-calls(neutral-idle): count=3, wrapped=drawArrays, drawArraysInstanced, drawElements, drawElementsInstanced
- polygon fallback: mode=polygon; screenshot=docs\assets\evidence\f3-visual\polygon-fallback-dpr-1.png
- dpr-2: renderer mode=polygon
- dpr-2/neutral-idle: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-0: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-1: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-2: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-3: mismatch=0/3686400 (0.0000%)
- dpr-2/lincoln-idle: mismatch=0/3686400 (0.0000%)
- dpr-2/facing-flipped: mismatch=0/3686400 (0.0000%)
- dpr-2/squash-stretch: mismatch=0/3686400 (0.0000%)
- dpr-2/invincibility-alpha-0.4: mismatch=16928/3686400 (0.4592%)
- dpr-2/camera-scale-0.4: mismatch=0/3686400 (0.0000%)
- dpr-3: renderer mode=polygon
- dpr-3/neutral-idle: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-0: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-1: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-2: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-3: mismatch=0/8294400 (0.0000%)
- dpr-3/lincoln-idle: mismatch=0/8294400 (0.0000%)
- dpr-3/facing-flipped: mismatch=0/8294400 (0.0000%)
- dpr-3/squash-stretch: mismatch=0/8294400 (0.0000%)
- dpr-3/invincibility-alpha-0.4: mismatch=37921/8294400 (0.4572%)
- dpr-3/camera-scale-0.4: mismatch=0/8294400 (0.0000%)

## Baseline generation and visual inspection notes

- Baselines were generated only via `UPDATE_BASELINES=1`.
- Manual inspection (look_at) on baseline screenshots:
  - `neutral-idle.png`: non-blank, 4 visible fighters.
  - `lincoln-idle.png`: Lincoln-specific hat, beard, and coattails are visible.
  - `hit-flash-slot-0.png`: slot 0 shows full yellow hit flash; other slots remain unchanged.
  - `polygon-fallback-dpr-1.png`: polygon fallback style confirmed.

## Honesty note

- During fixture harness runs, `window.__smashE2E.getRendererMode()` reported `polygon`.
- Therefore this F3 evidence set validates deterministic visual baselines and draw-call instrumentation in fallback mode for these runs.
