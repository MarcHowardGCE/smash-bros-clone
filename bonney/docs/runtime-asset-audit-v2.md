# Runtime asset audit and placeholder replacement v2

## Findings
The orange/cream block in the user's screenshot was the health-food placeholder, not an image load failure.
A runtime audit found 38 loaded PNG textures; every response was successful and each decoded to a nonempty image.
No missing texture URLs were found in that run.

The remaining visible placeholders found in gameplay were:
- health food drawn as three colored rectangles;
- lookout projectiles drawn as plain rectangles;
- cargo warning drawn as a line and text exclamation;
- secret/cabin breakable seals reusing ordinary crate art;
- secret glint, plus and percentage characters missing from the bitmap font.

## Fixes
Added dedicated shaded pixel sprites for a bread/apple food plate, musket pellet, falling-cargo warning and cracked breakable seal.
Food artwork now rests at the supporting floor's baseline while keeping existing collection behavior.
Winch locks use their winch art without an extra generic crate drawn underneath.
Cargo remains visible while suspended between drops, with cable and winch rendering, instead of disappearing for part of its cycle.
Added the missing bitmap glyphs for *, + and %.
Retained simple intentional rendering for ropes/chains, structural supports, HUD bars, hit-point indicators, dust and glints; these are not missing texture files.
Older concept/source folders remain archived reference material and are not expected to load in the game.

## Artifacts
Artwork: assets/gameplay-props-v2/.
Source sheet and isolated exported PNGs are preserved.
Built-in image generation was used, with a transparent-background cleanup pass.
Prompt: docs/gameplay-props-prompts-v2.txt.
Packer: scripts/pack-gameplay-props.mjs.
Audit script: scripts/audit-runtime-assets.mjs.
Runtime inventory: docs/screenshots/asset-audit-v2/runtime-assets.json.
Review captures in that same folder: food.png, seal.png, cargo-warning.png.

## Verification
44 gameplay/rendering tests passed.
Full-level browser progression passed after sprite export.
Runtime asset decoding/inventory check passed: 38 nonempty textures, no failed responses or captured page errors.
Food, cracked seal, warning and projectile state captures inspected.
Syntax checks passed.
Game rules and health restoration amounts are unchanged.
