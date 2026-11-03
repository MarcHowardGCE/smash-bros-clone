# Skyward Egghead: discovery milestone

## Playable now
A hidden upper route branches from the highest crane traversal platform. It is absent from the Course selector and has no visible entrance marker. Three cloud islands form a short playable prototype with a distant futuristic research skyline, eight coins, a Sky Chart reward and a return pad. This is the discovery/art/route foundation, not the previously brainstormed complete four-section cloud course.

Launch Egghead flight at full charge from the highest crane route. The legitimate launch region is world x2688–3060 with feet at y164 or higher; the high treasure platform at x2944–3040/y144 is the recommended launch. Jump and double-jump, then hold flight upward. Entry is concealed in a cloud bank around x2920–3072 at y-300, after most fuel has been spent. Actual keyboard flight was verified. Lower, off-route and partially charged launches do not qualify. The harbor's camera follows the hidden ascent rather than clipping it at y0.

## Alternate routes and falling
Cloud falls do not damage the player or reset to the arrival checkpoint. Crossing the lower cloud boundary drops the player back into the harbor. Cloud horizontal position maps to a farther harbor position, adjusted onto a supported landing span clear of closed doors. The player descends with short protection, retains health and keeps collected progress. Because these are separate scene coordinates, the drop currently changes scene rather than animating an uninterrupted world-scale fall.

Reaching the far end of the clouds descends at harbor x4496, beyond Customs. Completing that route counts as bypassing Customs from above; it opens that gate without pretending its two controls were operated. The normal Customs puzzle remains an alternative. Flagship winch and rigging are still required to finish the level. The arrival pad optionally returns to the high crane platform with E.

Harbor puzzles, enemies, treasures, coins and checkpoint state are frozen/preserved while visiting. Cloud rewards persist on revisits during the run. A collected Sky Chart appears as a pink star in the harbor HUD. Restart resets the run and its discoveries.

## Implementation and artwork
src/cloud-level.mjs owns the separate course layout, hidden-entry rules, snapshots, route completion and harbor drops. src/cloud-art.mjs renders the upper sky, distant laboratories, cloud terrain and reward/pad. Existing age, outfit, running and partial-fuel mechanics are reused. The laboratory is deliberately distant scenery; collision follows the foreground cloud islands.

Built-in image generation (not CLI fallback) produced the transparent scenery sheet. Saved source: assets/cloud-discovery-v1/source.png. Runtime exports: assets/cloud-discovery-v1/laboratory.png and cloud-island.png. Exporter: scripts/pack-cloud-art.mjs. Exact prompt: docs/cloud-discovery-v1-prompt.txt. Screenshots: docs/screenshots/cloud-discovery-v1/.

## Validation and next phase
63 tests pass, including all-age real flight ascent, rejected incomplete launches, no-damage harbor drops, saved progress and Customs bypass with flagship requirements intact. Syntax checks pass. scripts/cloud-browser.mjs verifies discovery using keyboard controls, cloud views, harbor drop and upper-route exit. Existing full-level progression passes. All 47 runtime textures load successfully.

Next: extend the route with Nimbus Gardens, fading clouds/updrafts, drones and a research-ring puzzle. Keep ground and cloud paths useful alternatives; do not force backtracking through a bypassed lower-route gate. First playtest focus: secret clue subtlety, launch timing margin, drop landing safety, and upper-route reward balance.


## Mandatory gate policy update
Closed gates now project visible full-height lock fields. No flight, double jump, charged movement, cloud fall or cloud-route completion can bypass an unsolved gate. Cloud-route landings are constrained to supported ground before the first locked gate. The earlier automatic Customs bypass described above is superseded: both Customs controls must be completed, as must the flagship controls. skyRouteComplete records exploration only and never unlocks a gate.
