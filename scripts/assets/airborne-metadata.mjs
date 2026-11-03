export const AIRBORNE_CLIPS=["takeoff_neutral","takeoff_forward","takeoff_backward","air_rise_loop","air_apex_loop","air_fall_loop","air_fastfall_loop","double_jump_transition","air_dodge_up","air_dodge_down","air_dodge_side","air_dodge_up_diagonal","air_dodge_down_diagonal","helpless_enter","helpless_loop","helpless_land","jab_2","jab_3","air_dodge_back","air_dodge_up_back","air_dodge_down_back"];
export const AIR_DODGE_DIRECTIONS={
up:{clip:"air_dodge_up",vector:[0,-1],mirror:false},up_right:{clip:"air_dodge_up_diagonal",vector:[1,-1],mirror:false},right:{clip:"air_dodge_side",vector:[1,0],mirror:false},down_right:{clip:"air_dodge_down_diagonal",vector:[1,1],mirror:false},down:{clip:"air_dodge_down",vector:[0,1],mirror:false},down_left:{clip:"air_dodge_down_back",vector:[-1,1],mirror:false},left:{clip:"air_dodge_back",vector:[-1,0],mirror:false},up_left:{clip:"air_dodge_up_back",vector:[-1,-1],mirror:false}
};
export function airborneReference(name,frames){
 if(name.startsWith("jab_"))return frames[0].visibleHeight;
 if(name==="air_apex_loop")return frames[0].visibleHeight/.72;
 return name.startsWith("takeoff_")||name==="helpless_land"?Math.max(...frames.map(f=>f.visibleHeight)):frames[0].visibleHeight/.9;
}
export function registerAirborneClip(clip,name,character){
 clip.airborneFamily=true;clip.previewOnly=true;
 clip.loop=name.endsWith("_loop");clip.durations=Array(6).fill(clip.loop?6:name.startsWith("jab_")?3:4);
 if(name.startsWith("jab_")){clip.previewContactIndex=3;clip.phases=["ready","windup","extend","contact","retract","recover"];}
 if(name==="helpless_land")clip.durations=[3,4,8,8,6,8];
 clip.phases??=Array.from({length:6},(_,i)=>clip.loop?"loop "+(i+1):"transition "+(i+1));
 const jabOffset=clip.frames[0].root[0]-clip.frames[0].sockets.supportFoot[0];
 const grounded=name.startsWith("jab_")||name.startsWith("takeoff_")||name==="helpless_land";
 for(const f of clip.frames){
 f.root=[f.rect[2]/2,grounded?f.root[1]:f.rect[3]*.55];f.offsetY=grounded?character.groundOffset:0;f.registration=grounded?"grounded-center":"air-torso";if(name.startsWith("jab_")){f.root[0]=f.sockets.supportFoot[0]+jabOffset;f.registration="support-foot";}f.sockets.torso=[f.rect[2]/2,f.rect[3]*.55];
 }
 if(name==="jab_3"){clip.sourceFrameOrder=[0,1,4,2,3,5];clip.frames=clip.sourceFrameOrder.map(i=>clip.frames[i]);}
 clip.designOnly=true;
}

