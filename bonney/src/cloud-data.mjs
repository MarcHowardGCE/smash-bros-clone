export const CLOUD_BUILDINGS=[
 {key:'skyHabitat',x:704,bottom:256,w:256,h:104,roof:[[.02,0],[.98,0]]},
 {key:'skyReactor',x:2080,bottom:320,w:256,h:112,roof:[[.02,0],[.98,0]]},
 {key:'skyObservatory',x:3424,bottom:320,w:256,h:112,roof:[[.02,0],[.98,0]]},
];
export const CLOUD_EXIT={level:'next-level',entry:'sky-observatory',route:'cloud'};
export function fullCloudData(collected=false){
 const island=(x,w,y=320)=>({x,y,w,h:Math.min(64,Math.max(14,w/7)),oneWay:true,kind:'cloud'});
 const ledge=(x,y,w,kind='cloud')=>({x,y,w,h:8,oneWay:true,kind});
 const platforms=[island(0,416,224),ledge(464,192,96),island(608,544,256),island(1200,192),island(1456,288,288),island(1808,152),island(2016,512),island(2592,256),island(2912,384),island(3360,480),
 ledge(320,184,64,'fading'),ledge(1168,240,64,'fading'),ledge(1344,224,80,'fading'),ledge(1744,224,80,'fading'),ledge(1936,248,80),ledge(2496,224,96),ledge(3200,240,80),ledge(3312,208,96)];
 for(const b of CLOUD_BUILDINGS)platforms.push({...ledge(b.x+4,b.bottom-b.h,b.w-8,'skyRoof'),building:b.key});
 const power=(x,y,power,restockMs=8000)=>({x,y,w:16,h:16,power,respawnMs:0,restockMs,requiresInteract:true});
 const robot=(type,x,y,min,max)=>({type,skin:'cloud',x,y,w:type==='lookout'?22:16,h:type==='lookout'?20:28,hp:type==='lookout'?2:3,maxHp:type==='lookout'?2:3,dir:-1,min,max,homeX:x,homeY:y,state:'idle',timer:0});
 return {width:3840,height:480,title:'Skyward Egghead',start:{x:48,y:196},platforms,
 pickups:[{...power(176,176,'gear'),requiresJump:true,requiresInteract:false},power(1504,264,'egghead'),power(2040,296,'gear',4000),power(2400,296,'egghead',4000),power(2976,296,'egghead'),power(3376,296,'gear')],
 enemies:[robot('patrol',864,228,824,936),robot('lookout',1080,194,1060,1112),robot('patrol',1584,260,1552,1624),robot('lookout',1872,244,1840,1912),robot('shield',2180,292,2144,2260),robot('patrol',3168,292,3140,3232),robot('lookout',3056,232,3024,3120),robot('shield',3672,292,3648,3696)],
 coinsList:[[344,158],[240,198],[280,180],[480,166],[512,166],[744,128],[792,128],[1040,230],[1184,214],[1304,294],[1360,198],[1480,262],[1696,262],[1760,198],[1944,222],[2048,294],[2120,182],[2288,182],[2504,198],[2560,198],[2624,294],[2824,248],[2944,294],[3184,294],[3224,214],[3328,182],[3448,182],[3632,294],[3712,294]].map(([x,y],i)=>({id:'sky-'+i,x,y,w:10,h:12,collected:false})),
 crates:[{x:2368,y:292,w:20,h:28,hp:1,latch:'reactorSeal'}],
 switches:[{id:'skyConsole',x:2560,y:200,w:16,h:24,power:'egghead'}],
 gates:[{x:2768,y:208,w:16,h:112,requires:['reactorSeal','skyConsole']}],
 treasures:[{id:'skyChart',name:'Sky Chart',x:944,y:128,w:14,h:16,collected},
 {id:'nimbusCrystal',name:'Nimbus Crystal',x:1368,y:200,w:14,h:16,collected:false},
 {id:'reactorPrism',name:'Reactor Prism',x:2304,y:184,w:14,h:16,requires:'reactorSeal',collected:false}],
 food:[{x:1280,y:306,w:14,h:14},{x:3152,y:306,w:14,h:14}],
 checkpoints:[{x:32,y:224,power:'egghead'},{x:1104,y:256,power:'egghead'},{x:1480,y:288,power:'egghead'},{x:2944,y:320,power:'gear'}],
 movers:[{id:'skyLift',x:2440,y:312,w:64,h:8,oneWay:true,kind:'hover',baseX:2440,baseY:312,range:88,period:5,requires:'reactorSeal'}],
 hazards:[{type:'updraft',x:1388,y:160,w:68,h:160},{type:'updraft',x:3288,y:144,w:72,h:176},
 {type:'beam',x:1648,y:192,w:12,h:96,period:3.8,phase:0},{type:'beam',x:2480,y:256,w:12,h:64,period:4.4,phase:1}],
 zones:[{x:0,name:'CLOUD LANDING'},{x:960,name:'NIMBUS GARDENS'},{x:1920,name:'RESEARCH RING'},{x:2880,name:'OBSERVATORY'}],
 goalX:3744,checkpoint:32,checkpointIndex:0,checkpointState:{x:32,y:196,power:'egghead'},projectiles:[],latches:{},exitDestination:CLOUD_EXIT};
}
