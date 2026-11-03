# Whole-level placement and background audit

## Scope and evidence
Reviewed all six districts using 50 overlapping 384-world-pixel views, spaced 256 pixels apart, at ground and elevated heights. Captures and five-by-five contact sheets are in docs/screenshots/whole-level-audit/. Source screenshot's dark tint comes from the death overlay, not a missing background texture. Problems underneath that overlay were real structural placement errors.

## Findings and corrections
| Area | Finding | Correction |
|---|---|---|
| All districts | Elevated skyline/sea stayed fixed to screen while camera climbed | Vertical distant-background parallax; sky extension fills the upper viewport continuously |
| Market Quay | Approach decks had detached brackets | Open riveted steel frames with footings on actual quay spans |
| Warehouse Row | Freestanding approach decks lacked grounding | Grounded frames; previously established playable roofs preserved |
| Crane Basin | Second crane sat on a narrow improvised post; lift-b winch floated | Shared service gantry at world y134, lift winch bottom matches beam; crane base matches beam |
| Crane Basin | First lift's swept path intersected the shed | Lift-a moved to x2544 beneath the right gantry cap; full travel path clears architectural footprints |
| Crane Basin | Static deck cut across crane shed | Shed roof profile added; conflicting ledge removed; continuous roof walking reused |
| Crane Basin | High chest floated above its destination | Chest rests on the high platform; treasure logic retained |
| Customs Gate | Upper routes and perches lacked foundations | Open frames with supported feet; switches retain reachable support platforms; customs building remains entirely on solid quay |
| Shipyard | Cargo came from invisible sky winches | Visible grounded yard hoists; suspended cargo and warning cues retained |
| Shipyard | Platform cut across ship hull | Hull rim becomes playable deck profile; facade-cutting ledge removed |
| Flagship | Rigging decks looked disconnected | Grounded open frames; cabin roofs and bell preserved |
| Flagship | Captain pickup partly over pit edge | Moved from x5960 to x5952, fully inside the quay span |

## Placement rules now checked
Building foundations fit solid ground. No static ledge crosses a building facade. Moving lift swept bounds clear architectural footprints. Ground pickups and switch controls have supporting terrain. Every non-roof elevated platform/perch has a ground-based visual foundation. Ground enemies and patrol ranges remain on their supporting terrain. Ten building/deck surfaces support continuous roof landing and walking. Hoist chains remain attached to their moving objects and hooks preserve their swing radius.

Rear steel frames are scenery, not new collidable barriers. All existing ages, outfits, powers, puzzles, treasures and checkpoint rules remain. Supports use code-native pixel detail alongside existing raster art; no new generated artwork was required.

## Verification
56 passing tests; runtime syntax checks pass. Full-level browser progression passes through both gate puzzles, checkpoint retry, winch/rigging, bell/cabin treasure, victory and tutorial switching. All 44 runtime textures load successfully. Fifty final full-route captures load without page errors. Ten building/deck roof browser landings were checked during the audit.

## Remaining design issues, in priority order
1. Gate towers: full-height collision blockers still require tall rails/hoists extending to world y0. Simply shortening art or collision would introduce invisible barriers or allow bypassing puzzles. Next change should redesign each as a complete portal/bridge mechanism, with art and gating behavior authored together.
2. Scaffold art: structural placement is now coherent, but the repeated steel frames remain a functional art pass. Bespoke loading towers, rope bridges, and ship rigging would give high routes more variety without changing collision.
3. Crane silhouette: the large gantry background includes a decorative pulley/hook in addition to the moving hazard. A future edited gantry asset should remove that redundant hanging shape, preserving only the actual hazard as the threat cue.
4. Playtest pacing: automated reachability/progression checks do not establish that hook/gull timing, flight recovery, secret clues, and enemy density feel fair to a new player. A blind playtest is still needed before calling the level production ready.
5. Sky extension: vertical parallax now puts the sea below high routes; a separately authored tall sky panorama could replace the current extended sky strip for richer high-altitude composition.

## Follow-up status
The gate towers, duplicate decorative crane hook, and stretched sky-strip issues above have been addressed in docs/scene-followup-v1.md. Supports now vary by district material. Current checks: 57 passing tests, 45 runtime textures, full browser progression and 50 recaptured views. Gate traversal is now intentionally flyable above bounded portals; completion still requires every mechanism. Fresh-player pacing and clue comprehension still need human playtesting.
