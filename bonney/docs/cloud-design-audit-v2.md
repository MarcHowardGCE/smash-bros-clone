# Cloud level design audit and refinement v2

## Implemented changes
Gear's code-drawn placeholder is replaced with a real white cloud-fruit sprite: dark purple spiral/outline, purple sash and gold badge. It reads against white terrain. Built-in image generation was used, not CLI fallback. Source: assets/powerups-v1/gear-source.png. Runtime sprite: assets/powerups-v1/gear-fruit.png. Prompt: docs/gear-pickup-v1-prompt.txt. Exporter: scripts/pack-powerup-art.mjs.

Cloud costume pickups reduced from13 to6. The entry Gear fruit is above the walking lane and requires an intentional jump; players can retain their arrival Egghead outfit. Two marked research supply trays retain the required puzzle outfits and restock in4seconds. Ordinary supplies retain8-second restock. Their cooldown appears locally when nearby, making recovery legible rather than hiding a mandatory missing item.

Moved the Nimbus patrol farther from its recovery pickup; moved the patrol away from the console supply corridor; moved the final sentinel onto the flag approach. This gives supply collection breathing room and makes the observatory finale an encounter that can be punched, stomped or bypassed with skill rather than leaving its guard only on an optional roof.

## Damage rule
Enemy/projectile/contact-hazard damage removes an equipped costume power first, without reducing age. After that: adult -> teenage -> baby -> defeated. Powered adult therefore takes4enemy hits to defeat; powered teen3 and powered baby2. Both playable characters share this rule. Losing a power cancels active ability/attacks, removes its speed/jump/flight effects, grants the existing damage grace period and blocks pickup collection for900ms. This prevents immediate same-frame replacement from erasing the consequence.

Collecting a replacement power does not heal an age stage. Health food still restores one age. Harbor falls retain their existing age penalty; cloud falls still return to the harbor without damage. Checkpoint retry behavior remains unchanged. The HUD adds a small power-protection indicator and the controls explain the extra powered hit.

## Designer assessment
The course's strongest identity is choosing between vertical flight and fast Gear combat. Fewer, deliberate outfit decisions strengthen that identity. A readable lower route matters now that one hit can remove either movement ability. Automated traversal checks now cover every age with no power as well as both cloud powers, using the intended intermediate platforms.

| District | Current strength | Remaining concern | Recommended next pass |
|---|---|---|---|
| Cloud Landing | Safe arrival, optional Gear choice, rooftop reward | Several concepts appear before a player has tried one deliberately | Add one safe, optional Gear target or short detour before combining movement and robot combat |
| Nimbus Gardens | Fading clouds, updrafts and vertical routes | First fading-pad failure can immediately become a harbor drop; gusts compete with scenery | Demonstrate fading over a safe lower cloud first, then use it over a gap; emphasize the vent's airflow before the player jumps |
| Research Ring | Clear Gear breach plus Egghead console gate | Losing an outfit can become a backtracking chore | Keep the marked fast-restocking supplies; consider a compact two-choice supply station if playtests show repeated long retries |
| Observatory | Distinct cyan finish and final sentinel approach | Roof travel and the lower lane offer uneven rewards | Give the risky roof route a distinctive optional collectible/shortcut; keep a readable landing and recovery space before the flag |

## Recommendations to make it more fun
1. Teach each hazard safely, then combine it. A short safe fading-cloud introduction should precede the fading/jump/drone combination. Updrafts should have an obvious entry and visible destination.
2. Make route choices pay differently. The lower lane should be dependable after losing a power. The upper lane should offer a faster line, a hidden item or a distinctive view, with harder execution. Use curved reward trails to preview takeoff and landing, not continuous rows of interchangeable pickups.
3. Make each secret require an optional action. The reactor treasure currently unlocks alongside mandatory progression. Move a future reward into a small optional Gear-breach/flight alcove so discovery is earned independently of opening the main gate.
4. Use encounter rhythm: safe landing -> readable threat -> execution -> short recovery. Preserve the cleared supply approaches and avoid placing a fresh hazard on top of the outfit needed to solve it.
5. Preserve the harbor fall route as an alternative continuation. Make landing/re-entry landmarks clear so falling feels like a route change with retained progress. Avoid making every failure a forced repeat of the full hidden ascent.

## Next playtest questions
Can a new player identify Gear from its art, understand that the first hit consumes a power, and recognize the two puzzle supplies? Do players try both movement styles, recover without becoming stuck, and choose the upper route for its reward? Record repeated-hit locations, outfit-loss locations, falls, supply backtracks and time spent waiting. These would be local development diagnostics; no external analytics were added. Automated checks establish reachability, not first-time comprehension or enjoyment.

## Verification
93 tests pass. New checks cover power-first damage at every age/outfit, four-hit powered adult survival, grace/recollection protection, six curated supplies, deliberate entry pickup choice, puzzle restocking, unpowered traversal and supported actor/item placement. Browser checks confirm four real projectile hits for both Bonney and Luffy, first-hit power loss without age loss, normal death/retry UI, the rendered Gear fruit, full cloud progression, full harbor progression and shared combat. All78 runtime textures load. Syntax checks pass. Screenshots: docs/screenshots/cloud-refinement-v2/ and refreshed cloud-full-v1/ views.
