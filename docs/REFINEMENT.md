# Current refinement decisions

Use [active work and signoff](plans/ACTIVE-WORK.md) for priorities and next actions. This page records the current behavior and links to the detailed evidence. The [previous refinement log](history/legacy-refinement.md) preserves every original milestone, result, and historical next step.

## Current decisions

| Area | Current baseline | Detailed record |
| --- | --- | --- |
| Roster, arenas, and art | The default roster has five fighters, with six distinct arena layouts. Production art is loaded by confirmed lineup. Visual signoff, fighter canon, and proposed stage events are tracked separately. | [Animation inventory](assets/ULTIMATE-ANIMATION-CHECKLIST.md) · [Atlas](assets/FIGHTER-PRODUCTION-ATLAS.md) |
| Menus and loading | Home opens without loading every fighter atlas. Online countdown waits for both the selected lineup and arena preparation. The Render reconnect smoke and tracked Narrator and contrast checks passed. Extended hardware signoff remains open. | [Menu polish and performance](MENU-POLISH-PLAN.md) |
| Camera and KOs | Local, online, and Dojo use adaptive fight framing. Screen KO reaches the actual viewport edge before the blast. Star KO starts from the outgoing tumble and recedes through the upper-edge handoff. | [Camera and Star KO checks](TRAINING-DOJO.md#continuous-star-ko-handoff) |
| Network and reconnect | The server is authoritative at 60 Hz and targets 20 Hz snapshots. Local movement prediction and remote interpolation use separate clocks. Mid-match disconnects retain a seat for 30 seconds. Rejoining requires the private seat credential. Explicit Leave forfeits immediately. | [Reconnect verification](guides/DEPLOYMENT.md#render-reconnect-signoff) · [Room manager](../apps/server/src/RoomManager.ts) |
| Verification and release | Setup, test commands, and production operations live in the guides. Local checks and deployed signoff are tracked separately. | [Development](guides/DEVELOPMENT.md) · [Testing](guides/TESTING.md) · [Deployment](guides/DEPLOYMENT.md) |

## Current combat parity checkpoint

| Family | Current behavior and evidence |
| --- | --- |
| Launch and knockdown | Tracked launch acceleration, zero-hitlag DI/LSI, throw releases, and grounded and airborne hitstun handoffs have project fixtures. The launch audit owns throw follow-ups, percent sweeps, chase routes, and the corrected grab-through-floor cases. [Launch and contact audit](LAUNCH-MOTION-REFINEMENT.md) |
| Ledge and recovery | The same audit owns regrabs, getups, vulnerable approach, forced catch, trump, and aerial punishes. Directional air-dodge soft-platform and same-tick floor/ledge priority are measured project behavior. [Directional contact audit](LAUNCH-MOTION-REFINEMENT.md#six-stage-directional-air-dodge-contact-audit) |
| Shield, dodge, and parry | Dodge refresh, post-shieldstun parry restrictions, and buffered actions have Dojo coverage. The sequence audit owns fixture counts and remaining native exceptions. [Fatigue and parry audit](FATIGUE-PARRY-SEQUENCE-AUDIT.md) |
| Controls and transitions | Analog walking, aerial auto-cancel, landing buffers, and recovery transitions have dedicated records. Mixed face and right-stick presses and releases are traceable in the Dojo. [Analog movement](ANALOG-MOVEMENT-REFINEMENT.md) · [Landing inputs](LANDING-INPUT-REFINEMENT.md) · [Mixed-input trace](FATIGUE-PARRY-SEQUENCE-AUDIT.md#dojo-trace-for-mixed-input-charge) |

Exact Ultimate 13.0.5 collision freeze, cinematic tech exceptions, directional recovery, selected parry and mixed-input rules, and native Star KO projection remain provisional. Native signoff is blocked on version-matched captures, which are currently unavailable. The local fixtures remain the working baseline. The project fixtures establish observed project behavior. Human balance and feel signoff remains open. The [archived checkpoint](history/legacy-refinement.md#current-combat-parity-checkpoint) retains the original case counts and per-milestone links.

### Ultimate 13.0.5 capture checklist

The fixture IDs below pair the current project tests with the missing reference measurements. All native comparisons remain open. Use the stated version and record fighter, move, stage, damage, initial position, facing, and the input timeline for each capture. Count from the named event at tick zero and record any dropped or duplicate video frames before drawing a timing conclusion.

| Fixture | Current project control | Required reference capture |
| --- | --- | --- |
| CF-01 Collision freeze | The provisional model truncates 15% of remaining hitstun and clamps to 2–30 ticks. | On wall and ceiling, capture contact through the first moving tick with neutral input. Use remaining hitstun of 56 and 59 to separate rounding rules, and 140 to distinguish the 20- and 30-tick caps. Record actual hitstun at contact and exclude attack hitlag. |
| CF-02 Tech and cinematic exceptions | The Dojo covers ordinary tech windows and seeded first-collision restrictions. | At matched contact geometry, compare fresh and held Shield through ordinary contact and blue and red zoom. Record the last successful tech tick and first actionable tick. Repeat per move before generalizing an exception. |
| DR-01 Directional air dodge and ledge contact | The six-stage Dojo matrix covers fresh and fully fatigued travel, Down held or released, soft landings, and floor versus ledge priority. | On a soft platform and a main-platform lip, compare straight down and downward diagonal with Down held and released. Record the first landing or catch tick and the first actionable tick. Repeat one edge case immediately before and after ledge eligibility. |
| PR-01 Consecutive parry | A single release does not automatically parry another hit in the direct-contact project tests. | Record an ordinary melee control and separate projectile, item, or third-party contacts at thaw and the following tick. Compare held release with a fresh Shield release. Mark the source, which hit each release covered, and any extra freeze. |
| IN-01 Face and right-stick overlap | The Dojo Input trace shows both release ticks, charge stop, and first active hitbox. | Capture both release orders with the same Up Smash. Record the native mapping, whether either input remains held, charge stop, and first active frame. Repeat with both released together as a control. |

The current launch, tech, directional dodge, ledge, and parry regression pass ran nine suites in the isolated Windows checkout. It passed 358 engine tests and 93 server tests, with 13 existing ledge skips. These results verify project behavior. The previous browser Dojo matrices remain the comparison baseline. [Launch and contact fixtures](LAUNCH-MOTION-REFINEMENT.md#tech-timing-and-collision-freeze-evidence) · [Directional contact fixtures](LAUNCH-MOTION-REFINEMENT.md#six-stage-directional-air-dodge-contact-audit) · [Parry sequences](FATIGUE-PARRY-SEQUENCE-AUDIT.md#recorded-post-shieldstun-and-adjacent-parry-audit)

#### November 10 evidence review

The public source search did not turn up a capture that identifies 13.0.5 and exposes the setup, inputs, and frame boundaries needed for these fixtures. Nintendo identifies the installed version on the title screen and lists a fix for invalid online data. The release notes give no measurements for these mechanics. [Nintendo 13.0.5 release notes](https://support.nintendo.com/jp/switch/software_support/aaab/1305.html)

| Fixture | Evidence reviewed | Measurement still needed |
| --- | --- | --- |
| CF-01 | The published launch experiments report a 2–30-frame clamp, while the tech experiments report 2–20. [Launch experiments](https://w.atwiki.jp/smashsp_kensyou/pages/64.html) · [Tech experiments](https://w.atwiki.jp/smashsp_kensyou/pages/37.html) | At 56 and 59 remaining hitstun ticks, the 15% model predicts 8/8 with truncation, 8/9 with nearest rounding, and 9/9 with ceiling. At 140, it predicts 20 with the lower cap and 21 with the higher cap. Count the impact separately and verify remaining hitstun independently. |
| CF-02 | The tech experiments report blue-zoom examples whose results depend on move and position. They leave the red-zoom case unmeasured. [Tech experiments](https://w.atwiki.jp/smashsp_kensyou/pages/37.html) | Match the contact geometry in normal, blue-zoom, and red-zoom runs. Compare one-tick and held Shield offsets and record the final successful tech and first actionable tick. |
| DR-01 | Existing dodge and landing experiments supply comparison data, while the project has a six-stage contact matrix. [Dodge experiments](https://w.atwiki.jp/smashsp_kensyou/pages/32.html) · [Landing experiments](https://w.atwiki.jp/smashsp_kensyou/pages/136.html) | Pair floor and ledge trials with the same position, Down input, and fatigue level. Capture first contact, vulnerability, and first accepted action. |
| PR-01 | Nintendo's guide establishes releasing Shield at impact as the normal parry input. [Nintendo technique guide](https://www.smashbros.com/en_US/howtoplay/technique.html) | Record a melee control and separate projectile, item, and third-party hits at thaw and the following tick. Show whether a fresh release occurred and which contact it covered. |
| IN-01 | Published right-stick experiments show a smash can start while face Attack is held. They do not resolve charge ownership in the two release orders. [Right-stick experiments](https://w.atwiki.jp/smashsp_kensyou/pages/31.html) · [Buffer experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) | For each release order and the simultaneous-release control, capture both input transitions, charge stop, and the first active hitbox. Use one fighter and one Up Smash throughout. |

The targeted local rerun passed 346 engine tests covering collision, ceiling tech, directional dodge, and parry, plus 10 Star KO presentation tests. All five timing fixtures still require native evidence. [Star KO comparison record](TRAINING-DOJO.md#straight-and-angled-star-ko-capture)

### Next human feel pass

Open **Training Dojo → Free Practice**. Select Stage 1 and a passive All-Rounder partner. Leave both fighters at 0%. Run each case at 1× first and use the Timing laboratory to review anything that feels off. Use the control prompts for your assigned device. [Timing tools](TRAINING-LAB.md#timing-behavior)

1. **Roll recovery.** Reset before every attempt. Set **Next dodge fatigue** to 0 or 5 after resetting, since Reset clears the preset. Let one neutral tick pass before entering inputs. If frozen, release the controls and press F7 once. Hold Shield, then tap toward or away from the fighter's facing. Repeat both directions at each fatigue level. Compare the wait before you can move or attack again.
2. **Directional air dodge.** Use the same takeoff mark and jump height for each comparison. Try down-diagonal toward the main platform and then toward the ledge from outside the platform. Compare fresh and fully stale. Record which surface catches you, when control returns, and whether the sprite makes contact and recovery clear.
3. **Landing escape.** Repeat the same dodge-to-floor setup separately for Jump, Attack, and Shield. Compare a tap just before recovery ends with a fresh press at unlock. Use the Input trace and state readout to capture the press, landing, and first action. Keep notes on the visible recovery cue.
4. **Matchups.** Play each unique non-mirror pairing once. Use the same arena and input device settings where possible. Record which exchange felt off and the exact input needed to reproduce it.

| Fighter | Forward roll ticks, fresh → stale | Backward roll ticks, fresh → stale | Human notes |
| --- | ---: | ---: | --- |
| All-Rounder | 29 → 38 | 34 → 52 | Pending |
| Abe Lincoln | 32 → 42 | 37 → 56 | Pending |
| Swift | 26 → 34 | 32 → 48 | Pending |
| Moonshine | 26 → 34 | 32 → 48 | Pending |
| “Hulk” Hoagie | 32 → 42 | 37 → 56 | Pending |

The browser preflight ran all 20 roll combinations through normal Dojo keyboard inputs at DPR 1, with no seeded fighter state. It verified that Freeze and Step advance one tick, the trace opens, the selected fatigue and roll direction register, and each roll covers 48 world units in this setup. The table counts elapsed simulation ticks from the first Roll snapshot to the first non-Roll snapshot. All 18 focused Dojo unit and integration checks passed. Human feel and native timing remain open.

#### Human playtest log

**Status:** Awaiting human playtesting. Start with the Dojo cases above, then play the ten pairings below. Use the same build, stage, and input settings where possible so any differences are easier to reproduce.

**Session details:** Date, build or commit, controller model and connection (or keyboard), stage, and local or online mode.

| Fighter | Roll recovery (both directions, 0/5 fatigue) | Directional air dodge (floor/ledge, 0/5 fatigue) | Landing inputs (Jump/Attack/Shield) |
| --- | --- | --- | --- |
| All-Rounder | Pending | Pending | Pending |
| Abe Lincoln | Pending | Pending | Pending |
| Swift | Pending | Pending | Pending |
| Moonshine | Pending | Pending | Pending |
| “Hulk” Hoagie | Pending | Pending | Pending |

Mark each case **OK**, **Needs follow-up**, or **Skipped**. For a landing input that feels early, late, or dropped, note whether it was tapped just before unlock or pressed at unlock. Save the Dojo Input trace for timing issues.

| Match | Fighter 1 | Fighter 2 | Result and notes |
| ---: | --- | --- | --- |
| 1 | All-Rounder | Abe Lincoln | Pending |
| 2 | All-Rounder | Swift | Pending |
| 3 | All-Rounder | Moonshine | Pending |
| 4 | All-Rounder | “Hulk” Hoagie | Pending |
| 5 | Abe Lincoln | Swift | Pending |
| 6 | Abe Lincoln | Moonshine | Pending |
| 7 | Abe Lincoln | “Hulk” Hoagie | Pending |
| 8 | Swift | Moonshine | Pending |
| 9 | Swift | “Hulk” Hoagie | Pending |
| 10 | Moonshine | “Hulk” Hoagie | Pending |

Record the winner and any exchange that felt off, such as a hard-to-read recovery, a dropped input, or a spacing or launch issue. For a repeatable issue, log the match or Dojo case, fighter and opponent, stage position, both percents, fatigue, facing, inputs, what happened, and what you expected. Attach a trace or clip when available. Reproduce reported issues in the Dojo before tuning, then replay the affected matchup after a fix.


## Three-controller support plan

The Xbox-layout, Nintendo Switch Pro, and DualSense profiles share physical button positions. Controller-specific prompts follow the active device or assigned seat as appropriate. The [original mapping and signoff plan](history/legacy-refinement.md#three-controller-support-plan) preserves the button tables and procedure.

### Prompt and assignment verification

Simulated standard gamepad reports verified menu prompts, mixed seats, and device reassignment. See the [prompt and assignment evidence](history/legacy-refinement.md#prompt-and-assignment-verification).

### Three-profile Dojo and mixed-match verification

Simulated controller runs covered the Dojo and two-client loopback matches. Initial physical checks were reported as fine with a newer Xbox controller among the devices. Extended hardware, mixed-seat, and reconnect checks are still open, including an actual Xbox 360. See the [full verification record](history/legacy-refinement.md#three-profile-dojo-and-mixed-match-verification).

## Historical milestones

- Fighter pilot, roster art, and animation milestones are indexed by the [roster art record](assets/FIGHTER-ART-ROSTER-V1.md), [engine handoff](assets/FIGHTER-ENGINE-HANDOFF.md), and [production atlas](assets/FIGHTER-PRODUCTION-ATLAS.md).
- Menu, world selection, accessibility, and load-time history lives in the [menu polish record](MENU-POLISH-PLAN.md).
- Earlier verification results and all duplicated batches from this page are preserved in the [original refinement log](history/legacy-refinement.md). The [former README](history/legacy-readme.md) and [former roadmap](history/legacy-roadmap.md) remain available as separate snapshots.
