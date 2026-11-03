# Remaining district audit and polish v1

## Scope
Completed the current art-direction pass across Crane Basin, Customs Gate, Shipyard Approach and Flagship Deck.
Market Quay and Warehouse Row remain the established opening reference.
All files stay within C:\Github\smash-bros-clone\bonney.

## Audit findings addressed
- Remaining coin placement still used uniform floor rows and a coin per platform.
- Repeated barrel/rope/lantern groups continued beyond the first two districts.
- Later areas retained the larger currency art, larger HUD and higher grounded framing.
- Most local district identity came from labels rather than architecture.
- Gate art repeated the same portcullis panel along its entire height.
- The first moving lift's visible hoist was disconnected from the new gantry's height.

## Changes
- Authored 43 remaining-district coins, giving 68 total across the full level instead of the original 147.
- Retained all 16 enemies, all 16 required/optional power-up pickups and all 3 treasures.
- Coin patterns avoid each enemy's initial patrol/anticipation lane.
- Regular currency uses the smaller art throughout the full level; collection bounds remain generous.
- Replaced later automatic prop groups with 13 grounded curated placements.
- Added a loading gantry, customs gatehouse, slipway hull and two flagship cabin placements.
- Source structures have transparent silhouettes and shared baseline anchoring; no broad district tint box was introduced.
- Compact HUD, restrained far scenery, smaller pickup presentation and lower grounded camera framing now apply throughout the full course.
- High-route framing remains consistent; offscreen enemy visibility uses the same camera target.
- Objective text now identifies the current district.
- Gate graphics now show one lower portcullis panel and a continuous hoist instead of stacked gate pictures.
- First lift's visible winch/cable is aligned to its gantry anchor.

## Files
Artwork: assets/district-polish-v1/ (source and gantry.png, customs-house.png, shipyard-hull.png, ship-cabin.png).
Built-in image generation used, no CLI fallback. Exact prompt: docs/district-polish-prompts-v1.txt.
Packer: scripts/pack-district-art.mjs.
Placement/render helpers: src/remaining-scene.mjs.
Authored coins: src/level-data.mjs.
Shared presentation/framing: src/market-scene.mjs, src/game.mjs, src/encounters.mjs.
District and machinery integration: src/full-level-art.mjs.
Review captures: docs/screenshots/district-polish-v1/ (eight ground/high views and review.png).

## Verification
47 tests pass.
New contracts check structure/prop grounding, clear reward lanes, required outfit/treasure preservation and consistent ground/high-route framing.
Full-level browser progression passed: customs mechanisms, gate passage, checkpoint retry, flagship mechanisms, cabin treasure, finish and tutorial chooser.
All ages and both outfits passed movement/jump browser checks in each of the four remaining districts.
Runtime asset audit passed: 42 nonempty successfully loaded textures and no captured asset/page errors.
Tutorial browser checks and all runtime syntax checks passed.
Eight ground/high-route captures visually inspected.

## Preserved behavior and remaining review
Collision layouts and full-height gate blockers are preserved; the gate presentation change is cosmetic.
No puzzle, flight-fuel, partial-charge, health-stage or recovery rule was removed.
The planned deep architecture/collision redesign of gate openings remains a separate possible refinement.
This is a cohesive first art-direction pass, not a claim of production release readiness. Human review of architecture scale, enemy cues, pacing and secret clues should guide the next iteration.
