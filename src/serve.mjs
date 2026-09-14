import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = new Map([
 ['/', ['../index.html','text/html; charset=utf-8']],
 ['/src/core.mjs',['./core.mjs','text/javascript; charset=utf-8']],
 ['/examples/report.json',['../examples/report.json','application/json']],
 ['/examples/initial-report.json',['../examples/initial-report.json','application/json']]
]);
const port=Number(process.env.PORT||4178);
createServer(async(req,res)=>{
 const entry=allowed.get(new URL(req.url,'http://localhost').pathname);
 if(!entry){res.writeHead(404);res.end('Not found');return;}
 try{const body=await readFile(new URL(entry[0],import.meta.url));res.writeHead(200,{'Content-Type':entry[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
 catch{res.writeHead(503);res.end('Run the workflow and capture a reviewed sample first.');}
}).listen(port,'127.0.0.1',()=>console.log('Review desk: http://127.0.0.1:'+port));
