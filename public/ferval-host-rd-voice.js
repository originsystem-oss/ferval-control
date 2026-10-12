const port=Number(process.env.PORT||3000);
const CORE_URL='https://raw.githubusercontent.com/originsystem-oss/ferval-control/0a5f725254822ad3254ab0f7956fe680a868561f/public/ferval-core-budget-upload.html';
let core=await fetch(CORE_URL,{headers:{'cache-control':'no-store'}}).then(async r=>{if(!r.ok)throw new Error('core '+r.status);return r.text()});
core=core.replace('__SUPABASE_KEY__',process.env.SUPABASE_PUBLISHABLE_KEY||'');
core=core.replace("async function send(){","\nconst rdAudio=new Audio();let rdUrl='',rdBusy=false;\nfunction stopRD(){rdAudio.pause();rdAudio.currentTime=0;}\nfunction addRDButton(reply,node){\n if(!reply||!node||!me)return;\n const button=document.createElement('button');button.className='mini alt';button.style.display='block';button.style.marginTop='10px';button.textContent='▶ Escuchar con voz de RD';button.type='button';\n button.onclick=async()=>{\n if(rdBusy)return;rdBusy=true;button.disabled=true;button.textContent='Preparando voz de RD…';stopRD();\n try{\n const{data:{session}}=await sb.auth.getSession();if(!session)throw Error('Vuelve a iniciar sesión');\n const r=await fetch('/api/rd-voice',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+session.access_token},body:JSON.stringify({text:reply,sid})});\n if(!r.ok){const e=await r.json();throw Error(e.error||'No se pudo generar audio')}\n const blob=await r.blob();if(rdUrl)URL.revokeObjectURL(rdUrl);rdUrl=URL.createObjectURL(blob);rdAudio.src=rdUrl;\n let player=node.querySelector('audio');if(!player){player=document.createElement('audio');player.controls=true;player.style.width='100%';player.style.marginTop='10px';node.append(player)}\n stopRD();player.src=rdUrl;document.querySelectorAll('#chat audio').forEach(a=>{if(a!==player)a.pause()});try{await player.play()}catch{}\n button.textContent='↻ Volver a generar voz de RD';\n }catch(e){button.textContent='▶ Reintentar voz de RD';let error=node.querySelector('[data-rd-error]');if(!error){error=document.createElement('div');error.dataset.rdError='1';error.className='err';node.append(error)}error.textContent=e.message||'Audio no disponible'}\n finally{rdBusy=false;button.disabled=false}\n };node.append(button);\n}\n"+"\nasync function send(){");
core=core.replace("$('chat').scrollTop=$('chat').scrollHeight","addRDButton(j.reply,$('chat').lastElementChild);$('chat').scrollTop=$('chat').scrollHeight");
if(!core.includes('Núcleo estable'))throw new Error('FERVAL core mismatch');
Bun.serve({port,async fetch(req){
 const u=new URL(req.url);
 if(u.pathname==='/api/rd-voice'&&req.method==='POST'){
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return Response.json({error:'Inicia sesión para escuchar'},{status:401});
  if(Number(req.headers.get('content-length')||0)>30000)return Response.json({error:'Solicitud demasiado grande'},{status:413});
  try{
   const raw=await req.text();if(raw.length>30000)return Response.json({error:'Solicitud demasiado grande'},{status:413});
   const r=await fetch('https://rd-voice-bridge-production.up.railway.app/ferval-speak',{method:'POST',headers:{'content-type':'application/json',authorization:auth,'x-ferval-publishable-key':process.env.SUPABASE_PUBLISHABLE_KEY||''},body:raw,signal:AbortSignal.timeout(180000)});
   return new Response(r.body,{status:r.status,headers:{'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store'}});
  }catch{return Response.json({error:'Voz de RD no disponible. Puedes leer la respuesta.'},{status:502})}
 }

 if(u.pathname==='/health')return Response.json({ok:true,version:'CORE-1.1-RD-voice',yayo:'v44-backend'});
 if(u.pathname==='/'||u.pathname==='/app'||u.pathname==='/app/')return new Response(core,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate','pragma':'no-cache'}});
 return new Response('Not found',{status:404});
}});
console.log('FERVAL CONTROL CORE 1.0 host on',port);