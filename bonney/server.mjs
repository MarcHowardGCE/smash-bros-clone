import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4174);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.aac':'audio/aac','.flac':'audio/flac'};
const server=http.createServer(async(req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 try{
  const url=new URL(req.url,'http://localhost');
  const name=decodeURIComponent(url.pathname);
  const allowed=name==='/'||name==='/index.html'||name==='/style.css'||
   /^\/src\/(audio|audio-config|puzzle-effects|controller|player-body|camera|underwater-data|underwater-level|underwater-art|flight-art|flight-anchors|cloud-data|combat|cloud-level|cloud-art|engine|game|locomotion|world-art|level-data|encounters|full-level-art|market-scene|remaining-scene)\.mjs$/.test(name)||name.startsWith('/assets/');
  if(!allowed){res.writeHead(404);res.end('Not found');return;}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  const resolved=await realpath(file);
  if(!resolved.startsWith(root+path.sep)||!(await stat(resolved)).isFile()){
   res.writeHead(403);res.end('Forbidden');return;
  }
  const data=await readFile(resolved);
  res.writeHead(200,{'Content-Type':mime[path.extname(resolved)]||'application/octet-stream',
   'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',e=>{console.error('Could not start Bonney preview:',e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('Bonney Harbor Run: http://127.0.0.1:'+port));
