-- Operational views and conservative cron for selected tire supplier image fetches.
-- RD image API limit is 400/min and 4000/hour. This schedule uses 100 every
-- 3 minutes = 2000/hour, leaving a large supplier-side safety margin.

create or replace view public.catalog_selected_item_image_fetch_status as
select
  i.id as image_candidate_id,
  i.selected_item_id,
  s.match_key,
  s.ean,
  s.eprel_code,
  s.brand,
  s.model,
  s.size_string,
  i.product_type,
  i.source_supplier,
  i.source_external_id,
  i.source_image_id,
  i.source_url,
  i.source_key,
  i.storage_bucket,
  i.storage_path,
  i.public_url,
  i.is_primary_candidate,
  i.is_active,
  i.status,
  case
    when not i.is_active then 'inactive'
    when i.status = 'stored' then 'stored'
    when i.status in ('pending_source_fetch', 'external_ready') then 'queued'
    when i.status = 'fetching' then 'fetching'
    when i.status = 'failed' and i.fetch_attempts < 5 then 'retryable_failed'
    when i.status = 'failed' then 'terminal_failed'
    when i.status = 'skipped' and i.error is not null then 'terminal_failed'
    when i.status = 'skipped' then 'skipped'
    else i.status
  end as fetch_state,
  i.status in ('failed', 'skipped') and i.error is not null as fetch_failed,
  (
    i.status = 'failed'
    or (i.status = 'skipped' and i.error is not null)
  ) and i.fetch_attempts >= 5 as terminal_failed,
  i.status = 'failed' and i.fetch_attempts < 5 as retryable_failed,
  i.fetch_attempts,
  i.last_fetch_at,
  i.fetched_at,
  i.content_type,
  i.byte_size,
  i.checksum,
  i.error,
  i.error->>'where' as error_where,
  i.error->>'message' as error_message,
  nullif(i.error->>'status', '')::integer as error_http_status,
  i.last_seen_at,
  i.created_at,
  i.updated_at
from public.catalog_selected_item_images i
join public.catalog_selected_items s
  on s.id = i.selected_item_id;

create or replace view public.catalog_selected_item_image_update_queue as
select
  *,
  case
    when status in ('pending_source_fetch', 'external_ready') then 'new_or_changed_source'
    when status = 'failed' and fetch_attempts < 5 then 'retry_failed_fetch'
    else null
  end as queue_reason
from public.catalog_selected_item_image_fetch_status
where is_active
  and status in ('pending_source_fetch', 'external_ready', 'failed')
  and fetch_attempts < 5;

create or replace view public.catalog_selected_tire_image_failed_fetches as
select *
from public.catalog_selected_item_image_fetch_status
where product_type = 'tire'
  and is_active
  and fetch_failed
order by
  terminal_failed desc,
  retryable_failed desc,
  last_fetch_at desc nulls last,
  brand,
  model,
  size_string;

create or replace view public.catalog_selected_tire_image_fetch_summary as
select
  count(*) filter (where product_type = 'tire' and source_supplier = 'RD' and is_active) as rd_active_total,
  count(*) filter (where product_type = 'tire' and source_supplier = 'RD' and is_active and status = 'stored') as rd_stored,
  count(*) filter (where product_type = 'tire' and source_supplier = 'RD' and is_active and status in ('pending_source_fetch', 'external_ready')) as rd_queued,
  count(*) filter (where product_type = 'tire' and source_supplier = 'RD' and is_active and status = 'failed' and fetch_attempts < 5) as rd_retryable_failed,
  count(*) filter (where product_type = 'tire' and source_supplier = 'RD' and is_active and fetch_failed and fetch_attempts >= 5) as rd_terminal_failed,
  count(*) filter (where product_type = 'tire' and source_supplier = 'VT' and is_active) as vt_active_total,
  count(*) filter (where product_type = 'tire' and source_supplier = 'VT' and is_active and status = 'stored') as vt_stored,
  count(*) filter (where product_type = 'tire' and source_supplier = 'VT' and is_active and status in ('pending_source_fetch', 'external_ready')) as vt_queued,
  count(*) filter (where product_type = 'tire' and source_supplier = 'VT' and is_active and status = 'failed' and fetch_attempts < 5) as vt_retryable_failed,
  count(*) filter (where product_type = 'tire' and source_supplier = 'VT' and is_active and fetch_failed and fetch_attempts >= 5) as vt_terminal_failed
from public.catalog_selected_item_image_fetch_status;

grant select on public.catalog_selected_item_image_fetch_status to authenticated, service_role;
grant select on public.catalog_selected_item_image_update_queue to authenticated, service_role;
grant select on public.catalog_selected_tire_image_failed_fetches to authenticated, service_role;
grant select on public.catalog_selected_tire_image_fetch_summary to authenticated, service_role;

select cron.unschedule('catalog_fetch_rd_tire_images_100_3min')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_fetch_rd_tire_images_100_3min'
);

select cron.schedule(
  'catalog_fetch_rd_tire_images_100_3min',
  '*/3 * * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_fetch_selected_tire_images?supplier=RD&limit=100',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);

select cron.unschedule('catalog_fetch_vt_tire_images_100_3min')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_fetch_vt_tire_images_100_3min'
);

select cron.schedule(
  'catalog_fetch_vt_tire_images_100_3min',
  '1-59/3 * * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_fetch_selected_tire_images?supplier=VT&limit=100',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);
