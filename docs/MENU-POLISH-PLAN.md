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

## Portrait, lesson spacing and camera review — November 9, 2026

Moonshine and “Hulk” Hoagie now use transparent full-body cutouts from their approved neutral idle frames. The same menu asset lookup supplies fighter selection, Dojo, the VS intro and results. The original bust portraits remain available as source art. Completed lesson cards lay out their title and completion status on separate rows and grow to fit the label inside the scrolling list.

The camera audit found a full-stage fit and 1× upper limit in local play. The online render path never called the follow camera. Earlier refinement notes covered wide four-player framing, but had no active camera tuning pass. The new shared camera targets 0.5×–1.65× based on the horizontal and vertical spread of active fighters. It centers the fight lower in the view, tightens gradually and widens more quickly. Screen margins constrain the pan and zoom when fighters launch toward the edge. Knocked-out and eliminated fighters are excluded. Collision, arena geometry and launch physics are untouched.

Nintendo's [Ultimate gameplay demonstration](https://www.youtube.com/watch?v=8oPhDrn7juE) is the reference for comparing normal fight framing. The chosen zoom limits and easing are project tuning values. Native camera limits and timing have not been measured.

Browser checks at 1280×720, 1024×600 and 640×360 kept the Completed line inside its card without touching the next card. A close Dojo setup reached 1.63×. A forced spread with four fighters, including offstage positions, widened to 0.65× with all four centers visible. Both clients in an online match crossed 1.55×. The client type check and 420 targeted tests passed. Evidence is saved under outputs/menu-signoff-20261109/portrait-dojo-camera-checks.json and the companion Dojo screenshots.

Next camera review should compare close exchanges, opposite ledges, vertical launches and respawns on all six worlds, then tune the upper limit and easing against comparable Ultimate captures and human play.

## Render load benchmark — November 9, 2026

Headless Chromium at 1280 × 720 and DPR 1 ran three cold and warm pairs per target. Chromium DevTools emulated 20 Mbps download and upload, 60 ms latency, and 2× CPU slowdown. Each cold run used a fresh browser context. The warm run reloaded in that same context after the first fight. Target order alternated. The Render service was already running, so these numbers measure browser-cache cold starts. The local target was the same production Docker image used in release smoke verification. [Render game](https://everybody-throws-hands.onrender.com/) · [Release evidence](history/clean-checkout-verification.md#linux-container-and-hosted-release-smoke)

Every run dismissed the splash as soon as it was available, selected Moonshine against All-Rounder, and chose Stage 1 as soon as World Select was ready. Home is measured from navigation to the Local Play button becoming available. Fight time starts at lineup confirmation and ends when the simulation enters live play, including the countdown. All 12 runs then verified player movement. The table gives medians with sample ranges in parentheses.

| Measurement | Render cold | Render warm | Local container cold | Local container warm |
| --- | ---: | ---: | ---: | ---: |
| Navigation to Home | 4.22 s (4.13–4.53) | 1.98 s (1.97–2.00) | 4.02 s (4.01–4.02) | 1.37 s (1.36–1.39) |
| Lineup confirmation to live play | 15.16 s (14.73–15.19) | 5.08 s (5.08–5.11) | 16.35 s (16.35–16.35) | 5.06 s (5.05–5.08) |
| Navigation to live play | 19.52 s (19.49–19.67) | 7.27 s (7.24–7.28) | 20.59 s (20.59–20.61) | 6.63 s (6.61–6.66) |

The earlier optimized local Vite preview reached Home in 3.4 seconds cold and 1.4 seconds warm. Its trimmed WebP build took 16.91 seconds from lineup confirmation to live play cold. In the paired container comparison, Render reached Home 0.20 seconds later cold and 0.60 seconds later warm. The Render cold fight reached live play 1.19 seconds sooner, while warm fight times were within 0.02 seconds. The two targets served different client bundle hashes, `index-DnnslYQA.js` on Render and `index-BRM95Ob2.js` locally. This comparison measures the two configurations as served. It cannot isolate hosting from build differences.

Stage 1 was applied at live play in all runs. The first Render cold and warm screenshots showed both fighter sprites, platform skins, and stage artwork. No page or console errors or failed non-audio requests were observed. Sampled Render production atlas and Stage 1 responses reported `Cache-Control: public, max-age=0` and `CF-Cache-Status: DYNAMIC`. Page resource timing did not capture the atlas image requests even though browser response events saw them. Atlas transfer bytes and CDN cache savings are therefore unmeasured in this pass.

Next, repeat on the same released revision with a slower connection, an interrupted asset request, and active-room reconnect. Include a service-idle start separately if the deployed plan sleeps.

### Post-deploy rerun

After the Render deployment of `3928e5d`, both targets served `index-BRM95Ob2.js`. The downloaded client bundles matched SHA-256 `e5be5ad5d235693c712574fabdcdf609f3f6557b901b75ba496fb9c757add1d7`. The same 20 Mbps, 60 ms latency, 2× CPU setup and Moonshine versus All-Rounder flow ran three fresh-context and reload pairs per target. Values are medians with sample ranges in parentheses. [Render game](https://everybody-throws-hands.onrender.com/)

| Measurement | Render cold | Render warm | Local container cold | Local container warm |
| --- | ---: | ---: | ---: | ---: |
| Navigation to Home | 4.46 s (4.44–13.84) | 1.96 s (1.95–2.01) | 4.02 s (3.99–4.03) | 1.39 s (1.39–1.40) |
| Lineup confirmation to live play | 15.17 s (15.17–15.19) | 5.08 s (5.08–5.11) | 16.35 s (16.33–16.38) | 5.07 s (5.06–5.08) |
| Navigation to live play | 19.86 s (19.84–29.23) | 7.26 s (7.24–7.27) | 20.59 s (20.56–20.62) | 6.64 s (6.63–6.64) |

The first cold Render run took 10.06 seconds to receive the first byte of the document and 29.23 seconds to reach live play. The other two cold runs received the first byte in 0.31–0.34 seconds and reached live play in about 19.85 seconds. The first-byte delay accounts for the outlier. Its cause was unverified, and the test did not deliberately idle the service.

All 12 runs verified movement and the Stage 1 background. The hosted cold screenshot showed both fighter sprites and platform skins at live play. No page or console errors, art warnings, or failed non-audio requests were observed. The browser still could not attribute transfer bytes for the atlas pages through page-level resource timing. The next loading checks are slower networks, interrupted asset requests, and timed active-room reconnects.

## Render slow-link and recovery checks

The deployed `index-BRM95Ob2.js` bundle was tested in headless Chromium at 1280 × 720 and DPR 1. Three fresh-context and same-context reload pairs used 8 Mbps download and upload, 120 ms latency, and 2× CPU slowdown. The lineup was Moonshine versus All-Rounder on Stage 1. All six runs accepted movement and showed the selected backdrop. The cold capture showed both fighter sprites and the platform skins. Values are medians with sample ranges in parentheses. [Render game](https://everybody-throws-hands.onrender.com/)

| Measurement | Render 8 Mbps cold | Render 8 Mbps warm | Previous Render 20 Mbps cold | Previous Render 20 Mbps warm |
| --- | ---: | ---: | ---: | ---: |
| Navigation to Home | 7.18 s (7.09–7.41) | 2.00 s (2.00–2.01) | 4.46 s | 1.96 s |
| Lineup confirmation to live play | 33.18 s (33.09–33.38) | 5.13 s (5.13–5.18) | 15.17 s | 5.08 s |
| Navigation to live play | 40.69 s (40.58–40.70) | 7.35 s (7.31–7.37) | 19.86 s | 7.26 s |

### Interrupted fighter atlas

In a two-client room, the browser aborted the guest's first request for `atlas-abe-lincoln-live-0.webp` with a simulated connection reset. The host became ready and the countdown remained blocked at one of two players ready. The guest saw no alert within 20 seconds. On the longer run, the fighter-art alert appeared about 60 seconds after arena confirmation. The guest used Change fighter, reconfirmed the same lineup, and the second request for that atlas returned HTTP 200. Neither client entered live play within 60 seconds after the retry. The cause of the stalled retry remains open. The current production clip loader can wait up to 60 seconds. [Clip loader](../apps/client/src/renderer/fullbody/FullBodyPilot.ts#L52)

### Active-room reconnect

Three separate two-client rooms used Abe Lincoln versus Swift on Stage 6. Each guest refreshed the same tab while the match was live. The host stayed unthrottled. The two slow cases used the 8 Mbps, 120 ms, 2× CPU profile only for the guest refresh. Browser cache bypass retained session storage so the guest could still present its reconnect identity. Times start immediately before refresh.

| Guest refresh profile | Rejoin request sent | Match restored | Movement visible to host | Host reached results |
| --- | ---: | ---: | ---: | ---: |
| Unthrottled, cache enabled | 3.43 s | 3.68 s | 3.95 s | — |
| 8 Mbps, cache enabled | 30.54 s | No recovery in 70 s | — | 30.21 s |
| 8 Mbps, cache bypassed | 37.37 s | No recovery in 70 s | — | 30.33 s |

The unthrottled refresh restored the same fighter slot and arena. Both throttled requests were sent after the host reached results. The client currently waits for artwork for the entire roster before constructing the network client on a saved-room startup. The server enforces a 30-second disconnect grace period. Prioritize reconnecting before full-roster art loading and verify restored control at 8 Mbps with cache enabled and bypassed. [Startup](../apps/client/src/main.ts#L202) · [Grace expiry](../apps/server/src/createApp.ts#L410)

### Separate first-byte investigation

Eight unthrottled probes each of the HTML document and favicon returned HTTP 200, spaced three seconds between pairs. HTML first byte was 0.19–0.32 seconds with a 0.27-second median. Favicon first byte was 0.18–0.35 seconds with a 0.24-second median. HTML TLS setup finished within 0.14 seconds, and the remaining time from connection setup to first byte was at most 0.23 seconds. The three fresh-context 8 Mbps navigations reported 0.18–0.22 seconds to the first HTML byte.

The earlier 10.06-second wait did not recur. It occurred before the first HTML byte and therefore preceded fighter and arena loading. These probes hit a running service. There is no controlled idle-wake sample or provider log for the original request. If it recurs, capture the UTC timestamp, Render request ID, and connection phases for correlation with provider logs.

## Reconnect and atlas retry fixes

The client opens the room connection without waiting for roster artwork. The first restored snapshot identifies the fighters to load. The current arena and match state recover independently, and the live renderers attach the selected full-body sprites as they become available. The match can accept input while the fallback art is still visible. The server's 30-second grace window is unchanged. [Reconnect path](../apps/client/src/main.ts#L725) · [Live art attachment](../apps/client/src/renderer/FighterRenderer.ts#L188)

Production atlas downloads use individually bounded fetches. Successful pages remain available for the next attempt, and failed requests are evicted so the same lineup can retry. The cold-cache retest also exposed a five-second manifest deadline while downloading the 2.54 MB source manifest, so the manifest deadline is now 20 seconds. [Atlas loader](../apps/client/src/renderer/fullbody/FullBodyPilot.ts#L27)

The patched production build ran locally in Chromium. The guest used the same 8 Mbps download and upload, 120 ms latency, and 2× CPU slowdown as the prior Render run. The host stayed unthrottled. Each reconnect row is one independent Stage 6 match with Abe Lincoln and Swift.

| Guest refresh profile | Rejoin request sent | Match restored | Movement visible to host |
| --- | ---: | ---: | ---: |
| Unthrottled, cache enabled | 0.16 s | 0.67 s | 0.95 s |
| 8 Mbps, cache enabled | 4.31 s | 4.46 s | 4.60 s |
| 8 Mbps, cache bypassed | 6.27 s | 6.45 s | 6.60 s |

All three refreshes restored the same fighter slot and arena. Both slow cases stayed inside the grace window and began loading the two fighters' atlas pages without requesting unrelated fighters. The prior deployed slow-link failures are recorded separately because the patched test used a local production server.

At 8 Mbps, a simulated reset of the guest's first Lincoln atlas request kept the countdown blocked and showed the artwork alert after 36.82 seconds. The guest used Change fighter and reconfirmed the same lineup. Both clients reached live play 7.73 seconds after retry. The slow first alert remains observable while the other selected assets finish. A browser regression also holds an atlas through refresh, confirms the match is restored while it is held, then releases it and verifies both full-body sprites. [Recovery regressions](../apps/client/e2e/online-art-recovery.spec.ts)

The next release check is to run the two slow cache modes and the interrupted-atlas retry on Render with the patched bundle.

### Hosted reconnect and retry verification

After deployment of `9065ff0`, Render served `index-BZZ9LC62.js`, the bundle used in the patched local production checks. All three hosted Chromium checks passed in 1.9 minutes. Each used a separate room. Only the guest was throttled to 8 Mbps download and upload, 120 ms latency, and 2× CPU slowdown. [Render game](https://everybody-throws-hands.onrender.com/)

| Live Stage 6 refresh | Rejoin request sent | Same slot and stage restored | Movement visible to host |
| --- | ---: | ---: | ---: |
| Cache enabled | 4.70 s | 4.96 s | 5.27 s |
| Cache bypassed | 6.07 s | 6.46 s | 6.78 s |

Times start at guest refresh. Both guests regained control inside the server's 30-second grace period, compared with the earlier deployed rejoin requests at 30.54 and 37.37 seconds. Both sampled sessions saw 10 atlas page responses for Lincoln, Swift, and shared effects. They saw no requests for unrelated fighters' atlas pages in the observation window.

For the retry check, the guest's first request for `atlas-abe-lincoln-live-0.webp` was reset. The countdown stayed blocked and the artwork alert appeared 33.78 seconds after Stage 1 confirmation. The guest used Change fighter and reconfirmed Swift against Abe Lincoln. The retried atlas returned HTTP 200, the restored match contained the same two fighters, and both clients entered live play 8.19 seconds after starting the retry. The delayed initial alert remains the outstanding issue observed in this scenario.

### Early artwork failure alert

Online preparation reports a failed required idle clip as soon as the loader knows it is unavailable. The alert can appear while other fighter pages, shared effects, or the arena are still loading. Successful preparation still waits for the full lineup and arena, and the client checks that it is acknowledging the active preparation. A retry can reuse successful and in-flight downloads. [Online preparation](../apps/client/src/main.ts#L892) · [Required idle clip](../apps/client/src/renderer/fullbody/FullBodyPilot.ts#L112)

The patched local production bundle `index-DcMq4bb0.js` ran three independent two-client checks. The guest was throttled to 8 Mbps download and upload, 120 ms latency, and 2× CPU slowdown. Each run reset the guest's first Lincoln idle atlas request and immediately used Change fighter after the alert and the host's ready status were observed. All three runs held the countdown at one of two ready. The retry returned HTTP 200 and both players reached live play with the same Abe Lincoln versus Swift lineup.

| Measurement | Median | Range |
| --- | ---: | ---: |
| Arena confirmation to artwork alert | 6.06 s | 6.02–6.29 s |
| Simulated reset to artwork alert | 0.49 s | 0.45–0.77 s |
| Starting same-lineup retry to both clients live | 37.61 s | 37.33–37.73 s |

The previous Render alert appeared 33.78 seconds after arena confirmation. The patched local retry starts much earlier in the loading sequence, while other art is still downloading. Its retry-to-live interval therefore includes downloads that had already finished by the time the prior alert appeared. These runs verify earlier feedback and successful recovery. A same-host timing comparison awaits deployment.

The browser regression holds a second page while aborting the idle page and verifies that the alert appears before the held page is released. It then retries the same lineup and verifies both clients enter play. [Browser regression](../apps/client/e2e/online-art-recovery.spec.ts#L65)

#### Render early-alert signoff

After deployment of `30d2517`, Render served `index-DcMq4bb0.js`, matching the locally tested bundle filename. Chromium ran three independent two-client rooms with Abe Lincoln versus Swift on Stage 1. Only the guest was throttled to 8 Mbps download and upload, 120 ms latency, and 2× CPU slowdown. Each test reset the guest's first request for Lincoln's required idle atlas. [Render game](https://everybody-throws-hands.onrender.com/)

| Measurement | Median | Range |
| --- | ---: | ---: |
| Arena confirmation to artwork alert | 3.12 s | 3.05–3.15 s |
| Simulated reset to artwork alert | 0.88 s | 0.43–0.89 s |
| Starting same-lineup retry to both clients live | 37.27 s | 36.52–37.75 s |

All three runs remained at one of two players ready before retry, and neither client entered countdown or live play during the failure check. Every retry returned HTTP 200 for the reset atlas and both clients entered live play with the same lineup. The alert now appeared about 31 seconds earlier than in the previous hosted test. The retry-to-live interval still includes the other artwork downloads that were pending when the alert appeared. The test covers a one-shot reset of required idle artwork.

## Native browser zoom and forced-colors checks

Local Playwright Chromium checks on Windows used the browser's native 200% tab zoom. The CSS viewport changed from 1258×702 to 629×351 and the device pixel ratio changed from 1 to 2. The six surfaces below ran in both standard colors and Chromium's forced-colors emulation, for 12 screen and mode combinations.

| Screen | Action checked |
| --- | --- |
| Home | Local Play |
| Local Player Setup | Choose Fighters |
| Fighter Select | Confirm the active seat |
| World Select | First world tile |
| Dojo lesson library | Free Practice |
| Dojo pause | Resume |

All checked panels fit the viewport horizontally. Each target was reachable after scrolling, and Chromium's accessibility tree exposed named buttons. Tab on Home focused Online Play with a solid 2 CSS pixel outline in both modes. The Dojo run entered Free Practice, opened pause and resumed.

This pass covers layout, primary pointer targets, browser accessibility roles and names, and one keyboard focus check. Settings and online menus still need completed runs at native zoom. Next verify how selected and focused controls differ in forced colors, then use a screen reader to check navigation, dynamic announcements, and focus restoration. Measure text and control contrast against the rendered artwork in their default, hover, selected, and focused states.

## Expanded zoom and selection checks

A second local Chromium pass repeated the six checks above at native 200% browser zoom and added Controls, visual settings, Sound, online entry, and the host room lobby. All 22 screen and color-mode combinations passed. Each tested panel had no horizontal overflow and its target was reachable after scrolling. The online flow created and left a room on the local server.

Forced colors replaced the selected and unselected fighter cards and Dojo tabs with the same fill and border. The shared menu styles now underline the label on controls marked pressed, selected, or current when forced colors are active. Keyboard focus keeps its separate outline. The rerun verified that the underline followed selection changes in Fighter Select, Settings and Dojo Pause. An unselected Dojo tab kept its outline while focused and received the underline only after activation. The standard-color rerun kept the existing color styling.

Next check spoken screen-reader navigation, dynamic announcements, and focus restoration, then measure text and control contrast over artwork. Chromium's forced-colors emulation and accessibility tree cover browser behavior. Spoken output and physical Windows contrast themes still need separate checks.

## Keyboard focus, announcements, and artwork contrast

Local Playwright Chromium on Windows exercised live menu routes at 1280×720 with standard colors and the local room server. The audit recorded keyboard focus, the visible navigation highlight, and Chromium accessibility tree roles, names, and state after each action. These are browser observations. Spoken output and announcement order in Narrator or NVDA remain unverified.

| Flow | Observation |
| --- | --- |
| Home Tab | Tab moved to Online Play, then Training Dojo. Keyboard focus and the visible highlight agreed. |
| Home arrows | From Online Play, Down highlighted Training Dojo while keyboard focus stayed on Online Play. |
| Settings entry and return | Enter on Controls opened Settings with focus on the page body. Escape returned Home with focus on the body and Local Play highlighted. The Controls opener did not regain focus. |
| Online room code and Ready | Enter on a short code kept focus in the labeled textbox, set its invalid state, and updated a polite, atomic status. The host Ready action updated the status to “Waiting for other players.” Leave Room returned Home with body focus. |
| Fighter Select | The selected fighter exposed a pressed button state. The comparison values exposed a polite live region. Speech and verbosity of the table update remain unverified. |
| World Select | Right changed the preview and pressed state from Neighborhood to Cathedral, while focus stayed on Neighborhood. The preview is a named region without a live update cue. Escape returned to Fighter Select with body focus. |
| Dojo Pause | Opening pause left focus on the body despite the Resume highlight. With Session focused, Right moved keyboard focus to Timing & Display and exposed it as the selected tab with a named panel. Escape from Visual Settings reopened the Settings tab with body focus instead of restoring the opener. |

The contrast pass sampled rendered backgrounds under visible text ranges. It temporarily hid the glyph fill and text shadow without removing the art or layout, then compared the computed foreground color with the least favorable sampled background. The table groups the minimums. The run used 4.5:1 for ordinary text and 3:1 for large text. Home Local Play and Choose Fighters were tested at rest, on hover, and with focus. [WCAG 2.2 contrast minimum](https://www.w3.org/TR/WCAG22/#contrast-minimum)

| Surface | Lowest sampled ratio |
| --- | ---: |
| Home brand caption and Local Play text | 7.86:1 |
| Local Player Setup Choose Fighters | 10.74:1 |
| Fighter hero copy and selected roster label | 6.02:1 |
| World tile, preview title, and Random World badge | 8.21:1 |
| Stage 1 match intro title and versus text | 7.72:1 |
| Stage 1 result heading and details | 7.45:1 |

All sampled text met its threshold. This was a spot check at one viewport with one match backdrop. Focus-ring contrast, additional world art, and unsampled menu states still need checks.

Next, make keyboard focus follow arrow selection and restore it to the originating control on return. Set a useful initial focus for newly opened menus and pause. Give world preview changes a concise announcement. After those fixes, use Windows Narrator to verify the spoken control name, selected state, short status messages, and focus return without repetitive announcements.

## Keyboard focus fixes and spoken verification checklist

Up and Down now move native keyboard focus with the shared menu highlight. World Select also focuses the highlighted tile during keyboard navigation. Hover and controller preview changes use a polite status with the world name when focus stays put. Keyboard focus already exposes the tile name and pressed state, so that path skips the extra status message.

Settings puts focus on its heading and remembers the opener when switching tabs. Back restores focus to the opener on Home or in Pause. World Select returns to the first seat's Ready button, Fighter Select returns to Choose Fighters, and the online entry and lobby return to Online Play. Match Pause focuses Resume. Dojo Pause focuses Resume when Session is active, or the selected tab when reopening another tab.

Four focused Chromium regressions passed alongside the existing pause and online selection checks, for nine browser passes. The two-client test exercised shared stage preview, Back, and reconnect. The client type check and 92 focused UI tests passed. The broader UI run passed 144 checks and could not launch the browser for the three legacy HUD color checks. The pause regression rerun used a local test URL in place of that legacy spec's fixed development URL.

For spoken verification with Windows Narrator:

1. From Home, focus Online Play and press Down. Listen for Training Dojo, then Controls on the next Down. Enter Controls, switch to Sound, and press Escape. Listen for focus returning to Controls.
2. Enter a short room code and submit it. Listen for the validation status with focus still in the code field. Create a room, press Ready, and listen for the waiting message. Leave and check the Online Play focus announcement.
3. Open World Select, move from Neighborhood to Cathedral with Right, and listen for the focused world. Hover a different world or use a controller to browse and listen for a short preview status. Verify that keyboard navigation does not speak both the focus and status messages for the same move.
4. Open Dojo Pause, enter Visual Accessibility through the Settings tab, and press Escape. Listen for focus returning to Visual Accessibility. Check the selected tab announcement when switching tabs with Left or Right.

Spoken output remains open. After the Narrator pass, measure focus-ring contrast against adjacent colors and sample the remaining backdrop and control states.

## Focus outline and six-world contrast

Local Chromium on Windows checked 27 focused control and viewport combinations at 1280×720 and 640×360 in standard colors. Each measurement compared the rendered outline with the same pixels after making the outline transparent and with nearby pixels outside the outline. The lowest measured ratio was 9.14:1, on Enter Free Practice at 640×360. The run sampled the center portions of the four edges, so the result describes the sampled outlines. [WCAG non-text contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)

At 640×360 the fixed Home navigation hint covered part of the Accessibility button's outline, and the World Select scroll panel clipped the Random World outline at the bottom. Home now puts the hint in the scrolling menu, and World Select reserves scroll clearance around buttons. Keyboard arrows now start from the focused world even if a pointer preview changed the highlight. The rerun found the focus outline at every sampled point. All five keyboard regressions passed, including the compact Home and Random World case.

At 1280×720 the art pass decoded the six preview, intro, and result backdrops before measuring text against the rendered background. All 58 sampled text ranges met their thresholds. These are the minimums across the selected tile label, preview text, intro title and versus text, and result heading and details. [WCAG text contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum)

| World | Lowest sampled ratio |
| --- | ---: |
| Neighborhood | 7.45:1 |
| Cathedral | 7.53:1 |
| Factory | 7.63:1 |
| Circus | 7.86:1 |
| Banquet | 7.59:1 |
| Library | 7.59:1 |

Narrator is available on Windows, but this session did not have a way to capture and verify spoken output. Follow the spoken checklist above on the desktop and record the speech for focus return, status updates, and world previews. Physical Windows contrast themes are also open.

## Windows Narrator spoken results

Ran the checklist in a private Chrome 157 window against the local game and room server on Windows. Narrator Speech Recap showed the emitted spoken phrases. Narrator enabled scan mode in the browser and intercepted the game arrows while scan mode was on. Insert+Space turned scan mode off for the game's custom arrow navigation. Tab remained usable. [Microsoft Narrator commands and Speech Recap](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures)

| Flow | Observed speech and focus |
| --- | --- |
| Home and Settings | Down from Online Play announced Training Dojo and its description. Down again announced Controls. Opening Settings and switching to Sound focused and announced the Settings heading. Escape announced Controls again on Home. |
| Room validation and lobby | Narrator read the six-character room-code field label and “Enter a six-character room code.” The field retained focus. The lobby announced Copy Invite Link on entry. After Ready, Narrator spoke the document title, then “Waiting for other players.” Leaving the room announced Online Play. |
| World Select | Right from Neighborhood announced “The Drowned Cathedral of Teeth, toggle button, on” once. A pointer preview on Random World announced that the focused Cathedral toggle was off, then “Preview: Random world.” Escape announced Ready in Fighter Select. The next Escape announced Choose Fighters in Local Player Setup. |
| Dojo Pause | Opening pause announced Resume. The tab strip announced Session as selected, and Right announced Timing & Display as selected. Speech Recap showed the Timing & Display and Settings selected phrases twice during the tested tab changes. Escape from Visual Accessibility restored and announced the Visual Accessibility button in the Settings tab panel. |

The spoken focus restoration and requested status messages were observed. The pointer path supplied the unfocused world-preview check. Physical controller speech and physical Windows contrast themes were outside this run. Next isolate the repeated Dojo tab announcements, the preceding World Select deselection phrase, and the Ready focus handoff before repeating the affected speech checks.

## Narrator announcement refinement

Ready stays focusable while unavailable. The lobby rejects repeat activation while waiting. Speech Recap in Chrome 157 showed the setting and waiting messages without the prior document-title announcement. The keyboard regression verified that Ready retained focus after the server confirmed it and that Leave Room still returned focus to Online Play. The unit check verified that a second activation did not send Ready again.

World tiles use ordinary button semantics because activation chooses an arena. The visual preview highlight remains, including its forced-colors underline. Keyboard arrows move focus and update the preview without a separate status message. In Narrator, Right announced Cathedral, then a pointer preview announced “Preview: The Neighborhood That Ate Itself” without the previous Cathedral deselection phrase.

The Dojo experiment limited tab attribute writes to changed values and delayed pointer focus until selection. Narrator still spoke the selected Timing & Display phrase twice after Right and the selected Settings phrase twice after a click. The experiment was removed. Keep the selected tab state exposed while investigating whether a different activation model would improve spoken navigation.

Six Chromium checks passed on the final patch, including five keyboard cases and the two-client selection and reconnect flow. The room-focused unit suite passed all eight checks. Physical Windows contrast themes and controller speech remain open.

## Dojo tab activation comparison

Compared the existing automatic tab activation with an isolated manual keyboard prototype in Chrome 157 and Windows Narrator Speech Recap. With scan mode off, Right moved focus from Session to Timing & Display and produced one phrase identifying the focused tab. The Session panel stayed open. Enter opened Timing & Display and produced one separate selected-state phrase. Two more Right presses announced Recordings and Settings once each while keeping Timing & Display open. Space opened Settings and announced it as selected.

Manual activation separated the focus and selection phrases. It also required a second keypress to open each panel. The game keeps automatic activation, which opens a panel with one arrow press and exposes the selected state. The duplicate phrase in Narrator remains a known issue. The manual prototype was confined to the test checkout.

The physical Windows contrast-theme check was attempted next. Windows Settings opened, but permission to inspect the app timed out. No contrast theme was applied. For the next desktop run, record the starting theme, test one light and one dark theme, and restore the starting theme. Check that focus and selection are distinct in Fighter Select, World Select, and Dojo Pause, and that the lobby Ready status stays readable. Controller speech remains open.

## Native Windows contrast themes

Tested Chrome 157 in a private desktop window with the actual Windows Desert and Night sky themes. Windows started with Contrast themes set to None. Chrome updated to each system palette, including when the theme changed with the Dojo paused. Restored None and confirmed the game returned to its standard menu palette and the world diagram returned to its normal colors. [Windows Contrast Themes settings](https://learn.microsoft.com/windows/uwp/launch-resume/launch-settings-app#ease-of-access)

| Surface | Desktop observation in both themes |
| --- | --- |
| Room lobby | Waiting for other players remained readable after Ready. The waiting control stayed focused. Its outline was initially dimmed by the disabled opacity. The revised button retains its full-strength outline and uses the system disabled text color. |
| Fighter Select | The selected fighter label was underlined. Tab moved focus to a different fighter with a separate outline. |
| World Select | The previewed world was underlined and the focused tile had an outline. The platform diagram was faint in Desert with its original mint and gold. The revised diagram uses the system text color in contrast themes and was legible in Desert. |
| Dojo Pause | Session stayed selected and underlined while Timing & Display had the keyboard focus outline. |

The revised splash prompt was verified in Night sky. It uses the system text color at full opacity when a contrast theme is active. Two repeatable Chromium checks with light and dark forced colors passed for the splash, Ready, world diagram and distinct focus and selection cues. The first automation attempt did not expose the native forced-colors media state, so native results come from the regular desktop Chrome session. Browser emulation is separate evidence.

Next, verify Narrator prompts and navigation with physical controllers. The desktop pass also exposed a short-window Dojo library layout issue where its navigation hint overlapped the Free Practice heading. Track that separately from the contrast checks.

## Short-window Dojo and controller follow-up

At 740×560, Chromium measured the Dojo footer starting 190.19 CSS pixels before the end of the Free Practice content. The grid could shrink in the scrollable shell while its panels kept their intrinsic height. The grid now keeps its content height, and the footer scrolls after it.

The browser regression checked Free Practice and Guided Lessons at 740×560, 640×360, and 1024×400 in standard and forced colors. All 12 combinations kept the footer below the panels, kept both start actions reachable in their respective modes, and had no horizontal overflow. All six keyboard and layout browser tests passed. The Dojo setup and controller prompt unit suites passed four tests.

Physical-controller Narrator verification is pending because the user will test later. The unit tests cover profile labels and seat assignment. The physical run should check what is actually spoken when the user navigates and activates controls.

| Profile | Expected Confirm / Back | Expected pause and resume prompt |
| --- | --- | --- |
| Xbox layout | B / A | Start |
| Switch Pro | A / B | + |
| DualSense | Circle / Cross | Options |

With Narrator and Speech Recap open, use each pad to browse Home with the D-pad, enter Training Dojo, change lesson tiers, and pause and resume Free Practice. Record which control name is spoken as the highlight moves, the exact Confirm, Back, and Resume prompts, and whether a profile change leaves a stale label. Repeat with two different pads assigned to separate fighter seats. Record the model, browser, and USB or Bluetooth connection. The available newer Xbox pad does not sign off Xbox 360 hardware.

## Physical-controller Narrator result

On November 10, 2026, the user reported that the physical-controller Narrator checklist passed. Individual models, connection types, and spoken transcripts were not supplied. Extended hardware Dojo, mixed-seat, reconnect, and Xbox 360 signoff remain tracked separately.

## Dojo tab announcement fix

Dojo pause tabs now use manual activation. Arrow keys and the controller D-pad move focus across the tabs, and Enter, Space, or controller Confirm opens the focused panel. Clicking a tab moves focus directly to the heading in the opened panel. The original duplicate announcement is recorded above for reference.

In desktop Chrome with Windows Narrator, browsing to Timing & Display spoke its tab name once while Session stayed open. Pressing Enter then spoke the selected Timing & Display tab once. Clicking Settings after the pointer fix spoke the Settings heading once without repeating the selected tab name.

All seven menu browser tests passed, including keyboard and simulated D-pad navigation, pointer focus, and restoration to the Visual Accessibility opener. The native speech check for this change used keyboard and pointer. See the preceding section for the earlier physical-controller result.
