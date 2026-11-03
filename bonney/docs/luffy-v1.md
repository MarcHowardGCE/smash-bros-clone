# Luffy roster and sprites v1

## Character choice
The Character selector below the game offers Jewelry Bonney and Monkey D. Luffy. Changing it swaps artwork immediately, without restarting the run. Health stage, equipped power, fuel/cooldown, position, velocity, attacks, puzzles, checkpoints, coins and treasures remain unchanged. Selection persists through restart, course changes, cloud/harbor transitions and checkpoint recovery; the browser remembers the preference on reload. A reload still restarts gameplay normally.

The selector is deliberately outside the simulation state. src/locomotion.mjs exports CHARACTER_ROSTER and the pure characterSpriteKey artwork lookup; src/game.mjs selects the matching loaded atlas. No hero-specific physics, stats, attack reach, damage, collision boxes, power rules or route rules were introduced. Existing shared cannonball, flight exhaust, Gear spin and charged-punch effects remain shared.

## Luffy artwork
Four attached studies guided the four visual outfit variants:
- Default: Luffy Through the Years.png — straw hat, red vest, blue shorts, yellow sash, sandals.
- Captain: Luffy Through the Ages_ Pirate King Evolution.png — crimson Pirate King coat, gold trim/epaulettes, white fur, straw hat.
- Egghead: Luffy’s Egghead Era Evolution.png — red/gold technology coat and red tech boots, straw hat worn on the back for older ages.
- Gear: Luffy Gear 5 Across the Ages.png — cloud-curled white hair, white outfit, purple sash, sandals.

All references remain untouched in C:/Users/misac/Downloads/.

Each outfit has adult, teenage and baby rows. Each age has idle, six distinct strides, tucked jump, punch and kick: 120 generated source poses. Walk cadence, facing flips, attack timing and spin rotation are the same as Bonney. Six strides are exported at idle height (60/50/36 pixels) with anchored feet and preserved upper-body scale; lower-body spacing corrects small source pose compression. Tucked jump and attack stances retain their natural shapes. Wide frames use 96x64 cells; idle/jump use64x64 cells.

Built-in image generation was used, not CLI/API fallback. Four generated sources live in assets/luffy-v1/: default-source.png, captain-source.png, egghead-source.png and gear-source.png. captain-source-original.png preserves the first Captain sheet; a targeted generated edit removed a stray white artifact near one baby walking frame. Exact generation and cleanup prompts: docs/luffy-v1-prompts.txt.

Runtime files in assets/luffy-v1/:
- default-atlas.png, default-walk-atlas.png, default-attacks.png
- captain-atlas.png, captain-walk-atlas.png, captain-attacks.png
- egghead-atlas.png, egghead-walk-atlas.png, egghead-attacks.png
- gear-atlas.png, gear-walk-atlas.png, gear-attacks.png

Individual frames, manifest.json and lineup-preview.png are alongside the atlases. Preview columns are Default, Captain, Egghead, Gear; rows are adult, teenage, baby. Packer: scripts/pack-luffy.mjs. Existing Bonney art was preserved.

## Validation
83 tests pass, including roster lookup for every outfit/age/animation source without mutating player state. Browser validation compares complete paused game state before/after roster selection and confirms it is unchanged while rendered pixels differ. Every outfit/age/facing resolves to Luffy artwork correctly. Exported PNG measurements confirm idle/walk heights, foot anchors and six distinct stride frames for all12 outfit/age combinations. Real punch controls, cloud/harbor transitions, checkpoint recovery, course changes and persisted selection pass.

Both complete harbor and cloud progression browser scripts pass with --luffy, including mandatory gates, controls, treasures, checkpoint retry, finish flags and independent next-level exit records. All75 runtime textures load and contain visible pixels. Syntax checks pass. Screenshots: docs/screenshots/luffy-v1/. Main roster browser check: scripts/luffy-browser.mjs.
