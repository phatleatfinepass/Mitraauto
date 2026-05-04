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
      lower(nullif(btrim(b.customer_email), '')) as row_email,
      nullif(btrim(b.customer_phone), '') as row_phone,
      nullif(btrim(b.customer_name), '') as row_full_name,
      array_remove(array_agg(distinct nullif(upper(btrim(b.license_plate)), '')), null) as row_plates,
      count(*)::integer as row_booking_count,
      0::integer as row_order_count,
      0::integer as row_invoice_count,
      max(b.created_at)::timestamptz as row_last_activity_at
    from public.bookings b
    group by 1, 2, 3
  ),
  order_customers as (
    select
      lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) as row_email,
      nullif(btrim(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}')), '') as row_phone,
      nullif(btrim(coalesce(
        o.cart_snapshot #>> '{customer,name}',
        nullif(btrim(concat_ws(' ', o.cart_snapshot #>> '{customer,firstName}', o.cart_snapshot #>> '{customer,lastName}')), '')
      )), '') as row_full_name,
      '{}'::text[] as row_plates,
      0::integer as row_booking_count,
      count(*)::integer as row_order_count,
      0::integer as row_invoice_count,
      max(o.created_at)::timestamptz as row_last_activity_at
    from public.orders o
    group by 1, 2, 3
  ),
  invoice_customers as (
    select
      lower(nullif(btrim(i.customer_email), '')) as row_email,
      nullif(btrim(i.customer_phone), '') as row_phone,
      nullif(btrim(i.customer_name), '') as row_full_name,
      '{}'::text[] as row_plates,
      0::integer as row_booking_count,
      0::integer as row_order_count,
      count(*)::integer as row_invoice_count,
      max(i.created_at)::timestamptz as row_last_activity_at
    from public.invoice_document_summaries i
    group by 1, 2, 3
  ),
  manual_customers as (
    select
      lower(nullif(btrim(c.primary_email), '')) as row_email,
      nullif(btrim(c.primary_phone), '') as row_phone,
      nullif(btrim(c.full_name), '') as row_full_name,
      coalesce(
        (select array_remove(array_agg(distinct nullif(upper(btrim(v.license_plate)), '')), null)
         from public.customer_vehicles v
         where v.customer_id = c.id and (p_include_hidden or not v.hidden)),
        '{}'::text[]
      ) as row_plates,
      0::integer as row_booking_count,
      0::integer as row_order_count,
      0::integer as row_invoice_count,
      c.updated_at::timestamptz as row_last_activity_at
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
      coalesce(combined.row_email, combined.row_phone, lower(combined.row_full_name), 'unknown') as rolled_customer_key,
      max(combined.row_full_name) filter (where combined.row_full_name is not null) as rolled_full_name,
      max(combined.row_email) filter (where combined.row_email is not null) as rolled_email,
      max(combined.row_phone) filter (where combined.row_phone is not null) as rolled_phone,
      array_remove(array_agg(distinct plate), null) as rolled_license_plates,
      sum(combined.row_booking_count)::integer as rolled_booking_count,
      sum(combined.row_order_count)::integer as rolled_order_count,
      sum(combined.row_invoice_count)::integer as rolled_invoice_count,
      max(combined.row_last_activity_at)::timestamptz as rolled_last_activity_at
    from combined
    left join lateral unnest(combined.row_plates) as plate on true
    where coalesce(combined.row_email, combined.row_phone, combined.row_full_name) is not null
    group by coalesce(combined.row_email, combined.row_phone, lower(combined.row_full_name), 'unknown')
  )
  select
    r.rolled_customer_key,
    c.id as customer_id,
    coalesce(c.full_name, r.rolled_full_name, 'Customer') as full_name,
    coalesce(c.primary_email, r.rolled_email) as email,
    coalesce(c.primary_phone, r.rolled_phone) as phone,
    r.rolled_license_plates,
    r.rolled_booking_count,
    r.rolled_order_count,
    r.rolled_invoice_count,
    nullif(
      greatest(
        coalesce(r.rolled_last_activity_at, '-infinity'::timestamptz),
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
    on lower(c.primary_email) = r.rolled_email
    or (c.primary_email is null and c.primary_phone = r.rolled_phone)
  where (p_include_hidden or c.id is null or (not c.hidden and c.status <> 'deleted'))
    and (v_status is null or lower(coalesce(c.status, 'active')) = v_status)
    and (v_tag is null or exists (
      select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
      where lower(tag) = v_tag
    ))
    and (
      v_search is null
      or lower(coalesce(c.full_name, r.rolled_full_name, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_email, r.rolled_email, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_phone, r.rolled_phone, '')) like '%' || v_search || '%'
      or exists (
        select 1 from unnest(r.rolled_license_plates) as p
        where lower(p) like '%' || v_search || '%'
      )
      or exists (
        select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
        where lower(tag) like '%' || v_search || '%'
      )
    )
  order by greatest(
    coalesce(r.rolled_last_activity_at, '-infinity'::timestamptz),
    coalesce(c.updated_at, '-infinity'::timestamptz)
  ) desc nulls last
  limit v_limit;
end;
$$;
