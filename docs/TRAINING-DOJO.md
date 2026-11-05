# Training Dojo and practice sandbox

Implemented November 5, 2026. Enter from **Main Menu -> Training Dojo**. This is a local practice mode using the real GameEngine, not a separate approximation of combat. No online room changes are required.

## The two experiences

### Free Practice: the endless rehearsal

Choose any of the three fighters, a partner fighter and any of the six worlds. Start immediately without a match countdown. The partner can stand still, hold shield, repeat a telegraphed jab, or alternate attack/special. Change behavior inside free practice.

Both fighters stay at zero accumulated percent; shields retain full health. Hits still produce normal zero-percent reactions, hitlag, hitstun, launches, shieldstun and parries. This preserves realistic defensive timing instead of making the partner invulnerable to contact. Leaving the arena resets both fighters safely on the main platform, with no life consumption, result screen, winner or loser. Grabs, ledges, pending launches and fatigue are cleared on arena reset. Practice cannot change normal local/online match rules.

A side panel shows the current action/frame, last move, recent pressed/released action names, dodge fatigue and the partner's strike cue. R resets the arena; F2 returns to the dojo menu. Escape or controller Start pauses. Practice pause adds Reset practice arena and Dojo lessons to the shared keyboard/controller menu. A reset preserves lesson progress. Restart lesson clears the current attempt count.

Action presses carried from a menu, reset or resume are suppressed until controls are released, preventing a confirmation press from earning lesson credit. Held shielding and directional input remain available during that gate so resume does not force an artificial shield drop.

### Guided lessons: learn one technique

The same sandbox runs a focused instruction card with default Xbox and keyboard prompts. The partner automatically uses the behavior appropriate to the selected drill. Complete a technique correctly three separate times; mistakes do not erase successful repetitions. Completion is saved per fighter on this browser/device. Completed drills remain replayable and any lesson can be selected directly. Next lesson advances after completion.

Success requires a recent relevant input and an observed engine outcome. Buttons alone, the wrong move, repeated frames of one animation and hitlag do not inflate progress. Contact lessons require contact: a missed grab is not a successful grab, a blocked attack is not a release parry, and holding one parry pose is not three parries. Basic dodge lessons grade execution; they do not yet grade whether a strike was actually evaded.

The initial 18 lessons are:

| Basics | Advanced | Subtle |
| --- | --- | --- |
| Ground movement | Forward throw | Release parry |
| Dash | Double jump | Up special from shield |
| Ground jump | Aerial attack | Up smash from shield |
| Jab | Short hop | |
| Up tilt | Fresh-input fast fall | |
| Neutral special | Spot dodge | |
| Shield a real strike | Roll | |
| Grab a real partner | | |

Ground-movement instruction distinguishes gentle analog walking from keyboard movement. Keyboard direction is accepted as ground movement; it does not falsely require an analog-only walk input. Prompts describe the default bindings; custom bindings continue to work but prompts do not dynamically rewrite themselves yet.

## Architecture

- apps/server/src/GameEngine.ts: optional constructor-only practice rules, zero damage accumulation, full shield health, unlimited resets and disabled win condition. Room/client input cannot switch this flag on for competitive matches.
- apps/client/src/local/LocalMatch.ts: practice construction, tick observer, reset and fresh-input gate. Uses the existing fixed-timestep loop and controllers.
- apps/client/src/practice/PracticeDummy.ts: deterministic, telegraphed input partner; real attacks use normal combat.
- apps/client/src/practice/curriculum.ts: declarative lesson catalog and outcome evaluator, independent of display.
- apps/client/src/practice/PracticeSetup.ts: fighter/world/partner selection and lesson library using MenuNavigator.
- apps/client/src/practice/PracticePanel.ts and practice.css: live coaching panel, progress, local completion storage and reset/lesson controls.
- apps/client/src/main.ts and ui/UIManager.ts: entry, pause/resume, rendering and cleanup integration.

The mode resets to a clean arena rather than continuing a KO/respawn cinematic. Existing body sprite assets and stage art are reused. No new fighter canon was invented. Temporary practice controls and listeners are destroyed when leaving the mode.

## Validation

- Server: 392 tests passed, 16 existing skips. New coverage includes zero-damage real hits, preserved shieldstun, real parries, repeated arena exits, reset cleanup, normal-match damage isolation and all fighter/world ground placement combinations.
- Client: 656 tests passed. All 18 lessons completed three real-engine repetitions for each of the three fighters in 54 integration tests. Additional checks cover wrong inputs/moves, duplicate-frame rejection, partner patterns, menu configuration and input gating.
- Server/client production builds passed. Asset repacking was skipped; environment loading was redirected to the empty task directory.
- Production browser: three real jabs, three real release parries, completion persistence, next lesson, pause/reset, an actual walk off the arena into an infinite reset, and exit cleanup passed.
- Simulated Xbox-layout controller: dojo entry, free-practice selection, real attack, pause and navigation back to the lesson library passed. Physical-controller usability remains a human check.

Task evidence: outputs/dojo-v1/setup.png, lesson-complete.png, parry-complete.png, checks.json and controller-check.json. Logs: work/dojo-server.txt and dojo-client-final.txt. The layout was visually reviewed; a backdrop stacking issue was corrected before delivery. No environment files or bonney content were inspected.

## Brainstorm and next build priorities

1. **Timing laboratory:** slow motion, pause plus single-frame advance, hitbox/hurtbox visibility, explicit invulnerability/recovery indicators and an input timeline. Preserve deterministic simulation when changing playback speed. These tools are planned, not present in this version.
2. **Partner recording:** record/replay an input sequence, choose repeat delay, vary the delay within a seeded range and save multiple patterns. This supports repeatable parry, shield, dodge and punish comparisons.
3. **More dojo chapters:** all four throws, directional aerials/specials, ledge recovery, techs, floor recovery, buffered actions, spot-dodge attack cancel and fighter-specific routes. Teach a move first, then use a contact/timing challenge to demonstrate its purpose.
4. **Better coaching:** explain early/late parry attempts, missed grab spacing and incorrect cancel states; add a short demonstration and optional ghost replay. Display hints from actual custom bindings.
5. **Scenario presets:** fixed-percent launch tests, corner/ledge placement and air-dodge recovery setups. Keep the default sandbox at zero damage with no win/loss; any nonzero fixed-percent scenario should be explicit.
6. **Presentation:** give the dojo its own illustrated title/crest and mentor personality after fighter canon is agreed. Completion stamps, restrained sound cues and optional lesson sequencing can deepen the surreal arcade feel without obstructing the arena.

The next useful user test is to enter the dojo using a physical controller, complete a basic and a parry lesson, and assess whether instructions, partner cadence and panel placement are clear. This mode makes the current rules testable; it does not itself certify Ultimate parity or balance.
