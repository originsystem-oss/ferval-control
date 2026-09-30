const port=Number(process.env.PORT||3000);
const CORE_URL='https://raw.githubusercontent.com/originsystem-oss/ferval-control/818f1602152d72ba2344725506d2ce141c5f526e/public/ferval-core-stable.html';
let core=await fetch(CORE_URL,{headers:{'cache-control':'no-store'}}).then(async r=>{if(!r.ok)throw new Error('core '+r.status);return r.text()});
core=core.replace('__SUPABASE_KEY__',process.env.SUPABASE_PUBLISHABLE_KEY||'');
if(!core.includes('Núcleo estable'))throw new Error('FERVAL core mismatch');
Bun.serve({port,async fetch(req){
 const u=new URL(req.url);
 if(u.pathname==='/health')return Response.json({ok:true,version:'CORE-1.0',yayo:'v22-backend'});
 if(u.pathname==='/'||u.pathname==='/app'||u.pathname==='/app/')return new Response(core,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate','pragma':'no-cache'}});
 return new Response('Not found',{status:404});
}});
console.log('FERVAL CONTROL CORE 1.0 host on',port);