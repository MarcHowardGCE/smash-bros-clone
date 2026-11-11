# Arenas 07–09

Added November 10, 2026. The three arenas use static collision, the existing stage walls and blast zones, a solid main floor with two ledges, and pass-through upper platforms. The stage ID drives collision, platform art, menu art and music. The background filename is a separate field.

| Arena | Supplied background | Platform art | Supplied music |
| --- | --- | --- | --- |
| 07 · The Day Gravity Resigned | `stage08.webp` | Upside-down viaduct and rail-stop slabs. Three upper platforms form a triangle. | “Up Is a Matter of Opinion” → `stage7.mp3` |
| 08 · The Tuesday That Happened Twice | `stage09.webp` | Clockwork station and twin ticket-punch balconies. A wide floor leaves open ground on both sides. | “3:17 (Again)” → `stage8.mp3` |
| 09 · The World That Forgot Its Shape | `stage07.webp` | Drawing board and folded storyboard strips. Four upper platforms form two stair steps with a gap through the middle. | “The Last Drawing Before Nothing” → `stage9.mp3` |

The background assignment follows the artwork motifs. The supplied MP3s play through the existing whole-track looping player. The audio files retain their original arrangements and durations.

## Art pipeline

The [source prompts](../../art-source/platforms-v1/asset-prompts.json) and [crop registrations](../../art-source/platforms-v1/sprite-registration.json) record the three transparent sheets made with the built-in image generator. Run [the stage packer](../../scripts/assets/pack-stage-platforms.mjs) to regenerate the transparent PNG crops. Encode the new platform crops as WebP at quality 88 and alpha quality 100. The renderer puts a thin rim at each registered collision surface. Stage selection and match intros use 800 × 450 menu derivatives of the supplied backgrounds.

## Automated verification

The stage integration suite checked floor and soft-platform contact, ledge coordinates, snapshot IDs and deterministic four-player simulation across all nine stages. Dojo reset checks also ran across all nine. A separate movement probe landed 50 full-hop routes across the three new arenas with the five existing fighters. The server selection tests accepted all three new IDs and rejected background filenames and inherited object keys.

Local Chromium matches loaded each arena's registered background, both platform WebPs and its MP3. Each MP3 decoded in stereo. A two-client Arena 09 match preserved the world ID and background after the guest refreshed. The match screenshots at 1024 × 600 were reviewed against the collision overlay. The compact nine-world menu passed keyboard navigation and entered Arena 09 through Random. Training Dojo cycled from Arena 07 to Arena 08 and entered Free Practice on Arena 08.

## Playtest handoff

Review the routes using the lowest-jumping fighters and check ledge recovery from both sides. Test four-player framing, especially the high platforms on stages 7 and 9. At gameplay zoom, compare sprite rims against `?stageDebug=1` with background motion on and off. Listen through the shipped MP3 seams during repeated play and edit the source masters if the whole-track restart interrupts the groove.
