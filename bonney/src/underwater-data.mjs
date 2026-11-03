// Surface coordinates are shared by level data and artwork: every building roof is playable.
export const REEF_BUILDINGS=[
 {key:'ruin',x:1168,bottom:1088,w:320,h:224,roofInset:.16},
 {key:'wreck',x:2080,bottom:1056,w:320,h:192,roofInset:.18},
 {key:'habitat',x:2944,bottom:1088,w:320,h:224,roofInset:.34},
 {key:'habitat',x:4016,bottom:1088,w:256,h:176,roofInset:.34},
];
export const reefRoof=b=>b.bottom-b.h+b.h*b.roofInset;
export const UNDERWATER_EXIT={level:'next-level',entry:'deep-research-dock',route:'underwater'};
export function fullUnderwaterData(){
 const floor=(x,w,y)=>({x,w,y,h:1152-y,kind:'reef'}),ledge=(x,y,w,kind='reef')=>({x,y,w,h:12,oneWay:true,kind});
 const platforms=[floor(0,640,1056),floor(704,1024,1088),floor(1792,896,1056),floor(2752,1856,1088),
 ledge(240,960,160),ledge(432,864,144),ledge(624,768,160),
 ledge(832,960,144),ledge(1008,848,144),ledge(1184,736,160),ledge(1016,624,144),ledge(1192,512,160),ledge(1016,400,144),ledge(1192,288,160),
 ledge(1920,960,144),ledge(2416,800,144),ledge(2240,688,144),ledge(2416,576,160),
 ledge(2800,976,128,'metal'),ledge(3264,816,144,'metal'),ledge(3088,704,144,'metal'),ledge(3264,592,144,'metal'),ledge(3088,480,144,'metal'),ledge(3264,368,144,'metal'),ledge(3440,256,160,'metal'),
 ledge(3808,896,128,'metal'),ledge(4336,912,128,'metal')];
 for(const b of REEF_BUILDINGS)platforms.push({...ledge(b.x+12,reefRoof(b),b.w-24,'buildingRoof'),building:b.key});
 const crab=(x,y,min,max,shield=false)=>({x,y,min,max,homeX:x,homeY:y,w:20,h:20,hp:shield?3:2,maxHp:shield?3:2,dir:-1,type:shield?'shield':'patrol',skin:'reef',state:'idle',timer:0});
 const floating=(type,x,y)=>({x,y,min:x-28,max:x+28,homeX:x,homeY:y,w:24,h:24,hp:2,maxHp:2,dir:-1,type:type==='jelly'?'jelly':'lookout',skin:type==='jelly'?'reefJelly':'reefSub',state:'idle',timer:0});
 const coins=[[176,1030],[272,934],[464,838],[656,742],[864,934],[1040,822],[1216,710],[1048,598],[1224,486],[1048,374],[1224,262],[1320,262],[1600,1062],[1824,1030],[1952,934],[2144,850],[2448,774],[2272,662],[2448,550],[2624,1030],[2784,1062],[2832,950],[3040,870],[3296,790],[3120,678],[3296,566],[3120,454],[3296,342],[3472,230],[3552,230],[3840,870],[3984,1062],[4128,904],[4368,886],[4448,1062]];
 return {width:4608,height:1152,title:'Coral Current',start:{x:48,y:1028},platforms,pickups:[],
 enemies:[crab(520,1036,480,600),crab(848,940,832,924),crab(1576,1068,1512,1640),crab(2192,1036,2128,2288),crab(2460,780,2420,2512,true),crab(3648,1068,3584,3712),crab(4420,1068,4376,4472,true),floating('jelly',760,822),floating('jelly',1456,622),floating('jelly',2336,716),floating('jelly',3192,518),floating('sub',1672,990),floating('sub',2720,976),floating('sub',3504,744)],
 coinsList:coins.map(([x,y],i)=>({id:'reef-'+i,x,y,w:10,h:12,collected:false})),
 crates:[{x:2472,y:548,w:20,h:28,hp:2,meleeBreakable:true,latch:'reefCache'}],
 switches:[{id:'coralValve',name:'LOWER VALVE',x:1056,y:600,w:24,h:24,power:'none'},
 {id:'ballastValve',name:'UPPER VALVE',x:1232,y:488,w:24,h:24,power:'none'},
 {id:'circuitA',name:'RELAY A',x:3120,y:680,w:24,h:24,power:'none'},
 {id:'circuitB',name:'RELAY B',x:3480,y:232,w:24,h:24,power:'none',requires:'circuitA'}],
 gates:[{x:1856,y:944,w:20,h:112,requires:['coralValve','ballastValve']},{x:3808,y:976,w:20,h:112,requires:['circuitA','circuitB']}],
 treasures:[{id:'coralPearl',name:'Cathedral Pearl',x:1296,y:262,w:14,h:16,collected:false,hidden:true},
 {id:'sunkenChart',name:'Wreck Captain Chart',x:2520,y:550,w:14,h:16,collected:false,hidden:true,requires:'reefCache'},
 {id:'deepPrism',name:'Research Prism',x:3552,y:230,w:14,h:16,collected:false,requires:'circuitB'}],
 food:[{x:1728-32,y:1074,w:14,h:14},{x:1984,y:1042,w:14,h:14},{x:2880,y:1074,w:14,h:14},{x:3936,y:1074,w:14,h:14}],
 checkpoints:[{x:32,y:1056,power:'none'},{x:832,y:1088,power:'none'},{x:1920,y:1056,power:'none'},{x:2816,y:1088,power:'none'},{x:3888,y:1088,power:'none'}],
 movers:[{id:'pressureLift',x:1360,y:688,w:96,h:12,oneWay:true,kind:'reef',baseX:1360,baseY:688,range:176,period:6,requires:'coralValve'},
 {id:'researchLift',x:3552,y:880,w:96,h:12,oneWay:true,kind:'metal',baseX:3552,baseY:880,range:224,period:7,requires:'circuitA'}],
 hazards:[{type:'vent',x:760,y:1032,w:20,h:56,period:4.5,phase:0,shutoffRequires:['coralValve','ballastValve']},{type:'vent',x:2352,y:1000,w:20,h:56,period:4.8,phase:1.7,shutoffRequires:['coralValve','ballastValve']},{type:'vent',x:3376,y:1032,w:20,h:56,period:5,phase:2.8,shutoffRequires:['circuitB']}],
 zones:[{x:0,name:'CORAL LANDING'},{x:768,name:'CORAL CATHEDRAL'},{x:1920,name:'SUNKEN WRECK'},{x:2816,name:'PRESSURE LAB'},{x:3904,name:'DEEP RESEARCH DOCK'}],
 goalX:4496,goalY:1088,checkpoint:32,checkpointIndex:0,checkpointState:{x:32,y:1028,power:'none'},projectiles:[],latches:{},exitDestination:UNDERWATER_EXIT};
}

