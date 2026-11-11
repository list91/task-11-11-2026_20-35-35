const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'};
http.createServer((q,r)=>{let f=q.url.split('?')[0];if(f==='/')f='/index.html';
const p=path.join(__dirname,'public',path.normalize(f));
fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'Content-Type':types[path.extname(p)]||'text/plain'});r.end(b)})
}).listen(3000,()=>console.log('http://localhost:3000'));
