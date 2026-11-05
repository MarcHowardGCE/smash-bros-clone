import {PHYSICS} from '../constants/physics.js';
import type {PlayerState} from '../types/GameState.js';
/** A shield-drop recovery state is not an active shield after its parry opportunity. */
export function isActiveShield(p:PlayerState):boolean {
 if(!(p.isShielding||p.state==='SHIELD')||p.shieldHealth<=0)return false;
 return p.shieldReleaseFrame===undefined||p.shieldParryConsumed===true||
  (p.shieldReleaseEligible===true&&p.shieldReleaseFrame<PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES);
}
