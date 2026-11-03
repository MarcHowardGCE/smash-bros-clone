# Deliberate power choices and physical puzzle effects

This pass implements the next stage of docs/connected-level-design-audit.md. Keyboard E or Xbox Y now selects a marked costume supply, and puzzle controls visibly activate machinery or shut off pressure hazards. Existing required gate conditions remain intact.

## Deliberate supplies

Harbor supplies are reduced from 16 to 12. Removed redundant positions x1800, x4208, x4352 and the elevated Captain at x5912; the latter was too close to the Egghead rigging control for a comfortable shared interaction button. Required puzzle powers remain available near Customs, Flagship and the captain's bell.

The first two harbor pickups remain automatic introductions. The optional jumping Gear pickup at cloud entry remains a physical choice. The other ten harbor and five cloud supplies use marked trays: walk past without changing outfits, then press E / controller Y nearby to choose. The nearest available eligible supply is selected, with a small horizontal/vertical interaction reach. One press selects at most one supply. A usable puzzle control takes priority over a nearby supply.

Tray lights distinguish ready/refilling supplies. Nearby text shows the chosen power, EQUIPPED, or a refill countdown. Harbor choice trays refill in four seconds; the cloud's required research supplies keep their four-second refills. The other cloud supplies retain eight seconds. Selecting a different power resets its ability charge without healing age. Damage pickup-lock grace still applies; immediate replacement cannot erase the first-hit consequence. Tutorial pickups remain automatic.

## Physical puzzle payoffs

| Area/control | Physical result | Required progression remains |
| --- | --- | --- |
| Harbor winch breach | Frees a moving boarding platform beside the rigging route. Its mast is grounded to the ship deck. | Winch plus Egghead rigging control still required for the final gate. |
| Cloud Gear reactor breach | Powers a cargo lift from the research floor toward the upper console. | Reactor plus Egghead console still required for the sky gate. |
| Underwater lower valve | Starts the pressure platform near the upper valve climb. | Both valves still required for the cathedral gate. |
| Underwater paired valves | Shuts off the two cathedral/wreck pressure vents; safe indicators turn green. Either valve order is allowed, with accurate partial-state messages. | Both valves still required. |
| Underwater relay A | Powers the existing research lift, providing another route through the lab. | Relay B still requires A; both still required for the research gate. |
| Underwater relay B | Shuts off the final lab vent and completes the exit gate requirements. | No gate can be jumped over or skipped. |

Required mechanisms begin docked. Activation starts a local motion clock at zero rather than jumping to an arbitrary phase of the global timer. Grounded riders are carried smoothly, can jump off, and use the same movement rules at every age. Activated state and local clocks persist in the area's snapshot while visiting another route. Original jumping/flight approaches remain available.

The cloud cargo lift now docks at x2440/y312 and rises to y224, beside the upper console ledge. The boarding platform is at x5744, traveling between y336 and y240 after the winch is freed. The pressure platform is at x1360, traveling from y688 toward y512; the research lift at x3552 activates after relay A. Existing static routes and supports are retained.

## Visual and instruction changes

Moving machinery has ready/locked cues, guide rails or a grounded mast, and readable labels above the rider. Controls announce their physical result rather than only their internal identifier. Objectives describe the new route options. Pressure vents render their pipe body separately from the animated release, so a shut-off vent stops venting. Existing terrain, catwalk and winch artwork is reused; no new generated assets are required.

## Verification

128 tests and syntax checks pass. New checks cover contact without costume replacement, explicit selection without healing, one-choice-per-press, puzzle-control priority, mandatory recovery supplies, damage grace, smooth lift activation, grounded rider transport, independent pressure/relay requirements, persistence and either valve order.

All three route browser progression checks pass. scripts/puzzle-effects-browser.mjs uses real keyboard controls for supply selection, Captain/Gear breaches, platform riding, a jump from the cloud lift to the console, both valve/relay chains and safe vents. It also verifies supply selection through simulated Xbox Y. Eight before/after views are saved in docs/screenshots/puzzle-effects-v1. The complete simulated controller browser check still passes, including menus and route return.

This verifies functionality and authored traversal, not first-time enjoyment. Difficulty and pacing still need the fresh-player playtest described in the audit. No movement, damage, flight-duration or gate-bypass rule was loosened in this pass.

## Main files

src/puzzle-effects.mjs centralizes supply selection, control priority, mechanism requirements and feedback. Shared mover/hazard updates are in src/encounters.mjs. The three data files define the supplies and physical links; their existing art modules render the results. Tests: src/puzzle-effects.test.mjs and scripts/puzzle-effects-browser.mjs.
