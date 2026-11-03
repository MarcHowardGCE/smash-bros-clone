# Pirate Captain sprite set v1

Reference: C:/Users/misac/Downloads/Ages of a Pink-Haired Pirate Captain.png. Generated using the built-in image generation tool (not CLI/API fallback), with the reference as costume guidance.

Artwork: assets/pirate-captain-v1/source.png. Runtime atlases: assets/pirate-captain-v1/captain-atlas.png (256x192) and captain-walk-atlas.png (576x192). Individual exported sprites and manifest.json are in the same directory. Rows: adult, teenage, baby. Each age has idle, six strides, and jump, for 24 source poses. Nearest-neighbor packing preserves transparency, aligns feet and heads, and normalizes stride height. Packer: scripts/pack-pirate-captain.mjs. Exact generation prompt: docs/pirate-captain-v1-prompt.txt.

The new costume follows the burgundy gold-edged tricorn, navy gold-trimmed captain coat, epaulettes, white shirt, burgundy sash, trousers and brown boots from the reference. Default continues using the previous casual outfit. Egghead continues using its purple suit. Captain charge retains the existing cannonball transformation and game rules.

Integration: characterOutfit in src/locomotion.mjs selects default, captain, or egghead explicitly. src/game.mjs loads separate idle/jump and walking atlases for each outfit. No old art was overwritten.

Validation: 52 tests pass, syntax checks pass. scripts/captain-browser.mjs verifies all three outfits at every age, both facing directions, distinct six-frame strides, aligned stride height, and successful resource loading. scripts/audit-runtime-assets.mjs verifies all 44 runtime textures. Outfit comparison: docs/screenshots/pirate-captain-v1/outfit-review.png (columns: default idle, Captain idle, three Captain stride samples, Captain jump, Egghead idle).
