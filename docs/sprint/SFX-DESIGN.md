# SFX Design: Sound Effects & Playback Architecture

**Status:** Design document for Sprint A Track A (Wave 1)  
**Baseline Commit:** 5b38f9aa64768126bcfa0f28e908ca33966f56e0  
**Created:** 2026-09-02

---

## 1. Event → SFX Clip Decision Table

The game emits five core sound-effect events. Each routes to a specific audio clip with deterministic playback parameters:

| Event | Trigger | Clip Path | Playback Rate | Volume | Duration (est.) | Priority |
|-------|---------|-----------|---------------|--------|-----------------|----------|
| **Hit** | `applyHit()` via `HitEventData.knockbackMagnitude` | `sfx/hit.mp3` | Pitched by knockback (formula below) | 0.8 | 200–300 ms | HIGH |
| **Jump** | FSM transition to `Jumpsquat` or `DoubleJump` state | `sfx/jump.mp3` | 1.0 (fixed) | 0.7 | ~150 ms | MEDIUM |
| **Land** | FSM transition to `Idle`, `Walk`, `Run` from airborne | `sfx/land.mp3` | 1.0 (fixed) | 0.6 | ~100 ms | MEDIUM |
| **Shield** | FSM transition to `Shield` state | `sfx/shield.mp3` | 1.0 (fixed) | 0.7 | ~80 ms | MEDIUM |
| **KO** | `isKnockedOut` flag set to `true` in `PlayerState` | `sfx/ko.mp3` | 1.0 (fixed) | 1.0 | ~400 ms | HIGHEST |

### Hit Playback Rate Formula

**Knockback pitch scaling:** When a hit lands, the SFX pitch adjusts in real time to reflect impact severity:

```
playbackRate = 0.8 + (knockbackMagnitude / 100) * 0.6
```

**Bounds:**
- Minimum rate: 0.8× (0 knockback — very weak hit, already below normal pitch)
- Maximum rate: 1.4× (100+ knockback — powerful hit, noticeably higher pitch)
- Typical range: 0.9–1.2× for most gameplay situations

This creates immediate audio feedback: weak jabs sound dull and low, powerful smashes sound sharp and high. No separate "weak vs strong" clip needed — one source material with dynamic rate adjustment suffices.

---

## 2. Hook-Point Locations & FSM Transitions

### 2.1 Hit Events (Combat Feedback)

**Source:** `packages/engine/src/hitbox/index.ts` → `resolveHit()`  
**Client-side delivery:** `StateSnapshot.hitEvents` array (binary msgpack)

```typescript
// Server-side (authoritative):
// HitEventData emitted in GameEngine.ts during hitbox detection
// Includes: attackerId, defenderId, moveId, damage, knockbackMagnitude, worldX, worldY

// Client-side reception (network/GameClient.ts):
// StateSnapshot.hitEvents is an array of HitEventData
// Delivered every 20 Hz (3 server ticks)
// Client iterates hitEvents and calls playSfx('hit', { 
//   volume: 0.8, 
//   playbackRate: 0.8 + (knockbackMagnitude / 100) * 0.6 
// })
```

**Timing guarantee:** Hit SFX plays exactly when the `StateSnapshot` containing the hit is received — no client-side prediction, no divergence.

---

### 2.2 Movement Events (FSM State Transitions)

**Source:** `packages/engine/src/fsm/FSMController.ts` → `update()` method

| FSM State Entry | Event | Audio Hook |
|---|---|---|
| `Jumpsquat` | Player initiates jump | **Jump SFX** plays (rate 1.0, volume 0.7) |
| `DoubleJump` | Second jump input mid-air | **Jump SFX** plays again |
| `Idle` / `Walk` / `Run` | Transition FROM airborne state | **Land SFX** plays (rate 1.0, volume 0.6) |
| `Shield` | Player raises shield | **Shield SFX** plays (rate 1.0, volume 0.7) |

**Implementation location:** `apps/client/src/audio/SfxManager.ts` (TBD — not yet created)

The **LocalPredictor** (client-side movement simulation in `apps/client/src/network/LocalPredictor.ts`) will detect FSM state transitions on the local player and emit SFX immediately (latency-free). For remote players, FSM state is only known via server snapshot, so their SFX follows 50 ms behind due to interpolation latency. This is acceptable because remote sounds don't sync with remote visuals in a network game — only the local player's input-to-sound latency matters for perception.

---

### 2.3 KO Events (Game-State Flag)

**Source:** `packages/engine/src/fsm/FSMController.ts` or `packages/engine/src/physics/index.ts` (blast zone detection)

**Client detection:** `StateSnapshot.fighters[i].isKnockedOut` boolean flag

```typescript
// Client-side:
// Compare previous snapshot.fighters[i].isKnockedOut with current snapshot
// On false → true transition: playSfx('ko', { volume: 1.0, playbackRate: 1.0 })
```

**Timing:** KO SFX plays when the first snapshot arrives containing the player's KO state. Since blast-zone detection is deterministic and server-authoritative, all clients will hear the KO SFX at the same moment (relative to their network latency).

---

### 2.4 Shield Break (Optional — Not in Wave 1)

**Hook point:** Shield health <= 0 in `PlayerState.shieldHealth`

For future expansion. Currently all shields regenerate; no break mechanic. Placeholder SFX or silence is acceptable.

---

## 3. Asset-Sourcing Decision & File Structure

### Placeholder Generation vs. Silence-Tolerant Stubs

**Decision: Silence-tolerant stubs (empty MP3 files).**

Each SFX file will be a **minimal valid MP3 file** (~1 KB each, <100 ms duration, literally silent or near-silence). This approach:

✅ Allows the audio engine to initialize and play without errors  
✅ Does not block the game loop or break playback if a clip is missing  
✅ Supports incremental art asset replacement — drop a real clip over the stub at any time  
✅ Keeps the repo size tiny (5 × ~1 KB stub files < 10 KB total vs procedural generation overhead)

**Alternative rejected:** Procedurally generate tones in JavaScript (e.g., tone.js or Web Audio API synthesis). **Why rejected:** Adds JavaScript bundle size, runtime overhead, and complexity. Stub files are simpler and faster.

### Manifest & Directory Structure

All SFX files are served as static assets from the client build:

```
apps/client/public/audio/sfx/
├── hit.mp3          (stub, ~1 KB)
├── jump.mp3         (stub, ~1 KB)
├── land.mp3         (stub, ~1 KB)
├── shield.mp3       (stub, ~1 KB)
├── ko.mp3           (stub, ~1 KB)
└── .gitkeep         (marker for git tracking)
```

**File Format & Specs:**
- Format: MP3 (MPEG-1 Audio Layer III) or WAVE PCM
- Channels: Mono or Stereo (client side will mix to mono if needed)
- Sample rate: 44.1 kHz or 48 kHz
- Duration: 100–500 ms (varies by event; see table in section 1)
- Encoding: Silence or near-silence for stubs

**Build & Deployment:**
- Vite will copy these files from `public/audio/sfx/` to the built client's `dist/audio/sfx/` during `pnpm build`
- In production, the server (in `apps/server/src/index.ts`) serves static files from `dist/` → files are accessible at `/audio/sfx/hit.mp3`, etc.
- No changes to build config required — Vite's public directory is already wired.

---

## 4. API Sketch: `playSfx()` Function

### Design Constraints

1. **Composability:** SfxManager MUST NOT modify or replace AudioManager. Both coexist.
2. **No dependencies:** No howler.js, Tone.js, or external libraries. Raw HTML Audio API only.
3. **Purity:** SFX is non-blocking, fire-and-forget. No state leakage.
4. **Pitch shifting:** Playback rate must be adjustable per-play (e.g., `playbackRate: 0.9`).
5. **Volume mixing:** Global SFX volume separate from music volume.

### Implementation Pseudocode

```typescript
// Location: apps/client/src/audio/SfxManager.ts (to be created)

export interface SfxPlayOptions {
  volume?: number;        // 0.0–1.0, default 0.7
  playbackRate?: number;  // 0.5–2.0, default 1.0
}

export class SfxManager {
  private globalSfxVolume: number = 0.8;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  /**
   * Play a named SFX clip immediately.
   * Uses HTML Audio API with independent volume control.
   * Does not modify music playback.
   *
   * @param sfxName - Clip name without extension ('hit', 'jump', 'land', 'shield', 'ko')
   * @param options - Playback options (volume, playbackRate)
   */
  playSfx(sfxName: string, options: SfxPlayOptions = {}): void {
    const { volume = 0.7, playbackRate = 1.0 } = options;

    // Create or reuse audio element
    if (!this.audioCache.has(sfxName)) {
      const audio = new Audio(`/audio/sfx/${sfxName}.mp3`);
      audio.addEventListener('ended', () => {
        audio.currentTime = 0;
      });
      this.audioCache.set(sfxName, audio);
    }

    const audio = this.audioCache.get(sfxName)!;
    
    // Apply independent SFX volume (does not affect music)
    audio.volume = volume * this.globalSfxVolume;
    audio.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));
    
    // Reset to start, play
    audio.currentTime = 0;
    void audio.play().catch((err: unknown) => {
      console.warn(`[SfxManager] Failed to play ${sfxName}:`, err);
    });
  }

  /**
   * Set global SFX volume multiplier (0.0–1.0).
   * Affects all SFX without modifying music.
   */
  setVolume(volume: number): void {
    this.globalSfxVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.globalSfxVolume;
  }
}

// Export singleton
export const sfxManager = new SfxManager();
```

### Integration Points

**1. Hit event handling** (`apps/client/src/network/GameClient.ts`):
```typescript
// On StateSnapshot.hitEvents received:
for (const hitEvent of snapshot.hitEvents) {
  const playbackRate = 0.8 + (hitEvent.knockbackMagnitude / 100) * 0.6;
  sfxManager.playSfx('hit', { volume: 0.8, playbackRate });
}
```

**2. FSM state transitions** (`apps/client/src/network/LocalPredictor.ts`):
```typescript
// When local player FSM state changes:
if (newState === 'Jumpsquat') {
  sfxManager.playSfx('jump', { volume: 0.7 });
}
if (wasAirborne && newState === 'Idle') {
  sfxManager.playSfx('land', { volume: 0.6 });
}
```

**3. KO flag detection** (`apps/client/src/network/GameClient.ts`):
```typescript
// Compare previous and current snapshots:
if (!prevSnapshot.fighters[i].isKnockedOut && 
    currentSnapshot.fighters[i].isKnockedOut) {
  sfxManager.playSfx('ko', { volume: 1.0 });
}
```

---

## 5. Summary & Next Steps

### What's Decided
- ✅ Five SFX events with clip → hook-point mapping
- ✅ Hit SFX pitch scales dynamically by knockback magnitude
- ✅ FSM state transitions emit jump, land, shield SFX locally (latency-free)
- ✅ KO SFX fires server-synchronously via StateSnapshot flag
- ✅ Silence-tolerant stub files in `public/audio/sfx/`
- ✅ Standalone SfxManager API: `playSfx(name, { volume, playbackRate })`

### What's Not Yet Built
- Implementation of `SfxManager.ts` (Wave 2 or later)
- Actual audio-clip artwork (asset team)
- Settings UI for SFX volume control
- Shield break SFX (future mechanic)

### Testing Strategy (Wave 2)
- Unit test: SfxManager volume/rate clamping, audio element reuse
- Integration test: Play a full local-play match, verify all SFX fire on expected events
- Network test: Multiplayer match, confirm KO and hit SFX sync across clients

### Integration Checklist for Implementation
- [ ] Create `apps/client/src/audio/SfxManager.ts` following pseudocode above
- [ ] Wire SfxManager into `GameClient.ts` for hit and KO events
- [ ] Wire SfxManager into `LocalPredictor.ts` for FSM state transitions
- [ ] Replace stub MP3 files in `public/audio/sfx/` with real recordings
- [ ] Add SFX volume slider to settings/audio panel (UI task)
- [ ] Run full test suite: `pnpm test` passes, local-play flow produces SFX

---

**Document prepared by:** Sisyphus (Sprint A Track A, Wave 1)
