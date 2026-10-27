// Inventory is persisted through an authenticated, N1-only database transaction.
export function createInventory({sb, getUser, showView, $}) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data, location = '', busy = false, generation = 0;
  const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const date = value => value ? new Date(value).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}) : '';
  const name = id => id ? (data.obras.find(o => o.id === id)?.label || 'Obra') : 'Almacén / Nave';
  const at = id => data.movimientos.filter(m => m.origen === id || m.destino === id);
  const balances = id => data.herramientas.map(h => {
    const moves = data.movimientos.filter(m => m.herramienta_id === h.id);
    const incoming = moves.filter(m => m.destino === id).reduce((s,m) => s + m.cantidad,0);
    const outgoing = moves.filter(m => m.tipo === 'traslado' && m.origen === id).reduce((s,m) => s + m.cantidad,0);
    return {...h, cantidad:incoming-outgoing, entradas:incoming, salidas:outgoing,
      devueltas:moves.filter(m=>m.tipo==='traslado' && m.origen===id && m.destino===null).reduce((s,m)=>s+m.cantidad,0),
      trasladadas:moves.filter(m=>m.tipo==='traslado' && m.origen===id && m.destino!==null).reduce((s,m)=>s+m.cantidad,0)};
  });
  const lastReview = id => data.revisiones.filter(r=>r.obra_id===id && r.tipo!=='inicial').at(-1);
  const closed = id => id && lastReview(id)?.tipo === 'cierre';
  async function rpc(action,payload={}) {
    const {data:result,error} = await sb.rpc('fer_inventario',{action,payload});
    if(error) throw new Error(error.message || 'No se ha podido guardar el inventario.');
    return result;
  }
  function message(text,error=false) {
    const el=$('invStatus');if(el){el.textContent=text;el.className=error?'err':'ok';}
  }
  async function refresh(messageText='') {
    data = await rpc('resumen');render();if(messageText)message(messageText);
  }
  // A failed/uncertain request retains its id and exact payload for a safe retry.
  function saveForm(form,action,makePayload,success) {
    let pending;
    form.onsubmit=async event=>{
      event.preventDefault();if(busy)return;
      let payload;try{payload=makePayload(new FormData(form));}catch(e){message(e.message,true);return;}
      if(!pending || JSON.stringify(pending.payload)!==JSON.stringify(payload))pending={payload,id:crypto.randomUUID()};
      busy=true;const controls=[...form.elements];controls.forEach(x=>x.disabled=true);message('Guardando…');
      let saved=false;
      try{await rpc(action,{...payload,request_id:pending.id});saved=true;pending=null;await refresh(success);}
      catch(e){if(saved){form.reset();message('Guardado. No se pudo actualizar la vista; pulsa Actualizar antes de continuar.',true);}else message(e.message+' Puedes reintentar.',true);}
      finally{busy=false;controls.forEach(x=>x.disabled=false);}
    };
  }
  function select(id,label,options,selected='',required=true) {
    return '<label for="'+id+'">'+label+'</label><select class="field" id="'+id+'" name="'+id+'"'+(required?' required':'')+'>'+options.map(([value,text])=>'<option value="'+escape(value)+'"'+(value===selected?' selected':'')+'>'+escape(text)+'</option>').join('')+'</select>';
  }
  const input = (id,label,type='text',extra='') => '<label for="'+id+'">'+label+'</label><input class="field" id="'+id+'" name="'+id+'" type="'+type+'" '+extra+'>';
  function locations(includeClosed=false){return [['','Almacén / Nave'],...data.obras.filter(o=>includeClosed||!closed(o.id)).map(o=>[o.id,o.label])];}
  const qty = value => {const n=Number(value);if(!Number.isSafeInteger(n)||n<1||n>100000)throw Error('La cantidad debe ser un número entero entre 1 y 100.000.');return n;};
  const details = () => input('responsable','Responsable de la entrega / recogida','text','required maxlength="120" value="'+escape(getUser().display_name)+'"')+input('fecha','Fecha del movimiento','date','required max="'+today()+'" value="'+today()+'"')+select('estado','Estado observado',[['bien','Buen estado'],['revisar','Revisar'],['averiada','Averiada']])+input('notas','Observaciones (opcional)','text','maxlength="1000"');
  function render() {
    const loc=location||null,rows=balances(loc),inWork=!!loc;
    const movements=at(loc).filter(m=>m.tipo!=='alta'||m.destino===loc);
    const initial=data.revisiones.find(r=>r.obra_id===loc&&r.tipo==='inicial');
    const pending=rows.reduce((s,h)=>s+h.cantidad,0),isClosed=closed(loc);
    $('moduleTitle').textContent='Inventario';$('moduleText').textContent='Herramientas · almacén y obras · Dirección N1';
    if($('navInventory'))$('navInventory').classList.add('active');
    const inventoryRows=rows.filter(h=>h.cantidad>0 || (inWork&&h.entradas>0));
    const sectionTabs='<div class="inv-locations" role="group" aria-label="Ubicación del inventario">'+locations(true).map(([id,label])=>'<button class="mini '+(id===location?'':'alt')+'" data-inv-location="'+id+'" aria-pressed="'+(id===location)+'">'+escape(label)+(closed(id)?' · recogida cerrada':'')+'</button>').join('')+'</div>';
    const table=inventoryRows.length?'<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>Herramienta</th>'+(inWork?'<th>Inicial</th><th>Entradas</th><th>Devuelto a nave</th><th>Otra obra</th><th>Pendiente</th>':'<th>Unidades en nave</th>')+'</tr></thead><tbody>'+inventoryRows.map(h=>{
      const start=initial?.detalle?.find(i=>i.id===h.id)?.cantidad;
      return '<tr><th scope="row">'+escape(h.nombre)+'<small>'+escape(h.codigo)+(h.marca?' · '+escape(h.marca):'')+(h.serie?' · Nº '+escape(h.serie):'')+'</small></th>'+(inWork?'<td>'+(initial?(start??0):'—')+'</td><td>'+h.entradas+'</td><td>'+h.devueltas+'</td><td>'+h.trasladadas+'</td>':'')+'<td class="'+(inWork&&h.cantidad?'inv-warning':'')+'"><b>'+h.cantidad+'</b></td></tr>';
    }).join('')+'</tbody></table></div>':'<div class="inv-empty">'+(data.herramientas.length?'No hay herramientas registradas en esta ubicación.':'Empieza dando de alta las herramientas del almacén. No hay existencias cargadas todavía.')+'</div>';
    $('moduleContent').innerHTML='<style>.inv-locations{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0}.inv-locations button{min-height:44px;text-align:left}.inv-panel{padding:16px;border:1px solid #334155;border-radius:16px;margin:14px 0;background:#101b2d}.inv-panel h3{margin-top:0}.inv-panel label{display:block;margin-top:10px;font-size:14px}.inv-panel summary{cursor:pointer;font-weight:700;min-height:28px}.inv-panel .field{font-size:16px}.inv-stats{display:flex;flex-wrap:wrap;gap:12px}.inv-stat{flex:1;min-width:115px;background:#0b1627;border-radius:12px;padding:12px}.inv-stat strong{display:block;font-size:26px;margin-top:6px}.inv-warning{color:#fcd34d}.inv-table-wrap{overflow-x:auto}.inv-table{width:100%;border-collapse:collapse;font-size:14px}.inv-table th,.inv-table td{padding:12px 9px;text-align:left;border-bottom:1px solid #263449}.inv-table th:first-child{min-width:160px}.inv-table small{display:block;color:#94a3b8;font-weight:400;margin-top:4px}.inv-empty{padding:24px 0;color:#cbd5e1}.inv-history{max-height:420px;overflow:auto}.inv-inline{display:flex;gap:8px;flex-wrap:wrap}.inv-inline>*{flex:1;min-width:120px}.inv-panel button:disabled{opacity:.5}.inv-panel p{line-height:1.5}.inv-panel small{color:#94a3b8}#invStatus{margin:12px 0;line-height:1.5;white-space:pre-wrap}</style>'+sectionTabs+
      '<div class="inv-panel"><h3>'+escape(name(loc))+'</h3><div class="inv-stats"><div class="inv-stat">'+(inWork?'Por recoger':'En almacén')+'<strong>'+pending+'</strong></div><div class="inv-stat">Herramientas distintas<strong>'+rows.filter(h=>h.cantidad>0).length+'</strong></div>'+(inWork?'<div class="inv-stat">Recogida<strong style="font-size:18px">'+(isClosed?'Cerrada':'Abierta')+'</strong></div>':'')+'</div><p class="muted">'+(inWork?'El inventario inicial se conserva. Las entradas posteriores y todas las devoluciones quedan en el historial.':'Da de alta las existencias reales y registra cada salida hacia una obra. Las devoluciones vuelven a sumar aquí.')+'</p>'+table+'<div class="actions"><button class="mini alt" id="invRefresh">Actualizar</button><button class="mini alt" id="invExport">Descargar inventario CSV</button></div></div>'+
      '<div id="invStatus" role="status" aria-live="polite"></div>'+
      (inWork?'<div class="inv-panel"><h3>Comprobación de la obra</h3><p>'+(initial?'Inventario inicial fijado el '+escape(date(initial.created_at))+'.':'Aún no se ha fijado el inventario inicial. Registra las herramientas que hay al arrancar y guárdalo antes de empezar las devoluciones.')+'</p>'+(!initial&&!isClosed?'<button class="mini" id="invInitial" '+(!pending?'disabled':'')+'>Fijar inventario inicial</button>':'')+'<p>'+ (isClosed?'Recogida cerrada el '+escape(date(lastReview(loc).created_at))+'. El historial permanece disponible.':pending?'Quedan '+pending+' unidades por recoger o trasladar.':'No quedan unidades pendientes en esta obra.')+'</p><button class="mini alt" id="invClose" '+(!isClosed&&(pending>0||!movements.length)?'disabled':'')+'>'+(isClosed?'Reabrir recogida':'Cerrar recogida')+'</button><p class="muted">Este cierre corresponde a las herramientas; no cambia el estado administrativo de la obra.</p></div>':'')+
      (!isClosed?'<details class="inv-panel" '+(!data.herramientas.length?'open':'')+'><summary>＋ Dar de alta una herramienta</summary><form id="invAdd">'+input('nombre','Herramienta','text','required maxlength="160" placeholder="Ej.: Martillo picador"')+input('codigo','Código identificativo (opcional)','text','maxlength="80" placeholder="Automático si lo dejas vacío"')+input('marca','Marca / modelo (opcional)','text','maxlength="160"')+input('serie','Número de serie (opcional)','text','maxlength="120"')+input('cantidad','Cantidad','number','required min="1" max="100000" step="1" value="1"')+select('destino','Ubicación actual',locations(),location)+details()+'<button class="btn">Guardar herramienta</button><small>Para máquinas con número de serie, usa una ficha por unidad.</small></form></details>':'')+
      (data.herramientas.length&&!isClosed?'<details class="inv-panel"><summary>⇄ Registrar salida, devolución o traslado</summary><form id="invMove">'+select('origen','Desde',locations(),location)+select('destino','Hacia',locations(),location?'':(data.obras.find(o=>!closed(o.id))?.id||''))+select('herramienta','Herramienta',[])+input('cantidad','Cantidad','number','required min="1" max="100000" step="1" value="1"')+'<div id="invAvailable" class="muted"></div>'+details()+'<button class="btn">Guardar movimiento</button></form></details>':'')+
      (data.herramientas.length&&!inWork?'<details class="inv-panel"><summary>＋ Añadir existencias a una herramienta registrada</summary><form id="invStock">'+select('herramienta','Herramienta',data.herramientas.map(h=>[h.id,h.codigo+' · '+h.nombre]))+input('cantidad','Unidades que se incorporan','number','required min="1" max="100000" step="1" value="1"')+details()+'<button class="btn">Guardar entrada en nave</button><small>Usa esta opción para compras o existencias nuevas. Para una devolución desde obra, registra un movimiento.</small></form></details>':'')+
      '<details class="inv-panel"><summary>Historial de movimientos ('+movements.length+')</summary><div class="inv-history">'+(movements.length?movements.slice().reverse().map(m=>'<div class="userrow"><b>'+escape(data.herramientas.find(h=>h.id===m.herramienta_id)?.nombre)+' · '+m.cantidad+' ud.</b><div>'+escape(m.tipo==='alta'?'Alta de existencias':name(m.origen))+' → '+escape(name(m.destino))+'</div><div>'+escape(m.fecha)+' · '+escape(m.responsable)+' · '+escape({bien:'Buen estado',revisar:'Revisar',averiada:'Averiada'}[m.estado])+'</div>'+(m.notas?'<div>'+escape(m.notas)+'</div>':'')+'<small>Registrado por '+escape(m.registrado_por)+' · '+escape(date(m.created_at))+'</small></div>').join(''):'<p class="muted">Sin movimientos.</p>')+'</div></details>'+
      (inWork?'<details class="inv-panel"><summary>Inventarios guardados y cierres</summary>'+data.revisiones.filter(r=>r.obra_id===loc).map(r=>'<div class="userrow"><b>'+({inicial:'Inventario inicial',cierre:'Cierre de recogida',reapertura:'Reapertura'}[r.tipo])+'</b><div>'+escape(date(r.created_at))+' · '+escape(r.registrado_por)+'</div>'+(r.detalle||[]).map(h=>'<div>'+escape(h.nombre)+' · '+h.cantidad+' ud.</div>').join('')+'</div>').join('')+'</details>':'');
    document.querySelectorAll('[data-inv-location]').forEach(b=>b.onclick=()=>{if(busy)return;location=b.dataset.invLocation;render();});
    // Field names stay stable for FormData; IDs are unique across the three forms.
    for(const form of document.querySelectorAll('#invAdd,#invMove,#invStock')){
      for(const field of form.querySelectorAll('input,select')){
        const old=field.id;field.id=form.id+'_'+old;
        const label=form.querySelector('label[for="'+old+'"]');if(label)label.htmlFor=field.id;
      }
    }
    $('invRefresh').onclick=()=>refresh().catch(e=>message(e.message,true));
    $('invExport').onclick=()=>exportCSV(loc,rows,initial);
    const common=f=>({cantidad:qty(f.get('cantidad')),responsable:f.get('responsable'),fecha:f.get('fecha'),estado:f.get('estado'),notas:f.get('notas')});
    if($('invAdd'))saveForm($('invAdd'),'alta',f=>({...common(f),nombre:f.get('nombre'),codigo:f.get('codigo'),marca:f.get('marca'),serie:f.get('serie'),destino:f.get('destino')||null}),'Herramienta guardada.');
    if($('invStock'))saveForm($('invStock'),'entrada',f=>({...common(f),herramienta_id:f.get('herramienta')}),'Entrada guardada en Almacén / Nave.');
    if($('invMove')){
      const form=$('invMove'),source=form.elements.origen,tool=form.elements.herramienta;
      function available(){const h=balances(source.value||null).find(h=>h.id===tool.value);form.elements.cantidad.max=h?.cantidad||0;$('invAvailable').textContent=(h?.cantidad||0)+' unidades disponibles en '+name(source.value||null);}
      function populate(){tool.innerHTML=balances(source.value||null).filter(h=>h.cantidad>0).map(h=>'<option value="'+h.id+'">'+escape(h.codigo+' · '+h.nombre)+'</option>').join('');if(!tool.options.length)tool.innerHTML='<option value="">Sin existencias</option>';available();}
      source.onchange=populate;tool.onchange=available;populate();
      saveForm(form,'mover',f=>{if(f.get('origen')===f.get('destino'))throw Error('El origen y el destino deben ser distintos.');if(!f.get('herramienta'))throw Error('No hay herramientas disponibles en el origen.');return {...common(f),herramienta_id:f.get('herramienta'),origen:f.get('origen')||null,destino:f.get('destino')||null};},'Movimiento guardado. Existencias actualizadas.');
    }
    if($('invInitial'))$('invInitial').onclick=()=>review('inicial','Se guardará como inventario inicial la lista actual de '+name(loc)+'. ¿Está completa?');
    if($('invClose'))$('invClose').onclick=()=>review(isClosed?'reabrir':'cerrar',isClosed?'¿Reabrir la recogida para registrar nuevos movimientos?':'No quedan herramientas pendientes. ¿Cerrar la recogida de esta obra?');
  }
  async function review(action,prompt){
    if(busy||!window.confirm(prompt))return;busy=true;
    try{await rpc(action,{obra_id:location,request_id:crypto.randomUUID()});await refresh(action==='inicial'?'Inventario inicial conservado.':action==='cerrar'?'Recogida cerrada.':'Recogida reabierta.');}
    catch(e){message(e.message,true);}finally{busy=false;}
  }
  function exportCSV(loc,rows,initial){
    const lines=[['Ubicación','Código','Herramienta','Marca / modelo','Nº serie','Inicial','Entradas','Devuelto a nave','Trasladado','Existencias / pendiente']];
    for(const h of rows.filter(h=>loc?h.entradas>0:h.cantidad>0))lines.push([name(loc),h.codigo,h.nombre,h.marca,h.serie,initial?(initial.detalle.find(i=>i.id===h.id)?.cantidad||0):'',h.entradas,loc?h.devueltas:'',loc?h.trasladadas:'',h.cantidad]);
    const csv='\uFEFF'+lines.map(row=>row.map(value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='FERVAL_inventario_'+(loc?(data.obras.find(o=>o.id===loc)?.codigo||'obra'):'almacen')+'_'+today()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return {async open(obra=''){
    const request=++generation;
    showView('moduleView');$('moduleTitle').textContent='Inventario';$('moduleText').textContent='Almacén / Nave y obras';
    if(getUser()?.access_level!=='N1'){$('moduleContent').textContent='El inventario lo gestiona Dirección N1.';return;}
    $('moduleContent').textContent='Cargando inventario…';
    try{const result=await rpc('resumen');if(request!==generation)return;data=result;location=obra;render();}catch(e){$('moduleContent').textContent='No se pudo cargar el inventario: '+e.message;}
  }};
}
