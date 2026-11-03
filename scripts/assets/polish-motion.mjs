export function resolveDodge(direction,facing,directions){
 const d=directions[direction];if(!d||![1,-1].includes(facing))throw Error("Invalid dodge direction/facing");const[x,y]=d.vector,back=x*facing<0;
 return {clip:x===0?(y<0?"air_dodge_up":"air_dodge_down"):y===0?(back?"air_dodge_back":"air_dodge_side"):y<0?(back?"air_dodge_up_back":"air_dodge_up_diagonal"):(back?"air_dodge_down_back":"air_dodge_down_diagonal"),vector:[x,y],facing};
}
export function torsoPoint(clip,index){const f=clip.frames[index],s=f.sockets?.torso??[f.rect[2]/2,f.rect[3]*.55];return [(s[0]-f.root[0])*clip.scale,(s[1]-f.root[1])*clip.scale+(f.offsetY??0)];}
export function reviewOrigin(c,p,o){
 const {base,ground,zoom,facing,takeoff,dir,upDuration}=o,clip=c.clips[p.clip],canonical=[base,ground-c.groundOffset*zoom],tp=torsoPoint(clip,p.index),floorTorso=(name,index=0)=>{const a=torsoPoint(c.clips[name],index);return [base+a[0]*zoom*facing,canonical[1]+a[1]*zoom];},mix=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));let target;
 if(p.mode==="flight"){
 const sign=takeoff==="takeoff_backward"?-1:takeoff==="takeoff_forward"?1:0,travel=sign*facing*70*Math.min(1,p.tick/132);
 if(p.tick<8||p.clip==="land_soft")return [canonical[0]+travel,canonical[1]];
 const a=floorTorso(takeoff,2),b=floorTorso("land_soft"),u=(p.tick-8)/124,t=p.tick;
 const lift=t<24?65*(t-8)/16:t<60?65+100*(t-24)/36:t<96?165+8*Math.sin((t-60)/36*Math.PI):165*(132-t)/36;
 target=[mix(a[0],b[0],u)+travel,mix(a[1],b[1],u)-lift];
 }else if(p.mode==="recovery"&&p.clip!=="helpless_land"){
 const t=p.tick,u=upDuration,end=floorTorso("helpless_land")[1];target=[base,t<u?mix(340,240,t/u):t<u+24?mix(240,260,(t-u)/24):mix(260,end,(t-u-24)/36)];
 }else if(p.mode==="double"){const t=p.tick;target=[base,t<18?300+2*t:t<42?mix(336,250,(t-18)/24):mix(250,210,(t-42)/36)];
 }else if(p.mode==="dodge"){const t=p.tick,v=dir.vector,travel=70*Math.min(1,t/24),landing=floorTorso("land_soft")[1];target=[base+v[0]*travel,Math.min(landing,310+v[1]*travel+Math.max(0,t-24)*2)];
 }else if(clip.frames[p.index].offsetY===0)target=[base,310];else return canonical;
 return [target[0]-tp[0]*zoom*facing,target[1]-tp[1]*zoom];
}

