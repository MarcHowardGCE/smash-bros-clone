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
