import {BUILDINGS,buildingRoofs,roofHeight} from './remaining-scene.mjs';
const floor=(x,w,y=400)=>({x,y,w,h:80});
const ledge=(x,y,w=64)=>({x,y,w,h:8,oneWay:true});
export function fullLevelData(){
 const platforms=[floor(0,512),floor(544,496),floor(1088,608),floor(1728,448),floor(2224,544),floor(2816,464),
 floor(3328,752),floor(4112,656),floor(4816,464),floor(5328,640),floor(6016,384)];
 for(const [x,y,w]of [[240,368,64],[640,352,80],[960,336,64],[1120,352,80],[1280,320,96],[1440,288,112],
 [1632,320,64],[1856,352,80],[2288,352,64],[2432,304,64],[2608,240,96],[2784,192,80],[2944,144,96],
 [3456,352,80],[3728,320,96],[3872,272,64],[3968,224,96],[4304,352,64],[4480,320,80],
 [4896,352,80],[5120,320,64],[5472,352,80],[5664,304,80],[5856,248,96],[6096,192,96]])
 platforms.push(ledge(x,y,w));
 // A ledge may approach a building, but never cut through its facade.
 for(let i=platforms.length-1;i>=0;i--){
  const s=platforms[i];
  if(s.oneWay&&BUILDINGS.some(b=>s.x<b.x+b.w&&s.x+s.w>b.x&&s.y>b.bottom-b.h&&s.y<b.bottom))platforms.splice(i,1);
 }
 platforms.push({...ledge(4068,268,72),kind:'gateRoof'},{...ledge(6224,268,60),kind:'gateRoof'});
 platforms.push(...buildingRoofs(),ledge(128,352,48),ledge(624,352,56),ledge(1040,352,48),ledge(4384,352,48));
 const power=(x,power,y=376)=>({x,y,w:16,h:16,power,respawnMs:0});
 const enemy=(type,x,y=378,min=x-24,max=x+64)=>({type,x,y,w:16,h:type==='gull'?22:28,hp:type==='gull'?1:type==='lookout'?2:3,dir:-1,min,max,homeX:x,homeY:y,state:'idle',timer:0});
 const enemies=[enemy('patrol',320),enemy('lookout',800),enemy('patrol',1200),enemy('lookout',1496,266,1472,1520),
 enemy('patrol',1920),enemy('lookout',2540),enemy('gull',2880,190),enemy('shield',3490),enemy('gull',3780,280),
 enemy('lookout',4500,298),enemy('shield',4630),enemy('patrol',4960),enemy('gull',5200,270),
 enemy('lookout',5580),enemy('shield',5800),enemy('patrol',6120)];
 for(const e of enemies){
  if(e.type==='gull'){
   platforms.push({...ledge(e.x-8,e.y+e.h,32),kind:'perch'});
   continue;
  }
  const surfaces=platforms.filter(s=>s.kind!=='roof'&&e.x>=s.x&&e.x+e.w<=s.x+s.w);
  const support=surfaces.sort((a,b)=>Math.abs(a.y-e.y-e.h)-Math.abs(b.y-e.y-e.h))[0];
  if(!support)throw new Error('Ground enemy has no supporting platform at '+e.x);
  e.y=support.y-e.h;e.homeY=e.y;
  e.min=Math.max(e.min,support.x);e.max=Math.min(e.max,support.x+support.w-e.w);
 }

 const pickups=[power(112,'pirateCaptain'),power(608,'egghead'),power(1160,'pirateCaptain'),power(1800,'egghead'),
 power(2304,'egghead'),power(3264,'pirateCaptain'),power(3392,'egghead'),power(3696,'pirateCaptain'),
 power(3840,'egghead'),power(4208,'pirateCaptain'),power(4352,'egghead'),power(5376,'pirateCaptain'),
 power(5440,'egghead'),power(5952,'pirateCaptain'),power(6032,'egghead'),power(5912,'pirateCaptain',224)];
 for(let i=pickups.length-1;i>=0;i--)if([1800,4208,4352,5912].includes(pickups[i].x))pickups.splice(i,1);
 for(const p of pickups)if(p.x!==112&&p.x!==608){p.requiresInteract=true;p.restockMs=4000;}
 const coinsList=[];
 for(let x=160;x<6280;x+=48){
  const f=platforms.find(s=>s.h>8&&x>=s.x&&x+10<=s.x+s.w);
  if(f)coinsList.push({id:'coin-'+x,x,y:374,w:10,h:12,collected:false});
 }
 for(const s of platforms.filter(s=>s.oneWay&&s.kind!=='roof'))coinsList.push({id:'roof-'+s.x,x:s.x+s.w/2,y:s.y-22,w:10,h:12,collected:false});
 // Market Quay is authored as a composed slice, not a uniform reward line.
 for(let i=coinsList.length-1;i>=0;i--)if(coinsList[i].x<960)coinsList.splice(i,1);
 for(const [x,y]of [[176,374],[208,356],[240,340],[472,374],[504,354],[536,346],[568,374],[648,330],[676,330],[896,374],[928,374]])
  coinsList.push({id:'market-'+x,x,y,w:10,h:12,collected:false});

 for(let i=coinsList.length-1;i>=0;i--)if(coinsList[i].x>=960&&coinsList[i].x<2176)coinsList.splice(i,1);
 for(const [x,y]of [[1008,314],[1128,374],[1296,352],[1328,330],[1360,308],[1416,298],[1568,264],[1600,292],[1648,298],[1744,374],[1816,352],[1848,330],[2032,374],[2120,374]])
  coinsList.push({id:'warehouse-'+x,x,y,w:10,h:12,collected:false});

 for(let i=coinsList.length-1;i>=0;i--)if(coinsList[i].x>=2176)coinsList.splice(i,1);
 for(const [x,y]of [[2256,374],[2320,330],[2368,302],[2432,282],[2464,282],[2640,218],[2680,218],[2744,170],[2780,170],[2808,170],[3032,122],[3104,374],[3200,374],[3424,330],[3600,374],[3632,350],[3680,298],[3896,250],[3920,238],[3960,202],[4160,374],[4232,352],[4304,330],[4336,330],[4400,374],[4736,374],[4760,354],[4816,354],[4856,374],[5072,374],[5104,298],[5136,298],[5328,374],[5408,350],[5472,330],[5680,282],[5712,282],[5944,226],[5984,354],[6048,170],[6224,374],[6296,374],[6320,354]])
  coinsList.push({id:'district-'+x,x,y,w:10,h:12,collected:false});

 // Lift elevated rewards out of facades onto their corresponding roofs.
 for(const c of coinsList){
  const b=BUILDINGS.find(b=>c.x>=b.x&&c.x+c.w<=b.x+b.w&&c.y<350&&c.y>roofHeight(b,c.x)-22);
  if(b)c.y=roofHeight(b,c.x+c.w/2)-22;
 }
 return {mode:'full',title:'Harbor Breakout',width:6400,height:480,ceiling:0,start:{x:32,y:372},
 platforms,pickups,enemies,coinsList,
 crates:[{x:1392,y:352,w:16,h:48,hp:1,secret:'stashWall'},{x:3648,y:376,w:16,h:24,hp:1,latch:'customsLock'},
 {x:5504,y:376,w:16,h:24,hp:1,latch:'winch'},{x:6080,y:368,w:16,h:32,hp:1,latch:'cabinSeal',requires:'bell'}],
 switches:[{id:'customsLever',x:4000,y:200,w:16,h:24,power:'egghead'},
 {id:'rigging',x:5888,y:224,w:16,h:24,power:'egghead'},{id:'bell',x:6128,y:roofHeight(BUILDINGS.at(-1),6128)-24,w:16,h:24,power:'egghead'}],
 gates:[{x:4112,y:288,w:16,h:112,requires:['customsLock','customsLever']},
 {x:6256,y:288,w:16,h:112,requires:['winch','rigging']}],
 treasures:[{id:'stash',name:"Smuggler's Stash",x:1552,y:376,w:14,h:16,requires:'stashWall'},
 {id:'nest',name:"Crane's Nest",x:2976,y:128,w:14,h:16},
 {id:'cabin',name:"Captain's Cabin",x:6176,y:376,w:14,h:16,requires:'cabinSeal'}],
 food:[{x:2048,y:376,w:14,h:14},{x:4256,y:376,w:14,h:14},{x:5776,y:376,w:14,h:14}],
 checkpoints:[{x:1760,y:400,power:'egghead'},{x:3344,y:400,power:'pirateCaptain'},{x:5344,y:400,power:'pirateCaptain'}],
 movers:[{id:'lift-a',x:2544,y:360,w:64,h:8,oneWay:true,axis:'y',range:120,period:6,baseX:2544,baseY:360,anchorY:198},
 {id:'lift-b',x:2688,y:288,w:64,h:8,oneWay:true,axis:'y',range:144,period:7,baseX:2688,baseY:288,anchorY:132},{id:'boarding-rigging',x:5744,y:336,w:64,h:8,oneWay:true,axis:'y',range:96,period:5,baseX:5744,baseY:336,anchorY:192,requires:'winch'}],
 hazards:[{type:'hook',x:2536,y:270,w:14,h:18,baseX:2536,baseY:270,mountY:216,range:45,period:4},
 {type:'hook',x:2896,y:188,w:14,h:18,baseX:2896,baseY:188,range:36,period:3.5},
 {type:'cargo',x:4928,y:140,w:24,h:24,baseY:140,period:4.2,phase:0},
 {type:'cargo',x:5168,y:140,w:24,h:24,baseY:140,period:4.8,phase:1}],
 zones:[{x:0,name:'MARKET QUAY',theme:'quay'},{x:960,name:'WAREHOUSE ROW',theme:'warehouse'},
 {x:2176,name:'CRANE BASIN',theme:'cranes'},{x:3280,name:'CUSTOMS GATE',theme:'customs'},
 {x:4768,name:'SHIPYARD APPROACH',theme:'shipyard'},{x:5280,name:'FLAGSHIP DECK',theme:'ship'}],
 goalX:6312};
}
