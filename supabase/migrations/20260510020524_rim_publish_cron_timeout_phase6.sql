-- Phase 6: rim publish cron may exceed the default statement timeout for 42k+ rims.

set lock_timeout = '5s';
set statement_timeout = '60s';

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
    perform set_config('statement_timeout', '0', true);
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
