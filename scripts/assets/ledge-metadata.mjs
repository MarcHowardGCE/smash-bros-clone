
export const LEDGE_CLIPS=['ledge_catch','ledge_hang','ledge_climb','ledge_roll','ledge_attack','ledge_jump','ledge_drop','ledge_trump'];
export function registerLedgeClip(clip,name,character){
 const times={ledge_catch:[2,2,2,2],ledge_hang:[12,12,12,12],ledge_climb:[6,6,8,8,6,6],ledge_roll:[6,6,8,8,8,9],ledge_attack:[6,6,8,8,16,16],ledge_jump:[2,2,2,2,2,2],ledge_drop:[3,3,3,3],ledge_trump:[3,3,3,3]};
 clip.durations=times[name];clip.ledge=true;
 if(name==='ledge_attack'){clip.moveId='LEDGE_ATTACK';clip.activeWindow=[20,28];clip.phases=['hang','pull up','windup','kick contact','retract','recover'];}
 const id=character.id;
 const hang=id==='swift'?[.61,.10]:[.59,.10];
 const grips={
 ledge_catch:[[.74,.09],[.71,.10],[.69,.09],[.68,.09]],
 ledge_hang:Array(4).fill(hang),
 ledge_climb:[[.61,.13],[.56,.14],[.65,.35],[.63,.40],[.66,.79],[.65,.31]],
 ledge_roll:[[.61,.10],[.63,.13],[.63,.40],[.50,.5],[.67,.80],[.65,.31]],
 ledge_attack:[[.61,.12],[.63,.28],[.73,.5],[.67,.5],[.67,.5],[.65,.31]],
 ledge_jump:[[.61,.14],[.60,.16],[.61,.36],[.65,.35],[.65,.36],[.65,.36]],
 ledge_drop:[[.67,.10],[.67,.11],[.67,.24],[.67,.4]],
 ledge_trump:[[.74,.28],[.73,.29],[.74,.4],[.72,.4]]
 };
 if(id==='abe-lincoln'){grips.ledge_catch=[[.753,.115],[.638,.121],[.662,.072],[.571,.070]];grips.ledge_climb[2]=[.62,.15];grips.ledge_climb[3]=[.70,.52];grips.ledge_jump[0]=[.68,.20];grips.ledge_jump[1]=[.67,.24];}
 if(id==='swift'){grips.ledge_hang=[[.634,.096],[.502,.096],[.638,.073],[.503,.072]];grips.ledge_catch=[[.77,.12],[.69,.13],[.68,.12],[.67,.12]];grips.ledge_climb[2]=[.69,.14];grips.ledge_roll[1]=[.48,.42];grips.ledge_attack[1]=[.63,.13];}
 for(const[f,i]of clip.frames.map((f,i)=>[f,i])){
 const p=grips[name][i],gx=p[0]*f.sourceSize[0]-f.trim[0],gy=p[1]*f.sourceSize[1]-f.trim[1];f.sockets.ledgeGrip=[gx,gy];f.offsetY=0;
 const pinned=name==='ledge_hang'||name==='ledge_catch'||(['ledge_climb','ledge_attack','ledge_jump'].includes(name)&&i<2)||(name==='ledge_roll'&&i===0);
 if(pinned){f.root=[gx+15/clip.scale,gy+10/clip.scale];f.registration='ledge-grip';}
 else if((name==='ledge_climb'&&i<4)){f.root=[gx+15/clip.scale,gy+10/clip.scale];f.registration='ledge-grip';}
 else if(['ledge_climb','ledge_attack','ledge_roll'].includes(name)){
 f.offsetY=-10;f.root[0]=f.rect[2]/2;f.registration='ledge-top';
 }else {f.root=[f.rect[2]/2,f.rect[3]*.55];f.registration='ledge-air';}
 }
}
