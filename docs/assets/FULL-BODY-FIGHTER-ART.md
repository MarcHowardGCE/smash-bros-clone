# Full-body fighter art

Normal local matches, online matches, and the Dojo use the full-body packs. Start with the source sheet and its manifest entry. Use the separate [fallback parts guide](REPLACING-FIGHTER-ART.md) when changing the articulated fallback renderer.

## Find the source and packed files

| Fighters | Source sheets and clip metadata | Runtime pack |
| --- | --- | --- |
| All-Rounder, Abe Lincoln, Swift | PNGs next to the [original source manifest](../../apps/client/public/fighter-art-pilot-v1/manifest.json) | [Original production manifest](../../apps/client/public/fighter-art-pilot-v1/production/manifest.json) and atlas pages in the same directory |
| Moonshine, “Hulk” Hoagie | PNGs next to the [newcomer source manifest](../../apps/client/public/fighter-art-newcomers-v1/manifest.json) | [Newcomer packed manifest](../../apps/client/public/fighter-art-newcomers-v1/dojo/manifest.json) and atlas pages in the same directory |

The newcomer directory keeps the name `dojo` from its first integration. Its packed art also ships in regular matches. Source and packed manifests have separate roles. Edit the sheet and source metadata, then rebuild the corresponding runtime pack. [Full-body loader](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

## Replace or add a clip

1. Start from the matching fighter and animation in the source manifest. Keep the existing clip key when replacing art. Check the [animation inventory](ULTIMATE-ANIMATION-CHECKLIST.md#current-five-fighter-inventory) and [runtime clip routing](../../apps/client/src/renderer/fullbody/preparedHooks.ts) for new keys. New artwork needs a runtime route before players can trigger it.
2. Export a transparent PNG. Keep the fighter's silhouette, palette, proportions, and scale consistent with approved nearby poses. Leave room for extended limbs, hats, and trailing costume pieces. Each frame is cropped by its own manifest rectangle, so sheet and cell sizes can vary.
3. Update the clip's sheet reference, frame rectangles, and durations together. The rectangle is `[x, y, width, height]` in source pixels. A frame can supply its own sheet reference. Use one duration per frame and preserve the intended timing in simulation ticks. Review contact poses against actual move timing in the Dojo. The engine owns hitboxes and action timing.
4. Register each pose against its existing ground or air anchor. `root` is relative to the frame rectangle. Preserve `airRoot`, mirroring, and `offsetY` where the clip uses them. For contact clips, keep the named `sockets` aligned with the grip, ledge, or other contact point. For a throw, the first tick of `activeWindow` selects the confirmed release drawing in either pack. Give that drawing a `grabGrip` socket and the first matching victim drawing `gripTop` and `gripBottom` sockets. Compare paired frames together to catch sliding, a sudden size change, or a detached grip. The packer converts roots and sockets into the packed scale.
5. Review the source animation at normal speed, frame by frame, and in both facings. Inspect the transition into and out of the action as well as the loop. Start the dev server using the [local development guide](../guides/DEVELOPMENT.md). The original and newcomer review pages are at `/fighter-art-pilot-v1/` and `/fighter-art-newcomers-v1/`. Their historical generators can rewrite manifests and review files. For a targeted edit, inspect the current source manifest and avoid rerunning a broad generator without reviewing its output.
6. Update the source manifest revision when the pack changes and follow [atlas packaging and verification](FIGHTER-PRODUCTION-ATLAS.md#current-packaging-workflow). Review the generated diff and test the normal game entry with a fighter from the changed pack. Check the changed action, the first and last frames, and paired contact when applicable.
