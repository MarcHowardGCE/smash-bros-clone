# Flight animation and thrusters v1

## Visual improvements
Both Bonney and Luffy now use dedicated four-frame Egghead hover loops with boots pointing down, instead of their tucked normal-jump pose. Each character has adult, teenage and baby rows, for24 new flight poses. Normal jumps still use the existing jump pose. Hover animation continues during airborne coasting; powered exhaust appears only while jump is held with active fuel.

A six-frame-per-character thruster atlas replaces the shared static exhaust. Bonney has cyan/white cores with blue/violet tips; Luffy has cyan/white cores with gold/orange tips. The two boot jets animate out of phase, scale by age, lean subtly during lateral movement, and emit restrained pixel sparks. Flames are drawn behind the character, directly beneath measured soles rather than fixed offsets. Airborne punches use their attack-foot anchors; kicks use the remaining downward supporting boot.

Normal punches and kicks are now permitted during active Egghead flight. Previously shared combat code blocked them while an ability was active. Captain cannonball remains separate. Lift velocity, gravity, flight fuel use, partial charge, landing recharge, health and movement rules are unchanged.

## Bonney age/size correction
The first hover artwork had the correct atlas-row mapping but substantially narrower silhouettes than the existing idle art: about40% less visible area for baby Bonney. Matching height alone did not prevent the apparent shrink.

The replacement Bonney source uses the approved in-game Egghead atlas as the proportion reference. Baby has a large round head and short body; teenage is distinct; adult has mature fuller proportions. Export width is calibrated against idle silhouette width and area, not simply scaled to a fixed height. Browser regression checks compare actual exported pixels with each age's idle art. The original hover source is preserved as bonney-source-original.png.

## Assets and prompts
Built-in image generation was used, not CLI/API fallback. All source and runtime images are in assets/flight-v1/. Sources: bonney-source.png, bonney-source-original.png, luffy-source.png, thrusters-source.png. Runtime: bonney-flight-atlas.png and luffy-flight-atlas.png (384x192), thrusters-atlas.png (192x128). Individual hover poses and manifest.json are alongside them. Exact prompts: docs/flight-v1-prompts.txt. Exporter: scripts/pack-flight.mjs. Generated per-frame attachment data: src/flight-anchors.mjs. Rendering/layout: src/flight-art.mjs.

age-comparison.png shows Bonney idle/flight then Luffy idle/flight; rows adult, teenage, baby. This is an enlarged nearest-neighbor preview of actual runtime sprites. In-game captures are in docs/screenshots/flight-v1/.

## Verification
89 tests pass. Coverage includes all age-row selections, four hover columns, costume selection, measured/mirrored boot attachment, age-scaled jets, six thruster frames, airborne melee, and shutoff on jump release, empty fuel, landing, wrong power or inactive ability. The browser verifies both characters, all ages and both facings, stable hover heights, distinct frames, correct attack attachments, preserved fuel after release, and Bonney silhouette width/area against approved idle art. Hidden cloud discovery, roster switching and both full-level progression scripts pass; all77 runtime textures load successfully. Syntax checks pass.
