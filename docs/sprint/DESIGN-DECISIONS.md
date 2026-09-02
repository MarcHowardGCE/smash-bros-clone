# Design Decisions — Sprint Track B (Input & Settings)

Consolidated, current-state decisions from `INPUT-SETTINGS-DESIGN.md`. Where later rounds of discussion superseded an earlier value, only the final decision is listed here — see that doc for the full discussion history and rationale trail.

---

## Double-Tap Smash Detection

| Aspect | Decision |
|---|---|
| Threshold | **350 ms** between directional keydowns on the same direction (supersedes original 250 ms placeholder — provisional, pending play-test) |
| Default state | **Opt-in** — disabled by default, enabled via the settings screen |
| Fallback | Shield+attack remains the default/always-available smash input regardless of this setting |
| Network impact | **None.** Purely client-side. On a tick where ATTACK is newly pressed and a valid double-tap was registered, the client sets the `SHIELD` bit in the outgoing `held` bitmask for that tick only — reusing the server's existing `wantsSmash = isHeld(SHIELD) && isPressed(ATTACK)` check verbatim. No changes to `InputEvent`, `INPUT_BITS`, or any engine/server logic. |
| Implementation location | `apps/client/src/input/InputManager.ts`, opt-in constructor option (`doubleTapSmash: true`) |

---

## Settings Storage Schema

| Aspect | Decision |
|---|---|
| Storage key | `smash:settings:v1` (localStorage), versioned for future migrations |
| Schema fields | `volume: number` (0.0–1.0), `keymapP1: Record<string, string>`, plus a `doubleTapSmash: boolean` toggle |
| Versioning | Versioned schema with a migration function on `load()`; unversioned legacy saves migrate forward automatically |
| Export/import | **In scope this sprint.** `SettingsStore.exportSettings()` / `importSettings()` serialize/deserialize the versioned JSON blob (or keybind subset) to/from a downloadable file, so a player can save and restore a custom keybind profile across sessions/devices. Import validates the incoming version and runs through the same migration path as `load()` — never assumes the imported file matches the current schema version. |
| Backwards compatibility | Explicitly deferred as a future to-do, not a blocking requirement this sprint |
| Fallback on missing storage | In-memory map (private-mode browsers); game remains playable, changes just don't persist |

---

## Settings Screen Integration

| Aspect | Decision |
|---|---|
| Entry points | **Lobby + in-match pause menu**, both this sprint |
| Save model | **Live-persist, no Cancel/Apply.** Every change calls `SettingsStore.set()` immediately; a single Close control just exits the screen. Nothing is staged or discardable. |
| Content scope | Volume slider (live), keymap display (non-interactive — full rebind UI deferred), **Double-Tap Smash toggle**, **Export/Import Keybinds buttons** |
| Rebind UI | Deferred to a future sprint (design-ready, not this sprint's implementation) |

**⚠️ Cross-team dependency:** the in-match pause menu is also being modified this sprint by **Team D (Netcode Hardening)** for the disconnect/rejoin grace-window flow. Before touching shared pause-state logic, Team B must sync with Team D to either agree on file/component ownership, or scope this sprint's change to "wire the button only" and defer shared pause-state changes until Team D's rejoin flow lands — per the documented merge order (`D → C → A → B`).

---

## Open Items Carried Forward

- Confirm the 350 ms double-tap threshold after play-testing — not locked.
- Sync with Team D on Settings-vs-pause-menu interaction before implementation.
- Define the exact export/import file format (e.g., `{ version, keymapP1 }` JSON) and button placement relative to the keymap display.
