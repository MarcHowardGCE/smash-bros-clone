import {getCharacterStats,PHYSICS,type PlayerState} from '@smash/shared';
export function airStats(player:PlayerState) {
 const s=getCharacterStats(player.characterId);
 return {speed:s.airSpeed??5,acceleration:s.airAcceleration??.135,brake:s.airBrake??.05,
 gravity:s.gravity??PHYSICS.GRAVITY,fallSpeed:s.fallSpeed??PHYSICS.TERMINAL_VELOCITY,
 fastFallSpeed:s.fastFallSpeed??28.8,doubleJumpVelocity:s.doubleJumpVelocity??PHYSICS.DOUBLE_JUMP_VELOCITY};
}
