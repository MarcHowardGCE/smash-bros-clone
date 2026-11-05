import{getDamageHurtbox,getHurtbox,getActiveHitboxWorldPos,isDamageImmune,getMoveDataForCharacter}from'@smash/engine';import{isActiveShield,getStageLayout,type StateSnapshot}from'@smash/shared';
export interface CollisionShape{kind:'body'|'immune'|'shield'|'hit'|'contact'|'platform';x:number;y:number;radius?:number;width?:number;height?:number}
/** Uses the actual combat geometry; contact outlines are a frozen pose aid, not a live hitbox. */
export function collisionShapes(snapshot:StateSnapshot):CollisionShape[]{
 const shapes:CollisionShape[]=[];const stage=getStageLayout(snapshot.stageId);
 for(const p of[stage.mainPlatform,...stage.platforms])shapes.push({kind:'platform',x:p.x,y:p.y,width:p.width,height:p.height});
 for(const p of Object.values(snapshot.players)){
  if(p.isKnockedOut||p.stocks<=0)continue;
  const b=getDamageHurtbox(p);shapes.push({kind:isDamageImmune(p)?'immune':'body',x:b.x-b.radius,y:b.top-b.radius,width:b.radius*2,height:b.bottom-b.top+b.radius*2,radius:b.radius});
  if(isActiveShield(p)){const c=getHurtbox(p);shapes.push({kind:'shield',x:c.x,y:c.y,radius:c.radius});}
  let box=p.activeHitbox,kind:'hit'|'contact'='hit';
  if(!box&&p.hitlagFramesRemaining>0&&p.currentMoveId&&(p.state==='ATTACK'||p.state==='AIR_ATTACK')){const move=getMoveDataForCharacter(p.characterId,p.currentMoveId),frame=p.stateFrame-move.startupFrames-(p.chargeFrames??0);box=move.hitboxPerActiveFrame[frame]??null;kind='contact';}
  if(box){const c=getActiveHitboxWorldPos(p,box);shapes.push({kind,x:c.x,y:c.y,radius:c.radius});}
 }return shapes;
}
