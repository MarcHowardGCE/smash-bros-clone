
export const FLOOR_CLIPS=['knockdown_up','knockdown_down','prone_up','prone_down','getup_up','getup_down','getup_roll_up','getup_roll_down','floor_attack_up','floor_attack_down','trip_fall','trip_prone','trip_getup','floor_attack_trip','tech_neutral','tech_roll','wall_tech','wall_tech_jump','ceiling_tech','trip_roll'];
export const FLOOR_LOOPS=['prone_up','prone_down','trip_prone'];
export function floorReference(name,frames){
 if(FLOOR_LOOPS.includes(name)||name.startsWith('knockdown_'))return Math.max(...frames.map(f=>f.rect[2]))/(name==='trip_prone'?.75:1);
 if(['wall_tech','wall_tech_jump','ceiling_tech'].includes(name))return Math.max(...frames.map(f=>f.visibleHeight))/.95;
 if(name==='trip_fall')return frames[0].visibleHeight;
 return frames[5].visibleHeight;
}
export function registerFloorClip(clip,name,character){
 const durations=name==='tech_neutral'?[3,4,4,4,5,6]:name==='tech_roll'?[5,5,7,7,8,8]:name.startsWith('knockdown_')?[2,2,2,3,3,6]:FLOOR_LOOPS.includes(name)?[6,6,6,6]:Array(6).fill(4);
 clip.durations=durations;clip.floorFamily=true;clip.previewOnly=!['knockdown_up','prone_up','tech_neutral','tech_roll'].includes(name);
 if(name.startsWith('floor_attack_')){clip.phases=['floor ready','windup','sweep contact','retract','rise','recover'];clip.previewContactIndex=2;}
 for(const[f,i]of clip.frames.map((f,i)=>[f,i])){
 if(name==="getup_roll_down"&&i<2)f.mirrorSource=true;
 f.root[0]=f.rect[2]/2;f.registration='floor-contact';f.offsetY=character.groundOffset;
 f.sockets.floorContact=[f.rect[2]/2,f.root[1]];
 if(['wall_tech','wall_tech_jump','ceiling_tech'].includes(name)){f.root=[f.rect[2]/2,f.rect[3]*.55];f.offsetY=0;f.registration='air-torso';}
 if(name.startsWith('knockdown_')&&i<3)f.offsetY-=[16,10,4][i];
 }
}
