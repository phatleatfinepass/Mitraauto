create or replace function public.cms_list_customer_overview(p_search text default null, p_limit integer default 80)
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
  source text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_search text := lower(nullif(btrim(p_search), ''));
  v_limit integer := least(greatest(coalesce(p_limit, 80), 1), 200);
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
         where v.customer_id = c.id and not v.hidden),
        '{}'::text[]
      ) as plates,
      0::integer as booking_count,
      0::integer as order_count,
      0::integer as invoice_count,
      c.updated_at::timestamptz as last_activity_at
    from public.customers c
    where not c.hidden and c.status <> 'deleted'
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
    case when c.id is null then 'activity' else 'customer_record' end as source
  from rolled r
  left join public.customers c
    on lower(c.primary_email) = r.email
    or (c.primary_email is null and c.primary_phone = r.phone)
  where v_search is null
    or lower(coalesce(c.full_name, r.full_name, '')) like '%' || v_search || '%'
    or lower(coalesce(c.primary_email, r.email, '')) like '%' || v_search || '%'
    or lower(coalesce(c.primary_phone, r.phone, '')) like '%' || v_search || '%'
    or exists (
      select 1 from unnest(r.license_plates) as p
      where lower(p) like '%' || v_search || '%'
    )
  order by greatest(
    coalesce(r.last_activity_at, '-infinity'::timestamptz),
    coalesce(c.updated_at, '-infinity'::timestamptz)
  ) desc nulls last
  limit v_limit;
end;
$$;

grant execute on function public.cms_list_customer_overview(text, integer) to authenticated;
