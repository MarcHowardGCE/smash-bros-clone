
export function addGrabContact(manifest){
 const grip={
 grab_hold:[[.82,.28],[.82,.28],[.82,.28],[.82,.28]],
 pummel:[[.80,.28],[.80,.28],[.80,.28],[.80,.28],[.80,.28],[.80,.28]],
 forward_throw:[[.89,.32],[.68,.4],[.79,.34],[.90,.32],[.83,.41],[.66,.30]],
 back_throw:[[.78,.32],[.62,.43],[.34,.43],[.30,.32],[.61,.43],[.65,.30]],
 up_throw:[[.77,.35],[.60,.40],[.55,.40],[.59,.07],[.59,.35],[.65,.30]],
 down_throw:[[.77,.35],[.62,.40],[.58,.40],[.58,.78],[.58,.60],[.65,.30]],
 grab:[[.65,.34],[.65,.34],[.84,.32],[.84,.35],[.78,.40],[.65,.34]]
 };
 for(const[id,c]of Object.entries(manifest.characters)){
 for(const[name,points]of Object.entries(grip)){
 const clip=c.clips[name];if(!clip)continue;const corrected=id==='abe-lincoln'&&name==='pummel'?[[.757,.322],[.709,.318],[.705,.319],[.770,.318],[.708,.318],[.707,.318]]:id==='abe-lincoln'&&name==='grab_hold'?[[.789,.299],[.719,.298],[.787,.289],[.726,.289]]:id==='swift'&&name==='forward_throw'?[[.80,.28],[.619,.359],...points.slice(2)]:points;for(const[f,p]of clip.frames.map((f,i)=>[f,corrected[i]])){
 const cellX=f.rect[0]-f.trim[0],cellY=f.rect[1]-f.trim[1];
 f.sockets.grabGrip=[cellX+p[0]*f.sourceSize[0]-f.rect[0],cellY+p[1]*f.sourceSize[1]-f.rect[1]];
 }}
 for(const name of ['grabbed','pummel_victim','grab_release','throw_victim']){
 const clip=c.clips[name];for(const f of clip.frames){
 const x=f.rect[2]*(id==='swift'?.34:id==='abe-lincoln'?.45:.47);
 const canonical=clip.mirrorSource?f.rect[2]-x:x;
 f.sockets.gripTop=[canonical,f.rect[3]*(id==='abe-lincoln'?.35:.24)];
 f.sockets.gripBottom=[canonical,f.rect[3]*.60];
 }}
 }manifest.contactVersion=2;
}
