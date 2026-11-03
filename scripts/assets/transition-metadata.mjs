export const TRANSITION_CLIPS=["dash_start","turn_stand","turn_run","brake","crouch_enter","crouch_hold","crouch_exit","jump_squat","land_soft","land_heavy","platform_drop","teeter_front","teeter_back","shield_raise","shield_hit","shield_drop","parry","air_dodge_neutral","air_dodge_directional","air_dodge_land","shield_break_launch","shield_break_dizzy","shield_break_recover","grab_dash","grab_pivot"];
export const TRANSITION_LOOPS=["crouch_hold","teeter_front","teeter_back","shield_break_dizzy"];
export function transitionReference(name,frames){
 if(name==='crouch_hold')return Math.max(...frames.map(f=>f.visibleHeight))/.58;
 if(name.startsWith('teeter_'))return Math.max(...frames.map(f=>f.visibleHeight))/.95;
 if(name==='shield_break_dizzy')return Math.max(...frames.map(f=>f.visibleHeight))/.85;
 if(['air_dodge_neutral','air_dodge_directional'].includes(name))return Math.max(...frames.map(f=>f.visibleHeight))/.9;
 if(['dash_start','crouch_enter','jump_squat','platform_drop','shield_break_launch'].includes(name))return frames[0].visibleHeight;
 return frames.at(-1).visibleHeight;
}
export function registerTransitionClip(clip,name,character){
 clip.transitionFamily=true;clip.previewOnly=!['dash_start','jump_squat','shield_raise','air_dodge_neutral'].includes(name);
 clip.durations=name==='dash_start'?[2,2,2,3,3,3]:name==='jump_squat'?[0,1,0,1,0,1]:name==='shield_raise'?Array(6).fill(1):name==='air_dodge_neutral'?[3,3,4,4,4,5]:TRANSITION_LOOPS.includes(name)?Array(4).fill(6):Array(6).fill(3);
 clip.loop=TRANSITION_LOOPS.includes(name);
 if(name==='grab_dash'||name==='grab_pivot'){clip.previewContactIndex=3;clip.phases=['approach','prepare','reach','catch / whiff','retract','recover'];}
 const air=['air_dodge_neutral','air_dodge_directional','shield_break_launch'].includes(name);
 if(name==='turn_stand'&&character.id==='all-rounder')clip.frames=[0,1,3,2,4,5].map(i=>clip.frames[i]);
 for(const[index,f]of clip.frames.entries()){if(name==='grab_pivot'&&index>=2)f.mirrorSource=true;
 f.root[0]=f.rect[2]/2;f.offsetY=character.groundOffset;f.registration='feet-center';f.sockets.floorContact=[f.root[0],f.root[1]];
 if(air){f.root=[f.rect[2]/2,f.rect[3]*.55];f.offsetY=0;f.registration='air-torso';}
 }
}
