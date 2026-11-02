# Sprite refinement v2

## Result
Replaced the six block-style character designs with reference-guided shaded pixel sprites.
Two outfits x three ages x four poses = 24 frames:
idle, run-a, run-b, jump/flight.
Built-in image generation was used; no CLI/API-key fallback.
Exact prompts: sprite-refinement-prompts-v2.txt.
Style reference retained at assets/references/sprite-style-target.png.
Original generated sheets and transparent exported frames are in assets/sprites-v2/.

## Rendering
Each frame is 64x64, displayed in a 32x32 logical-world footprint.
The canvas backing buffer is now 768x432 for the same 384x216 world viewport.
This preserves higher character detail without enlarging the collision box or changing the level.
Tiles, HUD, and effects still use the existing world coordinates.
Adult idle height is 60 source pixels; teenage 50; baby 36.
Every pose in an age uses the same scale and bottom anchor.
The renderer mirrors frames for left-facing motion, alternates two running poses, and uses the bent-knee airborne pose for jumping/falling/flight.
No-ability appearance still uses Captain artwork.

## Pipeline
Built-in tool created transparent reference-guided Captain and Egghead sheets.
scripts/pack-refined-sprites.mjs detects connected alpha components, separates the twelve poses per source sheet, preserves per-age scale, and exports aligned nearest-neighbor PNGs.
It uses the parent repository's existing pngjs library; game runtime still needs no dependencies.
manifest.json records source bounding boxes, scale and frame layout.
Original sources are preserved alongside exports. Earlier pixel-v1 and character-lineup-v1 assets remain available.

## Scope
Character appearance and pose selection only. Physics, damage progression, abilities, cooldowns, enemy health and terrain are unchanged by this refinement.
The generated art is an approximation of the supplied references, with small costume/pattern differences between poses.
Two running poses are a first animation pass, not a complete smooth run cycle. Jump and flight currently share a pose.

## Validation
Browser smoke: asset loading, 768x432 canvas, keyboard controls, flight, pause, recharge, replacement, cannonball, damage stages, death/restart, finish and responsive layout.
Gameplay suite and syntax checks rerun after integration.
Visual inspection: exported atlases and docs/screenshots/refined-harbor-v2.png.
