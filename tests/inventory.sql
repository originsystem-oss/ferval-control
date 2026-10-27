-- Run as postgres against the configured database. All fixtures roll back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.app_profiles where active and access_level='N1' order by user_id limit 1),'role','authenticated')::text,true);
select set_config('test.inv_works',(select jsonb_agg(id order by codigo)::text from public.obras),true);
set local role authenticated;
do $$
declare
  w1 uuid := (current_setting('test.inv_works')::jsonb->>0)::uuid;
  w2 uuid := (current_setting('test.inv_works')::jsonb->>1)::uuid;
  tool uuid;
  payload jsonb;
  state jsonb;
  before_count integer;
  after_count integer;
  amount bigint;
begin
  payload:=jsonb_build_object('request_id',gen_random_uuid(),'nombre','PRUEBA TRANSACCIONAL - NO PERSISTIR','cantidad',5,'fecha',(now() at time zone 'Europe/Madrid')::date,'responsable','Prueba','estado','bien');
  tool:=(public.fer_inventario('alta',payload)->>'herramienta_id')::uuid;
  perform public.fer_inventario('alta',payload); -- same operation retried
  state:=public.fer_inventario('resumen');
  select count(*) into after_count from jsonb_array_elements(state->'movimientos') m where m->>'herramienta_id'=tool::text;
  assert after_count=1,'Retry duplicated stock';
  begin
    perform public.fer_inventario('alta',payload||'{"cantidad":6}');
    raise exception 'FAIL: idempotency conflict accepted';
  exception when others then if sqlerrm not like 'Identificador reutilizado%' then raise; end if; end;
  payload:=jsonb_build_object('request_id',gen_random_uuid(),'herramienta_id',tool,'cantidad',3,'fecha',(now() at time zone 'Europe/Madrid')::date,'responsable','Prueba','estado','bien','origen',null,'destino',w1);
  perform public.fer_inventario('mover',payload);
  perform public.fer_inventario('inicial',jsonb_build_object('request_id',gen_random_uuid(),'obra_id',w1));
  begin
    perform public.fer_inventario('inicial',jsonb_build_object('request_id',gen_random_uuid(),'obra_id',w1));
    raise exception 'FAIL: snapshot overwritten';
  exception when others then if sqlerrm not like 'El inventario inicial ya%' then raise; end if; end;
  begin
    perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',3));
    raise exception 'FAIL: negative stock allowed';
  exception when others then if sqlerrm not like 'No hay unidades suficientes%' then raise; end if; end;
  begin
    perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',1.5));
    raise exception 'FAIL: fractional stock allowed';
  exception when others then if sqlerrm not like 'La cantidad debe%' then raise; end if; end;
  begin
    perform public.fer_inventario('cerrar',jsonb_build_object('request_id',gen_random_uuid(),'obra_id',w1));
    raise exception 'FAIL: closure with pending tools';
  exception when others then if sqlerrm not like 'Quedan %' then raise; end if; end;
  perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',1,'origen',w1,'destino',null,'estado','averiada'));
  begin
    perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',3,'origen',w1,'destino',null));
    raise exception 'FAIL: excessive return allowed';
  exception when others then if sqlerrm not like 'No hay unidades suficientes%' then raise; end if; end;
  perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',2,'origen',w1,'destino',w2));
  perform public.fer_inventario('cerrar',jsonb_build_object('request_id',gen_random_uuid(),'obra_id',w1));
  begin
    perform public.fer_inventario('mover',payload||jsonb_build_object('request_id',gen_random_uuid(),'cantidad',1));
    raise exception 'FAIL: movement into closed collection';
  exception when others then if sqlerrm not like 'La recogida está cerrada%' then raise; end if; end;
  perform public.fer_inventario('reabrir',jsonb_build_object('request_id',gen_random_uuid(),'obra_id',w1));
  state:=public.fer_inventario('resumen');
  select (h->>'cantidad')::bigint into amount from jsonb_array_elements(state->'revisiones') r cross join lateral jsonb_array_elements(r->'detalle') h where r->>'obra_id'=w1::text and r->>'tipo'='inicial' and h->>'id'=tool::text;
  assert amount=3,'Opening snapshot changed after returns';
  select sum(case when m->>'destino' is null then (m->>'cantidad')::bigint else 0 end - case when m->>'tipo'='traslado' and m->>'origen' is null then (m->>'cantidad')::bigint else 0 end) into amount from jsonb_array_elements(state->'movimientos') m where m->>'herramienta_id'=tool::text;
  assert amount=3,'Warehouse balance incorrect';
  assert not has_table_privilege('authenticated','private.fer_inv_movimientos','DELETE'),'Client may delete ledger';
end;
$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.app_profiles where active and access_level='N2' order by user_id limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$begin
  begin perform public.fer_inventario('resumen');raise exception 'FAIL: N2 read permitted';exception when insufficient_privilege then null;end;
  begin perform public.fer_inventario('alta','{}');raise exception 'FAIL: N2 write permitted';exception when insufficient_privilege then null;end;
end;$$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$begin
  begin perform public.fer_inventario('resumen');raise exception 'FAIL: anonymous read permitted';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: stock, retries, invalid quantities, returns, transfers, opening snapshot, closure, reopen, N1/N2/anonymous permissions; all fixtures rolled back' as result;
