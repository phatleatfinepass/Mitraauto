set lock_timeout = '5s';
set statement_timeout = '60s';

create index if not exists supplier_raw_rd_rims_fetched_at_desc_idx
  on public.supplier_raw_rd_rims (fetched_at desc nulls last);

create index if not exists supplier_raw_vt_rims_fetched_at_desc_idx
  on public.supplier_raw_vt_rims (fetched_at desc nulls last);

create index if not exists webshop_items_rim_last_synced_idx
  on public.webshop_items (product_type, last_rim_synced_at desc nulls last)
  where product_type = 'rim';

create index if not exists webshop_tire_sync_runs_started_desc_idx
  on public.webshop_tire_sync_runs (started_at desc nulls last, id desc);

create index if not exists webshop_rim_sync_runs_started_desc_idx
  on public.webshop_rim_sync_runs (started_at desc nulls last, id desc);

create index if not exists webshop_tire_sync_runs_active_idx
  on public.webshop_tire_sync_runs (status, started_at, processed_items)
  where status in ('running', 'processing', 'started');

create index if not exists webshop_rim_sync_runs_active_idx
  on public.webshop_rim_sync_runs (status, started_at, processed_items)
  where status in ('running', 'processing', 'started');

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
    order by r.started_at desc nulls last, r.id desc
    limit 1
  ),
  latest_rim_run as (
    select r.status, r.total_items, r.processed_items, r.error_message, r.started_at, r.finished_at
    from public.webshop_rim_sync_runs r
    order by r.started_at desc nulls last, r.id desc
    limit 1
  )
  select
    'tire'::text as product_type,
    (select count(*) from public.webshop_items w where w.product_type = 'tire')::bigint as total_items,
    (select count(*) from public.webshop_items w where w.product_type = 'tire' and w.product_ready is true)::bigint as ready_items,
    (select r.fetched_at from public.supplier_raw_rd_tires r order by r.fetched_at desc nulls last limit 1) as rd_raw_latest,
    (select v.fetched_at from public.supplier_raw_vt_tires v order by v.fetched_at desc nulls last limit 1) as vt_raw_latest,
    (select c.last_selected_at from public.catalog_selected_items c where c.product_type = 'tire' order by c.last_selected_at desc nulls last limit 1) as selected_latest,
    (select w.last_synced_at from public.webshop_items w where w.product_type = 'tire' order by w.last_synced_at desc nulls last limit 1) as webshop_latest,
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
    (select count(*) from public.webshop_items w where w.product_type = 'rim' and w.product_ready is true)::bigint as ready_items,
    (select r.fetched_at from public.supplier_raw_rd_rims r order by r.fetched_at desc nulls last limit 1) as rd_raw_latest,
    (select v.fetched_at from public.supplier_raw_vt_rims v order by v.fetched_at desc nulls last limit 1) as vt_raw_latest,
    (select c.last_selected_at from public.catalog_selected_items c where c.product_type = 'rim' order by c.last_selected_at desc nulls last limit 1) as selected_latest,
    (select w.last_rim_synced_at from public.webshop_items w where w.product_type = 'rim' order by w.last_rim_synced_at desc nulls last limit 1) as webshop_latest,
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
