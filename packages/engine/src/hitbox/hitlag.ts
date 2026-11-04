/** Reference body-hit formula, participant scaling and normal/electric attributes. */
export function calculateHitlag(damage:number,multiplier=1,players=2,electric=false,crouch=false):number{const scale=[1,.925,.862,.8116,.77464,.752464,.75][Math.max(0,Math.min(6,players-2))]!;return Math.max(0,Math.min(30,Math.floor((damage*.65*scale+6)*(electric?1.5:1)*multiplier*(crouch?.67:1))));}

/** Normal shield freeze. Mirrors calculator shield caller (no participant scaling). Parry remains separate. */
export function calculateShieldHitlag(damage:number,multiplier=1,electric=false,projectile=false,attached=false):{target:number;attacker:number}{
 if(damage<=0)return{target:0,attacker:0};
 const target=calculateHitlag(damage,Math.max(1,multiplier)*.67,2,electric);
 const attacker=projectile&&!attached?0:attached?calculateHitlag(damage,multiplier,2,electric):target;
 return{target,attacker};
}

export function calculateShieldStun(damage:number,multiplier=1,projectile=false,attached=false,smash=false,aerial=false):number{
 if(damage<=0)return 0;
 const factor=projectile&&!attached?(multiplier!==1?multiplier:.29):(aerial?.33:smash?.725:1)*multiplier;
 return Math.max(0,Math.floor(damage*.8*factor+3)-1);
}
/** Calculator reference parry wrappers. Direct melee defaults; specialized interactions remain explicit metadata. */
export function calculateParryHitlag(damage:number,multiplier=1,electric=false,projectile=false,attached=false,direct=true):{target:number;attacker:number}{
 if(damage<=0)return{target:0,attacker:0};
 const base=(damage*.65+6)*(electric?1.5:1),guard=Math.max(1,multiplier)*.67;
 const rawTarget=Math.floor(base*guard+(direct?8:0))-(direct?0:1);
 const attackerMult=projectile&&attached?multiplier:guard;
 const rawAttacker=Math.floor(base*attackerMult+(direct?8:5));
 return{target:Math.max(0,rawTarget>32?33:rawTarget),attacker:projectile&&!attached?0:rawAttacker>32?34:Math.max(0,rawAttacker<=0?0:rawAttacker+3)};
}
