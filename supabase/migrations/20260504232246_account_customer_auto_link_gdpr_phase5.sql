create or replace function public.cms_auto_link_customer_activities(
  p_limit integer default 500,
  p_min_confidence integer default 85
)
returns table (
  activity_type text,
  linked_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 500), 1), 5000);
  v_min_confidence integer := least(greatest(coalesce(p_min_confidence, 85), 1), 100);
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  create temp table if not exists pg_temp.cms_auto_link_results (
    activity_type text not null,
    activity_id text not null,
    customer_id uuid not null,
    customer_vehicle_id uuid,
    match_source text not null,
    confidence integer not null
  ) on commit drop;

  truncate table pg_temp.cms_auto_link_results;

  with unique_plates as (
    select
      upper(btrim(cv.license_plate)) as plate,
      min(cv.customer_id) as customer_id,
      min(cv.id) as customer_vehicle_id,
      count(distinct cv.customer_id) as customer_count
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where not cv.hidden
      and not c.hidden
      and c.status not in ('deleted', 'merged')
      and nullif(btrim(cv.license_plate), '') is not null
    group by upper(btrim(cv.license_plate))
    having count(distinct cv.customer_id) = 1
  ),
  email_customers as (
    select lower(btrim(primary_email)) as email, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(btrim(primary_email), '') is not null
    group by lower(btrim(primary_email))
    having count(*) = 1
  ),
  phone_customers as (
    select regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g') as phone, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g'), '') is not null
    group by regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g')
    having count(*) = 1
  ),
  booking_candidates as (
    select distinct on (b.id)
      'booking'::text as activity_type,
      b.id::text as activity_id,
      coalesce(ec.customer_id, pc.customer_id, up.customer_id) as customer_id,
      case when ec.customer_id is null and pc.customer_id is null then up.customer_vehicle_id else null::uuid end as customer_vehicle_id,
      case
        when ec.customer_id is not null then 'email'
        when pc.customer_id is not null then 'phone'
        else 'auto_license_plate'
      end as match_source,
      case
        when ec.customer_id is not null then 85
        when pc.customer_id is not null then 75
        else 95
      end as confidence,
      case
        when ec.customer_id is not null then 1
        when pc.customer_id is not null then 2
        else 3
      end as priority
    from public.bookings b
    left join email_customers ec on lower(nullif(btrim(b.customer_email), '')) = ec.email
    left join phone_customers pc on regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = pc.phone
    left join unique_plates up on upper(btrim(coalesce(b.license_plate, ''))) = up.plate
    where b.customer_id is null
      and coalesce(ec.customer_id, pc.customer_id, up.customer_id) is not null
    order by b.id, priority
    limit v_limit
  ),
  updated_bookings as (
    update public.bookings b
    set customer_id = bc.customer_id,
        customer_vehicle_id = bc.customer_vehicle_id,
        customer_match_source = bc.match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    from booking_candidates bc
    where b.id = bc.activity_id::uuid
      and b.customer_id is null
      and bc.confidence >= v_min_confidence
    returning bc.*
  )
  insert into pg_temp.cms_auto_link_results
  select activity_type, activity_id, customer_id, customer_vehicle_id, match_source, confidence
  from updated_bookings;

  with email_customers as (
    select lower(btrim(primary_email)) as email, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(btrim(primary_email), '') is not null
    group by lower(btrim(primary_email))
    having count(*) = 1
  ),
  phone_customers as (
    select regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g') as phone, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g'), '') is not null
    group by regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g')
    having count(*) = 1
  ),
  order_candidates as (
    select distinct on (o.id)
      'order'::text as activity_type,
      o.id::text as activity_id,
      coalesce(ec.customer_id, pc.customer_id) as customer_id,
      null::uuid as customer_vehicle_id,
      case when ec.customer_id is not null then 'email' else 'phone' end as match_source,
      case when ec.customer_id is not null then 85 else 75 end as confidence,
      case when ec.customer_id is not null then 1 else 2 end as priority
    from public.orders o
    left join email_customers ec
      on lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = ec.email
    left join phone_customers pc
      on regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = pc.phone
    where o.customer_id is null
      and coalesce(ec.customer_id, pc.customer_id) is not null
    order by o.id, priority
    limit v_limit
  ),
  updated_orders as (
    update public.orders o
    set customer_id = oc.customer_id,
        customer_vehicle_id = oc.customer_vehicle_id,
        customer_match_source = oc.match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    from order_candidates oc
    where o.id = oc.activity_id::uuid
      and o.customer_id is null
      and oc.confidence >= v_min_confidence
    returning oc.*
  )
  insert into pg_temp.cms_auto_link_results
  select activity_type, activity_id, customer_id, customer_vehicle_id, match_source, confidence
  from updated_orders;

  with email_customers as (
    select lower(btrim(primary_email)) as email, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(btrim(primary_email), '') is not null
    group by lower(btrim(primary_email))
    having count(*) = 1
  ),
  phone_customers as (
    select regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g') as phone, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g'), '') is not null
    group by regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g')
    having count(*) = 1
  ),
  invoice_candidates as (
    select distinct on (i.id)
      'invoice'::text as activity_type,
      i.id::text as activity_id,
      coalesce(ec.customer_id, pc.customer_id) as customer_id,
      null::uuid as customer_vehicle_id,
      case when ec.customer_id is not null then 'email' else 'phone' end as match_source,
      case when ec.customer_id is not null then 85 else 75 end as confidence,
      case when ec.customer_id is not null then 1 else 2 end as priority
    from public.invoice_document_summaries i
    join public.invoice_documents d on d.id = i.id
    left join email_customers ec on lower(nullif(btrim(i.customer_email), '')) = ec.email
    left join phone_customers pc on regexp_replace(coalesce(i.customer_phone, ''), '\s+', '', 'g') = pc.phone
    where d.customer_id is null
      and coalesce(ec.customer_id, pc.customer_id) is not null
    order by i.id, priority
    limit v_limit
  ),
  updated_invoices as (
    update public.invoice_documents d
    set customer_id = ic.customer_id,
        customer_vehicle_id = ic.customer_vehicle_id,
        customer_match_source = ic.match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    from invoice_candidates ic
    where d.id = ic.activity_id::uuid
      and d.customer_id is null
      and ic.confidence >= v_min_confidence
    returning ic.*
  )
  insert into pg_temp.cms_auto_link_results
  select activity_type, activity_id, customer_id, customer_vehicle_id, match_source, confidence
  from updated_invoices;

  with unique_plates as (
    select
      upper(btrim(cv.license_plate)) as plate,
      min(cv.customer_id) as customer_id,
      min(cv.id) as customer_vehicle_id,
      count(distinct cv.customer_id) as customer_count
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where not cv.hidden
      and not c.hidden
      and c.status not in ('deleted', 'merged')
      and nullif(btrim(cv.license_plate), '') is not null
    group by upper(btrim(cv.license_plate))
    having count(distinct cv.customer_id) = 1
  ),
  phone_customers as (
    select regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g') as phone, min(id) as customer_id
    from public.customers
    where not hidden
      and status not in ('deleted', 'merged')
      and nullif(regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g'), '') is not null
    group by regexp_replace(coalesce(primary_phone, ''), '\s+', '', 'g')
    having count(*) = 1
  ),
  rescue_candidates as (
    select distinct on (e.id)
      'rescue'::text as activity_type,
      e.id::text as activity_id,
      coalesce(pc.customer_id, up.customer_id) as customer_id,
      case when pc.customer_id is null then up.customer_vehicle_id else null::uuid end as customer_vehicle_id,
      case when pc.customer_id is not null then 'phone' else 'auto_license_plate' end as match_source,
      case when pc.customer_id is not null then 75 else 95 end as confidence,
      case when pc.customer_id is not null then 2 else 3 end as priority
    from public.emergency_requests e
    left join phone_customers pc on regexp_replace(coalesce(e.phone, ''), '\s+', '', 'g') = pc.phone
    left join unique_plates up on upper(btrim(coalesce(e.license_plate, ''))) = up.plate
    where e.customer_id is null
      and coalesce(pc.customer_id, up.customer_id) is not null
    order by e.id, priority
    limit v_limit
  ),
  updated_rescue as (
    update public.emergency_requests e
    set customer_id = rc.customer_id,
        customer_vehicle_id = rc.customer_vehicle_id,
        customer_match_source = rc.match_source,
        customer_linked_at = now(),
        customer_linked_by = auth.uid()
    from rescue_candidates rc
    where e.id = rc.activity_id::bigint
      and e.customer_id is null
      and rc.confidence >= v_min_confidence
    returning rc.*
  )
  insert into pg_temp.cms_auto_link_results
  select activity_type, activity_id, customer_id, customer_vehicle_id, match_source, confidence
  from updated_rescue;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  select
    result.customer_id,
    auth.uid(),
    'customer_activity_auto_linked',
    jsonb_build_object(
      'activity_type', result.activity_type,
      'activity_id', result.activity_id,
      'customer_vehicle_id', result.customer_vehicle_id,
      'match_source', result.match_source,
      'confidence', result.confidence
    )
  from pg_temp.cms_auto_link_results result;

  return query
  select result.activity_type, count(*)::integer as linked_count
  from pg_temp.cms_auto_link_results result
  group by result.activity_type
  order by result.activity_type;
end;
$$;

create or replace function public.cms_export_customer_data(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer public.customers%rowtype;
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id;

  if not found then
    raise exception 'Customer not found';
  end if;

  return jsonb_build_object(
    'customer', to_jsonb(v_customer),
    'vehicles', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.created_at)
      from public.customer_vehicles v
      where v.customer_id = p_customer_id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at)
      from public.customer_notes n
      where n.customer_id = p_customer_id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at)
      from public.customer_events e
      where e.customer_id = p_customer_id
    ), '[]'::jsonb),
    'linked_activity', jsonb_build_object(
      'bookings', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', b.id,
          'customer_vehicle_id', b.customer_vehicle_id,
          'customer_match_source', b.customer_match_source,
          'customer_linked_at', b.customer_linked_at
        ) order by b.created_at)
        from public.bookings b
        where b.customer_id = p_customer_id
      ), '[]'::jsonb),
      'orders', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', o.id,
          'customer_vehicle_id', o.customer_vehicle_id,
          'customer_match_source', o.customer_match_source,
          'customer_linked_at', o.customer_linked_at
        ) order by o.created_at)
        from public.orders o
        where o.customer_id = p_customer_id
      ), '[]'::jsonb),
      'invoices', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', d.id,
          'customer_vehicle_id', d.customer_vehicle_id,
          'customer_match_source', d.customer_match_source,
          'customer_linked_at', d.customer_linked_at
        ) order by d.created_at)
        from public.invoice_documents d
        where d.customer_id = p_customer_id
      ), '[]'::jsonb),
      'rescue', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e.id,
          'customer_vehicle_id', e.customer_vehicle_id,
          'customer_match_source', e.customer_match_source,
          'customer_linked_at', e.customer_linked_at
        ) order by e.created_at)
        from public.emergency_requests e
        where e.customer_id = p_customer_id
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.cms_anonymize_customer(
  p_customer_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_anonymized',
    jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), ''))
  );

  update public.bookings
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.orders
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.invoice_documents
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.emergency_requests
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.customer_vehicles
  set license_plate = 'ANON-' || substr(id::text, 1, 8),
      vehicle_name = null,
      vin = null,
      notes = null,
      hidden = true,
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customer_notes
  set body = '[anonymized]'
  where customer_id = p_customer_id;

  update public.customers
  set primary_email = null,
      primary_phone = null,
      full_name = 'Anonymized customer',
      language = null,
      business_id = null,
      vat_id = null,
      address_line1 = null,
      address_line2 = null,
      postal_code = null,
      city = null,
      country_code = 'FI',
      status = 'deleted',
      tags = '{}'::text[],
      marketing_consent = false,
      contact_consent = false,
      hidden = true,
      source = 'gdpr_anonymized',
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;
end;
$$;

grant execute on function public.cms_auto_link_customer_activities(integer, integer) to authenticated;
grant execute on function public.cms_export_customer_data(uuid) to authenticated;
grant execute on function public.cms_anonymize_customer(uuid, text) to authenticated;
