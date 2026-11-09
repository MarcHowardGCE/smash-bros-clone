# Current refinement decisions

Use [active work and signoff](plans/ACTIVE-WORK.md) for priorities and next actions. This page records the current behavior and links to the detailed evidence. The [previous refinement log](history/legacy-refinement.md) preserves every original milestone, result, and historical next step.

## Current decisions

| Area | Current baseline | Detailed record |
| --- | --- | --- |
| Roster, arenas, and art | The default roster has five fighters, with six distinct arena layouts. Production art is loaded by confirmed lineup. Visual signoff, fighter canon, and proposed stage events are tracked separately. | [Animation inventory](assets/ULTIMATE-ANIMATION-CHECKLIST.md) · [Atlas](assets/FIGHTER-PRODUCTION-ATLAS.md) |
| Menus and loading | Home opens without loading every fighter atlas. Online countdown waits for both the selected lineup and arena preparation. Hosted, accessibility, and extended hardware signoff remain open. | [Menu polish and performance](MENU-POLISH-PLAN.md) |
| Camera and KOs | Local, online, and Dojo use adaptive fight framing. Screen KO reaches the actual viewport edge before the blast. Star KO starts from the outgoing tumble and recedes through the upper-edge handoff. | [Camera and Star KO checks](TRAINING-DOJO.md#continuous-star-ko-handoff) |
| Network and reconnect | The server is authoritative at 60 Hz and targets 20 Hz snapshots. Local movement prediction and remote interpolation use separate clocks. Mid-match disconnects retain a seat for 30 seconds. Explicit Leave forfeits immediately. | [Netcode design](sprint/NETCODE-HARDENING-DESIGN.md) · [Room manager](../apps/server/src/RoomManager.ts) |
| Verification and release | Setup, test commands, and production operations live in the guides. Local checks and deployed signoff are tracked separately. | [Development](guides/DEVELOPMENT.md) · [Testing](guides/TESTING.md) · [Deployment](guides/DEPLOYMENT.md) |

## Current combat parity checkpoint

| Family | Current behavior and evidence |
| --- | --- |
| Launch and knockdown | Tracked launch acceleration, zero-hitlag DI/LSI, throw releases, and grounded and airborne hitstun handoffs have project fixtures. The launch audit owns throw follow-ups, percent sweeps, chase routes, and the corrected grab-through-floor cases. [Launch and contact audit](LAUNCH-MOTION-REFINEMENT.md) |
| Ledge and recovery | The same audit owns regrabs, getups, vulnerable approach, forced catch, trump, and aerial punishes. Directional air-dodge soft-platform and same-tick floor/ledge priority are measured project behavior. [Directional contact audit](LAUNCH-MOTION-REFINEMENT.md#six-stage-directional-air-dodge-contact-audit) |
| Shield, dodge, and parry | Dodge refresh, post-shieldstun parry restrictions, and buffered actions have Dojo coverage. The sequence audit owns fixture counts and remaining native exceptions. [Fatigue and parry audit](FATIGUE-PARRY-SEQUENCE-AUDIT.md) |
| Controls and transitions | Analog walking, aerial auto-cancel, landing buffers, and recovery transitions have dedicated records. Mixed face and right-stick presses and releases are traceable in the Dojo. [Analog movement](ANALOG-MOVEMENT-REFINEMENT.md) · [Landing inputs](LANDING-INPUT-REFINEMENT.md) · [Mixed-input trace](FATIGUE-PARRY-SEQUENCE-AUDIT.md#dojo-trace-for-mixed-input-charge) |

Exact Ultimate 13.0.5 collision freeze, cinematic tech exceptions, directional recovery, selected parry and mixed-input rules, and native Star KO projection remain provisional. The project fixtures establish observed project behavior. Human balance and feel signoff remains open. The [archived checkpoint](history/legacy-refinement.md#current-combat-parity-checkpoint) retains the original case counts and per-milestone links.

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
