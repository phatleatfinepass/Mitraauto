alter table public.customers
  add column if not exists customer_type text not null default 'personal';

alter table public.customers
  drop constraint if exists customers_customer_type_check;

alter table public.customers
  add constraint customers_customer_type_check
  check (customer_type in ('personal', 'business', 'fleet'));

create index if not exists customers_customer_type_idx
  on public.customers (customer_type)
  where status <> 'deleted';

create index if not exists customer_vehicles_active_plate_idx
  on public.customer_vehicles (upper(license_plate))
  where not hidden;

create or replace function public.cms_get_customer_detail(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer jsonb;
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'customer_type', c.customer_type,
    'primary_email', c.primary_email,
    'primary_phone', c.primary_phone,
    'full_name', c.full_name,
    'language', c.language,
    'business_id', c.business_id,
    'vat_id', c.vat_id,
    'address_line1', c.address_line1,
    'address_line2', c.address_line2,
    'postal_code', c.postal_code,
    'city', c.city,
    'country_code', c.country_code,
    'status', c.status,
    'tags', c.tags,
    'marketing_consent', c.marketing_consent,
    'contact_consent', c.contact_consent,
    'hidden', c.hidden,
    'source', c.source,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'license_plate', v.license_plate,
        'vehicle_name', v.vehicle_name,
        'vin', v.vin,
        'notes', v.notes,
        'hidden', v.hidden,
        'created_at', v.created_at,
        'updated_at', v.updated_at
      ) order by v.hidden, upper(v.license_plate))
      from public.customer_vehicles v
      where v.customer_id = c.id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(note_row order by limited_notes.created_at desc)
      from (
        select jsonb_build_object(
          'id', n.id,
          'body', n.body,
          'visibility', n.visibility,
          'created_by', n.created_by,
          'created_at', n.created_at
        ) as note_row,
        n.created_at
        from public.customer_notes n
        where n.customer_id = c.id
          and (n.visibility = 'internal' or public.cms_is_super_admin())
        order by n.created_at desc
        limit 40
      ) limited_notes
    ), '[]'::jsonb)
  )
  into v_customer
  from public.customers c
  where c.id = p_customer_id;

  return v_customer;
end;
$$;

create or replace function public.cms_upsert_customer(
  p_customer_id uuid default null,
  p_full_name text default null,
  p_primary_email text default null,
  p_primary_phone text default null,
  p_language text default null,
  p_business_id text default null,
  p_vat_id text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_postal_code text default null,
  p_city text default null,
  p_country_code text default 'FI',
  p_status text default 'active',
  p_tags text[] default '{}'::text[],
  p_marketing_consent boolean default null,
  p_contact_consent boolean default null,
  p_hidden boolean default false,
  p_customer_type text default 'personal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_customer_type text := lower(coalesce(nullif(btrim(p_customer_type), ''), 'personal'));
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_status not in ('active', 'hidden', 'blocked', 'merged', 'deleted') then
    raise exception 'Invalid customer status';
  end if;

  if v_customer_type not in ('personal', 'business', 'fleet') then
    raise exception 'Invalid customer type';
  end if;

  if p_customer_id is null then
    insert into public.customers (
      customer_type,
      full_name,
      primary_email,
      primary_phone,
      language,
      business_id,
      vat_id,
      address_line1,
      address_line2,
      postal_code,
      city,
      country_code,
      status,
      tags,
      marketing_consent,
      contact_consent,
      hidden,
      source,
      created_by,
      updated_by
    )
    values (
      v_customer_type,
      nullif(btrim(p_full_name), ''),
      lower(nullif(btrim(p_primary_email), '')),
      nullif(btrim(p_primary_phone), ''),
      nullif(btrim(p_language), ''),
      nullif(btrim(p_business_id), ''),
      nullif(btrim(p_vat_id), ''),
      nullif(btrim(p_address_line1), ''),
      nullif(btrim(p_address_line2), ''),
      nullif(btrim(p_postal_code), ''),
      nullif(btrim(p_city), ''),
      coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      p_status,
      coalesce(p_tags, '{}'::text[]),
      p_marketing_consent,
      p_contact_consent,
      coalesce(p_hidden, false),
      'cms',
      auth.uid(),
      auth.uid()
    )
    returning id into v_customer_id;

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (v_customer_id, auth.uid(), 'customer_created', jsonb_build_object('source', 'cms', 'customer_type', v_customer_type));

    return v_customer_id;
  end if;

  update public.customers
  set customer_type = v_customer_type,
      full_name = nullif(btrim(p_full_name), ''),
      primary_email = lower(nullif(btrim(p_primary_email), '')),
      primary_phone = nullif(btrim(p_primary_phone), ''),
      language = nullif(btrim(p_language), ''),
      business_id = nullif(btrim(p_business_id), ''),
      vat_id = nullif(btrim(p_vat_id), ''),
      address_line1 = nullif(btrim(p_address_line1), ''),
      address_line2 = nullif(btrim(p_address_line2), ''),
      postal_code = nullif(btrim(p_postal_code), ''),
      city = nullif(btrim(p_city), ''),
      country_code = coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      status = p_status,
      tags = coalesce(p_tags, '{}'::text[]),
      marketing_consent = p_marketing_consent,
      contact_consent = p_contact_consent,
      hidden = coalesce(p_hidden, false),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id
  returning id into v_customer_id;

  if v_customer_id is null then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    v_customer_id,
    auth.uid(),
    'customer_updated',
    jsonb_build_object('status', p_status, 'hidden', coalesce(p_hidden, false), 'customer_type', v_customer_type)
  );

  return v_customer_id;
end;
$$;

create or replace function public.cms_bulk_import_customer_plates(
  p_customer_id uuid,
  p_license_plates text[],
  p_default_vehicle_name text default null
)
returns table (
  license_plate text,
  vehicle_id uuid,
  action text,
  conflict_customer_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plate text;
  v_vehicle_id uuid;
  v_conflict_count integer;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id and status <> 'deleted') then
    raise exception 'Customer not found';
  end if;

  foreach v_plate in array coalesce(p_license_plates, '{}'::text[]) loop
    v_plate := upper(regexp_replace(btrim(v_plate), '\s+', '', 'g'));
    if v_plate = '' then
      continue;
    end if;

    select count(distinct c.id)::integer
    into v_conflict_count
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where cv.customer_id <> p_customer_id
      and not cv.hidden
      and c.status not in ('deleted', 'merged')
      and not c.hidden
      and upper(cv.license_plate) = v_plate;

    insert into public.customer_vehicles(customer_id, license_plate, vehicle_name, hidden)
    values (p_customer_id, v_plate, nullif(btrim(p_default_vehicle_name), ''), false)
    on conflict (customer_id, upper(license_plate)) do update
    set hidden = false,
        vehicle_name = coalesce(nullif(btrim(p_default_vehicle_name), ''), public.customer_vehicles.vehicle_name),
        updated_at = now()
    returning id into v_vehicle_id;

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (
      p_customer_id,
      auth.uid(),
      'customer_plate_imported',
      jsonb_build_object(
        'license_plate', v_plate,
        'vehicle_id', v_vehicle_id,
        'conflict_customer_count', v_conflict_count
      )
    );

    license_plate := v_plate;
    vehicle_id := v_vehicle_id;
    action := case when v_conflict_count > 0 then 'saved_with_conflict' else 'saved' end;
    conflict_customer_count := v_conflict_count;
    return next;
  end loop;
end;
$$;

create or replace function public.cms_list_license_plate_conflicts()
returns table (
  license_plate text,
  customer_count integer,
  customers jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  return query
  with active_plate_owners as (
    select
      upper(cv.license_plate) as plate,
      c.id,
      c.full_name,
      c.primary_email,
      c.primary_phone,
      c.customer_type
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where not cv.hidden
      and not c.hidden
      and c.status not in ('deleted', 'merged')
      and nullif(btrim(cv.license_plate), '') is not null
  ),
  grouped as (
    select
      apo.plate,
      count(distinct apo.id)::integer as owner_count,
      jsonb_agg(
        distinct jsonb_build_object(
          'customer_id', apo.id,
          'full_name', apo.full_name,
          'email', apo.primary_email,
          'phone', apo.primary_phone,
          'customer_type', apo.customer_type
        )
      ) as owner_rows
    from active_plate_owners apo
    group by apo.plate
    having count(distinct apo.id) > 1
  )
  select
    grouped.plate,
    grouped.owner_count,
    grouped.owner_rows
  from grouped
  order by grouped.plate;
end;
$$;

grant execute on function public.cms_upsert_customer(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text[], boolean, boolean, boolean, text) to authenticated;
grant execute on function public.cms_bulk_import_customer_plates(uuid, text[], text) to authenticated;
grant execute on function public.cms_list_license_plate_conflicts() to authenticated;
