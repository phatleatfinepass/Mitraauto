-- Phase 6: schedule selected-rim/webshop publish and add explicit freshness health policy.

set lock_timeout = '5s';
set statement_timeout = '120s';

create or replace function public.catalog_rim_lifecycle_health_v1()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with policy as (
    select
      interval '36 hours' as raw_max_age,
      interval '36 hours' as selected_max_age,
      interval '36 hours' as webshop_max_age
  ),
  raw_runs as (
    select distinct on (supplier_code)
      supplier_code,
      status,
      started_at,
      finished_at,
      expected_total,
      fetched_total,
      upserted_total,
      marked_unavailable_total,
      error_count,
      error
    from public.supplier_raw_rim_sync_runs
    where product_type = 'rim'
    order by supplier_code, started_at desc
  ),
  raw_rows as (
    select
      'RD'::text as supplier_code,
      count(*) filter (where is_available) as available_rows,
      max(last_seen_at) as latest_seen_at
    from public.supplier_raw_rd_rims
    union all
    select
      'VT'::text as supplier_code,
      count(*) filter (where is_available) as available_rows,
      max(last_seen_at) as latest_seen_at
    from public.supplier_raw_vt_rims
  ),
  raw_health as (
    select
      rr.supplier_code,
      run.status,
      run.started_at,
      run.finished_at,
      rr.latest_seen_at,
      rr.available_rows,
      run.expected_total,
      run.fetched_total,
      run.upserted_total,
      run.marked_unavailable_total,
      run.error_count,
      run.error,
      case
        when run.status = 'success'
          and rr.available_rows > 0
          and rr.latest_seen_at >= now() - (select raw_max_age from policy)
          then 'healthy'
        when run.status = 'success'
          and rr.available_rows > 0
          then 'degraded'
        else 'unhealthy'
      end as health_status,
      array_remove(array[
        case when coalesce(run.status, '') <> 'success' then 'latest_raw_run_not_success' end,
        case when coalesce(rr.available_rows, 0) = 0 then 'no_available_raw_rows' end,
        case when rr.latest_seen_at is null or rr.latest_seen_at < now() - (select raw_max_age from policy) then 'raw_data_stale' end
      ]::text[], null) as health_reasons
    from raw_rows rr
    left join raw_runs run using (supplier_code)
  ),
  selected_run as (
    select
      status,
      started_at,
      finished_at,
      selected_count,
      marked_unavailable_count,
      error
    from public.catalog_selected_item_runs
    where product_type = 'rim'
    order by started_at desc
    limit 1
  ),
  selected_counts as (
    select
      count(*) filter (where is_available) as available_selected,
      max(last_selected_at) as latest_selected_at
    from public.catalog_selected_items
    where product_type = 'rim'
  ),
  raw_rollup as (
    select
      bool_and(health_status = 'healthy') as raw_healthy,
      max(latest_seen_at) as latest_raw_seen_at
    from raw_health
  ),
  selected_health as (
    select
      sr.status,
      sr.started_at,
      sr.finished_at,
      sc.latest_selected_at,
      sc.available_selected,
      sr.selected_count,
      sr.marked_unavailable_count,
      sr.error,
      case
        when sr.status = 'success'
          and sc.available_selected > 0
          and sc.latest_selected_at >= now() - (select selected_max_age from policy)
          and (select latest_raw_seen_at from raw_rollup) is not null
          and sc.latest_selected_at >= (select latest_raw_seen_at from raw_rollup)
          then 'healthy'
        when sr.status = 'success'
          and sc.available_selected > 0
          and sc.latest_selected_at >= now() - (select selected_max_age from policy)
          then 'degraded'
        else 'unhealthy'
      end as health_status,
      array_remove(array[
        case when coalesce(sr.status, '') <> 'success' then 'latest_selected_run_not_success' end,
        case when coalesce(sc.available_selected, 0) = 0 then 'no_available_selected_rows' end,
        case when sc.latest_selected_at is null or sc.latest_selected_at < now() - (select selected_max_age from policy) then 'selected_data_stale' end,
        case when (select latest_raw_seen_at from raw_rollup) is not null and sc.latest_selected_at < (select latest_raw_seen_at from raw_rollup) then 'selected_older_than_latest_raw' end
      ]::text[], null) as health_reasons
    from selected_counts sc
    left join selected_run sr on true
  ),
  latest_publish_run as (
    select *
    from public.webshop_rim_sync_runs
    order by started_at desc
    limit 1
  ),
  webshop_counts as (
    select
      count(*) as total,
      count(*) filter (where is_visible and publish_status = 'published') as published,
      count(*) filter (where publish_status = 'hidden') as hidden,
      count(*) filter (where publish_status = 'blocked') as blocked,
      count(*) filter (where publish_block_reason = 'manual_not_sellable') as manual_not_sellable,
      count(*) filter (where is_visible and publish_status = 'published' and hero_image_url is not null) as published_with_image,
      max(refreshed_at) as latest_published_at
    from public.webshop_items
    where product_type = 'rim'
  ),
  webshop_health as (
    select
      wc.*,
      pr.id as latest_run_id,
      pr.status as latest_run_status,
      pr.total_items as latest_run_total,
      pr.processed_items as latest_run_processed,
      pr.inserted_items as latest_run_inserted,
      pr.updated_items as latest_run_updated,
      pr.skipped_incomplete_items as latest_run_skipped_incomplete,
      pr.failed_items as latest_run_failed,
      pr.started_at as latest_run_started_at,
      pr.finished_at as latest_run_finished_at,
      pr.error_message as latest_run_error,
      case
        when wc.published > 0
          and wc.latest_published_at >= now() - (select webshop_max_age from policy)
          and (pr.id is null or pr.status = 'completed')
          and (select latest_selected_at from selected_health) is not null
          and wc.latest_published_at >= (select latest_selected_at from selected_health)
          then 'healthy'
        when wc.published > 0
          and wc.latest_published_at >= now() - (select webshop_max_age from policy)
          then 'degraded'
        else 'unhealthy'
      end as health_status,
      array_remove(array[
        case when wc.published = 0 then 'no_published_webshop_rows' end,
        case when wc.latest_published_at is null or wc.latest_published_at < now() - (select webshop_max_age from policy) then 'webshop_publish_stale' end,
        case when pr.id is not null and pr.status <> 'completed' then 'latest_publish_run_not_completed' end,
        case when (select latest_selected_at from selected_health) is not null and wc.latest_published_at < (select latest_selected_at from selected_health) then 'webshop_older_than_selected' end
      ]::text[], null) as health_reasons
    from webshop_counts wc
    left join latest_publish_run pr on true
  ),
  overall as (
    select
      case
        when (select bool_and(health_status = 'healthy') from raw_health)
          and (select health_status = 'healthy' from selected_health)
          and (select health_status = 'healthy' from webshop_health)
          then 'healthy'
        when (select bool_and(health_status in ('healthy', 'degraded')) from raw_health)
          and (select health_status in ('healthy', 'degraded') from selected_health)
          and (select health_status in ('healthy', 'degraded') from webshop_health)
          then 'degraded'
        else 'unhealthy'
      end as health_status
  )
  select jsonb_build_object(
    'overall_status', (select health_status from overall),
    'policy', jsonb_build_object(
      'raw_max_age_hours', extract(epoch from (select raw_max_age from policy)) / 3600,
      'selected_max_age_hours', extract(epoch from (select selected_max_age from policy)) / 3600,
      'webshop_max_age_hours', extract(epoch from (select webshop_max_age from policy)) / 3600,
      'selected_must_be_newer_than_raw', true,
      'webshop_must_be_newer_than_selected', true
    ),
    'raw', (
      select jsonb_object_agg(
        supplier_code,
        jsonb_build_object(
          'health_status', health_status,
          'health_reasons', to_jsonb(health_reasons),
          'latest_run_status', status,
          'latest_run_started_at', started_at,
          'latest_run_finished_at', finished_at,
          'latest_seen_at', latest_seen_at,
          'available_rows', available_rows,
          'expected_total', expected_total,
          'fetched_total', fetched_total,
          'upserted_total', upserted_total,
          'marked_unavailable_total', marked_unavailable_total,
          'error_count', error_count,
          'error', error
        )
      )
      from raw_health
    ),
    'selected', (
      select jsonb_build_object(
        'health_status', health_status,
        'health_reasons', to_jsonb(health_reasons),
        'latest_run_status', status,
        'latest_run_started_at', started_at,
        'latest_run_finished_at', finished_at,
        'latest_selected_at', latest_selected_at,
        'available_selected', available_selected,
        'selected_count', selected_count,
        'marked_unavailable_count', marked_unavailable_count,
        'error', error
      )
      from selected_health
    ),
    'webshop', (
      select jsonb_build_object(
        'health_status', health_status,
        'health_reasons', to_jsonb(health_reasons),
        'total', total,
        'published', published,
        'hidden', hidden,
        'blocked', blocked,
        'manual_not_sellable', manual_not_sellable,
        'published_with_image', published_with_image,
        'latest_published_at', latest_published_at,
        'latest_run_id', latest_run_id,
        'latest_run_status', latest_run_status,
        'latest_run_total', latest_run_total,
        'latest_run_processed', latest_run_processed,
        'latest_run_inserted', latest_run_inserted,
        'latest_run_updated', latest_run_updated,
        'latest_run_skipped_incomplete', latest_run_skipped_incomplete,
        'latest_run_failed', latest_run_failed,
        'latest_run_started_at', latest_run_started_at,
        'latest_run_finished_at', latest_run_finished_at,
        'latest_run_error', latest_run_error
      )
      from webshop_health
    )
  );
$$;

revoke all on function public.catalog_rim_lifecycle_health_v1() from public;
grant execute on function public.catalog_rim_lifecycle_health_v1() to authenticated, service_role;

select cron.unschedule('catalog_selected_rims_after_raw_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_selected_rims_after_raw_daily'
);

select cron.schedule(
  'catalog_selected_rims_after_raw_daily',
  '5 2 * * *',
  $$
  select public.catalog_rebuild_selected_rims_v1();
  $$
);

select cron.unschedule('webshop_rim_items_after_selected_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'webshop_rim_items_after_selected_daily'
);

select cron.schedule(
  'webshop_rim_items_after_selected_daily',
  '15 2 * * *',
  $cron$
  do $sync$
  declare
    v_start jsonb;
    v_batch jsonb;
    v_run_id uuid;
    v_has_more boolean;
  begin
    perform set_config('request.jwt.claim.sub', '03c304c1-383d-461a-8f70-8790843df0f2', true);

    v_start := public.start_webshop_rim_items_sync_v1();
    v_run_id := (v_start->>'run_id')::uuid;
    v_has_more := coalesce((v_start->>'has_more')::boolean, false);

    while v_has_more loop
      v_batch := public.refresh_webshop_rim_items_batch_v1(v_run_id, 1000);
      v_has_more := coalesce((v_batch->>'has_more')::boolean, false);
    end loop;

    perform public.finalize_webshop_rim_items_sync_v1(v_run_id);
  end;
  $sync$;
  $cron$
);
