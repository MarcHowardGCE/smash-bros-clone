import{PHYSICS,PlayerStateEnum,type PlayerState}from'@smash/shared';
/** Custom initial dodge windows; frame values are not certified Ultimate data. */
export function isDamageImmune(p:Pick<PlayerState,'state'|'stateFrame'|'isInvincible'>):boolean{return p.isInvincible||[PlayerStateEnum.ROLL,PlayerStateEnum.SPOT_DODGE,PlayerStateEnum.AIR_DODGE].includes(p.state as PlayerStateEnum)&&p.stateFrame>=PHYSICS.DODGE_INTANGIBILITY_START&&p.stateFrame<PHYSICS.DODGE_INTANGIBILITY_END;}
