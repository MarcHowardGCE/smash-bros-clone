
import{describe,it,expect}from'vitest';import{Texture}from'pixi.js';import{FullBodyPilot}from'./FullBodyPilot.js';
describe('double-jump snapshot cue',()=>{it('survives a skipped trigger, freezes duplicate snapshots and cancels on hit',()=>{const clip={scale:1,frames:Array.from({length:6},(_,i)=>({texture:Texture.EMPTY,root:[i,0],offsetY:0}))};const p=new FullBodyPilot({characters:{'all-rounder':{air_rise_loop:clip,air_fall_loop:clip,double_jump_transition:clip,hit_mid:clip}}});p.update('AIRBORNE',20,null,true,-8,true);p.update('AIRBORNE',2,null,true,-8,false);expect(p.sprite.label).toBe('double_jump_transition');expect(p.sprite.pivot.x).toBe(0);p.update('AIRBORNE',2,null,true,-8,false);expect(p.sprite.pivot.x).toBe(0);p.update('AIRBORNE',8,null,true,-8,false);expect(p.sprite.pivot.x).toBe(3);p.update('HITSTUN',0,null,true,8,false);expect(p.sprite.label).toBe('hit_mid');p.update('AIRBORNE',10,null,true,8,false);expect(p.sprite.label).toBe('air_fall_loop');});});


it('cancels Tasselbottom authored double-jump cue on hit without resuming stale art',()=>{
 const clip={scale:1,durations:[2,2,2,2,2,2],frames:Array.from({length:6},(_,i)=>({texture:Texture.EMPTY,root:[i,0],offsetY:34}))};
 for(const facing of [-1,1] as const){const p=new FullBodyPilot({characters:{'mrs-tasselbottom':{air_rise_loop:clip,air_apex_loop:clip,air_fall_loop:clip,double_jump_transition:clip,hit_mid:clip}}},'mrs-tasselbottom','mrs-tasselbottom');
  const draw=(state:string,age:number,vy:number,available:boolean)=>p.update(state,age,null,true,vy,available,false,1,0,false,1,facing,undefined,null,{isGrounded:false});
  draw('AIRBORNE',20,-8,true);draw('AIRBORNE',2,-8,false);expect(p.sprite.label).toBe('double_jump_transition');expect(p.sprite.pivot.x).toBe(0);
  draw('AIRBORNE',2,-8,false);expect(p.sprite.pivot.x).toBe(0);
  draw('AIRBORNE',8,-8,false);expect(p.sprite.pivot.x).toBe(3);
  draw('HITSTUN',0,8,false);expect(p.sprite.label).toBe('hit_mid');
  draw('AIRBORNE',10,8,false);expect(p.sprite.label).toBe('air_fall_loop');
 }
});
