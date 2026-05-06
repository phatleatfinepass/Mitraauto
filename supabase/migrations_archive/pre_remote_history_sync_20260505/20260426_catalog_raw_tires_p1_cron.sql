-- P1 catalog rebuild cron: refresh clean raw tire tables only.
-- This intentionally does not run selected-item, CMS, or webshop publishing work.

select cron.unschedule('catalog_raw_rd_tires_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_tires_daily'
);

select cron.unschedule('catalog_raw_rd_tires_p1_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_tires_p1_daily'
);

select cron.unschedule('catalog_raw_rd_tires_p2_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_tires_p2_daily'
);

select cron.unschedule('catalog_raw_rd_tires_p3_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_tires_p3_daily'
);

select cron.unschedule('catalog_raw_vt_tires_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_vt_tires_daily'
);

select cron.schedule(
  'catalog_raw_rd_tires_p1_daily',
  '20 0 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_tires?page=1&page_size=10000',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);

select cron.schedule(
  'catalog_raw_rd_tires_p2_daily',
  '25 0 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_tires?page=2&page_size=10000',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);

select cron.schedule(
  'catalog_raw_rd_tires_p3_daily',
  '30 0 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_tires?page=3&page_size=10000&finalize=true',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbW1id2RlYm5taWNyd2VvaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5NTQsImV4cCI6MjA3NTUxNzk1NH0.pRp2w18uYHhs99gNCU1sf1GOaFtRzdJqa63Z4aDukhg'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  );
  $$
);

select cron.schedule(
  'catalog_raw_vt_tires_daily',
  '50 0 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_vt_tires',
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
