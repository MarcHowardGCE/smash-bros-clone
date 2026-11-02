# Harbor Breakout - first full-level implementation

## Delivered
Separate tutorial and full-level selection, defaulting to Harbor Breakout.
6,400x480 world with six named districts, rooftop/vertical branches and bounded horizontal/vertical camera motion.
A current objective strip and enemy field guide support the new puzzles and counters.
All code/assets/docs remain within the bonney folder.

## Encounters
Four enemy types: existing patrol; visibly aiming Lookout; directional Shield Guard with windup/lunge/recovery; committed-path Swoop Gull.
Lookouts require actual camera visibility before firing; projectiles expire and collide with solid terrain.
New reference-guided lookout, shield and gull artwork uses four poses per family.
Original sources: assets/level-v1/enemies-source.png; exported atlas: assets/level-v1/enemies-atlas.png.
Built-in image generation was used; exact prompt: docs/full-enemy-prompts.txt.
Packer: scripts/pack-level-enemies.mjs.

## Traversal and hazards
One-way raised platforms, two moving cargo lifts, two swinging hooks and two falling-cargo lanes with warnings.
Shared damage grace prevents rapid repeat hits.
Moving platforms carry grounded players and landing starts Egghead recharge once.
Short coyote time and jump buffering are enabled in the full course.
Terrain, age movement, flight fuel, partial charge and immediate pickup readiness remain compatible with the established rules.

## Progression
Customs gate: Captain lock plus upper Egghead lever, operated with E.
Flagship gate: Captain winch lock plus Egghead rigging switch.
Optional bell unlocks the cabin seal before Captain can break it.
Three treasures: Smuggler's Stash, Crane's Nest and Captain's Cabin.
Three checkpoints and three single-stage food pickups.
Progress is latched for the current run; no persistent browser save.
On full-level defeat, the player can retry at the latest checkpoint as adult with its documented power.
Treasure/coin/food state and secured latches persist; enemies reset and projectiles clear.
Whole-level restart clears everything.

## Visuals
Reuses the refined world and player art, with district-specific warehouse/cranework/ship layers, new enemy poses, treasure/switch/gate/hazard cues, and existing effects.
This is a first integrated art pass. Several mechanisms and hazards use the existing procedural pixel rendering system rather than newly painted standalone images.
District montage: docs/screenshots/full-level/districts.png.
Individual district and victory captures are in the same folder.

## Validation
33 unit/integration tests passed.
- Existing power, age, animation and tutorial contracts.
- Full-level data coverage / separate tutorial.
- Enemy telegraph and offscreen firing.
- Stable moving-platform carry and flight recharge.
- Switch/power requirements and gate latches.
- Marked cargo / cabin prerequisites.
- Checkpoint retry with retained treasures/latches.
- Shield front/rear counterplay and gull fixed target.
- Food / finish conditions.
- Terrain-only full traversal at all ages.
- Physical flight paths to the crane keepsake and customs lever at all ages.
- Jump buffer and coyote timing.

Both tutorial and full-level browser verification passed.
Full-level browser setup uses test-only positioning between scenes, then actual keyboard activation/interaction and game simulation to check locks, gate crossing, retry/persistence, rigging/bell/cabin and victory.
This is not an unassisted full-combat playthrough.
Syntax checks passed for all runtime modules.
Final district screenshots were inspected.

## Scope differences / further tuning
The proposed JSON authoring format is represented for now by declarative level data in src/level-data.mjs; no external editor is required.
The finale is a mechanism set piece, not a boss.
Enemy attack/death animation polish, additional environment variants, timed-charge stash floor markings, custom music, and measured completion-time tuning remain optional polish.
The implementation supports all three secrets and the full main route. Manual difficulty/fun/clue review is the next step; the design's 8-12 minute target has not been measured.
