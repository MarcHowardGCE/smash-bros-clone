# Market Quay polish slice v1

Scope: first 960 world pixels, approximately 2.5 screens. Later districts remain comparison material.
Goal: establish the visual quality bar from the November 2 visual audit.

## Changes
- Two authored transparent midground facades: fish market and harbor supply shop.
- Four deliberately placed decorative props replace the automatic repeating groups in Market Quay.
- Eleven authored coins replace the nineteen uniformly placed market coins.
- Market coin art is 8x8 world pixels instead of 16x16; generous 10x12 collection bounds remain.
- Coin trails guide a roof approach and gap jump; enemy patrol/anticipation lanes remain clear.
- Both required outfit pickups remain available. Their market icons are slightly smaller; labels appear nearby.
- Distant panorama is composited at reduced contrast against its base color for this section; no district-shaped overlay rectangle is used.
- Grounded camera target moves from y=116 to y=148, placing the floor around y=176 instead of y=144.
- High-route camera framing remains familiar, and the target blends across the district boundary.
- Market HUD is 28 world pixels high instead of 38.
- Market messages use the existing outside-canvas objective area; the persistent footer is omitted in the slice.
- Health, movement, ages, abilities, puzzle and checkpoint rules are unchanged.

## Artwork and code
Assets: assets/market-polish-v1/ (source plus two exported facade PNGs).
Built-in image generation created the facade artwork; no CLI fallback.
Exact prompt: docs/market-polish-prompts-v1.txt.
Packer: scripts/pack-market-art.mjs.
Scene placement and framing helper: src/market-scene.mjs.
Renderer integration: src/game.mjs, src/full-level-art.mjs, src/world-art.mjs.
Market coin placement: src/level-data.mjs.
The rest of the level keeps its existing art/placement for direct comparison.

## Review captures
docs/screenshots/market-polish-v1/opening.png
docs/screenshots/market-polish-v1/gap.png
docs/screenshots/market-polish-v1/lookout.png
docs/screenshots/market-polish-v1/three-screen-review.png
Captured at native canvas resolution and visually inspected.

## Verification
41 unit/integration tests pass.
New checks cover reward clearance from enemy lanes, required pickup access, and smooth grounded/high-route/boundary framing.
Browser checks cover all three ages and both outfits moving/jumping in the slice, with no page errors.
Full-level progression browser checks still pass.
All runtime syntax checks pass.
Manual player review is still needed for the composition and camera feel; this slice has not yet been approved as the final standard.

## Next review
Compare this opening with later districts during play.
Review coin scale, facade/background balance, camera height, UI density and enemy readability.
After feedback, extend the approved rules to warehouse/cranes/customs/ship areas with distinct architecture rather than repeated market buildings.
