import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect,it} from 'vitest';
import {getCharacterStats,MoveId,type PlayerState} from '@smash/shared';
import {getActiveHitboxWorldPos,getMoveDataForCharacter} from '@smash/engine';
const manifest=JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../../public/fighter-art-pack-03-v1/manifest.json'),'utf8'));
for(const id of ['mr-wrong','loopy','mrs-tasselbottom'] as const)for(const side of ['up','down','trip'] as const){
 it(id+' '+side+' get-up contact points overlap authoritative circles on every active tick in both facings',()=>{
  const moveId=side==='up'?MoveId.FLOOR_ATTACK_UP:side==='down'?MoveId.FLOOR_ATTACK_DOWN:MoveId.FLOOR_ATTACK_TRIP;
  const move=getMoveDataForCharacter(id,moveId),clip=manifest.characters[id].clips['floor_attack_'+side];
  expect(clip.activeWindow).toEqual([move.startupFrames,move.startupFrames+move.activeFrames]);
  for(const facing of [1,-1] as const)for(let tick=0;tick<move.activeFrames;tick++){
   const frame=clip.frames[tick<2?3:4],point=frame.sockets.attackContact;
   const player={x:0,y:-getCharacterStats(id).hurtboxRadius,facing,characterId:id,currentMoveId:moveId,state:'ATTACK',isGrounded:true} as PlayerState;
   const circle=getActiveHitboxWorldPos(player,move.hitboxPerActiveFrame[tick]!);
   const x=(point[0]-frame.root[0])*clip.scale*facing,y=(point[1]-frame.root[1])*clip.scale;
   expect(Math.hypot(x-circle.x,y-circle.y)).toBeLessThanOrEqual(circle.radius);
  }
 });
}

for (const id of ['mr-wrong', 'loopy', 'mrs-tasselbottom'] as const) {
 it(id + ' ledge strike overlaps the authoritative circle in both facings', () => {
  const moveId = MoveId.LEDGE_ATTACK;
  const move = getMoveDataForCharacter(id, moveId);
  const clip = manifest.characters[id].clips.ledge_attack;
  const frame = clip.frames[3];
  const point = frame.sockets.attackContact;
  expect(clip.durations.slice(0, 3).reduce((sum: number, ticks: number) => sum + ticks, 0)).toBe(move.startupFrames);
  expect(clip.durations[3]).toBe(move.activeFrames);
  for (const facing of [1, -1] as const) {
   const player = { x: 0, y: 10, facing, characterId: id, currentMoveId: moveId, state: 'LEDGE_ATTACK', isGrounded: false } as PlayerState;
   for (const hitbox of move.hitboxPerActiveFrame) {
    const circle = getActiveHitboxWorldPos(player, hitbox);
    const x = (point[0] - frame.root[0]) * clip.scale * facing;
    const y = (point[1] - frame.root[1]) * clip.scale;
    expect(Math.hypot(x - circle.x, y - circle.y)).toBeLessThanOrEqual(circle.radius);
   }
  }
 });
}
