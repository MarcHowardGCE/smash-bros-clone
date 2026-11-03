export const ACTION_CLIPS=["dash_attack","hit_high","hit_mid","hit_low","hit_heavy","hit_air","tumble","tumble_recover","jab_lock_up","jab_lock_down","footstool_attacker","footstool_ground_victim","footstool_air_victim","entry","respawn_wait","respawn_drop","taunt_up","taunt_side","taunt_down","victory_1","victory_2","victory_3","defeat","ko_launch","ko_screen","ko_star"];
export const ACTION_FOUR=["hit_high","hit_mid","hit_low","jab_lock_up","jab_lock_down","respawn_wait","defeat","ko_screen","ko_star"];
export function actionReference(name,frames){
 if(name.startsWith('jab_lock_'))return Math.max(...frames.map(f=>f.rect[2]));
 if(name==='tumble'||name==='ko_star')return Math.max(...frames.map(f=>Math.max(f.rect[2],f.rect[3])))/.8;
 if(['hit_air','footstool_attacker','footstool_air_victim'].includes(name))return frames[0].visibleHeight/.9;
 if(name==='tumble_recover')return frames.at(-1).visibleHeight;
 if(name==='hit_low')return Math.max(...frames.map(f=>f.visibleHeight))/.9;
 return frames[0].visibleHeight;
}
export function registerActionClip(clip,name,character,png){
 clip.actionFamily=true;clip.previewOnly=!['hit_mid','tumble'].includes(name);
 clip.durations=Array(clip.frames.length).fill(name==='tumble'?3:name.startsWith('footstool_')?6:name==='respawn_wait'?12:name==='defeat'?8:4);
 if(name==='entry')clip.durations=[6,6,10,10,6,12];
 if(name.startsWith('taunt_'))clip.durations=[8,8,12,18,8,10];
 if(name.startsWith('victory_'))clip.durations=[8,8,12,24,10,30];
 if(name==='respawn_drop')clip.durations=[4,4,8,8,4,4];
 if(name==='tumble'){clip.rotationPeriod=18;clip.rotationDegrees=[0,60,120,180,240,300];clip.phases=clip.rotationDegrees.map(a=>'rotation '+a);}
 if(name==='tumble'){const base=structuredClone(clip.frames[0]);clip.frames=clip.rotationDegrees.map(a=>({...structuredClone(base),rotation:a*Math.PI/180}));clip.sourceFrameOrder=[0,0,0,0,0,0];}
 clip.loop=['tumble','respawn_wait','defeat'].includes(name);
 if(name==='dash_attack'){clip.previewContactIndex=3;clip.phases=['approach','lower','windup','contact','retract','recover'];}
 if(name.startsWith('footstool_')){clip.previewContactIndex=2;clip.phases=['approach','prepare','head / sole contact','push / squash','bounce / fall','recover'];}
 const air=['hit_air','tumble','tumble_recover','footstool_attacker','footstool_air_victim','ko_launch','ko_screen','ko_star'].includes(name);
 for(const f of clip.frames){
 f.root[0]=f.rect[2]/2;f.offsetY=character.groundOffset;f.registration='feet-center';f.sockets.floorContact=[f.root[0],f.root[1]];
 if(name==='footstool_attacker')f.sockets.footstoolSole=[...f.sockets.supportFoot];
 if(name==='footstool_ground_victim'||name==='footstool_air_victim'){
 let sum=0,weight=0;const [rx,ry,rw,rh]=f.rect;
 for(let y=ry;y<ry+Math.max(6,rh*.07);y++)for(let x=rx;x<rx+rw;x++){const a=png.data[(y*png.width+x)*4+3];if(a>64){sum+=(x-rx)*a;weight+=a;}}
 f.sockets.footstoolHead=[weight?sum/weight:rw/2,3];
 }
 if(air){f.root=[f.rect[2]/2,f.rect[3]*(name==='tumble'?.5:.55)];f.offsetY=0;f.registration='air-torso';}
 }
}
