# Fighter and World Select redesign

Status: Planned. First deliverable is an in-game Fighter Select prototype with existing art.

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
