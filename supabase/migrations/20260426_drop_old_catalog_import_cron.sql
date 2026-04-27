-- Remove the old all-in-one catalog import cron.
-- It timed out and is replaced by the smaller P1 raw refresh jobs.

select cron.unschedule('catalog_import_all_suppliers')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_import_all_suppliers'
);
