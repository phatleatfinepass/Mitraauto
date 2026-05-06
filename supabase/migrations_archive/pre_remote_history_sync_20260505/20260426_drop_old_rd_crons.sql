-- Remove old RD cron jobs that wrote into the legacy raw/import path.
-- Keep the new P1 clean raw RD refresh jobs:
--   catalog_raw_rd_tires_p1_daily
--   catalog_raw_rd_tires_p2_daily
--   catalog_raw_rd_tires_p3_daily

select cron.unschedule('catalog_sync_rd_tires_p2')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_sync_rd_tires_p2'
);

select cron.unschedule('catalog_sync_rd_tires_p3')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_sync_rd_tires_p3'
);

select cron.unschedule('catalog_sync_rd_tires_p3_retry')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_sync_rd_tires_p3_retry'
);
