# Palette, face and costume audit


### Palette audit — 2026-11-03 (batch 19)

Added a portable palette/face/costume comparison at fighter-art-pilot-v1/palette-review.html. Screened 2,289 registered frames, visually scanned all 408 first poses on 12 boards, and inspected ten flagged drawings enlarged. No confirmed palette defect warranted source-art edits; Lincoln’s accepted high kick is retained. Pack revision 18 and gameplay behavior are unchanged. This is sampled visual evidence, not every-frame approval. See docs/assets/FIGHTER-PALETTE-AUDIT.md. Remaining work: remaining-frame visual checks, effects/player identification, final packaging and engine integration.

Rebuild: node scripts/assets/build-fighter-art-review.mjs ABS_OUTPUT_DIRECTORY. Measurements use broad color-family masks, not semantic garment masks or perceptual color differences. Pose, occlusion and shading can alter results. Findings are persisted in apps/client/public/fighter-art-pilot-v1/palette-visual-findings.json. Source PNGs, timing and manifest remain unchanged.

Validation: 12 grouped browser checks passed over HTTP and offline (three fighters, drawing switching, background, candidate navigation, 12 board images and ten finding links). Asset verifier passed: 136 clips / 763 drawings / 54 live clips per fighter. Existing 32-test suite was not rerun; game code and source artwork were unchanged.
