const HTML_URL='https://raw.githubusercontent.com/originsystem-oss/ferval-control/main/public/ferval-control-1.3.html';
const html=await (await fetch(HTML_URL,{headers:{'cache-control':'no-cache'}})).text();
const port=Number(process.env.PORT||3000);

function crc32(bytes){
  let c=0xffffffff;
  for(const b of bytes){
    c^=b;
    for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return (c^0xffffffff)>>>0;
}
function be32(n){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255])}
function join(parts){
  const len=parts.reduce((n,p)=>n+p.length,0), out=new Uint8Array(len);
  let o=0; for(const p of parts){out.set(p,o);o+=p.length} return out;
}
function pngChunk(type,data){
  const t=new TextEncoder().encode(type);
  const body=join([t,data]);
  return join([be32(data.length),body,be32(crc32(body))]);
}
async function makeFervalIcon(size){
  const stride=size*4+1;
  const raw=new Uint8Array(stride*size);
  const bg=[6,16,29,255], white=[240,244,250,255], silver=[164,174,190,255], blue=[67,130,255,255];
  for(let y=0;y<size;y++){
    const row=y*stride; raw[row]=0;
    for(let x=0;x<size;x++){
      const i=row+1+x*4; raw[i]=bg[0];raw[i+1]=bg[1];raw[i+2]=bg[2];raw[i+3]=255;
    }
  }
  const px=(x,y,c)=>{
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=size||y>=size)return;
    const i=y*stride+1+x*4;raw[i]=c[0];raw[i+1]=c[1];raw[i+2]=c[2];raw[i+3]=c[3];
  };
  const disc=(cx,cy,r,c)=>{
    const rr=r*r;
    for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)
      for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)
        if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=rr)px(x,y,c);
  };
  const line=(x1,y1,x2,y2,w,c)=>{
    const dx=x2-x1,dy=y2-y1,steps=Math.max(Math.abs(dx),Math.abs(dy))*1.5;
    for(let n=0;n<=steps;n++){const t=n/steps;disc(x1+dx*t,y1+dy*t,w/2,c)}
  };
  const tri=(m,yt,yb,w,c)=>{
    line(m,yt,size-m,yt,w,c);
    line(size-m,yt,size/2,yb,w,c);
    line(size/2,yb,m,yt,w,c);
  };
  tri(size*.15,size*.22,size*.83,size*.075,white);
  tri(size*.29,size*.39,size*.68,size*.052,silver);
  const a=[size*.44,size*.50],b=[size*.56,size*.50],d=[size*.50,size*.62];
  for(let y=Math.floor(a[1]);y<=d[1];y++){
    const t=(y-a[1])/(d[1]-a[1]);
    const lx=a[0]+(d[0]-a[0])*t, rx=b[0]+(d[0]-b[0])*t;
    for(let x=Math.floor(lx);x<=Math.ceil(rx);x++)px(x,y,blue);
  }
  const cs=new CompressionStream('deflate');
  const writer=cs.writable.getWriter(); await writer.write(raw); await writer.close();
  const compressed=new Uint8Array(await new Response(cs.readable).arrayBuffer());
  const ihdr=new Uint8Array(13);
  ihdr.set(be32(size),0);ihdr.set(be32(size),4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return join([
    new Uint8Array([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR',ihdr),
    pngChunk('IDAT',compressed),
    pngChunk('IEND',new Uint8Array())
  ]);
}
const icon180=await makeFervalIcon(180);
const icon192=await makeFervalIcon(192);
const icon512=await makeFervalIcon(512);
const manifest=JSON.stringify({
  name:'FERVAL CONTROL',
  short_name:'FERVAL',
  start_url:'/',
  display:'standalone',
  background_color:'#06101d',
  theme_color:'#06101d',
  icons:[
    {src:'/icon-192.png?v=2.2',sizes:'192x192',type:'image/png',purpose:'any maskable'},
    {src:'/icon-512.png?v=2.2',sizes:'512x512',type:'image/png',purpose:'any maskable'}
  ]
});

Bun.serve({
  port,
  hostname:'0.0.0.0',
  async fetch(req){
    const u=new URL(req.url);
    if(u.pathname==='/health'){
      return new Response(JSON.stringify({ok:true,version:'2.2-icon-voice'}),{headers:{'content-type':'application/json'}});
    }
    if(u.pathname==='/apple-touch-icon.png'){
      return new Response(icon180,{headers:{'content-type':'image/png','cache-control':'public,max-age=3600'}});
    }
    if(u.pathname==='/icon-192.png'||u.pathname==='/favicon.png'){
      return new Response(icon192,{headers:{'content-type':'image/png','cache-control':'public,max-age=3600'}});
    }
    if(u.pathname==='/icon-512.png'){
      return new Response(icon512,{headers:{'content-type':'image/png','cache-control':'public,max-age=3600'}});
    }
    if(u.pathname==='/manifest.json'){
      return new Response(manifest,{headers:{'content-type':'application/manifest+json','cache-control':'no-store'}});
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
      }catch{
        return new Response(JSON.stringify({error:'No se pudo procesar el audio'}),{status:500,headers:{'content-type':'application/json'}});
      }
    }
    return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
});
console.log('FERVAL CONTROL 2.2 icon+voice host on',port);