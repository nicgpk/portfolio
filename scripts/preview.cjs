const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2'};
http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  fs.readFile(file,(err,data)=>{res.writeHead(err?404:200, {'Content-Type':types[path.extname(file)]||'application/octet-stream'}); res.end(err?'Not found':data);});
}).listen(4173,'127.0.0.1',()=>console.log('Portfolio preview: http://127.0.0.1:4173'));
