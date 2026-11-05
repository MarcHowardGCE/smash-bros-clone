# Out-of-shield, dodge fatigue and parry refinement

Implemented November 5, 2026.

## Implemented behavior

### Out of shield

Up smash now bypasses shield-drop recovery when requested through an upward smash input or upward C-stick attack. It takes precedence over the held-shield attack-to-grab shortcut. Explicit grab still requests grab. Shieldstun and a release already in progress continue to block the shortcut. Existing out-of-shield jump and up special behavior is retained.

A normal blocked hit marks the current shield hold. A standing grab started from that hold receives four additional startup ticks. Tests compare actual first active hitboxes, rather than only inspecting a counter. A grab from an untouched shield receives no penalty; raising a new shield clears the old hit marker. Parrying alone does not set it. The delay holds the initial grab pose and does not consume active/recovery frames or change reach.

[Ultimate Frame Data notes](https://ultimateframedata.com/smash) support bypassing shield drop for up smash/up special and adding four ticks to grabs after a shield hit. This implementation uses a marker for the current shield hold; broader shield-grab buffering remains separate work.

### Shared dodge fatigue

Roll, spot dodge and air dodge now share one fatigue history. Each dodge snapshots the existing level, then increases history up to five levels. The first dodge remains fresh. Subsequent dodges add two recovery ticks per level, up to ten. Spot-dodge attack cancellation shifts by the same amount, retaining its five-tick advantage over full recovery. Rolls and air dodges gain no attack cancel.

The existing project intangibility window is narrowed by fatigue: its start moves later by floor(level/2), its end moves earlier by level. Fresh timing and roll/air-dodge travel speed/distance are retained. One history level recovers every 120 unfrozen simulation ticks since the last dodge/recovery step. Hitlag pauses the recovery counter; respawn clears history. A dodge retains its entry-level timing even if history recovers during it.

These are explicit project tuning values, not verified Ultimate fatigue curves. Per-fighter forward/back roll profiles, directional air-dodge recovery, landing penalties and exact Ultimate staling coefficients remain open. The mechanism now exists and is tested, but full parity is not claimed.

### Parry and exception handling

Successful parry no longer adds ordinary shieldstun after its separately calculated freeze. Shield SDI is disabled during that successful parry. The existing five-tick release opportunity, attacker/defender freeze formulas and zero shield-health drain are retained.

Added tests through the real hit-resolution path for detached versus attached projectile owner freeze, indirect versus direct contact, and suppressed shield ASDI. Detached projectile owners receive no freeze; attached and direct/indirect contacts retain their existing metadata-dependent formulas. No reflection mechanic was added.

Automatic consecutive/multihit re-parries remain unimplemented. A consumed parry still uses the prior protective shield behavior until its state exits; a later contact can be treated as a normal block. Fighter-specific defenses and exceptional attacks are not certified. This pass corrects added guardstun and verifies existing exception plumbing; it does not declare every Ultimate exception complete.

## Code references

- packages/engine/src/fsm/states/ShieldState.ts: out-of-shield routing and new-hold reset.
- apps/server/src/GameEngine.ts: move choice, grab startup, parry guardstun/SDI and respawn reset.
- packages/engine/src/fsm/FSMController.ts: startup hold and fatigue recovery with hitlag freeze.
- packages/engine/src/physics/dodgeFatigue.ts: shared history and tuning.
- packages/engine/src/fsm/states/{SpotDodgeState,RollState,AirDodgeState}.ts: entry history and recovery.
- packages/engine/src/hitbox/immunity.ts: fatigue-dependent intangibility.
- packages/shared/src/types/GameState.ts: replicated optional timing/history fields.

## Validation

Engine: 984 passed, one existing skip. Client: 590 passed. Shared, engine, server and client production builds passed. The initial broad server run had 340 passes and five legacy parry-stun expectation failures; those expectations were corrected without changing normal shieldstun assertions. The affected shield and expanded defensive suites then passed all 37 tests. Final full server rerun: 348 passed, 16 existing skips. All three suites are clean.

A production-preview simulated-controller check passed upward C-stick up smash directly from shield and verified replicated dodge fatigue after a spot dodge. Evidence: task workspace outputs/defense-timing-v1/defense2-browser.json. Detailed suite logs: work/defense2-engine.txt, defense2-client.txt and defense2-server-final.txt.

No environment files or bonney content were inspected. Artwork, accepted movement/launch tuning, contact reach and logo were preserved. Builds skip asset repacking and redirect environment loading to the empty task directory.

## Next

1. Human controller test: upward C-stick from shield, post-block grab responsiveness, repeated dodges and a pause between them.
2. Verify exact Ultimate dodge staling parameters and per-fighter fresh/stale profiles before replacing the clearly marked project curve.
3. Implement and validate consecutive/multihit parry behavior and exceptional projectile interactions with dedicated contact fixtures.
4. Continue the parity audit for directional air-dodge/landing rules and shield-grab buffering.


## Follow-up correction
The temporary fatigue curve and broad automatic-parry backlog above are superseded by [FATIGUE-PARRY-SEQUENCE-AUDIT.md](FATIGUE-PARRY-SEQUENCE-AUDIT.md). Modern Ultimate generally permits one parry per release. Published coefficients are now used, while exact fighter profiles and rounding remain open.
