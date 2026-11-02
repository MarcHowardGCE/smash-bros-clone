# Ability and HUD studies v1

Completed: static flight/cannonball storyboards, cannonball/trail/exhaust/impact pixel studies, and harbor ready/active/cooldown screens.
Location: assets/ability-studies-v1/
Generator: scripts/generate-ability-studies.ps1 (Windows PowerShell + System.Drawing).
Inputs: character-lineup-v1 sprites and pixel-v1 tile strip.
The user approved the six idle designs before this milestone.

## Confirmed timing represented
Egghead: double jump -> 5 seconds of flight -> 5 seconds of cooldown -> ready.
Captain: cannonball charge -> 5 seconds of cooldown -> ready.
Single equipped power-up; a pickup replaces the current one.
All ages can use both abilities. Age tracks remaining hits; no age-specific normal movement differences.

## HUD design
Left: age name and three possible health hearts; example screens use adult / 3 hits.
Middle: equipped power-up name.
Right: ready, remaining active time, or remaining cooldown plus a bar.
Purple bar is remaining active flight, shrinking with time.
Gold bar is recharge progress, filling over 5 seconds.
Text identifies state alongside color.
Example snapshots: flight 3.2 seconds remaining; cooldown 2.5 seconds remaining.
Native screen 384x216; 4x previews use nearest-neighbor scaling.

## Scope and open decisions
These are static visual studies, not working controls or animated gameplay.
Captain X input is a proposal, not a confirmed binding.
Captain duration, speed, damage amount, wall interaction, and vulnerability remain tuning decisions.
Storyboards use idle-derived poses; final flight and charge transition animation still needs work.
Pickup replacement during an active ability/cooldown, healing, and death/checkpoint persistence remain open.

## Validation
Visually inspected storyboard and harbor comparison/large preview.
Export dimension checks cover all three 384x216 screens and 1536x864 previews.
Effects use transparent integer-pixel assets.
No game implementation changed.

## Next milestone
Build a playable single-screen movement/ability test, then refine animations while testing.
Use the same movement rules for all ages and expose cooldowns clearly.
Keep unresolved behavior as explicit prototype defaults in documentation.
