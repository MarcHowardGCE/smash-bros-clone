# Fighter and World Select redesign

Status: Implemented and deployed. Quality-96 fighter atlases are the verified Bluehost release default. Deployed spoken-output and contrast verification remain open for the redesigned selectors.

## Visual direction

Build the selectors as scenes from the same surreal arcade cabinet. Use oversized fighter silhouettes, ink-plum negative space, warm marquee lettering, and player-colored stamps. Let stage art set the palette on World Select. Reserve ornament for framing the action and feedback. Give the roster, selection state, and comparison text clear contrast at TV distance.

Use [Nintendo's Ultimate stage guide](https://www.smashbros.com/en_US/stage/index.html) as a reference for organizing a large stage catalog and [Bandai Namco's Tekken 8 roster](https://tekken.com/fighters) for character-first presentation. Use the approved game art as the visual source. The [previous menu polish plan](../MENU-POLISH-PLAN.md) records the existing accessibility and layout work.

## Fighter Select

- Replace repeated seat lists with one portrait grid. Each local seat owns a cursor and lock state. Overlapping cursors display seat labels, including mirrors. Online browsing and lock state follow the room's authoritative rules.
- Give two fighters a full-body face-off with large names and compact role labels. Design a four-seat composition up front and exercise the grid with ten entries to allow for the next pack.
- Keep side-by-side weight, run speed, jump comparison, and a strength and tradeoff visible. Read actual gameplay stats and use the same comparison scale for every fighter. Give longer details a separate view. Write fighter canon with the user when ready.
- Distinguish focus, preview, lock, unconfirm, and waiting states. Confirmation gets a brief signature pose, a readable player stamp, and an optional sound. Fast browsing cancels superseded motion and sounds. Use a quiet static state for reduced motion.

## World Select and versus

- Keep a single world grid or thumbnail strip within controller reach. Give the highlighted arena a large art preview, compact platform diagram, and current gameplay layout details. Keep the entire story visible without a reveal button or scrollbar inside the world panel.
- Use fixed preview geometry for named worlds and Random. Test the longest story and name at short heights. Reduce image height before sacrificing story space. Host and guest should see the same confirmed world and background variant, including Zanda's randomized art.
- Use a small set of world-specific motion accents after the static layout works. Prototype Zanda's rotating record or waveform and the Neighborhood's drifting background layers. Keep the landing diagram and text stationary.
- Carry the locked lineup, player colors, and selected world into the versus screen. Allow players to see loading, recoverable failure, and retry states. Start the countdown when required art is ready. Preserve focus, choices, and online ownership after retries or reconnect.

## Asset list

| Asset | First review | Full production |
| --- | --- | --- |
| Full-body selection art and portrait crop | Mr. Wrong and Mrs. Tasselbottom, using approved idle designs | Consistent art and crops for every shipped fighter, with clean alpha and enough room for both facings |
| Scene framing and lock-in marks | One illustrated arcade frame, seat stamps, and a Random tile | Shared artwork for local, online, and versus with distinct focus and lock silhouettes |
| World art and motion | Neighborhood and Zanda using existing stage art | Menu-sized derivatives for all worlds, optional isolated layers where motion adds depth |
| Sound | Focus, confirm, unconfirm, and versus transition | Short consistent cues with volume and mute support. Review announcer callouts separately |

Use menu-sized derivatives and load focused art on demand. Keep the combat atlases out of roster browsing. Test focus under rapid navigation and cold cache. Review the two sample fighters for palette, scale, and silhouette before producing the remaining portraits.

## Delivery and signoff

1. Capture the existing local and online selections at 1080p and 720p, plus a short window. Prototype the shared grid, two-fighter composition, and comparison panel in game with existing art. Review still frames and a short controller-navigation recording before commissioning new assets.
2. Verify independent cursors and confirmations with two to four seats. Cover mouse, keyboard, Xbox layout, Switch Pro, and DualSense. Check overlapping cursors, back navigation, disconnect and reassignment, CPU slots, and online guest readiness. Test reduced motion, screen-reader announcements, focus restoration, contrast, and TV-distance legibility.
3. Approve the two fighter asset samples and roll out the shared art treatment. Review every tile and hero portrait on light and dark backgrounds and in the four-seat layout. Keep names and meaningful state labels as readable UI text.
4. Prototype World Select with the Neighborhood and Zanda. Expand to all ten worlds after the short-window, full-story, Random, host/guest, and variant continuity checks pass.
5. Add the versus transition and run a clean production build. Compare cold and warm times for menu entry and first playable match against the baseline at 8 Mbps. Verify that rapid browsing stays responsive and that an interrupted atlas blocks countdown until retry succeeds. Record separate automated, physical-controller, and deployed-host results.

Open creative choices for the prototype review are how ornate the cabinet framing should be, whether lock-in uses a print stamp or a marquee flash, and whether versus needs an announcer. Start with the shared-grid Fighter Select prototype so those choices can be judged in motion.

## First playable prototype

Local Fighter Select now uses one shared roster grid with seat-colored cursors, ready marks, two full-body portraits, and a live comparison of the inspected seat and next seat. Mouse selection follows the inspected seat. Existing keyboard and gamepad handlers continue to control their assigned seats. Browser smoke checked eight tiles, overlapping cursors, independent mouse choices, and Mr. Wrong versus Mrs. Tasselbottom stats at 1920x1080, 1280x720, and 960x540. Eleven focused selection tests passed.

Next, review the prototype in motion and verify independent controller navigation and the three- and four-seat layouts. The prototype uses existing art and local selection. Online presentation, dedicated portraits, World Select, and versus are subsequent milestones.

### Multi-seat prototype review

Three- and four-seat selections now show a compact full-body portrait for each seat beneath the featured comparison. Browser checks passed at 1280x720 and 960x540 for both player counts. The automated controller test assigned two simulated pads to different seats in a four-seat lobby, verified independent browsing, overlapping cursors, confirmation, and unconfirm. Physical-controller review remains open.

Next, create and review the two dedicated selection-art samples for Mr. Wrong and Mrs. Tasselbottom. Then carry the shared visual language into online fighter select and World Select.

The multi-seat card fix gives the identity the full card width and puts the status and Ready button underneath. This prevents the long P1 confirmation hint from collapsing the fighter name into a narrow column.

### Dedicated portrait samples

Mr. Wrong and Mrs. Tasselbottom have dedicated full-body hero illustrations and separate head-and-shoulder tile crops in the local face-off. The samples use the approved idle costumes, shared hand-inked poster treatment, and transparent backgrounds. The four WebP files total 325,656 bytes. The picker requests the small tile crops for the grid and loads the hero portraits when featured. All four images decoded in the local browser at 1920x1080, 1280x720, and 960x540.

Review the two sample portraits in game before extending the treatment to the remaining fighters. Online and versus adoption follow the portrait style review.

### Local portrait rollout

All eight fighters now have 640-pixel-tall transparent hero art and separate 144-pixel roster tiles in the same hand-inked style. Loopy retains his blank jersey. All tiles and all eight featured portraits decoded in the local picker at 1920x1080, 1280x720, and 960x540. Next, adapt the face-off and portraits to online selection and verify host and guest lock-in states.

### Online face-off

Online Fighter Select now shares the local face-off composition and portrait assets. The opponent portrait follows their reported fighter choice. The shared grid shows each seat's reported lock state, and browsing cannot change the featured local fighter while confirmation is pending or locked.

Two local two-client rooms verified opponent portrait updates on both sides, host lock and unlock reflected on the guest, final confirmation and stage selection, packaged sprites in live play, and guest refresh returning to the same seat. The browser used the local development client and a production-mode server. Next, prototype World Select using the Neighborhood and Zanda and verify story layout and variant continuity.

### Arena-first World Select prototype

The local and host selector now uses a large arena artwork backdrop at desktop sizes, with a readable overlay for the full story and platform diagram. Short windows use the compact story-first layout. Browser checks covered the Neighborhood, Tuesday, Zanda, and Random at 1920x1080, 1280x720, and 960x540. The preview stayed the same height within each viewport and the checked stories fit without an inner scrollbar. In all three runs, the confirmed Zanda menu image matched the background requested by the live stage. Five focused selection tests passed.

Next, review all ten worlds and bring the arena treatment to the online guest preview. Verify host and guest see the same Zanda variant through confirmation and into the match before adding motion accents.

### Online guest arena preview

The guest preview now uses the same arena-first art and story treatment as the host at desktop sizes and the existing compact layout in short windows. A local two-client room browsed all ten worlds at 1280x720 and 960x540. Every story fit within the visible preview, with no inner scrollbar or preview-height change. Host and guest showed the same Zanda Broadcast preview, then both loaded that background into the live match.

Next, prototype subtle world motion for the Neighborhood and Zanda with a static reduced-motion presentation, then carry the locked portraits into the versus transition.

### World preview motion

The Neighborhood gets a slow artwork drift and Zanda gets a restrained gold light sweep. Both use existing artwork with no extra downloads. Motion is limited to the desktop arena view and disabled under reduced motion. Browser checks at 1920x1080, 1280x720, and 960x540 verified the expected animation or static state and stationary story bounds. Next, use the locked lineup portraits and confirmed arena in the versus transition.

### Versus transition

The match intro now uses the dedicated full-body selection art, player-colored seat accents, and the confirmed world variant as its background. A brief entrance motion respects reduced motion. Local browser checks at 1280x720 with two seats and 960x540 with four seats held one fighter atlas request and verified that Loading arena stayed visible until release, then countdown and live play followed. An online two-client check verified matching Zanda artwork and loaded full-body portraits in both intros before the match.

Next, run cross-screen accessibility, controller, and cold-load signoff on a production build, including the existing online artwork failure and retry path.

### Local production signoff

The production build passed. Browser checks covered keyboard roster browsing, visible world story, focus returning to Ready after backing out of World Select, and reduced-motion versus. The focused controller tests exercised simulated device prompts and independent seats. An older prompt assertion still expected the removed Story control and was updated. All 15 focused tests passed.

At 8 Mbps and 80 ms latency, selecting Choose Fighters opened the roster in 67 ms with cache disabled and 36 to 46 ms on subsequent cache-enabled runs. Mr. Wrong versus All-Rounder on Zanda took 45.28 seconds from initial lineup confirmation to live play with cache disabled and 5.99 to 6.64 seconds on subsequent runs. The scenario includes backing out of World Select once, returning to Ready, and the countdown. Cold atlas transfer was 25.66 MB versus 2.1 KB of transfer reported on each cache-enabled run. This is a single-lineup local test.

In a separate built-client online test, aborting the guest's Mr. Wrong atlas page displayed the artwork failure, held countdown, and allowed the same Mr. Wrong and Loopy lineup to start after retry. Physical-controller and screen-reader review of the redesigned screens, contrast over the new artwork, and deployed-host signoff remain open.

### Animated fighter previews

Local and online Fighter Select use compact WebP derivatives of the gameplay idle clips for the two featured fighters. All eight fighters now play four gameplay frames at the source cadence with registered feet. Revision 43 supplied the three Pack 03 loops and retired the temporary menu-only breathing motion. Reduced motion uses the illustrated hero portraits. Roster tiles and versus use the illustrated assets.

Regenerate the derivatives with `node scripts/assets/build-selection-idles.mjs` from the repository root when an idle clip changes. The build verifies frame counts. Browser checks cycled all eight previews at 1920x1080, 1280x720, and 960x540.

Fighter Select idle derivatives for Pack 02 use the original idle sheets. Pack 03 uses the four-cell idle-loop source sheets. Build from these sources before the gameplay atlas downsizes them. The five updated previews have four frames at approximately 360 pixels tall.

Local Fighter Select shows one full-body idle preview per seat in three- and four-player lineups. Reduced motion uses a still portrait. Fighter comparison stats remain available with the shared roster. Browser checks at 1280 × 720 confirmed that three and four animated previews load and render.

### November 13 Render release verification

Tested the deployed client bundle index-BbKs5JYs.js in Chromium at 1280 × 720. Three- and four-seat local lineups rendered the corresponding number of animated previews within the viewport. All eight fighter idles decoded and appeared as the selected preview in both layouts, at 360–361 source pixels high. Four still portraits loaded with reduced motion. The accessibility tree exposed named player-seat controls and selection state. Keyboard confirmation and Back restored focus to P1 Ready. All ten named worlds exposed visible story text without a clipping or scrolling ancestor inside the preview.

At 8 Mbps with 80 ms configured latency, local setup to Fighter Select took 69 ms with cache disabled and 36 and 33 ms with cache enabled. Lineup confirmation to live play, including a Back and reconfirm step and the countdown, took 47.56 s with cache disabled (28.38 MB in atlas transfer) and 6.78 and 5.98 s with cache enabled. The cold result remains a performance issue. The two-client retry blocked countdown after a deliberately interrupted Pack 03 atlas request. The guest displayed the alert 81 ms after the intercepted reset on the successful rerun. Reconfirming the same lineup fetched the atlas and both clients entered play. An initial run used a 25-second match timeout, which was too short for cold transfer.

This verifies the requested hosted flows and automated accessibility behavior at the tested viewport. Spoken screen-reader output and full contrast measurement on the latest deployed artwork were not rerun.

### November 17 cold-load budget

The recorded Render cold run transferred 28.38 MB of fighter atlases.
At 8 Mbps that transfer alone needs about 28.4 seconds at line rate,
compared with the measured 47.56 seconds through countdown. The
scenario also includes Back and reconfirm, so the remaining time
cannot be attributed to decoding from this measurement. In the
local production build, the two largest Mrs. Tasselbottom live pages
total 12.18 MB. Next, measure a direct-confirm run and record atlas
transfer, decode readiness and countdown separately. Use that split
to evaluate loading opening-match poses first while retaining the
countdown and retry checks.

#### Direct-confirm hosted timing

A fresh Chromium context with cache bypassed at 8 Mbps and 80 ms
latency confirmed Mr. Wrong versus All-Rounder once and selected
the first arena. From lineup confirmation, stage selection took
0.91 s, the last atlas response completed at 45.08 s, and the
match phase appeared at 49.22 s. Eight atlas responses transferred
28.39 MB including response overhead. The remaining 4.14 s covers
any decode, preparation and countdown after the final transfer.
The exposed match snapshot did not yield a separate countdown
boundary in this run. Next, timestamp the visible countdown and
instrument decoded-art readiness in the local production preview.

#### Local production transfer and decode split

On November 17, a direct-confirm run on the local production server
used the same Mr. Wrong versus All-Rounder lineup, first arena,
cache bypass, 8 Mbps and 80 ms latency. The eight atlas response
bodies finished by 44.219 s after confirmation. The last bitmap
decode finished at 44.282 s, the visible countdown began at
44.285 s, and live play was observed at 48.362 s. The slowest
individual atlas decode took 63.2 ms. This single run identifies
transfer as the measured bottleneck. Next, evaluate a smaller
opening artwork payload while preserving complete fighter rendering
and the same-lineup retry behavior.

#### Atlas compression trial

Encoded all seven fighter pages from the measured lineup in memory,
keeping the original atlas dimensions and using WebP alpha quality
100. Quality 96 reduced the fighter payload from 28.26 MB to
14.30 MB (49.4%). Quality 92 reduced it to 12.77 MB (54.8%).
The shared effects page was outside the trial. These are encoder
measurements, with no runtime or visual result yet. Next, compare
quality 96 with the lossless originals at gameplay scale and zoom,
including thin outlines and translucent edges, then time a local
production build if the comparison passes.

Quality 96 preserved every decoded alpha pixel on the seven sampled
atlas pages. A side-by-side review of idle, jab, wall tech and throw
victim crops for both fighters showed no obvious outline or halo
difference on light and dark backgrounds at the tested scales.
This is a two-fighter sample. Next, build an isolated quality-96
production candidate and retest cold transfer and artwork retry.

#### Isolated quality-96 production candidate

A separate local build recompressed only the seven fighter pages
for Mr. Wrong versus All-Rounder. At 8 Mbps, 80 ms latency and
cache bypass, eight atlas responses transferred 14.43 MB including
the shared effects, the final transfer finished at 30.30 s, and
live play began at 34.50 s. The lossless local run took 48.36 s
to live play. These are single runs.

In a two-client match, intentionally aborting the guest's Mr. Wrong
atlas produced the artwork alert in 31 ms. Neither client had a
match snapshot at that checkpoint. Reconfirming the same lineup
and arena brought both clients into live play. The test sampled
the failure checkpoint and the recovered match. Next, add a
repeatable production encoder path and expand visual and retry
coverage before changing the default build.

#### Repeatable quality-96 build

Set SMASH_ATLAS_QUALITY_96=1 and run
pnpm -F @smash/client exec vite build --outDir dist-quality96
to create an isolated trial. The opt-in recompresses live fighter
WebP pages and validates dimensions and exact alpha before writing
each smaller page. The default build uses the existing encodes.
The trial uses distinct page URLs with a -q96.webp suffix.

The isolated build passed and reduced 26 live pages by 50.51 MB
across the original fighter pack and Packs 03 and 04. This is
aggregate build output, not a per-match download. Next, review
representative poses from each pack and repeat cold-load and retry
checks with the repeatable build.

#### Quality-96 two-client Pack 04 comparison

At 8 Mbps and 80 ms latency in fresh local production browser
contexts, Zane versus Velvet reached live play in 15.20 s from
arena selection with the opt-in output versus 21.28 s with the
default output. Navigation to live took 29.95 s versus 36.20 s.
These were single cold runs. The interrupted-atlas trial raised
the guest artwork alert in 497 ms, kept both clients out of live
play at the failure checkpoint, and loaded the same lineup after
reconfirmation. Both opt-in cases and the baseline case passed.
Broader visual review remains open.

#### Quality-96 roster sample review

Compared 24 idle, jab and throw-victim crops for the eight fighters
in the affected production packs, at a 120-pixel review scale on
light and dark backgrounds. No obvious halo or loss of outline
readability was visible in the samples. Moonshine and Hoagie use
the newcomer pack, which this encoder option leaves lossless.
This review sampled three poses per affected fighter. Before a
hosted trial, give the opt-in pages distinct URLs so browsers
can distinguish them from the existing lossless pages.

#### Quality-96 cache separation

The opt-in build now gives each recompressed page a -q96.webp
suffix and updates the page list and clip/frame references before
generating the Brotli manifest. The build passed and all references
resolved across the three packs, including all 26 renamed pages.
At 8 Mbps the two-client retry passed using the new filename.
The alert appeared 432 ms after the reset. The same lineup reached
live play 14.13 s after arena reselection. Next is a hosted trial
with cold and warm cache checks.

#### Bluehost quality-96 staging rehearsal

Built the opt-in client with the Render online endpoint and staged
it with the Bluehost packaging script from the isolated build
directory. All 26 renamed pages were included, all fighter frame
references in the three affected production manifests resolved,
and each Brotli copy matched its JSON. This local rehearsal used
working-tree output. An artifact from the eventual release commit
should carry that commit's release marker before publication.
Hosted cache and retry verification remain pending.

The Bluehost release workflow now exposes the boolean
atlas_quality_96 input for manual runs. It defaults to false.
The checked-out revision supplies the artifact release marker.
A main-branch manual run follows the existing publication gate,
so enabling the option there can publish the trial to the public
client. Push and pull-request builds use the default encoder.

#### Hosted quality-96 release verification

Release run 44109419351 published commit 12438e9 to Bluehost.
The public Pack 04 manifest listed all four -q96.webp pages.
At 8 Mbps and 80 ms latency, the cold Zane versus Velvet online
match took 15.35 s from arena selection to live play. The
interrupted guest atlas alert appeared 397 ms after the reset.
Both clients stayed out of live play at the failure checkpoint
and the same lineup entered play 13.36 s after arena reselection.
A separate Zane local-match replay in the same browser context
took 24.48 s cold and 4.98 s warm from arena selection. These
single runs use different lineups and cannot be compared across
modes. Regular releases still default to the original encoder.

#### Hosted comparison for the original lineup

At 8 Mbps and 80 ms latency, Mr. Wrong versus All-Rounder on the
first arena reached play 28.08 s after direct lineup confirmation
in a fresh Bluehost browser context. Repeating in the same context
took 5.73 s. Both runs requested seven quality-96 fighter pages.
Chromium reported 13.70 MB of total atlas transfer cold and
0.73 MB warm. The prior direct-confirm Render run for the same
lineup took 49.22 s and transferred 28.39 MB. The comparison spans
hosts and uses one run per cache condition. Next, decide whether
to make quality 96 the release default based on the visual and
retry checks already recorded.

#### Quality-96 release default

The Bluehost workflow now selects quality 96 for push and pull
request builds. Manual runs default to the same setting and can
uncheck atlas_quality_96 to publish the original encodes through
the existing release gate. Local builds still require the opt-in.
The first automatic release passed and published d414a39 after a stalled test run was cancelled and retried.

#### Automatic quality-96 release signoff

The retried automatic run 44120387330 passed client checks and
publication. Bluehost served d414a39 and listed all 26 quality-96
pages across the three affected packs. At 8 Mbps, the cold Zane
versus Velvet online match reached play 15.25 s after arena
selection. The guest interrupted-atlas alert appeared in 48 ms,
and retrying the same lineup reached play 15.33 s after arena
reselection. Both two-client checks passed. These are single runs.

### Current remaining selection signoff

The selector implementation and quality-96 loading release are
deployed. Hosted keyboard, reduced-motion, multiplayer layout and
artwork retry evidence is recorded above. The next outstanding
selector checks are deployed spoken announcements and focus
restoration with Narrator, followed by contrast on the redesigned
fighter and world screens. Use the current Bluehost release for
those checks and record their scope separately from the earlier
menu accessibility pass.

#### Selector accessibility implementation preflight

On November 17, ten local selector tests passed across stage
selection, fighter interactions and roster integration. The world
selector names each tile, provides a preview status region, and
moves focus to the selected tile on keyboard navigation. Fighter
comparison values use a polite live region. These are implementation
checks. They do not verify actual spoken output or contrast over
the deployed artwork. Next, inspect the public browser accessibility
tree and rendered colors before the native Narrator pass.

#### Deployed selector accessibility tree and color sample

On November 17, Chromium on the public Bluehost client exposed
the fighter comparison as a named table with column and row
headers. World Select exposed all ten named worlds, Random and
the layout description. Keyboard Right moved focus from Neighborhood
to Cathedral. The preview status stayed empty during that keyboard
move, with the focused button providing the world name.

Sampled computed panel colors gave contrast ratios of 10.25:1 for
gold comparison text, 14.36:1 for cream stat values and about 9.95:1
for story text against the underlying dark story panel color.
These calculations cover sampled panel text, not image pixels,
focus outlines, all states or actual spoken output. Next, inspect
focus restoration on Back and rapid navigation announcements
before the native Narrator check.

#### Deployed focus restoration check

On November 17, World Select focused its first named world after
opening. Repeated keyboard Right navigation kept the focused world
and preview title consistent. Escape restored focus to Fighter
Select's Ready button, and backing out again restored Choose
Fighters in local setup.

Initial Fighter Select entry left browser focus on BODY. A keyboard
Right input also left browser focus there, despite the visual
selection controls being present. This needs a focused entry control
before native Narrator signoff. Next, set initial local Fighter
Select focus to the selected fighter tile and verify keyboard
navigation updates the focused tile as well as the visual choice.

Local Fighter Select now focuses the first roster tile on entry,
or the existing choice when reopening. Arrow browsing focuses
the selected tile. Enter on a roster tile still confirms the
keyboard seat. Ten focused interaction and integration tests
passed, including a regression for entry focus, browsing and
Enter confirmation. Deployment and native Narrator review remain.

#### Hosted fighter focus fix verification

The automatic release passed and Bluehost served 4a24dc7.
Browser keyboard checks focused All-Rounder on entry, moved focus
to Abe Lincoln with roster browsing, confirmed with Enter and
opened World Select. Escape restored the Ready control on Fighter
Select. Actual Narrator speech remains pending.

#### Native speech verification handoff

The Windows automation surface can inspect app accessibility trees
and send input, but the available API provides no system-audio
capture or Narrator speech transcript. Native spoken-output signoff
therefore remains unverified. On deployed 4a24dc7 or newer, check
the initial focused fighter name, successive roster names while
browsing, Enter confirmation, the first world name, and the Ready
control after Escape. Listen for duplicate or stale names during
rapid browsing and compare against the visible selection.

#### Deployed keyboard focus contrast sample

The focused fighter and world buttons display a two-pixel mint
outline and match :focus-visible after keyboard navigation.
Against their computed solid fills, outline contrast was 8.16:1
and 9.14:1 respectively. Cream text on those fills measured
10.27:1 and 11.49:1. World captions shared the cream text color.
This sample checks selected button fills. It does not measure
every artwork pixel, hovered state or outer outline adjacency.
Native Narrator listening remains pending.

#### World caption artwork contrast correction

A conservative pixel scan of the full hovered caption rectangles
on the public ten-world selector found bright pixels with contrast
as low as 1.01:1 against the cream caption text. This full-rectangle
method does not identify which pixels are directly behind glyphs.
Added an opaque dark caption strip to prevent artwork from affecting
the label background. Verify rendered caption contrast locally and
on the deployed revision before closing the artwork contrast check.

Previewed the new strip by applying the exact CSS in a fresh
public-browser session. Labels fit the ten-world layout. Nine
hovered caption interiors measured 15.06:1; the focused first
tile's rectangle still included a brighter boundary at 1.74:1.
That rectangle result does not establish contrast directly behind
the text. Keep focus-boundary contrast separate from label-fill
contrast during the deployed review.
