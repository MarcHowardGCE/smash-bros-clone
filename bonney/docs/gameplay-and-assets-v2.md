# Bonney platformer - gameplay and asset plan v2

This document supersedes the gameplay and character-count proposals in visual-plan-v1.md and pixel-study-v1.md. Those files and the earlier art remain historical studies. Planning only; mechanics below have not been implemented.

## Confirmed rules from the user
Age stage represents remaining hits:
- Adult: 3 hits until death.
- Teenage: 2 hits until death.
- Baby: 1 hit until death.
Damage progression: adult -> teenage -> baby -> dead.
Normal movement and actions are identical across ages. No age-specific speed, jump height, damage bonus, or traversal ability.
Power-up effects work in all three age stages.
Only one power-up is equipped at a time. Picking up another replaces the equipped power-up.
The 5-second cooldown begins when the active ability ends.

Future Era Egghead Bonney:
- Double jumping activates flight.
- Flight lasts 5 seconds.
- Ability recharges for 5 seconds before reuse.

Pirate Captain Bonney:
- Ability transforms Bonney into a cannonball and charges forward.
- Deals massive damage to enemies.
- Ability recharges for 5 seconds before reuse.

## State architecture
Keep age/remaining hits separate from the equipped power-up.
- ageStage: baby | teenage | adult
- remainingHits: derived from age stage, never separately modified
- powerUp: none | egghead | pirateCaptain (confirmed single slot; pickups replace the equipped power-up)
- abilityState: ready | active | cooldown
- activeRemainingMs and cooldownRemainingMs: separate timers
- facingDirection and ordinary movement state independent of age

An ordinary damage event decreases age by one stage. It does not consume or remove the equipped power-up (proposed interpretation of independence). Baby can fly or cannonball just as adult can.

## Confirmed cooldown timing
Start the 5-second recharge when the active ability ends:
- Egghead: second jump input -> up to 5 seconds flying -> 5 seconds cooldown -> ready.
- Pirate Captain: ability input -> short cannonball charge -> 5 seconds cooldown -> ready.
Cooldown does not run during the active ability.
A second jump input while airborne activates Egghead only when ready. This is not an age-specific jump.
Flight controls, early cancellation, landing behavior, and per-airtime activation limits remain to be specified.

## Other proposed defaults, not confirmed
- Begin a new run in adult stage.
- Brief damage invulnerability prevents one contact from consuming multiple age stages.
- Keep the same collision box, movement tuning, camera target, and jump clearance across ages; center smaller art in a shared frame with feet anchored.
- Pickups change the power-up, not the age stage, and do not heal.
- Cannonball travels in facing direction, returns to the same age/outfit after its active window, and hits each enemy at most once per activation.
- Visual cannonball shape can be shared by ages. Do not change collision rules implicitly.
- HUD shows remaining hits, age portrait, equipped power-up, active duration, and recharge progress.
- Exact cannonball damage, charge length/speed, wall collision and incoming damage during abilities need gameplay tuning.
- Pit handling, healing, respawn stage, power-up persistence after death, and checkpoint behavior remain open.

## Character asset matrix
At minimum, six age/outfit combinations:
| Power-up outfit | Baby | Teenage | Adult |
|---|---|---|---|
| Future Era Egghead | required | required | required |
| Pirate Captain | required | required | required |

If a separate no-power-up outfit exists, add three more combinations: nine total.
Earlier plan of three total character forms is superseded.

Use user-supplied references as visual direction:
- assets/references/pirate-captain-age-lineup.png
- assets/references/egghead-age-lineup.png

Reference adaptations for baby/teenage sprites should use fully covering, age-appropriate adventure clothing while retaining the pink hair and outfit color cues. Treat these as user-provided art direction, not verified canon age designs.

## Sprite production proposal
Retain 16x16 terrain tiles and provisionally use common 32x32 character frames.
Different age proportions should read through height, head/body ratio and silhouette, while sharing movement timing and foot anchor. Compare 32x48 only if needed for outfit readability.
Produce the six idle silhouettes first at native scale and enlarged before animating all combinations.

Per combination, initial common animation budget:
- idle: 2
- run: 6
- jump: 2
- fall: 1
- land: 2
- hurt: 1
Total 14 common frames x 6 combinations = 84 frames.
Egghead flight: 2-4 frames x 3 ages = 6-12 frames.
Cannonball: shared 4-6 frame loop, plus activation/recovery effects.
Age step-down: shared puff/flash and age-specific resulting pose.
Power-up equip: shared effect with outfit-specific accent colors.
These are planning counts, not completed assets.

## Additional assets
- Egghead and Captain pickup icons, distinctly shaped and colored.
- Flight exhaust/trail, timer indicator, flight activation sound.
- Cannonball sprite, forward trail, impact burst, activation/impact sound.
- Ready/cooldown HUD icons and visible recharge sweep.
- Three age portraits or age silhouettes and remaining-hit indicators.
- Damage flash, age-change effect, death effect and appropriate sounds.
- Harbor terrain, props, two enemy types, checkpoints and goal remain in scope.

## Level implications
Teach normal jumping safely first. Offer each ability before its teaching obstacle.
Include safe practice space for five-second flight and a straight enemy lane for cannonball.
Provide a safe place to wait for recharge. Introduce neither ability for the first time over a lethal gap.
Test every required route at all three ages: age cannot change reachability.
Power-up stacking is excluded. Healing remains undecided.

## Next planning milestone
1. Six idle silhouette comparisons based on the supplied references.
2. Flight and cannonball visual storyboards with timing bars.
3. One harbor screen with an age/ability/cooldown HUD.
4. Equipment replacement and cooldown timing are confirmed; define pickup behavior during an active ability or cooldown before implementing those transitions.
