-- Phase 4: schedule clean raw rim supplier syncs.
-- Runs after tire raw syncs and before any future selected-rim/webshop publish jobs.

select cron.unschedule('catalog_raw_rd_rims_p1_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_rims_p1_daily'
);

select cron.unschedule('catalog_raw_rd_rims_p2_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_rims_p2_daily'
);

select cron.unschedule('catalog_raw_rd_rims_p3_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_rims_p3_daily'
);

select cron.unschedule('catalog_raw_rd_rims_p4_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_rims_p4_daily'
);

select cron.unschedule('catalog_raw_rd_rims_p5_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_rd_rims_p5_daily'
);

select cron.unschedule('catalog_raw_vt_rims_daily')
where exists (
  select 1
  from cron.job
  where jobname = 'catalog_raw_vt_rims_daily'
);

select cron.schedule(
  'catalog_raw_rd_rims_p1_daily',
  '20 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_rims?page=1&page_size=10000',
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
  'catalog_raw_rd_rims_p2_daily',
  '25 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_rims?page=2&page_size=10000',
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
  'catalog_raw_rd_rims_p3_daily',
  '30 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_rims?page=3&page_size=10000',
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
  'catalog_raw_rd_rims_p4_daily',
  '35 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_rims?page=4&page_size=10000',
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
  'catalog_raw_rd_rims_p5_daily',
  '40 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_rd_rims?page=5&page_size=10000&finalize=true',
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

select cron.schedule(
  'catalog_raw_vt_rims_daily',
  '50 1 * * *',
  $$
  select net.http_post(
    url := 'https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/catalog_sync_raw_vt_rims',
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
