-- Fast public brand helpers and CMS catalog health summary.
-- The storefront brand helpers should read precomputed filter option tables instead
-- of scanning large published item tables.

create or replace function public.catalog_list_tire_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select option_value as brand
  from public.webshop_tire_filter_options
  where option_group = 'brand'
    and nullif(btrim(option_value), '') is not null
  order by sort_order asc, lower(label) asc;
$$;

create or replace function public.catalog_list_rim_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select option_value as brand
  from public.webshop_rim_filter_options
  where option_group = 'brand'
    and nullif(btrim(option_value), '') is not null
  order by sort_order asc, lower(label) asc;
$$;

revoke all on function public.catalog_list_tire_brands_v1() from public;
revoke all on function public.catalog_list_rim_brands_v1() from public;

grant execute on function public.catalog_list_tire_brands_v1() to anon, authenticated, service_role;
grant execute on function public.catalog_list_rim_brands_v1() to anon, authenticated, service_role;

create or replace function public.catalog_get_health_summary_v1()
returns table (
  product_type text,
  total_items bigint,
  ready_items bigint,
  rd_raw_latest timestamptz,
  vt_raw_latest timestamptz,
  selected_latest timestamptz,
  webshop_latest timestamptz,
  running_jobs bigint,
  stuck_jobs bigint,
  latest_run_status text,
  latest_run_total_items integer,
  latest_run_processed_items integer,
  latest_run_error_message text,
  latest_run_started_at timestamptz,
  latest_run_finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
      and p.role in ('admin', 'super_admin')
  )
  into v_allowed;

  if not coalesce(v_allowed, false) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  with latest_tire_run as (
    select r.status, r.total_items, r.processed_items, r.error_message, r.started_at, r.finished_at
    from public.webshop_tire_sync_runs r
    order by r.started_at desc
    limit 1
  ),
  latest_rim_run as (
    select r.status, r.total_items, r.processed_items, r.error_message, r.started_at, r.finished_at
    from public.webshop_rim_sync_runs r
    order by r.started_at desc
    limit 1
  )
  select
    'tire'::text as product_type,
    (select count(*) from public.webshop_items w where w.product_type = 'tire')::bigint as total_items,
    (select count(*) from public.webshop_items w where w.product_type = 'tire' and coalesce(w.product_ready, false) = true)::bigint as ready_items,
    (select max(r.fetched_at) from public.supplier_raw_rd_tires r) as rd_raw_latest,
    (select max(v.fetched_at) from public.supplier_raw_vt_tires v) as vt_raw_latest,
    (select max(c.last_selected_at) from public.catalog_selected_items c where c.product_type = 'tire') as selected_latest,
    (select max(w.last_synced_at) from public.webshop_items w where w.product_type = 'tire') as webshop_latest,
    (select count(*) from public.webshop_tire_sync_runs r where r.status in ('running', 'processing', 'started'))::bigint as running_jobs,
    (select count(*) from public.webshop_tire_sync_runs r where r.status in ('running', 'processing', 'started') and coalesce(r.processed_items, 0) = 0 and r.started_at < now() - interval '30 minutes')::bigint as stuck_jobs,
    (select r.status::text from latest_tire_run r) as latest_run_status,
    (select r.total_items::integer from latest_tire_run r) as latest_run_total_items,
    (select r.processed_items::integer from latest_tire_run r) as latest_run_processed_items,
    (select r.error_message::text from latest_tire_run r) as latest_run_error_message,
    (select r.started_at from latest_tire_run r) as latest_run_started_at,
    (select r.finished_at from latest_tire_run r) as latest_run_finished_at
  union all
  select
    'rim'::text as product_type,
    (select count(*) from public.webshop_items w where w.product_type = 'rim')::bigint as total_items,
    (select count(*) from public.webshop_items w where w.product_type = 'rim' and coalesce(w.product_ready, false) = true)::bigint as ready_items,
    (select max(r.fetched_at) from public.supplier_raw_rd_rims r) as rd_raw_latest,
    (select max(v.fetched_at) from public.supplier_raw_vt_rims v) as vt_raw_latest,
    (select max(c.last_selected_at) from public.catalog_selected_items c where c.product_type = 'rim') as selected_latest,
    (select max(w.last_rim_synced_at) from public.webshop_items w where w.product_type = 'rim') as webshop_latest,
    (select count(*) from public.webshop_rim_sync_runs r where r.status in ('running', 'processing', 'started'))::bigint as running_jobs,
    (select count(*) from public.webshop_rim_sync_runs r where r.status in ('running', 'processing', 'started') and coalesce(r.processed_items, 0) = 0 and r.started_at < now() - interval '30 minutes')::bigint as stuck_jobs,
    (select r.status::text from latest_rim_run r) as latest_run_status,
    (select r.total_items::integer from latest_rim_run r) as latest_run_total_items,
    (select r.processed_items::integer from latest_rim_run r) as latest_run_processed_items,
    (select r.error_message::text from latest_rim_run r) as latest_run_error_message,
    (select r.started_at from latest_rim_run r) as latest_run_started_at,
    (select r.finished_at from latest_rim_run r) as latest_run_finished_at;
end;
$$;

revoke all on function public.catalog_get_health_summary_v1() from public;
grant execute on function public.catalog_get_health_summary_v1() to authenticated, service_role;
