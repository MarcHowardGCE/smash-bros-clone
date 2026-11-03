import fs from"node:fs";import path from"node:path";import{PNG}from"pngjs";
const root="apps/client/public/fighter-art-pilot-v1",out=process.argv[2]??root,m=JSON.parse(fs.readFileSync(root+"/manifest.json"));fs.mkdirSync(out,{recursive:true});
const match=(id,r,g,b)=>{const v=(r+g+b)/3;return id==="abe-lincoln"?Math.max(r,g,b)-Math.min(r,g,b)<45&&v>30&&v<170:id==="all-rounder"?b>r*1.12&&b>g*1.1&&b>50:g>r*1.12&&g>b*1.05&&g>60;};
const rows=[],boardPlan=[];let totalFrames=0;for(const[id,c]of Object.entries(m.characters)){
 const clips=[];for(const[n,k]of Object.entries(c.clips)){const png=PNG.sync.read(fs.readFileSync(root+"/"+k.image)),frames=[];for(const f of k.frames){let sum=0,count=0,opaque=0;for(let y=0;y<f.rect[3];y+=2)for(let x=0;x<f.rect[2];x+=2){const o=((y+f.rect[1])*png.width+x+f.rect[0])*4,[r,g,b,a]=png.data.subarray(o,o+4);if(a<240)continue;opaque++;if(match(id,r,g,b)){sum+=.2126*r+.7152*g+.0722*b;count++;}}frames.push({luma:count?+(sum/count).toFixed(3):null,samples:count,coverage:opaque?+(count/opaque).toFixed(3):0});totalFrames++;}
 clips.push({fighter:id,clip:n,image:k.image,frames});}
 const baseline=clips.find(r=>r.clip==="idle").frames[0].luma;for(const r of clips){const eligible=r.frames.filter(f=>f.samples>=100&&f.luma!==null),d=eligible.map(f=>f.luma-baseline);rows.push({...r,baseline,maximumSignatureDifference:d.length?+Math.max(...d.map(Math.abs)).toFixed(3):null});}
 for(let page=0;page<4;page++)boardPlan.push({fighter:id,page,file:"palette-"+id+"-"+(page+1)+".png",clips:["idle",...Object.keys(c.clips).slice(page*34,page*34+34)]});
}
const audit={date:"2026-11-03",revision:m.revision,clips:rows.length,framesMeasured:totalFrames,method:"Opaque source pixels sampled every two pixels in each registered frame. Broad blue/neutral/green signature masks compare against approved idle frame 0. This is a screening measure, not a semantic garment mask, perceptual color difference or quality score. Pose occlusion and exposure change the mixture. Face/costume identity require visual inspection.",rows,boards:boardPlan,visualAssessments:JSON.parse(fs.readFileSync(root+"/palette-visual-findings.json","utf8"))};fs.writeFileSync(path.join(out,"palette-audit.json"),JSON.stringify(audit,null,2));
const slim=structuredClone(m);delete slim.clips;delete slim.effects;
const template=fs.readFileSync("scripts/assets/palette-review.template.html","utf8"),html=template.replace("__PACK__",JSON.stringify(slim)).replace("__AUDIT__",JSON.stringify(audit));
fs.writeFileSync(path.join(out,"palette-review.html"),html);if(path.resolve(out)!==path.resolve(root))for(const n of["palette-audit.json","palette-review.html"])fs.copyFileSync(path.join(out,n),path.join(root,n));
console.log(JSON.stringify({clips:rows.length,frames:totalFrames,boards:boardPlan.length,candidates:rows.filter(r=>r.maximumSignatureDifference!==null).sort((a,b)=>b.maximumSignatureDifference-a.maximumSignatureDifference).slice(0,12).map(r=>({fighter:r.fighter,clip:r.clip,signatureDelta:r.maximumSignatureDifference}))},null,2));


if(path.resolve(out)!==path.resolve(root))for(const n of fs.readdirSync(root).filter(n=>/^palette-.*\.(png|json)$/.test(n)))fs.copyFileSync(path.join(root,n),path.join(out,n));
