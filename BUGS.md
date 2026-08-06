# BUGS.md — Bug Tracking for Smash Bros Clone

## Severity Legend

| Severity | Definition |
|----------|------------|
| **Blocker** | Prevents the game from running or a core system from functioning at all. Ship-stopping. |
| **Major** | Significant gameplay breakage — wrong physics, combat that doesn't register, input drop. Playable but broken in a meaningful way. |
| **Minor** | Noticeable problem that doesn't ruin a match. Workarounds exist. |
| **Cosmetic** | Visual or audio glitch only. No gameplay impact. |

---

## Entry Schema

Each bug entry follows this template:

```
## [SEVERITY] Title

- Area: physics | combat | input | UI | netcode
- Repro steps:
  1. Step one
  2. Step two
- Expected: What should happen
- Actual: What actually happens
- Related ROADMAP gap (if any): Reference to gap or "None"
- Found in: Tier 1 (agent) | Tier 2 (human) | Tier 3 (existing tests)
```

---

## Bug Entries

---

## [Major] Double jump consumed on wall contact without leaving ground

- Area: physics
- Repro steps:
  1. Spawn any character near a vertical wall surface.
  2. Walk into the wall so the character is flush against it.
  3. Press jump once to leave the ground, then immediately press jump again while still touching the wall.
- Expected: The second jump fires as a double jump, launching the character upward with the standard double-jump velocity curve.
- Actual: The engine treats the wall contact as a grounded state, silently consuming the double-jump token without producing any upward movement. The character then has no remaining jumps until they land again.
- Related ROADMAP gap (if any): Phase 2 gap — wall-jump / wall-slide mechanics not yet scoped.
- Found in: Tier 1 (agent)
