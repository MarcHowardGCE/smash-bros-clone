# Input & Settings Design (Sprint Track B)

## 1. Double-Tap Smash Detection

**Decision: Threshold = 250 milliseconds between directional keydowns**

When a player presses left or right twice within 250 ms on the same direction, a "smash intent" flag is set. This intent is consumed by the next attack press, signaling the engine to prefer a smash move over a tilt.

**Rationale:**
- 250 ms matches the human reaction time for deliberate double-tap inputs and does not interfere with normal movement.
- The threshold is client-side only — no new protocol bits, no engine changes.
- If the second press exceeds 250 ms, the intent is discarded (no timeout carry-over).
- The intent persists across frames until an attack is pressed, then clears.

**Implementation location:** `apps/client/src/input/InputManager.ts` as an opt-in constructor option (`doubleTapSmash: true`).

---

## 2. How Smash Intent Reaches Move Selection

**Boundary:** The client's smash-intent flag influences only which `currentMoveId` the FSM consumes; it does NOT modify FSM state transitions or physics.

**Flow:**
1. `InputManager` detects double-tap, sets `smashIntent = true`
2. Client's movement prediction layer marks the input event (semantic: this was a smash input)
3. `AttackState` in `packages/engine/src/fsm/states/AttackState.ts` already reads `ctx.player.currentMoveId` to resolve move duration
4. The client-side selection logic maps `currentMoveId` based on the smash-intent flag:
   - If smash-intent: pick a smash move (forward-smash, up-smash, down-smash per stick direction)
   - If no smash-intent: pick a tilt or neutral move per usual
5. `currentMoveId` is packed into the `InputEvent` sent to the server
6. Server executes the move via the normal FSM pipeline — no engine changes needed

**Guard:** The smash-intent flag is a client-side UI hint. It never touches FSM internals, hitlag, hitstun, or knockback calculation. It only influences which of the pre-existing moves fires.

---

## 3. Settings Storage Schema

**Key:** `smash:settings:v1` (localStorage)

**Schema:**
```typescript
{
  volume: number;              // 0.0 to 1.0
  keymapP1: Record<string, string>; // e.g., { "ArrowLeft": "LEFT", "KeyA": "LEFT", ... }
}
```

**Versioning & Migration:**
- The version suffix `v1` allows future migrations (e.g., `smash:settings:v2`) without breaking existing saves.
- `SettingsStore.load()` checks the version key and applies migrations if found (e.g., if only `smash:settings` exists, migrate to `smash:settings:v1`).
- Corrupt or missing JSON defaults to `{ volume: 0.7, keymapP1: DEFAULT_KEYMAP_P1 }`.
- Private-mode browsers throw on `localStorage` access; `SettingsStore` catches and falls back to in-memory storage.

**Persistence layer:**
- `load()`: read from `localStorage` with JSON parsing and error handling
- `save()`: write to `localStorage` with JSON stringification
- `get(key)`: return in-memory value
- `set(key, value)`: write to in-memory map AND call `save()`

---

## 4. Settings Screen Integration

**New UIManager Phase:** `'settings'` (alongside existing `'lobby'`, `'match'`, `'result'`, etc.)

**Screen entry point:**
- Reachable from the main lobby via a "Settings" button (not retrofitted into the controls screen)
- In-game (from the match pause menu) as a future enhancement
- Settings screen is a new `showSettings()` method on `UIManager`, similar to `showControls()`

**Content scope (this sprint):**
- Volume slider (0.0–1.0) with live preview
- Keymap display (non-interactive — full rebind UI deferred to future)
- Cancel / Apply buttons to save or discard changes

**Store wiring:**
- Settings screen reads initial values via `SettingsStore.load()`
- Volume slider changes call `SettingsStore.set('volume', newValue)` which auto-persists
- On close, settings are already saved (no commit button needed)
- If `localStorage` is unavailable, the screen renders with in-memory fallback (volume changes don't persist, but game remains playable)

**UIManager test:**
- Assert the settings phase renders when called
- Mock `localStorage` and assert a volume change persists
- Assert the fallback gracefully handles unavailable `localStorage`

---

## Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Double-tap threshold | 250 ms | Human reaction time, no engine impact |
| Storage key | `smash:settings:v1` | Versioned, future-migration-safe |
| Schema fields | `volume`, `keymapP1` | Matches immediate input-settings needs |
| Fallback on missing storage | In-memory map | Privacy-mode browsers; game remains playable |
| Settings screen entry | New UIManager phase | Separate from controls screen; cleaner ownership |
| Keymap rebind capture | Deferred to next sprint | Design is ready; implementation not on hour budget |

---

## Follow-ups

1. **Full keymap rebind UI:** Once the settings screen is in place, add interactive key-capture to rebind all four keymaps (P1–P4).
2. **Per-character settings:** Future versions could store move preferences or per-fighter keybinds.
3. **Audio calibration:** Settings screen can expand to include music/SFX volume split once `SfxManager` ships.

---

## Team Discussion — Round 2 (Sprint Sync-Back)

The team circled back on the four open discussion questions above. This section records the group's final decisions, superseding the placeholder values used earlier in this doc where they differ.

### 1. Double-tap threshold

**Decision: 350 ms** (supersedes the 250 ms placeholder in Section 1 / Decisions Summary).

The group accepted a looser window than the original placeholder for a more forgiving feel, with the known tradeoff of higher false-positive risk during fast dash-dancing. Flagged for testing/tuning once the skeleton is playable — this number is not considered final until play-tested.

### 2. Opt-in vs. default-on

**Decision: Opt-in.** Double-tap-to-smash ships disabled by default, toggled on via the settings screen. Shield+attack remains the default/fallback smash input for all players regardless of this setting. (Confirms Section 4's settings screen scope should include this toggle.)

### 3. How the smash signal reaches the server

**Decision: Local trick only — no new network signal.**

Double-tap detection stays entirely client-side. It does not add any new field to `InputEvent` or `INPUT_BITS`, and does not require server or protocol changes. It works by reusing the signal the server already understands (shield+attack), so the server remains the sole authority on whether an attack resolves as a tilt or a smash. This confirms and simplifies Section 2 above — no new engine-side move-selection logic is needed beyond what already reads `SHIELD` + `ATTACK` server-side.

**Implementation note (not yet reflected in Section 2):** the current draft in Section 2 describes the client selecting `currentMoveId` directly and packing it into `InputEvent`. The group's Round 2 answer favors an even simpler mechanism: on a tick where ATTACK is newly pressed and a valid double-tap was registered, the client sets the `SHIELD` bit in the outgoing `held` bitmask for that tick only. This reuses the server's existing `wantsSmash = isHeld(SHIELD) && isPressed(ATTACK)` check verbatim — zero new fields, zero engine changes. Section 2 should be updated to match before implementation starts.

### 4. Settings schema & versioning

**Decision: Versioned schema with migration function (per Section 3), plus a new requirement:** the settings architecture must support an **exportable/importable keybind profile** — a file a player can save and drop back in to restore their customized keybinds across sessions or devices.

Backwards-compatibility handling for future schema/format changes is explicitly deferred as a to-do rather than a blocking requirement for this sprint.

**Impact on Section 3 schema:** the `keymapP1` field already lends itself to export (it's a plain serializable `Record<string, string>`). Add to scope:
- An `exportSettings()` / `importSettings()` pair on `SettingsStore` that serializes/deserializes the versioned JSON blob (or just the keybind subset) to/from a downloadable file.
- Import path must validate the incoming version and reuse the same migration path as `load()` — do not assume imported files match the current schema version.

---

## Open Items for Next Sync

- Confirm final double-tap threshold after play-testing (350 ms is provisional, not locked).
- Update Section 2 to describe the SHIELD-bit-reuse mechanism instead of the `currentMoveId`-selection description currently written there.
- Scope the export/import UI (button placement, file format — likely JSON download/upload) for the settings screen described in Section 4.
