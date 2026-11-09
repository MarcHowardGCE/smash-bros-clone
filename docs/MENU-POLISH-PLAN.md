# Menu polish audit and implementation plan

November 8, 2026. Fighter select, Dojo pause, Home, Local Play setup, the online room lobby, World Select, and the match intro are ready for in-game review.

## Audit scope and evidence

Reviewed client menu code and captured the running local game in Chromium at 1280×720. Repeated Dojo pause at 1024×600 and opened a two-client room to check both stage-selection roles. Results were reached through a local match. This is a visual and interaction baseline. The redesign still needs physical-controller and production signoff.

| Surface | What the audit found | Redesign |
| --- | --- | --- |
| Splash and home | The arcade logo and gilded frame already give the game an identity. Home makes Local, Dojo, Create, Join, settings, and audio compete in one tall stack. On cold entry I captured empty art slots and low-contrast labels while decoration loaded. The cabinet measured 760×504 before art settled and 760×630 afterward. | Make the logo and three mode choices the composition. Move room-code entry into Online and audio into Settings. Reserve image space and use readable base colors even before art loads. |
| Local setup | Player count, CPU difficulty, and controller assignment work, but text controls carry nearly the same visual weight. | Show 2–4 seat cards with device, human/CPU, and difficulty visible. Use one clear Continue action and retain assignments when backing up. |
| Online create, join, and lobby | The created-room screen is plain text and buttons. Copy Link reports success without waiting for clipboard success. Online fighter select showed a generated player ID and its Confirm button started at y=743 in a 720px viewport. | Create a room hub with seat status, honest copy feedback, a readable player label, and distinct joining, invalid-code, waiting, ready, and reconnect states. |
| Fighter select | Local repeats a vertical roster for every seat, displays small art and one line of role copy, and says “Three fighters” while offering five when newcomer art is ready. Online has a different tall list with mixed portrait crops. Neither shows comparable stats. | Build one shared visual roster with player markers, a prominent fighter reveal and comparison panel, compact seat cards, and a fixed action footer. |
| World select and guest preview | Six artworks and world stories are already present. World and Random held the same 1216×600 panel size at 1280×720. Random still turns the preview into a mostly empty rectangle. World art and story fill the preview before the practical layout information. The guest view uses a different visual hierarchy. | Keep the stable outer shell. Use a consistent art slot for every choice, including Random. Show the actual collision layout as a mini-map and put the story behind a tab. Use the same preview for host and guest with explicit selection rights. |
| Countdown, loading, and in-match HUD | Countdown, waiting, and the match HUD are separate surfaces. Menu art can appear after text; asset timing needs to be treated as part of the transition. | Give the handoff one VS composition and preflight selected art. Preserve player markers and match readability. Show a readable loading/retry state if required art is late. |
| Standard match pause | The existing 354px-wide centered panel leaves the arena visible but uses uneven button widths and shares styling with the much denser Dojo. | Compact pause with Resume first, Settings, and Leave Match. Clearly communicate online pause behavior and confirm leaving a live room. |
| Dojo setup and lesson library | 24 buttons share a 1040×662 panel. Guided lesson content continues below the fold, and repeated gold buttons make every lesson look primary. | Separate Free Practice and Lessons at entry. Use tier navigation, a selected lesson preview, three-rep progress, and persistent fighter/partner/world choices. |
| Dojo live HUD and pause | The live HUD is 310px wide with 1,197px of content. The open pause list contains 16 buttons and 1,169px of content in 594px of usable height at 1280×720, dropping to 474px at 1024×600. Lab actions rebuild the pause markup. | Use a wide tabbed console and a compact live status strip. Preserve tab, scroll, and focus when changing an option. |
| Controls, calibration, sound, and visual accessibility | Controls exposed 53 buttons and 2,000px of scroll content with keyboard slots visible. Visual accessibility already has a useful live preview. Audio is repeated across surfaces. | One Settings shell with tabs. Choose a seat before editing its bindings. Present current input and its device glyph together, use a calibration detail view, and preserve the previous screen on exit. |
| Results and replay route | Local and online results render headline text and two actions. The captured local result uses no fighter hero art. | Build a winner presentation with name, portrait or existing victory clip, and a truthful summary. Show Rematch, Change Fighters where the flow supports it, and Main Menu. Distinguish online rematch waiting from a local immediate restart. |

## Reference patterns

In Tekken 8's versus picker, the two character presentations frame a compact roster, with profile text beside the fighters and controls anchored at the bottom. Our local picker reverses that hierarchy by giving each seat its own large button list and a small character image. The redesign makes the five fighters the visual focus and adds gameplay comparisons. The reference profile's height and weight are character bio data, while our weight number comes from the game engine. [Tekken 8 selection screenshot](https://www.gamerbraves.com/2024/01/TEKKEN-8-Character-Select-Screenshot-01-1024x576.jpg)

- [Street Fighter 6 recording manual](https://game.capcom.com/manual/SF6/en/ps5/page/8/6) groups configurable training shortcuts under Basic Settings. Adapt the fast reset and playback loop to Dojo so routine testing rarely requires reopening the console.
- [Tekken 8 official practice and results update](https://www.tekken-official.jp/tekken_news/?p=388) separates Practice, Restart, Display, and Command List features and offers routes from results into further learning. Group Dojo options by task and give results clear next actions.
- [2XKO official mode walkthrough](https://2xko.riotgames.com/en-us/news/announcement/whats-in-2xko-alpha-lab/) gives players a passive training default with CPU behavior in a separate settings category. Preserve the approachable sandbox and make advanced tools opt-in.
- [Super Smash Bros. Ultimate stages](https://www.smashbros.com/en_US/stage/) treats stages as gameplay choices with forms, hazards, and music. Our six worlds should expose the actual platform geometry and active rules beside the illustration. World lore remains a separate layer.

## Fighter select

Use a full-width composition with a fixed strip of five portrait tiles, a large hero portrait, and a comparison panel. In two-player local play show both selected fighters. In three- or four-player play keep four compact seat cards and show detailed stats for the inspecting seat. Each controller owns its seat’s focus and ready state. Online the opponent card reflects the server acknowledgment. Moving focus and opening details must never confirm a pick. In Dojo, use the same picker for player and partner, with existing mode availability.

Show role, one strength, one tradeoff, weight, ground speed, and air speed at a glance. Compare any two eligible fighters with aligned bars and text values. Use a Details view for jump height measured in the simulation and a few signature moves with controller inputs. An optional “Try in Dojo” can preselect the fighter and return to the prior browse context. Fighter bios can be added once canon is written together.

Current source values from `packages/shared/src/constants/characters.ts`:

| Fighter | Weight | Max run speed | Max air speed | Suggested role copy |
| --- | ---: | ---: | ---: | --- |
| All-Rounder | 100 | 6.50 | 5.00 | Balanced starter |
| Abe Lincoln | 118 | 5.80 | 4.20 | Heavyweight |
| Swift | 75 | 6.80 | 5.80 | Aerial speedster |
| Moonshine | 87 | 6.65 | 5.40 | Mobile brawler |
| “Hulk” Hoagie | 109 | 6.10 | 4.60 | Grappler |

Read numbers from the live registry and label weight as a gameplay stat. Raw movement speeds are game units per tick. A player-facing default can show plain-language rank and numeric deltas against the pinned fighter. Use normalized comparison bars with a single scale per stat and accessible text. Keep move range and launch power out of summary bars until a repeatable benchmark exists. Derive the displayed roster and count from mode availability rather than the legacy three-fighter guard alone.

## Dojo pause

Use a centered console roughly 920–1,040px wide on desktop, fitting the viewport with a sticky footer. At compact sizes use an inset sheet with one scrolling tab body. Keep Resume, Reset Arena, and a contextual shortcut legend on every tab. Display settings as labeled rows with their values aligned. Keep freeze/step and routine status visible when their tab is active.

| Tab | Controls |
| --- | --- |
| Session | Fighter and partner summary, behavior, positions, percent presets, dodge fatigue, exit to lessons |
| Timing & Display | Speed, freeze, frame step, collision overlays, input trace, launch readout, screen/star KO previews |
| Recordings | Three slots, record/stop, play, mirror, repeat, delay, recording length and status |
| Settings | Audio and accessibility shortcuts with focus restored on return |

Keep the live Dojo strip small, with lesson cue and three-rep progress in lessons, and partner/percent plus lab status in Free Practice. Open traces and diagnostics on demand. Reuse the existing PracticePanel actions and callbacks. Verify updates during pause and after resume, and keep R/F2/F3/F6–F9 and controller shortcuts operating in their existing contexts.

## Art direction and implementation order

1. **Design the two priority screens.** Produce fighter-select and Dojo pause compositions at 1280×720 and 1024×600. Use an illustrated arcade-poster direction with ink-plum panels, cream type, mint focus, and warm metal accents. Give the ornate artwork a few large focal points. Use calmer, consistent rows for utility controls. Specify typography, spacing, buttons, tabs, seat colors, focus, selection, disabled states, and status.
2. **Implement fighter select and Dojo pause.** Start with existing assets and real data. Consolidate the repeated local and online presentation around mode-specific behavior and existing controller support. Group Dojo actions behind stable identifiers so changing a value preserves focus. Add an early loading and contrast check.
3. **Build the surrounding flow.** Apply the same components to home, local setup, online rooms, stage select, guest waiting, countdown/loading, standard pause, and results. Carry fighter, player, stage, and readiness through each transition. Use the six approved stories and derive each mini-map from current geometry.
4. **Finish settings and the lesson library.** Reuse audio and visual settings views and keep per-seat remapping, calibration, accessibility, and saved lesson progress intact.
5. **Polish and ship.** Validate the asset crops, transition timing, typography, focus, and short-window layouts. Compare cold and warm production loads. Complete the physical-controller and mixed-seat runs.

### Asset brief

- First make two sample crops from existing fighter art for a side-by-side hero and roster tile review. Then produce five matching tile crops and five transparent hero treatments. Standardize lighting, scale, facing, and crop across the three original fighters and two newcomers. Reuse for results. Generate new hero art only where the existing image cannot support the target crop.
- Reuse the existing arcade logo and six world illustrations. Export lighter menu-sized thumbnails and fixed-ratio preview crops. Use game geometry for the layout diagrams. Make one illustrated Random card that fills the same preview slot.
- Replace stretched button skins with crisp scalable borders, a small set of original ornaments, and a single focus-eye treatment. Use consistent SVG glyphs for Xbox 360/Xbox Wireless, Switch Pro, DualSense, and keyboard. Check that shared prompts and seat-specific prompts reflect their existing ownership. Add restrained motion and audio cues after layout signoff, with reduced-motion and mute respected.

## Signoff

- Capture default, focused, selected, ready, disabled, error, and empty/loading states at 1920×1080, 1280×720, and 1024×600. Check 200% browser zoom, visible keyboard focus, contrast, readable text on cold load, and reduced motion. Keep primary actions and Back visible with zero horizontal scrolling.
- Verify mouse, keyboard, simulated controller profiles, and physical Xbox, Switch Pro, and DualSense. Test 2–4 local seats and mixed controllers, joining, unconfirming, synchronized stage preview, reconnecting, and local and online rematch. Never let navigation activate twice on a single input.
- In Dojo, complete a three-rep lesson and run a full record → playback → freeze → frame-step loop without losing the active setting or focus. Confirm controls remain reachable without scrolling the whole pause dialog.
- Require stable geometry when moving between fighters, all six worlds, Random, and loading placeholders. Verify artwork is present when entering the match and no menu decor delays accepting input. Capture the actual selection and start flows for comparison.

Review World Select, the online guest preview, and the match handoff in game. Then continue with standard match pause and results. Random stays local to the host while browsing. Guests see the arena resolved by the host when it is confirmed. The build uses existing portraits and live stats. The live Dojo HUD, in-console diagnostic readouts, fighter Details and bios, and the rest of the menu rollout remain future work.

