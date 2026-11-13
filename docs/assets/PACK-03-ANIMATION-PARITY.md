# Pack 03 animation parity audit

Compared the packaged manifests for all eight fighters after Pack 03 revision 43. The union contains 147 clip names. 26 present Pack 03 clips have fewer distinct registered poses than every earlier fighter. Two generic names are absent, reaction and air_dodge_directional. Runtime coverage uses dedicated reaction and directional dodge clips.

## Repair order

1. Movement first. Expand walk and run from four poses, and add motion to jump squat, crouch entry and hold, rise, apex, fall, double jump, and forward teeter. Check planted feet and full jump-to-landing playback.
2. Combat and defensive transitions. Expand jab and shield raise and drop. Recheck contact and intangibility at existing gameplay timing. Review the six-frame original aerial and special clips as a second pass because Pack 02 often uses three.
3. Paired and edge actions. Expand grabbed, grab release, all three footstool roles, ledge drop, and ledge trump. Review spacing in both facings.
4. Presentation and recovery. Expand respawn drop, defeat, Screen and Star KO, helpless entry and landing. Separate sprite motion from travel and effect motion in the renderer.

## Confirmed gaps below both earlier packs

| Clip | Earlier roster minimum | Pack 03 poses |
| --- | ---: | ---: |
| air_apex_loop | 2 | 1 / 1 / 1 |
| air_fall_loop | 2 | 1 / 1 / 1 |
| air_rise_loop | 2 | 1 / 1 / 1 |
| crouch_enter | 2 | 1 / 1 / 1 |
| crouch_hold | 2 | 1 / 1 / 1 |
| defeat | 2 | 1 / 1 / 1 |
| double_jump_transition | 3 | 2 / 2 / 2 |
| footstool_air_victim | 3 | 1 / 1 / 1 |
| footstool_attacker | 3 | 2 / 2 / 2 |
| footstool_ground_victim | 2 | 1 / 1 / 1 |
| grab_release | 3 | 2 / 2 / 2 |
| grabbed | 3 | 1 / 1 / 1 |
| helpless_enter | 2 | 1 / 1 / 1 |
| helpless_land | 3 | 2 / 2 / 2 |
| jab | 9 | 3 / 3 / 3 |
| jump_squat | 3 | 1 / 1 / 1 |
| ko_screen | 2 | 1 / 1 / 1 |
| ko_star | 2 | 1 / 1 / 1 |
| ledge_drop | 3 | 2 / 2 / 2 |
| ledge_trump | 3 | 1 / 1 / 1 |
| respawn_drop | 3 | 2 / 2 / 2 |
| run | 6 | 4 / 4 / 4 |
| shield_drop | 3 | 2 / 2 / 2 |
| shield_raise | 3 | 2 / 2 / 2 |
| teeter_front | 3 | 2 / 2 / 2 |
| walk | 6 | 4 / 4 / 4 |

## Complete comparison

Cells show distinct registered poses / frame slots, then declared total ticks / longest consecutive same-pose hold. Runtime means the manifest does not declare durations. A pose is keyed by image, rectangle, and effective mirroring within each clip. Distinct registered poses can still be nearly identical or reused across clips. Declared timing can be overridden by gameplay selection. These are screening results for visual and runtime review.

| Clip | all-rounder | abe-lincoln | swift | moonshine | hulk-hoagie | mr-wrong | loopy | mrs-tasselbottom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| air_apex_loop | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t |
| air_dodge_back | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_directional | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | — | — | — |
| air_dodge_down | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_down_back | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_down_diagonal | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_land | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 15t / 9t | 2/2 · 15t / 9t | 4/4 · 10t / 3t | 4/4 · 10t / 3t | 4/4 · 10t / 3t |
| air_dodge_neutral | 6/6 · 23t / 5t | 6/6 · 23t / 5t | 6/6 · 23t / 5t | 2/3 · 21t / 10t | 2/3 · 21t / 10t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_side | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_up | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_up_back | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_dodge_up_diagonal | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 23t / 12t | 3/3 · 23t / 12t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| air_fall_loop | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t |
| air_fastfall_loop | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 2/2 · 10t / 5t | 2/2 · 10t / 5t | 2/2 · 11t / 8t | 2/2 · 11t / 8t | 2/2 · 11t / 8t |
| air_rise_loop | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t | 1/1 · 6t / 6t |
| back_air | 6/6 · 24t / 7t | 6/6 · 24t / 7t | 6/6 · 24t / 7t | 3/3 · 19t / 10t | 3/3 · 19t / 10t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| back_throw | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 5/5 · 26t / 13t | 5/5 · 26t / 13t | 5/5 · 26t / 13t |
| back_throw_victim_preview | — | — | — | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| brake | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 9t / 5t | 2/2 · 9t / 5t | 3/3 · 18t / 10t | 3/3 · 18t / 10t | 3/3 · 18t / 10t |
| ceiling_tech | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 15t / 10t | 2/2 · 15t / 10t | 3/6 · 26t / 14t | 3/6 · 26t / 14t | 3/6 · 26t / 14t |
| counter_success | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 3/3 · 20t / 12t | 3/3 · 20t / 12t | 3/3 · 12t / 5t | 3/3 · 12t / 5t | 3/3 · 12t / 5t |
| crouch_enter | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 4t / 2t | 2/2 · 4t / 2t | 1/1 · 4t / 4t | 1/1 · 4t / 4t | 1/1 · 4t / 4t |
| crouch_exit | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 4t / 2t | 2/2 · 4t / 2t | 2/2 · runtime | 2/2 · runtime | 2/2 · runtime |
| crouch_hold | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 1/1 · 4t / 4t | 1/1 · 4t / 4t | 1/1 · 4t / 4t |
| dash_attack | 6/6 · 33t / 10t | 6/6 · 33t / 10t | 6/6 · 33t / 10t | 3/3 · 19t / 10t | 3/3 · 19t / 10t | 4/4 · 21t / 8t | 4/4 · 21t / 8t | 4/4 · 21t / 8t |
| dash_start | 6/6 · 15t / 3t | 6/6 · 15t / 3t | 6/6 · 15t / 3t | 3/3 · 9t / 4t | 3/3 · 9t / 4t | 6/6 · 15t / 3t | 6/6 · 15t / 3t | 6/6 · 15t / 3t |
| defeat | 4/4 · 32t / 8t | 4/4 · 32t / 8t | 4/4 · 32t / 8t | 2/2 · 32t / 25t | 2/2 · 32t / 25t | 1/4 · 32t / 32t | 1/4 · 32t / 32t | 1/4 · 32t / 32t |
| dodge | 6/6 · 20t / 4t | 6/6 · 20t / 4t | 6/6 · 20t / 4t | 2/3 · 19t / 8t | 2/3 · 19t / 8t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| double_jump_transition | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 6t / 2t | 3/3 · 6t / 2t | 2/2 · 12t / 7t | 2/2 · 12t / 7t | 2/2 · 12t / 7t |
| down_air | 6/6 · 32t / 10t | 6/6 · 32t / 10t | 6/6 · 32t / 10t | 3/3 · 24t / 12t | 3/3 · 24t / 12t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| down_smash | 6/6 · 36t / 10t | 6/6 · 36t / 10t | 6/6 · 36t / 10t | 3/3 · 30t / 16t | 3/3 · 30t / 16t | 4/4 · 20t / 8t | 4/4 · 20t / 8t | 4/4 · 20t / 8t |
| down_special | 6/6 · 22t / 8t | 6/6 · 22t / 8t | 6/6 · 22t / 8t | 3/3 · 28t / 14t | 3/3 · 28t / 14t | 3/3 · 22t / 16t | 3/3 · 22t / 16t | 3/3 · 22t / 16t |
| down_throw | 6/6 · 33t / 9t | 6/6 · 33t / 9t | 6/6 · 33t / 9t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 5/5 · 26t / 13t | 5/5 · 26t / 13t | 5/5 · 26t / 13t |
| down_throw_victim_preview | — | — | — | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| down_tilt | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 3/3 · 15t / 7t | 3/3 · 15t / 7t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| entry | 6/6 · 50t / 12t | 6/6 · 50t / 12t | 6/6 · 50t / 12t | 2/2 · 24t / 12t | 2/2 · 24t / 12t | 3/6 · 54t / 22t | 3/6 · 54t / 22t | 3/6 · 54t / 22t |
| floor_attack_down | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 6/6 · 33t / 8t | 6/6 · 33t / 8t | 7/7 · 24t / 7t | 7/7 · 24t / 7t | 7/7 · 24t / 7t |
| floor_attack_trip | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 5/5 · 25t / 8t | 5/5 · 25t / 8t | 7/7 · 24t / 7t | 7/7 · 24t / 7t | 7/7 · 24t / 7t |
| floor_attack_up | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 6/6 · 24t / 5t | 6/6 · 33t / 8t | 6/6 · 33t / 8t | 7/7 · 24t / 7t | 7/7 · 24t / 7t | 7/7 · 24t / 7t |
| footstool_air_victim | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 3/3 · 17t / 9t | 3/3 · 17t / 9t | 1/3 · 18t / 18t | 1/3 · 18t / 18t | 1/3 · 18t / 18t |
| footstool_attacker | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 3/3 · 17t / 9t | 3/3 · 17t / 9t | 2/3 · 18t / 14t | 2/3 · 18t / 14t | 2/3 · 18t / 14t |
| footstool_ground_preview | — | — | — | 3/3 · 17t / 9t | 3/3 · 17t / 9t | — | — | — |
| footstool_ground_victim | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 2/3 · 17t / 9t | 2/3 · 17t / 9t | 1/3 · 18t / 18t | 1/3 · 18t / 18t | 1/3 · 18t / 18t |
| forward_air | 6/6 · 30t / 9t | 6/6 · 30t / 9t | 6/6 · 30t / 9t | 3/3 · 20t / 10t | 3/3 · 20t / 10t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| forward_smash | 6/6 · 43t / 13t | 6/6 · 43t / 13t | 6/6 · 43t / 13t | 3/3 · 30t / 15t | 3/3 · 30t / 15t | 4/4 · 19t / 8t | 4/4 · 19t / 8t | 4/4 · 19t / 8t |
| forward_throw | 6/6 · 26t / 8t | 6/6 · 26t / 8t | 6/6 · 26t / 8t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 5/5 · 26t / 13t | 5/5 · 26t / 13t | 5/5 · 26t / 13t |
| forward_tilt | 6/6 · 22t / 6t | 6/6 · 22t / 6t | 6/6 · 22t / 6t | 3/3 · 15t / 7t | 3/3 · 15t / 7t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| getup_down | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 5/5 · 27t / 7t | 5/5 · 27t / 7t | 6/6 · 26t / 6t | 6/6 · 26t / 6t | 6/6 · 26t / 6t |
| getup_roll_down | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 31t / 8t | 6/6 · 31t / 8t | 6/6 · 26t / 12t | 6/6 · 26t / 12t | 6/6 · 26t / 12t |
| getup_roll_up | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 31t / 8t | 6/6 · 31t / 8t | 6/6 · 26t / 12t | 6/6 · 26t / 12t | 6/6 · 26t / 12t |
| getup_up | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 5/5 · 27t / 7t | 5/5 · 27t / 7t | 6/6 · 26t / 6t | 6/6 · 26t / 6t | 6/6 · 26t / 6t |
| grab | 6/6 · 27t / 9t | 6/6 · 27t / 9t | 6/6 · 27t / 9t | 3/3 · 18t / 8t | 3/3 · 18t / 8t | 3/6 · runtime | 3/6 · runtime | 3/6 · runtime |
| grab_dash | 6/6 · 32t / 11t | 6/6 · 32t / 11t | 6/6 · 32t / 11t | 3/3 · 20t / 8t | 3/3 · 20t / 8t | 6/6 · runtime | 6/6 · runtime | 6/6 · runtime |
| grab_dash_victim_preview | — | — | — | 3/3 · 20t / 8t | 3/3 · 20t / 8t | — | — | — |
| grab_hold | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 1/1 · 16t / 16t | 1/1 · 16t / 16t | 1/1 · runtime | 1/1 · runtime | 1/1 · runtime |
| grab_pivot | 6/6 · 35t / 11t | 6/6 · 35t / 11t | 6/6 · 35t / 11t | 3/3 · 19t / 8t | 3/3 · 19t / 8t | 5/6 · runtime | 5/6 · runtime | 5/6 · runtime |
| grab_pivot_victim_preview | — | — | — | 3/3 · 19t / 8t | 3/3 · 19t / 8t | — | — | — |
| grab_release | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 2/3 · runtime | 2/3 · runtime | 2/3 · runtime |
| grab_release_victim_preview | — | — | — | 3/3 · 20t / 9t | 3/3 · 20t / 9t | — | — | — |
| grabbed | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 3/3 · 18t / 8t | 3/3 · 18t / 8t | 1/2 · runtime | 1/2 · runtime | 1/2 · runtime |
| grabbed_hold_preview | — | — | — | 1/1 · 16t / 16t | 1/1 · 16t / 16t | — | — | — |
| helpless_enter | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 9t / 6t | 2/2 · 9t / 6t | 1/1 · runtime | 1/1 · runtime | 1/1 · runtime |
| helpless_land | 6/6 · 14t / 3t | 6/6 · 14t / 3t | 6/6 · 14t / 3t | 3/3 · 20t / 7t | 3/3 · 20t / 7t | 2/2 · 14t / 10t | 2/2 · 14t / 10t | 2/2 · 14t / 10t |
| helpless_loop | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 1/1 · runtime | 1/1 · runtime | 1/1 · runtime |
| hit_air | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 12t / 7t | 2/2 · 12t / 7t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t |
| hit_heavy | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 16t / 9t | 2/2 · 16t / 9t | 2/2 · 14t / 10t | 2/2 · 14t / 10t | 2/2 · 14t / 10t |
| hit_high | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/2 · 12t / 7t | 2/2 · 12t / 7t | 2/2 · 10t / 7t | 2/2 · 10t / 7t | 2/2 · 10t / 7t |
| hit_launch | — | — | — | — | — | 2/2 · 10t / 6t | 2/2 · 10t / 6t | 2/2 · 10t / 6t |
| hit_low | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/2 · 13t / 8t | 2/2 · 13t / 8t | 2/2 · 10t / 7t | 2/2 · 10t / 7t | 2/2 · 10t / 7t |
| hit_mid | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/2 · 12t / 7t | 2/2 · 12t / 7t | 2/2 · 9t / 6t | 2/2 · 9t / 6t | 2/2 · 9t / 6t |
| idle | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t |
| jab | 9/9 · 15t / 2t | 9/9 · 15t / 2t | 9/9 · 15t / 2t | 9/9 · 15t / 2t | 9/9 · 15t / 2t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| jab_2 | 6/6 · 15t / 5t | 6/6 · 15t / 5t | 6/6 · 15t / 5t | 3/3 · 13t / 7t | 3/3 · 13t / 7t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| jab_3 | 6/6 · 25t / 9t | 6/6 · 25t / 9t | 6/6 · 25t / 9t | 3/3 · 17t / 9t | 3/3 · 17t / 9t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| jab_lock_down | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/3 · 14t / 6t | 2/3 · 14t / 6t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t |
| jab_lock_up | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/3 · 14t / 6t | 2/3 · 14t / 6t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t |
| jump | 6/6 · 47t / 12t | 6/6 · 47t / 12t | 6/6 · 47t / 12t | 6/6 · 47t / 12t | 6/6 · 47t / 12t | 6/6 · runtime | 6/6 · runtime | 6/6 · runtime |
| jump_squat | 6/6 · 3t / 1t | 6/6 · 3t / 1t | 6/6 · 3t / 1t | 3/3 · 3t / 1t | 3/3 · 3t / 1t | 1/1 · 4t / 4t | 1/1 · 4t / 4t | 1/1 · 4t / 4t |
| knockdown_down | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 5/5 · 18t / 4t | 5/5 · 18t / 4t | 5/5 · 18t / 4t |
| knockdown_up | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 6/6 · 18t / 6t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 5/5 · 18t / 4t | 5/5 · 18t / 4t | 5/5 · 18t / 4t |
| ko_launch | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 1/1 · 9t / 9t | 1/1 · 9t / 9t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 1/1 · 12t / 12t |
| ko_screen | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/2 · 19t / 14t | 2/2 · 19t / 14t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 1/1 · 12t / 12t |
| ko_star | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 2/2 · 23t / 18t | 2/2 · 23t / 18t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 1/1 · 12t / 12t |
| land_heavy | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 15t / 9t | 2/2 · 15t / 9t | 3/3 · 18t / 9t | 3/3 · 18t / 9t | 3/3 · 18t / 9t |
| land_soft | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 3/3 · 13t / 6t | 3/3 · 13t / 6t | 3/3 · 12t / 6t | 3/3 · 12t / 6t | 3/3 · 12t / 6t |
| ledge_attack | 6/6 · 60t / 16t | 6/6 · 60t / 16t | 6/6 · 60t / 16t | 4/4 · 24t / 9t | 4/4 · 24t / 9t | 5/6 · 60t / 16t | 5/6 · 60t / 16t | 5/6 · 60t / 16t |
| ledge_catch | 4/4 · 8t / 2t | 4/4 · 8t / 2t | 4/4 · 8t / 2t | 2/2 · 15t / 10t | 2/2 · 15t / 10t | 2/4 · 8t / 6t | 2/4 · 8t / 6t | 2/4 · 8t / 6t |
| ledge_climb | 6/6 · 40t / 8t | 6/6 · 40t / 8t | 6/6 · 40t / 8t | 3/3 · 20t / 8t | 3/3 · 20t / 8t | 5/6 · 40t / 16t | 5/6 · 40t / 16t | 5/6 · 40t / 16t |
| ledge_drop | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 3/3 · 18t / 9t | 3/3 · 18t / 9t | 2/4 · 12t / 9t | 2/4 · 12t / 9t | 2/4 · 12t / 9t |
| ledge_hang | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 1/1 · 18t / 18t | 1/1 · 18t / 18t | 1/1 · runtime | 1/1 · runtime | 1/1 · runtime |
| ledge_jump | 6/6 · 12t / 2t | 6/6 · 12t / 2t | 6/6 · 12t / 2t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 3/6 · 12t / 6t | 3/6 · 12t / 6t | 3/6 · 12t / 6t |
| ledge_roll | 6/6 · 45t / 9t | 6/6 · 45t / 9t | 6/6 · 45t / 9t | 4/4 · 23t / 7t | 4/4 · 23t / 7t | 5/6 · 45t / 16t | 5/6 · 45t / 16t | 5/6 · 45t / 16t |
| ledge_trump | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 3/3 · 20t / 10t | 3/3 · 20t / 10t | 1/4 · 12t / 12t | 1/4 · 12t / 12t | 1/4 · 12t / 12t |
| neutral_air | 6/6 · 27t / 8t | 6/6 · 27t / 8t | 6/6 · 27t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| neutral_special | 6/6 · 28t / 10t | 6/6 · 28t / 10t | 6/6 · 28t / 10t | 3/3 · 25t / 12t | 3/3 · 25t / 12t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| parry | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 18t / 10t | 3/3 · 18t / 10t | 3/3 · 18t / 10t |
| platform_drop | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 1/1 · 8t / 8t | 1/1 · 8t / 8t | 2/2 · 8t / 5t | 2/2 · 8t / 5t | 2/2 · 8t / 5t |
| prone_down | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t |
| prone_up | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 2/2 · 12t / 6t | 2/2 · 12t / 6t | 2/2 · 12t / 6t |
| pummel | 6/6 · 12t / 4t | 6/6 · 12t / 4t | 6/6 · 12t / 4t | 2/3 · 16t / 8t | 2/3 · 16t / 8t | 2/6 · runtime | 2/6 · runtime | 2/6 · runtime |
| pummel_victim | 4/4 · 8t / 2t | 4/4 · 8t / 2t | 4/4 · 8t / 2t | 2/3 · 16t / 8t | 2/3 · 16t / 8t | 2/3 · runtime | 2/3 · runtime | 2/3 · runtime |
| reaction | 4/4 · 46t / 18t | 4/4 · 46t / 18t | 4/4 · 46t / 18t | 2/2 · 12t / 7t | 2/2 · 12t / 7t | — | — | — |
| respawn_drop | 6/6 · 32t / 8t | 6/6 · 32t / 8t | 6/6 · 32t / 8t | 3/3 · 26t / 14t | 3/3 · 26t / 14t | 2/6 · 36t / 18t | 2/6 · 36t / 18t | 2/6 · 36t / 18t |
| respawn_wait | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 1/1 · 16t / 16t | 1/1 · 16t / 16t | 1/4 · 48t / 48t | 1/4 · 48t / 48t | 1/4 · 48t / 48t |
| roll | 6/6 · 20t / 4t | 6/6 · 20t / 4t | 6/6 · 20t / 4t | 3/3 · 23t / 10t | 3/3 · 23t / 10t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| roll_back | — | — | — | — | — | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| roll_back_preview | — | — | — | 3/3 · 23t / 10t | 3/3 · 23t / 10t | — | — | — |
| run | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 8/8 · 18t / 3t | 8/8 · 18t / 3t | 4/4 · 14t / 4t | 4/4 · 16t / 5t | 4/4 · 20t / 6t |
| shield | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 4/4 · 48t / 12t | 1/1 · 12t / 12t | 1/1 · 12t / 12t | 2/2 · 32t / 24t | 2/2 · 32t / 24t | 2/2 · 32t / 24t |
| shield_break_dizzy | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 16t / 8t | 2/2 · 16t / 8t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t |
| shield_break_launch | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 12t / 9t | 2/2 · 12t / 9t | 4/4 · 23t / 8t | 4/4 · 23t / 8t | 4/4 · 23t / 8t |
| shield_break_recover | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 3/3 · 17t / 7t | 3/3 · 17t / 7t | 4/4 · 18t / 5t | 4/4 · 18t / 5t | 4/4 · 18t / 5t |
| shield_drop | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 3/3 · 11t / 5t | 3/3 · 11t / 5t | 2/2 · 11t / 6t | 2/2 · 11t / 6t | 2/2 · 11t / 6t |
| shield_hit | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/3 · 12t / 5t | 2/3 · 12t / 5t | 3/3 · 18t / 8t | 3/3 · 18t / 8t | 3/3 · 18t / 8t |
| shield_raise | 6/6 · 6t / 1t | 6/6 · 6t / 1t | 6/6 · 6t / 1t | 3/3 · 9t / 4t | 3/3 · 9t / 4t | 2/2 · 6t / 3t | 2/2 · 6t / 3t | 2/2 · 6t / 3t |
| side_special | 6/6 · 31t / 9t | 6/6 · 31t / 9t | 6/6 · 31t / 9t | 3/3 · 26t / 12t | 3/3 · 26t / 12t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| takeoff_backward | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 9t / 6t | 2/2 · 9t / 6t | 2/2 · 6t / 4t | 2/2 · 6t / 4t | 2/2 · 6t / 4t |
| takeoff_forward | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 9t / 6t | 2/2 · 9t / 6t | 2/2 · 6t / 4t | 2/2 · 6t / 4t | 2/2 · 6t / 4t |
| takeoff_neutral | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 9t / 6t | 2/2 · 9t / 6t | 2/2 · 6t / 4t | 2/2 · 6t / 4t | 2/2 · 6t / 4t |
| taunt_down | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 4/4 · 35t / 18t | 4/4 · 35t / 18t | 4/6 · 64t / 30t | 4/6 · 64t / 30t | 4/6 · 64t / 30t |
| taunt_side | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 2/3 · 29t / 19t | 2/3 · 29t / 19t | 4/6 · 64t / 30t | 4/6 · 64t / 30t | 4/6 · 64t / 30t |
| taunt_up | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 6/6 · 64t / 18t | 2/3 · 29t / 19t | 2/3 · 29t / 19t | 4/6 · 64t / 30t | 4/6 · 64t / 30t | 4/6 · 64t / 30t |
| tech_neutral | 6/6 · 26t / 6t | 6/6 · 26t / 6t | 6/6 · 26t / 6t | 3/3 · 18t / 7t | 3/3 · 18t / 7t | 4/6 · 26t / 8t | 4/6 · 26t / 8t | 4/6 · 26t / 8t |
| tech_roll | 6/6 · 40t / 8t | 6/6 · 40t / 8t | 6/6 · 40t / 8t | 4/4 · 22t / 8t | 4/4 · 22t / 8t | 5/6 · 40t / 12t | 5/6 · 40t / 12t | 5/6 · 40t / 12t |
| teeter_back | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 14t / 7t | 2/2 · 14t / 7t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 2/2 · 18t / 9t |
| teeter_front | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 3/4 · 14t / 4t | 3/4 · 14t / 4t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 2/2 · 18t / 9t |
| throw_victim | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 6/6 · 36t / 6t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| trip_fall | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 13t / 7t | 2/2 · 13t / 7t | 3/6 · 24t / 8t | 3/6 · 24t / 8t | 3/6 · 24t / 8t |
| trip_getup | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 4/4 · 19t / 7t | 4/4 · 19t / 7t | 6/6 · 24t / 6t | 6/6 · 24t / 6t | 6/6 · 24t / 6t |
| trip_prone | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 4/4 · 24t / 6t | 2/2 · 18t / 9t | 2/2 · 18t / 9t | 2/2 · 16t / 8t | 2/2 · 16t / 8t | 2/2 · 16t / 8t |
| trip_roll | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 5/5 · 26t / 8t | 5/5 · 26t / 8t | 6/6 · 24t / 14t | 6/6 · 24t / 14t | 6/6 · 24t / 14t |
| tumble | 1/6 · 18t / 18t | 1/6 · 18t / 18t | 1/6 · 18t / 18t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 16t / 4t | 4/4 · 16t / 4t | 4/4 · 16t / 4t |
| tumble_recover | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 14t / 8t | 2/2 · 14t / 8t | 4/4 · 12t / 3t | 4/4 · 12t / 3t | 4/4 · 12t / 3t |
| turn_run | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 9t / 5t | 2/2 · 9t / 5t | 2/2 · 6t / 4t | 2/2 · 6t / 4t | 2/2 · 6t / 4t |
| turn_stand | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 6/6 · 18t / 3t | 2/2 · 8t / 4t | 2/2 · 8t / 4t | 2/2 · 6t / 3t | 2/2 · 6t / 3t | 2/2 · 6t / 3t |
| up_air | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 3/3 · 18t / 9t | 3/3 · 18t / 9t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| up_smash | 6/6 · 39t / 11t | 6/6 · 39t / 11t | 6/6 · 39t / 11t | 3/3 · 29t / 15t | 3/3 · 29t / 15t | 4/4 · 19t / 8t | 4/4 · 19t / 8t | 4/4 · 19t / 8t |
| up_special | 6/6 · 37t / 15t | 6/6 · 37t / 15t | 6/6 · 37t / 15t | 3/3 · 25t / 12t | 3/3 · 25t / 12t | 3/3 · 17t / 8t | 3/3 · 17t / 8t | 3/3 · 17t / 8t |
| up_throw | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 6/6 · 28t / 8t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 5/5 · 26t / 13t | 5/5 · 26t / 13t | 5/5 · 26t / 13t |
| up_throw_victim_preview | — | — | — | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 3/3 · runtime | 3/3 · runtime | 3/3 · runtime |
| up_tilt | 6/6 · 24t / 7t | 6/6 · 24t / 7t | 6/6 · 24t / 7t | 3/3 · 15t / 7t | 3/3 · 15t / 7t | 3/3 · 16t / 8t | 3/3 · 16t / 8t | 3/3 · 16t / 8t |
| victory_1 | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 2/2 · 32t / 24t | 2/2 · 32t / 24t | 3/6 · 92t / 76t | 3/6 · 92t / 76t | 3/6 · 92t / 76t |
| victory_2 | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 2/2 · 32t / 25t | 2/2 · 32t / 25t | 3/6 · 92t / 76t | 3/6 · 92t / 76t | 3/6 · 92t / 76t |
| victory_3 | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 6/6 · 92t / 30t | 2/2 · 32t / 24t | 2/2 · 32t / 24t | 3/6 · 92t / 76t | 3/6 · 92t / 76t | 3/6 · 92t / 76t |
| walk | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 8/8 · 24t / 3t | 8/8 · 24t / 3t | 4/4 · 24t / 7t | 4/4 · 24t / 7t | 4/4 · 24t / 7t |
| wall_tech | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 2/2 · 15t / 9t | 2/2 · 15t / 9t | 4/6 · 24t / 8t | 4/6 · 24t / 8t | 4/6 · 24t / 8t |
| wall_tech_jump | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 6/6 · 24t / 4t | 3/3 · 20t / 9t | 3/3 · 20t / 9t | 4/6 · 24t / 8t | 4/6 · 24t / 8t | 4/6 · 24t / 8t |

## Gait candidate review

The first supplemental sheets were reviewed for the three Pack 03 fighters. Keep the shipped four-pose loops until replacement poses pass review.

- Mr. Wrong: The tentacle silhouette reads, but the raised-foot drawings repeat a similar lead. Redraw with explicit near and far foot passing poses and keep the planted tentacle on the floor line.
- Loopy: The jersey is blank as required. The shipped Pack 03 builder specifies a plain cream jersey with purple trim. Use that production palette and retain the blank jersey on both facings.
- Mrs. Tasselbottom: The gown reads clearly, but several poses hide the supporting shoe under the hem. Show which shoe bears weight and keep the gown and tassels following the body rather than driving the stride.

Next, review the revised passing poses beside the shipped contact poses, then verify the resulting walk and run cycles in both directions in the Dojo.

### Second candidate pass

The revised walking pairs show clearer alternating support for Mr. Wrong and Mrs. Tasselbottom. The run pairs still repeat the same raised leg in both drawings. Loopy's revised purple jersey also diverges from the cream production palette. Keep the current atlases while preparing a matching Loopy walk pair and run push-offs with distinct support legs for all three fighters. Review the walk candidates against the original contact drawings for scale and sole alignment before integration.

### Walk integration

Revision 44 adds two passing poses per fighter to the Pack 03 walk loops. Each loop now has six poses across the same 24 ticks. Loopy retains the blank cream jersey. Pilot and production atlas builds passed. At normal speed in local browser Dojo Free Practice, analog walk input in both directions displayed all six atlas frames for each fighter. All six fighter-direction cases passed with no page errors. This verifies frame playback. Visual signoff for planted feet and loop seams remains open. Run remains at four poses because the latest candidates repeated the same lead leg.

### Run integration

Revision 45 adds a push-off and a reaching stride to each Pack 03 run loop. The six poses retain the original 14, 16, and 20 tick cycles for Mr. Wrong, Loopy, and Mrs. Tasselbottom respectively. Pilot and production atlas builds passed. Local Dojo Free Practice displayed all six run frames for each fighter in both directions at normal speed, with no page or atlas request errors. Visual signoff for run foot placement and loop seams remains open. Next, expand crouch entry, hold, and rise, then review jump squat through landing.

### Crouch integration

Revision 46 adds four crouch drawings per fighter. Entry and rise each play four distinct poses including idle. The hold alternates two low poses. Local Dojo keyboard playback verified all three phases for Mr. Wrong, Loopy, and Mrs. Tasselbottom at normal speed with visible atlas sprites and no browser or atlas request errors. The pilot and production builds passed. Production packing grew from seven to eight pages, with 134,217,728 live texture bytes and 32,982,076 download bytes. Review planted foot alignment and early release visually before signoff. Next, audit jump squat through landing, including apex, fall, and double jump.

### Jump-to-landing baseline

Local Dojo Free Practice at revision 46 traced a grounded jump, a second jump, and a fast-fall for each Pack 03 fighter. All three displayed the same distinct-pose counts at normal speed: squat 1, neutral takeoff 2, rise 1, apex 1, fall 1, double jump 2, fast-fall 2, heavy landing 3. All three runs completed without page errors or failed Pack 03 asset requests. Soft landing and directional takeoff were outside this trace.

Next, add a planted compression drawing for squat and subtle, pelvis-aligned poses for rise, apex and fall. Keep the short squat timing and check for visible jumps in position at takeoff and apex. Then expand double jump and test both soft and heavy landing paths.

### Jump follow-through

Revision 47 adds a planted compression and one follow-through drawing each for rise, apex, and fall. Squat retains its four-tick art duration. Airborne drawings use pelvis registration. All three fighters displayed both poses for each updated phase and all three heavy landing poses during repeated normal-speed Dojo jumps. No page or Pack 03 asset request errors occurred. Pilot and production atlas builds passed, with eight production pages. Visual review of takeoff and apex continuity is pending. Next, expand double jump and verify directional takeoffs and both landing paths.

### Double jump and landing verification

Revision 48 adds a dedicated pelvis-registered drawing between the double-jump thrust and rising tuck. The clip now uses three poses in the same 12 ticks. Both atlas builds passed and production stayed at eight pages. Local Dojo checks passed for three neutral takeoffs, twelve directional takeoffs, six double jumps, and six landings. Each double jump displayed all three poses in order and each soft and heavy landing displayed three poses. No page or Pack 03 asset request errors were recorded. The directional trace sampled only the first fall pose because it ended on entering fall. Next, review the takeoff, apex, double-jump and landing seams visually at normal and stepped speed, then expand fast-fall and teeter as needed.

### Jump seam review

A contact sheet of atlas frames registered to their gameplay roots showed that the landing soles align across all three poses. Takeoff and double-jump poses were reviewed at their airborne roots. The directional trace exposed inconsistent apex pose order because playback used a modulo of the full airborne age. Pack 03 now selects the first apex pose while rising and the second as descent starts. Normal-speed Dojo traces confirmed one ordered swap for each fighter. The 17 movement presentation tests passed. The contact sheet and browser traces cover frame alignment and selection. A continuous visual review in the Dojo remains open. Next, expand fast-fall and front/back teeter.

### Fast-fall and ledge teeter

Revision 49 adds one fast-fall pose and one pose to each front and back teeter. Each clip now displays three distinct drawings per fighter. Fast-fall retains the eleven-tick allocation and holds the final pose until landing. Teeter uses four six-tick slots with the new transition shown in both directions through the loop. Both atlas builds passed and production stayed at eight pages. Dojo coverage passed for six fast-falls and twelve teeters, including exits by stepping inward. One short left-facing Mrs. Tasselbottom fast-fall sampled only two frames. A higher drop replay displayed all three before landing in both facings. No browser or atlas request errors were observed in the passing runs. Visual signoff for the new ledge foot placement and fast-fall seam remains open. Next, use the parity inventory to prioritize defensive and damage-reaction clips.

### Shield raise and drop

Revision 50 adds four guard inbetweens used in both directions. Pack 03 now matches the original three fighters at six distinct poses per clip. Moonshine and Hoagie still have three per clip. All six Pack 03 fighter-facing Dojo cases showed six raise and six drop poses, fixed floor contact, and the full eleven-tick drop. Both atlas builds passed and production stayed at eight pages. Next bring Pack 02 to the same drawing target before moving to jab chains.

### Roster-wide shield drawing parity

Pack 02 revision 52 adds three registered guard inbetweens for Moonshine and Hoagie. All eight fighters now have six distinct drawings for both raise and drop. Pack 02 raise metadata now reflects the existing six-tick runtime window, down from nine declared ticks. Shield drop remains eleven ticks. Four stepped Dojo guard cases passed, covering both fighters in both facings, six distinct poses per transition, and grounded contact. The newcomer atlas built with 856 frame entries across four pages. Next audit jab chains by move and active window before drawing the missing poses.

### Jab chain inventory

Audited the three current production manifests and queried the engine move table for all eight fighters. Counts are distinct atlas image and rectangle pairs. Active windows are zero-based and end-exclusive.

| Roster | Jab 1 / 2 / 3 drawings | Declared art windows |
| --- | --- | --- |
| All-Rounder, Abe Lincoln, Swift | 9 / 6 / 6 each | Jab 1 has [3,5) for Abe and Swift. All-Rounder has no explicit window. Jab 2 [3,5), Jab 3 [4,7). |
| Moonshine and Hoagie | 9 / 3 / 3 each | [3,5), [3,6), [4,8) |
| Mr. Wrong, Loopy and Mrs. Tasselbottom | 3 / 3 / 3 each | [4,8) for all three |

The engine uses startup / active / recovery counts of 3 / 2 / 10, 3 / 2 / 10, and 4 / 3 / 18 respectively for all eight. The renderer maps declared art windows onto the engine's live active ticks. A wider authored window therefore does not extend the gameplay hit. All-Rounder's first jab takes a different selection path because it lacks explicit metadata.

Use 9 / 6 / 6 as the drawing target. The 48-drawing gap is 36 across Pack 03 and 12 across Pack 02, assuming each existing pose is retained. Start with Pack 03 Jab 1. Budget three startup drawings, one extended contact drawing covering both active ticks, and five recovery drawings inside the ten recovery ticks. Anchor planted soles and verify the visible strike against the engine circle on both active ticks in both facings. Check a standalone jab and the buffered chain before continuing to stages 2 and 3. Visual contact and frame playback remain to be verified.

### Pack 03 Jab 1

Revision 51 adds six drawings per fighter for nine distinct Jab 1 poses. The 15-tick clip uses three startup poses, one contact pose across active ticks 3 and 4, and five recovery poses. The new drawings match the shipped jab scale. The original strike drawing and socket remain in use.

The production atlas rebuilt at eight pages. At quarter speed in the Dojo, all six standalone hit cases displayed all nine poses and held contact through hitlag. All six buffered chain cases reached Jab 2 and Jab 3 against a distant partner. Both active Jab 1 ticks used the contact drawing in both facings. The smallest distance inside the authoritative hitbox boundary was 9.83 world units for Mr. Wrong, 2.51 for Loopy, and 4.95 for Mrs. Tasselbottom. Next expand Jab 2 and 3 for Packs 02 and 03. Normal-speed visual signoff remains open.

### Jab 2 and Jab 3 parity

Pack 02 revision 53 and Pack 03 revision 52 bring all eight fighters to 9 / 6 / 6 distinct drawings across the jab chain. Both follow-ups use three startup drawings, one contact and two recovery drawings. The Dojo caught overextended Pack 02 contact drafts. The final Pack 02 contacts use compact body strikes registered at the visible fist. Pack 03 retained its existing contact drawings and sockets.

All ten quarter-speed Dojo chain cases reached Jab 1, 2 and 3 against a distant partner. Each Jab 2 contact was inside the live circle on ticks 3 and 4 and each Jab 3 contact on ticks 4 through 6, in both facings. The narrowest margin was 0.74 world units on Mrs. Tasselbottom Jab 2. Both production builds passed at four and eight pages respectively. These cases verify chain activation and contact alignment. Normal-speed visual signoff and chained hit confirmation against a nearby partner remain open. Next audit damage reactions.

### Damage-reaction parity inventory

Measured the three production manifests on 2026-11-12. Each count applies to every fighter in its pack. Counts are distinct image and rectangle pairs within each clip. The target is the highest existing count for comparable live clips. Launch and tumble are tracked separately because their playback differs by pack.

| Clip | Original trio | Moonshine and Hoagie | Mr. Wrong, Loopy and Mrs. Tasselbottom | Target | Added pose slots across roster |
| --- | ---: | ---: | ---: | ---: | ---: |
| hit_high | 4 | 2 | 2 | 4 | 10 |
| hit_mid | 4 | 2 | 2 | 4 | 10 |
| hit_low | 4 | 2 | 2 | 4 | 10 |
| hit_heavy | 6 | 2 | 2 | 6 | 20 |
| hit_air | 6 | 2 | 2 | 6 | 20 |
| tumble_recover | 6 | 2 | 4 | 6 | 14 |
| knockdown_up | 6 | 1 | 5 | 6 | 13 |
| knockdown_down | 6 | 1 | 5 | 6 | 13 |
| prone_up | 4 | 2 | 2 | 4 | 10 |
| prone_down | 4 | 2 | 2 | 4 | 10 |
| jab_lock_up | 4 | 2 | 4 | 4 | 4 |
| jab_lock_down | 4 | 2 | 4 | 4 | 4 |
| trip_fall | 6 | 2 | 3 | 6 | 17 |
| trip_prone | 4 | 2 | 2 | 4 | 10 |

The first five clips need 70 additional pose slots, 28 in Pack 02 and 42 in Pack 03. The remaining rows need 95. These figures count per-clip additions. They do not certify artwork uniqueness across clips.

- **Hit launch:** Pack 03 has two launch drawings selected before tumble by its renderer. Earlier packs have no dedicated launch clip. Proposed parity is two launch drawings per fighter, with ten additional drawings across Packs 01 and 02 and a renderer handoff check before signoff.
- **Tumble:** Pack 01 uses one drawing in six slots and applies an 18-tick sprite rotation. Packs 02 and 03 use four distinct drawings. Proposed target is four distinct drawings across the roster, with nine additional drawings for Pack 01. Verify the rotation and pose changes together to avoid doubling the apparent spin.
- **Generic reaction:** Pack 01 has four, Pack 02 has two, and Pack 03 omits the clip. Live non-tumbling hitstun uses the dedicated high, low, heavy, air, or default mid clip. No extra generic artwork is planned for this pass.

Start with high, mid, and low recoil for Packs 02 and 03. Draw impact, follow-through, settle, and late recovery at their respective hit heights. For heavy and air, use six distinct silhouettes, with stronger compression and follow-through and pelvis registration when airborne. Verify real Dojo contacts in both facings, short and long hitstun, hitlag hold, and the return to idle or fall. Short reactions may exit before the final drawing. Verify the full clip separately and preserve the simulation window. Playback, pixel quality and contact have not been certified by this inventory.

### Grounded recoil parity

Pack 02 revision 54 and Pack 03 revision 53 add a follow-through and settling drawing to each high, mid and low reaction. All eight fighters now have four distinct drawings per clip. Thirty quarter-speed Dojo cases verified clip selection, impact pose held during hitlag, facing, and visible sprites through the end of hitstun. At 0%, jab and up-tilt sampled three poses before hitstun ended. At 50%, down-tilt sampled all four. Both atlas builds passed. Normal-speed visual signoff remains open. Next add four poses each for heavy and airborne reactions on the five fighters in Packs 02 and 03.

### Heavy and airborne recoil parity

Pack 02 revision 55 and Pack 03 revision 54 add four poses each for heavy and airborne hits to all five updated fighters. All eight fighters now have six distinct drawings in each clip. The new airborne poses use pelvis registration. The authored heavy and air durations retain their previous totals. Pack 02 uses manifest durations for the expanded hit clips.

Twenty quarter-speed Dojo cases passed across both facings. Grounded forward smash showed all six heavy poses. Airborne jab showed the first three before hitstun ended. All cases held the impact pose during hitlag and kept the sprite visible. Both atlas builds and all 17 movement presentation tests passed. Full six-pose airborne playback and normal-speed visual signoff remain open. Next verify a longer airborne reaction and expand tumble recovery.

### Full airborne playback and tumble recovery

Airborne up tilt at 50% displayed all six recoil poses for each updated fighter in both facings. All ten quarter-speed Dojo cases passed, including the impact hold during hitlag. At 0%, the same attack displayed three poses before hitstun ended.

Pack 02 revision 56 adds four tumble recovery drawings per fighter. Pack 03 revision 55 adds two. All eight fighters now have six distinct recovery poses. Both production builds passed at four and eight pages respectively. Ten quarter-speed Dojo cases started from a seeded tumble state and verified that the six recovery drawings played in order, in both facings, as the fighter regained control. Pack 03 returned to the fall clip at cue tick 12. Pack 02 still showed the final recovery drawing at tick 12. Its later fall handoff and normal-speed visual continuity remain open. Next expand face-up and face-down knockdown and prone clips.

### Knockdown draft costume review

No draft frames were installed. Hoagie's initial sheets changed his wine-red singlet to cream, Mr. Wrong's lightened the vest, and Mrs. Tasselbottom's turned major purple gown panels cream. Loopy's sheet also lacked fully prone drawings. Moonshine's draft preserved recognizable clothing but showed red edge residue and repeated floor poses. A [single Hoagie face-up pilot](../../concept-art/sprite/hulk-hoagie-face-up-costume-pilot.png) generated from shipped idle preserves the wine-red singlet and cream trim. It remains a source-art candidate pending scale, alpha and floor registration checks. Continue one fighter and orientation at a time using the [costume review workflow](FIGHTER-PACK-PRODUCTION.md#costume-reference-and-first-pose-review).

### Hoagie knockdown and prone parity

Pack 02 revision 57 gives Hoagie six distinct knockdown poses and four prone poses for each orientation. The face-up pilot retained the wine-red singlet and showed clear alpha margins. A separately reviewed face-down pilot established the forward fall. Both follow-up sheets were registered using measured transparent gutters and scaled against the shipped floor silhouettes. The final knockdown drawing is also the first prone drawing. The renderer uses the actual prone drawing at the beginning of get-up and floor attack so added hold indices cannot select an unrelated recovery pose.

Four quarter-speed Dojo cases passed after real forward-smash hits at 50%. Both orientations in both facings displayed the expected six knockdown drawings over 18 ticks, then four prone drawings over 12 ticks with soles or the lowest body pixel on the floor. The newcomer production atlas rebuilt with four pages. Normal-speed visual signoff and explicit get-up and floor-attack continuity checks remain open. Next complete Moonshine with his shipped idle and a single-pose review, then Mr. Wrong, Loopy and Mrs. Tasselbottom one at a time.

### Moonshine knockdown and prone parity

Pack 02 revision 58 gives Moonshine six distinct knockdown drawings and four prone drawings in each orientation. Both orientation pilots were reviewed against the shipped idle before drawing follow-ups. A replacement face-up sheet removed visible red residue from the draft. The final knockdown drawing is shared with the first prone drawing.

Four quarter-speed Dojo cases passed after forward smash at 50%. Both orientations in both facings showed all six knockdown drawings during the 18-tick knockdown and all four prone drawings during the 12-tick hold, with floor registration throughout. The newcomer production atlas rebuilt at four pages. Normal-speed visual signoff remains open. Next apply the single-pose workflow to Mr. Wrong, followed by Loopy and Mrs. Tasselbottom.

### Mr. Wrong knockdown and prone parity

Pack 03 revision 56 gives Mr. Wrong six distinct knockdown drawings and four prone drawings per orientation. Single face-up and face-down poses were reviewed against his shipped idle before generating the follow-ups. The new floor drawings preserve the burgundy vest, spotted sleeves, pink shorts and teal tentacles. The last knockdown drawing is shared with the first prone drawing.

Four quarter-speed Dojo checks passed after forward smash at 50%. Both orientations and facings showed all six knockdown drawings during the 18-tick knockdown and all four prone drawings during the 12-tick hold. Floor registration stayed aligned through both transitions. Pilot and production builds passed. The new drawings use the existing secondary pilot page to stay within the main page capacity. Production remains at eight pages. Normal-speed visual signoff remains open. Next is Loopy, followed by Mrs. Tasselbottom.

### Loopy knockdown and prone parity

Pack 03 revision 57 gives Loopy six distinct knockdown drawings and four prone drawings per orientation. The single-pose review checked the shipped blank cream jersey and purple trim. The first face-down sheet showed a light halo and was excluded. The replacement followed a clean single face-down pose. Each knockdown ends on the first prone drawing.

Four quarter-speed Dojo cases passed after forward smash at 50%. Both orientations in both facings showed all six drawings during the 18-tick knockdown, followed by all four during the 12-tick prone hold. Floor registration stayed aligned. Both atlas builds passed and production stayed at eight pages. Normal-speed visual signoff remains open. Mrs. Tasselbottom is next.

### Mrs. Tasselbottom knockdown and prone parity

Pack 03 revision 58 completes six knockdown and four prone drawings per orientation across all eight fighters. The reviewed single poses and follow-ups preserve Mrs. Tasselbottom's purple gown, gold tassels and lace trim. A face-down draft with stray colored pixels was excluded. The four accepted sources had no alpha 16–199 pixels more than four pixels from alpha 200+ ink. The final knockdown drawing is shared with the first prone drawing.

Four quarter-speed Dojo cases passed after forward smash at 50%, covering both orientations and facings. Each displayed six knockdown drawings over 18 ticks and four prone drawings over 12 ticks with floor alignment throughout. Both atlas builds passed and production stayed at eight pages. Normal-speed visual signoff remains open. Next expand Pack 02 jab locks, then trip falls and seated holds.

### Pack 02 jab-lock parity

Pack 02 revision 59 brings Moonshine and Hoagie to four distinct jab-lock drawings per orientation, matching the other six fighters. The clips reuse the shipped impact and two reviewed prone drawings. The live selector advances every four ticks. No new source images were required and the rebuilt production atlas stayed at four pages with the same transfer size.

Eight quarter-speed Dojo checks seeded a jab lock with hitlag and verified the four drawings in order, orientation, facing, floor alignment, and return to hard landing. This checked renderer playback from a seeded state. The floor-hit unit tests cover lock initiation and the two-lock limit. Normal-speed visual signoff remains open. Next expand trip falls and seated holds.

### Trip artwork transparency review

Moonshine's trip drafts were excluded from the atlas. An alpha scan counted 598,548 and 931,381 semi-transparent pixels beyond a four-pixel neighborhood of solid ink in the two strips. The second strip also had alpha 122–175 in its four corners. The first seated pilot had 68 distant pixels despite clear corners. A replacement reduced that to 30 and remains a draft until its edges are clean. The in-game trip clips are unchanged.

### Moonshine trip fall and seated hold

Pack 02 revision 60 adds individually reviewed Moonshine trip drawings. The cleaned seated pilot had transparent corners and zero flagged distant pixels. The other five sources had 1–39 faint pixels outside the four-pixel neighborhood of solid ink. The production packer clears that detached fringe on these six sources before sampling. The two hazy strips were excluded. The final fall frame is shared with the first seated frame. The renderer now carries the current seated pose into the opening ticks of trip get-up, roll and floor attack.

Two quarter-speed Dojo cases seeded trip fall and displayed six fall and four seated drawings in order, with ground alignment in both facings. The newcomer atlas rebuilt at four pages and 17 movement presentation tests passed. Live trip initiation, the three recovery choices and normal-speed visual signoff remain open. Hoagie is next, then Pack 03.

### Hoagie trip fall and seated hold

Pack 02 revision 61 gives Hoagie six distinct fall poses and four seated hold poses. The individual drawings preserve his wine-red singlet and cream trim. The source alpha scan found one to fourteen detached faint pixels per drawing and no occupied canvas edges. The same packing cleanup used for Moonshine removes detached fringe from Hoagie's trip sources. Production remains at four pages.

Two quarter-speed Dojo cases seeded trip fall. Both facings displayed all poses in order with floor alignment. The fall and hold share the same boundary drawing, and the first get-up tick preserves the seated pose. Live trip initiation, roll and floor attack exits, and normal-speed visual signoff remain open. Next expand the trip set for Pack 03.

### Mr. Wrong trip fall and seated hold

Pack 03 revision 59 gives Mr. Wrong six distinct trip fall and four seated hold drawings. A single seated pose was reviewed against shipped idle before generating four individual follow-ups. The drawings preserve his burgundy vest, spotted sleeves, pink shorts and teal tentacles. Source alpha checks showed zero occupied edges and up to 55 faint detached pixels per source. The pilot builder applies its edge cleanup to the new drawings.

Two quarter-speed Dojo cases seeded trip fall and verified every pose in order and floor aligned in both facings. The last fall frame matches the first seated frame and the first get-up tick preserves the current seated pose. Both builds passed and production stayed at eight pages. Live trip initiation, roll and floor attack exits, and normal-speed visual review remain open. Loopy is next, followed by Mrs. Tasselbottom.

### Loopy trip fall and seated hold

Pack 03 revision 60 gives Loopy six distinct fall drawings and four seated hold drawings. The seated pilot and four individual poses preserve the blank cream jersey and purple trim. Source alpha checks found zero occupied edges and three to 45 faint detached pixels per pose. The pilot packer clears detached fringe on these sources before production packing.

Both quarter-speed Dojo cases seeded trip fall and verified all poses, floor alignment, the shared fall-to-hold drawing and the first get-up tick in both facings. The first test invocation read the preceding manifest while the build finished. The rerun used the completed revision 60 atlas. Both builds passed and production stayed at eight pages. Normal-speed signoff and live trip initiation, roll and floor-attack exits remain open. Mrs. Tasselbottom is next.

### Mrs. Tasselbottom trip fall and seated hold

Pack 03 revision 61 completes the six fall and four seated drawing targets across all eight fighters. The first seated candidate was rejected after the alpha scan found 781 detached faint pixels. The replacement pilot and four individual follow-ups preserve the shipped purple gown and gold tassels. They had zero occupied canvas edges and zero to seven detached faint pixels per source. The pilot builder clears the detached fringe before production packing.

Both quarter-speed Dojo cases seeded trip fall and verified all poses in order, floor alignment, the shared fall-to-hold drawing and first get-up tick. The pilot build passed on retry after a transient Windows write error. The production build passed and grew from eight to nine pages, adding 16 MiB of decoded texture allocation. Live trip initiation, roll and floor attack exits, and normal-speed visual review remain open. Next verify those paths and audit launch and tumble playback.

### Live trip exits and launch inventory

Twenty normal-speed Dojo cases covered all five updated fighters, both facings, and both seated exits. An All-Rounder partner down tilt at 0% triggered trip fall and seated hold. Direction then entered trip roll and Attack entered trip floor attack with the appropriate visible sprite. Adjacent sampled opening ticks preserved the seated drawing. These checks cover exit entry. They do not certify the entire roll and floor-attack sequence or human visual continuity. Dojo percent is held at its preset, so the trace used partner move and victim state to confirm the trip.

The current production manifests confirm that the original trio tumbles with one drawing rotated over 18 ticks. Pack 02 uses four drawings over a 12-tick loop. Pack 03 uses two launch drawings over 10 ticks, then four tumble drawings over a 16-tick loop with airborne roots. Only Pack 03 selects the dedicated launch clip before tumble and orients those sprites with launch direction. Next add two launch drawings per fighter for Packs 01 and 02 and validate the renderer handoff. Then bring the original trio to four tumble drawings and evaluate the existing rotation separately. Keep authored pose cadence separate from simulation hitstun.

### Launch drawing parity

Pack 01 revision 19 and Pack 02 revision 62 each add a two-pose launch clip per fighter. They reuse two distinct approved airborne reaction drawings with their shipped anchors. The renderer selects launch when it would otherwise select tumble, using the first drawing on ticks 0–3 and the second on ticks 4–9. The older packs retain their existing tumble orientation and rotation. Gameplay timing is unchanged.

Ten quarter-speed Dojo cases used forward smash at 50%, covering both facings for all five updated fighters. Each showed the first drawing through hitlag, played both launch drawings and switched to tumble at hitstun tick 10. Both production atlases rebuilt and all 17 movement presentation tests passed. Normal-speed visual continuity remains open. Next expand the original trio's tumble from one rotating drawing to four and review the rotation with the new poses.

### Original trio tumble parity

Pack 01 revision 20 replaces the six repeated slots with four distinct drawings. It retains the original tuck and reuses three shipped airborne poses, with their existing per-frame registration. The 18-tick rotation starts at zero on the first tumble tick. Pose selection shares that rotation clock, with holds of 4, 5, 4 and 5 ticks. Packs 02 and 03 retain their four-pose authored loops.

Six quarter-speed Dojo cases used forward smash at 50% in both facings. The launch handoff remained at tick 10, all four poses appeared in order, and sampled sprite angles matched the 18-tick phase. The original production build stayed at 17 pages. The verifier now derives live clip counts from source metadata and accounts for per-frame scale. It passed 2,305 frame entries with zero registration error. Normal-speed visual continuity remains open. Next refresh the paired-action and ledge inventory across all eight fighters.

### Paired-action and ledge inventory

Compared production source revisions 20, 62 and 61 for Packs 01, 02 and 03. Each number is the distinct image and rectangle count per fighter within that pack. Targets use the original trio as the reference. Extra direction-specific victim sheets need a separate live routing check.

| Clip | Pack 01 | Pack 02 | Pack 03 | Target |
| --- | ---: | ---: | ---: | ---: |
| Standing grab | 6 | 3 | 3 | 6 |
| Dash grab | 6 | 3 | 6 | 6 |
| Pivot grab | 6 | 3 | 5 | 6 |
| Grab hold | 4 | 1 | 1 | 4 |
| Grabbed | 4 | 3 | 1 | 4 |
| Grab release | 4 | 3 | 2 | 4 |
| Pummel | 6 | 2 | 2 | 6 |
| Pummel victim | 4 | 2 | 2 | 4 |
| Each of four throws | 6 | 3 | 5 | 6 |
| Throw victim | 6 | 3 | 3 | 6 |
| Footstool attacker | 6 | 3 | 2 | 6 |
| Footstool grounded victim | 6 | 2 | 1 | 6 |
| Footstool airborne victim | 6 | 3 | 1 | 6 |
| Ledge catch | 4 | 2 | 2 | 4 |
| Ledge hang | 4 | 1 | 1 | 4 |
| Ledge climb | 6 | 3 | 5 | 6 |
| Ledge roll | 6 | 4 | 5 | 6 |
| Ledge attack | 6 | 4 | 5 | 6 |
| Ledge jump | 6 | 3 | 3 | 6 |
| Ledge drop | 4 | 3 | 2 | 4 |
| Ledge trump | 4 | 3 | 1 | 4 |

Start with footstool as a paired batch. Newcomer playback currently selects index 1 before cue tick 4 and index 2 thereafter. The attacker contact correction also samples the victim with that rule. Use the same frame selector for rendering and socket lookup before adding poses, then check attacker sole to victim head in both facings and with mixed packs. The six-pose target needs 62 additional per-clip pose slots across Packs 02 and 03.

Next audit live grab hold, pummel, release and throw-victim routing before drawing. Prepared victim sheets can be selected at runtime despite their preview names, and some paths select fixed indices. Preserve the existing throw release timing and contact sockets. For ledge, check the hanging hand against the stage edge, verify the drop/trump branch, and check grip release into airborne playback. Counts are atlas evidence. Contact and normal-speed playback still require Dojo verification.

### Shared footstool pose selection

Playback and socket lookup now use the same frame selector. Existing short newcomer clips retain their timing, with indices clamped to the displayed frame. Six-frame clips use the original three-tick cadence. Four focused tests passed. All 36 live Pack 03 Dojo contact cases passed across nine attacker and victim combinations, both facings and both victim roles. The first sampled sole-to-head gap was below 0.15 world units in every case. Mixed-pack contact and full-sequence visual review remain open. No atlas frames changed.

The remaining target is 62 per-clip pose additions: 20 for Pack 02 and 42 for Pack 03. Start with one fighter and the three linked roles, using approved costume references and verifying the sockets against the actual rendered drawings.

### Moonshine footstool expansion

Pack 02 revision 63 gives Moonshine six distinct frames for each footstool role by reusing approved jump, crouch, recoil and idle drawings after the existing contact poses. The contact frames keep their sole and head sockets and lead each six-frame clip. No source images were added. Production stayed at four pages.

Twelve live Dojo cases covered Moonshine with Mr. Wrong in both role assignments and a Moonshine mirror, both facings, and both victim roles. First sampled sole-to-head gap was zero in every case. Moonshine displayed six attacker and grounded-victim poses. Airborne victim displayed five in the tested sequences, including replays from higher positions. The sixth drawing is registered in the production atlas, but its live playback remains open. Next trace the airborne cue handoff and expand Hoagie's three roles.

### Pack 02 footstool playback

Pack 02 revision 64 expands Hoagie to six distinct drawings in all three footstool roles using approved follow-through artwork. The first drawings keep the existing head and sole sockets. The production atlas rebuilt at four pages.

A center-stage airborne fixture at world x 640 and y 120 gave the victim enough space to finish the cue. The Moonshine trace showed frame six at cue ages 15–17 and tumble from age 18. Twelve live cases per fighter verified all six poses in the updated roles, covering mirror matches and both role assignments against Mr. Wrong, both facings and both victim roles. First sampled sole-to-head gaps were zero within floating-point precision. Next expand the three Pack 03 fighters and verify mixed-pack playback. Normal-speed human visual signoff remains open.

### Pack 03 footstool playback

Pack 03 revision 62 gives Mr. Wrong, Loopy and Mrs. Tasselbottom six distinct poses in each footstool role, matching the other five fighters. The first pose retains the shipped contact socket. Follow-through uses approved jump, recoil and stance art. Airborne victim follow-through uses its existing air roots where present. Both builds passed and production stayed at nine pages.

Twenty-four live Dojo cases paired each Pack 03 fighter with Hoagie in both role assignments, both facings and both victim roles. Both fighters displayed all six poses in every replay. The first sampled attacker sole and victim head aligned within floating-point precision. Airborne replays used a clear center-stage drop. Human visual signoff remains open. Next inspect grab hold, pummel, release and throw-victim routing before expanding paired clips.

### Live grab and throw pose routing audit

Inspected the renderer and production source revisions 20, 64 and 62. A distinct drawing in a manifest only adds live coverage if the renderer reaches it.

| Phase | Current route | Work before expanding |
| --- | --- | --- |
| Grab hold and held victim | The base timeline cycles four hold slots every 12 ticks. Packs 02 and 03 have one holder drawing. The newcomer victim route selects grabbed slot 1 before tick 5, then slot 0 of grabbed_hold_preview when present or the base clip otherwise. Holder socket lookup uses slot 0 for newcomers. | Give the established hold its own shared pose lookup for the displayed holder and its grip. Keep acquisition separate from the hold. Verify four registered hold poses for both roles. |
| Pummel and victim | Pack 02 pummel uses its authored active window. Pack 03 uses six slots but repeats the hold in five. The original victim timeline selects four poses over eight ticks. The newcomer victim branch selects only slots 1 and 2 at the four-tick boundary. | Map attacker poses to startup, active and recovery. Select victim poses from reaction age. Use the displayed attacker index for the holder socket and preserve the impact alignment. |
| Release or escape | Release cue lasts up to 12 ticks. The original trio can use four poses. Newcomers select slots 1 and 2, using grab_release_victim_preview when available. Pack 02's base release clip includes holder sockets and is not the visible victim sequence. | Expand the actual victim route. Check both escape and regular release. Verify the contact offset decays smoothly and grounded poses stay planted. |
| Throw and victim | Attacker selection remaps authoritative move ticks through the art active window. The release socket lookup uses the first pose at that window. Newcomer victims use the base forward clip or direction-specific preview clip and show slots 1 and 2. The original victim route shares one six-drawing clip across throws and uses direction-dependent indices. | Preserve release timing and direction. Audit reachability per direction before setting victim drawing counts. Align the first victim drawing with the release grip and verify mixed-pack handoffs. |

Start with holder and held-victim playback and shared socket selection. Confirm the existing contact baseline first, then add the hold drawings. Next handle paired pummels, release and escape, and finally four-direction throws. Recheck short and sustained grabs, both facings, mixed fighter sizes and a representative delayed online replay. This audit establishes static routing and does not certify live transitions.

### Shared grab hold selection

The renderer and the victim's holder-socket lookup now use the same clamped hold index. A four-pose hold advances every 12 ticks. A one-pose hold remains on its only drawing. The newcomer victim acquisition and single-pose hold routes remain active for the current atlases. The expanded four-pose victim clip can use the shared hold cadence.

Twenty-six local Dojo standing-grab cases passed across all nine ordered Pack 03 pairings and four mixed Pack 02/03 pairings, both facings. Each showed acquisition followed by at least 12 sampled held ticks, with horizontal grip alignment within 0.15 world units. The vertical rail accommodates different fighter heights, so the hand can sit below its top marker. Five contact tests and the client type check passed. No atlas art changed. Next add the four holder and four held-victim drawings together, then verify all four in a long hold and check delayed online playback.

### Moonshine paired grab hold

Pack 02 revision 65 gives Moonshine four holder poses and four held-victim poses. The holder starts on the shipped grip pose and the victim starts on the shipped acquisition drawing. New drawings were checked against the shipped costume, registered to visible grip points, and packed with detached-alpha cleanup. The atlas stayed at four pages.

Six sustained Dojo cases covered a Moonshine mirror, Moonshine holding Mr. Wrong, and Mrs. Tasselbottom holding Moonshine, each in both facings. Moonshine displayed all four poses in every assigned role. The horizontal grip gap stayed below 0.15 world units throughout the sampled holds. Vertical contact uses the existing height rail. Next expand Hoagie, then Pack 03. Human visual signoff approved on 2026-11-12. Delayed online replay remains open.

### Hoagie paired grab hold

Pack 02 revision 66 gives Hoagie four holder poses and four held-victim poses. The new drawings retain his wine-red singlet, cream trim and flat cap. They use the existing alpha cleanup. Grip sockets were registered to visible hand and chest pixels. The production atlas stayed at four pages.

Six sustained local Dojo checks passed in both facings across the Hoagie mirror, Hoagie holding Mr. Wrong, and Mrs. Tasselbottom holding Hoagie. Every assigned Hoagie role displayed all four poses with horizontal grip error below 0.15 world units. Next expand Pack 03, then run delayed online replay. Human visual signoff for Hoagie remains open.

### Mr. Wrong paired grab hold

Pack 03 revision 63 adds four holder and four held-victim poses for Mr. Wrong. The new drawings preserve his burgundy vest, gold buttons, spotted sleeves and teal tentacles. Drafts with costume changes or a second character were excluded. The pilot builder applies detached-alpha cleanup and registers each hand or chest grip. Production stayed at nine pages after a retry of a transient Windows write error.

Six sustained Dojo replays passed across both facings, the Mr. Wrong mirror, Mr. Wrong holding Hoagie, and Loopy holding Mr. Wrong. Every Mr. Wrong role displayed all four poses, with horizontal grip error below 0.15 world units. Next expand Loopy and Mrs. Tasselbottom, then test representative delayed online holds. Human visual signoff remains open.

### Loopy paired grab hold

Pack 03 revision 64 gives Loopy four holder and four held-victim poses. The new art preserves the blank cream jersey and purple trim. The pilot had low-alpha pixels at the canvas edge with maximum alpha 11. The opaque antlers were inside the crop. Detached fringe is cleared during packing. All four follow-ups had clear edges.

Six sustained Dojo replays passed in both facings across the Loopy mirror, Loopy holding Hoagie and Mr. Wrong holding Loopy. Both fighters displayed four poses in every case. Horizontal grip error remained under 0.15 world units. Both atlas builds passed and production stayed at nine pages. Mrs. Tasselbottom is next, then representative delayed online replay. Human visual signoff remains open.

### Mrs. Tasselbottom paired grab hold

Pack 03 revision 65 gives Mrs. Tasselbottom four holder and four held-victim poses, completing the drawing targets across all eight fighters. The accepted poses preserve the purple gown and gold tassels. Drafts with a broad halo were excluded. The existing pilot cleanup clears detached faint pixels before production packing.

Six sustained Dojo cases passed in both facings across the mirror, Mrs. Tasselbottom holding Moonshine, and Loopy holding Mrs. Tasselbottom. Both participants displayed all four poses in each replay. Horizontal grip error remained under 0.15 world units. Both atlas builds passed and production stayed at nine pages. Next run delayed online replay across the updated packs, then expand paired pummels. Human visual signoff remains open.

### Delayed online hold replay

On 2026-11-12, two local browser clients played three standing-grab matchups with a 100 ms one-way delay on the host's outgoing gameplay input packets. The host grabbed facing right in each room.

| Holder | Victim | Sampled host / guest snapshot ticks |
| --- | --- | --- |
| Mr. Wrong | ‘Hulk’ Hoagie | 29 / 28 |
| Loopy | Mrs. Tasselbottom | 28 / 29 |
| Moonshine | All-Rounder | 28 / 28 |

Both clients showed four distinct holder textures and four distinct victim textures per matchup. Both sprites stayed visible throughout the sampled holds. The horizontal grip gap was zero at the sampled points. The initial 700 ms capture saw three poses per role. Extending the observation to 1.8 seconds captured the fourth. This check covers representative right-facing online holds. The earlier Dojo checks cover both facings.

Next expand paired pummels and verify the synchronized contact and return to hold.

### Paired pummel timing preparation

The holder's displayed attack pose and the victim's grip attachment now use the same authored attack-window mapping when a newcomer pummel supplies an active window. The four-pose reaction route accepts expanded newcomer clips, and three-slot legacy clips retain their existing two-pose reaction. Client type checking and 21 contact and timeline tests passed. New pummel drawings and both-facing Dojo verification remain open. The drawing targets are six holder poses and four victim poses for each Pack 02 and Pack 03 fighter.

### Hoagie pummel pose study

The first Hoagie study uses his shipped hold sprite as the costume reference. It preserves the flat cap, burgundy singlet, cream wraps, knee pads and lace-up boots. The striking fist stays near the torso, so this drawing is a windup candidate. The active drawing needs a clearer reach while the gripping hand stays attached. The study is outside the runtime atlas. Six holder and four victim poses per fighter, atlas packaging and both-facing Dojo verification remain open.

The follow-up contact study extends the striking fist below the open grip while retaining the shipped costume. It remains outside the runtime atlas. Register the two studies against the support foot and grab socket before drawing the remaining holder and victim frames.

#### Hoagie study registration

Both studies use a 1199 × 1312 source canvas. The shipped hold reference places the grip 35.58 world units forward and 66.26 above its root. The following provisional source-canvas coordinates reproduce that offset while placing each root on its visible boot baseline. Subtract the crop origin from the root and grip before writing them into atlas frame metadata.

| Pose | Grip | Root | World scale |
| --- | --- | --- | --- |
| Windup | (1020, 282) | (497.06, 1256) | 0.068033 |
| Contact | (1028, 284) | (500.23, 1267) | 0.067410 |

The scale adjustment is about 1–2% relative to the shipped hold reference. This checks the registration math. Visual foot placement and the strike-to-reaction handoff still need a live replay once the remaining poses are drawn and packed.

The victim impact study uses Hoagie's shipped held sprite as reference. The closed eyes, tightened hands and bent knees give the reaction a distinct silhouette. The next drawings should reduce that tension in stages back into the held posture. The impact study still needs chest-rail registration and a paired replay.

#### Hoagie victim recovery study

The first recovery drawing reopens the eyes and relaxes the hands while keeping the impact drawing's stance. The shipped held pose uses a source-canvas root of (619.5, 1233) and a chest rail from (638, 426) to (638, 524). The impact and recovery drawings retain approximately the same chest and boot placement. Use those coordinates as the initial registration reference and verify the final crop-relative anchors during packing.

The recovery drawing is still outside the runtime atlas. The remaining work is to complete the pose sequence, pack it and verify the impact-to-hold transition in both facings.

#### Hoagie pummel drawing sequence

The holder transition sheet adds anticipation, follow-through and recoil. The six-pose sequence starts with the shipped hold and plays anticipation, windup, contact, follow-through and recoil. The victim transition sheet adds peak recoil and late recovery. Play impact, peak recoil, first recovery and late recovery before returning to the held loop.

Next crop and register the sheets, then package the clips and step through both facings in the Dojo. The new drawings are still source art and have yet to be verified in gameplay.

#### Hoagie pummel atlas

Pack 02 revision 67 includes six distinct holder frames and four distinct victim frames. Registration matches the shipped hold grip or chest rail relative to each frame's boot baseline. The holder contact frame begins at the authored active boundary. The newcomer atlas built successfully and the packed manifest contains ten distinct frame rectangles across the two clips. Both-facing Dojo timing and visual review remain open.

#### Hoagie pummel Dojo verification

Two quarter-speed Hoagie mirror replays passed, with the holder facing right and left. Each showed six distinct holder frames and four victim reaction frames, with the first victim reaction on the same simulation tick as the contact frame and pummel hit event. The victim returned to the held loop 15 ticks after impact. The holder returned to the hold 20 ticks after impact. Both sprites remained visible and the sampled horizontal hand-to-chest-rail gap was zero through the return to hold. No browser errors were recorded.

This verifies timing and horizontal grip alignment for the mirror. Gameplay-speed visual signoff and mixed-size pairings remain open. Next apply the six-holder and four-victim pose targets to Moonshine.

#### Moonshine pummel contact study

The first draft read as a one-handed jab. The revised source drawing preserves Moonshine's shipped costume and separates the raised grip from the striking fist below it. Use this drawing for the contact keyframe after registering the grip and boot baseline. The remaining holder and victim drawings, atlas integration and both-facing Dojo replay are open.

#### Moonshine holder transitions

The holder study adds anticipation, windup, follow-through and recoil. Together with the shipped hold and separate contact study, these supply six holder drawings for review. The shipped hold grip sits 10.32 world units forward and 50.29 above the root. Use that offset to evaluate registration against the boot baseline. The generated grip sits higher and farther forward in the raw drawings, so check foot drift when matching anchors.

The sheet shows colored fringe around parts of the silhouette, especially near the arms. Resolve it and verify the outline over a light and dark background before packing. The victim sequence and both-facing Dojo checks remain open.

#### Moonshine holder edge and registration review

The cleanup pass still shows saturated fringe between the arms, especially on follow-through, so it was rejected for the atlas. At approximately the shipped height, the top-left study's boot-centered registration puts the grip about 15–16 world units forward and 58 above the root. The shipped hold measures 10.32 forward and 50.29 above. Moving the entire sprite to match the grip would shift the feet; shrinking it to close the vertical gap would change his size during the pummel. Keep the shipped boot baseline and body scale as the reference and bring the gripping arm down and back in the drawing before packing.

The low-grip contact study restores the bent gripping elbow and puts the upper hand near the shipped grip, with the striking fist below it. This is the new reference for the holder transitions. A small red fringe remains at the inner elbow. Final alpha cleanup, anchor measurement, packing and Dojo playback remain open.

The cleaned contact study removes the conspicuous inner-elbow red speck in visual review. Estimated source anchors are grip (769, 426) and root (599, 1259). At the shipped scale these give 10.32 forward and 50.59 above the root, within about 0.30 world units of the shipped hold. These are provisional visual measurements. Use the cleaned contact as the reference for the remaining holder transitions and verify the final atlas crops over both light and dark backgrounds.

The four low-grip holder transitions keep the bent gripping elbow and show distinct striking-arm positions. Red fringe remains above the gripping forearm in multiple cells. Keep the sheet as source art until those edges pass review and the grip and boot anchors are registered.

#### Moonshine pummel source review

A second generative cleanup left red wedges outside the holder's forearm contour. Use a localized alpha mask for those wedges to preserve the pose and costume. The victim study supplies impact, peak recoil and early recovery candidates. The last cell still reads as a flinch and needs a calmer expression for the held-loop handoff. Inspect the upper cap edges for clipping and fringe before registration. No new Moonshine frames have been packed.

#### Moonshine late recovery review

The single-pose redraw gives Moonshine a calmer expression and a stance close to the held loop. Both previews still show a diffuse halo. The revised PNG contains transparency, but the visible halo makes it unsuitable for the gameplay atlas. Neither revision was copied into the game. Preserve the shipped silhouette matte when revising the expression, then inspect the result over light and dark backgrounds before packing. The holder forearm cleanup and both-facing Dojo verification also remain open.

The follow-up alpha inspection distinguishes the preview appearance from the saved PNG. Using alpha 128 as the silhouette threshold, the calmer late-recovery candidate has 74 nonzero-alpha pixels more than 16 Manhattan pixels from the silhouette. The shipped held reference has 2,526 under the same check. Save the calmer drawing as a source candidate. The count alone does not establish that every edge looks clean in game. Inspect the crop composited on light and dark backgrounds, then register it with the other victim frames. Holder cleanup, packing and both-facing playback remain open.

#### Moonshine late recovery composite

The saved PNG was composited over parchment and dark slate beside the shipped held pose and reaction sheet. The diffuse halo visible in the generation preview does not appear in either composite at review scale. The late-recovery chest and boots visually align with the shipped pose on their shared 1024 × 1536 canvas. Start registration from the shipped source coordinates: root (543, 1388), grip top (579, 696), grip bottom (579, 763), scale 0.0594965. Confirm those points on the cropped frame and compare against the first three reactions before packing. The recovery expression still needs a Dojo check because the shipped held drawing opens the eyes and mouth again.

#### Moonshine victim crop registration

Measured crop rectangles use the alpha-128 silhouette. Chest points were placed by visual inspection. The scale and root preserve the shipped chest rail offset from the boot baseline. Coordinates below are crop-relative except for the source rectangle.

| Pose | Source rectangle (x, y, width, height) | Root | Grip top | Grip bottom | Scale |
| --- | --- | --- | --- | --- | --- |
| Impact | (195, 9, 253, 593) | (132.83, 591) | (150, 261) | (150, 292.95) | 0.124762 |
| Peak recoil | (732, 7, 281, 595) | (136.83, 593) | (154, 263) | (154, 294.95) | 0.124762 |
| Early recovery | (198, 653, 250, 590) | (134.99, 588) | (152, 261) | (152, 292.66) | 0.125907 |
| Late recovery | (227, 134, 550, 1254) | (316.10, 1252) | (352, 562) | (352, 628.81) | 0.059669 |

The first three frames come from the reaction sheet. Late recovery comes from the separate composite-reviewed drawing. The strongest silhouette pixels on the top row start seven or more pixels below the canvas edge. The close crop still warrants inspecting the cap fringe on the packed frames. These coordinates are ready for a packing trial. Holder edge cleanup and paired Dojo verification remain open.

#### Moonshine victim trial atlas

The production packer packed the four registered victim poses at two pixels per world unit into one temporary PNG page. A static review of the packed crops over parchment and dark slate showed the full cap in every frame and no visible diffuse halo at atlas scale. This trial lives outside the game and has no effect on the shipped atlas. Next finish the holder forearm edges and registration, then pack both roles together and verify the impact and held-loop return in both Dojo facings.

#### Moonshine holder trial atlas

The temporary Pack 02 atlas now contains six holder and four victim frames. Each new holder frame uses the measured boot baseline and preserves the shipped grip offset of 10.32 forward and 50.29 up. At two pixels per world unit, the packed holder crops showed no obvious colored halo on parchment or dark slate. The source sheet still shows fringe at full size. The gameplay atlas has not been rebuilt. Next integrate the trial frames and check contact timing, actual boot drift and grip continuity through both facings in the Dojo.

#### Moonshine pummel gameplay verification

Pack 02 revision 68 includes six holder poses and four victim reactions for Moonshine. The atlas built with four pages. Quarter-speed mirror replays passed in both facings. All ten poses appeared, the victim reacted on the hit tick, and horizontal grip error stayed under 0.15 world units through the return to hold. Both sprites stayed visible and no browser errors were recorded. Boot drift, expression continuity and mixed-size pairings remain open for gameplay-speed review. Next expand Mr. Wrong's paired pummel.

#### Mr. Wrong pummel contact study

The contact candidate uses the shipped hold drawing as its costume and stance reference. The raised teal grip stays beside the cream ruff while the other tentacle sweeps across the torso below it. The striped cap, lavender hair, dotted yellow sleeves, patched pink shorts and planted tentacle feet remain recognizable. No obvious halo appeared in the source preview. This is source art. Verify the grip and foot anchors at atlas scale and use the pose as the reference for the remaining holder drawings. Four victim reactions, atlas integration and both-facing Dojo replay remain open.

#### Mr. Wrong contact registration

The shipped hold source is 988 × 1591 and the contact candidate is 989 × 1591. At alpha 128 the lowest silhouette pixel moves from y=1464 to y=1466. The shipped hold frame sourced from hold-pose-0 places its grip 6.2725 world units forward and 44.586 above the root. Using source grip (615, 612) and baseline y=1465, the candidate matches those offsets at scale 0.0522696 with source root (494.994, 1465). Its alpha-128 crop is (35, 13, 915, 1454), giving crop-relative grip (580, 599) and root (459.994, 1452).

Use this registration as the contact reference for the holder transitions. It is a static measurement. Review the packed edge and verify foot placement in motion once the other poses are ready.

#### Mr. Wrong holder transitions

The holder sheet supplies anticipation, windup, follow-through and recoil, in reading order. The shipped hold and registered contact bring the sequence to six source drawings. The raised grip and foot stance stay visually consistent across the sheet. Small colored edge pixels are visible in the full-size preview, particularly around the sleeves and hair. Inspect the cropped frames at atlas scale on light and dark backgrounds before integration. Next draw the four victim reactions from the shipped held posture, then pack and verify both roles together.

#### Mr. Wrong victim pummel study

Four source candidates preserve the shipped costume. The final cell still reads startled, so review the held-loop handoff before choosing the playback order. Colored pixels near the legs and hair warrant a packed edge check. Atlas integration and both-facing replay remain open.

#### Mr. Wrong pummel frame registration

Measured alpha-128 crops for the five new holder frames and four victim reactions. The holder frames use the shipped hold-pose-0 grip offset. The reactions use the shipped hold-pose-3 chest rail. Each drawing has a crop-relative root and sockets, with scale derived from the visible foot baseline. The grip and chest points were placed by visual inspection. The workspace registration file is work/mr-wrong-pummel-registration.json. Next run a packed edge review and verify the registered poses together in the Dojo. The shipped atlas has yet to be updated.

#### Mr. Wrong pummel trial atlas

The production packer packed all six holder frames and four victim frames into a temporary PNG page at two pixels per world unit. Static inspection over parchment and dark slate showed intact silhouettes and no obvious diffuse halo. The late recovery still reads startled in the packed crop. Check its handoff into the shipped held loop at gameplay speed. The trial uses PNG output. Pack 03 WebP integration and both-facing Dojo checks remain open.

#### Mr. Wrong pummel gameplay verification

Pack 03 revision 66 packages six holder and four victim poses for Mr. Wrong. The source builder reads the crop registration from concept art and the production WebP atlas stayed at nine pages. Two quarter-speed Dojo mirror replays passed, one facing each way. All ten textures appeared, the first victim reaction coincided with the pummel hit, both fighters returned to hold, and the sampled horizontal grip gap stayed below 0.15 world units. No browser errors occurred. Gameplay-speed review of the startled late recovery and mixed-size pairing checks remain open. Next expand Loopy's paired pummel.

#### Loopy pummel contact study

The source candidate keeps the blank cream jersey with purple trim. The lower fist crosses the waist below the raised grip. Inspect the top antler margin and register the grip and hoof baseline before using this drawing as the reference for holder transitions. Victim reactions, atlas integration and both-facing Dojo checks remain open.

#### Loopy pummel contact registration

Both source PNGs are 928 × 1695. The alpha-128 silhouette starts at y=1 in the contact study and y=2 in the shipped hold. Neither has an alpha-128 pixel on the top row. The contact crop is (24, 1, 817, 1591). Its estimated source grip is (725, 660) and its hoof baseline is y=1590. Scale 0.052638 and crop-relative root (443.057, 1589) reproduce the shipped grip offset of 13.5775 world units forward and 48.953 up. The crop-relative grip is (701, 659).

The one-pixel margin still warrants an atlas-scale antler check. The blank cream jersey and purple trim remain the reference for the holder transitions and victim reactions.

#### Loopy pummel holder transitions

Four source poses add anticipation, windup, follow-through and recoil in reading order. All retain the blank cream jersey and purple trim, with complete antler silhouettes and visually consistent hoof positions. Small colored edge pixels remain visible near the gripping arm and legs at source scale. Check the cropped frames at gameplay texture density before atlas integration. Next draw the four victim reactions from Loopy's shipped held pose.

#### Loopy pummel victim study

Four source candidates preserve the blank cream jersey, purple trim and full antlers. The final cell returns to a wide-eyed expression, so check whether that face matches the shipped held loop or needs a redraw. The generation preview shows a diffuse halo. Inspect the actual PNG over light and dark backgrounds before deciding whether any alpha cleanup is needed. Registration, packing and both-facing Dojo checks remain open.

#### Loopy pummel composite review

Browser composites of the saved holder and victim sheets on parchment and dark slate show no visible diffuse halo at the tested scale. The wide-eyed late recovery matches the expression of the shipped held reference. Keep it for the first paired replay and check whether the brief half-lidded pose before it reads smoothly. Next register the crops and check the packed antler edges and grip alignment in both Dojo facings.

#### Loopy pummel trial atlas

All six holder and four victim frames packed into one temporary page. Static review over parchment and dark slate showed complete antlers and no obvious diffuse halo. Grip and chest rail offsets match the shipped references mathematically. The holder crops are about 168–171 pixels tall, while the victim crops approach 200 pixels versus 168 for the shipped held reference. Matching the rail by changing scale alone would make Loopy grow during the hit. Recheck chest placement at the shipped height before integrating and running both-facing Dojo tests.

The revised trial packs all four victim crops at 168 pixels high, matching Loopy's shipped held frame at two pixels per world unit. Each grip top remains 51.2935 world units above the root and both rail endpoints sample alpha 253 in every packed frame. The rail moves upward in the source drawing to keep both the shipped offset and height. This passes static height and opacity checks. Verify the placement in paired Dojo playback after production integration.

#### Loopy pummel gameplay verification

Pack 03 revision 67 includes six holder poses and four victim reactions for Loopy. Both builders passed and the WebP atlas stayed at nine pages. Quarter-speed mirror replays displayed all ten textures in each facing. The first victim reaction coincided with the hit event. Both fighters returned to hold 20 ticks after impact with zero sampled horizontal grip error and no browser errors. An initial left replay missed the keyboard press. A longer press captured the sequence in both facings. Mixed-size and gameplay-speed visual review remain open. Next expand Mrs. Tasselbottom's paired pummel.

#### Mrs. Tasselbottom pummel contact study

The single contact candidate uses the shipped hold as costume and stance reference. The striking fist crosses under the open grip, with the crown, curls, purple robe, braided trim, tassels and buckled shoes retained. The preview shows a halo. Inspect the saved alpha on light and dark backgrounds and check the grip and foot registration before using this study for the holder transitions. The study is outside the gameplay atlas.

#### Mrs. Tasselbottom contact registration

The saved contact PNG shows no visible diffuse halo in browser composites over parchment and dark slate. Its alpha-128 crop is (282, 19, 998, 920). The shipped hold crop is (284, 20, 996, 919). Both end at the same bottom row. The shipped grip is 31.7335 world units forward and 43.121 above its root. Using estimated source grip (1186, 371) and shoe baseline y=937, the contact crop uses scale 0.0761855, root (487.471, 918), and grip (904, 352) in crop coordinates. This is a static registration. Use it for the holder transitions and confirm the foot and grip placement in paired playback.

#### Mrs. Tasselbottom pummel holder transitions

The four transition drawings add anticipation, windup, follow-through and recoil in reading order. The open hand and shoe stance are visually consistent, and the shipped robe, braid, tassels and crown are retained. Together with the shipped hold and contact study they make six holder source frames. The generation preview shows a halo, so inspect the saved alpha over light and dark before atlas integration. Next draw the four victim reactions from the shipped held pose.

#### Mrs. Tasselbottom pummel victim study

Four reaction drawings use the shipped held sprite as the costume and stance reference. The last two expressions are close, so review the late recovery against the held loop before signoff. Inspect the saved PNG on light and dark backgrounds because the generation preview shows a halo. The source sheet has yet to be registered, packed or tested in the Dojo.

#### Mrs. Tasselbottom pummel trial atlas

The temporary atlas packed six holder and four victim poses onto one page at two pixels per world unit. New crops use the shipped height for each role and preserve the corresponding grip or chest rail offset from the shoe baseline. All authored sockets sampled source artwork at alpha 128 or higher. Packed crops showed intact crowns and shoes and no visible diffuse halo over parchment or dark slate. The final two victim expressions are close and still need a playback check. Next integrate Pack 03 WebP output and verify both Dojo facings.

#### Mrs. Tasselbottom pummel gameplay verification

Pack 03 revision 68 includes six holder and four victim poses for Mrs. Tasselbottom. Both atlas builders passed and the production WebP atlas stayed at nine pages. Both quarter-speed Dojo mirror replays displayed all ten textures. The first victim pose coincided with the hit on tick 49. Both fighters returned to hold on tick 69, with zero sampled horizontal grip gap and no browser errors. This completes the pummel pose targets and both-facing mirror checks for Packs 02 and 03. Next review pummels at gameplay speed in mixed-size pairings before expanding grabs, releases and throws.

### Mixed-size pummel verification and remaining pose count

Six normal-speed Dojo replays passed. Loopy held Mrs. Tasselbottom, Mrs. Tasselbottom held Moonshine, and Hoagie held Mr. Wrong, each in both facings. Every replay showed the pummel, victim reaction and return to hold with visible sprites, zero sampled horizontal grip gap and no browser errors. Normal-speed sampling can skip individual ticks. The earlier quarter-speed mirror checks establish full frame coverage and hit timing for the five newer fighters.

The packed manifests at revisions 20, 68 and 68 were recounted against the paired-action and ledge targets above. Counts are missing distinct atlas entries per clip.

| Fighter | Grabs, release, throws and shared victim clip | Ledge | Total |
| --- | ---: | ---: | ---: |
| All-Rounder | 0 | 0 | 0 |
| Abe Lincoln | 0 | 0 | 0 |
| Swift | 0 | 0 | 0 |
| Moonshine | 25 | 17 | 42 |
| Hoagie | 25 | 17 | 42 |
| Mr. Wrong | 13 | 16 | 29 |
| Loopy | 13 | 16 | 29 |
| Mrs. Tasselbottom | 13 | 16 | 29 |
| Total | 89 | 82 | 171 |

For each Pack 02 fighter, the grab batch needs 3 standing, 3 dash, 3 pivot, 1 release, 3 per directional throw and 3 shared victim poses. Each Pack 03 fighter needs 3 standing, 1 pivot, 2 release, 1 per directional throw and 3 shared victim poses. The release and throw totals count the named base clips. Audit direction-specific victim routes and escape before drawing to confirm the live targets. Combat, defensive and presentation clips outside these two batches still need a fresh count. Next close the 29 standing, dash and pivot grab pose gaps together and verify their acquisition in the Dojo.

### Standing, dash and pivot grab expansion

Pack 03 already has dedicated active reach drawings for all three grabs. Keep those at the contact boundary. The distinct-pose deficits come from duplicated standing startup and recovery slots and one duplicated pivot slot. Mr. Wrong's new source sheet supplies standing anticipation, pre-reach, whiff recovery and pivot recoil. The preview shows colored edge pixels. Inspect the packed crops and verify acquisition and whiff playback before counting these four entries as closed. The other 25 entries in this batch still need art or verified suitable existing poses.

#### Mr. Wrong grab integration

Pack 03 revision 69 adds three distinct standing transitions and one pivot recoil while retaining the existing active reach frames. The packed manifest now has six distinct poses each for standing, dash and pivot grab. Both builders passed and the production atlas stayed at nine pages. Nine browser checks confirmed that the renderer selects the dedicated contact pose at the active boundary for each Pack 03 fighter and grab type. Successful acquisition, missed-grab recovery and edge appearance still need Dojo playback review. This leaves 25 packed pose gaps in the grab batch.

#### Mr. Wrong standing grab Dojo verification

Four quarter-speed keyboard cases passed. The standing grab acquired the partner and entered the paired hold in both facings. The out-of-range grab displayed all six distinct poses and returned to idle in both facings, with no missing artwork or browser errors. The successful grabs showed three sampled approach poses before transitioning to hold. The dedicated dash and pivot contact poses were verified through the renderer separately. Source search found move data and renderer routes for dash and pivot grab but no input path selecting those move IDs in the engine. Live acquisition and whiff checks for those variants remain open. Next expand Loopy and Mrs. Tasselbottom's four missing packed poses each.

#### Pack 03 standing and pivot grab drawings

Revision 70 packs the four new grab transitions each for Loopy and Mrs. Tasselbottom. All three Pack 03 fighters now have six distinct packed poses for each grab variant. Eight quarter-speed standing cases passed across Loopy and Mrs. Tasselbottom in both facings. Successful grabs entered hold, and whiffs displayed all six poses and returned to idle. The cases verified playback and visibility. Detailed visual review of new sprite edges and live dash and pivot acquisition remain open.

Pack 02 accounts for all 18 remaining pose gaps in this batch: Moonshine and Hoagie each need three standing, three dash and three pivot poses, for 18 across those two fighters. The previous batch remainder of 25 was an arithmetic error. The original per-fighter totals sum to 30 standing, dash and pivot deficits.

#### Pack 02 grab pose coverage

Revision 69 fills all 18 packed pose gaps using shipped grab and movement drawings. Both fighters now have six distinct entries per grab type. The moving variants put their dedicated reach in the active slot and mirror the left-facing pivot source to the runtime facing. The four-page atlas built successfully. Eight quarter-speed standing grab checks passed across Moonshine and Hoagie in both directions. Successful grabs entered hold, and whiffs showed all six poses and returned to idle. Normal-speed visual review and live dash and pivot inputs remain open. These sequences are authored in the source manifest. A full concept-to-source rebuild was not tested.

#### Live dash and pivot grab input verification

The input routes already exist in apps/server/src/GameEngine.ts, which also drives the local Dojo. The earlier search covered the engine package and missed the shared simulation in the server app. No input wiring changes were needed. Both focused engine suites passed, with 66 tests total. Four normal-speed Dojo cases used Moonshine against Hoagie. Dash and pivot selected their dedicated move and sprite clips, caught an in-range partner and cleared the move on a whiff. The Dojo harness injected the Grab and direction bits together on one simulation tick. The successful pivot held reverse through startup. This verifies one facing per variant and one pairing. Wider visual review remains open. Next audit the live grab release, escape and throw victim routes before expanding their drawings.

### Live release, escape and throw victim inventory

Passive release and active escape emit different cues from the shared simulation in apps/server/src/GameEngine.ts. Both use the same 12-tick victim animation in idle or airborne states. Pack 02 uses grab_release_victim_preview, with three distinct packed poses per fighter. Pack 03 uses grab_release, with two distinct packed poses per fighter. That leaves eight packed additions across the five fighters. The renderer now uses four slots at three ticks each when the selected clip supplies four frames. Short clips retain their current two-slot playback.

Forward throw uses throw_victim. Back, up and down select their respective victim preview clips when available. Each of those four routes has three distinct packed poses per newer fighter and currently selects only indices 1 and 2. The original trio's six-entry throw_victim sheet is a shared library of four direction-specific entry poses, one down-throw intermediate pose and one shared exit. Its six entries are a roster comparison target for the library, not a six-pose requirement per direction. Confirm which drawings can be shared across directions and define the per-direction playback targets before estimating additional victim art. The previous totals counted base clip names and do not measure live victim coverage.

Next close the eight release pose deficits and verify passive timeout and active escape on the ground and in the air, then tackle the four directional throw routes.

#### Four-pose grab release coverage

Pack 02 revision 70 and Pack 03 revision 71 close all eight release pose deficits by reusing shipped held and recovery drawings. Both atlas builds passed. Ten quarter-speed grounded Dojo checks covered timeout and active escape for all five updated fighters. Each displayed four poses over cue ages 0 through 11. The mash routine stopped on escape so subsequent attacks did not interrupt playback. All 54 grab engine tests passed, including airborne escape and cue aging through landing. The airborne Dojo setup timed out before confirming a grab. Airborne visual playback remains open before directional throw work.

#### Airborne grab release Dojo verification

Ten quarter-speed mirror cases passed across Moonshine, Hoagie, Mr. Wrong, Loopy and Mrs. Tasselbottom. Each fighter completed a passive timeout and an active escape. The harness placed the partner 24 world units above the holder before the active grab. Every victim was airborne at release, landed during the cue, and showed four distinct poses across sampled cue ages 0 through 11. Sprites stayed visible and no browser errors occurred. The cases used right-facing holders. Next review directional throws and their victim poses.

### Directional throw victim playback

Newcomer victim clips with four or more frames and authored durations now follow those durations from the hit event. Existing short clips retain the current release and recovery indices. The release socket rebase still uses the same selected victim frame as the renderer. All nine throw-contact tests and client type checking passed.

Use an 18-tick art window with three beats per direction: release, travel reaction and exit to hitstun. Preserve the existing release drawing at index zero when expanding a route, then sample the grip at the exact throw tick. Choose later drawings by launch direction and check the handoff when hitstun ends early. The next batch should assemble and validate all four routes for one fighter before applying the same timing to the remaining four. No new directional drawings were packed in this pass.

#### Moonshine directional victim pilot

Pack 02 revision 72 uses four distinct shipped drawings per direction, beginning with the existing release pose. The first timing trial only showed two or three frames because the observed Dojo hitstun windows were 12, 14, 10 and 7 ticks for forward, back, up and down. The revised 2 / 2 / 2 / 12 schedule starts the fourth pose at tick six. In four quarter-speed Dojo checks with a right-facing Hoagie, Moonshine displayed all four poses in each direction and returned to idle in the tested setup. There were no missing sprites or browser errors. Both-facing and gameplay-speed grip and launch continuity remain open. Next extend and verify these routes for the four remaining fighters.

#### Directional victim coverage across Packs 02 and 03

Pack 02 revision 73 and Pack 03 revision 72 provide four distinct victim poses per direction for all five newer fighters. The sequences keep each direction's existing release drawing and reuse shipped airborne reaction art with the measured 2 / 2 / 2 / 12 timing. The builds passed at four and nine pages. Sixteen additional quarter-speed Dojo cases passed with Moonshine throwing right-facing. Hoagie, Mr. Wrong, Loopy and Mrs. Tasselbottom each showed all four poses in every direction, stayed visible and returned to idle without browser errors. Together with Moonshine's pilot, all 20 direction and victim combinations passed frame coverage in one holder facing.

Next verify both facings at gameplay speed, with particular attention to release sockets, the mirrored down-throw pose, and launch continuity. Holder throw pose deficits are still open.

#### Gameplay-speed directional throw replay

Forty local Dojo replays covered five newer victims, four directions and both holder facings. All selected the requested throw, displayed visible victim art during the sampled reaction and returned to idle without browser errors. Thirty-nine captures sampled all four textures. Mrs. Tasselbottom's right-facing down throw sampled three because the capture skipped tick six, where the fourth pose begins. The quarter-speed case captured that pose. This replay checked clip selection and visibility. It did not measure the release socket distance or certify visual launch continuity.

The next drawing batch covers 36 holder entries: three per direction for each Pack 02 fighter and one per direction for each Pack 03 fighter. Check release socket alignment and launch continuity alongside the expanded holder sequences.

### Playable checkpoint client gate

The client suite passed all 921 tests after updating the shared fighter picker assertions and the Pack 03 release-contact test to use the current release frame. Fighter comparison cycling now skips the selected fighter. Production build and smoke verification from the proposed commit snapshot remain open.
