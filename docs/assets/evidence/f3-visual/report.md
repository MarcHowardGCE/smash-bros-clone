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
