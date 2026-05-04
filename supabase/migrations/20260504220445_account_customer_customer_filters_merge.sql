create or replace function public.cms_list_customer_overview_v2(
  p_search text default null,
  p_limit integer default 120,
  p_status text default null,
  p_tag text default null,
  p_include_hidden boolean default false
)
returns table (
  customer_key text,
  customer_id uuid,
  full_name text,
  email text,
  phone text,
  license_plates text[],
  booking_count integer,
  order_count integer,
  invoice_count integer,
  last_activity_at timestamptz,
  status text,
  source text,
  hidden boolean,
  tags text[]
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_search text := lower(nullif(btrim(p_search), ''));
  v_status text := lower(nullif(btrim(p_status), ''));
  v_tag text := lower(nullif(btrim(p_tag), ''));
  v_limit integer := least(greatest(coalesce(p_limit, 120), 1), 200);
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  return query
  with booking_customers as (
    select
      lower(nullif(btrim(customer_email), '')) as email,
      nullif(btrim(customer_phone), '') as phone,
      nullif(btrim(customer_name), '') as full_name,
      array_remove(array_agg(distinct nullif(upper(btrim(license_plate)), '')), null) as plates,
      count(*)::integer as booking_count,
      0::integer as order_count,
      0::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.bookings
    group by 1, 2, 3
  ),
  order_customers as (
    select
      lower(nullif(btrim(coalesce(email, cart_snapshot #>> '{customer,email}', cart_snapshot #>> '{billing,email}')), '')) as email,
      nullif(btrim(coalesce(phone, cart_snapshot #>> '{customer,phone}', cart_snapshot #>> '{billing,phone}')), '') as phone,
      nullif(btrim(coalesce(
        cart_snapshot #>> '{customer,name}',
        nullif(btrim(concat_ws(' ', cart_snapshot #>> '{customer,firstName}', cart_snapshot #>> '{customer,lastName}')), '')
      )), '') as full_name,
      '{}'::text[] as plates,
      0::integer as booking_count,
      count(*)::integer as order_count,
      0::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.orders
    group by 1, 2, 3
  ),
  invoice_customers as (
    select
      lower(nullif(btrim(customer_email), '')) as email,
      nullif(btrim(customer_phone), '') as phone,
      nullif(btrim(customer_name), '') as full_name,
      '{}'::text[] as plates,
      0::integer as booking_count,
      0::integer as order_count,
      count(*)::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.invoice_document_summaries
    group by 1, 2, 3
  ),
  manual_customers as (
    select
      lower(nullif(btrim(primary_email), '')) as email,
      nullif(btrim(primary_phone), '') as phone,
      nullif(btrim(full_name), '') as full_name,
      coalesce(
        (select array_remove(array_agg(distinct nullif(upper(btrim(v.license_plate)), '')), null)
         from public.customer_vehicles v
         where v.customer_id = c.id and (p_include_hidden or not v.hidden)),
        '{}'::text[]
      ) as plates,
      0::integer as booking_count,
      0::integer as order_count,
      0::integer as invoice_count,
      c.updated_at::timestamptz as last_activity_at
    from public.customers c
    where (p_include_hidden or (not c.hidden and c.status <> 'deleted'))
  ),
  combined as (
    select * from booking_customers
    union all select * from order_customers
    union all select * from invoice_customers
    union all select * from manual_customers
  ),
  rolled as (
    select
      coalesce(email, phone, lower(full_name), 'unknown') as customer_key,
      max(full_name) filter (where full_name is not null) as full_name,
      max(email) filter (where email is not null) as email,
      max(phone) filter (where phone is not null) as phone,
      array_remove(array_agg(distinct plate), null) as license_plates,
      sum(booking_count)::integer as booking_count,
      sum(order_count)::integer as order_count,
      sum(invoice_count)::integer as invoice_count,
      max(last_activity_at)::timestamptz as last_activity_at
    from combined
    left join lateral unnest(combined.plates) as plate on true
    where coalesce(email, phone, full_name) is not null
    group by coalesce(email, phone, lower(full_name), 'unknown')
  )
  select
    r.customer_key,
    c.id as customer_id,
    coalesce(c.full_name, r.full_name, 'Customer') as full_name,
    coalesce(c.primary_email, r.email) as email,
    coalesce(c.primary_phone, r.phone) as phone,
    r.license_plates,
    r.booking_count,
    r.order_count,
    r.invoice_count,
    nullif(
      greatest(
        coalesce(r.last_activity_at, '-infinity'::timestamptz),
        coalesce(c.updated_at, '-infinity'::timestamptz)
      ),
      '-infinity'::timestamptz
    )::timestamptz as last_activity_at,
    coalesce(c.status, 'active') as status,
    case when c.id is null then 'activity' else 'customer_record' end as source,
    coalesce(c.hidden, false) as hidden,
    coalesce(c.tags, '{}'::text[]) as tags
  from rolled r
  left join public.customers c
    on lower(c.primary_email) = r.email
    or (c.primary_email is null and c.primary_phone = r.phone)
  where (p_include_hidden or c.id is null or (not c.hidden and c.status <> 'deleted'))
    and (v_status is null or lower(coalesce(c.status, 'active')) = v_status)
    and (v_tag is null or exists (
      select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
      where lower(tag) = v_tag
    ))
    and (
      v_search is null
      or lower(coalesce(c.full_name, r.full_name, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_email, r.email, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_phone, r.phone, '')) like '%' || v_search || '%'
      or exists (
        select 1 from unnest(r.license_plates) as p
        where lower(p) like '%' || v_search || '%'
      )
      or exists (
        select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
        where lower(tag) like '%' || v_search || '%'
      )
    )
  order by greatest(
    coalesce(r.last_activity_at, '-infinity'::timestamptz),
    coalesce(c.updated_at, '-infinity'::timestamptz)
  ) desc nulls last
  limit v_limit;
end;
$$;

create or replace function public.cms_merge_customers(
  p_primary_customer_id uuid,
  p_duplicate_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duplicate public.customers%rowtype;
  v_primary public.customers%rowtype;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_primary_customer_id = p_duplicate_customer_id then
    raise exception 'Cannot merge the same customer';
  end if;

  select * into v_primary from public.customers where id = p_primary_customer_id for update;
  if not found then
    raise exception 'Primary customer not found';
  end if;

  select * into v_duplicate from public.customers where id = p_duplicate_customer_id for update;
  if not found then
    raise exception 'Duplicate customer not found';
  end if;

  update public.customers
  set primary_email = coalesce(nullif(primary_email, ''), v_duplicate.primary_email),
      primary_phone = coalesce(nullif(primary_phone, ''), v_duplicate.primary_phone),
      full_name = coalesce(nullif(full_name, ''), v_duplicate.full_name),
      language = coalesce(nullif(language, ''), v_duplicate.language),
      business_id = coalesce(nullif(business_id, ''), v_duplicate.business_id),
      vat_id = coalesce(nullif(vat_id, ''), v_duplicate.vat_id),
      address_line1 = coalesce(nullif(address_line1, ''), v_duplicate.address_line1),
      address_line2 = coalesce(nullif(address_line2, ''), v_duplicate.address_line2),
      postal_code = coalesce(nullif(postal_code, ''), v_duplicate.postal_code),
      city = coalesce(nullif(city, ''), v_duplicate.city),
      tags = (
        select array_agg(distinct tag order by tag)
        from unnest(coalesce(public.customers.tags, '{}'::text[]) || coalesce(v_duplicate.tags, '{}'::text[])) as tag
      ),
      marketing_consent = coalesce(marketing_consent, v_duplicate.marketing_consent),
      contact_consent = coalesce(contact_consent, v_duplicate.contact_consent),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_primary_customer_id;

  update public.customer_vehicles
  set customer_id = p_primary_customer_id,
      updated_at = now()
  where customer_id = p_duplicate_customer_id
    and not exists (
      select 1
      from public.customer_vehicles existing
      where existing.customer_id = p_primary_customer_id
        and upper(existing.license_plate) = upper(public.customer_vehicles.license_plate)
    );

  update public.customer_vehicles
  set hidden = true,
      updated_at = now()
  where customer_id = p_duplicate_customer_id;

  update public.customer_notes
  set customer_id = p_primary_customer_id
  where customer_id = p_duplicate_customer_id;

  update public.customer_events
  set customer_id = p_primary_customer_id
  where customer_id = p_duplicate_customer_id;

  update public.customers
  set status = 'merged',
      hidden = true,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_duplicate_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_primary_customer_id,
    auth.uid(),
    'customer_merged',
    jsonb_build_object('duplicate_customer_id', p_duplicate_customer_id)
  );
end;
$$;

grant execute on function public.cms_list_customer_overview_v2(text, integer, text, text, boolean) to authenticated;
grant execute on function public.cms_merge_customers(uuid, uuid) to authenticated;
