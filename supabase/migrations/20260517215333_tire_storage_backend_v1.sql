set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.cms_has_permission(p_module text, p_action text default 'read')
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_status text;
  v_permission text;
  v_module text := nullif(btrim(coalesce(p_module, '')), '');
  v_action text := lower(nullif(btrim(coalesce(p_action, 'read')), ''));
begin
  if v_module not in ('rescue', 'schedule', 'catalog_tires', 'catalog_rims', 'orders', 'invoices', 'customers', 'accounts', 'tire_storage') then
    return false;
  end if;

  if v_action not in ('read', 'write') then
    return false;
  end if;

  select p.role, p.account_status, p.cms_permissions ->> v_module
  into v_role, v_status, v_permission
  from public.profiles p
  where p.id = auth.uid();

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_action = 'write' and not public.cms_has_verified_mfa() then
    return false;
  end if;

  if v_role = 'super_admin' then
    return true;
  end if;

  if v_role not in ('admin', 'supervisor', 'staff') then
    return false;
  end if;

  if v_permission is null or v_permission = 'none' then
    return false;
  end if;

  if v_action = 'read' then
    return v_permission in ('read', 'read_write');
  end if;

  return v_permission = 'read_write';
end;
$$;

grant execute on function public.cms_has_permission(text, text) to authenticated;

create or replace function public.tire_storage_normalize_plate(p_plate text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(btrim(coalesce(p_plate, '')), '\s+', '', 'g')), '');
$$;

create table if not exists public.tire_storage_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  container_code text,
  rack_code text,
  row_code text,
  shelf_code text,
  slot_code text,
  label text,
  status text not null default 'active' check (status in ('active', 'full', 'inactive', 'maintenance')),
  capacity_sets integer check (capacity_sets is null or capacity_sets >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists tire_storage_locations_code_unique_idx
  on public.tire_storage_locations (upper(code));

create index if not exists tire_storage_locations_container_idx
  on public.tire_storage_locations (upper(container_code), upper(rack_code), upper(row_code), upper(shelf_code), upper(slot_code));

create table if not exists public.tire_storage_import_rows (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  source_sheet text not null default 'Sheet1',
  source_row_number integer,
  legacy_sn integer,
  raw_date text,
  raw_customer_name text,
  raw_storage_code text,
  raw_phone text,
  raw_license_plate text,
  raw_tire_text text,
  raw_rim_text text,
  raw_size_text text,
  raw_quantity_text text,
  raw_term_text text,
  raw_price_text text,
  raw_notes text,
  parsed_license_plate text,
  parsed_quantity integer,
  parsed_status text check (parsed_status is null or parsed_status in ('stored', 'checked_out', 'disposed', 'needs_review', 'no_contract', 'unknown')),
  parsed_condition_flags text[] not null default '{}',
  parsed_payload jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'needs_review')),
  review_notes text,
  imported_set_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

create index if not exists tire_storage_import_rows_review_idx
  on public.tire_storage_import_rows (review_status, source_file, legacy_sn);

create index if not exists tire_storage_import_rows_plate_idx
  on public.tire_storage_import_rows (parsed_license_plate);

create table if not exists public.tire_storage_sets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  storage_location_id uuid references public.tire_storage_locations(id) on delete set null,
  source_import_row_id uuid references public.tire_storage_import_rows(id) on delete set null,
  source_legacy_sn integer,

  license_plate text,
  normalized_license_plate text,
  customer_name_snapshot text,
  customer_phone_snapshot text,
  customer_email_snapshot text,
  vehicle_name_snapshot text,

  storage_code_raw text,
  tire_brand_text text,
  tire_model_text text,
  tire_size_text text,
  tire_season text not null default 'unknown' check (tire_season in ('summer', 'winter', 'all_season', 'unknown')),
  rim_text text,
  rim_type text check (rim_type is null or rim_type in ('alloy', 'steel', 'none', 'unknown')),
  quantity integer not null default 4 check (quantity > 0),

  status text not null default 'stored' check (status in ('stored', 'reserved_for_service', 'checked_out', 'disposed', 'lost_damaged', 'archived', 'needs_review')),
  condition_status text not null default 'unknown' check (condition_status in ('good', 'fair', 'poor', 'damaged', 'unknown')),
  condition_notes text,
  tread_depths jsonb not null default '{}'::jsonb,

  storage_term text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'EUR',
  payment_status text not null default 'unknown' check (payment_status in ('unknown', 'unpaid', 'paid', 'included', 'waived')),

  checked_in_at timestamptz,
  reserved_for_service_at timestamptz,
  checked_out_at timestamptz,
  next_action_at timestamptz,

  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tire_storage_sets_status_idx
  on public.tire_storage_sets (status, checked_in_at desc nulls last);

create index if not exists tire_storage_sets_plate_idx
  on public.tire_storage_sets (normalized_license_plate);

create index if not exists tire_storage_sets_customer_idx
  on public.tire_storage_sets (customer_id, status);

create index if not exists tire_storage_sets_vehicle_idx
  on public.tire_storage_sets (customer_vehicle_id, status);

create index if not exists tire_storage_sets_location_idx
  on public.tire_storage_sets (storage_location_id, status);

create index if not exists tire_storage_sets_search_idx
  on public.tire_storage_sets using gin (
    to_tsvector(
      'simple',
      coalesce(customer_name_snapshot, '') || ' ' ||
      coalesce(customer_phone_snapshot, '') || ' ' ||
      coalesce(license_plate, '') || ' ' ||
      coalesce(tire_brand_text, '') || ' ' ||
      coalesce(tire_model_text, '') || ' ' ||
      coalesce(tire_size_text, '') || ' ' ||
      coalesce(rim_text, '') || ' ' ||
      coalesce(storage_code_raw, '')
    )
  );

create table if not exists public.tire_storage_events (
  id uuid primary key default gen_random_uuid(),
  storage_set_id uuid not null references public.tire_storage_sets(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'updated', 'checked_in', 'reserved_for_service', 'picked_for_service', 'returned_to_storage', 'checked_out', 'disposed', 'location_changed', 'condition_updated', 'payment_updated', 'import_approved', 'note_added')),
  actor_id uuid references auth.users(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  from_status text,
  to_status text,
  from_location_id uuid references public.tire_storage_locations(id) on delete set null,
  to_location_id uuid references public.tire_storage_locations(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tire_storage_events_set_created_idx
  on public.tire_storage_events (storage_set_id, created_at desc);

create table if not exists public.tire_storage_photos (
  id uuid primary key default gen_random_uuid(),
  storage_set_id uuid not null references public.tire_storage_sets(id) on delete cascade,
  storage_path text,
  public_url text,
  caption text,
  photo_type text not null default 'condition' check (photo_type in ('condition', 'tread', 'label', 'location', 'other')),
  position integer not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (storage_path is not null or public_url is not null)
);

create index if not exists tire_storage_photos_set_position_idx
  on public.tire_storage_photos (storage_set_id, position, created_at);

drop trigger if exists trg_tire_storage_locations_updated_at on public.tire_storage_locations;
create trigger trg_tire_storage_locations_updated_at
before update on public.tire_storage_locations
for each row execute function public.touch_updated_at_generic();

drop trigger if exists trg_tire_storage_sets_updated_at on public.tire_storage_sets;
create trigger trg_tire_storage_sets_updated_at
before update on public.tire_storage_sets
for each row execute function public.touch_updated_at_generic();

alter table public.tire_storage_locations enable row level security;
alter table public.tire_storage_import_rows enable row level security;
alter table public.tire_storage_sets enable row level security;
alter table public.tire_storage_events enable row level security;
alter table public.tire_storage_photos enable row level security;

drop policy if exists "CMS tire storage locations read" on public.tire_storage_locations;
create policy "CMS tire storage locations read"
on public.tire_storage_locations for select
to authenticated
using (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS tire storage locations write" on public.tire_storage_locations;
create policy "CMS tire storage locations write"
on public.tire_storage_locations for all
to authenticated
using (public.cms_has_permission('tire_storage', 'write'))
with check (public.cms_has_permission('tire_storage', 'write'));

drop policy if exists "CMS tire storage import read" on public.tire_storage_import_rows;
create policy "CMS tire storage import read"
on public.tire_storage_import_rows for select
to authenticated
using (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS tire storage import write" on public.tire_storage_import_rows;
create policy "CMS tire storage import write"
on public.tire_storage_import_rows for all
to authenticated
using (public.cms_has_permission('tire_storage', 'write'))
with check (public.cms_has_permission('tire_storage', 'write'));

drop policy if exists "CMS tire storage sets read" on public.tire_storage_sets;
create policy "CMS tire storage sets read"
on public.tire_storage_sets for select
to authenticated
using (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS tire storage sets write" on public.tire_storage_sets;
create policy "CMS tire storage sets write"
on public.tire_storage_sets for all
to authenticated
using (public.cms_has_permission('tire_storage', 'write'))
with check (public.cms_has_permission('tire_storage', 'write'));

drop policy if exists "CMS tire storage events read" on public.tire_storage_events;
create policy "CMS tire storage events read"
on public.tire_storage_events for select
to authenticated
using (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS tire storage events write" on public.tire_storage_events;
create policy "CMS tire storage events write"
on public.tire_storage_events for all
to authenticated
using (public.cms_has_permission('tire_storage', 'write'))
with check (public.cms_has_permission('tire_storage', 'write'));

drop policy if exists "CMS tire storage photos read" on public.tire_storage_photos;
create policy "CMS tire storage photos read"
on public.tire_storage_photos for select
to authenticated
using (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS tire storage photos write" on public.tire_storage_photos;
create policy "CMS tire storage photos write"
on public.tire_storage_photos for all
to authenticated
using (public.cms_has_permission('tire_storage', 'write'))
with check (public.cms_has_permission('tire_storage', 'write'));

grant select, insert, update, delete on public.tire_storage_locations to authenticated, service_role;
grant select, insert, update, delete on public.tire_storage_import_rows to authenticated, service_role;
grant select, insert, update, delete on public.tire_storage_sets to authenticated, service_role;
grant select, insert, update, delete on public.tire_storage_events to authenticated, service_role;
grant select, insert, update, delete on public.tire_storage_photos to authenticated, service_role;

create or replace function public.cms_tire_storage_list(
  p_search text default null,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  status text,
  customer_id uuid,
  customer_vehicle_id uuid,
  customer_name text,
  customer_phone text,
  license_plate text,
  location_code text,
  tire_brand_text text,
  tire_size_text text,
  tire_season text,
  rim_text text,
  quantity integer,
  condition_status text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  payment_status text,
  price_cents integer,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_status text := nullif(btrim(coalesce(p_status, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read')) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select s.*, l.code as resolved_location_code
    from public.tire_storage_sets s
    left join public.tire_storage_locations l on l.id = s.storage_location_id
    where (v_status is null or s.status = v_status)
      and (
        v_search is null
        or s.normalized_license_plate ilike '%' || public.tire_storage_normalize_plate(v_search) || '%'
        or s.customer_name_snapshot ilike '%' || v_search || '%'
        or s.customer_phone_snapshot ilike '%' || v_search || '%'
        or s.tire_brand_text ilike '%' || v_search || '%'
        or s.tire_size_text ilike '%' || v_search || '%'
        or s.storage_code_raw ilike '%' || v_search || '%'
        or l.code ilike '%' || v_search || '%'
      )
  ),
  counted as (
    select count(*)::bigint as total_count from filtered
  )
  select
    f.id,
    f.status,
    f.customer_id,
    f.customer_vehicle_id,
    coalesce(f.customer_name_snapshot, c.full_name)::text as customer_name,
    coalesce(f.customer_phone_snapshot, c.primary_phone)::text as customer_phone,
    f.license_plate,
    coalesce(f.resolved_location_code, f.storage_code_raw)::text as location_code,
    f.tire_brand_text,
    f.tire_size_text,
    f.tire_season,
    f.rim_text,
    f.quantity,
    f.condition_status,
    f.checked_in_at,
    f.checked_out_at,
    f.payment_status,
    f.price_cents,
    counted.total_count
  from filtered f
  cross join counted
  left join public.customers c on c.id = f.customer_id
  order by f.status = 'stored' desc, f.checked_in_at desc nulls last, f.created_at desc
  limit v_limit offset v_offset;
end;
$$;

create or replace function public.cms_tire_storage_get(p_storage_set_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not (public.cms_has_permission('tire_storage', 'read') or public.cms_has_permission('customers', 'read')) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'set', to_jsonb(s),
    'customer', to_jsonb(c),
    'vehicle', to_jsonb(v),
    'location', to_jsonb(l),
    'events', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at desc)
      from public.tire_storage_events e
      where e.storage_set_id = s.id
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.position, p.created_at)
      from public.tire_storage_photos p
      where p.storage_set_id = s.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.tire_storage_sets s
  left join public.customers c on c.id = s.customer_id
  left join public.customer_vehicles v on v.id = s.customer_vehicle_id
  left join public.tire_storage_locations l on l.id = s.storage_location_id
  where s.id = p_storage_set_id;

  if v_result is null then
    raise exception 'Tire storage set not found';
  end if;

  return v_result;
end;
$$;

create or replace function public.cms_tire_storage_upsert_set(
  p_storage_set_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := p_storage_set_id;
  v_now timestamptz := timezone('utc', now());
  v_plate text := nullif(btrim(p_payload->>'license_plate'), '');
  v_normalized_plate text := public.tire_storage_normalize_plate(p_payload->>'license_plate');
  v_event_type text := 'updated';
begin
  if not public.cms_has_permission('tire_storage', 'write') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.tire_storage_sets (
      customer_id,
      customer_vehicle_id,
      booking_id,
      order_id,
      storage_location_id,
      license_plate,
      normalized_license_plate,
      customer_name_snapshot,
      customer_phone_snapshot,
      customer_email_snapshot,
      vehicle_name_snapshot,
      storage_code_raw,
      tire_brand_text,
      tire_model_text,
      tire_size_text,
      tire_season,
      rim_text,
      rim_type,
      quantity,
      status,
      condition_status,
      condition_notes,
      tread_depths,
      storage_term,
      price_cents,
      currency,
      payment_status,
      checked_in_at,
      next_action_at,
      notes,
      metadata,
      created_by,
      updated_by
    )
    values (
      nullif(p_payload->>'customer_id', '')::uuid,
      nullif(p_payload->>'customer_vehicle_id', '')::uuid,
      nullif(p_payload->>'booking_id', '')::uuid,
      nullif(p_payload->>'order_id', '')::uuid,
      nullif(p_payload->>'storage_location_id', '')::uuid,
      v_plate,
      v_normalized_plate,
      nullif(btrim(p_payload->>'customer_name'), ''),
      nullif(btrim(p_payload->>'customer_phone'), ''),
      nullif(btrim(p_payload->>'customer_email'), ''),
      nullif(btrim(p_payload->>'vehicle_name'), ''),
      nullif(btrim(p_payload->>'storage_code'), ''),
      nullif(btrim(p_payload->>'tire_brand_text'), ''),
      nullif(btrim(p_payload->>'tire_model_text'), ''),
      nullif(btrim(p_payload->>'tire_size_text'), ''),
      coalesce(nullif(btrim(p_payload->>'tire_season'), ''), 'unknown'),
      nullif(btrim(p_payload->>'rim_text'), ''),
      nullif(btrim(p_payload->>'rim_type'), ''),
      coalesce(nullif(p_payload->>'quantity', '')::integer, 4),
      coalesce(nullif(btrim(p_payload->>'status'), ''), 'stored'),
      coalesce(nullif(btrim(p_payload->>'condition_status'), ''), 'unknown'),
      nullif(btrim(p_payload->>'condition_notes'), ''),
      coalesce(p_payload->'tread_depths', '{}'::jsonb),
      nullif(btrim(p_payload->>'storage_term'), ''),
      nullif(p_payload->>'price_cents', '')::integer,
      coalesce(nullif(btrim(p_payload->>'currency'), ''), 'EUR'),
      coalesce(nullif(btrim(p_payload->>'payment_status'), ''), 'unknown'),
      coalesce(nullif(p_payload->>'checked_in_at', '')::timestamptz, v_now),
      nullif(p_payload->>'next_action_at', '')::timestamptz,
      nullif(btrim(p_payload->>'notes'), ''),
      coalesce(p_payload->'metadata', '{}'::jsonb),
      auth.uid(),
      auth.uid()
    )
    returning id into v_id;
    v_event_type := 'created';
  else
    update public.tire_storage_sets
    set
      customer_id = coalesce(nullif(p_payload->>'customer_id', '')::uuid, customer_id),
      customer_vehicle_id = coalesce(nullif(p_payload->>'customer_vehicle_id', '')::uuid, customer_vehicle_id),
      booking_id = coalesce(nullif(p_payload->>'booking_id', '')::uuid, booking_id),
      order_id = coalesce(nullif(p_payload->>'order_id', '')::uuid, order_id),
      storage_location_id = coalesce(nullif(p_payload->>'storage_location_id', '')::uuid, storage_location_id),
      license_plate = coalesce(v_plate, license_plate),
      normalized_license_plate = coalesce(v_normalized_plate, normalized_license_plate),
      customer_name_snapshot = coalesce(nullif(btrim(p_payload->>'customer_name'), ''), customer_name_snapshot),
      customer_phone_snapshot = coalesce(nullif(btrim(p_payload->>'customer_phone'), ''), customer_phone_snapshot),
      customer_email_snapshot = coalesce(nullif(btrim(p_payload->>'customer_email'), ''), customer_email_snapshot),
      vehicle_name_snapshot = coalesce(nullif(btrim(p_payload->>'vehicle_name'), ''), vehicle_name_snapshot),
      storage_code_raw = coalesce(nullif(btrim(p_payload->>'storage_code'), ''), storage_code_raw),
      tire_brand_text = coalesce(nullif(btrim(p_payload->>'tire_brand_text'), ''), tire_brand_text),
      tire_model_text = coalesce(nullif(btrim(p_payload->>'tire_model_text'), ''), tire_model_text),
      tire_size_text = coalesce(nullif(btrim(p_payload->>'tire_size_text'), ''), tire_size_text),
      tire_season = coalesce(nullif(btrim(p_payload->>'tire_season'), ''), tire_season),
      rim_text = coalesce(nullif(btrim(p_payload->>'rim_text'), ''), rim_text),
      rim_type = coalesce(nullif(btrim(p_payload->>'rim_type'), ''), rim_type),
      quantity = coalesce(nullif(p_payload->>'quantity', '')::integer, quantity),
      status = coalesce(nullif(btrim(p_payload->>'status'), ''), status),
      condition_status = coalesce(nullif(btrim(p_payload->>'condition_status'), ''), condition_status),
      condition_notes = coalesce(nullif(btrim(p_payload->>'condition_notes'), ''), condition_notes),
      tread_depths = coalesce(p_payload->'tread_depths', tread_depths),
      storage_term = coalesce(nullif(btrim(p_payload->>'storage_term'), ''), storage_term),
      price_cents = coalesce(nullif(p_payload->>'price_cents', '')::integer, price_cents),
      currency = coalesce(nullif(btrim(p_payload->>'currency'), ''), currency),
      payment_status = coalesce(nullif(btrim(p_payload->>'payment_status'), ''), payment_status),
      next_action_at = coalesce(nullif(p_payload->>'next_action_at', '')::timestamptz, next_action_at),
      notes = coalesce(nullif(btrim(p_payload->>'notes'), ''), notes),
      metadata = metadata || coalesce(p_payload->'metadata', '{}'::jsonb),
      updated_by = auth.uid()
    where id = v_id;

    if not found then
      raise exception 'Tire storage set not found';
    end if;
  end if;

  insert into public.tire_storage_events(storage_set_id, event_type, actor_id, details)
  values (v_id, v_event_type, auth.uid(), jsonb_build_object('payload', p_payload));

  return v_id;
end;
$$;

create or replace function public.cms_tire_storage_check_out(
  p_storage_set_id uuid,
  p_reason text default 'checked_out',
  p_booking_id uuid default null,
  p_order_id uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.tire_storage_sets%rowtype;
  v_next_status text := case
    when lower(coalesce(p_reason, '')) = 'disposed' then 'disposed'
    when lower(coalesce(p_reason, '')) = 'lost_damaged' then 'lost_damaged'
    else 'checked_out'
  end;
begin
  if not public.cms_has_permission('tire_storage', 'write') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_set
  from public.tire_storage_sets
  where id = p_storage_set_id
  for update;

  if not found then
    raise exception 'Tire storage set not found';
  end if;

  update public.tire_storage_sets
  set status = v_next_status,
      booking_id = coalesce(p_booking_id, booking_id),
      order_id = coalesce(p_order_id, order_id),
      checked_out_at = timezone('utc', now()),
      notes = concat_ws(E'\n', notes, nullif(btrim(p_notes), '')),
      updated_by = auth.uid()
  where id = p_storage_set_id;

  insert into public.tire_storage_events(
    storage_set_id,
    event_type,
    actor_id,
    booking_id,
    order_id,
    from_status,
    to_status,
    from_location_id,
    details
  )
  values (
    p_storage_set_id,
    case when v_next_status = 'disposed' then 'disposed' else 'checked_out' end,
    auth.uid(),
    p_booking_id,
    p_order_id,
    v_set.status,
    v_next_status,
    v_set.storage_location_id,
    jsonb_build_object('reason', p_reason, 'notes', p_notes)
  );

  return jsonb_build_object('id', p_storage_set_id, 'status', v_next_status);
end;
$$;

create or replace function public.cms_tire_storage_return_to_storage(
  p_storage_set_id uuid,
  p_location_id uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.tire_storage_sets%rowtype;
begin
  if not public.cms_has_permission('tire_storage', 'write') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_set
  from public.tire_storage_sets
  where id = p_storage_set_id
  for update;

  if not found then
    raise exception 'Tire storage set not found';
  end if;

  update public.tire_storage_sets
  set status = 'stored',
      storage_location_id = coalesce(p_location_id, storage_location_id),
      checked_in_at = timezone('utc', now()),
      checked_out_at = null,
      notes = concat_ws(E'\n', notes, nullif(btrim(p_notes), '')),
      updated_by = auth.uid()
  where id = p_storage_set_id;

  insert into public.tire_storage_events(
    storage_set_id,
    event_type,
    actor_id,
    from_status,
    to_status,
    from_location_id,
    to_location_id,
    details
  )
  values (
    p_storage_set_id,
    'returned_to_storage',
    auth.uid(),
    v_set.status,
    'stored',
    v_set.storage_location_id,
    coalesce(p_location_id, v_set.storage_location_id),
    jsonb_build_object('notes', p_notes)
  );

  return jsonb_build_object('id', p_storage_set_id, 'status', 'stored');
end;
$$;

create or replace function public.cms_tire_storage_assign_location(
  p_storage_set_id uuid,
  p_location_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.tire_storage_sets%rowtype;
begin
  if not public.cms_has_permission('tire_storage', 'write') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_set
  from public.tire_storage_sets
  where id = p_storage_set_id
  for update;

  if not found then
    raise exception 'Tire storage set not found';
  end if;

  if not exists (select 1 from public.tire_storage_locations where id = p_location_id) then
    raise exception 'Storage location not found';
  end if;

  update public.tire_storage_sets
  set storage_location_id = p_location_id,
      updated_by = auth.uid()
  where id = p_storage_set_id;

  insert into public.tire_storage_events(
    storage_set_id,
    event_type,
    actor_id,
    from_location_id,
    to_location_id,
    details
  )
  values (
    p_storage_set_id,
    'location_changed',
    auth.uid(),
    v_set.storage_location_id,
    p_location_id,
    jsonb_build_object('notes', p_notes)
  );

  return jsonb_build_object('id', p_storage_set_id, 'location_id', p_location_id);
end;
$$;

create or replace function public.cms_tire_storage_approve_import_row(
  p_import_row_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tire_storage_import_rows%rowtype;
  v_payload jsonb;
  v_set_id uuid;
begin
  if not public.cms_has_permission('tire_storage', 'write') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_row
  from public.tire_storage_import_rows
  where id = p_import_row_id
  for update;

  if not found then
    raise exception 'Import row not found';
  end if;

  v_payload := jsonb_build_object(
    'license_plate', coalesce(v_row.parsed_license_plate, public.tire_storage_normalize_plate(v_row.raw_license_plate)),
    'customer_name', v_row.raw_customer_name,
    'customer_phone', v_row.raw_phone,
    'storage_code', v_row.raw_storage_code,
    'tire_brand_text', v_row.raw_tire_text,
    'tire_size_text', v_row.raw_size_text,
    'rim_text', v_row.raw_rim_text,
    'quantity', coalesce(v_row.parsed_quantity, 4),
    'status', case when v_row.parsed_status in ('checked_out', 'disposed', 'needs_review') then v_row.parsed_status else 'stored' end,
    'storage_term', v_row.raw_term_text,
    'price_cents', case
      when v_row.raw_price_text ~ '^\s*\d+([\.,]\d+)?\s*(€)?\s*$'
        then (replace(regexp_replace(v_row.raw_price_text, '[^0-9,\.]', '', 'g'), ',', '.')::numeric * 100)::integer
      else null
    end,
    'condition_status', case when array_length(v_row.parsed_condition_flags, 1) is not null then 'damaged' else 'unknown' end,
    'condition_notes', concat_ws(E'\n', v_row.raw_quantity_text, v_row.raw_notes),
    'metadata', jsonb_build_object(
      'source_file', v_row.source_file,
      'source_sheet', v_row.source_sheet,
      'source_row_number', v_row.source_row_number,
      'legacy_sn', v_row.legacy_sn,
      'raw_date', v_row.raw_date
    )
  ) || coalesce(p_payload, '{}'::jsonb);

  v_set_id := public.cms_tire_storage_upsert_set(null, v_payload);

  update public.tire_storage_sets
  set source_import_row_id = v_row.id,
      source_legacy_sn = v_row.legacy_sn,
      updated_by = auth.uid()
  where id = v_set_id;

  update public.tire_storage_import_rows
  set review_status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      imported_set_id = v_set_id
  where id = p_import_row_id;

  insert into public.tire_storage_events(storage_set_id, event_type, actor_id, details)
  values (v_set_id, 'import_approved', auth.uid(), jsonb_build_object('import_row_id', p_import_row_id));

  return v_set_id;
end;
$$;

revoke all on function public.tire_storage_normalize_plate(text) from public;
grant execute on function public.tire_storage_normalize_plate(text) to authenticated, service_role;

revoke all on function public.cms_tire_storage_list(text, text, integer, integer) from public;
revoke all on function public.cms_tire_storage_get(uuid) from public;
revoke all on function public.cms_tire_storage_upsert_set(uuid, jsonb) from public;
revoke all on function public.cms_tire_storage_check_out(uuid, text, uuid, uuid, text) from public;
revoke all on function public.cms_tire_storage_return_to_storage(uuid, uuid, text) from public;
revoke all on function public.cms_tire_storage_assign_location(uuid, uuid, text) from public;
revoke all on function public.cms_tire_storage_approve_import_row(uuid, jsonb) from public;

grant execute on function public.cms_tire_storage_list(text, text, integer, integer) to authenticated;
grant execute on function public.cms_tire_storage_get(uuid) to authenticated;
grant execute on function public.cms_tire_storage_upsert_set(uuid, jsonb) to authenticated;
grant execute on function public.cms_tire_storage_check_out(uuid, text, uuid, uuid, text) to authenticated;
grant execute on function public.cms_tire_storage_return_to_storage(uuid, uuid, text) to authenticated;
grant execute on function public.cms_tire_storage_assign_location(uuid, uuid, text) to authenticated;
grant execute on function public.cms_tire_storage_approve_import_row(uuid, jsonb) to authenticated;

comment on table public.tire_storage_sets is
  'Customer-owned tire hotel storage sets. This is physical customer inventory, not webshop product catalog inventory.';

comment on table public.tire_storage_import_rows is
  'Staging area for legacy Excel tire hotel rows. Rows should be reviewed before becoming tire_storage_sets.';
