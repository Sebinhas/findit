-- =====================================================================
-- FindIt — Esquema completo para Supabase
-- Pegar TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Es idempotente en lo posible, pero está pensado para un proyecto vacío.
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------
create type public.user_role         as enum ('user', 'admin');
create type public.item_type         as enum ('LOST', 'FOUND');
create type public.item_status       as enum ('ACTIVE', 'RESOLVED', 'CLOSED');
create type public.claim_status      as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
create type public.match_status      as enum ('ACTIVE', 'CLOSED');
create type public.notification_type as enum (
  'CLAIM_RECEIVED', 'CLAIM_ACCEPTED', 'CLAIM_REJECTED', 'CLAIM_CANCELLED',
  'CLAIM_COMPLETED', 'MATCH_FOUND', 'ITEM_HIDDEN', 'SYSTEM'
);
create type public.report_reason     as enum ('SPAM', 'INAPPROPRIATE', 'FRAUD', 'SENSITIVE_DATA', 'OTHER');
create type public.report_status     as enum ('PENDING', 'REVIEWED', 'DISMISSED');

-- ---------------------------------------------------------------------
-- 2. TABLAS
-- ---------------------------------------------------------------------

-- Perfil público de cada usuario (las credenciales viven en auth.users).
-- El email NO se guarda aquí para no exponerlo a otros usuarios.
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  first_name     varchar(80) not null default '',
  last_name      varchar(80) not null default '',
  role           public.user_role not null default 'user',
  avatar_url     varchar(500),
  is_active      boolean not null default true,
  blocked_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       varchar(80) not null unique,
  slug       varchar(80) not null unique,
  icon       varchar(50),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(120) not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid not null references public.categories(id),
  location_id     uuid not null references public.locations(id),
  location_detail varchar(200),
  type            public.item_type not null,
  title           varchar(120) not null check (char_length(trim(title)) >= 3),
  description     text not null check (char_length(trim(description)) >= 10),
  incident_date   date not null check (incident_date <= current_date + 1),
  image_url       varchar(500),
  custody_info    text,                        -- dónde está / cómo coordinar (FOUND)
  status          public.item_status not null default 'ACTIVE',
  resolved_at     timestamptz,
  is_hidden       boolean not null default false,
  hidden_reason   text,
  hidden_by_id    uuid references public.profiles(id),
  hidden_at       timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index items_type_idx     on public.items(type);
create index items_status_idx   on public.items(status);
create index items_category_idx on public.items(category_id);
create index items_location_idx on public.items(location_id);
create index items_date_idx     on public.items(incident_date);
create index items_user_idx     on public.items(user_id);

-- Características privadas de verificación: tabla aparte para que NUNCA
-- salgan en consultas públicas (RLS: solo el dueño y admin).
create table public.item_private_details (
  item_id    uuid primary key references public.items(id) on delete cascade,
  details    text not null,
  updated_at timestamptz not null default now()
);

create table public.matches (
  id                    uuid primary key default gen_random_uuid(),
  lost_item_id          uuid not null references public.items(id) on delete cascade,
  found_item_id         uuid not null references public.items(id) on delete cascade,
  score                 smallint not null,
  category_score        smallint not null,
  keyword_score         smallint not null,
  location_score        smallint not null,
  date_score            smallint not null,
  status                public.match_status not null default 'ACTIVE',
  lost_owner_dismissed  boolean not null default false,
  found_owner_dismissed boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (lost_item_id, found_item_id)
);

create table public.claims (
  id                   uuid primary key default gen_random_uuid(),
  item_id              uuid not null references public.items(id) on delete cascade,
  requester_id         uuid not null references public.profiles(id) on delete cascade,
  lost_item_id         uuid references public.items(id) on delete set null,
  message              text not null,
  lost_location_id     uuid references public.locations(id),
  lost_location_detail varchar(200),
  lost_date            date,
  ownership_details    text not null,
  status               public.claim_status not null default 'PENDING',
  response_message     text,
  reviewed_at          timestamptz,
  cancelled_at         timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index claims_item_idx      on public.claims(item_id);
create index claims_requester_idx on public.claims(requester_id);
-- Evita solicitudes activas duplicadas del mismo usuario sobre el mismo objeto
create unique index claims_one_active_per_user
  on public.claims(item_id, requester_id) where status in ('PENDING', 'ACCEPTED');
-- Solo una devolución confirmada por publicación
create unique index claims_one_completed_per_item
  on public.claims(item_id) where status = 'COMPLETED';

create table public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  type                public.notification_type not null,
  title               varchar(150) not null,
  message             text not null,
  related_entity_type varchar(30),
  related_entity_id   uuid,
  is_read             boolean not null default false,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, is_read);

create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  item_id         uuid not null references public.items(id) on delete cascade,
  reason          public.report_reason not null,
  description     text,
  status          public.report_status not null default 'PENDING',
  reviewed_by_id  uuid references public.profiles(id),
  reviewed_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. HELPERS
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active);
$$;

create or replace function public.notify(
  p_user uuid, p_type public.notification_type, p_title text, p_message text,
  p_entity_type text default null, p_entity_id uuid default null
) returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, type, title, message, related_entity_type, related_entity_id)
  values (p_user, p_type, p_title, p_message, p_entity_type, p_entity_id);
$$;
revoke execute on function public.notify from public, anon, authenticated;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','categories','locations','items','matches','claims','reports'] loop
    execute format('create trigger %I_touch before update on public.%I
                    for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- Crea el perfil automáticamente al registrarse (nombre/apellido vienen en metadata)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, first_name, last_name)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'first_name', ''),
          coalesce(new.raw_user_meta_data->>'last_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un usuario no puede auto-asignarse admin ni desbloquearse
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() nulo = consulta directa desde el SQL Editor (dueño de la BD): permitido
  if auth.uid() is not null and not is_admin() and (new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.blocked_reason is distinct from old.blocked_reason) then
    raise exception 'No tienes permiso para cambiar el rol o el estado de la cuenta';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Reglas de edición de publicaciones para usuarios normales
create or replace function public.guard_item_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if new.user_id <> old.user_id or new.type <> old.type then
    raise exception 'No se puede cambiar el dueño ni el tipo de la publicación';
  end if;
  if new.is_hidden is distinct from old.is_hidden or new.hidden_reason is distinct from old.hidden_reason
     or new.hidden_by_id is distinct from old.hidden_by_id then
    raise exception 'Solo un administrador puede moderar publicaciones';
  end if;
  if old.status <> 'ACTIVE' and new.deleted_at is not distinct from old.deleted_at then
    raise exception 'Una publicación resuelta o cerrada ya no se puede editar';
  end if;
  if new.status = 'RESOLVED' and old.status <> 'RESOLVED' then new.resolved_at = now(); end if;
  return new;
end $$;
create trigger items_guard before update on public.items
  for each row execute function public.guard_item_update();

-- ---------------------------------------------------------------------
-- 4. ALGORITMO DE COINCIDENCIAS (reglas, sin IA)
--    Categoría 30 + Palabras clave 30 + Ubicación 25 + Fecha 15 = 100
-- ---------------------------------------------------------------------
create or replace function public.normalize_keywords(p_text text) returns text[]
language sql stable set search_path = public, extensions as $$
  select coalesce(array_agg(distinct w), '{}')
  from regexp_split_to_table(
         regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9 ]', ' ', 'g'),
         '\s+') as w
  where char_length(w) >= 3
    and w not in ('los','las','del','una','uno','unos','unas','con','sin','por','para','que','muy',
                  'mas','este','esta','estos','estas','ese','esa','cerca','color','tiene','tenia',
                  'perdi','encontre','encontrado','perdido','objeto','donde','cuando','dia','the','and');
$$;

create or replace function public.score_pair(p_lost public.items, p_found public.items)
returns table(category_score int, keyword_score int, location_score int, date_score int)
language plpgsql stable set search_path = public as $$
declare
  c_date_window constant int := 14;  -- días: ventana de cercanía temporal (configurable)
  v_shared int;
  v_days int;
begin
  -- Misma categoría: 30
  category_score := case when p_lost.category_id = p_found.category_id then 30 else 0 end;

  -- Palabras clave (título + descripción pública): 10 puntos por palabra compartida, máx 30
  select count(*) into v_shared
  from unnest(normalize_keywords(p_lost.title || ' ' || p_lost.description)) a
  where a = any(normalize_keywords(p_found.title || ' ' || p_found.description));
  keyword_score := least(30, v_shared * 10);

  -- Ubicación: mismo lugar 25; si no, detalle de texto parecido 10
  location_score := case
    when p_lost.location_id = p_found.location_id then 25
    when p_lost.location_detail is not null and p_found.location_detail is not null
         and lower(extensions.unaccent(p_lost.location_detail)) = lower(extensions.unaccent(p_found.location_detail)) then 10
    else 0 end;

  -- Fecha: 15 si es el mismo día, decrece linealmente hasta 0 en la ventana.
  -- Si el objeto "se encontró" más de 1 día ANTES de perderse, no puede ser el mismo: 0.
  v_days := p_found.incident_date - p_lost.incident_date;
  date_score := case
    when v_days < -1 then 0
    else greatest(0, round(15.0 * (1 - abs(v_days)::numeric / c_date_window)))::int end;
  return next;
end $$;

create or replace function public.recompute_matches(p_item_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  c_threshold constant int := 45;   -- puntuación mínima para considerarlo "posible coincidencia"
  v_item items;
  v_other items;
  v_lost items;
  v_found items;
  s record;
  v_total int;
  v_match_id uuid;
  v_inserted boolean;
begin
  select * into v_item from items where id = p_item_id;
  if v_item is null then return; end if;

  -- Si la publicación ya no está disponible, se cierran sus coincidencias
  if v_item.status <> 'ACTIVE' or v_item.is_hidden or v_item.deleted_at is not null then
    update matches set status = 'CLOSED'
    where (lost_item_id = p_item_id or found_item_id = p_item_id) and status = 'ACTIVE';
    return;
  end if;

  for v_other in
    select * from items
    where type <> v_item.type and id <> v_item.id and user_id <> v_item.user_id
      and status = 'ACTIVE' and not is_hidden and deleted_at is null
  loop
    if v_item.type = 'LOST' then v_lost := v_item; v_found := v_other;
    else v_lost := v_other; v_found := v_item; end if;

    select * into s from score_pair(v_lost, v_found);
    v_total := s.category_score + s.keyword_score + s.location_score + s.date_score;

    if v_total >= c_threshold then
      insert into matches(lost_item_id, found_item_id, score, category_score, keyword_score, location_score, date_score)
      values (v_lost.id, v_found.id, v_total, s.category_score, s.keyword_score, s.location_score, s.date_score)
      on conflict (lost_item_id, found_item_id) do update
        set score = excluded.score, category_score = excluded.category_score,
            keyword_score = excluded.keyword_score, location_score = excluded.location_score,
            date_score = excluded.date_score, status = 'ACTIVE'
      returning id, (xmax = 0) into v_match_id, v_inserted;

      if v_inserted then
        perform notify(v_lost.user_id, 'MATCH_FOUND', 'Posible coincidencia',
          format('Alguien encontró algo parecido a "%s" (%s%% de coincidencia).', v_lost.title, v_total),
          'item', v_found.id);
        perform notify(v_found.user_id, 'MATCH_FOUND', 'Posible coincidencia',
          format('Tu reporte "%s" podría corresponder a un objeto perdido (%s%%).', v_found.title, v_total),
          'item', v_lost.id);
      end if;
    else
      delete from matches
      where lost_item_id = v_lost.id and found_item_id = v_found.id and status = 'ACTIVE';
    end if;
  end loop;
end $$;
revoke execute on function public.recompute_matches from public, anon, authenticated;

create or replace function public.items_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recompute_matches(new.id);
  return null;
end $$;
create trigger items_matching
  after insert or update of title, description, category_id, location_id, location_detail,
                            incident_date, status, is_hidden, deleted_at
  on public.items for each row execute function public.items_after_write();

-- Descartar una coincidencia (solo la oculta para quien la descarta)
create or replace function public.dismiss_match(p_match_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update matches m set
    lost_owner_dismissed  = lost_owner_dismissed  or exists(select 1 from items where id = m.lost_item_id  and user_id = auth.uid()),
    found_owner_dismissed = found_owner_dismissed or exists(select 1 from items where id = m.found_item_id and user_id = auth.uid())
  where m.id = p_match_id;
end $$;

-- ---------------------------------------------------------------------
-- 5. SOLICITUDES DE RECUPERACIÓN (toda escritura pasa por estas funciones)
-- ---------------------------------------------------------------------
create or replace function public.create_claim(
  p_item_id uuid, p_message text, p_ownership_details text,
  p_lost_date date default null, p_lost_location_id uuid default null,
  p_lost_location_detail text default null, p_lost_item_id uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_item items; v_id uuid;
begin
  if auth.uid() is null or not is_active_user() then raise exception 'Debes iniciar sesión con una cuenta activa'; end if;
  select * into v_item from items where id = p_item_id;
  if v_item is null then raise exception 'La publicación no existe'; end if;
  if v_item.type <> 'FOUND' then raise exception 'Solo se pueden reclamar objetos encontrados'; end if;
  if v_item.user_id = auth.uid() then raise exception 'No puedes reclamar tu propia publicación'; end if;
  if v_item.status <> 'ACTIVE' or v_item.is_hidden or v_item.deleted_at is not null then
    raise exception 'Esta publicación ya no está disponible';
  end if;
  if exists (select 1 from claims where item_id = p_item_id and requester_id = auth.uid() and status in ('PENDING','ACCEPTED')) then
    raise exception 'Ya tienes una solicitud activa para este objeto';
  end if;
  if char_length(trim(coalesce(p_message,''))) < 10 or char_length(trim(coalesce(p_ownership_details,''))) < 5 then
    raise exception 'Explica con más detalle por qué el objeto es tuyo';
  end if;
  if p_lost_item_id is not null and not exists (
       select 1 from items where id = p_lost_item_id and user_id = auth.uid() and type = 'LOST') then
    raise exception 'La publicación de objeto perdido indicada no es tuya';
  end if;

  insert into claims(item_id, requester_id, lost_item_id, message, ownership_details,
                     lost_date, lost_location_id, lost_location_detail)
  values (p_item_id, auth.uid(), p_lost_item_id, trim(p_message), trim(p_ownership_details),
          p_lost_date, p_lost_location_id, p_lost_location_detail)
  returning id into v_id;

  perform notify(v_item.user_id, 'CLAIM_RECEIVED', 'Nueva solicitud de recuperación',
                 format('Alguien cree que "%s" le pertenece. Revisa su solicitud.', v_item.title), 'claim', v_id);
  return v_id;
end $$;

create or replace function public.respond_claim(p_claim_id uuid, p_accept boolean, p_message text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_claim claims; v_item items;
begin
  select * into v_claim from claims where id = p_claim_id for update;
  if v_claim is null then raise exception 'La solicitud no existe'; end if;
  select * into v_item from items where id = v_claim.item_id;
  if v_item.user_id <> auth.uid() then raise exception 'Solo quien publicó el objeto puede responder'; end if;
  if v_claim.status <> 'PENDING' then raise exception 'Esta solicitud ya fue respondida o cancelada'; end if;
  if p_accept and v_item.status <> 'ACTIVE' then raise exception 'La publicación ya no está activa'; end if;

  update claims set status = case when p_accept then 'ACCEPTED'::claim_status else 'REJECTED'::claim_status end,
                    response_message = p_message, reviewed_at = now()
  where id = p_claim_id;

  if p_accept then
    perform notify(v_claim.requester_id, 'CLAIM_ACCEPTED', 'Solicitud aceptada',
      format('Tu solicitud por "%s" fue aceptada. Coordina la entrega.', v_item.title), 'claim', p_claim_id);
  else
    perform notify(v_claim.requester_id, 'CLAIM_REJECTED', 'Solicitud rechazada',
      format('Tu solicitud por "%s" fue rechazada.', v_item.title), 'claim', p_claim_id);
  end if;
end $$;

create or replace function public.cancel_claim(p_claim_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_claim claims; v_item items;
begin
  select * into v_claim from claims where id = p_claim_id for update;
  if v_claim is null or v_claim.requester_id <> auth.uid() then raise exception 'Solicitud no encontrada'; end if;
  if v_claim.status not in ('PENDING','ACCEPTED') then raise exception 'Esta solicitud ya no se puede cancelar'; end if;
  update claims set status = 'CANCELLED', cancelled_at = now() where id = p_claim_id;
  select * into v_item from items where id = v_claim.item_id;
  perform notify(v_item.user_id, 'CLAIM_CANCELLED', 'Solicitud cancelada',
    format('Una solicitud sobre "%s" fue retirada.', v_item.title), 'claim', p_claim_id);
end $$;

-- Confirmar devolución: la hace quien publicó el objeto encontrado.
-- Transacción: claim COMPLETED + item RESOLVED + resto de solicitudes rechazadas.
create or replace function public.complete_claim(p_claim_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_claim claims; v_item items; r record;
begin
  select * into v_claim from claims where id = p_claim_id for update;
  if v_claim is null then raise exception 'La solicitud no existe'; end if;
  select * into v_item from items where id = v_claim.item_id for update;
  if v_item.user_id <> auth.uid() then raise exception 'Solo quien publicó el objeto puede confirmar la devolución'; end if;
  if v_claim.status <> 'ACCEPTED' then raise exception 'Solo se puede completar una solicitud aceptada'; end if;

  update claims set status = 'COMPLETED', completed_at = now() where id = p_claim_id;
  update items set status = 'RESOLVED', resolved_at = now() where id = v_item.id;
  if v_claim.lost_item_id is not null then
    update items set status = 'RESOLVED', resolved_at = now() where id = v_claim.lost_item_id and status = 'ACTIVE';
  end if;

  for r in update claims set status = 'REJECTED', reviewed_at = now(),
                             response_message = 'El objeto ya fue devuelto a su propietario.'
           where item_id = v_item.id and id <> p_claim_id and status in ('PENDING','ACCEPTED')
           returning id, requester_id
  loop
    perform notify(r.requester_id, 'CLAIM_REJECTED', 'Solicitud cerrada',
      format('"%s" ya fue devuelto a su propietario.', v_item.title), 'claim', r.id);
  end loop;

  perform notify(v_claim.requester_id, 'CLAIM_COMPLETED', '¡Objeto recuperado!',
    format('Se confirmó la devolución de "%s".', v_item.title), 'claim', p_claim_id);
end $$;

-- Datos de contacto: solo visibles entre las dos partes cuando la solicitud fue aceptada
create or replace function public.get_claim_contact(p_claim_id uuid)
returns table(finder_name text, finder_email text, requester_name text, requester_email text)
language plpgsql stable security definer set search_path = public as $$
declare v_claim claims; v_item items;
begin
  select * into v_claim from claims where id = p_claim_id;
  select * into v_item from items where id = v_claim.item_id;
  if v_claim is null or auth.uid() not in (v_claim.requester_id, v_item.user_id) then
    raise exception 'No autorizado';
  end if;
  if v_claim.status not in ('ACCEPTED','COMPLETED') then raise exception 'La solicitud aún no ha sido aceptada'; end if;
  return query
    select pf.first_name || ' ' || pf.last_name, uf.email::text,
           pr.first_name || ' ' || pr.last_name, ur.email::text
    from profiles pf join auth.users uf on uf.id = pf.id,
         profiles pr join auth.users ur on ur.id = pr.id
    where pf.id = v_item.user_id and pr.id = v_claim.requester_id;
end $$;

-- ---------------------------------------------------------------------
-- 6. ADMIN
-- ---------------------------------------------------------------------
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare v json;
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  select json_build_object(
    'users',           (select count(*) from profiles),
    'items',           (select count(*) from items where deleted_at is null),
    'lost',            (select count(*) from items where deleted_at is null and type = 'LOST'),
    'found',           (select count(*) from items where deleted_at is null and type = 'FOUND'),
    'resolved',        (select count(*) from items where status = 'RESOLVED'),
    'pending_claims',  (select count(*) from claims where status = 'PENDING'),
    'pending_reports', (select count(*) from reports where status = 'PENDING'),
    'active_matches',  (select count(*) from matches where status = 'ACTIVE'),
    'recovery_rate',   (select coalesce(round(100.0 * count(*) filter (where status = 'RESOLVED')
                                 / nullif(count(*), 0), 1), 0) from items where deleted_at is null)
  ) into v;
  return v;
end $$;

create or replace function public.admin_list_users()
returns table(id uuid, first_name text, last_name text, email text, role public.user_role,
              is_active boolean, blocked_reason text, created_at timestamptz, items_count bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  return query
    select p.id, p.first_name::text, p.last_name::text, u.email::text, p.role, p.is_active, p.blocked_reason,
           p.created_at, (select count(*) from items i where i.user_id = p.id)
    from profiles p join auth.users u on u.id = p.id
    order by p.created_at desc;
end $$;

-- Notifica al dueño cuando un admin oculta su publicación
create or replace function public.items_notify_hidden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_hidden and not old.is_hidden then
    perform notify(new.user_id, 'ITEM_HIDDEN', 'Publicación ocultada',
      format('Tu publicación "%s" fue ocultada por moderación. Motivo: %s', new.title, coalesce(new.hidden_reason, 'sin especificar')),
      'item', new.id);
  end if;
  return null;
end $$;
create trigger items_hidden_notify after update of is_hidden on public.items
  for each row execute function public.items_notify_hidden();

-- ---------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.locations            enable row level security;
alter table public.items                enable row level security;
alter table public.item_private_details enable row level security;
alter table public.matches              enable row level security;
alter table public.claims               enable row level security;
alter table public.notifications        enable row level security;
alter table public.reports              enable row level security;

-- profiles
create policy "perfiles visibles"      on public.profiles for select using (true);
create policy "editar mi perfil"       on public.profiles for update using (id = auth.uid() or is_admin());

-- categories / locations: lectura pública, escritura admin
create policy "categorias lectura"     on public.categories for select using (is_active or is_admin());
create policy "categorias admin"       on public.categories for all using (is_admin()) with check (is_admin());
create policy "lugares lectura"        on public.locations  for select using (is_active or is_admin());
create policy "lugares admin"          on public.locations  for all using (is_admin()) with check (is_admin());

-- items
create policy "items visibles" on public.items for select
  using ((not is_hidden and deleted_at is null) or user_id = auth.uid() or is_admin());
create policy "crear item" on public.items for insert to authenticated
  with check (user_id = auth.uid() and is_active_user() and status = 'ACTIVE' and not is_hidden);
create policy "editar item" on public.items for update to authenticated
  using (user_id = auth.uid() or is_admin());

-- detalles privados: solo dueño (y admin para revisar fraude)
create policy "privado dueño" on public.item_private_details for all to authenticated
  using (is_admin() or exists (select 1 from items where id = item_id and user_id = auth.uid()))
  with check (exists (select 1 from items where id = item_id and user_id = auth.uid()));

-- matches: los dueños de cualquiera de las dos publicaciones
create policy "ver mis coincidencias" on public.matches for select to authenticated
  using (is_admin() or exists (select 1 from items where id in (lost_item_id, found_item_id) and user_id = auth.uid()));

-- claims: solicitante, dueño del objeto o admin. Escritura solo vía funciones.
create policy "ver solicitudes" on public.claims for select to authenticated
  using (requester_id = auth.uid() or is_admin()
         or exists (select 1 from items where id = item_id and user_id = auth.uid()));

-- notifications
create policy "mis notificaciones"        on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "marcar notificacion leida" on public.notifications for update to authenticated using (user_id = auth.uid());

-- reports
create policy "crear reporte" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'PENDING');
create policy "ver reportes"  on public.reports for select to authenticated using (reporter_id = auth.uid() or is_admin());
create policy "admin reportes" on public.reports for update to authenticated using (is_admin());

-- ---------------------------------------------------------------------
-- 8. STORAGE (fotos): bucket público, máx 5 MB, solo imágenes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "subir mis fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 9. DATOS INICIALES
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, icon) values
  ('Electrónica', 'electronica', 'smartphone'),
  ('Documentos y carnés', 'documentos', 'id-card'),
  ('Accesorios personales', 'accesorios', 'watch'),
  ('Ropa y calzado', 'ropa', 'shirt'),
  ('Libros y materiales académicos', 'libros', 'book-open'),
  ('Llaves', 'llaves', 'key-round'),
  ('Bolsos y mochilas', 'bolsos', 'backpack'),
  ('Otros', 'otros', 'package')
on conflict do nothing;

insert into public.locations (name) values
  ('Biblioteca'), ('Cafetería'), ('Bloque A'), ('Bloque B'), ('Bloque C'),
  ('Laboratorios'), ('Auditorio'), ('Gimnasio / Coliseo'), ('Parqueadero'),
  ('Zonas verdes'), ('Portería'), ('Otro')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 10. PRIVILEGIOS DE FUNCIONES (recomendación del linter de Supabase)
-- ---------------------------------------------------------------------
-- Funciones de trigger: nadie las llama por API (los triggers no necesitan EXECUTE al dispararse)
revoke execute on function public.touch_updated_at(), public.handle_new_user(), public.guard_profile_update(),
  public.guard_item_update(), public.items_after_write(), public.items_notify_hidden()
  from public, anon, authenticated;
alter function public.touch_updated_at() set search_path = public;

-- RPC de la app: solo usuarios con sesión
revoke execute on function public.create_claim(uuid, text, text, date, uuid, text, uuid), public.respond_claim(uuid, boolean, text),
  public.cancel_claim(uuid), public.complete_claim(uuid), public.get_claim_contact(uuid), public.dismiss_match(uuid),
  public.admin_stats(), public.admin_list_users()
  from public, anon;
grant execute on function public.create_claim(uuid, text, text, date, uuid, text, uuid), public.respond_claim(uuid, boolean, text),
  public.cancel_claim(uuid), public.complete_claim(uuid), public.get_claim_contact(uuid), public.dismiss_match(uuid),
  public.admin_stats(), public.admin_list_users()
  to authenticated;

-- Helpers usados dentro de las políticas RLS: deben seguir ejecutables por anon/authenticated
revoke execute on function public.is_admin(), public.is_active_user() from public;
grant execute on function public.is_admin(), public.is_active_user() to anon, authenticated;
