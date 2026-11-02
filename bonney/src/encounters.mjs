const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const gateClosed=(g,s)=>!s.requires.every(id=>g.latches[id]);
export function respawn(g){
 const p=g.player,cp=g.checkpointState||{x:32,y:372,power:'none'};
 Object.assign(p,{x:cp.x,y:cp.y,vx:0,vy:0,hits:3,power:cp.power,ability:'ready',activeMs:0,cooldownMs:0,grounded:true,invulnerableMs:1500});
 g.status='playing';g.projectiles=[];g.deaths++;
 for(const e of g.enemies){e.x=e.homeX;e.y=e.homeY;e.hp=e.maxHp;e.timer=0;e.state='idle';e.fired=false;}
 g.notice='Checkpoint retry. Treasures and switches kept.';g.noticeMs=4000;
}
export function beforeLevel(g,dt){
 const p=g.player,t=g.time;
 for(const m of g.movers){
  const x=m.x,y=m.y;
  m.y=m.baseY-m.range*(1-Math.cos(t*Math.PI*2/m.period))/2;
  if(p.grounded&&Math.abs(p.y+p.h-y)<1&&p.x+p.w>x&&p.x<x+m.w){p.x+=m.x-x;p.y+=m.y-y;}
 }
 for(const h of g.hazards){
  if(h.type==='hook'){const angle=Math.sin(t*Math.PI*2/h.period)*Math.asin(h.range/140);h.x=h.baseX+Math.sin(angle)*140;h.y=h.baseY-140+Math.cos(angle)*140;}
  else{
   const phase=(t+h.phase)%h.period;h.warning=phase<1.2;h.live=phase>=1.2&&phase<2.2;
   h.y=h.live?Math.min(376,h.baseY+(phase-1.2)*480):h.baseY;
  }
 }
 for(const e of g.enemies){
  if(e.hp<=0||!e.type||e.type==='patrol')continue;
  e.timer+=dt;
  const cx=Math.max(0,Math.min(g.width-384,p.x-104)),cy=Math.max(-38,Math.min(g.height-216,p.y-116));
  const visible=e.x>=cx+4&&e.x+e.w<=cx+380&&e.y>=cy+38&&e.y<=cy+210;
  if(e.type==='lookout'){
   e.dir=p.x<e.x?-1:1;
   if(!visible){e.timer=0;e.fired=false;e.state='idle';continue;}
   e.state=e.timer<.85?'aim':e.timer<1?'fire':'recover';
   if(e.timer>=.85&&!e.fired){e.fired=true;g.projectiles.push({x:e.x+8,y:e.y+9,w:6,h:4,vx:e.dir*125,life:2.4});g.events.push('shot');}
   if(e.timer>2.5){e.timer=0;e.fired=false;}
  }else if(e.type==='shield'){
   if(e.timer<1.3){e.state='guard';e.dir=p.x<e.x?-1:1;}
   else if(e.timer<1.7){e.state='windup';}
   else if(e.timer<2){e.state='lunge';e.x=Math.max(e.min,Math.min(e.max,e.x+e.dir*70*dt));}
   else if(e.timer<3){e.state='recover';}
   else e.timer=0;
  }else if(e.type==='gull'){
   if(!visible&&e.state==='idle'){e.timer=0;continue;}
   if(e.state==='idle'&&e.timer>.7){e.state='warn';e.timer=0;e.targetX=p.x;e.targetY=p.y+8;}
   else if(e.state==='warn'&&e.timer>.7){e.state='dive';e.timer=0;e.fromX=e.x;e.fromY=e.y;}
   else if(e.state==='dive'){
    const a=Math.min(1,e.timer/.65);e.x=e.fromX+(e.targetX-e.fromX)*a;e.y=e.fromY+(e.targetY-e.fromY)*a;
    if(a===1){e.state='return';e.timer=0;e.fromX=e.x;e.fromY=e.y;}
   }else if(e.state==='return'){
    const a=Math.min(1,e.timer/1.3);e.x=e.fromX+(e.homeX-e.fromX)*a;e.y=e.fromY+(e.homeY-e.fromY)*a;
    if(a===1){e.state='idle';e.timer=0;}
   }
  }
 }
 for(const b of g.projectiles){b.x+=b.vx*dt;b.life-=dt;
  if(g.platforms.some(s=>!s.oneWay&&hit(b,s)))b.life=0;}
 g.projectiles=g.projectiles.filter(b=>b.life>0&&Math.abs(b.x-p.x)<500);
}
export function afterLevel(g,dt,input,damage){
 if(g.status!=='playing')return;
 const p=g.player;
 for(const b of g.projectiles)if(hit(p,b)){damage(g);b.life=0;}
 for(const h of g.hazards)if((h.type==='hook'||h.live)&&hit(p,h))damage(g);
 if(g.status!=='playing')return;
 for(const c of g.crates)if(c.hp<=0){if(c.latch)g.latches[c.latch]=true;if(c.secret)g.latches[c.secret]=true;}
 for(const s of g.switches)if(!g.latches[s.id]&&hit(p,s)&&p.power===s.power&&input.interactPressed){
  g.latches[s.id]=true;g.events.push('checkpoint');g.notice='Mechanism secured: '+s.id;g.noticeMs=3500;
 }
 for(const item of g.treasures)if(!item.collected&&(!item.requires||g.latches[item.requires])&&hit(p,item)){
  item.collected=true;g.events.push('pickup');g.notice='Secret found: '+item.name;g.noticeMs=4500;
 }
 for(const f of g.food)if(!f.collected&&p.hits<3&&hit(p,f)){f.collected=true;p.hits++;g.events.push('pickup');}
 for(let i=0;i<g.checkpoints.length;i++){
  const cp=g.checkpoints[i];
  if(p.x>=cp.x&&g.checkpointIndex<i){g.checkpointIndex=i;g.checkpoint=cp.x;
   g.checkpointState={x:cp.x,y:cp.y-28,power:cp.power};g.events.push('checkpoint');
   g.notice='Checkpoint secured. Progress survives defeat.';g.noticeMs=4000;}
 }
 if(p.x>=g.goalX&&!g.gates.some(s=>gateClosed(g,s))){g.status='won';g.events.push('win');}
}
