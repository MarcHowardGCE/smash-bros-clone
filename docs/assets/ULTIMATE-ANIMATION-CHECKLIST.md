# Ultimate animation and mechanics checklist

Target: Super Smash Bros. Ultimate shared fighter mechanics for All-Rounder, Abe Lincoln and Swift. Decision recorded November 2, 2026. Original fighter identities and custom movesets remain; this is not a plan to copy Nintendo character artwork or assign every fighter the same moves.

This is the production inventory for finishing the sprite packs before implementing the remaining engine behavior. It includes 125 action families: 101 shared/combat/presentation families and 24 conditional kit, item and stage families. These are NOT frame counts, sheet counts, or a claim that all rows need brand-new drawings. Some rows bundle directional or orientation variants. Per-row artwork status is tracked in the accompanying inventory.

All three fighters currently have 763 registered body frames across 136 body clips each. Shared effects add 16 frames. Grab/throw review candidates are integrated in optional full-body mode; broader action coverage and Ultimate parity remain incomplete. The accepted 24-tick walk remains.

## Production order

1. Lock each fighter's attack identity and any optional abilities. Ultimate defines attack slots; original characters still need their own punches, kicks, specials and Final Smashes.
2. Prioritize All-Rounder's forward-tilt side kick, up-tilt high kick and down-tilt low sweep. These are proposed character designs based on the supplied references, not a statement that Ultimate requires those exact limb choices.
3. Complete dash attack, smash attacks with charge holds, aerials, specials, the entire grab/victim pair system and floor attacks.
4. Fill movement transitions, air dodges, parry/shield break, tech/getup and ledge transitions. The following tables cover these alongside already-started pilot clips so nothing disappears from the handoff.
5. Apply the same action-family keys to Lincoln and Swift, drawing their own silhouettes, reach, timing presentation and clothing motion. Variant eligibility is per fighter, not automatically copied from All-Rounder.
6. Validate the sprite packs and event markers, then build/replace engine behavior against this inventory. Do not treat current inconsistent timing tables as authoritative Ultimate frame data.

## Status meanings

Engine Existing means a matching system/slot exists; it does NOT mean Ultimate parity has been verified. Partial means pieces exist but transitions, input, variants or behavior are incomplete. Different means an existing approach needs replacement for the Ultimate target. Missing means no dedicated implementation was identified in the audited FSM/move/input pipeline. Audit means further tracing is needed before classifying behavior.

Art Pilot/Pilot pose means current full-body review artwork exists, not final production signoff. Reused/Mirrored/Partial means source material exists but needs a transition, variant or quality decision. Missing means new full-body artwork is absent; the old articulated fallback may still render an approximation. Effect or reuse means an effect/material or existing body pose may avoid new drawings.

P0 is the first offensive production batch. P1 completes shared gameplay coverage. P2 is presentation. C is conditional: keep these visible for full Ultimate-style scope, but generate them only when the relevant original-fighter kit, item or stage content is specified. Helpless recovery is conditional on the selected recovery move, not forced on every fighter.

## Shared action inventory

### Movement

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| idle | Idle / breathing | Existing | Pilot | Retain approved master and add alternate idle only if desired. |
| walk | Walk cycle | Existing | Pilot | Retain six drawings and the accepted 24-tick cycle; keep clip duration separate from movement speed. |
| dash_start | Initial dash start | Partial | Pilot | DASH currently reuses run. Author a distinct startup; audit Ultimate dash/run transitions. All-three-fighter review art: dash_start. Mechanics/event markers remain separate from body artwork. |
| run | Run cycle | Existing | Pilot | Retain six drawings; validate start/stop transitions. |
| turn_stand | Standing / walking turnaround | Missing | Pilot | Facing changes need an authored turn rather than an instant mirrored pop. All-three-fighter review art: turn_stand. Mechanics/event markers remain separate from body artwork. |
| turn_run | Running turnaround | Partial | Pilot | RUN currently returns to IDLE on reversal; add skid/turn transition and cancel rules. All-three-fighter review art: turn_run. Mechanics/event markers remain separate from body artwork. |
| brake | Run stop / skid | Missing | Pilot | Author deceleration pose, skid loop if needed, and recovery. All-three-fighter review art: brake. Mechanics/event markers remain separate from body artwork. |
| crouch_enter | Crouch entry | Partial | Pilot | Separate crouch from jump-squat and down-tilt. All-three-fighter review art: crouch_enter. Mechanics/event markers remain separate from body artwork. |
| crouch_hold | Crouch hold | Partial | Pilot | Author low idle and evaluate low hurtboxes. All-three-fighter review art: crouch_hold. Mechanics/event markers remain separate from body artwork. |
| crouch_exit | Crouch exit | Partial | Pilot | Stand-up transition; attack/jump interrupts specified later. All-three-fighter review art: crouch_exit. Mechanics/event markers remain separate from body artwork. |
| jump_squat | Jump squat | Existing | Pilot | Expand takeoff transition; existing jump sheet supplies one compression pose. All-three-fighter review art: jump_squat. Mechanics/event markers remain separate from body artwork. |
| jump_takeoff | Forward / backward takeoff | Partial | Pilot | Six-drawing neutral, forward and backward takeoffs for all fighters. Short/full hop share source art; trajectories differ. Preview-only pending authoritative phase/direction signals. |
| air_rise | Airborne rise | Existing | Pilot | Six-drawing rise loop per fighter; final continuity/pivot polish and engine phase integration remain. |
| air_apex | Airborne apex | Existing | Pilot | Six-drawing apex loop per fighter; velocity-based phase handoff remains engine integration work. |
| air_fall | Fall / fast fall | Partial | Pilot | Six-drawing normal and fast-fall loops per fighter. Dedicated fast-fall event/flag is needed; do not guess intent from velocity alone. |
| double_jump | Double-jump trigger / ascent | Existing | Pilot | Six-drawing transition per fighter. Replicate a lasting action/event identity; a one-tick state can be skipped by remote snapshots. Torso-anchored staged preview now preserves position across fall/double-jump/rise boundaries; authoritative event integration remains open. |
| land_soft | Normal landing | Partial | Pilot | Distinct short compression and return to idle; separate from aerial attack landing lag. All-three-fighter review art: land_soft. Mechanics/event markers remain separate from body artwork. |
| land_heavy | Heavy / attack landing | Partial | Pilot | Author heavier compression and per-action recovery metadata. All-three-fighter review art: land_heavy. Mechanics/event markers remain separate from body artwork. |
| platform_drop | Pass-through platform drop | Audit | Pilot | Check down-input/drop rules; author drop start or document fall-pose reuse. All-three-fighter review art: platform_drop. Mechanics/event markers remain separate from body artwork. |
| teeter | Ledge teeter / balance | Missing | Pilot | Front/back balance poses and idle transition, separate from ledge hanging. All-three-fighter review art: teeter_front + teeter_back. Mechanics/event markers remain separate from body artwork. |
| footstool_attacker | Footstool bounce | Missing | Pilot | Six bounce drawings per fighter. Paired review aligns sole/crown at drawing three for all nine matchups, both facings. Staged trajectories only; deliberate/accidental triggers, resources and lockouts remain missing. |
| footstool_victim | Footstooled victim | Missing | Pilot | Six grounded squash and six airborne forced-fall drawings per fighter. Paired contact metadata and review complete; no footstool physics/state implementation. |

### Attacks and specials

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| jab_1 | Jab 1 | Existing | Pilot | Retain nine drawings. Fix engine duration disagreement before final animation timing. |
| forward_tilt | Forward tilt — side kick | Existing | Pilot | Proposed All-Rounder move identity: planted side kick from reference sheet. Startup, contact, retraction, recovery. |
| up_tilt | Up tilt — high kick | Existing | Pilot | Proposed All-Rounder identity: rising high kick. Match the actual overhead hitbox. |
| down_tilt | Down tilt — low sweep | Existing | Pilot | Proposed All-Rounder identity: low sweeping kick. Keep leg planted/low hurtbox consistent. |
| dash_attack | Dash attack | Missing | Pilot | Six drawings per fighter: All-Rounder running side kick, Lincoln shoulder charge, Swift low sliding kick. Artwork only; distinct MoveId, input selection, travel/hitboxes and recovery remain missing. |
| forward_smash | Forward smash | Existing | Pilot | Windup, variable-length charge hold, release/active poses and recovery. Pose identity still to be designed. Six-drawing review candidate now available; charge-hold marker and current-engine active windows registered. |
| up_smash | Up smash | Existing | Pilot | Upward attack plus charge hold and release; shared charging system, distinct pose. Six-drawing review candidate now available; charge-hold marker and current-engine active windows registered. |
| down_smash | Down smash | Existing | Pilot | Two-sided attack with readable front/back phases and charge hold. Six-drawing review candidate now available; charge-hold marker and current-engine active windows registered. |
| neutral_air | Neutral aerial | Existing | Pilot | Neutral aerial kick is a proposed All-Rounder design, not a universal Ultimate requirement. Six aerial poses available, airborne torso registration and current move-data timings; landing uses existing jump landing pose. |
| forward_air | Forward aerial | Existing | Pilot | Forward kick/strike design; startup, active, follow-through, return to airborne pose. Six aerial poses available, airborne torso registration and current move-data timings; landing uses existing jump landing pose. |
| back_air | Back aerial | Existing | Pilot | Rear kick/strike, maintaining facing and rear-facing hitbox. Six aerial poses available, airborne torso registration and current move-data timings; landing uses existing jump landing pose. |
| up_air | Up aerial | Existing | Pilot | Upward kick/strike; check head/leg reach and landing interruption. Six aerial poses available, airborne torso registration and current move-data timings; landing uses existing jump landing pose. |
| down_air | Down aerial | Existing | Pilot | Downward kick/strike; falling pose, active window, recovery and landing behavior. Six aerial poses available, airborne torso registration and current move-data timings; landing uses existing jump landing pose. |
| neutral_special | Neutral special | Partial | Pilot | Current custom projectile/burst behavior requires a locked move design. Ground/air versions and effect assets as needed. Six poses now available; air anchors reuse source poses. Counter success has a separate four-drawing clip. Neutral projectile terminology is inconsistent with the current brief hitbox execution path. |
| side_special | Side special | Partial | Pilot | Current custom horizontal special: startup/travel/contact/recovery; ground/air variants where behavior differs. Six poses now available; air anchors reuse source poses. Counter success has a separate four-drawing clip. Neutral projectile terminology is inconsistent with the current brief hitbox execution path. |
| up_special | Up special / recovery | Partial | Pilot | Recovery launch and end poses; define actionable/helpless result per fighter. Six poses now available; air anchors reuse source poses. Counter success has a separate four-drawing clip. Neutral projectile terminology is inconsistent with the current brief hitbox execution path. |
| down_special | Down special / counter | Partial | Pilot | Separate ready stance, successful counter and failed-counter recovery. Audit current counter window. Six poses now available; air anchors reuse source poses. Counter success has a separate four-drawing clip. Neutral projectile terminology is inconsistent with the current brief hitbox execution path. |

### Grab game

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| grab_stand | Standing grab / whiff | Existing | Pilot | Reach, catch and miss recovery; missing art is not a missing input. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| grab_dash | Dash grab / whiff | Missing | Pilot | Distinct approach/reach, moving catch and recovery. All-three-fighter review art: grab_dash. Mechanics/event markers remain separate from body artwork. |
| grab_pivot | Pivot grab / whiff | Missing | Pilot | Turn-and-reach clip and backward catch geometry. All-three-fighter review art: grab_pivot. Mechanics/event markers remain separate from body artwork. |
| grab_hold | Grab hold | Existing | Pilot | Holding loop with stable opponent attachment socket. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| pummel | Pummel | Existing | Pilot | Holder contact/recovery; synchronize victim recoil without breaking attachment. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| throw_fwd | Forward throw | Existing | Pilot | Windup, release marker and recovery. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| throw_back | Back throw | Existing | Pilot | Turn/release sequence; victim ownership and facing markers. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| throw_up | Up throw | Existing | Pilot | Overhead launch and release marker. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| throw_down | Down throw | Existing | Pilot | Groundward action, release/bounce behavior from the chosen move design. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| grabbed | Grabbed victim hold / struggle | Partial | Pilot | Victim loop and mash/escape feedback; sockets authored independently for all three fighter sizes. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| pummel_victim | Pummeled victim | Partial | Pilot | Victim hit flinch while still constrained to grab. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| throw_victim | Thrown victim direction suite | Partial | Pilot | Four release directions may transition into existing air-hit/tumble art; reserve source poses as needed. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |
| grab_release | Grab escape / release | Partial | Pilot | Ground and air release reactions; distinguish release from a successful throw. New per-fighter review artwork and role/event selection available. Final contact alignment and Ultimate behavior remain open. Current integration covers release to IDLE; distinct airborne release remains open. Contact polish now uses shared hand/upper-body sockets and visual-only windup/release offsets. |

### Defense

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| shield_raise | Shield raise | Existing | Pilot | Current SHIELD starts on guard pose; add transition into guard. All-three-fighter review art: shield_raise. Mechanics/event markers remain separate from body artwork. |
| shield_hold | Shield hold / shift | Partial | Pilot | Existing four-frame guard. Add directional shield-shift support; body reuse where suitable. |
| shield_hit | Shield impact / shieldstun | Existing | Pilot | Bracing pose and shield feedback, retaining correct shieldstun. All-three-fighter review art: shield_hit. Mechanics/event markers remain separate from body artwork. |
| shield_drop | Shield release | Missing | Pilot | Lower guard with cancel/recovery markers; required for Ultimate parry architecture. All-three-fighter review art: shield_drop. Mechanics/event markers remain separate from body artwork. |
| parry | Successful Ultimate parry | Different | Pilot | Current powershield triggers on raise. Replace with shield-release behavior; author success pose and effect. All-three-fighter review art: parry. Mechanics/event markers remain separate from body artwork. |
| roll_forward | Forward ground roll | Existing | Pilot | Six drawings exist. Audit Ultimate forward-roll timing/distance and dodge staling. |
| roll_backward | Backward ground roll | Partial | Reuse | Approved reuse: current mirrored roll body art. Forward/backward timings and travel must remain independently configurable; revisit only if visual polish exposes a gap. |
| spot_dodge | Spot dodge | Existing | Pilot | Six drawings exist. Audit dodge staling and Ultimate spot-dodge attack-cancel behavior. |
| air_dodge_neutral | Neutral air dodge | Partial | Pilot | Existing single AIR_DODGE is not a verified Ultimate neutral dodge; author enter/hold/end and landing. All-three-fighter review art: air_dodge_neutral. Mechanics/event markers remain separate from body artwork. |
| air_dodge_directional | Directional air dodge | Different | Pilot | Eight source-pose families per fighter, including three dedicated backward directions. Preview resolves all sixteen world-direction/facing combinations without flipping apparent facing to match travel. Authoritative direction capture, state and physics remain engine work. |
| air_dodge_land | Air-dodge landing | Different | Pilot | Dedicated landing recovery. Do not reuse Melee-style wavedash values as Ultimate defaults. All-three-fighter review art: air_dodge_land. Mechanics/event markers remain separate from body artwork. |
| shield_break_launch | Shield-break launch / fall | Partial | Pilot | Break currently becomes generic HITSTUN; add an identifiable break sequence. All-three-fighter review art: shield_break_launch. Mechanics/event markers remain separate from body artwork. |
| shield_break_dizzy | Shield-break dizzy loop | Missing | Pilot | Dedicated grounded stun loop and ending transition, not ordinary hit recoil. All-three-fighter review art: shield_break_dizzy. Mechanics/event markers remain separate from body artwork. |
| shield_break_recover | Dizzy recovery | Missing | Pilot | Stand-ready transition; interrupted by damage, grab or KO as appropriate. All-three-fighter review art: shield_break_recover. Mechanics/event markers remain separate from body artwork. |

### Damage knockdown and tech

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| hit_light | Light hit / body-height variants | Existing | Pilot | Four drawings each for high, middle and low reactions. Generic HITSTUN maps to hit_mid; body-height selection remains unavailable. |
| hit_heavy | Heavy recoil / aerial hit | Existing | Pilot | Six heavy recoil and six airborne-hit drawings per fighter. Preview-only; intensity/air reaction selection requires authoritative event data. |
| tumble | Tumble / directional launch | Existing | Pilot | Existing coiled source frame rotates uniformly around a centered pivot over 18 simulation ticks. No duplicate upright pause; repeated snapshots hold the same angle and interruption resets rotation. Recovery scale correction preserved. |
| knockdown_bounce | Missed-tech bounce / impact | Partial | Pilot | Existing missed-tech entry goes to HARD_LANDING; author impact before prone. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| jab_lock_reaction | Prone hit flinch / jab-lock reaction | Missing | Pilot | Four face-up and four face-down flinches per fighter. Preview-only; eligible prone-hit detection and lock limits remain engine work. |
| prone_face_up | Face-up downed idle | Missing | Pilot | Engine does not distinguish orientations; reserve a face-up pose. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| prone_face_down | Face-down downed idle | Partial | Pilot | Existing prone pose is provisional, with no orientation-specific state. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| getup_neutral | Neutral getup face-up/down | Different | Pilot | Current HARD_LANDING returns to idle after a fixed timeout; add player-selected options, orientation variants and the correct Ultimate auto-getup timeout. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| getup_roll_forward | Forward getup roll face-up/down | Missing | Pilot | Separate recovery action from invincible shield roll; author entry from prone. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| getup_roll_backward | Backward getup roll face-up/down | Missing | Pilot | Separate direction/pose and travel from prone. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| getup_attack_up | Face-up getup attack | Missing | Pilot | New attack entry with hitboxes; distinct from ledge attack. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| getup_attack_down | Face-down getup attack | Missing | Pilot | Separate floor-attack pose/hitbox timeline. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| trip | Trip / seated down state | Missing | Pilot | Attack/item-caused trip support and seated pose; no random running trips. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| trip_getup | Trip getup / directional rolls | Missing | Pilot | Neutral and forward/back seated recoveries; reuse only if transition reads correctly. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| trip_attack | Trip getup attack | Missing | Pilot | Third floor-attack variant from seated trip. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_neutral | In-place ground tech | Existing | Pilot | TECH_NEUTRAL exists; author impact, brace and recovery. Audit Ultimate timing. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_forward | Forward tech roll | Existing | Pilot | TECH_ROLL exists; new art and independent tuning. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_backward | Backward tech roll | Existing | Pilot | Separate backward pose/recovery where needed. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_wall | Wall tech | Partial | Pilot | Existing wall-tech logic needs dedicated contact/rebound art. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_wall_jump | Wall-tech jump | Partial | Pilot | Existing logic; author push-off transition and verify Ultimate eligibility. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |
| tech_ceiling | Ceiling tech | Missing | Pilot | Reserve upside-down brace/rebound; add ceiling collision/tech handling. Recovery batch supplies all-three-fighter art. Directional rolls share mirrored drawings. Floor orientation, getup inputs, trip/floor attacks and surface-tech event markers remain engine work. |

### Ledges

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| ledge_catch | Ledge catch / snap transition | Existing | Pilot | Hands lock to a ledge socket without feet anchoring. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_hang | Ledge hang | Existing | Pilot | Loop, breathing and regrab invulnerability feedback; do not bake invulnerability into pixels. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_climb | Neutral ledge getup | Existing | Pilot | Hands, torso and feet cross ledge with authorable traversal markers. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_roll | Ledge roll | Existing | Pilot | Distinct entry from hanging; ground-roll art alone cannot cover the climb. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_attack | Ledge getup attack | Existing | Pilot | Registered LEDGE_ATTACK is not a floor getup attack; author traversal and attack/recovery. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_jump | Ledge jump | Existing | Pilot | Push-off, release and airborne transition. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_drop | Voluntary ledge drop | Partial | Pilot | Current drop goes directly AIRBORNE; add release pose and correct away input. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |
| ledge_trump | Ledge-trumped reaction | Existing | Pilot | Existing displacement needs a release/fall reaction and Ultimate rule audit. Per-fighter ledge review artwork and grip metadata available; current engine timing is mapped. Ultimate behavior remains open. |

### Match and presentation

| Key | Action family | Engine | All-Rounder art | Required work / variants |
|---|---|---|---|---|
| ko | Blast KO / screen KO / star KO | Partial | Pilot | Six launch, four screen-impact and four star-KO body drawings per fighter; preview-only. Existing KO handling/effects preserved; camera, shrinking/fade and presentation triggers remain open. |
| respawn | Respawn arrival / platform wait / drop | Partial | Pilot | Four wait and six drop drawings per fighter; preview-only. Respawn platform, drop trigger and invulnerability presentation integration remain open. |
| entry | Match entry / ready | Partial | Pilot | Six arrival/ready drawings per fighter; preview-only. Countdown integration and transition timing remain open. |
| taunts | Up / side / down taunts | Missing | Pilot | Six drawings each for up/side/down gestures per fighter. Preview-only; inputs, interrupt rules and character-specific behavior remain open. |
| victory | Victory choices / loops | Missing | Pilot | Three six-drawing victory sequences per fighter; preview-only. Result selection, final pose holds and scene integration remain open. |
| defeat | Defeat / applause | Missing | Pilot | Four applause drawings per fighter; preview-only. Results integration remains open. |

## Conditional content inventory

This track is not silently excluded. Full casual Ultimate-style scope includes item interactions, relevant stage reactions and one designed Final Smash per original fighter. An item catalog and the three custom kits must be enumerated before these bundled families can become an exhaustive per-item/per-ability frame list. Character-specific Nintendo mechanics are not universal requirements for the three original fighters.

| Key | Action family | Engine | All-Rounder art | Eligibility and required work |
|---|---|---|---|---|
| helpless | Recovery helpless fall / landing | Missing | Pilot | Selected for all three after up special only. Six-drawing enter, loop and landing sheets per fighter. Explicit helpless state, eligibility, ledge exit and landing rules remain engine work. |
| jab_chain | Jab 2 / jab 3 | Missing | Pilot | Selected for all three: punch-punch-kick. Existing jab 1 plus new six-drawing jab_2 and jab_3. Support-foot registered; preview contact at drawing four. Engine chain routing, buffer/cancel windows and canonical combat timing remain missing. |
| rapid_jab | Rapid-jab loop / finisher | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Only if chosen moveset includes it; do not require both rapid jab and three-hit chain for every fighter. |
| angle_attacks | Angled tilt / smash variants | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Author high/low variants only for attacks designed to support angling. |
| special_variants | Special ground/air / charged / success variants | Partial | Reuse | Selected baseline keeps neutral close-range burst, side rush, up recovery and down counter. Existing ground/air source reuse plus helpless set covers the body families. No travelling projectile, transform, tether, reflect/absorb or stance variant selected; execution/naming and timing require engine reconciliation. |
| wall_jump | Wall jump / wall cling | Partial | Reuse | Baseline: Swift only, no cling. Reuse wall_tech_jump launch plus air_rise_loop. Current server path lacks roster gating; add eligibility and verify resource/decay rules. |
| crawl | Crawl forward/back | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Fighter-specific ability; crouch is core, crawling is not universal. |
| multi_jump | Additional jumps / float / glide | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Only selected fighter abilities; avoid inheriting removed mechanics from older Smash games. |
| tether | Air grab / tether recovery / tether hang | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Only a tether-equipped fighter needs weapon/rope and hanging animation. |
| reflect_absorb | Reflect / absorb / counter variant states | Partial | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Current down-special counter is not a universal reflector/absorber. Author only selected kit abilities. |
| transform | Transformation / stance / summon / weapon states | Missing | Not in baseline | Not selected for the core fighter kits; see FIGHTER-MOVESET-BASELINE.md. Custom-fighter design gate; maintain coherent weapon and socket layers. |
| final_smash | Final Smash ready / activation / attack / recovery | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. One designed sequence per fighter if implementing Ultimate casual-mode parity; not a universal shared attack animation. |
| item_pickup | Ground / air item pickup and catch | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Full Ultimate item mode requires pickup/catch/drop transitions and hand sockets. |
| item_carry | Light item hold / heavy item carry | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Hold layers for movement/air; heavy lift, walk/turn and throw as separate cases. |
| item_throw | Directional / smash item throw and release | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Ground/air angles plus release markers; drops may reuse open-hand poses. |
| item_attack | Batter / weapon / shooting / hammer use | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Asset families driven by the actual item catalog; enumerate per implemented item before calling this complete. |
| item_consume | Eat / drink / use item | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Character interaction and effects; animations depend on item type. |
| sleep | Sleep / wake | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Sleep effect state and reactions when sleep-inducing content is supported. |
| freeze | Frozen / thaw | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Frozen pose can be a held frame plus ice effect; thaw and break-out require transitions. |
| bury | Buried / struggle / escape | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Buried body pose and escape; requires matching hurtbox/movement rules. |
| stun_special | Other stun / electric / crumple reactions | Partial | Missing | Deferred content expansion; remains outstanding for broader feature parity. Only for supported attacks/items; distinguish from shield-break dizzy and standard hitlag. |
| swim | Water entry / swim / turn / exit / drowning | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Conditional on water stages; not covered by generic airborne movement. |
| ladder | Ladder grab / climb / idle / release | Missing | Missing | Deferred content expansion; remains outstanding for broader feature parity. Conditional on ladder-equipped stages. |
| status_materials | Poison / flower / ink / metal / invisibility / size | Missing | Effect or reuse | Deferred content expansion; remains outstanding for broader feature parity. Mostly effects/materials/scaling plus physics, not automatically new body drawings. Audit item-specific exceptions. |

## Engine work that does not automatically require new body drawings

| Workstream | Remaining audit / implementation | Animation consequence |
|---|---|---|
| Input fidelity | Separate up direction from jump; analog magnitude/flick detection, configurable tap jump and right-stick attacks. Replace shield+attack smash shortcut as default because shield+attack is a grab in Ultimate. | Reuses attacks, turns and grabs. |
| Canonical timing | One move-data source for startup/active/recovery, charge/hold and landing/autocancel windows. Reconcile 20/23 base-entry disagreements before locking timings. | Existing drawings can be retimed with metadata. |
| Buffer and cancel rules | Ultimate input buffer, short-hop aerial shortcut and damage behavior, run cancels, out-of-shield options, spot-dodge attack cancels, RAR/B-reverse and applicable specials. | Reuse action clips; add transition markers, not a bespoke sheet for every technique. |
| Collision fidelity | Multiple simultaneous moving hitboxes, per-body hurtboxes, shield pokes, clanks/trades, grabs and collision boundaries; attacks must not rely on artwork pixels. | Authored pose and socket metadata, with effect assets. |
| Air behavior | Full directional versus neutral air dodge, recovery lag/resource restoration, air acceleration/drift, fast fall, short/full hops and per-fighter recovery eligibility. | Uses listed airborne/dodge/helpless clips. |
| Defense fidelity | Shield-release parry, shield drop/shift, shieldstun/pushback, break/dizzy and dodge staling; configure forward/back roll separately. | Uses listed guard/dodge/break clips; effects separate. |
| Launch and damage fidelity | Verify Ultimate knockback, hitstun, hitlag, DI/SDI/launch-speed influence, rage/staling, crouch modifiers, armor and 1v1 damage rules against the chosen patch. | Mostly existing hit poses plus VFX. |
| Knockdown and ledges | Correct tech eligibility/windows, floor orientation, getup choice/timeout, trip sources, ledge snapping/regrabs/invulnerability/trumping and footstools. | Uses cataloged reaction/ledge clips. |
| Remove inherited defaults | Do not retain manual Melee L-cancel or the current fixed Melee-style wavedash as Ultimate behavior. Ultimate air-dodge landings and aerial autocancel need their own verified rules; avoid claiming Ultimate has no possible air-dodge slide. | No dedicated L-cancel sprite required. |
| World and modes | Stage geometry/collisions, items/hazards, stock/time rules and respawn. Six themes currently share one geometry; fighter art cannot supply stage parity. | Conditional stage/item tasks remain in the inventory. |
| Replication and determinism | Replicate action/phase, ground/air, victim orientation, item/weapon and attachment state. Handle hitlag, pause, interrupted moves and snapshot-skipped trigger frames. | Rendering follows authoritative simulation, never an unrelated wall clock. |
| Fighter-specific exceptions | Automatic turnaround, command inputs, extra jumps, crawl/wall-cling/tether, meters, stance changes and unique cancel systems are kit decisions for the original roster, not universal defaults. | Reuse or extend conditional animation families only after the kit is specified. |

## Animation contract before final drawing production

- Each action has explicit entry, startup, active/contact, hold/loop where applicable, recovery, interruption and exit markers. Charge duration is variable; do not bake one fixed-length charge into every attack.
- Store source rectangle, transparent padding, trim, source size, common anatomical scale, root, ground/air pivot, facing, duration and variant metadata. Keep grounded feet registered; airborne and curled poses use a body root. Preserve full silhouettes at sheet borders.
- Add attachment sockets for hands, feet, hips, held items, grabbed opponents and ledges. Throws need synchronized attacker/victim poses and one authoritative release marker.
- Hitboxes/hurtboxes are authored metadata, not inferred from visible pixels. Reserve multi-hit, multi-hitbox, sweet/sour-spot and orientation support; source poses must make contact readable.
- Distinguish front/back roll, face-up/face-down/trip, neutral/directional air dodge, grounded/airborne and weapon/item variants. Reuse or transform drawings only when the resulting action stays readable.
- Animation keys are not one FSM state per drawing. ATTACK may drive many clips; rendering must receive enough action/phase/context to select the correct clip.
- Hitlag, pause, cancellation, KO and throw/ledge release freeze or interrupt the correct clips. Short/full hop, fast fall and many advanced input techniques can reuse poses.
- Use material masks/variants for four-player identification. Preserve skin and signature costume colors rather than tinting the entire fighter indiscriminately.
- Preview both facings at gameplay size and 0.4 camera scale, light/dark backgrounds, and 1x speed. Inspect loop seams, slide, costume/face drift, clipping and attack contact.
- Track body sprites separately from projectile, charge, dust, hit, parry, shield, aura, item, KO and UI effects. These effects still belong in the complete asset backlog.
- Freeze the exact Ultimate reference patch and verify numerical timings when implementing parity; this checklist deliberately does not invent Ultimate frame values for the three custom fighters.
- Earlier drawing-count estimates are provisional. Budget drawings only after each bundled variant and kit-dependent ability is resolved; 125 families are not 125 sprite sheets.

## Engine implementation sequence after the art inventory is covered

1. Create one canonical move/action timing model; reconcile the 20/23 base-move metadata disagreements. Give animations independent event markers and approved timings.
2. Fix independent up/jump inputs, stick magnitude/flicks, right-stick attacks, shield+attack grab and Ultimate action selection. Add dash attack and selected jab branches.
3. Implement neutral/directional air dodge, shield-release parry, shield release/shift, dodge staling and cancel rules; replace inherited Melee defaults with verified Ultimate behavior.
4. Add orientation-aware knockdown/getup/floor attacks, trip/jab locks, footstools, techs and ledge rules. Use the reserved artwork instead of substituting generic idle or hitstun.
5. Expand collision/hurtbox, hitlag/launch and multi-actor grab/throw systems; implement selected fighter abilities and content-dependent interactions.
6. Replicate animation context in local/online play; validate repeated/skipped snapshots, pause, hitlag and deterministic simulation.
7. Compare behavior with the chosen Ultimate reference, then tune the original fighter kits. Names of Ultimate actions and an atlas full of drawings do not establish mechanical parity.

## Repository evidence

- packages/shared/src/types/PlayerFSMState.ts: 25 current states, including existing tech and ledge slots; no dedicated crouch, dash attack, oriented floor recovery, parry or dizzy state.
- packages/shared/src/types/MoveData.ts and packages/engine/src/moves/: 23 base move entries, with character overrides; no explicit dash-attack or floor-attack entries.
- apps/server/src/GameEngine.ts selectMoveId: attack routing; JUMP is used as up direction, shield+attack requests smash.
- packages/engine/src/fsm/states/utils.ts plus move definitions: duplicated duration/startup tables; the read-only comparison found 20/23 disagreements in total and/or startup metadata.
- packages/engine/src/fsm/states/AirDodgeState.ts: a single short dodge and down-focused direction capture with custom wavedash handling.
- apps/server/src/GameEngine.ts applyShieldBreak/applyHitResultToPlayer: generic hitstun for shield break; current perfect-shield logic uses shield raise.
- packages/engine/src/fsm/states/HardLandingState.ts: fixed timeout to IDLE, not a full menu of oriented getup options.
- packages/engine/src/fsm/states/LedgeHangState.ts: existing hang/getup options, but a simple directional climb/drop mapping.
- apps/client/src/renderer/fullbody/pilotTimeline.ts and public/fighter-art-pilot-v1/manifest.json: current nine clips, 51 All-Rounder drawings and fallback boundaries.
- docs/assets/FIGHTER-ART-PILOT-V1.md: dated art status; these pilot records are retained as historical evidence.

## External references

- [Nintendo Ultimate advanced techniques](https://www.smashbros.com/en_US/howtoplay/technique.html): Directional air dodge and short-hop attack overview. Marketing parry wording is not used to specify the release trigger.
- [Nintendo Ultimate gameplay basics](https://www.smashbros.com/en_US/howtoplay/basic.html): Percent damage and launching/recovery overview.
- [Prima Ultimate guide perfect shield](https://primagames.com/eguides/prima-games-8-eguide/ultimate-glossary-of-terms-and-mechanics/perfect-shield): Shield-release parry behavior. Exact numerical windows remain engine validation work.
- [Ultimate in-game Techniques menu transcription](https://www.ssbwiki.com/Techniques_(SSBU)): Secondary cross-check for common movement, grab, getup, edge and footstool action families; not a final frame-data authority.
- [Floor attack orientation variants](https://www.ssbwiki.com/Floor_attack): Face-up, face-down and trip floor-attack coverage.
- [Perfect shield version differences](https://www.ssbwiki.com/Power_shield): Secondary corroboration of release-triggered Ultimate parry.

The extended action list is a production synthesis of repository evidence and Ultimate reference categories. Proposed character gestures, reuse policies and implementation ordering are design recommendations. Numerical frame data, fighter-specific exceptions and the full conditional item/ability catalog still need explicit verification; this is not an assertion that every Ultimate subsystem has been exhaustively reproduced.

## Completion gate

For each of All-Rounder, Abe Lincoln and Swift: every core family has approved art or an explicit reuse decision; every selected conditional family has expanded variants; hit/throw/ledge/event sockets are registered; four-player materials and companion effects are accounted for; unknown kit and frame-data decisions are resolved. Engine parity is a separate later gate. No sprites or gameplay code were changed by creating this checklist.

## Roster art pack 1 progress

74 drawings added: three six-drawing kick clips per fighter, plus Lincoln and Swift idle/walk. Current totals: All-Rounder 69, Lincoln 28, Swift 28. These are review candidates, not full animation packs or engine parity signoff. The JSON inventory and interactive checklist now record per-fighter coverage. Next offensive families: smashes, aerials, specials, dash attack and grab game; remaining movement and reactions also require production.

## Smash animation batch

Added54drawings: forward,up and down smash for each fighter,six drawings per clip. Current totals: All-Rounder87drawings/15clips; Lincoln46/8; Swift46/8 (179drawings/31clips combined).

Separate anticipation,charge hold,contact and recovery. Review offers uncharged,half and full charge. Down smash has distinct front/rear contacts and current-engine collision circles. Renderer reads server chargeFrames; no server combat rules changed. Existing Ultimate timing discrepancies remain unresolved. Missing actions retain existing artwork. Next:five aerial attacks per fighter.

Validation:19focused unit tests,9browser tests and client production build passed. New sheets passed transparency/cell-boundary checks. Built-in imagegen prompts and source selections are in prompts.json. These remain review candidates; full roster replacement is incomplete.

## Roster coverage gap filled

Added Lincoln and Swift jab (9 drawings), run (6), jump/airborne/landing (6), shield (4), spot dodge (6), roll (6), and damage/recoil/tumble/prone (4): 41 drawings each, 82 total across 14 clips. All three fighters now have the same 15 clip families and 87 drawings each (261 drawings / 45 clips). Equal current pilot coverage; full Ultimate animation coverage remains incomplete.

New jabs use planted support-foot registration and character-specific timings. Airborne jump poses use torso registration; roll and tumble use center pivots. Existing 31 clips are unchanged. Optional full-body mode uses the new clips and retains fallback artwork for unfinished actions.

Validation: 19 focused unit tests, 10 browser tests and client build passed. New sheets passed alpha and cell-boundary checks. Built-in imagegen prompts and selected sources are in prompts.json. Both portable reviews are updated.

Next: review transitions and visual consistency across the equal roster, then five aerial attacks per fighter (15 clips). Engine timing disagreements and broader Ultimate mechanics remain open.

## Aerial animation batch

Added neutral, forward, back, up and down aerials for all three fighters: 15 clips / 90 drawings. Every fighter now has 20 clip families and 117 drawings (351 drawings / 60 clips). The previous 45 clips are unchanged. Source images and built-in imagegen prompts are included in this pack.

Aerials are selected only in AIR_ATTACK and follow character move-data startup, contact and recovery windows. Their fixed source-cell torso pivots use offsetY=0, freeing the legs from ground registration. Air-ready height is normalized to90percent of standing height; precise pose alignment remains a visual-review item. Landing lag switches immediately to the existing landing pose; damage and physics are unchanged. Current hitbox circles and landing-lag metadata are exposed for review, not verified Ultimate frame-data parity.

The synchronized review loads current clips on demand, avoiding decoding all60sheets at once. Its staged transition sequence includes all five aerials and landing. Both portable reviews are updated.

Validation:20focused tests,12browser tests,TypeScript and the client code bundle passed. All15new sheets passed alpha/cell checks. Full packaging failed with Windows EPERM while copying unrelated menu-audio/branding files; code bundling passed with public copying disabled. These are review candidates, not final full-roster replacement. Next:each fighter neutral, side, up and down special, including ground/air variants and effects as needed.

## Specials and counter batch

Added four six-drawing specials and one four-drawing successful-counter reaction per fighter:15bodyclips/84drawings. All three fighters now have25clips/145drawings each (435bodydrawings). Four shared effect sheets add16frames:neutral burst, side trail, recovery trail and counter flash.19new sheets,100new body/effect frames combined; prior60bodyclips unchanged.

Neutral special shows a one-tick release cue at startup completion, including the zero-active-frame declaration. Current server hitbox execution indexes its one-entry hitbox array; no travelling-projectile implementation was found in that path despite projectile wording in move-data comments. This remains an engine/design gap, not a new projectile mechanic. Counter readiness/failed recovery is separate from counter success; confirmed DOWN_SPECIAL hit events trigger only the attacking fighter retaliation clip, which progresses on state frames and cancels on state interruption.

Ground/air special versions reuse source poses with alternate torso anchors; up special is airborne. The individual review has Airborne special pose and Preview special effects controls. Effects are staged visual candidates in the review and saved as a separate manifest.effects library; live engine effect triggers are not integrated yet. Existing impact sparks remain in gameplay. Upward recovery artwork and effect pages use explicit row crop boundaries to preserve crossing extrema; the recovery effect orientation is corrected by rotation metadata.

Validation:21focused unit tests,13browser tests,TypeScript and code bundling passed. New sheets passed alpha/cell checks. Full public-file packaging remains blocked by earlier unrelated Windows file-copy errors; code bundling skips public copying. Built-in imagegen prompts/source records are in prompts.json. Broader Ultimate timing parity and precise palette/pose alignment remain review work.

Next:grab, hold, pummel, four throws and matching victim/release reactions across all three fighters.
