import http from "node:http";

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const page = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>FERVAL CONTROL</title><style>*{box-sizing:border-box}body{margin:0;background:#07111f;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.app{max-width:760px;margin:auto;height:100dvh;display:flex;flex-direction:column}.head{padding:18px;border-bottom:1px solid #263449}.head b{font-size:19px}.head span{display:block;color:#94a3b8;font-size:12px;margin-top:4px}.chat{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}.m{max-width:86%;padding:12px 14px;border-radius:16px;line-height:1.35;white-space:pre-wrap}.u{align-self:flex-end;background:#2563eb}.a{align-self:flex-start;background:#1e293b}.bar{display:flex;gap:8px;padding:12px;border-top:1px solid #263449}.bar input{flex:1;background:#111c2e;color:white;border:1px solid #334155;border-radius:14px;padding:14px;font-size:16px}.bar button{border:0;border-radius:14px;padding:0 18px;font-weight:700}.status{color:#64748b;font-size:11px;padding:0 18px 8px}</style></head><body><div class="app"><div class="head"><b>FERVAL CONTROL</b><span>Dirección · YAYO</span></div><div id="chat" class="chat"><div class="m a">Estoy aquí. ¿Qué necesitas?</div></div><div id="s" class="status"></div><form id="f" class="bar"><input id="i" autocomplete="off" placeholder="Escribe a Yayo…"><button>Enviar</button></form></div><script>const f=document.getElementById('f'),i=document.getElementById('i'),c=document.getElementById('chat'),s=document.getElementById('s');const add=(t,k)=>{const d=document.createElement('div');d.className='m '+k;d.textContent=t;c.appendChild(d);c.scrollTop=c.scrollHeight};f.onsubmit=async e=>{e.preventDefault();const m=i.value.trim();if(!m)return;i.value='';add(m,'u');s.textContent='Yayo está pensando…';try{const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:m})});const j=await r.json();add(j.reply||j.error||'No he podido responder.','a')}catch(e){add('No he podido conectar.','a')}finally{s.textContent='';i.focus()}};</script></body></html>`;

const json=(res,status,obj)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(obj));};

http.createServer(async (req,res)=>{
  if(req.method==="GET" && req.url==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(page);}
  if(req.method==="GET" && req.url==="/health") return json(res,200,{ok:true});
  if(req.method==="POST" && req.url==="/api/chat"){
    let body=""; for await (const chunk of req) body+=chunk;
    let message=""; try{message=JSON.parse(body).message||""}catch{return json(res,400,{error:"Mensaje inválido."})}
    if(!OPENAI_API_KEY) return json(res,503,{error:"Falta configurar OPENAI_API_KEY."});
    try{
      const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":"Bearer "+OPENAI_API_KEY,"content-type":"application/json"},body:JSON.stringify({model:"gpt-5.6",instructions:"Eres Yayo dentro de FERVAL CONTROL, un asistente privado de Dirección de Grupo Ferval. Responde en español, de forma directa, clara y útil. No afirmes tener acceso a información o acciones que no estén disponibles en esta conversación.",input:message})});
      const data=await r.json();
      if(!r.ok) return json(res,r.status,{error:data?.error?.message||"Error de OpenAI."});
      const reply=data.output_text || (data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n") || "Sin respuesta.";
      return json(res,200,{reply});
    }catch(e){return json(res,500,{error:"Error conectando con OpenAI."})}
  }
  json(res,404,{error:"Not found"});
}).listen(PORT,"0.0.0.0",()=>console.log("FERVAL CONTROL listening on",PORT));