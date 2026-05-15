-- Phase 9 hardening:
-- - Public read-model tables are read-only to anon/authenticated clients.
-- - Only service_role can mutate generated read-model tables.
-- - Summary views provide stable operations diagnostics without querying raw feeds from the frontend.

revoke insert, update, delete on public.webshop_tire_search_index from authenticated;
revoke insert, update, delete on public.webshop_rim_search_index from authenticated;
revoke insert, update, delete on public.webshop_tire_filter_options from authenticated;
revoke insert, update, delete on public.webshop_rim_filter_options from authenticated;

grant select on public.webshop_tire_search_index to anon, authenticated;
grant select on public.webshop_rim_search_index to anon, authenticated;
grant select on public.webshop_tire_filter_options to anon, authenticated;
grant select on public.webshop_rim_filter_options to anon, authenticated;

grant select, insert, update, delete on public.webshop_tire_search_index to service_role;
grant select, insert, update, delete on public.webshop_rim_search_index to service_role;
grant select, insert, update, delete on public.webshop_tire_filter_options to service_role;
grant select, insert, update, delete on public.webshop_rim_filter_options to service_role;

drop policy if exists "service role can manage tire filter options" on public.webshop_tire_filter_options;
create policy "service role can manage tire filter options"
  on public.webshop_tire_filter_options
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.webshop_tire_search_index is
  'Precomputed public tire storefront search index. anon/authenticated may select published-ready rows through RLS; service_role refreshes the index.';

comment on table public.webshop_rim_search_index is
  'Precomputed public rim storefront search index. anon/authenticated may select published-ready rows through RLS; service_role refreshes the index.';

comment on table public.webshop_tire_filter_options is
  'Precomputed public tire storefront filter options. anon/authenticated may select; service_role refreshes options.';

comment on table public.webshop_rim_filter_options is
  'Precomputed public rim storefront filter options. anon/authenticated may select; service_role refreshes options.';

drop view if exists public.catalog_product_readiness_summary_v1;
create view public.catalog_product_readiness_summary_v1
with (security_invoker = true)
as
select
  product_type,
  count(*)::bigint as total_published_rows,
  count(*) filter (where is_visible and publish_status = 'published')::bigint as visible_published_rows,
  count(*) filter (where is_visible and publish_status = 'published' and product_ready)::bigint as product_ready_rows,
  count(*) filter (where not product_ready or not is_visible or publish_status is distinct from 'published')::bigint as not_ready_or_hidden_rows,
  jsonb_object_agg(primary_readiness_reason, reason_count order by reason_count desc)
    filter (where primary_readiness_reason is not null) as primary_reason_counts,
  max(updated_at) as latest_updated_at,
  max(coalesce(last_synced_at, last_rim_synced_at)) as latest_published_at
from (
  select
    product_type,
    is_visible,
    publish_status,
    product_ready,
    primary_readiness_reason,
    updated_at,
    last_synced_at,
    last_rim_synced_at,
    count(*) over (partition by product_type, primary_readiness_reason) as reason_count
  from public.webshop_items
  where product_type in ('tire', 'rim')
) summarized
group by product_type;

drop view if exists public.catalog_sync_health_summary_v1;
create view public.catalog_sync_health_summary_v1
with (security_invoker = true)
as
select
  'tire'::text as product_type,
  (select max(fetched_at) from public.supplier_raw_rd_tires) as latest_rd_raw_at,
  (select max(fetched_at) from public.supplier_raw_vt_tires) as latest_vt_raw_at,
  (select max(last_selected_at) from public.catalog_selected_items where product_type = 'tire') as latest_selected_at,
  (select max(last_synced_at) from public.webshop_items where product_type = 'tire') as latest_webshop_published_at,
  (select status from public.webshop_tire_sync_runs order by started_at desc limit 1) as latest_publish_status,
  (select total_items from public.webshop_tire_sync_runs order by started_at desc limit 1) as latest_publish_total_items,
  (select processed_items from public.webshop_tire_sync_runs order by started_at desc limit 1) as latest_publish_processed_items,
  (select count(*) from public.webshop_tire_sync_runs where status = 'running' and started_at < now() - interval '30 minutes')::bigint as stale_running_publish_jobs
union all
select
  'rim'::text as product_type,
  (select max(fetched_at) from public.supplier_raw_rd_rims) as latest_rd_raw_at,
  (select max(fetched_at) from public.supplier_raw_vt_rims) as latest_vt_raw_at,
  (select max(last_selected_at) from public.catalog_selected_items where product_type = 'rim') as latest_selected_at,
  (select max(last_rim_synced_at) from public.webshop_items where product_type = 'rim') as latest_webshop_published_at,
  (select status from public.webshop_rim_sync_runs order by started_at desc limit 1) as latest_publish_status,
  (select total_items from public.webshop_rim_sync_runs order by started_at desc limit 1) as latest_publish_total_items,
  (select processed_items from public.webshop_rim_sync_runs order by started_at desc limit 1) as latest_publish_processed_items,
  (select count(*) from public.webshop_rim_sync_runs where status = 'running' and started_at < now() - interval '30 minutes')::bigint as stale_running_publish_jobs;

revoke all on public.catalog_product_readiness_summary_v1 from public;
revoke all on public.catalog_sync_health_summary_v1 from public;

grant select on public.catalog_product_readiness_summary_v1 to authenticated, service_role;
grant select on public.catalog_sync_health_summary_v1 to authenticated, service_role;

comment on view public.catalog_product_readiness_summary_v1 is
  'CMS operations summary for tire/rim product readiness counts. Exposed only to authenticated/service roles; underlying access remains subject to security_invoker behavior.';

comment on view public.catalog_sync_health_summary_v1 is
  'CMS operations summary for tire/rim raw, selected, publish, and stale-job health. Exposed only to authenticated/service roles; underlying access remains subject to security_invoker behavior.';
