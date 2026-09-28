const HTML_URL='https://raw.githubusercontent.com/originsystem-oss/ferval-control/fd5c4fc4afb3006fe9ff9922e68b4ef08ab98b6c/public/ferval-control-1.3.html';
const html=await (await fetch(HTML_URL)).text();
const port=Number(process.env.PORT||3000);
Bun.serve({
  port,
  hostname:'0.0.0.0',
  async fetch(req){
    const u=new URL(req.url);
    if(u.pathname==='/health'){
      return new Response(JSON.stringify({ok:true,version:'2.1-voice'}),{headers:{'content-type':'application/json'}});
    }
    if(u.pathname==='/api/transcribe'&&req.method==='POST'){
      try{
        const key=process.env.OPENAI_API_KEY;
        if(!key)return new Response(JSON.stringify({error:'Motor de voz no configurado'}),{status:503,headers:{'content-type':'application/json'}});
        const ct=req.headers.get('content-type')||'';
        const body=await req.arrayBuffer();
        const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{
          method:'POST',
          headers:{authorization:'Bearer '+key,'content-type':ct},
          body
        });
        const text=await r.text();
        return new Response(text,{status:r.status,headers:{'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store'}});
      }catch(e){
        return new Response(JSON.stringify({error:'No se pudo procesar el audio'}),{status:500,headers:{'content-type':'application/json'}});
      }
    }
    return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
});
console.log('FERVAL CONTROL 2.1 voice host on',port);