# Fighter dodge reference profiles

November 5, 2026. This pass replaces the shared fresh dodge timing with three explicit reference profiles. It does not finish fully fatigued timing verification.

## Reference choices

All-Rounder uses Mario as a balanced reference, Abe Lincoln uses Ganondorf as a heavyweight reference, and Swift uses Fox as a fast/light reference. These are engineering baselines for defensive timing, not character canon or wholesale moveset copies. Existing ordinary movement, weight, launch and contact reach are retained.

Sources: [Mario](https://ultimateframedata.com/mario), [Ganondorf](https://ultimateframedata.com/ganondorf), [Fox](https://ultimateframedata.com/fox), retrieved November 5, 2026. Values below are source human-frame values. Intangibility bounds are inclusive. Spot shows attack-cancel/full duration; the other recovery columns show total duration.

| Fighter | Spot cancel/total; intangible | Forward roll total; intangible | Back roll total; intangible | Neutral air total; intangible |
| --- | --- | --- | --- | --- |
| All-Rounder / Mario | 20/25; 3�17 | 29; 4�15 | 34; 5�16 | 52; 3�29 |
| Abe / Ganondorf | 23/28; 3�18 | 32; 4�16 | 37; 5�17 | 46; 4�32 |
| Swift / Fox | 18/23; 3�14 | 26; 4�12 | 32; 4�14 | 38; 2�26 |

| Fighter | Air down | Diagonal down | Side | Diagonal up | Up | Directional air intangible |
| --- | --- | --- | --- | --- | --- | --- |
| All-Rounder | 71 | 77 | 87 | 102 | 116 | 3�21 |
| Abe | 66 | 73 | 79 | 91 | 103 | 4�22 |
| Swift | 54 | 59 | 64 | 70 | 75 | 2�19 |

## Implementation

- packages/engine/src/physics/dodgeProfiles.ts is the single fresh-profile registry, including source URLs. Direction is captured on air-dodge entry; left/right diagonals share their corresponding recovery value.
- packages/engine/src/physics/dodgeFatigue.ts uses the selected profile as its base. Published fatigue coefficients are retained; stale duration arithmetic and invulnerability narrowing remain provisional. Spot attack cancel now scales from its own reference cancel point instead of assuming a fixed five-tick stale gap.
- The spot, roll and air-dodge FSM states use these profiles for recovery. Immunity uses the same profile, converting human start to zero-based start-minus-one and inclusive end to an exclusive end index. The FSM retains its established transition convention at total-minus-one.
- apps/server/src/GameEngine.ts normalizes roll travel across the selected duration, preserving total project roll distance. Backward/forward identity remains captured relative to facing.
- apps/client/src/renderer/fullbody/FullBodyPilot.ts normalizes the existing ground-dodge drawings to the profile timeline. Source artwork is unchanged.
- Neutral and directional airborne recovery are now distinct and considerably longer than the former universal 24-tick recovery. Existing air-dodge travel, gravity, ground landing and legacy wavedash rules remain separate and unchanged.

## Validation

Thirty-six independent source-fixture tests cover fresh ground/neutral windows and all eight air directions for each fighter. Thirty authoritative profile tests cover recovery boundaries and spot attack-cancel boundaries for all three fighters, including five directional-air recovery categories. Existing roll-distance, fatigue and parry checks remain in place.

Engine suite: 1,023 passed, one existing skip. Client suite: 590 passed. Engine/server/client builds passed. The initial broad server run found six obsolete fixture assumptions: four used All-Rounder's standing height for the other fighters, and two measured displacement before the longer roll finished. Corrected affected suites passed all 56 tests; the final full-server rerun passed 385 tests with 16 existing skips. All three production browser checks passed.

Production browser checks select each fighter and perform a fresh spot dodge followed by a fatigued backward roll. Evidence is in the task workspace outputs/defense-timing-v1/dodge-profile-{all-rounder,abe-lincoln,swift}.json. Detailed logs: work/profiles-engine.txt, profiles-client.txt and profiles-server-final.txt.

## Remaining work

1. Human feel check for all three profiles, especially longer roll recovery and directional air-dodge lockout. These are timing references; relative recovery does not follow a simple heavy-to-light ordering in every category.
2. Fully fatigued source endpoints and intermediate levels. Current source fixtures verify fresh values only; maximum-stale intangibility, integer rounding and stale cancel scheduling are not certified.
3. Directional-air stale movement, air-dodge landing lag and interruption-specific fatigue refresh. Current landing/wavedash handling is still custom and can end airborne recovery early.
4. Post-shieldstun parry restrictions, narrow adjacent-hit exceptions and true multiple-hit scheduling within a move instance, as described in FATIGUE-PARRY-SEQUENCE-AUDIT.md.

No claim of complete Ultimate parity or final balance signoff is made. Environment files and bonney remain excluded.

