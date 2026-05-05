alter table if exists public.bookings
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  add column if not exists customer_match_source text,
  add column if not exists customer_linked_at timestamptz,
  add column if not exists customer_linked_by uuid references auth.users(id) on delete set null;

alter table if exists public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  add column if not exists customer_match_source text,
  add column if not exists customer_linked_at timestamptz,
  add column if not exists customer_linked_by uuid references auth.users(id) on delete set null;

alter table if exists public.invoice_documents
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  add column if not exists customer_match_source text,
  add column if not exists customer_linked_at timestamptz,
  add column if not exists customer_linked_by uuid references auth.users(id) on delete set null;

alter table if exists public.emergency_requests
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  add column if not exists customer_match_source text,
  add column if not exists customer_linked_at timestamptz,
  add column if not exists customer_linked_by uuid references auth.users(id) on delete set null;

create index if not exists bookings_customer_id_idx on public.bookings(customer_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists invoice_documents_customer_id_idx on public.invoice_documents(customer_id);
create index if not exists emergency_requests_customer_id_idx on public.emergency_requests(customer_id);

create or replace function public.cms_list_customer_link_suggestions(
  p_customer_id uuid,
  p_limit integer default 80
)
returns table (
  activity_type text,
  activity_id text,
  title text,
  subtitle text,
  match_source text,
  confidence integer,
  occurred_at timestamptz,
  customer_id uuid,
  customer_vehicle_id uuid
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer public.customers%rowtype;
  v_email text;
  v_phone text;
  v_limit integer := least(greatest(coalesce(p_limit, 80), 1), 200);
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id
    and status not in ('deleted', 'merged');

  if not found then
    raise exception 'Customer not found';
  end if;

  v_email := lower(nullif(btrim(v_customer.primary_email), ''));
  v_phone := nullif(regexp_replace(coalesce(v_customer.primary_phone, ''), '\s+', '', 'g'), '');

  return query
  with active_vehicles as (
    select
      cv.id as vehicle_id,
      upper(btrim(cv.license_plate)) as plate
    from public.customer_vehicles cv
    where cv.customer_id = p_customer_id
      and not cv.hidden
      and nullif(btrim(cv.license_plate), '') is not null
      and not exists (
        select 1
        from public.customer_vehicles other_cv
        join public.customers other_c on other_c.id = other_cv.customer_id
        where other_cv.customer_id <> p_customer_id
          and not other_cv.hidden
          and not other_c.hidden
          and other_c.status not in ('deleted', 'merged')
          and upper(other_cv.license_plate) = upper(cv.license_plate)
      )
  ),
  booking_matches as (
    select
      'booking'::text as row_activity_type,
      b.id::text as row_activity_id,
      coalesce(nullif(b.service_name, ''), 'Booking')::text as row_title,
      concat_ws(' · ', nullif(b.license_plate, ''), nullif(b.customer_email, ''), nullif(b.customer_phone, ''))::text as row_subtitle,
      case
        when av.vehicle_id is not null then 'license_plate'
        when v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email then 'email'
        when v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone then 'phone'
        else 'unknown'
      end as row_match_source,
      case
        when av.vehicle_id is not null then 90
        when v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email then 85
        when v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone then 75
        else 0
      end as row_confidence,
      b.created_at::timestamptz as row_occurred_at,
      p_customer_id as row_customer_id,
      av.vehicle_id as row_customer_vehicle_id
    from public.bookings b
    left join active_vehicles av on upper(btrim(coalesce(b.license_plate, ''))) = av.plate
    where b.customer_id is null
      and (
        av.vehicle_id is not null
        or (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
        or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
      )
  ),
  order_matches as (
    select
      'order'::text as row_activity_type,
      o.id::text as row_activity_id,
      coalesce(nullif(o.cart_snapshot #>> '{items,0,name}', ''), nullif(o.cart_snapshot #>> '{items,0,title}', ''), 'Order')::text as row_title,
      concat_ws(' · ', nullif(o.email, ''), nullif(o.phone, ''), o.grand_total_cents::text)::text as row_subtitle,
      case
        when v_email is not null and lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = v_email then 'email'
        when v_phone is not null and regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = v_phone then 'phone'
        else 'unknown'
      end as row_match_source,
      case
        when v_email is not null and lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = v_email then 85
        when v_phone is not null and regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = v_phone then 75
        else 0
      end as row_confidence,
      o.created_at::timestamptz as row_occurred_at,
      p_customer_id as row_customer_id,
      null::uuid as row_customer_vehicle_id
    from public.orders o
    where o.customer_id is null
      and (
        (v_email is not null and lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = v_email)
        or (v_phone is not null and regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = v_phone)
      )
  ),
  invoice_matches as (
    select
      'invoice'::text as row_activity_type,
      i.id::text as row_activity_id,
      coalesce(nullif(i.document_number, ''), 'Receipt')::text as row_title,
      concat_ws(' · ', nullif(i.customer_email, ''), nullif(i.customer_phone, ''), i.total_cents::text)::text as row_subtitle,
      case
        when v_email is not null and lower(nullif(btrim(i.customer_email), '')) = v_email then 'email'
        when v_phone is not null and regexp_replace(coalesce(i.customer_phone, ''), '\s+', '', 'g') = v_phone then 'phone'
        else 'unknown'
      end as row_match_source,
      case
        when v_email is not null and lower(nullif(btrim(i.customer_email), '')) = v_email then 85
        when v_phone is not null and regexp_replace(coalesce(i.customer_phone, ''), '\s+', '', 'g') = v_phone then 75
        else 0
      end as row_confidence,
      i.created_at::timestamptz as row_occurred_at,
      p_customer_id as row_customer_id,
      null::uuid as row_customer_vehicle_id
    from public.invoice_document_summaries i
    where i.id not in (
        select d.id from public.invoice_documents d where d.customer_id is not null
      )
      and (
        (v_email is not null and lower(nullif(btrim(i.customer_email), '')) = v_email)
        or (v_phone is not null and regexp_replace(coalesce(i.customer_phone, ''), '\s+', '', 'g') = v_phone)
      )
  ),
  emergency_matches as (
    select
      'rescue'::text as row_activity_type,
      e.id::text as row_activity_id,
      coalesce(nullif(e.customer_name, ''), 'Rescue request')::text as row_title,
      concat_ws(' · ', nullif(e.license_plate, ''), nullif(e.phone, ''), nullif(e.city, ''))::text as row_subtitle,
      case
        when av.vehicle_id is not null then 'license_plate'
        when v_phone is not null and regexp_replace(coalesce(e.phone, ''), '\s+', '', 'g') = v_phone then 'phone'
        else 'unknown'
      end as row_match_source,
      case
        when av.vehicle_id is not null then 90
        when v_phone is not null and regexp_replace(coalesce(e.phone, ''), '\s+', '', 'g') = v_phone then 75
        else 0
      end as row_confidence,
      e.created_at::timestamptz as row_occurred_at,
      p_customer_id as row_customer_id,
      av.vehicle_id as row_customer_vehicle_id
    from public.emergency_requests e
    left join active_vehicles av on upper(btrim(coalesce(e.license_plate, ''))) = av.plate
    where e.customer_id is null
      and (
        av.vehicle_id is not null
        or (v_phone is not null and regexp_replace(coalesce(e.phone, ''), '\s+', '', 'g') = v_phone)
      )
  ),
  all_matches as (
    select * from booking_matches
    union all select * from order_matches
    union all select * from invoice_matches
    union all select * from emergency_matches
  )
  select
    all_matches.row_activity_type,
    all_matches.row_activity_id,
    all_matches.row_title,
    all_matches.row_subtitle,
    all_matches.row_match_source,
    all_matches.row_confidence,
    all_matches.row_occurred_at,
    all_matches.row_customer_id,
    all_matches.row_customer_vehicle_id
  from all_matches
  where all_matches.row_confidence > 0
  order by all_matches.row_confidence desc, all_matches.row_occurred_at desc nulls last
  limit v_limit;
end;
$$;

create or replace function public.cms_link_customer_activity(
  p_activity_type text,
  p_activity_id text,
  p_customer_id uuid,
  p_customer_vehicle_id uuid default null,
  p_match_source text default 'manual'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_type text := lower(nullif(btrim(p_activity_type), ''));
  v_match_source text := lower(coalesce(nullif(btrim(p_match_source), ''), 'manual'));
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if v_activity_type not in ('booking', 'order', 'invoice', 'rescue') then
    raise exception 'Invalid activity type';
  end if;

  if v_match_source not in ('manual', 'email', 'phone', 'license_plate', 'auto_license_plate') then
    raise exception 'Invalid match source';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id and status not in ('deleted', 'merged')) then
    raise exception 'Customer not found';
  end if;

  if p_customer_vehicle_id is not null and not exists (
    select 1 from public.customer_vehicles
    where id = p_customer_vehicle_id and customer_id = p_customer_id
  ) then
    raise exception 'Vehicle does not belong to customer';
  end if;

  if v_activity_type = 'booking' then
    update public.bookings
    set customer_id = p_customer_id,
        customer_vehicle_id = p_customer_vehicle_id,
        customer_match_source = v_match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'order' then
    update public.orders
    set customer_id = p_customer_id,
        customer_vehicle_id = p_customer_vehicle_id,
        customer_match_source = v_match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'invoice' then
    update public.invoice_documents
    set customer_id = p_customer_id,
        customer_vehicle_id = p_customer_vehicle_id,
        customer_match_source = v_match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'rescue' then
    update public.emergency_requests
    set customer_id = p_customer_id,
        customer_vehicle_id = p_customer_vehicle_id,
        customer_match_source = v_match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    where id = p_activity_id::bigint;
  end if;

  if not found then
    raise exception 'Activity not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_activity_linked',
    jsonb_build_object(
      'activity_type', v_activity_type,
      'activity_id', p_activity_id,
      'customer_vehicle_id', p_customer_vehicle_id,
      'match_source', v_match_source
    )
  );
end;
$$;

create or replace function public.cms_unlink_customer_activity(
  p_activity_type text,
  p_activity_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_type text := lower(nullif(btrim(p_activity_type), ''));
  v_customer_id uuid;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if v_activity_type = 'booking' then
    select customer_id into v_customer_id
    from public.bookings
    where id = p_activity_id::uuid;

    if not found then
      raise exception 'Activity not found';
    end if;

    update public.bookings
    set customer_id = null,
        customer_vehicle_id = null,
        customer_match_source = null,
        customer_linked_at = null,
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'order' then
    select customer_id into v_customer_id
    from public.orders
    where id = p_activity_id::uuid;

    if not found then
      raise exception 'Activity not found';
    end if;

    update public.orders
    set customer_id = null,
        customer_vehicle_id = null,
        customer_match_source = null,
        customer_linked_at = null,
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'invoice' then
    select customer_id into v_customer_id
    from public.invoice_documents
    where id = p_activity_id::uuid;

    if not found then
      raise exception 'Activity not found';
    end if;

    update public.invoice_documents
    set customer_id = null,
        customer_vehicle_id = null,
        customer_match_source = null,
        customer_linked_at = null,
        customer_linked_by = auth.uid()
    where id = p_activity_id::uuid;
  elsif v_activity_type = 'rescue' then
    select customer_id into v_customer_id
    from public.emergency_requests
    where id = p_activity_id::bigint;

    if not found then
      raise exception 'Activity not found';
    end if;

    update public.emergency_requests
    set customer_id = null,
        customer_vehicle_id = null,
        customer_match_source = null,
        customer_linked_at = null,
        customer_linked_by = auth.uid()
    where id = p_activity_id::bigint;
  else
    raise exception 'Invalid activity type';
  end if;

  if v_customer_id is not null then
    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (
      v_customer_id,
      auth.uid(),
      'customer_activity_unlinked',
      jsonb_build_object('activity_type', v_activity_type, 'activity_id', p_activity_id)
    );
  end if;
end;
$$;

grant execute on function public.cms_list_customer_link_suggestions(uuid, integer) to authenticated;
grant execute on function public.cms_link_customer_activity(text, text, uuid, uuid, text) to authenticated;
grant execute on function public.cms_unlink_customer_activity(text, text) to authenticated;
