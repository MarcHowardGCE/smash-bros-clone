# Active work and signoff

This index records where each workstream stands and what to do next. Detailed decisions, measurements, and test evidence belong in the linked documents. Older next-step notes are historical when superseded by this index.

**Current movement checkpoint — November 20:** Local release preflight complete. Fixed late throw cues covering predicted takeoff;40 fresh-action cases/80 client checks passed under input delay and snapshot jitter. All package checks passed (final client1,220), production build/staging succeeded, ten-fighter production roster and online retry/reconnect smoke passed. Next: reviewed commit/CI, coordinated deployment, then hosted revision and smoke verification. Broader parity work remains separate. [Release checklist and exact evidence](ANIMATION-RELEASE-2026-11-20.md). Older checkpoints are historical.

| Workstream | Status | Next action and completion evidence |
| --- | --- | --- |
| Star KO and camera | Star KO handoff is implemented. Real Dojo launches passed for all five fighters at standard and tall sizes. | Ten focused renderer tests passed on rerun. Native signoff is blocked on unavailable 13.0.5 footage for straight and angled launches. Handoff, shrink, and twinkle timing stay provisional. [Star KO audit](../TRAINING-DOJO.md#continuous-star-ko-handoff) · [Capture protocol](../TRAINING-DOJO.md#straight-and-angled-star-ko-capture) |
| Gameplay and Ultimate parity | The 13.0.5 capture checklist is ready. The focused engine and server rerun passed 451 checks with 13 existing ledge skips. The Dojo preflight verified all 20 roll comparisons across five fighters. | Awaiting human testing. Log the Dojo pass for all five fighters and the ten unique matchups, then reproduce any flagged exchanges before tuning. The public evidence review and targeted local rerun are recorded. Native signoff for all five timing fixtures is blocked on unavailable 13.0.5 captures. Current timings stay provisional. [Evidence review](../REFINEMENT.md#november-10-evidence-review) · [Capture checklist](../REFINEMENT.md#ultimate-1305-capture-checklist) · [Human feel pass](../REFINEMENT.md#next-human-feel-pass) · [Playtest log](../REFINEMENT.md#human-playtest-log) |
| Fighter and World Select redesign | Local and online face-off, eight portraits, arena-first world previews, and versus are implemented. Local production smoke passed. | Hosted preview, multiplayer layout, keyboard, reduced-motion and retry checks passed. Quality-96 automatic release d414a39 passed hosted cold-load and artwork retry checks. The original two-fighter lineup took 28.08 s cold and 5.73 s warm on Bluehost at 8 Mbps. These are single runs. Deployed spoken output and contrast verification remain open. [Loading release signoff](SELECTION-REDESIGN.md#automatic-quality-96-release-signoff) [Hosted results](SELECTION-REDESIGN.md#november-13-render-release-verification) [Selection redesign plan](SELECTION-REDESIGN.md#local-production-signoff) |
| Menus and accessibility | Native contrast, compact Dojo layout, and spoken keyboard checks passed. The user reported a pass on the physical-controller Narrator checklist. | Fixed the duplicate Dojo tab announcement and verified speech in desktop Chrome with Narrator. World stories now show without a toggle or scrollbars. Local ten-world responsive checks and all ten guest checks passed. [Stage 10 evidence](../assets/ZANDA-INFINITY.md#verification-and-handoff) [Story layout](../MENU-POLISH-PLAN.md#world-stories-without-scrollbars) Recheck changed menus during future releases. [Tab fix](../MENU-POLISH-PLAN.md#dojo-tab-announcement-fix) · [Hardware result](../MENU-POLISH-PLAN.md#physical-controller-narrator-result) |
| Production loading | Render passed 8 Mbps reconnect in both cache modes and same-lineup atlas retry. After deployment, the alert appeared in a median of 3.12 s from arena confirmation and 0.88 s from the reset. All three trials held the countdown and recovered. | Quality-96 atlases are the Bluehost release default. Public manifests and two-client retry passed on d414a39. Continue measuring cold load on future releases and capture provider timing evidence if the first-byte delay recurs. [Atlas release signoff](SELECTION-REDESIGN.md#automatic-quality-96-release-signoff) [Hosted early-alert signoff](../MENU-POLISH-PLAN.md#render-early-alert-signoff) |
| Controller hardware | Xbox-layout, Switch Pro, and DualSense profiles passed simulated checks. Initial physical menu tests were reported as fine. | Log extended physical Dojo, mixed-seat, and reconnect checks with device model, browser, and USB or Bluetooth. The newer Xbox controller does not establish Xbox 360 hardware signoff. [Controller verification](../REFINEMENT.md#three-profile-dojo-and-mixed-match-verification) |
| Online release readiness | Clean Linux container build passed. The updated Render release passed local art loading, two-client movement, live and paused refresh, reconnect, resume, and confirmed leave. | Private reconnect credentials passed the Render two-client smoke. Live refresh took 2.36 s and paused refresh took 1.75 s. Resume and confirmed Leave passed. Repeat the hosted smoke on future releases. [Render reconnect signoff](../guides/DEPLOYMENT.md#render-reconnect-signoff) · [Release evidence](../history/clean-checkout-verification.md#post-deploy-render-rerun) · [Deployment](../guides/DEPLOYMENT.md#post-deploy-smoke-test) |
| Fighter, world, and Dojo content | Ten fighters, ten static world layouts, and 41 guided lessons are integrated. The expanded curriculum passed all 410 fighter-by-lesson cases on November 17. | Packed frame, continuous playback, and close and wide contact checks passed. Fixed newcomer ledge timing. Throw-release visual signoff passed after fixing both art packs. All 80 baseline throws, all 47 delayed regressions, and eight verified opposite-facing throws passed in both clients. [Throw-release verification](../assets/ULTIMATE-ANIMATION-CHECKLIST.md#throw-release-fix-and-two-client-verification) Active grab escape, priority, and grounded release art passed in the Dojo and a two-client match. Break a grab passed keyboard, simulated stick, and airborne checks. The provisional 60-tick regrab window passed engine, Dojo, and two-client verification. Delayed input tests passed for escape, pummel and throw priority, and the regrab boundary. Physical-controller and native 13.0.5 signoff remain open. Fighter canon and proposed world events remain separate. [Active escape verification](../assets/ULTIMATE-ANIMATION-CHECKLIST.md#active-grab-escape) · [Current inventory](../assets/ULTIMATE-ANIMATION-CHECKLIST.md#current-five-fighter-inventory) · [Regrab and controller signoff](../TRAINING-DOJO.md#regrab-protection-and-controller-signoff) · [Delayed-input results](../TRAINING-DOJO.md#delayed-input-grab-escape-and-regrabs) |
| Zanda Infinity / Stage 10 | Selectable without a gate; three synchronized backgrounds, supplied vinyl platforms, story, and music integrated. Local, online/rejoin, Dojo, responsive menu, and production build checks passed. | Human readability/recovery and music-loop review, then deploy client and server together and run the hosted smoke. [Integration and evidence](../assets/ZANDA-INFINITY.md) |
| Arenas 07–09 | Three static layouts, illustrated platforms, and the supplied music are integrated. | Review match readability, recovery, and the browser music seams in human play. [Arena art and layout handoff](../assets/ARENAS-07-09.md) |
| Fighter Packs 03 and 04 | Pack 04 is deployed. Both fighters meet pose-count targets for all 139 shared clips. All 56 Pack 04 Dojo checks passed. | Hosted 8 Mbps cold load and same-lineup artwork retry passed. Floor and taunt alignment were reviewed locally. Hosted back-throw verification passed on 3cf9c2c. Live visual signoff for the remaining brief paired and recovery transitions is open. [Remaining release checks](FIGHTER-PACKS-03-04.md#pack-04-remaining-release-checks) [Hosted results](FIGHTER-PACKS-03-04.md#pack-04-hosted-8-mbps-verification) · [Pack 03 and 04 history](FIGHTER-PACKS-03-04.md) |
| Documentation | Refresh complete. Current guides, dated evidence, and active priorities are separated. Contributor instructions and the PR checklist now require documenting relevant changes. | Run the portable link and heading check for documentation edits and verify changed guidance against the implementation during review. [Maintenance rule](DOCUMENTATION-REFRESH.md#maintenance-rule-for-future-changes) · [Documentation check](../guides/TESTING.md#documentation-links-and-headings) · [Clean-checkout rehearsal](../history/clean-checkout-verification.md#documentation-refresh-step-4-clean-checkout) |
| Client regression gate | Closed. The shared Pixi startup fixture, local flow expectations, and controlled Dojo clock comparison passed. | Fresh clone with the test fixes applied passed all 884 client tests and the full workspace gate with 2,804 passes, 17 existing skips, and zero failures. [Repair and rerun](../history/clean-checkout-verification.md#client-regression-gate-follow-up) |

When updating a row, record the new status, the next observable action, and the evidence that supports the change. Label results as automated, human, local production preview, deployed, or version-matched reference evidence as appropriate.

## First-pass documentation validation

The workspace build passed using committed atlases, with the client output isolated from the normal build directory. The workspace type check passed, Playwright discovered 270 cases, and 84 relative documentation links and anchors resolved. Browser smoke checks passed for local match play, opening the Star KO lesson from Home, and two-client Stage 6 selection and guest rejoin. A clean-checkout install and hosted deploy were outside this pass.

The existing [online-selection browser spec](../../apps/client/e2e/online-selection.spec.ts) reached the match and failed on its stage-art assertion. It reads the old background container and expects a PNG. The direct browser check verified Stage 6 in the server snapshots and the WebP artwork on the current backdrop layer before and after rejoin. Update the spec to assert the current layer and asset before relying on that suite for signoff.

## November 10 follow-up from jersey verification

The broader client run exposed one stale World Select controller-prompt assertion in apps/client/src/ui/__tests__/controllerPrompts.test.ts: it still expects the removed Story toggle prompt. Results were 902 passed and one failed. Update that menu expectation in a separate follow-up; Loopy art verification passed and no menu code was changed for the jersey correction.

## Animation parity across the roster

Pack 03 revision 49 has expanded locomotion, crouch, jump, fast-fall and teeter. All eight fighters now have six shield raise and six shield drop drawings per fighter. The jab audit found a 48-drawing gap against the 9 / 6 / 6 target. Pack 03 Jab 1 is now at nine drawings per fighter. Dojo contact and buffered chain checks passed. Jab 2 and 3 now have six drawings across all eight fighters. Ten Dojo chain cases verified live contact in both facings. The damage-reaction inventory sets four-pose targets for high, mid and low hits and six-pose targets for heavy and air hits. High, mid and low reactions now have four drawings per fighter, with 30 Dojo cases passing. Heavy and airborne reactions now have six drawings per fighter. Twenty Dojo cases passed. All six airborne poses passed at 50%. Tumble recovery now has six drawings per fighter and passed ten stepped Dojo cases. Hoagie and Moonshine now have six knockdown and four prone drawings per orientation, with eight stepped Dojo cases passing. Mr. Wrong now meets the same pose targets and passed four stepped Dojo checks. Loopy also meets both pose targets and passed four stepped Dojo checks. Mrs. Tasselbottom passed four stepped Dojo checks, completing roster-wide knockdown and prone drawing parity. Pack 02 jab locks now match the four-pose roster target. Moonshine now has six trip-fall and four seated poses with both facings verified in the Dojo. Hoagie also meets both pose targets and passed the stepped Dojo get-up handoff checks. Mr. Wrong now meets both trip pose targets. Loopy now meets both trip pose targets. Mrs. Tasselbottom passed both stepped Dojo cases, completing the roster trip drawing targets. Twenty normal-speed trip initiation and exit checks passed for Packs 02 and 03. All eight fighters now have two launch poses per fighter. Ten stepped live-hit cases passed in Packs 01 and 02. All eight fighters now have four distinct tumble drawings. Six stepped Dojo cases verified the original trio rotation. The paired-action and ledge inventory is current. Footstool playback and socket selection now share one selector. All 36 Pack 03 contact cases passed. Moonshine now has six drawings in all three footstool clips, with mixed-pack contact verified. Pack 02 now meets the six-pose targets and passed 24 live cases. All eight fighters now meet the six-pose footstool targets. Pack 03 passed 24 mixed-pack Dojo cases. The live grab routing audit found fixed newcomer pose slots. Holder playback and grip lookup now share one index. Twenty-six Dojo hold cases passed. Moonshine has four poses for both sides of the hold and passed six sustained Dojo cases. Both Pack 02 fighters now have four poses on each side of the hold. Mr. Wrong now has four poses for both roles and passed six sustained Dojo checks. Loopy passed six four-pose hold checks. All eight fighters now meet the four-pose paired hold targets. Three 100 ms delayed online holds showed four poses for both roles on both clients, with zero sampled horizontal grip error. Hoagie and Moonshine passed both-facing Dojo mirror checks with six holder and four victim pummel poses each. Mr. Wrong also passed both-facing Dojo mirror checks. Loopy passed both-facing Dojo mirror checks with six holder and four victim poses. Mrs. Tasselbottom passed both-facing mirror checks, completing the pummel pose targets across Packs 02 and 03. Six normal-speed mixed-size pummel replays passed. Current atlas counts show 89 grab, release and throw pose gaps and 82 ledge pose gaps. Pack 03 grab drawing targets are complete. Pack 02 now meets all three six-pose grab targets and passed eight standing grab checks. The existing dash and pivot routes passed four normal-speed Dojo checks for acquisition and whiff recovery. The live route audit identified eight release pose additions. All eight release pose gaps are packed and ten grounded Dojo checks passed. Ten airborne Dojo release checks passed through landing. All five newer fighters have four victim poses per throw direction and passed 20 quarter-speed Dojo cases. Forty gameplay-speed replays verified directional victim playback in both facings. Next close 36 holder pose gaps and measure release alignment and launch continuity. Keep open visual signoff for movement seams. Follow the [parity audit](../assets/PACK-03-ANIMATION-PARITY.md) and apply the [fighter pack production guide](../assets/FIGHTER-PACK-PRODUCTION.md) to each batch. Update the guide with verified clip targets as the roster audit progresses.

## November 13 human signoff

The project owner approved completed work whose only remaining gate was human signoff. This closes the human review of local CPU behavior for the fixes already verified, the human gameplay feel and balance gate for the current implementation, and the arena readability, recovery and music review for Stages 07–10. This is owner approval, with the previously recorded test coverage as evidence. Human-only art review items on completed clips are also approved. Version-matched Ultimate evidence, Xbox 360 hardware coverage, outstanding hosted and technical checks, and unfinished implementation remain open.

## Bluehost hosting pilot

Pilot PR workflow builds a SHA-tagged client artifact. Next is the first Bluehost upload from the game pilot branch, then an unchanged redeploy and paired Render smoke testing. See the [pilot deployment guide](../guides/DEPLOYMENT.md#bluehost-client-pilot).

## Online remote-fighter smoothing

The pilot uses delayed playback at the existing 20 Hz send rate. The
two-client jitter comparison and browser contact trace passed for rendered
jab and throw cue timing. The change remains local.

- [x] Compare old and new playback on the same match snapshots.
- [x] Verify jab, grab, throw, and landing state transitions in two browsers.
- [x] Verify throw spark placement and first grounded contact in both browser views.
- [ ] Review the guest airborne pose on the first grounded frame.
- [ ] Measure hosted snapshot gaps and playtest on separate connections.
- [ ] Deploy after the contact and hosted checks pass.

[Measurements and limitations](../REFINEMENT.md#browser-contact-trace-with-controlled-jitter)

## Controller gameplay verification

The late-discovery fix is local. Simulated browser reports for Xbox 360,
Switch Pro, and DualSense each acquired slot 0 without a connection event.
All three produced movement and attack input accepted by the shared wire
validator. The controller package passed 76 tests and the profile suite
passed 12. Physical Switch Pro mapping remains open. Capture the affected browser's mapping, device ID,
and button/axis counts before adding any raw-device mapping.

Chromium gameplay smoke passed for all three simulated standard profiles.
Each controller appeared after startup without a connection event. Left
stick moved the fighter and the right face button entered Attack in local
play and in a two-client loopback match. The guest verified the host's
movement and Attack from authoritative snapshots. Physical controller
reports and hosted testing remain open. No deployment was made.

Follow-up after the deployed fix: both Xbox-to-Switch Pro and reverse simulated handoffs passed with the browser disconnect event omitted. After reconciliation, the sole controller reclaimed P1 and produced movement plus attack. Browser match handoff and physical hardware verification remain open.

Browser handoff passed in both directions in local and two-client online matches with simulated standard reports. The remaining controller confirmed P1 after the first disappeared without a disconnect event, then moved and attacked in the match. Online verification observed the authoritative state on the guest. Physical hardware and production deployment remain open.

## November 17 production-readiness reconciliation

The [production-readiness audit](PRODUCTION-READINESS-AUDIT.md) records
current roster counts, stale checkpoints, outstanding release verification
and proposed polish criteria. The five-fighter inventory rows above retain
historical evidence and need reconciliation with the ten-fighter roster.

### Zane rise follow-up — 2026-11-17

Zane's new intermediate rise pose is prepared and registered at revision
105. Both-facing local Dojo crop-order and landing checks passed; the
prepared alpha scan found no detached residue. The ten-tick rise timing
is unchanged. This closes the representative Zane rise integration, not
roster-wide movement parity. Next review the apex/fall handoff and
 direction-specific takeoffs, followed by Velvet.
[Drawing, alpha and Dojo evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-rise-preparation-and-dojo-verification--2026-11-17).

### Zane movement boundary review — 2026-11-17

Four live Dojo neutral/forward jump cases passed in both facings through
apex, fall and grounded return. The backward authored sequence passed a
separate production-texture renderer fixture in both facings; live
backward-input triggering remains unverified. No new root offset or
fallback was found. Next is Velvet's equivalent boundary review plus a
reproducible live backward-takeoff sequence.
[Scope, captures and results](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-phase-and-directional-takeoff-review--2026-11-17).

### Both Pack 04 live jump handoffs verified — 2026-11-17

Zane and Velvet passed twelve live Dojo cases: neutral, forward and
backward jumps in both facings. Backward takeoff is reproduced with
approach momentum followed by a squat-time reversal, and checked against
the authoritative age-zero cue and negative signed velocity. Reviewed
Velvet's phases and both fighters' backward boundary captures without
finding a new root snap or fallback. This closes the previously open
live backward-input check. Next is double-jump and fast-fall interruption
handoffs through first landing; full distinct-drawing parity remains open.
[Inputs, scope and visual evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-handoffs-and-live-backward-takeoffs--2026-11-17).

### Pack 04 double-jump registration fixed — 2026-11-17

Live interruption checks exposed a foot-root/28-unit grounded offset on
both fighters' double-jump transitions. Fixed their airborne registration.
Eight rise/apex interruption cases passed in both facings through fast-fall
and first landing. Existing jump and landing alignment checks, 20 movement
tests and client types passed. Next are aerial-attack and air-dodge exits
back into fall/landing; broader drawing parity is still open. Not deployed.
[Fix and visual evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-interrupted-jumps-and-landing-fix--2026-11-17).

### Pack 04 aerial and dodge handoffs verified — 2026-11-17

All five aerial attacks and neutral/downward air dodges passed from rise
and apex in both facings for both fighters: 56 live Dojo cases. Per fighter,
12 returned to normal fall and 16 landed during recovery; all retained
visible art, zero airborne root offsets and reached grounded IDLE. No new
production change was needed. Next apply the same registration/landing
review to Packs 02 and 03. Distinct drawing parity remains open.
[Scope, outcomes and visual boards](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-aerial-and-dodge-interruption-review--2026-11-17).

### Packs 02 and 03 handoffs checked; landing hover fixed — 2026-11-17

Twenty double-jump and 140 aerial/dodge cases passed for all five fighters
in both facings. Visual review found first-soft-landing hover for Moonshine
and Hoagie; corrected their sole roots while retaining the complete
expanded atlas. The landing-sole regression and both affected live jump
sequences passed after correction. Next is distinct movement artwork,
starting with Velvet's rise in-between; avoid repeating completed checks
without a relevant change. Not deployed.
[Results, correction and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-02-and-03-interruption-and-landing-review--2026-11-17).

### Velvet rise in-between integrated — 2026-11-17

Added and reviewed one Velvet rise drawing using shipped costume references.
Prepared alpha is clean, scale is matched to head/torso size, and the rise
plays three distinct poses in both facings with unchanged ten-tick timing.
Four focused live browser tests passed. Pack 04 revision 106 retains four
atlas pages. Next prioritize apex/fall in-betweens from the distinct-pose
inventory; full six-pose movement parity remains open. Local, not deployed.
[Source, prompt, scale/alpha review and Dojo evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-rise-in-between-integrated--2026-11-17).

### Zane apex/fall drawing gaps reduced — 2026-11-17

Integrated one dedicated apex and one fall in-between with clean prepared
alpha and matched costume/scale. Both phases now have three distinct
poses; all appear in both facings at frame-step and normal gameplay speed.
Five focused browser tests passed, including directional and interrupted
jumps. Pack 04 revision 107 retains four pages. Next is Velvet's matching
apex/fall pass; full six-drawing movement parity remains open. Not deployed.
[Sources, prompts and motion evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-apex-and-fall-in-betweens-integrated--2026-11-17).

### Velvet apex/fall drawing gaps reduced — 2026-11-18

Integrated two costume-matched, alpha-cleaned drawings. Both Pack 04
fighters now have three distinct rise, apex and fall poses. Six browser
tests passed, including normal-speed playback in both facings. Revision
108 retains four atlas pages. Next finish Zane's rise at six distinct
poses (three additional drawings), then Velvet's, without changing physics
or treating three poses as completed parity. Local, not deployed.
[Sources, prompts and playback evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-apex-and-fall-in-betweens-integrated--2026-11-18).

### Zane rise reaches six distinct drawings — 2026-11-18

Added three costume-matched, alpha-cleaned rise drawings. Frame-step and
normal-speed checks show all six in order in both facings. One-tick holds
were skipped at 1x, so the final presentation uses twelve ticks (six two-tick
holds); jump physics and input timing are unchanged. Five focused browser
tests passed. Revision 109 retains four atlas pages and all existing clip
keys. Next finish Velvet's six-drawing rise; other movement gaps remain.
Local, not deployed.
[Timing decision, sources and playback evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-rise-completed--2026-11-18).

### Both Pack 04 rise clips reach six drawings — 2026-11-18

Velvet's three new rise drawings pass costume, scale and prepared-alpha
review. Both rises now have six distinct poses, verified in both facings
at frame-step and normal speed. Six browser tests passed, including
directional and interrupted jumps. Revision 110 retains four atlas pages.
Next finish Zane's six-drawing fall, then Velvet's. Resolve the short apex
window before producing its remaining drawings. Other movement parity
work remains open. Local, not deployed.
[Sources, timing and playback evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-rise-completed--2026-11-18).

### Zane fall reaches six distinct drawings — 2026-11-18

Added three accepted fall poses; rejected an early near-copy and corrected
it before packing. Costume, scale and prepared alpha passed review. Six
browser tests passed, including all six fall poses at 1x in both facings
and handoffs through landing. Twelve-tick timing is unchanged. Revision
111 retains four atlas pages. Next finish Velvet's six-drawing fall;
apex window/cadence and other movement gaps remain open. Not deployed.
[Sources, rejection, cleanup and motion evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-fall-completed--2026-11-18).

### Both Pack 04 fall clips reach six drawings — 2026-11-18

Velvet's three new fall drawings pass costume and transparency review.
Six focused browser tests passed, including all six fall poses at normal
speed in both facings and directional/interrupted jumps through landing.
Revision 112 retains four atlas pages and the twelve-tick fall duration.
Both Pack 04 rises and falls now reach six drawings. Next resolve the
short apex window/cadence before drawing its remaining poses; other roster
movement gaps remain open. Local, not deployed.
[Sources, cleanup and playback evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-fall-completed--2026-11-18).

### Pack 04 apex window resolved — 2026-11-18

A renderer-only -4 to +4 vertical-speed band gives both fighters at least
twelve apex ticks in held full jumps, enough for six two-tick drawings.
Physics and controls are unchanged; interruption priority is preserved.
Thirteen focused Dojo browser tests, 21 movement unit tests and client
type check passed. Apex remains three drawings each. Next create and review
Zane's three missing apex drawings, then Velvet's, and verify all six at 1x.
Local, not deployed; this is a presentation choice, not Ultimate certification.
[Window decision and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-apex-presentation-window-resolved--2026-11-18).

### Zane apex reaches six drawings — 2026-11-18

Reviewed one costume-matched pose before producing the other two. All three
pass scale and prepared-alpha review. Six focused Dojo tests passed; all six
apex crops appear in order at normal speed in both facings. Revision 113
retains four atlas pages. Zane's rise/apex/fall now each have six drawings;
other movement gaps remain. Next finish Velvet's apex with the same review
and playback requirements. Local, not deployed.
[Sources, prompts, cleanup and footage](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-apex-completed--2026-11-18).

### Both Pack 04 apexes reach six drawings — 2026-11-18

Velvet's three new poses pass costume, scale and prepared-alpha review.
Six focused Dojo tests passed, including all six apex crops in order at
normal speed in both facings. Revision 114 retains four atlas pages.
Both Pack 04 rise/apex/fall clips now each have six drawings. Other movement
gaps remain in the roster inventory. Next expand Zane's double-jump transition
from three distinct drawings to six, then Velvet's, with one-pose-first review
and live interruption/return-to-rise checks. Local, not deployed.
[Sources, review and playback evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-apex-completed--2026-11-18).

### Zane double jump reaches six drawings — 2026-11-18

Three costume-matched in-betweens replace repeated slots within the existing
twelve-tick cue. Both-facing frame-step and 1x double-jump tests passed.
Fixed Pack 04's completed tuck returning to extended rise; 22 movement tests
and client type check passed. One ordinary-jump rise sample was missed once,
then passed unchanged on isolated recheck; this limit is recorded in evidence.
Revision 115 retains four atlas pages. Next finish Velvet's six-drawing double
jump and both-facing handoffs. Other movement gaps remain. Local, not deployed.
[Sources, correction and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-double-jump-completed--2026-11-18).

### Both Pack 04 double jumps reach six drawings — 2026-11-18

Velvet's three new drawings pass one-pose-first costume, scale and prepared
alpha review. Frame-step and four subsequent normal-speed runs show all six
in order in both facings with the final-tuck return to rise. The first
normal-speed run missed one crop; the cause remains provisional and elapsed
trace capture now precedes assertions. Other six combined browser checks passed.
Revision 116 retains four atlas pages. Both rise/apex/fall/double-jump sets
now have six drawings; other movement gaps remain. Next inspect fast-fall
window/cadence, then expand Zane and Velvet in that order. Local, not deployed.
[Sources, playback and intermittent observation](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-double-jump-completed--2026-11-18).

### Pack 04 fast-fall timing audited — 2026-11-18

Twelve natural input paths exposed only 6/4/9 fast-fall ticks for normal,
late and double-jump activation. Changed current three-pose cadence to
[2,2,8], preserving twelve authored ticks and immediate landing. All four
browser tests passed, including both-facing 1x exposure of all three current
poses. Revision 117 changes timing metadata only, with unchanged asset bytes.
Next draw Zane's three missing fast-fall poses, then Velvet's. Six two-tick
poses require a higher drop to inspect the full sequence; natural short
flights must show their valid prefix and land immediately. Other movement
gaps remain. Local, not deployed.
[Measured windows, cadence and next acceptance criteria](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-fast-fall-live-window-and-cadence--2026-11-18).

### Zane fast fall reaches six drawings — 2026-11-18

Three reviewed costume-matched poses now use six two-tick holds. Four natural
flight tests pass valid prefixes and immediate landing; two corrected high-drop
tests show all six at frame step and 1x in both facings. Test setup corrections
for unsafe height and lingering turnaround are documented. Revision 118 retains
four atlas pages. Next finish Velvet's fast fall with the same review and
high-drop/natural-prefix checks. Other movement gaps remain. Local, not deployed.
[Sources, scale review and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-fast-fall-completed--2026-11-18).

### Both Pack 04 fast falls reach six drawings — 2026-11-18

Velvet's three accepted drawings pass costume, scale and alpha review; rejected
an overly upright late v1 and packed corrected v2 explicitly. All eight focused
Dojo tests pass: natural prefixes, immediate landing and all six high-drop
poses at frame step and 1x in both facings for both fighters. Revision 119
retains four pages. Rise/apex/fall/fast-fall/double-jump sets now have six
drawings each. Next inspect soft/heavy landing windows and sole contact before
adding missing landing poses; squat/takeoff and other-pack movement gaps remain.
Local, not deployed.
[Sources, rejection and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-fast-fall-completed--2026-11-18).

### Pack 04 landing audit and gentle-touchdown fix — 2026-11-18

Fixed missing Pack 04 land_soft cue on the first grounded tick. Six engine
unit tests, engine build and three browser tests passed, including forty
both-facing landing/input cases. Soft/heavy art lasts 12/18 ticks but Jump,
Attack, Shield and Special interrupt on the next tick with no added lag.
Visible-bottom/root checks pass. Both soft middle drawings incorrectly reuse
raised-arm takeoff art: replace those as well as adding bridges. Remaining
landing drawing target is 14 (four per soft clip, three per heavy clip).
Next Zane soft landing, then Velvet soft, Zane heavy, Velvet heavy. Use
explicit cue-age durations and preserve immediate controls. No new art or
atlas revision; local, not deployed.
[Evidence and exact drawing targets](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-landing-timing-contact-and-trigger-audit--2026-11-18).

### Zane soft landing reaches six appropriate drawings — 2026-11-18

Four dedicated compression/recovery drawings replace the raised-arm takeoff
middle and fill the six-pose sequence. Prepared alpha, floor contact and 1x
both-facing playback pass. Four browser tests cover the forty-case landing/
action matrix; 23 movement unit tests and client type check pass. Retried a
partial atlas write and reran all browser checks on the complete revision 120.
No extra landing recovery. Ten landing drawings remain: Velvet soft four,
Zane heavy three, Velvet heavy three. Next Velvet soft. Other movement gaps
remain; local, not deployed.
[Sources, cleanup, packaging and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-soft-landing-completed--2026-11-18).

### Both Pack 04 soft landings reach six appropriate drawings — 2026-11-18

Velvet's four dedicated poses replace the raised-arm takeoff middle. Costume,
scale, prepared alpha and floor contact pass review. All five browser tests
pass: forty landing/action cases, loaded sole roots and both six-pose soft
landings at 1x in both facings. Revision 121 retains four atlas pages and the
twelve-tick visual cue, with no added recovery. Six landing drawings remain:
Zane heavy three, then Velvet heavy three. Next Zane heavy, one-pose-first
review, six three-tick holds and immediate action interruption. Other movement
gaps remain; local, not deployed.
[Sources, cleanup and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-soft-landing-completed--2026-11-18).

### Zane heavy landing reaches six drawings — 2026-11-18

Three dedicated in-betweens pass one-pose-first costume, scale and prepared
alpha review. All six Dojo tests pass, including both-facing 1x pose order,
sole roots and the forty-case landing/action matrix. Six three-tick holds
retain the existing eighteen-tick visual cue; no added recovery. Revision 122
retains four atlas pages. Three landing drawings remain: Velvet heavy next.
Squat/takeoff and other-pack movement gaps remain. Local, not deployed.
[Sources, review and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-six-drawing-heavy-landing-completed--2026-11-18).

### Both Pack 04 heavy landings reach six drawings — 2026-11-18

Velvet compression/rebound/settle complete the landing pass. Seven Dojo browser
checks passed, including both-facing normal-speed pose order, sole roots and
the forty-case action matrix. Revision 123 retains four pages. Zero Pack 04
landing drawings remain; next audit squat and directional-takeoff timing and
drawing targets. Other-pack movement gaps remain. Local, not deployed.
[Sources, review and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-six-drawing-heavy-landing-completed--2026-11-18).

### Pack 04 squat/takeoff audit completed — 2026-11-18

Three browser tests passed over twelve directional/facing jump sequences.
Both fighters reuse a raised-arm drawing before the low squat and at takeoff;
these art gaps remain open. Target three appropriate squat poses in three
ticks and three takeoff poses per direction in six ticks. Initial new-art
budget sixteen drawings, with any unsuitable endpoint reviewed separately.
Next Zane squat entry, then tapped/held jump and full sequence verification.
[Evidence and exact targets](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-squat-and-takeoff-timing-audit--2026-11-18).

### Zane jump squat reaches three appropriate drawings — 2026-11-18

Single-pose-first costume/alpha review complete. Entry, shipped low crouch and
extension use one tick each, preserving jump timing. Two focused browser tests
pass all four tapped/held/facing cases and loaded sole roots; three existing
directional/root tests pass. Revision 124, local only. Next Velvet squat, then
both directional takeoff sets; fourteen new drawings remain in this subpass.
[Sources, timings and review](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-three-pose-jump-squat-completed--2026-11-18).

### Both Pack 04 jump squats reach three appropriate drawings — 2026-11-18

Velvet entry/low crouch/extension complete the squat drawing target. Four Dojo
tests pass eight tap/hold/facing cases and sole roots across both fighters;
three-tick timing, jump heights and landing ticks remain unchanged. Revision
125, local only. Next Zane directional takeoff drawings, then Velvet; twelve
new drawings remain in the squat/takeoff subpass.
[Sources and results](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-three-pose-jump-squat-completed--2026-11-18).

### Zane directional takeoffs reach three poses each — 2026-11-18

Six new drawings pass shipped-costume/alpha review. Neutral/forward/backward
use three two-tick poses and a rise-matching endpoint. Corrected Pack 04
explicit-duration takeoff playback; seven browser checks and client typecheck
pass. Physics and jump timing unchanged. Revision 126, local only. Next six
Velvet takeoff drawings, then both fighters' complete normal-speed jump review.
[Sources, frame-step captures and traces](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#zane-three-pose-directional-takeoffs-completed--2026-11-18).

### Pack 04 squat/takeoff drawing targets complete — 2026-11-18

Velvet's six new drawings pass costume/alpha review and all seven browser
checks. Both fighters now use three poses per takeoff direction within the
existing six ticks, with rise-matching endpoints and unchanged jump physics.
Revision127, local only. Zero drawings remain in this sixteen-drawing subpass.
Next normal-speed complete jump review in both facings; other-pack gaps remain.
[Sources, rejected-halo note and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#velvet-three-pose-directional-takeoffs-completed--2026-11-18).

### Pack 04 complete jump playback reviewed locally — 2026-11-18

Both normal-speed browser tests pass all 24 fighter/facing/direction/short-full
cases. Every takeoff crop appears in order; rise/apex/fall/landing complete
without invisible skins. Decoded recording review found no new size/root snap
in sampled frames. Saved recordings, overview/dense boards and RAF traces.
Backward setup is frame-stepped through squat frame1; recordings are 25fps,
so this is not a 60fps performance or minimum-tap-duration signoff. No game
changes this pass, revision127 remains local only. Pack 04 basic jump subpass
complete; next reconcile Pack 02/03 movement counts and live phase budgets.
[Results and limitations](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-04-complete-jump-normal-speed-review--2026-11-18).

### Pack 02/03 movement baseline reconciled — 2026-11-18

Decoded pixels confirm minimum142 remaining new drawings: Moonshine/Hoagie29
each, Pack03 fighters28 each. Replacements are separate. Five browser tests
pass40 phase-budget cases. Found Pack02 takeoff skips its first drawing and
gentle landing skips its cue. **Next fix those with zero new drawings**, then
expand Moonshine and proceed fighter by fighter. Pack03 apex and short natural
fast falls require scheduling decisions before artwork. No game changes yet.
[Ledger, budgets and fixed order](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-0203-movement-reconciliation--2026-11-18).

### Pack 02 movement playback corrections complete — 2026-11-18

Takeoff now plays both existing poses; gentle landings play their three-pose
cue without added recovery. Revision75 preserves all atlas pixels and146 clips
per fighter. Seven engine and91 renderer unit tests, client typecheck, twelve
directional cases, forty landing/action cases and sixteen phase-budget cases
pass. Before/after physical traces match exactly. No new drawings. Next
Moonshine directional takeoff expansion; minimum142 movement drawings remain.
[Changes and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#pack-02-takeoff-and-gentle-landing-playback-fixed--2026-11-18).

### Moonshine directional takeoffs reach three drawings — 2026-11-18

Three new midpoints pass first-pose costume/alpha review. Six browser regression
tests pass twelve direction/facing, forty landing/action and sixteen jump-budget
cases; normal-speed capture passes twelve Moonshine cases. Six-tick timing
unchanged. Revision76 retains146 clips per fighter and four pages. Minimum
movement gap falls142→139: Moonshine26, Hoagie29, Pack03 fighters28 each.
Next Moonshine rise four drawings, one-pose-first review. Local, not deployed.
[Sources, cleanup and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-three-pose-directional-takeoffs-completed--2026-11-18).

### Moonshine rise reaches six distinct drawings — 2026-11-18

Four new compact rise poses pass first-pose costume/alpha review. Phase-based
playback advances once and holds final pose; jump physics unchanged. Three
browser tests pass sixteen jump-budget and twelve normal-speed cases, plus91
renderer tests and client typecheck. Revision77 retains146 clips/fighter and
four pages. Movement minimum139→135; Moonshine22 remain. Next budget Moonshine
apex before adding four poses. Local only, not deployed.
[Sources, timing and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-rise-completed--2026-11-18).


### Moonshine apex reaches six drawings — 2026-11-18

Four new drawings retain shipped costume and both original apex drawings.
A renderer-only apex band and phase clock fit six two-tick poses without
changing physics. Eight before/after Moonshine physical traces match exactly.
Sixteen frame-stepped cases and twelve isolated live jump cases pass, plus91
renderer tests and client typecheck. Initial combined recording missed one
takeoff sample; the unchanged isolated run passes. Revision78, four pages,
146 clips/fighter. Minimum movement gap135→131; Moonshine18 remain.
Next Moonshine fall: four drawings with first-pose review. Local, not deployed.
[Sources, registration, limits and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-apex-completed--2026-11-18).


### Moonshine fall reaches six drawings — 2026-11-18

Four new drawings match shipped costume and pass first-pose/alpha review.
Phase-local fall advances once and holds final. Both-facing frame-step and
twelve normal-speed jump cases pass; eight physical traces match the apex
baseline exactly. Client typecheck and91 renderer tests pass. Revision79:
146clips/fighter, four pages,1,029slots. Movement minimum131→127; Moonshine14
remain. Next budget/expand Moonshine fast fall without changing physics.
Local only, not deployed.
[Sources and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-fall-completed--2026-11-18).


### Moonshine fast fall reaches six drawings — 2026-11-18

Four new compact drawings pass shipped-costume and alpha review. Phase-local
playback advances once; natural seven-tick fall shows four poses and high-drop
fixture shows all six. Four browser tests pass including stepped/normal both-
facing high drops, sixteen jump-budget cases, eight unchanged physical traces.
Typecheck and91 renderer tests pass. Revision80,146clips/fighter, four pages.
Movement minimum127→123, Moonshine10 left. Next Moonshine double-jump three
drawings. Local, not deployed.
[Sources and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-fast-fall-completed--2026-11-18).


### Moonshine double jump reaches six drawings — 2026-11-18

Three new in-betweens preserve shipped costume and existing endpoints. Six
two-tick poses fit the unchanged twelve-tick presentation. Four browser tests
pass both-facing stepped/normal double jumps and sixteen movement-budget cases;
eight physical traces match exactly. Revision81,146clips/fighter, four pages.
Movement minimum123→120; Moonshine7 remain (soft landing3, heavy landing4).
Next soft landing. Local only, not deployed.
[Sources and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-double-jump-completed--2026-11-18).


### Moonshine soft landing reaches six drawings — 2026-11-18

Three in-betweens complete six two-tick poses without extending landing.
Rejected first candidate for head proportions; corrected using shipped references.
Full transition review also corrected the inherited oversized landing scale.
Final both-facing budget/landing and twelve normal-speed cases pass; eight
physical traces unchanged, boots within0.274 world units of planted roots.
Revision83:146clips/fighter, four pages. Movement minimum120→117; Moonshine4
remain, all heavy landing. Next heavy landing. Local only, not deployed.
[Artwork and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-soft-landing-completed--2026-11-18).


### Moonshine movement drawing targets met — 2026-11-18

Four heavy-landing additions complete six three-tick poses within the existing
eighteen-tick window. Both-facing budget/action checks and twelve final
normal-speed jump cases pass; eight physical traces are unchanged. Typecheck
and 91 renderer tests pass. Revision 85: 146 clips/fighter, four pages.
Movement minimum 117→113: Moonshine 0, Hoagie 29, Pack 03 fighters 28 each.
Moonshine's eleven-clip movement drawing targets are met; broader animation/
timing work is separate. Next Hoagie directional takeoff midpoints.
Local only, not deployed.
[Artwork, capture limit and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-heavy-landing-completed--2026-11-18).


### Hoagie takeoffs reach three drawings — 2026-11-19

Three new midpoints match shipped costume; original takeoff endpoints retained.
Six-tick cues now use three two-tick poses. Six browser regressions and twelve
normal-speed cases pass; eight physical traces unchanged. Timing maintenance
also preserves Moonshine's six-pose soft landing and reruns unchanged.
Revision 86, 146 clips/fighter, four pages. Movement minimum 113→110:
Hoagie 26 left, Moonshine 0, Pack 03 fighters 28 each. Next Hoagie rise,
four drawings with first-pose review. Local only, not deployed.
[Sources and verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-three-pose-directional-takeoffs-completed--2026-11-19).


### Hoagie rise reaches six drawings — 2026-11-19

Four new drawings pass shipped-costume and alpha review. Phase-local playback
advances once and holds final; all rise roots align to a common vertical anchor.
Sixteen budget cases and twelve normal-speed cases pass; eight physical traces
are unchanged and both double-jump handoffs return to the final rise pose.
Typecheck and 91 renderer tests pass. Revision 87, 146 clips/fighter, four pages.
Movement minimum 110→106: Hoagie 22, Moonshine 0, Pack 03 fighters 28 each.
Next budget Hoagie apex before four drawings, retaining full-rise exposure.
Local only, not deployed.
[Sources and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-rise-completed--2026-11-19).


### Hoagie apex reaches six drawings — 2026-11-19

Four new drawings pass first-pose costume/alpha review. Hoagie's renderer-only
asymmetric crest band fits twelve apex ticks while retaining twelve full-rise
ticks; physics unchanged. Sixteen budget and twelve normal-speed cases pass;
eight physical traces match and double-jump handoffs retain the final rise pose.
Typecheck and 91 renderer tests pass. Revision 88, 146 clips/fighter, four pages.
Movement minimum 106→102: Hoagie 18, Moonshine 0, Pack 03 fighters 28 each.
Next Hoagie fall, four drawings. Local only, not deployed.
[Timing, sources and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-apex-completed--2026-11-19).


## November 19 Hoagie fall milestone

Hoagie's six-pose fall passed local stepped and normal-speed Dojo checks in both facings, with unchanged physics. Remaining movement minimum is 98 drawings: Hoagie 14, each Pack 03 fighter 28, Moonshine zero. Next is Hoagie's fast-fall budget and four new drawings, then double jump and landings. [Evidence and next action](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-fall-completed--2026-11-19). Local only; no deployment signoff implied.


## November 19 Hoagie fast-fall milestone

Hoagie's six-pose fast fall passed stepped and normal-speed high-drop Dojo checks in both facings, including the heavy-landing handoff. Eight ordinary physical traces are unchanged. Movement minimum is now 94 drawings: Hoagie ten, each Pack 03 fighter 28, Moonshine zero. Next is Hoagie's six-pose double jump, retaining its twelve-tick cue and final-rise handoff. [Verification and evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-fast-fall-completed--2026-11-19). Local only, not deployed.


## November 19 Hoagie double-jump milestone

Six-pose double jump passed local stepped and normal-speed Dojo checks in both facings, preserving its twelve-tick cue and final-rise handoff. Eight physical traces are unchanged. Remaining movement minimum is 91 drawings: Hoagie seven, each Pack 03 fighter 28, Moonshine zero. Next is Hoagie's six-pose soft landing, preserving twelve-tick recovery. [Verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-double-jump-completed--2026-11-19). Local only.


## November 19 Hoagie soft-landing milestone

Six-pose soft landing passed local stepped and normal-speed checks in both facings, preserving twelve-tick recovery and floor contact through idle. Eight physical traces are unchanged. Remaining movement minimum is 88 drawings: Hoagie four (heavy landing), each Pack 03 fighter 28, Moonshine zero. Next is six-pose heavy landing, retaining eighteen-tick recovery and checking full-jump/fast-fall landing handoffs. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-soft-landing-completed--2026-11-19). Local only, not deployed.


## November 19 Hoagie movement targets completed

Six-pose heavy landing passed full-jump and fast-fall Dojo checks in both facings at stepped and normal speed. Eight physical traces unchanged; eighteen-tick recovery retained. Hoagie and Moonshine now meet all eleven movement pose-count targets. Remaining movement minimum is 84 drawings, all Pack 03 (28 each). Next is Mr. Wrong's three-pose jump squat and directional takeoffs, starting with shipped costume and phase-budget review. [Evidence and scope limits](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-heavy-landing-completed--2026-11-19). Local only, not deployed; broader animation/release signoff remains separate.


## November 19 Mr. Wrong squat milestone

Three-pose jump squat passed tapped/held jumps in both facings, stepped and normal speed, retaining three-tick timing. Eight physical traces unchanged. Movement minimum is 83 drawings (Mr. Wrong 27, Loopy 28, Mrs. Tasselbottom 28). Next: Mr. Wrong's three directional takeoff midpoints and six-tick cue playback review. [Evidence and capture limits](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-three-pose-jump-squat-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong takeoff milestone

Neutral, forward and backward takeoffs now have three dedicated poses each. Twelve stepped and twelve normal-speed cases passed, six cue ticks retained; eight physical traces unchanged. Remaining movement minimum is 80 drawings (Mr. Wrong 24, Loopy 28, Mrs. Tasselbottom 28). Next is Mr. Wrong's six-pose rise, preserving natural phase budgets and auditing the double-jump handoff. [Verification](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-three-pose-directional-takeoffs-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong rise milestone

Six-pose rise passed local stepped, normal-speed and double-jump handoff checks in both facings. Fifteen/six-tick full/short rise windows and eight physical traces unchanged. Remaining movement minimum is 76 drawings (Mr. Wrong 20, Loopy/Mrs. Tasselbottom 28 each). Next is the apex phase-budget review before four apex in-betweens; preserve physics and rise exposure. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-rise-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong apex milestone

Six-pose apex passed local both-facing stepped and normal-speed checks, including double-jump handoffs. Renderer-only crest allocation gives twelve apex and twelve full-rise ticks; all eight physical traces unchanged. Remaining movement minimum is 72 drawings (Mr. Wrong sixteen, Loopy/Mrs. Tasselbottom 28 each). Next is six-pose fall with final hold and landing verification. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-apex-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong fall milestone

Six-pose fall passed both-facing stepped and focused normal-speed full-jump checks, plus double-jump handoffs and landing. Eight physical traces unchanged. Capture gaps and narrowed normal-speed scope are documented with retained traces. Remaining movement minimum is 68 drawings (Mr. Wrong twelve, Loopy/Mrs. Tasselbottom 28 each). Next: six-pose fast fall, using natural-window and controlled higher-drop checks. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-fall-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong fast-fall milestone

Six-pose fast fall passed final both-facing stepped/normal-speed high-drop checks and ordinary movement budgets after pivot-bob correction. Eight physical traces unchanged. Remaining movement minimum is 65 drawings (Mr. Wrong nine, Loopy/Mrs. Tasselbottom 28 each). Next is six-pose double jump, preserving twelve-tick cue and matching first-rise handoff. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-fast-fall-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong double-jump milestone

Six-pose double jump passed stepped/normal-speed both-facing tests, preserving twelve-tick cue and exact matching first-rise release. Eight physical traces unchanged. Remaining movement minimum is 62 drawings (Mr. Wrong six, Loopy/Mrs. Tasselbottom 28 each). Next is six-pose soft landing with twelve-tick recovery and floor/idle checks. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-double-jump-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong soft-landing milestone

Six-pose soft landing passed stepped/normal-speed both-facing checks, retaining twelve-tick recovery and floor contact through idle. Eight physical traces unchanged. Remaining movement minimum is 59 drawings (Mr. Wrong three, Loopy/Mrs. Tasselbottom 28 each). Next is six-pose heavy landing, retaining eighteen ticks and checking full-jump/fast-fall landings. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-soft-landing-completed--2026-11-19). Local only, not deployed.


## November 19 Mr. Wrong movement targets completed

Six-pose heavy landing passed full-jump/fast-fall both-facing stepped and normal-speed checks, preserving eighteen ticks and eight physical traces. Mr. Wrong now meets all eleven movement pose-count targets, alongside Moonshine/Hoagie. Remaining movement minimum is 56 drawings (Loopy/Mrs. Tasselbottom 28 each). Next is Loopy's jump squat and directional takeoffs, beginning with shipped blank cream/purple jersey references and phase-budget review. [Evidence and scope](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-heavy-landing-completed--2026-11-19). Local only; release and broader animation signoff remain separate.


## November 19 Loopy squat milestone

Loopy's three-pose squat passed tapped/held jumps in both facings at stepped and normal speed. Eight physical traces unchanged; three-tick timing retained. Movement minimum is 55 drawings (Loopy 27, Mrs. Tasselbottom 28). Next: Loopy's neutral/forward/backward takeoff midpoints, preserving the six-tick cue and blank cream jersey. [Evidence and capture limits](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-three-pose-jump-squat-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy takeoff milestone

Neutral, forward and backward takeoffs now have three poses each. Twelve stepped and twelve normal-speed cases passed; eight physical traces unchanged and six-tick cues retained. Movement minimum is 52 drawings (Loopy 24, Mrs. Tasselbottom 28). Next: Loopy's six-pose rise and double-jump handoff review, preserving physics and the shipped blank cream jersey. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-three-pose-directional-takeoffs-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy rise milestone

Six-pose rise passed eight stepped movement cases, twelve ordinary normal-speed jumps and both-facing stepped/normal double-jump handoffs. Physics unchanged; fifteen/six-tick full/short rises retained. Typecheck and 40 renderer tests passed. Movement minimum is 48 drawings (Loopy 20, Mrs. Tasselbottom 28). Next: Loopy apex phase-budget review and four apex in-betweens, preserving rise exposure and physics. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-rise-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy apex milestone

Six-pose apex passed eight stepped movement cases, twelve normal-speed direction/facing/tap-hold cases and both-facing double-jump handoffs. Physics unchanged; renderer-only allocation preserves twelve full-rise ticks and gives twelve/eleven apex ticks on full/short jumps. Typecheck and 40 renderer tests passed. Movement minimum is 44 drawings (Loopy sixteen, Mrs. Tasselbottom 28). Next: Loopy's six-pose fall, preserving seventeen/eight-tick fall windows and landing alignment. [Evidence and capture limits](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-apex-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy fall milestone

Six-pose fall and cleaned red-fringe start passed eight stepped movement cases, twelve normal-speed direction/facing/tap-hold cases and both-facing double-jump handoffs. Physics unchanged; seventeen/eight/twenty-one-tick full/short/double fall windows retained. Typecheck and 40 renderer tests passed. Movement minimum is 40 drawings (Loopy twelve, Mrs. Tasselbottom 28). Next: Loopy's fast fall, three to six poses, with controlled high-drop coverage and landing checks. Pack 03 now has ten live pages; carry that footprint into release loading verification. [Evidence and capture limits](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-fall-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy fast-fall milestone

Six-pose fast fall passed eight natural movement cases and stepped/normal high drops in both facings. Physics unchanged; natural six-tick window retained. Controlled seventeen-tick high drops expose all six poses and landing. Typecheck and 40 renderer tests passed. Movement minimum is 37 drawings (Loopy nine, Mrs. Tasselbottom 28). Next: Loopy's double jump, three to six poses, preserving twelve ticks and the matching first-rise endpoint. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-fast-fall-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy double-jump milestone

Six-pose double jump passed eight movement-budget cases and both-facing stepped/normal playback. Twelve-tick cue and eight physical traces unchanged. Final double/first rise crop, airRoot and offsets match. Typecheck and 40 renderer tests passed. Movement minimum is 34 drawings (Loopy six, Mrs. Tasselbottom 28). Next: Loopy's soft landing, three to six poses with twelve-tick recovery, then heavy landing. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-double-jump-completed--2026-11-19). Local only, not deployed.


## November 19 Loopy soft-landing milestone

Six-pose soft landing passed both-facing stepped/normal playback and eight movement-budget cases. Twelve-tick recovery and physics unchanged; planted-root samples remain at y472/offset28 through idle. Typecheck passed. Movement minimum is 31 drawings (Loopy three heavy-landing poses, Mrs. Tasselbottom 28). Next: Loopy heavy landing with eighteen-tick recovery and full-jump/fast-fall checks. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-soft-landing-completed--2026-11-19). Local only, not deployed.


## November 20 Loopy movement targets completed

Six-pose heavy landing passed full-jump/fast-fall, both-facing stepped and normal playback; eighteen-tick recovery and eight physical traces unchanged. Typecheck passed. Loopy now meets all eleven movement drawing targets. Remaining minimum is 28 drawings, all Mrs. Tasselbottom. Next: inspect her shipped costume/movement references and phase budgets, then add the jump-squat midpoint while preserving three ticks. [Evidence and scope](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-heavy-landing-completed--2026-11-20). Local only, not deployed; broader animation/release signoff remains separate.


## November 20 Mrs. Tasselbottom squat milestone

Three-pose squat passed tapped/held jumps at stepped and normal speed in both facings. Three-tick timing, her y466/offset34 floor anchor and eight physical traces unchanged. Typecheck passed. Remaining minimum is 27 drawings, all Mrs. Tasselbottom. Next: three directional takeoff midpoints with six-tick cue checks. Her full-rise/fast-fall windows are only eight/three ticks; budget those separately later. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-three-pose-jump-squat-completed--2026-11-20). Local only, not deployed.


## November 20 Mrs. Tasselbottom takeoff milestone

Three directional takeoffs now have three drawings each. Twelve stepped and twelve normal-speed cases passed; eight physical traces unchanged. Client typecheck passed. Remaining movement minimum: 24 drawings, all Mrs. Tasselbottom. Next: her rise phase-budget audit and six-pose expansion. Local only, not deployed. [Evidence](../assets/FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-three-pose-directional-takeoffs-completed--2026-11-20).
