// One complete stride per 42 world pixels; cadence follows actual movement.
export const STRIDE_PIXELS=42;
export function advanceWalkDistance(distance,previousX,player){
 const dx=Math.abs(player.x-previousX);
 const normal=player.grounded&&Math.abs(player.vx)>1&&
  !(player.ability==='active'&&player.power==='pirateCaptain');
 if(!normal||dx>5)return 0; // Never animate a checkpoint teleport as a stride.
 return (distance+dx)%STRIDE_PIXELS;
}
export function characterFrame(player,distance,time=0){
 const row=player.hits>=3?0:player.hits===2?1:2;
 if(player.power==='egghead'&&player.ability==='active'&&!player.grounded)return {row,column:Math.floor(time*8)%4,source:'flight',flip:player.facing<0};
 const airborne=!player.grounded||(player.ability==='active'&&player.power==='egghead');
 const moving=!airborne&&Math.abs(player.vx)>1;
 return {row,column:airborne?3:moving?Math.floor(distance/7)%6:0,
  source:moving?'walk':'poses',flip:player.facing<0};
}

export const characterOutfit=player=>player.power==='gear'?'gear':player.power==='pirateCaptain'?'captain':player.power==='egghead'?'egghead':'default';


export const CHARACTER_ROSTER=[{id:'bonney',name:'Jewelry Bonney'},{id:'luffy',name:'Monkey D. Luffy'}];
// This selects artwork only; character choice is never an input to the simulation.
export function characterSpriteKey(character,player,distance=0){
 const pose=characterFrame(player,distance);
 return (character==='luffy'?'luffy_':'')+characterOutfit(player)+(player.attackMs>0?'Attack':pose.source==='flight'?'Flight':pose.source==='walk'?'Walk':'Atlas');
}
