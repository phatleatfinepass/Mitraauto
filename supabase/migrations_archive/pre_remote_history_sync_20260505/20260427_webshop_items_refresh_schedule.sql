-- Keep the tire publish table close to CMS, selected catalog, and image changes.
-- The job is intentionally small: it only rebuilds webshop_items from already
-- normalized selected/catalog data.

select cron.unschedule('webshop_refresh_tire_items_10min')
where exists (
  select 1
  from cron.job
  where jobname = 'webshop_refresh_tire_items_10min'
);

select cron.schedule(
  'webshop_refresh_tire_items_10min',
  '2-59/10 * * * *',
  $$
  select public.refresh_webshop_tire_items_v1();
  $$
);
