# Coral Current — playable first pass

Implemented harbor-water entry, independent underwater state, a safe return lift, four districts, thirteen coins, three high-route treasures, one intermediate checkpoint, four animated coral crabs, food, and a separate exit destination. No power pickups; suits are environmental equipment, not pickups. Existing powers are stowed and restored on surface return. Enemy hits therefore reduce age underwater; the protective suit remains visible. All ages share movement and attacks.

Movement: 62% walk/run speed, gravity 280, jump impulse 285, terminal descent 170. Approximate jump height 145 world pixels versus the harbor's 43. Repeated jump presses in midair cannot swim or fly. Punch, kick and stomps work. Underwater bottomless pits still cause checkpoint fall damage. There is no oxygen timer.

State: harbor snapshots remain frozen while exploring. Revisiting preserves collected underwater treasures and defeated enemies. Surface returns cannot bypass locked harbor gates. Cloud-to-harbor drops retain their previous behavior. Future exit reserved as deep-research-dock; no next level is built.

Art: assets/underwater-v1 contains 60 diving poses, six runtime character atlases, the coral/research panorama and a four-frame crab atlas. Originals preserved. Generated using built-in image generation. Character prompts are in assets/underwater-v1/prompts.json. Reef floor and ledges are simple code-drawn stonework pending a terrain art pass. Bonney's hair extends beyond her helmet collar and still needs a visually convincing seal.

Validation: 97 unit/gameplay tests and syntax checks pass. scripts/underwater-browser.mjs checks both heroes, eight district views, resource loading, independent victory and return to harbor. Screenshots in docs/screenshots/underwater-v1. These are fixture-driven views and transitions; a complete manual end-to-end difficulty playtest remains outstanding.

## Additional image prompts

Background: Wide panoramic underwater background for a richly shaded 32-bit pixel art pirate platformer, landscape. Undersea coral gardens and ancient pale stone arches, distant futuristic rounded research domes with cyan portholes, teal blue depth layers, sun rays filtering from water surface far above. Atmospheric distant scenery only, no foreground ground, no platforms, no characters, no text, no UI. Clean crisp pixel clusters with dark blue low contrast distance, luminous aqua highlights, purple coral. Seamless-looking left and right edges, detailed but quiet behind gameplay. Opaque full canvas.

Crabs: Production game sprite sheet transparent background. Exactly four isolated richly shaded 32-bit pixel art armored coral crabs in ONE horizontal row, same creature walking poses, side/three quarter view facing right. Rose coral shell with gold barnacles, lavender shadows, dark plum outline, two expressive eyes, big claws and six visibly articulated legs. Crisp square pixels, each sprite about64 pixels wide of actual detail. All same scale, feet same baseline. Generous transparent gaps, no text, no shadows, no scenery, no bubbles. Match polished pirate platformer pixel art quality.

Crab extraction: Background extraction only: remove ALL white and gray background and all cast shadows, replace with actual transparent alpha. Preserve exactly these four isolated pixel-art coral crabs, poses, colors and layout. No other changes. Truly transparent background, not white or checkerboard.
