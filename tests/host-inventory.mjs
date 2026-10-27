import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('public/ferval-core-budget-upload.html',root),'utf8');
const inventory=await readFile(new URL('public/ferval-inventory.js',root),'utf8');
const originalFetch=globalThis.fetch;
let handler;
globalThis.fetch=async url=>{
  const path=String(url);
  if(path.endsWith('/ferval-icons-silver-20261012.json'))return Response.json({'32':'','180':'','192':'','512':''});
  if(path.endsWith('/ferval-inventory.js'))return new Response(inventory);
  if(path.endsWith('/ferval-core-budget-upload.html'))return new Response(source);
  throw Error('Unexpected startup request: '+path);
};
globalThis.Bun={serve(config){handler=config.fetch;}};
process.env.SUPABASE_PUBLISHABLE_KEY='qa-publishable-key';
try{
  await import('../public/ferval-host-rd-voice.js');
  const html=await (await handler(new Request('http://localhost/app'))).text();
  assert(html.includes('data-view="inventario"'));
  assert(html.includes('id="navInventory"'));
  assert(html.includes("import{createInventory}from'/ferval-inventory.js'"));
  assert(html.includes('addRDButton(j.reply'));
  assert(html.includes('/rd-ferval-avatar.js'));
  assert(html.includes('data-view="documentos"'));
  assert(!html.includes('__SUPABASE_KEY__'));
  const asset=await handler(new Request('http://localhost/ferval-inventory.js'));
  assert.equal(asset.status,200);
  assert(asset.headers.get('content-type').includes('javascript'));
  assert.equal(await asset.text(),inventory);
  const health=await (await handler(new Request('http://localhost/health'))).json();
  assert.equal(health.version,'CORE-1.4-inventario');
  const temp=await mkdtemp(join(tmpdir(),'ferval-check-'));
  try{
    const scripts=[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length,1);
    const file=join(temp,'client.mjs');await writeFile(file,scripts[0][1]);
    execFileSync(process.execPath,['--check',file]);
  }finally{await rm(temp,{recursive:true,force:true});}
  console.log('PASS: served inventory module, navigation, injected client syntax, health, existing voice and documents retained');
}finally{globalThis.fetch=originalFetch;delete globalThis.Bun;}
