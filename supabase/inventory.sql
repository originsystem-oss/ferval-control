-- Inventory v1. Separate from legacy herramientas (empty at rollout).
-- No direct client writes: movements, stock and snapshots share one transaction.
create table private.fer_inv_herramientas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (length(codigo) between 1 and 80),
  nombre text not null check (length(nombre) between 1 and 160),
  marca text not null default '' check (length(marca)<=160),
  serie text not null default '' check (length(serie)<=120),
  created_at timestamptz not null default now()
);
create table private.fer_inv_movimientos (
  id uuid primary key default gen_random_uuid(),
  herramienta_id uuid not null references private.fer_inv_herramientas(id),
  tipo text not null check (tipo in ('alta','traslado')),
  origen uuid references public.obras(id),
  destino uuid references public.obras(id),
  cantidad integer not null check (cantidad between 1 and 100000),
  fecha date not null,
  responsable text not null check (length(responsable) between 1 and 120),
  estado text not null check (estado in ('bien','revisar','averiada')),
  notas text not null default '' check (length(notas)<=1000),
  actor uuid not null,
  registrado_por text not null,
  created_at timestamptz not null default clock_timestamp(),
  check ((tipo='alta' and origen is null) or (tipo='traslado' and origen is distinct from destino))
);
create index fer_inv_mov_herramienta_idx on private.fer_inv_movimientos(herramienta_id);
create index fer_inv_mov_origen_idx on private.fer_inv_movimientos(origen);
create index fer_inv_mov_destino_idx on private.fer_inv_movimientos(destino);
create table private.fer_inv_revisiones (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id),
  tipo text not null check (tipo in ('inicial','cierre','reapertura')),
  detalle jsonb not null,
  actor uuid not null,
  registrado_por text not null,
  created_at timestamptz not null default clock_timestamp()
);
create unique index fer_inv_initial_unique on private.fer_inv_revisiones(obra_id) where tipo='inicial';
create index fer_inv_review_work_idx on private.fer_inv_revisiones(obra_id,created_at desc);
create table private.fer_inv_peticiones (
  request_id uuid primary key,
  actor uuid not null,
  action text not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table private.fer_inv_herramientas enable row level security;
alter table private.fer_inv_movimientos enable row level security;
alter table private.fer_inv_revisiones enable row level security;
alter table private.fer_inv_peticiones enable row level security;
revoke all on private.fer_inv_herramientas,private.fer_inv_movimientos,private.fer_inv_revisiones,private.fer_inv_peticiones from public,anon,authenticated;

-- Private privileged API is intentional: it is the only writer of this ledger,
-- checks current active N1 membership on every call, and cannot change other data.
create function private.fer_inventario(action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  actor_name text;
  req uuid;
  previous private.fer_inv_peticiones%rowtype;
  tool uuid;
  src uuid;
  dst uuid;
  obra uuid;
  units integer;
  available bigint;
  movement_date date;
  code text;
  condition text;
  responsible text;
  notes text;
  serial_no text;
  snapshot jsonb;
  result jsonb;
  last_type text;
  location_id uuid;
begin
  if uid is null or not private.is_n1() then
    raise exception 'El inventario lo gestiona Dirección N1.' using errcode='42501';
  end if;
  select coalesce(display_name,'Dirección') into actor_name from public.app_profiles where user_id=uid and active;
  if actor_name is null then raise exception 'Cuenta no habilitada.' using errcode='42501'; end if;
  if action='resumen' then
    return jsonb_build_object(
      'obras',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'codigo',o.codigo,'label',concat_ws(' · ',o.codigo,o.nombre),'estado',o.estado) order by o.codigo,o.id) from public.obras o),'[]'::jsonb),
      'herramientas',coalesce((select jsonb_agg(to_jsonb(h) order by h.nombre,h.id) from private.fer_inv_herramientas h),'[]'::jsonb),
      'movimientos',coalesce((select jsonb_agg(to_jsonb(m)-'actor' order by m.created_at,m.id) from private.fer_inv_movimientos m),'[]'::jsonb),
      'revisiones',coalesce((select jsonb_agg(to_jsonb(r)-'actor' order by r.created_at,r.id) from private.fer_inv_revisiones r),'[]'::jsonb)
    );
  end if;
  if action is null or action not in ('alta','entrada','mover','inicial','cerrar','reabrir') then raise exception 'Operación de inventario no válida.'; end if;
  if jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>12000 then raise exception 'Datos de inventario no válidos.'; end if;
  req := nullif(payload->>'request_id','')::uuid;
  if req is null then raise exception 'Falta identificador de la operación.'; end if;
  -- Short global ledger lock prevents concurrent overspending and closure races.
  perform pg_catalog.pg_advisory_xact_lock(638940271::bigint);
  select * into previous from private.fer_inv_peticiones where request_id=req;
  if found then
    if previous.actor<>uid or previous.action<>action or previous.payload<>payload then raise exception 'Identificador reutilizado con datos distintos.'; end if;
    return previous.result;
  end if;

  if action in ('alta','entrada','mover') then
    if coalesce(payload->>'cantidad','') !~ '^[0-9]{1,6}$' then raise exception 'La cantidad debe ser un número entero positivo.'; end if;
    units := (payload->>'cantidad')::integer;
    if units<1 or units>100000 then raise exception 'Cantidad fuera de rango (1–100.000).'; end if;
    movement_date := (payload->>'fecha')::date;
    if movement_date is null or movement_date > (now() at time zone 'Europe/Madrid')::date then raise exception 'Indica una fecha válida, no futura.'; end if;
    responsible := btrim(coalesce(payload->>'responsable',''));
    notes := btrim(coalesce(payload->>'notas',''));
    condition := coalesce(payload->>'estado','bien');
    if length(responsible) not between 1 and 120 or length(notes)>1000 or condition not in ('bien','revisar','averiada') then raise exception 'Revisa responsable, estado y observaciones.'; end if;
    dst := nullif(payload->>'destino','')::uuid;
    src := case when action='mover' then nullif(payload->>'origen','')::uuid else null end;
    if action='entrada' then dst:=null; end if;
    if action='mover' and src is not distinct from dst then raise exception 'El origen y el destino deben ser distintos.'; end if;
    foreach location_id in array array[src,dst] loop
      if location_id is not null then
        if not exists(select 1 from public.obras where id=location_id) then raise exception 'La obra seleccionada no existe.'; end if;
        select tipo into last_type from private.fer_inv_revisiones where obra_id=location_id and tipo<>'inicial' order by created_at desc,id desc limit 1;
        if last_type='cierre' then raise exception 'La recogida está cerrada. Reábrela antes de registrar movimientos.'; end if;
      end if;
    end loop;
    if action='alta' then
      tool := gen_random_uuid();
      code := coalesce(nullif(btrim(payload->>'codigo'),''),'FV-'||upper(substr(replace(tool::text,'-',''),1,10)));
      serial_no := btrim(coalesce(payload->>'serie',''));
      if serial_no<>'' and units<>1 then raise exception 'Las herramientas con número de serie se registran de una en una.'; end if;
      insert into private.fer_inv_herramientas(id,codigo,nombre,marca,serie)
      values(tool,code,btrim(coalesce(payload->>'nombre','')),btrim(coalesce(payload->>'marca','')),serial_no);
    else
      tool := (payload->>'herramienta_id')::uuid;
      select serie into serial_no from private.fer_inv_herramientas where id=tool;
      if not found then raise exception 'La herramienta seleccionada no existe.'; end if;
      if action='entrada' and serial_no<>'' then raise exception 'Esta ficha identifica una sola máquina. Crea otra ficha para una máquina nueva.'; end if;
    end if;
    if action='mover' then
      select coalesce(sum(case when destino is not distinct from src then cantidad else 0 end - case when tipo='traslado' and origen is not distinct from src then cantidad else 0 end),0)
      into available from private.fer_inv_movimientos where herramienta_id=tool;
      if available<units then raise exception 'No hay unidades suficientes en el origen (disponibles: %).',available; end if;
    end if;
    insert into private.fer_inv_movimientos(herramienta_id,tipo,origen,destino,cantidad,fecha,responsable,estado,notas,actor,registrado_por)
    values(tool,case when action='mover' then 'traslado' else 'alta' end,src,dst,units,movement_date,responsible,condition,notes,uid,actor_name);
    result := jsonb_build_object('ok',true,'herramienta_id',tool,'request_id',req);
  else
    obra := (payload->>'obra_id')::uuid;
    if obra is null or not exists(select 1 from public.obras where id=obra) then raise exception 'Selecciona una obra válida.'; end if;
    select tipo into last_type from private.fer_inv_revisiones where obra_id=obra and tipo<>'inicial' order by created_at desc,id desc limit 1;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'codigo',x.codigo,'nombre',x.nombre,'cantidad',x.cantidad) order by x.nombre,x.id),'[]'::jsonb)
    into snapshot from (
      select h.id,h.codigo,h.nombre,sum(case when m.destino=obra then m.cantidad else 0 end - case when m.tipo='traslado' and m.origen=obra then m.cantidad else 0 end) as cantidad
      from private.fer_inv_herramientas h join private.fer_inv_movimientos m on m.herramienta_id=h.id
      where m.origen=obra or m.destino=obra group by h.id
    ) x;
    select coalesce(sum((x->>'cantidad')::bigint),0) into available from jsonb_array_elements(snapshot) x;
    if action='inicial' then
      if last_type='cierre' then raise exception 'La recogida está cerrada.'; end if;
      if exists(select 1 from private.fer_inv_revisiones where obra_id=obra and tipo='inicial') then raise exception 'El inventario inicial ya está guardado; no se puede sobrescribir.'; end if;
      if exists(select 1 from private.fer_inv_movimientos where origen=obra and tipo='traslado') then raise exception 'Ya se han registrado salidas de esta obra. El historial conserva todas las entregas; no se puede presentar el saldo actual como inventario inicial.'; end if;
      if available<=0 then raise exception 'Registra primero las herramientas iniciales de la obra.'; end if;
    elsif action='cerrar' then
      if last_type='cierre' then raise exception 'La recogida ya está cerrada.'; end if;
      if available<>0 then raise exception 'Quedan % unidades pendientes de recoger o trasladar.',available; end if;
      if snapshot='[]'::jsonb then raise exception 'Esta obra todavía no tiene movimientos de herramientas.'; end if;
    elsif action='reabrir' and last_type is distinct from 'cierre' then
      raise exception 'La recogida no está cerrada.';
    end if;
    insert into private.fer_inv_revisiones(obra_id,tipo,detalle,actor,registrado_por)
    values(obra,case action when 'cerrar' then 'cierre' when 'reabrir' then 'reapertura' else 'inicial' end,snapshot,uid,actor_name);
    result := jsonb_build_object('ok',true,'obra_id',obra,'request_id',req);
  end if;
  insert into private.fer_inv_peticiones(request_id,actor,action,payload,result) values(req,uid,action,payload,result);
  return result;
end;
$$;
revoke all on function private.fer_inventario(text,jsonb) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.fer_inventario(text,jsonb) to authenticated;

create function public.fer_inventario(action text,payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select private.fer_inventario(action,payload);
$$;
revoke all on function public.fer_inventario(text,jsonb) from public,anon;
grant execute on function public.fer_inventario(text,jsonb) to authenticated;
comment on function public.fer_inventario(text,jsonb) is 'N1 inventory: atomic, idempotent stock transfers, immutable opening snapshots and collection closure.';
notify pgrst, 'reload schema';
