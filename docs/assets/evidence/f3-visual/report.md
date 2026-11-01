# F3 visual QA report

- mode: baseline-compare
- hook: query-gated fixture harness at /?e2e-fixture=1 (plus e2e-force-webgl=1 for draw-call measurement), exposed via window.__smashE2E
- pixelmatch threshold: 0.1
- max differing pixels: 0.5%
- dpr-1: renderer mode=sprite
- dpr-1/neutral-idle: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-0: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-1: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-2: mismatch=0/921600 (0.0000%)
- dpr-1/hit-flash-slot-3: mismatch=0/921600 (0.0000%)
- dpr-1/lincoln-idle: mismatch=0/921600 (0.0000%)
- dpr-1/facing-flipped: mismatch=0/921600 (0.0000%)
- dpr-1/squash-stretch: mismatch=0/921600 (0.0000%)
- dpr-1/invincibility-alpha-0.4: mismatch=0/921600 (0.0000%)
- dpr-1/camera-scale-0.4: mismatch=0/921600 (0.0000%)
- draw-calls(neutral-idle): count=1, wrapped=drawArrays, drawArraysInstanced, drawElements, drawElementsInstanced
- polygon fallback: mode=polygon; screenshot=docs\assets\evidence\f3-visual\polygon-fallback-dpr-1.png
- dpr-2: renderer mode=sprite
- dpr-2/neutral-idle: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-0: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-1: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-2: mismatch=0/3686400 (0.0000%)
- dpr-2/hit-flash-slot-3: mismatch=0/3686400 (0.0000%)
- dpr-2/lincoln-idle: mismatch=0/3686400 (0.0000%)
- dpr-2/facing-flipped: mismatch=0/3686400 (0.0000%)
- dpr-2/squash-stretch: mismatch=0/3686400 (0.0000%)
- dpr-2/invincibility-alpha-0.4: mismatch=0/3686400 (0.0000%)
- dpr-2/camera-scale-0.4: mismatch=0/3686400 (0.0000%)
- dpr-3: renderer mode=sprite
- dpr-3/neutral-idle: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-0: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-1: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-2: mismatch=0/8294400 (0.0000%)
- dpr-3/hit-flash-slot-3: mismatch=0/8294400 (0.0000%)
- dpr-3/lincoln-idle: mismatch=0/8294400 (0.0000%)
- dpr-3/facing-flipped: mismatch=0/8294400 (0.0000%)
- dpr-3/squash-stretch: mismatch=0/8294400 (0.0000%)
- dpr-3/invincibility-alpha-0.4: mismatch=0/8294400 (0.0000%)
- dpr-3/camera-scale-0.4: mismatch=0/8294400 (0.0000%)

## Visual inspection notes (look_at)

- `actual/dpr-1/neutral-idle.png`: 4 fighters visible on stage.
- `actual/dpr-1/lincoln-idle.png`: Lincoln silhouette details visible (top hat + beard).
- `polygon-fallback-dpr-1.png`: polygon fallback is visually distinct from sprite mode.

## Honesty note

- The compare matrix now runs in **sprite mode** (`getRendererMode() === 'sprite'` asserted in-spec).
- Forced fallback coverage remains in place via `?renderer=polygon`, and is captured separately.
