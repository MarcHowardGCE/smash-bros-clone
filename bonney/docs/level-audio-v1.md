# Level background music and audio controls

The supplied ANCHORS AWEIGH! (MARINE PORT).mp3 is copied into assets/audio/anchors-aweigh-marine-port.mp3 and configured in src/audio-config.mjs. The original source is C:\Users\misac\Downloads\ANCHORS AWEIGH! (MARINE PORT).mp3. Browser decoding reports a duration of 109.52 seconds.

## Player controls

- Volume controls the overall level of music and effects.
- Mute / Unmute silences or restores both channels immediately.
- Expand Music and effects for independent music and effect levels.
- Settings are remembered locally across refreshes.

The theme starts with gameplay, loops, and continues without restarting between harbor, clouds and underwater. Pausing, defeat or route completion pauses music at its current position; resuming/continuing restores playback. Restarting a run resets the track to its beginning. The title screen does not automatically play music. If a browser blocks playback, the button reads Enable audio; click once to allow it. Keyboard and controller gameplay remain available while audio is blocked or unavailable.

One music player is retained for the whole game. Sound effects now run through a shared gain control so changing volume or muting also affects effects that are already playing. The game retains its existing effects rather than substituting the music for them.

## Implementation

src/audio.mjs manages the looping track, effect output, preferences and blocked-playback recovery. src/game.mjs connects playback to game/pause state and the controls in index.html. Audio-specific styles are in style.css. server.mjs serves MP3 and other common audio formats with their proper media types. No extra runtime dependency or remote audio service is used.

## Verification

133 tests and syntax checks pass. Unit tests cover loop setup, single-player reuse, pause/resume position, independent/master gains, live mute, preference persistence, malformed storage and blocked/pending play promises.

node scripts/audio-browser.mjs verifies the actual supplied MP3 decodes and plays, serves as audio/mpeg, wraps at the loop boundary, obeys all three volume sliders and mute, pauses/resumes at the same position, keeps the same player across routes, restarts with the run and retains settings after reload. Screenshot: docs/screenshots/audio-v1/audio-controls.png. The simulated Xbox/Xbox 360 browser regression also passes.
