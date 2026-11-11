import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

// Run from the repo root. Movement masters use four columns. Jab and tilt masters use three.
// Loopy production costume: plain cream jersey, purple trim; no numbers or lettering (sprites mirror).
const source = 'concept-art/sprite/pack-03-pilot';
const output = 'apps/client/public/fighter-art-pack-03-v1';
const specs = {
 'mr-wrong': {
  getup:{"up":{"crown":394,"x":[197,546,902,1266,190,532,916,1271,179,null,null,1264],"columnCuts":[[375,735,1105],[],[348,746,1116]],"contact":{"9":[719,929],"10":[780,960]},"columns":4,"rowCuts":[350,716]},"down":{"crown":380,"x":[161,526,908,1274,181,540,911,1283,175,null,null,1260],"columnCuts":[[374,734,1111],[],[357,741,1125]],"contact":{"9":[704,967],"10":[776,925]},"columns":4,"rowCuts":[350,716]},"contact":{"columns":2,"scale":0.32,"crown":0,"x":[360,1080,360,1080],"contact":{"0":[535,240],"1":[900,265],"2":[555,800],"3":[895,815]}}},
  floor:{"columns":4,"crown":50,"x":[205,530,900,1262,186,510,864,1240,167,508,876,1245],"y":[257,266,265,271],"rowCuts":[444,770],"columnCuts":[[355,690,1090],[345,682,1052],[333,695,1055]]},
  damage:{"columns":4,"crown":56,"x":[205,532,914,1283,193,526,929,1266,195,535,905,1263],"y":[null,null,null,null,570,583,555,573,899,905,898,895],"rowCuts":[370,710],"columnCuts":[[],[333,709,1107]]},
  shieldBreak:{"columns":4,"crown":785,"x":[203,562,930,1263,205,545,895,1254,175,540,891,1260],"y":[235,248,214,252],"rowCuts":[366,723]},
  airDefense:{"columns":4,"crown":780,"x":[184,551,922,1257,194,547,884,1248,187,553,893,1260],"y":[227,251,278,258,568,565,585,601],"rowCuts":[369,717],"columnCuts":[[386,731,1086]]},
  defense:{"guard":{"crown":15,"x":[284,751,1232,290,769,1221,283,746,1220]},"evade":{"crown":12,"x":[201,534,931,1284,182,534,919,1285,192,543,904,1282],"y":[null,null,null,206,null,null,null,533,null,null,null,918],"columns":4,"rowCuts":[363,705]}},
  bodyHeight:80,crown:48,gaitCrown:56,transitionCrown:64,idlePelvisY:219,radius:28,
  edgeCrown:565,edgeX:[227,643,1118,1560,222,626,1105,1554],edgePelvisY:[267,250,323,341,null,null,null,null],
  jabs:{crown:59,x:[239,696,1172,230,694,1173,212,655,1154]},
  tilts:{crown:61,x:[183,577,1051,184,606,1067,176,572,1052],rowCuts:[395,813],columnCuts:[[430,880],[430,860],[419,860]]},
  strikes:{compact:{crown:71,x:[252,765,1277,null,null,1277]},raised:{crown:107,x:[309,1065,null]},
   contact:{"s0":[365,224],"s1":[897,224],"s2":[1390,240],"u0":[645,290],"u1":[979,153],"s5":[1375,784]},frames:["s0","s1","s2","u0","u1","s5"]},
  power:{forward:{crown:78,x:[210,638,1108,1532,220,657,1097,1548]},vertical:{crown:96,x:[218,661,null,1549,220,660,1103,1550]},raised:{crown:180,x:[null,1303]},
   contact:{p2:[1241,226],p6:[1233,649],q1:[625,155],q5:[789,700],q6:[970,694],v1:[1176,216]},up:["q1","v1"]},
  aerial:{horizontal:{scale:0.24,x:[271,737,1184,275,705,1175,267,718,1174],y:[216,219,223,560,558,562,934,930,934],contact:{"1":[750,215],"4":[815,533],"7":[609,914]}},
   vertical:{scale:0.2,x:[307,754,1253,299,768,1236],y:[295,286,299,802,829,814],contact:{"1":[699,182],"4":[767,930]}}},
  specials:{offense:{crown:53,x:[278,766,1257,253,766,1234,270,753,1266],y:[224,218,229,546,532,550,908,868,863],contact:{"1":[767,171],"4":[878,504],"7":[755,805]},rowCuts:[341,668]},counter:{crown:56,x:[249,748,1250,246,745,1247,265,769,1257],y:[213,216,215,546,547,546,896,869,null]}},
  transitionX:[172,531,898,1253,173,541,882,1260,178,534,894,1265],
  transitionPelvisY:[null,null,null,null,null,553,558,579,925,916,930,913],
  gaitX:[229,665,1105,1548,226,660,1091,1545],
  support:[[314,419],[674,420],[1173,420],[1600,420],[319,850],[606,847],[1189,849],[1474,835]],
  runTiming:[4,3,4,3],
  primaryX:[182,542,912,1252,178,531,900,1264,170,503,885,1254],
  companionX:[219,659,1103,1554,211,653,1096,1560],
  sockets:{b11:{ledgeGrip:[1319,748]},c4:{grabGrip:[355,624]},c5:{grabGrip:[807,624]},c6:{grabGrip:[1260,768]},c7:{gripTop:[1530,572],gripBottom:[1530,610]}},
 },
 loopy:{
  getup:{"up":{"crown":386,"x":[205,557,917,1270,180,524,914,1285,179,null,null,1261],"columnCuts":[[367,737,1110],[],[362,724,1100]],"contact":{"9":[683,1001],"10":[765,1005]},"columns":4,"rowCuts":[350,716]},"down":{"crown":414,"x":[171,531,899,1260,183,532,938,1269,173,null,null,1258],"columnCuts":[[362,724,1100],[],[355,730,1108]],"contact":{"9":[699,1018],"10":[776,983]},"columns":4,"rowCuts":[350,716]},"contact":{"columns":2,"scale":0.32,"crown":0,"x":[350,1085,350,1085],"contact":{"0":[535,275],"1":[920,275],"2":[520,833],"3":[925,820]}}},
  floor:{"columns":4,"crown":126,"x":[173,523,886,1250,190,521,875,1235,153,491,872,1241],"y":[263,272,271,285],"rowCuts":[444,770],"columnCuts":[[],[330,690,1053],[326,683,1055]]},
  damage:{"columns":4,"crown":78,"x":[205,538,898,1285,186,533,null,1258,190,534,892,1249],"y":[null,null,null,null,572,601,null,573,896,902,898,903],"rowCuts":[368,715],"columnCuts":[[],[332,722,1100]]},
  shieldBreak:{"columns":4,"crown":790,"x":[220,564,903,1230,220,542,871,1224,181,533,883,1236],"y":[233,248,199,241],"rowCuts":[367,719]},
  airDefense:{"columns":4,"crown":794,"x":[192,568,916,1253,191,578,891,1243,187,548,889,1257],"y":[242,262,281,267,575,590,576,599],"rowCuts":[369,716],"columnCuts":[[387,737,1086]]},
  defense:{"guard":{"crown":61,"x":[292,747,1213,280,750,1208,284,746,1201]},"evade":{"crown":66,"x":[199,517,939,1247,228,543,902,1254,200,529,900,1243],"y":[null,null,null,235,null,null,null,557,null,null,null,951],"columns":4}},
  bodyHeight:88,crown:65,gaitCrown:81,transitionCrown:70,idlePelvisY:251,radius:28,
  edgeCrown:589,edgeX:[212,640,1090,1532,217,672,1065,1493],edgePelvisY:[259,264,311,316,null,null,null,null],
  jabs:{crown:68,x:[252,707,1159,252,706,1160,231,680,1154]},
  tilts:{crown:96,x:[190,581,1021,187,584,1021,185,568,1028],columnCuts:[[420,871],[420,841],[415,841]]},
  strikes:{compact:{crown:85,x:[265,760,1275,265,null,1270]},raised:{crown:142,x:[null,1044,null]},
   contact:{"s0":[344,223],"s1":[830,240],"s2":[1351,238],"s3":[365,762],"u1":[975,207],"s5":[1360,808]},frames:["s0","s1","s2","s3","u1","s5"]},
  power:{forward:{crown:90,x:[214,655,1110,1540,223,652,1100,1540]},vertical:{crown:98,x:[225,null,null,1545,225,665,1105,1548]},raised:{crown:171,x:[452,1269]},
   contact:{p2:[1248,225],p6:[1235,646],q5:[782,704],q6:[983,698],v0:[384,303],v1:[1164,236]},up:["v0","v1"]},
  aerial:{horizontal:{scale:0.255,x:[292,737,1191,293,728,1190,292,729,1192],y:[232,235,239,568,564,570,921,921,924],contact:{"1":[749,221],"4":[836,537],"7":[631,884]}},
   vertical:{scale:0.205,x:[293,751,1234,284,753,1237],y:[307,302,317,811,829,826],contact:{"1":[697,194],"4":[740,927]}}},
  specials:{offense:{crown:68,x:[263,766,1252,248,768,1248,263,758,1260],y:[234,230,235,551,541,548,915,856,870],contact:{"1":[772,186],"4":[865,516],"7":[727,807]}},counter:{crown:64,x:[264,756,1240,259,743,1234,293,759,1229],y:[231,231,232,551,552,550,916,873,null]}},
  transitionX:[176,526,902,1240,179,544,885,1244,178,530,896,1254],
  transitionPelvisY:[null,null,null,null,null,566,573,616,950,939,949,941],
  gaitX:[225,654,1102,1546,224,654,1115,1550],
  support:[[300,423],[596,417],[1176,413],[1508,418],[321,853],[603,854],[1215,852],[1475,854]],
  runTiming:[5,3,5,3],
  primaryX:[173,535,897,1261,167,542,904,1260,160,525,891,1264],
  companionX:[205,650,1104,1553,208,645,1080,1550],
  sockets:{b11:{ledgeGrip:[1330,755]},c4:{grabGrip:[367,643]},c5:{grabGrip:[800,650]},c6:{grabGrip:[1263,761]},c7:{gripTop:[1540,620],gripBottom:[1540,654]}},
 },
 'mrs-tasselbottom':{
  getup:{"contact":{"columns":2,"scale":0.32,"crown":0,"x":[380,1080,390,1080],"contact":{"0":[570,240],"1":[890,240],"2":[580,780],"3":[880,770]}},"up":{"crown":392,"x":[198,555,902,1278,182,541,920,1279,184,null,null,1268],"columnCuts":[[374,738,1110],[],[343,740,1100]],"columns":4,"rowCuts":[350,716]},"down":{"crown":399,"x":[177,540,922,1280,187,545,916,1274,185,null,null,1263],"columnCuts":[[376,737,1110],[],[353,740,1098]],"columns":4,"rowCuts":[350,716]}},
  floor:{"columns":4,"crown":49,"x":[188,526,887,1250,173,517,875,1249,173,518,881,1250],"y":[253,264,267,279],"rowCuts":[444,770],"columnCuts":[[355,700,1070],[333,684,1056],[344,700,1060]]},
  damage:{"columns":4,"crown":61,"x":[183,543,897,1281,163,513,885,1242,172,518,897,1254],"y":[null,null,null,null,570,568,541,567,905,900,899,903],"rowCuts":[362,722],"columnCuts":[[],[333,689,1079],[345,708,1082]],"mirror":[6]},
  shieldBreak:{"columns":4,"crown":774,"x":[184,526,903,1252,190,551,909,1256,188,533,906,1255],"y":[226,239,222,229],"rowCuts":[364,722]},
  airDefense:{"columns":4,"crown":774,"x":[174,554,895,1256,156,531,889,1251,173,532,897,1262],"y":[226,243,276,251,589,574,584,592],"rowCuts":[362,717],"rowCutsByColumn":{"2":[400,717]},"columnCuts":[[380,730,1086],[371,727,1075]]},
  defense:{"guard":{"crown":15,"x":[210,620,1035,212,628,1032,206,620,1037]},"evade":{"crown":20,"x":[198,520,892,1248,185,536,885,1247,186,526,900,1246],"y":[null,null,null,224,null,null,null,538,null,null,null,920],"columns":4}},
  bodyHeight:73.6,crown:37,gaitCrown:41,transitionCrown:50,idlePelvisY:234,radius:34,
  edgeCrown:551,edgeX:[205,645,1078,1530,215,664,1085,1510],edgePelvisY:[263,260,343,350,null,null,null,null],
  jabs:{crown:52,x:[198,618,1071,207,627,1074,199,615,1074]},
  tilts:{crown:50,x:[166,567,1018,168,571,1029,170,568,1038],columnCuts:[[400,849],[415,829],[375,842]]},
  strikes:{compact:{crown:56,x:[244,758,1270,244,null,1270]},raised:{crown:74,x:[null,1018,null]},
   contact:{"s0":[370,192],"s1":[888,215],"s2":[1400,207],"s3":[400,728],"u1":[958,120],"s5":[1404,751]},frames:["s0","s1","s2","s3","u1","s5"]},
  power:{forward:{crown:54,x:[206,653,1112,1548,225,660,1110,1546]},vertical:{crown:50,x:[222,null,1130,1551,222,661,1108,1555]},raised:{crown:110,x:[null,1297]},
   contact:{p2:[1274,183],p6:[1262,619],q2:[1193,48],q5:[786,674],q6:[985,669],v1:[1190,145]},up:["v1","q2"]},
  aerial:{horizontal:{scale:0.22,x:[275,713,1155,264,708,1157,274,709,1158],y:[215,220,220,570,566,570,923,908,923],contact:{"1":[722,192],"4":[850,538],"7":[572,870]}},
   vertical:{scale:0.18,x:[276,771,1241,276,751,1245],y:[281,251,278,807,846,816],contact:{"1":[843,125],"4":[751,953]}}},
  specials:{offense:{crown:44,x:[258,765,1257,265,757,1254,261,746,1250],y:[201,194,201,523,515,527,876,829,821],contact:{"1":[767,130],"4":[845,468],"7":[747,765]},rowCuts:[341,661]},counter:{crown:62,x:[216,632,1048,219,629,1047,229,620,1044],y:[237,240,245,649,652,649,1070,1046,null]}},
  transitionX:[166,528,903,1262,171,532,883,1264,170,528,902,1258],
  transitionPelvisY:[null,null,null,null,null,565,561,595,934,921,934,926],
  gaitX:[225,657,1090,1548,223,650,1087,1546],
  support:[[134,425],[672,423],[1009,425],[1505,423],[374,865],[633,866],[1252,865],[1522,866]],
  runTiming:[6,4,6,4],
  primaryX:[174,528,886,1262,173,530,891,1274,177,520,895,1257],
  companionX:[220,649,1093,1553,208,654,1087,1557],
  sockets:{b11:{ledgeGrip:[1335,738]},c4:{grabGrip:[356,586]},c5:{grabGrip:[798,588]},c6:{grabGrip:[1274,744]},c7:{gripTop:[1537,598],gripBottom:[1537,637]}},
 },
};

function cell(png,index,rows,layout) {
 const columns=layout?.columns??(layout?3:4),column=index%columns,row=Math.floor(index/columns);
 const rowCuts=layout?.rowCutsByColumn?.[column]??layout?.rowCuts??[];
 const columnCuts=layout?.columnCuts?.[row]??[];
 const left=columnCuts[column-1]??Math.floor(column*png.width/columns);
 const right=columnCuts[column]??Math.floor((column+1)*png.width/columns);
 const top=rowCuts[row-1]??Math.floor(row*png.height/rows);
 const bottom=rowCuts[row]??Math.floor((row+1)*png.height/rows);
 let minX=right,minY=bottom,maxX=-1,maxY=-1,transparent=0;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
  const alpha=png.data[(y*png.width+x)*4+3];
  if(alpha<16) transparent++;
  if(alpha<200) continue;
  minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y);
 }
 if(transparent < (right-left)*(bottom-top)*0.12 || maxX<0) throw Error('Missing isolated transparent sprite in cell '+index);
 return {x:Math.max(left,minX-2),y:Math.max(top,minY-2),right:Math.min(right,maxX+3),bottom:Math.min(bottom,maxY+3),sole:maxY+1};
}

function sample(png,box,scale) {
 const width=Math.ceil((box.right-box.x)*scale),height=Math.ceil((box.bottom-box.y)*scale);
 const out=new PNG({width,height});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sx=(x+.5)/scale-.5,sy=(y+.5)/scale-.5,ix=Math.floor(sx),iy=Math.floor(sy);
  const fx=sx-ix,fy=sy-iy;
  let alpha=0,r=0,g=0,b=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const px=box.x+ix+dx,py=box.y+iy+dy;
   if(px<box.x||py<box.y||px>=box.right||py>=box.bottom) continue;
   const offset=(py*png.width+px)*4;
   const weight=(dx?fx:1-fx)*(dy?fy:1-fy)*png.data[offset+3];
   alpha+=weight;
   r+=png.data[offset]*weight;g+=png.data[offset+1]*weight;b+=png.data[offset+2]*weight;
  }
  const i=(y*width+x)*4;
  out.data[i+3]=Math.round(alpha);
  if(alpha>0){out.data[i]=Math.round(r/alpha);out.data[i+1]=Math.round(g/alpha);out.data[i+2]=Math.round(b/alpha);}
 }
 return out;
}
const load=file=>PNG.sync.read(fs.readFileSync(path.join(source,file)));
const round=value=>Math.round(value*1000)/1000;
// Source coordinates register each pose to its body, independent of extended hands.
const techLayouts = {
 'mr-wrong': {columns:3,rowCuts:[375,704,1048],x:[199,546,903,179,549,903,164,507,887,164,490,886],y:[null,null,null,null,null,null,994,985,989,1376,1340,1312]},
 loopy: {columns:3,rowCuts:[308,584,876],x:[211,640,1103,233,652,1104,180,624,1076,194,637,1073],y:[null,null,null,null,null,null,824,824,824,1115,1105,1070]},
 'mrs-tasselbottom': {columns:3,rowCuts:[296,532,790],x:[264,702,1145,286,718,1152,240,700,1138,245,691,1132],y:[null,null,null,null,null,null,739,739,739,1032,1005,993]},
};

const tripLayouts = {
 'mr-wrong': {columns:3,rowCuts:[385,765,1060],x:[172,532,897,162,529,null,181,545,906,182,544,907]},
 loopy: {columns:3,rowCuts:[314,632,900],x:[213,624,1077,195,630,null,218,657,1098,220,657,1100]},
 'mrs-tasselbottom': {columns:3,rowCuts:[286,582,848],x:[242,701,1155,253,705,null,246,711,1170,242,719,1195]},
};

const ceilingLayouts = {
 'mr-wrong': {columns:3,x:[349,1056,1765]},
 loopy: {columns:3,x:[308,1060,1815]},
 'mrs-tasselbottom': {columns:3,x:[371,1085,1790]},
};

const grabReachLayouts = {
 'mr-wrong': {columns:3,rows:1,scale:0.26,x:[293,1020,1760]},
 loopy: {columns:3,rows:2,scale:0.43,x:[265,905,1485]},
 'mrs-tasselbottom': {columns:3,rows:1,scale:0.30,x:[300,1075,1840]},
};

const grappleLayouts = {
 'mr-wrong': {
  holder:{columns:2,x:[477,1563],sockets:[{grabGrip:[790,302]},{grabGrip:[1876,302]}]},
  held:{columns:3,x:[348,1093,1740],sockets:[{gripTop:[400,334],gripBottom:[400,397]},{gripTop:[1145,334],gripBottom:[1145,397]}]},
 },
 loopy: {
  holder:{columns:2,x:[466,1566],sockets:[{grabGrip:[720,338]},{grabGrip:[1820,338]}]},
  held:{columns:3,x:[352,1070,1770],sockets:[{gripTop:[375,338],gripBottom:[375,420]},{gripTop:[1100,365],gripBottom:[1100,445]}]},
 },
 'mrs-tasselbottom': {
  holder:{columns:2,x:[457,1543],sockets:[{grabGrip:[761,307]},{grabGrip:[1847,307]}]},
  held:{columns:3,x:[356,1075,1765],sockets:[{gripTop:[433,337],gripBottom:[433,425]},{gripTop:[1136,337],gripBottom:[1136,425]}]},
 },
};

const throwLayouts = {
 'mr-wrong': {
  thrower:{columns:2,rowCuts:[345],scale:0.50,x:[502,1620,523,1607],points:[[655,146],[1480,199],[624,392],[1598,674]]},
  victim:{columns:2,rowCuts:[354],scale:0.35,x:[451,1327,451,1290],points:[[458,131],[1590,215],[448,555],[1350,805]]},
 },
 loopy: {
  thrower:{columns:2,rowCuts:[620],scale:0.30,x:[240,975,291,846],points:[[475,282],[811,324],[230,736],[1008,1136]]},
  victim:{columns:2,rowCuts:[369],scale:0.39,x:[454,1333,466,1283],points:[[477,173],[1530,230],[481,604],[1380,822]]},
 },
 'mrs-tasselbottom': {
  thrower:{columns:2,rowCuts:[410],scale:0.38,x:[406,1298,412,1303],points:[[575,179],[1135,141],[332,494],[1312,816]]},
  victim:{columns:2,rowCuts:[510],columnCuts:[[600]],scale:0.27,x:[327,967,329,960],points:[[354,250],[1230,305],[356,767],[1010,1020]]},
 },
};

const throwSpacingLayouts = {
 'mr-wrong': {columns:2,scale:0.26,x:[480,1540],points:[[145,275],[1900,540]]},
 loopy: {columns:2,scale:0.30,x:[500,1600],points:[[105,300],[1950,545]]},
 'mrs-tasselbottom': {columns:2,scale:0.26,x:[500,1600],points:[[125,270],[1950,520]]},
};

const throwWindupLayouts = {
 'mr-wrong': {columns:3,columnCuts:[[625,1485]],scale:0.26,x:[285,890,1790],points:[[370,370],[1380,320],[1940,307]]},
 loopy: {columns:3,columnCuts:[[625,1485]],scale:0.29,x:[292,920,1740],points:[[433,400],[1370,393],[2020,310]]},
 'mrs-tasselbottom': {columns:3,columnCuts:[[625,1485]],scale:0.26,x:[280,925,null],points:[[470,375],[1398,315]]},
};

const footstoolLayouts = {
 'mr-wrong': {columns:3,scale:0.28,x:[315,1045,1760],sockets:[{footstoolSole:[253,670]},{footstoolHead:[934,113]},{footstoolHead:[1748,49]}]},
 loopy: {columns:3,scale:0.31,x:[330,1075,1830],sockets:[{footstoolSole:[277,671]},{footstoolHead:[1122,140]},{footstoolHead:[1917,124]}]},
 'mrs-tasselbottom': {columns:3,scale:0.25,x:[338,1065,1705],sockets:[{footstoolSole:[260,686]},{footstoolHead:[1074,130]},{footstoolHead:[1782,22]}]},
};

const ledgeHangLayouts = {
 'mr-wrong': {columns:2,scale:0.29,x:[460,1620],sockets:[{ledgeGrip:[848,66]},{ledgeGrip:[1918,66]}]},
 loopy: {columns:2,scale:0.32,x:[474,1540],sockets:[{ledgeGrip:[803,131]},{ledgeGrip:[1824,132]}]},
 'mrs-tasselbottom': {columns:2,scale:0.26,x:[505,1532],sockets:[{ledgeGrip:[837,86]},{ledgeGrip:[1814,86]}]},
};

const ledgeGetupLayouts = {
 'mr-wrong': {columns:3,scale:0.26,x:[435,1070,1755],sockets:[{ledgeGrip:[677,129]}]},
 loopy: {columns:3,scale:0.30,x:[408,1046,1754],sockets:[{ledgeGrip:[632,158]}]},
 'mrs-tasselbottom': {columns:3,scale:0.24,x:[396,1030,1740],sockets:[{ledgeGrip:[641,130]}]},
};

const ledgeActionLayouts = {
 'mr-wrong': {columns:4,columnCuts:[[607,1129,1538]],scale:0.29,x:[299,822,1320,1840],contact:{0:[540,382]}},
 loopy: {columns:4,columnCuts:[[590,1086,1580]],scale:0.33,x:[299,805,1340,1844],contact:{0:[514,424]}},
 'mrs-tasselbottom': {columns:4,columnCuts:[[605,1086,1547]],scale:0.27,x:[296,816,1294,1845],contact:{0:[535,340]}},
};

const presentationLayouts = {
 'mr-wrong': {columns:4,columnCuts:[[610,1090,1625]],scale:0.28,x:[276,864,1360,1878]},
 loopy: {columns:4,columnCuts:[[620,1090,1630]],scale:0.31,x:[255,854,1384,1850]},
 'mrs-tasselbottom': {columns:4,columnCuts:[[570,1050,1650]],scale:0.27,x:[282,814,1348,1900]},
};

function build(id,spec) {
 const taunts=load(id+'-taunt-transitions.png');
 const finale=load(id+'-finale.png');
 const presentation=load(id+'-presentation.png'),presentationLayout=presentationLayouts[id];
 const ledgeActions=load(id+'-ledge-actions.png'),ledgeActionLayout=ledgeActionLayouts[id];
 const ledgeGetup=load(id+'-ledge-getups.png'),ledgeGetupLayout=ledgeGetupLayouts[id];
 const ledgeHang=load(id+'-ledge-hang.png'),ledgeHangLayout=ledgeHangLayouts[id];
 const footstool=load(id+'-footstool.png'),footstoolLayout=footstoolLayouts[id];
 const throwWindup=load(id+'-throw-windup.png'),windupLayout=throwWindupLayouts[id];
 const throwSpacing=load(id+'-throw-spacing.png'),spacingLayout=throwSpacingLayouts[id];
 const thrower=load(id+'-throw-thrower.png'),throwVictim=load(id+'-throw-victim.png');
 const throwLayout=throwLayouts[id];
 const holder=load(id+'-holder.png'),held=load(id+'-held.png');
 const grapple=grappleLayouts[id];
 const grabReach=load(id+'-grab-reach.png'),grabReachLayout=grabReachLayouts[id];
 const ceiling=load(id+'-ceiling-tech.png'),ceilingLayout=ceilingLayouts[id];
 const trip=load(id+'-trip-lock.png'),tripLayout=tripLayouts[id];
 const tech=load(id+'-tech.png'),techLayout=techLayouts[id];
 const primary=load(id+'-movement.png'),companion=load(id+'-contact.png'),gait=load(id+'-gait.png');
 const transitions=load(id+'-transitions.png'),edges=load(id+'-edges.png');
 const jabs=load(id+'-jabs.png'),tilts=load(id+'-tilts.png');
 const compact=load(id+'-compact-strikes.png'),raised=load(id+'-raised-strikes.png');
 const powerForward=load(id+'-dash-smash-forward.png'),powerVertical=load(id+'-smash-up-down.png');
 const powerRaised=load(id+'-smash-raised.png'),raisedLayout={columns:2};
 const aerialHorizontal=load(id+'-aerial-horizontal.png'),aerialVertical=load(id+'-aerial-vertical.png');
 const specialOffense=load(id+'-special-offense.png'),specialCounter=load(id+'-special-counter-recovery.png');
 const guard=load(id+'-defense-guard.png'),evade=load(id+'-defense-evade.png');
 const airDefense=load(id+'-air-dodge-land.png');
 const shieldBreak=load(id+'-shield-break.png');
 const damage=load(id+'-hit-launch-tumble.png');
 const floor=load(id+'-tumble-recovery-knockdowns.png');
 const getupUp=load(id+'-getup-up.png'),getupDown=load(id+'-getup-down.png');
 const getupContact=spec.getup.contact&&load(id+'-getup-contacts.png');
 const sheets=[
  {prefix:'gu',png:getupUp,rows:3,x:spec.getup.up.x,layout:spec.getup.up},
  {prefix:'gd',png:getupDown,rows:3,x:spec.getup.down.x,layout:spec.getup.down},
  {prefix:'fl',png:floor,rows:3,x:spec.floor.x,layout:spec.floor},
  {prefix:'hd',png:damage,rows:3,x:spec.damage.x,layout:spec.damage},
  {prefix:'sb',png:shieldBreak,rows:3,x:spec.shieldBreak.x,layout:spec.shieldBreak},
  {prefix:'ad',png:airDefense,rows:3,x:spec.airDefense.x,layout:spec.airDefense},
  {prefix:'z',png:guard,rows:3,x:spec.defense.guard.x,layout:spec.defense.guard},
  {prefix:'w',png:evade,rows:3,x:spec.defense.evade.x,layout:spec.defense.evade},
  {prefix:'b',png:primary,rows:3,x:spec.primaryX},
  {prefix:'c',png:companion,rows:2,x:spec.companionX},
  {prefix:'g',png:gait,rows:2,x:spec.gaitX},
  {prefix:'t',png:transitions,rows:3,x:spec.transitionX},
  {prefix:'e',png:edges,rows:2,x:spec.edgeX},
  {prefix:'j',png:jabs,rows:3,x:spec.jabs.x,layout:spec.jabs},
  {prefix:'k',png:tilts,rows:3,x:spec.tilts.x,layout:spec.tilts},
  {prefix:'s',png:compact,rows:2,x:spec.strikes.compact.x,layout:spec.strikes.compact},
  {prefix:'u',png:raised,rows:1,x:spec.strikes.raised.x,layout:spec.strikes.raised},
  {prefix:'p',png:powerForward,rows:2,x:spec.power.forward.x},
  {prefix:'q',png:powerVertical,rows:2,x:spec.power.vertical.x},
  {prefix:'v',png:powerRaised,rows:1,x:spec.power.raised.x,layout:raisedLayout},
  {prefix:'h',png:aerialHorizontal,rows:3,x:spec.aerial.horizontal.x,layout:spec.aerial.horizontal},
  {prefix:'a',png:aerialVertical,rows:2,x:spec.aerial.vertical.x,layout:spec.aerial.vertical},
  {prefix:'o',png:specialOffense,rows:3,x:spec.specials.offense.x,layout:spec.specials.offense},
  {prefix:'r',png:specialCounter,rows:3,x:spec.specials.counter.x,layout:spec.specials.counter},
 ];
 sheets.push(
  {prefix:'gh',png:holder,rows:1,x:grapple.holder.x,layout:grapple.holder},
  {prefix:'gv',png:held,rows:1,x:grapple.held.x,layout:grapple.held},
 );
 sheets.push(
  {prefix:'th',png:thrower,rows:2,x:throwLayout.thrower.x.map((x,i)=>i===2?x:null),layout:throwLayout.thrower},
  {prefix:'tv',png:throwVictim,rows:2,x:throwLayout.victim.x.map((x,i)=>i===3?null:x),layout:throwLayout.victim},
 );
 const tauntRoots={
  'mr-wrong':[258,745,1259,262,752,1262],
  loopy:[287,749,1217,290,750,1222],
  'mrs-tasselbottom':[286,777,1240,286,777,1240],
 };
 sheets.push({prefix:'pt',png:taunts,rows:2,x:tauntRoots[id],layout:{columns:3}});
 sheets.push({prefix:'pf',png:finale,rows:2,x:[210,580,960,1350,200,580,970,1350],layout:{columns:4}});
 sheets.push({prefix:'ps',png:presentation,rows:1,x:presentationLayout.x,layout:presentationLayout});
 sheets.push({prefix:'la',png:ledgeActions,rows:1,x:ledgeActionLayout.x,layout:ledgeActionLayout});
 sheets.push({prefix:'lg',png:ledgeGetup,rows:1,x:ledgeGetupLayout.x,layout:ledgeGetupLayout});
 sheets.push({prefix:'lh',png:ledgeHang,rows:1,x:ledgeHangLayout.x,layout:ledgeHangLayout});
 sheets.push({prefix:'fs',png:footstool,rows:1,x:footstoolLayout.x,layout:footstoolLayout});
 sheets.push({prefix:'tw',png:throwWindup,rows:1,x:windupLayout.x,layout:windupLayout});
 sheets.push({prefix:'ts',png:throwSpacing,rows:1,x:spacingLayout.x,layout:spacingLayout});
 sheets.push({prefix:'gr',png:grabReach,rows:grabReachLayout.rows,x:grabReachLayout.x,layout:grabReachLayout});
 sheets.push({prefix:'ct',png:ceiling,rows:1,x:ceilingLayout.x,layout:ceilingLayout});
 sheets.push({prefix:'tr',png:trip,rows:4,x:tripLayout.x,layout:tripLayout});
 sheets.push({prefix:'tc',png:tech,rows:4,x:techLayout.x,layout:techLayout});
 if(getupContact)sheets.push({prefix:'gc',png:getupContact,rows:2,x:spec.getup.contact.x,layout:spec.getup.contact});
 // Broad translucent mattes flash between poses; normal edge antialiasing stays well below this ratio.
 if(id==='loopy')for(const {prefix,png}of sheets){
  let edge=0,opaque=0;
  for(let i=3;i<png.data.length;i+=4){const alpha=png.data[i];if(alpha>=200)opaque++;else if(alpha>=16)edge++;}
  if(edge>opaque*.25)throw Error('Loopy '+prefix+' has excessive translucent background residue');
 }

 const techGuard=cell(tech,2,4,techLayout);
 const tripRise=cell(trip,4,4,tripLayout);
 const ceilingContact=cell(ceiling,0,1,ceilingLayout);
 const holderBase=cell(holder,0,1,grapple.holder),heldBase=cell(held,0,1,grapple.held);
 const factors={
  ps:presentationLayout.scale,
  pt:presentationLayout.scale*(id==='mrs-tasselbottom'?1.2:id==='loopy'?1.35:1.4),
  pf:presentationLayout.scale*(id==='loopy'?1.35:1.4),
  la:ledgeActionLayout.scale,
  lg:ledgeGetupLayout.scale,
  lh:ledgeHangLayout.scale,
  fs:footstoolLayout.scale,
  tw:windupLayout.scale,
  ts:spacingLayout.scale,
  th:throwLayout.thrower.scale,
  tv:throwLayout.victim.scale,
  gh:1.9*spec.bodyHeight/(holderBase.sole-holderBase.y),
  gv:1.9*spec.bodyHeight/(heldBase.sole-heldBase.y),
  gr:grabReachLayout.scale,
  ct:2*spec.bodyHeight/(ceilingContact.sole-ceilingContact.y),
  tr:1.6*spec.bodyHeight/(tripRise.sole-tripRise.y),
  tc:1.8*spec.bodyHeight/(techGuard.sole-techGuard.y),
  ...(getupContact&&{gc:spec.getup.contact.scale??2*spec.bodyHeight/(cell(getupContact,0,2,spec.getup.contact).sole-spec.getup.contact.crown)}),
  gu:2*spec.bodyHeight/(cell(getupUp,4,3,spec.getup.up).sole-spec.getup.up.crown),
  gd:2*spec.bodyHeight/(cell(getupDown,4,3,spec.getup.down).sole-spec.getup.down.crown),
  fl:2*spec.bodyHeight/(cell(floor,3,3,spec.floor).sole-spec.floor.crown),
  hd:2*spec.bodyHeight/(cell(damage,0,3,spec.damage).sole-spec.damage.crown),
  sb:2*spec.bodyHeight/(cell(shieldBreak,11,3,spec.shieldBreak).sole-spec.shieldBreak.crown),
  ad:2*spec.bodyHeight/(cell(airDefense,11,3,spec.airDefense).sole-spec.airDefense.crown),
  z:2*spec.bodyHeight/(cell(guard,0,3,spec.defense.guard).sole-spec.defense.guard.crown),
  w:2*spec.bodyHeight/(cell(evade,0,3,spec.defense.evade).sole-spec.defense.evade.crown),
  b:2*spec.bodyHeight/(cell(primary,0,3).sole-spec.crown),
  g:2*spec.bodyHeight/(cell(gait,0,2).sole-spec.gaitCrown),
  t:2*spec.bodyHeight/(cell(transitions,2,3).sole-spec.transitionCrown),
  e:2*spec.bodyHeight/(cell(edges,4,2).sole-spec.edgeCrown),
  j:2*spec.bodyHeight/(cell(jabs,0,3,spec.jabs).sole-spec.jabs.crown),
  k:2*spec.bodyHeight/(cell(tilts,0,3,spec.tilts).sole-spec.tilts.crown),
  s:2*spec.bodyHeight/(cell(compact,0,2,spec.strikes.compact).sole-spec.strikes.compact.crown),
  u:2*spec.bodyHeight/(cell(raised,0,1,spec.strikes.raised).sole-spec.strikes.raised.crown),
  p:2*spec.bodyHeight/(cell(powerForward,0,2).sole-spec.power.forward.crown),
  q:2*spec.bodyHeight/(cell(powerVertical,0,2).sole-spec.power.vertical.crown),
  v:2*spec.bodyHeight/(cell(powerRaised,0,1,raisedLayout).sole-spec.power.raised.crown),
  h:2*spec.aerial.horizontal.scale,
  a:2*spec.aerial.vertical.scale,
  o:2*spec.bodyHeight/(cell(specialOffense,0,3,spec.specials.offense).sole-spec.specials.offense.crown),
  r:2*spec.bodyHeight/(cell(specialCounter,0,3,spec.specials.counter).sole-spec.specials.counter.crown),
  c:2*spec.bodyHeight/(cell(companion,4,2).sole-(cell(companion,4,2).y+(id==='loopy'?68:35))),
 };
 // Match the airborne pelvis position to the grounded idle's standing body offset.
 const pelvisOffset=spec.radius-(cell(primary,0,3).sole-spec.idlePelvisY)*factors.b/2;
 const drawings={};
 for(const {prefix,png,rows,x,layout} of sheets) for(let i=0;i<x.length;i++){
  if(x[i]===null||((prefix==='j'||prefix==='k')&&i%3===1))continue;
  const key=prefix+i,box=cell(png,i,rows,layout),scale=factors[prefix];
  const pixel=sample(png,box,scale);
  if(id==='loopy'&&(prefix==='j'||[0,4,8].includes(i)&&prefix==='w'||prefix==='hd'&&[4,7,8,9,10,11].includes(i))){
   // Keep the antialiasing next to the silhouette and clear the diffuse fringe.
   const {width,height,data}=pixel;
   for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const offset=(row*width+col)*4+3;
    if(data[offset]===0||data[offset]>=200)continue;
    let nearInk=false;
    for(let y=Math.max(0,row-2);y<=Math.min(height-1,row+2)&&!nearInk;y++)
     for(let x=Math.max(0,col-2);x<=Math.min(width-1,col+2);x++)
      if(data[(y*width+x)*4+3]>=200){nearInk=true;break;}
    if(!nearInk)data[offset]=0;
   }
  }
  const sole=prefix==='g'?spec.support[i][1]:box.sole;
  const root=[round((x[i]-box.x)*scale),round((sole-box.y)*scale)];
  // Match the front edge of the planted sole to the idle drawing.
  if(prefix==='pt'||(prefix==='pf'&&i<3)){
   const frontSole=(sprite,soleY)=>{
    let edge=-1;
    for(let row=Math.max(0,Math.floor(soleY)-7);row<sprite.height;row++)
     for(let col=0;col<sprite.width;col++)
      if(sprite.data[(row*sprite.width+col)*4+3]>=200) edge=Math.max(edge,col);
    if(edge<0) throw Error(id+' missing taunt sole');
    return edge;
   };
   const idleBox=cell(primary,0,3);
   const idle={pixel:sample(primary,idleBox,factors.b),
    root:[round((sheets.find(sheet=>sheet.prefix==='b').x[0]-idleBox.x)*factors.b),round((idleBox.sole-idleBox.y)*factors.b)]};
   root[0]=round(frontSole(pixel,root[1])-frontSole(idle.pixel,idle.root[1])+idle.root[0]);
  }
  if(prefix==='tr'&&i===0) root[1]+=12;
  // Use the same pelvis-level registration for tuck poses. Feet rise around that anchor.
  if((prefix==='b'&&(i===5||i===6))||(prefix==='c'&&i===7)) root[1]+=10;
  const attackContact=layout?.contact?.[i]??spec.strikes.contact[key]??spec.power.contact[key];
  if(attackContact&&png.data[(attackContact[1]*png.width+attackContact[0])*4+3]<200)
   throw Error(id+' '+key+' contact outside opaque art');
  const throwPoint=layout?.points?.[i];
  const throwSockets=throwPoint && ((prefix==='th'||prefix==='ts'||prefix==='tw')
   ? {grabGrip:throwPoint}
   : {gripTop:throwPoint,gripBottom:throwPoint});
  const anchors=throwSockets??layout?.sockets?.[i]??(attackContact?{attackContact}:prefix==='g'?{supportFoot:spec.support[i]}:spec.sockets[key]);
  const sockets=anchors&&Object.fromEntries(Object.entries(anchors).map(([name,[sx,sy]])=>{
   if(sx<box.x||sx>=box.right||sy<box.y||sy>=box.bottom)throw Error(id+' '+key+' '+name+' outside art');
   return [name,[round((sx-box.x)*scale),round((sy-box.y)*scale)]];
  }));
  const pelvisY=prefix==='t'?spec.transitionPelvisY[i]:prefix==='e'?spec.edgePelvisY[i]:null;
  const airY=layout?.y?.[i];
  // Keep the tucked feet registered while the hands retract from the underside.
  const ceilingRoot=prefix==='ct'
   ? [root[0],round((box.sole-ceilingContact.sole+ceilingContact.y+2-box.y)*scale+2*spec.radius)]
   : undefined;
  const airRoot=ceilingRoot??(typeof airY==='number'?[root[0],round((airY-box.y)*scale)]:
   pelvisY===null?undefined:[root[0],round((pelvisY-box.y)*scale-2*pelvisOffset)]);
  drawings[key]={pixel,root,sockets,airRoot,mirrorSource:layout?.mirror?.includes(i)};
 }
 const image='atlas-'+id+'-pilot.png';
 function packPage(list,pageImage) {
  const cellWidth=Math.max(...list.map(frame=>frame.pixel.width))+4;
  const cellHeight=Math.max(...list.map(frame=>frame.pixel.height))+4;
  const maxColumns=Math.floor(4096/cellWidth),maxRows=Math.floor(4096/cellHeight);
  if(list.length>maxColumns*maxRows)throw Error(pageImage+' exceeds the pilot atlas capacity');
  const columns=Math.min(maxColumns,Math.max(
   Math.ceil(list.length/maxRows),Math.ceil(Math.sqrt(list.length*cellHeight/cellWidth)),
  ));
  const atlas=new PNG({width:cellWidth*columns,height:cellHeight*Math.ceil(list.length/columns)});
  for(const [i,frame] of list.entries()){
   const x=(i%columns)*cellWidth+2,y=Math.floor(i/columns)*cellHeight+2;
   PNG.bitblt(frame.pixel,atlas,0,0,frame.pixel.width,frame.pixel.height,x,y);
   frame.rect=[x,y,frame.pixel.width,frame.pixel.height];
   frame.image=pageImage;
  }
  fs.writeFileSync(path.join(output,pageImage),PNG.sync.write(atlas));
 }
 const entries=Object.entries(drawings);
 packPage(entries.filter(([key])=>!(key.startsWith('ps')||key.startsWith('pf')||key.startsWith('pt'))&&!(key.startsWith('lg')||key.startsWith('la'))).map(([,frame])=>frame),image);
 packPage(entries.filter(([key])=>(key.startsWith('lg')||key.startsWith('la'))).map(([,frame])=>frame),'atlas-'+id+'-ledge.png');
 packPage(entries.filter(([key])=>(key.startsWith('ps')||key.startsWith('pf')||key.startsWith('pt'))).map(([,frame])=>frame),'atlas-'+id+'-presentation.png');
 fs.writeFileSync(path.join(output,id+'-idle.png'),PNG.sync.write(drawings.b0.pixel));
 const clips={};
 function clip(name,keys,durations,activeWindow) {
  clips[name]={image,scale:0.5,frames:keys.map(k=>{
   const {rect,root,sockets,airRoot,mirrorSource,image:frameImage}=drawings[k];
   return {rect,root,...(frameImage!==image&&{image:frameImage}),...(sockets&&{sockets}),...(airRoot&&{airRoot}),...(mirrorSource&&{mirrorSource})};
  }),...(durations&&{durations}),...(activeWindow&&{activeWindow})};
 }
 clip('entry',['ps0','ps0','ps0','tc2','b0','b0'],[6,6,10,10,6,16]);
 clip('respawn_wait',['ps1','ps1','ps1','ps1'],[12,12,12,12]);
 clip('respawn_drop',['ps1','ps1','ps1','b5','b5','b5'],[6,6,6,6,6,6]);
 for(const [index,pose] of ['ps2','pf3','pf4'].entries())clip('victory_'+(index+1),['b0',index===2?'pf1':'ps0',pose,pose,pose,pose],[8,8,12,24,10,30]);
 for(const [index,direction] of ['up','side','down'].entries()){
  const pose='pf'+index;
  clip('taunt_'+direction,['b0','pt'+index,pose,pose,'pt'+(index+3),'b0'],[8,8,12,18,8,10]);
 }
 clip('ko_launch',['pf5'],[12]);
 clip('ko_screen',['pf6'],[12]);
 clip('ko_star',['pf7'],[12]);
 clip('defeat',['ps3','ps3','ps3','ps3'],[8,8,8,8]);
 clip('footstool_attacker',['fs0','fs0','b5'],[1,3,14]);
 clip('footstool_ground_victim',['fs1','fs1','fs1'],[1,3,14]);
 clip('footstool_air_victim',['fs2','fs2','fs2'],[1,3,14]);
 clip('trip_fall',['tr0','tr0','tr1','tr1','tr2','tr2'],[4,4,4,4,4,4]);
 clip('trip_prone',['tr2','tr3'],[8,8]);
 clip('trip_getup',['tr2','tr3','tr4','tc1','tc2','b0'],[1,1,6,6,5,5]);
 clip('trip_roll',['tr2','tr3','tc4','tc5','tc2','b0'],[1,1,14,4,2,2]);
 clip('floor_attack_trip',['tr2','tr3','tr4','gc0','gc1','tc2','b0'],[1,1,4,2,2,7,7],[6,10]);
 clip('jab_lock_up',['tr6','tr7','tr8','gu0'],[4,4,4,4]);
 clip('jab_lock_down',['tr9','tr10','tr11','gd0'],[4,4,4,4]);
 clip('ceiling_tech',['ct0','ct1','ct1','ct2','ct2','ct2'],[4,4,4,4,4,6]);
 clip('tech_neutral',['tc0','tc0','tc1','tc1','tc2','b0'],[3,4,4,4,5,6]);
 clip('tech_roll',['tc3','tc4','tc4','tc5','tc2','b0'],[5,5,7,7,8,8]);
 clip('wall_tech',['tc6','tc7','tc7','tc8','tc8','b5'],[4,4,4,4,4,4]);
 clip('wall_tech_jump',['tc9','tc10','tc10','tc11','tc11','b5'],[4,4,4,4,4,4]);
 clip('idle',['b0'],[24]);
 clip('walk',['g0','g1','g2','g3'],[7,5,7,5]);
 clip('run',['g4','g5','g6','g7'],spec.runTiming);
 clip('dash_start',['t0','t1','g4','g5','g6','g7'],[3,3,2,3,2,2]);
 clip('brake',['t3','t2','b0'],[4,4,10]);
 clip('turn_stand',['t2','b0'],[3,3]);
 clip('turn_run',['t3','t2'],[2,4]);
 clip('jump_squat',['t4'],[4]);
 for(const key of ['crouch_enter','crouch_hold'])clip(key,['b4'],[4]);
 clip('crouch_exit',['b4','b0']);clip('jump',['t4','t8','t9','t10','t11','b7']);
 clip('takeoff_neutral',['t5','t8'],[4,2]);
 clip('takeoff_forward',['t6','t8'],[4,2]);
 clip('takeoff_backward',['t7','t8'],[4,2]);
 clip('air_rise_loop',['t8'],[6]);
 clip('air_apex_loop',['t9'],[6]);
 clip('air_fall_loop',['t10'],[6]);
 clip('air_fastfall_loop',['e0','e1'],[3,8]);
 clip('platform_drop',['e2','e3'],[3,5]);
 clip('teeter_front',['e4','e5'],[9,9]);
 clip('teeter_back',['e6','e7'],[9,9]);
 clip('double_jump_transition',['t11','t8'],[5,7]);
 clip('land_soft',['b7','b4','b0'],[3,3,6]);
 clip('land_heavy',['b7','b4','b0'],[5,4,9]);
 clip('ledge_catch',['lh0','lh0','lh0','lh1'],[2,2,2,2]);
 clip('ledge_hang',['lh1']);
 clip('ledge_climb',['lh1','lg0','lg1','lg1','tc2','b0'],[6,6,8,8,6,6]);
 clip('ledge_attack',['lh1','lg0','lg1','la0','lg1','b0'],[6,6,8,8,16,16]);
 clip('ledge_jump',['lh1','la1','la1','la1','b5','b5'],[2,2,2,2,2,2]);
 clip('ledge_drop',['la2','la2','la2','b5'],[3,3,3,3]);
 clip('ledge_trump',['la3','la3','la3','la3'],[3,3,3,3]);
 clip('ledge_roll',['lh1','lg0','lg2','lg2','lg1','b0'],[6,6,8,8,8,9]);
 clip('grab',['b0','b0','c4','gr0','c4','b0']);
 clip('grab_dash',['g4','g5','g6','gr1','c4','b0']);
 clip('grab_pivot',['t2','t3','c4','gr2','c4','b0']);
 clip('grab_hold',['gh0']);
 clip('pummel',['gh0','gh0','gh0','gh1','gh0','gh0']);
 clip('pummel_victim',['gv0','gv1','gv0']);
 clip('grab_release',['gv0','gv0','gv2']);
 clip('grabbed',['gv0','gv0']);
 for(const [index,direction] of ['forward','back','up','down'].entries()){
  const release=['tw1','ts0','th2','ts1'][index],victim=index===3?'tv1':'tv'+index;
  const recovery=direction==='down'?'tr4':'c4';
  const windup=direction==='up'&&drawings.tw2?'tw2':'tw0';
  clip(direction+'_throw',['gh0',windup,release,recovery,'b0'],[3,3,2,5,13],[6,8]);
  const victimClip=direction==='forward'?'throw_victim':direction+'_throw_victim_preview';
  clip(victimClip,['gv0',victim,'b6']);
  if(direction==='down')clips[victimClip].frames[1].mirrorSource=true;
 }
 // One distinct windup, contact and recovery drawing per grounded move.
 for(const [i,name] of ['jab','jab_2','jab_3','forward_tilt','up_tilt','down_tilt'].entries()){
  const prefix=i<3?'j':'k',row=i%3;
  clip(name,[prefix+(row*3),spec.strikes.frames[i],prefix+(row*3+2)],[4,4,8],[4,8]);
 }
 clip('dash_attack',['p0','p1','p2','p3'],[4,4,5,8],[8,13]);
 clip('forward_smash',['p4','p5','p6','p7'],[4,4,3,8],[8,11]);
 clip('up_smash',['q0',...spec.power.up,'q3'],[6,2,3,8],[6,11]);
 clip('down_smash',['q4','q5','q6','q7'],[6,3,3,8],[6,12]);
 for(const [i,name] of ['neutral_air','forward_air','back_air','up_air','down_air'].entries()){
  const prefix=i<3?'h':'a',row=i<3?i:i-3;
  clip(name,[prefix+(row*3),prefix+(row*3+1),prefix+(row*3+2)],[5,4,8],[5,9]);
 }
 clip('neutral_special',['o0','o1','o2'],[5,4,8],[5,9]);
 clip('side_special',['o3','o4','o5'],[5,4,8],[5,9]);
 clip('up_special',['o6','o7','o8'],[5,4,8],[5,9]);
 clip('down_special',['r0','r1','r2'],[2,4,16]);
 clip('counter_success',['r3','r4','r5'],[3,4,5]);
 clip('helpless_enter',['r6']);
 clip('helpless_loop',['r7']);
 clip('helpless_land',['r8','b0'],[10,4]);
 clip('shield_raise',['z0','z1'],[3,3]);
 clip('shield',['z1','z2'],[8,24]);
 clip('shield_hit',['z3','z4','z1'],[4,6,8]);
 clip('shield_drop',['z2','z5'],[5,6]);
 clip('parry',['z6','z7','z8'],[3,5,10]);
 clip('dodge',['w0','w4','w8']);
 clip('roll',['w1','w5','w9']);
 clip('roll_back',['w2','w6','w10']);
 clip('air_dodge_neutral',['w3','w7','w11']);
 const airDodgeClips=['air_dodge_side','air_dodge_back','air_dodge_up','air_dodge_down',
  'air_dodge_up_diagonal','air_dodge_up_back','air_dodge_down_diagonal','air_dodge_down_back'];
 for(const [index,name] of airDodgeClips.entries())clip(name,['w3','ad'+index,'w11']);
 clip('air_dodge_land',['ad8','ad9','ad10','ad11'],[2,3,3,2]);
 clip('shield_break_launch',['sb0','sb1','sb2','sb3'],[3,6,6,8]);
 clip('shield_break_dizzy',['sb4','sb5','sb6','sb7'],[6,6,6,6]);
 clip('shield_break_recover',['sb8','sb9','sb10','sb11'],[4,5,5,4]);
 clip('hit_high',['hd0','b0'],[7,3]);
 clip('hit_mid',['hd1','b0'],[6,3]);
 clip('hit_low',['hd2','b0'],[7,3]);
 clip('hit_heavy',['hd3','b0'],[10,4]);
 clip('hit_air',['hd4','hd7'],[6,6]);
 clip('hit_launch',['hd5',id==='loopy'?'ad1':'hd6'],[4,6]);
 clip('tumble',['hd8','hd9','hd10','hd11'],[4,4,4,4]);
 clip('tumble_recover',['fl0','fl1','fl2','fl3'],[3,3,3,3]);
 for(const [side,prefix,first] of [['up','gu',4],['down','gd',8]]){
  const poses=(indices)=>indices.map(i=>prefix+i);
  clip('knockdown_'+side,[...Array.from({length:4},(_,i)=>'fl'+(first+i)),prefix+'0'],[2,4,4,4,4]);
  clip('prone_'+side,poses([0,1]),[6,6]);
  clip('getup_'+side,[...poses([0,1,2,3,4]),'b0'],[2,2,5,6,6,5]);
  clip('getup_roll_'+side,[...poses([0,1,5,6,7]),'b0'],[2,2,2,12,5,3]);
  const contact=side==='up'?['gc0','gc1']:['gc2','gc3'];
  clip('floor_attack_'+side,[...poses([0,1,8]),...contact,prefix+'11','b0'],[1,1,4,2,2,7,7],[6,10]);
 }
 return {clips};
}
fs.mkdirSync(output,{recursive:true});
const characters=Object.fromEntries(Object.entries(specs).map(([id,spec])=>[id,build(id,spec)]));
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:1,revision:42,characters},null,2)+'\n');
