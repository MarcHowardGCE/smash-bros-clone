# Walking animation v3
Replaced the former two similar run poses with six distinct contact/down/passing/opposite-contact/down/passing frames for every age and outfit (36 frames total).
Built-in image generation created the source sheets. Exact prompts: walk-cycle-prompts-v3.txt.
Sources, exported PNGs, manifests and an animated review page are in assets/walk-v3/.
scripts/pack-walk-sprites.mjs reproduces the frame exports using the parent's existing pngjs dependency.

src/locomotion.mjs selects frames from actual distance travelled (one complete cycle per 42 world pixels), mirrors them when moving left, resets to idle when stopped, and retains the prior airborne pose.
The local server now serves the locomotion module.
Animation testing: npm test includes locomotion.test.mjs. scripts/verify-walking-browser.mjs checks all six frames during actual keyboard movement in both directions for every age/outfit and verifies idle on stopping.
Existing gameplay browser checks also passed.

## Size correction
The adult purple suit's widest stride initially forced the whole animation to shrink from 60 to about 52 source pixels in height so it would fit a 64-pixel-wide square.
Walking cells are now 96x64 with extra horizontal padding, while vertical targets remain adult 60, teenage 50, baby 36.
They render into a 48x32 logical rectangle with an 8-pixel horizontal offset so the body anchor and on-screen scale remain consistent with the idle sprite. Extra width is transparent padding for wide strides, not a change to physics.
Idle/jump sheets remain 64x64. Atlas cells have independent width so walking never rescales the body to satisfy a width limit.
Physics, health and ability rules remain unchanged.

## Checks
14 gameplay/animation unit tests and syntax checks passed.
Browser motion verified in both directions at every age/outfit.
Visual contact sheet: docs/screenshots/walking-both-directions-v3.png.
The six-frame loops are still a POC; additional in-between poses and costume consistency can be refined further.
