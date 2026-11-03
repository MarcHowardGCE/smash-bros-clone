import fs from 'node:fs';
const edit=(p,a,b)=>{let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');if(!s.includes(a))throw Error('Missing '+p+' '+a);fs.writeFileSync(p,s.replaceAll(a,b));};
edit('src/game.mjs'," for(const item of game.pickups)if(item.respawnMs===0){\n  pickupIcon(item.power,item.x-camera,item.y);\n  if(!inPolishedDistrict(game)||Math.abs(p.x-item.x)<65)text(item.power==='gear'?'GEAR':item.power==='egghead'?'FLY':'DASH',item.x-camera-2,item.y-12,'#fff0ce',6);\n }",` for(const item of game.pickups){
  const near=Math.abs(p.x-item.x)<72&&Math.abs(p.y-item.y)<64;
  if(item.requiresInteract){rect(item.x-camera-3,item.y+20,22,4,'#526876');rect(item.x-camera-1,item.y+20,18,1,item.respawnMs>0?'#9c8ba6':'#9bf0d1');}
  if(item.respawnMs===0){
   pickupIcon(item.power,item.x-camera,item.y);
   const label=item.power==='gear'?'GEAR':item.power==='egghead'?'FLY':'DASH';
   if(!inPolishedDistrict(game)||near)text(item.requiresInteract?(p.power===item.power?'EQUIPPED':'E: '+label):label,item.x-camera-10,item.y-12,'#fff0ce',6);
  }else if(item.requiresInteract&&near)text('REFILL '+Math.ceil(item.respawnMs/1000)+'S',item.x-camera-10,item.y-12,'#b9d4e1',6);
 }
`);
edit('src/game.mjs',"return 'Egghead: reach the upper console and press E.'", "return 'Lift online. Choose Egghead, ride up and press E at the console.'");
edit('src/game.mjs',"return 'Flagship: reach the high rigging switch with Egghead and press E.'", "return 'Rigging is moving. Ride or fly up with Egghead and press E at the switch.'");
let p='src/cloud-art.mjs',s=fs.readFileSync(p,'utf8');const start=s.indexOf(' for(const supply of g.pickups.filter'),end=s.indexOf(' for(const m of g.movers)',start);if(start<0||end<0)throw Error('supply tray block');s=s.slice(0,start)+s.slice(end);s=s.replace("if(s.kind==='hover'){c.fillStyle='#777fa6';c.fillRect(s.x-camera,s.y,s.w,8);c.fillStyle='#cbfaff';c.fillRect(s.x-camera,s.y,s.w,2);c.restore();return;}","if(s.kind==='hover'){c.drawImage(images['reef_catwalk'],s.x-camera,s.y,s.w,14);c.fillStyle=s.powered?'#b4ffdf':'#d7b0e7';c.fillRect(s.x-camera+4,s.y+2,s.w-8,1);c.restore();return;}");s=s.replace(" for(const m of g.movers)cloudPlatform(c,images,m,camera);"," for(const m of g.movers){c.strokeStyle=m.powered?'#91dfed':'#928aad';c.setLineDash([2,4]);c.beginPath();c.moveTo(m.x-camera+m.w/2,m.baseY-m.range);c.lineTo(m.x-camera+m.w/2,m.baseY+8);c.stroke();c.setLineDash([]);cloudPlatform(c,images,m,camera);if(Math.abs(g.player.x-m.x)<130)text(m.powered?'REACTOR LIFT ONLINE':'GEAR: RESTORE REACTOR',m.x-camera-30,m.y-12,'#a677bc');}");fs.writeFileSync(p,s);
edit('src/full-level-art.mjs',"const px=m.x+m.w/2-camera,anchor=m.anchorY||132;chain(c,px,anchor,px,m.y);machinery(c,images,'winch',px-16,anchor-20,32,22);", "const px=m.x+m.w/2-camera,anchor=m.anchorY||132;chain(c,px,anchor,px,m.y);machinery(c,images,'winch',px-16,anchor-20,32,22);\n  if(m.requires){box(c,px-2,anchor-26,4,3,m.powered?'#9bf0d1':'#e5b67a');if(Math.abs(g.player.x-m.x)<128)text(m.powered?'BOARDING RIGGING':'FREE THE WINCH',px-32,m.y-14,'#fff0ce');}");
edit('src/underwater-art.mjs',"c.strokeStyle='#5b8e94';", "c.strokeStyle=m.powered?'#83dfd2':'#5b8e94';");
edit('src/underwater-art.mjs',"c.stroke();c.setLineDash([]);}", "c.stroke();c.setLineDash([]);if(Math.abs(p.x-m.x)<144&&Math.abs(p.y-m.y)<180)text(m.powered?(m.id==='pressureLift'?'PRESSURE LIFT':'RESEARCH LIFT'):(m.id==='pressureLift'?'TURN LOWER VALVE':'POWER RELAY A'),m.x-camera-16,m.y-14,m.powered?'#a5f5d6':'#d7bf92',6);}");
edit('src/underwater-art.mjs',"c.drawImage(images.reef_vent,h.x-camera-4,h.y+h.h-20,28,20);", "c.drawImage(images.reef_vent,h.x-camera-4,h.y+h.h-20,28,20);c.fillStyle=h.disabled?'#8df0bd':'#e3b880';c.fillRect(h.x-camera+8,h.y+h.h-23,4,3);");
edit('src/underwater-art.mjs',"One valve secured. Find the upper pressure valve.", "Pressure lift online. Ride up and turn the upper valve.");
edit('src/underwater-art.mjs',"Relay A powered. Climb to relay B at the top of the lab.", "Research lift online. Climb to relay B at the top of the lab.");
edit('index.html',"A new power-up replaces your current one and is ready immediately.", "A new power-up replaces your current one and is ready immediately. Marked supply trays let you choose with E (controller Y).");
edit('src/remaining-scene.test.mjs',"g.pickups.length,16", "g.pickups.length,12");
