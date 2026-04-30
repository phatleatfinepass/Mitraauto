-- Manual CMS Apply Sync now uses cursor-batched refresh_webshop_tire_items_batch_v1.
-- Disable the old automatic full refresh so it cannot overlap with admin bulk edits
-- or trigger statement timeouts from the old non-batched refresh path.

select cron.unschedule('webshop_refresh_tire_items_10min')
where exists (
  select 1
  from cron.job
  where jobname = 'webshop_refresh_tire_items_10min'
);
