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

Review the Settings tabs, per-seat Controls, and Training Dojo library in game. The next pass is cross-screen polish and signoff at desktop and compact sizes, including physical controllers, accessibility, and cold production loads. Local matches can rematch or return to fighter selection. Online results offer a route back to Create or Join Room. Random stays local to the host while browsing. Guests see the arena resolved by the host when it is confirmed. The build uses existing portraits and live stats. The live Dojo HUD, in-console diagnostic readouts, and fighter Details and bios remain future work. The current signoff results are recorded below.

## Cross-screen signoff pass — November 9, 2026

### Implemented corrections

- Native Tab focus now updates the shared menu highlight, so Enter activates the focused control. The focus listener is removed when the menu closes.
- Settings keeps its header, section navigation and help visible while the body scrolls. Short-window layouts reduce the header spacing.
- The initial HTML displays a readable loading status before JavaScript and fighter sheets finish. A failed application bootstrap offers Reload game.
- The home logo is decoded before menu entry. Original fighter portraits are prefetched for later screens. Existing image dimensions reserve their layout slots.
- Fallback fighter assets initialize the shared Pixi asset manager before full-body loading starts. This fixes the production-only bootstrap warning and invalid fallback bundle access found during the cold-load test.
- Local-flow regression fixtures now await the existing asynchronous fighter-art load and verify direct rematches. The KO presentation browser fixture uses the current viewport constructor and effect durations.

### Verification

| Check | Result |
| --- | --- |
| Layout matrix | 64 screen/size checks passed across Home, Settings sections, Dojo library and pause, four-seat setup and fighter selection, World Select, online lobby/fighter selection/guest preview, both match pauses and local results. |
| Tested sizes | 1920×1080, 1280×720, 1024×600 and 640×360. The last size tests the layout area equivalent to 200% zoom on a 1280×720 display. Native browser-zoom behavior still needs signoff. |
| Basic accessibility | The first 40 checks found no horizontal overflow, unlabeled visible controls, clipped control text or active controls below 24×24 CSS pixels. Keyboard focus and reduced-motion rendering were reviewed. This does not certify screen-reader or forced-colors behavior. |
| Palette contrast | Body text 13.42:1, secondary text 7.86:1 and primary-button text 10.74:1 for the sampled solid color pairs. Image-backed and translucent combinations still need individual review. |
| Controller simulation | Xbox 360, Switch Pro and DualSense each passed profile prompts, Confirm/Back, Dojo entry and pause/resume. Mixed seats displayed B, A and Circle respectively. |
| Physical controllers | The user reported that initial tests were fine. Extended mixed-controller sessions, reconnects and wireless behavior remain open. |
| Online handoff | Two real local clients reached shared character selection, host World Select, the guest preview and online pause. |
| World preview geometry | All six worlds and Random retained the same 1160×629.86 panel at 1280×720. |
| Dojo workflow | Record → playback → freeze → frame step passed. One step advanced the simulation by exactly one tick. |
| Regression gates | 175 targeted menu, controller and application-flow tests passed. Client type check and isolated production build passed. |

The cold production-build test ran against a local Vite preview, with a fresh browser context, 20 Mbps download, 60 ms latency and 2× CPU slowdown. Cold menu entry took 36.3 seconds and warm reload took 24.7 seconds. The loading status remained visible, the logo was complete at menu entry, all five fighters were available, and the run reported no fighter-loader or application errors. The match screenshot showed the fighter sprites, platform skin and background in place.

Evidence is saved in the working session under outputs/menu-signoff-20261109. The production build was staged separately from the repository's normal dist output, with environment loading directed to an empty directory.

### Remaining release checks and next step

1. Reduce startup transfer and decode cost. The current roster-wide preload remains expensive even with readable loading feedback. Measure the critical startup requests and move nonessential or unselected artwork behind deliberate preloading boundaries.
2. Repeat cold and warm tests on the deployed host, including a slower network and interrupted requests. The local production preview does not verify hosting cache headers, compression or CDN behavior.
3. Finish native 200% browser zoom, screen-reader and forced-colors checks, plus image-backed contrast states.
4. Complete longer physical-controller sessions, mixed seats, disconnect/reconnect and rematch navigation.

Fighter canon, detailed move profiles and a compact live Dojo HUD remain separate follow-ups. The initial audit above is retained as historical evidence.

## Startup loading follow-up — November 9, 2026

The previous production-preview run spent 36.3 seconds cold and 24.7 seconds warm before reaching Home. The startup path waited for every fighter's full-body atlases. Home now waits for its logo and UI, while the lightweight fallback art initializes separately.

- Local fighter selection shows the whole roster without reading its combat atlases. Confirming the lineup begins loading its unique fighters and shared effects while the player browses worlds. A local match waits for that artwork and the selected arena before the countdown. Dojo uses the same per-fighter cache and keeps its retry message for missing newcomer art.
- Online Ready waits for the roster's artwork, with an in-lobby status message. This preserves the existing server countdown and avoids starting a normal online match while a client is still loading fighter art. Restored room sessions retain eager artwork preparation, so their reconnect timing needs a separate pass.
- The selected arena background is fetched at high priority. During the first throttled run, the old eight-second deadline caused the arena to fall back to a flat background while fighter pages were transferring. The arena now allows up to 30 seconds for art and keeps the stable fallback for failures.

| Local production preview at 20 Mbps, 60 ms latency, 2× CPU slowdown | Previous | Updated |
| --- | ---: | ---: |
| Cold Home entry | 36.3 s | 3.4 s |
| Warm Home entry | 24.7 s | 1.4 s |
| Full-body atlas requests before Home | Roster-wide | 0 |

The cold Moonshine versus All-Rounder test reached live play in 19.6 seconds from lineup confirmation, including the countdown. It requested those two fighters and the shared effects atlas. The rendered first fight showed both sprite fighters, the platform skins and the stage background. A two-client test held one atlas request and verified the lobby waited to advance, then both clients displayed the selected newcomer sprites. A separate Dojo check loaded Moonshine, Hoagie and shared effects without downloading any original fighter sheets.

Next loading priority is the first fight and online readiness. Measure atlas transfer and decode costs, then evaluate smaller production pages and an online preflight scoped to confirmed lineups. Repeat the cold and warm measurements on the deployed host. Full accessibility and extended hardware signoff are still open.

## First-fight atlas follow-up — November 9, 2026

Production builds now crop unused right and bottom space outside the registered frames and padding, then encode smaller pages as lossless WebP. The build checks alpha and every visible pixel against the PNG before replacing a page in the build output. Frame rectangles, pivots, and effect registrations stay the same. Development and the source PNG atlases retain their existing format.

All 20 packed pages converted, and 3,149 frame records were verified against the original manifests. Across both atlas packs, bytes fell from 81.8 MB to 60.8 MB and decoded pixels fell from 83.9 million to 56.9 million. The isolated production build took about 26 seconds with compression, compared with about 4 seconds in the previous build.

| Cold Moonshine versus All-Rounder | PNG | Trimmed lossless WebP |
| --- | ---: | ---: |
| Time from lineup confirmation to live play, including countdown | 19.57 s | 16.91 s |
| Last atlas response from lineup confirmation | 15.48 s | 12.79 s |
| Atlas response bodies | 26.92 MB | 20.12 MB |
| Decoded atlas pixels | 25.17 million | 17.77 million |
| Isolated browser decode, median of three runs | 185 ms | 259 ms |

Each build ran in a fresh Chromium context against a local production preview at 20 Mbps, 60 ms latency and 2× CPU slowdown. The decode test used sequential createImageBitmap calls on downloaded blobs. WebP took about 74 ms longer to decode those pages. The smaller downloads saved 2.66 seconds overall. Both fighters, the platform skins and the world background were present at live play, with no fighter-loader errors. The 442 targeted client tests passed.

Evidence is in the working session under outputs/menu-signoff-20261109, including atlas-transport-ab.json and both first-fight screenshots. Next, reduce the remaining first-fight and online Ready waits by preflighting confirmed online lineups and testing cache behavior on the deployed host. Accessibility and extended hardware signoff remain open.

## Online lineup preparation — November 9, 2026

Lobby Ready now goes directly to the server. Each client starts preparing the distinct fighters in the confirmed lineup and shared effects when the room reaches World Select. The roster remains available during fighter selection without downloading its combat sheets.

When the host chooses the arena, the server assigns a preparation ID to that lineup and arena. Both clients show progress while they settle fighter and arena loading. The server starts the existing three-second countdown after every room member acknowledges that ID. Changing fighters, backing out, or leaving invalidates preparation. Duplicate acknowledgments count once and stale acknowledgments cannot start a match.

If a selected fighter's idle artwork is unavailable, the client shows an error and offers the existing Change fighter route so players can retry or choose another fighter. Arena artwork retains its bounded load and stable fallback behavior. Active-room refresh and reconnect still use eager preparation. The client and server must be deployed together for the new handshake.

In a fresh two-client local browser test, Ready reached fighter selection in 128 ms with zero atlas requests. The Moonshine and Hoagie lineup requested only their pages and shared effects on each client. A held guest fighter page and Stage 3 background exercised cancellation and reconfirmation. Releasing the fighter page alone left the countdown blocked. After the background was released, both clients entered the match with both sprite fighters and the Stage 3 background visible. Server tests cover duplicate, stale, non-member and departed-client acknowledgments.

Deployed-host verification, accessibility review and extended physical-controller signoff remain open. Evidence is saved in the working session under outputs/menu-signoff-20261109/online-lineup-readiness.json.
