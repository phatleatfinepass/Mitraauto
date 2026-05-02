-- Keep webshop_items fresh after the nightly raw ingest and selected tire rebuild.
-- The old 10-minute full refresh was removed because it used the non-batched path.
-- This cron uses the same admin-gated batched sync functions that the CMS "Apply sync"
-- button uses, so it avoids statement timeouts and finalizes only after all batches run.

select cron.unschedule('webshop_tire_items_after_selected_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'webshop_tire_items_after_selected_daily'
);

select cron.schedule(
  'webshop_tire_items_after_selected_daily',
  '15 1 * * *',
  $cron$
  do $sync$
  declare
    v_start jsonb;
    v_batch jsonb;
    v_run_id uuid;
    v_has_more boolean;
  begin
    perform set_config('request.jwt.claim.sub', '03c304c1-383d-461a-8f70-8790843df0f2', true);
    perform public.catalog_apply_rd_external_stock_v1();

    v_start := public.start_webshop_tire_items_sync_v1();
    v_run_id := (v_start->>'run_id')::uuid;
    v_has_more := coalesce((v_start->>'has_more')::boolean, false);

    while v_has_more loop
      v_batch := public.refresh_webshop_tire_items_batch_v1(v_run_id, 1000);
      v_has_more := coalesce((v_batch->>'has_more')::boolean, false);
    end loop;

    perform public.finalize_webshop_tire_items_sync_v1(v_run_id);
  end;
  $sync$;
  $cron$
);
