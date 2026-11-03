# Harbor Breakout: visual audit and production-polish proposal
Date: November 2, 2026
Status: audit and proposal only. No gameplay or rendering changes were made in this task.

## Verdict
The project has attractive individual assets and a functioning level. Its composition still reads as a prototype assembled from assets rather than a deliberately art-directed platformer.

The central issue is not missing texture or insufficient object count. It is a crowded interaction layer combined with weak environmental identity:
- Highly detailed distant scenery competes with large gold coins, props, enemies and the player.
- One repeated harbor panorama carries nearly all six districts.
- Local architecture is too sparse to make a warehouse, customs building or ship feel like a place.
- Earlier attempts to add structure used generic posts, large panels and overlays. Removing those fixed obstruction but left little coherent midground architecture.

The next pass should create meaningful depth and district identity while removing incidental foreground noise.

## Audit scope and evidence
Reviewed current render/layout code, the six-district captures, and 27 newly captured views: ground samples approximately every 300 world pixels plus six elevated puzzle/secret views.
Evidence: docs/visual-audit-2026-11-02/route-contact-sheet.png and individually numbered images in that folder.
capture-index.json maps each image to its world position.
Capture script: scripts/capture-visual-audit.mjs.
These are paused static inspection views, not a blind playtest or a complete animation/timing audit. Existing passing gameplay tests do not establish production visual quality.

Measured level contents:
- 6,400 world pixels, approximately 16.7 viewport widths.
- 147 coins.
- 16 enemies.
- 16 power-up pickups.
- 39 platform/floor records, including three added gull perches.
- Main-route coins are procedurally spaced every 48 pixels where floor exists; one extra coin is placed above each raised platform.
- Barrels/rope/lantern groups repeat at regular spacing on each ground segment.

| District | Approx. screens | Coins | Enemies | Power pickups |
|---|---:|---:|---:|---:|
| Market Quay | 2.5 | 19 | 2 | 2 |
| Warehouse Row | 3.2 | 29 | 3 | 2 |
| Crane Basin | 2.9 | 27 | 2 | 2 |
| Customs Gate | 3.9 | 36 | 4 | 5 |
| Shipyard Approach | 1.3 | 13 | 2 | 0 |
| Flagship Deck | 2.9 | 23 | 3 | 5 |

Counts describe the current implementation. Suggested budgets below are starting points for visual testing, not universal rules.

## Findings and priorities

### P0: gameplay silhouettes compete with scenery
Evidence: ground-700, ground-1300, ground-3700, ground-5500 and the elevated rigging view.
Distant roofs, sails, bright water reflections and clouds carry strong edges and contrast directly behind enemies and pickups. The background is detailed, but it is not sufficiently subordinate.

Change:
- Create a quieter far layer with broader value shapes and less high-frequency contrast.
- Add authored local midground architecture specific to each area.
- Keep the highest contrast and strongest outlines on the player, danger and required interaction.
- Use asset-specific palette treatment, not another rectangular tint drawn over a district.
- Give important actor silhouettes a locally quiet background. Do not simply darken the entire game.

Acceptance: the player, next safe surface and immediate threat are the first three readable elements in a normal screenshot.

### P0: routine rewards are too visually large
Coin art is drawn about 16 world pixels tall. Adult player art is about 30, teenage about 25 and baby about 18.
A coin is therefore over half the adult's height and nearly the baby's height. Gold circles often compete with enemy faces. The unique treasure is not clearly more important than the ordinary coins.

Change:
- Prototype ordinary coins at 8-10 world pixels.
- Replace the uniform 48-pixel coin distribution with deliberate short arcs, clusters and occasional quiet stretches.
- Start with roughly 80-100 coins, then playtest; do not treat this as a mandatory numeric target.
- Keep rare treasure and required pickups more prominent than common currency.
- Preserve collectible collision generosity when shrinking the artwork.

Acceptance: a normal gameplay view usually contains one short reward pattern, not a continuous chain of large gold discs.

### P0: enemy and pickup placement is mechanically valid but compositionally weak
Recent fixes grounded the enemies. That is necessary but does not prevent coins and props from overlapping their visual silhouettes.
Pickup labels, coins, warning marks and health pips can all occupy the same small region.

Change:
- Reserve a visual lane around enemy patrol ranges and anticipation poses.
- Do not place routine coins over heads, shields, muzzle flashes or warning marks.
- Treat encounter placement as a composed screen: approach, warning, action, recovery and reward.
- Keep all four enemy types. Sixteen enemies over this route is not inherently excessive; the surrounding noise is the larger problem.
- Replace scattered power-up clusters with recognizable outfit supply stations.
- Keep required powers safely recoverable; reducing visual clutter must not create puzzle soft locks.

Acceptance: an enemy's type and current anticipation cue remain readable at native gameplay scale.

### P1: districts lack distinct local architecture
Current district titles promise more environmental change than the visuals deliver.
The skyline is attractive, but it cannot substitute for warehouse facades, crane infrastructure, a customs entrance or a recognizable ship.

Change:
- Each district gets one strong landmark and a small family of supporting structures.
- Use three spatial roles: far scenery, local midground, gameplay terrain. Add foreground framing sparingly.
- Keep texture density controlled; adding tiny background props everywhere would make the hierarchy worse.

Acceptance: with the district label hidden, a viewer can distinguish market, warehouse, crane basin and flagship.

### P1: platforms resemble repeated strips floating over a panorama
Short brackets removed the worst long-post clutter, but the repeated rectangular platforms remain visually generic.

Change:
Define three or four deliberate platform families:
- Stone quay ledges with readable caps and occasional broken corners.
- Warehouse catwalks attached to actual walls or roof supports.
- Cargo platforms with visible suspension and pulleys.
- Ship rigging/deck pieces attached to recognizable masts or hull structure.

Not every platform needs a post to the bottom of the screen. Supports should explain a local structure rather than form a repeated background grid.

Acceptance: every platform family has a consistent collision edge and material identity.

### P1: gates are visually implausible
The full-height, narrow, repeated gate panels read as vertical barcodes across the scene.
They satisfy the collision requirement but do not read as an entrance, portcullis or boarding barrier.

Change:
- Build a bounded architectural gate with posts, a lintel and a believable aperture.
- Integrate the physical blocker into a building/roof silhouette so flight cannot bypass it through an invisible ceiling.
- Show the connection from each mechanism to the gate through cables, chains or matching symbols.
- Open/retract the barrier visibly and celebrate completion.

This requires coordinating art and collision layout; swapping a gate picture alone is insufficient.

Acceptance: the player understands what blocks the route and what changed when the mechanisms are secured.

### P1: the camera spends too much screen area on ground and HUD
The HUD occupies 38 of 216 logical pixels, about 18%.
At typical grounded framing, the floor top is near screen y=144, leaving a large solid wall below it.
The footer takes another 10 pixels. The result crowds action into a comparatively shallow band.

Change:
- Prototype a compact 26-30 pixel HUD.
- Move persistent tutorial/control text into contextual prompts or the existing outside-canvas guide.
- Frame grounded play with the floor around y=172-180 instead of y=144.
- Keep a different vertical look-ahead for climbing/flight so landings and hazards remain visible.
- Avoid solving this simply by zooming out; that would make baby Bonney and enemy cues smaller.

Acceptance: useful play space increases without shrinking sprites or hiding the next landing.

### P1: automatic decoration creates repetition, not atmosphere
The same barrel, coil and lantern group repeats along ground segments.
That produces a decorative fence at player height, while upper and middle background structure remains empty.

Change:
- Remove roughly half the repeated prop groups as an initial editorial pass.
- Hand-author a few clusters with a purpose: a market stall, cargo unloading area, guard post or ship supply station.
- Alternate quiet views and rich focal views.
- Keep decorative objects out of landing silhouettes and encounter cue space.
- Distinguish non-colliding rear props from solid/breakable cargo with depth and palette treatment.

Acceptance: no two adjacent screens repeat the same prop trio without a deliberate environmental reason.

### P2: animation, lighting and material language need a shared standard
Assets have varying pixel density, outline strength and pose consistency.
A static prop can be more finely shaded than the player while a mechanism is represented by simple geometric highlights.
Movement cycles and attack/recovery transitions still have few frames.

Change:
- Create a visual style guide for source pixel scale, outline color, palette, lighting direction, shadow softness and object proportions.
- Add clear anticipation, impact and recovery poses before adding ornamental frames.
- Make collision/hurt feedback consistent across enemy families.
- Use restrained local contact shading and consistent feet/bottom anchors.
- Avoid ground shadows under objects floating in the air or backgrounds that resemble solid terrain.

Acceptance: the assets appear to belong to one game at normal gameplay size, not only when enlarged individually.

## District-specific redesign

| District | Remove / reduce | Add with purpose | Landmark / mood |
|---|---|---|---|
| Market Quay | Continuous coin line and repeated prop trios | One market frontage, cloth awnings behind the route, quiet open quay between encounters | Warm busy departure point with a clear exit view |
| Warehouse Row | Generic open platforms over the same town view | Actual warehouse wall/facade, doorways, roofline, attached catwalks; local interior only where warranted | Dark timber/brick shape with bright openings |
| Crane Basin | Isolated poles and disconnected-looking ledges | One coherent crane assembly, gantry/cable network, cargo stacks in midground, grounded bases | Tall industrial silhouette and open sky around movement |
| Customs Gate | Full-height narrow panel stack and labels floating near it | An arched checkpoint building, believable gate aperture and two linked mechanisms | Fortified entrance, distinct cool stone / navy accents |
| Shipyard Approach | Routine coin/prop repetition | Hull ribs, slipway silhouette and cargo loading structure, separated hazard lanes | A low ship hull establishing the approach |
| Flagship Deck | Flat strip geometry and scattered outfit pickups | Deck edge, a bounded mast/rigging arrangement, cabin facade, readable boarding route | Recognizable ship destination and warmer materials |

Background art should explain these spaces without becoming extra collision clutter.

## Comparisons with established platformers
The following are art-direction reference points, not copied layouts or claims that our project should match their budget.

### Donkey Kong Country: Tropical Freeze
Use as a reference for grounded environment construction and strong local scene identity: docks, machinery and environmental movement should feel connected to the level.
For this project: coherent crane/hull/warehouse assemblies, local landmarks, action framed by scenery.
Do not imitate its complexity by adding decorative objects everywhere.
Reference: Nintendo official game gallery:
https://www.nintendo.com/us/store/products/donkey-kong-country-tropical-freeze-us/

### Rayman Legends
Use as a reference for separating beautifully detailed scenery from readable actors through broad composition and value hierarchy.
For this project: quieter distant value masses, layered local silhouettes, and deliberate negative space around movement.
Do not copy its painterly rendering into our pixel-art pipeline.
Reference: Ubisoft official game page/gallery:
https://www.ubisoft.com/en-us/games/rayman-legends

### Shovel Knight
Use as a reference for clear visual categories and economical reward/hazard communication.
For this project: a coin must read as a small routine reward; a switch, dangerous enemy and rare treasure should each have a distinct visual role.
Do not switch this project to its 8-bit aesthetic.
Reference: Yacht Club Games official page:
https://www.yachtclubgames.com/games/shovel-knight-treasure-trove/

Comparative recommendations are my visual-design judgments. Official pages establish the reference games and their presentation, not a scientific proof of these design prescriptions.
Direct CDN image retrieval for some Nintendo/Ubisoft gallery files failed; no inaccessible screenshot is represented as a captured side-by-side comparison.

## Proposed production style guide
- Keep the current pink-haired player identity and two outfit palettes.
- Highest visual priority: player; next: immediate threats/landing edges; next: required mechanisms; then rewards; then decoration.
- Restrict gold sparkle to rewards and meaningful activation, rather than every nearby object.
- Far layer: broad shapes and restrained detail.
- Midground: district architecture with a small number of strong silhouettes.
- Gameplay layer: consistent outlines, materials and collision-edge treatment.
- Foreground: occasional edge framing, never persistent coverage over the player.
- Author object placements. Procedural placement is a first draft, not final composition.
- Plan each screen's main point before filling it with art.
- Keep the mechanics/age reachability contract intact through art and camera changes.

## Recommended build order
1. Editorial cleanup: coin scale/patterns, prop reduction, cue overlap fixes, compact HUD and grounded camera prototype.
2. Produce one finished Market Quay slice, approximately 2-3 screens, as the quality bar.
3. Review that slice at native gameplay size, in motion, at all ages and both outfits.
4. Create local architecture kits for warehouse, cranes, customs and ship areas.
5. Recompose encounters and secrets around those structures.
6. Add animation/feedback polish and check performance.
7. Blind playtest and full-route visual QA before calling the level production-ready.

Do not generate six new backgrounds before the first composed slice is approved.

## Production-readiness gates
- Player, next safe landing and immediate threat readable within a quick glance.
- District recognizable with label hidden.
- No routine coin/prop overlap with enemy attack cues.
- No decorative shape mistaken for a solid platform or wall.
- No broad overlay rectangles, repeating structural grids or unexplained floating architecture.
- Main route retains safe outfit access; all ages can finish and collect every treasure.
- Required interactions communicate locked, available and completed states.
- HUD does not dominate the play area.
- Paused screenshot, grayscale inspection and in-motion review all support the same hierarchy.
- Background transitions and vertical camera framing checked at boundaries and high routes.
- Smooth frame delivery assessed on the user's browser, not inferred from unit tests.
- Human playtests assess clarity, difficulty and completion time.
- Existing automated checks remain necessary but are not sufficient visual acceptance criteria.

## Decision
The strongest next step is a deliberately composed Market Quay vertical slice, starting with less foreground noise and stronger background architecture. More disconnected decorative assets would move the game in the wrong direction.
