create table if not exists public.customer_license_plate_resolutions (
  id uuid primary key default gen_random_uuid(),
  license_plate text not null,
  resolution text not null check (resolution in ('shared', 'moved_to_customer')),
  primary_customer_id uuid references public.customers(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz not null default now(),
  active boolean not null default true
);

create unique index if not exists customer_license_plate_resolutions_active_idx
  on public.customer_license_plate_resolutions (upper(license_plate))
  where active;

alter table public.customer_license_plate_resolutions enable row level security;

drop policy if exists "CMS license plate resolutions read" on public.customer_license_plate_resolutions;
create policy "CMS license plate resolutions read"
on public.customer_license_plate_resolutions for select
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS license plate resolutions write" on public.customer_license_plate_resolutions;
create policy "CMS license plate resolutions write"
on public.customer_license_plate_resolutions for all
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

grant select, insert, update on public.customer_license_plate_resolutions to authenticated;

drop function if exists public.cms_list_license_plate_conflicts();

create or replace function public.cms_list_license_plate_conflicts()
returns table (
  license_plate text,
  customer_count integer,
  customers jsonb,
  resolution text,
  primary_customer_id uuid,
  resolution_details jsonb
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
  with active_vehicle_owners as (
    select
      upper(btrim(cv.license_plate)) as plate,
      c.id as customer_id,
      c.full_name,
      c.primary_email,
      c.primary_phone,
      c.customer_type
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where not cv.hidden
      and nullif(btrim(cv.license_plate), '') is not null
      and c.status not in ('deleted', 'merged')
  ),
  grouped as (
    select
      avo.plate,
      count(distinct avo.customer_id)::integer as owner_count,
      jsonb_agg(
        distinct jsonb_build_object(
          'customer_id', avo.customer_id,
          'full_name', avo.full_name,
          'email', avo.primary_email,
          'phone', avo.primary_phone,
          'customer_type', avo.customer_type
        )
      ) as owner_rows
    from active_vehicle_owners avo
    group by avo.plate
    having count(distinct avo.customer_id) > 1
  )
  select
    g.plate,
    g.owner_count,
    g.owner_rows,
    r.resolution,
    r.primary_customer_id,
    coalesce(r.details, '{}'::jsonb)
  from grouped g
  left join public.customer_license_plate_resolutions r
    on upper(r.license_plate) = g.plate
   and r.active
  order by case when r.resolution = 'shared' then 1 else 0 end, g.plate;
end;
$$;

create or replace function public.cms_resolve_license_plate_conflict(
  p_license_plate text,
  p_resolution text,
  p_primary_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plate text := upper(nullif(btrim(p_license_plate), ''));
  v_resolution text := lower(nullif(btrim(p_resolution), ''));
  v_primary_vehicle_id uuid;
  v_source_vehicle_ids uuid[];
  v_affected_customers uuid[];
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if v_plate is null then
    raise exception 'License plate is required';
  end if;

  if v_resolution not in ('shared', 'moved_to_customer') then
    raise exception 'Invalid license plate conflict resolution';
  end if;

  update public.customer_license_plate_resolutions
  set active = false
  where upper(license_plate) = v_plate
    and active;

  if v_resolution = 'shared' then
    insert into public.customer_license_plate_resolutions(
      license_plate,
      resolution,
      primary_customer_id,
      details,
      created_by
    )
    values (
      v_plate,
      'shared',
      null,
      jsonb_build_object('reason', 'multiple_customer_accounts_allowed'),
      auth.uid()
    );

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    select
      cv.customer_id,
      auth.uid(),
      'customer_license_plate_shared_allowed',
      jsonb_build_object('license_plate', v_plate)
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where upper(cv.license_plate) = v_plate
      and not cv.hidden
      and c.status not in ('deleted', 'merged');

    return jsonb_build_object('license_plate', v_plate, 'resolution', 'shared');
  end if;

  if p_primary_customer_id is null then
    raise exception 'Primary customer is required when moving a plate';
  end if;

  if not exists (
    select 1 from public.customers
    where id = p_primary_customer_id
      and status not in ('deleted', 'merged')
  ) then
    raise exception 'Primary customer is not active';
  end if;

  select id
  into v_primary_vehicle_id
  from public.customer_vehicles
  where customer_id = p_primary_customer_id
    and upper(license_plate) = v_plate
  order by hidden, updated_at desc nulls last
  limit 1;

  if v_primary_vehicle_id is null then
    select id
    into v_primary_vehicle_id
    from public.customer_vehicles
    where upper(license_plate) = v_plate
      and not hidden
    order by updated_at desc nulls last
    limit 1;

    if v_primary_vehicle_id is null then
      raise exception 'No active vehicle found for license plate %', v_plate;
    end if;

    update public.customer_vehicles
    set customer_id = p_primary_customer_id,
        hidden = false,
        updated_at = now()
    where id = v_primary_vehicle_id;
  else
    update public.customer_vehicles
    set hidden = false,
        updated_at = now()
    where id = v_primary_vehicle_id;
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
  into v_source_vehicle_ids
  from public.customer_vehicles
  where upper(license_plate) = v_plate
    and id <> v_primary_vehicle_id
    and not hidden;

  select coalesce(array_agg(distinct customer_id), '{}'::uuid[])
  into v_affected_customers
  from public.customer_vehicles
  where id = any(v_source_vehicle_ids);

  update public.bookings
  set customer_id = p_primary_customer_id,
      customer_vehicle_id = v_primary_vehicle_id,
      customer_match_source = 'manual'
  where customer_vehicle_id = any(v_source_vehicle_ids)
     or (upper(coalesce(license_plate, '')) = v_plate and customer_id = any(v_affected_customers));

  update public.orders
  set customer_id = p_primary_customer_id,
      customer_vehicle_id = v_primary_vehicle_id,
      customer_match_source = 'manual'
  where customer_vehicle_id = any(v_source_vehicle_ids)
     or (customer_id = any(v_affected_customers));

  update public.invoice_documents
  set customer_id = p_primary_customer_id,
      customer_vehicle_id = v_primary_vehicle_id,
      customer_match_source = 'manual'
  where customer_vehicle_id = any(v_source_vehicle_ids)
     or (customer_id = any(v_affected_customers));

  update public.emergency_requests
  set customer_id = p_primary_customer_id,
      customer_vehicle_id = v_primary_vehicle_id,
      customer_match_source = 'manual'
  where customer_vehicle_id = any(v_source_vehicle_ids)
     or (upper(coalesce(license_plate, '')) = v_plate and customer_id = any(v_affected_customers));

  update public.customer_vehicles
  set hidden = true,
      updated_at = now()
  where id = any(v_source_vehicle_ids);

  insert into public.customer_license_plate_resolutions(
    license_plate,
    resolution,
    primary_customer_id,
    details,
    created_by
  )
  values (
    v_plate,
    'moved_to_customer',
    p_primary_customer_id,
    jsonb_build_object(
      'primary_vehicle_id', v_primary_vehicle_id,
      'hidden_vehicle_ids', v_source_vehicle_ids,
      'affected_customer_ids', v_affected_customers
    ),
    auth.uid()
  );

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_primary_customer_id,
    auth.uid(),
    'customer_license_plate_moved_to_customer',
    jsonb_build_object(
      'license_plate', v_plate,
      'primary_vehicle_id', v_primary_vehicle_id,
      'hidden_vehicle_ids', v_source_vehicle_ids,
      'affected_customer_ids', v_affected_customers
    )
  );

  return jsonb_build_object(
    'license_plate', v_plate,
    'resolution', 'moved_to_customer',
    'primary_customer_id', p_primary_customer_id,
    'primary_vehicle_id', v_primary_vehicle_id,
    'hidden_vehicle_ids', v_source_vehicle_ids
  );
end;
$$;

grant execute on function public.cms_list_license_plate_conflicts() to authenticated;
grant execute on function public.cms_resolve_license_plate_conflict(text, text, uuid) to authenticated;
