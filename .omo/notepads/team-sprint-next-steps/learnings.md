# Learnings

## Todo 4 (Track C, Wave 1) — Fighter 3 spec + stats scaffold

- Kept fighter identity as **Swift** with `CharacterId` **`'swift'`** to match existing branch direction and existing registry/test naming.
- Confirmed stats scaffold explicitly copies `ALL_ROUNDER_STATS` as base and then overrides fast/floaty tuning values:
  - `fighterWeight: 75`
  - `hurtboxRadius: 26`
  - `runSpeed: 6.8`
  - `walkSpeed: 3.5`
  - `jumpVelocity: -16.5`
  - `shortHopVelocity: -10.3`
- Updated `CharacterId` union + registry + `CHARACTER_IDS` list; regression guard asserts `CHARACTER_IDS.length === 3`.
- Rewrote `docs/sprint/FIGHTER-3-DESIGN.md` to the required four-section structure:
  1) archetype decision (fast/floaty),
  2) fighter name + `CharacterId`,
  3) 7 planned move overrides + per-move differentiation rationale,
  4) renderer follow-up plan only.
- Scope guard held: no move override data authored yet, no renderer/FSM/physics/hitbox changes.
