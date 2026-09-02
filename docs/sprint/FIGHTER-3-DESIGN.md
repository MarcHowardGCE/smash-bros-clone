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

## 3) Planned override targets (Lincoln-style 7 override model)

Following Lincoln's established 7-override approach, Swift will also target 7 overrides while inheriting all other moves from the base move map.

| MoveId | Override? | Differentiation rationale |
|---|---:|---|
| `JAB` | Yes | Core pressure starter for fast archetype: quicker poke identity, lighter conversion than bruiser power-jab. |
| `FORWARD_SMASH` | Yes | Keeps a KO route while preserving weaker launch profile than heavyweight archetypes. |
| `DOWN_AIR` | Yes | Air-control/spike identity move for floaty offstage play and combo routing. |
| `NEUTRAL_SPECIAL` | Yes | Utility special tuned for movement/control rather than raw burst knockout. |
| `SIDE_SPECIAL` | Yes | Horizontal approach/chase signature to reinforce speed archetype. |
| `UP_SPECIAL` | Yes | Long recovery axis that supports floaty + multi-jump game plan. |
| `DOWN_SPECIAL` | Yes | Defensive reset option tuned around evasion/counterplay instead of heavy punish lethality. |

Note: Todo 4 records scope decisions only. Concrete frame/hitbox numbers are intentionally deferred to Todo 8.

## 4) Renderer plan (plan only this sprint)

No renderer code is implemented in Todo 4. Planned implementation mirrors the Lincoln pattern:

1. Add `apps/client/src/renderer/swiftAnimations.ts` analogous to `lincolnAnimations.ts` for Swift-specific idle/walk and targeted attack-pose overrides.
2. Add Swift accessory hooks in renderer parts (same pattern where Lincoln accessories are conditionally drawn) for head/body silhouette differentiation.
3. Add renderer tests under `apps/client/src/renderer/parts/__tests__/` to verify Swift accessory draw-call deltas vs All-Rounder baseline.
4. Wire `characterId === 'swift'` animation/accessory selection with fallback to existing shared/default visuals.

Out of scope for this sprint todo: creating accessory/animation files, modifying `FighterRenderer`, or shipping visual polish.
