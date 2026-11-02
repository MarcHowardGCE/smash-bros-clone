# Level 1 proposal: Harbor Breakout

Status: design proposal, not an approved implementation scope.
The existing short harbor course becomes a separate, replayable tutorial.
This document plans the next full level; it does not change the running POC.

## Experience goal
Escape from the harbor through a series of increasingly interesting spaces, using familiar controls in new combinations.
Aim for 8-12 minutes on a first successful main-route attempt and 12-18 minutes when exploring secrets. These are playtest targets, not measured completion times.
A roughly 6,400-world-pixel main route (about 17 viewport widths), with compact optional rooms and vertical sections, is a starting budget. Tune length after blockout.
Exploration, reading encounters and solving short mechanisms should provide the time, rather than long empty walks or mandatory recharge waits.
Working title: Harbor Breakout. Setting remains an original harbor inspired by the project's artwork rather than a named canon location.

## Mechanics already established: preserve
- Adult -> teenage -> baby -> death; 3/2/1 hits respectively.
- Same movement, actions, collision dimensions and ability effects at every age.
- One equipped power. A different pickup replaces it and equips at full charge immediately.
- Egghead activates on the second jump press. Hold Space to rise; release for gravity.
- Five seconds of lift fuel at full charge, drained only while providing lift in the air.
- Landing ends the flight session and starts its five-second recharge.
- If fuel empties in the air, no more lift; recharge waits for landing.
- Either power can activate with any nonzero recovered charge; duration scales with charge.
- Captain is a forward cannonball. Current full-charge tuning is 0.55 seconds at 360 world pixels/second: approximately 198 pixels on unobstructed ground.
- Cannonball speed and damage do not vary with charge; duration and travel distance do.
- A full flight budget can cover about 525 horizontal pixels at current running speed, plus travel during descent. Account for this when placing roofs, routes and secrets.
- New pickups, rather than age changes, control abilities. No baby-only gaps or adult-only strength checks.
- Current brief damage grace period remains the basis of hazard fairness.

New enemy behaviors, hazards, recovery rules and puzzles below are proposals.

## Route and pacing

| Area | Approximate span | Main experience | Encounter / mechanism | Optional reward |
|---|---:|---|---|---|
| 1. Market Quay | x 0-900 | Comfortable start, clear destination, first branch | Patrols, short jumps, first safe ranged enemy | A visible high coin trail hints at the roof route |
| 2. Warehouse Row | x 900-2100 | Choose safe interior or riskier rooftops | Marked breakable boards and a short cargo-door puzzle | Captain's Keepsake 1 behind a suspicious wall |
| 3. Crane Basin | x 2100-3300 | Vertical platforming with timed cargo lifts | Moving platforms, swinging hooks, ranged lookout | Keepsake 2 on a high crane jib |
| 4. Customs Gate | x 3300-4500 | Read enemy defenses, combine movement and powers | Shield guard, gull, two latched gate mechanisms | Optional supply alcove / recovery food |
| 5. Shipyard Approach | x 4500-5400 | Faster sequence of known challenges | Telegraphing falling cargo and mixed patrols | A concealed cabin entrance and coin cache |
| 6. Flagship Deck | x 5400-6400 | Short finale, then breathing room and victory | Secure two ship mechanisms to lower the boarding route | Keepsake 3 in the captain's cabin |

Route diagram:
Tutorial (separate) -> Market Quay -> Warehouse Row [checkpoint A] ->
Crane Basin [checkpoint B] -> Customs Gate -> Shipyard [checkpoint C] ->
Flagship Deck -> exit / results.

Optional paths reconnect to the main route. Do not create a second full parallel level.

### 1. Market Quay
Establish the exit ship in the distance. Give the player room to remember movement.
A Captain pickup precedes breakable cargo. An Egghead pickup later offers the first roof shortcut.
Place the ranged guard on safe footing with a clear view of its windup, before introducing a gap nearby.
End with a fork: the lower warehouse entrance is forgiving; the roof offers coins and an early glimpse of a keepsake.

### 2. Warehouse Row
Low ceilings and stacks create a different rhythm from the open quay.
Captain breaks clearly marked boards; ordinary decorative walls remain intact.
A floor mechanism opens a cargo shutter and stays latched, avoiding repeated recharge waits.
The hidden room is hinted by a cracked wall seam, a coin partially visible through slats, and a different wall pattern.
Checkpoint A sits after the puzzle, before the crane challenge.

### 3. Crane Basin
Introduce one moving platform over safe flooring first. Then place the same kind above water.
Use stable staging ledges between timed sections. Landing and recharge become intentional rhythm, not punishment.
Egghead helps reach the upper route but cannot bypass an entire district: use roof undersides, staggered platforms and scene boundaries.
A short optional crane-jib branch rewards controlled lift, a narrow landing and a well-timed second ascent.
Checkpoint B follows the hardest movement section.

### 4. Customs Gate
A shield guard first appears alone on broad ground, with room to retreat and observe.
Then combine it with a gull whose dive creates a predictable opening rather than constant pursuit.
The main gate has two independent, persistent latches: Captain breaks a marked lock, Egghead reaches an upper lever.
Show the two connections physically with a chain and a colored cable / clear icon.
Place both outfit dispensers in a safe hub. The player can recover from choosing the wrong outfit.
Opening one latch stays completed if the player switches outfits, takes damage, or returns to the nearby checkpoint.

### 5. Shipyard Approach
A brisk, mostly horizontal stretch reuses learned mechanics in short combinations.
One cargo-drop lane, then a recovery space; one enemy encounter, then platforming.
Do not introduce a new enemy family here.
Coins guide the safe path while a small visual clue points toward the hidden ship cabin route.
Checkpoint C precedes the final set piece.

### 6. Flagship Deck
A machinery set piece rather than a new boss system.
Captain breaks a protected winch lock; Egghead reaches a high rigging switch. Both latch permanently for the attempt.
A few familiar enemies defend the approaches, with safe outfit access.
Once both are done, the boarding bridge lowers and the final flag becomes reachable.
No unseen threat after the final action. Give the player a short victory walk.
Results show time, coins and three keepsakes; secrets are never required to finish.

## Enemy roster: four types total

| Enemy | Role and readable behavior | Counterplay | First appearance |
|---|---|---|---|
| Dock Patrol | Existing patrol; visible turn points; 3 HP baseline | Stomp or cannonball; route around it | Market |
| Lookout | Stationary ranged guard; clear raise-aim-fire-recover cycle | Jump the shot, approach during recovery, cannonball | Market, safely |
| Shield Guard | Slow front-facing defender; shield visibly covers its front; brief exposed recovery | Bait attack, jump behind, stomp above, or charge exposed rear | Customs |
| Swoop Gull | Perches, signals its line, dives once along a committed path, then returns | Move off the line; jump or attack during recovery | Crane/Customs transition |

Fairness contracts:
- Introduce each type alone, then combine types already understood.
- Ranged enemies do not fire immediately from offscreen. Require visibility and a visible windup.
- Projectiles are limited and expire; no endless carpet of shots.
- Gull dives do not home continuously on the player.
- Shield blocking is directional, clearly signaled and taught with space to experiment. It must not feel like arbitrary immunity to cannonball.
- No enemy spawn directly on top of the player or checkpoint.
- Avoid stacking a projectile, a gull dive and a lethal jump in the same narrow space.
- Every attack needs an anticipation pose, active behavior and recovery.
- Tune per-type HP after the first graybox encounter; existing 3-HP patrol tuning is not automatically right for every new type.

Enemy ideas deferred: explosive specialist, turret, crab, full boss and additional ranged variants. Four well-taught types are enough for this level.

## Hazards and moving geometry

1. Water / falls: retain the established one-stage loss and return to a safe recovery point. Baby falls cause death.
2. Cargo lifts: fixed predictable paths, short endpoints pauses, and stable ledges. Player rides them without jitter or being silently pushed through terrain.
3. Swinging hooks: visibly sweep a fixed arc; contact costs one hit, with existing grace time. Introduce over safe ground first.
4. Falling cargo: a visible hanging crate/shadow and warning before it drops, then a clear reset interval.
5. Marked breakable boards: visually distinct from solid scenery; Captain can break them.

Use these repeatedly with different spacing, not five unrelated one-off systems.
Avoid instant-kill crushing in this first full level. For trapped moving geometry, choose a documented safe behavior: stop/reverse the mover or move the player to the last safe ledge with one hit, never repeatedly apply damage.
Decorative ropes, lanterns and barrels must be distinguishable from collision objects.
No health sacrifice is required to obtain a secret.

## Three signature secrets

### Keepsake 1: Smuggler's Stash
Clue: cracked wall with a sliver of gold visible behind it.
Action: line up Captain on a marked straight approach and cannonball through boards into a concealed room.
A side cache sits roughly 150 pixels along the lane. At current tuning this rewards about 76% charge or more; demonstrate distance with floor markings rather than an invisible percentage gate.
Missing it lands the player safely on a lower return route. The main route does not require full charge.
Reward: first unique keepsake and a small coin cache.

### Keepsake 2: The Crane's Nest
Clue: visible glint high above the main route, with a coin arc that stops at a ledge.
Action: feather Space to control lift, land on a narrow stable ledge, use a partially recovered charge for a second short ascent, and avoid the taught hook rhythm.
Design the recovery ledge with a safe view and something to collect; do not demand a long idle wait.
The route requires skill and observation, never a smaller baby's collision box.
Reward: second unique keepsake and a panoramic view.

### Keepsake 3: Captain's Cabin
Clue: a bell connection runs from an upper switch toward a lower hatch.
Action: use Egghead to trigger the bell switch, then swap to Captain at the safe dispenser and break the newly exposed hatch seal.
The switch latches; no hidden timer or need to carry two powers.
The cabin branch returns close to its entry. Failed attempts should not replay the whole finale.
Reward: third unique keepsake, bonus coins and a distinct results-screen stamp.

Supporting secrets: optional coin alcoves, a behind-the-sail passage and one hidden recovery snack. Do not add more unique collectible classes yet.

## Collectibles and recovery (proposed)
- Three unique keepsakes, tracked separately from coins.
- Approximately 100-140 ordinary coins, tuned after route construction.
- Two or three food pickups restoring one age stage, capped at adult. They do not change outfit or power charge.
- Secrets add completion credit and visual celebration, not mandatory upgrades.
- Main exit works with zero keepsakes.
- Health stage never locks access to a puzzle or treasure.
- Visual secret cues should be readable without audio; audio is supporting feedback.
- Collectibles and latched puzzle progress persist through death for the current run. No permanent browser save in this milestone.

## Checkpoints / failure (proposed changes from current POC)
Place three checkpoints after meaningful accomplishments, not just distance.
A fall with remaining health returns to the last safe recovery anchor and costs one stage, preserving the existing behavior.
A death restarts at the latest full checkpoint as adult, keeping collected keepsakes, coins already removed, and completed latches for this run. Before the first checkpoint, return to level entry.
Restore the checkpoint's documented power-up state at full charge; also provide safe access to required outfits nearby.
Reset transient enemy positions, projectiles and moving hazards in the local room. Do not respawn an enemy into the player.
Restart Level explicitly resets the entire run and all collectibles.
These recovery/food/progress rules require confirmation or review before implementation; they are not current game behavior.

## Required foundation before constructing the whole level
1. Data-driven level definition
   Separate layout, collision, spawn points, decorative placement, camera zones, puzzle links and collectible IDs from game logic.
   Start with a documented JSON format; a visual map editor can be added if it helps authoring.
   Preserve a standalone tutorial entry and a full-level entry.

2. Room-aware world and camera
   Current engine assumes a 216-high world and a y=40 hard ceiling. That cannot support a real crane-jib route.
   Add room/world bounds, vertical camera zones and independent HUD positioning.
   Define floor voids by room, not the screen height.
   Keep safe visual margins, smooth predictable transitions and bounded camera motion.
   Do not change sprite scale to solve camera framing.

3. Moving-platform and hazard collision
   Stable carry motion, explicit contact damage, shared invulnerability and safe recovery anchors.
   Separate decorative art from solid / one-way / damaging / breakable surfaces.

4. Encounter behavior
   Readable enemy state machines; projectile lifetime and collision; gull dive path; directional shields.
   Stop attacks when the scene is paused or the enemy has not been introduced on camera.

5. Puzzle and collectible state
   Stable IDs, latched switches, visible links, current-run persistence, and checkpoint snapshots.
   Required pickups/dispensers remain recoverable; no puzzle can become unsolvable after a death or swap.

6. Movement feel
   Add a small jump buffer and coyote-time window as tuning proposals.
   Confirm these do not allow accidental repeated flight activation or change movement between ages.
   Keep partial-charge flight and landing recharge consistent on moving platforms.

## Art / sound production budget
Reuse current harbor palette, player sprites, water, props and patrol art.
Expand only what the full level needs:
- Environment: warehouse interior, rooftop pieces, crane/rigging silhouettes and ship-deck/cabin accents.
- Terrain: roughly 16-24 additional edge/corner/roof/one-way/marked-breakable variants.
- Hazards: cargo lift, hook, drop warning/shadow, falling crate.
- Enemies: 3 new families, each with walk/idle as needed, anticipation, active attack, recovery, hurt and defeat cues. Target 8-12 useful frames per family, adjusted for gull motion.
- Existing patrol: add hit/defeat feedback rather than a new attack.
- Puzzle props: switch, linked cable/chain, winch lock, shutter/bridge and clear completed states.
- Collectibles: 3 keepsake icons, recovery snack, pickup celebrations.
- Audio: telegraphs, gull cue, hook/cargo movement, latch feedback, secret discovery, checkpoint and final bridge.
- Music: optional in this milestone; do not hold gameplay testing for a custom score.

## Build order and review gates

### Pass 1: route blockout
Build the data format, vertical camera support and six-area graybox route using existing art.
Gate: start-to-finish traversal at all three ages, stable camera and safe checkpoints; no invisible walls or unrecoverable required pickups.
Do not generate all final art before testing the route.

### Pass 2: enemies
Finish Lookout, Shield Guard and Swoop Gull; introduce each in a test room before placing mixed encounters.
Gate: telegraphs are readable and counters work at every age.

### Pass 3: hazards and traversal
Implement lifts, hooks, falling cargo and marked breakables.
Gate: moving platforms carry reliably; landing starts flight recharge once; damage grace prevents repeated hits.

### Pass 4: puzzles, treasures and recovery
Add the three keepsakes, latched gate/finale mechanisms, local progress persistence and results.
Gate: each secret is obtainable without damage, failures have a return path, and death/swap cannot soft-lock progress.

### Pass 5: environment and effects
Replace blockout art area by area. Keep collision silhouettes matched to visual edges.
Gate: player, enemies, hazards, switches and required pickups remain readable against the background.

### Pass 6: playtest and tune
Test blind navigation, difficulty rhythm, hint clarity and average times.
Gate: main route is satisfying without secrets; optional routes are harder; repeated attempts improve understanding rather than require waiting.

## Acceptance checks
- Tutorial remains separately playable.
- Full level has a start, three checkpoints, finale and results.
- Four enemy types are introduced before mixed encounters.
- Every main-path puzzle remains solvable after deaths and power swaps.
- All ages share movement reachability and can earn all three keepsakes.
- Partial charge works in the full level; neither puzzle timers nor HUD silently require 100%.
- Flight fuel depletes only during lift; every actual landing, including on movers, ends the session and starts recharge once.
- New power-up acquisition equips at full charge immediately.
- No attack from an unannounced offscreen enemy.
- No mandatory damage, blind jump, unseen hazard or permanent one-way miss for a keepsake.
- Collected treasure and completed latches survive checkpoint death within the run.
- Restart Level reliably resets the run.
- Pause freezes enemy attacks, hazards, projectiles, puzzles and ability timers.
- Test target: smooth 60 fps on the user's desktop browser, with profiling if the art/encounters cause drops.
- Unit checks cover state/collision contracts; browser checks cover checkpoint recovery and puzzle flows; manual playtests assess enjoyment and clue quality.

## Decisions to settle at blockout review
The title, area sequence, four-enemy roster and three keepsakes can be treated as the recommended design direction.
Before recovery implementation, review: checkpoint death restoring adult, one-stage food healing, and current-run treasure/latch persistence.
Before encounter art, review shield counterplay and the gull silhouette.
Before final length commitment, play the graybox route and adjust the 8-12 minute target.
No public deployment, multiplayer, full boss system, third power or new age-specific mechanics are included.
