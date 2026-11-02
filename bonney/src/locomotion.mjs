// One complete stride per 42 world pixels; cadence follows actual movement.
export const STRIDE_PIXELS=42;
export function advanceWalkDistance(distance,previousX,player){
 const dx=Math.abs(player.x-previousX);
 const normal=player.grounded&&Math.abs(player.vx)>1&&
  !(player.ability==='active'&&player.power==='pirateCaptain');
 if(!normal||dx>5)return 0; // Never animate a checkpoint teleport as a stride.
 return (distance+dx)%STRIDE_PIXELS;
}
export function characterFrame(player,distance){
 const row=player.hits>=3?0:player.hits===2?1:2;
 const airborne=!player.grounded||(player.ability==='active'&&player.power==='egghead');
 const moving=!airborne&&Math.abs(player.vx)>1;
 return {row,column:airborne?3:moving?Math.floor(distance/7)%6:0,
  source:moving?'walk':'poses',flip:player.facing<0};
}
