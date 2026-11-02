# Flight and pickup refinement
Confirmed user changes:
- Double jump still opens the five-second Egghead ability window.
- Within that window, hold Space to rise at 90 world pixels/second.
- Releasing Space applies normal gravity (760 world pixels/second squared), capped at normal falling speed.
- Holding Space again resumes ascent while time remains. Releasing does not reset or pause the five-second timer.
- Arrow/W/S vertical flight steering is removed. Exhaust appears only while Space is held.
- A different power-up pickup cancels any active ability, clears both timers, and equips the new ability ready immediately.
- Normal ability completion still starts a five-second cooldown.
- Same-equipped pickups remain unconsumed; pickups do not heal.

This supersedes earlier hover-flight and cooldown-preserving pickup proposals.
Validation: 16 gameplay/animation tests; browser checks include hold/release/rehold flight and immediate readiness on pickup.
