# Fighter 3 Design — Track C (Wave 1)

## 1) Archetype decision — fast/floaty

Decision: Fighter 3 stays on the ROADMAP's recommended fast/floaty lane.

- Weight target: **~75** (implemented scaffold value: **75**)
- Mobility emphasis: high movement and air-control profile
- Multi-jump identity: planned for follow-up move/character tuning (not implemented in this todo)
- Weaker knockback profile than bruiser archetypes

Shared scaffold values now tracked for this archetype:

- `fighterWeight: 75`
- `hurtboxRadius: 26`
- `runSpeed: 6.8`
- `walkSpeed: 3.5`
- `jumpVelocity: -16.5`
- `shortHopVelocity: -10.3`

## 2) Fighter name + CharacterId literal decision

- Fighter name: **Swift**
- `CharacterId` literal: **`'swift'`**

Reasoning: `swift` matches existing lowercase kebab-safe ID conventions and keeps registry + move-routing naming simple for Todo 8.

## 3) Move overrides (Lincoln-style 8 override model)

Swift implements 8 move overrides following the Lincoln pattern, inheriting all other moves from the base move map.

| MoveId | Override | Rationale | Startup/Active/Recovery | Key Stats |
|---|---|---|---|---|
| `JAB` | Yes | Floaty combo starter: lower damage (2 vs 3), weaker knockback (KB growth 25 vs 30) | 3/2/10 | offsetX: 40, damage: 2, KB growth: 25 |
| `NEUTRAL_AIR` | Yes | Air control tool: slightly lower damage (7 vs 8), smaller radius (32 vs 34) | 5/6/16 | damage: 7, radius: 32, KB growth: 45 |
| `FORWARD_AIR` | Yes | Offstage edge-guard: higher damage (13 vs 12), aggressive hitbox | 8/4/18 | offsetX: 52, damage: 13, KB growth: 72 |
| `DOWN_AIR` | Yes | Floaty spike: lower damage (12 vs 14), tighter hitbox (offsetY: 28 vs 40) for combo routing | 10/2/20 | offsetY: 28, damage: 12, KB growth: 55 |
| `FORWARD_SMASH` | Yes | KO tool tuned for floaty: lower damage (16 vs 18), shorter reach (offsetX 62 vs 65) | 15/3/25 | offsetX: 62, damage: 16, KB growth: 95 |
| `NEUTRAL_SPECIAL` | Yes | Rushdown neutral: same damage (9), tighter radius (34 vs 36) for precision zoning | 8/0/20 | radius: 34, damage: 9, KB growth: 50 |
| `UP_SPECIAL` | Yes | Recovery tuned for floaty: lower KB growth (40 vs 45) to support multi-jump game plan | 4/3/30 | offsetY: -35, damage: 6, KB growth: 40 |
| `DOWN_SPECIAL` | Yes (identical) | Counter move, mechanics unchanged from default. Invincibility window: stateFrame < 6 | 6/0/16 | (counter logic in GameEngine.ts) |

All overrides maintain identical frame timing to base moves to keep FSM timing tables and engine thresholds in sync.

## 4) Renderer plan (plan only this sprint)

No renderer code is implemented in Todo 4. Planned implementation mirrors the Lincoln pattern:

1. Add `apps/client/src/renderer/swiftAnimations.ts` analogous to `lincolnAnimations.ts` for Swift-specific idle/walk and targeted attack-pose overrides.
2. Add Swift accessory hooks in renderer parts (same pattern where Lincoln accessories are conditionally drawn) for head/body silhouette differentiation.
3. Add renderer tests under `apps/client/src/renderer/parts/__tests__/` to verify Swift accessory draw-call deltas vs All-Rounder baseline.
4. Wire `characterId === 'swift'` animation/accessory selection with fallback to existing shared/default visuals.

Out of scope for this sprint todo: creating accessory/animation files, modifying `FighterRenderer`, or shipping visual polish.
