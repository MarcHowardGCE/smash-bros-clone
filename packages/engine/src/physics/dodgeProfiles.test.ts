import{it,expect}from'vitest';
import{freshDodgeProfile}from'./dodgeProfiles.js';import{isDamageImmune}from'../hitbox/immunity.js';
// Independently transcribed UFD observations: human-frame inclusive bounds.
const fixtures=[
 {characterId:'all-rounder',spot:[25,20,3,17],forward:[29,4,15],backward:[34,5,16],neutral:[52,3,29],air:[71,77,87,102,116],airWindow:[3,21]},
 {characterId:'abe-lincoln',spot:[28,23,3,18],forward:[32,4,16],backward:[37,5,17],neutral:[46,4,32],air:[66,73,79,91,103],airWindow:[4,22]},
 {characterId:'swift',spot:[23,18,3,14],forward:[26,4,12],backward:[32,4,14],neutral:[38,2,26],air:[54,59,64,70,75],airWindow:[2,19]}
]as const;
for(const f of fixtures){
 for(const kind of['spot','forward','backward','air']as const)it(f.characterId+' fresh '+kind+' matches source and exact immunity edges',()=>{const values=kind==='air'?f.neutral:f[kind],total=values[0],start=kind==='spot'?values[2]:values[1],end=kind==='spot'?values[3]:values[2],state=kind==='air'?'AIR_DODGE':kind==='spot'?'SPOT_DODGE':'ROLL';const context={characterId:f.characterId,dodgeKind:kind,state};expect(freshDodgeProfile(context)).toMatchObject({total,intangibleStart:start,intangibleEnd:end});if(kind==='spot')expect(freshDodgeProfile(context).attackCancel).toBe(f.spot[1]);for(const[frame,immune]of[[start!-2,false],[start!-1,true],[end!-1,true],[end!,false]]as const)expect(isDamageImmune({...context,stateFrame:frame,isInvincible:false})).toBe(immune);});
 for(const[x,y,index]of[[0,1,0],[1,1,1],[-1,1,1],[1,0,2],[-1,0,2],[1,-1,3],[-1,-1,3],[0,-1,4]]as const)it(f.characterId+' air direction '+x+','+y+' matches source',()=>{expect(freshDodgeProfile({characterId:f.characterId,dodgeKind:'air',airDodgeDirection:{x,y}})).toMatchObject({total:f.air[index],intangibleStart:f.airWindow[0],intangibleEnd:f.airWindow[1]});});
}
