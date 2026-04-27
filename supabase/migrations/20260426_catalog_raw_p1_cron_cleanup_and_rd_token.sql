-- Make the P1 catalog cron list explicit and non-confusing.
-- Keep only clean raw supplier refresh jobs, and refresh RD token before RD pages.

select cron.unschedule('vt_sync_tires_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'vt_sync_tires_daily'
);

select cron.unschedule('vt_sync_rims_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'vt_sync_rims_daily'
);

select cron.unschedule('catalog_raw_rd_token_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_token_daily'
);

select cron.schedule(
  'catalog_raw_rd_token_daily',
  '10 0 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/refresh_rd_token_db',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);
