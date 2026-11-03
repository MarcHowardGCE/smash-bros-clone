# Xbox and Xbox 360 controller support

Connect a controller that the operating system recognizes, refresh/open the game, then press and release a button. The browser may wait for a button press before exposing the device. The connection status below the game confirms detection. Release held buttons and center the stick when connecting or reconnecting. Keyboard controls remain available.

## Controls

| Controller input | Action |
| --- | --- |
| Left stick or D-pad | Move |
| A | Jump; hold for height; second press activates Egghead flight or Gear double jump |
| A held in Egghead flight | Rise; releasing lets gravity pull the character down |
| X | Punch; hold and release for Gear charged punch |
| B | Kick |
| Y | Interact with controls, valves and return pads |
| RB | Captain cannonball special |
| RT or LB | Run |
| Menu / Start | Pause or resume; start/confirm on overlays |
| A on an overlay | Start, resume, retry or confirm route return |
| LB / RB on an overlay | Choose Bonney or Luffy |
| D-pad left / right on the initial title screen | Choose full course or tutorial |

Controller confirmation does not also trigger a jump or attack. Course selection is available only before starting, so a D-pad press in the pause menu cannot erase a run. No controller shortcut resets the entire run. The left stick uses a 25% dead zone and the game's existing digital walking speed; use a run button for faster movement. D-pad input overrides stick direction when used.

## Behavior

The game polls input once per animation frame and buffers new action presses until a physics step consumes them. Held jump/punch/run inputs remain held across steps; press edges are consumed once. Keyboard and controller input are combined. Flight flames use the same merged jump state as gameplay.

If the active controller disconnects during play, the game pauses, clears controller actions and offers keyboard or controller resume. Reconnection never resumes automatically. A replacement/returning controller must become neutral before it can act. With multiple supported controllers, the currently selected controller remains active until it disconnects; this remains a single-player game.

Button prompts inside the game, objectives and active-area guide follow the current input device. The keyboard guide remains explicitly labeled. Menu hints and connection status do not expose raw vendor/product identifiers.

## Compatibility and implementation

Supports Xbox and Xbox 360 controllers through the browser's standard Gamepad mapping, as defined in the [W3C Gamepad specification](https://www.w3.org/TR/gamepad/). The operating system and browser must recognize the device and expose that mapping. The game does not guess arbitrary unmapped device layouts or install drivers. The local 127.0.0.1 preview remains the normal entry point.

See [MDN's Gamepad API guide](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API) for browser activation and mapping behavior. No network service or additional runtime package is used for controller input.

Main module: src/controller.mjs. Integration: src/game.mjs; guide: index.html and style.css; server allowlist: server.mjs. Controller objects and presentation state are kept outside the gameplay simulation.

## Verification and limitations

119 tests and syntax checks pass. Seven new unit tests cover both Xbox device profiles, all action buttons, held/edge behavior, dead zone, D-pad priority, simultaneous keyboard input, active controller selection, disconnect/reconnect neutrality, unsupported mapping handling and prompt translation.

Run node scripts/controller-browser.mjs for simulated-controller integration checks: title character/course selection, start and retry, walking/running, jumping, pause/resume, punch/kick/Gear charge, Captain special, held flight/fuel/flames, underwater valve interaction, disconnect pause, keyboard fallback, Xbox 360 reconnect, neutral rearming, contextual prompts and route completion/return. Screenshot: docs/screenshots/controller-v1/controller-ui.png. Keyboard refinement and visual-only roster browser checks also pass.

These tests inject simulated Gamepad API devices. Physical Xbox and Xbox 360 hardware has not been exercised in this session; a real-device check is still required to confirm OS/browser detection and subjective stick/button feel. No rumble, button remapping or multiple-player support is included in this pass.
