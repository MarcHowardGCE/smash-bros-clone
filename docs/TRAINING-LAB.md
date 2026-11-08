# Training laboratory: playback, collision view and partner routines

Air-dodge testing: the readout shows ready/spent and the current dodge’s captured fatigue. Compare fresh and level-five directional travel using the fatigue selector; a body hit restores air dodge but does not restore double jump. Intermediate travel scaling and landing interpolation remain provisional.

Fatigue comparison: the Lab fatigue button resets both fighters and sets their next dodge fatigue from 0 to 5. Freeze and step to compare boundaries; normal recovery continues while running. See [the follow-up audit](FATIGUE-PARRY-SEQUENCE-AUDIT.md).

Implemented November 5, 2026. Open **Training Dojo -> Free Practice -> Timing laboratory**. Slow motion, freeze/step and collision tools also appear in guided lessons; partner recording/playback is restricted to Free Practice so it cannot replace a lesson's prescribed partner.

## Controls

| Tool | Keyboard / arena | Controller |
| --- | --- | --- |
| Playback speed | Speed button cycles 1x, 0.5x, 0.25x | Start -> Timing laboratory -> Speed |
| Inspector freeze / run | F6 or Freeze/Run button | Back freezes; Start -> Resume runs |
| Advance exactly one simulation tick | F7 while frozen | Back again while frozen; also Step in pause menu |
| Collision view | F3 or Collision overlay button | Start -> Timing laboratory -> Collision overlay |
| Record your inputs / stop and save | F8 in Free Practice | Start -> Timing laboratory -> Record / Stop and save |
| Play / stop partner routine | F9 in Free Practice | Start -> Timing laboratory -> Play / Stop |
| Routine slot, mirror, loop, delay | Laboratory buttons | Same options in the pause laboratory |

The controller shortcuts use the existing Xbox-style Back and Start positions. Buttons held for a frozen step are sampled by the normal input controller, so a player can hold Attack and advance it frame by frame. Steps issued through the pause menu suppress menu action presses. F6 inspector freeze preserves pending simulation buffers; the ordinary Escape/Start menu keeps its existing pause behavior.

## Timing behavior

LocalMatch still advances the same deterministic 60 Hz simulation tick. Playback speed changes only the real-time accumulator rate; it does not scale velocities, damage, hitlag, shieldstun, invulnerability, recovery, partner delays or lesson criteria. A 0.25x session takes four times as much real time to reach the same tick.

Freeze stops automatic simulation progress. A step executes exactly one normal input/controller/physics/combat tick, updates the snapshot and remains frozen without scheduling playback. Hitlag, fatigue and lesson progress advance only when their normal tick rules allow it. Setting a speed or resuming resets the real-time accumulator to avoid catch-up bursts. Input sampling is still tick-based: physical changes between steps are consumed through the normal input source, rather than stored as an independent wall-time event timeline.

Practice-only guards prevent these controls from changing ordinary local or online matches. Cosmetic scenery may continue to animate while simulation is frozen.

## Collision view

The overlay lives in the fighter scene layer and inherits the same coordinate transform. It uses the engine's actual geometry functions:

- Green capsule: body damage hurtbox, including character size and crouch.
- Purple capsule: the body is currently damage-immune according to engine rules.
- Blue circle: active shield collision circle. An expired shield-release opportunity does not remain blue merely because the fighter is still in SHIELD recovery.
- Red circle: currently active attack box using the same facing and legacy-to-sprite scaling as combat.
- Amber circle: reconstructed frozen contact pose when hitlag has consumed the active box. This is a pose aid, not an active hitbox or proof of another contact.
- Pale gold rectangles: actual stage collision surfaces; decorative platform art does not expand them.

This exposes the game's current collision rules. It does not certify the remaining Ultimate timing profiles or introduce new combat geometry. The overlay is destroyed when practice exits.

## Recordable partner routines

Free Practice provides three device-local slots. Start recording from a fresh arena, demonstrate with P1, then stop/save. The partner rests while recording. Playback resets the arena and sends the saved input frames through P2's ordinary combat engine. It does not restore player state or automatically chase the target. The selected partner uses its own moveset; the saved source fighter is displayed as context.

Each tape is limited to 900 simulation ticks, or 15 simulation seconds. Reaching the limit stops and saves automatically. Stop, changing slots/partner behavior, resetting during recording or leaving practice saves the current draft. Saving a new recording replaces the selected slot. Corrupt or incompatible saved data is rejected rather than fed into combat.

Playback options:

- Mirror Left/Right, enabled by default, swaps horizontal direction bits and both sticks' horizontal values. Vertical intent is retained. Positions and fighter facing are not teleported or rewritten by mirroring.
- Repeat on/off. One-shot playback releases its final held input when it ends.
- Repeat delay of 0, 60 or 120 simulation ticks. Positive gaps are neutral inputs, including release edges. Slow motion also slows this delay in real time.
- Manual arena reset rewinds a playing tape. Repeats themselves retain the live arena state, and an automatic fall reset can occur mid-tape; identical inputs do not promise identical outcomes from different positions.

Slot data is versioned and contains only bounded input frames and source-fighter metadata. Analog values, action masks, jump-button counts and schema version are validated on load. There is no online upload or account synchronization.

## Code references

- apps/client/src/local/LocalMatch.ts: fixed-tick speed scheduling, inspector freeze/run and one-tick step.
- apps/client/src/practice/PracticeRoutine.ts: bounded recorder/player, mirror/repeat behavior and saved-data validation.
- apps/client/src/practice/PracticeDummy.ts: replay inputs routed through the real partner controller.
- apps/client/src/practice/collisionModel.ts and PracticeOverlay.ts: collision shapes and Pixi rendering.
- apps/client/src/practice/PracticePanel.ts: controls, hotkeys, three local slots and status feedback.
- apps/client/src/main.ts and ui/UIManager.ts: scene lifecycle, Back stepping and controller-accessible pause actions.
- packages/engine/src/index.ts: public exports of existing collision geometry helpers; combat calculations are unchanged.

## Validation

Engine: 1,023 passed, one existing skip. Server: 392 passed, 16 existing skips. Client: 673 passed. After the final save/toolbar refinement, the two targeted panel tests and client production build passed again. Shared/package production builds passed through the server's production-entrypoint test. A test cleanup return-type error found during the first build was corrected before the clean server rerun.

Coverage includes equal simulation outcomes at 1x/0.5x/0.25x, preservation of buffers while frozen, exact single-tick hitlag progress, normal-match rejection, recorded-field copying, mirror mapping, exact neutral gaps, one-shot release, recording cap, invalid storage rejection, slot loading and real partner attacks from playback. Existing 18-lesson/all-fighter completion checks remain passing.

Production-browser checks passed for speeds, stable frozen ticks, keyboard/controller/menu single stepping, live collision rendering, saved recording, an actual partner jab from playback, slot persistence, three-slot selection and cleanup on exit. The collision view was visually reviewed against fighter positions and platform surfaces.

Evidence: task workspace outputs/dojo-lab-v1/checks.json, frozen-collision.png and partner-replay.png. Logs: work/lab-engine.txt, lab-server-final.txt and lab-client.txt. No environment files or bonney content were inspected. No new art assets or ordinary movement/launch/reach changes were introduced.

## Next refinements

1. Human controller testing of freeze/step ergonomics and recording instructions.
2. Input/state timeline, cancel-window annotations, and early/late coaching for failed parries or dodges.
3. Named routines, trimming, explicit reset-per-loop scenarios and import/export using the existing validated schema.
4. More dojo chapters for ledges, techs, other throws and fighter-specific sequences.


### Dojo launch and KO lab

In Free Practice, open **Timing laboratory → Launch and KO lab**. Set your fighter and partner independently to 0%, 50%, 100%, 150%, or 200%. Presets stay fixed through hits and arena resets and start at 0% in each new session. The lab reports the last launch for each fighter, including knockback, hitstun, tumble, base launch speed before directional influence, and maximum displacement during the tracked reaction. A real blast-zone crossing records the boundary before the arena resets. Screen and star KO previews use the selected fighter's existing art without moving fighters or using stocks.

